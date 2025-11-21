
import React, { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import type { Screen, Course, AgentState, Recommendation, Module, Interaction, Badge, RoadmapNode } from '@/types';
import { CourseCategory, EngineType, CourseFormat, LearningMode, InteractionType, CourseArchetype } from '@/types';
import { generateCourse } from '@/courseCreationService';
import { GenieAvatar } from '@/app/fyp/hooks/GenieAvatar';
import { ProjectCard } from '@/components/ProjectCard';
import { PlusIcon } from '@/app/icons';
import { default as TakeCourseScreen } from '@/app/pages/TakeCourseScreen';
import { default as ModuleViewScreen } from '@/app/pages/ModuleViewScreen';
import { default as CreateCourseScreen } from '@/app/pages/CreateCourseScreen';
import { default as SelectFormatScreen } from '@/app/pages/SelectFormatScreen';
import KoalaGenie from '@/components/KoalaGenie';

const BADGE_DEFINITIONS: { [key: string]: Badge } = {};


// Mock Data
const MOCK_COURSES: Course[] = [
    {
        id: '1', title: 'Introduction to Python', description: 'Learn the basics of Python programming from scratch.', subject: 'Programming', category: CourseCategory.Programming, engine: EngineType.Coding, level: 'Beginner', progress: 0,
        format: CourseFormat.MasteryLadder,
        mode: LearningMode.SkillFocused,
        courseArchetype: CourseArchetype.Vocational,
        coverImageUrl: 'https://placehold.co/600x400/1e1b4b/2dd4bf?text=Python',
        roadmap: [
            { id: 'r1', title: 'Foundations of Python', level: 'Foundations', modules: [
                 { 
                    id: 'm0', title: 'Diagnostic Quiz', estimatedTime: '5 mins', content: 'Let\'s see what you already know to personalize your learning path!', 
                    interactions: [{ 
                        id: 'm0i1',
                        type: InteractionType.PreAssessment, 
                        title: 'Python Knowledge Check', 
                        content: 'Answer these questions to help us tailor the course for you.',
                        questions: [
                            { id: 'paq1', questionText: 'What is a variable?', quizOptions: [ { id: 'paq1o1', text: 'A named location in memory for storing data.' }, { id: 'paq1o2', text: 'A sequence of characters.' }, { id: 'paq1o3', text: 'A function that belongs to an object.' }, ], correctAnswer: 'paq1o1' },
                            { id: 'paq2', questionText: 'Which data type is used to store a sequence of characters?', quizOptions: [ { id: 'paq2o1', text: 'int' }, { id: 'paq2o2', text: 'str' }, { id: 'paq2o3', text: 'list' }, ], correctAnswer: 'paq2o2' },
                        ],
                        rubric: { criteria: [ { name: 'Correctness', description: 'Selects the correct answer for each question.', maxPoints: 5 } ] }
                    }], 
                    isCompleted: false,
                    completedInteractionIds: []
                },
                { id: 'm1', title: 'Thinking in Python', estimatedTime: '20 mins', content: 'This module introduces the core philosophy of Python: simplicity and readability.', interactions: [
                    { id: 'm1i1', type: InteractionType.Info, title: 'Core Concepts', content: 'Read the above content carefully.'},
                    { id: 'm1i2', type: InteractionType.Fact, title: 'Fun Fact!', content: 'Python was named after the British comedy group Monty Python, not the snake!'}
                    ], isCompleted: false, completedInteractionIds: []},
            ]},
            { id: 'r2', title: 'Core Concepts', level: 'Core', modules: [
                { id: 'm3', title: 'Your First Program', estimatedTime: '45 mins', content: 'Master Python\'s powerful built-in data structures for organizing collections of data.', interactions: [
                    {
                        id: 'm3i1', type: InteractionType.CodingStudio, title: 'Code Challenge: Hello, World!', content: 'The classic first step in programming. Modify the code to print the exact phrase "Hello, World!" to the console.',
                        explanation: 'The `print()` function in Python is used to display output. Whatever you put inside the parentheses will be shown in the console.',
                        starterCode: `print("Hello, Python!")`,
                        solution: 'print("Hello, World!")',
                        rubric: { criteria: [ { name: 'Correctness', description: 'The code successfully prints the target phrase.', maxPoints: 10 } ] }
                    }
                ], isCompleted: false, completedInteractionIds: []},
            ]},
        ], 
        gamification: { xp: 0, streak: 0, edCoins: 100, badges: [] }, lastActivity: 'Not Started'
    },
    {
        id: '2', title: 'General Chemistry', description: 'Master core chemistry concepts through interactive labs.', subject: 'Chemistry', category: CourseCategory.Chemistry, engine: EngineType.Chemistry, level: 'Beginner', progress: 0,
        format: CourseFormat.SystemsLab,
        mode: LearningMode.ExamPrep,
        courseArchetype: CourseArchetype.Academic,
        coverImageUrl: 'https://placehold.co/600x400/1e1b4b/2dd4bf?text=Chemistry',
        roadmap: [
            { id: 'chem-r1', title: 'Stoichiometry', level: 'Foundations', modules: [
                {
                    id: 'chem-m1', title: 'Balancing Chemical Equations', estimatedTime: '15 mins', content: 'A fundamental law of chemistry is the conservation of mass. This means you must have the same number of atoms of each element on both sides of a chemical equation. Adjust the coefficients to balance the combustion of methane.',
                    interactions: [{
                        id: 'chem-m1-i1', type: InteractionType.ChemistryLab, title: 'Equation Balancer', content: 'Adjust the numbers to balance the equation.',
                        simulationType: 'balancing_equation',
                        reactants: [{ formula: 'CH4', state: 'g' }, { formula: 'O2', state: 'g' }],
                        products: [{ formula: 'CO2', state: 'g' }, { formula: 'H2O', state: 'g' }],
                        solution: [1, 2, 1, 2],
                        rubric: { criteria: [ { name: 'Correctness', description: 'All elements are correctly balanced.', maxPoints: 10 }] }
                    }], isCompleted: false, completedInteractionIds: []
                }
            ]}
        ],
        gamification: { xp: 0, streak: 0, edCoins: 100, badges: [] },
        lastActivity: 'Not Started'
    },
];

export const App: React.FC = () => {
    const [ai, setAi] = useState<any | null>(null);
  const [screen, setScreen] = useState<Screen>('allCourses');
  const [courses, setCourses] = useState<Course[]>(MOCK_COURSES);
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCertificateModalOpen, setCertificateModalOpen] = useState(false);
  const [courseForCert, setCourseForCert] = useState<Course | null>(null);
  const [unlockedBadge, setUnlockedBadge] = useState<Badge | null>(null);
  
  // Course creation state
  const [creationData, setCreationData] = useState<{prompt: string, file: {name: string, type: string, content: string} | null} | null>(null);
  const [agentStates, setAgentStates] = useState<AgentState[]>([]);

  // Genie state
  const [genieContextModule, setGenieContextModule] = useState<Module | null>(null);
  
  const MOCK_RECOMMENDATIONS: Recommendation[] = [
    { id: '1', title: 'Deep Dive into Data Structures', reason: 'Based on your Python course, this will strengthen your foundational skills.', type: 'course' },
    { id: '2', title: 'Object-Oriented Programming', reason: 'A logical next step to write more complex and maintainable Python code.', type: 'improvement_area' },
  ];
  const MOCK_STATS_DATA = [
      { name: 'Mon', xp: 120, accuracy: 88 }, { name: 'Tue', xp: 200, accuracy: 92 },
      { name: 'Wed', xp: 150, accuracy: 90 }, { name: 'Thu', xp: 280, accuracy: 95 },
      { name: 'Fri', xp: 80, accuracy: 85 }, { name: 'Sat', xp: 300, accuracy: 98 },
      { name: 'Sun', xp: 50, accuracy: 80 },
  ];

  useEffect(() => {
    if (process.env.API_KEY) {
      setAi(new GoogleGenAI({ apiKey: process.env.API_KEY }));
    } else {
        console.error("API key not found. Please set the API_KEY environment variable.");
    }
  }, []);

  const activeCourse = courses.find(c => c.id === activeCourseId) || null;
  const activeModule = activeCourse?.roadmap.flatMap(r => r.modules).find(m => m.id === activeModuleId) || null;

  const handleNavigate = (newScreen: Screen) => {
    if (newScreen === 'genieChat') {
        setGenieContextModule(null); // Reset context when navigating from nav bar
    }
    setScreen(newScreen);
  }
  
  const handleBackToCourses = () => {
    setActiveCourseId(null);
    setActiveModuleId(null);
    setScreen('allCourses');
    setIsEditing(false);
    setCreationData(null);
  };

  const handleResumeCourse = (courseId: string) => {
    setActiveCourseId(courseId);
    setScreen('takeCourse');
  };

  const handleModuleSelect = (moduleId: string) => {
    setActiveModuleId(moduleId);
    setScreen('moduleView');
  };
  
  const handleModuleNav = (direction: 'next' | 'prev') => {
      if (!activeCourse || !activeModuleId) return;
      const allModules = activeCourse.roadmap.flatMap(node => node.modules);
      const currentIndex = allModules.findIndex(m => m.id === activeModuleId);
      const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
      if (newIndex >= 0 && newIndex < allModules.length) {
          setActiveModuleId(allModules[newIndex].id);
      }
  };

  const handleInteractionComplete = useCallback((moduleId: string, interactionId: string) => {
      setCourses(prevCourses => {
          const courseIndex = prevCourses.findIndex(c => c.id === activeCourseId);
          if (courseIndex === -1) return prevCourses;

          const originalCourse = prevCourses[courseIndex];
          
          let module: Module | undefined;
          let interaction: Interaction | undefined;
          let roadmapNode: RoadmapNode | undefined;
          for (const node of originalCourse.roadmap) {
              module = node.modules.find(m => m.id === moduleId);
              if (module) {
                  interaction = module.interactions.find(i => i.id === interactionId);
                  roadmapNode = node;
                  if (interaction) break;
              }
          }

          if (!module || !interaction || module.completedInteractionIds.includes(interactionId)) {
              return prevCourses;
          }

          const newBadges = new Set(originalCourse.gamification.badges);
          const newlyUnlockedBadges: string[] = [];

          const unlockBadge = (badgeId: string) => {
              if (!newBadges.has(badgeId)) {
                  newBadges.add(badgeId);
                  newlyUnlockedBadges.push(badgeId);
              }
          };

          let interactionPoints = 10;
          if (interaction.rubric) {
              interactionPoints = interaction.rubric.criteria.reduce((sum, crit) => sum + crit.maxPoints, 0);
          }
          
          if ([InteractionType.Quiz, InteractionType.PreAssessment].includes(interaction.type)) unlockBadge('perfect_score');
          if (interaction.type === InteractionType.CodingStudio) unlockBadge('code_wizard');
          if ([InteractionType.PhysicsSim, InteractionType.ChemistryLab, InteractionType.BiologySim].includes(interaction.type)) unlockBadge('lab_coat');

          const newCompletedIds = [...module.completedInteractionIds, interactionId];
          const isModuleNowCompleted = newCompletedIds.length === module.interactions.length;

          const updatedRoadmap = originalCourse.roadmap.map(node => ({
              ...node,
              modules: node.modules.map(mod => {
                  if (mod.id !== moduleId) return mod;
                  return { ...mod, completedInteractionIds: newCompletedIds, isCompleted: isModuleNowCompleted };
              })
          }));
          
          const allModules = updatedRoadmap.flatMap(r => r.modules);
          const completedModules = allModules.filter(m => m.isCompleted);
          const newProgress = allModules.length > 0 ? Math.round((completedModules.length / allModules.length) * 100) : 0;
          
          if (isModuleNowCompleted) {
              unlockBadge('module_master');
              if (completedModules.length === 1) {
                  unlockBadge('first_step');
              }
          }
          
          if (roadmapNode && isModuleNowCompleted) {
              const updatedStageModules = updatedRoadmap.find(n => n.id === roadmapNode!.id)!.modules;
              if (updatedStageModules.every(m => m.isCompleted)) {
                  unlockBadge('stage_clear');
              }
          }

          if (newProgress === 100) {
              unlockBadge('course_conqueror');
          }
          
          if (newlyUnlockedBadges.length > 0) {
            const badge = BADGE_DEFINITIONS[newlyUnlockedBadges[0]];
            if (badge) {
              setUnlockedBadge(badge);
            }
          }

          const updatedGamification = {
              ...originalCourse.gamification,
              xp: originalCourse.gamification.xp + interactionPoints,
              edCoins: originalCourse.gamification.edCoins + 5,
              badges: Array.from(newBadges),
          };
          
          const updatedCourse = {
              ...originalCourse,
              roadmap: updatedRoadmap,
              progress: newProgress,
              gamification: updatedGamification,
              lastActivity: new Date().toISOString()
          };
          
          const newCourses = [...prevCourses];
          newCourses[courseIndex] = updatedCourse;
          return newCourses;
      });
  }, [activeCourseId]);

    const handleDownloadCourse = (courseId: string) => {
        const courseToDownload = courses.find(c => c.id === courseId);
        if (!courseToDownload) return;

        const fileName = `${courseToDownload.title.replace(/\s+/g, '_').toLowerCase()}.json`;
        const data = new Blob([JSON.stringify(courseToDownload, null, 2)], { type: 'application/json' });
        
        const a = document.createElement('a');
        a.href = URL.createObjectURL(data);
        a.setAttribute('download', fileName);
        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    };

    const handlePromptEntered = (prompt: string, file: { name: string; type: string; content: string } | null) => {
        setCreationData({ prompt, file });
        setScreen('selectFormat');
    };

    const handleCreateCourse = async (format: CourseFormat, mode: LearningMode) => {
        if (!creationData) return;
        
        setScreen('loading');
        setAgentStates([]);
        
        const newCourse = await generateCourse(
            creationData.prompt,
            format,
            mode,
            (agents) => setAgentStates(agents),
            creationData.file || undefined
        );

        if (newCourse) {
            setCourses(prev => [newCourse as Course, ...prev]);
            setActiveCourseId(newCourse.id);
            setScreen('takeCourse');
        } else {
            alert("Failed to create the course. Please try again.");
            setScreen('allCourses');
        }
        setCreationData(null);
    };

  const handleViewCertificate = (courseId: string) => {
      const course = courses.find(c => c.id === courseId);
      if (course) {
          setCourseForCert(course);
          setCertificateModalOpen(true);
      }
  };

  const handleAskGenie = (module: Module) => {
    setGenieContextModule(module);
    setScreen('genieChat');
  };
  
  const handleToggleEdit = () => setIsEditing(prev => !prev);
  const handleGetHint = async (interaction: Interaction): Promise<string> => {
      if (!ai) return "AI is not available.";
      try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Give a one-sentence hint for this quiz question, without giving away the answer. Question: "${interaction.content}"`
        });
        return response.text ?? "Sorry, I couldn't get a hint right now.";
      } catch (e) {
          return "Sorry, I couldn\'t get a hint right now.";
      }
  };

  const renderScreen = () => {
    switch(screen) {
        case 'loading':
            return <div>Loading...</div>;
        case 'createCourse':
            return <CreateCourseScreen onNext={handlePromptEntered} onBack={handleBackToCourses} />;
        case 'selectFormat':
            if (!creationData) return null;
            return <SelectFormatScreen prompt={creationData.prompt} file={creationData.file} onCreate={handleCreateCourse} onBack={() => setScreen('createCourse')} />;
        case 'genieChat':
            return <KoalaGenie />;
        case 'takeCourse':
            return <TakeCourseScreen course={activeCourse} onBack={handleBackToCourses} onModuleSelect={handleModuleSelect} isEditing={isEditing} onToggleEdit={handleToggleEdit} onEditCourse={() => {}} onEditModule={() => {}} onDeleteModule={() => {}} onAddModule={() => {}} onViewCertificate={handleViewCertificate} />;
        case 'moduleView':
            if (!activeCourse || !activeModule) return null;
            return <ModuleViewScreen course={activeCourse} module={activeModule} onBack={() => setScreen('takeCourse')} onNavigate={handleModuleNav} onInteractionComplete={handleInteractionComplete} onGetHint={handleGetHint} onAskGenie={handleAskGenie} ai={ai} isEditing={isEditing} onEditInteraction={() => {}} onDeleteInteraction={() => {}} onAddInteraction={() => {}} />;
        case 'stats':
            return <div>Stats</div>;
        case 'recommendations':
            return <div>Recommendations</div>;
        case 'allCourses':
        default:
            return (
                <div className="p-4 md:p-8">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold">My Courses</h1>
                        <button onClick={() => setScreen('createCourse')} className="bg-teal-500 text-indigo-950 font-bold py-2 px-4 rounded-lg hover:bg-teal-400 transition-colors shadow-md shadow-teal-500/20 flex items-center gap-2"><PlusIcon className="w-5 h-5"/> New Course</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {courses.map(course => ( <ProjectCard key={course.id} project={{id: course.id, name: course.title, description: course.description, imageUrl: course.coverImageUrl, techStack: [], githubUrl: ''}} /> ))}
                    </div>
                </div>
            );
    }
  };

  const showNav = ['allCourses', 'stats', 'recommendations', 'genieChat'].includes(screen);

  return (
      <div className="bg-indigo-950 text-slate-200 min-h-screen font-sans flex flex-col">
          <main className="flex-grow pb-20 md:pb-0">
              {renderScreen()}
          </main>
      </div>
  );
};
