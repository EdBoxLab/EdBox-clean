
import React, { useState, useEffect, useRef } from 'react';
import { Play, Trash2, Terminal, Users, Plus, File, X, FileCode, FolderOpen, ChevronDown, Save, Edit2, PanelLeftClose, GripHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { interactionTracker } from '../../services/interaction-tracker';
import { widgetTelemetry } from '../../services/widget-telemetry';
import { CodeFile } from '../../types';

interface CodeEditorProps {
  files?: CodeFile[];
  activeFileId?: string;
  logs?: string[]; // Logs passed down from parent (AI generated)
  onUpdate: (data: any) => void;
  onRun?: (code: string, language: string) => void; // Trigger for AI execution
  executionTrigger?: number;
}

const LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', ext: 'js' },
  { id: 'typescript', name: 'TypeScript', ext: 'ts' },
  { id: 'python', name: 'Python', ext: 'py' },
  { id: 'html', name: 'HTML', ext: 'html' },
  { id: 'css', name: 'CSS', ext: 'css' },
  { id: 'json', name: 'JSON', ext: 'json' },
  { id: 'java', name: 'Java', ext: 'java' },
  { id: 'cpp', name: 'C++', ext: 'cpp' },
  { id: 'csharp', name: 'C#', ext: 'cs' },
  { id: 'rust', name: 'Rust', ext: 'rs' },
  { id: 'go', name: 'Go', ext: 'go' },
  { id: 'sql', name: 'SQL', ext: 'sql' },
  { id: 'markdown', name: 'Markdown', ext: 'md' },
  { id: 'xml', name: 'XML', ext: 'xml' },
  { id: 'yaml', name: 'YAML', ext: 'yaml' },
];

const MotionDiv = motion.div as any;

