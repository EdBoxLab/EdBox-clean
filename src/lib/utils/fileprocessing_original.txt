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
export function isPDFType(mimeType: string, fileName?: string): boolean {
    return mimeType === 'application/pdf' || (!!fileName && fileName.toLowerCase().endsWith('.pdf'));
}

/**
 * Determines if a mime type is a PowerPoint file
 */
export function isPPTXType(mimeType: string, fileName?: string): boolean {
    const types = [
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-powerpoint'
    ];
    return types.includes(mimeType) || (!!fileName && (fileName.toLowerCase().endsWith('.pptx') || fileName.toLowerCase().endsWith('.ppt')));
}

/**
 * Processes a base64 string or text content based on mime type
 */
export async function processFileContent(content: string, mimeType: string, fileName: string): Promise<string> {
    // If it's already plain text (or we don't have a mime type that suggests it's binary)
    if (mimeType.startsWith('text/') || fileName.endsWith('.txt') || fileName.endsWith('.md') || fileName.endsWith('.csv')) {
        // Content might be base64 or plain text depending on how the client sent it
        if (content.startsWith('data:')) {
            const base64 = content.split(',')[1];
            return Buffer.from(base64, 'base64').toString('utf-8');
        }
        
        // Safety: check if it looks like raw PDF binary even if mislabeled
        if (content.startsWith('%PDF')) {
            return await extractTextFromPDF(Buffer.from(content, 'binary'));
        }
        
        return content;
    }

    let buffer: Buffer;
    if (content.startsWith('data:')) {
        const base64 = content.split(',')[1];
        buffer = Buffer.from(base64, 'base64');
    } else if (content.startsWith('%PDF')) {
        // If it starts with %PDF, it's raw PDF binary content already
        buffer = Buffer.from(content, 'binary');
    } else {
        // Assume it's a raw base64 string if it doesn't have the data: prefix but isn't text
        try {
            // Check if it's likely base64 (only alphanumeric, +, /, and =)
            const isLikelyBase64 = /^[A-Za-z0-9+/= \n\r]+$/.test(content.slice(0, 200));
            if (isLikelyBase64 && !content.startsWith('%PDF')) {
                buffer = Buffer.from(content.replace(/[\n\r\s]/g, ''), 'base64');
            } else {
                buffer = Buffer.from(content, 'binary');
            }
        } catch {
            return "[Error: Could not process file content]";
        }
    }

    // Secondary check for PDF content in buffer
    if (buffer.slice(0, 4).toString() === '%PDF' || isPDFType(mimeType, fileName)) {
        return await extractTextFromPDF(buffer);
    }

    if (isPPTXType(mimeType, fileName)) {
        return await extractTextFromPPTX(buffer);
    }

    // For images, we can't extract text easily here without OCR
    if (isImageType(mimeType)) {
        return `[Image File: ${fileName}]`;
    }

    // Final fallback: if it's small and looks like text, return it, otherwise empty
    const textSample = buffer.slice(0, 100).toString('utf-8');
    if (/^[ -~\n\r\t]*$/.test(textSample)) {
        return buffer.toString('utf-8');
    }

    return "[Binary Content: " + fileName + "]"; 
}
