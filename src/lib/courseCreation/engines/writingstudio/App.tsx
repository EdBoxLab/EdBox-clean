import React, { useState, useEffect, useRef, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI, Type, Modality, LiveServerMessage } from "@google/genai";
import {
  BookOpen,
  PenTool,
  Briefcase,
  Newspaper,
  Megaphone,
  Edit3,
  Share,
  Mic,
  BarChart2,
  Layers,
  Zap,
  Play,
  Save,
  Settings,
  Menu,
  X,
  Sparkles,
  Wand2,
  Activity,
  Loader2,
  Bot,
  User,
  ShieldAlert,
  ClipboardList,
  UploadCloud,
  FileText,
  Image as ImageIcon
} from "lucide-react";

// --- Configuration ---
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

// XML Spec Mapping
const THEME_BG = "#28282d";
const MODULES = [
  { id: "creative", name: "Creative Writing", icon: PenTool, desc: "Stories, poems, scripts" },
  { id: "academic", name: "Academic", icon: BookOpen, desc: "Essays, research papers" },
  { id: "professional", name: "Professional", icon: Briefcase, desc: "Emails, reports, proposals" },
  { id: "journalism", name: "Journalism", icon: Newspaper, desc: "Articles, editorials" },
  { id: "copywriting", name: "Copywriting", icon: Megaphone, desc: "Ads, marketing copy" },
  { id: "editing", name: "Editing", icon: Edit3, desc: "Grammar, style polish" },
];

const TOOLS = [
  { id: "analysis", name: "AI Analysis", icon: BarChart2 },
  { id: "structure", name: "Structure", icon: Layers },
  { id: "notes", name: "Notes", icon: ClipboardList },
  { id: "voice", name: "Voice Tutor", icon: Mic },
];


// --- Types ---
interface AnalysisResult {
  grammarScore: number;
  styleScore: number;
  readability: string;
  suggestions: string[];
  arc: number[]; // For Story Arc visualization
  sentiment: string;
  humanLikelihood: number; // 0-100 score: 100 = Very Human, 0 = Very AI
  plagiarismScore: number; // 0-100 score: 100 = High Risk, 0 = Low Risk
}

