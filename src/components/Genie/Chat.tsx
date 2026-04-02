import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Mic, MicOff, Radio, Pause, Play, Square, RefreshCcw, PanelRight, Maximize2, Pin, PinOff, Zap } from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { ChatMessage, GenieState } from '@/app/pulse/types';
import Orb from './Orb';

interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  genieState: GenieState;
  onToggleLive: () => void;
  isLiveActive: boolean;
  isLivePaused?: boolean;
  onTogglePause?: () => void;
  onSync?: () => void;
  isPinned?: boolean;
  onTogglePin?: () => void;
}

const MotionDiv = motion.div as any;

const FormattedMessage = ({ text, role }: { text: string; role: 'user' | 'model' | 'system' }) => {
  return (
    <div
      className={`max-w-[90%] p-5 rounded-[28px] text-sm leading-relaxed shadow-sm overflow-hidden ${role === 'user'
        ? 'bg-cyan-500/10 border border-cyan-400/20 text-cyan-50 rounded-tr-none self-end'
        : 'bg-white/5 border border-white/10 text-slate-100 rounded-tl-none self-start'
        }`}
    >
      <div className="prose prose-invert prose-sm max-w-none 
        prose-p:leading-relaxed prose-p:text-slate-200
        prose-strong:text-cyan-400 prose-strong:font-bold
        prose-code:text-emerald-300 prose-code:bg-white/5 prose-code:px-1.5 prose-code:rounded-md
        prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/5 prose-pre:rounded-2xl
        prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline
      ">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            p: ({ node, ...props }) => <p className="mb-4 last:mb-0" {...props} />,
            ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-4 space-y-2" {...props} />,
            ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-4 space-y-2" {...props} />,
            li: ({ node, ...props }) => <li className="pl-1" {...props} />,
            blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-cyan-500/30 pl-5 italic text-slate-400 my-5 bg-white/5 py-3 rounded-r-2xl" {...props} />,
            h1: ({ node, ...props }) => <h1 className="text-xl font-bold text-white mb-5 mt-2 tracking-tight" {...props} />,
            h2: ({ node, ...props }) => <h2 className="text-lg font-bold text-white mb-4 mt-2" {...props} />,
            table: ({ node, ...props }) => <div className="overflow-x-auto my-5 rounded-2xl border border-white/10 shadow-2xl"><table className="min-w-full divide-y divide-white/10" {...props} /></div>,
            th: ({ node, ...props }) => <th className="px-5 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest bg-white/5" {...props} />,
            td: ({ node, ...props }) => <td className="px-5 py-4 text-sm text-slate-300 border-t border-white/5" {...props} />,
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
  onSync,
  isPinned = false,
  onTogglePin
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
    <div className="flex flex-col h-full w-full bg-transparent overflow-hidden">
      {/* Premium Header - Refactored for switching */}
      <div className="flex items-center justify-between px-8 h-24 shrink-0 border-b border-white/5 bg-slate-900/20 backdrop-blur-3xl">
        <div className="flex items-center gap-5">
           <div className="relative">
              <Orb state={isLiveActive && !isLivePaused ? 'speaking' : (genieState.isThinking ? 'focused' : 'neutral')} size="sm" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
           </div>
           <div className="flex flex-col">
            <h2 className="text-[11px] font-black tracking-[0.25em] text-cyan-400 uppercase italic">
              Genie OS
            </h2>
            <div className="flex items-center gap-2 h-4 mt-1">
              {isLiveActive ? (
                <div className="flex items-center gap-1.5">
                   <div className="w-1 h-1 rounded-full bg-red-500 animate-ping" />
                   <span className="text-[9px] text-red-400 font-bold uppercase tracking-widest">Live Link</span>
                </div>
              ) : genieState.isThinking ? (
                <span className="text-[9px] text-cyan-200/60 font-medium uppercase tracking-widest animate-pulse">Analyzing Canvas...</span>
              ) : (
                <div className="flex items-center gap-1.5">
                   <Zap size={8} className="text-emerald-400" />
                   <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Neural Link Active</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons: Sync & Pin */}
        <div className="flex items-center gap-3">
          <button
            onClick={onSync}
            className="group flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 transition-all hover:-translate-y-0.5 active:scale-95"
            title="Synchronize Pulse"
          >
            <RefreshCcw size={14} className={`${genieState.isThinking ? 'animate-spin' : ''} group-hover:text-cyan-400 transition-colors`} />
            {!isPinned && <span className="text-[10px] font-bold uppercase tracking-widest">Sync</span>}
          </button>

          <button
            onClick={onTogglePin}
            className={`group flex items-center gap-2.5 px-4 py-2 rounded-2xl border transition-all hover:-translate-y-0.5 active:scale-95 ${
                isPinned 
                ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]' 
                : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
            }`}
            title={isPinned ? "Unpin to Center" : "Pin to Side"}
          >
            {isPinned ? <Maximize2 size={15} /> : <PanelRight size={15} />}

            {!isPinned && <span className="text-[10px] font-bold uppercase tracking-widest">Pin Portal</span>}
          </button>
        </div>
      </div>


      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10" ref={scrollRef}>
        <AnimatePresence>
          {messages.map((msg) => (
            <MotionDiv
              key={msg.id}
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
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
              <div className="bg-slate-800/20 border border-white/5 p-4 rounded-3xl rounded-tl-none flex items-center space-x-2">
                <div className="w-1.5 h-1.5 rounded-full animate-bounce bg-cyan-400" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full animate-bounce bg-cyan-400" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full animate-bounce bg-cyan-400" style={{ animationDelay: '300ms' }} />
              </div>
            </MotionDiv>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-white/5 bg-slate-900/20">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleLive}
            className={`shrink-0 flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 border ${
              isLiveActive 
                ? 'bg-red-500 border-red-400 shadow-lg shadow-red-500/20 text-white' 
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
            }`}
          >
            {isLiveActive ? <Square size={18} fill="currentColor" /> : <Mic size={18} />}
          </button>

          <form onSubmit={handleSubmit} className="flex-1 relative group">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isLiveActive ? (isLivePaused ? "Paused..." : "Listening...") : "What are we exploring?"}
              disabled={isLiveActive && !isLivePaused}
              className="w-full bg-white/5 text-slate-100 placeholder-slate-500 rounded-xl py-3 pl-5 pr-12 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 border border-white/10 transition-all hover:bg-white/10"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || (isLiveActive && !isLivePaused)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-lg text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 transition-all disabled:opacity-20"
            >
              <Send size={18} />
            </button>
          </form>
        </div>

        {!isLiveActive && (
          <div className="mt-5 flex gap-2.5 overflow-x-auto no-scrollbar py-1">
            <SuggestionChip text="Explain selection" onClick={() => onSendMessage("Explain current workspace context.")} />
            <SuggestionChip text="Suggest improvements" onClick={() => onSendMessage("Suggest improvements for my work.")} />
            <SuggestionChip text="Quick quiz" onClick={() => onSendMessage("Give me a quick 3-question quiz.")} />
          </div>
        )}
      </div>
    </div>
  );
};

const SuggestionChip = ({ text, onClick }: { text: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="whitespace-nowrap px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-semibold text-slate-400 hover:text-cyan-300 transition-all hover:-translate-y-0.5"
  >
    {text}
  </button>
);

export default Chat;

