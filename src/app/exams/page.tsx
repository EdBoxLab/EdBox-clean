import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { examCatalog, formatExamPrice } from '@/lib/exams/catalog';

export default function ExamsDirectoryPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-6xl px-6 py-12 md:py-16">
        <div className="mb-10 max-w-3xl space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-white/45">EdBox Exam Engine</p>
          <h1 className="text-4xl font-semibold tracking-[-0.05em] text-white md:text-6xl">
            Choose the exam kit you are building toward.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-white/70 md:text-lg">
            Each kit is a dedicated, exam-specific learning loop with adaptive quizzes, AI explanations, and readiness tracking.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {examCatalog.map((exam) => (
            <Link
              key={exam.slug}
              href={`/exams/${exam.slug}`}
              className="group rounded-3xl border border-white/[0.08] bg-white/[0.03] p-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.06]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-white/45">{exam.jurisdiction.join(' / ')}</p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
                    {exam.name}
                  </h2>
                </div>
                <span className="rounded-full border border-[#8B5CF6]/20 bg-[#8B5CF6]/10 px-3 py-1 text-xs font-semibold text-[#C4B5FD]">
                  Active
                </span>
              </div>

              <p className="mt-4 text-sm leading-6 text-white/68">{exam.description}</p>

              <div className="mt-6 flex items-center justify-between border-t border-white/[0.08] pt-5 text-sm text-white/68">
                <span>{exam.totalQuestions} questions</span>
                <span>{formatExamPrice(exam.priceCents)}</span>
              </div>

              <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white transition-transform duration-200 group-hover:translate-x-0.5">
                Open exam kit
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}