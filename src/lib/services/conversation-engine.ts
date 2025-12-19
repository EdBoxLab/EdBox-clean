// ============================================
// Conversation Engine
// Manages conversational flow and Genie interactions
// ============================================

import {
  ConversationEngine,
  InteractiveCourseSession,
  GenieResponse,
  GenieResponseType,
  LearningContext,
  AssessmentQuestion,
  ComprehensionData,
  DifficultyLevel,
  ConversationError,
  ConversationMessage
} from '@/types/interactive-course';
import { sessionManager } from './interactive-course-session-manager';

/**
 * Conversation engine implementation for interactive course experience
 */
export class InteractiveCourseConversationEngine implements ConversationEngine {
  
  /**
   * Initialize a new interactive course session
   */
  async initializeSession(courseId: string, userId: string): Promise<InteractiveCourseSession> {
    try {
      const session = await sessionManager.createSession(courseId, userId);
      
      // Add welcome message from Genie
      await sessionManager.addMessage(
        session.id,
        'genie',
        `Welcome to your interactive learning journey! I'm Genie, and I'll be guiding you through this course. Let's start exploring together! 🎓`,
        'explanation',
        { 
          conceptsCovered: [],
          difficultyLevel: 'Easy',
          learnerEngagement: 1.0
        }
      );

      return session;
    } catch (error) {
      throw new ConversationError(`Failed to initialize session: ${error}`, '');
    }
  }

  /**
   * Resume an existing session
   */
  async resumeSession(sessionId: string): Promise<InteractiveCourseSession> {
    try {
      const resumeData = await sessionManager.getSessionResumeData(sessionId);
      
      // Add resume message from Genie
      await sessionManager.addMessage(
        sessionId,
        'genie',
        `Welcome back! Let's continue where we left off. I remember we were working on ${resumeData.session.currentTopic || 'your learning journey'}. Ready to keep going? 🚀`,
        'explanation',
        { 
          conceptsCovered: resumeData.session.learningContext.currentConcepts,
          difficultyLevel: 'Easy',
          learnerEngagement: 0.8
        }
      );

      return resumeData.session;
    } catch (error) {
      throw new ConversationError(`Failed to resume session: ${error}`, sessionId);
    }
  }

  /**
   * Process learner input and generate Genie response
   */
  async processLearnerInput(sessionId: string, input: string): Promise<GenieResponse> {
    try {
      const startTime = Date.now();
      
      // Add learner message to conversation
      await sessionManager.addMessage(
        sessionId,
        'learner',
        input,
        'question',
        { 
          responseTime: 0, // Will be calculated by frontend
          learnerEngagement: this.calculateEngagementScore(input)
        }
      );

      // Get session context with conversation history
      const resumeData = await sessionManager.getSessionResumeData(sessionId);
      const session = resumeData.session;

      // Get conversation history and enhance learning context
      const conversationHistory = await sessionManager.getSessionHistory(sessionId, 10);
      const enhancedContext = this.enhanceContextWithHistory(session.learningContext, conversationHistory);

      // Generate contextual response based on current learning state
      const response = await this.generateContextualResponse(input, enhancedContext, sessionId, session.courseId, conversationHistory);

      // Update learning context based on interaction
      const updatedContext = this.updateContextFromInteraction(enhancedContext, input, response);
      session.learningContext = updatedContext;
      await sessionManager.persistSession(session);

      // Add Genie response to conversation
      const messageType = this.mapResponseTypeToMessageType(response.responseType);
      const responseTime = Date.now() - startTime;
      
      await sessionManager.addMessage(
        sessionId,
        'genie',
        response.content,
        messageType,
        {
          conceptsCovered: this.extractConceptsFromResponse(response.content),
          difficultyLevel: this.determineDifficultyLevel(response.content, updatedContext),
          learnerEngagement: 0.9,
          responseTime
        }
      );

      return response;
    } catch (error) {
      throw new ConversationError(`Failed to process learner input: ${error}`, sessionId);
    }
  }

