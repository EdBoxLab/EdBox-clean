'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';

interface QuizOption {
  question: string;
  options: string[];
  answer: string;
  id: string;
}

export default function QuizForgePage() {
  const [notes, setNotes] = useState('');
  const [quiz, setQuiz] = useState<QuizOption[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleCreateQuiz = async () => {
    setLoading(true);
    setQuiz(null);
    setSubmitted(false);
    setSelectedAnswers({});
    try {
      const res = await fetch('/api/quiz-forge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      const data = await res.json();
      const formattedQuiz = data.questions.map((q: any, index: number) => ({
        ...q,
        id: `q-${index}`,
      }));
      setQuiz(formattedQuiz);
    } catch (err) {
      console.error('Error creating quiz:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (questionId: string, option: string) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto p-4 min-h-screen bg-black text-white">
      <h1 className="text-2xl font-semibold text-center">Quiz Forge</h1>

      <Textarea
        placeholder="Enter your notes here, with questions on separate lines..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="w-full h-48 text-white bg-black border border-gray-700 rounded-md focus:border-white focus:ring focus:ring-white/20 resize-none"
      />

      <Button
        onClick={handleCreateQuiz}
        disabled={loading || !notes.trim()}
        className="w-full border border-white text-white hover:bg-white hover:text-black transition-colors"
      >
        {loading ? 'Creating Quiz...' : 'Create Quiz'}
      </Button>

      {quiz && (
        <Card className="bg-black border border-gray-700 rounded-md shadow-md">
          <CardContent className="p-4 space-y-6">
            {quiz.map((q) => (
              <div key={q.id} className="space-y-2">
                <p className="font-semibold">{q.question}</p>
                <div className="flex flex-col gap-2">
                  {q.options.map((option) => {
                    let bgClass = 'bg-black hover:bg-gray-900';
                    let textColor = 'text-white';

                    if (submitted) {
                      if (option === q.answer) bgClass = 'bg-white text-black';
                      if (selectedAnswers[q.id] === option && option !== q.answer) bgClass = 'bg-gray-700 text-white';
                    } else if (selectedAnswers[q.id] === option) {
                      bgClass = 'bg-white text-black';
                    }

                    return (
                      <Button
                        key={option}
                        variant="outline"
                        className={`w-full text-left justify-start ${bgClass} ${textColor} transition-colors`}
                        onClick={() => handleSelectAnswer(q.id, option)}
                      >
                        {option}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}

            {!submitted && (
              <Button
                onClick={handleSubmit}
                className="w-full border border-white text-white hover:bg-white hover:text-black transition-colors mt-4"
              >
                Submit Answers
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}