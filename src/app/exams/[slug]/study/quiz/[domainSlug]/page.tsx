import { notFound } from 'next/navigation';
import { getDomainBySlug, getExamBySlug } from '@/lib/exams/catalog';
import { ExamQuizWorkspace } from '@/components/exams/ExamQuizWorkspace';

interface Props {
  params: Promise<{ slug: string; domainSlug: string }>;
}

export default async function ExamQuizShellPage({ params }: Props) {
  const { slug, domainSlug } = await params;
  const exam = getExamBySlug(slug);

  if (!exam) {
    notFound();
  }

  const domain = getDomainBySlug(exam, domainSlug);

  if (!domain) {
    notFound();
  }

  return <ExamQuizWorkspace examSlug={exam.slug} domainSlug={domain.slug} />;
}