import { generateWithRetry } from './ai-providers';

const STUDY_KIT_MODEL = 'gemini-3-flash-preview';
import type {
  DetectedChapter,
  ChapterDetectionResult,
  ChapterDetectionOptions,
  DocumentAnalysis,
  ChapterRelationships,
  ChapterRecommendations,
  DetectionMethod,
  DocumentType,
  StructuralPattern
} from '../types/chapters';

const DEFAULT_OPTIONS: ChapterDetectionOptions = {
  minChapters: 1,
  maxChapters: 10,
  minChapterLength: 3000,
  preferExplicit: true,
  maxTokens: 4000
};

const MAX_CHUNK_SIZE = 50000;
const MAX_TOTAL_SIZE = 10 * 1024 * 1024;

function chunkLargeText(text: string, chunkSize: number = MAX_CHUNK_SIZE): string[] {
  if (text.length <= chunkSize) return [text];
  
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    let end = Math.min(start + chunkSize, text.length);
    
    if (end < text.length) {
      const searchStart = Math.max(start, end - 1000);
      const searchText = text.slice(searchStart, Math.min(end + 1000, text.length));
      
      const paragraphBreak = searchText.lastIndexOf('\n\n');
      const sentenceBreak = searchText.lastIndexOf('. ');
      const lineBreak = searchText.lastIndexOf('\n');
      
      if (paragraphBreak > 0) {
        end = searchStart + paragraphBreak;
      } else if (sentenceBreak > 0) {
        end = searchStart + sentenceBreak + 1;
      } else if (lineBreak > 0) {
        end = searchStart + lineBreak;
      }
    }
    
    chunks.push(text.slice(start, end));
    start = end;
  }
  
  return chunks;
}

interface ChunkProcessingResult {
  chapters: DetectedChapter[];
  documentType: DocumentType;
  totalChunks: number;
  processedChunks: number;
}

async function processChunkForChapters(
  chunk: string,
  chunkIndex: number,
  totalChunks: number,
  options: ChapterDetectionOptions
): Promise<DetectedChapter[] | null> {
  const chunkSize = 20000;
  const subChunks: string[] = [];
  
  for (let i = 0; i < chunk.length; i += chunkSize) {
    subChunks.push(chunk.slice(i, i + chunkSize));
  }
  
  const boundaryPrompt = buildSophisticatedDetectionPrompt(chunk, subChunks, 3, chunkIndex, totalChunks);
  
  try {
    const result = await generateWithRetry({
      prompt: boundaryPrompt,
      systemPrompt: SEMANTIC_DETECTION_SYSTEM_PROMPT,
      temperature: 0.2,
      maxTokens: options.maxTokens || 4000,
    });
    
    const parsed = parseDetectionResponse(result.text);
    
    if (!parsed?.chapters || parsed.chapters.length < 1) {
      return null;
    }
    
    return parsed.chapters.map((ch, i) => ({
      id: `ch_${chunkIndex}_${i + 1}`,
      chapterNumber: ch.chapterNumber || i + 1,
      title: ch.title || `Section ${chunkIndex + 1}.${i + 1}`,
      summary: ch.summary || '',
      keyTopics: ch.keyTopics || [],
      learningObjectives: ch.learningObjectives || [],
      startPosition: ch.startPosition || 0,
      endPosition: ch.endPosition || chunk.length,
      contentPreview: ch.contentPreview || '',
      sourceContext: chunk.slice(ch.startPosition || 0, ch.endPosition || chunk.length),
      confidence: ch.confidence || 0.7,
      boundaryReason: ch.boundaryReason || '',
      relationshipToPrevious: ch.relationshipToPrevious || null,
      relationshipToNext: ch.relationshipToNext || null,
      detectionMethod: 'semantic' as DetectionMethod
    }));
  } catch (error) {
    console.error(`Chunk ${chunkIndex} detection failed:`, error);
    return null;
  }
}

