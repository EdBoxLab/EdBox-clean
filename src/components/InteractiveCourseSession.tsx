'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, BookOpen, Brain, Trophy, MessageCircle, Menu, X, Loader, AlertCircle, ChevronRight, Clock, Coffee } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import posthog from 'posthog-js';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ProgressBar, StepProgress, ProgressBarHandle } from './InteractiveCourseProgress';
import {
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
      className="w-full max-w-4xl mx-auto bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl my-4"
    >
      <div className="p-8 bg-gradient-to-br from-blue-950/40 to-purple-950/40 border-b border-gray-800">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl border border-blue-500/30">
            <BookOpen className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
          </div>
        </div>
        <p className="text-gray-300 leading-relaxed text-sm lg:text-base">
          {description}
        </p>
      </div>

      <div className="p-6 space-y-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">What You'll Learn</h3>
        <div className="grid gap-3">
          {items.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * idx }}
              className="flex items-center gap-4 p-4 bg-gray-800/40 rounded-xl border border-gray-700/50 hover:border-blue-500/30 transition-all group"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center border border-gray-700 font-semibold text-blue-400 text-sm group-hover:border-blue-500/50 transition-colors">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">{item.text}</h4>
                <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-medium text-gray-500 uppercase mb-1">Progress</div>
                <div className="text-sm font-semibold text-white">{item.confidence}%</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="p-6 bg-gray-900/50 border-t border-gray-800">
        <button
          type="button"
          onClick={onStart}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-semibold text-lg shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"
        >
          <BookOpen className="w-5 h-5" />
          Start Learning
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
  initialNodeId?: string;
  onStartChallenge?: () => void;
}

