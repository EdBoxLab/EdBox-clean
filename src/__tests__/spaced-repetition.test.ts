// ============================================
// Spaced Repetition Engine (SM-2) — Unit Tests (Production Grade)
// ============================================

import {
    computeSM2,
    confidenceToQuality,
    SpacedRepetitionService,
    InMemoryReviewRepository,
    type Quality,
    type SM2Result,
} from '@/lib/services/spaced-repetition';

describe('Spaced Repetition Engine', () => {
    describe('computeSM2 (pure function)', () => {
        const defaults = { easeFactor: 2.5, intervalDays: 0, repetitions: 0 };

        it('should set interval to 1 day on first correct answer', () => {
            const result = computeSM2(defaults, 4);
            expect(result.intervalDays).toBe(1);
            expect(result.repetitions).toBe(1);
        });

        it('should set interval to 6 days on second correct answer', () => {
            const after1 = computeSM2(defaults, 4);
            const result = computeSM2(after1, 4);
            expect(result.intervalDays).toBe(6);
            expect(result.repetitions).toBe(2);
        });

        it('should multiply interval by ease factor on 3rd+ correct', () => {
            const after1 = computeSM2(defaults, 5);
            const after2 = computeSM2(after1, 5);
            const after3 = computeSM2(after2, 5);
            // interval should be round(6 * EF)
            expect(after3.intervalDays).toBe(Math.round(6 * after2.easeFactor));
            expect(after3.repetitions).toBe(3);
        });

        it('should reset repetitions and interval on failure (quality < 3)', () => {
            const after2 = computeSM2(computeSM2(defaults, 4), 4);
            const failed = computeSM2(after2, 2);
            expect(failed.repetitions).toBe(0);
            expect(failed.intervalDays).toBe(1);
        });

        it('should NOT update EF on very first failure (SM-2 spec)', () => {
            const result = computeSM2(defaults, 0);
            expect(result.easeFactor).toBe(2.5); // unchanged
        });

        it('should update EF on first correct answer', () => {
            const result = computeSM2(defaults, 5);
            expect(result.easeFactor).not.toBe(2.5);
        });

        it('should never drop EF below 1.3', () => {
            let state = { ...defaults };
            // Repeated failures with quality 0 after first correct
            state = computeSM2(state, 3); // first correct → EF gets updated
            for (let i = 0; i < 20; i++) {
                state = computeSM2(state, 0);
            }
            expect(state.easeFactor).toBeGreaterThanOrEqual(1.3);
        });

        it('should increase EF for quality 5', () => {
            const after1 = computeSM2(defaults, 5);
            expect(after1.easeFactor).toBeGreaterThan(2.5);
        });

        it('should decrease EF for quality 3', () => {
            const after1 = computeSM2(defaults, 3);
            // quality 3 is "correct with serious difficulty" — EF should decrease
            expect(after1.easeFactor).toBeLessThan(2.5);
        });
    });

    describe('confidenceToQuality', () => {
        it('should map 0.95 → quality 5', () => {
            expect(confidenceToQuality(0.95)).toBe(5);
        });

        it('should map 0.8 → quality 4', () => {
            expect(confidenceToQuality(0.8)).toBe(4);
        });

        it('should map 0.6 → quality 3', () => {
            expect(confidenceToQuality(0.6)).toBe(3);
        });

        it('should map 0.4 → quality 2', () => {
            expect(confidenceToQuality(0.4)).toBe(2);
        });

        it('should map 0.1 → quality 0', () => {
            expect(confidenceToQuality(0.1)).toBe(0);
        });

        it('should throw on NaN', () => {
            expect(() => confidenceToQuality(NaN)).toThrow(TypeError);
        });

        it('should throw on out-of-range', () => {
            expect(() => confidenceToQuality(-0.1)).toThrow(RangeError);
            expect(() => confidenceToQuality(1.1)).toThrow(RangeError);
        });

        it('should handle boundaries exactly', () => {
            expect(confidenceToQuality(0)).toBe(0);
            expect(confidenceToQuality(1)).toBe(5);
        });
    });

    describe('SpacedRepetitionService', () => {
        let service: SpacedRepetitionService;
        let repo: InMemoryReviewRepository;

        beforeEach(() => {
            repo = new InMemoryReviewRepository();
            service = new SpacedRepetitionService(repo);
        });

        it('should schedule a new topic', async () => {
            await service.scheduleReview('user-1', 'variables', 'python', 0.9);
            const item = await repo.get('user-1', 'variables');
            expect(item).not.toBeNull();
            expect(item!.intervalDays).toBe(1);
            expect(item!.repetitions).toBe(1);
        });

        it('should update on repeated review', async () => {
            await service.scheduleReview('user-1', 'loops', 'python', 0.8);
            await service.scheduleReview('user-1', 'loops', 'python', 0.9);
            const item = await repo.get('user-1', 'loops');
            expect(item!.repetitions).toBe(2);
            expect(item!.intervalDays).toBe(6);
        });

        it('should reset on failure', async () => {
            await service.scheduleReview('user-1', 'recursion', 'python', 0.8);
            await service.scheduleReview('user-1', 'recursion', 'python', 0.1);
            const item = await repo.get('user-1', 'recursion');
            expect(item!.repetitions).toBe(0);
            expect(item!.intervalDays).toBe(1);
        });

        it('should throw on missing params', async () => {
            await expect(
                service.scheduleReview('', 'x', 'y', 0.5),
            ).rejects.toThrow(TypeError);
        });

        it('should throw on invalid confidence', async () => {
            await expect(
                service.scheduleReview('user-1', 'x', 'y', -0.5),
            ).rejects.toThrow(RangeError);
        });

        it('should return empty due topics for new user', async () => {
            const due = await service.getDueTopics('nonexistent');
            expect(due).toEqual([]);
        });

        it('should return null summary when nothing due', async () => {
            const summary = await service.getReviewSummary('user-1', 'python');
            expect(summary).toBeNull();
        });
    });
});