const CodeEditor: React.FC<CodeEditorProps> = ({ files: propFiles, activeFileId: propActiveId, logs: propLogs, onUpdate, onRun, executionTrigger }) => {
  // Initialize with a default file if none exist
  const initialFiles = propFiles && propFiles.length > 0 ? propFiles : [
    { id: '1', name: 'script.js', language: 'javascript', content: '// Write your code here...' }
  ];

  const [files, setFiles] = useState<CodeFile[]>(initialFiles);
  const [activeFileId, setActiveFileId] = useState<string>(propActiveId || initialFiles[0].id);
  const [logs, setLogs] = useState<string[]>(propLogs || []);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);

  const lastTriggerRef = useRef(executionTrigger);
  const [isExternalUpdate, setIsExternalUpdate] = useState(false);
  const debounceRef = useRef<any>(null);

  // Console Resizing State
  const [consoleHeight, setConsoleHeight] = useState(160);
  const isResizingConsole = useRef(false);

  // File Renaming State
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; fileId: string } | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, fileId: string) => {
    e.preventDefault();
    if (editorRef.current) {
      const rect = editorRef.current.getBoundingClientRect();
      setContextMenu({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        fileId
      });
    }
  };

  const executeContextMenuAction = (action: 'rename' | 'delete') => {
    if (!contextMenu) return;
    if (action === 'rename') {
      setRenamingFileId(contextMenu.fileId);
      setTimeout(() => renameInputRef.current?.focus(), 50);
    } else if (action === 'delete') {
      handleDeleteFile({ stopPropagation: () => { } } as any, contextMenu.fileId);
    }
    setContextMenu(null);
  };

  const startResizing = (e: React.MouseEvent) => {
    isResizingConsole.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizingConsole.current) return;
    const newHeight = window.innerHeight - e.clientY - 100; // Approximate offset
    // Ideally we calculate based on container bottom but this is a decent approximation for fixed layout
    // Better approach: use deltaY
    setConsoleHeight(h => {
      const h_new = h - e.movementY;
      return Math.max(50, Math.min(600, h_new));
    });
  };

  const stopResizing = () => {
    isResizingConsole.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizing);
  };

  // Sync state when props change (e.g. from Genie)
  useEffect(() => {
    if (propFiles && propFiles.length > 0 && JSON.stringify(propFiles) !== JSON.stringify(files)) {
      setFiles(propFiles);
      setIsExternalUpdate(true);
      setTimeout(() => setIsExternalUpdate(false), 1500);
    }
    if (propActiveId && propActiveId !== activeFileId) {
      setActiveFileId(propActiveId);
    }
  }, [propFiles, propActiveId]);

  // Sync Logs from AI response
  useEffect(() => {
    if (propLogs) {
      setLogs(propLogs);
    }
  }, [propLogs]);

  const activeFile = files?.find(f => f.id === activeFileId) || files?.[0] || initialFiles[0];

  const updateFile = (id: string, updates: Partial<CodeFile>) => {
    const updatedFiles = files.map(f => f.id === id ? { ...f, ...updates } : f);
    setFiles(updatedFiles);
    // Debounce sync to parent
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onUpdate({ files: updatedFiles, activeFileId });
    }, 500);
  };

  const handleContentChange = (val: string) => {
    updateFile(activeFileId, { content: val });

    // Tracking
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onUpdate({ files: files.map(f => f.id === activeFileId ? { ...f, content: val } : f), activeFileId });
      interactionTracker.log({
        type: 'type',
        widgetType: 'CODE_EDITOR',
        details: `User edited ${activeFile.name}`
      });
      widgetTelemetry.fire({
        event_type: 'code_typed',
        widget_type: 'CODE_EDITOR',
        event_data: { language: activeFile.language, lines: val.split('\n').length }
      });
    }, 1000);
  };

  const handleAddFile = () => {
    const newId = Date.now().toString();
    const defaultLang = LANGUAGES[0];
    const newFile: CodeFile = {
      id: newId,
      name: `untitled.${defaultLang.ext}`,
      language: defaultLang.id,
      content: ''
    };
    const newFiles = [...(files || []), newFile];
    setFiles(newFiles);
    setActiveFileId(newId);
    onUpdate({ files: newFiles, activeFileId: newId });
    if (window.innerWidth < 768) setSidebarOpen(false); // Close sidebar on mobile after select
  };

  const handleDeleteFile = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (files.length <= 1) return; // Prevent deleting last file
    const newFiles = files.filter(f => f.id !== id);
    setFiles(newFiles);
    if (activeFileId === id) {
      setActiveFileId(newFiles[0].id);
      onUpdate({ files: newFiles, activeFileId: newFiles[0].id });
    } else {
      onUpdate({ files: newFiles });
    }
  };

  const handleRename = (id: string, newName: string) => {
    if (!newName.trim()) return;
    updateFile(id, { name: newName });
    setRenamingFileId(null);
  };

  const handleManualSave = () => {
    onUpdate({ files, activeFileId });
    setLogs(prev => [...prev, `> Saved all files at ${new Date().toLocaleTimeString()}`]);
  };

  const runCode = () => {
    interactionTracker.log({ type: 'click', widgetType: 'CODE_EDITOR', details: `User ran ${activeFile.name}` });
    widgetTelemetry.fire({
      event_type: 'code_executed',
      widget_type: 'CODE_EDITOR',
      event_data: { language: activeFile.language, filename: activeFile.name }
    });

    // Set immediate feedback logs
    setLogs([
      `> Compiling ${activeFile.name}...`,
      `> Sending to execution environment (${activeFile.language})...`
    ]);

    // Trigger AI Execution via Parent
    if (onRun) {
      onRun(activeFile.content, activeFile.language);
    } else {
      setLogs(prev => [...prev, "Error: Execution environment not connected."]);
    }
  };

  useEffect(() => {
    if (executionTrigger && executionTrigger !== lastTriggerRef.current) {
      lastTriggerRef.current = executionTrigger;
      runCode();
    }
  }, [executionTrigger]);

  return (
    <div ref={editorRef} className="flex h-full bg-[#1f1f1f] text-[#cccccc] font-sans text-sm overflow-hidden relative selection:bg-blue-500/30">
      {/* Context Menu */}
      {contextMenu && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="absolute z-50 w-32 bg-white rounded-lg shadow-xl border border-slate-200 py-1 flex flex-col animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => executeContextMenuAction('rename')}
            className="px-3 py-2 text-left text-slate-700 hover:bg-slate-100 text-xs flex items-center gap-2"
          >
            <Edit2 size={12} /> Rename
          </button>
          <button
            onClick={() => executeContextMenuAction('delete')}
            className="px-3 py-2 text-left text-red-600 hover:bg-red-50 text-xs flex items-center gap-2"
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>
      )}

      {/* Sidebar - File Explorer */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <MotionDiv
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 220, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex flex-col bg-[#f1f5f9] border-r border-[#cbd5e1] shrink-0 z-20 absolute md:relative h-full"
          >
            <div className="h-9 px-3 flex items-center justify-between border-b border-[#cbd5e1] bg-[#f8fafc]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Explorer</span>
              <div className="flex items-center gap-1">
                <button onClick={handleAddFile} className="p-1 hover:bg-slate-200 rounded text-slate-600 hover:text-black transition-colors" title="New File"><Plus size={16} /></button>
                <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-slate-200 rounded text-slate-600 hover:text-black transition-colors" title="Collapse Sidebar"><PanelLeftClose size={16} /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
              {files?.map(file => (
                <div
                  key={file.id}
                  onClick={() => { setActiveFileId(file.id); onUpdate({ activeFileId: file.id }); if (window.innerWidth < 768) setSidebarOpen(false); }}
                  onDoubleClick={(e) => { e.stopPropagation(); setRenamingFileId(file.id); setTimeout(() => renameInputRef.current?.focus(), 50); }}
                  onContextMenu={(e) => handleContextMenu(e, file.id)}
                  className={`px-3 py-1 flex items-center gap-2 cursor-pointer transition-colors border-l-2 ${activeFileId === file.id ? 'bg-white border-blue-500 text-blue-700 shadow-sm font-medium' : 'border-transparent hover:bg-slate-200 text-slate-600'}`}
                >
                  <FileCode size={13} className={activeFileId === file.id ? 'text-blue-600' : 'text-slate-500'} />

                  {renamingFileId === file.id ? (
                    <input
                      ref={renameInputRef}
                      defaultValue={file.name}
                      className="bg-white text-slate-800 text-xs px-1 py-0.5 rounded border border-blue-500 outline-none w-full font-mono shadow-sm"
                      onBlur={(e) => handleRename(file.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(file.id, e.currentTarget.value);
                        if (e.key === 'Escape') setRenamingFileId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="truncate text-xs flex-1">{file.name}</span>
                  )}

                  {renamingFileId !== file.id && (
                    <div className="flex items-center gap-1 opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); setRenamingFileId(file.id); setTimeout(() => renameInputRef.current?.focus(), 50); }}
                        className="hover:text-blue-600 text-slate-400 hover:bg-slate-200 rounded p-0.5"
                        title="Rename"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteFile(e, file.id)}
                        className="hover:text-red-500 text-slate-400 hover:bg-slate-200 rounded p-0.5"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#1f1f1f]">

        {/* Top Bar / Tab Bar */}
        <div className="flex items-center justify-between bg-[#2d2d2d] h-9 px-3 shrink-0 select-none">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1 hover:bg-[#444] rounded text-[#ccc] transition-colors"
                title="Expand Sidebar"
              >
                <FolderOpen size={14} />
              </button>
            )}

            {/* Active Tab */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1f1f1f] text-xs text-white border-t-2 border-cyan-400 rounded-t-sm">
              <span className="font-medium">{activeFile.name}</span>
              <button onClick={() => handleDeleteFile({ stopPropagation: () => { } } as any, activeFile.id)} className="hover:bg-[#333] rounded p-0.5">
                <X size={10} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleManualSave}
              className="p-1.5 hover:bg-[#444] rounded text-[#ccc] transition-colors"
              title="Save"
            >
              <Save size={14} />
            </button>

            <div className="h-4 w-[1px] bg-[#444] mx-1" />

            <div className="relative group">
              <select
                value={activeFile.language}
                onChange={(e) => updateFile(activeFile.id, { language: e.target.value })}
                className="appearance-none bg-transparent text-xs text-[#ccc] hover:text-white pl-2 pr-6 py-1 focus:outline-none cursor-pointer"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.id} value={lang.id} className="bg-[#2d2d2d]">{lang.name}</option>
                ))}
              </select>
              <ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 text-[#888] pointer-events-none" />
            </div>

            <button
              onClick={runCode}
              className="ml-2 flex items-center gap-1.5 bg-[#238636] hover:bg-[#2ea043] text-white px-3 py-1 rounded-sm text-[11px] font-semibold transition-colors shadow-sm"
            >
              <Play size={10} fill="currentColor" /> Run
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 relative group bg-[#1f1f1f]">
          <textarea
            value={activeFile.content}
            onChange={(e) => handleContentChange(e.target.value)}
            spellCheck={false}
            className="absolute inset-0 w-full h-full bg-[#1f1f1f] p-4 resize-none focus:outline-none text-[#d4d4d4] font-mono text-sm leading-relaxed"
            style={{ tabSize: 2 }}
            placeholder={`// Write your ${activeFile.language} code here...`}
          />
          <AnimatePresence>
            {isExternalUpdate && (
              <MotionDiv
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute top-2 right-4 flex items-center gap-1 text-[10px] text-[#888] bg-[#222]/80 px-2 py-1 rounded-full border border-[#333] pointer-events-none z-10"
              >
                <Users size={10} /> Genie Typing...
              </MotionDiv>
            )}
          </AnimatePresence>
        </div>

        {/* Console Panel */}
        {/* Console Panel */}
        <div
          style={{ height: consoleHeight }}
          className="border-t border-[#333] bg-[#18181b] flex flex-col z-20 shrink-0 relative transition-all duration-75 ease-out"
        >
          {/* Resize Handle with Grip */}
          <div
            onMouseDown={startResizing}
            className="absolute -top-1.5 left-0 right-0 h-3 cursor-row-resize z-30 group flex items-center justify-center hover:bg-blue-500/10 transition-colors"
          >
            <div className="h-1 w-12 rounded-full bg-[#444] group-hover:bg-blue-400 transition-colors flex items-center justify-center gap-1 shadow-sm">
              {/* Visual Grip Dots */}
              <div className="w-0.5 h-0.5 rounded-full bg-black/50" />
              <div className="w-0.5 h-0.5 rounded-full bg-black/50" />
              <div className="w-0.5 h-0.5 rounded-full bg-black/50" />
            </div>
          </div>

          <div className="px-3 py-1 bg-[#1e1e1e] border-b border-[#333] flex justify-between items-center h-8 shrink-0 select-none">
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#888] flex items-center gap-1">
              <Terminal size={12} /> Terminal
            </span>
            <button onClick={() => setLogs([])} className="text-[#666] hover:text-[#ff5f56] transition-colors p-1 rounded hover:bg-[#333]">
              <Trash2 size={12} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-xs text-[#ccc]">
            {(!logs || logs.length === 0) ? (
              <span className="text-[#555] italic opacity-50 block mt-2 ml-2">No output...</span>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="border-b border-[#2a2a2a] pb-1 last:border-0 font-mono break-all whitespace-pre-wrap">
                  <span className="text-cyan-500 mr-2">➜</span>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CodeEditor;
