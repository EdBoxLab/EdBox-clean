import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import React from 'react';
import { Book, FileText, Zap } from 'lucide-react';

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

    const [courses, setCourses] = useState<DashboardItem[]>([]);
    const [notes, setNotes] = useState<DashboardItem[]>([]);
    const [studyKits, setStudyKits] = useState<DashboardItem[]>([]);
    const [recentCourse, setRecentCourse] = useState<any>(null);

    const [coursesLoading, setCoursesLoading] = useState(true);
    const [notesLoading, setNotesLoading] = useState(true);
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

                const fetchCourses = async () => {
                    try {
                        const coursesRes = await fetch('/api/skill-graph/list');
                        const coursesJson = await coursesRes.json();

                        if (coursesJson.success && coursesJson.courses) {
                            const mappedCourses = coursesJson.courses.map((c: any) => ({
                                id: c.id,
                                title: c.goal || c.topic || 'Untitled Course',
                                type: 'Course',
                                progress: Math.round((coursesJson.progress?.[c.id] || 0) * 100),
                                icon: <Book className="w-8 h-8 text-indigo-300" />,
                                href: `/courses/${c.id}`
                            }));
                            setCourses(mappedCourses);

                            if (mappedCourses.length > 0) {
                                setRecentCourse({
                                    type: 'Course',
                                    title: mappedCourses[0].title,
                                    href: mappedCourses[0].href,
                                    progress: mappedCourses[0].progress
                                });
                            }
                        }
                    } catch (error) {
                        console.error("Error fetching courses:", error);
                    } finally {
                        setCoursesLoading(false);
                    }
                };

                const fetchNotes = async () => {
                    try {
                        const notesRes = await fetch('/api/notes');
                        const notesJson = await notesRes.json();
                        if (Array.isArray(notesJson)) {
                            setNotes(notesJson.map((n: any) => ({
                                id: n.id,
                                title: n.title || 'Untitled Note',
                                type: 'Note',
                                href: `/tools/notes?id=${n.id}`,
                                icon: <FileText className="w-8 h-8 text-green-300" />
                            })));
                        }
                    } catch (error) {
                        console.error("Error fetching notes:", error);
                    } finally {
                        setNotesLoading(false);
                    }
                };

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

                fetchCourses();
                fetchNotes();
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
        if (type === 'Course') endpoint = `/api/skill-graph/${id}`;
        else if (type === 'Note') endpoint = `/api/notes/${id}`;
        else if (type === 'Study Kit') endpoint = `/api/study-kit/${id}`;

        if (!endpoint) return;

        try {
            const res = await fetch(endpoint, { method: 'DELETE' });
            if (res.ok || res.status === 204) {
                if (type === 'Course') {
                    setCourses(prev => prev.filter(c => c.id !== id));
                    if (recentCourse?.href.includes(id)) setRecentCourse(null);
                } else if (type === 'Note') {
                    setNotes(prev => prev.filter(n => n.id !== id));
                } else if (type === 'Study Kit') {
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
        courses,
        notes,
        studyKits,
        recentCourse,
        coursesLoading,
        notesLoading,
        kitsLoading,
        handleDelete
    };
};
