import React, { useState, useRef } from 'react';
import { analyzeArtwork, generateVoiceGuidance } from '../services/geminiService';
import { decode, decodeAudioData, playAudioBuffer } from '../services/audioUtils';
import { ChatMessage } from '../types';
import { Send, Mic, Volume2, Loader2, Sparkles, X } from 'lucide-react';

interface AIPanelProps {
  getCanvasImage: () => string | null;
  onClose?: () => void;
}

const AIPanel: React.FC<AIPanelProps> = ({ getCanvasImage, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: "Welcome to ArtLab! I'm your AI art tutor. Draw something or upload an image, then ask me to critique it or teach you about a specific style." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    scrollToBottom();

    try {
        // Determine if we need image context
        const imageData = getCanvasImage();
        
        // If message implies looking at art, use vision model
        const isVisualRequest = /look|see|analyze|critique|color|shape|drawing|sketch/i.test(userMsg.text);
        
        let textResponse = "";
        
        if (isVisualRequest && imageData) {
            textResponse = await analyzeArtwork(imageData, userMsg.text);
        } else {
             // Simple text fallback (reusing analyze for now with no image if not needed, or just prompt)
             if (imageData) {
                textResponse = await analyzeArtwork(imageData, userMsg.text);
             } else {
                textResponse = "Please draw something on the canvas first so I can see it!";
             }
        }

        const modelMsg: ChatMessage = { role: 'model', text: textResponse };
        setMessages(prev => [...prev, modelMsg]);
        
        // Auto-generate voice for short responses
        if (textResponse.length < 300) {
            handleSpeak(textResponse);
        }

    } catch (error) {
        setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error connecting to the art neural network." }]);
    } finally {
        setIsLoading(false);
        scrollToBottom();
    }
  };

  const handleSpeak = async (text: string) => {
      try {
        const base64Audio = await generateVoiceGuidance(text);
        if (base64Audio) {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            const rawBytes = decode(base64Audio);
            const audioBuffer = await decodeAudioData(rawBytes, audioContext);
            playAudioBuffer(audioContext, audioBuffer);
        }
      } catch (e) {
          console.error("Audio playback failed", e);
      }
  };

  const handleQuickCritique = async () => {
      const userMsg: ChatMessage = { role: 'user', text: "Critique my artwork professionally." };
      setMessages(prev => [...prev, userMsg]);
      setIsLoading(true);
      scrollToBottom();
      
      const imageData = getCanvasImage();
      if (!imageData) {
          setMessages(prev => [...prev, {role: 'model', text: "Canvas is empty/not ready."}]);
          setIsLoading(false);
          return;
      }

      try {
          const analysis = await analyzeArtwork(imageData, "Analyze this artwork. Focus on composition, color theory, and technique. Be constructive.");
          setMessages(prev => [...prev, { role: 'model', text: analysis }]);
          handleSpeak("Here is my analysis of your work.");
      } catch (e) {
          setMessages(prev => [...prev, { role: 'model', text: "Analysis failed." }]);
      } finally {
          setIsLoading(false);
          scrollToBottom();
      }
  }

  return (
    <div className="w-full md:w-96 bg-art-panel md:border-l border-gray-800 flex flex-col h-full shadow-2xl z-20">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-zinc-900">
        <h2 className="font-bold text-lg flex items-center gap-2 text-white">
          <Sparkles className="text-art-accent" size={20} />
          Gemini Tutor
        </h2>
        {onClose && (
            <button onClick={onClose} className="md:hidden text-gray-400 hover:text-white">
                <X size={24} />
            </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-800/50">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-art-accent text-white rounded-br-none'
                  : 'bg-zinc-700 text-gray-200 rounded-bl-none'
              }`}
            >
              {msg.text}
              {msg.role === 'model' && (
                  <button 
                    onClick={() => handleSpeak(msg.text)}
                    className="block mt-2 text-xs opacity-50 hover:opacity-100 transition-opacity flex items-center gap-1"
                  >
                      <Volume2 size={12} /> Play Voice
                  </button>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                <div className="bg-zinc-700 rounded-2xl p-3 rounded-bl-none">
                    <Loader2 className="animate-spin text-art-accent" size={20} />
                </div>
            </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="p-4 bg-zinc-900 border-t border-gray-800 pb-safe">
        <div className="flex gap-2 mb-3">
            <button 
                onClick={handleQuickCritique}
                disabled={isLoading}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-xs py-2 px-3 rounded-lg border border-gray-700 transition-colors text-art-secondary hover:text-white"
            >
                🎨 Critique
            </button>
             <button 
                onClick={() => {
                    setInput("Give me a creative drawing prompt.");
                    handleSendMessage();
                }}
                disabled={isLoading}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-xs py-2 px-3 rounded-lg border border-gray-700 transition-colors text-art-secondary hover:text-white"
            >
                🎲 Idea
            </button>
        </div>

        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask Gemini..."
            className="w-full bg-zinc-800 border border-gray-700 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-art-accent text-white placeholder-gray-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 p-2 bg-art-accent text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-art-accent transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIPanel;