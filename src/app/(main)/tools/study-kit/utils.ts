export function preprocessMarkdown(text: string): string {
    if (!text) return '';
    let result = text;

    result = result.replace(/\s+(#{1,6}\s)/g, '\n\n$1');
    result = result.replace(/\s+---\s+/g, '\n\n---\n\n');
    result = result.replace(/\|\s+\|/g, '|\n|');

    return result;
}

export function flattenChapterContent(content: any): any {
    if (!content?.chapters || !Array.isArray(content.chapters)) return content;

    const flat: any = {};
    const chapters = content.chapters;

    const allQuizzes = chapters.flatMap((ch: any) => ch.quizzes || []);
    if (allQuizzes.length > 0) flat.quizzes = allQuizzes;

    const allFlashcards = chapters.flatMap((ch: any) => ch.flashcards || []);
    if (allFlashcards.length > 0) flat.flashcards = allFlashcards;

    const noteTypes = ['deepExplanation', 'cheatsheet', 'application', 'tables'];
    const mergedNotes: any = {};
    let hasAnyNote = false;
    for (const nt of noteTypes) {
        const parts: string[] = [];
        for (const ch of chapters) {
            if (ch.notes?.[nt]) {
                if (chapters.length > 1) {
                    parts.push(`\n\n---\n\n## 📖 ${ch.title}\n\n${ch.notes[nt]}`);
                } else {
                    parts.push(ch.notes[nt]);
                }
            }
        }
        if (parts.length > 0) {
            mergedNotes[nt] = parts.join('');
            hasAnyNote = true;
        } else {
            mergedNotes[nt] = '';
        }
    }
    if (hasAnyNote) flat.notes = mergedNotes;

    const allBranches: any[] = [];
    for (const ch of chapters) {
        if (ch.mindmaps) {
            if (ch.mindmaps.branches) {
                allBranches.push(...ch.mindmaps.branches);
            }
        }
    }
    if (allBranches.length > 0) {
        flat.mindmaps = {
            central: chapters.length > 1
                ? chapters.map((ch: any) => ch.title).join(' & ')
                : chapters[0]?.title || 'Study Kit',
            branches: allBranches
        };
    }

    return flat;
}

function parseIfString(data: any): any {
    if (typeof data !== 'string') return data;

    let sanitized = data.trim();

    const jsonMatch = sanitized.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
    if (jsonMatch && jsonMatch[1]) {
        sanitized = jsonMatch[1].trim();
    }

    try {
        return JSON.parse(sanitized);
    } catch (e) {
        const startIndex = sanitized.search(/[{\[]/);
        const endIndex = sanitized.lastIndexOf('}') > sanitized.lastIndexOf(']')
            ? sanitized.lastIndexOf('}')
            : sanitized.lastIndexOf(']');

        if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
            const extracted = sanitized.substring(startIndex, endIndex + 1);
            try {
                return JSON.parse(extracted);
            } catch (innerE) {
                console.error('Failed to parse extracted JSON:', innerE);
            }
        }

        return sanitized;
    }
}

export interface NormalizeResult {
    normalized: any;
    chapterInfo: {
        hasChapters: boolean;
        chapters: any[];
        viewMode: 'chapters' | 'flat';
    };
}

export function normalizeContent(rawContent: any, requestedTypes: string[] = []): NormalizeResult {
    let content = rawContent;
    let chapterInfo: NormalizeResult['chapterInfo'] = {
        hasChapters: false,
        chapters: [],
        viewMode: 'flat',
    };

    if (content?.chapters && Array.isArray(content.chapters)) {
        chapterInfo = {
            hasChapters: true,
            chapters: content.chapters,
            viewMode: 'chapters',
        };
        content = flattenChapterContent(content);
    }

    const normalized: any = {};

    requestedTypes.forEach(typeId => {
        if (typeId === 'quizzes' || typeId === 'flashcards') normalized[typeId] = [];
        else if (typeId === 'notes') normalized[typeId] = { deepExplanation: '', cheatsheet: '', application: '', tables: '' };
        else if (typeId === 'mindmaps') normalized[typeId] = { central: 'Topic', branches: [] };
    });

    if (content.quizzes) {
        const parsed = parseIfString(content.quizzes);

        if (Array.isArray(parsed)) {
            normalized.quizzes = parsed;
        } else if (parsed.questions && Array.isArray(parsed.questions)) {
            normalized.quizzes = parsed.questions;
        } else if (typeof parsed === 'object') {
            const arrayKey = Object.keys(parsed).find(key => Array.isArray(parsed[key]));
            if (arrayKey) {
                normalized.quizzes = parsed[arrayKey];
            }
        }
    }

    if (content.flashcards) {
        const parsed = parseIfString(content.flashcards);

        let cards = [];
        if (Array.isArray(parsed)) {
            cards = parsed;
        } else if (parsed.flashcards && Array.isArray(parsed.flashcards)) {
            cards = parsed.flashcards;
        } else if (parsed.cards && Array.isArray(parsed.cards)) {
            cards = parsed.cards;
        }

        normalized.flashcards = cards.map((card: any) => ({
            front: card.front || card.question || 'No content',
            back: card.back || card.answer || 'No content'
        }));
    }

    if (content.notes) {
        const parsed = parseIfString(content.notes);

        if (typeof parsed === 'object' && !Array.isArray(parsed) && (parsed.deepExplanation || parsed.cheatsheet || parsed.application || parsed.tables)) {
            normalized.notes = parsed;
        } else if (typeof parsed === 'string') {
            normalized.notes = { deepExplanation: parsed, cheatsheet: '', application: '', tables: '' };
        } else if (Array.isArray(parsed)) {
            const joined = parsed.map((note: any) => {
                if (typeof note === 'string') return note;
                let text = '';
                if (note.heading) text += note.heading + '\n\n';
                if (Array.isArray(note.content)) {
                    text += note.content.join('\n');
                } else if (typeof note.content === 'string') {
                    text += note.content;
                } else if (typeof note.content === 'object') {
                    const entries = Object.entries(note.content)
                        .filter(([_, v]) => typeof v === 'string')
                        .map(([k, v]) => `**${k}**: ${v}`)
                        .join('\n\n');
                    text += entries || JSON.stringify(note.content, null, 2);
                }
                return text;
            }).join('\n\n---\n\n');
            normalized.notes = { deepExplanation: joined, cheatsheet: '', application: '', tables: '' };
        } else if (typeof parsed === 'object' && !Array.isArray(parsed)) {
            const stringValues = Object.entries(parsed)
                .filter(([_, v]) => typeof v === 'string' && (v as string).length > 0)
                .map(([key, value]) => `## ${key.charAt(0).toUpperCase() + key.slice(1)}\n\n${value}`)
                .join('\n\n---\n\n');

            if (stringValues) {
                normalized.notes = { deepExplanation: stringValues, cheatsheet: '', application: '', tables: '' };
            } else {
                normalized.notes = { deepExplanation: '```json\n' + JSON.stringify(parsed, null, 2) + '\n```', cheatsheet: '', application: '', tables: '' };
            }
        } else {
            normalized.notes = { deepExplanation: '', cheatsheet: '', application: '', tables: '' };
        }
    }

    if (content.mindmaps) {
        const parsed = parseIfString(content.mindmaps);

        if (parsed.title && (parsed.children || parsed.nodes)) {
            const branches = parsed.children || parsed.nodes;
            normalized.mindmaps = {
                central: parsed.title,
                branches: branches.map((node: any) => ({
                    topic: node.text || node.title || node.name,
                    subtopics: (node.children || []).map((c: any) => c.text || c.title || c.name),
                    details: node.details || node.description || ''
                }))
            };
        } else if (parsed.central || parsed.center) {
            normalized.mindmaps = {
                central: parsed.central || parsed.center,
                branches: (parsed.branches || []).map((b: any) => ({
                    ...b,
                    details: b.details || ''
                }))
            };
        } else {
            normalized.mindmaps = parsed;
        }
    }

    return { normalized, chapterInfo };
}
