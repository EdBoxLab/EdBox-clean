/**
 * Spaced Repetition Engine — v4 Production Grade
 *
 * Architecture:
 * - Pure SM-2 algorithm as a standalone function (zero deps, fully testable)
 * - Repository interface for swappable backends
 * - Supabase repo with promise-lock init (transient retry + permanent fail-fast)
 * - Typed DB rows — no `any` in the persistence layer
 * - Arrow-fn toReviewItem — safe in .map() without .bind()
 */

// ─── SM-2 Named Constants ────────────────────────────────────────────────────

const SM2 = {
    DEFAULT_EASE_FACTOR: 2.5,
    MIN_EASE_FACTOR: 1.3,
    EF_CONSTANT: 0.1,
    EF_LINEAR_PENALTY: 0.08,
    EF_QUADRATIC_PENALTY: 0.02,
    FIRST_INTERVAL_DAYS: 1,
    SECOND_INTERVAL_DAYS: 6,
} as const;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ReviewItem {
    userId: string;
    conceptId: string;
    skillId: string;
    easeFactor: number;
    intervalDays: number;
    nextReviewAt: Date;
    repetitions: number;
    lastQuality: number;
}

export interface SM2Result {
    easeFactor: number;
    intervalDays: number;
    repetitions: number;
}

/** Quality score: 0 (complete blackout) → 5 (perfect, effortless recall) */
export type Quality = 0 | 1 | 2 | 3 | 4 | 5;

/** Typed Supabase row — no `any`. A column rename here = compile error. */
interface ReviewRow {
    user_id: string;
    concept_id: string;
    skill_id: string;
    ease_factor: number;
    interval_days: number;
    next_review_at: string;
    repetitions: number;
    last_quality: number;
    updated_at?: string;
    // created_at is DB-managed (DEFAULT now()) — never sent from app layer
}

/**
 * Supabase client type. Without a generated Database schema (supabase gen types),
 * the fully-parameterized SupabaseClient<Database> resolves .from() to `never`.
 * We use ReturnType of createClient which gives us the correct runtime type.
 * The ReviewRow interface above provides our app-level type safety.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = ReturnType<typeof import('@supabase/supabase-js').createClient> extends infer T ? T : never;

/** Config errors that should never be retried (missing env vars). */
class PermanentConfigError extends Error {
    readonly isPermanent = true;
}

// ─── Repository Interface ────────────────────────────────────────────────────

export interface ReviewRepository {
    get(userId: string, conceptId: string): Promise<ReviewItem | null>;
    upsert(item: ReviewItem): Promise<void>;
    getDue(userId: string, asOf: Date, skillId?: string): Promise<ReviewItem[]>;
}

// ─── Pure SM-2 Algorithm ─────────────────────────────────────────────────────

/**
 * Pure function — no side effects, fully unit-testable.
 * Per SM-2 spec: EF is NOT updated on the very first failure
 * (repetitions === 0, no baseline yet).
 */
export function computeSM2(
    current: Pick<ReviewItem, 'easeFactor' | 'intervalDays' | 'repetitions'>,
    quality: Quality,
): SM2Result {
    const correct = quality >= 3;

    let intervalDays: number;
    let repetitions: number;

    if (correct) {
        repetitions = current.repetitions + 1;
        if (current.repetitions === 0) {
            intervalDays = SM2.FIRST_INTERVAL_DAYS;
        } else if (current.repetitions === 1) {
            intervalDays = SM2.SECOND_INTERVAL_DAYS;
        } else {
            intervalDays = Math.round(current.intervalDays * current.easeFactor);
        }
    } else {
        repetitions = 0;
        intervalDays = SM2.FIRST_INTERVAL_DAYS;
    }

    const shouldUpdateEF = current.repetitions > 0 || correct;
    const easeFactor = shouldUpdateEF
        ? Math.max(
            SM2.MIN_EASE_FACTOR,
            current.easeFactor +
            SM2.EF_CONSTANT -
            (5 - quality) * (SM2.EF_LINEAR_PENALTY + (5 - quality) * SM2.EF_QUADRATIC_PENALTY),
        )
        : current.easeFactor;

    return { easeFactor, intervalDays, repetitions };
}

