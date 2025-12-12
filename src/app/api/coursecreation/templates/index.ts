import fs from 'fs';
import path from 'path';

export type CourseCategory = 'language' | 'technical' | 'creative' | 'science' | 'business' | 'general';

const templateCache: Record<string, string> = {};

export function getTemplateForCourse(category: CourseCategory): string {
  if (templateCache[category]) {
    return templateCache[category];
  }

  const templatePath = path.join(process.cwd(), 'src', 'app', 'api', 'coursecreation', 'templates', `${category}.md`);
  
  try {
    const template = fs.readFileSync(templatePath, 'utf-8');
    templateCache[category] = template;
    return template;
  } catch (error) {
    console.warn(`Template not found for ${category}, using general template`);
    return getGeneralTemplate();
  }
}

export function detectCourseCategory(goal: string, domain: string): CourseCategory {
  const goalLower = goal.toLowerCase();
  const domainLower = domain.toLowerCase();
  const combined = `${goalLower} ${domainLower}`;

  if (
    combined.includes('language') ||
    combined.includes('french') ||
    combined.includes('spanish') ||
    combined.includes('german') ||
    combined.includes('japanese') ||
    combined.includes('chinese') ||
    combined.includes('ielts') ||
    combined.includes('toefl') ||
    combined.includes('delf') ||
    combined.includes('jlpt')
  ) {
    return 'language';
  }

  if (
    combined.includes('code') ||
    combined.includes('programming') ||
    combined.includes('web dev') ||
    combined.includes('software') ||
    combined.includes('data science') ||
    combined.includes('machine learning') ||
    combined.includes('algorithm')
  ) {
    return 'technical';
  }

  if (
    combined.includes('art') ||
    combined.includes('design') ||
    combined.includes('drawing') ||
    combined.includes('illustration') ||
    combined.includes('writing') ||
    combined.includes('creative') ||
    combined.includes('photography')
  ) {
    return 'creative';
  }

  if (
    combined.includes('physics') ||
    combined.includes('chemistry') ||
    combined.includes('biology') ||
    combined.includes('science') ||
    combined.includes('experiment')
  ) {
    return 'science';
  }

  if (
    combined.includes('business') ||
    combined.includes('finance') ||
    combined.includes('entrepreneur') ||
    combined.includes('marketing') ||
    combined.includes('investing') ||
    combined.includes('economics')
  ) {
    return 'business';
  }

  return 'general';
}

function getGeneralTemplate(): string {
  return `# General Course Template

You are an expert curriculum designer for Gen Z learners (16-24 years old).

**CRITICAL REQUIREMENTS:**
1. Break topics into MICRO-SKILLS (2-5 minutes each)
2. Focus on PRACTICAL, hands-on learning
3. Each skill should have a tangible outcome
4. Total 12-20 micro-skills organized into skill paths
5. Include 2-4 mini-projects
6. One capstone project

**Structure:**
- 3-5 skill paths organized logically
- Clear prerequisites between skills
- Engaging challenge types
- XP rewards for motivation

Respond ONLY with valid JSON matching the expected schema.`;
}

export function injectTemplateIntoPrompt(basePrompt: string, category: CourseCategory): string {
  const template = getTemplateForCourse(category);
  return `${template}\n\n---\n\n${basePrompt}`;
}
