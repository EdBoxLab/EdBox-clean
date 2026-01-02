'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { PlusCircle } from 'lucide-react';

export default function FlashcardGenPage() {
  const [notes, setNotes] = useState('');
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { isPremium } = useSubscription();

  const handleGenerateFlashcards = async (isMore: boolean = false) => {
    setLoading(true);
    try {
      const res = await fetch('/api/flashcard-gen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes, count: isMore ? 10 : undefined }),
      });
      const data = await res.json();
      if (isMore) {
        setFlashcards([...flashcards, ...data.flashcards]);
      } else {
        setFlashcards(data.flashcards);
      }
    } catch (err) {
      console.error('Error generating flashcards:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Flashcard Generation</h1>
      <Textarea
        placeholder="Enter your notes here, one flashcard per line (e.g., Question:Answer)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="w-full h-48 bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus:border-indigo-500 focus:ring-indigo-500"
      />
      <div className="flex gap-2">
        <Button 
          onClick={() => handleGenerateFlashcards()} 
          disabled={loading} 
          className="flex-grow bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {loading ? 'Generating...' : 'Generate Flashcards'}
        </Button>
        {isPremium && flashcards.length > 0 && (
          <Button 
            onClick={() => handleGenerateFlashcards(true)} 
            disabled={loading} 
            variant="outline"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            <PlusCircle className="w-4 h-4 mr-2" /> More
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {flashcards.map((flashcard) => (
          <Card key={flashcard.id} className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <div className="font-semibold text-white">{flashcard.question}</div>
              <div className="text-zinc-400 mt-2">{flashcard.answer}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
