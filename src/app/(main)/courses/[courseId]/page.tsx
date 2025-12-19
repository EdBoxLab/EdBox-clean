'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { XPStreakDisplay } from '@/components/XPStreakDisplay';
import InteractiveCourseSession from '@/components/InteractiveCourseSession';
import ShareButton from '@/components/ShareButton';
import ShareModal, { useShareModal } from '@/components/ShareModal';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { ShareableContent } from '@/lib/services/sharing-service';
import { Users } from 'lucide-react';

// Mock Course Data - In a real app, this would be fetched based on the courseId
const mockCourseData: { [key: string]: any } = {
    '1': {
        title: 'Introduction to Python',
        creator: 'CodeWizard',
        description: 'Learn Python programming from scratch with hands-on exercises and real-world projects. Perfect for beginners!',
        imageUrl: '/courses/python-intro.jpg',
        modules: [
            { id: 'm1', title: 'Getting Started', type: 'video', content: '...' },
            { id: 'm2', title: 'Variables and Data Types', type: 'text', content: '...' },
            { id: 'm3', title: 'Your First Function', type: 'challenge', content: '...' },
            { id: 'm4', title: 'Quiz: Python Basics', type: 'quiz', content: '...' },
        ]
    },
    '2': {
        title: 'The Science of Well-being',
        creator: 'Dr. Happy',
        description: 'Discover the science behind happiness and learn practical strategies to improve your well-being and life satisfaction.',
        imageUrl: '/courses/wellbeing.jpg',
        modules: [
            { id: 'm1', title: 'Introduction to Positive Psychology', type: 'video', content: '...' },
            { id: 'm2', title: 'The PERMA Model', type: 'text', content: '...' },
            { id: 'm3', title: 'Gratitude Journaling Challenge', type: 'challenge', content: '...' },
        ]
    }
};

const ModuleItem = ({ module, isActive, isCompleted }: { module: any, isActive: boolean, isCompleted?: boolean }) => (
    <div className={`p-4 rounded-lg cursor-pointer transition-all ${isActive ? 'bg-purple-600/30' : 'hover:bg-gray-700/50'}`}>
        <p className={`font-bold ${isActive ? 'text-purple-300' : 'text-gray-300'}`}>{module.title}</p>
        <p className="text-sm text-gray-500">{module.type.charAt(0).toUpperCase() + module.type.slice(1)}</p>
    </div>
);

export default function CoursePlayerPage() {
    const params = useParams();
    const courseId = params.courseId as string;
    const course = mockCourseData[courseId];
    const supabase = createSupabaseBrowserClient();
    const { isOpen, content, openShareModal, closeShareModal } = useShareModal();

    const [user, setUser] = React.useState<any>(null);
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
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();
    }, []);

    const handleModuleComplete = async (moduleId: string) => {
        if (completedModules.includes(moduleId)) return;

        setCompletedModules([...completedModules, moduleId]);

        // Award XP based on module type
        const module = course.modules.find((m: any) => m.id === moduleId);
        let xpAmount = 10;
        
        if (module?.type === 'challenge') xpAmount = 25;
        if (module?.type === 'quiz') xpAmount = 20;
        if (module?.type === 'video') xpAmount = 15;

        try {
            await fetch('/api/xp/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    xpGained: xpAmount,
                    activity: `course_module_${module?.type}`,
                    skillGraphId: courseId
                })
            });
        } catch (error) {
            console.error('Failed to update XP:', error);
        }
    };

    if (!course) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Course not found.</div>;
    }

    if (!user) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Please log in to access courses.</div>;
    }

    // Use interactive mode by default
    if (useInteractiveMode) {
        return (
            <div className="relative">
                {/* Mode Toggle */}
                <div className="absolute top-4 right-4 z-10">
                    <button
                        onClick={() => setUseInteractiveMode(false)}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                        Switch to Classic View
                    </button>
                </div>
                
                <InteractiveCourseSession
                    courseId={courseId}
                    userId={user.id}
                    courseTitle={course.title}
                    courseCreator={course.creator}
                />
            </div>
        );
    }

    const activeModule = course.modules.find((m: any) => m.id === activeModuleId);

  return (
    <div className="flex min-h-screen bg-gray-900 text-white relative">
        {/* Mode Toggle */}
        <div className="absolute top-4 right-4 z-10">
            <button
                onClick={() => setUseInteractiveMode(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm transition-colors"
            >
                Switch to Interactive Mode
            </button>
        </div>

        {/* Sidebar */}
        <aside className="w-1/4 bg-gray-800 p-6 border-r border-gray-700">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2">{course.title}</h2>
                    <p className="text-sm text-gray-400 mb-2">By {course.creator}</p>
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
                <p className="text-sm text-gray-300 mb-4 leading-relaxed">
                    {course.description}
                </p>
            )}
            
            {/* XP Display */}
            <div className="mb-6">
                <XPStreakDisplay showCompact={true} skillGraphId={courseId} />
            </div>

            <div className="space-y-2">
                {course.modules.map((module: any) => (
                    <div key={module.id} onClick={() => setActiveModuleId(module.id)}>
                        <ModuleItem 
                            module={module} 
                            isActive={module.id === activeModuleId}
                            isCompleted={completedModules.includes(module.id)}
                        />
                    </div>
                ))}
            </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
            {activeModule ? (
                <div>
                    <h1 className="text-4xl font-bold mb-4">{activeModule.title}</h1>
                    <p className="text-xl text-gray-400 mb-8">
                        This is where the <span className="font-mono text-purple-400">{activeModule.type}</span> content will be rendered.
                    </p>

                    {!completedModules.includes(activeModule.id) && (
                        <button
                            onClick={() => handleModuleComplete(activeModule.id)}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold transition-colors"
                        >
                            Mark as Complete
                        </button>
                    )}

                    {completedModules.includes(activeModule.id) && (
                        <div className="text-green-400 font-bold">✓ Completed</div>
                    )}

                    {/* Share Course Section */}
                    <div className="mt-8 p-6 bg-gray-800/50 rounded-xl border border-gray-700">
                        <h3 className="text-lg font-semibold mb-3">Enjoying this course?</h3>
                        <p className="text-gray-400 mb-4">
                            Share it with your study circles and friends! 🚀
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => openShareModal(shareableContent)}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <Users className="w-4 h-4" />
                                Share to Study Circle
                            </button>
                            <ShareButton
                                content={shareableContent}
                                userId={user?.id}
                                variant="button"
                                size="md"
                                showCount={true}
                                className="flex-1"
                            />
                        </div>
                        <div className="mt-3 text-center">
                            <button
                                onClick={() => openShareModal(shareableContent)}
                                className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
                            >
                                More sharing options →
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                 <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Select a module to begin.</p>
                </div>
            )}
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