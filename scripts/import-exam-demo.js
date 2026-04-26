const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

const loadEnvFiles = () => {
  const candidates = [
    '.env',
    '.env.development',
    '.env.local',
    '.env.development.local',
  ];

  for (const envFile of candidates) {
    const resolved = path.resolve(envFile);
    if (fs.existsSync(resolved)) {
      dotenv.config({ path: resolved, override: true });
    }
  }
};

loadEnvFiles();

const sourcePath = process.argv[2] || 'scripts/exam-demo.insurance-us.json';
const shouldReset = process.argv.includes('--reset');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  process.exit(1);
}

if (!fs.existsSync(sourcePath)) {
  console.error(`JSON file not found: ${sourcePath}`);
  process.exit(1);
}

const payload = JSON.parse(fs.readFileSync(path.resolve(sourcePath), 'utf8'));

if (!payload?.exam?.slug || !Array.isArray(payload?.domains)) {
  console.error('Invalid exam demo JSON. Required: exam.slug and domains[].');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seed() {
  const examRow = {
    slug: payload.exam.slug,
    name: payload.exam.name,
    jurisdiction: payload.exam.jurisdiction || [],
    passing_score: payload.exam.passingScore || 70,
    price_cents: payload.exam.priceCents || 0,
    active: payload.exam.active !== false,
    config: {
      description: payload.exam.description || '',
      highlights: payload.exam.highlights || [],
      included: payload.exam.included || [],
      estimatedPrepHours: payload.exam.estimatedPrepHours || '24-32 hours',
      readinessByDomain: Object.fromEntries(
        (payload.domains || []).map((domain) => [domain.slug, Number(domain.readiness || 0)])
      ),
      ...(payload.exam.config || {}),
    },
  };

  const { data: examKit, error: examError } = await supabase
    .from('exam_kits')
    .upsert([examRow], { onConflict: 'slug' })
    .select('*')
    .single();

  if (examError || !examKit) {
    throw new Error(`Failed to upsert exam kit: ${examError?.message || 'unknown error'}`);
  }

  const examId = examKit.id;

  if (shouldReset) {
    await supabase.from('exam_attempts').delete().eq('exam_id', examId);
    await supabase.from('exam_questions').delete().eq('exam_id', examId);
    await supabase.from('exam_materials').delete().eq('exam_id', examId);
    await supabase.from('exam_domains').delete().eq('exam_id', examId);
  }

  const domainRows = payload.domains.map((domain, index) => ({
    exam_id: examId,
    slug: domain.slug,
    name: domain.name,
    weight: Number(domain.weight || 0),
    order_index: Number(domain.orderIndex ?? index),
    active: domain.active !== false,
  }));

  const { data: savedDomains, error: domainError } = await supabase
    .from('exam_domains')
    .upsert(domainRows, { onConflict: 'exam_id,slug' })
    .select('*');

  if (domainError || !savedDomains) {
    throw new Error(`Failed to upsert exam domains: ${domainError?.message || 'unknown error'}`);
  }

  const domainIdBySlug = Object.fromEntries(savedDomains.map((domain) => [domain.slug, domain.id]));

  if (Array.isArray(payload.materials) && payload.materials.length > 0) {
    const materialRows = payload.materials.map((material) => ({
      exam_id: examId,
      domain_id: material.domainSlug ? domainIdBySlug[material.domainSlug] || null : null,
      study_kit_content_id: material.studyKitContentId || null,
      title: material.title || 'Imported material',
      source_type: material.sourceType || 'manual',
      content_text: material.contentText || null,
      content_jsonb: material.contentJsonb || null,
    }));

    const { error: materialError } = await supabase
      .from('exam_materials')
      .insert(materialRows);

    if (materialError) {
      throw new Error(`Failed to insert exam materials: ${materialError.message}`);
    }
  }

  if (Array.isArray(payload.questions) && payload.questions.length > 0) {
    const questionRows = payload.questions.map((question) => ({
      exam_id: examId,
      domain_id: domainIdBySlug[question.domainSlug],
      question_type: question.questionType || 'mcq',
      question_text: question.questionText,
      options: question.options || [],
      correct_answer: question.correctAnswer,
      explanation: question.explanation || '',
      difficulty: Number(question.difficulty || 3),
      source_excerpt: question.sourceExcerpt || null,
      ai_model: question.aiModel || 'demo-json',
    }));

    const invalidRows = questionRows.filter((row) => !row.domain_id || !row.question_text || !row.correct_answer);
    if (invalidRows.length > 0) {
      throw new Error('One or more questions are missing domainSlug/questionText/correctAnswer.');
    }

    const { error: questionError } = await supabase
      .from('exam_questions')
      .insert(questionRows);

    if (questionError) {
      throw new Error(`Failed to insert exam questions: ${questionError.message}`);
    }
  }

  const { count: questionCount } = await supabase
    .from('exam_questions')
    .select('*', { count: 'exact', head: true })
    .eq('exam_id', examId);

  const { count: materialCount } = await supabase
    .from('exam_materials')
    .select('*', { count: 'exact', head: true })
    .eq('exam_id', examId);

  console.log('Exam demo import complete.');
  console.log(`Exam slug: ${payload.exam.slug}`);
  console.log(`Domains: ${savedDomains.length}`);
  console.log(`Materials: ${materialCount || 0}`);
  console.log(`Questions: ${questionCount || 0}`);
  console.log('Open: /exam or /exams/' + payload.exam.slug);
}

seed().catch((error) => {
  const message = error?.message || String(error);
  console.error(message);

  if (message.includes('public.exam_kits')) {
    console.error('Exam tables are missing. Run migration: supabase/migrations/20260426000000_exam_engine.sql');
  }

  process.exitCode = 1;
});
