/**
 * EMERGENCY DEBUG WRAPPER
 * 
 * This wraps your file processing with aggressive logging
 * that WILL show up even when everything else fails.
 * 
 * Deploy this, then check Vercel logs in 5 minutes.
 */

import { LlamaParseReader } from "llama-cloud-services";
import { Document } from "llamaindex";
import { getLlamaCloudKey } from "@/lib/ai-providers";
import pdf from "pdf-parse";
import { getTextExtractor } from "office-text-extractor";

// CRITICAL: Force logs to stdout (Vercel/Supabase Edge Functions capture this)
const FORCE_LOG = (level: string, ...args: any[]) => {
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] [${level}] ${args.map(a => 
    typeof a === 'object' ? JSON.stringify(a) : String(a)
  ).join(' ')}`;
  
  console.log(message); // stdout
  console.error(message); // stderr (captured by most platforms)
  
  return message;
};

const CONFIG = {
  MAX_FILE_SIZE: 25 * 1024 * 1024,
  LLAMA_TIMEOUT: 120000,
  FALLBACK_CHAR_LIMIT: 100000,
  PREMIUM_THRESHOLD: 10 * 1024 * 1024,
} as const;

const FILE_SIGNATURES = {
  PDF: [0x25, 0x50, 0x44, 0x46] as const,
  PNG: [0x89, 0x50, 0x4E, 0x47] as const,
  JPEG: [0xFF, 0xD8, 0xFF] as const,
  DOCX: [0x50, 0x4B, 0x03, 0x04] as const,
  PPTX: [0x50, 0x4B, 0x03, 0x04] as const,
} as const;

class FileProcessingError extends Error {
  constructor(
    message: string,
    public code: string,
    public fileName: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'FileProcessingError';
    FORCE_LOG('ERROR', `FileProcessingError: ${code} - ${message}`, details);
  }
}

function validateFileSignature(buffer: Buffer, fileName: string): void {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  const firstBytes = Array.from(buffer.subarray(0, 4));

  const signatureChecks: Record<string, readonly number[]> = {
    pdf: FILE_SIGNATURES.PDF,
    png: FILE_SIGNATURES.PNG,
    jpg: FILE_SIGNATURES.JPEG,
    jpeg: FILE_SIGNATURES.JPEG,
    docx: FILE_SIGNATURES.DOCX,
    pptx: FILE_SIGNATURES.PPTX,
  };

  const expectedSignature = signatureChecks[ext];
  if (!expectedSignature) return;

  const matches = expectedSignature.every((byte, i) => firstBytes[i] === byte);
  if (!matches) {
    throw new FileProcessingError(
      `File signature mismatch`,
      'INVALID_FILE_SIGNATURE',
      fileName,
      { expected: expectedSignature, actual: firstBytes }
    );
  }
}

function validateFileSize(buffer: Buffer, fileName: string): void {
  if (buffer.length > CONFIG.MAX_FILE_SIZE) {
    throw new FileProcessingError(
      `File too large`,
      'FILE_TOO_LARGE',
      fileName,
      { size: buffer.length }
    );
  }

  if (buffer.length === 0) {
    throw new FileProcessingError('File is empty', 'EMPTY_FILE', fileName);
  }
}

function normalizeToBuffer(content: string, mimeType: string, fileName: string): Buffer {
  FORCE_LOG('DEBUG', `normalizeToBuffer START: ${fileName}, contentLength=${content.length}`);
  
  try {
    if (content.startsWith('data:')) {
      FORCE_LOG('DEBUG', 'Detected Data URI format');
      const parts = content.split(',');
      if (parts.length < 2) {
        throw new Error('Malformed data URI');
      }
      const buffer = Buffer.from(parts[1], 'base64');
      FORCE_LOG('DEBUG', `Data URI decoded: ${buffer.length} bytes`);
      return buffer;
    }

    if (content.length > 100) {
      const trimmed = content.replace(/\s+/g, '');
      if (trimmed.length % 4 === 0 && /^[A-Za-z0-9+/]*={0,2}$/.test(trimmed)) {
        try {
          const decoded = Buffer.from(trimmed, 'base64');
          if (decoded.length > 0 && decoded.length < content.length) {
            FORCE_LOG('DEBUG', `Base64 decoded: ${decoded.length} bytes`);
            return decoded;
          }
        } catch (e) {
          FORCE_LOG('WARN', 'Base64 decode failed, trying UTF-8');
        }
      }
    }

    const buffer = Buffer.from(content, 'utf-8');
    FORCE_LOG('DEBUG', `UTF-8 conversion: ${buffer.length} bytes`);
    return buffer;

  } catch (error) {
    FORCE_LOG('ERROR', 'normalizeToBuffer FAILED:', error);
    throw new FileProcessingError(
      'Failed to decode file content',
      'DECODE_ERROR',
      fileName,
      error
    );
  }
}

async function parseWithLlamaParse(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  FORCE_LOG('INFO', `parseWithLlamaParse START: ${fileName}`);
  
  let apiKey: string;
  try {
    apiKey = getLlamaCloudKey();
    FORCE_LOG('DEBUG', `API Key obtained: ${apiKey ? 'YES' : 'NO'}, length=${apiKey?.length || 0}`);
  } catch (e) {
    FORCE_LOG('ERROR', 'getLlamaCloudKey FAILED:', e);
    throw new FileProcessingError(
      'LlamaCloud API key not available',
      'NO_API_KEY',
      fileName,
      e
    );
  }

  const usesPremium = buffer.length > CONFIG.PREMIUM_THRESHOLD;
  const mode = usesPremium ? 'premium' : 'fast';

  FORCE_LOG('INFO', `LlamaParse mode=${mode}, bufferSize=${buffer.length}`);

  const parsePromise = (async () => {
    try {
      FORCE_LOG('DEBUG', 'Creating LlamaParseReader...');
      const reader = new LlamaParseReader({
        apiKey,
        resultType: "markdown",
        verbose: true, // ENABLE VERBOSE FOR DEBUGGING
        parsingInstruction: `Extract all text preserving structure.`,
      });

      const ext = fileName.split('.').pop()?.toLowerCase() || 'bin';
      FORCE_LOG('DEBUG', `Calling loadDataAsContent with extension: ${ext}`);
      
      const documents = await reader.loadDataAsContent(buffer, `upload.${ext}`);

      FORCE_LOG('DEBUG', `loadDataAsContent returned ${documents?.length || 0} documents`);

      if (!documents || documents.length === 0) {
        throw new Error('LlamaParse returned zero documents');
      }

      const result = documents
        .map((doc: any, idx: number) => {
          const text = doc.text || (typeof doc.getContent === 'function' ? doc.getContent() : '');
          FORCE_LOG('DEBUG', `Doc ${idx}: text length=${text?.length || 0}`);
          return `--- PAGE ${idx + 1} ---\n${(text || '').trim()}`;
        })
        .join('\n\n');

      FORCE_LOG('INFO', `LlamaParse SUCCESS: ${result.length} chars`);
      return result;

    } catch (e) {
      FORCE_LOG('ERROR', 'LlamaParse inner error:', e);
      throw e;
    }
  })();

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(
      () => {
        FORCE_LOG('ERROR', `LlamaParse TIMEOUT after ${CONFIG.LLAMA_TIMEOUT / 1000}s`);
        reject(new Error(`LlamaParse timeout`));
      },
      CONFIG.LLAMA_TIMEOUT
    );
  });

  try {
    const markdown = await Promise.race([parsePromise, timeoutPromise]);
    return markdown;
  } catch (error) {
    FORCE_LOG('ERROR', `parseWithLlamaParse FAILED:`, error);
    throw error;
  }
}

async function fallbackTextExtraction(buffer: Buffer, fileName: string): Promise<string> {
  FORCE_LOG('WARN', `FALLBACK EXTRACTION START: ${fileName}`);
  const ext = fileName.toLowerCase().split('.').pop() || '';

  // PDF with pdf-parse
  if (ext === 'pdf') {
    try {
      FORCE_LOG('DEBUG', 'Trying pdf-parse...');
      const data = await pdf(buffer);
      if (data.text?.trim()) {
        FORCE_LOG('INFO', `pdf-parse SUCCESS: ${data.text.length} chars`);
        return data.text.slice(0, CONFIG.FALLBACK_CHAR_LIMIT);
      }
    } catch (e) {
      FORCE_LOG('ERROR', 'pdf-parse FAILED:', e);
    }
  }

  // Office documents
  if (['docx', 'pptx', 'xlsx'].includes(ext)) {
    try {
      FORCE_LOG('DEBUG', 'Trying office-text-extractor...');
      const extractor = getTextExtractor();
      const result = await extractor.extractText({ input: buffer, type: 'buffer' });
      const text = typeof result === 'string' ? result : (result as any)?.text || '';
      
      if (text?.trim()) {
        FORCE_LOG('INFO', `office-text-extractor SUCCESS: ${text.length} chars`);
        return text.slice(0, CONFIG.FALLBACK_CHAR_LIMIT);
      }
    } catch (e) {
      FORCE_LOG('ERROR', 'office-text-extractor FAILED:', e);
    }
  }

  // Raw PDF scraping
  if (ext === 'pdf') {
    FORCE_LOG('DEBUG', 'Trying raw PDF scraping...');
    const text = buffer.toString('latin1');
    const btPattern = /BT\s+([\s\S]*?)\s+ET/g;
    const textChunks: string[] = [];
    let match;

    while ((match = btPattern.exec(text)) !== null) {
      const chunk = match[1]
        .replace(/[^\x20-\x7E\n]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (chunk.length > 10) textChunks.push(chunk);
    }

    if (textChunks.length > 0) {
      const result = textChunks.join('\n\n').slice(0, CONFIG.FALLBACK_CHAR_LIMIT);
      FORCE_LOG('INFO', `Raw PDF scraping SUCCESS: ${result.length} chars`);
      return result;
    }
  }

  // Ultimate fallback
  FORCE_LOG('WARN', 'All extraction methods failed, using UTF-8 fallback');
  const text = buffer.toString('utf-8').slice(0, CONFIG.FALLBACK_CHAR_LIMIT);
  const printableRatio = (text.match(/[\x20-\x7E]/g)?.length || 0) / text.length;

  if (printableRatio < 0.3) {
    FORCE_LOG('ERROR', `Binary file detected: printableRatio=${printableRatio}`);
    return '[BINARY_FILE: Cannot extract text without proper parser]';
  }

  return text;
}

// UTILITIES
export function isImageType(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

export function bufferToBase64(buffer: Buffer): string {
  return buffer.toString("base64");
}

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer);
    return data.text || "";
  } catch (error) {
    FORCE_LOG('ERROR', 'extractTextFromPDF FAILED:', error);
    return "";
  }
}

export async function extractTextFromPPTX(buffer: Buffer): Promise<string> {
  try {
    const extractor = getTextExtractor();
    const result = await extractor.extractText({ input: buffer, type: "buffer" });
    const text = typeof result === 'string' ? result : (result as any)?.text || '';
    return text || "";
  } catch (error) {
    FORCE_LOG('ERROR', 'extractTextFromPPTX FAILED:', error);
    return "";
  }
}

// MAIN FUNCTION
export async function processFileContent(
  content: string,
  mimeType: string,
  fileName: string
): Promise<string> {
  const startTime = Date.now();
  
  FORCE_LOG('INFO', `========== PROCESSING START ==========`);
  FORCE_LOG('INFO', `File: ${fileName}, MIME: ${mimeType}, contentLength: ${content?.length || 0}`);

  try {
    // Step 1: Normalize
    FORCE_LOG('DEBUG', 'Step 1: Normalizing buffer...');
    const buffer = normalizeToBuffer(content, mimeType, fileName);
    FORCE_LOG('INFO', `Buffer created: ${buffer.length} bytes`);

    // Step 2: Validate
    FORCE_LOG('DEBUG', 'Step 2: Validating...');
    validateFileSize(buffer, fileName);
    validateFileSignature(buffer, fileName);
    FORCE_LOG('INFO', 'Validation passed');

    const ext = fileName.toLowerCase();

    // Images
    if (mimeType.startsWith('image/')) {
      FORCE_LOG('INFO', 'Detected IMAGE type');
      const result = JSON.stringify({
        type: 'image',
        base64: buffer.toString('base64'),
        mimeType,
        fileName,
      });
      FORCE_LOG('INFO', `Image JSON created: ${result.length} chars`);
      return result;
    }

    // Structured documents
    const isStructuredDoc =
      ext.endsWith('.pdf') ||
      ext.endsWith('.docx') ||
      ext.endsWith('.pptx') ||
      ext.endsWith('.xlsx') ||
      ext.endsWith('.doc') ||
      ext.endsWith('.ppt') ||
      ext.endsWith('.xls');

    if (isStructuredDoc) {
      FORCE_LOG('INFO', 'Detected STRUCTURED DOCUMENT');
      let markdown: string;

      try {
        FORCE_LOG('DEBUG', 'Attempting LlamaParse...');
        markdown = await parseWithLlamaParse(buffer, fileName, mimeType);
        FORCE_LOG('INFO', 'LlamaParse succeeded');
      } catch (parseError) {
        FORCE_LOG('WARN', 'LlamaParse failed, using fallback');
        markdown = await fallbackTextExtraction(buffer, fileName);
      }

      const processingTime = Date.now() - startTime;
      FORCE_LOG('INFO', `Processing complete in ${processingTime}ms`);

      const result = `<DOCUMENT_CONTEXT>
  <METADATA>
    <FILENAME>${fileName}</FILENAME>
    <TYPE>${mimeType}</TYPE>
    <SIZE_KB>${(buffer.length / 1024).toFixed(1)}</SIZE_KB>
    <PARSER>LlamaParse + Fallback</PARSER>
    <PROCESSING_TIME_MS>${processingTime}</PROCESSING_TIME_MS>
  </METADATA>
  <CONTENT>
