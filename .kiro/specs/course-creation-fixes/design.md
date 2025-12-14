# Design Document

## Overview

This design addresses three critical issues in the course creation system: engine mapping failures, skill graph validation errors, and Node.js deprecation warnings. The solution involves fixing the engine normalization logic, ensuring proper validation schema compliance, and updating deprecated URL parsing methods.

## Architecture

The course creation system follows this flow:
1. User submits course creation request
2. AI generates skill graph with engine assignments
3. System normalizes and validates the skill graph
4. Validated data is saved to database
5. Response is returned to user

The issues occur in steps 3 and 4, where engine mapping fails and validation rejects the normalized data.

## Components and Interfaces

### Engine Mapping Component
- **Location**: `src/app/api/learning-path/generate/ai/generateSkillGraph.ts`
- **Function**: `normalizeEngine(engine: string): EngineType`
- **Purpose**: Convert AI-generated engine names to valid EngineType enum values
- **Current Issue**: Case sensitivity and incomplete mapping

### Validation Component
- **Location**: `src/app/api/learning-path/generate/validators/skillGraphValidator.ts`
- **Purpose**: Ensure skill graph data matches expected schema
- **Current Issue**: Validation fails after engine normalization

### URL Processing
- **Location**: Various dependencies (likely in node_modules)
- **Current Issue**: Using deprecated `url.parse()` method
- **Impact**: Console warnings but no functional failure

## Data Models

### EngineType Enum
```typescript
export enum EngineType {
  CodeStudio = "codestudio",
  LinguaLab = "lingualab", 
  ArtStudio = "artstudio",
  HistoryMach = "historymach",
  PhysicsEngine = "physicsengine",
  ChemLab = "chemlab",
  MathLab = "mathlab",
  FinLab = "finlab",
  WritingStudio = "writingstudio"
}
```

### Skill Graph Structure
```typescript
export type SkillGraphData = {
  goal: string;
  nodes: SkillNode[];
  miniProjects: MiniProjectNode[];
  capstone: CapstoneNode;
};
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Case-insensitive engine mapping
*For any* valid engine name in any case format (uppercase, lowercase, mixed case), the normalizeEngine function should return the correct EngineType enum value
**Validates: Requirements 1.2**

### Property 2: Unknown engine fallback behavior
*For any* string that is not a valid engine name, the normalizeEngine function should return EngineType.FinLab as the default
**Validates: Requirements 1.3**

### Property 3: Engine format consistency
*For any* engine name that can be provided in both AI-generated format and internal enum format, the normalizeEngine function should handle both consistently
**Validates: Requirements 1.5**

### Property 4: Valid skill graph acceptance
*For any* properly structured skill graph with all required fields and correct types, the validation function should accept it
**Validates: Requirements 2.1**

### Property 5: Invalid field rejection
*For any* skill graph missing required fields or having incorrectly typed fields, the validation function should reject it
**Validates: Requirements 2.2**

### Property 6: Array content validation
*For any* skill graph with array fields (prereqs, skills), the validation should only accept arrays containing valid string values
**Validates: Requirements 2.4**

## Error Handling

### Engine Mapping Errors
- Unknown engines default to FinLab with console warning
- Maintain backward compatibility with existing engine names
- Log detailed information for debugging

### Validation Errors
- Provide specific error messages for missing fields
- Include field names and expected types in error messages
- Fail fast with clear feedback

### Deprecation Warnings
- Update dependencies where possible
- Implement workarounds for unavoidable warnings
- Document any remaining warnings with mitigation plans

## Testing Strategy

### Unit Testing
- Test engine mapping with various input formats
- Test validation with valid and invalid skill graphs
- Test error handling paths

### Property-Based Testing
- Generate random engine names and verify mapping behavior
- Generate random skill graphs and verify validation consistency
- Test edge cases with malformed data

The testing approach will use Jest for unit tests and fast-check for property-based testing to ensure comprehensive coverage of the engine mapping and validation logic.