// ─── Confidence → Quality ────────────────────────────────────────────────────

export function confidenceToQuality(confidence: number): Quality {
    if (typeof confidence !== 'number' || isNaN(confidence)) {
        throw new TypeError(`confidence must be a number, got: ${confidence}`);
    }
    if (confidence < 0 || confidence > 1) {
        throw new RangeError(`confidence must be in [0, 1], got: ${confidence}`);
    }
    if (confidence >= 0.9) return 5;
    if (confidence >= 0.75) return 4;
    if (confidence >= 0.6) return 3;
    if (confidence >= 0.4) return 2;
    if (confidence >= 0.2) return 1;
    return 0;
}

// ─── Service Layer ───────────────────────────────────────────────────────────

export class SpacedRepetitionService {
    constructor(private readonly repo: ReviewRepository) { }

    async scheduleReview(
        userId: string,
        conceptId: string,
        skillId: string,
        confidence: number,
    ): Promise<void> {
        if (!userId || !conceptId || !skillId) {
            throw new TypeError('userId, conceptId, and skillId are required');
        }

        const quality = confidenceToQuality(confidence);
        const existing = await this.repo.get(userId, conceptId);

        const base = existing ?? {
            easeFactor: SM2.DEFAULT_EASE_FACTOR,
            intervalDays: 0,
            repetitions: 0,
        };

        const result = computeSM2(base, quality);
        const nextReviewAt = new Date(Date.now() + result.intervalDays * 86_400_000);

        await this.repo.upsert({
            userId,
            conceptId,
            skillId,
            easeFactor: result.easeFactor,
            intervalDays: result.intervalDays,
            repetitions: result.repetitions,
            nextReviewAt,
            lastQuality: quality,
        });
    }

    async getDueTopics(userId: string, skillId?: string): Promise<ReviewItem[]> {
        if (!userId) throw new TypeError('userId is required');
        return this.repo.getDue(userId, new Date(), skillId);
    }

    async getReviewSummary(userId: string, skillId?: string): Promise<string | null> {
        const due = await this.getDueTopics(userId, skillId);
        if (due.length === 0) return null;

        const preview = due.slice(0, 3).map(d => d.conceptId).join(', ');
        const overflow = due.length > 3 ? ` (+${due.length - 3} more)` : '';
        return `[SPACED REPETITION DUE] ${due.length} topic(s) due: ${preview}${overflow}. Open the session by quizzing on one of these before teaching new material.`;
    }
}

// ─── In-Memory Repository (tests / local dev) ────────────────────────────────

export class InMemoryReviewRepository implements ReviewRepository {
    private store = new Map<string, Map<string, ReviewItem>>();

    async get(userId: string, conceptId: string): Promise<ReviewItem | null> {
        return this.store.get(userId)?.get(conceptId) ?? null;
    }

    async upsert(item: ReviewItem): Promise<void> {
        if (!this.store.has(item.userId)) {
            this.store.set(item.userId, new Map());
        }
        this.store.get(item.userId)!.set(item.conceptId, item);
    }

    async getDue(userId: string, asOf: Date, skillId?: string): Promise<ReviewItem[]> {
        const userItems = this.store.get(userId);
        if (!userItems) return [];

        const due: ReviewItem[] = [];
        for (const item of userItems.values()) {
            if (skillId && item.skillId !== skillId) continue;
            if (item.nextReviewAt <= asOf) due.push(item);
        }
        return due.sort((a, b) => a.nextReviewAt.getTime() - b.nextReviewAt.getTime());
    }
}

// ─── Supabase Repository (production persistence) ────────────────────────────

