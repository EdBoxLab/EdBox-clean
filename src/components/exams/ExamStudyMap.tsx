import Link from 'next/link';
import { ExamConfig, getExamReadinessSummary } from '@/lib/exams/catalog';

interface ExamStudyMapProps {
  exam: ExamConfig;
}

export const ExamStudyMap = ({ exam }: ExamStudyMapProps) => {
  const summary = getExamReadinessSummary(exam);

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-12 md:py-16">
      <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] md:p-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-white/45">Topic map</p>
            <h1 className="text-4xl font-semibold tracking-[-0.05em] text-white md:text-6xl">
              Study what matters most.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-white/70 md:text-lg">
              The study map keeps your weakest domain visible and turns readiness into a simple, weekly loop.
            </p>
          </div>

          <div className="grid w-full max-w-sm gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-3xl border border-white/[0.08] bg-black/20 p-5">
              <div className="text-white">
                <p className="text-sm text-white/55">Overall readiness</p>
                <p className="text-2xl font-semibold">{summary.averageReadiness}%</p>
              </div>
            </div>
            <div className="rounded-3xl border border-white/[0.08] bg-black/20 p-5">
              <div className="text-white">
                <p className="text-sm text-white/55">Next focus</p>
                <p className="text-lg font-semibold">{summary.weakestDomain.name}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
          <div className="space-y-4">
            {exam.domains.map((domain) => (
              <div key={domain.slug} className="rounded-3xl border border-white/[0.08] bg-black/20 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{domain.name}</h2>
                    <p className="mt-1 text-sm text-white/55">{domain.questionCount} questions scheduled for review</p>
                  </div>
                  <p className="text-sm font-semibold text-[#93C5FD]">{domain.readiness}%</p>
                </div>
                <div className="mt-4 h-2 rounded-full bg-white/[0.08]">
                  <div
                    className="h-2 rounded-full bg-[#3B82F6] transition-all duration-300 ease-out"
                    style={{ width: `${domain.readiness}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <aside className="rounded-3xl border border-white/[0.08] bg-black/20 p-5 md:p-6">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-white/45">Next action</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
              Start with {summary.weakestDomain.name}
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/70">
              Build momentum by reviewing the weakest domain first. That gives the biggest readiness lift with the smallest effort.
            </p>

            <div className="mt-6 rounded-3xl border border-white/[0.08] bg-white/[0.03] p-4 text-sm leading-6 text-white/72">
              This route is the first shell of the exam engine. The quiz loop and AI explanation layer will plug into this map next.
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <Link
                href={`/exams/${exam.slug}/study/quiz/${summary.weakestDomain.slug}`}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#3B82F6] px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95"
              >
                Open quiz shell
                <span aria-hidden="true">→</span>
              </Link>
              <Link
                href={`/exams/${exam.slug}`}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/[0.06] active:scale-95"
              >
                Back to overview
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};