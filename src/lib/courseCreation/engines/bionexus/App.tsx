import React, { useState, useEffect } from 'react';
import { BioModule, TierType } from './types';
import { TIERS, MODULES } from './constants';
import ModuleCard from './components/ModuleCard';
import AIAssistant from './components/AIAssistant';
import DataVisualizer from './components/DataVisualizer';
import { ArrowLeft, GraduationCap, Stethoscope, Microscope, BookOpen, Info, Bot, MessageSquare, Menu } from 'lucide-react';
import { Challenge } from '../../types';

const App: React.FC<{ challenge?: Challenge | null }> = ({ challenge }) => {
  const [activeTier, setActiveTier] = useState<TierType>(TierType.STUDENT);
  const [activeModule, setActiveModule] = useState<BioModule | null>(null);
  const [isAIOpen, setIsAIOpen] = useState(false);

  // Mobile responsive menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check for API Key on mount
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      console.warn("No API_KEY found in env.");
    }
  }, []);

  const handleModuleClick = (module: BioModule) => {
    setActiveModule(module);
    setIsAIOpen(false); // Reset AI drawer on new module
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setActiveModule(null);
  };

  const toggleAI = () => {
    setIsAIOpen(!isAIOpen);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-science-100 overflow-x-hidden">

      {/* Main Content */}
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ${activeModule ? 'h-[calc(100vh-64px)]' : ''}`}>

        {!activeModule ? (
          /* Dashboard View */
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-10 text-center py-8">
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                Select Your Laboratory
              </h1>
              <p className="text-slate-400 max-w-2xl mx-auto text-base md:text-lg">
                Interactive biology simulations driven by generative AI. Choose your academic track below.
              </p>
            </div>

            {/* Tier Toggles */}
            <div className="flex justify-center mb-12">
              <div className="bg-white p-1.5 rounded-2xl shadow-md border border-slate-200 inline-flex">
                <button
                  onClick={() => setActiveTier(TierType.STUDENT)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${activeTier === TierType.STUDENT
                    ? 'bg-science-50 text-science-700 shadow-sm ring-1 ring-science-200 scale-105'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  <GraduationCap className="w-5 h-5" />
                  <span>Student</span>
                </button>
                <button
                  onClick={() => setActiveTier(TierType.MEDICAL)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${activeTier === TierType.MEDICAL
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200 scale-105'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  <Stethoscope className="w-5 h-5" />
                  <span>Medical</span>
                </button>
              </div>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
              {TIERS[activeTier].modules.map((moduleId) => {
                const module = MODULES[moduleId];
                if (!module) return null;
                return (
                  <ModuleCard
                    key={module.id}
                    module={module}
                    onClick={handleModuleClick}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          /* Active Module View (Full Screen Lab) */
          <div className="relative flex flex-col h-full overflow-hidden">

            {/* Top Controls */}
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleBack}
                  className="group flex items-center gap-2 text-slate-500 hover:text-science-700 transition-colors"
                >
                  <div className="p-1.5 rounded-full bg-white border border-slate-200 group-hover:border-science-300 shadow-sm">
                    <ArrowLeft className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-sm hidden sm:block text-slate-300 group-hover:text-science-400">Back to Dashboard</span>
                </button>
                <div className="h-6 w-px bg-slate-700 hidden sm:block"></div>
                <h1 className="text-xl font-bold text-white truncate max-w-[200px] sm:max-w-none">{activeModule.name}</h1>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${activeTier === TierType.MEDICAL
                  ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                  : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  }`}>
                  {activeTier === TierType.MEDICAL ? 'Med' : 'Student'}
                </span>
              </div>

              <button
                onClick={toggleAI}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all shadow-sm border ${isAIOpen
                  ? 'bg-science-100 text-science-800 border-science-200 ring-2 ring-science-100'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-science-400 hover:text-science-600'
                  }`}
              >
                <Bot className="w-4 h-4" />
                <span className="hidden sm:block">{isAIOpen ? 'Close AI' : 'AI Tutor'}</span>
              </button>
            </div>

            {/* Main Workspace */}
            <div className="flex-1 flex gap-6 overflow-hidden relative rounded-3xl">

              {/* Center Stage: Simulation & Content */}
              <div className="flex-1 flex flex-col gap-4 overflow-hidden">

                {/* The Simulation (Hero) */}
                <div className="flex-[3] min-h-[40vh] w-full">
                  <DataVisualizer topic={activeModule.name} />
                </div>

                {/* Educational Content (Scrollable below sim) */}
                <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-y-auto lab-scroll">
                  <div className="flex items-center space-x-2 mb-4 sticky top-0 bg-white pb-2 border-b border-slate-100">
                    <BookOpen className="w-5 h-5 text-slate-400" />
                    <h3 className="text-lg font-bold text-slate-800">Module Content</h3>
                  </div>

                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="md:w-1/3 shrink-0">
                      <img
                        src={activeModule.imageUrl}
                        alt="Topic"
                        className="w-full h-32 object-cover rounded-xl border border-slate-200 mb-2"
                      />
                      <p className="text-xs text-slate-400 italic text-center">Fig 1.1 - Reference Visual</p>
                    </div>
                    <div className="prose prose-sm prose-slate max-w-none">
                      <p className="lead text-slate-600">{activeModule.description}</p>
                      <p>
                        This module focuses on <strong>{activeModule.topics.join(', ')}</strong>.
                        Use the visualization tool above to model system dynamics.
                        The AI assistant is available to interpret the stochastic data and answer complex queries regarding
                        {activeTier === TierType.MEDICAL ? ' clinical pathology and physiological mechanisms' : ' fundamental biological principles'}.
                      </p>
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-blue-800 text-xs flex gap-2 mt-4">
                        <Info className="w-4 h-4 shrink-0" />
                        <span>
                          <strong>Assignment:</strong> Run three simulations with varying "Variables" to observe the dose-response relationship.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Assistant Drawer (Slide-over) */}
              <div
                className={`fixed inset-y-0 right-0 w-full sm:w-96 z-50 transform transition-transform duration-300 ease-out shadow-2xl ${isAIOpen ? 'translate-x-0' : 'translate-x-full'
                  } sm:relative sm:transform-none sm:w-80 sm:transition-all sm:duration-500 ${isAIOpen ? 'sm:mr-0' : 'sm:-mr-[21rem] sm:opacity-0' // Negative margin to hide on desktop without unmounting
                  }`}
              >
                <div className="h-full h-screen sm:h-full bg-white flex flex-col">
                  <AIAssistant moduleName={activeModule.name} onClose={() => setIsAIOpen(false)} />
                </div>
              </div>

              {/* Mobile Overlay for AI Drawer */}
              {isAIOpen && (
                <div
                  className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 sm:hidden"
                  onClick={() => setIsAIOpen(false)}
                />
              )}

            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;