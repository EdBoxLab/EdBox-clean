export type ContentType = 'quizzes' | 'flashcards' | 'mindmaps' | 'notes';
export type NoteType = 'deepExplanation' | 'cheatsheet' | 'application' | 'tables';

export interface StudyKitGenerationParams {
    prompt?: string;
    contentTypes?: ContentType[];
    fileName?: string;
    fileContent?: string;
    fileType?: string;
    chapters?: any[];
    customInstructions?: string;
    itemCount?: number;
    notesDepth?: string;
    kitId?: string;
    appendType?: ContentType;
    useChapters?: boolean;
}
