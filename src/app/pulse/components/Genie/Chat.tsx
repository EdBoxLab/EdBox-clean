
import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Mic, MicOff, Radio, Pause, Play, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { ChatMessage, GenieState } from '../../types';
import Orb from './Orb';

interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  genieState: GenieState;
  onToggleLive: () => void;
  isLiveActive: boolean;
  isLivePaused?: boolean;
  onTogglePause?: () => void;
  onToggleMode: (mode: 'regular' | 'tutor') => void;
}

const MotionDiv = motion.div as any;

const FormattedMessage = ({ text, role }: { text: string; role: 'user' | 'model' | 'system' }) => {
  return (
    <div
      className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-lg overflow-hidden ${role === 'user'
        ? 'bg-cyan-600/20 border border-cyan-500/30 text-cyan-50 rounded-tr-none'
        : 'bg-slate-800/40 border border-white/10 text-slate-200 rounded-tl-none'
        }`}
    >
      <div className="prose prose-invert prose-sm max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
            ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
            ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
            li: ({ node, ...props }) => <li className="pl-1" {...props} />,
            strong: ({ node, ...props }) => <strong className="font-bold text-cyan-200" {...props} />,
            em: ({ node, ...props }) => <em className="text-purple-200 not-italic" {...props} />,
            code: ({ node, ...props }) => <code className="bg-black/30 rounded px-1 py-0.5 font-mono text-xs text-yellow-200 border border-white/5" {...props} />,
            blockquote: ({ node, ...props }) => <blockquote className="border-l-2 border-cyan-500/50 pl-3 italic text-slate-400 my-2" {...props} />,
            h1: ({ node, ...props }) => <h1 className="text-lg font-bold text-white mb-2 mt-1" {...props} />,
            h2: ({ node, ...props }) => <h2 className="text-base font-bold text-white mb-2 mt-1" {...props} />,
            h3: ({ node, ...props }) => <h3 className="text-sm font-bold text-white mb-1 mt-1" {...props} />,
            table: ({ node, ...props }) => <table className="min-w-full divide-y divide-white/10 my-2" {...props} />,
            thead: ({ node, ...props }) => <thead className="bg-white/5" {...props} />,
            th: ({ node, ...props }) => <th className="px-3 py-2 text-left text-xs font-medium text-slate-300 uppercase tracking-wider" {...props} />,
            tbody: ({ node, ...props }) => <tbody className="divide-y divide-white/5" {...props} />,
            tr: ({ node, ...props }) => <tr className="hover:bg-white/5 transition-colors" {...props} />,
            td: ({ node, ...props }) => <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-400" {...props} />,
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    </div>
  );
};

const Chat: React.FC<ChatProps> = ({
  messages,
  onSendMessage,
  genieState,
  onToggleLive,
  isLiveActive,
  isLivePaused,
  onTogglePause,
  onToggleMode
}) => {
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-950/60 backdrop-blur-2xl border-r border-white/5 shadow-2xl relative overflow-hidden">
      {/* Compact Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-slate-900/40 shrink-0">
        <Orb state={isLiveActive && !isLivePaused ? 'speaking' : (genieState.isThinking ? 'focused' : 'neutral')} />
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold tracking-widest text-white uppercase">
              Genie OS v2.0
            </h2>
            <div className="flex bg-slate-800 rounded-full p-0.5 border border-white/5">
              <button
                onClick={() => onToggleMode('regular')}
                className={`px-2 py-0.5 rounded-full text-[8px] font-bold transition-all ${genieState.mode === 'regular' ? 'bg-cyan-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                REGULAR
              </button>
              <button
                onClick={() => onToggleMode('tutor')}
                className={`px-2 py-0.5 rounded-full text-[8px] font-bold transition-all ${genieState.mode === 'tutor' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                TUTOR
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 h-3 mt-0.5">
            {isLiveActive && !isLivePaused && (
              <div className="flex items-center gap-1.5">
                <span className="flex h-1.5 w-1.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                </span>
                <span className="text-[9px] text-red-200 font-medium tracking-wide">LIVE</span>
              </div>
            )}
            {isLiveActive && isLivePaused && (
              <span className="text-[9px] text-yellow-400 font-mono tracking-wide">PAUSED</span>
            )}
            {!isLiveActive && !genieState.isThinking && (
              <span className="text-[9px] text-slate-500 font-medium tracking-wide">{genieState.mode === 'tutor' ? 'READY TO TEACH' : 'IDLE'}</span>
            )}
            {!isLiveActive && genieState.isThinking && (
              <span className="text-[9px] text-cyan-400 font-medium tracking-wide animate-pulse">{genieState.mode === 'tutor' ? 'ANALYZING CONCEPT' : 'THINKING'}</span>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10" ref={scrollRef}>
        <AnimatePresence>
          {messages.map((msg) => (
            <MotionDiv
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <FormattedMessage text={msg.text} role={msg.role} />
            </MotionDiv>
          ))}
          {genieState.isThinking && !isLiveActive && (
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-slate-800/40 border border-white/10 p-3 rounded-2xl rounded-tl-none flex items-center space-x-2">
                <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${genieState.mode === 'tutor' ? 'bg-indigo-400' : 'bg-cyan-400'}`} style={{ animationDelay: '0ms' }} />
                <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${genieState.mode === 'tutor' ? 'bg-indigo-400' : 'bg-cyan-400'}`} style={{ animationDelay: '150ms' }} />
                <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${genieState.mode === 'tutor' ? 'bg-indigo-400' : 'bg-cyan-400'}`} style={{ animationDelay: '300ms' }} />
              </div>
            </MotionDiv>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/5 bg-slate-900/30">

        {/* Live Mode Controls */}
        <div className="mb-4 flex justify-center space-x-3">
          {!isLiveActive ? (
            <button
              onClick={onToggleLive}
              className="flex items-center space-x-2 px-6 py-2 rounded-full transition-all duration-300 border bg-slate-800 border-white/10 text-slate-400 hover:bg-cyan-900/30 hover:border-cyan-500/50 hover:text-cyan-200"
            >
              <Mic size={16} />
              <span className="text-xs font-semibold tracking-wide uppercase">Start Voice Session</span>
            </button>
          ) : (
            <>
              {/* Pause/Resume Button */}
              <button
                onClick={onTogglePause}
                className={`flex items-center justify-center w-10 h-10 rounded-full border transition-all ${isLivePaused
                  ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/30'
                  : 'bg-slate-800 border-white/10 text-white hover:bg-white/10'
                  }`}
                title={isLivePaused ? "Resume Session" : "Pause Session"}
              >
                {isLivePaused ? <Play size={16} fill="currentColor" /> : <Pause size={16} fill="currentColor" />}
              </button>

              {/* Disconnect Button */}
              <button
                onClick={onToggleLive}
                className="flex items-center space-x-2 px-5 py-2 rounded-full border bg-red-500/20 border-red-500/50 text-red-200 hover:bg-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all"
              >
                <Square size={14} fill="currentColor" />
                <span className="text-xs font-semibold tracking-wide uppercase">End</span>
              </button>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} className={`relative group transition-opacity duration-300 ${isLiveActive ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={isLiveActive ? (isLivePaused ? "Session Paused..." : "Listening...") : "Ask anything..."}
            className="w-full bg-slate-900/50 text-white placeholder-slate-500 rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 border border-white/10 transition-all hover:border-white/20"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-lg text-cyan-400 hover:text-cyan-300 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </form>

        {!isLiveActive && (
          <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
            <SuggestionChip text={genieState.mode === 'tutor' ? "Teach me Photosynthesis" : "How Neurons Work"} onClick={() => onSendMessage(genieState.mode === 'tutor' ? "Teach me Photosynthesis" : "How Neurons Work")} />
            <SuggestionChip text={genieState.mode === 'tutor' ? "Quiz me on Biology" : "Python Basics"} onClick={() => onSendMessage(genieState.mode === 'tutor' ? "Quiz me on Biology" : "Show me some Python code")} />
            <SuggestionChip text="Clear Widgets" onClick={() => onSendMessage("Close all windows")} />
          </div>
        )}
      </div>
    </div>
  );
};

const SuggestionChip = ({ text, onClick }: { text: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="whitespace-nowrap px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-slate-400 hover:text-cyan-200 transition-colors"
  >
    {text}
  </button>
);

export default Chat;
