'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layout, Activity, Code, BookOpen, Sparkles } from 'lucide-react';

import { ChatOverlay } from './ChatOverlay';
import Chat from './Chat';
import Canvas from '@/app/pulse/components/Workspace/Canvas';
import { ChatMessage, GenieState, PulseWindow, WindowType } from '@/app/pulse/types';
import { WIDGET_CONFIGS } from '@/app/pulse/constants';
import { sendChatMessage } from '@/app/pulse/services/chat-client';
import { liveGenieService } from '@/app/pulse/services/live';
import { interactionTracker } from '@/app/pulse/services/interaction-tracker';

import { useGenie } from '@/lib/contexts/GenieContext';

const MotionDiv = motion.div as any;

export const GlobalGenie: React.FC = () => {
  const { isOpen, setIsOpen, isPinned, setIsPinned } = useGenie();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'system', text: 'Welcome back. I am your Genie. How can I assist your learning today?', timestamp: Date.now() }
  ]);
  const [genieState, setGenieState] = useState<GenieState>({ isThinking: false, mood: 'neutral', mode: 'regular' });
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [isLivePaused, setIsLivePaused] = useState(false);
  const [sessionId] = useState(() => `global-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  const [windows, setWindows] = useState<PulseWindow[]>([]);
  const [activeTab, setActiveTab] = useState<'genie' | 'workspace'>('genie');

  useEffect(() => {
    const savedMessages = localStorage.getItem('global_genie_messages');
    const savedWindows = localStorage.getItem('global_genie_windows');
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        console.error("Failed to parse global genie messages", e);
      }
    }
    if (savedWindows) {
      try {
        setWindows(JSON.parse(savedWindows));
      } catch (e) {
        console.error("Failed to parse global genie windows", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('global_genie_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('global_genie_windows', JSON.stringify(windows));
  }, [windows]);

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
    setActiveTab('workspace');
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
    console.log("[GlobalGenie] Tool Triggered:", toolName, args);
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
      case 'write_code':
      case 'update_code':
        updateActiveWidget(WindowType.CODE_EDITOR, w => ({ ...w, data: { ...w.data, code: args.code } }));
        break;
      case 'run_code':
        updateActiveWidget(WindowType.CODE_EDITOR, w => ({ ...w, data: { ...w.data, executionTrigger: (w.data?.executionTrigger || 0) + 1 } }));
        break;
      default:
        console.log("[GlobalGenie] Unknown tool:", toolName);
    }
  };

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setGenieState(prev => ({ ...prev, isThinking: true, mood: 'focused' }));

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
      console.error('[GLOBAL-GENIE] API call failed:', err);
      const errorMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: "Connection interrupted.", timestamp: Date.now() };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setGenieState(prev => ({ ...prev, isThinking: false, mood: 'neutral' }));
    }
  };

  const handleSync = async () => {
    setGenieState(prev => ({ ...prev, isThinking: true, mood: 'focused' }));
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'system',
      text: `🔄 Refreshing workspace context...`,
      timestamp: Date.now()
    }]);
    await handleSendMessage("SYNC_COMMAND: Analyzing current workspace state to assist you better.");
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
        onAudioActivity: () => { },
        onError: () => {
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

  const handleRunCode = async (code: string, language: string, widgetId: string) => {
    setGenieState(prev => ({ ...prev, isThinking: true, mood: 'focused' }));
    try {
      const executionPrompt = `SYSTEM_COMMAND: Run code in Code Editor (ID: ${widgetId}). Language: ${language}\nCode:\n\`\`\`${language}\n${code}\n\`\`\`\nTASK: Analyze, simulate, and update widget logs.`;
      const response = await sendChatMessage({ message: executionPrompt, sessionId, currentWindows: windows });
      if (response.toolCalls) {
        response.toolCalls.forEach(toolCall => handleToolCall(toolCall.name, toolCall.args));
      }
    } catch (err) {
      console.error("[GlobalGenie] Code execution failed:", err);
    } finally {
      setGenieState(prev => ({ ...prev, isThinking: false, mood: 'neutral' }));
    }
  };

  const togglePin = () => {
    setIsPinned(!isPinned);
    if (!isOpen) setIsOpen(true);
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
    <>
      {/* GenieBubble floating button removed as requested */}


      {isPinned && (
        <div className="fixed inset-0 flex z-[100] pointer-events-none">
          <MotionDiv
            animate={{ width: activeTab === 'genie' ? 'calc(100% - 450px)' : '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 200 }}
            className="h-full bg-slate-950 flex flex-col pointer-events-auto relative overflow-hidden"
          >
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

            <div className="h-16 shrink-0 bg-slate-900/40 backdrop-blur-3xl border-t border-white/5 flex items-center justify-center px-4 relative z-40">
              <div className="flex items-center gap-2 bg-white/5 p-2 rounded-2xl border border-white/5 shadow-xl overflow-x-auto no-scrollbar max-w-full">
                <button
                  onClick={() => setActiveTab('genie')}
                  className={`flex items-center justify-center w-11 h-11 rounded-xl border transition-all cursor-pointer flex-shrink-0 ${activeTab === 'genie'
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20'
                    }`}
                >
                  <Sparkles size={18} />
                </button>

                <div className="w-px h-8 bg-white/10 mx-1" />

                {windows.map((win) => (
                  <button
                    key={win.id}
                    onClick={() => toggleMinimize(win.id)}
                    className={`flex items-center justify-center w-10 h-10 rounded-xl border transition-all cursor-pointer flex-shrink-0 ${!win.isMinimized
                        ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20'
                      }`}
                  >
                    {getIconForType(win.type)}
                  </button>
                ))}
                {windows.length === 0 && (
                  <span className="px-4 py-2 text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Workspace Empty</span>
                )}
              </div>
            </div>
          </MotionDiv>
        </div>
      )}

      <ChatOverlay
        isOpen={isOpen || (isPinned && activeTab === 'genie')}
        isPinned={isPinned}
        onClose={() => {
          setIsOpen(false);
          if (isPinned) {
            setIsPinned(false);
            setActiveTab('genie');
          }
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
    </>
  );
};