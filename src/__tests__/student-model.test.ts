// ============================================
// Student Knowledge Model — Unit Tests (Production Grade)
// ============================================

import {
    StudentModelService,
    InMemoryStudentRepository,
    applySignal,
    type ConceptState,
    type LearningSignal,
} from '@/lib/services/student-model';

describe('Student Knowledge Model', () => {
    const userId = 'test-user-001';
    const skillId = 'neural-networks';
    const graphId = 'ai-fundamentals';

    let service: StudentModelService;
    let repo: InMemoryStudentRepository;

    beforeEach(() => {
        repo = new InMemoryStudentRepository();
        service = new StudentModelService(repo);
    });

    describe('applySignal (pure function)', () => {
        const baseState: ConceptState = {
            userId,
            conceptId: 'test-concept',
            skillId,
            graphId,
            confidence: 0.5,
            depth: 0.3,
            attempts: 1,
            misconceptions: [],
            learningStyle: 'unknown',
            lastSeenAt: new Date(),
        };

        it('should increase confidence on deep understanding', () => {
            const signal: LearningSignal = {
                signalType: 'deep_understanding',
                topic: 'test-concept',
                confidence: 0.9,
                depth: 0.85,
            };
            const result = applySignal(baseState, signal);
            expect(result.confidence).toBeGreaterThanOrEqual(0.9);
            expect(result.depth).toBeGreaterThanOrEqual(0.8);
        });

        it('should average confidence on shallow understanding', () => {
            const signal: LearningSignal = {
                signalType: 'shallow_understanding',
                topic: 'test-concept',
                confidence: 0.4,
                depth: 0.2,
            };
            const result = applySignal(baseState, signal);
            expect(result.confidence).toBe((0.5 + 0.4) / 2);
            expect(result.depth).toBeLessThanOrEqual(0.3);
        });

        it('should decrease confidence on reteach', () => {
            const signal: LearningSignal = {
                signalType: 'needed_reteach',
                topic: 'test-concept',
                confidence: 0.2,
                note: 'Confused X with Y',
            };
            const result = applySignal(baseState, signal);
            expect(result.confidence).toBeLessThan(0.5);
            expect(result.misconceptions).toContain('Confused X with Y');
        });

        it('should boost depth on insightful question', () => {
            const signal: LearningSignal = {
                signalType: 'asked_insightful_question',
                topic: 'test-concept',
                confidence: 0.6,
            };
            const result = applySignal(baseState, signal);
            expect(result.depth).toBeGreaterThan(0.3);
        });

        it('should not mutate the original state', () => {
            const signal: LearningSignal = {
                signalType: 'deep_understanding',
                topic: 'test-concept',
                confidence: 0.9,
            };
            const result = applySignal(baseState, signal);
            expect(baseState.confidence).toBe(0.5); // original unchanged
            expect(result).not.toBe(baseState); // different object
        });

        it('should cap confidence at 1.0', () => {
            const highState = { ...baseState, confidence: 0.95 };
            const signal: LearningSignal = {
                signalType: 'applied_correctly',
                topic: 'test-concept',
                confidence: 1.0,
            };
            const result = applySignal(highState, signal);
            expect(result.confidence).toBeLessThanOrEqual(1.0);
        });

        it('should cap at 5 misconceptions', () => {
            let state = { ...baseState, misconceptions: ['a', 'b', 'c', 'd', 'e'] };
            const signal: LearningSignal = {
                signalType: 'needed_reteach',
                topic: 'test-concept',
                confidence: 0.2,
                note: 'Misconception 6',
            };
            const result = applySignal(state, signal);
            expect(result.misconceptions.length).toBeLessThanOrEqual(5);
            expect(result.misconceptions).toContain('Misconception 6');
        });

        it('should detect visual learning style', () => {
            const signal: LearningSignal = {
                signalType: 'deep_understanding',
                topic: 'test-concept',
                confidence: 0.8,
                widgetsUsed: 'NEURON_VISUALIZER,BLACKBOARD',
            };
            const result = applySignal(baseState, signal);
            expect(result.learningStyle).toBe('visual');
        });

        it('should detect code learning style', () => {
            const signal: LearningSignal = {
                signalType: 'deep_understanding',
                topic: 'test-concept',
                confidence: 0.8,
                widgetsUsed: 'CODE_EDITOR,BLACKBOARD',
            };
            const result = applySignal(baseState, signal);
            expect(result.learningStyle).toBe('code');
        });
    });

    describe('StudentModelService', () => {
        it('should return new student summary when empty', async () => {
            const summary = await service.getSummary(userId, skillId, graphId);
            expect(summary).toContain('[STUDENT MODEL]');
            expect(summary).toContain('New student');
        });

        it('should persist and retrieve learning signals', async () => {
            await service.updateFromSignal(userId, skillId, graphId, {
                signalType: 'deep_understanding',
                topic: 'backpropagation',
                confidence: 0.9,
                depth: 0.85,
            });

            const concepts = await service.getConcepts(userId, skillId);
            expect(concepts.length).toBe(1);
            expect(concepts[0].conceptId).toBe('backpropagation');
            expect(concepts[0].confidence).toBeGreaterThanOrEqual(0.9);
        });

        it('should show confident concepts in summary', async () => {
            await service.updateFromSignal(userId, skillId, graphId, {
                signalType: 'deep_understanding',
                topic: 'activations',
                confidence: 0.9,
            });

            const summary = await service.getSummary(userId, skillId, graphId);
            expect(summary).toContain('activations');
            expect(summary).toContain('Confident');
        });

        it('should show struggling concepts in summary', async () => {
            await service.updateFromSignal(userId, skillId, graphId, {
                signalType: 'needed_reteach',
                topic: 'gradients',
                confidence: 0.2,
                note: 'Confused gradient with derivative',
            });

            const summary = await service.getSummary(userId, skillId, graphId);
            expect(summary).toContain('Struggles');
            expect(summary).toContain('Confused gradient with derivative');
        });

        it('should reset model for a user+skill', async () => {
            await service.updateFromSignal(userId, skillId, graphId, {
                signalType: 'deep_understanding',
                topic: 'softmax',
                confidence: 0.9,
            });

            await service.reset(userId, skillId);
            const concepts = await service.getConcepts(userId, skillId);
            expect(concepts.length).toBe(0);
        });

        it('should throw on missing params', async () => {
            await expect(
                service.updateFromSignal('', skillId, graphId, {
                    signalType: 'deep_understanding',
                    topic: 'x',
                    confidence: 0.5,
                }),
            ).rejects.toThrow('userId');
        });

        it('should isolate users', async () => {
            await service.updateFromSignal('user-A', skillId, graphId, {
                signalType: 'deep_understanding',
                topic: 'dropout',
                confidence: 0.9,
            });
            await service.updateFromSignal('user-B', skillId, graphId, {
                signalType: 'deep_understanding',
                topic: 'dropout',
                confidence: 0.8,
            });

            await service.reset('user-A', skillId);

            expect((await service.getConcepts('user-A', skillId)).length).toBe(0);
            expect((await service.getConcepts('user-B', skillId)).length).toBe(1);

            await service.reset('user-B', skillId);
        });
    });
});
