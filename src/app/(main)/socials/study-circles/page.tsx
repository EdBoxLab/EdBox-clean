'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Session, AuthChangeEvent } from '@supabase/supabase-js';
import { Users, Plus, MessageCircle, Video, Phone, Search, Send, Sparkles, ArrowLeft, MoreVertical, Share2, UserPlus, Clock, BookOpen, GraduationCap, X, AtSign } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useSearchParams, useRouter } from 'next/navigation';
import posthog from 'posthog-js';

// --- Shared Components for Chat ---

const SharedContentCard = ({ content }: { content: any }) => {
  const router = useRouter();
  const isStudyKit = content.type === 'study-kit';
  
  const handleClick = () => {
    if (isStudyKit && content.id) {
      router.push(`/tools/study-kit?id=${content.id}`);
    }
  };
  
  return (
    <div 
      onClick={handleClick}
      className="mt-2 bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition-colors group cursor-pointer max-w-sm"
    >
      <div className="flex gap-3 p-3">
        <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 bg-blue-500/20 text-blue-400">
          <BookOpen className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-slate-200 truncate">{content.title}</h4>
          <p className="text-xs text-gray-400 line-clamp-1">{content.description || 'Study Kit'}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">
              Study Kit
            </span>
            <span className="text-[10px] font-bold text-blue-400 group-hover:text-blue-300">Tap to Open</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- End Shared Components ---

// Dashboard View Component
const CirclesDashboard = ({ circles, onSelectCircle, onNewCircle, session }: {
  circles: any[];
  onSelectCircle: (circle: any) => void;
  onNewCircle: () => void;
  session: any;
}) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
    const [joinError, setJoinError] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [selectedCircleForInvite, setSelectedCircleForInvite] = useState<any>(null);

    const copyInviteCode = (code: string) => {
      if (!code) return;
      navigator.clipboard.writeText(code);
      alert(`Invite code ${code} copied! Share with others to let them join.`);
    };

    const filteredCircles = circles.filter((c: any) =>

    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsJoining(true);
    setJoinError('');

    try {
      const response = await fetch('/api/study-circles/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_code: inviteCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join circle');
      }

      // Track study circle joined event
      posthog.capture('study_circle_joined', {
        circle_id: data.circle?.id,
        circle_name: data.circle?.name,
        join_method: 'invite_code',
      });

      setShowJoinModal(false);
      setInviteCode('');
      window.location.reload();
    } catch (err: any) {
      setJoinError(err.message);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#2d144d] to-[#1a0b2e] text-slate-200">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-[#1a0b2e]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                {session?.user?.user_metadata?.avatar_url ? (
                  <img src={session.user.user_metadata.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="font-bold text-sm">{session?.user?.email?.[0].toUpperCase()}</span>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Good day,</p>
                <h2 className="text-slate-200 text-lg font-bold leading-tight">
                  {session?.user?.user_metadata?.full_name || 'Student'} ⚡️
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowJoinModal(true)}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-slate-200 pl-3 pr-4 py-2 rounded-full transition-all border border-white/10">
                <UserPlus className="w-5 h-5" />
                <span className="text-sm font-bold">Join</span>
              </button>
              <button
                onClick={onNewCircle}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-slate-200 pl-3 pr-4 py-2 rounded-full transition-all shadow-lg shadow-purple-500/30">
                <Plus className="w-5 h-5" />
                <span className="text-sm font-bold">Create</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 pb-32">
        {/* Live Circles Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              Live Rooms
              <span className="animate-pulse text-red-500 text-[10px] font-black tracking-widest uppercase bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
                Live
              </span>
            </h2>
            <button className="text-purple-400 text-sm font-semibold hover:text-purple-300">See all</button>
          </div>
          <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
            <div className="flex flex-col items-center gap-2 w-20 shrink-0">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center bg-white/5 hover:bg-white/10 hover:border-white/40 transition-all cursor-pointer">
                <Plus className="w-6 h-6 text-slate-200/50" />
              </div>
              <p className="text-slate-200/60 text-xs font-medium text-center">Start Room</p>
            </div>
            {filteredCircles.slice(0, 5).map((circle: any) => (
              <div
                key={circle.id}
                onClick={() => onSelectCircle(circle)}
                className="flex flex-col items-center gap-2 w-20 shrink-0 group cursor-pointer">
                <div className="relative w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-purple-500 to-pink-500">
                  <div className="w-full h-full bg-gradient-to-br from-purple-700 to-purple-900 rounded-full flex items-center justify-center text-2xl font-bold border-2 border-[#1a0b2e]">
                    {circle.name[0]}
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-green-500 text-slate-200 text-[10px] font-bold px-1.5 rounded-full border border-[#1a0b2e] flex items-center gap-0.5">
                    {circle.member_count}
                  </div>
                </div>
                <p className="text-slate-200 text-xs font-medium text-center truncate w-full group-hover:text-purple-400 transition-colors">
                  {circle.name}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Circles Feed */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold">Your Circles</h2>

          {filteredCircles.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-xl font-bold text-gray-400 mb-2">No circles yet</h3>
              <p className="text-gray-500 mb-6">Create your first study circle to get started!</p>
              <button
                onClick={onNewCircle}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-slate-200 px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-purple-500/30">
                <Plus className="w-5 h-5" />
                Create Circle
              </button>
            </div>
          ) : (
            filteredCircles.map((circle: any) => (
              <div key={circle.id} className="relative flex flex-col bg-gradient-to-br from-purple-900/20 to-pink-900/10 rounded-2xl overflow-hidden border border-purple-500/20 shadow-xl hover:border-purple-500/40 transition-all group">
                {/* Header Banner */}
                <div className="relative h-32 bg-gradient-to-r from-purple-600/30 to-pink-600/30 backdrop-blur-sm">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-50"></div>
                  {circle.is_member && (
                    <div className="absolute top-3 right-3 bg-green-500/20 backdrop-blur-md px-3 py-1 rounded-lg border border-green-500/30 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      <span className="text-xs font-bold text-green-300 uppercase tracking-wider">Member</span>
                    </div>
                  )}
                </div>

                {/* Circle Info */}
                <div className="px-6 pb-6 -mt-10 relative z-10 flex flex-col gap-4">
                  <div className="flex items-end justify-between">
                    <div className="flex items-end gap-3">
                        <div className="w-20 h-20 rounded-2xl border-4 border-[#1a0b2e] bg-gradient-to-br from-purple-600 to-pink-600 shadow-2xl flex items-center justify-center text-3xl font-black">
                        {circle.name[0]}
                      </div>
                      <div className="mb-2">
                        <h3 className="text-slate-200 text-xl font-bold leading-tight">{circle.name}</h3>
                        <p className="text-slate-200/50 text-sm font-medium flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {circle.member_count} Members • Invite Only
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCircleForInvite(circle);
                        setShowInviteModal(true);
                      }}
                      className="mb-2 w-9 h-9 flex items-center justify-center rounded-full bg-white/5 text-slate-200/70 hover:bg-white/10 transition-colors">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>

                  {circle.description && (
                    <p className="text-gray-400 text-sm">{circle.description}</p>
                  )}

                  {/* Action Bar */}
                  {circle.is_member ? (
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => onSelectCircle(circle)}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-slate-200 h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/30">
                        <MessageCircle className="w-4 h-4" />
                        Chat
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        fetch(`/api/study-circles/${circle.id}/members`, { method: 'POST' })
                          .then(() => window.location.reload());
                      }}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-slate-200 h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-500/30">
                      <UserPlus className="w-4 h-4" />
                      Join Circle
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </section>
      </div>

      {/* Background Gradient Effects */}
      <div className="fixed top-0 left-0 w-full h-screen pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-20%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] opacity-40"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-pink-600/10 rounded-full blur-[100px] opacity-30"></div>
      </div>

      {/* Join by Code Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-[#1a0b2e]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#1a0b2e] to-purple-900/20 border border-purple-500/20 p-6 rounded-2xl max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 text-slate-200">Join Circle</h2>
            <p className="text-gray-300 mb-4">Enter the invite code shared by your circle admin:</p>
            <form onSubmit={handleJoinByCode} className="space-y-4">
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-slate-200 placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all text-center text-2xl font-bold tracking-widest"
                placeholder="XXXXXXXX"
                maxLength={8}
                required
              />
              {joinError && <p className="text-red-400 text-sm bg-red-500/10 px-3 py-2 rounded-lg">{joinError}</p>}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowJoinModal(false);
                    setInviteCode('');
                    setJoinError('');
                  }}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-slate-200 py-3 rounded-xl font-bold transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isJoining}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-slate-200 py-3 rounded-xl font-bold disabled:opacity-50 transition-all shadow-lg shadow-purple-500/30">
                  {isJoining ? 'Joining...' : 'Join Circle'}
                </button>
              </div>
              </form>
            </div>
          </div>
        )}

        {/* Invite Modal */}
        {showInviteModal && selectedCircleForInvite && (
          <div className="fixed inset-0 bg-[#1a0b2e]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-[#1a0b2e] to-purple-900/20 border border-purple-500/20 p-6 rounded-2xl max-w-md w-full shadow-2xl">
              <h2 className="text-2xl font-bold mb-4 text-slate-200">Share Circle</h2>
              <p className="text-gray-300 mb-4">Share this invite code with others to let them join "{selectedCircleForInvite.name}":</p>
              <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
                <span className="text-2xl font-bold text-purple-400 tracking-widest">{selectedCircleForInvite.invite_code}</span>
                <button
                  onClick={() => copyInviteCode(selectedCircleForInvite.invite_code)}
                  className="bg-purple-600 hover:bg-purple-700 text-slate-200 px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                  Copy
                </button>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="w-full bg-white/5 hover:bg-white/10 text-slate-200 py-3 rounded-xl font-bold transition-colors">
                Close
              </button>
            </div>
          </div>
        )}
      </div>

  );
};

// Chat View Component
const CircleChat = ({ circle, onBack, session }: {
  circle: any;
  onBack: () => void;
  session: any;
}) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<any[]>([]);
  const [userContent, setUserContent] = useState<{ courses: any[], kits: any[] }>({ courses: [], kits: [] });
  const [selectedAttachments, setSelectedAttachments] = useState<any[]>([]);
  const [mentionSearch, setMentionSearch] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!circle) return;
      setIsLoading(true);
      try {
        // Fetch messages
        const msgRes = await fetch(`/api/study-circles/${circle.id}/messages`);
        const msgData = await msgRes.json();
        setMessages(Array.isArray(msgData) ? msgData : []);

        // Fetch members for tagging
        const memRes = await fetch(`/api/study-circles/${circle.id}/members`);
        const memData = await memRes.json();
        setMembers(Array.isArray(memData) ? memData : []);

        // Fetch user's content (kits only)
        const kitsRes = await fetch('/api/study-kit/list');
        const kitsData = await kitsRes.json();
        setUserContent({
          courses: [],
          kits: Array.isArray(kitsData.studyKits) ? kitsData.studyKits : []
        });

      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [circle?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!circle) return;

    const channel = supabase.channel(`realtime:messages:circle=${circle.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `circle_id=eq.${circle.id}`
      }, (payload: any) => {
        setMessages(messages => [...messages, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [circle?.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);

    // Detect @ for mentions
    const cursorPosition = e.target.selectionStart || 0;
    const textBeforeCursor = value.slice(0, cursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

    if (lastAtSymbol !== -1) {
      const search = textBeforeCursor.slice(lastAtSymbol + 1);
      if (!search.includes(' ')) {
        setMentionSearch(search);
        setFilteredMembers(members.filter(m => 
          m.full_name.toLowerCase().includes(search.toLowerCase())
        ));
        setShowMentionSuggestions(true);
        return;
      }
    }
    setShowMentionSuggestions(false);
  };

  const handleMentionSelect = (member: any) => {
    const cursorPosition = inputRef.current?.selectionStart || 0;
    const textBeforeAt = newMessage.slice(0, newMessage.lastIndexOf('@', cursorPosition - 1));
    const textAfterMention = newMessage.slice(cursorPosition);
    const updatedMessage = `${textBeforeAt}@${member.full_name} ${textAfterMention}`;
    
    setNewMessage(updatedMessage);
    setShowMentionSuggestions(false);
    inputRef.current?.focus();
  };

  const toggleAttachment = (item: any, type: 'course' | 'study-kit') => {
    const attachment = { id: item.id, title: item.title, type, description: item.description };
    setSelectedAttachments(prev => {
      const exists = prev.find(a => a.id === item.id);
      if (exists) return prev.filter(a => a.id !== item.id);
      return [...prev, attachment];
    });
  };

  const handlePlusClick = () => {
    console.log("Plus button clicked, current showAttachMenu:", showAttachMenu);
    setShowAttachMenu(!showAttachMenu);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && selectedAttachments.length === 0) return;

    // Extract mentions from text
    const mentions = members
      .filter(m => newMessage.includes(`@${m.full_name}`))
      .map(m => ({ id: m.id, name: m.full_name }));

    try {
      await fetch(`/api/study-circles/${circle.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage,
          username: session?.user?.user_metadata?.full_name || session?.user?.email || 'Anonymous',
          shared_content: selectedAttachments.length > 0 ? selectedAttachments : null,
          mentions: mentions.length > 0 ? mentions : null
        }),
      });

      // Track message sent event
      posthog.capture('message_sent', {
        circle_id: circle.id,
        circle_name: circle.name,
        has_attachments: selectedAttachments.length > 0,
        has_mentions: mentions.length > 0,
        mentions_count: mentions.length,
      });

      setNewMessage('');
      setSelectedAttachments([]);
      setShowAttachMenu(false);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const copyInviteCode = () => {
    if (!circle.invite_code) return;
    navigator.clipboard.writeText(circle.invite_code);
    alert(`Invite code ${circle.invite_code} copied! Share with others to let them join.`);
  };

  if (!circle) return null;

  const renderMessageContent = (content: string, mentions: any[]) => {
    if (!mentions || mentions.length === 0) return content;
    
    let parts = [content];
    mentions.forEach(mention => {
      const mentionText = `@${mention.name}`;
      const newParts: any[] = [];
      parts.forEach(part => {
        if (typeof part !== 'string') {
          newParts.push(part);
          return;
        }
        const split = part.split(mentionText);
        split.forEach((s, i) => {
          newParts.push(s);
          if (i < split.length - 1) {
            newParts.push(<span key={mention.id + i} className="text-purple-300 font-bold">@{mention.name}</span>);
          }
        });
      });
      parts = newParts;
    });
    return parts;
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#1a0b2e] via-[#2d144d] to-[#1a0b2e] text-slate-200 flex flex-col z-50">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 py-3 bg-[#1a0b2e]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 -ml-2 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center font-bold">
            {circle.name[0]}
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight">{circle.name}</h1>
            <span className="text-xs text-purple-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              {circle.member_count} Members {circle.is_admin && '• Admin'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowInviteModal(true)}
            className="w-10 h-10 rounded-full hover:bg-white/10 text-purple-400 transition-colors flex items-center justify-center">
            <Share2 className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Chat Stream */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="flex justify-center">
          <span className="text-xs font-medium text-gray-500 bg-white/5 px-3 py-1 rounded-full">
            Today {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessageCircle className="w-16 h-16 mb-4 text-gray-600" />
            <h3 className="text-xl font-bold text-gray-400 mb-2">No messages yet</h3>
            <p className="text-gray-500">Be the first to start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isUser = msg.user_id === session?.user?.id;
            const isAI = msg.username?.toLowerCase().includes('ai') || msg.username?.toLowerCase().includes('bot');

            return (
              <div key={msg.id || idx} className={`flex items-end gap-3 ${isUser ? 'justify-end' : 'justify-start'} group`}>
                {!isUser && (
                  <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-sm ${isAI
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                      : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                    }`}>
                    {isAI ? <Sparkles className="w-4 h-4" /> : msg.username?.[0]?.toUpperCase()}
                  </div>
                )}

                <div className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'} max-w-[80%]`}>
                  {!isUser && (
                    <div className="flex items-center gap-2 ml-1">
                      <span className="text-xs font-bold text-purple-300">{msg.username}</span>
                      {isAI && (
                        <span className="bg-purple-500/20 text-purple-400 text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                          Bot
                        </span>
                      )}
                    </div>
                  )}

                  <div className={`p-3.5 rounded-2xl text-[15px] leading-relaxed ${isUser
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-slate-200 rounded-br-sm shadow-lg shadow-purple-500/20'
                      : isAI
                        ? 'bg-gradient-to-br from-purple-900/40 to-pink-900/20 border border-purple-500/30 text-slate-300 rounded-bl-sm'
                        : 'bg-white/10 text-slate-300 rounded-bl-sm'
                    }`}>
                    {renderMessageContent(msg.content, msg.mentions)}
                    
                    {msg.shared_content && msg.shared_content.map((content: any, cidx: number) => (
                      <SharedContentCard key={cidx} content={content} />
                    ))}
                  </div>

                  <span className={`text-[10px] text-gray-400 ${isUser ? 'mr-1' : 'ml-1'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {isUser && (
                  <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-sm">
                    {session?.user?.email?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Mention Suggestions Popup */}
      {showMentionSuggestions && filteredMembers.length > 0 && (
        <div className="mx-4 mb-2 bg-[#2d144d] border border-white/10 rounded-xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          <div className="p-2 border-b border-white/5 bg-white/5 flex items-center gap-2">
            <AtSign className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Mention Member</span>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredMembers.map(member => (
              <button
                key={member.id}
                onClick={() => handleMentionSelect(member)}
                className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0"
              >
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-300">
                  {member.full_name[0]}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-200">{member.full_name}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Attachment Selection Menu */}
      {showAttachMenu && (
        <div className="mx-4 mb-2 bg-[#2d144d] border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          <div className="p-3 border-b border-white/10 bg-white/5 flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2">
              <Share2 className="w-4 h-4 text-purple-400" />
              Share Content
            </h3>
            <button onClick={() => setShowAttachMenu(false)} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 grid grid-cols-1 gap-6 max-h-80 overflow-y-auto">
              {/* Study Kits Section */}
            <div>
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5" />
                Study Kits
              </h4>
              <div className="space-y-2">
                {userContent.kits.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">No study kits created yet.</p>
                ) : (
                  userContent.kits.map(kit => (
                    <div 
                      key={kit.id}
                      onClick={() => toggleAttachment(kit, 'study-kit')}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                        selectedAttachments.find(a => a.id === kit.id)
                          ? 'bg-blue-500/20 border-blue-500/50'
                          : 'bg-white/5 border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{kit.title}</p>
                        <p className="text-[10px] text-gray-500">Study Kit</p>
                      </div>
                      {selectedAttachments.find(a => a.id === kit.id) && <Plus className="w-4 h-4 text-blue-400 rotate-45" />}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Send Button for Sharing Menu */}
            {selectedAttachments.length > 0 && (
              <div className="sticky bottom-0 pt-4 bg-[#2d144d] border-t border-white/10 mt-2">
                <button
                  onClick={handleSendMessage}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-slate-200 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/30"
                >
                  <Send className="w-4 h-4" />
                  Send {selectedAttachments.length} {selectedAttachments.length === 1 ? 'Item' : 'Items'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected Attachments Preview */}
      {selectedAttachments.length > 0 && !showAttachMenu && (
        <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar">
          {selectedAttachments.map(a => (
            <div key={a.id} className="shrink-0 flex items-center gap-2 bg-purple-500/20 border border-purple-500/30 px-3 py-1.5 rounded-full">
              <span className="text-xs font-bold text-purple-300">{a.title}</span>
              <button onClick={() => toggleAttachment(a, a.type)}>
                <X className="w-3 h-3 text-purple-400" />
              </button>
            </div>
          ))}
        </div>
      )}

        {/* Bottom Input Area */}
        <footer className="p-4 border-t border-white/5 bg-[#1a0b2e]/80 backdrop-blur-xl">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePlusClick}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                showAttachMenu ? 'bg-purple-600 text-white' : 'text-gray-400 bg-white/10 hover:bg-white/20'
              }`}>
              <Plus className="w-5 h-5" />
            </button>

          <div className="flex-1 bg-white/10 border border-white/10 rounded-3xl px-4 py-2 flex items-center focus-within:border-purple-500/50 focus-within:ring-1 focus-within:ring-purple-500/50 transition-all">
            <input
              ref={inputRef}
              className="bg-transparent border-none focus:ring-0 w-full text-base placeholder-gray-500 text-slate-200 p-0 h-10"
              placeholder="Ask AI or chat..."
              type="text"
              value={newMessage}
              onChange={handleInputChange}
            />
            <button
              type="button"
              className="p-1.5 rounded-full hover:bg-white/10 text-purple-400 transition-colors">
              <Sparkles className="w-5 h-5" />
            </button>
          </div>

          <button
            type="submit"
            className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-slate-200 shadow-lg shadow-purple-500/30 flex items-center justify-center transition-all active:scale-95">
            <Send className="w-5 h-5" />
          </button>
        </form>
      </footer>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-[#1a0b2e]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#1a0b2e] to-purple-900/20 border border-purple-500/20 p-6 rounded-2xl max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 text-slate-200">Share Circle</h2>
            <p className="text-gray-300 mb-4">Share this invite code with others to let them join your circle:</p>
            <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
              <span className="text-2xl font-bold text-purple-400 tracking-widest">{circle.invite_code}</span>
              <button
                onClick={copyInviteCode}
                className="bg-purple-600 hover:bg-purple-700 text-slate-200 px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                Copy
              </button>
            </div>
            <button
              onClick={() => setShowInviteModal(false)}
              className="w-full bg-white/5 hover:bg-white/10 text-slate-200 py-3 rounded-xl font-bold transition-colors">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Create Circle Modal
const CreateCircleModal = ({ onClose, onCircleCreated, session }: {
  onClose: () => void;
  onCircleCreated: (circle: any) => void;
  session: any;
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Prevent unauthenticated users from attempting to create a circle
    if (!session || !session.user || !session.user.id) {
      setError('You must be signed in to create a circle.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/study-circles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to create circle');
      }

      const newCircle = await response.json();

      // Track study circle created event
      posthog.capture('study_circle_created', {
        circle_id: newCircle.id,
        circle_name: name,
        has_description: !!description,
      });

      onCircleCreated(newCircle);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#1a0b2e]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#1a0b2e] to-purple-900/20 border border-purple-500/20 p-6 rounded-2xl max-w-md w-full shadow-2xl">
        <h2 className="text-2xl font-bold mb-6 text-slate-200">Create Study Circle</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Circle Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-slate-200 placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all"
              placeholder="e.g., Physics 101"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-slate-200 placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all"
              rows={3}
              placeholder="What's this circle about?"
              required
            />
          </div>
          {error && <p className="text-red-400 text-sm bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-bold transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !session || !session.user || !session.user.id}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-bold disabled:opacity-50 transition-all shadow-lg shadow-purple-500/30">
              {isLoading ? 'Creating...' : 'Create Circle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Component with Suspense wrapper for useSearchParams
function StudyCirclesContent() {
  const [circles, setCircles] = useState<any[]>([]);
  const [selectedCircle, setSelectedCircle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  const searchParams = useSearchParams();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => setSession(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setSession(session);
    });


    return () => subscription.unsubscribe();
  }, []);

  const fetchCircles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/study-circles');
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      setCircles(data);

      const inviteId = searchParams.get('id');
      if (inviteId) {
        const targetCircle = data.find((c: any) => c.id === parseInt(inviteId));
        if (targetCircle) {
          setSelectedCircle(targetCircle);
        }
      }
    } catch (error) {
      console.error("Failed to fetch circles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCircles();

    const channel = supabase.channel('realtime:circles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'study_circles' }, fetchCircles)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'circle_members' }, fetchCircles)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCircleCreated = (newCircle: any) => {
    const circleWithDetails = { ...newCircle, member_count: 1, is_member: true };
    setCircles(prev => [circleWithDetails, ...prev]);
    setSelectedCircle(circleWithDetails);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-[#1a0b2e] via-[#2d144d] to-[#1a0b2e]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          <p className="text-gray-400">Loading circles...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {selectedCircle ? (
        <CircleChat
          circle={selectedCircle}
          onBack={() => setSelectedCircle(null)}
          session={session}
        />
      ) : (
        <CirclesDashboard
          circles={circles}
          onSelectCircle={setSelectedCircle}
          onNewCircle={() => setIsModalOpen(true)}
          session={session}
        />
      )}

      {isModalOpen && (
        <CreateCircleModal
          onClose={() => setIsModalOpen(false)}
          onCircleCreated={handleCircleCreated}
          session={session}
        />
      )}
    </>
  );
}

export default function StudyCirclesPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-[#1a0b2e] via-[#2d144d] to-[#1a0b2e]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    }>
      <StudyCirclesContent />
    </Suspense>
  );
}