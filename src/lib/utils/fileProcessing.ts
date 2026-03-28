import "@/lib/polyfills";

/**
 * EdBox File Processing Pipeline
 *
 * Routing logic:
 *   image/*                       → Gemini Vision (OCR + description, no Tesseract)
 *   structured doc ≤ 5MB          → Gemini inline (fast, no external service)
 *   structured doc > 5MB          → LlamaCloud (handles large/complex PDFs)
 *   either parser fails            → fallback (pdf-parse / office-text-extractor)
 *
 * @version 4.0.0
 */

import { getLlamaCloudKey } from "@/lib/ai-providers";
import pdf from "pdf-parse";
import { getTextExtractor } from "office-text-extractor";

// ─── 1. Logger ────────────────────────────────────────────────────────────────
// Single writer. ERROR → stderr (triggers alerts). Everything else → stdout.
// No duplicate writes. No ASCII art boxes.

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

function log(level: LogLevel, message: string, context?: unknown): void {
  const entry = `[${new Date().toISOString()}] [EDBOX-${level}] ${message}${
    context !== undefined ? ' ' + JSON.stringify(context) : ''
  }`;

  if (level === 'ERROR') {
    console.error(entry);
  } else {
    console.log(entry);
  }
}

// ─── 2. Config ────────────────────────────────────────────────────────────────

const CONFIG = {
  /** Hard ceiling — reject before processing */
  MAX_FILE_SIZE: 25 * 1024 * 1024,       // 25 MB

  /** Files at or below this go to Gemini inline. Above → LlamaCloud. */
  GEMINI_DIRECT_LIMIT: 5 * 1024 * 1024,  // 5 MB

  /** LlamaCloud parse timeout */
  LLAMA_TIMEOUT_MS: 120_000,             // 2 min

  /** Fallback extraction char cap — prevents unbounded strings reaching AI */
  FALLBACK_CHAR_LIMIT: 100_000,

  /** Gemini model — verified correct as of 2025 */
  GEMINI_MODEL: 'gemini-2.0-flash',
} as const;

/** Extensions routed through the structured-document parsers */
const STRUCTURED_EXTENSIONS = new Set([
  'pdf', 'docx', 'pptx', 'xlsx', 'doc', 'ppt', 'xls',
]);

const FILE_SIGNATURES: Record<string, readonly number[]> = {
  pdf:  [0x25, 0x50, 0x44, 0x46], // %PDF
  png:  [0x89, 0x50, 0x4E, 0x47],
  jpg:  [0xFF, 0xD8, 0xFF],
  jpeg: [0xFF, 0xD8, 0xFF],
  docx: [0x50, 0x4B, 0x03, 0x04], // ZIP-based (same as pptx/xlsx)
  pptx: [0x50, 0x4B, 0x03, 0x04],
  xlsx: [0x50, 0x4B, 0x03, 0x04],
};

// ─── 3. Error Types ───────────────────────────────────────────────────────────

export class FileProcessingError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly fileName: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'FileProcessingError';
    // Log at construction time so every thrown error is always visible
    log('ERROR', `[${code}] ${message}`, { fileName, cause });
  }
}

// ─── 4. Buffer Normalization ──────────────────────────────────────────────────

/**
 * Converts the incoming string (data URI, base64, or raw UTF-8) to a Buffer.
 *
 * Base64 detection uses a SAMPLE of the string, not a full-string regex,
 * to avoid blocking the event loop on large inputs.
 */
export function normalizeToBuffer(content: string, fileName: string): Buffer {
  if (!content) {
    throw new FileProcessingError('File content is empty', 'EMPTY_CONTENT', fileName);
  }

  // Path 1: Data URI  →  "data:application/pdf;base64,JVBERi0x..."
  if (content.startsWith('data:')) {
    const commaIndex = content.indexOf(',');
    if (commaIndex === -1 || commaIndex === content.length - 1) {
      throw new FileProcessingError('Malformed data URI — missing payload', 'DECODE_ERROR', fileName);
    }
    const payload = content.slice(commaIndex + 1);
    const buffer = Buffer.from(payload, 'base64');
    log('DEBUG', `Data URI decoded: ${buffer.length} bytes`, { fileName });
    return buffer;
  }

  // Path 2: Pure base64 — sample-based detection (O(1), not O(n))
  // Sample the first 500 chars and the last 50 chars.
  // Valid base64 will pass; raw text (e.g. JSON, markdown) will fail.
  if (content.length > 100) {
    const head = content.slice(0, 500).replace(/\s/g, '');
    const tail = content.slice(-50).replace(/\s/g, '');
    const sample = head + tail;
    const isBase64 =
      content.replace(/\s/g, '').length % 4 === 0 &&
      /^[A-Za-z0-9+/]+=*$/.test(sample);

    if (isBase64) {
      try {
        const buffer = Buffer.from(content.replace(/\s/g, ''), 'base64');
        if (buffer.length > 0 && buffer.length < content.length) {
          log('DEBUG', `Base64 decoded: ${buffer.length} bytes`, { fileName });
          return buffer;
        }
      } catch {
        // Fall through to UTF-8
      }
    }
  }

  // Path 3: Raw text / source code
  const buffer = Buffer.from(content, 'utf-8');
  log('DEBUG', `UTF-8 buffer: ${buffer.length} bytes`, { fileName });
  return buffer;
}

