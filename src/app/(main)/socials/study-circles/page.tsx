
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Users, Plus, Hash, LogIn, LogOut, Loader2, Send, Share2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useSearchParams, useRouter } from 'next/navigation';

const CircleList = ({ circles, onSelectCircle, selectedCircle, onJoin, onLeave, isProcessing, onNewCircle }) => (
    <div className="flex flex-col border-r border-zinc-800 w-1/3 p-4 space-y-4">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Study Circles</h2>
            <button onClick={onNewCircle} className="p-2 border border-zinc-700 hover:border-zinc-500 rounded-md transition">
                <Plus size={20} />
            </button>
        </div>
        {circles.map(circle => (
            <div
                key={circle.id}
                className={`flex items-center space-x-4 p-3 rounded-lg cursor-pointer border transition ${selectedCircle?.id === circle.id ? 'border-zinc-600 bg-zinc-900/50' : 'border-transparent hover:border-zinc-700'}`}
                onClick={() => onSelectCircle(circle)}
            >
                <div className="bg-purple-500 p-3 rounded-full">
                    <Hash className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-lg text-white">{circle.name}</h3>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                        <Users className="h-4 w-4 mr-1.5" />
                        <span>{circle.member_count} Members</span>
                    </div>
                </div>
                {!selectedCircle || selectedCircle.id !== circle.id && (
                    circle.is_member ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); onLeave(circle.id); }}
                            disabled={isProcessing}
                            className="p-2 rounded-md bg-red-600 hover:bg-red-700 transition-colors flex items-center text-sm disabled:opacity-50">
                            <LogOut className="h-4 w-4" />
                        </button>
                    ) : (
                        <button
                            onClick={(e) => { e.stopPropagation(); onJoin(circle.id); }}
                            disabled={isProcessing}
                            className="p-2 rounded-md bg-green-600 hover:bg-green-700 transition-colors flex items-center text-sm disabled:opacity-50">
                            <LogIn className="h-4 w-4" />
                        </button>
                    )
                )}
            </div>
        ))}
    </div>
);

