'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';

export default function QuizForgePage() {
  const [notes, setNotes] = useState('');
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCreateQuiz = async () => {
    setLoading(true);
    const res = await fetch('/api/quiz-forge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
    const data = await res.json();
    setQuiz(data);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Quiz Forge</h1>
      <Textarea
        placeholder="Enter your notes here, with questions on separate lines..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="w-full h-48"
      />
      <Button onClick={handleCreateQuiz} disabled={loading}>
        {loading ? 'Creating...' : 'Create Quiz'}
      </Button>

      {quiz && (
        <Card>
          <CardContent className="p-4">
            {quiz.questions.map((q) => (
              <div key={q.id} className="mb-4">
                <p className="font-semibold">{q.question}</p>
                <div className="space-y-2 mt-2">
                  {q.options.map((option) => (
                    <Button key={option} variant="outline" className="w-full text-left justify-start">{option}</Button>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
