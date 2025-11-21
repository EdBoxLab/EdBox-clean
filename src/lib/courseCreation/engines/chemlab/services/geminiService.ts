import { GoogleGenAI, Type } from "@google/genai";

// Helper to safely get API key
const getApiKey = (): string => {
  // In a real environment, this comes from process.env.API_KEY
  // For this specific runtime environment, we assume it is available
  return process.env.API_KEY || '';
};

const SYSTEM_INSTRUCTION = `
You are the ChemLab AI, an advanced chemistry tutor and reasoning engine powered by Gemini 3. 
Your audience is students and researchers.
You are embedded in a web simulation "ChemLab".
When asked, explain chemical concepts clearly, provide step-by-step solutions for stoichiometry, 
analyze titration curves, or discuss molecular geometry.
Keep responses concise, educational, and formatted with Markdown.
If the user sends data (JSON), analyze it specifically.
`;

export const generateChemistryResponse = async (
  prompt: string, 
  contextData: string | null = null
): Promise<string> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      return "Error: API Key is missing. Please configure the environment.";
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Using gemini-2.5-flash for high speed interactive responses
    const modelId = 'gemini-2.5-flash'; 

    let finalPrompt = prompt;
    if (contextData) {
      finalPrompt = `Context Data (Current Simulation State):\n\`\`\`json\n${contextData}\n\`\`\`\n\nUser Question: ${prompt}`;
    }

    const response = await ai.models.generateContent({
      model: modelId,
      contents: finalPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    return response.text || "I couldn't generate a response at this time.";

  } catch (error) {
    console.error("Gemini API Error:", error);
    return "An error occurred while communicating with ChemLab AI.";
  }
};

// Define the response schema for reaction analysis
const reactionSchema = {
  type: Type.OBJECT,
  properties: {
    occurred: { type: Type.BOOLEAN, description: "True if a chemical reaction occurs under these conditions." },
    equation: { type: Type.STRING, description: "Balanced chemical equation (e.g. 2H2 + O2 -> 2H2O)." },
    reactionType: { 
      type: Type.STRING, 
      enum: ["combustion", "precipitation", "neutralization", "redox", "displacement", "synthesis", "decomposition", "other", "none"],
      description: "The type of reaction."
    },
    products: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          formula: { type: Type.STRING },
          phase: { type: Type.STRING, enum: ["solid", "liquid", "gas", "aqueous"] },
          color: { type: Type.STRING, description: "A CSS-like color name or hex code describing the substance (e.g. 'white', 'blue', '#FF0000')."}
        }
      }
    },
    animation: {
      type: Type.OBJECT,
      description: "Visual effects parameters for the reaction animation.",
      properties: {
        style: { 
          type: Type.STRING, 
          enum: ["explosion", "bubbles", "precipitate", "smoke", "glow", "splash"],
          description: "The physical behavior of the animation particles."
        },
        colors: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "Array of Hex color codes to use for particles (e.g. ['#FF0000', '#FFA500'] for fire)."
        },
        intensity: {
          type: Type.NUMBER,
          description: "0.1 to 1.0 scale of how vigorous the reaction is."
        }
      },
      required: ["style", "colors", "intensity"]
    },
    reasoning: { type: Type.STRING, description: "Brief scientific explanation of why the reaction happened or failed." }
  },
  required: ["occurred", "reasoning", "reactionType", "animation"]
};

export const analyzeReaction = async (reactants: string[], conditions: { temperature: number; pressure: number }): Promise<any> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key missing");

    const ai = new GoogleGenAI({ apiKey });
    const modelId = 'gemini-2.5-flash';

    const prompt = `
      Simulate a chemical reaction between these reactants: ${reactants.join(', ')}.
      Conditions: Temperature ${conditions.temperature}°C, Pressure ${conditions.pressure} atm.
      
      Determine if they react. If they do, list the products and the balanced equation. 
      If the conditions (temp/pressure) are insufficient for the reaction (e.g. activation energy not met), set 'occurred' to false and explain in reasoning.
      
      CRITICAL: Provide 'animation' details. 
      - If gas is released -> style: 'bubbles' or 'smoke'.
      - If solid forms -> style: 'precipitate'.
      - If exothermic/fire -> style: 'explosion' or 'glow'.
      - If liquid mixes/color change -> style: 'splash'.
      - Provide accurate colors for the chemicals involved (e.g. Copper is blue/green, Iron Oxide is red/brown, Carbon is black).
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: reactionSchema,
        temperature: 0.3 // Lower temperature for more deterministic chemical facts
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;
  } catch (error) {
    console.error("Reaction Analysis Error:", error);
    return null;
  }
};