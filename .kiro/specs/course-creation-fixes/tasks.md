# Implementation Plan

- [x] 1. Fix engine mapping in skill graph generation





  - Update the normalizeEngine function to handle case-insensitive mapping
  - Add comprehensive mapping for all EngineType enum values
  - Ensure proper fallback behavior for unknown engines
  - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [x] 1.1 Write property test for case-insensitive engine mapping


  - **Property 1: Case-insensitive engine mapping**
  - **Validates: Requirements 1.2**

- [x] 1.2 Write property test for unknown engine fallback


  - **Property 2: Unknown engine fallback behavior**
  - **Validates: Requirements 1.3**

- [x] 1.3 Write property test for engine format consistency


  - **Property 3: Engine format consistency**
  - **Validates: Requirements 1.5**

- [ ] 2. Fix skill graph validation issues
  - Examine and fix the validation schema to match the normalized data structure
  - Ensure validation accepts properly normalized skill graphs
  - Update validation logic to handle the corrected engine enum values
  - _Requirements: 2.1, 2.2, 2.4_

- [ ] 2.1 Write property test for valid skill graph acceptance
  - **Property 4: Valid skill graph acceptance**
  - **Validates: Requirements 2.1**

- [ ] 2.2 Write property test for invalid field rejection
  - **Property 5: Invalid field rejection**
  - **Validates: Requirements 2.2**

- [ ] 2.3 Write property test for array content validation
  - **Property 6: Array content validation**
  - **Validates: Requirements 2.4**

- [ ] 3. Address deprecation warnings
  - Identify the source of url.parse() deprecation warnings
  - Update dependencies that use deprecated URL parsing methods
  - Implement workarounds if direct dependency updates are not possible
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Integration testing and verification
  - Test the complete course creation flow end-to-end
  - Verify that LinguaLab and other engines are properly assigned
  - Confirm that skill graphs validate successfully
  - Ensure no deprecation warnings appear during course creation
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.3_