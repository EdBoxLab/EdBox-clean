'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppWindow } from './AppWindow';
import { Zap, Book, MessageCircle, ChevronRight, Check } from 'lucide-react';

export const ProductShowcase = () => {
    const [activeTab, setActiveTab] = useState<'feed' | 'course' | 'chat' | 'studykit' | 'notes'>('course');

    return (
        <section className="py-32 px-6">
            <div className="max-w-7xl mx-auto">

                {/* Section Header */}
                <div className="text-center mb-20">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-bold text-white mb-6"
                    >
                        Built for <span className="text-[#8B5CF6]">flow state.</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-[#9CA3AF] max-w-2xl mx-auto"
                    >
                        Experience a learning interface designed to keep you focused.
                        No clutter. Just you and the content.
                    </motion.p>
                </div>

                {/* Tab Navigation */}
                <div className="flex justify-center mb-12">
                    <div className="flex items-center flex-wrap justify-center gap-2 p-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                        <TabButton
                            active={activeTab === 'course'}
                            onClick={() => setActiveTab('course')}
                            icon={<Book className="w-4 h-4" />}
                            label="Course Gen"
                        />
                        <TabButton
                            active={activeTab === 'studykit'}
                            onClick={() => setActiveTab('studykit')}
                            icon={<Zap className="w-4 h-4" />}
                            label="Study Kit"
                        />
                        <TabButton
                            active={activeTab === 'feed'}
                            onClick={() => setActiveTab('feed')}
                            icon={<Zap className="w-4 h-4" />}
                            label="Smart Feed"
                        />
                        <TabButton
                            active={activeTab === 'notes'}
                            onClick={() => setActiveTab('notes')}
                            icon={<Book className="w-4 h-4" />} // Using Book icon for Notes for now
                            label="Notes"
                        />
                        <TabButton
                            active={activeTab === 'chat'}
                            onClick={() => setActiveTab('chat')}
                            icon={<MessageCircle className="w-4 h-4" />}
                            label="Genie AI"
                        />
                    </div>
                </div>

                {/* Mockup Container */}
                <div className="relative max-w-5xl mx-auto h-[600px] md:h-[700px]">
                    <AnimatePresence mode="wait">
                        {activeTab === 'course' && <CourseMockup key="course" />}
                        {activeTab === 'feed' && <FeedMockup key="feed" />}
                        {activeTab === 'chat' && <ChatMockup key="chat" />}
                        {activeTab === 'studykit' && <StudyKitMockup key="studykit" />}
                        {activeTab === 'notes' && <NotesMockup key="notes" />}
                    </AnimatePresence>
                </div>

            </div>
        </section>
    );
};

const TabButton = ({ active, onClick, icon, label }: any) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all ${active
            ? 'bg-[#8B5CF6] text-white shadow-lg shadow-purple-500/25'
            : 'text-[#9CA3AF] hover:text-white hover:bg-white/5'
            }`}
    >
        {icon}
        {label}
    </button>
);

// --- MOCKUPS ---

const StudyKitMockup = () => (
    <AppWindow className="h-full bg-[#0F0F10] border-gray-800 p-8 flex flex-col items-center justify-center">
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-6"
        >
            {/* Flashcards */}
            <div className="bg-[#1C1C1E] rounded-2xl p-6 border border-white/5 hover:border-[#8B5CF6]/50 transition-colors group cursor-pointer h-64 flex flex-col justify-between">
                <div>
                    <div className="w-10 h-10 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center mb-4 text-xl">⚡</div>
                    <h3 className="text-xl font-bold text-white mb-2">Flashcards</h3>
                    <p className="text-gray-400 text-sm">Master concepts with spaced repetition.</p>
                </div>
                <div className="flex items-center text-sm font-medium text-white/50 group-hover:text-white transition-colors">
                    24 Cards Due <ChevronRight className="w-4 h-4 ml-1" />
                </div>
            </div>

            {/* Quiz */}
            <div className="bg-[#1C1C1E] rounded-2xl p-6 border border-white/5 hover:border-[#8B5CF6]/50 transition-colors group cursor-pointer h-64 flex flex-col justify-between">
                <div>
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4 text-xl">📝</div>
                    <h3 className="text-xl font-bold text-white mb-2">Practice Quiz</h3>
                    <p className="text-gray-400 text-sm">Test your knowledge with AI-generated questions.</p>
                </div>
                <div className="flex items-center text-sm font-medium text-white/50 group-hover:text-white transition-colors">
                    Start Session <ChevronRight className="w-4 h-4 ml-1" />
                </div>
            </div>
        </motion.div>
    </AppWindow>
);

const NotesMockup = () => (
    <AppWindow className="h-full bg-[#0F0F10] border-gray-800 flex">
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex w-full h-full"
        >
            {/* Notes Sidebar */}
            <div className="w-64 border-r border-white/5 bg-[#0A0A0A] p-4 hidden md:flex flex-col gap-2">
                <div className="flex items-center justify-between mb-4 px-2">
                    <span className="text-sm font-bold text-gray-400">FOLDERS</span>
                </div>
                {[
                    { name: 'Biology 101', active: true },
                    { name: 'History of Art', active: false },
                    { name: 'Intro to CS', active: false },
                ].map((folder, i) => (
                    <div key={i} className={`p-3 rounded-lg text-sm font-medium cursor-pointer flex items-center gap-3 ${folder.active ? 'bg-[#8B5CF6]/10 text-[#8B5CF6]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                        <div className={`w-2 h-2 rounded-full ${folder.active ? 'bg-[#8B5CF6]' : 'bg-gray-600'}`} />
                        {folder.name}
                    </div>
                ))}
            </div>

            {/* Note Content */}
            <div className="flex-1 p-8 md:p-12 overflow-y-auto">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-3xl font-bold text-white mb-6">Mitochondria & Cellular Respiration</h1>
                    <div className="flex items-center gap-4 mb-8 text-sm text-gray-500">
                        <span>Last edited 2 mins ago</span>
                        <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 text-xs border border-green-500/20">Synced</span>
                    </div>

                    <div className="prose prose-invert prose-lg">
                        <p className="text-gray-300">
                            The <span className="text-[#8B5CF6] font-semibold bg-[#8B5CF6]/10 px-1 rounded">mitochondria</span> is often referred to as the powerhouse of the cell. It generates most of the cell's supply of adenosine triphosphate (ATP), used as a source of chemical energy.
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-gray-400 mt-4">
                            <li>Double membrane structure</li>
                            <li>Contains its own DNA</li>
                            <li>Key role in apoptosis (programmed cell death)</li>
                        </ul>

                        <div className="mt-8 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm flex gap-3">
                            <div className="mt-0.5">💡</div>
                            <div>
                                <strong>AI Insight:</strong> Mitochondria likely evolved from bacteria that were engulfed by ancestral eukaryotic cells (Endosymbiotic Theory).
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    </AppWindow>
);

