'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, BookOpen, Brain, Trophy, MessageCircle, Menu, X, Loader, Check, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { XPStreakDisplay } from '@/components/XPStreakDisplay';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
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
      className="w-full max-w-2xl mx-auto bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl"
    >
      <div className="p-8 bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border-b border-gray-800">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-purple-500/20 rounded-2xl border border-purple-500/30">
            <BookOpen className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">{title}</h2>
            <p className="text-purple-300/60 font-medium uppercase tracking-widest text-[10px]">Course Roadmap</p>
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
  // Initialize skillGraph with safe defaults
  const safeSkillGraph = skillGraph || { id: courseId, goal: courseTitle, nodes: [], edges: [] };

  // State management
  const [session, setSession] = useState<SessionType | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentAssessment, setCurrentAssessment] = useState<QuickCheckQuestion | null>(null);
  const [assessmentAnswer, setAssessmentAnswer] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showActionButtons, setShowActionButtons] = useState(false);
  const [activeChallenge, setActiveChallenge] = useState<GeneratedChallenge | null>(null);
  const [learningStage, setLearningStage] = useState<'EXPLAIN' | 'QUIZ' | 'CHALLENGE'>('EXPLAIN');

  // Diagnostic render tracking
  const renderRef = useRef(0);
  renderRef.current++;
  if (renderRef.current % 50 === 0) {
    console.warn(`[DIAGNOSTIC] InteractiveCourseSession render count: ${renderRef.current}`);
  }
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initializingRef = useRef(false);

  // Monitor online/offline status
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

  // Initialize session on component mount
  useEffect(() => {
    initializeSessionWithIntro();
  }, [courseId, userId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when assessment is cleared
  useEffect(() => {
    if (!currentAssessment && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentAssessment]);

  // Save session when component unmounts
  useEffect(() => {
    return () => {
      if (session && Array.isArray(messages) && messages.length > 0) {
        sessionManager.persistSession({
          ...session,
          updatedAt: new Date()
        }).catch(err =>
          console.error('Failed to save session on unmount:', err)
        );
      }
    };
  }, [session, messages])

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

        // Load messages from Supabase
        const history = await sessionManager.getSessionHistory(existingSessionData.id);
        if (history && Array.isArray(history) && history.length > 0) {
          const mappedMessages: ChatMessage[] = history.map(m => ({
            id: m.id || `msg-${Math.random()}`,
            role: m.role,
            content: m.content,
            timestamp: new Date(m.timestamp),
            type: m.messageType as any
          }));
          setMessages(mappedMessages);
          setIsInitializing(false);
          return;
        }
      }

      // If no session or no history, create one
      const newSession = await sessionManager.createSession(courseId, userId);
      setSession(newSession);

      const getIntroMessage = () => {
        const title = safeSkillGraph?.goal || courseTitle;
        const allSkills = safeSkillGraph?.nodes || [];
        const firstSkill = allSkills[0]?.name || 'the fundamentals';

        return `Hey there! Welcome to your interactive learning journey! I'm Genie, and I'm excited to help you master ${title}. Today we'll start with ${firstSkill}. What would you like to know about it?`;
      };

      const introContent = getIntroMessage();

      // Save intro message to Supabase
      await sessionManager.addMessage(
        newSession.id,
        'genie',
        introContent,
        'explanation'
      );

      const introMessage: ChatMessage = {
        id: 'intro-' + Date.now(),
        role: 'genie',
        content: introContent,
        timestamp: new Date(),
        type: 'message'
      };

      setMessages([introMessage]);
      setIsInitializing(false);

      // Automatically trigger the first goal interaction
      handleSendMessage("I'm ready to learn! Let's start with the goals.", true);

    } catch (error) {
      console.error('Failed to initialize session:', error);
      const errorMessage: ChatMessage = {
        id: 'error-' + Date.now(),
        role: 'genie',
        content: `Hey there! I'm Genie, your learning companion. I'm ready to help you learn ${courseTitle}! What would you like to start with?`,
        timestamp: new Date(),
        type: 'message'
      };
      setMessages([errorMessage]);
    } finally {
      setIsInitializing(false);
      initializingRef.current = false;
    }
  };

  const handleQuizAnswer = async (messageId: string, answer: string, isCorrect: boolean) => {
    setMessages(prev => prev.map(msg =>
      msg.id === messageId
        ? { ...msg, quizData: { ...msg.quizData!, answered: answer, isCorrect } }
        : msg
    ));

    const nextStage = isCorrect ? 'CHALLENGE' : 'EXPLAIN';

    if (isCorrect) {
      setLearningStage('CHALLENGE');
    } else {
      setLearningStage('EXPLAIN');
    }

    if (session) {
      sessionManager.persistSession({
        ...session,
        updatedAt: new Date()
      }).catch(console.error);
    }

    const resultMessage = isCorrect
      ? "That's exactly right! I'm ready for the next part."
      : `I chose "${answer}", but I'm not sure why it's wrong. Can you explain?`;

    handleSendMessage(resultMessage, true, nextStage);
  };

  const handleChallengeTrigger = (challengeId: string, challengeData: Partial<GeneratedChallenge> = {}) => {
    // Merge provided data with defaults if needed, but prioritize the AI's data
    const activeChallenge: GeneratedChallenge = {
      id: challengeId,
      skillId: courseId,
      title: challengeData.title || `Challenge: ${courseTitle}`,
      description: challengeData.description || `Apply your knowledge of ${courseTitle} by solving this practical scenario.`,
      difficultyLevel: challengeData.difficultyLevel || 'Medium',
      estimatedTime: challengeData.estimatedTime || 5,
      validationCriteria: challengeData.validationCriteria || ["Correct logic", "Comprehensive answer"],
      hints: challengeData.hints || ["Try looking at it from another perspective.", "Remember the core principle we discussed."],
      learningObjectives: challengeData.learningObjectives || ["Synthesis", "Application"],
      // Keep extra fields if present
      expectedOutcome: (challengeData as any).expectedOutcome,
      hint: (challengeData as any).hint
    } as GeneratedChallenge;

    setActiveChallenge(activeChallenge);
  };

  const onChallengeSuccess = async (xpValue: number) => {
    setActiveChallenge(null);
    const currentTopic = session?.currentTopic || 'Current Concept';

    setSession(prev => {
      if (!prev) return prev;
      const updatedContext = {
        ...prev.learningContext,
        masteredConcepts: Array.from(new Set([...(prev.learningContext.masteredConcepts || []), currentTopic])),
        comprehensionLevel: Math.min(1, (prev.learningContext.comprehensionLevel || 0.5) + 0.1)
      };

      const updatedSession = {
        ...prev,
        learningContext: updatedContext,
        lastInteraction: new Date()
      };

      sessionManager.persistSession(updatedSession).catch(console.error);
      return updatedSession;
    });

    handleSendMessage(`Success! I nailed the challenge and earned ${xpValue} XP! What are the learning goals for this skill?`, true, 'EXPLAIN');
    setLearningStage('EXPLAIN');
  };

  const onChallengeFail = (feedback: string) => {
    setActiveChallenge(null);
    handleSendMessage(`That was tough. I need a bit more explanation on this.`, true);
    setLearningStage('EXPLAIN');
  };

  const handleCloseChallenge = () => {
    setActiveChallenge(null);
    setLearningStage('EXPLAIN');
    handleSendMessage("I'm pausing the challenge for now. Let's go over the concepts again.", true);
  };

  const addMessageAndSave = async (message: ChatMessage) => {
    setMessages(prev => {
      // Avoid duplicate messages
      if (prev.some(m => m.id === message.id)) return prev;
      return [...prev, message];
    });

    if (session && message.role === 'learner') {
      setIsSaving(true);
      try {
        await sessionManager.addMessage(
          session.id,
          'learner',
          message.content,
          message.type === 'message' ? 'explanation' : (message.type as any) || 'explanation'
        );
      } catch (err) {
        console.error('Failed to save message to Supabase:', err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const generateChatSummary = (messages: ChatMessage[]): string => {
    return `Learner is in ${learningStage} stage of learning ${courseTitle}.`;
  };

  const getRecentContext = (messages: ChatMessage[]): ChatMessage[] => {
    return messages.filter(msg => msg.type === 'message').slice(-5);
  };

  const handleSendMessage = async (text: string, isAuto = false, stageOverride?: 'EXPLAIN' | 'QUIZ' | 'CHALLENGE') => {
    if (!text.trim() || isLoading) return;

    // Determine current skill ID with defensive check
    const currentSkillId = safeSkillGraph?.nodes?.[0]?.id || courseId;

    if (!currentSkillId) {
      console.warn('Cannot send message: currentSkillId is undefined');
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
    await addMessageAndSave(userMessage);
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
      const recentMessages = getRecentContext(messages);
      const chatSummary = generateChatSummary(messages);

      const response = await fetch('/api/genie/interactive-course/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: userMessage.content,
          sessionId: session?.id,
          courseId,
          currentSkillId,
          skillTitle: courseTitle,  // Send human-readable title
          learningStage: stageOverride || learningStage,
          conversationHistory: recentMessages,
          turnCount: messages.length,  // Explicit turn counter
          chatSummary
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Stream Error:', response.status, errorText);
        throw new Error(`API error (${response.status}): ${errorText || 'Response error'}`);
      }

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
                if (!data.type || data.type === 'content') {
                  setTimeout(() => setShowActionButtons(true), 1000);
                }
                } else if (data.type === 'goals_updated') {
                  // Real-time Goal & Progress Update!
                  const newGoals = data.goals;
                  const newComprehension = data.comprehensionLevel;
                  
                  setSession(prev => {
                    if (!prev) return prev;
                    return {
                      ...prev,
                      learningContext: {
                        ...prev.learningContext,
                        goals: newGoals,
                        comprehensionLevel: newComprehension !== undefined ? newComprehension : prev.learningContext.comprehensionLevel
                      }
                    };
                  });
                }

            } catch (e) { }
          }
        }
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => prev.map(msg =>
        msg.id === genieMessageId ? { ...msg, content: "I encountered an issue. Try asking again!" } : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = () => {
    if (!inputMessage.trim() || isLoading) return;
    handleSendMessage(inputMessage);
    setInputMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleStartChallenge = () => {
    setShowActionButtons(false);
    handleChallengeTrigger('challenge_' + Date.now());
  };

  const handleExplainFurther = () => {
    setShowActionButtons(false);
    handleSendMessage("Can you explain this concept more deeply with examples?", true);
  };

  const handleAskQuestion = () => {
    setShowActionButtons(false);
    inputRef.current?.focus();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get stage label
  const getStageLabel = () => {
    switch (learningStage) {
      case 'EXPLAIN': return '1. Learn';
      case 'QUIZ': return '2. Practice';
      case 'CHALLENGE': return '3. Master';
      default: return 'Learning';
    }
  };

  // Render challenge view as overlay
  if (activeChallenge) {
    return (
      <ChallengeView
        challenge={activeChallenge}
        onSuccess={onChallengeSuccess}
        onFail={onChallengeFail}
        onClose={handleCloseChallenge}
        onSendToChat={(answerText) => {
          // Add user's answer to chat for Genie to review
          const answerMessage: ChatMessage = {
            id: 'answer-' + Date.now(),
            role: 'learner',
            content: answerText,
            timestamp: new Date(),
            type: 'message'
          };
          setMessages(prev => [...prev, answerMessage]);
          // Optionally trigger Genie to review the answer
          handleSendMessage(answerText, false);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-950 text-white font-sans selection:bg-purple-500/30 overflow-hidden">

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: isSidebarOpen ? 0 : '-100%' }}
        transition={{ type: "tween", duration: 0.3 }}
        className="fixed inset-y-0 left-0 z-40 w-[320px] bg-gray-900/95 backdrop-blur-xl p-6 border-r border-gray-800 flex flex-col gap-6 lg:relative lg:translate-x-0"
      >
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Course Header */}
        <div className="flex items-center gap-3 mt-6 lg:mt-0">
          <div className="p-3 bg-purple-600/20 rounded-xl border border-purple-500/20">
            <BookOpen className="w-5 h-5 text-purple-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-white truncate">
              {courseTitle}
            </h2>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Learning Path</p>
          </div>
        </div>

        {/* XP Display */}
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <XPStreakDisplay showCompact={true} skillGraphId={courseId} />
        </div>

        {/* Real-Time Goal Tracker */}
        {session?.learningContext?.goals && session.learningContext.goals.length > 0 && (
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <GoalTracker goals={session.learningContext.goals} />
          </div>
        )}

        {/* Progress Section */}
        {session && (
          <div className="space-y-4">
            {/* Comprehension Level */}
            <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Understanding Level
                </h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-white">
                    {Math.round((session.learningContext?.comprehensionLevel || 0) * 100)}%
                  </span>
                  <span className="text-xs text-gray-500">
                    {(session.learningContext?.masteredConcepts?.length || 0)}/{(session.learningContext?.currentConcepts?.length || 0)} concepts
                  </span>
                </div>
                <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(session.learningContext?.comprehensionLevel || 0) * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                  />
                </div>
              </div>
            </div>

            {/* Current Concepts */}
            {(session.learningContext?.currentConcepts?.length || 0) > 0 && (
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">
                  Learning Now
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(session.learningContext?.currentConcepts || []).map((concept, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${(session.learningContext?.masteredConcepts || []).includes(concept)
                        ? 'bg-green-500/10 border-green-500/30 text-green-400'
                        : 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                        }`}
                    >
                      {concept}
                    </motion.span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.aside>

      {/* Backdrop for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen lg:min-h-0">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-6 border-b border-gray-800 bg-gray-900/50 backdrop-blur-xl sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center border border-gray-700">
                  <MessageCircle className="w-5 h-5 text-purple-400" />
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${isOnline ? 'bg-green-500' : 'bg-red-500'} border-2 border-gray-900 rounded-full`} />
              </div>
                <div>
                  <h1 className="font-bold text-sm text-white">AI Learning Companion</h1>
                  <p className="text-xs text-gray-400">{getStageLabel()}</p>
                </div>
              </div>

              {/* Mini Progress Bar (for quick view) */}
              {session && (
                <div className="hidden md:flex flex-col items-center gap-1 mx-4 min-w-[120px]">
                  <div className="flex justify-between w-full text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <span>Progress</span>
                    <span>{Math.round((session.learningContext?.comprehensionLevel || 0) * 100)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                    <motion.div
                      animate={{ width: `${(session.learningContext?.comprehensionLevel || 0) * 100}%` }}
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                    />
                  </div>
                </div>
              )}
            </div>


          <div className="flex items-center gap-4">
            {!isOnline && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span className="text-xs font-semibold text-red-400">Offline</span>
              </div>
            )}
            {isSaving && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <Loader className="w-3 h-3 text-purple-400 animate-spin" />
                <span className="text-xs font-semibold text-purple-400">Saving</span>
              </div>
            )}
            <button
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
              aria-label="View achievements"
            >
              <Trophy className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-6 space-y-6">
          {/* Loading State */}
          {isInitializing && (
            <div className="space-y-4">
              <div className="h-20 bg-gray-800/50 rounded-xl animate-pulse" />
              <div className="h-32 bg-gray-800/50 rounded-xl animate-pulse" />
            </div>
          )}

          {/* Empty State */}
          {!isInitializing && (!messages || messages.length === 0) && (
            <div className="text-center py-20">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-xl font-bold mb-2 text-white">Start Your Learning Journey</h3>
              <p className="text-gray-400">Ask a question or request an explanation to begin</p>
            </div>
          )}

          {/* Messages */}
          <AnimatePresence initial={false}>
            {(messages || []).map((message, index) => (
              <motion.div
                key={message.id}
                initial={index >= (messages?.length || 0) - 1 ? { opacity: 0, y: 20 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${message.role === 'learner' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] lg:max-w-[75%] ${message.role === 'learner'
                  ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white px-4 py-3 rounded-2xl rounded-tr-md'
                  : message.type === 'quiz' || message.type === 'challenge_trigger' || (message as any).type === 'roadmap'
                      ? 'w-full'
                      : 'bg-gray-800/50 border border-gray-700 px-4 py-3 rounded-2xl rounded-tl-md'
                    }`}>
                    {(message as any).type === 'roadmap' ? (
                      <RoadmapWelcome 
                        title={(message as any).roadmapData.title}
                        description={(message as any).roadmapData.description}
                        items={(message as any).roadmapData.items}
                        onStart={() => handleSendMessage("Let's begin with the first topic!")}
                      />
                    ) : message.type === 'quiz' && message.quizData ? (

                    <QuizBubble {...message.quizData} onAnswer={(ans, corr) => handleQuizAnswer(message.id, ans, corr)} />
                  ) : message.type === 'challenge_trigger' && message.challengeData ? (
                    <div className="p-6 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl border border-white/10">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-white/10 rounded-xl">
                          <Trophy className="w-6 h-6 text-yellow-300" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">{message.challengeData.title || 'Practical Challenge'}</h3>
                          <p className="text-xs text-white/60 uppercase tracking-wider">{courseTitle}</p>
                        </div>
                      </div>
                      <p className="text-white/90 mb-6 leading-relaxed">
                        {message.challengeData.description}
                      </p>
                      <button
                        onClick={() => handleChallengeTrigger(message.challengeData!.challengeId, message.challengeData!)}
                        className="w-full py-3 bg-white text-indigo-700 rounded-xl font-bold hover:bg-gray-100 transition-colors flex items-center justify-center gap-3"
                      >
                        <Brain className="w-5 h-5" />
                        Start Challenge
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="prose prose-invert max-w-none text-white leading-relaxed">
                        <ReactMarkdown
                          components={{
                            code({ node, inline, className, children, ...props }: { node?: any; inline?: boolean; className?: string; children?: React.ReactNode;[key: string]: any }) {
                              const match = /language-(\w+)/.exec(className || '');
                              return !inline && match ? (
                                <SyntaxHighlighter
                                  style={vscDarkPlus}
                                  language={match[1]}
                                  PreTag="div"
                                  className="rounded-lg text-sm"
                                  {...props}
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              ) : (
                                <code className="bg-gray-900 px-1.5 py-0.5 rounded text-sm" {...props}>
                                  {children}
                                </code>
                              );
                            }
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                      <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                        <span>{formatTime(message.timestamp)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading Indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-gray-800/50 border border-gray-700 px-4 py-3 rounded-2xl rounded-tl-md flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs font-semibold text-gray-400">Genie is thinking...</span>
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          {showActionButtons && !isLoading && !activeChallenge && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 p-2 rounded-xl flex flex-wrap gap-2">
                <button
                  onClick={handleStartChallenge}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 min-h-[44px]"
                >
                  <Trophy className="w-4 h-4" />
                  Take Challenge
                </button>
                <button
                  onClick={handleExplainFurther}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 min-h-[44px]"
                >
                  <Brain className="w-4 h-4" />
                  Explain Further
                </button>
                <button
                  onClick={handleAskQuestion}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 min-h-[44px]"
                >
                  <MessageCircle className="w-4 h-4" />
                  Ask Question
                </button>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Input Area */}
        <footer className="p-4 lg:px-6 lg:py-4 bg-gray-900/50 backdrop-blur-xl border-t border-gray-800">
          <div className="max-w-5xl mx-auto flex gap-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Genie a question or type your response..."
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-base min-h-[44px]"
                disabled={isLoading || !isOnline}
                inputMode="text"
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading || !isOnline}
              className={`p-3 rounded-xl transition-all min-h-[44px] min-w-[44px] flex items-center justify-center ${!inputMessage.trim() || isLoading || !isOnline
                ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white'
                }`}
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}