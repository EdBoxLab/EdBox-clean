'use server'
import { GoogleGenAI, Modality } from '@google/genai';
import { NextResponse, type NextRequest } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { text } = body;

        if (!text) {
            return NextResponse.json({ error: 'Text is required.' }, { status: 400 });
        }

        const ai = new GoogleGenAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY as string);
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("No audio data received from API");
        }

        return NextResponse.json({ audio: base64Audio });

    } catch (error) {
        console.error("Error in audio generation API route:", error);
        return NextResponse.json({ error: 'Failed to generate audio.' }, { status: 500 });
    }
}
