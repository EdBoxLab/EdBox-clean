import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY_1 || process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("No API key found in .env.local");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    // Note: The JS SDK doesn't have a direct listModels method on the genAI instance
    // but we can fetch it via the underlying REST API or check available models.
    // However, usually we can just try a few likely names or use the discovery endpoint.
    console.log("Fetching models for API key ending in...", apiKey.slice(-5));
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    
    if (data.models) {
      console.log("Available Models:");
      data.models.forEach((m: any) => {
        console.log(`- ${m.name} (${m.displayName})`);
      });
    } else {
      console.error("Failed to list models:", data);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

listModels();
