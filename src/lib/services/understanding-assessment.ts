// ============================================
// Understanding Assessment Service
// Generates questions, evaluates responses, and adapts to learner comprehension
// ============================================

import {
  UnderstandingAssessmentService,
  QuickCheckQuestion,
  AssessmentQuestion,
  ComprehensionResult,
  LearningContext,
  DifficultyLevel,
  QuestionType,
  AssessmentRubric,
  SuggestedAction,
  AssessmentError
} from '@/types/interactive-course';

/**
 * Understanding assessment service implementation
 * Handles question generation, response evaluation, and comprehension analysis
 */
export class UnderstandingAssessment implements UnderstandingAssessmentService {

  /**
   * Create a quick comprehension check question
   */
  async createQuickCheck(concept: string, difficulty: DifficultyLevel): Promise<QuickCheckQuestion> {
    try {
      const questionType = this.selectQuestionType(difficulty);
      const question = await this.generateQuickCheckQuestion(concept, difficulty, questionType);
      
      return {
        id: `quick_check_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: questionType,
        question: question.question,
        options: question.options,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        concept,
        difficulty
      };
    } catch (error) {
      throw new AssessmentError(`Failed to create quick check for ${concept}: ${error}`, '', '');
    }
  }

  /**
   * Evaluate learner response to assessment question
   */
  async evaluateResponse(questionId: string, response: string): Promise<ComprehensionResult> {
    try {
      // In a real implementation, this would retrieve the question from database
      // For now, we'll extract concept from questionId or use a fallback approach
      const concept = this.extractConceptFromQuestionId(questionId);
      
      const evaluation = await this.performResponseEvaluation(response, concept);
      
      return {
        correct: evaluation.isCorrect,
        confidenceLevel: evaluation.confidence,
        conceptMastery: evaluation.mastery,
        suggestedAction: evaluation.nextAction,
        feedback: evaluation.feedback
      };
    } catch (error) {
      throw new AssessmentError(`Failed to evaluate response for question ${questionId}: ${error}`, '', questionId);
    }
  }

  /**
   * Generate adaptive questions based on learning context
   */
  async generateAdaptiveQuestions(context: LearningContext): Promise<AssessmentQuestion[]> {
    try {
      const questions: AssessmentQuestion[] = [];
      
      // Generate questions for current concepts
      for (const concept of context.currentConcepts) {
        const difficulty = this.determineDifficultyFromContext(context, concept);
        const question = await this.generateAssessmentQuestion(concept, difficulty, context);
        questions.push(question);
      }
      
      // Generate synthesis questions if multiple concepts are mastered
      if (context.masteredConcepts.length >= 2) {
        const synthesisQuestion = await this.generateSynthesisQuestion(context.masteredConcepts, context);
        questions.push(synthesisQuestion);
      }
      
      // Generate remediation questions for struggling areas
      for (const strugglingArea of context.strugglingAreas) {
        const remediationQuestion = await this.generateRemediationQuestion(strugglingArea, context);
        questions.push(remediationQuestion);
      }
      
      return questions;
    } catch (error) {
      throw new AssessmentError(`Failed to generate adaptive questions: ${error}`, '');
    }
  }

  /**
   * Evaluate comprehension level based on multiple assessment results
   */
  async evaluateComprehensionLevel(assessmentResults: ComprehensionResult[], context: LearningContext): Promise<number> {
    if (assessmentResults.length === 0) {
      return context.comprehensionLevel;
    }

    const correctCount = assessmentResults.filter(result => result.correct).length;
    const totalCount = assessmentResults.length;
    const accuracyRate = correctCount / totalCount;

    // Calculate average confidence level
    const avgConfidence = assessmentResults.reduce((sum, result) => sum + result.confidenceLevel, 0) / totalCount;

    // Calculate average concept mastery
    const avgMastery = assessmentResults.reduce((sum, result) => sum + result.conceptMastery, 0) / totalCount;

    // Weighted comprehension calculation
    const comprehensionLevel = (accuracyRate * 0.5) + (avgConfidence * 0.25) + (avgMastery * 0.25);

    return Math.max(0, Math.min(1, comprehensionLevel));
  }

  /**
   * Determine next learning action based on assessment results
   */
  determineNextLearningAction(comprehensionResults: ComprehensionResult[], context: LearningContext): SuggestedAction {
    if (comprehensionResults.length === 0) {
      return 'proceed';
    }

    const correctCount = comprehensionResults.filter(result => result.correct).length;
    const totalCount = comprehensionResults.length;
    const accuracyRate = correctCount / totalCount;

    // Check for consistent mastery
    if (accuracyRate >= 0.8 && context.comprehensionLevel >= 0.7) {
      return 'challenge';
    }

    // Check if review is needed
    if (accuracyRate < 0.5 || context.strugglingAreas.length > 0) {
      return 'review';
    }

    // Check if practice is needed
    if (accuracyRate < 0.7) {
      return 'practice';
    }

    return 'proceed';
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * Select appropriate question type based on difficulty
   */
  private selectQuestionType(difficulty: DifficultyLevel): QuestionType {
    switch (difficulty) {
      case 'Easy':
        return Math.random() < 0.6 ? 'multiple_choice' : 'true_false';
      case 'Medium':
        return Math.random() < 0.5 ? 'multiple_choice' : 'short_answer';
      case 'Hard':
        return Math.random() < 0.3 ? 'multiple_choice' : 'short_answer';
      default:
        return 'multiple_choice';
    }
  }

  /**
   * Generate quick check question based on concept and difficulty
   */
  private async generateQuickCheckQuestion(
    concept: string, 
    difficulty: DifficultyLevel, 
    type: QuestionType
  ): Promise<{
    question: string;
    options?: string[];
    correctAnswer: string;
    explanation: string;
  }> {
    // In production, this would use AI generation
    // For now, we'll use template-based generation
    
    switch (type) {
      case 'multiple_choice':
        return this.generateMultipleChoiceQuestion(concept, difficulty);
      case 'true_false':
        return this.generateTrueFalseQuestion(concept, difficulty);
      case 'short_answer':
        return this.generateShortAnswerQuestion(concept, difficulty);
      default:
        return this.generateMultipleChoiceQuestion(concept, difficulty);
    }
  }

  /**
   * Generate multiple choice question
   */
  private generateMultipleChoiceQuestion(concept: string, difficulty: DifficultyLevel): {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  } {
    const templates = this.getMultipleChoiceTemplates(difficulty);
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    return {
      question: template.question.replace('{concept}', concept),
      options: template.options.map(option => option.replace('{concept}', concept)),
      correctAnswer: template.correctAnswer.replace('{concept}', concept),
      explanation: template.explanation.replace('{concept}', concept)
    };
  }

  /**
   * Generate true/false question
   */
  private generateTrueFalseQuestion(concept: string, difficulty: DifficultyLevel): {
    question: string;
    correctAnswer: string;
    explanation: string;
  } {
    const templates = this.getTrueFalseTemplates(difficulty);
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    return {
      question: template.question.replace('{concept}', concept),
      correctAnswer: template.correctAnswer,
      explanation: template.explanation.replace('{concept}', concept)
    };
  }

  /**
   * Generate short answer question
   */
  private generateShortAnswerQuestion(concept: string, difficulty: DifficultyLevel): {
    question: string;
    correctAnswer: string;
    explanation: string;
  } {
    const templates = this.getShortAnswerTemplates(difficulty);
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    return {
      question: template.question.replace('{concept}', concept),
      correctAnswer: template.correctAnswer.replace('{concept}', concept),
      explanation: template.explanation.replace('{concept}', concept)
    };
  }

  /**
   * Get multiple choice question templates
   */
  private getMultipleChoiceTemplates(difficulty: DifficultyLevel) {
    const easyTemplates = [
      {
        question: "What is the main purpose of {concept}?",
        options: [
          "To solve complex problems efficiently",
          "To make code more readable",
          "To improve performance",
          "To handle user input"
        ],
        correctAnswer: "To solve complex problems efficiently",
        explanation: "{concept} is primarily designed to solve complex problems efficiently."
      },
      {
        question: "Which of the following best describes {concept}?",
        options: [
          "A fundamental programming concept",
          "A type of database",
          "A user interface element",
          "A network protocol"
        ],
        correctAnswer: "A fundamental programming concept",
        explanation: "{concept} is indeed a fundamental programming concept that forms the basis for many applications."
      }
    ];

    const mediumTemplates = [
      {
        question: "How does {concept} improve code organization?",
        options: [
          "By separating concerns and improving modularity",
          "By reducing file size",
          "By increasing execution speed",
          "By simplifying syntax"
        ],
        correctAnswer: "By separating concerns and improving modularity",
        explanation: "{concept} improves code organization by separating concerns and improving modularity, making code more maintainable."
      },
      {
        question: "What are the key benefits of using {concept} in software development?",
        options: [
          "Reusability, maintainability, and scalability",
          "Faster compilation and smaller file sizes",
          "Better graphics and user interface",
          "Improved network connectivity"
        ],
        correctAnswer: "Reusability, maintainability, and scalability",
        explanation: "The key benefits of {concept} include reusability, maintainability, and scalability in software development."
      }
    ];

    const hardTemplates = [
      {
        question: "In what scenarios would you choose {concept} over alternative approaches?",
        options: [
          "When dealing with complex state management and data flow",
          "When building simple static websites",
          "When working with basic arithmetic operations",
          "When creating simple text documents"
        ],
        correctAnswer: "When dealing with complex state management and data flow",
        explanation: "{concept} is particularly valuable when dealing with complex state management and data flow scenarios."
      },
      {
        question: "What are the potential trade-offs when implementing {concept}?",
        options: [
          "Increased complexity vs. improved maintainability",
          "Faster loading vs. better graphics",
          "Smaller file size vs. more features",
          "Better security vs. easier installation"
        ],
        correctAnswer: "Increased complexity vs. improved maintainability",
        explanation: "Implementing {concept} often involves trade-offs between increased initial complexity and improved long-term maintainability."
      }
    ];

    switch (difficulty) {
      case 'Easy':
        return easyTemplates;
      case 'Medium':
        return mediumTemplates;
      case 'Hard':
        return hardTemplates;
      default:
        return easyTemplates;
    }
  }

  /**
   * Get true/false question templates
   */
  private getTrueFalseTemplates(difficulty: DifficultyLevel) {
    const easyTemplates = [
      {
        question: "{concept} is an important concept in programming.",
        correctAnswer: "True",
        explanation: "Yes, {concept} is indeed an important concept in programming that helps solve various problems."
      },
      {
        question: "{concept} can only be used in one programming language.",
        correctAnswer: "False",
        explanation: "False. {concept} is a general programming concept that can be applied across multiple programming languages."
      }
    ];

    const mediumTemplates = [
      {
        question: "{concept} always improves code performance.",
        correctAnswer: "False",
        explanation: "False. While {concept} can improve code organization and maintainability, it doesn't always guarantee better performance."
      },
      {
        question: "Understanding {concept} is essential for advanced programming.",
        correctAnswer: "True",
        explanation: "True. Understanding {concept} is crucial for advanced programming as it forms the foundation for many complex applications."
      }
    ];

    const hardTemplates = [
      {
        question: "{concept} should be used in every software project regardless of complexity.",
        correctAnswer: "False",
        explanation: "False. {concept} should be used judiciously based on project requirements and complexity. Over-engineering simple solutions can be counterproductive."
      },
      {
        question: "The benefits of {concept} outweigh its complexity in most enterprise applications.",
        correctAnswer: "True",
        explanation: "True. In most enterprise applications, the benefits of {concept} such as maintainability and scalability typically outweigh the initial complexity."
      }
    ];

    switch (difficulty) {
      case 'Easy':
        return easyTemplates;
      case 'Medium':
        return mediumTemplates;
      case 'Hard':
        return hardTemplates;
      default:
        return easyTemplates;
    }
  }

  /**
   * Get short answer question templates
   */
  private getShortAnswerTemplates(difficulty: DifficultyLevel) {
    const easyTemplates = [
      {
        question: "Explain what {concept} is in your own words.",
        correctAnswer: "{concept} is a programming concept that helps organize and structure code effectively.",
        explanation: "A good answer should demonstrate basic understanding of what {concept} is and its general purpose."
      },
      {
        question: "Give an example of when you might use {concept}.",
        correctAnswer: "You might use {concept} when building applications that need organized, maintainable code structure.",
        explanation: "The answer should show understanding of practical applications of {concept}."
      }
    ];

    const mediumTemplates = [
      {
        question: "Describe the key principles behind {concept} and why they matter.",
        correctAnswer: "The key principles of {concept} include modularity, reusability, and separation of concerns, which improve code maintainability.",
        explanation: "A strong answer should identify core principles and explain their importance for software development."
      },
      {
        question: "Compare {concept} with a simpler approach and explain the trade-offs.",
        correctAnswer: "{concept} offers better organization and maintainability compared to simpler approaches, but may require more initial setup and complexity.",
        explanation: "The answer should demonstrate understanding of both benefits and costs of using {concept}."
      }
    ];

    const hardTemplates = [
      {
        question: "Analyze how {concept} addresses specific challenges in software architecture.",
        correctAnswer: "{concept} addresses challenges like code complexity, maintainability, and scalability by providing structured approaches to problem-solving.",
        explanation: "A comprehensive answer should identify specific architectural challenges and explain how {concept} provides solutions."
      },
      {
        question: "Evaluate the long-term implications of choosing {concept} for a large-scale project.",
        correctAnswer: "Long-term implications include improved maintainability and team collaboration, but require investment in learning and consistent implementation.",
        explanation: "The answer should consider both positive and negative long-term effects on project success and team productivity."
      }
    ];

    switch (difficulty) {
      case 'Easy':
        return easyTemplates;
      case 'Medium':
        return mediumTemplates;
      case 'Hard':
        return hardTemplates;
      default:
        return easyTemplates;
    }
  }

  /**
   * Perform response evaluation
   */
  private async performResponseEvaluation(response: string, concept: string): Promise<{
    isCorrect: boolean;
    confidence: number;
    mastery: number;
    nextAction: SuggestedAction;
    feedback: string;
  }> {
    // Simplified evaluation logic - in production, this would use AI/NLP
    const responseLower = response.toLowerCase();
    const conceptLower = concept.toLowerCase();
    
    // Check if response mentions the concept
    const mentionsConcept = responseLower.includes(conceptLower);
    
    // Check for key understanding indicators
    const understandingIndicators = [
      'understand', 'because', 'therefore', 'example', 'like', 'such as',
      'means', 'helps', 'allows', 'enables', 'provides', 'offers'
    ];
    
    const indicatorCount = understandingIndicators.filter(indicator => 
      responseLower.includes(indicator)
    ).length;
    
    // Check response length (longer responses often indicate better understanding)
    const responseLength = response.trim().split(/\s+/).length;
    
    // Calculate scores
    const conceptScore = mentionsConcept ? 0.3 : 0;
    const indicatorScore = Math.min(indicatorCount * 0.1, 0.4);
    const lengthScore = Math.min(responseLength * 0.02, 0.3);
    
    const totalScore = conceptScore + indicatorScore + lengthScore;
    const isCorrect = totalScore >= 0.5;
    
    // Calculate confidence based on response quality
    const confidence = Math.min(totalScore + 0.2, 1.0);
    
    // Calculate mastery (similar to correctness but more conservative)
    const mastery = Math.min(totalScore * 0.8, 0.9);
    
    // Determine next action
    let nextAction: SuggestedAction;
    if (totalScore >= 0.8) {
      nextAction = 'challenge';
    } else if (totalScore >= 0.6) {
      nextAction = 'proceed';
    } else if (totalScore >= 0.3) {
      nextAction = 'practice';
    } else {
      nextAction = 'review';
    }
    
    // Generate feedback
    const feedback = this.generateFeedback(isCorrect, totalScore, concept);
    
    return {
      isCorrect,
      confidence,
      mastery,
      nextAction,
      feedback
    };
  }

  /**
   * Generate feedback based on evaluation results
   */
  private generateFeedback(isCorrect: boolean, score: number, concept: string): string {
    if (isCorrect) {
      if (score >= 0.8) {
        return `Excellent! You have a strong understanding of ${concept}. Your explanation shows deep comprehension.`;
      } else if (score >= 0.6) {
        return `Good work! You understand ${concept} well. Consider adding more specific examples to strengthen your explanation.`;
      } else {
        return `You're on the right track with ${concept}! Your understanding is developing well.`;
      }
    } else {
      if (score >= 0.3) {
        return `You're getting there! You have some understanding of ${concept}, but let's work on clarifying a few key points.`;
      } else {
        return `Let's revisit ${concept} together. I'll explain it differently to help you understand it better.`;
      }
    }
  }