  /**
   * Generate explanation for a topic
   */
  async generateExplanation(topic: string, context: LearningContext): Promise<string> {
    try {
      // Use Genie API to generate contextual explanation
      const prompt = `Please explain ${topic} in a conversational way that builds on what I already know.`;
      
      const response = await this.callGenieAPI(prompt, context);
      return response.content;
    } catch (error) {
      // Fallback to template-based explanation
      const fallbackExplanation = this.createTopicExplanation(topic, context);
      return fallbackExplanation;
    }
  }

  /**
   * Transform static course content into conversational format
   */
  async transformCourseContent(content: string, context: LearningContext, sessionId?: string): Promise<string> {
    try {
      const prompt = `Transform this course content into a natural conversation. Make it engaging and build on what I already know: ${content}`;
      
      const response = await this.callGenieAPI(prompt, context, sessionId);
      return response.content;
    } catch (error) {
      // Fallback to basic transformation
      return this.basicContentTransformation(content, context);
    }
  }

  /**
   * Generate course content with multimedia integration
   */
  async generateMultimediaIntegratedContent(content: string, multimediaElements: string[], context: LearningContext): Promise<string> {
    try {
      const multimediaContext = multimediaElements.length > 0 
        ? `Reference these multimedia elements naturally: ${multimediaElements.join(', ')}`
        : '';
      
      const prompt = `Present this course content conversationally, integrating multimedia elements naturally: ${content}. ${multimediaContext}`;
      
      const response = await this.callGenieAPI(prompt, context);
      return response.content;
    } catch (error) {
      // Fallback to basic content with multimedia references
      return this.basicMultimediaIntegration(content, multimediaElements, context);
    }
  }

  /**
   * Create assessment question for a concept
   */
  async createAssessmentQuestion(concept: string, difficulty: DifficultyLevel): Promise<AssessmentQuestion> {
    try {
      // This is a simplified implementation - in production, this would use AI generation
      const question = this.generateAssessmentQuestion(concept, difficulty);
      return question;
    } catch (error) {
      throw new ConversationError(`Failed to create assessment question: ${error}`, '');
    }
  }

  /**
   * Adapt conversation flow based on comprehension data
   */
  async adaptConversationFlow(sessionId: string, comprehensionData: ComprehensionData): Promise<void> {
    try {
      const resumeData = await sessionManager.getSessionResumeData(sessionId);
      const session = resumeData.session;

      // Update learning context based on comprehension
      const updatedContext = this.updateLearningContext(session.learningContext, comprehensionData);
      
      // Update session with new context
      session.learningContext = updatedContext;
      await sessionManager.persistSession(session);

      // Generate adaptive response
      const adaptiveMessage = this.generateAdaptiveMessage(comprehensionData);
      
      await sessionManager.addMessage(
        sessionId,
        'genie',
        adaptiveMessage,
        'feedback',
        {
          conceptsCovered: [comprehensionData.concept],
          difficultyLevel: 'Medium',
          learnerEngagement: comprehensionData.correct ? 1.0 : 0.7
        }
      );
    } catch (error) {
      throw new ConversationError(`Failed to adapt conversation flow: ${error}`, sessionId);
    }
  }

  /**
   * End a session
   */
  async endSession(sessionId: string): Promise<boolean> {
    try {
      await sessionManager.addMessage(
        sessionId,
        'genie',
        `Great work in today's session! You've made excellent progress. I'll be here whenever you're ready to continue learning. Keep up the amazing work! 🌟`,
        'encouragement',
        {
          conceptsCovered: [],
          difficultyLevel: 'Easy',
          learnerEngagement: 1.0
        }
      );

      await sessionManager.endSession(sessionId);
      return true;
    } catch (error) {
      throw new ConversationError(`Failed to end session: ${error}`, sessionId);
    }
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * Map GenieResponseType to MessageType for database storage
   */
  private mapResponseTypeToMessageType(responseType: GenieResponseType): 'explanation' | 'question' | 'assessment' | 'challenge' | 'feedback' | 'encouragement' {
    switch (responseType) {
      case 'explanation':
        return 'explanation';
      case 'question':
        return 'question';
      case 'encouragement':
        return 'encouragement';
      case 'challenge_intro':
        return 'challenge';
      case 'feedback':
        return 'feedback';
      default:
        return 'explanation';
    }
  }

  /**
   * Generate contextual response based on input and learning context
   */
  private async generateContextualResponse(input: string, context: LearningContext, sessionId?: string, courseId?: string, conversationHistory?: ConversationMessage[]): Promise<GenieResponse> {
    try {
      // Use the enhanced Genie API for intelligent response generation
      const genieResponse = await this.callGenieAPI(input, context, sessionId, courseId, conversationHistory);
      return genieResponse;
    } catch (error) {
      // Fallback to rule-based responses if Genie API fails
      return this.generateFallbackResponse(input, context);
    }
  }

  /**
   * Call Genie API with course context
   */
  private async callGenieAPI(input: string, context: LearningContext, sessionId?: string, courseId?: string, conversationHistory?: ConversationMessage[]): Promise<GenieResponse> {
    try {
      // Use the enhanced interactive course API
      const response = await fetch('/api/genie/interactive-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userMessage: input,
          sessionId,
          courseId,
          learningContext: context,
          conversationHistory: conversationHistory?.slice(-6) // Last 6 messages for context
        })
      });

