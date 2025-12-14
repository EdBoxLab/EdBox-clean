# Requirements Document

## Introduction

This feature addresses critical issues in the course creation system that prevent successful course generation. The system currently fails due to engine mapping problems, validation errors, and deprecation warnings that need to be resolved to ensure reliable course creation functionality.

## Glossary

- **Course Creation System**: The learning path generation API that creates structured learning content
- **Engine Mapping**: The process of converting engine names to valid EngineType enum values
- **Skill Graph**: A structured representation of learning nodes, mini-projects, and capstone projects
- **EngineType**: An enumeration defining valid learning engine identifiers
- **LinguaLab**: A language learning engine for linguistic content
- **Validation Schema**: The expected data structure format for skill graph validation

## Requirements

### Requirement 1

**User Story:** As a user creating a course, I want the system to properly recognize and map engine names, so that my course content is assigned to the correct learning engines.

#### Acceptance Criteria

1. WHEN the AI generates a skill graph with "LinguaLab" engine THEN the system SHALL map it to the correct EngineType.LinguaLab value
2. WHEN the system encounters any valid engine name in any case format THEN the system SHALL normalize it to the correct EngineType enum value
3. WHEN an unknown engine name is provided THEN the system SHALL log a warning and default to EngineType.FinLab
4. WHEN engine mapping occurs THEN the system SHALL preserve the original functionality while fixing the case sensitivity issues
5. WHERE engine names are processed THEN the system SHALL handle both the AI-generated format and the internal enum format consistently

### Requirement 2

**User Story:** As a user creating a course, I want the skill graph validation to succeed, so that my course can be properly generated and saved.

#### Acceptance Criteria

1. WHEN a skill graph is generated THEN the system SHALL validate it against the correct schema format
2. WHEN validation occurs THEN the system SHALL ensure all required fields are present and properly typed
3. WHEN the validation fails THEN the system SHALL provide clear error messages indicating what fields are missing or invalid
4. WHEN arrays are processed THEN the system SHALL ensure they contain valid string values and not placeholder text
5. WHEN the skill graph passes validation THEN the system SHALL proceed with saving the course data

### Requirement 3

**User Story:** As a developer, I want to eliminate deprecation warnings from the system, so that the application runs without Node.js warnings and uses modern APIs.

#### Acceptance Criteria

1. WHEN the system processes URLs THEN the system SHALL use the WHATWG URL API instead of the deprecated url.parse() method
2. WHEN dependencies are updated THEN the system SHALL ensure compatibility with modern Node.js versions
3. WHEN the application runs THEN the system SHALL not generate deprecation warnings in the console
4. WHEN URL parsing is required THEN the system SHALL use new URL() constructor or URL.parse() from the url module
5. WHERE third-party dependencies cause warnings THEN the system SHALL update to compatible versions or implement workarounds