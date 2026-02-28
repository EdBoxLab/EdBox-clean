/**
 * Student Knowledge Model — v4 Production Grade
 *
 * Architecture mirrors spaced-repetition.ts:
 * - Pure applySignal function (no deps, fully testable)
 * - Repository interface for swappable backends
 * - Supabase repo with promise-lock init (transient retry + permanent fail-fast)
 * - Typed DB rows — no `any` in the persistence layer
 * - Arrow-fn toConceptState — safe in .map()
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type LearningStyle = 'unknown' | 'visual' | 'code' | 'analogy' | 'formal';

export interface ConceptState {
    userId: string;
    conceptId: string;
    skillId: string;
    graphId: string;
    confidence: number;
    depth: number;
    attempts: number;
    misconceptions: string[];
    learningStyle: LearningStyle;
    lastSeenAt: Date;
}

export interface LearningSignal {
    signalType: string;
    topic: string;
    confidence: number;
    depth?: number;
    attempts?: number;
    widgetsUsed?: string;
    note?: string;
}

/** Typed Supabase row — column rename = compile error. */
interface ConceptRow {
    user_id: string;
    concept_id: string;
    skill_id: string;
    graph_id: string;
    confidence: number;
    depth: number;
    attempts: number;
    misconceptions: string[];
    learning_style: string;
    last_seen_at: string;
    updated_at?: string;
    // created_at is DB-managed (DEFAULT now()) — never sent from app layer
}

/** Supabase client type — avoids `any` throughout the repo. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = ReturnType<typeof import('@supabase/supabase-js').createClient> extends infer T ? T : never;

/** Config errors that should never be retried. */
class PermanentConfigError extends Error {
    readonly isPermanent = true;
}

// ─── Repository Interface ────────────────────────────────────────────────────

export interface StudentRepository {
    getByUserAndSkill(userId: string, skillId: string): Promise<ConceptState[]>;
    get(userId: string, conceptId: string, skillId: string): Promise<ConceptState | null>;
    upsert(state: ConceptState): Promise<void>;
    deleteByUserAndSkill(userId: string, skillId: string): Promise<void>;
}

// ─── Pure Signal Processing ──────────────────────────────────────────────────

const MAX_MISCONCEPTIONS = 5;

/**
 * Pure function: applies a learning signal to a concept state.
 * Returns a new ConceptState — no mutation of the input.
 */
export function applySignal(state: ConceptState, signal: LearningSignal): ConceptState {
    const next = { ...state, misconceptions: [...state.misconceptions] };

    switch (signal.signalType) {
        case 'deep_understanding':
            next.confidence = Math.max(next.confidence, signal.confidence);
            next.depth = Math.max(next.depth, signal.depth ?? 0.8);
            break;
        case 'shallow_understanding':
            next.confidence = (next.confidence + signal.confidence) / 2;
            next.depth = Math.min(next.depth, signal.depth ?? 0.4);
            break;
        case 'applied_correctly':
            next.confidence = Math.min(1.0, next.confidence + 0.1);
            next.depth = Math.min(1.0, next.depth + 0.15);
            break;
        case 'struggled':
        case 'needed_reteach':
            next.confidence = Math.max(0.1, next.confidence - 0.15);
            next.depth = Math.max(0.1, next.depth - 0.1);
            break;
        case 'correct_under_pressure':
            next.confidence = Math.min(1.0, next.confidence + 0.15);
            next.depth = Math.min(1.0, next.depth + 0.1);
            break;
        case 'asked_insightful_question':
            next.depth = Math.min(1.0, next.depth + 0.2);
            break;
    }

    next.attempts = signal.attempts ?? next.attempts + 1;
    next.lastSeenAt = new Date();

    if (signal.widgetsUsed) {
        const widgets = signal.widgetsUsed.split(',').map(w => w.trim());
        if (widgets.includes('CUSTOM_GENERATED') || widgets.includes('NEURON_VISUALIZER')) {
            next.learningStyle = 'visual';
        } else if (widgets.includes('CODE_EDITOR')) {
            next.learningStyle = 'code';
        }
    }

    if (signal.signalType === 'needed_reteach' && signal.note) {
        if (!next.misconceptions.includes(signal.note)) {
            next.misconceptions.push(signal.note);
            if (next.misconceptions.length > MAX_MISCONCEPTIONS) {
                next.misconceptions = next.misconceptions.slice(-MAX_MISCONCEPTIONS);
            }
        }
    }

    return next;
}