const CourseMockup = () => (
    <AppWindow className="h-full bg-[#0F0F10] border-gray-800" showControls={true}>
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex h-full"
        >
            {/* Sidebar */}
            <div className="w-64 border-r border-white/5 bg-[#0A0A0A] p-6 hidden md:block">
                <div className="h-8 w-24 bg-white/10 rounded mb-8"></div>
                <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                        <div className="h-4 w-12 bg-white/5 rounded"></div>
                        <div className="h-10 w-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 rounded-lg flex items-center px-3 gap-2">
                            <div className="w-4 h-4 rounded-full bg-[#8B5CF6]"></div>
                            <div className="h-2 w-20 bg-white/20 rounded"></div>
                        </div>
                        <div className="h-10 w-full bg-transparent hover:bg-white/5 rounded-lg flex items-center px-3 gap-2">
                            <div className="w-4 h-4 rounded-full border border-white/20"></div>
                            <div className="h-2 w-24 bg-white/10 rounded"></div>
                        </div>
                        <div className="h-10 w-full bg-transparent hover:bg-white/5 rounded-lg flex items-center px-3 gap-2">
                            <div className="w-4 h-4 rounded-full border border-white/20"></div>
                            <div className="h-2 w-16 bg-white/10 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8 md:p-12 overflow-y-auto">
                <div className="flex items-center gap-3 mb-6">
                    <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold border border-blue-500/20">MODULE 1</span>
                    <span className="text-[#9CA3AF] text-sm">3 min read</span>
                </div>

                <h3 className="text-3xl font-bold text-white mb-6">Introduction to Neural Networks</h3>

                <div className="space-y-4 mb-8">
                    <div className="h-4 bg-white/10 rounded w-full"></div>
                    <div className="h-4 bg-white/10 rounded w-5/6"></div>
                    <div className="h-4 bg-white/10 rounded w-4/6"></div>
                </div>

                {/* Interactive Element */}
                <div className="p-6 rounded-xl border border-white/10 bg-white/5 mb-8">
                    <h4 className="font-semibold text-white mb-4">Quick Check</h4>
                    <div className="space-y-3">
                        {[
                            "A biological neuron",
                            "A mathematical function",
                            "A computer chip"
                        ].map((opt, i) => (
                            <div key={i} className={`p-4 rounded-lg border ${i === 1 ? 'border-[#8B5CF6] bg-[#8B5CF6]/10' : 'border-white/5 bg-black/20'} flex justify-between items-center cursor-pointer`}>
                                <span className={i === 1 ? 'text-white' : 'text-[#9CA3AF]'}>{opt}</span>
                                {i === 1 && <Check className="w-4 h-4 text-[#8B5CF6]" />}
                            </div>
                        ))}
                    </div>
                </div>

                <button className="flex items-center justify-center w-full py-4 rounded-lg bg-[#8B5CF6] text-white font-bold hover:bg-[#7C3AED] transition-colors shadow-lg shadow-purple-500/20">
                    Continue to Lesson 2 <ChevronRight className="w-4 h-4 ml-2" />
                </button>
            </div>
        </motion.div>
    </AppWindow>
);

