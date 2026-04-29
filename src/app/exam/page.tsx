import { redirect } from 'next/navigation';
import { getPrimaryExam } from '@/lib/exams/catalog';

export default function ExamAliasPage() {
  const exam = getPrimaryExam();

  if (!exam) {
    redirect('/exams');
  }

  redirect(`/exams/${exam.slug}`);
}