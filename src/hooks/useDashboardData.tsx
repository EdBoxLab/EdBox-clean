import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import React from 'react';
import { Zap } from 'lucide-react';

export interface DashboardItem {
    id: string;
    title: string;
    type: string;
    href?: string;
    icon?: React.ReactNode;
    progress?: number;
}

export const useDashboardData = () => {
    const supabase = createSupabaseBrowserClient();
    const router = useRouter();

    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [studyKits, setStudyKits] = useState<DashboardItem[]>([]);

    const [kitsLoading, setKitsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push('/login');
                    return;
                }
                setUser(user);

                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profileData) {
                    setProfile(profileData);
                } else if (!profileError || profileError.code === 'PGRST116') {
                    const { data: newProfile } = await supabase
                        .from('profiles')
                        .insert([{ id: user.id, email: user.email }])
                        .select()
                        .single();
                    if (newProfile) setProfile(newProfile);
                }

                setLoading(false);

                const fetchStudyKits = async () => {
                    try {
                        const kitsRes = await fetch('/api/study-kit/list');
                        const kitsJson = await kitsRes.json();
                        if (kitsJson.studyKits) {
                            setStudyKits(kitsJson.studyKits.map((kit: any) => ({
                                id: kit.id,
                                title: kit.title || 'Untitled Study Kit',
                                type: 'Study Kit',
                                href: `/tools/study-kit?id=${kit.id}`,
                                icon: <Zap className="w-8 h-8 text-yellow-300" />
                            })));
                        }
                    } catch (error) {
                        console.error("Error fetching study kits:", error);
                    } finally {
                        setKitsLoading(false);
                    }
                };

                fetchStudyKits();

            } catch (error) {
                console.error("Error loading dashboard data:", error);
                setLoading(false);
            }
        };

        fetchData();
    }, [supabase, router]);

    const handleDelete = async (id: string, type: string) => {
        if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

        let endpoint = '';
        if (type === 'Study Kit') endpoint = `/api/study-kit/${id}`;

        if (!endpoint) return;

        try {
            const res = await fetch(endpoint, { method: 'DELETE' });
            if (res.ok || res.status === 204) {
                if (type === 'Study Kit') {
                    setStudyKits(prev => prev.filter(k => k.id !== id));
                }
            } else {
                alert(`Failed to delete ${type}`);
            }
        } catch (error) {
            console.error(`Error deleting ${type}:`, error);
            alert(`Error deleting ${type}`);
        }
    };

    return {
        user,
        profile,
        setProfile,
        loading,
        studyKits,
        kitsLoading,
        handleDelete
    };
};
