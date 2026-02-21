import { ContentType } from './types';

export function sanitizeMathText(text: string): string {
    if (typeof text !== 'string') return String(text || '');
    return text.replace(/[\u2200-\u22FF]/g, (char) => {
        const mathMap: Record<string, string> = {
            '\u221A': 'sqrt', '\u00B2': '^2', '\u00B3': '^3', '\u00B9': '^1',
            '\u2264': '<=', '\u2265': '>=', '\u2260': '!=', '\u00D7': '*',
            '\u00F7': '/', '\u03C0': 'pi', '\u221E': 'infinity',
        };
        return mathMap[char] || char;
    }).replace(/\s+/g, ' ').trim();
}

export function cleanMarkdown(text: string): string {
    let cleaned = text.trim();
    const mdMatch = cleaned.match(/^```(?:markdown)?\n([\s\S]*?)\n```$/i);
    if (mdMatch && mdMatch[1]) return mdMatch[1].trim();
    const mdMatchSimple = cleaned.match(/^```(?:markdown)?([\s\S]*?)```$/i);
    if (mdMatchSimple && mdMatchSimple[1]) return mdMatchSimple[1].trim();
    return cleaned;
}

export function extractJSON(text: string, type: ContentType) {
    try {
        let cleaned = text.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '');
        cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, '').replace(/\\n/g, ' ').replace(/\r?\n/g, ' ');

        const start = cleaned.indexOf(type === 'mindmaps' ? '{' : '[');
        const end = cleaned.lastIndexOf(type === 'mindmaps' ? '}' : ']');

        if (start === -1 || end === -1) {
            if (type !== 'mindmaps') {
                const altStart = cleaned.indexOf('{');
                const altEnd = cleaned.lastIndexOf('}');
                if (altStart !== -1 && altEnd !== -1) {
                    const possibleObj = cleaned.substring(altStart, altEnd + 1);
                    try {
                        const parsedObj = JSON.parse(possibleObj);
                        const arrayKey = Object.keys(parsedObj).find(key => Array.isArray(parsedObj[key]));
                        if (arrayKey) return parsedObj[arrayKey];
                    } catch (e) { }
                }
            }
            throw new Error('No valid JSON structure found');
        }

        cleaned = cleaned.substring(start, end + 1).replace(/,\s*([}\]])/g, '$1');

        let parsed;
        try {
            parsed = JSON.parse(cleaned);
        } catch (parseError) {
            cleaned = cleaned.replace(/\\(?!["\\])/g, '\\\\').replace(/[\u0000-\u001F]/g, '');
            parsed = JSON.parse(cleaned);
        }

        if (type === 'quizzes' && Array.isArray(parsed)) {
            return parsed.map((q, i) => ({
                question: sanitizeMathText(q.question || `Question ${i + 1}`),
                options: Array.isArray(q.options) && q.options.length >= 2
                    ? q.options.slice(0, 4).map((opt: any) => sanitizeMathText(opt))
                    : ['Option A', 'Option B', 'Option C', 'Option D'],
                correctAnswer: typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer <= 3
                    ? q.correctAnswer
                    : (typeof q.correctAnswer === 'string' ? Math.min(3, Math.max(0, parseInt(q.correctAnswer) || 0)) : 0),
                explanation: sanitizeMathText(q.explanation || 'No explanation provided.'),
                difficulty: ['Easy', 'Medium', 'Hard'].includes(q.difficulty) ? q.difficulty : 'Medium',
                bloomLevel: ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'].includes(q.bloomLevel) ? q.bloomLevel : 'understand',
            }));
        }

        if (type === 'flashcards' && Array.isArray(parsed)) {
            return parsed.filter(c => c.front && c.back).map(c => ({
                front: sanitizeMathText(c.front),
                back: sanitizeMathText(c.back),
                hint: sanitizeMathText(c.hint || ''),
                examRelevance: typeof c.examRelevance === 'number' ? Math.min(5, Math.max(1, c.examRelevance)) : 3,
                keyTakeaway: sanitizeMathText(c.keyTakeaway || ''),
            }));
        }

        return parsed;
    } catch (error) {
        throw new Error(`Failed to parse ${type}: ${error}`);
    }
}

export function isProgrammingTopic(prompt: string): boolean {
    const programmingKeywords = [
        'code', 'programming', 'javascript', 'python', 'java', 'react', 'component',
        'function', 'algorithm', 'software', 'development', 'web development',
        'api', 'database', 'frontend', 'backend', 'typescript', 'html', 'css',
        'node', 'angular', 'vue', 'coding', 'developer', 'syntax', 'variable',
        'array', 'object', 'class', 'method', 'loop', 'conditional'
    ];

    const lowerPrompt = prompt.toLowerCase();
    return programmingKeywords.some(keyword => lowerPrompt.includes(keyword));
}

export function extractContextForType(type: ContentType, fullPrompt: string): string {
    const maxLength = 1500;
    if (fullPrompt.length <= maxLength) return fullPrompt;

    switch (type) {
        case 'quizzes':
            return `Key concepts and facts to test: ${fullPrompt.substring(0, maxLength)}...`;
        case 'flashcards':
            return `Important terms and concepts: ${fullPrompt.substring(0, maxLength)}...`;
        case 'mindmaps':
            return `Topic structure and relationships: ${fullPrompt.substring(0, maxLength)}...`;
        case 'notes':
            return fullPrompt.substring(0, 2000);
        default:
            return fullPrompt.substring(0, maxLength);
    }
}

const encoder = new TextEncoder();

export function sendEvent(controller: ReadableStreamDefaultController, event: string, data: any) {
    const message = `data: ${JSON.stringify({ event, data })}\n\n`;
    controller.enqueue(encoder.encode(message));
}