const CreateCircleModal = ({ onClose, onCircleCreated }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

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
            onCircleCreated(newCircle);
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="border border-zinc-800 p-6 rounded-lg max-w-sm w-full">
                <h2 className="text-xl font-bold mb-4">Create a New Study Circle</h2>
                <form onSubmit={handleSubmit}>
                    <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2" required />
                    <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full mt-4 bg-gray-700 border border-gray-600 rounded-md px-3 py-2" rows={3} required />
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    <div className="flex justify-end space-x-2 mt-4">
                        <button type="button" onClick={onClose} className="py-2 px-4 rounded-md bg-gray-600">Cancel</button>
                        <button type="submit" disabled={isLoading} className="py-2 px-4 rounded-md bg-purple-600">Create</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const CircleChat = ({ circle, session }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(() => {
        const fetchMessages = async () => {
            if (!circle) return;
            setIsLoading(true);
            try {
                const response = await fetch(`/api/study-circles/${circle.id}/messages`);
                const data = await response.json();
                setMessages(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Failed to fetch messages:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMessages();
    }, [circle?.id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!circle) return;

        const channel = supabase.channel(`realtime:messages:circle=${circle.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `circle_id=eq.${circle.id}` }, (payload) => {
                setMessages(messages => [...messages, payload.new]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [circle?.id]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await fetch(`/api/study-circles/${circle.id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newMessage, username: session.user.user_metadata.full_name || 'Anonymous' }),
            });
            setNewMessage('');
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const copyInviteLink = () => {
        const url = `${window.location.origin}/socials/study-circles?id=${circle.id}`;
        navigator.clipboard.writeText(url);
        // Could add a toast here
        alert('Invite link copied to clipboard!');
    };

    if (!circle) {
        return (
            <div className="flex-1 p-8 text-white flex flex-col items-center justify-center bg-[#09090b]">
                <Hash size={48} className="text-gray-600 mb-4" />
                <h2 className="text-2xl font-bold text-gray-400">Select a circle to start chatting</h2>
            </div>
        );
    }

    if (!circle.is_member) {
        return (
            <div className="flex-1 p-8 text-white flex flex-col items-center justify-center bg-[#09090b]">
                <h1 className="text-2xl font-bold text-red-400">Access Denied</h1>
                <p className="text-gray-400 mt-2">You must be a member of this circle to view the chat.</p>
            </div>
        )
    }

    return (
        <div className="flex-1 flex flex-col h-screen bg-[#09090b] text-white">
            <header className="p-4 border-b border-zinc-800 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-purple-400">{circle.name}</h1>
                    <p className="text-sm text-gray-400">{circle.description}</p>
                </div>
                <button
                    onClick={copyInviteLink}
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors flex items-center space-x-2 text-sm"
                    title="Copy invite link"
                >
                    <Share2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Invite</span>
                </button>
            </header>

            <div className="flex-1 p-6 overflow-y-auto">
                {isLoading ? <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div> : messages.map(msg => (
                    <div key={msg.id} className={`flex mb-4 ${msg.user_id === session.user.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-3 rounded-lg max-w-lg ${msg.user_id === session.user.id ? 'bg-purple-600' : 'bg-gray-700'}`}>
                            <p className="font-bold text-purple-300">{msg.username}</p>
                            <p className="text-white">{msg.content}</p>
                            <p className="text-xs text-gray-400 mt-1 text-right">{new Date(msg.created_at).toLocaleTimeString()}</p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <footer className="p-4 border-t border-zinc-800">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                    <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} className="flex-1 bg-gray-700 rounded-md px-4 py-2" placeholder="Type a message..." />
                    <button type="submit" className="bg-purple-600 px-4 py-2 rounded-md"><Send className="h-5 w-5" /></button>
                </form>
            </footer>
        </div>
    );
}


export default function StudyCirclesPage() {
    const [circles, setCircles] = useState([]);
    const [selectedCircle, setSelectedCircle] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [processingId, setProcessingId] = useState(null);
    const [session, setSession] = useState(null);

    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => setSession(session));

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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

            // Check for invite ID
            const inviteId = searchParams.get('id');
            if (inviteId) {
                const targetCircle = data.find(c => c.id === inviteId);
                if (targetCircle) {
                    setSelectedCircle(targetCircle);
                }
            } else if (!selectedCircle && data.length > 0) {
                // Only default select if no invite ID and no existing selection
                setSelectedCircle(data[0]);
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

    const handleCircleCreated = (newCircle) => {
        const circleWithDetails = { ...newCircle, member_count: 1, is_member: true };
        setCircles(prev => [circleWithDetails, ...prev].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        setSelectedCircle(circleWithDetails);
    };

    const handleJoin = async (id) => {
        setProcessingId(id);
        // UI update is now handled by realtime subscription
        try {
            await fetch(`/api/study-circles/${id}/members`, { method: 'POST' });
        } catch (error) {
            console.error('Join error:', error);
        }
        setProcessingId(null);
    };

    const handleLeave = async (id) => {
        setProcessingId(id);
        // UI update is now handled by realtime subscription
        if (selectedCircle && selectedCircle.id === id) {
            setSelectedCircle(null);
        }
        try {
            await fetch(`/api/study-circles/${id}/members`, { method: 'DELETE' });
        } catch (error) {
            console.error('Leave error:', error);
        }
        setProcessingId(null);
    };

    return (
        <div className="flex h-screen bg-[#09090b] text-white">
            {isLoading ? (
                <div className="flex justify-center items-center w-full">
                    <Loader2 className="h-12 w-12 animate-spin" />
                </div>
            ) : (
                <>
                    <CircleList
                        circles={circles}
                        onSelectCircle={setSelectedCircle}
                        selectedCircle={selectedCircle}
                        onJoin={handleJoin}
                        onLeave={handleLeave}
                        isProcessing={!!processingId}
                        onNewCircle={() => setIsModalOpen(true)}
                    />
                    <CircleChat circle={selectedCircle} session={session} />
                </>
            )}

            {isModalOpen && <CreateCircleModal onClose={() => setIsModalOpen(false)} onCircleCreated={handleCircleCreated} />}
        </div>
    );
}
