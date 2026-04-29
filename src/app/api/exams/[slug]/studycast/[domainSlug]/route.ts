import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createServerSupabaseClient } from '@/lib/supabase/admin';
import { cleanJsonResponse, generateWithRetry } from '@/lib/ai-providers';
import { buildMaterialCorpus, getExamRuntimeBySlug } from '@/lib/exams/engine';

const fallbackEpisode = (domainName: string, questions: any[]) => ({
  title: `${domainName} StudyCast`,
  summary: `Quick revision audio outline for ${domainName}`,
  scriptMarkdown: `# ${domainName} StudyCast\n\n## Core Ideas\n- Focus on definitions and triggers\n- Practice question patterns\n- Review weak spots before the exam\n\n## Fast Recall\n- What is covered\n- When it applies\n- Common mistakes to avoid`,
  quizQuestions: questions.slice(0, 3).map((question) => ({
    question: question.question_text,
    options: question.options,
    correctAnswer: question.correct_answer,
    explanation: question.explanation,
  })),
});

export async function GET(_: NextRequest, context: { params: Promise<{ slug: string; domainSlug: string }> }) {
  try {
    const { slug, domainSlug } = await context.params;
    const authClient = await createSupabaseServerClient();
    const { data: { user } } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const runtime = await getExamRuntimeBySlug(slug);
    const domain = runtime.domains.find((item) => item.slug === domainSlug) ?? runtime.domains[0];

    if (!runtime.examId || !domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    const adminClient = createServerSupabaseClient();

    const { data: existingEpisode } = await adminClient
      .from('exam_studycast_episodes')
      .select('*')
      .eq('exam_id', runtime.examId)
      .eq('domain_id', domain.id)
      .maybeSingle();

    if (existingEpisode) {
      return NextResponse.json({ success: true, episode: existingEpisode, generated: false, domain });
    }

    const domainMaterials = runtime.materials.filter((material) => material.domain_id === domain.id || material.domain_id === null);
    const corpus = await buildMaterialCorpus(adminClient, domainMaterials);
    const domainQuestions = runtime.questions.filter((question) => question.domain_id === domain.id);

    let generatedPayload = fallbackEpisode(domain.name, domainQuestions);

    try {
      const prompt = `Create a StudyCast episode for ${runtime.exam.name} domain ${domain.name}.
Use this source material:
${corpus || 'No source material available. Use domain fundamentals.'}

Return JSON only in this shape:
{
  "title": "string",
  "summary": "string",
  "scriptMarkdown": "string",
  "quizQuestions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctAnswer": "string",
      "explanation": "string"
    }
  ]
}`;

      const generated = await generateWithRetry({
        prompt,
        systemPrompt: 'You are a clear and concise exam podcast host. Output valid JSON only.',
        temperature: 0.3,
        maxTokens: 3200,
      });

      const parsed = JSON.parse(cleanJsonResponse(generated.text));
      generatedPayload = {
        title: parsed.title || generatedPayload.title,
        summary: parsed.summary || generatedPayload.summary,
        scriptMarkdown: parsed.scriptMarkdown || generatedPayload.scriptMarkdown,
        quizQuestions: Array.isArray(parsed.quizQuestions) ? parsed.quizQuestions : generatedPayload.quizQuestions,
      };
    } catch {
      // Fallback payload is already prepared
    }

    const { data: inserted, error } = await adminClient
      .from('exam_studycast_episodes')
      .insert({
        exam_id: runtime.examId,
        domain_id: domain.id,
        title: generatedPayload.title,
        summary: generatedPayload.summary,
        script_markdown: generatedPayload.scriptMarkdown,
        quiz_questions: generatedPayload.quizQuestions,
        status: 'ready',
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, episode: inserted, generated: true, domain });
  } catch (error: any) {
    console.error('StudyCast fetch failed:', error);
    return NextResponse.json({ error: error.message || 'Failed to load StudyCast episode' }, { status: 500 });
  }
}
