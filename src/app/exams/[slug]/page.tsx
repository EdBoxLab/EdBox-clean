import { notFound } from 'next/navigation';
import { ExamOverview } from '@/components/exams/ExamOverview';
import { getExamBySlug, getPrimaryExam } from '@/lib/exams/catalog';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ExamDetailPage({ params }: Props) {
  const { slug } = await params;
  const exam = slug ? getExamBySlug(slug) : getPrimaryExam();

  if (!exam) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <ExamOverview exam={exam} />
    </main>
  );
}