export async function detectChaptersFromLargeFile(
  text: string,
  options: ChapterDetectionOptions = {}
): Promise<ChapterDetectionResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  if (text.length > MAX_TOTAL_SIZE) {
    console.warn(`File size (${text.length} chars) exceeds maximum (${MAX_TOTAL_SIZE}). Truncating.`);
    text = text.slice(0, MAX_TOTAL_SIZE);
  }
  
  const chunks = chunkLargeText(text, MAX_CHUNK_SIZE);
  const totalChunks = chunks.length;
  
  console.log(`Processing large file in ${totalChunks} chunks...`);
  
  const chunkResults = await Promise.all(
    chunks.map((chunk, index) => 
      processChunkForChapters(chunk, index, totalChunks, opts)
    )
  );
  
  const allChapters: DetectedChapter[] = [];
  let globalOffset = 0;
  
  for (let i = 0; i < chunkResults.length; i++) {
    const chapters = chunkResults[i];
    const chunkStart = i === 0 ? 0 : chunks.slice(0, i).join('').length;
    
    if (chapters) {
      for (const ch of chapters) {
        allChapters.push({
          ...ch,
          startPosition: ch.startPosition + chunkStart,
          endPosition: ch.endPosition + chunkStart,
          sourceContext: text.slice(ch.startPosition + chunkStart, ch.endPosition + chunkStart)
        });
      }
    } else {
      const fallbackChapter: DetectedChapter = {
        id: `ch_fallback_${i}`,
        chapterNumber: allChapters.length + 1,
        title: `Section ${i + 1}`,
        summary: `Content from document section ${i + 1}`,
        keyTopics: [],
        learningObjectives: [],
        startPosition: chunkStart,
        endPosition: chunkStart + chunks[i].length,
        contentPreview: chunks[i].slice(0, 200),
        sourceContext: chunks[i],
        confidence: 0.4,
        boundaryReason: 'Fallback from chunk processing',
        relationshipToPrevious: i === 0 ? null : 'Continues from previous section',
        relationshipToNext: i === chunks.length - 1 ? null : 'Continues in next section',
        detectionMethod: 'fallback' as DetectionMethod
      };
      allChapters.push(fallbackChapter);
    }
  }
  
  const mergedChapters = mergeAdjacentChapters(allChapters, opts.minChapterLength || 3000);
  const finalChapters = postProcessChapters(mergedChapters, text, opts.minChapterLength || 3000);
  
  return buildDetectionResult(finalChapters, text);
}

function mergeAdjacentChapters(
  chapters: DetectedChapter[],
  minLength: number
): DetectedChapter[] {
  if (chapters.length <= 1) return chapters;
  
  const result: DetectedChapter[] = [];
  
  for (const chapter of chapters) {
    const lastChapter = result[result.length - 1];
    
    if (lastChapter && chapter.sourceContext.length < minLength) {
      lastChapter.sourceContext += '\n\n' + chapter.sourceContext;
      lastChapter.endPosition = chapter.endPosition;
      lastChapter.confidence = Math.min(lastChapter.confidence, chapter.confidence);
      lastChapter.keyTopics = Array.from(new Set([...lastChapter.keyTopics, ...chapter.keyTopics]));
      lastChapter.summary = lastChapter.summary + ' ' + chapter.summary;
    } else if (lastChapter && lastChapter.sourceContext.length < minLength) {
      lastChapter.sourceContext += '\n\n' + chapter.sourceContext;
      lastChapter.endPosition = chapter.endPosition;
      lastChapter.confidence = Math.min(lastChapter.confidence, chapter.confidence);
      lastChapter.keyTopics = Array.from(new Set([...lastChapter.keyTopics, ...chapter.keyTopics]));
      lastChapter.summary = lastChapter.summary + ' ' + chapter.summary;
    } else {
      result.push({ ...chapter });
    }
  }
  
  return result;
}

interface ExplicitMarkerConfig {
  patterns: RegExp[];
  confidence: number;
}

