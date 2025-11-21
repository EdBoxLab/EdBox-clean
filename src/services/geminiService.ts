import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import type { Source, ResearchPackage, CitationStyle } from '../types';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

// Model for JSON output
const jsonModel = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: {
        responseMimeType: "application/json",
    }
});

// Model for text-only output
const textModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

// Function for the Genie Assistant Chatbot
export async function askGenie(prompt: string): Promise<string> {
    try {
        const result = await textModel.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error asking Genie:", error);
        return "Sorry, I encountered an error. Please check the console for details.";
    }
}


function buildPrompt(goal: string, audience: string, citationStyle: CitationStyle, sources: Source[]): string {
    const sourceText = sources.map((src, index) => 
        `--- Source ${index + 1} (${src.name}) ---\n${src.content}\n--- End Source ${index + 1} ---`
    ).join('\n\n');

    return `
    You are an expert AI research assistant. Your task is to generate a comprehensive research package based on a user's goal and a set of provided sources. The output must be a single, valid JSON object.

    **Research Goal:** ${goal}
    **Target Audience:** ${audience}
    **Citation Style:** ${citationStyle}

    **Provided Sources:**
    ${sourceText}

    **Instructions:**
    1.  **Analyze the sources** to understand the key concepts, arguments, and evidence related to the research goal.
    2.  **Synthesize the information** to create a coherent and comprehensive overview for the specified audience.
    3.  **Generate the following artifacts** and structure them in a single JSON object as specified below.
    4.  **All text MUST be formatted as plain text**, using newline characters (\\n) for paragraphs. Do not use Markdown.
    5.  **Citations are crucial.** For any piece of information taken from a source, you must include a citation. Citations should reference the source by its number (e.g., "Source 1", "Source 2").

    **JSON Output Structure:**

    \`\`\`json
    {
      "title": "<A concise, engaging title for the research topic>",
      "goal": "${goal}",
      "summary": {
        "one_sentence": "<A single-sentence summary of the main point.>",
        "one_paragraph": "<A one-paragraph summary (3-5 sentences) providing a slightly more detailed overview.>",
        "one_page": "<A comprehensive, multi-paragraph summary that covers the topic in detail, suitable for the target audience. Use \\n for paragraph breaks.>"
      },
      "image": {
        "title": "<A title for a relevant visual diagram or concept map>",
        "prompt": "<A detailed prompt for a text-to-image model (like DALL-E or Midjourney) to generate this visual. The prompt should be descriptive and specific, focusing on concepts and relationships, not just a literal depiction. For example: 'A concept map illustrating the interconnected causes of the 2008 financial crisis, showing the flow from subprime mortgages to global economic impact, with nodes for key institutions and concepts. Minimalist, clean, infographic style.'>"
      },
      "flashcards": [
        {
          "question": "<A question about a key term, concept, or fact>",
          "answer": "<A concise answer.>",
          "citations": [ { "source_id": "<Source Number>", "quote": "<The exact quote from the source that supports the answer.>" } ]
        }
      ],
      "quiz": [
        {
          "question": "<A multiple-choice or open-ended question to test understanding.>",
          "answer": "<The correct answer.>",
          "citations": [ { "source_id": "<Source Number>", "quote": "<The exact quote from the source that supports the answer.>" } ]
        }
      ],
      "audio_dialogue": {
        "title": "<A title for the audio dialogue, e.g., 'Expert Discussion on [Topic]'>",
        "script": "<A script for a short, engaging audio dialogue (2-3 minutes) between two or more experts (e.g., 'Dr. Anya Sharma, Economic Historian' and 'Dr. Ben Carter, Financial Analyst'). The dialogue should explain the topic in a conversational and accessible way for the target audience. Use \\n for line breaks. Example: Dr. Sharma: Let's start with the basics, Ben. What were subprime mortgages? \\n Dr. Carter: Essentially, they were... >",
        "audio_base64": null
      }
    }
    \`\`\`
    `;
}

export async function generateResearchPackage(
    goal: string, 
    audience: string, 
    citationStyle: CitationStyle, 
    sources: Source[],
    setStatus: (status: string) => void
): Promise<Omit<ResearchPackage, 'id'>> {
    
    const prompt = buildPrompt(goal, audience, citationStyle, sources);

    try {
        setStatus("Synthesizing information and generating initial draft...");
        const result = await jsonModel.generateContent(prompt);
        const response = await result.response;
        const jsonText = response.text();
        
        setStatus("Parsing and validating the research package...");
        // Handle potential markdown backticks in the response
        const cleanJsonText = jsonText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
        const generatedPackage = JSON.parse(cleanJsonText);

        // Basic validation - can be expanded
        if (!generatedPackage.title || !generatedPackage.summary) {
            throw new Error("AI response is missing required fields (title or summary).");
        }

        if (!generatedPackage.audio_dialogue) {
             generatedPackage.audio_dialogue = { title: "Audio Companion", script: "", audio_base64: null };
        }

        if (!generatedPackage.image) {
             generatedPackage.image = { title: "Visual Aid", prompt: "", image_base64: null };
        }

        setStatus("Finalizing visual and audio components...");
        generatedPackage.image.image_base64 = null; // Placeholder
        generatedPackage.audio_dialogue.audio_base64 = null; // Placeholder

        setStatus("Almost there...");

        return generatedPackage as Omit<ResearchPackage, 'id'>;

    } catch (error) {
        console.error("Error generating research package:", error);
        if (error instanceof SyntaxError) {
             console.error("Invalid JSON response from AI:", (error as any).response?.text());
            throw new Error("The AI returned an invalid JSON response. Please try again.");
        }
         if ((error as any).message?.includes("response was blocked")) {
            throw new Error("The generation request was blocked by the safety filter. This can happen if the source material or the request contains sensitive content. Please review your sources and try again.");
        }
        throw new Error(`An unexpected error occurred during generation: ${(error as any).message}`);
    }
}
