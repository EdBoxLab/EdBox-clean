import { getTextExtractor } from 'office-text-extractor';
import pdf from 'pdf-parse';

/**
 * Converts a Buffer to a base64 string
 */
export function bufferToBase64(buffer: Buffer): string {
    return buffer.toString('base64');
}

/**
 * Extracts text from a PPTX file buffer
 */
export async function extractTextFromPPTX(buffer: Buffer): Promise<string> {
    try {
        const extractor = getTextExtractor();
        const text = await extractor.extractText({ input: buffer, type: 'buffer' });
        return text;
    } catch (error) {
        console.error('Error extracting text from PPTX:', error);
        throw new Error('Failed to extract text from PowerPoint file');
    }
}

/**
 * Extracts text from a PDF file buffer
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
        const data = await pdf(buffer);
        return data.text;
    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        throw new Error('Failed to extract text from PDF file');
    }
}

/**
 * Determines if a mime type is an image supported by Groq/Gemini
 */
export function isImageType(mimeType: string): boolean {
    const imageTypes = [
        'image/png',
        'image/jpeg',
        'image/webp',
    ];
    return imageTypes.includes(mimeType);
}

/**
 * Determines if a mime type is a PDF
 */
export function isPDFType(mimeType: string): boolean {
    return mimeType === 'application/pdf';
}