  /**
   * Extract concept from question ID (simplified approach)
   */
  private extractConceptFromQuestionId(questionId: string): string {
    // In a real implementation, this would query the database
    // For now, we'll use a fallback approach
    if (questionId.includes('functions')) return 'Functions';
    if (questionId.includes('variables')) return 'Variables';
    if (questionId.includes('loops')) return 'Loops';
    if (questionId.includes('arrays')) return 'Arrays';
    if (questionId.includes('objects')) return 'Objects';
    
    return 'Programming Concept';
  }

  /**
   * Determine difficulty based on learning context
   */
  private determineDifficultyFromContext(context: LearningContext, concept: string): DifficultyLevel {
    // If struggling with this concept, use easier questions
    if (context.strugglingAreas.includes(concept)) {
      return 'Easy';
    }
    
    // If already mastered, use harder questions
    if (context.masteredConcepts.includes(concept)) {
      return 'Hard';
    }
    
    // Base on overall comprehension level
    if (context.comprehensionLevel >= 0.7) {
      return 'Hard';
    } else if (context.comprehensionLevel >= 0.4) {
      return 'Medium';
    } else {
      return 'Easy';
    }
  }

  /**
   * Generate comprehensive assessment question
   */
  private async generateAssessmentQuestion(
    concept: string, 
    difficulty: DifficultyLevel, 
    context: LearningContext
  ): Promise<AssessmentQuestion> {
    const questionType = this.selectQuestionType(difficulty);
    const questionData = await this.generateQuickCheckQuestion(concept, difficulty, questionType);
    
    return {
      id: `assessment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      concept,
      question: questionData.question,
      type: questionType,
      difficulty,
      expectedAnswer: questionData.correctAnswer,
      rubric: this.generateAssessmentRubric(concept, difficulty, questionData.correctAnswer)
    };
  }

  /**
   * Generate assessment rubric
   */
  private generateAssessmentRubric(concept: string, difficulty: DifficultyLevel, correctAnswer: string): AssessmentRubric {
    return {
      fullCredit: [
        `Correctly identifies key aspects of ${concept}`,
        'Demonstrates clear understanding of the concept',
        'Provides accurate and complete explanation'
      ],
      partialCredit: [
        `Shows some understanding of ${concept}`,
        'Identifies at least one key aspect correctly',
        'Demonstrates basic comprehension'
      ],
      commonMistakes: [
        `Confuses ${concept} with related concepts`,
        'Provides incomplete or vague explanation',
        'Misses key characteristics or principles'
      ],
      hints: [
        `Think about what makes ${concept} unique`,
        `Consider how ${concept} is used in practice`,
        'Remember the key principles we discussed'
      ]
    };
  }

  /**
   * Generate synthesis question combining multiple concepts
   */
  private async generateSynthesisQuestion(
    masteredConcepts: string[], 
    context: LearningContext
  ): Promise<AssessmentQuestion> {
    const concepts = masteredConcepts.slice(0, 3); // Limit to 3 concepts for clarity
    const conceptList = concepts.join(', ');
    
    return {
      id: `synthesis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      concept: `Synthesis: ${conceptList}`,
      question: `How do ${conceptList} work together in a real-world application? Provide a specific example.`,
      type: 'short_answer',
      difficulty: 'Hard',
      expectedAnswer: `${conceptList} work together by combining their individual strengths to create more robust and maintainable applications.`,
      rubric: {
        fullCredit: [
          'Demonstrates understanding of how concepts integrate',
          'Provides specific, realistic example',
          'Shows advanced comprehension of relationships'
        ],
        partialCredit: [
          'Shows some understanding of concept relationships',
          'Provides general example',
          'Demonstrates basic integration knowledge'
        ],
        commonMistakes: [
          'Treats concepts as completely separate',
          'Provides vague or unrealistic examples',
          'Misses key integration opportunities'
        ],
        hints: [
          'Think about how these concepts complement each other',
          'Consider a specific project or application',
          'Focus on the benefits of combining these approaches'
        ]
      }
    };
  }

  /**
   * Generate remediation question for struggling areas
   */
  private async generateRemediationQuestion(
    strugglingArea: string, 
    context: LearningContext
  ): Promise<AssessmentQuestion> {
    return {
      id: `remediation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      concept: strugglingArea,
      question: `Let's revisit ${strugglingArea}. What is one key thing you remember about it?`,
      type: 'short_answer',
      difficulty: 'Easy',
      expectedAnswer: `${strugglingArea} is a concept that helps in programming by providing structure and organization.`,
      rubric: {
        fullCredit: [
          `Shows any correct understanding of ${strugglingArea}`,
          'Demonstrates willingness to engage with the concept',
          'Provides any relevant information'
        ],
        partialCredit: [
          'Shows effort to recall information',
          'Demonstrates basic recognition',
          'Attempts to engage with the concept'
        ],
        commonMistakes: [
          'Completely avoids the question',
          'Provides unrelated information',
          'Shows no recognition of the concept'
        ],
        hints: [
          'Think about when we first discussed this',
          'Remember any examples we used',
          'Consider what problem this concept solves'
        ]
      }
    };
  }
}

/**
 * Singleton instance of the understanding assessment service
 */
export const understandingAssessment = new UnderstandingAssessment();