// ─── Service Layer ───────────────────────────────────────────────────────────

export class StudentModelService {
    constructor(private readonly repo: StudentRepository) { }

    async getConcepts(userId: string, skillId: string): Promise<ConceptState[]> {
        return this.repo.getByUserAndSkill(userId, skillId);
    }

    async getSummary(userId: string, skillId: string, graphId: string): Promise<string> {
        const concepts = await this.repo.getByUserAndSkill(userId, skillId);

        if (concepts.length === 0) {
            return '[STUDENT MODEL] New student — no prior concept data. Start from the very basics.';
        }

        const strong = concepts.filter(c => c.confidence >= 0.7);
        const weak = concepts.filter(c => c.confidence < 0.5);
        const allMisconceptions = concepts.flatMap(c => c.misconceptions);

        const styleCounts: Record<string, number> = {};
        for (const c of concepts) {
            if (c.learningStyle !== 'unknown') {
                styleCounts[c.learningStyle] = (styleCounts[c.learningStyle] || 0) + 1;
            }
        }
        const preferredStyle = Object.entries(styleCounts)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';

        let summary = '[STUDENT MODEL]\n';
        if (strong.length > 0) {
            summary += `Confident in: ${strong.map(c => `${c.conceptId} (${c.confidence.toFixed(1)})`).join(', ')}.\n`;
        }
        if (weak.length > 0) {
            summary += `Struggles with: ${weak.map(c => `${c.conceptId} (${c.confidence.toFixed(1)}, ${c.attempts} attempts)`).join(', ')}.\n`;
        }
        if (allMisconceptions.length > 0) {
            summary += `Misconceptions detected: ${allMisconceptions.map(m => `"${m}"`).join(', ')}.\n`;
        }
        if (preferredStyle !== 'unknown') {
            summary += `Prefers: ${preferredStyle} explanations.\n`;
        }

        return summary;
    }

    async updateFromSignal(
        userId: string,
        skillId: string,
        graphId: string,
        signal: LearningSignal,
    ): Promise<void> {
        if (!userId || !skillId || !signal.topic) {
            throw new TypeError('userId, skillId, and signal.topic are required');
        }

        const existing = await this.repo.get(userId, signal.topic, skillId);

        const base: ConceptState = existing ?? {
            userId,
            conceptId: signal.topic,
            skillId,
            graphId,
            confidence: 0.5,
            depth: 0.3,
            attempts: 0,
            misconceptions: [],
            learningStyle: 'unknown',
            lastSeenAt: new Date(),
        };

        const updated = applySignal(base, signal);
        await this.repo.upsert(updated);
    }

    async reset(userId: string, skillId: string): Promise<void> {
        await this.repo.deleteByUserAndSkill(userId, skillId);
    }
}

// ─── In-Memory Repository (tests / local dev) ────────────────────────────────

export class InMemoryStudentRepository implements StudentRepository {
    private store = new Map<string, Map<string, ConceptState>>();

    private userKey(userId: string, skillId: string): string {
        return `${userId}:${skillId}`;
    }

    async getByUserAndSkill(userId: string, skillId: string): Promise<ConceptState[]> {
        const userMap = this.store.get(this.userKey(userId, skillId));
        return userMap ? Array.from(userMap.values()) : [];
    }

    async get(userId: string, conceptId: string, skillId: string): Promise<ConceptState | null> {
        return this.store.get(this.userKey(userId, skillId))?.get(conceptId) ?? null;
    }

    async upsert(state: ConceptState): Promise<void> {
        const key = this.userKey(state.userId, state.skillId);
        if (!this.store.has(key)) {
            this.store.set(key, new Map());
        }
        this.store.get(key)!.set(state.conceptId, state);
    }

    async deleteByUserAndSkill(userId: string, skillId: string): Promise<void> {
        this.store.delete(this.userKey(userId, skillId));
    }
}

