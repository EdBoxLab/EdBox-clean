import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './modules/Dashboard';
import { Accounting } from './modules/Accounting';
import { CorporateFinance } from './modules/CorporateFinance';
import { Investments } from './modules/Investments';
import { AITutor } from './components/AITutor';
import { ModuleType } from './types';

const App: React.FC = () => {
  const [currentModule, setCurrentModule] = useState<ModuleType>(ModuleType.DASHBOARD);

  const renderModule = () => {
    switch (currentModule) {
      case ModuleType.DASHBOARD:
        return <Dashboard />;
      case ModuleType.ACCOUNTING:
        return <Accounting />;
      case ModuleType.CORP_FINANCE:
        return <CorporateFinance />;
      case ModuleType.INVESTMENTS:
        return <Investments />;
      case ModuleType.AI_TUTOR:
        return <AITutor />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentModule={currentModule} onModuleChange={setCurrentModule}>
      {renderModule()}
    </Layout>
  );
};

export default App;