export default function InteractiveCourseSession({
  courseId,
  userId,
  courseTitle = 'Interactive Course',
  courseCreator = 'AI Tutor',
  skillGraph,
  initialNodeId,
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
  const [resumeBanner, setResumeBanner] = useState<{ goalName: string; progress: string } | null>(null);
  const [celebration, setCelebration] = useState<{ skillName: string } | null>(null);
  const [consecutiveFails, setConsecutiveFails] = useState(0);
  const [sessionStartTime] = useState(() => Date.now());
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [showBreakNudge, setShowBreakNudge] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initializingRef = useRef(false);
  const progressBarRef = useRef<ProgressBarHandle>(null);

  // Session timer
  useEffect(() => {
    const timer = setInterval(() => {
      const mins = Math.floor((Date.now() - sessionStartTime) / 60000);
      setElapsedMinutes(mins);
      if (mins === 45 && !showBreakNudge) {
        setShowBreakNudge(true);
      }
    }, 30000); // Update every 30 seconds
    return () => clearInterval(timer);
  }, [sessionStartTime, showBreakNudge]);

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
    if (!userId || !courseId) return;
    initializeSessionWithIntro();
  }, []);

  useEffect(() => {
    console.log('🔵 SESSION COMPONENT MOUNTED');
    console.log('Session state:', session);
    console.log('Messages count:', messages.length);

    return () => {
      console.log('🔴 SESSION COMPONENT UNMOUNTED - THIS SHOULD NOT HAPPEN');
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
    if (!isLoading && !isInitializing) {
      inputRef.current?.focus();
    }
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
        if (progressBarRef.current && existingSessionData.progressState?.overallCourseProgress !== undefined) {
          progressBarRef.current.setProgress(existingSessionData.progressState.overallCourseProgress);
        }
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

          // Show resume context banner
          const goals = existingSessionData.learningContext?.goals || [];
          const currentGoal = goals.find((g: any) => g.status !== 'mastered');
          const masteredCount = goals.filter((g: any) => g.status === 'mastered').length;
          if (currentGoal) {
            setResumeBanner({
              goalName: currentGoal.text || 'your current topic',
              progress: `${masteredCount}/${goals.length} goals completed`
            });
            setTimeout(() => setResumeBanner(null), 6000);
          }
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

    const currentSkillId = initialNodeId || safeSkillGraph?.nodes?.[0]?.id || courseId;
    const effectiveSessionId = sessionIdOverride || session?.id;

    if (!effectiveSessionId && !isInitializing) {
      console.warn('No session ID available for message');
      return;
    }

    // UUID Validation Helper
    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    // Ensure we only send a valid UUID for currentSkillId
    let validSkillId = currentSkillId;
    if (!isUUID(validSkillId)) {
      console.warn(`[InteractiveSession] Invalid UUID for skillId: "${validSkillId}". Falling back to courseId.`);
      validSkillId = courseId; // Try falling back to courseId

      // If courseId is also invalid (e.g. legacy slug course), we might have a problem,
      // but for now, this fixes the "skill slug" issue.
      if (!isUUID(validSkillId)) {
        console.warn(`[InteractiveSession] CourseId is also not a UUID: "${validSkillId}". API might reject this.`);
      }
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
          currentSkillId: validSkillId,
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
                // Real-time Goal Update - update locally without triggering parent re-renders
                const newGoals = data.goals;
                // NOTE: Removed window.dispatchEvent('skill-progress-updated') 
                // This was causing the parent SkillGraphRenderer to refetch and re-render,
                // which caused the interactive session to remount/refresh.
                // Progress will be synced when the session closes instead.

                // Track skill mastered events for newly mastered goals
                if (session?.learningContext?.goals) {
                  const previousGoals = session.learningContext.goals;
                  newGoals.forEach((goal: any) => {
                    const prevGoal = previousGoals.find((g: any) => g.id === goal.id);
                    if (goal.status === 'mastered' && prevGoal?.status !== 'mastered') {
                      // Trigger celebration animation
                      setCelebration({ skillName: goal.text || 'Skill' });
                      setTimeout(() => setCelebration(null), 4000);

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
              } else if (data.type === 'progress_updated') {
                if (progressBarRef.current && typeof data.progress === 'number') {
                  progressBarRef.current.setProgress(data.progress);
                }
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
          setConsecutiveFails(0);
          setActiveChallenge(null);
          handleSendMessage(`I've successfully mastered the challenge: "${title}"!`, true);
        }}
        onFail={() => {
          const title = activeChallenge.title;
          setConsecutiveFails(prev => prev + 1);
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
                  <div className="p-2.5 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl border border-blue-500/30">
                    <Brain className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-sm tracking-tight">{courseTitle}</h2>
                    <p className="text-[10px] text-gray-500">Learning Path</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 text-gray-500 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {session?.learningContext?.goals && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Learning Goals</h3>
                    <GoalTracker goals={session.learningContext.goals || []} />
                  </div>
                )}
              </div>


            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar with Goal Tracker (Desktop) */}
      <aside className="hidden lg:flex w-[320px] bg-gray-900 border-r border-gray-800 flex-col p-6 gap-6 overflow-y-auto shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl border border-blue-500/30">
            <Brain className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{courseTitle}</h2>
            <p className="text-xs text-gray-500">Learning Path</p>
          </div>
        </div>

        {session?.learningContext?.goals && session.learningContext.goals.length > 0 && (
          <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/50">
            <GoalTracker goals={session.learningContext.goals || []} />
          </div>
        )}
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-h-0 relative">
        {/* Mobile Sidebar Toggle & Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-gray-800 bg-gray-900/50 backdrop-blur-xl sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-semibold text-sm tracking-tight">
              <span className="text-white">EdBox</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 ml-2">Learning</span>
            </h1>
            {elapsedMinutes > 0 && (
              <span className="hidden sm:flex items-center gap-1 text-[10px] text-gray-500 font-mono">
                <Clock className="w-3 h-3" />
                {elapsedMinutes}m
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {session?.learningContext?.goals && session.learningContext.goals.length > 0 && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-800/60 rounded-lg border border-gray-700/40">
                <div className="flex items-center gap-1">
                  {session.learningContext.goals.map((g: any, i: number) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${g.status === 'mastered' ? 'bg-green-400' : 'bg-gray-600'
                        }`}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                  {session.learningContext.goals.filter((g: any) => g.status === 'mastered').length}/{session.learningContext.goals.length}
                </span>
              </div>
            )}
            <ProgressBar ref={progressBarRef} initialProgress={session?.progressState?.overallCourseProgress || 0} />
          </div>
        </header>

        <StepProgress goals={session?.learningContext?.goals || []} />

        {/* Mastery Celebration Overlay */}
        <AnimatePresence>
          {celebration && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              className="absolute inset-x-0 top-20 z-30 flex justify-center pointer-events-none"
            >
              <div className="bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-orange-500/20 border border-yellow-500/30 backdrop-blur-lg rounded-2xl px-8 py-5 shadow-2xl shadow-yellow-500/10 flex items-center gap-4">
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6 }}
                  className="p-3 bg-yellow-500/30 rounded-xl"
                >
                  <Trophy className="w-7 h-7 text-yellow-400" />
                </motion.div>
                <div>
                  <p className="text-lg font-bold text-white">Goal Mastered! 🎉</p>
                  <p className="text-sm text-yellow-200/80">{celebration.skillName}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto scroll-smooth">
          <div className="w-full px-4 lg:px-6 py-8 space-y-8">
            {/* Resume Banner */}
            <AnimatePresence>
              {resumeBanner && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl"
                >
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <BookOpen className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">Welcome back!</p>
                    <p className="text-xs text-gray-400 truncate">Working on: <span className="text-blue-300">{resumeBanner.goalName}</span> · {resumeBanner.progress}</p>
                  </div>
                  <button onClick={() => setResumeBanner(null)} className="text-gray-500 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'learner' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[95%] lg:max-w-[90%] ${message.role === 'learner'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-3.5 rounded-2xl rounded-tr-sm shadow-lg'
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
                          if (corr) {
                            setConsecutiveFails(0);
                          } else {
                            setConsecutiveFails(prev => prev + 1);
                          }
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

                      <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-6 rounded-2xl shadow-xl border border-white/10">
                        <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-white" />
                          {message.challengeData.title}
                        </h3>
                        <p className="text-white/90 mb-4 text-sm leading-relaxed">{message.challengeData.description}</p>
                        <button
                          type="button"
                          onClick={() => handleChallengeTrigger(message.id, message.challengeData)}
                          className="w-full py-3 bg-white text-blue-700 font-semibold rounded-xl hover:bg-gray-100 transition-all active:scale-95 shadow-lg"
                        >
                          Start Challenge
                        </button>
                      </div>
                    ) : message.type === 'error' ? (
                      <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                        <div className="p-2 bg-red-500/20 rounded-lg shrink-0">
                          <AlertCircle className="w-5 h-5 text-red-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-red-200">Something went wrong</p>
                          <p className="text-xs text-red-400/70 mt-0.5">{message.content || "Let's try that again"}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            // Find the user message before this error and retry it
                            const errorIdx = messages.findIndex(m => m.id === message.id);
                            if (errorIdx > 0) {
                              const lastUserMsg = messages[errorIdx - 1];
                              // Remove just the error message, keep the user's message
                              setMessages(prev => prev.filter(m => m.id !== message.id));
                              setTimeout(() => handleSendMessage(lastUserMsg.content, true), 100);
                            }
                          }}
                          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg transition-all active:scale-95 shrink-0"
                        >
                          Retry
                        </button>
                      </div>
                    ) : (
                      <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                        <ReactMarkdown
                          components={{
                            code({ node, className, children, ...props }: any) {
                              const match = /language-(\w+)/.exec(className || '');
                              const inline = !match;
                              return !inline ? (
                                <div className="rounded-xl overflow-hidden my-3 border border-gray-700/50">
                                  <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700/50">
                                    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{match[1]}</span>
                                  </div>
                                  <SyntaxHighlighter
                                    style={vscDarkPlus}
                                    language={match[1]}
                                    PreTag="div"
                                    customStyle={{ margin: 0, borderRadius: 0, background: '#1a1b26' }}
                                    {...props}
                                  >
                                    {String(children).replace(/\n$/, '')}
                                  </SyntaxHighlighter>
                                </div>
                              ) : (
                                <code className="px-1.5 py-0.5 bg-gray-700/60 rounded-md text-blue-300 text-xs font-mono" {...props}>
                                  {children}
                                </code>
                              );
                            }
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="bg-gray-800/80 border border-gray-700/50 px-5 py-3.5 rounded-2xl rounded-tl-sm backdrop-blur-sm">
                  <div className="flex items-center gap-1.5">
                    <motion.span
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                      className="w-2 h-2 bg-blue-400 rounded-full"
                    />
                    <motion.span
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                      className="w-2 h-2 bg-purple-400 rounded-full"
                    />
                    <motion.span
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                      className="w-2 h-2 bg-blue-400 rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
        {/* Break Nudge */}
        <AnimatePresence>
          {showBreakNudge && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mx-4 mt-2 flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl"
            >
              <Coffee className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-xs text-amber-200 flex-1">You've been learning for 45+ minutes — great dedication! Consider a short break to recharge. 🧠</p>
              <button onClick={() => setShowBreakNudge(false)} className="text-amber-400/60 hover:text-amber-200 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

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
                  type="button"
                  onClick={() => {
                    setLearningStage('QUIZ');
                    handleSendMessage("Quiz me on what we've learned!", true, 'QUIZ');
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-xl text-sm font-medium whitespace-nowrap transition-all active:scale-95"
                >
                  <Brain className="w-4 h-4" />
                  Quiz Me
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLearningStage('CHALLENGE');
                    handleSendMessage("I'm ready for a challenge!", true, 'CHALLENGE');
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-xl text-sm font-medium whitespace-nowrap transition-all active:scale-95"
                >
                  <Trophy className="w-4 h-4" />
                  Challenge Me
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleSendMessage("Tell me more about this topic", true);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600/30 text-gray-300 rounded-xl text-sm font-medium whitespace-nowrap transition-all active:scale-95"
                >
                  <MessageCircle className="w-4 h-4" />
                  Explain More
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLearningStage('EXPLAIN');
                    handleSendMessage("I understand this topic. Let's move on to the next one!", true, 'EXPLAIN');
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl text-sm font-semibold whitespace-nowrap transition-all active:scale-95"
                >
                  Next Topic
                  <ChevronRight className="w-4 h-4" />
                </button>
                {onStartChallenge && (
                  <button
                    type="button"
                    onClick={onStartChallenge}
                    className="flex items-center gap-2 px-4 py-2.5 bg-green-600/20 hover:bg-green-600/40 border border-green-500/30 text-green-300 rounded-xl text-sm font-semibold whitespace-nowrap transition-all active:scale-95"
                  >
                    <Trophy className="w-4 h-4" />
                    Start Practice
                  </button>
                )}
                {/* Adaptive Simplify Button - appears after 2+ consecutive fails */}
                {consecutiveFails >= 2 && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    type="button"
                    onClick={() => {
                      setConsecutiveFails(0);
                      handleSendMessage("I'm finding this difficult. Can you explain this topic in simpler terms with an easier example?", true, 'EXPLAIN');
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 rounded-xl text-sm font-semibold whitespace-nowrap transition-all active:scale-95 animate-pulse"
                  >
                    💡 Simplify for me
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="w-full flex gap-3 items-end">
            <textarea
              ref={inputRef}
              rows={1}
              value={inputMessage}
              onChange={(e) => {
                setInputMessage(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(inputMessage);
                  if (inputRef.current) {
                    inputRef.current.style.height = 'auto';
                  }
                }
              }}
              placeholder="Ask anything..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none min-h-[48px] max-h-[200px] transition-all"
            />
            <button
              type="button"
              onClick={() => handleSendMessage(inputMessage)}
              disabled={isLoading}
              className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl transition-all disabled:opacity-50 h-[48px] shrink-0 shadow-lg"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}
