import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User, X, Zap } from 'lucide-react';
import { ChatMessage } from '../types';
import { generateChemistryResponse } from '../services/geminiService';

interface ChatInterfaceProps {
  contextData: any;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ contextData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: 'Hello! I am ChemLab AI. I can assist you with your experiments, explain concepts, or analyze your data. How can I help?', timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const contextString = contextData ? JSON.stringify(contextData, null, 2) : null;
      const responseText = await generateChemistryResponse(input, contextString);
      
      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeCurrentState = async () => {
    setInput('Analyze the current experiment state.');
    // Trigger send essentially, but we need to do it manually because state update is async
    if (isLoading) return;
    
    const text = "Analyze the current experiment state and identify any interesting patterns or issues.";
    const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        text: text,
        timestamp: Date.now(),
      };
  
      setMessages(prev => [...prev, userMsg]);
      setIsLoading(true);
  
      try {
        const contextString = contextData ? JSON.stringify(contextData, null, 2) : null;
        const responseText = await generateChemistryResponse(text, contextString);
        
        const modelMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: responseText,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, modelMsg]);
      } finally {
        setIsLoading(false);
      }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-500 rounded-full shadow-2xl shadow-blue-900/50 flex items-center justify-center text-white transition-all z-50"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
      </button>

      {/* Chat Window */}
      <div className={`fixed bottom-24 right-6 w-96 h-[600px] bg-slate-900/95 border border-slate-700 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col transition-all transform duration-300 z-40 ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">ChemLab AI</h3>
              <p className="text-xs text-blue-400 flex items-center gap-1">
                 <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                 Gemini 2.5 Active
              </p>
            </div>
          </div>
          <button 
            onClick={analyzeCurrentState}
            disabled={isLoading}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 px-2 py-1 rounded flex items-center gap-1 transition"
            title="Send current experiment data to AI"
          >
            <Zap className="w-3 h-3" /> Analyze
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-slate-700' : 'bg-blue-900/50'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-slate-300" /> : <Bot className="w-4 h-4 text-blue-400" />}
              </div>
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
              }`}>
                {/* Basic Markdown rendering (could use a library, but keeping it simple for this output) */}
                {msg.text.split('\n').map((line, i) => (
                  <p key={i} className="min-h-[1em] mb-1 last:mb-0">{line}</p>
                ))}
              </div>
            </div>
          ))}
          {isLoading && (
             <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-900/50 flex items-center justify-center shrink-0">
                   <Bot className="w-4 h-4 text-blue-400" />
                </div>
                <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-700 flex gap-1 items-center">
                   <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                   <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                   <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 rounded-b-2xl">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about the reaction..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

      </div>
    </>
  );
};
