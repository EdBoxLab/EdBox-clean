'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Session, AuthChangeEvent } from '@supabase/supabase-js';
import { Users, Plus, MessageCircle, Video, Phone, Search, Send, Sparkles, ArrowLeft, MoreVertical, Share2, UserPlus, Clock, BookOpen, GraduationCap, X, AtSign, Link, Copy, Check, Hash, Settings, ChevronDown, Menu } from 'lucide-react';
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
        className="mt-2 bg-[#1e1f22] border border-[#2b2d31] rounded-xl overflow-hidden hover:bg-[#35373c] transition-colors group cursor-pointer max-w-full sm:max-w-sm"
      >

      <div className="flex gap-3 p-3">
        <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 bg-[#5865f2]/10 text-[#5865f2]">
          <BookOpen className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-gray-100 truncate">{content.title}</h4>
          <p className="text-xs text-gray-400 line-clamp-1">{content.description || 'Study Kit'}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#5865f2]/20 text-[#5865f2]">
              Study Kit
            </span>
            <span className="text-[10px] font-bold text-[#5865f2] group-hover:text-blue-300">Tap to Open</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- End Shared Components ---

// Share Circle Modal with Link/Code Options
const ShareCircleModal = ({ circle, onClose }: { circle: any; onClose: () => void }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  const shareLink = `${baseUrl.replace(/\/$/, '')}/socials/study-circles?join=${circle.invite_code}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(circle.invite_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-[#313338] border border-[#1e1f22] rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-[#1e1f22]">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Share "{circle.name}"</h2>
            <button onClick={onClose} className="p-2 hover:bg-[#3f4147] rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <p className="text-gray-400 text-sm mt-2">Choose how you want to share this circle</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-[#2b2d31] border border-[#1e1f22] rounded-xl p-4 hover:bg-[#35373c] transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#5865f2]/10 flex items-center justify-center">
                <Link className="w-5 h-5 text-[#5865f2]" />
              </div>
              <div>
                <h3 className="font-bold text-white">Share by Link</h3>
                <p className="text-xs text-gray-400">Anyone with this link can join instantly</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={shareLink}
                readOnly
                className="flex-1 bg-[#1e1f22] border border-[#1e1f22] rounded-lg px-3 py-2 text-sm text-gray-300 truncate outline-none focus:border-[#5865f2]/50"
              />
              <button
                onClick={copyLink}
                className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${
                  copiedLink 
                    ? 'bg-green-500 text-white' 
                    : 'bg-[#5865f2] hover:bg-[#4752c4] text-white'
                }`}
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedLink ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="bg-[#2b2d31] border border-[#1e1f22] rounded-xl p-4 hover:bg-[#35373c] transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Hash className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">Share by Code</h3>
                <p className="text-xs text-gray-400">Share the code for manual entry</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-[#1e1f22] border border-[#1e1f22] rounded-lg px-4 py-2 text-center">
                <span className="text-2xl font-black text-purple-400 tracking-[0.3em]">{circle.invite_code}</span>
              </div>
              <button
                onClick={copyCode}
                className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${
                  copiedCode 
                    ? 'bg-green-500 text-white' 
                    : 'bg-purple-600 hover:bg-purple-500 text-white'
                }`}
              >
                {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedCode ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 bg-[#2b2d31] border-t border-[#1e1f22]">
          <button
            onClick={onClose}
            className="w-full py-3 bg-[#3f4147] hover:bg-[#4e5058] rounded-xl font-bold transition-colors text-white"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

// Dashboard View Component
const CirclesDashboard = ({ circles, onSelectCircle, onNewCircle, session }: {
  circles: any[];
  onSelectCircle: (circle: any) => void;
  onNewCircle: () => void;
  session: any;
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedCircleForInvite, setSelectedCircleForInvite] = useState<any>(null);

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
    <div className="min-h-screen bg-[#313338] text-[#dbdee1]">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-[#313338]/95 backdrop-blur-sm border-b border-[#1e1f22]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#5865f2] flex items-center justify-center shadow-lg">
                {session?.user?.user_metadata?.avatar_url ? (
                  <img src={session.user.user_metadata.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="font-bold text-white">{session?.user?.email?.[0].toUpperCase()}</span>
                )}
              </div>
              <div className="hidden sm:block">
                <p className="text-[10px] text-[#949ba4] font-bold uppercase tracking-wider">Student Profile</p>
                <h2 className="text-white text-base font-bold leading-tight">
                  {session?.user?.user_metadata?.full_name || 'Student'} ⚡️
                </h2>
              </div>
            </div>
            
            <div className="flex-1 max-w-md mx-6 hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#949ba4]" />
                <input 
                  type="text" 
                  placeholder="Find a circle..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#1e1f22] border border-transparent focus:border-[#5865f2]/50 rounded-xl py-2 pl-10 pr-4 text-sm outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowJoinModal(true)}
                className="flex items-center gap-2 bg-[#35373c] hover:bg-[#3f4147] text-white px-4 py-2 rounded-xl transition-all font-bold text-sm border border-transparent">
                <UserPlus className="w-4 h-4" />
                Join
              </button>
              <button
                onClick={onNewCircle}
                className="flex items-center gap-2 bg-[#5865f2] hover:bg-[#4752c4] text-white px-4 py-2 rounded-xl transition-all font-bold text-sm shadow-lg shadow-[#5865f2]/20">
                <Plus className="w-4 h-4" />
                Create
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Live Rooms - Simplified */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#949ba4]">Live Rooms</h2>
            <div className="h-px flex-1 bg-[#1e1f22]" />
          </div>
          <div className="flex overflow-x-auto gap-6 pb-4 no-scrollbar">
            <button 
              onClick={onNewCircle}
              className="flex flex-col items-center gap-3 group">
              <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-[#4e5058] flex items-center justify-center bg-[#2b2d31] group-hover:bg-[#35373c] group-hover:border-[#5865f2]/50 transition-all">
                <Plus className="w-6 h-6 text-[#949ba4] group-hover:text-[#5865f2]" />
              </div>
              <p className="text-[#949ba4] text-[11px] font-bold group-hover:text-white uppercase tracking-tighter">New Room</p>
            </button>
            {filteredCircles.slice(0, 8).map((circle: any) => (
              <div
                key={circle.id}
                onClick={() => onSelectCircle(circle)}
                className="flex flex-col items-center gap-3 group cursor-pointer">
                <div className="relative w-16 h-16 rounded-2xl bg-[#5865f2] flex items-center justify-center text-2xl font-black text-white shadow-lg group-hover:scale-105 transition-all">
                  {circle.name[0]}
                  <div className="absolute -top-1 -right-1 bg-[#23a559] text-[9px] font-bold px-1.5 py-0.5 rounded-full border-2 border-[#313338] text-white">
                    {circle.member_count}
                  </div>
                </div>
                <p className="text-[#dbdee1] text-[11px] font-bold truncate w-20 text-center group-hover:text-white uppercase tracking-tighter">
                  {circle.name}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Circles Feed - Clean Discord-like Cards */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#949ba4]">Your Circles</h2>
            <div className="h-px flex-1 bg-[#1e1f22]" />
          </div>

          {filteredCircles.length === 0 ? (
            <div className="text-center py-20 bg-[#2b2d31] rounded-3xl border border-[#1e1f22]">
              <div className="w-20 h-20 bg-[#313338] rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-[#4e5058]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Join the Community</h3>
              <p className="text-[#949ba4] mb-8 max-w-sm mx-auto">Discover study circles or create your own to start collaborating with peers.</p>
              <button
                onClick={onNewCircle}
                className="bg-[#5865f2] hover:bg-[#4752c4] text-white px-8 py-3 rounded-xl font-bold transition-all">
                Create First Circle
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCircles.map((circle: any) => (
                <div 
                  key={circle.id} 
                  className="bg-[#2b2d31] rounded-2xl border border-[#1e1f22] overflow-hidden hover:bg-[#313338] transition-all group flex flex-col h-full shadow-lg hover:border-[#5865f2]/30"
                >
                  <div className="p-6 flex-1">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-[#1e1f22] border border-[#2b2d31] flex items-center justify-center text-2xl font-black text-[#5865f2] group-hover:bg-[#5865f2] group-hover:text-white transition-all">
                        {circle.name[0]}
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCircleForInvite(circle);
                          setShowInviteModal(true);
                        }}
                        className="p-2 hover:bg-[#3f4147] rounded-xl text-[#949ba4] hover:text-white transition-colors"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-white group-hover:text-[#5865f2] transition-colors">{circle.name}</h3>
                        {circle.is_member && (
                          <span className="text-[9px] font-black bg-[#23a559]/20 text-[#23a559] px-2 py-0.5 rounded uppercase border border-[#23a559]/30">Member</span>
                        )}
                      </div>
                      <p className="text-[#949ba4] text-sm line-clamp-2 leading-relaxed">
                        {circle.description || 'Join this study circle to collaborate on projects and share knowledge.'}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center gap-4 text-[11px] font-bold text-[#4e5058] uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        <span>{circle.member_count} Members</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>Active Now</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-[#1e1f22]/50 border-t border-[#1e1f22]">
                    {circle.is_member ? (
                      <button
                        onClick={() => onSelectCircle(circle)}
                        className="w-full bg-[#5865f2] hover:bg-[#4752c4] text-white py-2.5 rounded-xl font-bold text-sm transition-all"
                      >
                        Launch Circle
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          fetch(`/api/study-circles/${circle.id}/members`, { method: 'POST' })
                            .then(() => window.location.reload());
                        }}
                        className="w-full bg-[#35373c] hover:bg-[#3f4147] text-white py-2.5 rounded-xl font-bold text-sm transition-all"
                      >
                        Join Now
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Join by Code Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-[#313338] border border-[#1e1f22] p-8 rounded-3xl max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold mb-2 text-white text-center">Join Circle</h2>
            <p className="text-[#949ba4] text-sm text-center mb-8">Enter the unique 8-character invite code.</p>
            <form onSubmit={handleJoinByCode} className="space-y-6">
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="w-full bg-[#1e1f22] border border-[#2b2d31] rounded-2xl px-4 py-4 text-white placeholder-[#4e5058] focus:border-[#5865f2] outline-none transition-all text-center text-3xl font-black tracking-[0.2em]"
                placeholder="INV-CODE"
                maxLength={8}
                required
              />
              {joinError && <p className="text-[#ed4245] text-xs font-bold text-center bg-[#ed4245]/10 py-2 rounded-lg">{joinError}</p>}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowJoinModal(false);
                    setInviteCode('');
                    setJoinError('');
                  }}
                  className="flex-1 bg-[#35373c] hover:bg-[#3f4147] text-white py-3.5 rounded-xl font-bold transition-all">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isJoining}
                  className="flex-1 bg-[#5865f2] hover:bg-[#4752c4] text-white py-3.5 rounded-xl font-bold disabled:opacity-50 transition-all shadow-lg shadow-[#5865f2]/20">
                  {isJoining ? 'Joining...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showInviteModal && selectedCircleForInvite && (
        <ShareCircleModal 
          circle={selectedCircleForInvite} 
          onClose={() => setShowInviteModal(false)} 
        />
      )}
    </div>
  );
};

// Chat View Component - Updated to Discord-like Theme
// Chat View Component - Updated to Discord-like Theme with Mobile Responsiveness
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
  const [isLeaving, setIsLeaving] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleLeaveCircle = async () => {
    if (!window.confirm('Are you sure you want to leave this circle?')) return;
    
    setIsLeaving(true);
    try {
      const response = await fetch(`/api/study-circles/${circle.id}/members`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to leave circle');
      }

      posthog.capture('study_circle_left', {
        circle_id: circle.id,
        circle_name: circle.name,
      });

      onBack();
      window.location.reload();
    } catch (error) {
      console.error('Error leaving circle:', error);
      alert('Failed to leave circle. Please try again.');
    } finally {
      setIsLeaving(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!circle) return;
      setIsLoading(true);
      try {
        const msgRes = await fetch(`/api/study-circles/${circle.id}/messages`);
        const msgData = await msgRes.json();
        setMessages(Array.isArray(msgData) ? msgData : []);

        const memRes = await fetch(`/api/study-circles/${circle.id}/members`);
        const memData = await memRes.json();
        setMembers(Array.isArray(memData) ? memData : []);

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && selectedAttachments.length === 0) return;

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

      posthog.capture('message_sent', {
        circle_id: circle.id,
        circle_name: circle.name,
      });

      setNewMessage('');
      setSelectedAttachments([]);
      setShowAttachMenu(false);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

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
            newParts.push(
              <span 
                key={mention.id + i} 
                className="bg-[#5865f2]/20 text-[#5865f2] px-1 rounded font-bold cursor-pointer hover:bg-[#5865f2] hover:text-white transition-colors"
              >
                @{mention.name}
              </span>
            );
          }
        });
      });
      parts = newParts;
    });
    return parts;
  };

  return (
    <div className="fixed inset-0 bg-[#313338] text-[#dbdee1] flex z-50">
      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}

      {/* Discord-style Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#2b2d31] flex flex-col border-r border-[#1e1f22] transition-transform duration-300 ease-in-out
        ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="h-14 px-4 flex items-center justify-between border-b border-[#1e1f22] shadow-sm">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-1.5 hover:bg-[#3f4147] rounded-lg transition-colors text-gray-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-white truncate text-sm uppercase tracking-wide">{circle.name}</h2>
          </div>
          <button 
            onClick={() => setShowMobileSidebar(false)}
            className="md:hidden p-1.5 hover:bg-[#3f4147] rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 border-b border-[#1e1f22]">
          <div className="flex items-center gap-2 text-[#949ba4] text-xs font-black uppercase tracking-widest">
            <Hash className="w-4 h-4" />
            <span>general</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
          <div className="text-[10px] font-black uppercase tracking-[0.15em] text-[#949ba4] px-2 py-3">
            Online — {members.length}
          </div>
          <div className="space-y-0.5">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[#35373c] cursor-pointer group transition-colors">
                <div className="relative shrink-0">
                  <div className="w-8 h-8 rounded-full bg-[#5865f2] flex items-center justify-center text-xs font-bold text-white shadow-lg group-hover:scale-105 transition-transform">
                    {member.full_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#23a559] border-2 border-[#2b2d31] rounded-full"></div>
                </div>
                <span className="text-sm font-medium text-[#949ba4] group-hover:text-white truncate transition-colors">
                  {member.full_name || 'Member'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-[#232428] border-t border-[#1e1f22]">
          <button
            onClick={handleLeaveCircle}
            disabled={isLeaving}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#ed4245]/10 hover:bg-[#ed4245] text-[#ed4245] hover:text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            <ArrowLeft className="w-4 h-4 rotate-180" />
            {isLeaving ? 'Leaving...' : 'Leave Circle'}
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#313338]">
        <header className="h-14 px-4 flex items-center justify-between border-b border-[#1e1f22] bg-[#313338]/95 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-2 min-w-0">
            <button 
              onClick={() => setShowMobileSidebar(true)} 
              className="md:hidden p-2 hover:bg-[#3f4147] rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Hash className="w-5 h-5 text-[#80848e] shrink-0" />
            <span className="font-bold text-white truncate">general</span>
            <div className="hidden sm:block h-6 w-px bg-[#3f4147] mx-2 shrink-0"></div>
            <span className="hidden lg:block text-sm text-[#949ba4] truncate font-medium">
              {circle.description || 'Study circle chat hub'}
            </span>
          </div>
          
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setShowInviteModal(true)}
              className="p-2 hover:bg-[#3f4147] rounded-lg transition-colors text-[#b5bac1] hover:text-white group relative"
              title="Invite Members"
            >
              <UserPlus className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setShowMobileSidebar(true)}
              className="p-2 hover:bg-[#3f4147] rounded-lg transition-colors text-[#b5bac1] hover:text-white md:hidden"
            >
              <Users className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 scroll-smooth custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#5865f2] mb-4"></div>
              <p className="text-[#949ba4] text-xs font-bold uppercase tracking-widest">Syncing Hub...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="w-24 h-24 rounded-[2rem] bg-[#5865f2] flex items-center justify-center mb-8 shadow-2xl shadow-[#5865f2]/30 rotate-3">
                <MessageCircle className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-3xl sm:text-4xl font-black text-white mb-3 tracking-tight">Welcome to #{circle.name}!</h3>
              <p className="text-[#949ba4] max-w-sm text-lg leading-relaxed font-medium">
                This is the beginning of your study journey. Type a message to start collaborating!
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {messages.map((msg, idx) => {
                const isUser = msg.user_id === session?.user?.id;
                const isAI = msg.username?.toLowerCase().includes('ai') || msg.username?.toLowerCase().includes('bot');
                const prevMsg = messages[idx - 1];
                const showHeader = !prevMsg || prevMsg.user_id !== msg.user_id || 
                  (new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 5 * 60 * 1000);

                return (
                  <div 
                    key={msg.id || idx} 
                    className={`group hover:bg-[#2e3035] rounded-lg px-2 sm:px-4 py-1 transition-colors relative ${showHeader ? 'mt-6 pt-2' : ''}`}
                  >
                    {showHeader ? (
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className={`w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center font-bold text-sm shadow-lg transition-transform group-hover:scale-105 ${
                          isAI ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : isUser ? 'bg-[#5865f2]' : 'bg-[#ed4245]'
                        }`}>
                          {isAI ? <Sparkles className="w-5 h-5 text-white" /> : <span className="text-white">{msg.username?.[0]?.toUpperCase()}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className={`font-bold text-[15px] hover:underline cursor-pointer ${isUser ? 'text-[#5865f2]' : 'text-[#f2a83d]'}`}>
                              {msg.username || 'Anonymous'}
                            </span>
                            {isAI && (
                              <span className="bg-[#5865f2] text-white text-[9px] px-1.5 py-0.5 rounded font-black tracking-widest uppercase">
                                BOT
                              </span>
                            )}
                            <span className="text-[11px] text-[#949ba4] font-medium">
                              {new Date(msg.created_at).toLocaleString([], { 
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                              })}
                            </span>
                          </div>
                            <div className="text-[#dbdee1] mt-0.5 break-words [overflow-wrap:anywhere] leading-relaxed text-[15px] selection:bg-[#5865f2]/30">

                            {renderMessageContent(msg.content, msg.mentions)}
                          </div>
                          {msg.shared_content && (
                            <div className="mt-2 grid grid-cols-1 gap-2 max-w-full sm:max-w-sm">
                              {msg.shared_content.map((content: any, cidx: number) => (
                                <SharedContentCard key={cidx} content={content} />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="w-10 shrink-0 flex items-center justify-center">
                          <span className="text-[10px] text-[#949ba4] opacity-0 group-hover:opacity-100 transition-opacity font-medium select-none">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[#dbdee1] break-words leading-relaxed text-[15px] selection:bg-[#5865f2]/30">
                            {renderMessageContent(msg.content, msg.mentions)}
                          </div>
                          {msg.shared_content && (
                            <div className="mt-2 grid grid-cols-1 gap-2 max-w-full sm:max-w-sm">
                              {msg.shared_content.map((content: any, cidx: number) => (
                                <SharedContentCard key={cidx} content={content} />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </main>

        <footer className="px-3 sm:px-4 pb-4 sm:pb-8 pt-2">
          {showMentionSuggestions && filteredMembers.length > 0 && (
            <div className="mb-3 bg-[#2b2d31] border border-[#1e1f22] rounded-2xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-lg">
              <div className="px-4 py-2.5 border-b border-[#1e1f22] bg-[#232428]/50 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#949ba4]">Members to mention</span>
                <span className="text-[10px] text-[#4e5058] font-bold">ESC to cancel</span>
              </div>
              <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                {filteredMembers.map(member => (
                  <button
                    key={member.id}
                    onClick={() => handleMentionSelect(member)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#35373c] rounded-xl transition-all text-left group"
                  >
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-xl bg-[#5865f2] flex items-center justify-center text-xs font-bold text-white shadow-lg group-hover:scale-110 transition-transform">
                        {member.full_name?.[0]}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#23a559] border-[3px] border-[#2b2d31] rounded-full"></div>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-[#dbdee1] group-hover:text-white truncate">{member.full_name}</span>
                      <span className="text-[10px] text-[#949ba4] font-medium">@{member.full_name.toLowerCase().replace(/\s+/g, '')}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {showAttachMenu && (
            <div className="mb-3 bg-[#2b2d31] border border-[#1e1f22] rounded-2xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-lg">
              <div className="p-4 border-b border-[#1e1f22] bg-[#232428]/50 flex items-center justify-between">
                <span className="font-black text-xs text-white uppercase tracking-widest">Share Content</span>
                <button onClick={() => setShowAttachMenu(false)} className="p-1 hover:bg-[#3f4147] rounded-lg transition-colors text-[#949ba4] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-3 max-h-72 overflow-y-auto custom-scrollbar">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#949ba4] mb-3 ml-2">Your Study Kits</div>
                {userContent.kits.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                    <BookOpen className="w-8 h-8 text-[#4e5058] mb-3" />
                    <p className="text-sm text-[#949ba4] font-medium">No study kits found. Create one in Tools!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-1.5">
                    {userContent.kits.map(kit => (
                      <div 
                        key={kit.id}
                        onClick={() => toggleAttachment(kit, 'study-kit')}
                        className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                          selectedAttachments.find(a => a.id === kit.id)
                            ? 'bg-[#5865f2]/10 border-[#5865f2]/50'
                            : 'bg-[#1e1f22]/30 border-transparent hover:bg-[#35373c] hover:border-[#1e1f22]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            selectedAttachments.find(a => a.id === kit.id) ? 'bg-[#5865f2] text-white' : 'bg-[#2b2d31] text-[#5865f2]'
                          }`}>
                            <BookOpen className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-sm font-bold text-gray-100 block truncate">{kit.title}</span>
                            <span className="text-[10px] text-gray-500 font-medium">Updated 2d ago</span>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          selectedAttachments.find(a => a.id === kit.id) ? 'bg-[#5865f2] border-[#5865f2]' : 'border-[#4e5058]'
                        }`}>
                          {selectedAttachments.find(a => a.id === kit.id) && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {selectedAttachments.length > 0 && (
                  <button
                    onClick={handleSendMessage}
                    className="w-full mt-4 py-3.5 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded-xl font-bold text-sm transition-all shadow-xl shadow-[#5865f2]/30 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Share {selectedAttachments.length} Selected Item{selectedAttachments.length > 1 ? 's' : ''}
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="relative group/input">
            {selectedAttachments.length > 0 && !showAttachMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-0.5 px-3 py-2 flex gap-2 overflow-x-auto bg-[#2b2d31] border border-b-0 border-[#1e1f22] rounded-t-2xl no-scrollbar backdrop-blur-md">
                {selectedAttachments.map(a => (
                  <div key={a.id} className="shrink-0 flex items-center gap-2 bg-[#5865f2]/10 border border-[#5865f2]/30 px-3 py-1.5 rounded-xl group/chip transition-all hover:bg-[#5865f2]/20">
                    <span className="text-[11px] font-bold text-[#5865f2]">{a.title}</span>
                    <button onClick={() => toggleAttachment(a, a.type)} className="p-0.5 hover:bg-[#ed4245] hover:text-white rounded transition-all">
                      <X className="w-3.5 h-3.5 text-[#949ba4]" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form 
              onSubmit={handleSendMessage} 
              className={`flex items-center gap-2 sm:gap-3 bg-[#383a40] px-3 sm:px-4 py-1 shadow-2xl transition-all border-2 border-transparent focus-within:border-[#5865f2]/30 ${
                selectedAttachments.length > 0 ? 'rounded-b-2xl rounded-t-none border-t-[#1e1f22]' : 'rounded-2xl'
              }`}
            >
              <button
                type="button"
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                className={`p-2 rounded-xl transition-all shrink-0 ${
                  showAttachMenu ? 'bg-[#5865f2] text-white rotate-45' : 'text-[#b5bac1] hover:text-white hover:bg-[#4e5058]'
                }`}
              >
                <Plus className="w-5 h-5" />
              </button>
              
              <div className="flex-1 relative min-w-0">
                <input
                  ref={inputRef}
                  className="w-full bg-transparent py-3 text-[#dbdee1] placeholder-[#6d6f78] outline-none font-medium text-[15px]"
                  placeholder={`Message #${circle.name}`}
                  type="text"
                  value={newMessage}
                  onChange={handleInputChange}
                />
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  className="p-2 text-[#b5bac1] hover:text-white hover:bg-[#4e5058] rounded-xl transition-all hidden sm:flex"
                >
                  <Sparkles className="w-5 h-5" />
                </button>
                <button
                  type="submit"
                  disabled={!newMessage.trim() && selectedAttachments.length === 0}
                  className="p-2.5 bg-[#5865f2] text-white rounded-xl disabled:bg-transparent disabled:text-[#4e5058] disabled:cursor-not-allowed transition-all hover:bg-[#4752c4] active:scale-90"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
          
          <p className="mt-2 text-[10px] text-[#949ba4] text-center font-medium hidden sm:block">
            Pro tip: type <span className="text-[#5865f2] font-bold">@</span> to mention someone or use the <span className="text-[#5865f2] font-bold">+</span> to share study kits.
          </p>
        </footer>
      </div>

      {showInviteModal && (
        <ShareCircleModal circle={circle} onClose={() => setShowInviteModal(false)} />
      )}
    </div>
  );
};

// Create Circle Modal - Updated Theme
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

      posthog.capture('study_circle_created', {
        circle_id: newCircle.id,
        circle_name: name,
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-[#313338] border border-[#1e1f22] p-8 rounded-3xl max-w-md w-full shadow-2xl">
        <h2 className="text-2xl font-black mb-2 text-white text-center tracking-tighter">Create Study Circle</h2>
        <p className="text-[#949ba4] text-sm text-center mb-8">Set up your new workspace and invite your squad.</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#949ba4] ml-1">Circle Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#1e1f22] border border-[#2b2d31] rounded-2xl px-4 py-3.5 text-white placeholder-[#4e5058] focus:border-[#5865f2] outline-none transition-all font-bold"
              placeholder="e.g., Quantum Mechanics Lab"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#949ba4] ml-1">Mission / Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#1e1f22] border border-[#2b2d31] rounded-2xl px-4 py-3.5 text-white placeholder-[#4e5058] focus:border-[#5865f2] outline-none transition-all font-medium resize-none"
              rows={3}
              placeholder="What will you achieve together?"
              required
            />
          </div>
          {error && <p className="text-[#ed4245] text-xs font-bold text-center bg-[#ed4245]/10 py-2 rounded-lg">{error}</p>}
          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-xl bg-[#35373c] hover:bg-[#3f4147] text-white font-bold transition-all">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !session || !session.user || !session.user.id}
              className="flex-1 py-3.5 rounded-xl bg-[#5865f2] hover:bg-[#4752c4] text-white font-bold disabled:opacity-50 transition-all shadow-lg shadow-[#5865f2]/20">
              {isLoading ? 'Creating...' : 'Create Hub'}
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
  const [autoJoinStatus, setAutoJoinStatus] = useState<'idle' | 'joining' | 'success' | 'error'>('idle');
  const [autoJoinError, setAutoJoinError] = useState('');

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => setSession(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const joinCode = searchParams.get('join');
    if (joinCode && session && autoJoinStatus === 'idle') {
      handleAutoJoin(joinCode);
    }
  }, [searchParams, session, autoJoinStatus]);

  const handleAutoJoin = async (inviteCode: string) => {
    setAutoJoinStatus('joining');
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

      posthog.capture('study_circle_joined', {
        circle_id: data.circle_id,
        join_method: 'share_link',
      });

      setAutoJoinStatus('success');
      router.replace('/socials/study-circles');
      fetchCircles();
    } catch (err: any) {
      setAutoJoinStatus('error');
      setAutoJoinError(err.message);
    }
  };

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

  if (isLoading || autoJoinStatus === 'joining') {
    return (
      <div className="flex justify-center items-center h-screen bg-[#313338]">
        <div className="flex flex-col items-center gap-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5865f2]"></div>
          <p className="text-[#949ba4] font-bold uppercase tracking-widest text-[10px]">
            {autoJoinStatus === 'joining' ? 'Syncing Network...' : 'Connecting to Hub...'}
          </p>
        </div>
      </div>
    );
  }

  if (autoJoinStatus === 'error') {
    return (
      <div className="flex justify-center items-center h-screen bg-[#313338]">
        <div className="flex flex-col items-center gap-6 max-w-md text-center p-8 bg-[#2b2d31] rounded-3xl border border-[#ed4245]/20 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-[#ed4245]/10 flex items-center justify-center">
            <X className="w-8 h-8 text-[#ed4245]" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white tracking-tighter">Connection Failed</h2>
            <p className="text-[#949ba4] font-medium leading-relaxed">{autoJoinError}</p>
          </div>
          <button
            onClick={() => {
              setAutoJoinStatus('idle');
              router.replace('/socials/study-circles');
            }}
            className="w-full py-4 bg-[#5865f2] hover:bg-[#4752c4] rounded-xl font-bold text-white transition-all shadow-lg shadow-[#5865f2]/20"
          >
            Return to Circles
          </button>
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
      <div className="flex justify-center items-center h-screen bg-[#313338]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5865f2]"></div>
      </div>
    }>
      <StudyCirclesContent />
    </Suspense>
  );
}
