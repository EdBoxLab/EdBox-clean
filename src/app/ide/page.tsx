'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { GenieAssistantView } from './GenieAssistantView';
import { ProjectsView } from './ProjectsView';
import { EditorView } from './EditorView';
import { CollaborationView } from './CollaborationView';
import { Section } from './types';
import { SECTIONS } from './constants';

const IDEPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<Section>(SECTIONS[0]);

  // These are not yet implemented with real APIs, so they remain as local state
  const [aiContextPrompt, setAiContextPrompt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNavigateToAi = (prompt: string) => {
    setAiContextPrompt(prompt);
    setActiveSection(SECTIONS.find((s) => s.id === 'ai-assistant')!);
  };

  const renderContent = () => {
    if (error) {
      return (
        <div className="p-8 text-center text-red-600 dark:text-red-400">Error: {error}</div>
      );
    }
    if (isLoading) {
      return <div className="p-8 text-center">Loading...</div>;
    }

    switch (activeSection.id) {
      case 'projects':
        return (
          <ProjectsView />
        );
      case 'editor':
        return (
          <EditorView
            files={[]}
            activeFile={null}
            localChanges={{}}
            onSelectFile={() => {}}
            onContentChange={() => {}}
            installedExtensions={[]}
            onSetAiContextPrompt={handleNavigateToAi}
            getModifiedStatus={(path) => false}
          />
        )
      case 'collaboration':
        return <CollaborationView />;
      case 'ai-assistant':
        return (
          <GenieAssistantView
            initialPrompt={aiContextPrompt}
            onPromptHandled={() => setAiContextPrompt(null)}
          />
        );
      default:
        return (
          <ProjectsView />
        );
    }
  };

  return (
    <div className="flex h-screen w-full font-sans">
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title={activeSection.name} onSignIn={() => {}} />
        <main className="flex-1 overflow-y-auto p-0 md:p-0 bg-slate-100 dark:bg-slate-800/50">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default IDEPage;
