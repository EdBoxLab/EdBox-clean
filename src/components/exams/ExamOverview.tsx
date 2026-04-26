import Link from 'next/link';
import { ExamConfig, formatExamPrice } from '@/lib/exams/catalog';

interface ExamOverviewProps {
  exam: ExamConfig;
}

export const ExamOverview = ({ exam }: ExamOverviewProps) => {
  const price = formatExamPrice(exam.priceCents);

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-12 md:py-16">
      <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] md:p-10">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#8B5CF6]/25 bg-[#8B5CF6]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#C4B5FD]">
              {exam.slug}
            </div>

            <div className="space-y-4">
              <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.05em] text-white md:text-6xl">
                {exam.name}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-white/72 md:text-lg">
                {exam.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-white/70">
              {exam.jurisdiction.map((item) => (
                <span key={item} className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5">
                  {item}
                </span>
              ))}
              <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5">
                Passing score {exam.passingScore}%
              </span>
              <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5">
                {exam.totalQuestions} questions
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Prep window', value: exam.estimatedPrepHours },
                { label: 'Launch price', value: price },
                { label: 'Readiness target', value: `${exam.passingScore}%` },
                { label: 'Live content', value: exam.active ? 'Active' : 'Coming soon' },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/[0.08] bg-black/20 p-4 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.05]">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/45">{item.label}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="w-full max-w-sm rounded-3xl border border-white/[0.08] bg-black/20 p-5">
            <div className="text-white">
              <p className="text-sm font-medium text-white/70">Readiness loop</p>
              <p className="text-xl font-semibold">Always know what to study next</p>
            </div>

            <div className="mt-6 space-y-3">
              {exam.highlights.map((highlight) => (
                <div key={highlight} className="flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
                  <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[#8B5CF6]/35 text-[9px] font-semibold text-[#C4B5FD]">•</span>
                  <p className="text-sm leading-6 text-white/72">{highlight}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#3B82F6] px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95"
              >
                Start free
                <span aria-hidden="true">→</span>
              </Link>
              <Link
                href="/exams"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/[0.06] active:scale-95"
              >
                View all exams
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </aside>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/[0.08] bg-black/20 p-5 md:p-6">
            <h2 className="text-lg font-semibold text-white">What is included</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {exam.included.map((item) => (
                <div key={item} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white/72 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.06]">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/[0.08] bg-black/20 p-5 md:p-6">
            <h2 className="text-lg font-semibold text-white">Domain readiness</h2>
            <div className="mt-4 space-y-4">
              {exam.domains.map((domain) => (
                <div key={domain.slug} className="space-y-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{domain.name}</p>
                      <p className="text-sm text-white/50">{domain.questionCount} questions · {Math.round(domain.weight * 100)}% of exam</p>
                    </div>
                    <p className="text-sm font-semibold text-[#93C5FD]">{domain.readiness}%</p>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.08]">
                    <div
                      className="h-2 rounded-full bg-[#3B82F6] transition-all duration-300 ease-out"
                      style={{ width: `${domain.readiness}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};