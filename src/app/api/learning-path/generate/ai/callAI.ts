import { generateWithRetry, cleanJsonResponse } from "@/lib/ai-providers";

export async function callAI<T>(
  systemPrompt: string,
  userPrompt: string,
  validator: (r: any) => boolean
): Promise<T> {
  try {
    const result = await generateWithRetry({
      prompt: userPrompt,
      systemPrompt,
      schema: true, // Use JSON mode
      temperature: 0.7,
    });

    const parsed = JSON.parse(cleanJsonResponse(result.text));

    if (!validator(parsed)) {
      throw new Error("Invalid AI response format");
    }

    return parsed as T;
  } catch (error) {
    console.error("AI Call Failed:", error);
    throw error;
  }
}
