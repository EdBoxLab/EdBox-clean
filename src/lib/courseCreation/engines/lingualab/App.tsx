import React, { useState, useCallback } from 'react';
import { 
  Activity, 
  Mic, 
  Share2, 
  Languages, 
  Play, 
  Square, 
  Settings,
  Terminal,
  Network,
  GitBranch,
  Type,
  MessageCircle,
  Menu
} from 'lucide-react';
import { ModuleType, SyntaxNode, PhoneticsAnalysis, SemanticGraph, TranslationResult } from './types';
import { analyzeSyntax, analyzePhonetics, analyzeSemantics, translateText } from './services/geminiService';
import { SyntaxTree } from './components/SyntaxTree';
import { SemanticNetwork } from './components/SemanticNetwork';
import { ConversationPractice } from './components/ConversationPractice';

const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ModuleType>(ModuleType.CONVERSATION);
  const [inputText, setInputText] = useState("The quick brown fox jumps over the lazy dog.");
  const [loading, setLoading] = useState(false);
  
  // State for results
  const [syntaxData, setSyntaxData] = useState<SyntaxNode | null>(null);
  const [phoneticsData, setPhoneticsData] = useState<PhoneticsAnalysis | null>(null);
  const [semanticsData, setSemanticsData] = useState<SemanticGraph | null>(null);
  const [translationData, setTranslationData] = useState<TranslationResult | null>(null);

  const handleRunAnalysis = useCallback(async () => {
    if (!inputText.trim()) return;
    setLoading(true);

    try {
      switch (activeModule) {
        case ModuleType.SYNTAX:
          const sData = await analyzeSyntax(inputText);
          setSyntaxData(sData);
          break;
        case ModuleType.PHONETICS:
          const pData = await analyzePhonetics(inputText);
          setPhoneticsData(pData);
          break;
        case ModuleType.SEMANTICS:
          const semData = await analyzeSemantics(inputText);
          setSemanticsData(semData);
          break;
        case ModuleType.TRANSLATION:
          const tData = await translateText(inputText, "Spanish"); // Defaulting to Spanish for demo
          setTranslationData(tData);
          break;
        // Conversation doesn't use this manual run handler
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [inputText, activeModule]);

  const renderModuleContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 animate-pulse">
          <Activity className="w-12 h-12 mb-4 animate-spin" />
          <p className="font-mono text-sm">ANALYZING INPUT STREAM...</p>
        </div>
      );
    }

    switch (activeModule) {
      case ModuleType.PHONETICS:
        return (
          <div className="h-full flex flex-col gap-4">
             <div className="bg-[#25252b] p-4 md:p-6 rounded-lg border border-gray-700 shadow-lg flex-shrink-0">
                <h3 className="text-gray-400 font-mono text-xs mb-2 uppercase">IPA Transcription</h3>
                <div className="text-3xl md:text-4xl font-serif text-emerald-400 tracking-wider mb-4 break-words">
                  {phoneticsData ? `/${phoneticsData.ipa}/` : <span className="text-gray-600 text-xl italic">Run analysis to see IPA</span>}
                </div>
                {phoneticsData && (
                  <div className="text-sm text-gray-400 font-mono">
                     Stress Pattern: <span className="text-gray-200">{phoneticsData.stressPattern}</span>
                  </div>
                )}
             </div>

             <div className="flex-1 bg-[#25252b] rounded-lg border border-gray-700 p-4 overflow-y-auto">
                <h3 className="text-gray-400 font-mono text-xs mb-4 uppercase">Segment Analysis</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {phoneticsData?.segments.map((seg, idx) => (
                    <div key={idx} className="bg-[#1e1e23] p-3 rounded border border-gray-800 hover:border-emerald-500/50 transition-colors group">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-2xl font-serif text-emerald-300">{seg.symbol}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase ${seg.type === 'vowel' ? 'bg-blue-900/30 text-blue-400' : 'bg-orange-900/30 text-orange-400'}`}>
                          {seg.type}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 group-hover:text-gray-300">{seg.description}</p>
                      <div className="mt-2 h-1 w-full bg-gray-800 rounded overflow-hidden">
                        <div className="h-full bg-emerald-500/40" style={{ width: `${Math.min(100, (seg.duration || 50) / 2)}%` }}></div>
                      </div>
                    </div>
                  ))}
                  {!phoneticsData && <p className="text-gray-600 text-sm col-span-full text-center py-10">No segments to display.</p>}
                </div>
             </div>
          </div>
        );

      case ModuleType.SYNTAX:
        return <SyntaxTree data={syntaxData} />;

      case ModuleType.SEMANTICS:
        return <SemanticNetwork data={semanticsData} />;
      
      case ModuleType.CONVERSATION:
        return <ConversationPractice />;

      case ModuleType.TRANSLATION:
        return (
          <div className="h-full flex flex-col gap-6 overflow-y-auto">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-shrink-0">
                <div className="bg-[#25252b] p-6 rounded-lg border border-gray-700">
                    <h3 className="text-gray-400 font-mono text-xs mb-4 uppercase">Source Text</h3>
                    <p className="text-xl text-gray-200 leading-relaxed">{translationData?.original || inputText}</p>
                </div>
                <div className="bg-[#25252b] p-6 rounded-lg border border-gray-700">
                    <h3 className="text-gray-400 font-mono text-xs mb-4 uppercase">Target (Spanish)</h3>
                    <p className="text-xl text-blue-300 leading-relaxed">{translationData?.translated || "..."}</p>
                </div>
             </div>
             
             <div className="flex-1 bg-[#25252b] p-6 rounded-lg border border-gray-700 overflow-x-auto min-h-[200px]">
                <h3 className="text-gray-400 font-mono text-xs mb-4 uppercase">Alignment Confidence</h3>
                <div className="flex gap-4 min-w-max pb-2">
                   {translationData?.alignment.map((align, idx) => (
                     <div key={idx} className="flex flex-col items-center gap-2 group">
                        <div className="px-3 py-1 bg-gray-800 rounded text-sm text-gray-300">{align.originalWord}</div>
                        <div className="w-px h-8 bg-gradient-to-b from-gray-700 to-blue-500/50"></div>
                        <div className="px-3 py-1 bg-blue-900/20 border border-blue-900/50 rounded text-sm text-blue-300">{align.translatedWord}</div>
                        <div className="text-[10px] text-gray-600 mt-1 font-mono opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          {(align.confidence * 100).toFixed(0)}% match
                        </div>
                     </div>
                   ))}
                   {!translationData && <p className="text-gray-600 text-sm italic">Run translation to see word alignment.</p>}
                </div>
             </div>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full text-gray-100 selection:bg-emerald-500/30 overflow-hidden bg-[#1e1e23]">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-20 flex-shrink-0 bg-[#18181c] border-r border-gray-800 flex-col items-center py-6 gap-8 z-20">
        <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
          <Type className="text-[#18181c] font-bold" size={24} />
        </div>

        <nav className="flex flex-col gap-4 w-full px-2">
          <NavButton 
            active={activeModule === ModuleType.CONVERSATION} 
            onClick={() => setActiveModule(ModuleType.CONVERSATION)}
            icon={<MessageCircle size={20} />}
            label="Conversation"
          />
           <NavButton 
            active={activeModule === ModuleType.PHONETICS} 
            onClick={() => setActiveModule(ModuleType.PHONETICS)}
            icon={<Mic size={20} />}
            label="Phonetics"
          />
          <NavButton 
            active={activeModule === ModuleType.SYNTAX} 
            onClick={() => setActiveModule(ModuleType.SYNTAX)}
            icon={<GitBranch size={20} />}
            label="Syntax"
          />
          <NavButton 
            active={activeModule === ModuleType.SEMANTICS} 
            onClick={() => setActiveModule(ModuleType.SEMANTICS)}
            icon={<Network size={20} />}
            label="Semantics"
          />
          <NavButton 
            active={activeModule === ModuleType.TRANSLATION} 
            onClick={() => setActiveModule(ModuleType.TRANSLATION)}
            icon={<Languages size={20} />}
            label="Translate"
          />
        </nav>

        <div className="mt-auto flex flex-col gap-4">
           <button className="p-3 text-gray-500 hover:text-gray-300 transition-colors">
             <Settings size={20} />
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header */}
        <header className="h-14 md:h-16 border-b border-gray-800 bg-[#1e1e23] flex items-center px-4 md:px-6 justify-between shrink-0">
          <div className="flex items-center gap-2">
             <div className="md:hidden w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <Type className="text-[#18181c] font-bold" size={18} />
             </div>
             <h1 className="text-lg font-bold tracking-tight text-gray-100">LinguaLab</h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-3 py-1 bg-gray-900 rounded border border-gray-800">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
               <span className="text-[10px] md:text-xs text-gray-400 font-mono hidden sm:inline">SYSTEM ONLINE</span>
             </div>
          </div>
        </header>

        {/* Workspace */}
        <div className="flex-1 flex flex-col p-4 md:p-6 gap-4 md:gap-6 overflow-hidden relative">
          
          {/* Input Section - Only show for non-conversation modules */}
          {activeModule !== ModuleType.CONVERSATION && (
            <section className="flex-shrink-0 bg-[#25252b] rounded-xl border border-gray-700 p-1 flex gap-2 shadow-lg">
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none px-3 md:px-4 py-2 md:py-3 text-sm md:text-base text-gray-200 placeholder-gray-600 font-medium"
                placeholder="Enter text for analysis..."
              />
              <button 
                onClick={handleRunAnalysis}
                disabled={loading}
                className={`px-4 md:px-6 rounded-lg font-semibold flex items-center gap-2 transition-all text-sm md:text-base
                  ${loading 
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                  }`}
              >
                {loading ? <Activity className="animate-spin" size={18} /> : <Play size={18} fill="currentColor" />}
                <span className="hidden sm:inline">RUN</span>
              </button>
            </section>
          )}

          {/* Visualization Canvas */}
          <section className="flex-1 min-h-0 relative">
             {renderModuleContent()}
          </section>

        </div>

        {/* Desktop Footer */}
        <footer className="hidden md:flex h-8 border-t border-gray-800 bg-[#18181c] items-center px-4 text-xs font-mono text-gray-500 justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 hover:text-gray-300 cursor-pointer">
              <Terminal size={12} />
              <span>CONSOLE</span>
            </div>
            <div className="w-px h-3 bg-gray-700"></div>
            <span>MODULE: {activeModule}</span>
          </div>
          <div>
            PLATFORM: WEBGL2
          </div>
        </footer>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden h-16 bg-[#18181c] border-t border-gray-800 flex justify-around items-center shrink-0 px-2 z-30">
            <MobileNavButton 
               active={activeModule === ModuleType.CONVERSATION} 
               onClick={() => setActiveModule(ModuleType.CONVERSATION)}
               icon={<MessageCircle size={20} />}
               label="Chat"
            />
             <MobileNavButton 
               active={activeModule === ModuleType.PHONETICS} 
               onClick={() => setActiveModule(ModuleType.PHONETICS)}
               icon={<Mic size={20} />}
               label="Phonetics"
            />
            <MobileNavButton 
               active={activeModule === ModuleType.SYNTAX} 
               onClick={() => setActiveModule(ModuleType.SYNTAX)}
               icon={<GitBranch size={20} />}
               label="Syntax"
            />
            <MobileNavButton 
               active={activeModule === ModuleType.SEMANTICS} 
               onClick={() => setActiveModule(ModuleType.SEMANTICS)}
               icon={<Network size={20} />}
               label="Graph"
            />
            <MobileNavButton 
               active={activeModule === ModuleType.TRANSLATION} 
               onClick={() => setActiveModule(ModuleType.TRANSLATION)}
               icon={<Languages size={20} />}
               label="Translate"
            />
        </nav>
      </main>
    </div>
  );
};

// Helper component for desktop nav items
const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`relative group p-3 rounded-xl transition-all duration-200 flex items-center justify-center w-12 h-12
      ${active ? 'bg-emerald-500/10 text-emerald-400' : 'text-gray-500 hover:bg-gray-800 hover:text-gray-300'}`}
    title={label}
  >
    {icon}
    {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-500 rounded-r-full -ml-2"></div>}
  </button>
);

// Helper component for mobile nav items
const MobileNavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-all w-16
      ${active ? 'text-emerald-400' : 'text-gray-500'}`}
  >
    <div className={`${active ? 'bg-emerald-500/10' : ''} p-1 rounded-full`}>
      {icon}
    </div>
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

export default App;