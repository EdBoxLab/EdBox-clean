import React, { useState, useRef, useEffect } from 'react';
import { Card } from './ui/Card';
import { generateFinancialAdvice, generateSpeech, decodeAudioData } from '../services/geminiService';
import { ChatMessage } from '../types';
import { Send, Volume2, VolumeX, Loader2, Mic } from 'lucide-react';

export const AITutor: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'model', text: "Hello, I'm FinLab AI. Ask me about finance concepts, help with a calculation, or request an analysis of a specific topic." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Prepare context from previous messages (last 3)
    const context = messages.slice(-3).map(m => `${m.role}: ${m.text}`).join('\n');
    const responseText = await generateFinancialAdvice(userMsg.text, context);

    const aiMsg: ChatMessage = { 
      id: (Date.now() + 1).toString(), 
      role: 'model', 
      text: responseText 
    };
    
    setMessages(prev => [...prev, aiMsg]);
    setIsLoading(false);
  };

  const playTTS = async (text: string, id: string) => {
    if (isPlaying === id) {
      // Stop if currently playing this one
      audioSourceRef.current?.stop();
      setIsPlaying(null);
      return;
    }
    
    // Stop any existing playback
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
    }

    setIsPlaying(id);

    try {
      // Init Audio Context on user gesture
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const pcmData = await generateSpeech(text);
      
      if (pcmData && audioContextRef.current) {
        const audioBuffer = await decodeAudioData(pcmData, audioContextRef.current, 24000);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => setIsPlaying(null);
        source.start();
        audioSourceRef.current = source;
      } else {
          setIsPlaying(null);
      }
    } catch (err) {
      console.error("Audio Playback Error", err);
      setIsPlaying(null);
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
        <header className="mb-4">
            <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                <Mic className="text-emerald-400" /> AI Tutor
            </h2>
            <p className="text-slate-400">Voice-enabled financial guidance powered by Gemini 2.5.</p>
        </header>

        <Card className="flex-1 flex flex-col overflow-hidden bg-slate-900/50 border-slate-800">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl p-4 ${
                            msg.role === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-slate-800 text-slate-200 border border-slate-700'
                        }`}>
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                            {msg.role === 'model' && (
                                <button 
                                    onClick={() => playTTS(msg.text, msg.id)}
                                    className={`mt-3 flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                                        isPlaying === msg.id 
                                        ? 'bg-emerald-500/20 text-emerald-400' 
                                        : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'
                                    }`}
                                >
                                    {isPlaying === msg.id ? <VolumeX size={14} /> : <Volume2 size={14} />}
                                    {isPlaying === msg.id ? 'Stop' : 'Listen'}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            
            <div className="p-4 border-t border-slate-800 bg-slate-900/80">
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask about ROI, Bonds, or Market trends..."
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        disabled={isLoading}
                    />
                    <button 
                        onClick={handleSend}
                        disabled={isLoading}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                    </button>
                </div>
            </div>
        </Card>
    </div>
  );
};