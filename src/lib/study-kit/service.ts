import { generateWithRetry } from '@/lib/ai-providers';
import { ContentType, NoteType } from './types';
import { buildPrompt, buildNotePrompt } from './prompts';
import { extractJSON, cleanMarkdown, sendEvent } from './utils';
import type { DetectedChapter, ChapterContent } from '@/types/chapters';

const STUDY_KIT_MODEL = 'gemini-3-flash-preview';

const NOTE_TYPES: NoteType[] = ['deepExplanation', 'cheatsheet', 'application', 'tables'];

const NOTE_SYSTEM_PROMPTS: Record<NoteType, string> = {
    deepExplanation: `You are a World-Class Learning Architect creating a Deep Explanation Note. Output ONLY Markdown text — NO JSON. Start directly with the markdown heading. No preamble.`,
    cheatsheet: `You are a World-Class Exam Coach creating a Plain-Language Cheatsheet. Output ONLY Markdown text — NO JSON. Start directly with the markdown heading. No preamble.`,
    application: `You are a Senior Industry Practitioner creating an Application Note with worked examples. Output ONLY Markdown text — NO JSON. Start directly with the markdown heading. No preamble.`,
    tables: `You are a Reference Designer creating a Tables Reference Note. Output ONLY Markdown text — NO JSON. Prioritize tables. Start directly with the markdown heading. No preamble.`
};

export async function generateChapterContent(
    chapter: DetectedChapter,
    index: number,
    typesToGenerate: ContentType[],
    itemCount: number | undefined,
    notesDepth: string | undefined,
    customInstructions: string | undefined,
    controller?: ReadableStreamDefaultController
): Promise<ChapterContent> {
    const chapterContext = chapter.sourceContext || '';
    // Enhanced chapter prompt logic
    const chapterPrompt = `Chapter: ${chapter.title}\n\nSummary: ${chapter.summary}\n\nKey Topics: ${chapter.keyTopics.join(', ')}\n\nLearning Objectives: ${chapter.learningObjectives?.join(', ') || ''}\n\nContent:\n${chapterContext.substring(0, 5000)}`;

    const result: ChapterContent = {
        id: chapter.id,
        title: chapter.title,
        summary: chapter.summary
    };

    const warnings: string[] = [];

    // Helper for status reporting
    const reportProgress = (type: string, content: any, isNote: boolean = false) => {
        if (controller) {
            sendEvent(controller, 'chapter_content', {
                chapterIndex: index,
                chapterTitle: chapter.title,
                type: isNote ? `notes/${type}` : type,
                content
            });
        }
    };

    const tasks: { label: string; run: () => Promise<any> }[] = [];

    if (typesToGenerate.includes('quizzes')) {
        tasks.push({
            label: 'quizzes',
            run: async () => {
                const quizResult = await generateWithRetry({
                    prompt: buildPrompt('quizzes', chapterPrompt, false, '', itemCount || 5, notesDepth),
                    systemPrompt: 'Output ONLY valid JSON.',
                    temperature: 0.7,
                    maxTokens: 4000,
                    geminiModel: STUDY_KIT_MODEL,
                });
                result.quizzes = extractJSON(quizResult.text, 'quizzes');
                reportProgress('quizzes', result.quizzes);
            }
        });
    }

    if (typesToGenerate.includes('flashcards')) {
        tasks.push({
            label: 'flashcards',
            run: async () => {
                const fcResult = await generateWithRetry({
                    prompt: buildPrompt('flashcards', chapterPrompt, false, '', itemCount || 10, notesDepth),
                    systemPrompt: 'Output ONLY valid JSON.',
                    temperature: 0.7,
                    maxTokens: 4000,
                    geminiModel: STUDY_KIT_MODEL,
                });
                result.flashcards = extractJSON(fcResult.text, 'flashcards');
                reportProgress('flashcards', result.flashcards);
            }
        });
    }

    if (typesToGenerate.includes('mindmaps')) {
        tasks.push({
            label: 'mindmaps',
            run: async () => {
                const mmResult = await generateWithRetry({
                    prompt: buildPrompt('mindmaps', chapterPrompt),
                    systemPrompt: 'Output ONLY valid JSON.',
                    temperature: 0.7,
                    maxTokens: 4000,
                    geminiModel: STUDY_KIT_MODEL,
                });
                result.mindmaps = extractJSON(mmResult.text, 'mindmaps');
                reportProgress('mindmaps', result.mindmaps);
            }
        });
    }

    if (typesToGenerate.includes('notes')) {
        result.notes = { deepExplanation: '', cheatsheet: '', application: '', tables: '' };
        for (const noteType of NOTE_TYPES) {
            tasks.push({
                label: noteType,
                run: async () => {
                    const notePrompt = buildNotePrompt(chapterPrompt, notesDepth, customInstructions, noteType);
                    const noteResult = await generateWithRetry({
                        prompt: notePrompt,
                        systemPrompt: NOTE_SYSTEM_PROMPTS[noteType],
                        temperature: 0.7,
                        maxTokens: 5000,
                        geminiModel: STUDY_KIT_MODEL,
                    });
                    result.notes![noteType] = cleanMarkdown(noteResult.text);
                    reportProgress(noteType, result.notes![noteType], true);
                }
            });
        }
    }

    // Phase 1: Parallel execution
    const settledResults = await Promise.allSettled(tasks.map(t => t.run()));

    // Phase 2: Sequential Retries for failures
    const failedTasks = tasks.filter((_, i) => settledResults[i].status === 'rejected');
    for (const task of failedTasks) {
        try {
            await task.run();
        } catch (e: any) {
            const msg = `${task.label} failed for "${chapter.title}": ${e.message || String(e)}`;
            warnings.push(msg);
            console.error(msg);
        }
    }

    if (controller) {
        sendEvent(controller, 'chapter_complete', { chapterIndex: index, chapterTitle: chapter.title });
    }

    if (warnings.length > 0) (result as any).warnings = warnings;
    return result;
}

