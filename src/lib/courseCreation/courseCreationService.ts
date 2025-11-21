
import {
  Course,
  CourseAgent,
  CourseGamification,
  CourseGoal,
  CourseModule,
  CourseRoadmap,
  CourseState,
  CourseStyle,
  CourseTopic,
  Gamification,
  Module,
  Prerequisite,
  Roadmap,
  Subtopic,
  Topic,
} from "./types";
import {Mutex} from "async-mutex";
import {env} from "$env/dynamic/private";
import {GoogleGenerativeAI} from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash-latest",
  generationConfig: {
    responseMimeType: "application/json",
  },
});

const mutex = new Mutex();

const engines = [
    {
        "name": "ArtLab",
        "description": "An advanced AI-powered art studio enabling creation, visualization, and AI critique using Gemini models."
    },
    {
        "name": "BioLab Nexus",
        "description": "An advanced interactive biology laboratory platform featuring student and medical tiers, AI-driven simulations, and dynamic data visualization."
    },
    {
        "name": "ChemLab AI",
        "description": "An advanced, AI-powered chemistry simulation platform featuring interactive Stoichiometry, Titration, and Molecular Visualization modules enriched with real-time Gemini AI tutoring and reasoning."
    },
    {
        "name": "CodeLab Studio",
        "description": "An advanced, AI-integrated coding environment for simulation, visualization, and reasoning across multiple languages."
    },
    {
        "name": "FinLab",
        "description": "A comprehensive financial simulation and analysis studio for commerce students and professionals. Features AI-powered tutoring, interactive visualizations, and modular financial tools."
    },
    {
        "name": "HistorySim",
        "description": "A dynamic history simulation engine that allows users to explore different historical events and scenarios."
    },
    {
        "name": "LinguaLab",
        "description": "An advanced linguistics studio for analyzing syntax, phonetics, and semantics using AI-driven visualization."
    },
    {
        "name": "MathStudio",
        "description": "An advanced AI-powered mathematics laboratory featuring step-by-step problem solving, graph visualization, and voice-guided tutoring using Gemini 3 models."
    },
    {
        "name": "PhysicsSim",
        "description": "A high-fidelity, interactive physics simulation platform targeting web, desktop, and mobile. Features modular physics engines including Mechanics, Optics, and Electromagnetism with real-time visualization."
    },
    {
        "name": "WritingStudio",
        "description": "An AI-powered writing assistant that helps users improve their writing skills."
    }
];

const agent_CoursePlanner = async (
  courseGoal: CourseGoal,
  courseStyle: CourseStyle,
  existingCourse?: Course
): Promise<Partial<Course>> => {
  const coursePlanPrompt = `
    You are a world-class instructional designer, responsible for creating the master plan for a new course.
    Your goal is to take a user's request and transform it into a comprehensive, high-level course structure.

    **Course Goal:** ${courseGoal.goal}
    **Student Profile:** ${courseGoal.studentProfile}
    **Course Style:**
    *   **Tone:** ${courseStyle.tone}
    *   **Structure:** ${courseStyle.structure}
    *   **Depth:** ${courseStyle.depth}
    *   **Pacing:** ${courseStyle.pacing}

    **Your Task:**

    1.  **Analyze the Request:** Carefully consider the user's goal and the target student profile.
    2.  **Brainstorm a Course Title:** Create a compelling and descriptive title for the course.
    3.  **Write a Course Description:** Write a brief, engaging description that summarizes the course's content and learning objectives.
    4.  **Define Learning Objectives:** List the key skills and knowledge students will acquire upon completing the course.
    5.  **Determine Prerequisites:** Identify any prerequisite knowledge or skills required to succeed in the course.
    6.  **Estimate Course Duration:** Provide an estimated time to complete the course, in hours.
    7.  **Select a Course Engine:** Based on the course content, select the most appropriate engine from the following list:
        ${JSON.stringify(engines, null, 2)}
    8.  **Structure the Course Roadmap:** Break down the course into a logical sequence of modules, each with a clear title and a brief description of its content.

    **Output Format:**

    Return a JSON object with the following structure:

    \`\`\`json
    {
      "title": "...",
      "description": "...",
      "objectives": ["...", "...", "..."],
      "prerequisites": ["...", "...", "..."],
      "duration": "...",
      "engine": "...",
      "roadmap": [
        { "title": "...", "description": "..." },
        { "title": "...", "description": "..." },
        ...
      ]
    }
    \`\`\`
  `;

  const result = await model.generateContent(coursePlanPrompt);
  const coursePlan = JSON.parse(result.response.text());

  return {
    ...existingCourse,
    title: coursePlan.title,
    description: coursePlan.description,
    objectives: coursePlan.objectives,
    prerequisites: coursePlan.prerequisites.map(
      (p: string) => ({ name: p, type: "skill" } as Prerequisite)
    ),
    duration: coursePlan.duration,
    engine: coursePlan.engine,
    roadmap: {
      modules: coursePlan.roadmap.map(
        (m: any) => ({ title: m.title, description: m.description } as CourseModule)
      ),
    } as CourseRoadmap,
    state: CourseState.DRAFT,
    agents: [CourseAgent.PLANNER],
  };
};