const FeedMockup = () => (
    <AppWindow className="h-full bg-[#0F0F10] border-gray-800 flex justify-center items-center">
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-md h-[90%] bg-black border border-white/10 rounded-2xl overflow-hidden relative"
        >
            {/* Mobile Header */}
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/80 backdrop-blur absolute top-0 w-full z-10">
                <div className="font-bold text-lg">For You</div>
                <div className="w-8 h-8 rounded-full bg-white/10"></div>
            </div>

            {/* Cards */}
            <div className="h-full pt-16 p-4 space-y-4">
                {/* Card 1 */}
                <div className="bg-[#1C1C1E] p-6 rounded-2xl border border-white/5">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded text-xs">HISTORY</div>
                    </div>
                    <p className="text-xl font-medium text-white mb-6">Which empire was known as the "Empire on which the sun never sets"?</p>
                    <div className="space-y-2">
                        <div className="p-3 rounded-lg bg-white/5 hover:bg-white/10 text-center text-sm cursor-pointer">Roman Empire</div>
                        <div className="p-3 rounded-lg bg-[#28C840]/20 border border-[#28C840]/50 text-white text-center text-sm cursor-pointer">British Empire</div>
                        <div className="p-3 rounded-lg bg-white/5 hover:bg-white/10 text-center text-sm cursor-pointer">Mongol Empire</div>
                    </div>
                </div>

                {/* Card 2 Partial */}
                <div className="bg-[#1C1C1E] p-6 rounded-2xl border border-white/5 opacity-50">
                    <div className="h-4 w-24 bg-white/10 rounded mb-4"></div>
                    <div className="h-4 w-full bg-white/10 rounded mb-2"></div>
                    <div className="h-4 w-2/3 bg-white/10 rounded"></div>
                </div>
            </div>
        </motion.div>
    </AppWindow>
);

const ChatMockup = () => (
    <AppWindow className="h-full bg-[#0F0F10] border-gray-800 p-6 flex flex-col">
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col max-w-2xl mx-auto w-full"
        >
            <div className="flex-1 space-y-6">
                <div className="flex gap-4">
                    <div className="mt-1"><div className="w-8 h-8 rounded-full bg-[#8B5CF6] flex items-center justify-center text-xs font-bold">AI</div></div>
                    <div className="flex-1">
                        <div className="bg-white/5 p-4 rounded-2xl rounded-tl-sm border border-white/5 text-[#D1D5DB] leading-relaxed">
                            Based on your recent quiz results, you seem to be struggling with <span className="text-[#8B5CF6]">Quantum Entanglement</span>. Would you like a quick 2-minute explanation?
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 flex-row-reverse">
                    <div className="mt-1"><div className="w-8 h-8 rounded-full bg-gray-600"></div></div>
                    <div className="flex-1 text-right">
                        <div className="bg-[#8B5CF6] p-4 rounded-2xl rounded-tr-sm text-white inline-block text-left">
                            Yes please, explain it like I'm 5.
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="mt-1"><div className="w-8 h-8 rounded-full bg-[#8B5CF6] flex items-center justify-center text-xs font-bold">AI</div></div>
                    <div className="flex-1">
                        <div className="bg-white/5 p-4 rounded-2xl rounded-tl-sm border border-white/5 text-[#D1D5DB] leading-relaxed">
                            Imagine you have two magic dice. No matter how far apart they are—even if one is on Mars—if you roll a 6 on one, the other one INSTANTLY shows a 6 too. They are connected in a spooky way! 🎲🎲
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 relative">
                <input
                    type="text"
                    placeholder="Ask Genie anything..."
                    className="w-full bg-[#1C1C1E] border border-white/10 rounded-full py-4 px-6 text-white focus:outline-none focus:border-[#8B5CF6] transition-colors"
                />
                <div className="absolute right-2 top-2 p-2 bg-[#8B5CF6] rounded-full">
                    <ChevronRight className="w-4 h-4 text-white" />
                </div>
            </div>
        </motion.div>
    </AppWindow>
);
