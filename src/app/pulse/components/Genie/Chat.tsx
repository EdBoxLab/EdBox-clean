
import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Mic, MicOff, Radio, Pause, Play, Square, RefreshCcw } from 'lucide-react';
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
  onSync?: () => void; // New prop for synchronization
}

const MotionDiv = motion.div as any;

const FormattedMessage = ({ text, role }: { text: string; role: 'user' | 'model' | 'system' }) => {
  return (
    <div
      className={`max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed shadow-xl overflow-hidden ${role === 'user'
        ? 'bg-cyan-600/10 border border-cyan-500/20 text-cyan-50 rounded-tr-none'
        : 'bg-slate-800/30 border border-white/5 text-slate-100 rounded-tl-none'
        }`}
    >
      <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-black/40">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            p: ({ node, ...props }) => <p className="mb-3 last:mb-0" {...props} />,
            ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-3 space-y-1.5" {...props} />,
            ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-3 space-y-1.5" {...props} />,
            li: ({ node, ...props }) => <li className="pl-1" {...props} />,
            strong: ({ node, ...props }) => <strong className="font-bold text-cyan-200" {...props} />,
            em: ({ node, ...props }) => <em className="text-purple-200 not-italic border-b border-purple-500/30" {...props} />,
            code: ({ node, ...props }) => <code className="bg-slate-900/50 rounded px-1.5 py-0.5 font-mono text-xs text-yellow-100 border border-white/10" {...props} />,
            blockquote: ({ node, ...props }) => <blockquote className="border-l-3 border-cyan-500/40 pl-4 italic text-slate-400 my-4 bg-white/5 py-2 rounded-r-lg" {...props} />,
            h1: ({ node, ...props }) => <h1 className="text-xl font-bold text-white mb-4 mt-2 tracking-tight" {...props} />,
            h2: ({ node, ...props }) => <h2 className="text-lg font-bold text-white mb-3 mt-2" {...props} />,
            h3: ({ node, ...props }) => <h3 className="text-base font-bold text-white mb-2 mt-2" {...props} />,
            table: ({ node, ...props }) => <div className="overflow-x-auto my-4 rounded-xl border border-white/10"><table className="min-w-full divide-y divide-white/10" {...props} /></div>,
            thead: ({ node, ...props }) => <thead className="bg-white/5" {...props} />,
            th: ({ node, ...props }) => <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-widest" {...props} />,
            tbody: ({ node, ...props }) => <tbody className="divide-y divide-white/5" {...props} />,
            tr: ({ node, ...props }) => <tr className="hover:bg-white/5 transition-colors" {...props} />,
            td: ({ node, ...props }) => <td className="px-4 py-3 text-sm text-slate-400 whitespace-normal" {...props} />,
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
  onSync
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
      {/* Premium Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-slate-900/20">
        <div className="flex items-center gap-4">
          <Orb state={isLiveActive && !isLivePaused ? 'speaking' : (genieState.isThinking ? 'focused' : 'neutral')} size="sm" />
          <div className="flex flex-col">
            <h2 className="text-xs font-bold tracking-[0.2em] text-cyan-400 uppercase">
              Genie OS
            </h2>
            <div className="flex items-center gap-2 h-4 mt-0.5">
              {isLiveActive ? (
                <span className="text-[10px] text-red-400 font-bold uppercase tracking-wide">Live Session</span>
              ) : genieState.isThinking ? (
                <span className="text-[10px] text-cyan-200 font-medium uppercase tracking-widest animate-pulse">Syncing...</span>
              ) : (
                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Active Link</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons: Sync & Close */}
        <div className="flex items-center gap-3">
          <button
            onClick={onSync}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 transition-all hover:scale-105"
            title="Synchronize with Workspace"
          >
            <RefreshCcw size={14} className={genieState.isThinking ? 'animate-spin' : ''} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Sync Pulse</span>
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
      <div className="p-6 border-t border-white/5 bg-slate-900/10">
        {/* Live Mode Controls Overlay logic can be here or integrated */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleLive}
            className={`shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 border ${isLiveActive ? 'bg-red-500 border-red-400 shadow-lg shadow-red-500/30' : 'bg-slate-800 border-white/10 text-slate-400 hover:text-white hover:border-white/20'}`}
          >
            {isLiveActive ? <Square size={20} fill="currentColor" /> : <Mic size={20} />}
          </button>

          <form onSubmit={handleSubmit} className="flex-1 relative group">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isLiveActive ? (isLivePaused ? "Session Paused..." : "Listening...") : "What should we explore?"}
              disabled={isLiveActive && !isLivePaused}
              className="w-full bg-white/5 text-white placeholder-slate-500 rounded-2xl py-3.5 pl-5 pr-12 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 border border-white/10 transition-all hover:bg-white/10"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || (isLiveActive && !isLivePaused)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-xl text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors disabled:opacity-30"
            >
              <Send size={20} />
            </button>
          </form>
        </div>

        {!isLiveActive && (
          <div className="mt-5 flex gap-2.5 overflow-x-auto no-scrollbar py-1">
            <SuggestionChip text="Explain selection" onClick={() => onSendMessage("Explain what I've selected in the workspace.")} />
            <SuggestionChip text="Suggest improvements" onClick={() => onSendMessage("Suggest improvements for my current code or notes.")} />
            <SuggestionChip text="Quick quiz" onClick={() => onSendMessage("Give me a quick 3-question quiz on what I've learned so far.")} />
          </div>
        )}
      </div>
    </div>
  );
};

const SuggestionChip = ({ text, onClick }: { text: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="whitespace-nowrap px-4 py-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] font-medium text-slate-400 hover:text-cyan-200 transition-all hover:scale-105 active:scale-95"
  >
    {text}
  </button>
);

export default Chat;

