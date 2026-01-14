// src/lib/utils/fileProcessing.ts
/**
 * File processing utilities optimized for Groq AI
 * Handles: DOCX, PPTX, TXT, MD, Images (PDF temporarily disabled)
 * Zero native dependencies, Vercel-compatible
 */

import { getTextExtractor } from 'office-text-extractor';

// ============= CONSTANTS =============

const MAX_TEXT_LENGTH = 100000; // ~25k tokens for Groq
const SUPPORTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
const SUPPORTED_TEXT_EXTENSIONS = ['.txt', '.md', '.csv', '.json', '.xml', '.html', '.css', '.js', '.ts', '.tsx', '.jsx'];

// ============= TYPE GUARDS =============

export function isImageType(mimeType: string): boolean {
  return SUPPORTED_IMAGE_TYPES.includes(mimeType.toLowerCase());
}

export function isPDFType(mimeType: string, fileName?: string): boolean {
  return (
    mimeType === 'application/pdf' || 
    (!!fileName && fileName.toLowerCase().endsWith('.pdf'))
  );
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

function toBuffer(content: string): Buffer {
  if (content.startsWith('data:')) {
    const base64 = content.split(',')[1];
    if (!base64) throw new Error('Invalid data URI format');
    return Buffer.from(base64, 'base64');
  }
  
  if (content.startsWith('%PDF')) {
    return Buffer.from(content, 'binary');
  }
  
  const isBase64 = /^[A-Za-z0-9+/=\n\r\s]+$/.test(content.slice(0, 300));
  if (isBase64) {
    try {
      return Buffer.from(content.replace(/[\n\r\s]/g, ''), 'base64');
    } catch {
      return Buffer.from(content, 'utf-8');
    }
  }
  
  return Buffer.from(content, 'utf-8');
}

export function bufferToBase64(buffer: Buffer): string {
  return buffer.toString('base64');
}

// ============= TEXT EXTRACTION FUNCTIONS =============

// PDF extraction temporarily disabled - see extractTextFromPDF stub below
export async function extractTextFromPDF(_buffer: Buffer): Promise<string> {
  return '[PDF processing temporarily disabled. Please use DOCX or paste text directly.]';
}

export async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    
    console.log(`📝 DOCX: Extracted ${result.value.length} chars`);
    
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

export async function extractTextFromPPTX(buffer: Buffer): Promise<string> {
  try {
    const extractor = getTextExtractor();
    const text = await extractor.extractText({ input: buffer, type: 'buffer' });
    
    console.log(`📊 PPTX: Extracted ${text.length} chars`);
    
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

export function extractTextFromPlainText(buffer: Buffer, fileName: string): string {
  try {
    let text = buffer.toString('utf-8');
    
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

export function processImageForGroq(buffer: Buffer, mimeType: string, fileName: string): {
  base64: string;
  mimeType: string;
  metadata: { originalSize: number; fileName: string };
} {
  const base64 = buffer.toString('base64');
  const sizeKB = buffer.length / 1024;
  
  console.log(`🖼️  IMAGE: ${fileName} (${sizeKB.toFixed(2)}KB, ${mimeType})`);
  
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

export async function processFileContent(
  content: string,
  mimeType: string,
  fileName: string
): Promise<string> {
  console.log(`\n🔄 Processing: ${fileName} (${mimeType})`);
  
  try {
    let buffer: Buffer;
    try {
      buffer = toBuffer(content);
    } catch (error) {
      throw new Error(`Failed to parse file content: ${error instanceof Error ? error.message : 'Invalid format'}`);
    }
    
    // 1. IMAGES
    if (isImageType(mimeType)) {
      const imageData = processImageForGroq(buffer, mimeType, fileName);
      return JSON.stringify({
        type: 'image',
        ...imageData
      });
    }
    
    // 2. PDFs - TEMPORARILY DISABLED
    if (isPDFType(mimeType, fileName) || buffer.slice(0, 4).toString() === '%PDF') {
      return '[PDF upload temporarily disabled. Please convert to DOCX or paste text directly. PDF support returning soon.]';
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
    
    // 5. Plain text files
    if (isTextType(mimeType, fileName)) {
      const text = extractTextFromPlainText(buffer, fileName);
      return truncateText(text, MAX_TEXT_LENGTH, fileName);
    }
    
    // 6. Unsupported file type
    console.warn(`⚠️  Unsupported file type: ${mimeType} (${fileName})`);
    return `[Unsupported file type: ${fileName}. Supported: DOCX, PPTX, TXT, MD, CSV, JSON, Images]`;
    
  } catch (error) {
    console.error(`❌ File processing error for ${fileName}:`, error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return `[Error processing ${fileName}: ${errorMsg}]`;
  }
}

function truncateText(text: string, maxLength: number, fileName: string): string {
  if (text.length <= maxLength) {
    return text;
  }
  
  console.warn(`⚠️  Truncating ${fileName} from ${text.length} to ${maxLength} chars`);
  
  return text.slice(0, maxLength) + 
    `\n\n[... Content truncated. Original file was ${text.length} characters. Only first ${maxLength} shown for AI processing.]`;
}

// ============= VALIDATION UTILITIES =============

export function validateFile(file: { 
  type: string; 
  size: number; 
  name: string 
}): { valid: boolean; error?: string } {
  const MAX_SIZE = 20 * 1024 * 1024;
  
  if (file.size > MAX_SIZE) {
    return { 
      valid: false, 
      error: `File too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum: 20MB` 
    };
  }
  
  const isSupported = 
    isImageType(file.type) ||
    isPDFType(file.type, file.name) ||
    isDOCXType(file.type, file.name) ||
    isPPTXType(file.type, file.name) ||
    isTextType(file.type, file.name);
  
  if (!isSupported) {
    return { 
      valid: false, 
      error: `Unsupported file type: ${file.type}. Supported: DOCX, PPTX, TXT, MD, CSV, JSON, Images` 
    };
  }
  
  return { valid: true };
}

export function getFileTypeDescription(mimeType: string, fileName: string): string {
  if (isImageType(mimeType)) return 'Image';
  if (isPDFType(mimeType, fileName)) return 'PDF Document';
  if (isDOCXType(mimeType, fileName)) return 'Word Document';
  if (isPPTXType(mimeType, fileName)) return 'PowerPoint Presentation';
  if (isTextType(mimeType, fileName)) return 'Text File';
  return 'Unknown File';
}