'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Mic, MicOff, X, Sparkles, User, Bot, Plus, MessageSquare, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface Chat {
  id: string;
  title: string;
  created_at: string;
}

export default function AIGenie() {
  const [isOpen, setIsOpen] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showChatList, setShowChatList] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch chats on open
  useEffect(() => {
    if (isOpen) {
      fetchChats();
    }
  }, [isOpen]);

  // Fetch messages when chat changes
  useEffect(() => {
    if (currentChatId) {
      fetchMessages(currentChatId);
    } else {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: "Hey there! 👋 I'm Genie, your AI study buddy! I know all about your study sets, notes, and courses. Ask me anything - let's ace this together!",
        created_at: new Date().toISOString()
      }]);
    }
  }, [currentChatId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchChats = async () => {
    try {
      setIsLoadingChats(true);
      const response = await fetch('/api/chat');
      const data = await response.json();
      if (data.conversations) {
        setChats(data.conversations);
        if (data.conversations.length > 0 && !currentChatId) {
          setCurrentChatId(data.conversations[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setIsLoadingChats(false);
    }
  };

  const fetchMessages = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chat?conversationId=${chatId}`);
      const data = await response.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const startNewChat = () => {
    setCurrentChatId(null);
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: "Hey there! 👋 I'm Genie, your AI study buddy! I know all about your study sets, notes, and courses. Ask me anything - let's ace this together!",
      created_at: new Date().toISOString()
    }]);
    setShowChatList(false);
  };

  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    const userMsgContent = input;
    setInput('');
    setIsSending(true);

    // Optimistic update
    const tempMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMsgContent,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: currentChatId,
          message: userMsgContent
        })
      });

      const data = await response.json();

      if (data.conversationId) {
        setCurrentChatId(data.conversationId);
        // If it was a new chat, refresh chat list to show title
        if (!currentChatId) fetchChats();

        // Add AI response
        const aiMsg: Message = {
          id: Date.now().toString() + 'ai',
          role: 'assistant',
          content: data.response,
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove temp message or show error
    } finally {
      setIsSending(false);
    }
  };

  const currentChatTitle = chats.find(c => c.id === currentChatId)?.title || 'New Chat';

  return (
    <>
      {/* Floating AI Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 flex items-center gap-2 px-4 py-3 sm:px-5 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-full shadow-lg shadow-indigo-900/30 transition-all hover:scale-105"
        >
          <Sparkles className="w-5 h-5 text-white animate-pulse" />
          <span className="font-semibold text-white text-sm hidden sm:inline">AI Chat</span>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
        </button>
      )}

      {/* Chat Interface */}
      {isOpen && (
        <div className="fixed inset-4 sm:inset-auto sm:bottom-4 sm:right-4 sm:w-[400px] sm:h-[500px] z-50 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600/90 to-purple-600/90 backdrop-blur-sm p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <button
                onClick={() => setShowChatList(!showChatList)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition shrink-0"
              >
                <MessageSquare className="w-4 h-4 text-white" />
              </button>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-white text-sm truncate">{currentChatTitle}</h3>
                <p className="text-xs text-indigo-100">Genie - Your Study Buddy</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={startNewChat}
                className="p-1.5 hover:bg-white/20 rounded-lg transition"
                title="New chat"
              >
                <Plus className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Chat List Sidebar */}
          {showChatList && (
            <div className="absolute top-14 left-0 right-0 sm:right-auto sm:w-64 bg-zinc-900 border-b sm:border-r border-zinc-700 z-10 max-h-64 overflow-y-auto shadow-xl">
              {isLoadingChats ? (
                <div className="p-4 text-center text-zinc-500 text-xs">Loading chats...</div>
              ) : chats.length === 0 ? (
                <div className="p-4 text-center text-zinc-500 text-xs">No history yet</div>
              ) : (
                chats.map(chat => (
                  <button
                    key={chat.id}
                    onClick={() => { setCurrentChatId(chat.id); setShowChatList(false); }}
                    className={`w-full p-3 text-left hover:bg-zinc-800 transition border-b border-zinc-800 ${chat.id === currentChatId ? 'bg-zinc-800' : ''
                      }`}
                  >
                    <p className="text-sm text-white truncate">{chat.title}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {new Date(chat.created_at).toLocaleDateString()}
                    </p>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${message.role === 'user'
                  ? 'bg-indigo-600'
                  : 'bg-gradient-to-br from-purple-600 to-indigo-600'
                  }`}>
                  {message.role === 'user' ? (
                    <User className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  )}
                </div>

                <div className={`max-w-[85%] ${message.role === 'user'
                  ? 'bg-indigo-600/90 text-white'
                  : 'bg-zinc-800/90 text-zinc-100 border border-zinc-700/50'
                  } backdrop-blur-sm rounded-2xl px-3 py-2`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  <p className="text-[10px] opacity-50 mt-1 text-right">
                    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-zinc-800/90 backdrop-blur-sm border border-zinc-700/50 rounded-2xl px-3 py-2">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-zinc-900/95 backdrop-blur-sm border-t border-zinc-700/50">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsVoiceMode(!isVoiceMode)}
                className={`p-2 rounded-lg transition shrink-0 ${isVoiceMode
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
              >
                {isVoiceMode ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {isVoiceMode ? (
                <div className="flex-1 flex items-center justify-center gap-2 bg-zinc-800/90 backdrop-blur-sm rounded-lg px-3 py-2">
                  <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-zinc-600'}`} />
                  <span className="text-xs text-zinc-400">Voice mode active (demo)</span>
                </div>
              ) : (
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-zinc-800/90 backdrop-blur-sm border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition"
                />
              )}

              <button
                onClick={handleSend}
                disabled={!input.trim() || isSending}
                className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-zinc-700 disabled:to-zinc-700 disabled:cursor-not-allowed rounded-lg transition shrink-0"
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
              </button>
            </div>

            <div className="hidden sm:flex gap-1.5 mt-2 overflow-x-auto no-scrollbar">
              {['Explain this concept', 'Summarize my notes', 'Create a quiz'].map((action) => (
                <button
                  key={action}
                  onClick={() => setInput(action)}
                  className="px-2.5 py-1 bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700/50 rounded-full text-xs text-zinc-300 whitespace-nowrap transition"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}