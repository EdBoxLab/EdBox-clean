/**
 * EdBox File Processing - STABLE LAUNCH VERSION
 * No Canvas, No DOMMatrix, No Bullshit.
 */

const MAX_TEXT_LENGTH = 100000;

/**
 * Utilities
 */
export function bufferToBase64(buffer: Buffer): string {
  return buffer.toString('base64');
}

export function isImageType(mimeType?: string): boolean {
  return ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes((mimeType || '').toLowerCase());
}

export function isPDFType(mimeType?: string): boolean {
  return (mimeType || '').toLowerCase() === 'application/pdf';
}

/**
 * Stubs / processors
 */
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

/**
 * Main processing engine
 */
export async function processFileContent(
  content: string,
  mimeType: string,
  fileName: string
): Promise<string> {
  // Determine buffer:
  // - If data URI: data:<mime>;base64,<data>
  // - If mimeType is image and content looks like base64, decode as base64
  // - Otherwise treat content as UTF-8 text
  let buffer: Buffer;

  if (content.startsWith('data:')) {
    const parts = content.split(',');
    buffer = Buffer.from(parts[1] || '', 'base64');
  } else if (isImageType(mimeType) && /^[A-Za-z0-9+/=\s]+$/.test(content)) {
    // Heuristic: looks like base64 (may contain newlines/spaces)
    buffer = Buffer.from(content.replace(/\s+/g, ''), 'base64');
  } else {
    buffer = Buffer.from(content, 'utf-8');
  }

  if (isImageType(mimeType)) {
    return JSON.stringify({
      type: 'image',
      base64: buffer.toString('base64'),
      mimeType,
      fileName
    });
  }

  const name = (fileName || '').toLowerCase();

  if (name.endsWith('.docx')) {
    return await extractTextFromDOCX(buffer);
  }

  if (name.endsWith('.pdf') || name.endsWith('.pptx')) {
    return `[File ${fileName} is currently locked. Use DOCX or TXT.]`;
  }

  // Default to text (truncate to MAX_TEXT_LENGTH)
  return buffer.toString('utf-8').slice(0, MAX_TEXT_LENGTH);
}