// ─── 5. Validation ────────────────────────────────────────────────────────────

function validateFileSize(buffer: Buffer, fileName: string): void {
  if (buffer.length === 0) {
    throw new FileProcessingError('File is empty (0 bytes)', 'EMPTY_FILE', fileName);
  }
  if (buffer.length > CONFIG.MAX_FILE_SIZE) {
    throw new FileProcessingError(
      `File exceeds ${CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB limit`,
      'FILE_TOO_LARGE',
      fileName,
      { sizeBytes: buffer.length, limitBytes: CONFIG.MAX_FILE_SIZE }
    );
  }
}

function validateFileSignature(buffer: Buffer, fileName: string): void {
  const ext = fileName.toLowerCase().split('.').pop() ?? '';
  const expected = FILE_SIGNATURES[ext];
  if (!expected) return; // No signature check for unknown extensions

  const actual = Array.from(buffer.subarray(0, 4));
  const matches = expected.every((byte, i) => actual[i] === byte);

  if (!matches) {
    throw new FileProcessingError(
      `File signature mismatch for .${ext} — file may be corrupted or misnamed`,
      'INVALID_FILE_SIGNATURE',
      fileName,
      { expected: Array.from(expected), actual }
    );
  }
}

// ─── 6. Parser: Gemini ────────────────────────────────────────────────────────
// Handles both structured documents (≤5MB) and images (any size).
// Images are routed here instead of Tesseract — Gemini Vision handles OCR
// natively with no WASM, no CDN deps, no serverless compatibility issues.

type GeminiParseMode = 'document' | 'image';

async function parseWithGemini(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  mode: GeminiParseMode
): Promise<string> {
  log('INFO', `Gemini parse start [${mode}]: ${fileName} (${(buffer.length / 1024).toFixed(1)} KB)`);

  const { getGeminiKeys } = await import('@/lib/ai-providers');
  const keys = getGeminiKeys();
  if (!keys.length) {
    throw new FileProcessingError('No Gemini API key available', 'NO_API_KEY', fileName);
  }

  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(keys[0]);
  const model = genAI.getGenerativeModel({ model: CONFIG.GEMINI_MODEL });

  const ext = fileName.toLowerCase().split('.').pop() ?? '';
  const resolvedMime = mimeType || resolveDocumentMime(ext);

  const prompt = mode === 'image'
    ? `Extract all text visible in this image using OCR. Then briefly describe any diagrams, charts, or visual elements that contain information relevant for studying.

Format:
## Extracted Text
[all readable text]

## Visual Elements
[descriptions of diagrams/charts/figures, or "None" if not present]

Output only the above structure, no commentary.`
    : `Extract ALL text content from this document. Preserve structure using markdown:
- # headers for titles and sections
- | tables for tabular data
- - or numbered lists for list items
- Preserve paragraph breaks
- Include all text, captions, and footnotes

Output ONLY the extracted markdown text, no commentary.`;

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: resolvedMime,
        data: buffer.toString('base64'),
      },
    },
    { text: prompt },
  ]);

  const text = result.response.text();
  if (!text?.trim()) {
    throw new FileProcessingError('Gemini returned empty response', 'EMPTY_RESPONSE', fileName);
  }

  log('INFO', `Gemini parse success: ${text.length} chars extracted`, { fileName });
  return text;
}

function resolveDocumentMime(ext: string): string {
  const mimeMap: Record<string, string> = {
    pdf:  'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    doc:  'application/msword',
    ppt:  'application/vnd.ms-powerpoint',
    xls:  'application/vnd.ms-excel',
    png:  'image/png',
    jpg:  'image/jpeg',
    jpeg: 'image/jpeg',
    gif:  'image/gif',
    webp: 'image/webp',
  };
  return mimeMap[ext] ?? 'application/octet-stream';
}

