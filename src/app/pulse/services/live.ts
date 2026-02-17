
import { createBlob, decode, decodeAudioData } from '../utils/audioUtils';
import { genieToolingService } from './genie-tooling';
import { getGoogleGenAIClient, hasGeminiKey } from '@/lib/ai-providers';

interface LiveCallbacks {
  onToolCall: (name: string, args: any) => void;
  onAudioActivity: (active: boolean) => void;
  onError: (error: Error) => void;
  onTranscription: (text: string, role: 'user' | 'model') => void;
}

export class LiveGenieService {
  private ai: any = null;
  private session: any = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private outputNode: GainNode | null = null;
  private nextStartTime = 0;
  private audioSources = new Set<AudioBufferSourceNode>();
  private isConnected = false;
  private isPaused = false;

  private async initialize() {
    if (this.ai) return this.ai;
    
    if (!hasGeminiKey()) return null;
    
    this.ai = await getGoogleGenAIClient();
    return this.ai;
  }

  async connect(callbacks: LiveCallbacks) {
    if (this.isConnected) return;
    this.isPaused = false;

    await this.initialize();
    if (!this.ai) {
      callbacks.onError(new Error('Gemini API key not configured'));
      return;
    }

    try {
      // Force 16kHz sample rate for input to match the model's expectation
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.inputAudioContext = new AudioContextClass({ sampleRate: 16000 });
      this.outputAudioContext = new AudioContextClass({ sampleRate: 24000 });
      this.outputNode = this.outputAudioContext.createGain();
      this.outputNode.connect(this.outputAudioContext.destination);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      console.log("Starting Live Connection...");

      const toolingConfig = genieToolingService.getConfig();

      // Ensure Modality is passed correctly as a string to avoid enum issues
      const responseModality = 'AUDIO' as any;

      const sessionPromise = this.ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            console.log("Live Session Opened");
            this.isConnected = true;
            this.startAudioInput(stream, sessionPromise);
            callbacks.onAudioActivity(true);
          },
          onmessage: async (message: any) => {
            if (!this.isConnected) return;

            // Handle Tool Calls
            if (message.toolCall?.functionCalls) {
              const responses = await genieToolingService.processToolCalls(
                message.toolCall.functionCalls,
                callbacks.onToolCall
              );

              sessionPromise.then((session: any) => {
                if (!this.isConnected) return;

                // Send responses individually to match prompt example and avoid potential batching issues
                responses.forEach((r: any) => {
                  session.sendToolResponse({
                    functionResponses: [r.functionResponse]
                  });
                });
              });
            }

            // Handle Transcripts
            if (message.serverContent?.modelTurn?.parts) {
              for (const part of message.serverContent.modelTurn.parts) {
                if (part.text) {
                  callbacks.onTranscription(part.text, 'model');
                }
              }
            }

            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              if (this.outputAudioContext && this.outputNode && !this.isPaused) {
                this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
                const audioBuffer = await decodeAudioData(
                  decode(base64Audio),
                  this.outputAudioContext,
                  24000,
                  1
                );

                const source = this.outputAudioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(this.outputNode);
                source.addEventListener('ended', () => {
                  this.audioSources.delete(source);
                });

                source.start(this.nextStartTime);
                this.nextStartTime += audioBuffer.duration;
                this.audioSources.add(source);
              }
            }

            // Handle Interruptions
            if (message.serverContent?.interrupted) {
              this.stopAudioOutput();
              this.nextStartTime = 0;
            }
          },
          onclose: () => {
            console.log("Live Session Closed");
            this.isConnected = false;
            this.disconnect();
          },
          onerror: (err: any) => {
            console.error("Live Session Error", err);
            this.isConnected = false;
            callbacks.onError(err);
            this.disconnect();
          }
        },
        config: {
          responseModalities: [responseModality],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          // CORRECTED: Restoring the Content object wrapper for systemInstruction
          systemInstruction: { parts: [{ text: toolingConfig.systemInstruction }] },
          tools: toolingConfig.tools,
        },
      });

      this.session = sessionPromise;

    } catch (error: any) {
      console.error("Failed to connect live", error);
      callbacks.onError(error);
      this.disconnect();
    }
  }

  private startAudioInput(stream: MediaStream, sessionPromise: Promise<any>) {
    if (!this.inputAudioContext) return;

    this.inputSource = this.inputAudioContext.createMediaStreamSource(stream);
    this.scriptProcessor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

    this.scriptProcessor.onaudioprocess = (e) => {
      if (!this.isConnected || this.isPaused) return; // Critical check to prevent sending after close or when paused

      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBlob = createBlob(inputData);

      sessionPromise.then((session: any) => {
        if (this.isConnected && !this.isPaused) {
          session.sendRealtimeInput({ media: pcmBlob });
        }
      }).catch((err) => {
        console.error("Error sending audio frame:", err);
      });
    };

    this.inputSource.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.inputAudioContext.destination);
  }

  private stopAudioOutput() {
    for (const source of this.audioSources) {
      try { source.stop(); } catch (e) { }
    }
    this.audioSources.clear();
  }

  pause() {
    this.isPaused = true;
    this.stopAudioOutput();
  }

  resume() {
    this.isPaused = false;
  }

  disconnect() {
    this.isConnected = false; // Immediate flag flip
    this.isPaused = false;

    if (this.session) {
      this.session.then((s: any) => {
        try { s.close(); } catch (e) { console.warn("Session close error", e); }
      });
      this.session = null;
    }

    if (this.inputSource) {
      try { this.inputSource.disconnect(); } catch (e) { }
    }
    if (this.scriptProcessor) {
      try { this.scriptProcessor.disconnect(); } catch (e) { }
    }

    // Allow contexts to close gracefully
    if (this.inputAudioContext && this.inputAudioContext.state !== 'closed') {
      this.inputAudioContext.close();
    }
    if (this.outputAudioContext && this.outputAudioContext.state !== 'closed') {
      this.outputAudioContext.close();
    }

    this.inputSource = null;
    this.scriptProcessor = null;
    this.inputAudioContext = null;
    this.outputAudioContext = null;
    this.nextStartTime = 0;
  }
}

export const liveGenieService = new LiveGenieService();
