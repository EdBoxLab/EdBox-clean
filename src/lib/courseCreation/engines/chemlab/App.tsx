
import React, { useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { StoichiometryModule } from './components/modules/Stoichiometry';
import { TitrationModule } from './components/modules/Titration';
import { MoleculeViewer } from './components/modules/MoleculeViewer';
import { PeriodicTableModule } from './components/modules/PeriodicTable';
import { StatesOfMatterModule } from './components/modules/StatesOfMatter';
import { ChemicalMixerModule } from './components/modules/ChemicalMixer';
import { ChatInterface } from './components/ChatInterface';
import { ModuleType } from './types';

const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ModuleType>(ModuleType.CHEMICAL_MIXER);
  const [currentContext, setCurrentContext] = useState<any>(null);
  const [targetMoleculeId, setTargetMoleculeId] = useState<string | null>(null);

  // Wrap setCurrentContext to also log for debugging if needed
  const handleContextUpdate = useCallback((data: any) => {
    setCurrentContext(data);
  }, []);

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-white overflow-hidden selection:bg-blue-500/30">
      
      {/* Navigation Sidebar */}
      <Sidebar activeModule={activeModule} onModuleChange={setActiveModule} />

      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col h-full overflow-hidden">
        
        {/* Top bar (mobile mostly, or global status) */}
        <div className="h-16 border-b border-slate-800 flex items-center px-6 bg-slate-900/50 backdrop-blur shrink-0">
            <div className="flex items-center gap-2 text-sm text-slate-400">
                <span>Module</span>
                <span>/</span>
                <span className="text-white font-medium">{activeModule}</span>
            </div>
        </div>

        {/* Module Container */}
        <div className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0">
            {activeModule === ModuleType.STOICHIOMETRY && (
              <StoichiometryModule setContext={handleContextUpdate} />
            )}
            {activeModule === ModuleType.TITRATION && (
              <TitrationModule setContext={handleContextUpdate} />
            )}
            {activeModule === ModuleType.MOLECULAR_VIEWER && (
              <MoleculeViewer 
                setContext={handleContextUpdate} 
                targetMoleculeId={targetMoleculeId}
              />
            )}
            {activeModule === ModuleType.PERIODIC_TABLE && (
              <PeriodicTableModule setContext={handleContextUpdate} />
            )}
            {activeModule === ModuleType.STATES_OF_MATTER && (
              <StatesOfMatterModule setContext={handleContextUpdate} />
            )}
            {activeModule === ModuleType.CHEMICAL_MIXER && (
              <ChemicalMixerModule 
                setContext={handleContextUpdate} 
                onNavigate={setActiveModule}
                onInspectMolecule={setTargetMoleculeId}
              />
            )}
          </div>
        </div>
      </main>

      {/* AI Assistant Overlay */}
      <ChatInterface contextData={currentContext} />
      
    </div>
  );
};

export default App;
