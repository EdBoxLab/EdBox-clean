'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, BookOpen, Brain, Trophy, MessageCircle, Menu, X, Loader, Check, AlertCircle, Map } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import posthog from 'posthog-js';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const StepProgress = ({ goals }: { goals: any[] }) => {
  if (!goals || goals.length === 0) return null;
  
  return (
    <div className="flex items-center gap-3 p-4 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800 sticky top-0 z-30 overflow-x-auto no-scrollbar shadow-2xl">
      <div className="flex-shrink-0 mr-2">
        <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
          <Map className="w-4 h-4 text-purple-400" />
        </div>
      </div>
      <div className="flex items-center gap-4 min-w-max pr-6">
        {goals.map((goal, idx) => (
          <React.Fragment key={goal.id}>
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-500 ${
                goal.status === 'mastered' ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 
                goal.status === 'in_progress' ? 'bg-purple-600 text-white animate-pulse shadow-[0_0_15px_rgba(147,51,234,0.4)]' : 
                'bg-gray-800 text-gray-500 border border-gray-700'
              }`}>
                {goal.status === 'mastered' ? <Check className="w-4 h-4" strokeWidth={3} /> : idx + 1}
              </div>
              <div className="flex flex-col">
                <span className={`text-[9px] font-black uppercase tracking-wider truncate max-w-[80px] ${
                  goal.status === 'mastered' ? 'text-green-400' : 
                  goal.status === 'in_progress' ? 'text-purple-400' : 
                  'text-gray-500'
                }`}>
                  {goal.text}
                </span>
                <div className="h-0.5 w-full bg-gray-800 rounded-full mt-0.5 overflow-hidden">
                   <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${goal.confidence || 0}%` }}
                    className={`h-full ${goal.status === 'mastered' ? 'bg-green-500' : 'bg-purple-500'}`}
                   />
                </div>
              </div>
            </div>
            {idx < goals.length - 1 && (
              <div className={`h-[1px] w-6 flex-shrink-0 ${
                goals[idx+1].status !== 'pending' ? 'bg-purple-500/50' : 'bg-gray-800'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};import {
  InteractiveCourseSession as SessionType,
  QuickCheckQuestion
} from '@/types/interactive-course';
import { ChatMessage } from '@/lib/services/chat-storage';
import { sessionManager } from '@/lib/services/interactive-course-session-manager';
import QuizBubble from './QuizBubble';
import ChallengeView from './ChallengeView';
import { GeneratedChallenge } from '@/types/skill-progression';
import GoalTracker from './GoalTracker';

interface RoadmapItem {
  id: string;
  text: string;
  description: string;
  confidence: number;
}

function RoadmapWelcome({
  title,
  description,
  items,
  onStart
}: {
  title: string;
  description: string;
  items: RoadmapItem[];
  onStart: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl my-4"
    >
      <div className="p-8 bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border-b border-gray-800">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-purple-500/20 rounded-2xl border border-purple-500/30">
            <BookOpen className="w-8 h-8 text-purple-400" />
          </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">{title}</h2>
            </div>
          </div>
        <p className="text-gray-300 leading-relaxed text-sm lg:text-base font-medium">
          {description}
        </p>
      </div>

      <div className="p-6 space-y-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-2">Core Learning Objectives</h3>
        <div className="grid gap-3">
          {items.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * idx }}
              className="flex items-center gap-4 p-4 bg-gray-800/40 rounded-2xl border border-gray-700/50 hover:border-purple-500/30 transition-all group"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center border border-gray-700 font-bold text-purple-400 text-sm group-hover:border-purple-500/50 transition-colors">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">{item.text}</h4>
                <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">Confidence</div>
                <div className="text-sm font-black text-white">{item.confidence}%</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="p-6 bg-gray-900/50 border-t border-gray-800">
        <button
          onClick={onStart}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-purple-500/20 transition-all active:scale-95 flex items-center justify-center gap-3"
        >
          <Trophy className="w-6 h-6" />
          Start Learning Journey
        </button>
      </div>
    </motion.div>
  );
}

interface InteractiveCourseSessionProps {
  courseId: string;
  userId: string;
  courseTitle?: string;
  courseCreator?: string;
  skillGraph?: any;
  onStartChallenge?: () => void;
}

export default function InteractiveCourseSession({
  courseId,
  userId,
  courseTitle = 'Interactive Course',
  courseCreator = 'AI Tutor',
  skillGraph,
  onStartChallenge
}: InteractiveCourseSessionProps) {
  const safeSkillGraph = skillGraph || { id: courseId, goal: courseTitle, nodes: [], edges: [] };

  const [session, setSession] = useState<SessionType | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showActionButtons, setShowActionButtons] = useState(false);
  const [activeChallenge, setActiveChallenge] = useState<GeneratedChallenge | null>(null);
  const [learningStage, setLearningStage] = useState<'EXPLAIN' | 'QUIZ' | 'CHALLENGE'>('EXPLAIN');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initializingRef = useRef(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    initializeSessionWithIntro();
  }, [courseId, userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeSessionWithIntro = async () => {
    if (initializingRef.current) return;
    initializingRef.current = true;

    try {
      if (!userId || !courseId) {
        initializingRef.current = false;
        return;
      }

      const existingSessionData = await sessionManager.resumeSession(userId, courseId);

      if (existingSessionData) {
        setSession(existingSessionData);
        const history = await sessionManager.getSessionHistory(existingSessionData.id);
        if (history && history.length > 0) {
          const mappedMessages: ChatMessage[] = history.map(m => {
            const typeMap: Record<string, string> = {
              'summary': 'roadmap',
              'assessment': 'quiz',
              'challenge': 'challenge_trigger',
              'roadmap': 'roadmap',
              'quiz': 'quiz',
              'challenge_trigger': 'challenge_trigger'
            };

            const chatMessageType = (typeMap[m.messageType] || m.messageType) as ChatMessage['type'];

            return {
              id: m.id || `msg-${Math.random()}`,
              role: m.role,
              content: m.content,
              timestamp: new Date(m.timestamp),
              type: chatMessageType,
              roadmapData: m.metadata?.roadmapData,
              quizData: m.metadata?.quizData,
              challengeData: m.metadata?.challengeData
            };
          });
          setMessages(mappedMessages);
          setShowActionButtons(true);
          setIsInitializing(false);
          return;
        }
      }

      const newSession = await sessionManager.createSession(courseId, userId);
      setSession(newSession);

      const introContent = `Hey there! Welcome to your interactive learning journey! I'm Genie, and I'm excited to help you master ${courseTitle}. I'm setting up your custom roadmap now!`;

      const introMessage: ChatMessage = {
        id: 'intro-' + Date.now(),
        role: 'genie',
        content: introContent,
        timestamp: new Date(),
        type: 'message'
      };

      setMessages([introMessage]);
      setIsInitializing(false);

      handleSendMessage(`Diving into ${courseTitle}! Let's see the roadmap.`, true, undefined, newSession.id);

    } catch (error) {
      console.error('Failed to initialize session:', error);
    } finally {
      setIsInitializing(false);
      initializingRef.current = false;
    }
  };

  const handleSendMessage = async (text: string, isAuto = false, stageOverride?: 'EXPLAIN' | 'QUIZ' | 'CHALLENGE', sessionIdOverride?: string) => {
    if (!text.trim() || isLoading) return;

    const currentSkillId = safeSkillGraph?.nodes?.[0]?.id || courseId;
    const effectiveSessionId = sessionIdOverride || session?.id;

    if (!effectiveSessionId && !isInitializing) {
      console.warn('No session ID available for message');
      return;
    }

    const userMessage: ChatMessage = {
      id: 'user-' + Date.now(),
      role: 'learner',
      content: text.trim(),
      timestamp: new Date(),
      type: 'message'
    };

    setShowActionButtons(false);
    setMessages(prev => [...prev, userMessage]);
    if (!isAuto) setInputMessage('');
    setIsLoading(true);

    const genieMessageId = 'genie-' + Date.now();
    const genieMessage: ChatMessage = {
      id: genieMessageId,
      role: 'genie',
      content: '',
      timestamp: new Date(),
      type: 'message'
    };

    setMessages(prev => [...prev, genieMessage]);

    try {
      const response = await fetch('/api/genie/interactive-course/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: userMessage.content,
          sessionId: effectiveSessionId,
          courseId,
          currentSkillId,
          skillTitle: courseTitle,
          learningStage: stageOverride || learningStage,
          conversationHistory: messages.slice(-5),
          turnCount: messages.length, // Already includes the user message just added
          learningContext: session?.learningContext
        })
      });

      if (!response.ok) throw new Error('API error');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No reader');

      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'content') {
                fullContent += data.content;
                setMessages(prev => prev.map(msg =>
                  msg.id === genieMessageId ? { ...msg, content: fullContent } : msg
                ));
              } else if (data.type === 'roadmap') {
                setMessages(prev => prev.map(msg =>
                  msg.id === genieMessageId ? { ...msg, type: 'roadmap' as any, roadmapData: data.roadmapData } : msg
                ));
              } else if (data.type === 'quiz') {
                setMessages(prev => prev.map(msg =>
                  msg.id === genieMessageId ? { ...msg, type: 'quiz', quizData: data.quizData, content: data.quizData.question } : msg
                ));
              } else if (data.type === 'challenge_trigger') {
                setMessages(prev => prev.map(msg =>
                  msg.id === genieMessageId ? { ...msg, type: 'challenge_trigger', challengeData: data.challengeData, content: data.challengeData.description } : msg
                ));
              } else if (data.type === 'goals_updated') {
                // Real-time Goal Update!
                const newGoals = data.goals;
                // Track skill mastered events for newly mastered goals
                if (session?.learningContext?.goals) {
                  const previousGoals = session.learningContext.goals;
                  newGoals.forEach((goal: any) => {
                    const prevGoal = previousGoals.find((g: any) => g.id === goal.id);
                    if (goal.status === 'mastered' && prevGoal?.status !== 'mastered') {
                      posthog.capture('skill_mastered', {
                        course_id: courseId,
                        course_title: courseTitle,
                        skill_id: goal.id,
                        skill_name: goal.text,
                        confidence_level: goal.confidence,
                        session_id: session?.id,
                      });
                    }
                  });
                }
                setSession(prev => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    learningContext: {
                      ...prev.learningContext,
                      goals: newGoals
                    }
                  };
                });
              }
            } catch (e) { }
          }
        }
      }
      setShowActionButtons(true);
    } catch (error) {
      console.error(error);
      setMessages(prev => prev.map(msg =>
        msg.id === genieMessageId ? { 
          ...msg, 
          type: 'error' as any,
          content: "I encountered an issue while processing your request." 
        } : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChallengeTrigger = (challengeId: string, challengeData: any) => {
    setActiveChallenge({
      id: challengeId,
      skillId: courseId,
      title: challengeData.title || 'Practical Challenge',
      description: challengeData.description,
      difficultyLevel: challengeData.difficulty || 'Medium',
      estimatedTime: 5,
      validationCriteria: ["Accuracy", "Completeness"],
      hints: [challengeData.hint].filter(Boolean),
      learningObjectives: ["Synthesis"],
      expectedOutcome: challengeData.expectedOutcome
    } as any);
  };

  if (activeChallenge) {
    return (
      <ChallengeView
        challenge={activeChallenge}
        sessionId={session?.id}
        onSuccess={() => {
          const title = activeChallenge.title;
          // Track challenge completed event (success)
          posthog.capture('challenge_completed', {
            course_id: courseId,
            course_title: courseTitle,
            challenge_id: activeChallenge.id,
            challenge_title: title,
            difficulty: activeChallenge.difficultyLevel,
            success: true,
            session_id: session?.id,
          });
          setActiveChallenge(null);
          handleSendMessage(`I've successfully mastered the challenge: "${title}"!`, true);
        }}
        onFail={() => {
          const title = activeChallenge.title;
          // Track challenge completed event (failed)
          posthog.capture('challenge_completed', {
            course_id: courseId,
            course_title: courseTitle,
            challenge_id: activeChallenge.id,
            challenge_title: title,
            difficulty: activeChallenge.difficultyLevel,
            success: false,
            session_id: session?.id,
          });
          setActiveChallenge(null);
          handleSendMessage(`I struggled with the challenge: "${title}". I need more practice.`, true);
        }}
        onClose={() => setActiveChallenge(null)}
      />
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-950 text-white font-sans overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 lg:hidden"
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="w-[85%] max-w-[320px] h-full bg-gray-900 border-r border-gray-800 p-6 flex flex-col gap-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-600/20 rounded-xl border border-purple-500/20">
                    <Brain className="w-5 h-5 text-purple-400" />
                  </div>
                    <div>
                      <h2 className="font-bold text-sm tracking-tight">Quest Log</h2>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest">Cognitive Ascent</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 text-gray-500 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
  
                  <div className="flex-1 overflow-y-auto">
                    {session?.learningContext?.goals && (
                      <div className="space-y-4">
                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Growth Pulse</h3>
                        <GoalTracker goals={session.learningContext.goals || []} />
                      </div>
                    )}
                </div>

                <div className="pt-6 border-t border-gray-800">
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sidebar with Sticky Goal Tracker (Desktop) */}
        <aside className="hidden lg:flex w-[320px] bg-gray-900 border-r border-gray-800 flex-col p-6 gap-6 overflow-y-auto shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-600/20 rounded-xl border border-purple-500/20">
              <Brain className="w-5 h-5 text-purple-400" />
            </div>
              <div>
                <h2 className="text-lg font-bold">{courseTitle}</h2>
              </div>
            </div>

            {/* Real-Time Goal Tracker */}
            {session?.learningContext?.goals && session.learningContext.goals.length > 0 && (
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <GoalTracker goals={session.learningContext.goals || []} />
              </div>
            )}

          <div className="mt-auto pt-6 border-t border-gray-800">
          </div>
        </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-h-0 relative">
        {/* Mobile Sidebar Toggle & Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-gray-800 bg-gray-900/50 backdrop-blur-xl sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="lg:hidden p-2 text-gray-400" onClick={() => setIsSidebarOpen(true)}><Menu /></div>
            <h1 className="font-bold text-sm tracking-tight">GENIE <span className="text-purple-500">SESSION</span></h1>
          </div>
          <div className="flex items-center gap-3">
            {(() => {
              const progress = session?.progressState?.overallCourseProgress || 0;
              return (
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${progress <= 30 ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                    progress <= 69 ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
                      'bg-green-500/10 border-green-500/30 text-green-400'
                  }`}>
                  <div className="flex flex-col items-end">
                    <span className="text-[8px] font-black uppercase tracking-tighter leading-none opacity-60">Mastery</span>
                    <span className="text-xs font-black leading-none">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-1.5 h-6 bg-gray-800 rounded-full overflow-hidden flex flex-col justify-end">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${progress}%` }}
                      className={`w-full rounded-full ${progress <= 30 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                          progress <= 69 ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]' :
                            'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
                        }`}
                    />
                  </div>
                  {progress >= 70 && (
                    <Trophy className="w-3.5 h-3.5 text-green-400 animate-bounce" />
                  )}
                </div>
              );
            })()}
          </div>
          </header>

          <StepProgress goals={session?.learningContext?.goals || []} />

          {/* Message List */}
        <div className="flex-1 overflow-y-auto scroll-smooth">
          <div className="w-full px-4 lg:px-6 py-8 space-y-8">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'learner' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[95%] lg:max-w-[90%] ${message.role === 'learner'
                      ? 'bg-purple-600 text-white px-5 py-3.5 rounded-2xl rounded-tr-sm shadow-lg shadow-purple-500/10'
                      : message.type === 'roadmap' || message.type === 'quiz' || message.type === 'challenge_trigger'
                        ? 'w-full'
                        : 'bg-gray-800/80 border border-gray-700/50 px-5 py-3.5 rounded-2xl rounded-tl-sm backdrop-blur-sm'
                    }`}>
                    {message.type === 'roadmap' && message.roadmapData ? (
                      <RoadmapWelcome
                        {...message.roadmapData}
                        onStart={() => {
                          // Track learning path started event
                          posthog.capture('learning_path_started', {
                            course_id: courseId,
                            course_title: courseTitle,
                            objectives_count: message.roadmapData?.items?.length || 0,
                          });
                          handleSendMessage("Let's tackle the first goal!", true);
                        }}
                      />
                    ) : message.type === 'quiz' && message.quizData ? (
                      <QuizBubble
                        {...message.quizData}
                        onAnswer={(ans, corr) => {
                          const question = message.quizData?.question;
                          // Track quiz answered event
                          posthog.capture('quiz_answered', {
                            course_id: courseId,
                            course_title: courseTitle,
                            question: question,
                            answer_given: ans,
                            is_correct: corr,
                            session_id: session?.id,
                          });
                          handleSendMessage(
                            corr
                              ? `I correctly answered the quiz: "${question}"`
                              : `I struggled with the quiz: "${question}"`,
                            true
                          );
                        }}
                      />
                    ) : message.type === 'challenge_trigger' && message.challengeData ? (

                      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-6 rounded-2xl shadow-xl border border-white/10">
                        <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-yellow-300" />
                          {message.challengeData.title}
                        </h3>
                        <p className="text-white/80 mb-4 text-sm leading-relaxed">{message.challengeData.description}</p>
                        <button
                          onClick={() => handleChallengeTrigger(message.id, message.challengeData)}
                          className="w-full py-3 bg-white text-purple-700 font-bold rounded-xl hover:bg-gray-100 transition-all active:scale-95"
                        >
                          Accept Challenge
                        </button>
                      </div>
                      ) : message.type === 'error' ? (
                          <div className="flex flex-col items-center gap-4 p-6 bg-red-500/10 border border-red-500/20 rounded-2xl">
                            <div className="p-3 bg-red-500/20 rounded-full">
                              <AlertCircle className="w-6 h-6 text-red-500" />
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-medium text-red-200 mb-1">I encountered a little hiccup!</p>
                              <p className="text-xs text-red-400/60">Don't worry, just tap below to get back on track.</p>
                            </div>
                          <button
                            onClick={() => {
                              // Remove the error message and its preceding user message, then retry
                              setMessages(prev => {
                                const newMessages = [...prev];
                                const errorIdx = newMessages.findIndex(m => m.id === message.id);
                                if (errorIdx > 0) {
                                  const lastUserMsg = newMessages[errorIdx - 1];
                                  newMessages.splice(errorIdx - 1, 2);
                                  setTimeout(() => handleSendMessage(lastUserMsg.content, true), 100);
                                }
                                return newMessages;
                              });
                            }}
                            className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-black rounded-xl transition-all active:scale-95 shadow-lg shadow-red-900/20"
                          >
                            Let's Start!
                          </button>
                        </div>
                      ) : (
                        <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && <div className="text-xs text-gray-500 animate-pulse">Genie is thinking...</div>}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Footer */}
        <footer className="p-4 border-t border-gray-800 bg-gray-900/80 backdrop-blur-md space-y-3">
          {/* Action Buttons - Quiz and Challenge */}
          <AnimatePresence>
            {showActionButtons && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex gap-2 overflow-x-auto pb-2 no-scrollbar"
              >
                <button
                  onClick={() => {
                    setLearningStage('QUIZ');
                    handleSendMessage("Quiz me on what we've learned!", true, 'QUIZ');
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 text-blue-300 rounded-xl text-sm font-semibold whitespace-nowrap transition-all active:scale-95"
                >
                  <Brain className="w-4 h-4" />
                  Quiz Me
                </button>
                <button
                  onClick={() => {
                    setLearningStage('CHALLENGE');
                    handleSendMessage("I'm ready for a challenge!", true, 'CHALLENGE');
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-amber-600/20 hover:bg-amber-600/40 border border-amber-500/30 text-amber-300 rounded-xl text-sm font-semibold whitespace-nowrap transition-all active:scale-95"
                >
                  <Trophy className="w-4 h-4" />
                  Challenge Me
                </button>
                <button
                  onClick={() => {
                    handleSendMessage("Tell me more about this topic", true);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-700/50 hover:bg-gray-700 border border-gray-600/30 text-gray-300 rounded-xl text-sm font-semibold whitespace-nowrap transition-all active:scale-95"
                >
                  <MessageCircle className="w-4 h-4" />
                  Explain More
                </button>
                {onStartChallenge && (
                  <button
                    onClick={onStartChallenge}
                    className="flex items-center gap-2 px-4 py-2.5 bg-green-600/20 hover:bg-green-600/40 border border-green-500/30 text-green-300 rounded-xl text-sm font-semibold whitespace-nowrap transition-all active:scale-95"
                  >
                    <Trophy className="w-4 h-4" />
                    Start Practice
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="w-full flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputMessage)}
              placeholder="Ask anything..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={() => handleSendMessage(inputMessage)}
              disabled={isLoading}
              className="p-3 bg-purple-600 rounded-xl hover:bg-purple-500 transition-colors disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}
