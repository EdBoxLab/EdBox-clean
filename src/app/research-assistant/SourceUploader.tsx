import React, { useState, useCallback, useRef } from 'react';
import type { Source } from '../../types';
import { FileIcon, PlusIcon, TrashIcon, TextIcon, BookOpenIcon } from './Icons';

interface SourceUploaderProps {
  onSourcesChanged: (sources: Source[]) => void;
  initialSources?: Source[];
}

const SourceViewerModal: React.FC<{ source: Source; onClose: () => void }> = ({ source, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-semibold text-brand-text">{source.name}</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-brand-subtext font-sans">{source.content}</pre>
            </div>
        </div>
    </div>
);

export const SourceUploader: React.FC<SourceUploaderProps> = ({ onSourcesChanged, initialSources = [] }) => {
  const [sources, setSources] = useState<Source[]>(initialSources);
  const [showTextArea, setShowTextArea] = useState<boolean>(false);
  const [textContent, setTextContent] = useState<string>('');
  const [viewingSource, setViewingSource] = useState<Source | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addSource = useCallback((newSource: Source) => {
    const updatedSources = [...sources, newSource];
    setSources(updatedSources);
    onSourcesChanged(updatedSources);
  }, [sources, onSourcesChanged]);

  const removeSource = useCallback((index: number) => {
    const updatedSources = sources.filter((_, i) => i !== index);
    setSources(updatedSources);
    onSourcesChanged(updatedSources);
  }, [sources, onSourcesChanged]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          addSource({ id: crypto.randomUUID(), name: file.name, type: 'file', content });
        };
        reader.readAsText(file);
      }
    }
  };
  
  const handleAddText = () => {
      if (textContent.trim()) {
          const name = textContent.slice(0, 30).trim().replace(/\s+/g, ' ') + '...';
          addSource({ id: crypto.randomUUID(), name: `Snippet: "${name}"`, type: 'text', content: textContent });
          setTextContent('');
          setShowTextArea(false);
      }
  };

  return (
    <>
      {viewingSource && <SourceViewerModal source={viewingSource} onClose={() => setViewingSource(null)} />}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md space-y-4 animate-slide-in">
        <h2 className="text-lg font-semibold text-brand-text flex items-center">
          <FileIcon className="h-5 w-5 mr-2 text-brand-blue" />
          Manage Sources
        </h2>
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {sources.map((source, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-100 p-3 rounded-lg animate-fade-in group">
              <div className="flex items-center space-x-2 overflow-hidden">
                {source.type === 'file' ? <FileIcon className="h-5 w-5 text-brand-subtext flex-shrink-0" /> : <TextIcon className="h-5 w-5 text-brand-subtext flex-shrink-0" />}
                <span className="text-sm font-medium text-brand-text truncate" title={source.name}>{source.name}</span>
              </div>
              <div className="flex items-center">
                <button onClick={() => setViewingSource(source)} className="p-1 text-gray-500 hover:text-brand-blue rounded-full hover:bg-blue-100 transition-colors opacity-0 group-hover:opacity-100">
                    <BookOpenIcon className="h-4 w-4" />
                </button>
                <button onClick={() => removeSource(index)} className="p-1 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-100 transition-colors">
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {sources.length === 0 && (
              <p className="text-sm text-center text-brand-subtext py-4">Add a source document to begin.</p>
          )}
        </div>

        {showTextArea && (
            <div className="space-y-2 animate-fade-in">
                <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Paste your text here..."
                    className="w-full h-32 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-lightblue focus:border-transparent transition"
                />
                <div className="flex justify-end space-x-2">
                    <button onClick={() => setShowTextArea(false)} className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors">Cancel</button>
                    <button onClick={handleAddText} className="px-3 py-1 text-sm font-medium text-white bg-brand-blue rounded-md hover:bg-opacity-90 transition-colors">Add Text</button>
                </div>
            </div>
        )}

        <div className="flex space-x-2">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium text-brand-blue bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors">
              <PlusIcon className="h-4 w-4 mr-2" /> Upload File
          </button>
          <button onClick={() => setShowTextArea(!showTextArea)} className="flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium text-brand-blue bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors">
              <PlusIcon className="h-4 w-4 mr-2" /> Add Text
          </button>
        </div>
      </div>
    </>
  );
};