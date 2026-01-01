import Groq from "groq-sdk";
import { GoogleGenAI } from "@google/genai";
import { keyStates, allKeysConfigured, ApiKeyState } from "../utils/apiKeys";

export async function callAI<T>(
  systemPrompt: string,
  userPrompt: string,
  validator: (r: any) => boolean
): Promise<T> {
  if (!allKeysConfigured) throw new Error("No API keys configured");

  const key = keyStates.find(k => k.exhaustedUntil <= Date.now());
  if (!key) throw new Error("All keys exhausted");

  key.activeRequests++;

  try {
    let result: any;

    if (key.provider === 'groq') {
      const groq = new Groq({ apiKey: key.key });
      const res = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" }
      });

      result = JSON.parse(res.choices[0].message?.content || "{}");
    } else {
      const ai = new GoogleGenAI({ apiKey: key.key });
      const res = await ai.models.generateContent({ contents: userPrompt });
      result = JSON.parse(res.text);
    }

    if (!validator(result)) throw new Error("Invalid AI response");

    return result as T;
  } finally {
    key.activeRequests--;
  }
}
