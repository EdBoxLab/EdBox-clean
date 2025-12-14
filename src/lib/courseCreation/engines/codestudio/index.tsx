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
      skillId: 'javascript-basics',
      title: 'JavaScript Basics',
      description: 'Learn the fundamentals of JavaScript',
      engine: 'codestudio',
      difficulty: 'Easy',
      estimatedMinutes: 30,
      xpReward: 100,
      validationCriteria: [],
      hints: ['Start with console.log()'],
      explanation: 'This is a demo challenge'
    }} />
  </React.StrictMode>
);