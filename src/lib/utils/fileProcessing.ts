import "@/lib/polyfills";
/**
 * EdBox File Processing Engine - PRODUCTION GRADE
 * 
 * Emergency Debug Edition - Aggressive Logging Enabled
 * Deploy this version to diagnose production failures
 * 
 * @author EdBox Engineering Team
 * @version 3.1.0-debug
 */

import { LlamaParseReader } from "llama-cloud-services";
import { Document } from "llamaindex";
import { getLlamaCloudKey } from "@/lib/ai-providers";
import pdf from "pdf-parse";
import { getTextExtractor } from "office-text-extractor";

// ---------------------------------------------------------------------------
// EMERGENCY LOGGING - VISIBLE IN ALL PLATFORMS
// ---------------------------------------------------------------------------

const FORCE_LOG = (level: string, ...args: any[]) => {
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] [EDBOX-${level}] ${args.map(a =>
    typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
  ).join(' ')}`;

  console.log(message);
  console.error(message); // Duplicate to stderr for redundancy

  return message;
};

// ---------------------------------------------------------------------------
// CONFIGURATION
// ---------------------------------------------------------------------------

const CONFIG = {
  MAX_FILE_SIZE: 25 * 1024 * 1024, // 25MB
  LLAMA_TIMEOUT: 120000, // 2 minutes
  FALLBACK_CHAR_LIMIT: 100000,
  PREMIUM_THRESHOLD: 10 * 1024 * 1024, // 10MB
} as const;

const FILE_SIGNATURES = {
  PDF: [0x25, 0x50, 0x44, 0x46] as const, // %PDF
  PNG: [0x89, 0x50, 0x4E, 0x47] as const,
  JPEG: [0xFF, 0xD8, 0xFF] as const,
  DOCX: [0x50, 0x4B, 0x03, 0x04] as const, // ZIP-based
  PPTX: [0x50, 0x4B, 0x03, 0x04] as const,
} as const;

// ---------------------------------------------------------------------------
// ERROR HANDLING
// ---------------------------------------------------------------------------

class FileProcessingError extends Error {
  constructor(
    message: string,
    public code: string,
    public fileName: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'FileProcessingError';
    FORCE_LOG('ERROR', `FileProcessingError [${code}]: ${message}`, details);
  }
}

// ---------------------------------------------------------------------------
// VALIDATION
// ---------------------------------------------------------------------------

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
  if (!expectedSignature) {
    FORCE_LOG('DEBUG', `No signature validation for .${ext}`);
    return;
  }

  const matches = expectedSignature.every((byte, i) => firstBytes[i] === byte);
  if (!matches) {
    throw new FileProcessingError(
      `File signature mismatch for .${ext}`,
      'INVALID_FILE_SIGNATURE',
      fileName,
      { expected: Array.from(expectedSignature), actual: firstBytes }
    );
  }

  FORCE_LOG('DEBUG', `Signature validated for .${ext}`);
}

function validateFileSize(buffer: Buffer, fileName: string): void {
  FORCE_LOG('DEBUG', `Validating file size: ${buffer.length} bytes`);

  if (buffer.length > CONFIG.MAX_FILE_SIZE) {
    throw new FileProcessingError(
      `File exceeds ${CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB limit`,
      'FILE_TOO_LARGE',
      fileName,
      { size: buffer.length, limit: CONFIG.MAX_FILE_SIZE }
    );
  }

  if (buffer.length === 0) {
    throw new FileProcessingError(
      'File is empty (0 bytes)',
      'EMPTY_FILE',
      fileName
    );
  }

  FORCE_LOG('DEBUG', 'File size validation passed');
}

// ---------------------------------------------------------------------------
// BUFFER NORMALIZATION
// ---------------------------------------------------------------------------

function normalizeToBuffer(content: string, mimeType: string, fileName: string): Buffer {
  FORCE_LOG('INFO', `normalizeToBuffer: fileName=${fileName}, mimeType=${mimeType}, contentLength=${content?.length || 0}`);

  try {
    // Path 1: Data URI
    if (content.startsWith('data:')) {
      FORCE_LOG('DEBUG', 'Detected Data URI format');
      const parts = content.split(',');

      if (parts.length < 2 || !parts[1]) {
        throw new Error('Malformed data URI - missing base64 payload');
      }

      const buffer = Buffer.from(parts[1], 'base64');
      FORCE_LOG('INFO', `Data URI decoded successfully: ${buffer.length} bytes`);
      return buffer;
    }

    // Path 2: Pure Base64
    if (content.length > 100) {
      const trimmed = content.replace(/\s+/g, '');

      // Strict base64 validation
      if (trimmed.length % 4 === 0 && /^[A-Za-z0-9+/]*={0,2}$/.test(trimmed)) {
        try {
          const decoded = Buffer.from(trimmed, 'base64');

          // Sanity check: decoded should be smaller than input
          if (decoded.length > 0 && decoded.length < content.length) {
            FORCE_LOG('INFO', `Base64 decoded successfully: ${decoded.length} bytes`);
            return decoded;
          }
        } catch (e) {
          FORCE_LOG('WARN', 'Base64 decode attempt failed, trying UTF-8');
        }
      }
    }

    // Path 3: Raw text/binary
    const buffer = Buffer.from(content, 'utf-8');
    FORCE_LOG('INFO', `UTF-8 conversion: ${buffer.length} bytes`);
    return buffer;

  } catch (error) {
    FORCE_LOG('ERROR', 'normalizeToBuffer CRITICAL FAILURE', error);
    throw new FileProcessingError(
      'Failed to decode file content',
      'DECODE_ERROR',
      fileName,
      error
    );
  }
}

// ---------------------------------------------------------------------------
// LLAMAPARSE ENGINE
// ---------------------------------------------------------------------------

async function parseWithLlamaParse(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  FORCE_LOG('INFO', `=== LLAMAPARSE START: ${fileName} ===`);

  let apiKey: string;
  try {
    apiKey = getLlamaCloudKey();
    FORCE_LOG('DEBUG', `API Key retrieved: ${apiKey ? 'YES' : 'NO'} (length=${apiKey?.length || 0})`);

    if (!apiKey) {
      throw new Error('API key is empty/undefined');
    }
  } catch (e) {
    FORCE_LOG('ERROR', 'getLlamaCloudKey() FAILED', e);
    throw new FileProcessingError(
      'LlamaCloud API key not available',
      'NO_API_KEY',
      fileName,
      e
    );
  }

  const usesPremium = buffer.length > CONFIG.PREMIUM_THRESHOLD;
  const mode = usesPremium ? 'premium' : 'fast';
  FORCE_LOG('INFO', `Mode: ${mode}, Buffer size: ${(buffer.length / 1024).toFixed(1)}KB`);

  const parsePromise = (async () => {
    try {
      FORCE_LOG('DEBUG', 'Initializing LlamaParseReader...');

      const reader = new LlamaParseReader({
        apiKey,
        resultType: "markdown",
        verbose: true, // Enable verbose for debugging
        parsingInstruction: `Extract all text preserving document structure. Use markdown tables for tabular data.`,
      });

      const ext = fileName.split('.').pop()?.toLowerCase() || 'bin';
      FORCE_LOG('DEBUG', `Calling loadDataAsContent(buffer, "upload.${ext}")`);

      const documents = await reader.loadDataAsContent(buffer, `upload.${ext}`);
      FORCE_LOG('DEBUG', `LlamaParse returned ${documents?.length || 0} document(s)`);

      if (!documents || documents.length === 0) {
        throw new Error('LlamaParse returned zero documents');
      }

      const result = documents
        .map((doc: any, idx: number) => {
          // Handle different document formats
          const text = doc.text ||
            (typeof doc.getContent === 'function' ? doc.getContent() : '') ||
            (doc.content) ||
            '';

          const textLength = text?.length || 0;
          FORCE_LOG('DEBUG', `Document ${idx + 1}/${documents.length}: ${textLength} chars`);

          return `--- PAGE ${idx + 1} ---\n${(text || '').trim()}`;
        })
        .join('\n\n');

      FORCE_LOG('INFO', `LlamaParse SUCCESS: Total ${result.length} characters extracted`);
      return result;

    } catch (e) {
      FORCE_LOG('ERROR', 'LlamaParse internal error', e);
      throw e;
    }
  })();

  // Timeout protection
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      FORCE_LOG('ERROR', `LlamaParse TIMEOUT after ${CONFIG.LLAMA_TIMEOUT / 1000}s`);
      reject(new Error(`LlamaParse timeout after ${CONFIG.LLAMA_TIMEOUT / 1000}s`));
    }, CONFIG.LLAMA_TIMEOUT);
  });

  try {
    const markdown = await Promise.race([parsePromise, timeoutPromise]);
    FORCE_LOG('INFO', `=== LLAMAPARSE COMPLETE ===`);
    return markdown;
  } catch (error) {
    FORCE_LOG('ERROR', '=== LLAMAPARSE FAILED ===', error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// FALLBACK EXTRACTION
// ---------------------------------------------------------------------------

async function fallbackTextExtraction(buffer: Buffer, fileName: string): Promise<string> {
  FORCE_LOG('WARN', `=== FALLBACK EXTRACTION: ${fileName} ===`);
  const ext = fileName.toLowerCase().split('.').pop() || '';

  // Strategy 1: pdf-parse for PDFs
  if (ext === 'pdf') {
    try {
      FORCE_LOG('DEBUG', 'Attempting pdf-parse...');
      const data = await pdf(buffer);

      if (data.text?.trim()) {
        FORCE_LOG('INFO', `pdf-parse SUCCESS: ${data.text.length} chars, ${data.numpages} pages`);
        return data.text.slice(0, CONFIG.FALLBACK_CHAR_LIMIT);
      }
    } catch (e) {
      FORCE_LOG('ERROR', 'pdf-parse FAILED', e);
    }
  }

  // Strategy 2: office-text-extractor for Office files
  if (['docx', 'pptx', 'xlsx', 'doc', 'ppt', 'xls'].includes(ext)) {
    try {
      FORCE_LOG('DEBUG', 'Attempting office-text-extractor...');
      const extractor = getTextExtractor();
      const result = await extractor.extractText({ input: buffer, type: 'buffer' });

      // Handle multiple return formats
      const text = typeof result === 'string'
        ? result
        : (result as any)?.text || '';

      if (text?.trim()) {
        FORCE_LOG('INFO', `office-text-extractor SUCCESS: ${text.length} chars`);
        return text.slice(0, CONFIG.FALLBACK_CHAR_LIMIT);
      }
    } catch (e) {
      FORCE_LOG('ERROR', 'office-text-extractor FAILED', e);
    }
  }

  // Strategy 3: Raw PDF text scraping
  if (ext === 'pdf') {
    FORCE_LOG('DEBUG', 'Attempting raw PDF text extraction...');
    try {
      const text = buffer.toString('latin1');
      const btPattern = /BT\s+([\s\S]*?)\s+ET/g;
      const textChunks: string[] = [];
      let match;

      while ((match = btPattern.exec(text)) !== null) {
        const chunk = match[1]
          .replace(/[^\x20-\x7E\n]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (chunk.length > 10) {
          textChunks.push(chunk);
        }
      }

      if (textChunks.length > 0) {
        const result = textChunks.join('\n\n').slice(0, CONFIG.FALLBACK_CHAR_LIMIT);
        FORCE_LOG('INFO', `Raw PDF extraction SUCCESS: ${result.length} chars from ${textChunks.length} chunks`);
        return result;
      }
    } catch (e) {
      FORCE_LOG('ERROR', 'Raw PDF extraction FAILED', e);
    }
  }

  // Strategy 4: UTF-8 text fallback
  FORCE_LOG('WARN', 'All specialized extractors failed, trying UTF-8...');
  const text = buffer.toString('utf-8').slice(0, CONFIG.FALLBACK_CHAR_LIMIT);
  const printableRatio = (text.match(/[\x20-\x7E]/g)?.length || 0) / (text.length || 1);

  FORCE_LOG('DEBUG', `UTF-8 printable ratio: ${(printableRatio * 100).toFixed(1)}%`);

  if (printableRatio < 0.3) {
    FORCE_LOG('ERROR', 'Binary file detected - no text extractable');
    return '[BINARY_FILE: Cannot extract text without proper parser. File may be corrupted or encrypted.]';
  }

  FORCE_LOG('INFO', `UTF-8 fallback: ${text.length} chars extracted`);
  return text;
}

// ---------------------------------------------------------------------------
// UTILITY FUNCTIONS - EXPORTED FOR COMPATIBILITY
// ---------------------------------------------------------------------------

export function isImageType(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

export function isPDFType(mimeType: string): boolean {
  return mimeType === "application/pdf" ||
    mimeType.toLowerCase().includes("pdf");
}

export function bufferToBase64(buffer: Buffer): string {
  return buffer.toString("base64");
}

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  FORCE_LOG('DEBUG', 'extractTextFromPDF called');
  try {
    const data = await pdf(buffer);
    const text = data.text || "";
    FORCE_LOG('DEBUG', `extractTextFromPDF: ${text.length} chars`);
    return text;
  } catch (error) {
    FORCE_LOG('ERROR', 'extractTextFromPDF FAILED', error);
    return "";
  }
}

export async function extractTextFromPPTX(buffer: Buffer): Promise<string> {
  FORCE_LOG('DEBUG', 'extractTextFromPPTX called');
  try {
    const extractor = getTextExtractor();
    const result = await extractor.extractText({ input: buffer, type: "buffer" });
    const text = typeof result === 'string' ? result : (result as any)?.text || '';
    FORCE_LOG('DEBUG', `extractTextFromPPTX: ${text.length} chars`);
    return text;
  } catch (error) {
    FORCE_LOG('ERROR', 'extractTextFromPPTX FAILED', error);
    return "";
  }
}

// ---------------------------------------------------------------------------
// MAIN PROCESSING PIPELINE
// ---------------------------------------------------------------------------

export async function processFileContent(
  content: string,
  mimeType: string,
  fileName: string
): Promise<string> {
  const startTime = Date.now();

  FORCE_LOG('INFO', '╔═══════════════════════════════════════════════════╗');
  FORCE_LOG('INFO', '║  FILE PROCESSING START                            ║');
  FORCE_LOG('INFO', '╚═══════════════════════════════════════════════════╝');
  FORCE_LOG('INFO', `File: ${fileName}`);
  FORCE_LOG('INFO', `MIME: ${mimeType}`);
  FORCE_LOG('INFO', `Content Length: ${content?.length || 0} chars`);

  try {
    // STEP 1: Normalize
    FORCE_LOG('INFO', '[STEP 1/4] Normalizing buffer...');
    const buffer = normalizeToBuffer(content, mimeType, fileName);
    FORCE_LOG('INFO', `✓ Buffer created: ${buffer.length} bytes`);

    // STEP 2: Validate
    FORCE_LOG('INFO', '[STEP 2/4] Validating file...');
    validateFileSize(buffer, fileName);
    validateFileSignature(buffer, fileName);
    FORCE_LOG('INFO', '✓ Validation passed');

    const ext = fileName.toLowerCase();

    // STEP 3: Process Images
    if (mimeType.startsWith('image/')) {
      FORCE_LOG('INFO', '[STEP 3/4] Processing as IMAGE');
      const result = JSON.stringify({
        type: 'image',
        base64: buffer.toString('base64'),
        mimeType,
        fileName,
      });

      const processingTime = Date.now() - startTime;
      FORCE_LOG('INFO', `✓ Image processed in ${processingTime}ms`);
      FORCE_LOG('INFO', '╚═══════════════════════════════════════════════════╝');
      return result;
    }

    // STEP 4: Process Structured Documents
    const isStructuredDoc =
      ext.endsWith('.pdf') ||
      ext.endsWith('.docx') ||
      ext.endsWith('.pptx') ||
      ext.endsWith('.xlsx') ||
      ext.endsWith('.doc') ||
      ext.endsWith('.ppt') ||
      ext.endsWith('.xls');

    if (isStructuredDoc) {
      FORCE_LOG('INFO', '[STEP 3/4] Processing as STRUCTURED DOCUMENT');
      let markdown: string;

      try {
        FORCE_LOG('DEBUG', 'Primary: Attempting LlamaParse...');
        markdown = await parseWithLlamaParse(buffer, fileName, mimeType);
        FORCE_LOG('INFO', '✓ LlamaParse succeeded');
      } catch (parseError) {
        FORCE_LOG('WARN', '✗ LlamaParse failed, switching to fallback');
        markdown = await fallbackTextExtraction(buffer, fileName);
      }

      const processingTime = Date.now() - startTime;
      FORCE_LOG('INFO', `[STEP 4/4] Formatting output...`);

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

[INSTRUCTION TO AI: The above is structured markdown extracted from ${fileName}. Headers use #, tables use |, lists use - or numbers. Treat as authoritative study material.]`;

      FORCE_LOG('INFO', `✓ Final output: ${result.length} characters`);
      FORCE_LOG('INFO', `✓ Total processing time: ${processingTime}ms`);
      FORCE_LOG('INFO', '╚═══════════════════════════════════════════════════╝');
      return result;
    }

    // STEP 5: Process Plain Text/Code
    FORCE_LOG('INFO', '[STEP 3/4] Processing as PLAIN TEXT/CODE');
    const textContent = buffer.toString('utf-8');

    const result = `<CODE_CONTEXT>
  <FILENAME>${fileName}</FILENAME>
  <TYPE>${mimeType}</TYPE>
  <CONTENT>
${textContent}
  </CONTENT>
</CODE_CONTEXT>`;

    const processingTime = Date.now() - startTime;
    FORCE_LOG('INFO', `✓ Text processed: ${result.length} chars in ${processingTime}ms`);
    FORCE_LOG('INFO', '╚═══════════════════════════════════════════════════╝');
    return result;

  } catch (error) {
    FORCE_LOG('ERROR', '╔═══════════════════════════════════════════════════╗');
    FORCE_LOG('ERROR', '║  PROCESSING FAILED - CRITICAL ERROR               ║');
    FORCE_LOG('ERROR', '╚═══════════════════════════════════════════════════╝');
    FORCE_LOG('ERROR', 'Error Type:', (error as Error)?.name);
    FORCE_LOG('ERROR', 'Error Message:', (error as Error)?.message);
    FORCE_LOG('ERROR', 'Stack Trace:', (error as Error)?.stack);

    if (error instanceof FileProcessingError) {
      throw error;
    }

    throw new FileProcessingError(
      'Unexpected error during file processing',
      'UNKNOWN_ERROR',
      fileName,
      {
        errorType: (error as Error)?.name,
        errorMessage: (error as Error)?.message,
        stack: (error as Error)?.stack,
      }
    );
  }
}

// ---------------------------------------------------------------------------
// HEALTH CHECK
// ---------------------------------------------------------------------------

export async function healthCheckLlamaParse(): Promise<boolean> {
  FORCE_LOG('INFO', 'Running LlamaParse health check...');

  try {
    const apiKey = getLlamaCloudKey();
    const hasKey = !!apiKey;

    FORCE_LOG('INFO', `Health Check Result: ${hasKey ? 'PASS' : 'FAIL'}`);
    FORCE_LOG('INFO', `API Key Present: ${hasKey}`);
    FORCE_LOG('INFO', `API Key Length: ${apiKey?.length || 0}`);

    return hasKey;
  } catch (e) {
    FORCE_LOG('ERROR', 'Health check FAILED', e);
    return false;
  }
}