const EXPLICIT_MARKERS: ExplicitMarkerConfig[] = [
  {
    patterns: [
      /^chapter\s+\d+[.:]?\s*.+$/gim,
      /^unit\s+\d+[.:]?\s*.+$/gim,
      /^module\s+\d+[.:]?\s*.+$/gim,
      /^part\s+\d+[.:]?\s*.+$/gim,
      /^section\s+\d+[.:]?\s*.+$/gim,
    ],
    confidence: 0.95
  },
  {
    patterns: [
      /^\d+\.\s+[A-Z][^.]+$/gm,
      /^\d+\.\d+\s+[A-Z][^.]+$/gm,
      /^Step\s+\d+[.:]?\s*.+$/gim,
    ],
    confidence: 0.85
  },
  {
    patterns: [
      /^introduction\s*$/gim,
      /^conclusion\s*$/gim,
      /^summary\s*$/gim,
      /^overview\s*$/gim,
      /^background\s*$/gim,
      /^methodology\s*$/gim,
      /^results\s*$/gim,
      /^discussion\s*$/gim,
      /^references\s*$/gim,
      /^appendix\s*.*/gim,
    ],
    confidence: 0.75
  }
];

const SEMANTIC_DETECTION_SYSTEM_PROMPT = `
You are an expert Document Structure Analyst with deep expertise in:
- Academic writing conventions and structures
- Technical documentation organization
- Pedagogical content sequencing
- Information architecture and taxonomy

Your specialty is analyzing unstructured or semi-structured documents and identifying 
logical knowledge boundaries that would help learners organize their study.

You think like a master educator who understands how students learn and how 
information should be chunked for optimal comprehension and retention.
`;

function analyzeDocumentStatistics(text: string): string {
  const paragraphs = text.split(/\n\n+/).length;
  const sentences = text.split(/[.!?]+/).length;
  const words = text.split(/\s+/).length;
  const avgWordLength = text.replace(/\s/g, '').length / Math.max(words, 1);
  const uniqueWords = new Set(text.toLowerCase().split(/\s+/)).size;
  const vocabularyRichness = uniqueWords / Math.max(words, 1);
  
  const potentialHeaders = text.match(/^[A-Z][A-Za-z\s]+$/gm) || [];
  const numberedSections = text.match(/^\d+\.\s+.+$/gm) || [];
  
  return `
- Paragraphs: ${paragraphs}
- Sentences: ${sentences}
- Words: ${words.toLocaleString()}
- Average Word Length: ${avgWordLength.toFixed(1)} characters
- Unique Words: ${uniqueWords.toLocaleString()}
- Vocabulary Richness: ${(vocabularyRichness * 100).toFixed(1)}%
- Potential Headers Detected: ${potentialHeaders.length}
- Numbered Sections: ${numberedSections.length}
`;
}

function detectDocumentType(text: string): DocumentType {
  const indicators = {
    textbook: /chapter|unit|lesson|exercise|learning objective|key terms|review questions/gi,
    research: /abstract|methodology|literature review|hypothesis|findings|discussion|references/gi,
    technical: /step 1|installation|configuration|troubleshooting|api|usage|example/gi,
    article: /introduction|conclusion|furthermore|moreover|in conclusion|to summarize/gi,
    reference: /see also|related topics|alphabetical|index|appendix|glossary/gi
  };
  
  const scores: Record<string, number> = {};
  
  for (const [type, pattern] of Object.entries(indicators)) {
    const matches = text.match(pattern) || [];
    scores[type] = matches.length;
  }
  
  const maxType = Object.entries(scores).reduce((a, b) => 
    a[1] > b[1] ? a : b
  )[0];
  
  return scores[maxType] > 5 ? maxType as DocumentType : 'unknown';
}