// ─── 7. Parser: LlamaCloud ────────────────────────────────────────────────────
// Uses the LlamaParse REST API directly via fetch — no package client, no type
// fights. The documented API flow is:
//   POST /api/parsing/upload      → { id: jobId }
//   GET  /api/parsing/job/{id}    → { status: 'PENDING'|'SUCCESS'|'ERROR' }
//   GET  /api/parsing/job/{id}/result/markdown → { pages: [{ md }] }
//
// All steps run inside a single timeout race against CONFIG.LLAMA_TIMEOUT_MS.

const LLAMA_BASE_URL = 'https://api.cloud.llamaindex.ai';
const POLL_INTERVAL_MS = 2_000;  // poll every 2s
const POLL_MAX_ATTEMPTS = 55;    // 55 × 2s = 110s — safely within 120s timeout

async function llamaFetch<T>(
  path: string,
  apiKey: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${LLAMA_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`LlamaParse ${options.method ?? 'GET'} ${path} → ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

async function parseWithLlamaCloud(buffer: Buffer, fileName: string): Promise<string> {
  log('INFO', `LlamaCloud parse start: ${fileName} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);

  const apiKey = getLlamaCloudKey();
  if (!apiKey) {
    throw new FileProcessingError('LlamaCloud API key not available', 'NO_API_KEY', fileName);
  }

  const parsePromise = (async () => {
    const ext = fileName.split('.').pop()?.toLowerCase() ?? 'bin';
    const mimeType = resolveDocumentMime(ext);

    // Step 1: Upload file
    const form = new FormData();
    form.append('file', new Blob([buffer], { type: mimeType }), `upload.${ext}`);
    form.append('parsing_instruction', 'Extract all text preserving document structure. Use markdown tables for tabular data.');
    form.append('result_type', 'markdown');

    const upload = await llamaFetch<{ id: string }>(
      '/api/parsing/upload',
      apiKey,
      { method: 'POST', body: form }
    );

    const jobId = upload.id;
    if (!jobId) {
      throw new FileProcessingError('LlamaCloud upload returned no job ID', 'UPLOAD_FAILED', fileName);
    }
    log('DEBUG', `LlamaCloud job created: ${jobId}`, { fileName });

    // Step 2: Poll until SUCCESS or terminal failure
    let attempts = 0;
    while (attempts < POLL_MAX_ATTEMPTS) {
      await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
      attempts++;

      const { status } = await llamaFetch<{ status: string }>(
        `/api/parsing/job/${jobId}`,
        apiKey
      );
      log('DEBUG', `LlamaCloud poll ${attempts}/${POLL_MAX_ATTEMPTS}: ${status}`, { jobId });

      if (status === 'SUCCESS') break;
      if (status === 'ERROR' || status === 'CANCELLED') {
        throw new FileProcessingError(
          `LlamaCloud job ended with status: ${status}`,
          'PARSE_FAILED',
          fileName,
          { jobId, status }
        );
      }
      // PENDING | PROCESSING → keep polling
    }

    if (attempts >= POLL_MAX_ATTEMPTS) {
      throw new FileProcessingError(
        `LlamaCloud job did not complete after ${POLL_MAX_ATTEMPTS} polls`,
        'TIMEOUT',
        fileName,
        { jobId }
      );
    }

    // Step 3: Fetch markdown result
    const result = await llamaFetch<{ pages: Array<{ md?: string; text?: string }> }>(
      `/api/parsing/job/${jobId}/result/markdown`,
      apiKey
    );

    const pages = (result.pages ?? []).map((page, i) => {
      const text = (page.md ?? page.text ?? '').trim();
      if (!text) log('WARN', `LlamaCloud page ${i + 1} empty`, { jobId });
      return `--- PAGE ${i + 1} ---\n${text}`;
    });

    if (pages.length === 0) {
      throw new FileProcessingError('LlamaCloud returned zero pages', 'EMPTY_RESPONSE', fileName, { jobId });
    }

    const combined = pages.join('\n\n');
    log('INFO', `LlamaCloud parse success: ${combined.length} chars, ${pages.length} pages`, { fileName });
    return combined;
  })();

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new FileProcessingError(
        `LlamaCloud parse timed out after ${CONFIG.LLAMA_TIMEOUT_MS / 1000}s`,
        'TIMEOUT',
        fileName
      )),
      CONFIG.LLAMA_TIMEOUT_MS
    )
  );

  return Promise.race([parsePromise, timeoutPromise]);
}

