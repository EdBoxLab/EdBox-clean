
import React, { useState, useEffect, useRef } from 'react';
import { Play, Trash2, Terminal, Users, Plus, File, X, FileCode, FolderOpen, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { interactionTracker } from '../../services/interaction-tracker';
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

  const runCode = () => {
    interactionTracker.log({ type: 'click', widgetType: 'CODE_EDITOR', details: `User ran ${activeFile.name}` });
    
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
    <div className="flex h-full bg-[#1e1e1e] text-slate-300 font-mono text-sm overflow-hidden relative">
      {/* Sidebar - File Explorer */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <MotionDiv 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 160, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="flex flex-col bg-[#252526] border-r border-white/5 shrink-0 z-20 absolute md:relative h-full shadow-2xl md:shadow-none"
          >
            <div className="p-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 flex justify-between items-center">
              <span>Explorer</span>
              <button onClick={handleAddFile} className="hover:text-white transition-colors"><Plus size={14}/></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {files?.map(file => (
                <div 
                  key={file.id}
                  onClick={() => { setActiveFileId(file.id); onUpdate({ activeFileId: file.id }); if(window.innerWidth < 768) setSidebarOpen(false); }}
                  className={`px-3 py-1.5 flex items-center gap-2 cursor-pointer hover:bg-white/5 group ${activeFileId === file.id ? 'bg-[#37373d] text-white' : 'text-slate-400'}`}
                >
                  <FileCode size={12} className={activeFileId === file.id ? 'text-cyan-400' : 'text-slate-500'} />
                  <span className="truncate text-xs flex-1">{file.name}</span>
                  {files.length > 1 && (
                    <button 
                      onClick={(e) => handleDeleteFile(e, file.id)}
                      className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {/* Mobile close sidebar button */}
             <div className="md:hidden p-2 border-t border-white/5 text-center">
                <button onClick={() => setSidebarOpen(false)} className="text-xs text-slate-500 hover:text-white">Close Explorer</button>
             </div>
          </MotionDiv>
        )}
      </AnimatePresence>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Bar */}
        <div className="flex items-center justify-between bg-[#2d2d2d] border-b border-white/5 h-9 px-2 shrink-0">
          <button 
             onClick={() => setSidebarOpen(!sidebarOpen)}
             className={`p-1 hover:bg-white/10 rounded text-slate-400 mr-2 ${sidebarOpen && window.innerWidth < 768 ? 'text-cyan-400' : ''}`}
          >
             <FolderOpen size={14} />
          </button>

          {/* Active Tab Info */}
          <div className="flex items-center gap-2 mr-auto bg-[#1e1e1e] px-3 py-1 rounded-t border-t border-x border-white/5 text-xs text-white translate-y-1 max-w-[120px] md:max-w-none">
             <span className="font-medium truncate">{activeFile.name}</span>
             <button onClick={(e) => {
                 // Simple rename prompt
                 const newName = prompt("Rename file:", activeFile.name);
                 if (newName) updateFile(activeFile.id, { name: newName });
             }} className="hover:text-cyan-400 shrink-0"><File size={10} /></button>
          </div>

          <div className="flex items-center gap-2">
             <div className="relative group hidden md:block">
                <select 
                   value={activeFile.language}
                   onChange={(e) => updateFile(activeFile.id, { language: e.target.value })}
                   className="appearance-none bg-[#3c3c3c] text-xs text-slate-200 pl-2 pr-6 py-0.5 rounded border border-white/10 focus:outline-none focus:border-cyan-500 hover:bg-[#4a4a4a]"
                >
                   {LANGUAGES.map(lang => (
                       <option key={lang.id} value={lang.id}>{lang.name}</option>
                   ))}
                </select>
                <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
             </div>

             <button 
                onClick={runCode}
                className="flex items-center gap-1 bg-green-700/80 hover:bg-green-600 text-white px-3 py-1 rounded text-[10px] font-bold transition-colors"
             >
                <Play size={10} fill="currentColor" /> RUN
             </button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 relative group">
           <textarea
              value={activeFile.content}
              onChange={(e) => handleContentChange(e.target.value)}
              spellCheck={false}
              className="absolute inset-0 w-full h-full bg-[#1e1e1e] p-4 resize-none focus:outline-none text-slate-300 font-mono text-sm leading-6"
              style={{ tabSize: 2 }}
              placeholder={`// Write your ${activeFile.language} code here...`}
            />
             <AnimatePresence>
                {isExternalUpdate && (
                    <MotionDiv 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-2 right-4 flex items-center gap-1 text-[10px] text-purple-400 bg-purple-900/30 px-2 py-1 rounded-full border border-purple-500/30 pointer-events-none z-10"
                    >
                        <Users size={10} /> Genie Typing...
                    </MotionDiv>
                )}
            </AnimatePresence>
        </div>

        {/* Console Panel */}
        <div className="h-32 border-t border-white/10 bg-[#0f0f10] flex flex-col z-20 shrink-0">
           <div className="px-3 py-1 bg-[#18181b] border-b border-white/5 flex justify-between items-center h-8">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 flex items-center gap-1">
                 <Terminal size={10} /> Console
              </span>
              <button onClick={() => setLogs([])} className="text-slate-600 hover:text-red-400 transition-colors">
                 <Trash2 size={12} />
              </button>
           </div>
           <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-xs">
              {(!logs || logs.length === 0) ? (
                <span className="text-slate-700 italic opacity-50 block mt-2 ml-2">Output will appear here...</span>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="text-slate-300 border-b border-white/5 pb-1 last:border-0 font-mono break-all whitespace-pre-wrap">
                    <span className="text-cyan-600/50 mr-2">➜</span>
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
