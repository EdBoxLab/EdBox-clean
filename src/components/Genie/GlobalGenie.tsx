'use client';

import React, { useState, useEffect } from 'react';
import { GenieBubble } from './GenieBubble';
import { ChatOverlay } from './ChatOverlay';
import Chat from './Chat';
import { ChatMessage, GenieState } from '@/app/pulse/types';
import { sendChatMessage } from '@/app/pulse/services/chat-client';
import { liveGenieService } from '@/app/pulse/services/live';
import { interactionTracker } from '@/app/pulse/services/interaction-tracker';

import { useGenie } from '@/lib/contexts/GenieContext';

export const GlobalGenie: React.FC = () => {
  const { isOpen, setIsOpen, isPinned, setIsPinned } = useGenie();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'system', text: 'Welcome back. I am your Genie. How can I assist your learning today?', timestamp: Date.now() }
  ]);
  const [genieState, setGenieState] = useState<GenieState>({ isThinking: false, mood: 'neutral', mode: 'regular' });
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [isLivePaused, setIsLivePaused] = useState(false);
  const [sessionId] = useState(() => `global-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);



  // Load chat history from local storage
  useEffect(() => {
    const saved = localStorage.getItem('global_genie_messages');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse global genie messages", e);
      }
    }
  }, []);

  // Save changes to local storage
  useEffect(() => {
    localStorage.setItem('global_genie_messages', JSON.stringify(messages));
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setGenieState(prev => ({ ...prev, isThinking: true, mood: 'focused' }));

    try {
      const response = await sendChatMessage({
        message: text,
        sessionId,
        activityContext: `Current Page: ${window.location.pathname}`,
      });

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
     // On dashboard, sync is just refreshing the general context
     setMessages(prev => [...prev, { 
       id: Date.now().toString(), 
       role: 'system', 
       text: `🔄 Refreshing workspace context for ${window.location.pathname}...`, 
       timestamp: Date.now() 
     }]);
     await handleSendMessage("SYNC_COMMAND: Refreshing context for the current page.");
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
        onToolCall: (name, args) => console.log("Global Tool Call (Ignored):", name, args),
        onAudioActivity: () => {},
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

  return (
    <>
      <GenieBubble 
        genieState={genieState}
        isLiveActive={isLiveActive}
        isLivePaused={isLivePaused}
        onClick={() => setIsOpen(!isOpen)}
        isOpen={isOpen}
      />

      <ChatOverlay 
        isOpen={isOpen} 
        isPinned={isPinned}
        onClose={() => {
            setIsOpen(false);
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
          onTogglePin={() => setIsPinned(!isPinned)}
        />
      </ChatOverlay>

    </>
  );
};

