// ============================================
// Adaptive Context Builder — Unit Tests (Production Grade)
// ============================================

import { buildAdaptiveContext } from '@/lib/services/adaptive-context-builder';
import {
    StudentModelService,
    InMemoryStudentRepository,
} from '@/lib/services/student-model';
import {
    SpacedRepetitionService,
    InMemoryReviewRepository,
} from '@/lib/services/spaced-repetition';

// We need to mock the factory functions so they return our test instances
jest.mock('@/lib/services/student-model', () => {
    const actual = jest.requireActual('@/lib/services/student-model');
    const testRepo = new actual.InMemoryStudentRepository();
    const testService = new actual.StudentModelService(testRepo);
    return {
        ...actual,
        getStudentModelService: () => testService,
        __testRepo: testRepo,
        __testService: testService,
    };
});

jest.mock('@/lib/services/spaced-repetition', () => {
    const actual = jest.requireActual('@/lib/services/spaced-repetition');
    const testRepo = new actual.InMemoryReviewRepository();
    const testService = new actual.SpacedRepetitionService(testRepo);
    return {
        ...actual,
        getSpacedRepetitionService: () => testService,
        __testRepo: testRepo,
        __testService: testService,
    };
});

// Access the test instances
const {
    __testService: studentService,
    __testRepo: studentRepo,
} = jest.requireMock('@/lib/services/student-model');

describe('Adaptive Context Builder', () => {
    const userId = 'ctx-user';
    const skillId = 'machine-learning';
    const graphId = 'ai-graph';

    beforeEach(async () => {
        // Reset student model
        await (studentService as StudentModelService).reset(userId, skillId);
    });

    describe('buildAdaptiveContext', () => {
        it('should return student model context for a new student', async () => {
            const ctx = await buildAdaptiveContext({ userId, skillId, graphId });
            expect(ctx).toContain('[STUDENT MODEL]');
            expect(ctx).toContain('New student');
        });

        it('should include student knowledge after learning signals', async () => {
            await (studentService as StudentModelService).updateFromSignal(userId, skillId, graphId, {
                signalType: 'deep_understanding',
                topic: 'linear-regression',
                confidence: 0.9,
                depth: 0.85,
            });

            const ctx = await buildAdaptiveContext({ userId, skillId, graphId });
            expect(ctx).toContain('linear-regression');
            expect(ctx).toContain('Confident');
        });

        it('should include session state when provided', async () => {
            const ctx = await buildAdaptiveContext({
                userId,
                skillId,
                graphId,
                currentStage: 'Developing',
                topicsRemaining: ['decision-trees', 'random-forests'],
            });

            expect(ctx).toContain('Developing');
            expect(ctx).toContain('decision-trees');
        });

        it('should handle empty topicsRemaining', async () => {
            const ctx = await buildAdaptiveContext({
                userId,
                skillId,
                graphId,
                topicsRemaining: [],
            });
            expect(ctx).not.toContain('[TOPICS REMAINING]');
        });

        it('should handle missing optional fields', async () => {
            const ctx = await buildAdaptiveContext({ userId, skillId, graphId });
            expect(ctx).toContain('[STUDENT MODEL]');
            expect(ctx).not.toContain('[SESSION STATE]');
        });

        it('should reflect misconceptions after reteach', async () => {
            await (studentService as StudentModelService).updateFromSignal(userId, skillId, graphId, {
                signalType: 'needed_reteach',
                topic: 'k-means',
                confidence: 0.2,
                note: 'Confused K-means with KNN',
            });

            const ctx = await buildAdaptiveContext({ userId, skillId, graphId });
            expect(ctx).toContain('Confused K-means with KNN');
        });

        it('should accumulate knowledge across topics', async () => {
            await (studentService as StudentModelService).updateFromSignal(userId, skillId, graphId, {
                signalType: 'deep_understanding',
                topic: 'perceptrons',
                confidence: 0.85,
            });
            await (studentService as StudentModelService).updateFromSignal(userId, skillId, graphId, {
                signalType: 'needed_reteach',
                topic: 'backprop',
                confidence: 0.3,
            });

            const ctx = await buildAdaptiveContext({ userId, skillId, graphId });
            expect(ctx).toContain('perceptrons');
            expect(ctx).toContain('backprop');
            expect(ctx).toContain('Confident');
            expect(ctx).toContain('Struggles');
        });
    });
});