      if (!response.ok) {
        throw new Error(`Interactive Course Genie API failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        content: data.response || 'I apologize, but I encountered an issue. Could you please rephrase your question?',
        responseType: data.responseType || 'explanation',
        nextAction: data.nextAction || 'continue_explanation',
        suggestedFollowUp: data.suggestedFollowUp,
        metadata: data.metadata
      };
    } catch (error) {
      // Fallback to basic Genie API
      return this.callBasicGenieAPI(input, context);
    }
  }

  /**
   * Fallback to basic Genie API when enhanced API fails
   */
  private async callBasicGenieAPI(input: string, context: LearningContext): Promise<GenieResponse> {
    const courseContext = this.buildCourseContext(context);
    
    const response = await fetch('/api/genie/respond', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userMessage: input,
        skillTitle: context.currentConcepts.join(', ') || 'Interactive Course',
        context: courseContext
      })
    });

    if (!response.ok) {
      throw new Error(`Genie API failed: ${response.status}`);
    }

    const data = await response.json();
    const responseContent = data.response || 'I apologize, but I encountered an issue. Could you please rephrase your question?';
    
    // Analyze response for next action and type
    const nextAction = this.determineNextAction(input, context, responseContent);
    const responseType = this.determineResponseType(responseContent, nextAction);
    
    return {
      content: responseContent,
      responseType,
      nextAction,
      suggestedFollowUp: this.generateFollowUpSuggestion(nextAction, context)
    };
  }

  /**
   * Build course-specific context for Genie
   */
  private buildCourseContext(context: LearningContext): string {
    const contextParts = [];
    
    if (context.currentConcepts.length > 0) {
      contextParts.push(`Currently learning: ${context.currentConcepts.join(', ')}`);
    }
    
    if (context.masteredConcepts.length > 0) {
      contextParts.push(`Already mastered: ${context.masteredConcepts.join(', ')}`);
    }
    
    if (context.strugglingAreas.length > 0) {
      contextParts.push(`Areas needing attention: ${context.strugglingAreas.join(', ')}`);
    }
    
    contextParts.push(`Comprehension level: ${Math.round(context.comprehensionLevel * 100)}%`);
    contextParts.push(`Learning style: ${context.preferredLearningStyle || 'adaptive'}`);
    
    return contextParts.join('. ');
  }

  /**
   * Determine next action based on input and context
   */
  private determineNextAction(input: string, context: LearningContext, response: string): 'continue_explanation' | 'assess_understanding' | 'deliver_challenge' | 'move_to_next_topic' {
    const inputLower = input.toLowerCase();
    const responseLower = response.toLowerCase();
    
    // Check if learner is asking for challenges or practice
    if (inputLower.includes('challenge') || inputLower.includes('practice') || inputLower.includes('test')) {
      return 'deliver_challenge';
    }
    
    // Check if learner indicates understanding and readiness
    if (inputLower.includes('understand') || inputLower.includes('got it') || inputLower.includes('ready')) {
      return 'assess_understanding';
    }
    
    // Check if response suggests moving to assessment
    if (responseLower.includes('question') || responseLower.includes('check') || responseLower.includes('quiz')) {
      return 'assess_understanding';
    }
    
    // Check if response suggests a challenge
    if (responseLower.includes('challenge') || responseLower.includes('practice') || responseLower.includes('apply')) {
      return 'deliver_challenge';
    }
    
    // Check comprehension level to determine if ready for next topic
    if (context.comprehensionLevel > 0.8 && context.currentConcepts.length > 0) {
      return 'move_to_next_topic';
    }
    
    // Default to continuing explanation
    return 'continue_explanation';
  }

  /**
   * Determine response type based on content and next action
   */
  private determineResponseType(response: string, nextAction: string): GenieResponseType {
    const responseLower = response.toLowerCase();
    
    if (nextAction === 'deliver_challenge') {
      return 'challenge_intro';
    }
    
    if (responseLower.includes('great') || responseLower.includes('excellent') || responseLower.includes('well done')) {
      return 'encouragement';
    }
    
    if (responseLower.includes('?') || nextAction === 'assess_understanding') {
      return 'question';
    }
    
    if (responseLower.includes('feedback') || responseLower.includes('result')) {
      return 'feedback';
    }
    
    return 'explanation';
  }

  /**
   * Generate follow-up suggestion based on next action
   */
  private generateFollowUpSuggestion(nextAction: string, context: LearningContext): string {
    switch (nextAction) {
      case 'assess_understanding':
        return 'Would you like me to check your understanding with a quick question?';
      case 'deliver_challenge':
        return 'Ready to put your knowledge to the test with a challenge?';
      case 'move_to_next_topic':
        return 'Shall we move on to the next concept?';
      default:
        return 'What would you like to explore next?';
    }
  }

  /**
   * Generate fallback response when Genie API is unavailable
   */
  private generateFallbackResponse(input: string, context: LearningContext): GenieResponse {
    const inputLower = input.toLowerCase();
    
    if (inputLower.includes('help') || inputLower.includes('confused')) {
      return {
        content: `I understand you might need some help! Let me break this down differently. ${this.getHelpfulExplanation(context)}`,
        responseType: 'explanation',
        nextAction: 'assess_understanding',
        suggestedFollowUp: 'Would you like me to explain this concept in a different way?'
      };
    }

    if (inputLower.includes('ready') || inputLower.includes('understand')) {
      return {
        content: `Excellent! I can see you're engaged and ready to move forward. Let me check your understanding with a quick question.`,
        responseType: 'encouragement',
        nextAction: 'assess_understanding',
        suggestedFollowUp: 'Are you ready for a quick comprehension check?'
      };
    }

