import React, { useState, useEffect } from 'react';
import { Bold, Italic, List } from 'lucide-react';

interface NoteWriterProps {
    initialText?: string;
    onUpdate?: (text: string) => void;
}

const NoteWriter: React.FC<NoteWriterProps> = ({ initialText = '', onUpdate }) => {
  const [text, setText] = useState(initialText);

  // Sync state if prop changes (e.g. Genie updates it)
  useEffect(() => {
      if (initialText !== undefined) {
          setText(initialText);
      }
  }, [initialText]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newVal = e.target.value;
      setText(newVal);
      if (onUpdate) onUpdate(newVal);
  };

  const insertFormat = (char: string) => {
      setText(prev => prev + char);
      // We don't call onUpdate here for simplicity, but in prod we should
  };

  return (
    <div className="flex flex-col h-full bg-[#fffbeb] text-slate-800 font-serif">
      <div className="flex items-center space-x-1 p-2 bg-[#f3e9d2] border-b border-[#e6dcc0]">
        <button onClick={() => insertFormat('**')} className="p-1.5 hover:bg-black/5 rounded text-slate-700"><Bold size={16}/></button>
        <button onClick={() => insertFormat('*')} className="p-1.5 hover:bg-black/5 rounded text-slate-700"><Italic size={16}/></button>
        <button onClick={() => insertFormat('\n- ')} className="p-1.5 hover:bg-black/5 rounded text-slate-700"><List size={16}/></button>
        <div className="w-px h-5 bg-black/10 mx-2" />
        <span className="text-xs text-slate-500 font-sans uppercase tracking-widest">Notebook</span>
      </div>
      <textarea 
        value={text}
        onChange={handleChange}
        className="flex-1 w-full p-6 bg-transparent resize-none focus:outline-none text-lg leading-relaxed placeholder-slate-400/50"
        placeholder="Start writing your thoughts..."
        style={{ backgroundImage: 'linear-gradient(transparent 95%, rgba(0,0,0,0.05) 95%)', backgroundSize: '100% 1.5em', lineHeight: '1.5em' }}
      />
      <div className="px-4 py-1 bg-[#f3e9d2] text-[10px] text-slate-500 font-sans flex justify-between">
         <span>{text.split(/\s+/).filter(w => w.length > 0).length} words</span>
         <span>AI Co-Pilot Active</span>
      </div>
    </div>
  );
};

export default NoteWriter;