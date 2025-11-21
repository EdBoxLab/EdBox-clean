'use client';

import React from 'react';
import { useParams } from 'next/navigation';

// Mock Course Data - In a real app, this would be fetched based on the courseId
const mockCourseData: { [key: string]: any } = {
    '1': {
        title: 'Introduction to Python',
        creator: 'CodeWizard',
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
        modules: [
            { id: 'm1', title: 'Introduction to Positive Psychology', type: 'video', content: '...' },
            { id: 'm2', title: 'The PERMA Model', type: 'text', content: '...' },
            { id: 'm3', title: 'Gratitude Journaling Challenge', type: 'challenge', content: '...' },
        ]
    }
};

const ModuleItem = ({ module, isActive }: { module: any, isActive: boolean }) => (
    <div className={`p-4 rounded-lg cursor-pointer transition-all ${isActive ? 'bg-purple-600/30' : 'hover:bg-gray-700/50'}`}>
        <p className={`font-bold ${isActive ? 'text-purple-300' : 'text-gray-300'}`}>{module.title}</p>
        <p className="text-sm text-gray-500">{module.type.charAt(0).toUpperCase() + module.type.slice(1)}</p>
    </div>
);

export default function CoursePlayerPage() {
    const params = useParams();
    const courseId = params.courseId as string;
    const course = mockCourseData[courseId];

    // In a real app, you would have a state for the currently active module
    const [activeModuleId, setActiveModuleId] = React.useState('m1');

    if (!course) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Course not found.</div>;
    }

    const activeModule = course.modules.find((m: any) => m.id === activeModuleId);

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
        {/* Sidebar */}
        <aside className="w-1/4 bg-gray-800 p-6 border-r border-gray-700">
            <h2 className="text-2xl font-bold mb-2">{course.title}</h2>
            <p className="text-sm text-gray-400 mb-6">By {course.creator}</p>
            <div className="space-y-2">
                {course.modules.map((module: any) => (
                    <div key={module.id} onClick={() => setActiveModuleId(module.id)}>
                        <ModuleItem module={module} isActive={module.id === activeModuleId} />
                    </div>
                ))}
            </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
            {activeModule ? (
                <div>
                    <h1 className="text-4xl font-bold mb-4">{activeModule.title}</h1>
                    <p className="text-xl text-gray-400">This is where the <span className="font-mono text-purple-400">{activeModule.type}</span> content will be rendered.</p>
                    {/* Actual content renderer would go here */}
                </div>
            ) : (
                 <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Select a module to begin.</p>
                </div>
            )}
        </main>
        
        {/* We can integrate the Genie chat component here later */}
    </div>
  );
}
