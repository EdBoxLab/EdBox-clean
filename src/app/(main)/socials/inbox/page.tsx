'use client';

import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, Loader2, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  read: boolean;
  created_at: string;
}

interface Conversation {
  userId: string;
  lastMessage: Message;
  unreadCount: number;
}

export default function InboxPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);

  useEffect(() => {
    loadConversations();
    // Get current user id from supabase
    const checkUser = async () => {
      const { data: { user } } = await fetch('/api/auth/me').then(res => res.json()).catch(() => ({ data: { user: null } }));
      if (user) setCurrentUserId(user.id);
    };
    checkUser();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
      if (window.innerWidth < 768) {
        setShowMobileChat(true);
      }
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/messages');
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (userId: string) => {
    try {
      const res = await fetch(`/api/messages?with=${userId}`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;

    try {
      setSending(true);
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: selectedConversation,
          message: newMessage,
        }),
      });

      if (res.ok) {
        setNewMessage('');
        await loadMessages(selectedConversation);
        await loadConversations();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 h-[calc(100vh-80px)] md:h-[calc(100vh-120px)] flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mb-6 ${showMobileChat ? 'hidden md:block' : 'block'}`}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white">Messages</h1>
            <p className="text-gray-400 mt-1 text-sm md:text-base">Connect with your circle members</p>
          </div>
        </div>
      </motion.div>

      <div className="flex-1 flex flex-col md:grid md:grid-cols-3 gap-4 min-h-0">
        <div className={`${showMobileChat ? 'hidden' : 'flex'} md:flex md:col-span-1 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex-col overflow-hidden`}>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 shrink-0">
            <MessageCircle className="w-5 h-5" />
            Conversations
          </h2>

          <div className="flex-1 overflow-y-auto min-h-0">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : conversations.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No conversations yet</p>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <button
                    key={conv.userId}
                    onClick={() => setSelectedConversation(conv.userId)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      selectedConversation === conv.userId
                        ? 'bg-blue-600/20 border border-blue-500/50'
                        : 'bg-zinc-800/50 hover:bg-zinc-800 border border-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">User {conv.userId.slice(0, 8)}</p>
                        <p className="text-sm text-gray-400 truncate">{conv.lastMessage.message}</p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="ml-2 bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={`${showMobileChat ? 'flex' : 'hidden'} md:flex md:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-xl flex-col overflow-hidden`}>
          {selectedConversation ? (
            <>
              <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
                <button
                  onClick={() => setShowMobileChat(false)}
                  className="md:hidden p-2 -ml-2 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <h2 className="text-lg font-semibold text-white truncate">
                  Chat with User {selectedConversation.slice(0, 8)}
                </h2>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence>
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[70%] p-3 rounded-lg break-words overflow-wrap-anywhere ${
                          msg.sender_id === currentUserId
                            ? 'bg-blue-600 text-white'
                            : 'bg-zinc-800 text-gray-100'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        <p className="text-[10px] opacity-70 mt-1">
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="p-4 border-t border-zinc-800 bg-zinc-900/80">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="flex-1 bg-zinc-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white p-2 sm:px-4 sm:py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    {sending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span className="hidden sm:inline">Send</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center p-6">
                <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
