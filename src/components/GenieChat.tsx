'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  X, 
  User, 
  Plus, 
  Loader2, 
  Trash2, 
  Edit2, 
  Check, 
  Paperclip, 
  File, 
  Image as ImageIcon, 
  FileText, 
  History 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GenieIcon } from './GenieIcon';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  attachments?: Array<{
    name: string;
    type: string;
    size: number;
  }>;
}

interface Chat {
  id: string;
  title: string;
  created_at: string;
}

export default function GenieChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showChatList, setShowChatList] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchChats();
    }
  }, [isOpen]);

  useEffect(() => {
    if (currentChatId) {
      fetchMessages(currentChatId);
    } else {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: "I am Genie. I've analyzed your context. How can I accelerate your learning today?",
        created_at: new Date().toISOString()
      }]);
    }
  }, [currentChatId]);

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
      content: "I am Genie. I've analyzed your context. How can I accelerate your learning today?",
      created_at: new Date().toISOString()
    }]);
    setAttachedFiles([]);
    setShowChatList(false);
  };

  const deleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this chat?')) return;

    try {
      const response = await fetch(`/api/chat?conversationId=${chatId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setChats(prev => prev.filter(c => c.id !== chatId));
        if (currentChatId === chatId) {
          startNewChat();
        }
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const startRenameChat = (chat: Chat, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditingTitle(chat.title);
  };

  const saveRename = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editingTitle.trim()) return;

    try {
      const response = await fetch(`/api/chat`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: chatId,
          title: editingTitle
        })
      });

      if (response.ok) {
        setChats(prev => prev.map(c =>
          c.id === chatId ? { ...c, title: editingTitle } : c
        ));
        setEditingChatId(null);
      }
    } catch (error) {
      console.error('Error renaming chat:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setAttachedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if ((!input.trim() && attachedFiles.length === 0) || isSending) return;

    const userMsgContent = input || 'Sent files';
    const currentFiles = [...attachedFiles];

    setInput('');
    setAttachedFiles([]);
    setIsSending(true);
    setIsProcessingFiles(currentFiles.length > 0);

    const tempMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMsgContent,
      created_at: new Date().toISOString(),
      attachments: currentFiles.map(f => ({
        name: f.name,
        type: f.type,
        size: f.size
      }))
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
        if (!currentChatId) fetchChats();

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
    } finally {
      setIsSending(false);
      setIsProcessingFiles(false);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
    if (type === 'application/pdf') return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const currentChatTitle = chats.find(c => c.id === currentChatId)?.title || 'Genie Session';

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-24 right-6 lg:bottom-10 lg:right-10 z-[60] flex items-center justify-center w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] hover:bg-zinc-800 transition-all group"
          >
            <GenieIcon className="w-8 h-8" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full border-2 border-zinc-950 shadow-lg shadow-indigo-500/20" />
          </motion.button>
        )}
      </AnimatePresence>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 lg:inset-auto lg:bottom-10 lg:right-10 lg:w-[440px] lg:h-[720px] z-[70] bg-zinc-950/98 backdrop-blur-3xl lg:rounded-[28px] lg:border lg:border-zinc-800 shadow-[0_32px_128px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden"
          >
            {/* Premium Header */}
            <div className="px-4 lg:px-6 h-16 lg:h-20 flex items-center justify-between border-b border-zinc-900 bg-zinc-950/50 shrink-0">
              <div className="flex items-center gap-3 lg:gap-4">
                <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-800 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <GenieIcon className="w-5 h-5 lg:w-6 lg:h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-100 tracking-tight max-w-[140px] lg:max-w-[180px] truncate">{currentChatTitle}</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <p className="text-[9px] lg:text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em]">Neural Engine v3</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 lg:gap-2">
                <button
                  onClick={() => setShowChatList(!showChatList)}
                  className={`p-2 lg:p-2.5 rounded-xl transition-all ${showChatList ? 'bg-zinc-800 text-white shadow-inner' : 'hover:bg-zinc-900 text-zinc-500 hover:text-zinc-200'}`}
                >
                  <History className="w-5 h-5" />
                </button>
                <button
                  onClick={startNewChat}
                  className="p-2 lg:p-2.5 hover:bg-zinc-900 text-zinc-500 hover:text-zinc-200 rounded-xl transition-all"
                >
                  <Plus className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 lg:p-2.5 hover:bg-zinc-900 text-zinc-500 hover:text-zinc-200 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 relative overflow-hidden">
              {/* Messages Area */}
              <div className="h-full overflow-y-auto px-4 lg:px-6 py-6 lg:py-8 space-y-6 lg:space-y-8 scroll-smooth no-scrollbar pb-32">
                {messages.map((message, idx) => (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03, duration: 0.4 }}
                    key={message.id}
                    className={`flex gap-3 lg:gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-800 shrink-0 mt-0.5">
                        <GenieIcon className="w-4 h-4 lg:w-5 lg:h-5" />
                      </div>
                    )}

                    <div className={`max-w-[85%] lg:max-w-[88%] group flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`
                        px-4 lg:px-5 py-3 lg:py-4 rounded-[20px] lg:rounded-[24px] text-[14px] lg:text-[15px] leading-[1.6]
                        ${message.role === 'user'
                          ? 'bg-zinc-100 text-zinc-950 font-medium rounded-tr-sm lg:rounded-tr-lg shadow-2xl shadow-white/5'
                          : 'bg-zinc-900/50 text-zinc-200 border border-zinc-800/50 rounded-tl-sm lg:rounded-tl-lg backdrop-blur-sm'
                        }
                      `}>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-3 lg:mt-4 flex flex-wrap gap-2">
                            {message.attachments.map((file, fidx) => (
                              <div key={fidx} className="flex items-center gap-2 px-2.5 py-1 bg-black/20 rounded-lg text-[10px] font-bold">
                                {getFileIcon(file.type)}
                                <span className="max-w-[80px] lg:max-w-[100px] truncate">{file.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="mt-2 text-[9px] lg:text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-2">
                        {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {message.role === 'user' && (
                      <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0 mt-0.5 shadow-lg">
                        <User className="w-4 h-4 lg:w-5 lg:h-5 text-zinc-950" />
                      </div>
                    )}
                  </motion.div>
                ))}
                
                {isSending && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 lg:gap-4">
                    <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-800 shrink-0">
                      <GenieIcon className="w-4 h-4 lg:w-5 lg:h-5 animate-pulse" />
                    </div>
                    <div className="bg-zinc-900/30 border border-zinc-800/30 rounded-[20px] lg:rounded-[24px] rounded-tl-sm lg:rounded-tl-lg px-4 lg:px-6 py-3 lg:py-4 flex items-center gap-3 lg:gap-4 backdrop-blur-sm">
                      <div className="flex gap-1.5 lg:gap-2">
                        <motion.div animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }} className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-indigo-500 rounded-full" />
                        <motion.div animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-indigo-500 rounded-full" />
                        <motion.div animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-indigo-500 rounded-full" />
                      </div>
                      <span className="text-[9px] lg:text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Thinking</span>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} className="h-4" />
              </div>

              {/* Sidebar Overlay for History */}
              <AnimatePresence>
                {showChatList && (
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "-100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="absolute inset-0 z-40 bg-zinc-950/98 backdrop-blur-3xl border-r border-zinc-900 lg:rounded-[28px] overflow-hidden flex flex-col"
                  >
                    <div className="px-6 h-16 lg:h-20 border-b border-zinc-900 flex items-center justify-between bg-zinc-950/50 shrink-0">
                      <h4 className="text-[10px] lg:text-xs font-black text-zinc-100 uppercase tracking-[0.25em]">Session History</h4>
                      <button onClick={() => setShowChatList(false)} className="p-2 lg:p-2.5 hover:bg-zinc-900 rounded-xl transition-colors">
                        <X className="w-5 h-5 text-zinc-500" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
                      {isLoadingChats ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-6">
                          <Loader2 className="w-8 h-8 text-zinc-800 animate-spin" />
                          <span className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em]">Syncing Archive</span>
                        </div>
                      ) : chats.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-center px-10">
                          <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-6">
                            <History className="w-8 h-8 text-zinc-800" />
                          </div>
                          <p className="text-sm text-zinc-400 font-bold tracking-tight">No history found</p>
                          <p className="text-xs text-zinc-600 mt-2">Start a new session to begin learning.</p>
                        </div>
                      ) : (
                        chats.map(chat => (
                          <div
                            key={chat.id}
                            className={`group relative rounded-2xl transition-all ${chat.id === currentChatId ? 'bg-zinc-900 border border-zinc-800' : 'hover:bg-zinc-900/50 border border-transparent'}`}
                          >
                            <button
                              onClick={() => { setCurrentChatId(chat.id); setShowChatList(false); }}
                              className="w-full p-4 lg:p-5 pr-14 lg:pr-16 text-left"
                            >
                              {editingChatId === chat.id ? (
                                <input
                                  type="text"
                                  value={editingTitle}
                                  onChange={(e) => setEditingTitle(e.target.value)}
                                  className="w-full bg-zinc-950 border border-indigo-500 rounded-xl px-3 py-1.5 lg:px-4 lg:py-2 text-sm text-white focus:outline-none shadow-2xl"
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <>
                                  <p className="text-sm font-bold text-zinc-100 truncate group-hover:text-white transition-colors">{chat.title}</p>
                                  <p className="text-[10px] font-black text-zinc-600 mt-2 uppercase tracking-widest">
                                    {new Date(chat.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </p>
                                </>
                              )}
                            </button>

                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {editingChatId === chat.id ? (
                                <button onClick={(e) => saveRename(chat.id, e)} className="p-2 hover:bg-zinc-800 rounded-lg text-green-400">
                                  <Check className="w-4 h-4" />
                                </button>
                              ) : (
                                <button onClick={(e) => startRenameChat(chat, e)} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white">
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              )}
                              <button onClick={(e) => deleteChat(chat.id, e)} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-red-400">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Premium Input Deck */}
            <div className="p-4 lg:p-6 bg-zinc-950 border-t border-zinc-900 lg:rounded-b-[28px] shrink-0">
              <div className="flex flex-col gap-4 lg:gap-6">
                {attachedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 lg:gap-3">
                    {attachedFiles.map((file, index) => (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        key={index}
                        className="flex items-center gap-2 lg:gap-3 bg-zinc-900 border border-zinc-800 rounded-xl lg:rounded-2xl px-3 lg:px-4 py-2 lg:py-2.5 shadow-2xl"
                      >
                        {getFileIcon(file.type)}
                        <span className="text-[10px] lg:text-[11px] font-bold text-zinc-400 truncate max-w-[120px] lg:max-w-[140px]">{file.name}</span>
                        <button onClick={() => removeFile(index)} className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors ml-1">
                          <X className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-zinc-500" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}

                <div className="flex items-end gap-2 lg:gap-3">
                  <div className="flex-1 relative bg-zinc-900/50 rounded-[24px] lg:rounded-[28px] border border-zinc-800 focus-within:border-zinc-600 transition-all shadow-inner px-1 lg:px-2 py-1 lg:py-2">
                    <textarea
                      ref={textareaRef}
                      rows={1}
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                          if (textareaRef.current) textareaRef.current.style.height = 'auto';
                        }
                      }}
                      placeholder="Ask Genie anything..."
                      className="w-full bg-transparent border-0 rounded-2xl pl-3 lg:pl-4 pr-10 lg:pr-12 py-2.5 lg:py-3 text-[14px] lg:text-[15px] text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-0 resize-none min-h-[44px] lg:min-h-[48px] max-h-[150px] lg:max-h-[200px] leading-relaxed"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute right-2.5 bottom-2.5 p-2 text-zinc-500 hover:text-zinc-200 transition-colors bg-zinc-800/50 rounded-lg lg:rounded-xl"
                      title="Upload Files"
                    >
                      <Paperclip className="w-4 h-4 lg:w-4.5 lg:h-4.5" />
                    </button>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSend}
                    disabled={(!input.trim() && attachedFiles.length === 0) || isSending}
                    className="h-11 w-11 lg:h-14 lg:w-14 bg-zinc-100 hover:bg-white disabled:bg-zinc-900 disabled:text-zinc-800 text-zinc-950 rounded-[20px] lg:rounded-2xl flex items-center justify-center transition-all shadow-lg"
                  >
                    {isSending ? <Loader2 className="w-5 h-5 lg:w-6 lg:h-6 animate-spin" /> : <Send className="w-5 h-5 lg:w-6 lg:h-6" />}
                  </motion.button>
                </div>

                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {['Summarize', 'Quiz', 'Explain'].map((action) => (
                    <button
                      key={action}
                      onClick={() => setInput(action)}
                      className="whitespace-nowrap px-4 py-2 bg-zinc-900/30 hover:bg-zinc-900 border border-zinc-800/50 rounded-xl lg:rounded-2xl text-[9px] lg:text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] hover:text-zinc-300 transition-all"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
