// app/api/generate-course/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Course, CourseArchetype, CourseCategory, CourseFormat, EngineType, LearningMode, Module, RoadmapNode, AgentState, RecommendedFormat, InteractionType } from '@/app/api/coursecreation/types';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// ============= API KEY MANAGEMENT =============
const getApiKeys = () => {
  const keys = [
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
    process.env.GEMINI_API_KEY_5,
  ].filter((key): key is string => Boolean(key));

  console.log('🔑 Server-side keys check:', {
    totalKeys: keys.length,
    key1: process.env.GEMINI_API_KEY_1 ? '✅' : '❌',
    key2: process.env.GEMINI_API_KEY_2 ? '✅' : '❌',
  });

  if (keys.length === 0) {
    throw new Error('No API keys configured');
  }
  return keys;
};

let currentKeyIndex = 0;
const getNextApiKey = (): string => {
  const keys = getApiKeys();
  const key = keys[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % keys.length;
  return key;
};

const createAIClient = () => new GoogleGenAI({ apiKey: getNextApiKey() });

// ============= RETRY LOGIC =============
const retryWithBackoff = async <T,>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const isRateLimitError = error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED');
      const isLastRetry = i === maxRetries - 1;
      if (isLastRetry || !isRateLimitError) throw error;

      let retryDelay = baseDelay * Math.pow(2, i);
      if (error?.message?.includes('retry in')) {
        const match = error.message.match(/retry in ([\d.]+)s/);
        if (match) retryDelay = parseFloat(match[1]) * 1000;
      }
      console.log(`⏳ Retry in ${retryDelay}ms... (${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  throw new Error('Max retries exceeded');
};

const sanitizeForPrompt = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
};

// ============= AGENT FUNCTIONS =============
const agent_InitialCoursePlanner = async (prompt: string, fileTextContent?: string): Promise<Partial<Course>> => {
  const ai = createAIClient();
  const systemPrompt = `Agent: Initial Course Planner.\nAnalyze the user's request and define the course's core attributes. Respond with JSON containing: category, subject, title, description, level, engine, courseArchetype.\n- category: ${Object.values(CourseCategory).join(', ')}\n- level: Beginner, Intermediate, Advanced\n- engine: ${Object.values(EngineType).join(', ')}\n- courseArchetype: ${Object.values(CourseArchetype).join(', ')}`;

  let fileContext = fileTextContent ? `\n\nDocument: """${sanitizeForPrompt(fileTextContent.substring(0, 4000))}"""` : '';

  return retryWithBackoff(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: `User: "${prompt}"${fileContext}`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            subject: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            level: { type: Type.STRING },
            engine: { type: Type.STRING },
            courseArchetype: { type: Type.STRING },
          },
          required: ['category', 'subject', 'title', 'description', 'level', 'engine', 'courseArchetype']
        }
      },
    });
    return JSON.parse(response.text);
  });
};

const agent_RoadmapDesigner = async (courseInfo: Partial<Course>): Promise<{ roadmap: RoadmapNode[] }> => {
  const ai = createAIClient();
  const systemPrompt = `Agent: Roadmap Designer.\nCreate a structured learning roadmap with 4 stages: Foundations, Core, Advanced, and Capstone.\nFor each stage, define 1-3 relevant module titles.\nRespond with JSON containing a 'roadmap' array.`;

  return retryWithBackoff(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: `Design a roadmap for a ${courseInfo.level} course: "${courseInfo.title}" on ${courseInfo.subject}. Format: ${courseInfo.format}, Mode: ${courseInfo.mode}`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            roadmap: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  level: { type: Type.STRING },
                  modules: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        title: { type: Type.STRING },
                      },
                      required: ['id', 'title'],
                    },
                  }
                },
                required: ['id', 'title', 'level', 'modules']
              }
            }
          },
          required: ['roadmap']
        }
      },
    });
    return JSON.parse(response.text);
  });
};

const agent_ModuleDesigner = async (courseInfo: Partial<Course>, moduleTitle: string): Promise<Module> => {
  const ai = createAIClient();
  const interactionTypes = Object.values(InteractionType).join(', ');
  const systemPrompt = `Agent: Interactive Experience Designer.\nDesign an engaging learning module. Create concise content (2-3 sentences) and 2-4 diverse interactions. Select appropriate interaction types: [${interactionTypes}]`;

  return retryWithBackoff(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: `Course: "${courseInfo.title}" (${courseInfo.subject})\nEngine: ${courseInfo.engine}, Format: ${courseInfo.format}\nModule: "${moduleTitle}"`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            estimatedTime: { type: Type.STRING },
            content: { type: Type.STRING },
            interactions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING },
                  title: { type: Type.STRING },
                  content: { type: Type.STRING },
                },
                required: ['id', 'type', 'title', 'content']
              }
            },
            isCompleted: { type: Type.BOOLEAN },
            completedInteractionIds: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['id', 'title', 'estimatedTime', 'content', 'interactions']
        }
      }
    });
    const moduleData = JSON.parse(response.text);
    moduleData.isCompleted = false;
    moduleData.completedInteractionIds = [];
    return moduleData;
  });
};

const agent_CoverImageDesigner = async (courseInfo: Partial<Course>): Promise<{ coverImageUrl: string }> => {
  const ai = createAIClient();
  const prompt = `Vibrant educational cover image for: "${courseInfo.title}". Minimalist, inspiring, teal and indigo colors. Digital art, vector illustration.`;

  return retryWithBackoff(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: { parts: [{ text: prompt }] },
      config: { responseModalities: [Modality.IMAGE] },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return { coverImageUrl: `data:image/png;base64,${part.inlineData.data}` };
      }
    }
    throw new Error("No image generated");
  }, 3, 2000).catch(() => {
    return { coverImageUrl: `https://placehold.co/600x400/1e1b4b/2dd4bf?text=${encodeURIComponent(courseInfo.title || 'Course')}` };
  });
};

