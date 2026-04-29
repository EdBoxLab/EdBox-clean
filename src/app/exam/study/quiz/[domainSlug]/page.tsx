import { redirect } from 'next/navigation';
import { getPrimaryExam } from '@/lib/exams/catalog';

interface Props {
  params: Promise<{ domainSlug: string }>;
}

export default async function ExamQuizAliasPage({ params }: Props) {
  const exam = getPrimaryExam();

  if (!exam) {
    redirect('/exams');
  }

  const { domainSlug } = await params;
  redirect(`/exams/${exam.slug}/study/quiz/${domainSlug}`);
}