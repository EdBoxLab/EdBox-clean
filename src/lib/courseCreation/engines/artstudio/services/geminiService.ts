import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

// Analyze artwork (Critique)
export const analyzeArtwork = async (base64Image: string, prompt: string) => {
  try {
    // Strip header if present to get raw base64
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: cleanBase64
            }
          },
          {
            text: prompt || "Analyze this artwork. Describe the style, composition, and provide constructive feedback for improvement."
          }
        ]
      },
      config: {
        systemInstruction: "You are a world-class art critic and educator named 'ArtLab Tutor'. You specialize in analyzing digital art, hand-drawn sketches, and user-uploaded photos. Provide constructive, encouraging, yet technical feedback on composition, line quality, color usage, and perspective. When analyzing sketches, focus on fundamentals.",
      }
    });

    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

// Text to Speech (Voice Tutor)
export const generateVoiceGuidance = async (text: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // Kore, Puck, Charon, Fenrir, Zephyr
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio;
  } catch (error) {
    console.error("Gemini TTS Error:", error);
    return null;
  }
};

// Chat with context (Simulated for single-turn mainly, or simple chat)
export const chatWithArtTutor = async (history: {role: string, text: string}[], newMessage: string) => {
    // Construct simple prompt for now or use chat interface if maintaining state
    // Using simple generateContent for this stateless example wrapper
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Context: User is asking about art.\nQuestion: ${newMessage}`,
        config: {
            systemInstruction: "You are an art teacher. Keep answers concise and helpful."
        }
    });
    return response.text;
};