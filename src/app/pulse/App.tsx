'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Activity, Code, BookOpen, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Chat from './components/Genie/Chat';
import Canvas from './components/Workspace/Canvas';
import { PulseWindow, WindowType, ChatMessage, GenieState } from './types';
import { WIDGET_CONFIGS } from './constants';
import { sendChatMessage, ChatMessage as APIMessage } from './services/chat-client';
import { liveGenieService } from './services/live';
import { interactionTracker } from './services/interaction-tracker';
import { saveWidget, upsertSessionProgress } from './services/widget-persistence';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const MotionDiv = motion.div as any;

const App: React.FC = () => {
  const [windows, setWindows] = useState<PulseWindow[]>([]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'system', text: 'Welcome to The Pulse. I am your Genie. You can chat with me or start a Live Voice Session.', timestamp: Date.now() }
  ]);
  const [genieState, setGenieState] = useState<GenieState>({ isThinking: false, mood: 'neutral', mode: 'regular' });
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [isLivePaused, setIsLivePaused] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  // Mobile View State
  const [mobileTab, setMobileTab] = useState<'chat' | 'workspace'>('chat');
  const [currentUser, setCurrentUser] = useState<any>(null);

  // --- Persistence & Deep Linking Logic ---

  // Load state or handle deep links on mount
  useEffect(() => {
    const handleDeepLinks = () => {
      const params = new URLSearchParams(window.location.search);
      const type = params.get('type');
      const id = params.get('id');

      if (type && id) {
        // If we have a deep link, clear current windows (optional) or just add the new one
        if (type === 'STUDY_KIT') {
          addWindow(WindowType.STUDY_KIT, { kitId: id });
        } else if (type === 'SKILL_SESSION') {
          const skillId = params.get('skillId');
          const graphId = params.get('graphId');
          addWindow(WindowType.SKILL_SESSION, { skillId, graphId }, 'Skill Session');
          // Add a contextual Genie message
          const skillTitle = params.get('skillTitle') || 'this skill';
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'system',
            text: `📚 Skill session started for **${decodeURIComponent(skillTitle)}**. I'll guide you from foundation to mastery. When you're ready, click "Start Learning with Genie" in the workspace.`,
            timestamp: Date.now()
          }]);
        } else if (type === 'COURSE' || type === 'SKILL_GRAPH') {
          addWindow(WindowType.SKILL_GRAPH, { graphId: id });
        } else if (type === 'NOTE') {
          addWindow(WindowType.NOTE_WRITER, { noteId: id });
        }
        // Clear search params to prevent re-opening on refresh
        window.history.replaceState({}, '', window.location.pathname);
        return true;
      }
      return false;
    };

    try {
      const deepLinked = handleDeepLinks();

      // Load Active Session if not a deep link
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

  // Fetch current user for widget persistence
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
      // Auto-collapse logic: If we have 2 visible windows, minimize the oldest visible one
      const visible = prev.filter(w => !w.isMinimized);
      let updated = [...prev];

      if (visible.length >= 2) {
        const oldestVisibleId = visible[0].id;
        updated = updated.map(w => w.id === oldestVisibleId ? { ...w, isMinimized: true } : w);
      }

      return [...updated, newWindow];
    });

    // Auto-switch to workspace on mobile when a new window is added
    if (window.innerWidth < 768) {
      setMobileTab('workspace');
    }
  };

  const toggleMinimize = (id: string) => {
    setWindows(prev => {
      const target = prev.find(w => w.id === id);
      if (!target) return prev;

      // If we are restoring (un-minimizing)
      if (target.isMinimized) {
        const visible = prev.filter(w => !w.isMinimized && w.id !== id);
        // If we already have 2 visible, minimize the oldest one to make room
        if (visible.length >= 2) {
          const oldestId = visible[0].id;
          return prev.map(w => {
            if (w.id === oldestId) return { ...w, isMinimized: true };
            if (w.id === id) return { ...w, isMinimized: false };
            return w;
          });
        }
      }

      // Standard toggle
      return prev.map(w => w.id === id ? { ...w, isMinimized: !w.isMinimized } : w);
    });
  };

  const updateActiveWidget = (typeFilter: WindowType | 'ANY', updateFn: (w: PulseWindow) => PulseWindow) => {
    setWindows(prev => {
      // Find active (non-minimized) first, if not find any.
      // Prioritize visible widgets for updates
      const visibleIndex = prev.map(w => w).reverse().findIndex(w => (typeFilter === 'ANY' || w.type === typeFilter) && !w.isMinimized);

      let targetIndex = -1;

      if (visibleIndex !== -1) {
        // Found a visible one
        targetIndex = prev.length - 1 - visibleIndex;
      } else {
        // Fallback to any matching widget (even if minimized)
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
      // ... Legacy Handlers 
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
        // Handle Genie's skill mastery progress updates
        const skillSessionWindow = windows.find(w => w.type === WindowType.SKILL_SESSION);
        if (skillSessionWindow && currentUser) {
          const { action, topic, next_stage, signal, confidence, summary } = args;
          const { skillId, graphId } = skillSessionWindow.data || {};
          if (!skillId || !graphId) break;

          if (action === 'topic_covered' && topic) {
            upsertSessionProgress({
              user_id: currentUser.id,
              skill_id: skillId,
              graph_id: graphId,
              topics_covered: [topic],
              conversation_summary: summary || '',
            });
            console.log('[PULSE] Topic covered:', topic);
          } else if (action === 'advance_stage' && next_stage) {
            upsertSessionProgress({
              user_id: currentUser.id,
              skill_id: skillId,
              graph_id: graphId,
              current_stage: next_stage,
              conversation_summary: summary || '',
            });
            console.log('[PULSE] Advanced to stage:', next_stage);
          } else if (action === 'mastery_signal') {
            upsertSessionProgress({
              user_id: currentUser.id,
              skill_id: skillId,
              graph_id: graphId,
              mastery_signals: { [signal || 'general']: confidence || 0.5 },
              conversation_summary: summary || '',
            });
            console.log('[PULSE] Mastery signal:', signal, confidence);
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

    console.log('[PULSE] Sending message via API route:', { sessionId, messageLength: text.length });

    try {
      const activityContext = interactionTracker.getContextSummary();

      const response = await sendChatMessage({
        message: text,
        sessionId,
        currentWindows: windows,
        activityContext,
      });

      console.log('[PULSE] API response received:', {
        success: response.success,
        responseLength: response.response?.length,
        toolCallsCount: response.toolCalls?.length
      });

      if (response.toolCalls && response.toolCalls.length > 0) {
        console.log('[PULSE] Processing tool calls:', response.toolCalls.map(tc => tc.name));
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

  const handleRunCode = async (code: string, language: string, widgetId: string) => {
    setGenieState(prev => ({ ...prev, isThinking: true, mood: 'focused' }));
    try {
      const executionPrompt = `SYSTEM_COMMAND: The user is requesting to RUN code in the Code Editor (ID: ${widgetId}).
          Language: ${language}
          Code:
          \`\`\`${language}
          ${code}
          \`\`\`
          
          TASK:
          1. Analyze the code logic.
          2. Simulate the execution and determine the output (stdout/console.log).
          3. Use the 'update_widget' tool to send the output back to this widget's 'logs' property.
          4. The 'logs' property must be an array of strings.
          5. DO NOT just chat the output. Update the widget.
          `;

      console.log('[PULSE] Running code via API route:', { language, widgetId });

      const response = await sendChatMessage({
        message: executionPrompt,
        sessionId,
        currentWindows: windows,
      });

      if (response.toolCalls && response.toolCalls.length > 0) {
        console.log('[PULSE] Code execution tool calls:', response.toolCalls.map(tc => tc.name));
        response.toolCalls.forEach(toolCall => {
          handleToolCall(toolCall.name, toolCall.args);
        });
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
          console.error("Live Error", err);
          setIsLiveActive(false);
          setIsLivePaused(false);
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
    if (isLivePaused) {
      liveGenieService.resume();
      setIsLivePaused(false);
    } else {
      liveGenieService.pause();
      setIsLivePaused(true);
    }
  };

  const getIconForType = (type: WindowType) => {
    switch (type) {
      case WindowType.BLACKBOARD: return <Activity size={16} />;
      case WindowType.CODE_EDITOR: return <Code size={16} />;
      case WindowType.NEURON_VISUALIZER: return <Activity size={16} />; // Fallback, distinct if needed
      case WindowType.NOTE_WRITER: return <BookOpen size={16} />;
      default: return <Layout size={16} />;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-black text-white overflow-hidden font-sans flex-col md:flex-row">

      {/* Mobile Nav Toggle (Visible only on mobile) */}
      <div className="md:hidden h-14 bg-slate-900 border-b border-white/10 flex items-center justify-around shrink-0 z-50">
        <button
          onClick={() => setMobileTab('chat')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${mobileTab === 'chat' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400'}`}
        >
          <MessageSquare size={18} />
          <span className="text-xs font-bold uppercase">Genie</span>
        </button>
        <button
          onClick={() => setMobileTab('workspace')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${mobileTab === 'workspace' ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400'}`}
        >
          <Layout size={18} />
          <span className="text-xs font-bold uppercase">Workspace</span>
        </button>
      </div>

      {/* Chat Sidebar */}
      <div className={`${mobileTab === 'chat' ? 'flex' : 'hidden'} md:flex w-full md:w-96 flex-shrink-0 z-40 border-r border-white/10 relative h-full md:h-auto`}>
        <Chat
          messages={messages}
          onSendMessage={handleSendMessage}
          genieState={genieState}
          onToggleLive={toggleLiveMode}
          isLiveActive={isLiveActive}
          isLivePaused={isLivePaused}
          onTogglePause={togglePause}
          onToggleMode={(mode) => setGenieState(prev => ({ ...prev, mode }))}
        />
      </div>

      {/* Workspace Area */}
      <div className={`${mobileTab === 'workspace' ? 'flex' : 'hidden'} md:flex flex-1 relative bg-slate-950 flex-col h-full md:h-auto`}>
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

        {/* Dock / Taskbar */}
        <div className="h-16 shrink-0 bg-slate-900/80 backdrop-blur-xl border-t border-white/10 flex items-center justify-center px-4 relative z-40 overflow-x-auto">
          <div className="flex items-center gap-3">
            {windows.map((win) => (
              <motion.div
                key={win.id}
                layoutId={`dock-${win.id}`}
                onClick={() => toggleMinimize(win.id)}
                className={`group relative flex flex-col items-center justify-center w-12 h-12 rounded-xl border transition-all cursor-pointer flex-shrink-0 ${!win.isMinimized
                  ? 'bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                whileHover={{ y: -4, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className={`${!win.isMinimized ? 'text-cyan-400' : 'text-slate-400'}`}>
                  {getIconForType(win.type)}
                </div>

                {/* Status Dot */}
                {!win.isMinimized && (
                  <div className="absolute -bottom-1 w-1 h-1 bg-cyan-400 rounded-full" />
                )}

                {/* Tooltip */}
                <div className="absolute -top-10 bg-slate-800 text-[10px] px-2 py-1 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {win.title}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
