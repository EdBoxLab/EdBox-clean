import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App challenge={{
      id: 'demo-challenge',
      skillId: 'language-basics',
      title: 'Language Learning',
      description: 'Learn language fundamentals',
      engine: 'lingualab',
      difficulty: 'Easy',
      estimatedMinutes: 30,
      xpReward: 100,
      validationCriteria: [],
      hints: ['Start with basic vocabulary'],
      explanation: 'This is a demo challenge'
    }} />
  </React.StrictMode>
);