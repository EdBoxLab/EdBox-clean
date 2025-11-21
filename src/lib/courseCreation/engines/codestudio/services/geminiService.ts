import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client
// Note: In a real app, ensure the key is securely proxied. 
// Here we assume process.env.API_KEY is available as per instructions.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateCodeAnalysis = async (code: string, language: string) => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      You are a senior software engineer and educator. Analyze the following ${language} code.
      Provide a concise summary of:
      1. What the code does.
      2. Potential bugs or performance issues.
      3. One specific optimization or "Pro Tip".
      
      Format the response in Markdown.
      
      Code:
      \`\`\`${language}
      ${code}
      \`\`\`
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Error generating analysis. Please check your API key and connection.";
  }
};

export const simulateExecution = async (code: string, language: string) => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      Act as a ${language} interpreter. 
      Execute the following code mentally and provide the Standard Output (stdout) strictly.
      Do not explain the code. Just show the output.
      If there is an error, simulate the error message.
      
      Code:
      \`\`\`${language}
      ${code}
      \`\`\`
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    let cleanText = response.text.trim();
    
    // Aggressive cleanup of markdown fences to ensure we just show the output
    // Matches start fence, content, and end fence
    const codeBlockRegex = /```(?:[\w]*\n)?([\s\S]*?)```/;
    const match = cleanText.match(codeBlockRegex);
    
    if (match && match[1]) {
      cleanText = match[1].trim();
    } else {
      // Fallback cleanup if regex doesn't match but backticks exist
      cleanText = cleanText.replace(/```[\w]*\n?/g, '').replace(/```/g, '').trim();
    }

    return cleanText;
  } catch (error) {
    console.error("Gemini Simulation Error:", error);
    return "Error simulating execution.";
  }
};

export const optimizeCode = async (code: string, language: string) => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      Rewrite the following ${language} code to be more efficient, cleaner, and follow best practices.
      Return ONLY the code block.
      
      Code:
      \`\`\`${language}
      ${code}
      \`\`\`
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    let cleanText = response.text.trim();
    const codeBlockRegex = /```(?:[\w]*\n)?([\s\S]*?)```/;
    const match = cleanText.match(codeBlockRegex);
    if (match && match[1]) {
      cleanText = match[1].trim();
    } else {
       cleanText = cleanText.replace(/```[\w]*\n?/g, '').replace(/```/g, '').trim();
    }
    
    return cleanText;
  } catch (error) {
    console.error("Gemini Optimization Error:", error);
    throw error;
  }
};

export const instrumentCode = async (code: string) => {
  try {
    const model = 'gemini-2.5-flash';
    // We ask Gemini to insert "await step(lineNumber)" calls.
    const prompt = `
      You are a JavaScript Debugging Compiler. 
      Your task is to take the provided JavaScript code and insert \`await step(lineNumber);\` statements before every executable line to enable step-by-step debugging.

      Rules:
      1. \`lineNumber\` must match the 1-based line number of the ORIGINAL code.
      2. Do NOT insert \`await step(...)\` inside synchronous functions (unless you convert them to async, but prefer avoiding complex refactors). 
      3. Insert it safely at the start of lines in the top-level scope or inside \`async function\` blocks.
      4. Do not change the behavior of the code logic itself.
      5. Return ONLY the raw JavaScript code. Do not use Markdown formatting.

      Original Code:
      ${code}
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    let cleanText = response.text.trim();
    // Strip markdown if present
    const codeBlockRegex = /```(?:[\w]*\n)?([\s\S]*?)```/;
    const match = cleanText.match(codeBlockRegex);
    if (match && match[1]) {
      cleanText = match[1].trim();
    } else {
      cleanText = cleanText.replace(/```[\w]*\n?/g, '').replace(/```/g, '').trim();
    }

    return cleanText;
  } catch (error) {
    console.error("Gemini Instrumentation Error:", error);
    throw new Error("Failed to prepare code for debugging.");
  }
};