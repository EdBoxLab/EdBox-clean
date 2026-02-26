'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { XPStreakDisplay } from '@/components/XPStreakDisplay';
import InteractiveCourseSession from '@/components/InteractiveCourseSession';
import ShareButton from '@/components/ShareButton';
import ShareModal, { useShareModal } from '@/components/ShareModal';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { ShareableContent } from '@/lib/services/sharing-service';
import { Users } from 'lucide-react';


export default function CoursePlayerPage() {
    const router = useRouter();
    const params = useParams();
    const courseId = params.courseId as string;
    const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
    const { isOpen, content, openShareModal, closeShareModal } = useShareModal();

    const [user, setUser] = React.useState<any>(null);
    const [course, setCourse] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [useInteractiveMode, setUseInteractiveMode] = useState(true);
    const [activeModuleId, setActiveModuleId] = React.useState('m1');
    const [completedModules, setCompletedModules] = React.useState<string[]>([]);

    // Create shareable content object
    const shareableContent: ShareableContent = React.useMemo(() => ({
        type: 'course',
        id: courseId,
        title: course?.title || 'Course',
        description: course?.description,
        imageUrl: course?.imageUrl,
        creatorName: course?.creator
    }), [courseId, course]);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Get current user
                const { data: { user } } = await supabase.auth.getUser();
                setUser(user);

                if (!user) {
                    setLoading(false);
                    return;
                }

                // Fetch skill graph (course)
                const { data: graphData, error: graphError } = await supabase
                    .from('skill_graphs')
                    .select('*')
                    .eq('id', courseId)
                    .single();

                if (graphError || !graphData) {
                    console.error('Error fetching course:', graphError);
                    setError('Course not found');
                    setLoading(false);
                    return;
                }

                // Fetch creator profile
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('full_name, username')
                    .eq('id', graphData.userId)
                    .single();

                setCourse({
                    id: graphData.id,
                    title: graphData.goal,
                    creator: profileData?.full_name || profileData?.username || 'AI Tutor',
                    description: graphData.goal,
                    imageUrl: '/courses/default.jpg',
                    modules: [],
                    rawGraph: graphData // Pass the full graph for Interactive Mode
                });

            } catch (err) {
                console.error('Unexpected error:', err);
                setError('Failed to load course');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [courseId, supabase]);

    useEffect(() => {
        router.push('/unavailable');
    }, [router]);

    return null;

    const handleModuleComplete = async (moduleId: string) => {
        // Since modules are not used, this might be simplified or removed
        // Keeping it for potential future use or interactive mode needs
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white relative overflow-hidden">
                {/* Background Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
                </div>
                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-400">Loading course experience...</p>
                </div>
            </div>
        );
    }

    if (error || !course) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4 text-center relative overflow-hidden">
                {/* Background Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
                </div>
                <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl max-w-md relative z-10 backdrop-blur-md">
                    <h2 className="text-2xl font-bold text-red-400 mb-2">Oops!</h2>
                    <p className="text-gray-300 mb-6">{error || 'Course not found.'}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-xl transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white relative overflow-hidden">
                {/* Background Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
                </div>
                <div className="relative z-10">
                    Please log in to access courses.
                </div>
            </div>
        );
    }

    // Use interactive mode by default
    if (useInteractiveMode) {
        return (
            <InteractiveCourseSession
                courseId={courseId}
                userId={user.id}
                courseTitle={course.title}
                courseCreator={course.creator}
                skillGraph={course.rawGraph}
            />
        );
    }

    return (
        <div className="flex min-h-screen bg-slate-900 text-white relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
                <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-pink-500/5 rounded-full blur-[100px]" />
            </div>

            {/* Mode Toggle */}
            <div className="absolute top-4 right-4 z-20">
                <button
                    onClick={() => setUseInteractiveMode(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-lg shadow-purple-900/20"
                >
                    Switch to Interactive Mode
                </button>
            </div>

            {/* Sidebar */}
            <aside className="w-1/4 bg-white/5 backdrop-blur-xl p-6 border-r border-white/10 relative z-10">
                <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold mb-1 leading-tight">{course.title}</h2>
                        <p className="text-sm text-purple-400 font-medium">By {course.creator}</p>
                    </div>
                    <ShareButton
                        content={shareableContent}
                        userId={user?.id}
                        variant="icon"
                        size="sm"
                        showCount={true}
                    />
                </div>

                {/* Course Description */}
                {course.description && (
                    <div className="mb-6">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">About this Course</h3>
                        <p className="text-sm text-gray-300 leading-relaxed bg-gray-900/50 p-4 rounded-xl border border-gray-700/30">
                            {course.description}
                        </p>
                    </div>
                )}
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-3xl mx-auto">
                    <div className="mb-8 text-center sm:text-left">
                        <span className="px-3 py-1 bg-purple-500/10 text-purple-400 text-xs font-bold uppercase tracking-wider rounded-full border border-purple-500/20 mb-4 inline-block">
                            Step-by-Step Learning
                        </span>
                        <h1 className="text-5xl font-black mb-4 tracking-tight leading-tight">
                            {course.title}
                        </h1>
                        <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                            Welcome to your personalized learning journey. This course is dynamically generated to help you master <span className="text-white font-semibold">{course.title}</span> through interactive dialogue and hands-on practice.
                        </p>
                    </div>

                    {/* Share Course Section */}
                    <div className="p-8 bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl border border-gray-700 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-purple-600/20 transition-all duration-500"></div>

                        <h3 className="text-2xl font-bold mb-3 relative z-10 text-white">Enjoying this course?</h3>
                        <p className="text-gray-400 mb-8 relative z-10 max-w-md">
                            Share it with your study circles and friends! Everything is better when learned together. 🚀
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 relative z-10">
                            <button
                                onClick={() => openShareModal(shareableContent)}
                                className="flex-1 px-6 py-4 bg-white text-black hover:bg-gray-200 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 active:scale-95"
                            >
                                <Users className="w-5 h-5 text-purple-600" />
                                Share to Circle
                            </button>
                            <ShareButton
                                content={shareableContent}
                                userId={user?.id}
                                variant="button"
                                size="md"
                                showCount={true}
                                className="flex-1 !h-[unset] !py-4 !rounded-2xl border-2 border-gray-700 hover:border-gray-500 transition-all active:scale-95"
                            />
                        </div>
                    </div>

                    <div className="mt-12 text-center text-gray-500">
                        <p className="text-sm">
                            Tip: Switch to <span className="text-purple-400 font-medium">Interactive Mode</span> for the best experience with Genie, your AI tutor.
                        </p>
                    </div>
                </div>
            </main>

            {/* Share Modal */}
            <ShareModal
                isOpen={isOpen}
                onClose={closeShareModal}
                content={content || shareableContent}
                userId={user?.id}
            />
        </div>
    );
}
