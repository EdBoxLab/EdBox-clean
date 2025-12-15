'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  answer: string;
}

interface Quiz {
  questions: QuizQuestion[];
}

export default function QuizForgePage() {
  const [notes, setNotes] = useState('');
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});

  const handleCreateQuiz = async () => {
    if (!notes.trim()) {
      setError('Please enter some notes first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/quiz-forge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });

      if (!res.ok) throw new Error('Failed to generate quiz');

      const data: Quiz = await res.json();
      const questionsWithId = data.questions.map((q, idx) => ({
        ...q,
        id: `q-${idx}`,
      }));

      setQuiz({ questions: questionsWithId });
      setAnswers({});
      setSubmitted(false);
      setExpandedQuestions({});
    } catch {
      setError('An error occurred while creating the quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (questionId: string, option: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmitQuiz = () => setSubmitted(true);

  const toggleQuestion = (id: string) => {
    setExpandedQuestions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const score = quiz?.questions.reduce((acc, q) => {
    if (answers[q.id] === q.answer) return acc + 1;
    return acc;
  }, 0);

  return (
    <div className="space-y-6 max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-center">Quiz Forge</h1>

      {error && <div className="bg-red-100 text-red-800 p-3 rounded">{error}</div>}

      {!quiz && (
        <>
          <Textarea
            placeholder="Enter your notes here, with questions on separate lines..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full h-48 resize-none"
          />

          <Button
            onClick={handleCreateQuiz}
            disabled={loading}
            className="w-full md:w-auto mt-2"
          >
            {loading ? 'Creating...' : 'Create Quiz'}
          </Button>
        </>
      )}

      {quiz && (
        <Card className="mt-6">
          <CardContent className="p-4 space-y-4">
            {quiz.questions.map((q, index) => {
              const isExpanded = expandedQuestions[q.id];
              const selectedAnswer = answers[q.id];

              return (
                <div key={q.id} className="border rounded-lg overflow-hidden">
                  {/* Question header */}
                  <button
                    className="w-full flex justify-between items-center p-4 bg-gray-100 hover:bg-gray-200 text-left"
                    onClick={() => toggleQuestion(q.id)}
                  >
                    <span className="font-semibold">
                      {index + 1}. {q.question}
                    </span>
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>

                  {/* Question options */}
                  {isExpanded && (
                    <div className="p-4 flex flex-col space-y-2 bg-white">
                      {q.options.map((option) => {
                        let bgClass = 'bg-gray-50 hover:bg-gray-100';
                        const isSelected = selectedAnswer === option;
                        const isCorrect = submitted && option === q.answer;

                        if (submitted) {
                          if (isSelected && isCorrect) bgClass = 'bg-green-100';
                          else if (isSelected && !isCorrect) bgClass = 'bg-red-100';
                          else if (isCorrect) bgClass = 'bg-green-50';
                        } else if (isSelected) {
                          bgClass = 'bg-blue-100';
                        }

                        return (
                          <Button
                            key={option}
                            variant="outline"
                            className={`w-full text-left justify-start ${bgClass} transition-colors`}
                            onClick={() => handleSelectAnswer(q.id, option)}
                          >
                            {option}
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Submit & Feedback */}
            {submitted && (
              <div className="text-center font-semibold text-lg mt-2">
                Score: {score}/{quiz.questions.length}
              </div>
            )}

            {!submitted && (
              <Button
                onClick={handleSubmitQuiz}
                disabled={Object.keys(answers).length < quiz.questions.length}
                className="w-full mt-4"
              >
                Submit Quiz
              </Button>
            )}

            <Button
              onClick={() => setQuiz(null)}
              variant="secondary"
              className="w-full mt-2"
            >
              Create New Quiz
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}