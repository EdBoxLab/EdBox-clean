'use client';
import React, { useState, useEffect } from 'react';
import './KoalaGenie.css';

const KoalaGenie = ({ userName = "Inioluwa" }) => {
  const [bubbleText, setBubbleText] = useState(`Hi ${userName}, ready to challenge your thinking?`);
  const [showBubble, setShowBubble] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [darkTheme, setDarkTheme] = useState(true);

  const messages = [
    "Let's think this through together.",
    "What’s the clever angle here?",
    "Challenge accepted, strategist.",
    "Facts first, always.",
    "What would a koala genie do?",
    "Let’s outsmart the obvious."
  ];

  const quiz = {
    question: "Which statement is logically valid?",
    options: [
      "All birds can fly, penguins are birds, so penguins can fly.",
      "If it rains, the ground gets wet. It’s wet, so it must’ve rained.",
      "If A implies B, and B is false, then A must be false.",
      "If A implies B, and B is true, then A must be true."
    ],
    answer: 2
  };

  const handleNudge = () => {
    const message = messages[Math.floor(Math.random() * messages.length)];
    setBubbleText(message);
    setShowBubble(true);
    speak(message);
    setTimeout(() => setShowBubble(false), 4000);
  };

  const handleQuiz = () => {
    setShowQuiz(true);
  };

  const handleAnswer = (index: number) => {
    if (index === quiz.answer) {
      speak("Correct! That's solid logic.");
      alert("✅ Correct! That's solid logic.");
    } else {
      speak("Not quite. Try again or ask the genie!");
      alert("❌ Not quite. Try again or ask the genie!");
    }
  };

  const toggleTheme = () => {
    setDarkTheme(!darkTheme);
  };

  // Voice interaction
  const speak = (text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    document.body.classList.toggle('dark', darkTheme);
  }, [darkTheme]);

  return (
    <div className="genie-wrapper">
      <div className="genie-container">
        <img
          src="https://copilot.microsoft.com/th/id/BCO.4e85ee95-245b-4bf7-8346-3cf82d307c6f.png"
          alt="Koala Genie Mascot"
          className="genie-img genie-glow"
          onClick={handleNudge}
        />
        <div className={`genie-bubble ${showBubble ? 'show' : ''}`}>
          {bubbleText}
        </div>
      </div>

      <div className="genie-buttons">
      </div>

      {showQuiz && (
        <div className="quiz-container">
          <h3>🧠 Logic Challenge</h3>
          <p>{quiz.question}</p>
          <ul>
            {quiz.options.map((opt, i) => (
              <li key={i} onClick={() => handleAnswer(i)}>{opt}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default KoalaGenie;
