import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { CodeEditor } from './components/CodeEditor';
import { Visualizer } from './components/Visualizer';
import { Console } from './components/Console';
import { SCENES } from './constants';
import { Language, LogEntry, VisualizationMode, ChartDataPoint } from './types';
import { generateCodeAnalysis, simulateExecution, optimizeCode, instrumentCode } from './services/geminiService';

export default function App() {
  // -- State --
  const [activeSceneId, setActiveSceneId] = useState(SCENES[0].id);
  const [code, setCode] = useState(SCENES[0].code);
  const [language, setLanguage] = useState<Language>(SCENES[0].language);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [vizData, setVizData] = useState<ChartDataPoint[]>([]);
  const [vizMode, setVizMode] = useState<VisualizationMode>(SCENES[0].defaultViz);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'console' | 'visualizer' | 'analysis'>('console');

  // Debugging State
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [currentLine, setCurrentLine] = useState<number | null>(null);
  const [isWaitingForStep, setIsWaitingForStep] = useState(false);
  const stepResolverRef = useRef<((value: void) => void) | null>(null);

  // -- Helpers --
  const addLog = (type: LogEntry['type'], content: string) => {
    setLogs(prev => [...prev, { id: crypto.randomUUID(), timestamp: new Date(), type, content }]);
  };

  const handleSceneChange = (id: string) => {
    const scene = SCENES.find(s => s.id === id);
    if (scene) {
      setActiveSceneId(id);
      setCode(scene.code);
      setLanguage(scene.language);
      setVizMode(scene.defaultViz);
      setLogs([]);
      setVizData([]);
      setAnalysis(null);
      setIsDebugMode(false);
      setCurrentLine(null);
      
      // Auto-switch tabs based on scene type
      if (scene.defaultViz !== VisualizationMode.None) {
        setActiveTab('visualizer');
      } else {
        setActiveTab('console');
      }
    }
  };

  // -- Execution Logic --
  
  const runJavaScript = async (codeToRun: string, debug = false) => {
    setLogs([]);
    setVizData([]); // Reset viz
    
    // If not debugging, switch to console or visualizer
    if (!debug) {
      if (vizMode !== VisualizationMode.None) setActiveTab('visualizer');
      else setActiveTab('console');
    }

    try {
      // Define Environment Helpers
      const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      
      const visualize = (type: string, data: any) => {
        // This function runs in the user's code scope
        if (type === 'chart') {
          setVizData(data);
        }
        // Additional viz types can be handled here
      };

      // Debug stepper
      const step = async (line: number) => {
        setCurrentLine(line);
        setIsWaitingForStep(true);
        await new Promise<void>(resolve => {
          stepResolverRef.current = resolve;
        });
        setIsWaitingForStep(false);
      };

      // Create a custom console to intercept logs
      // This ensures "hello world" works even if they use console.log instead of our helper
      const customConsole = {
        log: (...args: any[]) => {
          const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
          addLog('info', msg);
          console.log('[User Code]', ...args); // also log to real console for dev debugging
        },
        error: (...args: any[]) => {
           const msg = args.join(' ');
           addLog('error', msg);
        },
        warn: (...args: any[]) => {
           const msg = args.join(' ');
           addLog('warn', msg);
        },
        info: (...args: any[]) => {
            const msg = args.join(' ');
            addLog('info', msg);
        }
      };

      // Legacy 'log' helper for backward compatibility with scenes
      const legacyLog = (...args: any[]) => customConsole.log(...args);

      // Construct the function body
      // We wrap it in an async IIFE to allow top-level await
      const wrappedCode = `
        return (async () => {
          try {
            ${codeToRun}
          } catch (e) {
            console.error("Runtime Error: " + e.message);
            throw e;
          }
        })();
      `;

      // Create the function with injected dependencies
      const func = new Function(
        'log', 
        'sleep', 
        'visualize', 
        'step', 
        'console', // Inject our custom console
        wrappedCode
      );

      await func(legacyLog, sleep, visualize, step, customConsole);
      
      addLog('system', 'Execution finished.');
      if (debug) {
        setIsDebugMode(false);
        setCurrentLine(null);
      }

    } catch (err: any) {
      addLog('error', err.message || String(err));
      setIsDebugMode(false);
    }
  };

  const handleRun = async () => {
    if (language === Language.JavaScript) {
      await runJavaScript(code, false);
    } else {
      // Simulate execution for non-browser languages via Gemini
      addLog('system', `Running ${language} simulation...`);
      setActiveTab('console');
      const result = await simulateExecution(code, language);
      addLog('info', result);
      addLog('system', 'Simulation complete.');
    }
  };

  const handleDebug = async () => {
    if (language !== Language.JavaScript) {
      addLog('warn', 'Interactive debugging is currently only available for JavaScript.');
      return;
    }

    setIsDebugMode(true);
    addLog('system', 'Preparing debugger...');
    
    try {
      // Instrument code via Gemini
      const instrumented = await instrumentCode(code);
      addLog('system', 'Debugger ready. Running...');
      // Run the instrumented code
      await runJavaScript(instrumented, true);
    } catch (e) {
      addLog('error', 'Failed to start debugger.');
      setIsDebugMode(false);
    }
  };

  const handleNextStep = () => {
    if (stepResolverRef.current) {
      stepResolverRef.current();
      stepResolverRef.current = null;
    }
  };

  const handleAnalysis = async () => {
    setIsAnalyzing(true);
    setActiveTab('analysis');
    const result = await generateCodeAnalysis(code, language);
    setAnalysis(result);
    setIsAnalyzing(false);
  };

  const handleOptimize = async () => {
    const original = code;
    setCode("// Optimizing...");
    try {
      const optimized = await optimizeCode(original, language);
      setCode(optimized);
      addLog('system', 'Code optimized by AI.');
    } catch (e) {
      setCode(original);
      addLog('error', 'Optimization failed.');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* -- HEADER -- */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center px-4 justify-between shrink-0 overflow-x-auto gap-4">
        <div className="flex items-center gap-3 min-w-max">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-slate-100 tracking-tight">CodeLab Studio</h1>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">AI-Powered Runtime</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-950/50 p-1 rounded-lg border border-slate-800 min-w-max">
          {SCENES.map(scene => (
            <button
              key={scene.id}
              onClick={() => handleSceneChange(scene.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeSceneId === scene.id 
                  ? 'bg-slate-800 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {scene.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 min-w-max">
           {/* Run Button */}
           <button
            onClick={handleRun}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded shadow-lg shadow-emerald-900/20 transition-all active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            RUN
          </button>

          {language === Language.JavaScript && (
            <button
              onClick={isDebugMode ? undefined : handleDebug}
              disabled={isDebugMode}
              className={`flex items-center gap-2 px-4 py-2 border border-slate-700 rounded text-xs font-bold transition-all ${
                isDebugMode 
                  ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {isDebugMode ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                  </span>
                  DEBUGGING...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  DEBUG
                </>
              )}
            </button>
          )}

          {isDebugMode && (
            <button
              onClick={handleNextStep}
              disabled={!isWaitingForStep}
              className={`px-4 py-2 rounded text-xs font-bold transition-all ${
                isWaitingForStep
                  ? 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              NEXT STEP →
            </button>
          )}

          <div className="h-6 w-px bg-slate-800 mx-1" />

          <button
            onClick={handleOptimize}
            className="p-2 text-slate-400 hover:text-purple-400 hover:bg-purple-900/20 rounded transition-colors"
            title="AI Optimize"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </button>
          <button
            onClick={handleAnalysis}
            className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-900/20 rounded transition-colors"
            title="AI Analysis"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </button>
        </div>
      </header>

      {/* -- MAIN VERTICAL SPLIT -- */}
      <div className="flex-1 flex flex-col min-h-0">
        
        {/* TOP: Code Editor */}
        <div className="h-[55%] min-h-[200px] border-b border-slate-800 relative">
          <CodeEditor 
            code={code} 
            language={language} 
            onChange={setCode}
            highlightedLine={currentLine}
          />
          {/* Debug overlay indicator */}
          {isDebugMode && isWaitingForStep && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-yellow-500/90 text-black px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-bounce z-30 pointer-events-none">
              Paused on Line {currentLine}
            </div>
          )}
        </div>

        {/* BOTTOM: Output Panel */}
        <div className="flex-1 flex flex-col min-h-0 bg-slate-950">
          {/* Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-900/50">
            <button
              onClick={() => setActiveTab('console')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                activeTab === 'console' 
                  ? 'border-blue-500 text-blue-400 bg-slate-800/50' 
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              Console
            </button>
            <button
              onClick={() => setActiveTab('visualizer')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                activeTab === 'visualizer' 
                  ? 'border-blue-500 text-blue-400 bg-slate-800/50' 
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              Visualizer
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                activeTab === 'analysis' 
                  ? 'border-blue-500 text-blue-400 bg-slate-800/50' 
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              AI Analysis
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-hidden relative">
            {activeTab === 'console' && (
              <Console logs={logs} onClear={() => setLogs([])} />
            )}
            
            {activeTab === 'visualizer' && (
              <Visualizer 
                mode={vizMode} 
                data={vizData} 
                htmlContent={language === Language.HTML ? code : undefined}
              />
            )}
            
            {activeTab === 'analysis' && (
              <div className="h-full overflow-y-auto p-6 bg-slate-900">
                {isAnalyzing ? (
                   <div className="flex items-center gap-3 text-slate-400 animate-pulse">
                     <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                     Analyzing code structure...
                   </div>
                ) : analysis ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{analysis}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-slate-500 text-center mt-10">
                    <p>Click the magic wand icon in the header to generate an AI analysis.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}