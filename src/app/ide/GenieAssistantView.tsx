'use client';
import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from './types';
import { askGenie } from '../../services/geminiService';
import { marked } from 'marked';

interface GenieAssistantViewProps {
  initialPrompt?: string | null;
  onPromptHandled?: () => void;
}

const UserMessage: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex justify-end mb-4">
    <div className="bg-indigo-600 text-white rounded-lg py-2 px-4 max-w-2xl break-words whitespace-pre-wrap">
      {text}
    </div>
  </div>
);

const AiMessage: React.FC<{ text: string; isLoading?: boolean }> = ({ text, isLoading = false }) => {
  const htmlContent = isLoading ? '' : marked.parse(text) as string;

  return (
    <div className="flex justify-start mb-4">
      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center font-bold text-indigo-500 dark:text-indigo-300 flex-shrink-0 mr-3">
        G
      </div>
      <div className="bg-slate-100 dark:bg-slate-700 rounded-lg py-2 px-4 max-w-2xl break-words text-slate-800 dark:text-slate-300">
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
          </div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: htmlContent }} />
        )}
      </div>
    </div>
  );
};

const suggestedPrompts = [
  "What is GraphQL Federation used for?",
  "Explain the 'Realtime Fabric'.",
  "Summarize the collaboration tools.",
  "What is the role of the Interactive Canvas?",
];

export const GenieAssistantView: React.FC<GenieAssistantViewProps> = ({ initialPrompt, onPromptHandled }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'assistant', content: "Hello! I'm Genie, your expert on the EdBox IDE's architecture. Ask me anything about the system design, or use the AI tools in the editor to send me code!" },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (promptToSend: string) => {
    if (!promptToSend.trim()) return;

    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', content: promptToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const aiResponse = await askGenie(promptToSend);
      const aiMessage: ChatMessage = { id: Date.now().toString(), role: 'assistant', content: aiResponse };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error fetching AI response:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while fetching a response. Please check the console for details and try again.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialPrompt && !isLoading) { // Ensure not to trigger on subsequent re-renders
      handleSendMessage(initialPrompt);
      if (onPromptHandled) {
        onPromptHandled();
      }
    }
  }, [initialPrompt]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto p-4 md:p-8">
       <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Chat with Genie</h2>
            <p className="mt-2 text-lg text-slate-500 dark:text-slate-400">
                Your AI-powered coding and architecture assistant.
            </p>
        </div>
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl shadow-slate-950/50 flex flex-col h-[65vh]">
        <div className="flex-1 p-6 overflow-y-auto">
          {messages.map((msg) =>
            msg.role === 'user' ? (
              <UserMessage key={msg.id} text={msg.content} />
            ) : (
              <AiMessage key={msg.id} text={msg.content} />
            )
          )}
          {isLoading && <AiMessage text="" isLoading={true} />}
          <div ref={messagesEndRef} />
        </div>
        <div className="border-t border-slate-200 dark:border-slate-700 p-4">
          <div className="flex flex-wrap gap-2 mb-3">
            {suggestedPrompts.map((prompt, i) => (
                <button
                    key={i}
                    onClick={() => setInput(prompt)} // Set input instead of directly sending
                    className="bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 text-xs px-3 py-1.5 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    aria-label={`Ask: ${prompt}`}
                >
                    {prompt}
                </button>
            ))}
          </div>
          <form onSubmit={handleFormSubmit} className="flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Genie about the architecture..."
              className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full py-2 px-4 text-slate-800 dark:text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="ml-4 bg-indigo-600 text-white rounded-full p-2 disabled:bg-slate-600 disabled:cursor-not-allowed hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-indigo-500 transition-colors"
              aria-label="Send message"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M3.105 6.105a1.5 1.5 0 011.995-.44l11.69 5.845a1.5 1.5 0 010 2.69l-11.69 5.845a1.5 1.5 0 01-1.995-2.25l1.04-3.12-5.454-1.818a1.5 1.5 0 010-2.691l5.454-1.818-1.04-3.121a1.5 1.5 0 01-.005-2.245z" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};