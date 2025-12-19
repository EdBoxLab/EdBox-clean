'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, BookOpen, Brain, Trophy, MessageCircle } from 'lucide-react';
import { XPStreakDisplay } from '@/components/XPStreakDisplay';
import {
  InteractiveCourseSession as SessionType,
  QuickCheckQuestion
} from '@/types/interactive-course';
import { chatStorage, ChatMessage } from '@/lib/services/chat-storage';

interface InteractiveCourseSessionProps {
  courseId: string;
  userId: string;
  courseTitle?: string;
  courseCreator?: string;
  onStartChallenge?: () => void;
}

// ChatMessage is now imported from chat-storage service

export default function InteractiveCourseSession({
  courseId,
  userId,
  courseTitle = 'Interactive Course',
  courseCreator = 'AI Tutor',
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
          currentConcepts: ['Programming Fundamentals'],
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
        const intros = [
          `Hey there! 👋 Welcome to your interactive learning journey! I'm Genie, and I'm super excited to help you master ${courseTitle}. 

Let's dive right in! Today we're going to explore some fundamental programming concepts. Think of programming like giving instructions to a very literal friend - you need to be clear and specific about what you want them to do.

Let's start with **variables** - they're like labeled boxes where you can store information. For example, if I wanted to remember your name, I might create a variable called "student_name" and put your name inside it.

What would you like to know about variables? Or do you have any questions about programming in general?`,

          `Welcome! 🚀 I'm Genie, your personal learning companion for ${courseTitle}. I'm here to make learning fun and interactive!

Let's jump straight into the exciting world of programming! Imagine you're teaching a robot to make your favorite sandwich. You'd need to give it step-by-step instructions, right? That's exactly what programming is!

Today, let's explore **functions** - they're like recipes that you can use over and over again. Once you write a function to "make sandwich," you can call it whenever you're hungry without rewriting all the steps.

Ready to create your first function? What would you like it to do?`,

          `Hi there! ✨ I'm Genie, and I'm absolutely thrilled to be your learning guide for ${courseTitle}!

Programming is like having superpowers - you can create anything you imagine! Let's start with something fundamental but powerful: **loops**.

Think of loops like a playlist that keeps playing your favorite songs. In programming, loops let you repeat actions without writing the same code over and over. Want to print "Hello" 100 times? A loop can do that in just a few lines!

What kind of repetitive task would you like to automate with a loop?`
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
          id: 'follow-up-1',
          role: 'genie',
          content: "I can see you're getting started! Feel free to ask me anything - I'm here to help you understand concepts step by step. You can ask questions like 'What is a variable?' or 'Show me an example' or even 'I'm confused about this part.' 😊",
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
        content: "Hey there! I'm Genie, your learning companion. I'm ready to help you learn programming! What would you like to start with - variables, functions, or something else?",
        timestamp: new Date(),
        type: 'message'
      };
      setMessages([errorMessage]);
      setIsInitializing(false);
    }
  };

  // Helper function to add message and save to IndexedDB
  const addMessageAndSave = async (message: ChatMessage) => {
    setMessages(prev => {
      const newMessages = [...prev, message];
      // Save to IndexedDB asynchronously
      if (session) {
        setIsSaving(true);
        chatStorage.saveSession(session, newMessages)
          .then(() => setIsSaving(false))
          .catch(err => {
            console.error('Failed to save to IndexedDB:', err);
            setIsSaving(false);
          });
      }
      return newMessages;
    });
    
    // Update learning context based on the message
    updateLearningContext(message);
  };

  // Generate chat summary for context
  const generateChatSummary = (messages: ChatMessage[]): string => {
    if (messages.length <= 5) return '';
    
    const relevantMessages = messages.filter(msg => 
      msg.type === 'message' && 
      !msg.content.includes('Welcome back') &&
      !msg.content.includes('I remember our conversation')
    );
    
    if (relevantMessages.length <= 5) return '';
    
    const concepts = new Set<string>();
    const topics = new Set<string>();
    let assessmentCount = 0;
    let challengeCount = 0;
    
    relevantMessages.forEach(msg => {
      const content = msg.content.toLowerCase();
      
      // Extract concepts mentioned
      if (content.includes('variable')) concepts.add('variables');
      if (content.includes('function')) concepts.add('functions');
      if (content.includes('loop')) concepts.add('loops');
      if (content.includes('array')) concepts.add('arrays');
      if (content.includes('object')) concepts.add('objects');
      if (content.includes('class')) concepts.add('classes');
      if (content.includes('condition')) concepts.add('conditionals');
      
      // Count activities
      if (msg.type === 'assessment') assessmentCount++;
      if (content.includes('challenge')) challengeCount++;
      
      // Extract topics
      const sentences = content.split('.');
      sentences.forEach(sentence => {
        if (sentence.includes('learn') || sentence.includes('understand') || sentence.includes('explain')) {
          const words = sentence.split(' ').slice(0, 10);
          if (words.length > 3) {
            topics.add(words.join(' ').trim());
          }
        }
      });
    });
    
    const summary = [];
    
    if (concepts.size > 0) {
      summary.push(`Concepts covered: ${Array.from(concepts).join(', ')}`);
    }
    
    if (assessmentCount > 0) {
      summary.push(`Completed ${assessmentCount} assessment${assessmentCount > 1 ? 's' : ''}`);
    }
    
    if (challengeCount > 0) {
      summary.push(`Discussed ${challengeCount} challenge${challengeCount > 1 ? 's' : ''}`);
    }
    
    const learnerQuestions = relevantMessages.filter(msg => 
      msg.role === 'learner' && msg.content.includes('?')
    ).length;
    
    if (learnerQuestions > 0) {
      summary.push(`Learner asked ${learnerQuestions} question${learnerQuestions > 1 ? 's' : ''}`);
    }
    
    return summary.length > 0 ? `Session Summary: ${summary.join('; ')}.` : '';
  };

  // Get recent conversation context (last 3 messages)
  const getRecentContext = (messages: ChatMessage[]): ChatMessage[] => {
    return messages
      .filter(msg => 
        msg.type === 'message' && 
        !msg.content.includes('Welcome back') &&
        !msg.content.includes('I remember our conversation')
      )
      .slice(-3);
  };

  // Update session and save to IndexedDB
  const updateSessionAndSave = async (updates: Partial<SessionType>) => {
    if (!session) return;
    
    const updatedSession = { ...session, ...updates, updatedAt: new Date(), lastInteraction: new Date() };
    setSession(updatedSession);
    
    // Save to IndexedDB
    chatStorage.saveSession(updatedSession, messages).catch(err =>
      console.error('Failed to update session in IndexedDB:', err)
    );
  };

  // Update learning context based on conversation
  const updateLearningContext = (newMessage: ChatMessage) => {
    if (!session) return;

    const content = newMessage.content.toLowerCase();
    const currentConcepts = [...session.learningContext.currentConcepts];
    const masteredConcepts = [...session.learningContext.masteredConcepts];
    
    // Detect new concepts being discussed
    const conceptKeywords = {
      'variables': ['variable', 'var', 'let', 'const'],
      'functions': ['function', 'method', 'procedure'],
      'loops': ['loop', 'for', 'while', 'iteration'],
      'arrays': ['array', 'list', 'collection'],
      'objects': ['object', 'class', 'instance'],
      'conditionals': ['if', 'else', 'condition', 'boolean']
    };

    Object.entries(conceptKeywords).forEach(([concept, keywords]) => {
      const mentioned = keywords.some(keyword => content.includes(keyword));
      if (mentioned && !currentConcepts.includes(concept) && !masteredConcepts.includes(concept)) {
        currentConcepts.push(concept);
      }
    });

    // Update comprehension level based on assessment results
    let comprehensionLevel = session.learningContext.comprehensionLevel;
    if (newMessage.type === 'assessment' && newMessage.role === 'learner') {
      // Slightly increase comprehension when user engages with assessments
      comprehensionLevel = Math.min(1.0, comprehensionLevel + 0.05);
    }

    // Update session with new learning context
    updateSessionAndSave({
      learningContext: {
        ...session.learningContext,
        currentConcepts,
        comprehensionLevel
      }
    });
  };

  const initializeRealSession = async () => {
    try {
      // Try to resume existing session first
      const resumeResponse = await fetch('/api/genie/interactive-course/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, courseId })
      });

      let sessionData;

      if (resumeResponse.ok) {
        const resumeData = await resumeResponse.json();
        sessionData = resumeData.session;
        // Don't overwrite messages if we already have intro messages
      } else {
        // Create new session
        const createResponse = await fetch('/api/genie/interactive-course/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, courseId })
        });

        if (createResponse.ok) {
          const createData = await createResponse.json();
          sessionData = createData.session;
        }
      }

      if (sessionData) {
        setSession(sessionData);
      }

    } catch (error) {
      console.error('Failed to initialize real session:', error);
      // Continue with mock session - user won't notice
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: 'user-' + Date.now(),
      role: 'learner',
      content: inputMessage.trim(),
      timestamp: new Date(),
      type: 'message'
    };

    // Hide action buttons when user sends a message
    setShowActionButtons(false);

    // Add user message and save
    await addMessageAndSave(userMessage);
    setInputMessage('');
    setIsLoading(true);

    // Create a placeholder message for streaming
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
      // Get recent conversation context and summary
      const recentMessages = getRecentContext(messages);
      const chatSummary = generateChatSummary(messages);
      
      // Debug log for context (remove in production)
      console.log('Sending context to Genie:', {
        recentMessagesCount: recentMessages.length,
        chatSummary,
        currentTopic: session?.currentTopic,
        comprehensionLevel: session?.learningContext.comprehensionLevel
      });
      
      const response = await fetch('/api/genie/interactive-course/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: userMessage.content,
          sessionId: session?.id,
          courseId,
          currentTopic: session?.currentTopic,
          learningContext: session?.learningContext,
          conversationHistory: recentMessages,
          chatSummary: chatSummary
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response stream available');
      }

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
                
                // Update the message with streaming content
                setMessages(prev => prev.map(msg => 
                  msg.id === genieMessageId 
                    ? { ...msg, content: fullContent }
                    : msg
                ));
              } else if (data.type === 'complete') {
                // Final update with complete content
                setMessages(prev => {
                  const updatedMessages = prev.map(msg => 
                    msg.id === genieMessageId 
                      ? { ...msg, content: data.content }
                      : msg
                  );
                  
                  // Save to IndexedDB
                  if (session) {
                    chatStorage.saveSession(session, updatedMessages).catch(err =>
                      console.error('Failed to save message to IndexedDB:', err)
                    );
                  }
                  
                  return updatedMessages;
                });

                // Check if this was an explanation and trigger assessment + action buttons
                const isExplanation = data.content.length > 150 && 
                  !data.content.includes('?') && 
                  (data.content.includes('concept') || 
                   data.content.includes('example') || 
                   data.content.includes('function') ||
                   data.content.includes('variable') ||
                   data.content.includes('loop') ||
                   data.content.length > 300);
                
                if (isExplanation) {
                  setLastExplanationId(genieMessageId);
                  setTimeout(() => {
                    createAssessment();
                    setShowActionButtons(true);
                  }, 1500);
                } else if (data.metadata?.nextAction === 'assess_understanding') {
                  setTimeout(() => {
                    createAssessment();
                  }, 1000);
                }
              } else if (data.type === 'error') {
                setMessages(prev => {
                  const updatedMessages = prev.map(msg => 
                    msg.id === genieMessageId 
                      ? { ...msg, content: data.content }
                      : msg
                  );
                  
                  // Save error message too
                  if (session) {
                    chatStorage.saveSession(session, updatedMessages).catch(err =>
                      console.error('Failed to save error message:', err)
                    );
                  }
                  
                  return updatedMessages;
                });
              }
            } catch (parseError) {
              console.error('Failed to parse streaming data:', parseError);
            }
          }
        }
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === genieMessageId 
          ? { ...msg, content: "I'm having trouble processing that. Could you try rephrasing your question?" }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const createAssessment = async () => {
    if (!session) return;

    try {
      const currentConcept = session.learningContext.currentConcepts[0] || 'Programming Concepts';
      
      const response = await fetch('/api/genie/interactive-course/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          concept: currentConcept,
          difficulty: 'Medium'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create assessment');
      }

      const assessmentData = await response.json();
      setCurrentAssessment(assessmentData.question);

      // Add assessment message to chat
      const assessmentMessage: ChatMessage = {
        id: 'assessment-' + Date.now(),
        role: 'genie',
        content: `Let me check your understanding with a quick question: ${assessmentData.question.question}`,
        timestamp: new Date(),
        type: 'assessment',
        assessmentData: assessmentData.question
      };

      setMessages(prev => [...prev, assessmentMessage]);

    } catch (error) {
      console.error('Failed to create assessment:', error);
    }
  };

  const submitAssessment = async () => {
    if (!currentAssessment || !assessmentAnswer.trim()) return;

    const userAnswer: ChatMessage = {
      id: 'answer-' + Date.now(),
      role: 'learner',
      content: assessmentAnswer.trim(),
      timestamp: new Date(),
      type: 'message'
    };

    setMessages(prev => [...prev, userAnswer]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/genie/interactive-course/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session?.id,
          questionId: currentAssessment.id,
          answer: assessmentAnswer.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to evaluate assessment');
      }

      const evaluation = await response.json();
      
      const feedbackMessage: ChatMessage = {
        id: 'feedback-' + Date.now(),
        role: 'genie',
        content: evaluation.feedback,
        timestamp: new Date(),
        type: 'message'
      };

      setMessages(prev => [...prev, feedbackMessage]);

      // Clear assessment and show action buttons
      setCurrentAssessment(null);
      setAssessmentAnswer('');
      setTimeout(() => {
        setShowActionButtons(true);
      }, 1000);

    } catch (error) {
      console.error('Failed to evaluate assessment:', error);
      const errorMessage: ChatMessage = {
        id: 'eval-error-' + Date.now(),
        role: 'genie',
        content: "I had trouble evaluating your answer, but let's keep going! You're doing great.",
        timestamp: new Date(),
        type: 'message'
      };
      setMessages(prev => [...prev, errorMessage]);
      setCurrentAssessment(null);
      setAssessmentAnswer('');
      setTimeout(() => {
        setShowActionButtons(true);
      }, 1000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (currentAssessment) {
        submitAssessment();
      } else {
        sendMessage();
      }
    }
  };

  const handleStartChallenge = () => {
    setShowActionButtons(false);
    if (onStartChallenge) {
      onStartChallenge();
    } else {
      // Add a message indicating challenge transition
      const challengeMessage: ChatMessage = {
        id: 'challenge-transition-' + Date.now(),
        role: 'genie',
        content: "Great! Let's put your knowledge to the test with a hands-on challenge! 🚀",
        timestamp: new Date(),
        type: 'message'
      };
      addMessageAndSave(challengeMessage);
    }
  };

  const handleExplainFurther = () => {
    setShowActionButtons(false);
    const explainMessage: ChatMessage = {
      id: 'explain-request-' + Date.now(),
      role: 'learner',
      content: "Can you explain this concept further with more examples?",
      timestamp: new Date(),
      type: 'message'
    };
    addMessageAndSave(explainMessage);
    
    // Trigger Genie response for further explanation
    setTimeout(() => {
      sendGenieExplanation("Please provide a more detailed explanation with additional examples and use cases.");
    }, 500);
  };

  const sendGenieExplanation = async (prompt: string) => {
    setIsLoading(true);
    
    const genieMessageId = 'genie-explain-' + Date.now();
    const genieMessage: ChatMessage = {
      id: genieMessageId,
      role: 'genie',
      content: '',
      timestamp: new Date(),
      type: 'message'
    };

    setMessages(prev => [...prev, genieMessage]);

    try {
      // Get recent conversation context and summary for explanation requests
      const recentMessages = getRecentContext(messages);
      const chatSummary = generateChatSummary(messages);
      
      const response = await fetch('/api/genie/interactive-course/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: prompt,
          sessionId: session?.id,
          courseId,
          currentTopic: session?.currentTopic,
          learningContext: session?.learningContext,
          conversationHistory: recentMessages,
          chatSummary: chatSummary
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response stream available');
      }

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
                  msg.id === genieMessageId 
                    ? { ...msg, content: fullContent }
                    : msg
                ));
              } else if (data.type === 'complete') {
                setMessages(prev => {
                  const updatedMessages = prev.map(msg => 
                    msg.id === genieMessageId 
                      ? { ...msg, content: data.content }
                      : msg
                  );
                  
                  if (session) {
                    chatStorage.saveSession(session, updatedMessages).catch(err =>
                      console.error('Failed to save message to IndexedDB:', err)
                    );
                  }
                  
                  return updatedMessages;
                });

                // Show action buttons again after further explanation
                setTimeout(() => {
                  setShowActionButtons(true);
                }, 1000);
              }
            } catch (parseError) {
              console.error('Failed to parse streaming data:', parseError);
            }
          }
        }
      }

    } catch (error) {
      console.error('Failed to send explanation request:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === genieMessageId 
          ? { ...msg, content: "I'm having trouble providing more details right now. Feel free to ask specific questions!" }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Remove the loading screen - we start immediately with content

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <aside className="w-full lg:w-1/4 bg-gray-800 p-4 lg:p-6 border-b lg:border-b-0 lg:border-r border-gray-700">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="w-5 h-5 lg:w-6 lg:h-6 text-purple-400" />
          <h2 className="text-lg lg:text-xl font-bold truncate">{courseTitle}</h2>
        </div>
        <p className="text-xs lg:text-sm text-gray-400 mb-4 lg:mb-6">With {courseCreator}</p>
        
        {/* XP Display */}
        <div className="mb-4 lg:mb-6">
          <XPStreakDisplay showCompact={true} skillGraphId={courseId} />
        </div>

        {/* Learning Progress */}
        {session && (
          <div className="space-y-3 lg:space-y-4">
            <div className="bg-gray-700/50 p-3 lg:p-4 rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center gap-2 text-sm lg:text-base">
                <Brain className="w-4 h-4 text-blue-400" />
                Learning Progress
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-400">Comprehension:</span>
                  <div className="w-full bg-gray-600 rounded-full h-2 mt-1">
                    <div 
                      className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${session.learningContext.comprehensionLevel * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">
                    {Math.round(session.learningContext.comprehensionLevel * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Current Concepts */}
            {session.learningContext.currentConcepts.length > 0 && (
              <div className="bg-gray-700/50 p-3 lg:p-4 rounded-lg">
                <h3 className="font-semibold mb-2 text-xs lg:text-sm text-gray-300">Currently Learning</h3>
                <div className="flex flex-wrap gap-1 lg:gap-2">
                  {session.learningContext.currentConcepts.map((concept, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-purple-600/30 text-purple-300 rounded text-xs"
                    >
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Mastered Concepts */}
            {session.learningContext.masteredConcepts.length > 0 && (
              <div className="bg-gray-700/50 p-3 lg:p-4 rounded-lg">
                <h3 className="font-semibold mb-2 text-xs lg:text-sm text-gray-300 flex items-center gap-1">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  Mastered
                </h3>
                <div className="flex flex-wrap gap-1 lg:gap-2">
                  {session.learningContext.masteredConcepts.map((concept, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-green-600/30 text-green-300 rounded text-xs"
                    >
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* Main Chat Interface */}
      <main className="flex-1 flex flex-col min-h-0">
        {/* Chat Header */}
        <header className="bg-gray-800 p-3 lg:p-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <MessageCircle className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-semibold text-sm lg:text-base truncate">Genie - Your AI Learning Assistant</h1>
              <p className="text-xs lg:text-sm text-gray-400 truncate">
                {isSaving ? 'Saving conversation...' : 'Ready to help you learn and grow'}
              </p>
            </div>
            {isSaving && (
              <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-3 lg:p-6 space-y-3 lg:space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'learner' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] lg:max-w-[80%] p-3 lg:p-4 rounded-lg ${
                  message.role === 'learner'
                    ? 'bg-purple-600 text-white'
                    : message.type === 'assessment'
                    ? 'bg-blue-600/20 border border-blue-500/30 text-blue-100'
                    : 'bg-gray-700 text-gray-100'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm lg:text-base">{message.content}</p>
                
                {/* Assessment Options */}
                {message.type === 'assessment' && message.assessmentData?.options && (
                  <div className="mt-3 space-y-2">
                    {message.assessmentData.options.map((option: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => setAssessmentAnswer(option)}
                        className={`w-full text-left p-2 lg:p-3 rounded border transition-colors text-sm lg:text-base ${
                          assessmentAnswer === option
                            ? 'bg-blue-600 border-blue-400'
                            : 'bg-gray-600 border-gray-500 hover:bg-gray-500'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
                
                <p className="text-xs opacity-70 mt-2">
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-700 p-3 lg:p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-gray-300 text-sm lg:text-base">Genie is typing...</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {showActionButtons && !currentAssessment && !isLoading && (
            <div className="flex justify-center">
              <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-600 rounded-lg p-4 flex flex-col sm:flex-row gap-3 max-w-md">
                <button
                  onClick={handleStartChallenge}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-sm lg:text-base"
                >
                  <Trophy className="w-4 h-4" />
                  Start Challenge
                </button>
                <button
                  onClick={handleExplainFurther}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-sm lg:text-base"
                >
                  <Brain className="w-4 h-4" />
                  Explain Further
                </button>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-gray-800 p-3 lg:p-4 border-t border-gray-700 flex-shrink-0">
          {currentAssessment ? (
            <div className="space-y-3">
              <div className="text-xs lg:text-sm text-blue-300">
                Answer the question above to continue
              </div>
              {currentAssessment.type === 'short_answer' && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={assessmentAnswer}
                    onChange={(e) => setAssessmentAnswer(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your answer..."
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 lg:px-4 py-2 lg:py-3 text-sm lg:text-base text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    disabled={isLoading}
                  />
                  <button
                    onClick={submitAssessment}
                    disabled={!assessmentAnswer.trim() || isLoading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 lg:px-4 py-2 lg:py-3 rounded-lg transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about what you're learning..."
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 lg:px-4 py-2 lg:py-3 text-sm lg:text-base text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 lg:px-4 py-2 lg:py-3 rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}