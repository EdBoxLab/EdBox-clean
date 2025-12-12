import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ----------------------
//  UTILS
// ----------------------
function extractJSON(text: string) {
  try {
    const fenced = text.match(/```json([\s\S]*?)```/i);
    const raw = fenced ? fenced[1] : text;
    return JSON.parse(
      raw
        .replace(/^[\s\n]*```(\w+)?|```$/g, "")
        .replace(/\n/g, "")
        .replace(/,\s*}/g, "}")
        .replace(/,\s*]/g, "]")
        .trim()
    );
  } catch {
    return text; // fallback
  }
}

function buildPrompt(type: string, prompt: string) {
  const base = `Base content:\n"${prompt}"\n\n`;
  switch (type) {
    case "quizzes":
      return base + `Generate EXACTLY 5 MCQ questions as strict JSON array.`;
    case "flashcards":
      return base + `Generate EXACTLY 10 flashcards as strict JSON array.`;
    case "mindmaps":
      return base + `Generate a mindmap in strict JSON format.`;
    case "notes":
      return base + `Generate structured notes in markdown headings.`;
  }
}

// Retry wrapper for transient errors
async function retry<T>(fn: () => Promise<T>, attempts = 2, delay = 500) {
  let lastError: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  throw lastError;
}

// ----------------------
//  ROUTE HANDLER
// ----------------------
export async function POST(request: NextRequest) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { prompt, contentTypes, fileName } = await request.json();
    if (!prompt || !contentTypes?.length)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro-latest",
      temperature: 0.7,
      reasoning: true
    });

    // ----------------------
    // Parallel & cached generation
    // ----------------------
    const results = await Promise.all(
      contentTypes.map(async (type: string) => {
        const key = `cache:${session.user.id}:${type}:${prompt.slice(0, 50)}`;
        // check cache (you can implement Redis or Supabase KV here)
        // const cached = await getCache(key);
        const cached = null;
        if (cached) return { type, content: cached };

        const output = await retry(async () => {
          const r = await model.generateText({ prompt: buildPrompt(type, prompt) });
          return type === "notes" ? r.text() : extractJSON(r.text());
        }, 3, 500);

        // set cache here if using Redis/Supabase KV
        // await setCache(key, output, 3600);

        return { type, content: output };
      })
    );

    const generatedContent = Object.fromEntries(results.map(r => [r.type, r.content]));

    const { data: studyKit, error: dbError } = await supabase
      .from("study_kit_content")
      .insert({
        user_id: session.user.id,
        title: prompt.slice(0, 100),
        source_type: fileName ? "file" : "text",
        source_content: prompt,
        file_name: fileName || null,
        content_types: contentTypes,
        generated_content: generatedContent
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return NextResponse.json({
      success: true,
      id: studyKit.id,
      content: generatedContent
    });

  } catch (error: any) {
    console.error("UltraMode POST Error:", error);
    return NextResponse.json(
      { error: "Failed to generate study kit", details: error?.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("study_kit_content")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ studyKits: data });
  } catch (error) {
    console.error("UltraMode GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch", details: error?.message }, { status: 500 });
  }
}
