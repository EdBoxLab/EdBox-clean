'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Sparkles, User, Bot, Plus, MessageSquare, Loader2, Trash2, Edit2, Check, Paperclip, File, Image as ImageIcon, FileText, ChevronRight, History } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

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

export default function KoalaGenie() {
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
        content: "I am Genie. I've analyzed your notes, courses, and study patterns. How can I accelerate your learning today?",
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
      content: "I am Genie. I've analyzed your notes, courses, and study patterns. How can I accelerate your learning today?",
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

    const validFiles = files.filter(file => {
      const validTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      const maxSize = 10 * 1024 * 1024;

      if (!validTypes.includes(file.type)) {
        alert(`${file.name} is not supported`);
        return false;
      }
      if (file.size > maxSize) {
        alert(`${file.name} is too large`);
        return false;
      }
      return true;
    });

    setAttachedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const processFilesForUpload = async (files: File[]) => {
    const processedFiles = await Promise.all(
      files.map(async (file) => {
        if (file.type.startsWith('image/')) {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                name: file.name,
                type: file.type,
                size: file.size,
                content: reader.result as string
              });
            };
            reader.readAsDataURL(file);
          });
        }

        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              name: file.name,
              type: file.type,
              size: file.size,
              content: reader.result as string
            });
          };

          if (file.type === 'text/plain') {
            reader.readAsText(file);
          } else {
            reader.readAsDataURL(file);
          }
        });
      })
    );

    return processedFiles;
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
      let processedFiles = null;
      if (currentFiles.length > 0) {
        processedFiles = await processFilesForUpload(currentFiles);
      }
      setIsProcessingFiles(false);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: currentChatId,
          message: userMsgContent,
          files: processedFiles
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
      const errorMsg: Message = {
        id: Date.now().toString() + 'error',
        role: 'assistant',
        content: 'System error. Please retry.',
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const currentChatTitle = chats.find(c => c.id === currentChatId)?.title || 'New Session';

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
            data-tour="step-genie"
            className="fixed bottom-20 right-4 lg:bottom-8 lg:right-8 z-50 flex items-center justify-center w-14 h-14 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl hover:bg-zinc-800 transition-colors group"
          >
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
            <Sparkles className="w-6 h-6 text-white group-hover:text-indigo-400 transition-colors" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full border-2 border-zinc-950 shadow-lg shadow-indigo-500/20" />
          </motion.button>
        )}
      </AnimatePresence>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.txt,.doc,.docx"
        onChange={handleFileSelect}
        className="hidden"
      />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[440px] sm:h-[700px] z-50 bg-zinc-950/95 backdrop-blur-2xl border-0 sm:border sm:border-zinc-800 shadow-[0_24px_100px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden sm:rounded-[32px]"
          >
            {/* Minimalist Header */}
            <div className="px-6 py-5 flex items-center justify-between border-b border-zinc-900 bg-zinc-950/50 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-800">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-zinc-950" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100 tracking-tight">{currentChatTitle}</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-zinc-600" />
                    <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-[0.1em]">Genie Neural Engine</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowChatList(!showChatList)}
                  className={`p-2 rounded-xl transition-all ${showChatList ? 'bg-zinc-800 text-white' : 'hover:bg-zinc-900 text-zinc-400 hover:text-white'}`}
                >
                  <History className="w-5 h-5" />
                </button>
                <button
                  onClick={startNewChat}
                  className="p-2 hover:bg-zinc-900 rounded-xl transition-all text-zinc-400 hover:text-white"
                >
                  <Plus className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="ml-1 p-2 hover:bg-zinc-900 rounded-xl transition-all text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 relative overflow-hidden flex flex-col">
              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 no-scrollbar">
                {messages.map((message, idx) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={message.id}
                    className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-800 shrink-0 mt-0.5">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                      </div>
                    )}

                    <div className={`max-w-[85%] group`}>
                      <div className={`
                        relative px-4 py-3 rounded-[20px] text-sm leading-relaxed
                        ${message.role === 'user'
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/10'
                          : 'bg-zinc-900/50 text-zinc-300 border border-zinc-800/50'
                        }
                      `}>
                        <p className="whitespace-pre-wrap">{message.content}</p>

                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                            {message.attachments.map((file, fidx) => (
                              <div key={fidx} className="flex items-center gap-2 text-[11px] font-medium opacity-80">
                                {getFileIcon(file.type)}
                                <span className="truncate">{file.name}</span>
                                <span className="text-[10px] opacity-60">{formatFileSize(file.size)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <p className={`text-[10px] mt-2 font-medium tracking-wide text-zinc-600 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                        {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </motion.div>
                ))}

                {isSending && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-800 shrink-0">
                      <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl px-5 py-3 flex items-center gap-3">
                      <div className="flex gap-1.5">
                        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }} className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                      </div>
                      <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-widest">Processing</span>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat History Sidebar (Minimalist) */}
              <AnimatePresence>
                {showChatList && (
                  <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="absolute inset-0 z-20 bg-zinc-950/98 backdrop-blur-3xl"
                  >
                    <div className="h-full flex flex-col">
                      <div className="p-6 border-b border-zinc-900 flex items-center justify-between">
                        <h4 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">Archive</h4>
                        <button onClick={() => setShowChatList(false)} className="p-2 hover:bg-zinc-900 rounded-xl transition-colors">
                          <X className="w-5 h-5 text-zinc-400" />
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
                        {isLoadingChats ? (
                          <div className="flex flex-col items-center justify-center h-40 gap-4">
                            <Loader2 className="w-6 h-6 text-zinc-600 animate-spin" />
                            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Indexing History</span>
                          </div>
                        ) : chats.length === 0 ? (
                          <div className="text-center py-20">
                            <History className="w-12 h-12 text-zinc-900 mx-auto mb-4" />
                            <p className="text-sm text-zinc-600 font-medium">No archived sessions</p>
                          </div>
                        ) : (
                          chats.map(chat => (
                            <div
                              key={chat.id}
                              className={`group relative rounded-2xl transition-all ${chat.id === currentChatId ? 'bg-zinc-900 border border-zinc-800' : 'hover:bg-zinc-900/50 border border-transparent'}`}
                            >
                              <button
                                onClick={() => { setCurrentChatId(chat.id); setShowChatList(false); }}
                                className="w-full p-4 pr-16 text-left"
                              >
                                {editingChatId === chat.id ? (
                                  <input
                                    type="text"
                                    value={editingTitle}
                                    onChange={(e) => setEditingTitle(e.target.value)}
                                    className="w-full bg-zinc-950 border border-indigo-500 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                ) : (
                                  <>
                                    <p className="text-sm font-semibold text-zinc-100 truncate">{chat.title}</p>
                                    <p className="text-[10px] font-bold text-zinc-600 mt-1 uppercase tracking-wider">
                                      {new Date(chat.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </p>
                                  </>
                                )}
                              </button>

                              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Premium Input Architecture */}
            <div className="p-6 bg-zinc-950 border-t border-zinc-900">
              <div className="relative flex flex-col gap-4">
                {attachedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 pb-2">
                    {attachedFiles.map((file, index) => (
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        key={index}
                        className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl pl-3 pr-2 py-2 group shadow-xl shadow-black/20"
                      >
                        {getFileIcon(file.type)}
                        <span className="text-[11px] font-semibold text-zinc-400 truncate max-w-[120px]">{file.name}</span>
                        <button onClick={() => removeFile(index)} className="p-1 hover:bg-zinc-800 rounded-lg transition-colors ml-1">
                          <X className="w-3.5 h-3.5 text-zinc-500 hover:text-white" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <div className="flex-1 relative flex items-center">
                    <textarea
                      ref={textareaRef}
                      rows={1}
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                          if (textareaRef.current) textareaRef.current.style.height = 'auto';
                        }
                      }}
                      placeholder="Deep-dive into concepts..."
                      className="w-full bg-zinc-900 border border-zinc-800/50 rounded-2xl pl-4 pr-12 py-3.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-all resize-none min-h-[52px] max-h-[180px] leading-relaxed shadow-inner"
                    />
                    <div className="absolute right-3 flex items-center gap-1">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-zinc-600 hover:text-zinc-300 transition-colors"
                        title="Upload context"
                      >
                        <Paperclip className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleSend}
                    disabled={(!input.trim() && attachedFiles.length === 0) || isSending}
                    className="h-[52px] w-[52px] bg-zinc-100 hover:bg-white disabled:bg-zinc-900 disabled:text-zinc-700 text-zinc-950 rounded-2xl flex items-center justify-center transition-all shadow-xl shadow-white/5"
                  >
                    {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </motion.button>
                </div>

                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {['Deconstruct this', 'Synthesize', 'Debug Logic'].map((action) => (
                    <button
                      key={action}
                      onClick={() => setInput(action)}
                      className="px-3.5 py-2 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800/50 rounded-xl text-[10px] font-bold text-zinc-500 uppercase tracking-widest hover:text-zinc-200 transition-all"
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
