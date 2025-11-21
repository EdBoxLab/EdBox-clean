
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Course, CourseArchetype, CourseCategory, CourseFormat, EngineType, LearningMode, Module, RoadmapNode, AgentState, RecommendedFormat, InteractionType } from "./types";
import { createSupabaseServerClient } from './lib/supabase/server';

const sanitizeForPrompt = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\') // Escape backslashes
    .replace(/"/g, '\"') // Escape double quotes
    .replace(/\n/g, '\n')
    .replace(/\r/g, '\r')
    .replace(/\t/g, '\t');
};

export const recommendTopFormats = async (prompt: string, fileTextContent?: string): Promise<RecommendedFormat[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const formats = Object.values(CourseFormat).join(', ');
    let fileContext = fileTextContent ? ` The user has also provided a document with this content: "${sanitizeForPrompt(fileTextContent.substring(0, 2000))}"` : '';

    const systemPrompt = `You are an expert instructional designer. Your task is to recommend the top 4 most effective and engaging course formats for a given topic. For each format, provide a concise, one-sentence description explaining why it's a good fit. Respond ONLY with a valid JSON object containing a key "recommendations", which is an array of 4 objects. Each object must have "format" (one of "${formats}") and "description" keys.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: `User request: "${prompt}".${fileContext}`,
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
        const result = JSON.parse(response.text.trim());
        if (result.recommendations && result.recommendations.length > 0) {
            return result.recommendations.slice(0, 4).filter((r: any) => Object.values(CourseFormat).includes(r.format));
        }
        throw new Error("Invalid format recommendations received.");
    } catch (e) {
        console.error("Format recommendation failed:", e);
        // Fallback in case of API error
        return [
            { format: CourseFormat.MasteryLadder, description: "A structured, sequential path to build skills step-by-step." },
            { format: CourseFormat.ScenarioSimulator, description: "Practice decision-making in realistic, simulated environments." },
            { format: CourseFormat.CapstoneBuilder, description: "Apply your knowledge by building a significant, real-world project." },
            { format: CourseFormat.SocraticDialogue, description: "Deepen your understanding through guided, thought-provoking conversations." },
        ];
    }
};

const agent_InitialCoursePlanner = async (prompt: string, fileTextContent?: string): Promise<Partial<Course>> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const systemPrompt = `Agent: Initial Course Planner.\n    You have three jobs:\n    1.  **Subject Determination**: Analyze the user's request and any provided document content to define the course's core attributes. If the request is generic, derive 'subject' and 'title' from the document content. Define 'category', 'subject', 'title', 'description', and 'level'.\n    2.  **Engine Selection**: Based on the determined subject and category, select the most appropriate interactive 'engine'. The engine determines the types of hands-on simulations available.\n    3.  **Strategy Definition**: Analyze the title and description to determine the fundamental 'courseArchetype', which influences the educational approach.\n\n    Respond with a single JSON object containing: 'category', 'subject', 'title', 'description', 'level', 'engine', and 'courseArchetype'.\n    - 'category' must be one of: ${Object.values(CourseCategory).join(', ')}.\n    - 'level' must be one of: Beginner, Intermediate, Advanced.\n    - 'engine' must be one of: ${Object.values(EngineType).join(', ')}.\n    - 'courseArchetype' must be one of: ${Object.values(CourseArchetype).join(', ')}.`;

    let fileContext = fileTextContent ? `\\n\\nDocument Content: """${sanitizeForPrompt(fileTextContent.substring(0, 4000))}"""` : '';
    const content = `User Request: "${prompt}"${fileContext}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: content,
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
    } catch (e) {
        console.error("Agent: Initial Course Planner failed:", e);
        throw new Error("The Initial Course Planner agent failed to design the course foundation.");
    }
};

const agent_RoadmapDesigner = async (courseInfo: Partial<Course>): Promise<{ roadmap: RoadmapNode[] }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const systemPrompt = `Agent: Roadmap Designer.\n    Create a structured learning roadmap with 4 stages: Foundations, Core, Advanced, and Capstone.\n    For each stage, define 1-3 relevant module titles.\n    Respond with a JSON object containing a 'roadmap' key. 'roadmap' is an array of objects, each with 'id', 'title', 'level', and a 'modules' array.\n    The 'modules' array should contain objects, each with a unique 'id' and a 'title'.`;
    
    const content = `Design a roadmap for a ${courseInfo.level} level course titled "${courseInfo.title}" on the subject of ${courseInfo.subject}. The course format is "${courseInfo.format}" and the learning mode is "${courseInfo.mode}".`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: content,
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
    } catch(e) {
        console.error("Agent: Roadmap Designer failed:", e);
        throw new Error("The Roadmap Designer agent failed.");
    }
};

