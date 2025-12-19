// ============================================
// Course Content Transformer
// Transforms static course content into conversational format
// ============================================

import { LearningContext } from '@/types/interactive-course';

/**
 * Course content transformation service
 */
export class CourseContentTransformer {
  
  /**
   * Transform static course content into conversational format
   */
  async transformToConversational(
    content: string, 
    context: LearningContext,
    sessionId?: string
  ): Promise<string> {
    try {
      // Use Genie API for intelligent transformation
      const response = await fetch('/api/genie/interactive-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userMessage: `Transform this course content into a natural, engaging conversation: ${content}`,
          sessionId,
          learningContext: context,
          courseContent: content
        })
      });

      if (!response.ok) {
        throw new Error(`Content transformation failed: ${response.status}`);
      }

      const data = await response.json();
      return data.response || this.fallbackTransformation(content, context);
    } catch (error) {
      console.warn('Content transformation API failed, using fallback:', error);
      return this.fallbackTransformation(content, context);
    }
  }

  /**
   * Integrate multimedia elements into conversational content
   */
  async integrateMultimedia(
    content: string,
    multimediaElements: MultimediaElement[],
    context: LearningContext,
    sessionId?: string
  ): Promise<string> {
    try {
      const multimediaContext = this.buildMultimediaContext(multimediaElements);
      
      const response = await fetch('/api/genie/interactive-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userMessage: `Present this content conversationally, naturally referencing the multimedia elements: ${content}`,
          sessionId,
          learningContext: context,
          courseContent: `${content}\n\nMultimedia Elements: ${multimediaContext}`
        })
      });

      if (!response.ok) {
        throw new Error(`Multimedia integration failed: ${response.status}`);
      }

      const data = await response.json();
      return data.response || this.fallbackMultimediaIntegration(content, multimediaElements, context);
    } catch (error) {
      console.warn('Multimedia integration API failed, using fallback:', error);
      return this.fallbackMultimediaIntegration(content, multimediaElements, context);
    }
  }

  /**
   * Transform course section with learning objectives
   */
  async transformSectionWithObjectives(
    sectionTitle: string,
    content: string,
    learningObjectives: string[],
    context: LearningContext,
    sessionId?: string
  ): Promise<ConversationalSection> {
    try {
      const objectivesText = learningObjectives.join(', ');
      const prompt = `Transform this course section into a conversational introduction. Section: "${sectionTitle}". Content: ${content}. Learning objectives: ${objectivesText}`;
      
      const response = await fetch('/api/genie/interactive-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userMessage: prompt,
          sessionId,
          learningContext: context,
          courseContent: content
        })
      });

      if (!response.ok) {
        throw new Error(`Section transformation failed: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        conversationalIntro: data.response || this.fallbackSectionIntro(sectionTitle, content, context),
        suggestedQuestions: this.generateSuggestedQuestions(learningObjectives),
        nextAction: data.nextAction || 'continue_explanation'
      };
    } catch (error) {
      console.warn('Section transformation API failed, using fallback:', error);
      return {
        conversationalIntro: this.fallbackSectionIntro(sectionTitle, content, context),
        suggestedQuestions: this.generateSuggestedQuestions(learningObjectives),
        nextAction: 'continue_explanation'
      };
    }
  }

  /**
   * Adapt content based on comprehension level
   */
  adaptContentToComprehension(content: string, context: LearningContext): string {
    const comprehensionLevel = context.comprehensionLevel;
    
    if (comprehensionLevel < 0.3) {
      // Low comprehension - simplify and break down
      return this.simplifyContent(content, context);
    } else if (comprehensionLevel > 0.7) {
      // High comprehension - add depth and connections
      return this.enrichContent(content, context);
    } else {
      // Medium comprehension - balanced approach
      return this.balanceContent(content, context);
    }
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * Fallback content transformation
   */
  private fallbackTransformation(content: string, context: LearningContext): string {
    const comprehensionLevel = context.comprehensionLevel;
    const masteredConcepts = context.masteredConcepts;
    
    let intro = "Let me explain this in a way that builds on what you already know. ";
    
    if (masteredConcepts.length > 0) {
      intro += `Since you've mastered ${masteredConcepts[masteredConcepts.length - 1]}, this will connect nicely. `;
    }
    
    if (comprehensionLevel < 0.3) {
      intro += "I'll break this down step by step: ";
    } else if (comprehensionLevel > 0.7) {
      intro += "Let's dive deeper into this concept: ";
    } else {
      intro += "Here's what we need to understand: ";
    }
    
    return intro + this.makeContentConversational(content);
  }

  /**
   * Make content sound more conversational
   */
  private makeContentConversational(content: string): string {
    return content
      .replace(/\. /g, '. You see, ')
      .replace(/However,/g, 'But here\'s the interesting part -')
      .replace(/Therefore,/g, 'So what this means is')
      .replace(/In conclusion,/g, 'To wrap this up,')
      .replace(/It is important to note/g, 'What\'s really important here is');
  }

  /**
   * Build multimedia context description
   */
  private buildMultimediaContext(elements: MultimediaElement[]): string {
    return elements.map(element => {
      switch (element.type) {
        case 'video':
          return `Video: ${element.title || 'Educational video'} - ${element.description || 'Visual demonstration'}`;
        case 'image':
          return `Image: ${element.title || 'Diagram'} - ${element.description || 'Visual aid'}`;
        case 'interactive':
          return `Interactive: ${element.title || 'Interactive element'} - ${element.description || 'Hands-on activity'}`;
        case 'audio':
          return `Audio: ${element.title || 'Audio content'} - ${element.description || 'Audio explanation'}`;
        default:
          return `Media: ${element.title || 'Content'} - ${element.description || 'Supporting material'}`;
      }
    }).join(', ');
  }

  /**
   * Fallback multimedia integration
   */
  private fallbackMultimediaIntegration(
    content: string, 
    elements: MultimediaElement[], 
    context: LearningContext
  ): string {
    let result = this.fallbackTransformation(content, context);
    
    if (elements.length > 0) {
      const mediaReferences = elements.map(element => {
        switch (element.type) {
          case 'video':
            return 'the video demonstration';
          case 'image':
            return 'the diagram we\'re looking at';
          case 'interactive':
            return 'the interactive exercise';
          case 'audio':
            return 'the audio explanation';
          default:
            return 'the visual aid';
        }
      });
      
      if (mediaReferences.length === 1) {
        result += ` Take a look at ${mediaReferences[0]} - it really helps illustrate this concept.`;
      } else {
        result += ` Notice how ${mediaReferences.slice(0, -1).join(', ')} and ${mediaReferences[mediaReferences.length - 1]} all work together to show you this concept.`;
      }
    }
    
    return result;
  }

  /**
   * Fallback section introduction
   */
  private fallbackSectionIntro(sectionTitle: string, content: string, context: LearningContext): string {
    const comprehensionLevel = context.comprehensionLevel;
    
    let intro = `Great! Now we're moving into ${sectionTitle}. `;
    
    if (comprehensionLevel > 0.7) {
      intro += "Since you've been doing so well, I think you'll find this section really interesting. ";
    } else if (comprehensionLevel < 0.3) {
      intro += "Don't worry if the previous concepts felt challenging - we'll take this step by step. ";
    } else {
      intro += "You're making good progress, so let's build on what you've learned. ";
    }
    
    return intro + this.makeContentConversational(content.substring(0, 200) + '...');
  }

  /**
   * Generate suggested questions based on learning objectives
   */
  private generateSuggestedQuestions(objectives: string[]): string[] {
    return objectives.map(objective => {
      if (objective.toLowerCase().includes('understand')) {
        return `Can you explain how ${objective.replace('understand', '').trim()} works?`;
      } else if (objective.toLowerCase().includes('identify')) {
        return `What are the key characteristics of ${objective.replace('identify', '').trim()}?`;
      } else if (objective.toLowerCase().includes('apply')) {
        return `How would you apply ${objective.replace('apply', '').trim()} in a real situation?`;
      } else {
        return `What questions do you have about ${objective}?`;
      }
    });
  }

  /**
   * Simplify content for low comprehension
   */
  private simplifyContent(content: string, context: LearningContext): string {
    return `Let me break this down into simple steps for you: ${content}. I'll make sure each part is clear before we move on.`;
  }

  /**
   * Enrich content for high comprehension
   */
  private enrichContent(content: string, context: LearningContext): string {
    const connections = context.masteredConcepts.length > 0 
      ? ` This connects to ${context.masteredConcepts.slice(-2).join(' and ')} that you've already mastered.`
      : '';
    
    return `Since you're doing so well, let's explore this more deeply: ${content}.${connections} What advanced applications can you think of?`;
  }

  /**
   * Balance content for medium comprehension
   */
  private balanceContent(content: string, context: LearningContext): string {
    return `You're making good progress, so let's build on that: ${content}. I'll provide examples to make this clearer.`;
  }
}

// ============================================
// Type Definitions
// ============================================

export interface MultimediaElement {
  type: 'video' | 'image' | 'interactive' | 'audio' | 'document';
  title?: string;
  description?: string;
  url?: string;
  duration?: number; // for video/audio
  metadata?: Record<string, any>;
}

export interface ConversationalSection {
  conversationalIntro: string;
  suggestedQuestions: string[];
  nextAction: string;
}

/**
 * Singleton instance of the course content transformer
 */
export const courseContentTransformer = new CourseContentTransformer();