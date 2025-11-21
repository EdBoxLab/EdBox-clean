'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Users, Plus, Hash, LogIn, LogOut, Loader2, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const CircleCard = ({ circle, onJoin, onLeave, isProcessing, onSelect }: { circle: any, onJoin: (id: string) => void, onLeave: (id: string) => void, isProcessing: boolean, onSelect: (circle: any) => void }) => (
  <div className="bg-gray-800 p-4 rounded-lg flex items-start space-x-4">
    <div className="flex-1 cursor-pointer" onClick={() => onSelect(circle)}>
        <div className="flex items-start space-x-4">
            <div className="bg-purple-500 p-3 rounded-full">
                <Hash className="h-6 w-6 text-white" />
            </div>
            <div>
                <h3 className="font-bold text-lg text-white">{circle.name}</h3>
                <p className="text-sm text-gray-400">{circle.description}</p>
                <div className="flex items-center text-xs text-gray-500 mt-2">
                    <Users className="h-4 w-4 mr-1.5" />
                    <span>{circle.member_count} Members</span>
                </div>
            </div>
        </div>
    </div>
    <div className="flex flex-col items-end">
        { circle.is_member ? (
            <button 
                onClick={() => onLeave(circle.id)}
                disabled={isProcessing}
                className="py-2 px-4 rounded-md bg-red-600 hover:bg-red-700 transition-colors flex items-center text-sm disabled:opacity-50">
                <LogOut className="h-4 w-4 mr-1.5"/>
                Leave
            </button>
        ) : (
            <button 
                onClick={() => onJoin(circle.id)}
                disabled={isProcessing}
                className="py-2 px-4 rounded-md bg-green-600 hover:bg-green-700 transition-colors flex items-center text-sm disabled:opacity-50">
                <LogIn className="h-4 w-4 mr-1.5"/>
                Join
            </button>
        )}
    </div>
  </div>
);

const CreateCircleModal = ({ onClose, onCircleCreated }: { onClose: () => void, onCircleCreated: (newCircle: any) => void }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
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
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg max-w-sm w-full">
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

const CircleChat = ({ circle, onBack, session }: { circle: any, onBack: () => void, session: any }) => {
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const response = await fetch(`/api/study-circles/${circle.id}/messages`);
                const data = await response.json();
                setMessages(data);
            } catch (error) {
                console.error("Failed to fetch messages:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMessages();
    }, [circle.id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const channel = supabase.channel(`realtime:messages:circle=${circle.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `circle_id=eq.${circle.id}` }, (payload) => {
                setMessages(messages => [...messages, payload.new]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [circle.id, supabase]);

    const handleSendMessage = async (e: React.FormEvent) => {
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

    return (
        <div className="p-8 text-white flex flex-col h-[calc(100vh-10rem)]">
            <button onClick={onBack} className="mb-4 bg-gray-700 p-2 rounded-lg hover:bg-gray-600 self-start">← Back to Circles</button>
            <h1 className="text-3xl font-bold text-purple-400">{circle.name}</h1>
            <p className="text-gray-400 mt-1">{circle.description}</p>

            <div className="flex-1 mt-6 overflow-y-auto pr-4">
                {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : messages.map(msg => (
                    <div key={msg.id} className="mb-4">
                        <span className="font-bold text-purple-300">{msg.username}</span>
                        <p className="text-gray-300">{msg.content}</p>
                        <span className="text-xs text-gray-500">{new Date(msg.created_at).toLocaleTimeString()}</span>
                    </div>
                ))}
                 <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="mt-4 flex space-x-2">
                <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} className="flex-1 bg-gray-700 rounded-md px-4 py-2" placeholder="Type a message..." />
                <button type="submit" className="bg-purple-600 px-4 py-2 rounded-md"><Send className="h-5 w-5"/></button>
            </form>
        </div>
    );
}

export default function StudyCirclesPage() {
  const [circles, setCircles] = useState<any[]>([]);
  const [selectedCircle, setSelectedCircle] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);

   useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);


  const fetchCircles = async () => {
    try {
      const response = await fetch('/api/study-circles');
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      setCircles(data);
    } catch (error) {
      console.error("Failed to fetch circles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCircles();
  }, []);

  const handleCircleCreated = (newCircle: any) => {
    const circleWithDetails = { ...newCircle, member_count: 1, is_member: true };
    setCircles(prev => [circleWithDetails, ...prev].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
  };

  const handleJoin = async (id: string) => {
    setProcessingId(id);
    setCircles(circles.map(c => c.id === id ? { ...c, is_member: true, member_count: c.member_count + 1 } : c));
    try {
        await fetch(`/api/study-circles/${id}/members`, { method: 'POST' });
    } catch (error) {
        setCircles(circles.map(c => c.id === id ? { ...c, is_member: false, member_count: c.member_count - 1 } : c));
    }
    setProcessingId(null);
  };

  const handleLeave = async (id: string) => {
    setProcessingId(id);
    setCircles(circles.map(c => c.id === id ? { ...c, is_member: false, member_count: c.member_count - 1 } : c));
    try {
        await fetch(`/api/study-circles/${id}/members`, { method: 'DELETE' });
    } catch (error) {
        setCircles(circles.map(c => c.id === id ? { ...c, is_member: true, member_count: c.member_count + 1 } : c));
    }
    setProcessingId(null);
  };

  if (selectedCircle) {
      if (!selectedCircle.is_member) {
          return (
            <div className="p-8 text-white">
                <button onClick={() => setSelectedCircle(null)} className="mb-4 bg-gray-700 p-2 rounded-lg hover:bg-gray-600">← Back to Circles</button>
                <h1 className="text-2xl font-bold text-red-400">Access Denied</h1>
                <p className="text-gray-400 mt-2">You must be a member of this circle to view the chat.</p>
            </div>
          )
      }
      return <CircleChat circle={selectedCircle} onBack={() => setSelectedCircle(null)} session={session} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Study Circles</h1>
          <button onClick={() => setIsModalOpen(true)} className="bg-purple-600 py-2 px-4 rounded-lg flex items-center"><Plus className="h-5 w-5 mr-2" />Create Circle</button>
        </div>

        {isLoading ? <div className="flex justify-center"><Loader2 className="h-12 w-12 animate-spin" /></div> : (
            <div className="space-y-4">
              {circles.map(circle => (
                <CircleCard key={circle.id} circle={circle} onJoin={handleJoin} onLeave={handleLeave} isProcessing={processingId === circle.id} onSelect={setSelectedCircle} />
              ))}
            </div>
        )}

        {isModalOpen && <CreateCircleModal onClose={() => setIsModalOpen(false)} onCircleCreated={handleCircleCreated} />}
      </div>
    </div>
  );
}
