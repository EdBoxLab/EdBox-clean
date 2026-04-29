'use client';

import { useEffect, useMemo, useState } from 'react';

interface ExamQuestion {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  difficulty: number;
}

interface ExamQuizWorkspaceProps {
  examSlug: string;
  domainSlug: string;
}

export const ExamQuizWorkspace = ({ examSlug, domainSlug }: ExamQuizWorkspaceProps) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [startedAt] = useState(() => new Date().toISOString());

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(`/api/exams/${examSlug}/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domainSlug, count: 10 }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load questions');
        }

        setQuestions((data.questions ?? []).map((question: any) => ({
          id: question.id,
          question_text: question.question_text,
          options: question.options ?? [],
          correct_answer: question.correct_answer,
          explanation: question.explanation,
          difficulty: question.difficulty ?? 3,
        })));
      } catch (loadError: any) {
        setError(loadError.message || 'Failed to load questions');
      } finally {
        setLoading(false);
      }
    };

    void loadQuestions();
  }, [examSlug, domainSlug]);

  const answeredCount = useMemo(
    () => Object.keys(selectedAnswers).length,
    [selectedAnswers]
  );

  const handleSelect = (questionId: string, answer: string) => {
    if (result) return;
    setSelectedAnswers((current) => ({ ...current, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError('');

      const response = await fetch(`/api/exams/${examSlug}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainSlug,
          startedAt,
          submittedAt: new Date().toISOString(),
          responses: selectedAnswers,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit exam');
      }

      setResult({ score: data.score, passed: data.passed });
    } catch (submitError: any) {
      setError(submitError.message || 'Failed to submit exam');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-6 text-white">
        <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-8 text-center">
          <p className="text-lg font-semibold">Loading exam questions...</p>
          <p className="mt-2 text-sm text-white/65">Your materials are being turned into practice questions.</p>
        </div>
      </section>
    );
  }

  if (error && questions.length === 0) {
    return (
      <section className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-6 text-white">
        <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-8 text-center">
          <p className="text-lg font-semibold">Exam unavailable</p>
          <p className="mt-2 text-sm text-white/65">{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-12 md:py-16 text-white">
      <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] md:p-10">
        <div className="flex flex-col gap-3 border-b border-white/[0.08] pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-white/45">Quiz session</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] md:text-5xl">Answer from your exam materials</h1>
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3 text-sm text-white/70">
            Answered {answeredCount}/{questions.length}
          </div>
        </div>

        {error ? <p className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p> : null}

        <div className="mt-8 space-y-5">
          {questions.map((question, index) => (
            <article key={question.id} className="rounded-3xl border border-white/[0.08] bg-black/20 p-5 md:p-6">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm uppercase tracking-[0.24em] text-white/45">Question {index + 1}</p>
                <p className="text-xs text-white/50">Difficulty {question.difficulty}/5</p>
              </div>
              <h2 className="mt-3 text-xl font-semibold leading-8 text-white">{question.question_text}</h2>

              <div className="mt-5 grid gap-3">
                {question.options.map((option) => {
                  const selected = selectedAnswers[question.id] === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleSelect(question.id, option)}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm transition-all duration-200 active:scale-95 ${selected ? 'border-[#3B82F6] bg-[#3B82F6]/10 text-white' : 'border-white/[0.08] bg-white/[0.03] text-white/75 hover:border-white/15 hover:bg-white/[0.06]'}`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </article>
          ))}
        </div>

        {!result ? (
          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || questions.length === 0}
              className="inline-flex items-center justify-center rounded-full bg-[#3B82F6] px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit answers'}
            </button>
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border border-white/[0.08] bg-black/20 p-6">
            <p className="text-sm uppercase tracking-[0.24em] text-white/45">Result</p>
            <p className="mt-2 text-3xl font-semibold">{result.score}%</p>
            <p className="mt-2 text-white/70">{result.passed ? 'You are on track to pass.' : 'Keep working the weak spots.'}</p>
          </div>
        )}
      </div>
    </section>
  );
};