/**
 * EdBox File Processing - Launch Version (Stable)
 * Stack: Mammoth (DOCX), Node-native (Text/Images)
 * No DOM dependencies.
 */

// ============= TYPE GUARDS & CONSTANTS =============
const MAX_TEXT_LENGTH = 100000;
const SUPPORTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];

export const isImageType = (mime) => SUPPORTED_IMAGE_TYPES.includes(mime?.toLowerCase());
export const isPDFType = (mime, name) => mime === 'application/pdf' || name?.endsWith('.pdf');
export const isDOCXType = (mime, name) => mime?.includes('word') || name?.endsWith('.docx');
export const isPPTXType = (mime, name) => mime?.includes('presentation') || name?.endsWith('.pptx');

// ============= REFACTORED EXTRACTORS =============

async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    // Mammoth is pure JS, no DOM requirements. Very stable for Vercel.
    const mammoth = await import('mammoth');
    const { value } = await mammoth.extractRawText({ buffer });
    return value.replace(/\s+/g, ' ').trim();
  } catch (error) {
    throw new Error('Word doc extraction failed');
  }
}

async function extractTextFromPPTX(buffer: Buffer): Promise<string> {
  try {
    // PPTX is basically a ZIP of XMLs. office-text-extractor is likely 
    // pulling in canvas-heavy dependencies. 
    // STUB for launch to prevent DOMMatrix crash.
    return "[PPTX support coming soon. Please convert to DOCX for now.]";
  } catch (error) {
    return "[PPTX Error]";
  }
}

// ============= MAIN HANDLER =============

export async function processFileContent(
  content: string,
  mimeType: string,
  fileName: string
): Promise<string> {
  // Convert base64 or raw string to Buffer
  const buffer = content.startsWith('data:') 
    ? Buffer.from(content.split(',')[1], 'base64') 
    : Buffer.from(content, 'utf-8');

  // 1. IMAGES (Pass-through for Vision AI)
  if (isImageType(mimeType)) {
    return JSON.stringify({
      type: 'image',
      base64: buffer.toString('base64'),
      mimeType,
      fileName
    });
  }

  // 2. TEXT/MD
  if (mimeType.startsWith('text/') || fileName.endsWith('.md') || fileName.endsWith('.json')) {
    return buffer.toString('utf-8').slice(0, MAX_TEXT_LENGTH);
  }

  // 3. DOCX
  if (isDOCXType(mimeType, fileName)) {
    return await extractTextFromDOCX(buffer);
  }

  // 4. PDF / PPTX (The "Problem" Children)
  if (isPDFType(mimeType, fileName) || isPPTXType(mimeType, fileName)) {
    return `[${fileName} is currently locked. Use DOCX or TXT for launch.]`;
  }

  return "[Unsupported format]";
}