// ─── 8. Parser: Fallback ──────────────────────────────────────────────────────
// Last resort. Uses well-tested local libraries with no external dependencies.
// Deliberately excludes the BT/ET PDF regex strategy — it produces PostScript
// operator garbage that degrades AI output quality.

async function parseWithFallback(buffer: Buffer, fileName: string): Promise<string> {
  log('WARN', `Fallback extraction: ${fileName}`);
  const ext = fileName.toLowerCase().split('.').pop() ?? '';

  // Strategy 1: pdf-parse (reliable for text-layer PDFs)
  if (ext === 'pdf') {
    try {
      const data = await pdf(buffer);
      if (data.text?.trim()) {
        const text = data.text.slice(0, CONFIG.FALLBACK_CHAR_LIMIT);
        log('INFO', `Fallback pdf-parse success: ${text.length} chars, ${data.numpages} pages`, { fileName });
        return text;
      }
    } catch (e) {
      log('WARN', 'Fallback pdf-parse failed', { fileName, error: (e as Error).message });
    }
  }

  // Strategy 2: office-text-extractor (docx, pptx, xlsx)
  if (['docx', 'pptx', 'xlsx', 'doc', 'ppt', 'xls'].includes(ext)) {
    try {
      const extractor = getTextExtractor();
      const result = await extractor.extractText({ input: buffer, type: 'buffer' });
      const text = (typeof result === 'string' ? result : (result as { text?: string })?.text ?? '').trim();
      if (text) {
        const truncated = text.slice(0, CONFIG.FALLBACK_CHAR_LIMIT);
        log('INFO', `Fallback office-extractor success: ${truncated.length} chars`, { fileName });
        return truncated;
      }
    } catch (e) {
      log('WARN', 'Fallback office-text-extractor failed', { fileName, error: (e as Error).message });
    }
  }

  // Strategy 3: UTF-8 text (source code, markdown, plain text files)
  const text = buffer.toString('utf-8').slice(0, CONFIG.FALLBACK_CHAR_LIMIT);
  const printableRatio = (text.match(/[\x20-\x7E]/g)?.length ?? 0) / (text.length || 1);

  if (printableRatio < 0.3) {
    throw new FileProcessingError(
      'File appears to be binary or encrypted — no readable text extractable',
      'BINARY_FILE',
      fileName,
      { printableRatio }
    );
  }

  log('INFO', `Fallback UTF-8 success: ${text.length} chars (printable ratio: ${(printableRatio * 100).toFixed(0)}%)`, { fileName });
  return text;
}

// ─── 9. Output Formatter ──────────────────────────────────────────────────────
// Pure function — no I/O, fully testable.

interface DocumentMetadata {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  parser: string;
  processingTimeMs: number;
}

function formatDocumentOutput(content: string, meta: DocumentMetadata): string {
  return `<DOCUMENT_CONTEXT>
  <METADATA>
    <FILENAME>${meta.fileName}</FILENAME>
    <TYPE>${meta.mimeType}</TYPE>
    <SIZE_KB>${(meta.sizeBytes / 1024).toFixed(1)}</SIZE_KB>
    <PARSER>${meta.parser}</PARSER>
    <PROCESSING_TIME_MS>${meta.processingTimeMs}</PROCESSING_TIME_MS>
  </METADATA>
  <CONTENT>
${content}
  </CONTENT>
</DOCUMENT_CONTEXT>

[INSTRUCTION TO AI: The above is structured content extracted from ${meta.fileName}. Headers use #, tables use |, lists use - or numbers. Treat as authoritative study material.]`;
}

function formatCodeOutput(content: string, fileName: string, mimeType: string): string {
  return `<CODE_CONTEXT>
  <FILENAME>${fileName}</FILENAME>
  <TYPE>${mimeType}</TYPE>
  <CONTENT>
${content}
  </CONTENT>
</CODE_CONTEXT>`;
}

// ─── 10. Main Pipeline ────────────────────────────────────────────────────────