${markdown}
  </CONTENT>
</DOCUMENT_CONTEXT>

[INSTRUCTION TO AI: The above is structured markdown extracted from ${fileName}.]`;

      FORCE_LOG('INFO', `Final result: ${result.length} chars`);
      return result;
    }

    // Plain text
    FORCE_LOG('INFO', 'Detected PLAIN TEXT/CODE');
    const textContent = buffer.toString('utf-8');
    const result = `<CODE_CONTEXT>
  <FILENAME>${fileName}</FILENAME>
  <TYPE>${mimeType}</TYPE>
  <CONTENT>
${textContent}
  </CONTENT>
</CODE_CONTEXT>`;

    FORCE_LOG('INFO', `Text result: ${result.length} chars`);
    return result;

  } catch (error) {
    FORCE_LOG('ERROR', '========== PROCESSING FAILED ==========');
    FORCE_LOG('ERROR', 'Error details:', error);
    FORCE_LOG('ERROR', 'Stack:', (error as Error).stack);

    if (error instanceof FileProcessingError) {
      throw error;
    }

    throw new FileProcessingError(
      'Unexpected error during file processing',
      'UNKNOWN_ERROR',
      fileName,
      error
    );
  }
}

export async function healthCheckLlamaParse(): Promise<boolean> {
  try {
    const apiKey = getLlamaCloudKey();
    const hasKey = !!apiKey;
    FORCE_LOG('INFO', `Health check: API key present = ${hasKey}`);
    return hasKey;
  } catch (e) {
    FORCE_LOG('ERROR', 'Health check FAILED:', e);
    return false;
  }
}