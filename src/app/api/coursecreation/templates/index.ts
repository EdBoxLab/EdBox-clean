import fs from 'fs';
import path from 'path';

import { CourseCategory } from '@/lib/courseCreation/types';
export { CourseCategory };

const templateCache: Record<string, string> = {};
const templatesDir = path.join(process.cwd(), 'src', 'app', 'api', 'coursecreation', 'templates');

export function listTemplates(): string[] {
  try {
    return fs.readdirSync(templatesDir).filter(f => f.endsWith('.md'));
  } catch (error) {
    console.error('Error listing templates:', error);
    return [];
  }
}

export function getTemplateContent(filename: string): string {
  const filePath = path.join(templatesDir, filename);
  if (!fs.existsSync(filePath)) throw new Error(`Template ${filename} not found`);
  return fs.readFileSync(filePath, 'utf-8');
}

export function getTemplateForCourse(category: CourseCategory): string {
  if (templateCache[category]) {
    return templateCache[category];
  }

  const templatePath = path.join(templatesDir, `${category}.md`);
  
  try {
    if (fs.existsSync(templatePath)) {
      const template = fs.readFileSync(templatePath, 'utf-8');
      templateCache[category] = template;
      return template;
    }
    console.warn(`Template file not found at ${templatePath}, using general template`);
    return getGeneralTemplate();
  } catch (error) {
    console.warn(`Error reading template for ${category}, using general template:`, error);
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
    return CourseCategory.Language;
  }

  if (
    combined.includes('code') ||
    combined.includes('programming') ||
    combined.includes('web dev') ||
    combined.includes('software') ||
    combined.includes('data science') ||
    combined.includes('machine learning') ||
    combined.includes('algorithm') ||
    combined.includes('python') ||
    combined.includes('javascript') ||
    combined.includes('typescript') ||
    combined.includes('react')
  ) {
    return CourseCategory.Technical;
  }

  if (
    combined.includes('art') ||
    combined.includes('design') ||
    combined.includes('drawing') ||
    combined.includes('illustration') ||
    combined.includes('writing') ||
    combined.includes('creative') ||
    combined.includes('photography') ||
    combined.includes('music') ||
    combined.includes('video')
  ) {
    return CourseCategory.Creative;
  }

  if (
    combined.includes('physics') ||
    combined.includes('chemistry') ||
    combined.includes('biology') ||
    combined.includes('science') ||
    combined.includes('experiment') ||
    combined.includes('math') ||
    combined.includes('calculus')
  ) {
    return CourseCategory.ScienceLower;
  }

  if (
    combined.includes('business') ||
    combined.includes('finance') ||
    combined.includes('entrepreneur') ||
    combined.includes('marketing') ||
    combined.includes('investing') ||
    combined.includes('economics') ||
    combined.includes('startup') ||
    combined.includes('management')
  ) {
    return CourseCategory.BusinessLower;
  }

  return CourseCategory.General;
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
  return `COURSE CONTENT GUIDELINES FOR ${category.toUpperCase()}:\n${template}\n\n---\n\nSTRUCTURAL REQUIREMENTS:\n${basePrompt}`;
}
