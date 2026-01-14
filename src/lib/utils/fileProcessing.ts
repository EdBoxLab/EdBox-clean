// src/lib/utils/fileProcessing.ts
/**
 * File processing utilities optimized for Groq AI
 * Handles: PDF, DOCX, PPTX, TXT, MD, Images
 * Zero native dependencies, Vercel-compatible
 
import { getTextExtractor } from 'office-text-extractor';

// ============= CONSTANTS =============

const MAX_TEXT_LENGTH = 100000; // ~25k tokens for Groq
const SUPPORTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
const SUPPORTED_TEXT_EXTENSIONS = ['.txt', '.md', '.csv', '.json', '.xml', '.html', '.css', '.js', '.ts', '.tsx', '.jsx'];

// ============= TYPE GUARDS =============

export function isImageType(mimeType: string): boolean {
  return SUPPORTED_IMAGE_TYPES.includes(mimeType.toLowerCase());
}

// 2. PDFs - TEMPORARILY DISABLED FOR LAUNCH
if (isPDFType(mimeType, fileName) || buffer.slice(0, 4).toString() === '%PDF') {
  return '[PDF upload temporarily disabled. Please convert to DOCX or paste text directly. PDF support returning very  soon.]';
}

export function isDOCXType(mimeType: string, fileName?: string): boolean {
  const types = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ];
  return (
    types.includes(mimeType) || 
    (!!fileName && (fileName.toLowerCase().endsWith('.docx') || fileName.toLowerCase().endsWith('.doc')))
  );
}

export function isPPTXType(mimeType: string, fileName?: string): boolean {
  const types = [
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint'
  ];
  return (
    types.includes(mimeType) || 
    (!!fileName && (fileName.toLowerCase().endsWith('.pptx') || fileName.toLowerCase().endsWith('.ppt')))
  );
}

export function isTextType(mimeType: string, fileName?: string): boolean {
  if (mimeType.startsWith('text/')) return true;
  if (mimeType === 'application/json') return true;
  if (!fileName) return false;
  return SUPPORTED_TEXT_EXTENSIONS.some(ext => fileName.toLowerCase().endsWith(ext));
}

// ============= BUFFER UTILITIES =============

/**
 * Converts content to Buffer, handling various input formats
 */
function toBuffer(content: string): Buffer {
  // Data URI format: data:mime/type;base64,xxxxx
  if (content.startsWith('data:')) {
    const base64 = content.split(',')[1];
    if (!base64) throw new Error('Invalid data URI format');
    return Buffer.from(base64, 'base64');
  }
  
  // Raw PDF binary check
  if (content.startsWith('%PDF')) {
    return Buffer.from(content, 'binary');
  }
  
  // Check if it's base64 (alphanumeric + +/= only)
  const isBase64 = /^[A-Za-z0-9+/=\n\r\s]+$/.test(content.slice(0, 300));
  if (isBase64) {
    try {
      return Buffer.from(content.replace(/[\n\r\s]/g, ''), 'base64');
    } catch {
      // Fallback to UTF-8 if base64 decode fails
      return Buffer.from(content, 'utf-8');
    }
  }
  
  // Default: treat as UTF-8 text
  return Buffer.from(content, 'utf-8');
}

/**
 * Converts Buffer to base64 string
 */
export function bufferToBase64(buffer: Buffer): string {
  return buffer.toString('base64');
}

// ============= TEXT EXTRACTION FUNCTIONS =============

/**
 * Extract text from PDF using unpdf (optimized for Groq)
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const { text, totalPages } = await extractText(buffer, { 
      mergePages: true,
    });
    
    console.log(`📄 PDF: Extracted ${text.length} chars from ${totalPages} pages`);
    
    // Clean up excessive whitespace for Groq
    const cleaned = text
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .replace(/\n{3,}/g, '\n\n')  // Max 2 consecutive newlines
      .trim();
    
    return cleaned;
  } catch (error) {
    console.error('❌ PDF extraction failed:', error);
    throw new Error(`PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from DOCX using mammoth (better quality than office-text-extractor for DOCX)
 */
