'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Activity, Code, BookOpen, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Chat from '@/components/Genie/Chat';
import Canvas from './components/Workspace/Canvas';
import { PulseWindow, WindowType, ChatMessage, GenieState } from './types';
import { WIDGET_CONFIGS } from './constants';
import { sendChatMessage, ChatMessage as APIMessage } from './services/chat-client';
import { liveGenieService } from './services/live';
import { interactionTracker } from './services/interaction-tracker';
import { saveWidget, upsertSessionProgress } from './services/widget-persistence';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { GenieBubble } from '@/components/Genie/GenieBubble';
import { ChatOverlay } from '@/components/Genie/ChatOverlay';
import { MobileNav } from './components/Navigation/MobileNav';
import { WorkspaceSidebar } from './components/Navigation/WorkspaceSidebar';
import { useGenie } from '@/lib/contexts/GenieContext';

const MotionDiv = motion.div as any;

const App: React.FC = () => {
  const [windows, setWindows] = useState<PulseWindow[]>([]);
  const { isOpen: isChatOpen, setIsOpen: setIsChatOpen, isPinned, setIsPinned } = useGenie();
  const [activeTab, setActiveTab] = useState<'genie' | 'workspace'>('workspace');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);


  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'system', text: 'Welcome to The Pulse. I am your Genie. You can chat with me or start a Live Voice Session.', timestamp: Date.now() }
  ]);
  const [genieState, setGenieState] = useState<GenieState>({ isThinking: false, mood: 'neutral', mode: 'regular' });
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [isLivePaused, setIsLivePaused] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  const [currentUser, setCurrentUser] = useState<any>(null);

  // --- Persistence & Deep Linking Logic ---

  // Load state or handle deep links on mount
  useEffect(() => {
    const handleDeepLinks = () => {
      const params = new URLSearchParams(window.location.search);
      const type = params.get('type');
      const id = params.get('id');

      if (type && id) {
        if (type === 'STUDY_KIT') {
          addWindow(WindowType.STUDY_KIT, { kitId: id });
        } else if (type === 'SKILL_SESSION') {
          const skillId = params.get('skillId');
          const graphId = params.get('graphId');
          addWindow(WindowType.SKILL_SESSION, { skillId, graphId }, 'Skill Session');
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'system',
            text: `📚 Skill session started for **${decodeURIComponent(params.get('skillTitle') || 'this skill')}**. I'll guide you from foundation to mastery.`,
            timestamp: Date.now()
          }]);
          setIsChatOpen(true);
        } else if (type === 'COURSE' || type === 'SKILL_GRAPH') {
          addWindow(WindowType.SKILL_GRAPH, { graphId: id });
        } else if (type === 'NOTE') {
          addWindow(WindowType.NOTE_WRITER, { noteId: id });
        }
        window.history.replaceState({}, '', window.location.pathname);
        return true;
      }
      return false;
    };

    try {
      const deepLinked = handleDeepLinks();
      if (!deepLinked) {
        const savedWindows = localStorage.getItem('pulse_session_windows');
        const savedMessages = localStorage.getItem('pulse_session_messages');
        if (savedWindows) setWindows(JSON.parse(savedWindows));
        if (savedMessages) setMessages(JSON.parse(savedMessages));
      }
    } catch (e) {
      console.error("Failed to load persistence data", e);
    }
  }, []);

  // Save state to local storage on change
  useEffect(() => {
    localStorage.setItem('pulse_session_windows', JSON.stringify(windows));
  }, [windows]);

  useEffect(() => {
    localStorage.setItem('pulse_session_messages', JSON.stringify(messages));
  }, [messages]);

  // Fetch current user
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUser(user);
    });
  }, []);


  // --- Window Management ---

  const addWindow = (type: WindowType, data?: any, customTitle?: string) => {
    const config = WIDGET_CONFIGS[type] || { defaultTitle: 'Tool', defaultWidth: 400, defaultHeight: 300 };
    const newWindow: PulseWindow = {
      id: Date.now().toString(),
      type,
      title: customTitle || config.defaultTitle,
      width: 0, height: 0, x: 0, y: 0, zIndex: windows.length + 1,
      isMinimized: false,
      data: data || {}
    };

    setWindows(prev => {
      const visible = prev.filter(w => !w.isMinimized);
      let updated = [...prev];
      if (visible.length >= 2) {
        const oldestVisibleId = visible[0].id;
        updated = updated.map(w => w.id === oldestVisibleId ? { ...w, isMinimized: true } : w);
      }
      return [...updated, newWindow];
    });
  };

  const toggleMinimize = (id: string) => {
    setWindows(prev => {
      const target = prev.find(w => w.id === id);
      if (!target) return prev;
      if (target.isMinimized) {
        const visible = prev.filter(w => !w.isMinimized && w.id !== id);
        if (visible.length >= 2) {
          const oldestId = visible[0].id;
          return prev.map(w => {
            if (w.id === oldestId) return { ...w, isMinimized: true };
            if (w.id === id) return { ...w, isMinimized: false };
            return w;
          });
        }
      }
      return prev.map(w => w.id === id ? { ...w, isMinimized: !w.isMinimized } : w);
    });
  };

  const updateActiveWidget = (typeFilter: WindowType | 'ANY', updateFn: (w: PulseWindow) => PulseWindow) => {
    setWindows(prev => {
      const visibleIndex = prev.map(w => w).reverse().findIndex(w => (typeFilter === 'ANY' || w.type === typeFilter) && !w.isMinimized);
      let targetIndex = -1;
      if (visibleIndex !== -1) {
        targetIndex = prev.length - 1 - visibleIndex;
      } else {
        const anyIndex = prev.map(w => w).reverse().findIndex(w => typeFilter === 'ANY' || w.type === typeFilter);
        if (anyIndex !== -1) targetIndex = prev.length - 1 - anyIndex;
      }
      if (targetIndex === -1) return prev;
      const updated = [...prev];
      updated[targetIndex] = updateFn(updated[targetIndex]);
      return updated;
    });
  };

  const parseWidgetData = (jsonStr?: string) => {
    if (!jsonStr) return {};
    try { return JSON.parse(jsonStr); } catch (e) { return {}; }
  };

  const handleToolCall = (toolName: string, args: any) => {
    console.log("Tool Triggered:", toolName, args);
    switch (toolName) {
      case 'create_custom_widget':
        addWindow(WindowType.CUSTOM_GENERATED, { code: args.react_code }, args.title || 'Custom Tool');
        break;
      case 'deploy_widget':
        const widgetType = args.widget_type as WindowType;
        if (Object.values(WindowType).includes(widgetType)) {
          addWindow(widgetType, parseWidgetData(args.data_json));
        }
        break;
      case 'close_widget':
        setWindows(prev => {
          const target = args.target;
          if (!target) return prev.length === 0 ? prev : prev.slice(0, prev.length - 1);
          if (prev.some(w => w.id === target)) return prev.filter(w => w.id !== target);
          const typeMatch = prev.find(w => w.type.includes(target) || w.title.toLowerCase().includes(target.toLowerCase()));
          return typeMatch ? prev.filter(w => w.id !== typeMatch.id) : prev;
        });
        break;
      case 'update_widget':
        const targetType = args.target_type ? args.target_type as WindowType : 'ANY';
        let newData = parseWidgetData(args.data_json);
        if (targetType === WindowType.BLACKBOARD || targetType === 'ANY') {
          if (newData.text && !newData.content) { newData.content = newData.text; newData.action = 'write'; }
          if (newData.content && !newData.action) { newData.action = 'write'; }
          if (newData.content) { newData.timestamp = Date.now(); }
        }
        updateActiveWidget(targetType, (w) => ({ ...w, data: { ...w.data, ...newData } }));
        break;
      case 'update_blackboard':
        handleToolCall('update_widget', { target_type: 'BLACKBOARD', data_json: JSON.stringify({ action: args.action, content: args.content }) });
        break;
      case 'update_note':
        handleToolCall('update_widget', { target_type: 'NOTE_WRITER', data_json: JSON.stringify({ text: args.text }) });
        break;
      case 'control_neuron':
        updateActiveWidget(WindowType.NEURON_VISUALIZER, w => ({ ...w, data: { ...w.data, ...args } }));
        break;
      case 'write_code':
      case 'update_code':
        updateActiveWidget(WindowType.CODE_EDITOR, w => ({ ...w, data: { ...w.data, code: args.code } }));
        break;
      case 'run_code':
        updateActiveWidget(WindowType.CODE_EDITOR, w => ({ ...w, data: { ...w.data, executionTrigger: (w.data?.executionTrigger || 0) + 1 } }));
        break;
      case 'update_skill_progress': {
        const skillSessionWindow = windows.find(w => w.type === WindowType.SKILL_SESSION);
        if (skillSessionWindow && currentUser) {
          const { action, topic, next_stage, signal, confidence, summary } = args;
          const { skillId, graphId } = skillSessionWindow.data || {};
          if (!skillId || !graphId) break;
          if (action === 'topic_covered' && topic) {
            upsertSessionProgress({ user_id: currentUser.id, skill_id: skillId, graph_id: graphId, topics_covered: [topic], conversation_summary: summary || '' });
          } else if (action === 'advance_stage' && next_stage) {
            upsertSessionProgress({ user_id: currentUser.id, skill_id: skillId, graph_id: graphId, current_stage: next_stage, conversation_summary: summary || '' });
          } else if (action === 'mastery_signal') {
            upsertSessionProgress({ user_id: currentUser.id, skill_id: skillId, graph_id: graphId, mastery_signals: { [signal || 'general']: confidence || 0.5 }, conversation_summary: summary || '' });
          }
        }
        break;
      }
      default:
        console.log("Unknown tool:", toolName);
    }
  };

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setGenieState(prev => ({ ...prev, isThinking: true, mood: 'focused' }));
    interactionTracker.log({ type: 'type', details: `User sent message: ${text.substring(0, 50)}...` });

    try {
      const activityContext = interactionTracker.getContextSummary();
      const response = await sendChatMessage({
        message: text,
        sessionId,
        currentWindows: windows,
        activityContext,
      });

      if (response.toolCalls && response.toolCalls.length > 0) {
        response.toolCalls.forEach(toolCall => {
          handleToolCall(toolCall.name, toolCall.args);
        });
      }

      const responseText = response.response || "I'm here to help. What would you like to explore?";
      const modelMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: responseText, timestamp: Date.now() };
      setMessages(prev => [...prev, modelMsg]);
    } catch (err) {
      console.error('[PULSE] API call failed:', err);
      const errorMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: "Connection interrupted.", timestamp: Date.now() };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setGenieState(prev => ({ ...prev, isThinking: false, mood: 'neutral' }));
    }
  };

  const handleSync = async () => {
    setGenieState(prev => ({ ...prev, isThinking: true, mood: 'focused' }));
    const syncPrompt = "SYNC_COMMAND: I am explicitly synchronizing my chat with the current workspace state. Analyze all active widgets and tell me how you can assist based on what I'm currently working on.";
    
    setMessages(prev => [...prev, { 
      id: Date.now().toString(), 
      role: 'system', 
      text: '🔄 Synchronizing with workspace context...', 
      timestamp: Date.now() 
    }]);

    await handleSendMessage(syncPrompt);
  };

  const togglePin = () => {
    setIsPinned(!isPinned);
    if (!isChatOpen) setIsChatOpen(true);
  };


  const handleRunCode = async (code: string, language: string, widgetId: string) => {
    setGenieState(prev => ({ ...prev, isThinking: true, mood: 'focused' }));
    try {
      const executionPrompt = `SYSTEM_COMMAND: Run code in Code Editor (ID: ${widgetId}). Language: ${language}\nCode:\n\`\`\`${language}\n${code}\n\`\`\`\nTASK: Analyze, simulate, and update widget logs.`;
      const response = await sendChatMessage({ message: executionPrompt, sessionId, currentWindows: windows });
      if (response.toolCalls) {
        response.toolCalls.forEach(toolCall => handleToolCall(toolCall.name, toolCall.args));
      }
    } catch (err) {
      console.error("[PULSE] Code execution failed:", err);
    } finally {
      setGenieState(prev => ({ ...prev, isThinking: false, mood: 'neutral' }));
    }
  };

  const toggleLiveMode = async () => {
    if (isLiveActive) {
      liveGenieService.disconnect();
      setIsLiveActive(false);
      setIsLivePaused(false);
      setGenieState(prev => ({ ...prev, isThinking: false, mood: 'neutral' }));
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: 'Live session ended.', timestamp: Date.now() }]);
    } else {
      setIsLiveActive(true);
      setGenieState(prev => ({ ...prev, isThinking: false, mood: 'serene' }));
      await liveGenieService.connect({
        onToolCall: handleToolCall,
        onAudioActivity: (active) => { },
        onError: (err) => {
          setIsLiveActive(false);
          setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: 'Live connection failed.', timestamp: Date.now() }]);
        },
        onTranscription: (text, role) => {
          setMessages(prev => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg && lastMsg.role === role && lastMsg.text === text) return prev;
            return [...prev, { id: Date.now().toString(), role: role === 'user' ? 'user' : 'model', text: text, timestamp: Date.now() }];
          });
        }
      });
    }
  };

  const togglePause = () => {
    if (isLivePaused) { liveGenieService.resume(); setIsLivePaused(false); } 
    else { liveGenieService.pause(); setIsLivePaused(true); }
  };

  const getIconForType = (type: WindowType) => {
    switch (type) {
      case WindowType.BLACKBOARD: return <Activity size={16} />;
      case WindowType.CODE_EDITOR: return <Code size={16} />;
      case WindowType.NOTE_WRITER: return <BookOpen size={16} />;
      default: return <Layout size={16} />;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-black text-white overflow-hidden font-sans relative">
      
      {/* Workspace Sidebar - Toggled or Desktop */}
      <div className={`${isSidebarOpen ? 'fixed md:relative inset-0 md:inset-auto z-[300] md:z-auto' : 'hidden md:block'} h-full shrink-0`}>
        {/* Backdrop for mobile */}
        {isSidebarOpen && (
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm md:hidden" 
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        <WorkspaceSidebar 
          isOpen={isSidebarOpen}
          onToggle={setIsSidebarOpen}
          onOpenWidget={(type, data) => {
             addWindow(type, data);
             if (window.innerWidth < 768) setIsSidebarOpen(false);
          }}
          activeWindows={windows.filter(w => !w.isMinimized).map(w => ({ id: w.id, title: w.title, type: w.type }))}
          onFocusWindow={(id) => {
             setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: false, zIndex: Math.max(...prev.map(win => win.zIndex)) + 1 } : w));
             if (window.innerWidth < 768) setIsSidebarOpen(false);
          }}
        />
      </div>

      {/* Main Container - Dynamic Layout with Motion */}
      <div className="flex flex-1 relative min-w-0 overflow-hidden h-full">
        
        {/* Workspace Area - Motion Animated */}
        <MotionDiv 
          animate={{ 
            width: isPinned && isChatOpen ? 'calc(100% - 450px)' : '100%',
            x: 0,
            opacity: 1,
            scale: 1,
            filter: 'blur(0px)'
          }}
          transition={{ type: 'spring', damping: 35, stiffness: 220, mass: 1 }}
          className={`relative bg-slate-950 flex flex-col h-full overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] z-20 ${activeTab === 'genie' ? 'hidden md:flex' : 'flex'}`}
        >
          {/* Mobile Header Bar (Only Canvas Tab) */}
          <div className="flex md:hidden h-14 bg-black/40 backdrop-blur-md border-b border-white/5 items-center justify-between px-6 shrink-0 z-50">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                <span className="text-[10px] font-black tracking-[0.2em] text-white uppercase italic">Pulse Canvas</span>
             </div>
             <div className="flex items-center gap-4">
               {windows.length > 0 && (
                 <div className="flex -space-x-2">
                   {windows.slice(-3).map(w => (
                     <div key={w.id} className="w-6 h-6 rounded-full border border-black bg-slate-800 flex items-center justify-center text-[8px] font-bold">
                       {w.title.charAt(0)}
                     </div>
                   ))}
                 </div>
               )}
             </div>
          </div>

          {/* Main Canvas Area */}
          <div className="flex-1 overflow-hidden relative">
            <Canvas
              windows={windows}
              setWindows={setWindows}
              onRunCode={handleRunCode}
              onMinimize={toggleMinimize}
              onSendGenieMessage={handleSendMessage}
              onOpenWidget={(type, data) => addWindow(type, data)}
            />
          </div>

          {/* Dock / Taskbar - Hidden on mobile, as users can switch from the Sidebar */}
          <div className="hidden md:flex h-24 shrink-0 bg-slate-900/40 backdrop-blur-3xl border-t border-white/5 items-center justify-center px-8 relative z-40">
            <div className="flex items-center gap-4 bg-white/5 p-2.5 rounded-[24px] border border-white/5 shadow-2xl overflow-x-auto no-scrollbar max-w-full">
              
              {/* Permanent Genie Trigger in Dock */}
              <motion.div
                onClick={() => {
                  setIsChatOpen(!isChatOpen);
                  if (activeTab === 'workspace') setActiveTab('genie');
                }}
                className={`group relative flex items-center justify-center w-14 h-14 rounded-2xl border transition-all cursor-pointer flex-shrink-0 ${isChatOpen
                  ? 'bg-cyan-500/20 border-cyan-500/50 shadow-lg shadow-cyan-500/20'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                whileHover={{ y: -6, scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
              >
                <div className={`${isChatOpen ? 'text-cyan-400' : 'text-slate-400'}`}>
                  <MessageSquare size={22} />
                </div>
                {isChatOpen && (
                  <div className="absolute -bottom-1.5 w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                )}
                <div className="absolute -top-12 bg-slate-900 border border-white/10 text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 pointer-events-none whitespace-nowrap z-50 shadow-2xl">
                  Genie Chat
                </div>
              </motion.div>

              <div className="w-px h-8 bg-white/10 mx-1" />

              {windows.map((win) => (
                <motion.div
                  key={win.id}
                  layoutId={`dock-${win.id}`}
                  onClick={() => toggleMinimize(win.id)}
                  className={`group relative flex items-center justify-center w-13 h-13 rounded-xl border transition-all cursor-pointer flex-shrink-0 ${!win.isMinimized
                    ? 'bg-purple-500/20 border-purple-500/50 shadow-lg shadow-purple-500/20'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                  whileHover={{ y: -6, scale: 1.05 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <div className={`${!win.isMinimized ? 'text-purple-400' : 'text-slate-400'}`}>
                    {getIconForType(win.type)}
                  </div>

                  {!win.isMinimized && (
                    <div className="absolute -bottom-1.5 w-1.5 h-1.5 bg-purple-400 rounded-full shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
                  )}

                  <div className="absolute -top-12 bg-slate-900 border border-white/10 text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 pointer-events-none whitespace-nowrap z-50 shadow-2xl">
                    {win.title}
                  </div>
                </motion.div>
              ))}
              {windows.length === 0 && (
                  <div className="px-6 py-2 text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Workspace Empty</div>
              )}
            </div>
          </div>
        </MotionDiv>
      </div>


      {/* Floating Genie Bubble (Only visible when chat is closed and not pinned) */}
      {!isPinned && (
        <GenieBubble 
          genieState={genieState}
          isLiveActive={isLiveActive}
          isLivePaused={isLivePaused}
          onClick={() => setIsChatOpen(true)}
          isOpen={isChatOpen}
        />
      )}

      {/* Genie Chat Overlay / Pinned Panel */}
      <ChatOverlay 
        isOpen={isChatOpen || (isPinned && activeTab === 'genie')} 
        isPinned={isPinned}
        onClose={() => {
            setIsChatOpen(false);
            if (isPinned) setIsPinned(false);
        }}
      >
        <Chat
          messages={messages}
          onSendMessage={handleSendMessage}
          genieState={genieState}
          onToggleLive={toggleLiveMode}
          isLiveActive={isLiveActive}
          isLivePaused={isLivePaused}
          onTogglePause={togglePause}
          onSync={handleSync}
          isPinned={isPinned}
          onTogglePin={togglePin}
        />
      </ChatOverlay>

      {/* Premium Mobile Navigation */}
      <MobileNav 
        activeTab={activeTab}
        onTabChange={(tab: any) => {
            if (tab === 'tools') {
               setIsSidebarOpen(true);
               return;
            }
            setActiveTab(tab);
            if (tab === 'genie') setIsChatOpen(true);
            else setIsChatOpen(false);
        }}
        isVisible={true}
      />

    </div>
  );
};


export default App;