export async function generateSingleContent(
    type: ContentType,
    prompt: string,
    itemCount: number | undefined,
    notesDepth: string | undefined,
    customInstructions: string | undefined,
    isAppend: boolean = false,
    chunks?: string[],
    controller?: ReadableStreamDefaultController
): Promise<any> {
    const currentChunks = chunks || [prompt];

    // Parallel batching for Quizzes and Flashcards across chunks
    if ((type === 'quizzes' || type === 'flashcards') && itemCount && itemCount > 10) {
        const batchSize = 10;
        const numBatches = Math.ceil(itemCount / batchSize);
        const batchPromises = [];

        for (let i = 0; i < numBatches; i++) {
            const chunkToUseNum = i % currentChunks.length;
            const currentChunk = currentChunks[chunkToUseNum];
            const currentBatchCount = Math.min(batchSize, itemCount - i * batchSize);

            batchPromises.push((async () => {
                const result = await generateWithRetry({
                    prompt: buildPrompt(type, currentChunk, isAppend, customInstructions || '', currentBatchCount, notesDepth),
                    systemPrompt: 'Output ONLY valid JSON.',
                    temperature: 0.7,
                    maxTokens: 4000,
                    geminiModel: STUDY_KIT_MODEL,
                });
                const content = extractJSON(result.text, type);
                return content;
            })());
        }

        const batchResults = await Promise.all(batchPromises);
        const combinedContent = batchResults.flat();
        if (controller) {
            sendEvent(controller, 'content', { type, content: combinedContent });
        }
        return combinedContent;
    }

    // Parallel note types
    if (type === 'notes') {
        const notes: any = {};
        const notePromises = NOTE_TYPES.map(async (noteType) => {
            try {
                const notePrompt = buildNotePrompt(currentChunks[0], notesDepth, customInstructions, noteType);
                const result = await generateWithRetry({
                    prompt: notePrompt,
                    systemPrompt: NOTE_SYSTEM_PROMPTS[noteType],
                    temperature: 0.7,
                    maxTokens: 5000,
                    geminiModel: STUDY_KIT_MODEL,
                });
                const content = cleanMarkdown(result.text);
                notes[noteType] = content;
                if (controller) {
                    sendEvent(controller, 'content', { type: `notes/${noteType}`, content });
                }
            } catch (e) {
                console.error(`Notes ${noteType} failed:`, e);
            }
        });
        await Promise.all(notePromises);
        return notes;
    }

    // Standard generation
    try {
        const result = await generateWithRetry({
            prompt: buildPrompt(type, currentChunks[0], isAppend, customInstructions || '', itemCount, notesDepth),
            systemPrompt: 'Output ONLY valid JSON.',
            temperature: 0.7,
            maxTokens: 4000,
            geminiModel: STUDY_KIT_MODEL,
        });
        const content = extractJSON(result.text, type);
        if (controller) {
            sendEvent(controller, 'content', { type, content });
        }
        return content;
    } catch (e) {
        console.error(`${type} failed:`, e);
        return null;
    }
}
