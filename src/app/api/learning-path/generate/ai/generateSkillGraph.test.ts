import * as fc from 'fast-check';
import { EngineType } from '../types/enums';

// Mock the dependencies to avoid import issues
jest.mock('./callAI', () => ({
  callAI: jest.fn()
}));

jest.mock('../validators/skillGraphValidator', () => ({
  validateSkillGraphResult: jest.fn()
}));

// Import after mocking
const { normalizeEngine } = require('./generateSkillGraph');

describe('Engine Mapping Property Tests', () => {
  describe('Property 1: Case-insensitive engine mapping', () => {
    /**
     * Feature: course-creation-fixes, Property 1: Case-insensitive engine mapping
     * Validates: Requirements 1.2
     */
    it('should handle case-insensitive mapping for all valid engine names', () => {
      // Define all valid engine names and their expected mappings
      const validEngineNames = [
        'codestudio', 'lingualab', 'artstudio', 'historymach', 
        'physicsengine', 'chemlab', 'mathlab', 'finlab', 'writingstudio',
        'language', 'languagelab', 'coding', 'code', 'art', 'history',
        'physics', 'chemistry', 'chem', 'math', 'mathematics',
        'finance', 'financial', 'default', 'writing'
      ];

      fc.assert(
        fc.property(
          fc.constantFrom(...validEngineNames),
          fc.constantFrom('lower', 'upper', 'mixed'),
          (engineName, caseType) => {
            // Transform the engine name based on case type
            let transformedName: string;
            switch (caseType) {
              case 'lower':
                transformedName = engineName.toLowerCase();
                break;
              case 'upper':
                transformedName = engineName.toUpperCase();
                break;
              case 'mixed':
                transformedName = engineName
                  .split('')
                  .map((char, index) => index % 2 === 0 ? char.toLowerCase() : char.toUpperCase())
                  .join('');
                break;
              default:
                transformedName = engineName;
            }

            // Get the expected result from the lowercase version
            const expectedResult = normalizeEngine(engineName.toLowerCase());
            const actualResult = normalizeEngine(transformedName);

            // The result should be the same regardless of case
            return actualResult === expectedResult && 
                   Object.values(EngineType).includes(actualResult);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 2: Unknown engine fallback behavior', () => {
    /**
     * Feature: course-creation-fixes, Property 2: Unknown engine fallback behavior
     * Validates: Requirements 1.3
     */
    it('should default to FinLab for unknown engine names', () => {
      // Generate random strings that are not valid engine names
      const validEngineNames = new Set([
        'codestudio', 'lingualab', 'artstudio', 'historymach', 
        'physicsengine', 'chemlab', 'mathlab', 'finlab', 'writingstudio',
        'language', 'languagelab', 'coding', 'code', 'art', 'history',
        'physics', 'chemistry', 'chem', 'math', 'mathematics',
        'finance', 'financial', 'default', 'writing'
      ]);

      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter(str => 
            !validEngineNames.has(str.toLowerCase().trim())
          ),
          (unknownEngine) => {
            const result = normalizeEngine(unknownEngine);
            return result === EngineType.FinLab;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle invalid inputs (null, undefined, empty string)', () => {
      const invalidInputs = [null, undefined, '', '   ', 123, {}, []];
      
      invalidInputs.forEach(input => {
        const result = normalizeEngine(input as any);
        expect(result).toBe(EngineType.FinLab);
      });
    });
  });

  describe('Property 3: Engine format consistency', () => {
    /**
     * Feature: course-creation-fixes, Property 3: Engine format consistency
     * Validates: Requirements 1.5
     */
    it('should handle both AI-generated format and internal enum format consistently', () => {
      // Define mappings between AI-generated names and enum values
      const formatMappings = [
        { aiFormat: 'language', enumFormat: 'lingualab', expected: EngineType.LinguaLab },
        { aiFormat: 'coding', enumFormat: 'codestudio', expected: EngineType.CodeStudio },
        { aiFormat: 'math', enumFormat: 'mathlab', expected: EngineType.MathLab },
        { aiFormat: 'art', enumFormat: 'artstudio', expected: EngineType.ArtStudio },
        { aiFormat: 'history', enumFormat: 'historymach', expected: EngineType.HistoryMach },
        { aiFormat: 'physics', enumFormat: 'physicsengine', expected: EngineType.PhysicsEngine },
        { aiFormat: 'chemistry', enumFormat: 'chemlab', expected: EngineType.ChemLab },
        { aiFormat: 'writing', enumFormat: 'writingstudio', expected: EngineType.WritingStudio },
        { aiFormat: 'default', enumFormat: 'finlab', expected: EngineType.FinLab }
      ];

      fc.assert(
        fc.property(
          fc.constantFrom(...formatMappings),
          (mapping) => {
            const aiResult = normalizeEngine(mapping.aiFormat);
            const enumResult = normalizeEngine(mapping.enumFormat);
            
            return aiResult === mapping.expected && 
                   enumResult === mapping.expected &&
                   aiResult === enumResult;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve functionality with whitespace and case variations', () => {
      const baseEngines = ['codestudio', 'lingualab', 'mathlab'];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...baseEngines),
          fc.string({ maxLength: 3 }).filter(s => /^\s*$/.test(s)), // whitespace only
          fc.string({ maxLength: 3 }).filter(s => /^\s*$/.test(s)), // whitespace only
          (engine, prefixWhitespace, suffixWhitespace) => {
            const paddedEngine = prefixWhitespace + engine + suffixWhitespace;
            const normalResult = normalizeEngine(engine);
            const paddedResult = normalizeEngine(paddedEngine);
            
            return normalResult === paddedResult;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});