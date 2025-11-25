'use server'
import { GoogleGenAI, Modality } from '@google/genai';
import { NextResponse, type NextRequest } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { prompt } = body;

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
        }

        const ai = new GoogleGenAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY as string);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
            for (const part of parts) {
                if (part.inlineData?.data) {
                    const base64ImageBytes = part.inlineData.data;
                    return NextResponse.json({ image: base64ImageBytes });
                }
            }
        }

        throw new Error("No image data found in response.");

    } catch (error) {
        console.error("Error in image generation API route:", error);
        return NextResponse.json({ error: 'Failed to generate image.' }, { status: 500 });
    }
}