export async function processFileContent(
  content: string,
  mimeType: string,
  fileName: string
): Promise<string> {
  const startTime = Date.now();
  log('INFO', `Processing start: ${fileName}`, { mimeType, contentLength: content?.length ?? 0 });

  // Step 1: Normalize to buffer
  const buffer = normalizeToBuffer(content, fileName);
  log('INFO', `Buffer ready: ${buffer.length} bytes`, { fileName });

  // Step 2: Validate
  validateFileSize(buffer, fileName);
  validateFileSignature(buffer, fileName);

  const ext = fileName.toLowerCase().split('.').pop() ?? '';
  const isImage = mimeType.startsWith('image/');
  const isStructured = STRUCTURED_EXTENSIONS.has(ext);

  // Step 3a: Images → Gemini Vision
  if (isImage) {
    log('INFO', `Route: image → Gemini Vision`, { fileName });
    try {
      const extracted = await parseWithGemini(buffer, fileName, mimeType, 'image');
      const processingTimeMs = Date.now() - startTime;
      return formatDocumentOutput(extracted, {
        fileName, mimeType, sizeBytes: buffer.length,
        parser: 'Gemini Vision', processingTimeMs,
      });
    } catch (e) {
      // Images have no meaningful fallback — surface the error
      throw new FileProcessingError(
        'Image parsing failed',
        'IMAGE_PARSE_FAILED',
        fileName,
        e
      );
    }
  }

  // Step 3b: Structured documents → Gemini (≤5MB) or LlamaCloud (>5MB), with fallback
  if (isStructured) {
    let markdown: string;
    let parserUsed: string;

    if (buffer.length <= CONFIG.GEMINI_DIRECT_LIMIT) {
      log('INFO', `Route: structured doc ≤5MB → Gemini`, { fileName });
      try {
        markdown = await parseWithGemini(buffer, fileName, mimeType, 'document');
        parserUsed = 'Gemini';
      } catch (geminiError) {
        log('WARN', `Gemini failed — falling back to local extraction`, { fileName });
        markdown = await parseWithFallback(buffer, fileName);
        parserUsed = 'Fallback (pdf-parse / office-extractor)';
      }
    } else {
      log('INFO', `Route: structured doc >5MB → LlamaCloud`, { fileName });
      try {
        markdown = await parseWithLlamaCloud(buffer, fileName);
        parserUsed = 'LlamaCloud';
      } catch (llamaError) {
        log('WARN', `LlamaCloud failed — falling back to local extraction`, { fileName });
        markdown = await parseWithFallback(buffer, fileName);
        parserUsed = 'Fallback (pdf-parse / office-extractor)';
      }
    }

    const processingTimeMs = Date.now() - startTime;
    log('INFO', `Processing complete: ${processingTimeMs}ms, parser=${parserUsed}`, { fileName });

    return formatDocumentOutput(markdown, {
      fileName, mimeType, sizeBytes: buffer.length, parser: parserUsed, processingTimeMs,
    });
  }

  // Step 3c: Plain text / source code
  log('INFO', `Route: plain text`, { fileName });
  const textContent = buffer.toString('utf-8');
  return formatCodeOutput(textContent, fileName, mimeType);
}

// ─── 11. Utility Exports ──────────────────────────────────────────────────────
// Kept for compatibility with callers that import these directly.

export function isImageType(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

export function isPDFType(mimeType: string): boolean {
  return mimeType === 'application/pdf' || mimeType.toLowerCase().includes('pdf');
}

export function bufferToBase64(buffer: Buffer): string {
  return buffer.toString('base64');
}

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer);
    return data.text ?? '';
  } catch (e) {
    log('ERROR', 'extractTextFromPDF failed', { error: (e as Error).message });
    return '';
  }
}

export async function extractTextFromPPTX(buffer: Buffer): Promise<string> {
  try {
    const extractor = getTextExtractor();
    const result = await extractor.extractText({ input: buffer, type: 'buffer' });
    return typeof result === 'string' ? result : (result as { text?: string })?.text ?? '';
  } catch (e) {
    log('ERROR', 'extractTextFromPPTX failed', { error: (e as Error).message });
    return '';
  }
}

// ─── 12. Health Check ─────────────────────────────────────────────────────────
// Hits the LlamaParse jobs list endpoint — lightweight, read-only, confirms
// both auth and connectivity without burning parsing credits.

export async function healthCheckLlamaCloud(): Promise<{ healthy: boolean; latencyMs?: number; error?: string }> {
  const apiKey = getLlamaCloudKey();
  if (!apiKey) {
    return { healthy: false, error: 'API key not configured' };
  }

  const start = Date.now();
  try {
    await llamaFetch('/api/parsing/job?limit=1', apiKey);
    return { healthy: true, latencyMs: Date.now() - start };
  } catch (e) {
    return { healthy: false, latencyMs: Date.now() - start, error: (e as Error).message };
  }
}
