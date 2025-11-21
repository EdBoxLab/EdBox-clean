'use client';
import React from 'react';

interface EditorViewProps {
  files: any[];
  activeFile: any;
  localChanges: any;
  onSelectFile: (file: any) => void;
  onContentChange: (filePath: string, newContent: string) => void;
  installedExtensions: string[];
  onSetAiContextPrompt: (prompt: string) => void;
  getModifiedStatus: (path: string) => boolean;
}

export const EditorView: React.FC<EditorViewProps> = ({ 
  files, 
  activeFile, 
  localChanges, 
  onSelectFile, 
  onContentChange, 
  installedExtensions, 
  onSetAiContextPrompt, 
  getModifiedStatus
}) => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 p-4">
        <h2 className="text-lg font-bold mb-4">Editor</h2>
        <p>This is a simplified editor view. To see the full functionality, please select a project.</p>
      </div>
    </div>
  );
};