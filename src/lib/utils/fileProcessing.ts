/**
 * EdBox File Processing - STABLE LAUNCH VERSION
 * No Canvas, No DOMMatrix, No Bullshit.
 */

const MAX_TEXT_LENGTH = 100000;

// === EXPORTED UTILS FOR API ROUTES ===

export function bufferToBase64(buffer: Buffer): string {
  return buffer.toString('base64');
}

export function isImageType(mimeType: string): boolean {
  return ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(mimeType?.toLowerCase());
}

// === STUBS TO SATISFY TYPESCRIPT COMPILER ===

export async function extractTextFromPDF(_buffer: Buffer): Promise<string> {
  return "[PDF Support temporarily disabled for stability. Use DOCX or Text.]";
}

export async function extractTextFromPPTX(_buffer: Buffer): Promise<string> {
  return "[PPTX Support coming soon. Please convert to DOCX.]";
}

export async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const mammoth = await import('mammoth');
    const { value } = await mammoth.extractRawText({ buffer });
    return value.replace(/\s+/g, ' ').trim();
  } catch (e) {
    return "[Error processing Word Document]";
  }
}

// === MAIN PROCESSING ENGINE ===

export async function processFileContent(
  content: string,
  mimeType: string,
  fileName: string
): Promise<string> {
  // Handle Base64 vs Raw
  const buffer = content.startsWith('data:') 
    ? Buffer.from(content.split(',')[1], 'base64') 
    : Buffer.from(content, 'utf-8');

  if (isImageType(mimeType)) {
    return JSON.stringify({
      type: 'image',
      base64: buffer.toString('base64'),
      mimeType,
      fileName
    });
  }

  const name = fileName.toLowerCase();

  if (name.endsWith('.docx')) {
    return await extractTextFromDOCX(buffer);
  }

  if (name.endsWith('.pdf') || name.endsWith('.pptx')) {
    return `[File ${fileName} is currently locked. Use DOCX or TXT.]`;
  }

  // Default to text
  return buffer.toString('utf-8').slice(0, MAX_TEXT_LENGTH);
}
