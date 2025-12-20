'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, BookOpen, Brain, Trophy, MessageCircle, Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { XPStreakDisplay } from '@/components/XPStreakDisplay';
import {
  InteractiveCourseSession as SessionType,
  QuickCheckQuestion
} from '@/types/interactive-course';
import { chatStorage, ChatMessage } from '@/lib/services/chat-storage';
import { sessionManager } from '@/lib/services/interactive-course-session-manager';
import QuizBubble from './QuizBubble';
import ChallengeView from './ChallengeView';
import { GeneratedChallenge } from '@/types/skill-progression';

interface InteractiveCourseSessionProps {
  courseId: string;
  userId: string;
  courseTitle?: string;
  courseCreator?: string;
  skillGraph?: any;
  onStartChallenge?: () => void;
}

// ChatMessage is now imported from chat-storage service

export default function InteractiveCourseSession({
  courseId,
  userId,
  courseTitle = 'Interactive Course',
  courseCreator = 'AI Tutor',
  skillGraph,
  onStartChallenge
}: InteractiveCourseSessionProps) {
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
  const [lastExplanationId, setLastExplanationId] = useState<string | null>(null);
  const [activeChallenge, setActiveChallenge] = useState<GeneratedChallenge | null>(null);
  const [learningStage, setLearningStage] = useState<'EXPLAIN' | 'QUIZ' | 'CHALLENGE'>('EXPLAIN');

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      if (session && messages.length > 0) {
        chatStorage.saveSession(session, messages).catch(err =>
          console.error('Failed to save session on unmount:', err)
        );
      }
    };
  }, [session, messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeSessionWithIntro = async () => {
    try {
      // First, try to load existing session from IndexedDB
      const existingSession = await chatStorage.loadSession(userId, courseId);

      if (existingSession && existingSession.messages.length > 0) {
        // Resume existing session
        console.log('Resuming existing session from IndexedDB');
        setSession(existingSession.session);
        setMessages(existingSession.messages);
        setIsInitializing(false);

        // Add a welcome back message
        setTimeout(() => {
          const welcomeBackMessage: ChatMessage = {
            id: 'welcome-back-' + Date.now(),
            role: 'genie',
            content: "Welcome back! I remember our conversation. Feel free to continue where we left off or ask me anything new! 😊",
            timestamp: new Date(),
            type: 'message'
          };
          addMessageAndSave(welcomeBackMessage);
        }, 1000);

        return;
      }

      // Create new session if no existing session found
      const newSession: SessionType = {
        id: `session_${userId}_${courseId}_${Date.now()}`,
        courseId,
        userId,
        currentTopic: courseTitle,
        learningContext: {
          currentConcepts: [skillGraph?.nodes?.[0]?.title || courseTitle || 'Main Concepts'],
          masteredConcepts: [],
          strugglingAreas: [],
          comprehensionLevel: 0.5,
          preferredLearningStyle: 'interactive',
          sessionGoals: [`Learn ${courseTitle}`]
        },
        progressState: {
          completedTopics: [],
          currentTopicProgress: 0.1,
          overallCourseProgress: 0.1,
          masteredSkills: [],
          strugglingSkills: [],
          totalTimeSpent: 0,
          challengesCompleted: 0,
          assessmentsCompleted: 0
        },
        sessionStartTime: new Date(),
        lastInteraction: new Date(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setSession(newSession);

      // Start with Genie introducing the concept immediately
      const getIntroMessage = () => {
        const title = skillGraph?.goal || courseTitle;
        const allSkills = skillGraph?.nodes || [];
        const firstSkill = allSkills[0]?.title || 'the fundamentals';
        const secondSkill = allSkills[1]?.title || 'some key concepts';

        const intros = [
          `Hey there! 👋 Welcome to your interactive learning journey! I'm Genie, and I'm super excited to help you master **${title}**. 

Let's dive right in! Today we're going to explore **${firstSkill}**. Think of this like the foundation of everything else we'll learn.

What would you like to know about ${firstSkill}? Or do you have any questions about ${title} in general?`,

          `Welcome! 🚀 I'm Genie, your personal learning companion for **${title}**. I'm here to make learning fun and interactive!

Let's jump straight into the exciting world of ${title}! First, we'll be looking into **${firstSkill}** and then moving on to **${secondSkill}**. 

Ready to get started? What specifically about ${title} interests you the most?`,

          `Hi there! ✨ I'm Genie, and I'm absolutely thrilled to be your learning guide for **${title}**!

Mastering ${title} is going to give you some incredible skills. We'll start with **${firstSkill}**, which is a powerful concept to get under your belt.

What kind of goals do you have for learning ${title}? I'd love to help you achieve them!`
        ];

        return intros[Math.floor(Math.random() * intros.length)];
      };

      const introMessage: ChatMessage = {
        id: 'intro-1',
        role: 'genie',
        content: getIntroMessage(),
        timestamp: new Date(),
        type: 'message'
      };

      const initialMessages = [introMessage];
      setMessages(initialMessages);
      setIsInitializing(false);

      // Save initial session to IndexedDB
      await chatStorage.saveSession(newSession, initialMessages);

      // Add a follow-up message after a short delay
      setTimeout(async () => {
        const followUpMessage: ChatMessage = {
          id: 'follow-up-' + Date.now(),
          role: 'genie',
          content: "I can see you're getting started! Feel free to ask me anything - I'm here to help you understand concepts step by step. You can ask questions like 'Can you explain this further?' or 'Show me an example' or even 'How does this connect to my goal?' 😊",
          timestamp: new Date(),
          type: 'message'
        };
        addMessageAndSave(followUpMessage);
      }, 3000);

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
      setIsInitializing(false);
    }
  };

  const handleQuizAnswer = async (messageId: string, answer: string, isCorrect: boolean) => {
    setMessages(prev => prev.map(msg =>
      msg.id === messageId
        ? { ...msg, quizData: { ...msg.quizData!, answered: answer, isCorrect } }
        : msg
    ));

    if (session) {
      chatStorage.saveSession(session, messages).catch(console.error);
    }

    const resultMessage = isCorrect
      ? "That's exactly right! I'm ready for the next part."
      : `I chose "${answer}", but I'm not sure why it's wrong. Can you explain?`;

    handleSendMessage(resultMessage, true);

    if (isCorrect) {
      setLearningStage('CHALLENGE');
    }
  };

  const handleChallengeTrigger = (challengeId: string) => {
    const mockChallenge: GeneratedChallenge = {
      id: challengeId,
      skillId: courseId,
      title: "Hands-on Mastery",
      description: `Apply your knowledge of ${courseTitle} by solving this practical scenario.`,
      difficultyLevel: 'Medium',
      estimatedTime: 5,
      validationCriteria: ["Correct logic", "Comprehensive answer"],
      hints: ["Try looking at it from another perspective.", "Remember the core principle we discussed."],
      learningObjectives: ["Synthesis", "Application"]
    };
    setActiveChallenge(mockChallenge);
  };

  const onChallengeSuccess = async (xpValue: number) => {
    setActiveChallenge(null);

    // Update local state first for immediate UI response
    const currentTopic = session?.currentTopic || 'Current Concept';

    setSession(prev => {
      if (!prev) return prev;
      const updatedContext = {
        ...prev.learningContext,
        masteredConcepts: Array.from(new Set([...prev.learningContext.masteredConcepts, currentTopic])),
        strugglingAreas: prev.learningContext.strugglingAreas.filter(a => a !== currentTopic),
        comprehensionLevel: Math.min(1, (prev.learningContext.comprehensionLevel || 0.5) + 0.1)
      };

      const updatedSession = {
        ...prev,
        learningContext: updatedContext,
        lastInteraction: new Date()
      };

      // Persist to Supabase
      sessionManager.persistSession(updatedSession).catch(console.error);

      return updatedSession;
    });

    handleSendMessage(`Success! I nailed the challenge and earned ${xpValue} XP! 🚀`, true);
    setLearningStage('EXPLAIN');
  };

  const onChallengeFail = (feedback: string) => {
    setActiveChallenge(null);
    handleSendMessage(`That was tough. I need a bit more explanation on this.`, true);
    setLearningStage('EXPLAIN');
  };

  const addMessageAndSave = async (message: ChatMessage) => {
    setMessages(prev => {
      const newMessages = [...prev, message];
      if (session) {
        setIsSaving(true);
        chatStorage.saveSession(session, newMessages)
          .then(() => setIsSaving(false))
          .catch(err => {
            console.error('Failed to save message:', err);
            setIsSaving(false);
          });
      }
      return newMessages;
    });
  };

  const generateChatSummary = (messages: ChatMessage[]): string => {
    return `Learner is in ${learningStage} stage of learning ${courseTitle}.`;
  };

  const getRecentContext = (messages: ChatMessage[]): ChatMessage[] => {
    return messages.filter(msg => msg.type === 'message').slice(-5);
  };

  const handleSendMessage = async (text: string, isAuto = false) => {
    if (!text.trim() || isLoading) return;

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
          learningStage,
          conversationHistory: recentMessages,
          chatSummary
        })
      });

      if (!response.ok) throw new Error('Response error');

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
              } else if (data.type === 'quiz') {
                setMessages(prev => prev.map(msg =>
                  msg.id === genieMessageId ? { ...msg, type: 'quiz', quizData: data.quizData, content: data.quizData.question } : msg
                ));
              } else if (data.type === 'challenge_trigger') {
                setMessages(prev => prev.map(msg =>
                  msg.id === genieMessageId ? { ...msg, type: 'challenge_trigger', challengeData: data.challengeData, content: data.challengeData.description } : msg
                ));
              } else if (data.type === 'complete') {
                setMessages(prev => {
                  const updated = prev.map(msg =>
                    msg.id === genieMessageId ? { ...msg, content: data.content || fullContent } : msg
                  );
                  if (session) chatStorage.saveSession(session, updated).catch(console.error);
                  return updated;
                });
                if (!data.type || data.type === 'content') {
                  setTimeout(() => setShowActionButtons(true), 1000);
                }
              }
            } catch (e) { }
          }
        }
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => prev.map(msg =>
        msg.id === genieMessageId ? { ...msg, content: "I encounterd an issue. Try asking again!" } : msg
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
    handleSendMessage("Can you explain this concepts more deeply with examples?", true);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Remove the loading screen - we start immediately with content

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#0a0a0f] text-white font-sans selection:bg-purple-500/30 overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Modern Sidebar */}
      <aside className="w-full lg:w-[320px] bg-gray-950/40 backdrop-blur-2xl p-6 border-b lg:border-r border-white/5 flex flex-col gap-8 z-10 relative">
        <div className="flex items-center gap-4 group cursor-default">
          <div className="p-3.5 bg-gradient-to-tr from-purple-600/20 to-blue-600/20 rounded-2xl group-hover:rotate-6 transition-all duration-500 border border-white/5 shadow-xl shadow-purple-900/10">
            <BookOpen className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-black bg-gradient-to-r from-white via-white to-gray-500 bg-clip-text text-transparent truncate tracking-tight">
              {courseTitle}
            </h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] leading-tight">Mastery Stream</p>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-3xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative">
            <XPStreakDisplay showCompact={true} skillGraphId={courseId} />
          </div>
        </div>

        {session && (
          <div className="space-y-6">
            <div className="bg-white/[0.03] border border-white/5 p-5 rounded-[2.5rem] backdrop-blur-sm relative overflow-hidden group hover:border-white/10 transition-colors">
              <div className="absolute top-0 right-0 p-8 bg-blue-500/5 rounded-full blur-2xl -mr-8 -mt-8" />
              <h3 className="text-xs font-black mb-4 flex items-center gap-3 text-white/50 uppercase tracking-[0.2em]">
                <div className="p-2 bg-blue-500/10 rounded-xl">
                  <Brain className="w-4 h-4 text-blue-400" />
                </div>
                Mind Mastery
              </h3>
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black py-1 px-2 uppercase rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {Math.round(session.learningContext.comprehensionLevel * 100)}% Sync
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2.5 text-xs flex rounded-full bg-gray-950 border border-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${session.learningContext.comprehensionLevel * 100}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600"
                  />
                </div>
                <div className="flex justify-between mt-3 px-1">
                  <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Awaiting Insight</span>
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Enlightened</span>
                </div>
              </div>
            </div>

            {session.learningContext.currentConcepts.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] px-1">Active Synapses</h4>
                <div className="flex flex-wrap gap-2">
                  {session.learningContext.currentConcepts.map((concept, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="px-3.5 py-2 bg-purple-500/5 border border-purple-500/10 hover:border-purple-500/30 text-purple-300 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-default"
                    >
                      {concept}
                    </motion.span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* Immersive Main Display */}
      <main className="flex-1 flex flex-col min-h-0 bg-transparent relative z-10">
        {/* Sleek Floating Header */}
        <header className="h-20 flex items-center px-8 border-b border-white/5 bg-gray-950/20 backdrop-blur-xl sticky top-0 z-20">
          <div className="flex items-center gap-5 flex-1">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
              <div className="relative w-11 h-11 bg-gray-900 rounded-2xl flex items-center justify-center border border-white/10 ring-1 ring-white/5">
                <MessageCircle className="w-5 h-5 text-purple-400" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-[3px] border-gray-950 rounded-full shadow-lg" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-sm text-white tracking-tight">Genie Protocol V2</h1>
                <span className="px-1.5 py-0.5 bg-white/5 rounded-md text-[8px] font-black text-gray-500 border border-white/5 uppercase">Secure</span>
              </div>
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-[0.2em] mt-0.5">Quantum Pulse Active</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <AnimatePresence>
              {isSaving && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping" />
                  <span className="text-[9px] font-black text-purple-400 uppercase tracking-[0.15em]">Neural Link Syncing</span>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="h-4 w-px bg-white/10" />
            <button className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/40 hover:text-white">
              <Trophy className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto px-6 py-10 space-y-10 scrollbar-hide">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${message.role === 'learner' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] lg:max-w-[75%] relative ${message.role === 'learner'
                  ? 'bg-gradient-to-tr from-purple-600 to-indigo-700 text-white px-7 py-5 rounded-[2.5rem] rounded-tr-lg shadow-2xl shadow-purple-900/30 ring-1 ring-white/10'
                  : message.type === 'quiz' || message.type === 'challenge_trigger'
                    ? 'w-full'
                    : 'bg-white/[0.03] border border-white/5 px-7 py-5 rounded-[2.5rem] rounded-tl-lg backdrop-blur-md'
                  }`}>
                  {message.type === 'quiz' && message.quizData ? (
                    <QuizBubble {...message.quizData} onAnswer={(ans, corr) => handleQuizAnswer(message.id, ans, corr)} />
                  ) : message.type === 'challenge_trigger' && message.challengeData ? (
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      className="p-10 bg-gradient-to-br from-indigo-600/90 via-purple-600/90 to-blue-700/90 rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(79,70,229,0.4)] border border-white/20 relative overflow-hidden group"
                    >
                      <div className="absolute top-0 right-0 p-24 bg-white/5 rounded-full -mr-24 -mt-24 blur-3xl group-hover:bg-white/10 transition-colors duration-700" />
                      <div className="relative z-10">
                        <div className="flex items-center gap-5 mb-8">
                          <div className="p-4 bg-white/10 rounded-[1.5rem] backdrop-blur-xl border border-white/10 shadow-inner">
                            <Zap className="w-7 h-7 text-yellow-300 animate-pulse fill-yellow-300/20" />
                          </div>
                          <div>
                            <h3 className="text-3xl font-black text-white tracking-tighter">Phase 03: The Gauntlet</h3>
                            <p className="text-[10px] text-white/50 font-black uppercase tracking-[0.3em]">Code Simulation Core</p>
                          </div>
                        </div>
                        <p className="text-xl text-white/90 mb-10 leading-relaxed font-bold tracking-tight">
                          {message.challengeData.description}
                        </p>
                        <button
                          onClick={() => handleChallengeTrigger(message.challengeData!.challengeId)}
                          className="w-full py-6 bg-white text-indigo-700 rounded-[1.5rem] font-black text-xl hover:shadow-[0_20px_40px_-10px_rgba(255,255,255,0.3)] hover:-translate-y-1 active:translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-4 group/btn"
                        >
                          <Brain className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                          Initialize Studio
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="prose prose-invert max-w-none text-white/90 leading-[1.7] font-medium tracking-tight text-[15px]">
                      {message.content}
                    </div>
                  )}

                  <div className={`text-[9px] font-black mt-4 opacity-25 uppercase tracking-[0.25em] flex items-center gap-2 ${message.role === 'learner' ? 'justify-end' : 'justify-start'}`}>
                    <span>{formatTime(message.timestamp)}</span>
                    <div className="w-1 h-1 bg-white rounded-full opacity-50" />
                    <span>0{message.role === 'learner' ? '1' : '2'}</span>
                  </div>
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
              <div className="bg-white/[0.03] border border-white/5 px-6 py-4 rounded-[2rem] rounded-tl-lg flex items-center gap-5">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-[bounce_1s_infinite_0ms] shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-[bounce_1s_infinite_200ms] shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-[bounce_1s_infinite_400ms] shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                </div>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Quantum Compute...</span>
              </div>
            </motion.div>
          )}

          {showActionButtons && !isLoading && !activeChallenge && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="flex justify-center pt-6"
            >
              <div className="bg-gray-950/40 backdrop-blur-2xl border border-white/10 p-2.5 rounded-[2.5rem] flex items-center gap-3 shadow-2xl ring-1 ring-white/5">
                <button
                  onClick={handleStartChallenge}
                  className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black text-xs uppercase tracking-[0.15em] rounded-[1.5rem] hover:shadow-[0_15px_30px_-10px_rgba(16,185,129,0.4)] transition-all duration-300 flex items-center gap-3"
                >
                  <Trophy className="w-4 h-4" />
                  Battle Ready
                </button>
                <div className="w-px h-8 bg-white/10 mx-1" />
                <button
                  onClick={handleExplainFurther}
                  className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-[0.15em] rounded-[1.5rem] transition-all duration-300 flex items-center gap-3 border border-white/5"
                >
                  <Brain className="w-4 h-4 text-purple-400" />
                  Deep Scan
                </button>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Tactical Input Control */}
        <footer className="p-8 bg-gray-950/20 backdrop-blur-2xl border-t border-white/5 relative">
          <div className="max-w-5xl mx-auto flex gap-5">
            <div className="flex-1 relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-[2rem] blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Submit neural query or initialization request..."
                className="w-full bg-white/[0.03] border border-white/5 rounded-[1.5rem] px-8 py-5 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/30 focus:bg-white/[0.05] transition-all font-bold tracking-tight text-base relative z-10"
                disabled={isLoading}
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-3 opacity-0 group-focus-within:opacity-100 transition-all z-10 translate-x-2 group-focus-within:translate-x-0">
                <span className="text-[10px] font-black bg-white/10 px-3 py-1.5 rounded-lg text-gray-400 uppercase tracking-widest border border-white/5">Transmit</span>
              </div>
            </div>
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-8 bg-gradient-to-tr from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-20 disabled:grayscale text-white rounded-[1.5rem] shadow-[0_15px_30px_-10px_rgba(147,51,234,0.4)] transition-all active:scale-95 flex items-center justify-center relative z-10"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>

          {/* Subtle Status Bar */}
          <div className="max-w-5xl mx-auto flex justify-between mt-4 px-2">
            <div className="flex gap-4">
              <span className="text-[8px] font-black text-gray-600 uppercase tracking-[0.2em] flex items-center gap-1.5">
                <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                Ready
              </span>
              <span className="text-[8px] font-black text-gray-600 uppercase tracking-[0.2em] flex items-center gap-1.5">
                <div className="w-1 h-1 bg-blue-500 rounded-full" />
                L-Stage: {learningStage}
              </span>
            </div>
            <span className="text-[8px] font-black text-gray-700 uppercase tracking-[0.3em]">Neural Interface [E-102]</span>
          </div>
        </footer>

        {/* Global Challenge Overlay */}
        <AnimatePresence mode="wait">
          {activeChallenge && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100]"
            >
              <ChallengeView
                challenge={activeChallenge}
                onSuccess={onChallengeSuccess}
                onFail={onChallengeFail}
                onClose={() => setActiveChallenge(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