export class SupabaseReviewRepository implements ReviewRepository {
    // Promise-lock: all concurrent callers share ONE init flight.
    // Eliminates the race condition where two cold calls double-init.
    private clientPromise: Promise<DbClient> | null = null;

    private getClient(): Promise<DbClient> {
        this.clientPromise ??= this._initClient().catch(err => {
            // Transient errors: clear promise so the NEXT call can retry
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
                '[SpacedRepetition] Missing SUPABASE env vars — check deployment config',
            );
            this.clientPromise = Promise.reject(err);
            throw err;
        }

        const { createClient } = await import('@supabase/supabase-js');
        return createClient(url, key);
    }

    // Arrow property — preserves `this` when passed to .map()
    private toReviewItem = (row: ReviewRow): ReviewItem => ({
        userId: row.user_id,
        conceptId: row.concept_id,
        skillId: row.skill_id,
        easeFactor: row.ease_factor,
        intervalDays: row.interval_days,
        nextReviewAt: new Date(row.next_review_at),
        repetitions: row.repetitions,
        lastQuality: row.last_quality,
    });

    async get(userId: string, conceptId: string): Promise<ReviewItem | null> {
        const client = await this.getClient();
        const { data, error } = await client
            .from('spaced_repetition_queue')
            .select('*')
            .eq('user_id', userId)
            .eq('concept_id', conceptId)
            .maybeSingle();

        if (error) throw new Error(`[SpacedRepetition] get() failed: ${error.message}`);
        return data ? this.toReviewItem(data) : null;
    }

    async upsert(item: ReviewItem): Promise<void> {
        const client = await this.getClient();
        // created_at is DB-managed (DEFAULT now()). Only updated_at is set here.
        // On INSERT: DB sets created_at. On UPDATE (conflict): created_at is preserved.
        const row: ReviewRow = {
            user_id: item.userId,
            concept_id: item.conceptId,
            skill_id: item.skillId,
            ease_factor: item.easeFactor,
            interval_days: item.intervalDays,
            next_review_at: item.nextReviewAt.toISOString(),
            repetitions: item.repetitions,
            last_quality: item.lastQuality,
            updated_at: new Date().toISOString(),
        };
        const { error } = await client
            .from('spaced_repetition_queue')
            .upsert(row as any, { onConflict: 'user_id,concept_id' });
        if (error) throw new Error(`[SpacedRepetition] upsert() failed: ${error.message}`);
    }

    async getDue(userId: string, asOf: Date, skillId?: string): Promise<ReviewItem[]> {
        const client = await this.getClient();
        let query = client
            .from('spaced_repetition_queue')
            .select('*')
            .eq('user_id', userId)
            .lte('next_review_at', asOf.toISOString())
            .order('next_review_at', { ascending: true });

        if (skillId) query = query.eq('skill_id', skillId);

        const { data, error } = await query;
        if (error) throw new Error(`[SpacedRepetition] getDue() failed: ${error.message}`);
        return (data ?? []).map(this.toReviewItem); // arrow fn — `this` is safe
    }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

// Module-level repo cache: the promise-lock inside the repo must survive across
// factory calls within a single process lifetime. The service is lightweight
// (no state) so creating it fresh is fine — but the repo holds the connection.
let _cachedRepo: ReviewRepository | null = null;
let _warnedNoSupabase = false;

export function getSpacedRepetitionService(): SpacedRepetitionService {
    if (!_cachedRepo) {
        const hasSupabase = !!(
            process.env.NEXT_PUBLIC_SUPABASE_URL &&
            (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
        );

        _cachedRepo = hasSupabase
            ? new SupabaseReviewRepository()
            : new InMemoryReviewRepository();

        if (!hasSupabase && !_warnedNoSupabase) {
            _warnedNoSupabase = true;
            console.warn('[SpacedRepetition] No Supabase credentials — in-memory fallback (data lost on restart)');
        }
    }

    return new SpacedRepetitionService(_cachedRepo);
}