const agent_ModuleDesigner = async (courseInfo: Partial<Course>, moduleTitle: string): Promise<Module> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const interactionTypes = Object.values(InteractionType).join(', ');
    const systemPrompt = `Agent: Interactive Experience Designer.\n    Your task is to design a single, engaging learning module based on the provided title and course context.\n    - Create a concise 'content' overview for the module (2-3 sentences).\n    - Design 2-4 diverse, interactive learning 'interactions' that are highly relevant to the module title and the overall course engine.\n    - For each interaction, select the most appropriate 'type' from this list: [${interactionTypes}].\n    - Prioritize engine-specific interactions (e.g., 'physics_sim' for a Physics course, 'coding_studio' for Programming) but also include general types like 'quiz' or 'info'.\n    - Populate all necessary fields for each interaction type (e.g., 'quizOptions' and 'correctAnswer' for a quiz).\n    - Provide a realistic 'estimatedTime' for completing the module (e.g., "15 mins").`;

    const content = `\n    Course Title: "${courseInfo.title}"\n    Course Subject: "${courseInfo.subject}"\n    Course Engine: "${courseInfo.engine}"\n    Course Format: "${courseInfo.format}"\n    Learning Mode: "${courseInfo.mode}"\n    Module to Design: "${moduleTitle}"\n    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: content,
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
    } catch(e) {
        console.error(`Agent: Module Designer failed for module "${moduleTitle}":`, e);
        throw new Error(`The Module Designer agent failed for module "${moduleTitle}".`);
    }
};

const agent_CoverImageDesigner = async (courseInfo: Partial<Course>): Promise<{ coverImageUrl: string }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `A vibrant, abstract, educational-themed cover image for a course titled "${courseInfo.title}". The image should be minimalist yet inspiring, using a color palette based on teal and indigo. Style: digital art, vector illustration.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: { responseModalities: [Modality.IMAGE] },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                return { coverImageUrl: `data:image/png;base64,${base64ImageBytes}` };
            }
        }
        throw new Error("No image data generated.");
    } catch (e) {
        console.error("Agent: Cover Image Designer failed:", e);
        // Fallback image in case of failure
        return { coverImageUrl: `https://placehold.co/600x400/1e1b4b/2dd4bf?text=${encodeURIComponent(courseInfo.title || 'Course')}` };
    }
};

export const generateCourse = async (
    prompt: string,
    format: CourseFormat,
    mode: LearningMode,
    onProgress: (agents: AgentState[]) => void,
    file?: { name: string, type: string, content: string }
): Promise<Course | null> => {
    
    let agents: AgentState[] = [
        { name: 'Initial Course Planner', status: 'pending', message: 'Waiting to start...', percentage: 0 },
        { name: 'Roadmap Designer', status: 'pending', message: 'Waiting to start...', percentage: 0 },
        { name: 'Module Designer', status: 'pending', message: 'Waiting to start...', percentage: 0 },
        { name: 'Cover Image Designer', status: 'pending', message: 'Waiting to start...', percentage: 0 },
        { name: 'Saving Course', status: 'pending', message: 'Waiting to start...', percentage: 0 },
    ];
    onProgress([...agents]);

    const updateAgentState = (name: string, status: AgentState['status'], message: string, percentage: number) => {
        const agentIndex = agents.findIndex(a => a.name === name);
        if (agentIndex !== -1) {
            agents[agentIndex] = { ...agents[agentIndex], name, status, message, percentage };
            onProgress([...agents]);
        }
    };

    try {
        let course: Partial<Course> = { format, mode };

        updateAgentState('Initial Course Planner', 'running', 'Designing course foundation...', 30);
        const initialInfo = await agent_InitialCoursePlanner(prompt, file?.content);
        course = { ...course, ...initialInfo };
        updateAgentState('Initial Course Planner', 'complete', `Foundation set for: ${course.subject}` , 100);

        updateAgentState('Roadmap Designer', 'running', 'Structuring the learning journey...', 30);
        const roadmapInfo = await agent_RoadmapDesigner(course);
        course.roadmap = roadmapInfo.roadmap;
        updateAgentState('Roadmap Designer', 'complete', 'Learning roadmap created.', 100);

        const allPreModules = course.roadmap.flatMap(stage => stage.modules.map(m => m.title));
        const totalModules = allPreModules.length;
        updateAgentState('Module Designer', 'running', `Found ${totalModules} modules to design...`, 0);
        
        const finalRoadmap: RoadmapNode[] = [];
        let modulesDesigned = 0;
        for (const stage of course.roadmap) {
            const newStage = { ...stage, modules: [] as Module[] };
             for(const preModule of stage.modules) {
                 const newModule = await agent_ModuleDesigner(course, preModule.title);
                 newStage.modules.push(newModule);
                 modulesDesigned++;
                 const percentage = totalModules > 0 ? Math.round((modulesDesigned / totalModules) * 100) : 100;
                 updateAgentState('Module Designer', 'running', `Designing module ${modulesDesigned}/${totalModules}: ${preModule.title}`, percentage);
             }
            finalRoadmap.push(newStage);
        }
        course.roadmap = finalRoadmap;
        updateAgentState('Module Designer', 'complete', 'All modules have been designed.', 100);

        updateAgentState('Cover Image Designer', 'running', 'Creating a unique cover image...', 50);
        const { coverImageUrl } = await agent_CoverImageDesigner(course);
        updateAgentState('Cover Image Designer', 'complete', 'Cover image generated.', 100);

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
            coverImageUrl: coverImageUrl,
            courseArchetype: course.courseArchetype || CourseArchetype.Academic,
            format,
            mode
        };

        updateAgentState('Saving Course', 'running', 'Saving your new course...', 50);
        const supabase = createSupabaseServerClient();
        const { data, error } = await supabase.from('courses').insert([finalCourse]).select();

        if (error) {
            throw new Error(`Failed to save course: ${error.message}`);
        }

        updateAgentState('Saving Course', 'complete', 'Course saved successfully!', 100);
        
        return data ? data[0] as Course : null;

    } catch (error) {
        const runningAgent = agents.find(a => a.status === 'running');
        if (runningAgent) {
            updateAgentState(runningAgent.name, 'error', (error as Error).message, runningAgent.percentage);
        }
        console.error("Course generation failed:", error);
        return null;
    }
};
