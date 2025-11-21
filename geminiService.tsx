import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { CitationStyle, ResearchPackage, Source } from './src/types';

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. Using a placeholder.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const getTextGenerationSchema = () => {
  const citationSchema = {
    type: Type.OBJECT,
    properties: {
      source_id: { type: Type.STRING, description: "ID of the source document, which is its filename or given name." },
      quote: { type: Type.STRING, description: "The exact text quote from the source that supports the claim." },
    },
    required: ["source_id", "quote"]
  };

  const properties: Record<string, any> = {
     title: { type: Type.STRING, description: "A concise, engaging title for the entire research package." },
     summary: {
        type: Type.OBJECT,
        properties: {
            one_sentence: { type: Type.STRING },
            one_paragraph: { type: Type.STRING },
            one_page: { type: Type.STRING, description: "A detailed, one-page summary. Use markdown for formatting." }
        },
        required: ["one_sentence", "one_paragraph", "one_page"]
    },
    flashcards: {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                question: { type: Type.STRING },
                answer: { type: Type.STRING },
                citations: { type: Type.ARRAY, items: citationSchema, description: "Citations MUST be provided if the answer is directly from a source." }
            },
            required: ["question", "answer", "citations"]
        }
    },
    quiz: {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                question: { type: Type.STRING },
                answer: { type: Type.STRING },
                citations: { type: Type.ARRAY, items: citationSchema, description: "Citations MUST be provided if the answer is directly from a source." }
            },
            required: ["question", "answer", "citations"]
        }
    },
    audio_dialogue: {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING, description: "A short title for the audio dialogue." },
            script: { type: Type.STRING, description: "A conversational script between two speakers (Professor and Student) explaining the topic." }
        },
        required: ["title", "script"]
    }
  };

  const required = ['title', 'summary', 'flashcards', 'quiz', 'audio_dialogue'];

  return { type: Type.OBJECT, properties, required };
};


const getSystemInstruction = (citationStyle: CitationStyle) => `You are an expert AI research, learning, and creation assistant. Your mission is to use user-provided sources as a springboard to produce expert-level, insightful, and comprehensive learning packages. You must generate ALL components of the learning package: a summary, flashcards, a quiz, and a script for an audio dialogue.\n- **Expert Synthesis:** Your primary role is to synthesize and expand. Use the core ideas from the provided sources as a starting point. Then, enrich this foundation with your broad knowledge to provide deep context, comparisons, historical background, future implications, and cross-disciplinary insights. Do not merely summarize or rephrase the sources.\n- **Grounded but Expansive:** While your analysis must be rooted in the topics presented in the sources, you are expected to build upon them. If a source provides a topic like 'helpful tips for graphic design', your task is to generate those expert tips, not just state that the topic was mentioned.\n- **Cite Direct Claims:** When you make a specific claim or use a direct quote that can be attributed to a source document, you MUST provide a citation. For the broader expert knowledge you add, you can provide an empty citations array.\n- **Citation Style:** All citations (the quote and source_id) must be formatted according to the ${citationStyle} style guidelines.\n- **JSON Output:** You MUST respond with a single, valid JSON object that strictly adheres to the provided schema. Do not include any markdown formatting like \`\`\`json.\n- **Audience Adaptation:** Tailor the complexity and tone of the content to the specified audience.\n- **For Audio Scripts:** Write a natural, engaging dialogue between two distinct personas. You MUST use the speaker prefixes 'Professor:' and 'Student:'. The script should be clear and easy to follow for an auditory learner.\n`;


export const generateResearchPackage = async (
  goal: string,
  audience: string,
  citationStyle: CitationStyle,
  sources: Source[],
  setLoadingStatus: (status: string) => void
): Promise<Omit<ResearchPackage, 'id'>> => {
  const textSchema = getTextGenerationSchema();
  const sourceContent = sources.map(s => `Source ID: ${s.name}\n\n${s.content}`).join('\n\n---\n\n');

  const textGenerationPrompt = `
    Based on the following source documents, please generate a complete research package containing a tiered summary, flashcards, a quiz, and an audio dialogue script.\n\n    **Goal:** ${goal}\n    **Audience:** ${audience}\n    **Citation Style:** ${citationStyle}\n    
    **Source Documents:**\n    ---\n    ${sourceContent}\n    ---\n    
    Generate all text-based components of the research package in the required JSON format now.\n    `;

  try {
    // 1. Generate all text-based content
    setLoadingStatus("Synthesizing text-based content (summary, quiz, flashcards, script)...");
    const textResponse = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: textGenerationPrompt,
      config: {
        systemInstruction: getSystemInstruction(citationStyle),
        responseMimeType: "application/json",
        responseSchema: textSchema,
      },
    });
    if (!textResponse.text) {
        throw new Error("The response from the AI did not contain any text.")
    }
    const textData = JSON.parse(textResponse.text.trim());

    // 2. Generate image
    setLoadingStatus("Generating visual diagram...");
    const imagePrompt = `Create a clear and informative concept map or diagram summarizing the key concepts from this text: "${textData.summary.one_paragraph}". The diagram should be visually appealing and easy to understand for a ${audience}.`;
    const imageRes = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: imagePrompt }] },
        config: { responseModalities: [Modality.IMAGE] },
    });

    const imagePart = imageRes.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
    if (!imagePart?.inlineData) throw new Error("Image generation failed.");
    
    const generatedImage = {
        title: "Concept Map",
        prompt: imagePrompt,
        image_base64: imagePart.inlineData.data
    };
    
    // 3. Generate audio
    setLoadingStatus("Creating audio companion...");
    const script = textData.audio_dialogue.script;
    const hasMultipleSpeakers = script.includes('Professor:') && script.includes('Student:');
    
    const audioConfig = hasMultipleSpeakers ? {
        responseModalities: [Modality.AUDIO] as any,
        speechConfig: {
            multiSpeakerVoiceConfig: {
                speakerVoiceConfigs: [
                    { speaker: 'Professor', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
                    { speaker: 'Student', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } }
                ]
            }
        }
    } : {
        responseModalities: [Modality.AUDIO] as any,
        speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
    };

    const audioRes = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `TTS the following conversation:\n${script}` }] }],
        config: audioConfig,
    });
    
    const audioPart = audioRes.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
    if(!audioPart?.inlineData) throw new Error("Audio generation failed.");

    const generatedAudio = {
        ...textData.audio_dialogue,
        audio_base64: audioPart.inlineData.data,
    };

    setLoadingStatus("Done!");
    return {
        goal,
        audience,
        citationStyle,
        sources,
        title: textData.title,
        summary: textData.summary,
        flashcards: textData.flashcards,
        quiz: textData.quiz,
        image: generatedImage,
        audio_dialogue: generatedAudio,
    };

  } catch (error) {
    console.error("Error generating research package from Gemini:", error);
    if (error instanceof Error) {
        const errorMessage = error.message || JSON.stringify(error);
        throw new Error(`Gemini API Error: ${errorMessage}`);
    }
    throw new Error("There was an unexpected error. Please check the console for more details.");
  }
};
