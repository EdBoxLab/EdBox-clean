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
      skillId: 'writing-basics',
      title: 'Writing Fundamentals',
      description: 'Learn basic writing skills',
      engine: 'writingstudio',
      difficulty: 'Easy',
      estimatedMinutes: 30,
      xpReward: 100,
      validationCriteria: [],
      hints: ['Start with a clear topic'],
      explanation: 'This is a demo challenge'
    }} />
  </React.StrictMode>
);