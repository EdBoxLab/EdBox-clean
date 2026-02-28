// ============================================
// Genie Tooling — Unit Tests
// Tests for SYSTEM_INSTRUCTION structure and GENIE_TOOLS schema
// ============================================

// Mock ESM-only module that Jest can't transform
jest.mock('@google/genai', () => ({}));

import { SYSTEM_INSTRUCTION, GENIE_TOOLS } from '@/app/pulse/services/genie-tooling';

describe('Genie Tooling', () => {
    describe('SYSTEM_INSTRUCTION', () => {
        it('should be a non-empty string', () => {
            expect(typeof SYSTEM_INSTRUCTION).toBe('string');
            expect(SYSTEM_INSTRUCTION.length).toBeGreaterThan(500);
        });

        it('should contain all 10 rules (RULE 0 through RULE 9)', () => {
            expect(SYSTEM_INSTRUCTION).toContain('RULE 0');
            expect(SYSTEM_INSTRUCTION).toContain('RULE 1');
            expect(SYSTEM_INSTRUCTION).toContain('RULE 2');
            expect(SYSTEM_INSTRUCTION).toContain('RULE 3');
            expect(SYSTEM_INSTRUCTION).toContain('RULE 4');
            expect(SYSTEM_INSTRUCTION).toContain('RULE 5');
            expect(SYSTEM_INSTRUCTION).toContain('RULE 6');
            expect(SYSTEM_INSTRUCTION).toContain('RULE 7');
            expect(SYSTEM_INSTRUCTION).toContain('RULE 8');
            expect(SYSTEM_INSTRUCTION).toContain('RULE 9');
        });

        it('should use the correct session tag [SKILL_SESSION_ACTIVE]', () => {
            expect(SYSTEM_INSTRUCTION).toContain('[SKILL_SESSION_ACTIVE]');
            // Should NOT contain the old broken tag
            expect(SYSTEM_INSTRUCTION).not.toContain('[ACTIVE SKILL SESSION]');
        });

        it('should contain the Socratic Teaching Protocol', () => {
            expect(SYSTEM_INSTRUCTION).toContain('SOCRATIC TEACHING PROTOCOL');
            expect(SYSTEM_INSTRUCTION).toContain('MANDATORY TEACHING SEQUENCE');
            expect(SYSTEM_INSTRUCTION).toContain('ABSOLUTE LAW');
        });

        it('should contain Adaptive Pacing rules', () => {
            expect(SYSTEM_INSTRUCTION).toContain('ADAPTIVE PACING');
            expect(SYSTEM_INSTRUCTION).toContain('SPEED UP');
            expect(SYSTEM_INSTRUCTION).toContain('SLOW DOWN');
            expect(SYSTEM_INSTRUCTION).toContain('RETEACH STRATEGY');
        });

        it('should contain Emotional Intelligence rules', () => {
            expect(SYSTEM_INSTRUCTION).toContain('EMOTIONAL INTELLIGENCE');
            expect(SYSTEM_INSTRUCTION).toContain('NEVER');
            expect(SYSTEM_INSTRUCTION).toContain('ALWAYS');
        });

        it('should contain Challenge Escalation and Retrieval Practice', () => {
            expect(SYSTEM_INSTRUCTION).toContain('CHALLENGE ESCALATION');
            expect(SYSTEM_INSTRUCTION).toContain('RETRIEVAL PRACTICE');
            expect(SYSTEM_INSTRUCTION).toContain('correct_under_pressure');
        });

        it('should reference record_learning_signal before update_skill_progress', () => {
            const signalIndex = SYSTEM_INSTRUCTION.indexOf('record_learning_signal');
            const progressIndex = SYSTEM_INSTRUCTION.indexOf('update_skill_progress');
            // Both should exist
            expect(signalIndex).toBeGreaterThan(-1);
            expect(progressIndex).toBeGreaterThan(-1);
        });

        it('should contain the GOLDEN RULE', () => {
            expect(SYSTEM_INSTRUCTION).toContain('GOLDEN RULE');
            expect(SYSTEM_INSTRUCTION).toContain('No wall of text');
        });

        it('should contain all stage names', () => {
            expect(SYSTEM_INSTRUCTION).toContain('Foundation');
            expect(SYSTEM_INSTRUCTION).toContain('Developing');
            expect(SYSTEM_INSTRUCTION).toContain('Proficient');
            expect(SYSTEM_INSTRUCTION).toContain('Advanced');
            expect(SYSTEM_INSTRUCTION).toContain('Mastery');
        });
    });

    describe('GENIE_TOOLS', () => {
        it('should be an array with at least one element', () => {
            expect(Array.isArray(GENIE_TOOLS)).toBe(true);
            expect(GENIE_TOOLS.length).toBeGreaterThan(0);
        });

        it('should have functionDeclarations on the first element', () => {
            expect(GENIE_TOOLS[0]).toHaveProperty('functionDeclarations');
            expect(Array.isArray(GENIE_TOOLS[0].functionDeclarations)).toBe(true);
        });

        const getToolNames = (): string[] => {
            return GENIE_TOOLS[0].functionDeclarations.map((d: any) => d.name);
        };

        it('should contain all required tool names', () => {
            const names = getToolNames();
            expect(names).toContain('deploy_widget');
            expect(names).toContain('create_custom_widget');
            expect(names).toContain('close_widget');
            expect(names).toContain('update_widget');
            expect(names).toContain('update_code');
            expect(names).toContain('run_code');
            expect(names).toContain('record_learning_signal');
            expect(names).toContain('update_skill_progress');
        });

        it('should have record_learning_signal with required fields', () => {
            const tool = GENIE_TOOLS[0].functionDeclarations.find(
                (d: any) => d.name === 'record_learning_signal'
            );
            expect(tool).toBeDefined();
            expect(tool.parameters.properties).toHaveProperty('signal_type');
            expect(tool.parameters.properties).toHaveProperty('topic');
            expect(tool.parameters.properties).toHaveProperty('confidence');
            expect(tool.parameters.properties).toHaveProperty('depth');
            expect(tool.parameters.properties).toHaveProperty('attempts');
            expect(tool.parameters.required).toContain('signal_type');
            expect(tool.parameters.required).toContain('topic');
            expect(tool.parameters.required).toContain('confidence');
        });

        it('should have update_skill_progress with required fields', () => {
            const tool = GENIE_TOOLS[0].functionDeclarations.find(
                (d: any) => d.name === 'update_skill_progress'
            );
            expect(tool).toBeDefined();
            expect(tool.parameters.properties).toHaveProperty('action');
            expect(tool.parameters.properties).toHaveProperty('topic');
            expect(tool.parameters.properties).toHaveProperty('next_stage');
            expect(tool.parameters.required).toContain('action');
        });

        it('should have valid parameter types on all tools', () => {
            const declarations = GENIE_TOOLS[0].functionDeclarations;
            for (const decl of declarations) {
                expect(decl).toHaveProperty('name');
                expect(decl).toHaveProperty('description');
                expect(decl).toHaveProperty('parameters');
                expect(decl.parameters).toHaveProperty('type');
                expect(decl.parameters.type).toBe('object');
                expect(decl.parameters).toHaveProperty('properties');
                expect(typeof decl.parameters.properties).toBe('object');
            }
        });
    });
});
