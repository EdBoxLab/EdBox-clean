'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Mic, MicOff, X, Sparkles, User, Bot, Plus, MessageSquare, Loader2, Trash2, Edit2, Check, Paperclip, File, Image as ImageIcon, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

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
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        content: "Hey there! 👋 I'm Genie, your AI study buddy! I know all about your study sets, notes, and courses. Ask me anything - let's ace this together!\n\n💡 You can also upload files (PDF, images, documents) and I'll help you understand them!",
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
      content: "Hey there! 👋 I'm Genie, your AI study buddy! I know all about your study sets, notes, and courses. Ask me anything - let's ace this together!\n\n💡 You can also upload files (PDF, images, documents) and I'll help you understand them!",
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

    // Validate file types and sizes
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
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!validTypes.includes(file.type)) {
        alert(`${file.name} is not a supported file type`);
        return false;
      }
      if (file.size > maxSize) {
        alert(`${file.name} is too large (max 10MB)`);
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
        // For images, convert to base64
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
        
        // For text/PDFs, read as text or base64
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

    const userMsgContent = input || '📎 Sent files';
    const currentFiles = [...attachedFiles];
    
    setInput('');
    setAttachedFiles([]);
    setIsSending(true);
    setIsProcessingFiles(currentFiles.length > 0);

    // Optimistic update
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
      // Process files if any
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
      // Show error message
      const errorMsg: Message = {
        id: Date.now().toString() + 'error',
        role: 'assistant',
        content: '❌ Sorry, something went wrong. Please try again.',
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

  const currentChatTitle = chats.find(c => c.id === currentChatId)?.title || 'New Chat';

  return (
    <>
      {/* Floating AI Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          data-tour="step-genie"
          className="group fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 flex items-center gap-2 px-4 py-3 sm:px-5 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-full shadow-lg shadow-indigo-900/30 transition-all hover:scale-105"
        >
          <Sparkles className="w-5 h-5 text-white animate-pulse" />
          <span className="font-semibold text-white text-sm hidden sm:inline">AI Chat</span>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
        </button>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.txt,.doc,.docx"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Chat Interface - Full Screen on Mobile */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-4 sm:right-4 sm:w-[420px] sm:h-[600px] sm:rounded-2xl z-50 bg-zinc-900/98 backdrop-blur-xl border-0 sm:border sm:border-zinc-700/50 shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600/95 to-purple-600/95 backdrop-blur-sm p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button
                onClick={() => setShowChatList(!showChatList)}
                className="p-2 hover:bg-white/20 rounded-lg transition shrink-0"
                title="Chat history"
              >
                <MessageSquare className="w-5 h-5 text-white" />
              </button>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-white text-base truncate">{currentChatTitle}</h3>
                <p className="text-xs text-indigo-100/90">Genie - Your Study Buddy</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={startNewChat}
                className="p-2 hover:bg-white/20 rounded-lg transition"
                title="New chat"
              >
                <Plus className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition"
                title="Close"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Chat List Sidebar */}
          {showChatList && (
            <div className="absolute top-[72px] left-0 right-0 sm:right-auto sm:w-80 bg-zinc-900/98 backdrop-blur-xl border-b sm:border-r border-zinc-700/50 z-10 max-h-[70vh] sm:max-h-96 overflow-y-auto shadow-2xl">
              <div className="p-3 border-b border-zinc-800 bg-zinc-800/50">
                <h4 className="text-sm font-semibold text-white">Chat History</h4>
                <p className="text-xs text-zinc-400 mt-0.5">{chats.length} conversation{chats.length !== 1 ? 's' : ''}</p>
              </div>
              
              {isLoadingChats ? (
                <div className="p-6 text-center">
                  <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mx-auto" />
                  <p className="text-xs text-zinc-500 mt-2">Loading chats...</p>
                </div>
              ) : chats.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 text-zinc-700 mx-auto mb-2" />
                  <p className="text-sm text-zinc-400">No chats yet</p>
                  <p className="text-xs text-zinc-600 mt-1">Start a conversation with Genie!</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-800/50">
                  {chats.map(chat => (
                    <div
                      key={chat.id}
                      className={`group relative hover:bg-zinc-800/50 transition ${
                        chat.id === currentChatId ? 'bg-zinc-800/70' : ''
                      }`}
                    >
                      <button
                        onClick={() => { setCurrentChatId(chat.id); setShowChatList(false); }}
                        className="w-full p-3 pr-20 text-left"
                      >
                        {editingChatId === chat.id ? (
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full bg-zinc-800 border border-indigo-500 rounded px-2 py-1 text-sm text-white focus:outline-none"
                            autoFocus
                          />
                        ) : (
                          <>
                            <p className="text-sm font-medium text-white truncate pr-2">{chat.title}</p>
                            <p className="text-xs text-zinc-500 mt-1">
                              {new Date(chat.created_at).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: new Date(chat.created_at).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                              })}
                            </p>
                          </>
                        )}
                      </button>
                      
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {editingChatId === chat.id ? (
                          <button
                            onClick={(e) => saveRename(chat.id, e)}
                            className="p-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-md transition"
                            title="Save"
                          >
                            <Check className="w-3.5 h-3.5 text-white" />
                          </button>
                        ) : (
                          <button
                            onClick={(e) => startRenameChat(chat, e)}
                            className="p-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-md transition"
                            title="Rename"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-white" />
                          </button>
                        )}
                        <button
                          onClick={(e) => deleteChat(chat.id, e)}
                          className="p-1.5 bg-red-600/90 hover:bg-red-600 rounded-md transition"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${message.role === 'user'
                  ? 'bg-indigo-600'
                  : 'bg-gradient-to-br from-purple-600 to-indigo-600'
                  }`}>
                  {message.role === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-white" />
                  )}
                </div>

                <div className={`max-w-[80%] sm:max-w-[85%]`}>
                  <div className={`${message.role === 'user'
                    ? 'bg-indigo-600/90 text-white'
                    : 'bg-zinc-800/90 text-zinc-100 border border-zinc-700/50'
                    } backdrop-blur-sm rounded-2xl px-4 py-2.5`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    
                    {/* Show attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
                        {message.attachments.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs opacity-80">
                            {getFileIcon(file.type)}
                            <span className="truncate">{file.name}</span>
                            <span className="text-[10px]">({formatFileSize(file.size)})</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-[10px] opacity-60 mt-1.5 text-right">
                      {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="bg-zinc-800/90 backdrop-blur-sm border border-zinc-700/50 rounded-2xl px-4 py-2.5">
                  {isProcessingFiles ? (
                    <p className="text-xs text-zinc-400">Processing files...</p>
                  ) : (
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  )}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* File Preview Area */}
          {attachedFiles.length > 0 && (
            <div className="px-4 py-2 bg-zinc-800/50 border-t border-zinc-700/50 max-h-32 overflow-y-auto">
              <div className="flex flex-wrap gap-2">
                {attachedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-700/50 rounded-lg px-3 py-2 text-xs group"
                  >
                    {getFileIcon(file.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-white truncate max-w-[150px]">{file.name}</p>
                      <p className="text-zinc-500 text-[10px]">{formatFileSize(file.size)}</p>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 hover:bg-zinc-700 rounded transition opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3 h-3 text-zinc-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 bg-zinc-900/98 backdrop-blur-sm border-t border-zinc-700/50 shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-lg transition shrink-0 bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
                title="Attach files"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsVoiceMode(!isVoiceMode)}
                className={`p-2.5 rounded-lg transition shrink-0 ${isVoiceMode
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
              >
                {isVoiceMode ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {isVoiceMode ? (
                <div className="flex-1 flex items-center justify-center gap-2 bg-zinc-800/90 backdrop-blur-sm rounded-lg px-4 py-2.5">
                  <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-zinc-600'}`} />
                  <span className="text-xs text-zinc-400">Voice mode active (demo)</span>
                </div>
              ) : (
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={attachedFiles.length > 0 ? `Ask about ${attachedFiles.length} file(s)...` : "Ask me anything..."}
                  className="flex-1 bg-zinc-800/90 backdrop-blur-sm border border-zinc-700/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition"
                />
              )}

              <button
                onClick={handleSend}
                disabled={(!input.trim() && attachedFiles.length === 0) || isSending}
                className="p-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-zinc-700 disabled:to-zinc-700 disabled:cursor-not-allowed rounded-lg transition shrink-0"
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
              </button>
            </div>

            <div className="hidden sm:flex gap-2 mt-3 overflow-x-auto no-scrollbar">
              {['Explain this concept', 'Summarize my notes', 'Create a quiz'].map((action) => (
                <button
                  key={action}
                  onClick={() => setInput(action)}
                  className="px-3 py-1.5 bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700/50 rounded-full text-xs text-zinc-300 whitespace-nowrap transition"
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