    if (inputLower.includes('challenge') || inputLower.includes('practice')) {
      return {
        content: `I love your enthusiasm for practice! Let me prepare a challenge that matches what we've been learning.`,
        responseType: 'challenge_intro',
        nextAction: 'deliver_challenge',
        suggestedFollowUp: 'Ready to put your knowledge to the test?'
      };
    }

    // Default response
    return {
      content: `That's a great point! Let me build on what you've said and connect it to what we're learning. ${this.getContextualResponse(context)}`,
      responseType: 'explanation',
      nextAction: 'continue_explanation',
      suggestedFollowUp: 'What would you like to explore next?'
    };
  }

  /**
   * Create topic explanation based on context
   */
  private createTopicExplanation(topic: string, context: LearningContext): string {
    const masteredConcepts = context.masteredConcepts.length;
    const currentLevel = context.comprehensionLevel;

    if (currentLevel < 0.3) {
      return `Let's start with the basics of ${topic}. I'll explain this step by step to make sure we build a solid foundation.`;
    } else if (currentLevel > 0.7) {
      return `Since you've shown great understanding so far, let's dive deeper into ${topic} and explore some advanced concepts.`;
    } else {
      return `Now that we've covered the fundamentals, let's explore ${topic} and see how it connects to what you already know.`;
    }
  }

  /**
   * Generate assessment question for concept
   */
  private generateAssessmentQuestion(concept: string, difficulty: DifficultyLevel): AssessmentQuestion {
    // Simplified question generation - in production, this would use AI
    return {
      id: `assessment_${Date.now()}`,
      concept,
      question: `Can you explain the key aspects of ${concept}?`,
      type: 'short_answer',
      difficulty,
      expectedAnswer: `Key aspects of ${concept} include...`,
      rubric: {
        fullCredit: [`Mentions key aspects of ${concept}`, 'Shows understanding of core principles'],
        partialCredit: [`Shows some understanding of ${concept}`, 'Identifies at least one key aspect'],
        commonMistakes: ['Confuses with related concepts', 'Provides incomplete explanation'],
        hints: [`Think about what makes ${concept} unique`, `Consider how ${concept} relates to what we've learned`]
      }
    };
  }

  /**
   * Update learning context based on comprehension data
   */
  private updateLearningContext(context: LearningContext, comprehensionData: ComprehensionData): LearningContext {
    const updatedContext = { ...context };

    if (comprehensionData.correct) {
      // Add to mastered concepts if not already there
      if (!updatedContext.masteredConcepts.includes(comprehensionData.concept)) {
        updatedContext.masteredConcepts.push(comprehensionData.concept);
      }
      // Remove from struggling areas if present
      updatedContext.strugglingAreas = updatedContext.strugglingAreas.filter(
        area => area !== comprehensionData.concept
      );
      // Increase comprehension level
      updatedContext.comprehensionLevel = Math.min(1.0, updatedContext.comprehensionLevel + 0.1);
    } else {
      // Add to struggling areas if not already there
      if (!updatedContext.strugglingAreas.includes(comprehensionData.concept)) {
        updatedContext.strugglingAreas.push(comprehensionData.concept);
      }
      // Decrease comprehension level slightly
      updatedContext.comprehensionLevel = Math.max(0.0, updatedContext.comprehensionLevel - 0.05);
    }

    return updatedContext;
  }

  /**
   * Generate adaptive message based on comprehension
   */
  private generateAdaptiveMessage(comprehensionData: ComprehensionData): string {
    if (comprehensionData.correct) {
      return `Excellent work! You've shown great understanding of ${comprehensionData.concept}. Let's build on this success and move to the next concept.`;
    } else {
      return `No worries! ${comprehensionData.concept} can be tricky. Let me explain it differently and we'll practice until you feel confident.`;
    }
  }

  /**
   * Get helpful explanation based on context
   */
  private getHelpfulExplanation(context: LearningContext): string {
    if (context.strugglingAreas.length > 0) {
      return `I notice you might be finding ${context.strugglingAreas[0]} challenging. Let's approach it from a different angle.`;
    }
    return `Let me break this down into smaller, more manageable pieces.`;
  }

  /**
   * Get contextual response based on learning context
   */
  private getContextualResponse(context: LearningContext): string {
    if (context.masteredConcepts.length > 0) {
      return `This connects well with ${context.masteredConcepts[context.masteredConcepts.length - 1]} that you've already mastered.`;
    }
    return `This is a fundamental concept that will help you understand many other topics we'll explore.`;
  }

  /**
   * Calculate engagement score based on learner input
   */
  private calculateEngagementScore(input: string): number {
    const inputLower = input.toLowerCase();
    let score = 0.5; // Base score
    
    // Positive engagement indicators
    if (inputLower.includes('interesting') || inputLower.includes('cool') || inputLower.includes('amazing')) {
      score += 0.3;
    }
    if (inputLower.includes('question') || inputLower.includes('?')) {
      score += 0.2;
    }
    if (inputLower.includes('understand') || inputLower.includes('got it')) {
      score += 0.2;
    }
    if (inputLower.includes('more') || inputLower.includes('tell me')) {
      score += 0.1;
    }
    
    // Negative engagement indicators
    if (inputLower.includes('boring') || inputLower.includes('confused') || inputLower.includes('lost')) {
      score -= 0.2;
    }
    if (input.length < 5) {
      score -= 0.1;
    }
    
    return Math.max(0.1, Math.min(1.0, score));
  }

  /**
   * Enhance learning context with conversation history
   */
  private enhanceContextWithHistory(context: LearningContext, history: ConversationMessage[]): LearningContext {
    const enhancedContext = { ...context };
    
    // Extract concepts mentioned in recent conversation
    const mentionedConcepts = new Set<string>();
    
    history.forEach(message => {
      if (message.metadata?.conceptsCovered) {
        message.metadata.conceptsCovered.forEach((concept: string) => {
          mentionedConcepts.add(concept);
        });
      }
    });
    
    // Update current concepts with recently mentioned ones
    enhancedContext.currentConcepts = [
      ...new Set([...enhancedContext.currentConcepts, ...Array.from(mentionedConcepts)])
    ];
    
    return enhancedContext;
  }

  /**
   * Update context based on interaction
   */
  private updateContextFromInteraction(context: LearningContext, input: string, response: GenieResponse): LearningContext {
    const updatedContext = { ...context };
    const inputLower = input.toLowerCase();
    
    // Update comprehension level based on interaction quality
    if (inputLower.includes('understand') || inputLower.includes('clear')) {
      updatedContext.comprehensionLevel = Math.min(1.0, updatedContext.comprehensionLevel + 0.05);
    } else if (inputLower.includes('confused') || inputLower.includes('help')) {
      updatedContext.comprehensionLevel = Math.max(0.0, updatedContext.comprehensionLevel - 0.05);
    }
    
    // Extract new concepts from response
    const newConcepts = this.extractConceptsFromResponse(response.content);
    newConcepts.forEach(concept => {
      if (!updatedContext.currentConcepts.includes(concept)) {
        updatedContext.currentConcepts.push(concept);
      }
    });
    
    return updatedContext;
  }

  /**
   * Extract concepts from response content
   */
  private extractConceptsFromResponse(content: string): string[] {
    const concepts: string[] = [];
    const contentLower = content.toLowerCase();
    
    // Simple concept extraction - in production, this would use NLP
    const conceptKeywords = [
      'algorithm', 'function', 'variable', 'loop', 'condition', 'array', 'object',
      'class', 'method', 'property', 'inheritance', 'polymorphism', 'abstraction',
      'database', 'query', 'table', 'relationship', 'normalization',
      'network', 'protocol', 'server', 'client', 'api', 'rest', 'http'
    ];
    
    conceptKeywords.forEach(keyword => {
      if (contentLower.includes(keyword)) {
        concepts.push(keyword);
      }
    });
    
    return concepts;
  }

  /**
   * Determine difficulty level based on response and context
   */
  private determineDifficultyLevel(content: string, context: LearningContext): DifficultyLevel {
    const contentLower = content.toLowerCase();
    
    // Check for difficulty indicators in content
    if (contentLower.includes('advanced') || contentLower.includes('complex') || contentLower.includes('sophisticated')) {
      return 'Hard';
    }
    
    if (contentLower.includes('basic') || contentLower.includes('simple') || contentLower.includes('fundamental')) {
      return 'Easy';
    }
    
    // Base on comprehension level
    if (context.comprehensionLevel > 0.7) {
      return 'Hard';
    } else if (context.comprehensionLevel < 0.3) {
      return 'Easy';
    }
    
    return 'Medium';
  }

  /**
   * Basic content transformation fallback
   */
  private basicContentTransformation(content: string, context: LearningContext): string {
    const comprehensionLevel = context.comprehensionLevel;
    
    if (comprehensionLevel < 0.3) {
      return `Let me break this down simply for you: ${content}. I'll explain each part step by step so it's easy to understand.`;
    } else if (comprehensionLevel > 0.7) {
      return `Since you've been doing great, let's dive into this: ${content}. I think you'll find the connections to what you already know really interesting.`;
    } else {
      return `Here's what we need to cover: ${content}. I'll connect this to what you've already learned to make it clearer.`;
    }
  }

  /**
   * Basic multimedia integration fallback
   */
  private basicMultimediaIntegration(content: string, multimediaElements: string[], context: LearningContext): string {
    let result = this.basicContentTransformation(content, context);
    
    if (multimediaElements.length > 0) {
      const mediaReferences = multimediaElements.map(element => {
        if (element.includes('video')) {
          return 'the video we just watched';
        } else if (element.includes('image') || element.includes('diagram')) {
          return 'the diagram we looked at';
        } else if (element.includes('interactive')) {
          return 'the interactive element we used';
        } else {
          return `the ${element}`;
        }
      }).join(' and ');
      
      result += ` Remember ${mediaReferences}? That really helps illustrate these concepts.`;
    }
    
    return result;
  }
}

/**
 * Singleton instance of the conversation engine
 */
export const conversationEngine = new InteractiveCourseConversationEngine();