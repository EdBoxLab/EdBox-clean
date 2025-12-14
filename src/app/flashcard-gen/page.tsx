'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';

export default function FlashcardGenPage() {
  const [notes, setNotes] = useState('');
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGenerateFlashcards = async () => {
    setLoading(true);
    const res = await fetch('/api/flashcard-gen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
    const data = await res.json();
    setFlashcards(data.flashcards);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Flashcard Generation</h1>
      <Textarea
        placeholder="Enter your notes here, one flashcard per line (e.g., Question:Answer)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="w-full h-48"
      />
      <Button onClick={handleGenerateFlashcards} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Flashcards'}
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {flashcards.map((flashcard) => (
          <Card key={flashcard.id}>
            <CardContent className="p-4">
              <div className="font-semibold">{flashcard.question}</div>
              <div>{flashcard.answer}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
