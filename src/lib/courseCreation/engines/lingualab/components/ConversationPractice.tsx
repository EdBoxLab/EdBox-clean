import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { 
  Mic, MicOff, Volume2, Globe,
  Download, FileText, Sparkles, BookOpen, History, 
  Lightbulb, Trash2, MessageSquare, ChevronLeft, PanelLeft, Gamepad2, X
} from 'lucide-react';

// --- Audio Processing Helpers ---

interface AudioData {
  data: string;
  mimeType: string;
}

const createBlob = (data: Float32Array): AudioData => {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  let binary = '';
  const bytes = new Uint8Array(int16.buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  return {
    data: base64,
    mimeType: 'audio/pcm;rate=16000',
  };
};

const decodeAudioData = async (
  base64: string,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number
): Promise<AudioBuffer> => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const dataInt16 = new Int16Array(bytes.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
};

// --- Types ---

interface ChatEntry {
  speaker: 'user' | 'ai';
  text: string;
  timestamp: number;
}

interface SavedSession {
  id: string;
  date: number;
  language: string;
  mode: 'conversation' | 'lesson' | 'game';
  transcripts: ChatEntry[];
}

// --- Component ---

export const ConversationPractice: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [language, setLanguage] = useState('Spanish');
  const [mode, setMode] = useState<'conversation' | 'lesson' | 'game'>('conversation');
  const [transcripts, setTranscripts] = useState<ChatEntry[]>([]);
  const [sessionId, setSessionId] = useState<string>(() => Date.now().toString());
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  const [culturalTip, setCulturalTip] = useState<string | null>(null);
  
  // Responsive Sidebar State
  // On Desktop: controls width. On Mobile: controls visibility of overlay
  const [isHistoryOpen, setIsHistoryOpen] = useState(false); 
  
  // UI State for streaming text
  const [streamInput, setStreamInput] = useState('');
  const [streamOutput, setStreamOutput] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  // Refs for audio logic
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  // Text Accumulation Refs
  const currentInputRef = useRef('');
  const currentOutputRef = useRef('');

  // --- Effects ---

  // Default sidebar open on large screens
  useEffect(() => {
    if (window.innerWidth > 1024) {
        setIsHistoryOpen(true);
    }
  }, []);

  // Load Sessions
  useEffect(() => {
    const saved = localStorage.getItem('lingualab_sessions');
    if (saved) {
      try {
        setSavedSessions(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load sessions", e);
      }
    }
    fetchCulturalTip(language);
  }, []);

  // Save Session
  useEffect(() => {
    if (transcripts.length > 0) {
      const sessionData: SavedSession = {
        id: sessionId,
        date: Date.now(),
        language,
        mode,
        transcripts
      };
      
      setSavedSessions(prev => {
        const others = prev.filter(s => s.id !== sessionId);
        const updated = [sessionData, ...others].sort((a, b) => b.date - a.date);
        localStorage.setItem('lingualab_sessions', JSON.stringify(updated));
        return updated;
      });
    }
  }, [transcripts, sessionId, language, mode]);

  // Scroll to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts, streamInput, streamOutput]);

  // Fetch Tip
  useEffect(() => {
     fetchCulturalTip(language);
  }, [language]);

  // Visualizer
  useEffect(() => {
    let animationFrameId: number;
    const draw = () => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Handle High DPI / Resize
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      // Check if size changed to avoid heavy re-allocation
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
      }

      const width = rect.width;
      const height = rect.height;
      
      ctx.clearRect(0, 0, width, height);

      if (isActive && analyserRef.current) {
        const analyser = analyserRef.current;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        const barWidth = (width / bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * height; // Normalize to height
          
          // Gradient based on mode
          const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
          if (mode === 'game') {
            gradient.addColorStop(0, '#9333ea'); // Purple 600
            gradient.addColorStop(1, '#d8b4fe'); // Purple 300
          } else if (mode === 'lesson') {
            gradient.addColorStop(0, '#059669'); // Emerald 600
            gradient.addColorStop(1, '#6ee7b7'); // Emerald 300
          } else {
            gradient.addColorStop(0, '#2563eb'); // Blue 600
            gradient.addColorStop(1, '#93c5fd'); // Blue 300
          }

          ctx.fillStyle = gradient;
          ctx.fillRect(x, height - barHeight, barWidth, barHeight);
          x += barWidth + 1;
        }
      } else {
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      animationFrameId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isActive, mode]);

  // --- Logic ---

  const fetchCulturalTip = async (lang: string) => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY});
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a fascinating, concise cultural fact or language learning tip for a student learning ${lang}. Keep it under 25 words. Do not use markdown.`,
        });
        setCulturalTip(response.text || "Learning a new language opens new worlds.");
    } catch (e) {
        setCulturalTip("Practice makes perfect!");
    }
  };

  const loadOldSession = (session: SavedSession) => {
    if (isActive) stopSession();
    setSessionId(session.id);
    setLanguage(session.language);
    setMode(session.mode);
    setTranscripts(session.transcripts);
    if (window.innerWidth < 1024) setIsHistoryOpen(false); // Auto close drawer on mobile
  };

  const createNewSession = () => {
    if (isActive) stopSession();
    setSessionId(Date.now().toString());
    setTranscripts([]);
    if (window.innerWidth < 1024) setIsHistoryOpen(false);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = savedSessions.filter(s => s.id !== id);
    setSavedSessions(updated);
    localStorage.setItem('lingualab_sessions', JSON.stringify(updated));
    if (sessionId === id) {
        createNewSession();
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      try { sessionRef.current.close && sessionRef.current.close(); } catch(e) {}
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    sourcesRef.current.forEach(source => source.stop());
    sourcesRef.current.clear();
    
    currentInputRef.current = '';
    currentOutputRef.current = '';
    setStreamInput('');
    setStreamOutput('');
    setIsActive(false);
    nextStartTimeRef.current = 0;
  };

  const startSession = async () => {
    if (isActive) return;

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY});
      
      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputAudioContext;

      // Resume Audio Context immediately
      await inputAudioContext.resume();
      await outputAudioContext.resume();

      const analyser = outputAudioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      const outputNode = outputAudioContext.createGain();
      outputNode.connect(analyser);
      analyser.connect(outputAudioContext.destination);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // --- Prompt Engineering ---

      let contextInstruction = "";
      if (transcripts.length > 0) {
        const lastExchanges = transcripts.slice(-6).map(t => `${t.speaker.toUpperCase()}: ${t.text}`).join('\n');
        contextInstruction = `\n\nIMPORTANT: Resuming session. Recent context:\n${lastExchanges}\n\nContinue naturally.`;
      }

      let roleInstruction = "";
      if (mode === 'lesson') {
        roleInstruction = `You are a Language Teacher for ${language}. Structure: 1. Introduce topic. 2. Explain concept. 3. Practice. 4. Correct gently.`;
      } else if (mode === 'game') {
        roleInstruction = `You are a Gamified Language Tutor for ${language}. 
        1. Pick a scenario (e.g. 'Buying a train ticket'). 
        2. Announce "MISSION: [Scenario Name]". 
        3. Play a role. 
        4. After user speaks, give score in brackets like [✅ +10 XP] or [⚠️ Grammar] before replying in character.`;
      } else {
        roleInstruction = `You are a friendly conversation partner for ${language}. Chat naturally.`;
      }

      const finalInstruction = `${roleInstruction}
      CRITICAL:
      - Monitor pronunciation.
      - If mispronounced, show IPA in slashes like /həˈloʊ/.
      ${contextInstruction}`;

      // --- Session Connection ---

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log("Session opened");
            setIsActive(true);

            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(2048, 1, 1);
            
            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                if (!sessionRef.current) return;
                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                const pcmBlob = createBlob(inputData);
                sessionPromise.then((session: any) => {
                    session.sendRealtimeInput({ media: pcmBlob });
                });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (message: any) => {
            // Text
            if (message.serverContent?.outputTranscription) {
                const text = message.serverContent.outputTranscription.text;
                currentOutputRef.current += text;
                setStreamOutput(currentOutputRef.current);
            } else if (message.serverContent?.inputTranscription) {
                const text = message.serverContent.inputTranscription.text;
                currentInputRef.current += text;
                setStreamInput(currentInputRef.current);
            }

            // Turn Complete
            if (message.serverContent?.turnComplete) {
                const userText = currentInputRef.current.trim();
                const aiText = currentOutputRef.current.trim();
                
                if (userText || aiText) {
                    setTranscripts(prev => {
                       const newLogs = [...prev];
                       if (userText) newLogs.push({ speaker: 'user', text: userText, timestamp: Date.now() });
                       if (aiText) newLogs.push({ speaker: 'ai', text: aiText, timestamp: Date.now() });
                       return newLogs;
                    });
                    currentInputRef.current = '';
                    currentOutputRef.current = '';
                    setStreamInput('');
                    setStreamOutput('');
                }
            }

            // Audio
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
                const audioBuffer = await decodeAudioData(base64Audio, outputAudioContext, 24000, 1);
                const source = outputAudioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputNode);
                source.onended = () => { sourcesRef.current.delete(source); };
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
            }

            // Interrupt
            if (message.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => s.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
                currentOutputRef.current = '';
                setStreamOutput('');
            }
          },
          onclose: () => { stopSession(); },
          onerror: (e: any) => { stopSession(); }
        },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            systemInstruction: finalInstruction
        }
      });

      sessionRef.current = await sessionPromise;

    } catch (error) {
      console.error("Failed to start session:", error);
      setIsActive(false);
    }
  };

  const saveTranscriptToFile = () => {
    if (transcripts.length === 0) return;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const content = transcripts
        .map(t => `[${new Date(t.timestamp).toLocaleTimeString()}] ${t.speaker === 'user' ? 'User' : 'AI Tutor'}: ${t.text}`)
        .join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lingualab-${mode}-${language}-${timestamp}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderFormattedText = (text: string) => {
    // Split by IPA slashes OR Square Brackets (Game scoring)
    const parts = text.split(/(\/.*?\/|\[.*?\])/g); 
    return parts.map((part, index) => {
        if (part.startsWith('/') && part.endsWith('/') && part.length > 2) {
            return (
                <span key={index} className="text-yellow-300 bg-yellow-900/30 px-1 mx-0.5 rounded font-mono text-[0.95em] border border-yellow-700/50" title="IPA Pronunciation">
                    {part}
                </span>
            );
        }
        if (part.startsWith('[') && part.endsWith(']')) {
             return (
                <span key={index} className="text-purple-300 font-bold px-1 mx-0.5 animate-pulse">
                    {part}
                </span>
            );
        }
        return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4 relative overflow-hidden">
      
      {/* --- Responsive History Sidebar --- */}
      {/* Mobile: Overlay Backdrop */}
      {isHistoryOpen && (
        <div 
            className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" 
            onClick={() => setIsHistoryOpen(false)}
        ></div>
      )}

      {/* Sidebar Content */}
      <div className={`
          fixed lg:static inset-y-0 left-0 z-50 bg-[#18181c] border-r border-gray-800 
          flex flex-col transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none lg:rounded-lg
          ${isHistoryOpen ? 'w-[85vw] sm:w-80 lg:w-64 translate-x-0' : 'w-[85vw] sm:w-80 lg:w-0 -translate-x-full lg:translate-x-0 lg:opacity-0 lg:border-none lg:p-0 lg:overflow-hidden'}
      `}>
        <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-[#1e1e23] flex-shrink-0">
            <div className="flex items-center gap-2 text-gray-300 font-medium text-sm">
                <History size={16} />
                <span>History</span>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={createNewSession} className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors">
                    <Sparkles size={16} />
                </button>
                 <button onClick={() => setIsHistoryOpen(false)} className="p-1.5 text-gray-500 hover:bg-gray-700/50 rounded transition-colors">
                    {window.innerWidth < 1024 ? <X size={16} /> : <ChevronLeft size={16} />}
                </button>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {savedSessions.map(session => (
                <div 
                    key={session.id}
                    onClick={() => loadOldSession(session)}
                    className={`p-3 rounded cursor-pointer border transition-all group relative ${
                        sessionId === session.id 
                        ? 'bg-gray-800 border-emerald-500/50' 
                        : 'bg-[#25252b] border-gray-700 hover:border-gray-600'
                    }`}
                >
                    <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold text-gray-300">{session.language}</span>
                        <span className="text-[10px] text-gray-500">{new Date(session.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-1">
                        {session.mode === 'lesson' ? <BookOpen size={10} /> : session.mode === 'game' ? <Gamepad2 size={10} /> : <MessageSquare size={10} />}
                        <span className="capitalize">{session.mode}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 truncate">
                        {session.transcripts[session.transcripts.length-1]?.text || "Empty session"}
                    </p>
                    
                    <button 
                        onClick={(e) => deleteSession(e, session.id)}
                        className="absolute right-2 bottom-2 p-1 text-gray-600 hover:text-red-400 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            ))}
        </div>
      </div>

      {/* --- Main Content Area --- */}
      <div className="flex-1 flex flex-col gap-3 min-w-0 h-full">
        
        {/* Config Bar */}
        <div className="bg-[#25252b] border border-gray-700 rounded-lg p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-md flex-shrink-0">
            <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                {/* Toggle Sidebar Button */}
                {!isHistoryOpen && (
                    <button onClick={() => setIsHistoryOpen(true)} className="p-2 bg-[#1e1e23] border border-gray-800 rounded text-gray-400 hover:text-emerald-400 transition-colors flex-shrink-0">
                        <PanelLeft size={16} />
                    </button>
                )}

                {/* Language */}
                <div className="flex items-center gap-2 bg-[#1e1e23] px-3 py-1.5 rounded border border-gray-800 flex-shrink-0">
                    <Globe size={14} className="text-gray-400"/>
                    <select 
                        value={language} 
                        onChange={(e) => setLanguage(e.target.value)}
                        disabled={isActive}
                        className="bg-transparent text-gray-200 text-sm outline-none cursor-pointer w-24 sm:w-auto"
                    >
                        <option value="Spanish">Spanish</option>
                        <option value="French">French</option>
                        <option value="German">German</option>
                        <option value="Japanese">Japanese</option>
                        <option value="Mandarin">Mandarin</option>
                        <option value="English">English</option>
                    </select>
                </div>
                
                {/* Mode */}
                <div className="flex bg-[#1e1e23] rounded p-1 border border-gray-800 gap-1 flex-shrink-0">
                    <button 
                        onClick={() => setMode('conversation')}
                        disabled={isActive}
                        className={`p-1.5 sm:px-3 sm:py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${mode === 'conversation' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        title="Conversation"
                    >
                        <MessageSquare size={14} /> <span className="hidden sm:inline">Talk</span>
                    </button>
                    <button 
                        onClick={() => setMode('lesson')}
                        disabled={isActive}
                        className={`p-1.5 sm:px-3 sm:py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${mode === 'lesson' ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        title="Lesson"
                    >
                        <BookOpen size={14} /> <span className="hidden sm:inline">Lesson</span>
                    </button>
                    <button 
                        onClick={() => setMode('game')}
                        disabled={isActive}
                        className={`p-1.5 sm:px-3 sm:py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${mode === 'game' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        title="Game"
                    >
                        <Gamepad2 size={14} /> <span className="hidden sm:inline">Game</span>
                    </button>
                </div>
            </div>
            
            {/* Tip Card - Hidden on small phones */}
            {culturalTip && (
                <div className="hidden md:flex items-center gap-3 bg-emerald-900/10 border border-emerald-500/20 px-4 py-2 rounded-lg max-w-md">
                    <Lightbulb size={16} className="text-emerald-400 flex-shrink-0" />
                    <p className="text-xs text-emerald-200/80 leading-tight italic truncate max-w-[200px] lg:max-w-xs">
                        "{culturalTip}"
                    </p>
                </div>
            )}
        </div>

        {/* Content Split: Visualizer (Top/Left) & Transcript (Bottom/Right) */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 overflow-hidden">
            
            {/* Visualizer & Controls */}
            <div className="w-full lg:w-1/2 h-[40vh] lg:h-auto flex flex-col gap-3 flex-shrink-0">
                <div className="flex-1 bg-[#18181c] border border-gray-800 rounded-lg relative overflow-hidden flex flex-col shadow-inner">
                    <div className="absolute top-3 left-4 flex items-center gap-2 text-[10px] font-mono text-gray-500 z-10">
                        <Volume2 size={12} />
                        AUDIO SPECTRUM
                    </div>
                    <div className="absolute top-3 right-4 z-10">
                        {isActive && (
                            <div className="flex items-center gap-2 px-2 py-1 bg-red-500/20 rounded-full border border-red-500/30 animate-pulse">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                <span className="text-[10px] font-bold text-red-400 tracking-wider">LIVE</span>
                            </div>
                        )}
                    </div>
                    
                    {/* Overlay for streaming text */}
                    {(streamInput || streamOutput) && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#18181c] via-[#18181c]/90 to-transparent p-4 pt-12 z-20 flex flex-col gap-2">
                             {streamOutput && (
                                 <div className="animate-in slide-in-from-bottom-2">
                                    <span className={`text-[10px] uppercase font-bold block mb-0.5 tracking-wider ${mode === 'game' ? 'text-purple-400' : 'text-blue-500'}`}>
                                        {mode === 'game' ? 'Game Master' : 'Tutor'}
                                    </span>
                                    <div className={`${mode === 'game' ? 'text-purple-100' : 'text-blue-100'} font-medium text-lg leading-tight drop-shadow-md line-clamp-2`}>
                                        {streamOutput}
                                    </div>
                                 </div>
                             )}
                             {streamInput && (
                                 <div className="text-right animate-in slide-in-from-bottom-2">
                                    <span className="text-[10px] text-emerald-500 uppercase font-bold block mb-0.5 tracking-wider">You</span>
                                    <div className="text-emerald-100 font-medium text-lg leading-tight drop-shadow-md line-clamp-2">
                                        {streamInput}
                                    </div>
                                 </div>
                             )}
                        </div>
                    )}

                    <canvas ref={canvasRef} className="w-full h-full opacity-60" />
                    
                    {!isActive && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 pointer-events-none p-4 text-center">
                            <div className={`w-14 h-14 rounded-full bg-[#25252b] flex items-center justify-center mb-3 shadow-lg border border-gray-700 ${mode === 'game' ? 'border-purple-500/30' : ''}`}>
                                {mode === 'game' ? <Gamepad2 size={28} className="text-purple-500" /> : <Mic size={28} className="text-gray-500"/>}
                            </div>
                            <span className="font-mono text-xs tracking-widest opacity-50">
                                {mode === 'game' ? 'PRESS START TO PLAY' : 'READY TO CONNECT'}
                            </span>
                        </div>
                    )}
                </div>
                
                <button 
                    onClick={isActive ? stopSession : startSession}
                    className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg font-bold transition-all text-base md:text-lg shadow-lg flex-shrink-0 ${
                        isActive 
                        ? 'bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500/20' 
                        : mode === 'game'
                        ? 'bg-purple-600 text-white hover:bg-purple-500 shadow-purple-500/20'
                        : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-500/20'
                    }`}
                >
                    {isActive 
                        ? <><MicOff size={18}/> End Session</> 
                        : <>{mode === 'game' ? <Gamepad2 size={18}/> : <Mic size={18}/>} Start {mode === 'lesson' ? 'Lesson' : mode === 'game' ? 'Game' : 'Chat'}</>
                    }
                </button>
            </div>

            {/* Transcript Area */}
            <div className="flex-1 bg-[#25252b] border border-gray-700 rounded-lg flex flex-col shadow-xl overflow-hidden h-full">
                <div className="p-3 border-b border-gray-800 bg-[#1e1e23] flex justify-between items-center flex-shrink-0">
                    <h3 className="font-mono text-xs text-gray-400 uppercase flex items-center gap-2">
                        <FileText size={12} className="text-blue-400" />
                        Transcript
                    </h3>
                    <button onClick={saveTranscriptToFile} disabled={transcripts.length === 0} className="text-gray-500 hover:text-emerald-400 transition-colors">
                        <Download size={16} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4 font-sans bg-[#25252b]">
                    {transcripts.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-600 text-center px-6 gap-3 opacity-50">
                            {mode === 'game' ? <Gamepad2 size={28} /> : <BookOpen size={28} />}
                            <p className="text-xs">Start talking to see transcripts.</p>
                        </div>
                    )}
                    {transcripts.map((t, i) => (
                        <div key={i} className={`flex flex-col ${t.speaker === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-1 duration-300`}>
                            <div className={`text-[10px] font-bold uppercase mb-1 ${
                                t.speaker === 'user' ? 'text-emerald-500' : mode === 'game' ? 'text-purple-400' : 'text-blue-400'
                            }`}>
                                {t.speaker === 'user' ? 'You' : mode === 'lesson' ? 'Teacher' : mode === 'game' ? 'Game Master' : 'Partner'}
                            </div>
                            <div className={`px-3 py-2 md:px-4 md:py-2 rounded-xl max-w-[90%] text-sm leading-relaxed ${
                                t.speaker === 'user' 
                                ? 'bg-emerald-900/10 border border-emerald-500/20 text-gray-200 rounded-tr-none' 
                                : mode === 'game'
                                ? 'bg-purple-900/10 border border-purple-500/20 text-gray-200 rounded-tl-none'
                                : 'bg-blue-900/10 border border-blue-500/20 text-gray-200 rounded-tl-none'
                            }`}>
                                {renderFormattedText(t.text)}
                            </div>
                        </div>
                    ))}
                    <div ref={logsEndRef} />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};