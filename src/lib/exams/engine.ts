import { createServerSupabaseClient } from '@/lib/supabase/admin';
import { generateWithRetry, cleanJsonResponse } from '@/lib/ai-providers';
import { examCatalog, formatExamPrice, getExamBySlug, type ExamConfig } from './catalog';

export type ExamQuestionType = 'mcq' | 'true_false' | 'scenario';

export interface ExamMaterialRecord {
  id: string;
  exam_id: string;
  domain_id: string | null;
  study_kit_content_id: string | null;
  title: string;
  source_type: string;
  content_text: string | null;
  content_jsonb: Record<string, unknown> | null;
}

export interface ExamDomainRecord {
  id: string;
  exam_id: string;
  slug: string;
  name: string;
  weight: number;
  order_index: number;
  active: boolean;
}

export interface ExamQuestionRecord {
  id?: string;
  exam_id: string;
  domain_id: string;
  material_id?: string | null;
  question_type: ExamQuestionType;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  difficulty: number;
  source_excerpt?: string | null;
  ai_model?: string | null;
}

export interface ExamRuntime {
  exam: ExamConfig;
  examId?: string;
  domains: ExamDomainRecord[];
  materials: ExamMaterialRecord[];
  questions: ExamQuestionRecord[];
}

interface GeneratedQuestionPayload {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty?: number;
  questionType?: ExamQuestionType;
  sourceExcerpt?: string;
}

const buildFallbackExamRecord = (slug: string): ExamRuntime => {
  const exam = getExamBySlug(slug) ?? examCatalog[0];

  return {
    exam,
    domains: exam.domains.map((domain, index) => ({
      id: `${exam.slug}-${domain.slug}`,
      exam_id: exam.slug,
      slug: domain.slug,
      name: domain.name,
      weight: domain.weight,
      order_index: index,
      active: true,
    })),
    materials: [],
    questions: [],
  };
};

export const getExamRuntimeBySlug = async (slug: string): Promise<ExamRuntime> => {
  const supabase = createServerSupabaseClient();

  const { data: kit } = await supabase
    .from('exam_kits')
    .select('*')
    .match({ slug, active: true })
    .maybeSingle();

  if (!kit) {
    return buildFallbackExamRecord(slug);
  }

  const { data: domains } = await supabase
    .from('exam_domains')
    .select('*')
    .eq('exam_id', kit.id)
    .eq('active', true)
    .order('order_index', { ascending: true });

  const { data: materials } = await supabase
    .from('exam_materials')
    .select('*')
    .eq('exam_id', kit.id)
    .order('created_at', { ascending: false });

  const { data: questions } = await supabase
    .from('exam_questions')
    .select('*')
    .eq('exam_id', kit.id)
    .order('created_at', { ascending: false });

  return {
    exam: {
      slug: kit.slug,
      name: kit.name,
      jurisdiction: kit.jurisdiction ?? [],
      passingScore: kit.passing_score,
      priceCents: kit.price_cents,
      estimatedPrepHours: kit.config?.estimatedPrepHours ?? '24-32 hours',
      totalQuestions: Array.isArray(questions) ? questions.length : 0,
      description: kit.config?.description ?? 'Exam kit loaded from your database.',
      active: kit.active,
      highlights: kit.config?.highlights ?? [],
      included: kit.config?.included ?? [],
      domains: (domains ?? []).map((domain: ExamDomainRecord) => ({
        slug: domain.slug,
        name: domain.name,
        weight: domain.weight,
        questionCount: (questions ?? []).filter((q: ExamQuestionRecord) => q.domain_id === domain.id).length,
        readiness: Number(kit.config?.readinessByDomain?.[domain.slug] ?? 0),
      })),
    },
    examId: kit.id,
    domains: domains ?? [],
    materials: materials ?? [],
    questions: questions ?? [],
  };
};