const agent_ModuleDesigner = async (
  course: Partial<Course>
): Promise<Partial<Course>> => {
  const moduleDesignPrompt = `
    You are an expert curriculum developer, tasked with designing the individual modules for a course.
    Your goal is to take the high-level course plan and flesh out each module with detailed topics and subtopics.

    **Course Title:** ${course.title}
    **Course Description:** ${course.description}
    **Course Roadmap:**
    ${JSON.stringify(course.roadmap?.modules, null, 2)}

    **Your Task:**

    For each module in the roadmap, you will:

    1.  **Break Down the Module:** Divide each module into a logical sequence of topics.
    2.  **Decompose Topics:** For each topic, identify the key subtopics that need to be covered.
    3.  **Estimate Topic Durations:** Provide an estimated time to complete each topic, in minutes.
    4.  **Select the Best Engine:** For each topic, select the most appropriate engine from the following list:
        ${JSON.stringify(engines, null, 2)}
    5.  **Design Interactive Elements:** For each topic, describe an interactive element that will help students learn the material. This could be a simulation, a quiz, a coding exercise, or any other interactive element that is appropriate for the topic and the selected engine.

    **Output Format:**

    Return a JSON object with the following structure:

    \`\`\`json
    {
      "modules": [
        {
          "title": "...",
          "description": "...",
          "topics": [
            {
              "title": "...",
              "description": "...",
              "duration": "...",
              "engine": "...",
              "interactiveElement": "...",
              "subtopics": [
                { "title": "...", "description": "..." },
                { "title": "...", "description": "..." },
                ...
              ]
            },
            ...
          ]
        },
        ...
      ]
    }
    \`\`\`
  `;

  const result = await model.generateContent(moduleDesignPrompt);
  const moduleDesigns = JSON.parse(result.response.text());

  const newRoadmap: Roadmap = {
    modules: moduleDesigns.modules.map(
      (m: any) =>
        ({
          title: m.title,
          description: m.description,
          topics: m.topics.map(
            (t: any) =>
              ({
                title: t.title,
                description: t.description,
                duration: t.duration,
                engine: t.engine,
                interactiveElement: t.interactiveElement,
                subtopics: t.subtopics.map(
                  (st: any) =>
                    ({
                      title: st.title,
                      description: st.description,
                    } as Subtopic)
                ),
              } as Topic)
          ),
        } as Module)
    ),
  };

  return {
    ...course,
    roadmap: newRoadmap as CourseRoadmap,
    agents: [...(course.agents || []), CourseAgent.MODULE_DESIGNER],
  };
};

const agent_GamificationDesigner = async (
  course: Partial<Course>
): Promise<Partial<Course>> => {
  const gamificationDesignPrompt = `
    You are a master of gamification, and your task is to design a system of rewards and recognition to motivate students.

    **Course Title:** ${course.title}
    **Course Description:** ${course.description}
    **Course Roadmap:**
    ${JSON.stringify(course.roadmap?.modules, null, 2)}

    **Your Task:**

    1.  **Design a Points System:** Create a system for awarding points for completing various tasks, such as finishing a topic, completing a module, or passing a quiz.
    2.  **Create a Badge System:** Design a set of badges that students can earn for achieving certain milestones, such as completing all the modules in a particular topic or demonstrating mastery of a skill.
    3.  **Develop a Leaderboard:** Describe how a leaderboard could be used to foster friendly competition among students.
    4.  **Suggest Other Gamification Elements:** Propose any other gamification elements that you think would be effective in this course.

    **Output Format:**

    Return a JSON object with the following structure:

    \`\`\`json
    {
      "pointsSystem": {
        "topicCompletion": "...",
        "moduleCompletion": "...",
        "quizCompletion": "..."
      },
      "badges": [
        { "name": "...", "description": "...", "criteria": "..." },
        { "name": "...", "description": "...", "criteria": "..." },
        ...
      ],
      "leaderboard": "...",
      "otherElements": ["...", "...", "..."]
    }
    \`\`\`
  `;

  const result = await model.generateContent(gamificationDesignPrompt);
  const gamificationDesign = JSON.parse(result.response.text());

  const newGamification: Gamification = {
    pointsSystem: gamificationDesign.pointsSystem,
    badges: gamificationDesign.badges,
    leaderboard: gamificationDesign.leaderboard,
    otherElements: gamificationDesign.otherElements,
  };

  return {
    ...course,
    gamification: newGamification as CourseGamification,
    agents: [...(course.agents || []), CourseAgent.GAMIFICATION_DESIGNER],
  };
};

export const generateCourse = async (
  courseGoal: CourseGoal,
  courseStyle: CourseStyle,
  existingCourse?: Course
): Promise<Course> => {
  const release = await mutex.acquire();

  try {
    const coursePlan = await agent_CoursePlanner(
      courseGoal,
      courseStyle,
      existingCourse
    );
    const moduleDesigns = await agent_ModuleDesigner(coursePlan);
    const gamificationDesigns = await agent_GamificationDesigner(moduleDesigns);

    // This is where you would save the course to the database.
    // For now, we'll just return the final course object.

    return gamificationDesigns as Course;
  } finally {
    release();
  }
};