// ============= RECOMMEND FORMATS =============
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'recommend') {
    try {
      const prompt = searchParams.get('prompt') || '';
      const ai = createAIClient();
      const formats = Object.values(CourseFormat).join(', ');
      const systemPrompt = `You are an expert instructional designer. Recommend the top 4 most effective course formats. Respond with JSON: {"recommendations": [{"format": "...", "description": "..."}]}. Formats: ${formats}`;

      const response = await retryWithBackoff(async () => {
        const res = await ai.models.generateContent({
          model: 'gemini-2.0-flash-exp',
          contents: `User request: "${prompt}"`,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                recommendations: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      format: { type: Type.STRING },
                      description: { type: Type.STRING }
                    },
                    required: ['format', 'description']
                  }
                }
              },
              required: ['recommendations']
            }
          }
        });
        return JSON.parse(res.text.trim());
      }, 3, 2000);

      return NextResponse.json({ 
        success: true, 
        recommendations: response.recommendations.slice(0, 4) 
      });
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Failed to load recommendations' }, { status: 500 });
    }
  }

  // Test endpoint
  try {
    const keys = getApiKeys();
    return NextResponse.json({ success: true, keysFound: keys.length });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'No API keys found' }, { status: 500 });
  }
}

// ============= GENERATE COURSE =============
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, format, mode, file } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    console.log('🚀 Starting course generation...');
    let course: Partial<Course> = { format, mode };

    // Agent 1: Initial Course Planner
    console.log('📋 Agent 1: Planning course...');
    const initialInfo = await agent_InitialCoursePlanner(prompt, file?.content);
    course = { ...course, ...initialInfo };

    // Agent 2: Roadmap Designer
    console.log('🗺️ Agent 2: Designing roadmap...');
    const roadmapInfo = await agent_RoadmapDesigner(course);
    course.roadmap = roadmapInfo.roadmap;

    // Agent 3: Module Designer
    console.log('📚 Agent 3: Designing modules...');
    const finalRoadmap: RoadmapNode[] = [];
    for (const stage of course.roadmap) {
      const newStage = { ...stage, modules: [] as Module[] };
      for (const preModule of stage.modules) {
        const newModule = await agent_ModuleDesigner(course, preModule.title);
        newStage.modules.push(newModule);
      }
      finalRoadmap.push(newStage);
    }
    course.roadmap = finalRoadmap;

    // Agent 4: Cover Image
    console.log('🎨 Agent 4: Creating cover image...');
    const { coverImageUrl } = await agent_CoverImageDesigner(course);

    // Build final course
    const finalCourse: Course = {
      id: Date.now().toString(),
      title: course.title || 'Untitled Course',
      description: course.description || '',
      subject: course.subject || 'General',
      category: course.category || CourseCategory.Other,
      engine: course.engine || EngineType.Default,
      level: course.level || 'Beginner',
      progress: 0,
      roadmap: course.roadmap || [],
      gamification: { xp: 0, streak: 0, edCoins: 100, badges: [] },
      lastActivity: 'Not Started',
      coverImageUrl,
      courseArchetype: course.courseArchetype || CourseArchetype.Academic,
      format,
      mode
    };

    // Save to Supabase
    console.log('💾 Saving to database...');
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from('courses').insert([finalCourse]).select();

    if (error) throw new Error(`Database error: ${error.message}`);

    console.log('✅ Course generated successfully!');
    return NextResponse.json({ success: true, course: data[0] });

  } catch (error) {
    console.error('❌ Course generation failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}