export async function  extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import to avoid bundling if not needed
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    
    console.log(`📝 DOCX: Extracted ${result.value.length} chars`);
    
    // Clean up for Groq
    const cleaned = result.value
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    return cleaned;
  } catch (error) {
    console.error('❌ DOCX extraction failed:', error);
    throw new Error(`DOCX extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from PPTX using office-text-extractor
 */
export async function extractTextFromPPTX(buffer: Buffer): Promise<string> {
  try {
    const extractor = getTextExtractor();
    const text = await extractor.extractText({ input: buffer, type: 'buffer' });
    
    console.log(`📊 PPTX: Extracted ${text.length} chars`);
    
    // Clean up for Groq
    const cleaned = text
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    return cleaned;
  } catch (error) {
    console.error('❌ PPTX extraction failed:', error);
    throw new Error(`PPTX extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Process plain text files
 */
export function extractTextFromPlainText(buffer: Buffer, fileName: string): string {
  try {
    let text = buffer.toString('utf-8');
    
    // Special handling for JSON - pretty print for better AI understanding
    if (fileName.toLowerCase().endsWith('.json')) {
      try {
        const parsed = JSON.parse(text);
        text = JSON.stringify(parsed, null, 2);
      } catch {
        // Keep original if JSON parsing fails
      }
    }
    
    console.log(`📃 TEXT: Processed ${text.length} chars`);
    return text.trim();
  } catch (error) {
    console.error('❌ Text extraction failed:', error);
    throw new Error('Failed to read text file');
  }
}

/**
 * Optimize image for Groq Vision API
 * Groq supports: PNG, JPEG, WEBP, GIF (max 20MB, but smaller is faster)
 */
export function processImageForGroq(buffer: Buffer, mimeType: string, fileName: string): {
  base64: string;
  mimeType: string;
  metadata: { originalSize: number; fileName: string };
} {
  const base64 = buffer.toString('base64');
  const sizeKB = buffer.length / 1024;
  
  console.log(`🖼️  IMAGE: ${fileName} (${sizeKB.toFixed(2)}KB, ${mimeType})`);
  
  // Warn if image is very large (>5MB)
  if (buffer.length > 5 * 1024 * 1024) {
    console.warn(`⚠️  Large image detected (${sizeKB.toFixed(2)}KB). Consider compressing for faster processing.`);
  }
  
  return {
    base64,
    mimeType,
    metadata: {
      originalSize: buffer.length,
      fileName
    }
  };
}

// ============= MAIN PROCESSING FUNCTION =============

/**
 * Process any file type and extract content optimized for Groq AI
 * 
 * Returns either:
 * - Plain text (for PDFs, DOCX, PPTX, TXT, etc.)
 * - Image data object (for images to pass to Groq Vision)
 * 
 * @throws Error if processing fails
 */
export async function processFileContent(
  content: string,
  mimeType: string,
  fileName: string
): Promise<string> {
  console.log(`\n🔄 Processing: ${fileName} (${mimeType})`);
  
  try {
    // Convert content to Buffer
    let buffer: Buffer;
    try {
      buffer = toBuffer(content);
    } catch (error) {
      throw new Error(`Failed to parse file content: ${error instanceof Error ? error.message : 'Invalid format'}`);
    }
    
    // Route to appropriate extractor based on file type
    
    // 1. IMAGES - Return metadata for Groq Vision API
    if (isImageType(mimeType)) {
      const imageData = processImageForGroq(buffer, mimeType, fileName);
      // Return a special format that calling code can detect
      return JSON.stringify({
        type: 'image',
        ...imageData
      });
    }
    
    // 2. PDFs
    if (isPDFType(mimeType, fileName) || buffer.slice(0, 4).toString() === '%PDF') {
      const text = await extractTextFromPDF(buffer);
      return truncateText(text, MAX_TEXT_LENGTH, fileName);
    }
    
    // 3. DOCX files
    if (isDOCXType(mimeType, fileName)) {
      const text = await extractTextFromDOCX(buffer);
      return truncateText(text, MAX_TEXT_LENGTH, fileName);
    }
    
    // 4. PPTX files
    if (isPPTXType(mimeType, fileName)) {
      const text = await extractTextFromPPTX(buffer);
      return truncateText(text, MAX_TEXT_LENGTH, fileName);
    }
    
    // 5. Plain text files (TXT, MD, CSV, JSON, code files, etc.)
    if (isTextType(mimeType, fileName)) {
      const text = extractTextFromPlainText(buffer, fileName);
      return truncateText(text, MAX_TEXT_LENGTH, fileName);
    }
    
    // 6. Unsupported file type
    console.warn(`⚠️  Unsupported file type: ${mimeType} (${fileName})`);
    return `[Unsupported file type: ${fileName}. Supported formats: PDF, DOCX, PPTX, TXT, MD, CSV, JSON, and images (PNG, JPEG, WEBP, GIF)]`;
    
  } catch (error) {
    console.error(`❌ File processing error for ${fileName}:`, error);
    
    // Return user-friendly error message
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return `[Error processing ${fileName}: ${errorMsg}]`;
  }
}

/**
 * Truncate text to fit within Groq's context limits
 */
function truncateText(text: string, maxLength: number, fileName: string): string {
  if (text.length <= maxLength) {
    return text;
  }
  
  console.warn(`⚠️  Truncating ${fileName} from ${text.length} to ${maxLength} chars`);
  
  return text.slice(0, maxLength) + 
    `\n\n[... Content truncated. Original file was ${text.length} characters. Only first ${maxLength} shown for AI processing.]`;
}

// ============= VALIDATION UTILITIES =============

/**
 * Validate file before processing
 */
export function validateFile(file: { 
  type: string; 
  size: number; 
  name: string 
}): { valid: boolean; error?: string } {
  const MAX_SIZE = 20 * 1024 * 1024; // 20MB (Groq's limit)
  
  // Check file size
  if (file.size > MAX_SIZE) {
    return { 
      valid: false, 
      error: `File too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum: 20MB` 
    };
  }
  
  // Check if file type is supported
  const isSupported = 
    isImageType(file.type) ||
    isPDFType(file.type, file.name) ||
    isDOCXType(file.type, file.name) ||
    isPPTXType(file.type, file.name) ||
    isTextType(file.type, file.name);
  
  if (!isSupported) {
    return { 
      valid: false, 
      error: `Unsupported file type: ${file.type}. Supported: PDF, DOCX, PPTX, TXT, MD, CSV, JSON, PNG, JPEG, WEBP, GIF` 
    };
  }
  
  return { valid: true };
}

/**
 * Get user-friendly file type description
 */
export function getFileTypeDescription(mimeType: string, fileName: string): string {
  if (isImageType(mimeType)) return 'Image';
  if (isPDFType(mimeType, fileName)) return 'PDF Document';
  if (isDOCXType(mimeType, fileName)) return 'Word Document';
  if (isPPTXType(mimeType, fileName)) return 'PowerPoint Presentation';
  if (isTextType(mimeType, fileName)) return 'Text File';
  return 'Unknown File';
}