export const buildMaterialCorpus = async (supabase: ReturnType<typeof createServerSupabaseClient>, materials: ExamMaterialRecord[]) => {
  const chunks: string[] = [];

  for (const material of materials) {
    if (material.content_text?.trim()) {
      chunks.push(`Material: ${material.title}\n${material.content_text}`);
      continue;
    }

    if (material.study_kit_content_id) {
      const { data: studyKit } = await supabase
        .from('study_kit_content')
        .select('id, title, source_content, generated_content')
        .eq('id', material.study_kit_content_id)
        .single();

      if (studyKit) {
        const generated = studyKit.generated_content ? JSON.stringify(studyKit.generated_content) : '';
        const source = [studyKit.source_content, generated].filter(Boolean).join('\n\n');
        chunks.push(`Material: ${material.title || studyKit.title}\n${source}`);
      }
    }
  }

  return chunks.join('\n\n---\n\n').trim();
};

const parseGeneratedQuestions = (text: string): GeneratedQuestionPayload[] => {
  const cleaned = cleanJsonResponse(text);
  const parsed = JSON.parse(cleaned);
  const rawQuestions = Array.isArray(parsed) ? parsed : parsed.questions;

  if (!Array.isArray(rawQuestions)) {
    throw new Error('AI did not return a question array');
  }

  return rawQuestions.map((item: any) => ({
    question: String(item.question ?? item.prompt ?? '').trim(),
    options: Array.isArray(item.options) ? item.options.map((option: any) => String(option)) : [],
    correctAnswer: String(item.correctAnswer ?? item.answer ?? '').trim(),
    explanation: String(item.explanation ?? '').trim(),
    difficulty: Number(item.difficulty ?? 3),
    questionType: (item.questionType ?? item.type ?? 'mcq') as ExamQuestionType,
    sourceExcerpt: item.sourceExcerpt ? String(item.sourceExcerpt) : undefined,
  }));
};

export const generateExamQuestions = async ({
  exam,
  domain,
  corpus,
  count = 10,
}: {
  exam: ExamConfig;
  domain: ExamDomainRecord;
  corpus: string;
  count?: number;
}): Promise<ExamQuestionRecord[]> => {
  const prompt = `You are generating exam questions for ${exam.name}.

Domain: ${domain.name}
Jurisdiction: ${exam.jurisdiction.join(', ')}
Passing score: ${exam.passingScore}%

SOURCE MATERIAL:
${corpus || `No uploaded material is available yet. Generate questions from the exam domain itself: ${domain.name}.`}

Create ${count} high-quality questions.
Return JSON only in this exact shape:
{
  "questions": [
    {
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "explanation": "string",
      "difficulty": 1,
      "questionType": "mcq",
      "sourceExcerpt": "string"
    }
  ]
}`;

  const result = await generateWithRetry({
    prompt,
    systemPrompt: 'Output ONLY valid JSON. No markdown, no commentary.',
    temperature: 0.2,
    maxTokens: 5000,
    geminiModel: 'gemini-3.1-flash-lite-preview',
  });

  const payload = parseGeneratedQuestions(result.text);

  return payload
    .filter((item) => item.question && item.correctAnswer)
    .map((item) => ({
      exam_id: '',
      domain_id: domain.id,
      question_type: item.questionType ?? 'mcq',
      question_text: item.question,
      options: item.options,
      correct_answer: item.correctAnswer,
      explanation: item.explanation,
      difficulty: item.difficulty ?? 3,
      source_excerpt: item.sourceExcerpt ?? null,
      ai_model: result.provider,
    }));
};

export const scoreExamResponses = (
  questions: ExamQuestionRecord[],
  responses: Record<string, string>
) => {
  const total = questions.length || 1;
  let correctCount = 0;

  for (const question of questions) {
    const answer = responses[question.id ?? question.question_text] ?? '';
    if (answer && answer.trim().toLowerCase() === question.correct_answer.trim().toLowerCase()) {
      correctCount += 1;
    }
  }

  const score = Math.round((correctCount / total) * 100);
  return {
    score,
    passed: score >= 70,
    correctCount,
    total,
  };
};
