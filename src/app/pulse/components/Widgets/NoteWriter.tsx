
import React, { useState, useEffect, useRef } from 'react';
import { Bold, Italic, List, Eye, PenLine } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { interactionTracker } from '../../services/interaction-tracker';

interface NoteWriterProps {
    initialText?: string;
    onUpdate?: (text: string) => void;
}

const NoteWriter: React.FC<NoteWriterProps> = ({ initialText = '', onUpdate }) => {
  const [text, setText] = useState(initialText);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const debounceRef = useRef<any>(null);

  useEffect(() => {
      if (initialText !== undefined && initialText !== text) {
          setText(initialText);
      }
  }, [initialText]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newVal = e.target.value;
      setText(newVal);
      if (onUpdate) onUpdate(newVal);

      // Debounce logging so we don't spam per character
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
          interactionTracker.log({
              type: 'type',
              widgetType: 'NOTE_WRITER',
              details: `User updated note text. Length: ${newVal.length}`
          });
      }, 1000);
  };

  const insertFormat = (char: string) => {
      setText(prev => prev + char);
      interactionTracker.log({
          type: 'click',
          widgetType: 'NOTE_WRITER',
          details: `User inserted format: ${char}`
      });
  };

  return (
    <div className="flex flex-col h-full bg-[#fffbeb] text-slate-800 font-serif relative">
      <div className="flex items-center space-x-1 p-2 bg-[#f3e9d2] border-b border-[#e6dcc0] shrink-0">
        <button onClick={() => setViewMode('edit')} className={`p-1.5 rounded transition-colors ${viewMode === 'edit' ? 'bg-black/10 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`} title="Edit Mode">
            <PenLine size={16} />
        </button>
        <button onClick={() => setViewMode('preview')} className={`p-1.5 rounded transition-colors ${viewMode === 'preview' ? 'bg-black/10 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`} title="Preview Mode (Markdown/LaTeX)">
            <Eye size={16} />
        </button>
        <div className="w-px h-5 bg-black/10 mx-2" />
        
        <button onClick={() => insertFormat('**')} disabled={viewMode === 'preview'} className="p-1.5 hover:bg-black/5 rounded text-slate-700 disabled:opacity-30"><Bold size={16}/></button>
        <button onClick={() => insertFormat('*')} disabled={viewMode === 'preview'} className="p-1.5 hover:bg-black/5 rounded text-slate-700 disabled:opacity-30"><Italic size={16}/></button>
        <button onClick={() => insertFormat('\n- ')} disabled={viewMode === 'preview'} className="p-1.5 hover:bg-black/5 rounded text-slate-700 disabled:opacity-30"><List size={16}/></button>
        
        <div className="flex-1 text-right">
             <span className="text-[10px] text-slate-500 font-sans uppercase tracking-widest mr-2">Notebook</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto relative">
          {viewMode === 'edit' ? (
              <textarea 
                value={text}
                onChange={handleChange}
                className="w-full h-full p-6 bg-transparent resize-none focus:outline-none text-lg leading-relaxed placeholder-slate-400/50"
                placeholder="Start writing... Supports Markdown and LaTeX ($...$)"
                style={{ backgroundImage: 'linear-gradient(transparent 95%, rgba(0,0,0,0.05) 95%)', backgroundSize: '100% 1.5em', lineHeight: '1.5em' }}
              />
          ) : (
              <div className="w-full h-full p-8 prose prose-slate max-w-none overflow-y-auto">
                 <ReactMarkdown 
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                 >
                    {text || "*No content to preview*"}
                 </ReactMarkdown>
              </div>
          )}
      </div>

      <div className="px-4 py-1 bg-[#f3e9d2] text-[10px] text-slate-500 font-sans flex justify-between shrink-0">
         <span>{text.split(/\s+/).filter(w => w.length > 0).length} words</span>
         <span>{viewMode === 'edit' ? 'Editing' : 'Previewing'}</span>
      </div>
    </div>
  );
};

export default NoteWriter;
