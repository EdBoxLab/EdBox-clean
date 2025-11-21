import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { MathRenderer } from './components/MathRenderer';
import { ToolType, MathSolution } from './types';
import { solveMathProblemStream } from './services/geminiService';
import { SAMPLE_PROBLEMS } from './constants';
import { Send, Loader2, Sparkles, ChevronRight, Mic, MicOff } from 'lucide-react';

const App: React.FC = () => {
  const [currentTool, setCurrentTool] = useState<ToolType>(ToolType.SOLVER);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [solution, setSolution] = useState<MathSolution | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev ? `${prev} ${transcript}` : transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(prev => !prev);
  }, []);

  // Reset solution when tool changes to avoid confusing state
  const handleToolChange = (tool: ToolType) => {
    setCurrentTool(tool);
    setSolution(null);
    setInput('');
  };

  const handleSubmit = async (e?: React.FormEvent, overrideInput?: string) => {
    if (e) e.preventDefault();
    const textToSolve = overrideInput || input;
    if (!textToSolve.trim()) return;

    // If triggered via override (buttons), update the input field too
    if (overrideInput) setInput(overrideInput);

    setIsLoading(true);
    setIsStreaming(true);
    setSolution({
        originalProblem: textToSolve,
        summary: "Initializing...",
        steps: [],
    });

    try {
      // Use the streaming service
      const finalResult = await solveMathProblemStream(
          textToSolve, 
          currentTool,
          (partial) => {
              setSolution(prev => ({...prev, ...partial, originalProblem: textToSolve}));
          }
      );
      setSolution(finalResult);
    } catch (error) {
      console.error("Failed to solve:", error);
      setSolution(prev => prev ? {...prev, summary: "An error occurred while processing."} : null);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleSampleClick = (problem: string) => {
    handleSubmit(undefined, problem);
  };

  const getPlaceholder = () => {
      switch(currentTool) {
          case ToolType.GEOMETRY: return "Describe a shape (e.g. 'Draw a triangle with vertices...')";
          case ToolType.STATISTICS: return "Enter data or request (e.g. 'Find mean of 1,2,5,9...')";
          case ToolType.GRAPH: return "Enter a function to plot (e.g. y = x^2)";
          default: return "Enter a math problem (e.g. Solve x^2 - 4 = 0)";
      }
  };

  return (
    <Layout 
      currentTool={currentTool} 
      onToolChange={handleToolChange} 
      isSidebarCollapsed={isSidebarCollapsed} 
      toggleSidebar={toggleSidebar}
    >
      <div className="flex flex-col h-full">
          {/* Input Area - Sticky Top */}
          <div className="p-4 md:p-6 bg-studio-bg/90 backdrop-blur-md z-10 sticky top-0 border-b border-white/5">
             <div className="max-w-4xl mx-auto w-full">
                <form onSubmit={(e) => handleSubmit(e)} className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Sparkles className={`w-5 h-5 ${isStreaming ? 'text-indigo-400 animate-pulse' : 'text-studio-muted'}`} />
                  </div>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={getPlaceholder()}
                    className="w-full bg-studio-panel text-white placeholder-studio-muted pl-12 pr-28 py-4 rounded-2xl border border-white/5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none shadow-lg font-mono text-lg"
                  />
                  
                  <div className="absolute right-2 top-2 bottom-2 flex gap-2">
                      <button
                        type="button"
                        onClick={toggleListening}
                        className={`aspect-square rounded-xl flex items-center justify-center transition-all w-10 ${isListening ? 'bg-red-500/20 text-red-400 animate-pulse' : 'hover:bg-white/5 text-studio-muted hover:text-white'}`}
                        title="Voice Input"
                      >
                        {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                      </button>

                      <button 
                        type="submit" 
                        disabled={isStreaming && !input.trim()}
                        className="aspect-square bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 disabled:text-white/20 text-white rounded-xl flex items-center justify-center transition-all w-10"
                      >
                        {isStreaming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                      </button>
                  </div>
                </form>

                {/* Quick Chips (Only show in Solver mode if empty) */}
                {!solution && !isStreaming && currentTool === ToolType.SOLVER && (
                  <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
                    {SAMPLE_PROBLEMS.slice(0, 3).map((prob, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSampleClick(prob)}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-studio-muted hover:text-white border border-white/5 transition-colors flex items-center gap-1"
                      >
                        {prob} <ChevronRight className="w-3 h-3 opacity-50" />
                      </button>
                    ))}
                  </div>
                )}
             </div>
          </div>

          {/* Results Area */}
          <div className="flex-1 overflow-hidden relative">
             <div className="absolute inset-0 overflow-y-auto custom-scrollbar">
                <div className="max-w-4xl mx-auto w-full p-4 md:p-6 pb-20 h-full">
                  <MathRenderer 
                    solution={solution} 
                    isStreaming={isStreaming} 
                    currentTool={currentTool}
                    onSolve={(text) => handleSubmit(undefined, text)}
                  />
                </div>
             </div>
          </div>
        </div>
    </Layout>
  );
};

export default App;