// ─── Supabase Repository (production persistence) ────────────────────────────

export class SupabaseStudentRepository implements StudentRepository {
    private clientPromise: Promise<DbClient> | null = null;

    private getClient(): Promise<DbClient> {
        this.clientPromise ??= this._initClient().catch(err => {
            if (!(err instanceof PermanentConfigError)) {
                this.clientPromise = null;
            }
            throw err;
        });
        return this.clientPromise;
    }

    private async _initClient(): Promise<DbClient> {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!url || !key) {
            const err = new PermanentConfigError(
                '[StudentModel] Missing SUPABASE env vars — check deployment config',
            );
            this.clientPromise = Promise.reject(err);
            throw err;
        }

        const { createClient } = await import('@supabase/supabase-js');
        return createClient(url, key);
    }

    // Arrow property — preserves `this` when passed to .map()
    private toConceptState = (row: ConceptRow): ConceptState => ({
        userId: row.user_id,
        conceptId: row.concept_id,
        skillId: row.skill_id,
        graphId: row.graph_id,
        confidence: row.confidence,
        depth: row.depth,
        attempts: row.attempts,
        misconceptions: row.misconceptions || [],
        learningStyle: (row.learning_style as LearningStyle) || 'unknown',
        lastSeenAt: new Date(row.last_seen_at),
    });

    async getByUserAndSkill(userId: string, skillId: string): Promise<ConceptState[]> {
        const client = await this.getClient();
        const { data, error } = await client
            .from('student_knowledge_state')
            .select('*')
            .eq('user_id', userId)
            .eq('skill_id', skillId);

        if (error) throw new Error(`[StudentModel] getByUserAndSkill() failed: ${error.message}`);
        return (data ?? []).map(this.toConceptState);
    }

    async get(userId: string, conceptId: string, skillId: string): Promise<ConceptState | null> {
        const client = await this.getClient();
        const { data, error } = await client
            .from('student_knowledge_state')
            .select('*')
            .eq('user_id', userId)
            .eq('concept_id', conceptId)
            .eq('skill_id', skillId)
            .maybeSingle();

        if (error) throw new Error(`[StudentModel] get() failed: ${error.message}`);
        return data ? this.toConceptState(data) : null;
    }

    async upsert(state: ConceptState): Promise<void> {
        const client = await this.getClient();
        // created_at is DB-managed. Only updated_at is set here.
        const row: ConceptRow = {
            user_id: state.userId,
            concept_id: state.conceptId,
            skill_id: state.skillId,
            graph_id: state.graphId,
            confidence: state.confidence,
            depth: state.depth,
            attempts: state.attempts,
            misconceptions: state.misconceptions,
            learning_style: state.learningStyle,
            last_seen_at: state.lastSeenAt.toISOString(),
            updated_at: new Date().toISOString(),
        };
        const { error } = await client
            .from('student_knowledge_state')
            .upsert(row as any, { onConflict: 'user_id,concept_id,skill_id' });

        if (error) throw new Error(`[StudentModel] upsert() failed: ${error.message}`);
    }

    async deleteByUserAndSkill(userId: string, skillId: string): Promise<void> {
        const client = await this.getClient();
        const { error } = await client
            .from('student_knowledge_state')
            .delete()
            .eq('user_id', userId)
            .eq('skill_id', skillId);

        if (error) throw new Error(`[StudentModel] delete() failed: ${error.message}`);
    }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

// Module-level repo cache — promise-lock must survive across factory calls.
let _cachedRepo: StudentRepository | null = null;
let _warnedNoSupabase = false;

export function getStudentModelService(): StudentModelService {
    if (!_cachedRepo) {
        const hasSupabase = !!(
            process.env.NEXT_PUBLIC_SUPABASE_URL &&
            (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
        );

        _cachedRepo = hasSupabase
            ? new SupabaseStudentRepository()
            : new InMemoryStudentRepository();

        if (!hasSupabase && !_warnedNoSupabase) {
            _warnedNoSupabase = true;
            console.warn('[StudentModel] No Supabase credentials — in-memory fallback (data lost on restart)');
        }
    }

    return new StudentModelService(_cachedRepo);
}