// --- Audio Helpers for Live API ---
function base64ToUint8Array(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createPcmBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: uint8ArrayToBase64(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

// --- Helper Components ---

const Button = ({ children, onClick, className = "", variant = "primary", icon: Icon, disabled, title }: any) => {
  const baseStyle = "flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/50",
    secondary: "bg-zinc-700 hover:bg-zinc-600 text-zinc-100",
    ghost: "hover:bg-zinc-700/50 text-zinc-300 hover:text-white",
    outline: "border border-zinc-600 text-zinc-300 hover:border-zinc-400 hover:text-white",
    danger: "bg-red-900/50 text-red-200 hover:bg-red-900 border border-red-800"
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`} title={title}>
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
};

const Card = ({ children, title, className = "" }: any) => (
  <div className={`bg-[#323238] border border-zinc-700/50 rounded-xl p-4 ${className}`}>
    {title && <h3 className="text-sm font-semibold text-zinc-400 mb-3 uppercase tracking-wider">{title}</h3>}
    {children}
  </div>
);

// --- Main Application ---

const WriteLab = () => {
  // State
  const [activeModule, setActiveModule] = useState("creative");
  const [activeTool, setActiveTool] = useState("analysis");
  const [content, setContent] = useState("The neon lights flickered overhead, casting long, dancing shadows across the damp pavement. It was midnight in Sector 4, and the silence was heavy, broken only by the distant hum of the mag-lev trains.");
  const [notes, setNotes] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // For mobile toggle
  const [speechActive, setSpeechActive] = useState(false);
  
  // Voice Session State
  const [voiceSessionActive, setVoiceSessionActive] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<"idle" | "connecting" | "connected">("idle");

  // Refs
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const aiRef = useRef<GoogleGenAI | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Live API Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const liveSessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourceNodesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Initialize AI
  useEffect(() => {
    if (API_KEY) {
      aiRef.current = new GoogleGenAI({ apiKey: API_KEY });
    }
    
    // Cleanup audio contexts on unmount
    return () => {
      stopVoiceSession();
    };
  }, []);

  // --- AI Functions ---

  const runAnalysis = async () => {
    if (!aiRef.current || !content.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const prompt = `Analyze the following text for a ${activeModule} writing context. 
      Return a JSON object with:
      - grammarScore (0-100 number)
      - styleScore (0-100 number)
      - readability (string description like "8th Grade" or "University")
      - sentiment (string)
      - suggestions (array of 3 strings for improvement)
      - arc (array of 5 numbers 0-100 representing narrative tension/pacing over the text)
      - humanLikelihood (0-100 number, where 100 is very human-written and 0 is very AI-generated)
      - plagiarismScore (0-100 number, estimated likelihood of content being generic, unoriginal or potentially plagiarized)
      
      Text: "${content.slice(0, 2000)}"`; // Limit length for demo

      const response = await aiRef.current.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              grammarScore: { type: Type.NUMBER },
              styleScore: { type: Type.NUMBER },
              readability: { type: Type.STRING },
              sentiment: { type: Type.STRING },
              suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
              arc: { type: Type.ARRAY, items: { type: Type.NUMBER } },
              humanLikelihood: { type: Type.NUMBER, description: "0-100 score where 100 is human, 0 is AI" },
              plagiarismScore: { type: Type.NUMBER, description: "0-100 score where 100 is high plagiarism risk" }
            }
          }
        }
      });

      const result = JSON.parse(response.text);
      setAnalysis(result);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateContinuation = async () => {
     if (!aiRef.current) return;
     const prompt = `Continue the following ${activeModule} piece. Keep the tone consistent. 
     
     Text: "${content.slice(-500)}"`;

     try {
       const response = await aiRef.current.models.generateContent({
         model: "gemini-2.5-flash",
         contents: prompt,
       });
       
       if (response.text) {
         setContent(prev => prev + " " + response.text);
       }
     } catch (e) {
       console.error(e);
     }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !aiRef.current) return;

    setIsUploading(true);
    try {
        // Convert file to base64
        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64Data = (e.target?.result as string).split(',')[1];
            
            // Send to Gemini to extract text
            const response = await aiRef.current!.models.generateContent({
                model: "gemini-2.5-flash",
                contents: {
                    parts: [
                        { inlineData: { data: base64Data, mimeType: file.type } },
                        { text: "Extract all the text from this document efficiently. Do not add any conversational preamble, just give me the text." }
                    ]
                }
            });

            if (response.text) {
                setContent(prev => prev + (prev ? "\n\n" : "") + response.text);
            }
            setIsUploading(false);
        };
        reader.readAsDataURL(file);
    } catch (error) {
        console.error("Upload failed:", error);
        setIsUploading(false);
    }
  };

  const triggerUpload = () => {
      fileInputRef.current?.click();
  };

  const saveDraft = () => {
      // Mock save functionality
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `draft-${new Date().toISOString().slice(0,10)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
  };

  // --- Voice Functions (Standard TTS) ---
  const toggleSpeech = () => {
    if (speechActive) {
      window.speechSynthesis.cancel();
      setSpeechActive(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(content);
      utterance.onend = () => setSpeechActive(false);
      window.speechSynthesis.speak(utterance);
      setSpeechActive(true);
    }
  };

  // --- Live API (Interactive Voice Tutor) ---
  const stopVoiceSession = () => {
     // Stop input
     if (inputAudioContextRef.current) {
       inputAudioContextRef.current.close();
       inputAudioContextRef.current = null;
     }
     // Stop output
     if (audioContextRef.current) {
        sourceNodesRef.current.forEach(node => {
            try { node.stop(); } catch (e) {}
        });
        sourceNodesRef.current.clear();
        audioContextRef.current.close();
        audioContextRef.current = null;
     }
     
     // No explicit "close" method on the session object in some versions, 
     // but letting the context die and removing refs is usually enough for cleanup.
     liveSessionRef.current = null;
     
     setVoiceSessionActive(false);
     setVoiceStatus("idle");
  };

  const startVoiceSession = async () => {
    if (!aiRef.current) return;
    
    setVoiceStatus("connecting");
    try {
      // Setup Audio Contexts
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;
      inputAudioContextRef.current = inputCtx;
      nextStartTimeRef.current = audioCtx.currentTime;

      // Connect to Live API
      const sessionPromise = aiRef.current.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: `You are a friendly and helpful expert writing tutor for the "WriteLab" app.
          The user is currently writing a piece in the "${activeModule}" module.
          
          Here is the current text they have written so far:
          ===
          ${content.slice(0, 3000)}
          ===
          
          Your goal is to be encouraging, concise, and helpful. 
          If they ask for ideas, give creative ones.
          If they ask for critique, be constructive.
          Answer directly to their speech. Do not read the text back unless asked.`,
        },
        callbacks: {
          onopen: async () => {
            setVoiceStatus("connected");
            setVoiceSessionActive(true);
            
            // Setup Microphone Stream
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const source = inputCtx.createMediaStreamSource(stream);
                
                // Use ScriptProcessor for compatibility (Worklets are better but more complex for single file)
                const processor = inputCtx.createScriptProcessor(4096, 1, 1);
                processor.onaudioprocess = (e) => {
                    const inputData = e.inputBuffer.getChannelData(0);
                    const pcmBlob = createPcmBlob(inputData);
                    sessionPromise.then(session => {
                        session.sendRealtimeInput({ media: pcmBlob });
                    });
                };
                
                source.connect(processor);
                processor.connect(inputCtx.destination);
            } catch (err) {
                console.error("Mic error:", err);
                stopVoiceSession();
            }
          },
          onmessage: async (msg: LiveServerMessage) => {
            const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
                const ctx = audioContextRef.current;
                const audioBuffer = await decodeAudioData(
                    base64ToUint8Array(base64Audio),
                    ctx
                );
                
                // Simple scheduling logic
                const now = ctx.currentTime;
                // Ensure we don't schedule in the past, but try to keep it gapless
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, now);
                
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);
                source.start(nextStartTimeRef.current);
                
                nextStartTimeRef.current += audioBuffer.duration;
                
                sourceNodesRef.current.add(source);
                source.onended = () => {
                    sourceNodesRef.current.delete(source);
                };
            }

            if (msg.serverContent?.interrupted) {
                sourceNodesRef.current.forEach(node => {
                    try { node.stop(); } catch(e) {}
                });
                sourceNodesRef.current.clear();
                nextStartTimeRef.current = 0;
            }
          },
          onclose: () => {
            stopVoiceSession();
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            stopVoiceSession();
          }
        }
      });

    } catch (error) {
      console.error("Failed to start voice session:", error);
      setVoiceStatus("idle");
    }
  };

  // --- Render Components ---

  const SidebarItem = ({ item, collapsed }: any) => (
    <button
      onClick={() => {
        setActiveModule(item.id);
        setSidebarOpen(false);
      }}
      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
        activeModule === item.id 
          ? "bg-indigo-600/20 text-indigo-300 border border-indigo-600/30" 
          : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
      }`}
    >
      <item.icon size={20} />
      <span className={`${collapsed ? "hidden xl:block" : "block"} text-sm font-medium`}>{item.name}</span>
    </button>
  );

  const ArcVisualizer = ({ data }: { data: number[] }) => {
    if (!data || data.length < 2) return <div className="text-zinc-500 text-xs italic">No data available</div>;
    
    const max = 100;
    const width = 300;
    const height = 100;
    const points = data.map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - (val / max) * height;
      return `${x},${y}`;
    }).join(" ");

    return (
      <div className="w-full overflow-hidden rounded bg-zinc-900/50 p-2 border border-zinc-800">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24 overflow-visible">
          <path d={`M ${points}`} fill="none" stroke="#818cf8" strokeWidth="3" strokeLinecap="round" />
          {/* Area under curve */}
          <path d={`M 0,${height} L ${points} L ${width},${height} Z`} fill="url(#gradient)" opacity="0.2" />
          <defs>
            <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
        <div className="flex justify-between text-[10px] text-zinc-500 mt-1 uppercase font-mono">
            <span>Intro</span>
            <span>Climax</span>
            <span>Resolution</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#28282d] text-zinc-100">
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#1f1f23] border-b border-zinc-800 flex items-center px-4 justify-between z-50">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">W</div>
            <span className="font-semibold tracking-tight">WriteLab</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-zinc-300">
            {sidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Responsive Sidebar (Left on Desktop, Drawer on Mobile) */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-[#1f1f23] border-r border-zinc-800 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:w-20 xl:w-64 md:flex md:flex-col
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        pt-16 md:pt-0
      `}>
        <div className="hidden md:flex h-16 items-center px-6 border-b border-zinc-800 bg-[#18181b]">
             <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shrink-0">W</div>
             <span className="ml-3 font-bold text-lg hidden xl:block tracking-tight">WriteLab</span>
        </div>

        <div className="p-4 flex flex-col gap-2 overflow-y-auto flex-1">
            <div className="text-xs font-semibold text-zinc-500 mb-2 px-2 hidden xl:block uppercase">Modules</div>
            {MODULES.map(m => <SidebarItem key={m.id} item={m} collapsed={true} />)}
        </div>

        <div className="p-4 border-t border-zinc-800">
            <button className="w-full flex items-center gap-3 p-2 text-zinc-400 hover:text-white transition-colors">
                <Settings size={20} />
                <span className="hidden xl:block text-sm">Settings</span>
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full pt-14 md:pt-0 overflow-hidden relative">
        
        {/* Toolbar */}
        <header className="h-16 bg-[#28282d] border-b border-zinc-700/50 flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-4">
                <h1 className="text-xl font-medium text-white">{MODULES.find(m => m.id === activeModule)?.name}</h1>
                <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded-full border border-zinc-700">Draft</span>
            </div>
            
            <div className="flex items-center gap-2">
                <input 
                    type="file" 
                    accept="application/pdf,image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                />
                <Button 
                    variant="ghost" 
                    onClick={triggerUpload} 
                    icon={isUploading ? Loader2 : UploadCloud}
                    disabled={isUploading}
                    className={isUploading ? "animate-pulse" : ""}
                    title="Upload PDF or Image to extract text"
                >
                    {isUploading ? "Reading..." : "Import"}
                </Button>
                <div className="w-px h-6 bg-zinc-700 mx-1"></div>
                <Button variant="ghost" onClick={saveDraft} icon={Save}>
                  Save
                </Button>
                <Button variant="ghost" onClick={toggleSpeech} icon={speechActive ? Zap : Play}>
                    {speechActive ? "Stop" : "Read"}
                </Button>
                <Button variant="secondary" onClick={generateContinuation} icon={Wand2} className="hidden sm:flex">
                    Auto-Complete
                </Button>
                <Button variant="primary" onClick={runAnalysis} icon={Sparkles}>
                    Analyze
                </Button>
            </div>
        </header>

        {/* Editor & Tools Split */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            
            {/* Editor Area */}
            <div className="flex-1 relative flex flex-col bg-[#28282d]">
                <textarea
                    ref={editorRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="flex-1 w-full h-full p-8 resize-none bg-transparent focus:outline-none text-lg leading-relaxed text-zinc-200 font-serif placeholder-zinc-600"
                    placeholder="Start writing your masterpiece..."
                    spellCheck="false"
                />
                <div className="h-8 bg-[#1f1f23] border-t border-zinc-800 flex items-center px-4 text-xs text-zinc-500 gap-4">
                    <span>{content.split(/\s+/).filter(w => w.length > 0).length} words</span>
                    <span>{Math.round(content.length / 5 / 200)} min read</span>
                    <span className="ml-auto">{activeModule} Mode</span>
                </div>
            </div>

            {/* Right Panel - Tools */}
            <div className="w-full lg:w-80 xl:w-96 bg-[#1f1f23] border-l border-zinc-800 flex flex-col h-1/2 lg:h-full lg:border-t-0 border-t">
                {/* Tool Tabs */}
                <div className="flex border-b border-zinc-800">
                    {TOOLS.map(tool => (
                        <button
                            key={tool.id}
                            onClick={() => setActiveTool(tool.id)}
                            className={`flex-1 p-3 flex justify-center items-center gap-2 text-sm font-medium transition-colors border-b-2 ${
                                activeTool === tool.id 
                                ? "border-indigo-500 text-indigo-400 bg-zinc-800/50" 
                                : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30"
                            }`}
                        >
                            <tool.icon size={16} />
                            <span className="hidden sm:inline lg:hidden xl:inline">{tool.name}</span>
                        </button>
                    ))}
                </div>

                {/* Tool Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    
                    {activeTool === "analysis" && (
                        <>
                             {!analysis && !isAnalyzing && (
                                <div className="text-center py-10 text-zinc-500">
                                    <Sparkles className="mx-auto mb-2 opacity-50" size={32} />
                                    <p>Click "Analyze" to generate insights.</p>
                                </div>
                            )}

                            {isAnalyzing && (
                                <div className="space-y-4 animate-pulse">
                                    <div className="h-24 bg-zinc-800 rounded-xl"></div>
                                    <div className="h-40 bg-zinc-800 rounded-xl"></div>
                                    <div className="h-24 bg-zinc-800 rounded-xl"></div>
                                </div>
                            )}

                            {analysis && !isAnalyzing && (
                                <>
                                    {/* Scores */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <Card className="text-center p-2">
                                            <div className="text-2xl font-bold text-white mb-1">{analysis.grammarScore}</div>
                                            <div className="text-[10px] text-zinc-500 uppercase">Grammar</div>
                                        </Card>
                                        <Card className="text-center p-2">
                                            <div className="text-2xl font-bold text-white mb-1">{analysis.styleScore}</div>
                                            <div className="text-[10px] text-zinc-500 uppercase">Style</div>
                                        </Card>
                                        <Card className="text-center p-2 relative overflow-hidden">
                                            <div className={`text-2xl font-bold mb-1 ${analysis.plagiarismScore < 20 ? "text-green-400" : analysis.plagiarismScore < 50 ? "text-yellow-400" : "text-red-400"}`}>
                                                {analysis.plagiarismScore}%
                                            </div>
                                            <div className="text-[10px] text-zinc-500 uppercase">Plagiarism Risk</div>
                                        </Card>
                                    </div>
                                    
                                    {/* Human vs AI Score */}
                                    <Card title="Authorship Profile">
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-xs font-medium text-zinc-400">
                                                <span className="flex items-center gap-1"><Bot size={12}/> AI-Like</span>
                                                <span className="flex items-center gap-1"><User size={12}/> Human-Like</span>
                                            </div>
                                            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden flex">
                                                <div 
                                                    className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                                    style={{ width: `${analysis.humanLikelihood}%`, marginLeft: 'auto' }} 
                                                />
                                            </div>
                                            <div className="text-right text-xs text-indigo-300">
                                                {analysis.humanLikelihood > 80 ? "Very Natural" : analysis.humanLikelihood > 50 ? "Balanced" : "Robotic"} ({analysis.humanLikelihood}%)
                                            </div>
                                        </div>
                                    </Card>

                                    {/* Readability & Sentiment */}
                                    <Card title="Metrics">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-zinc-400">Readability</span>
                                            <span className="text-sm font-medium text-indigo-400">{analysis.readability}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-zinc-400">Sentiment</span>
                                            <span className="text-sm font-medium text-green-400">{analysis.sentiment}</span>
                                        </div>
                                    </Card>

                                    {/* Story Arc */}
                                    {activeModule === "creative" && analysis.arc && (
                                        <Card title="Narrative Arc">
                                            <ArcVisualizer data={analysis.arc} />
                                        </Card>
                                    )}

                                    {/* Suggestions */}
                                    <Card title="Suggestions">
                                        <ul className="space-y-3">
                                            {analysis.suggestions.map((s, i) => (
                                                <li key={i} className="flex gap-3 text-sm text-zinc-300 bg-zinc-900/50 p-2 rounded border border-zinc-800">
                                                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                                                    {s}
                                                </li>
                                            ))}
                                        </ul>
                                    </Card>
                                </>
                            )}
                        </>
                    )}

                    {activeTool === "structure" && (
                        <div className="space-y-4">
                            <Card title="Outline">
                                <div className="space-y-2">
                                    {[1, 2, 3].map(ch => (
                                        <div key={ch} className="flex items-center gap-3 p-2 hover:bg-zinc-800 rounded cursor-pointer group">
                                            <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-mono text-zinc-500 group-hover:border-indigo-500 group-hover:text-indigo-400 transition-colors">
                                                {ch}
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm text-zinc-300">Chapter {ch}</div>
                                                <div className="text-xs text-zinc-600">Scene setup...</div>
                                            </div>
                                        </div>
                                    ))}
                                    <Button variant="outline" className="w-full mt-2 text-xs py-1 h-8">
                                        + Add Chapter
                                    </Button>
                                </div>
                            </Card>
                            <div className="p-4 rounded-lg bg-yellow-900/20 border border-yellow-700/30 text-yellow-200/80 text-sm">
                                Note: Outline structure is automatically inferred from headers in your text.
                            </div>
                        </div>
                    )}

                    {activeTool === "notes" && (
                        <div className="h-full flex flex-col">
                             <div className="text-xs text-zinc-500 mb-3 px-1">Scratchpad for ideas, links, and research.</div>
                             <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="flex-1 w-full bg-[#18181b] border border-zinc-700 rounded-xl p-4 resize-none text-sm text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors"
                                placeholder="Write your notes here..."
                             />
                        </div>
                    )}

                    {activeTool === "voice" && (
                        <div className="space-y-4">
                            <Card title="Narrator Settings">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs text-zinc-500 mb-1 block">Voice</label>
                                        <select className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500">
                                            <option>Gemini Zephyr</option>
                                            <option>Gemini Puck</option>
                                            <option>Gemini Kore</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-zinc-500 mb-1 block">Speed</label>
                                        <input type="range" className="w-full accent-indigo-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer" />
                                    </div>
                                </div>
                            </Card>
                            <div className={`border rounded-lg p-4 text-center transition-colors ${voiceSessionActive ? 'bg-indigo-900/40 border-indigo-500' : 'bg-indigo-900/20 border-indigo-500/30'}`}>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg transition-all ${voiceSessionActive ? 'bg-white animate-pulse' : 'bg-indigo-600 shadow-indigo-900/50'}`}>
                                    {voiceStatus === "connecting" ? (
                                        <Loader2 className="text-indigo-600 animate-spin" size={24} />
                                    ) : voiceSessionActive ? (
                                        <Activity className="text-indigo-600" size={24} />
                                    ) : (
                                        <Mic className="text-white" size={24} />
                                    )}
                                </div>
                                <h3 className="text-indigo-300 font-medium mb-1">
                                    {voiceSessionActive ? "Tutor Active" : "Interactive Tutor"}
                                </h3>
                                <p className="text-xs text-zinc-400 mb-3">
                                    {voiceSessionActive 
                                        ? "Listening... Speak naturally to discuss your writing." 
                                        : "Ask for help with phrasing, tone, or writer's block."}
                                </p>
                                
                                {voiceSessionActive ? (
                                    <Button variant="danger" className="w-full text-sm" onClick={stopVoiceSession}>
                                        End Session
                                    </Button>
                                ) : (
                                    <Button 
                                        variant="primary" 
                                        className="w-full text-sm" 
                                        onClick={startVoiceSession}
                                        disabled={voiceStatus === "connecting"}
                                    >
                                        {voiceStatus === "connecting" ? "Connecting..." : "Start Session"}
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
      </main>
    </div>
  );
};
const root = createRoot(document.getElementById("root")!);
root.render(<WriteLab />);
export default root ;