function buildSophisticatedDetectionPrompt(
  fullText: string,
  chunks: string[],
  maxChapters: number,
  chunkIndex?: number,
  totalChunks?: number
): string {
  const documentStats = analyzeDocumentStatistics(fullText);
  const detectedType = detectDocumentType(fullText);
  const chunkInfo = chunkIndex !== undefined && totalChunks !== undefined 
    ? `\n- This is chunk ${chunkIndex + 1} of ${totalChunks} from a large document`
    : '';
  
  return `
# DOCUMENT STRUCTURE ANALYSIS TASK

You are analyzing a document to identify optimal chapter/section boundaries for educational purposes.

## DOCUMENT METADATA
- Total Length: ${fullText.length.toLocaleString()} characters
- Estimated Pages: ${Math.ceil(fullText.length / 3000)}
- Document Type: ${detectedType}
- Chunk Count: ${chunks.length}${chunkInfo}

## DOCUMENT STATISTICS
${documentStats}

## YOUR ANALYTICAL FRAMEWORK

### Step 1: Document Type Identification
First, determine what kind of document this is:
- **Textbook/Educational**: Structured for learning, usually has clear progression
- **Research Paper**: IMRaD structure (Introduction, Methods, Results, Discussion)
- **Technical Guide**: Task-oriented, often procedural
- **Article/Essay**: Argument-driven, thematic organization
- **Reference Material**: Alphabetical or categorical organization
- **Narrative/Case Study**: Story-driven with plot points
- **Mixed/Hybrid**: Multiple document types combined

### Step 2: Structural Pattern Recognition
Identify the underlying structure:
- **Hierarchical**: Main topics with subtopics (tree structure)
- **Sequential**: Step-by-step progression (linear)
- **Comparative**: Multiple perspectives compared (parallel)
- **Problem-Solution**: Issues followed by resolutions
- **Chronological**: Time-based organization
- **Spiral**: Topics revisited with increasing depth

### Step 3: Boundary Detection Criteria
Mark chapter boundaries where you identify ANY of these signals:

**STRONG SIGNALS (Confidence 0.8-1.0):**
- Explicit section headers or numbered divisions
- Complete topic shift with new terminology
- Transition between theoretical and practical content
- New case study, example, or scenario introduction
- Methodology change in technical content
- Shift from exposition to analysis

**MODERATE SIGNALS (Confidence 0.5-0.7):**
- Paragraph clusters with cohesive sub-theme
- Introduction of new key terms or concepts
- Change in writing style or tone
- Transition from general to specific (or vice versa)
- New argument or perspective in persuasive content

**WEAK SIGNALS (Confidence 0.3-0.4):**
- Minor topic pivots within larger themes
- Brief tangential discussions
- Transitional paragraphs

### Step 4: Chapter Quality Validation
For each proposed chapter, verify:
1. **Coherence**: Does the content form a unified whole?
2. **Completeness**: Does it have a clear beginning, middle, and end?
3. **Independence**: Can it be understood without other chapters?
4. **Educational Value**: Does it represent a learnable unit?
5. **Appropriate Size**: Is it neither too brief nor too extensive?

## DOCUMENT CONTENT

${chunks.map((chunk, i) => `
=== CHUNK ${i + 1} of ${chunks.length} (Characters ${i * 20000} - ${Math.min((i + 1) * 20000, fullText.length)}) ===
${chunk}
`).join('\n')}

## REQUIRED OUTPUT FORMAT

Provide your analysis as a JSON object with this exact structure:

\`\`\`json
{
  "documentAnalysis": {
    "detectedType": "textbook|research|technical|article|reference|narrative|mixed",
    "structuralPattern": "hierarchical|sequential|comparative|problem-solution|chronological|spiral",
    "overallTheme": "One sentence describing the document's main subject",
    "targetAudience": "Who this document is written for",
    "complexity": "beginner|intermediate|advanced|mixed"
  },
  
  "chapters": [
    {
      "chapterNumber": 1,
      "title": "Descriptive Chapter Title (Not generic like 'Introduction')",
      "summary": "2-3 sentences explaining what this chapter covers and why it matters",
      "keyTopics": ["topic1", "topic2", "topic3"],
      "learningObjectives": ["What the reader will learn 1", "What the reader will learn 2"],
      "startPosition": 0,
      "endPosition": 5000,
      "contentPreview": "First 200 characters of this chapter's content...",
      "confidence": 0.95,
      "boundaryReason": "Why this is a chapter boundary",
      "relationshipToPrevious": null,
      "relationshipToNext": "Builds foundation for [next chapter topic]"
    },
    {
      "chapterNumber": 2,
      "title": "Next Chapter Title",
      "summary": "...",
      "keyTopics": ["..."],
      "learningObjectives": ["..."],
      "startPosition": 5000,
      "endPosition": 12000,
      "contentPreview": "...",
      "confidence": 0.85,
      "boundaryReason": "Topic shifts from X to Y",
      "relationshipToPrevious": "Extends the concepts from Chapter 1 by...",
      "relationshipToNext": "..."
    }
  ],
  
  "chapterRelationships": {
    "overallFlow": "Describe how chapters connect to form a coherent learning path",
    "prerequisites": {
      "chapter2": ["chapter1"],
      "chapter3": ["chapter1", "chapter2"]
    }
  },
  
  "recommendations": {
    "suggestedStudyOrder": [1, 2, 3, 4],
    "optionalChapters": [],
    "coreChapters": [1, 2, 3],
    "estimatedStudyTime": {
      "chapter1": "30 minutes",
      "chapter2": "45 minutes"
    }
  }
}
\`\`\`

## CRITICAL RULES

1. **Position Accuracy**: startPosition and endPosition must be accurate character positions
2. **No Overlaps**: Chapters must not overlap - each position belongs to exactly one chapter
3. **Complete Coverage**: All document content must be assigned to a chapter
4. **Meaningful Divisions**: Each chapter should represent a coherent, learnable unit
5. **Educational Focus**: Optimize for student comprehension, not just document structure
6. **Title Quality**: Titles should be descriptive and engaging, not generic
7. **Relationship Mapping**: Show how chapters build on each other
8. **Confidence Honesty**: Only assign high confidence to clear, unambiguous boundaries

## EDGE CASE HANDLING

- If document is too short for multiple chapters, return single chapter with confidence 1.0
- If no clear boundaries exist, create 2-3 balanced chapters based on content themes
- If document has explicit sections, respect them but validate they make educational sense
- If chapters would be very unbalanced, note this in recommendations

Analyze the document now and provide your structured output.
`;
}

