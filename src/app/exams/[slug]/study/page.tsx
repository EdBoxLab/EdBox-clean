import { notFound } from 'next/navigation';
import { ExamStudyMap } from '@/components/exams/ExamStudyMap';
import { getExamBySlug } from '@/lib/exams/catalog';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ExamStudyPage({ params }: Props) {
  const { slug } = await params;
  const exam = getExamBySlug(slug);

  if (!exam) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <ExamStudyMap exam={exam} />
    </main>
  );
}