function parseDetectionResponse(responseText: string): ChapterDetectionResult | null {
  try {
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    
    const objectStart = responseText.indexOf('{');
    const objectEnd = responseText.lastIndexOf('}');
    if (objectStart === -1 || objectEnd === -1) return null;

    let raw = responseText.slice(objectStart, objectEnd + 1);

    try {
      return JSON.parse(raw);
    } catch (e) {
      raw = raw
        .replace(/[\u0000-\u001F]/g, ' ')
        .replace(/\\(?!["\\\/bfnrtu])/g, '\\\\')
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/}\s*{/g, '},{');

      try {
        return JSON.parse(raw);
      } catch (e2) {
        const lastBrace = raw.lastIndexOf('}');
        if (lastBrace > 0) {
          try {
            return JSON.parse(raw.substring(0, lastBrace + 1));
          } catch (e3) {}
        }
        throw e2;
      }
    }
  } catch (error) {
    console.error('Failed to parse detection response:', error);
    return null;
  }
}

function detectExplicitMarkers(text: string): DetectedChapter[] | null {
  const matches: Array<{ pattern: RegExp; match: RegExpMatchArray; confidence: number }> = [];
  
  for (const config of EXPLICIT_MARKERS) {
    for (const pattern of config.patterns) {
      const found = Array.from(text.matchAll(pattern));
      if (found.length >= 2) {
        matches.push(...found.map(m => ({
          pattern,
          match: m,
          confidence: config.confidence
        })));
      }
    }
  }
  
  if (matches.length < 2) return null;
  
  matches.sort((a, b) => (a.match.index ?? 0) - (b.match.index ?? 0));
  
  const chapters: DetectedChapter[] = matches.map((m, i) => {
    const startPos = m.match.index ?? 0;
    const endPos = matches[i + 1]?.match?.index ?? text.length;
    const content = text.slice(startPos, endPos);
    
    return {
      id: `ch_${i + 1}`,
      chapterNumber: i + 1,
      title: m.match[0].trim(),
      summary: '',
      keyTopics: [],
      learningObjectives: [],
      startPosition: startPos,
      endPosition: endPos,
      contentPreview: content.slice(0, 200),
      sourceContext: content,
      confidence: m.confidence,
      boundaryReason: 'Explicit chapter/section heading detected',
      relationshipToPrevious: i === 0 ? null : 'Continues from previous section',
      relationshipToNext: i === matches.length - 1 ? null : 'Leads into next section',
      detectionMethod: 'explicit' as DetectionMethod
    };
  });
  
  return chapters;
}

async function detectSemanticBoundaries(
  text: string,
  maxChapters: number = 8,
  options: ChapterDetectionOptions = {}
): Promise<DetectedChapter[] | null> {
  const chunkSize = 20000;
  const chunks: string[] = [];
  
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  
  const boundaryPrompt = buildSophisticatedDetectionPrompt(text, chunks, maxChapters);
  
  try {
    const result = await generateWithRetry({
      prompt: boundaryPrompt,
      systemPrompt: SEMANTIC_DETECTION_SYSTEM_PROMPT,
      temperature: 0.2,
      maxTokens: options.maxTokens || 4000,
      geminiModel: STUDY_KIT_MODEL,
    });
    
    const parsed = parseDetectionResponse(result.text);
    
    if (!parsed?.chapters || parsed.chapters.length < 1) {
      return null;
    }
    
    return parsed.chapters.map((ch, i) => ({
      id: `ch_${i + 1}`,
      chapterNumber: ch.chapterNumber || i + 1,
      title: ch.title || `Section ${i + 1}`,
      summary: ch.summary || '',
      keyTopics: ch.keyTopics || [],
      learningObjectives: ch.learningObjectives || [],
      startPosition: ch.startPosition || 0,
      endPosition: ch.endPosition || text.length,
      contentPreview: ch.contentPreview || '',
      sourceContext: text.slice(ch.startPosition || 0, ch.endPosition || text.length),
      confidence: ch.confidence || 0.7,
      boundaryReason: ch.boundaryReason || '',
      relationshipToPrevious: ch.relationshipToPrevious || null,
      relationshipToNext: ch.relationshipToNext || null,
      detectionMethod: 'semantic' as DetectionMethod
    }));
  } catch (error) {
    console.error('Semantic detection failed:', error);
    return null;
  }
}

function createLengthBasedChapters(
  text: string,
  targetChapterLength: number = 15000
): DetectedChapter[] {
  const totalLength = text.length;
  const numChapters = Math.max(1, Math.ceil(totalLength / targetChapterLength));
  const chapterLength = Math.ceil(totalLength / numChapters);
  
  const chapters: DetectedChapter[] = [];
  
  for (let i = 0; i < numChapters; i++) {
    const start = i * chapterLength;
    let end = Math.min((i + 1) * chapterLength, totalLength);
    
    if (end < totalLength) {
      const searchStart = Math.max(start, end - 500);
      const searchText = text.slice(searchStart, Math.min(end + 500, totalLength));
      const paragraphBreak = searchText.lastIndexOf('\n\n');
      if (paragraphBreak > 0) {
        end = searchStart + paragraphBreak;
      }
    }
    
    const content = text.slice(start, end);
    
    chapters.push({
      id: `ch_${i + 1}`,
      chapterNumber: i + 1,
      title: `Section ${i + 1}`,
      summary: `Content from document section ${i + 1}`,
      keyTopics: [],
      learningObjectives: [],
      startPosition: start,
      endPosition: end,
      contentPreview: content.slice(0, 200),
      sourceContext: content,
      confidence: 0.3,
      boundaryReason: 'Length-based fallback division',
      relationshipToPrevious: i === 0 ? null : 'Continues from previous section',
      relationshipToNext: i === numChapters - 1 ? null : 'Continues in next section',
      detectionMethod: 'fallback' as DetectionMethod
    });
  }
  
  return chapters;
}

function mergeSmallChapters(
  chapters: DetectedChapter[],
  minLength: number
): DetectedChapter[] {
  const result: DetectedChapter[] = [];
  
  for (const chapter of chapters) {
    const lastChapter = result[result.length - 1];
    
    if (lastChapter && chapter.sourceContext.length < minLength) {
      lastChapter.sourceContext += '\n\n' + chapter.sourceContext;
      lastChapter.endPosition = chapter.endPosition;
      lastChapter.confidence = Math.min(lastChapter.confidence, chapter.confidence);
      lastChapter.keyTopics = Array.from(new Set([...lastChapter.keyTopics, ...chapter.keyTopics]));
    } else {
      result.push({ ...chapter });
    }
  }
  
  return result;
}

function fixOverlappingBoundaries(
  chapters: DetectedChapter[],
  fullText: string
): DetectedChapter[] {
  return chapters.map((ch, i) => {
    const nextChapter = chapters[i + 1];
    if (nextChapter && ch.endPosition > nextChapter.startPosition) {
      const midpoint = Math.floor((ch.endPosition + nextChapter.startPosition) / 2);
      return {
        ...ch,
        endPosition: midpoint,
        sourceContext: fullText.slice(ch.startPosition, midpoint)
      };
    }
    return ch;
  });
}

async function enrichChapterSummaries(
  chapters: DetectedChapter[]
): Promise<DetectedChapter[]> {
  const needsSummary = chapters.filter(c => !c.summary || c.summary.length < 20);
  
  if (needsSummary.length === 0) return chapters;
  
  const summaries = await Promise.all(
    needsSummary.map(async (ch) => {
      try {
        const result = await generateWithRetry({
          prompt: `Summarize this text in 2-3 sentences for educational purposes:\n\n${ch.sourceContext.slice(0, 2000)}`,
          systemPrompt: 'You are a concise summarizer. Output only the summary, no formatting.',
          temperature: 0.3,
          maxTokens: 150
        });
        return { id: ch.id, summary: result.text.trim() };
      } catch {
        return { id: ch.id, summary: 'Content from this section of the document.' };
      }
    })
  );
  
  const summaryMap = new Map(summaries.map(s => [s.id, s.summary]));
  
  return chapters.map(ch => ({
    ...ch,
    summary: ch.summary || summaryMap.get(ch.id) || ''
  }));
}

async function detectChaptersForLargeDocument(
  text: string,
  options: ChapterDetectionOptions
): Promise<DetectedChapter[]> {
  const CHUNK_SIZE = 50000;
  const chunks: string[] = [];
  
  for (let i = 0; i < text.length; i += CHUNK_SIZE) {
    chunks.push(text.slice(i, i + CHUNK_SIZE));
  }
  
  const chunkChapters = await Promise.all(
    chunks.map(chunk => detectSemanticBoundaries(chunk, 3, options))
  );
  
  const allChapters: DetectedChapter[] = [];
  let offset = 0;
  
  for (let i = 0; i < chunkChapters.length; i++) {
    const chapters = chunkChapters[i] || [{
      id: `temp_${i}`,
      chapterNumber: 1,
      title: `Section ${i + 1}`,
      summary: '',
      keyTopics: [],
      learningObjectives: [],
      startPosition: 0,
      endPosition: chunks[i].length,
      contentPreview: chunks[i].slice(0, 200),
      sourceContext: chunks[i],
      confidence: 0.5,
      boundaryReason: 'Large document chunk',
      relationshipToPrevious: null,
      relationshipToNext: null,
      detectionMethod: 'fallback' as DetectionMethod
    }];
    
    for (const ch of chapters) {
      allChapters.push({
        ...ch,
        startPosition: ch.startPosition + offset,
        endPosition: ch.endPosition + offset,
        sourceContext: text.slice(ch.startPosition + offset, ch.endPosition + offset)
      });
    }
    offset += chunks[i].length;
  }
  
  return postProcessChapters(allChapters, text, options.minChapterLength || 3000);
}

function postProcessChapters(
  chapters: DetectedChapter[],
  fullText: string,
  minLength: number
): DetectedChapter[] {
  let processed = mergeSmallChapters(chapters, minLength);
  processed = fixOverlappingBoundaries(processed, fullText);
  
  return processed.map((ch, i) => ({
    ...ch,
    id: `ch_${i + 1}`,
    chapterNumber: i + 1
  }));
}

export async function detectChapters(
  text: string,
  options: ChapterDetectionOptions = {}
): Promise<ChapterDetectionResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const {
    minChapters = 1,
    maxChapters = 10,
    minChapterLength = 3000,
    preferExplicit = true
  } = opts;
  
  if (!text?.trim() || text.length < minChapterLength) {
    return {
      documentAnalysis: {
        detectedType: 'unknown',
        structuralPattern: 'sequential',
        overallTheme: 'Single topic document',
        targetAudience: 'General learners',
        complexity: 'intermediate'
      },
      chapters: [{
        id: 'ch_1',
        chapterNumber: 1,
        title: 'Complete Document',
        summary: 'The entire document content as a single study unit.',
        keyTopics: [],
        learningObjectives: [],
        startPosition: 0,
        endPosition: text?.length || 0,
        contentPreview: text?.slice(0, 200) || '',
        sourceContext: text || '',
        confidence: 1.0,
        boundaryReason: 'Document too short for chapter division',
        relationshipToPrevious: null,
        relationshipToNext: null,
        detectionMethod: 'fallback'
      }],
      chapterRelationships: {
        overallFlow: 'Single cohesive document',
        prerequisites: {}
      },
      recommendations: {
        suggestedStudyOrder: [1],
        optionalChapters: [],
        coreChapters: [1],
        estimatedStudyTime: { chapter1: '10-15 minutes' }
      }
    };
  }
  
  if (text.length > 100000) {
    const chapters = await detectChaptersForLargeDocument(text, opts);
    return buildDetectionResult(chapters, text);
  }
  
  let chapters: DetectedChapter[] | null = null;
  
  if (preferExplicit) {
    chapters = detectExplicitMarkers(text);
    if (chapters && chapters.length >= minChapters) {
      chapters = postProcessChapters(chapters, text, minChapterLength);
      return buildDetectionResult(chapters, text);
    }
  }
  
  chapters = await detectSemanticBoundaries(text, maxChapters, opts);
  if (chapters && chapters.length >= minChapters) {
    chapters = postProcessChapters(chapters, text, minChapterLength);
    return buildDetectionResult(chapters, text);
  }
  
  chapters = createLengthBasedChapters(text);
  chapters = postProcessChapters(chapters, text, minChapterLength);
  
  return buildDetectionResult(chapters, text);
}

function buildDetectionResult(
  chapters: DetectedChapter[],
  fullText: string
): ChapterDetectionResult {
  const documentType = detectDocumentType(fullText);
  
  const documentAnalysis: DocumentAnalysis = {
    detectedType: documentType,
    structuralPattern: chapters.length > 1 ? 'hierarchical' : 'sequential',
    overallTheme: chapters[0]?.title || 'Document Analysis',
    targetAudience: 'Learners and students',
    complexity: 'intermediate'
  };
  
  const prerequisites: Record<string, string[]> = {};
  chapters.forEach((ch, i) => {
    if (i > 0) {
      prerequisites[`chapter${ch.chapterNumber}`] = [`chapter${chapters[i - 1].chapterNumber}`];
    }
  });
  
  const chapterRelationships: ChapterRelationships = {
    overallFlow: chapters.length > 1 
      ? 'Progressive learning path from foundational to advanced concepts'
      : 'Single cohesive document',
    prerequisites
  };
  
  const estimatedStudyTime: Record<string, string> = {};
  chapters.forEach(ch => {
    const readingTime = Math.ceil(ch.sourceContext.length / 1000 / 200 * 10);
    estimatedStudyTime[`chapter${ch.chapterNumber}`] = `${readingTime}-${readingTime + 5} minutes`;
  });
  
  const recommendations: ChapterRecommendations = {
    suggestedStudyOrder: chapters.map(ch => ch.chapterNumber),
    optionalChapters: [],
    coreChapters: chapters.map(ch => ch.chapterNumber),
    estimatedStudyTime
  };
  
  return {
    documentAnalysis,
    chapters,
    chapterRelationships,
    recommendations
  };
}

export async function enrichChaptersWithSummaries(
  chapters: DetectedChapter[]
): Promise<DetectedChapter[]> {
  return enrichChapterSummaries(chapters);
}
