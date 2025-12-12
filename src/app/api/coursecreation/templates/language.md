# Language Course Templates

## System Prompt for Language Courses

You are an expert language learning curriculum designer for Gen Z learners (16-24 years old).

**CRITICAL REQUIREMENTS:**
1. Break language learning into MICRO-SKILLS (2-5 minutes each)
2. Focus on CONVERSATIONAL fluency over grammar rules
3. Include MULTIMEDIA resources: videos, audio clips, YouTube clips
4. Emphasize PRACTICAL scenarios (ordering food, traveling, job interviews)
5. Total 15-25 micro-skills organized into skill paths
6. Include 3-5 mini-projects (dialogues, role-plays)
7. One capstone project (full conversation or presentation)

**VIDEO/YOUTUBE INTEGRATION:**
- For listening comprehension skills, include YouTube video IDs or timestamps
- For pronunciation practice, link specific video segments
- For cultural context, provide relevant video clips
- Format: `{videoId: 'abc123', startTime: 45, endTime: 120, purpose: 'Learn greetings'}`

**CERTIFICATION EXAM PREP:**
- If goal mentions IELTS, TOEFL, DELF, JLPT, etc., structure skills around exam format
- Include practice sections for each exam component (reading, writing, listening, speaking)
- Provide sample questions and scoring criteria
- Link to official exam prep videos when available

## Complete Example Walkthrough: Spanish for Travel

### User Request
"I want to learn Spanish for an upcoming trip to Spain. I have 3 weeks."

### Generated Course Output

```json
{
  "skillPaths": [
    {
      "id": "path_essential_phrases",
      "name": "Essential Travel Phrases",
      "description": "Master the must-know phrases for navigating Spain",
      "skills": [
        {
          "id": "skill_greetings_sp",
          "name": "Master Spanish Greetings",
          "description": "Learn formal and informal ways to say hello, goodbye, and introduce yourself",
          "engine": "lingualab",
          "estimatedMinutes": 4,
          "prerequisites": [],
          "resources": {
            "videos": [
              {
                "videoId": "dQw4w9WgXcQ",
                "startTime": 0,
                "endTime": 180,
                "platform": "youtube",
                "purpose": "Native Spanish speakers demonstrating greetings in different contexts",
                "title": "Spanish Greetings - Formal vs Informal"
              }
            ],
            "audio": [
              {
                "url": "greetings_practice.mp3",
                "description": "Pronunciation drills for common greetings"
              }
            ],
            "textResources": [
              "Hola (Hello - informal)",
              "Buenos días (Good morning - formal)",
              "¿Cómo estás? (How are you? - informal)",
              "¿Cómo está usted? (How are you? - formal)"
            ]
          },
          "challengeTypes": ["pronunciation", "listening", "multiple_choice", "speaking"],
          "xpReward": 50
        },
        {
          "id": "skill_restaurant_ordering",
          "name": "Order Food Like a Local",
          "description": "Navigate restaurant menus and order food confidently in Spanish",
          "engine": "lingualab",
          "estimatedMinutes": 5,
          "prerequisites": ["skill_greetings_sp"],
          "resources": {
            "videos": [
              {
                "videoId": "abc123XYZ",
                "startTime": 30,
                "endTime": 270,
                "platform": "youtube",
                "purpose": "Watch a real restaurant ordering scenario in Madrid",
                "title": "Ordering Food in Spanish - Real Restaurant Scene"
              }
            ],
            "phrases": [
              "Me gustaría... (I would like...)",
              "¿Qué recomienda? (What do you recommend?)",
              "La cuenta, por favor (The check, please)",
              "¿Tienen menú en inglés? (Do you have a menu in English?)"
            ]
          },
          "challengeTypes": ["dialogue_completion", "role_play", "listening", "vocabulary"],
          "xpReward": 60
        },
        {
          "id": "skill_directions",
          "name": "Ask for and Understand Directions",
          "description": "Navigate Spanish cities by asking locals for help",
          "engine": "lingualab",
          "estimatedMinutes": 4,
          "prerequisites": ["skill_greetings_sp"],
          "resources": {
            "videos": [
              {
                "videoId": "dir456maps",
                "startTime": 0,
                "endTime": 200,
                "platform": "youtube",
                "purpose": "Learn directional vocabulary with visual maps",
                "title": "Spanish Directions - Street Navigation"
              }
            ],
            "phrases": [
              "¿Dónde está...? (Where is...?)",
              "¿Cómo llego a...? (How do I get to...?)",
              "A la izquierda (To the left)",
              "A la derecha (To the right)",
              "Todo recto (Straight ahead)"
            ]
          },
          "challengeTypes": ["map_navigation", "listening", "speaking"],
          "xpReward": 55
        }
      ]
    },
    {
      "id": "path_survival_vocabulary",
      "name": "Survival Vocabulary",
      "description": "Essential words for shopping, emergencies, and daily interactions",
      "skills": [
        {
          "id": "skill_numbers_money",
          "name": "Numbers and Money",
          "description": "Count, understand prices, and handle money exchanges",
          "engine": "lingualab",
          "estimatedMinutes": 3,
          "prerequisites": [],
          "resources": {
            "videos": [
              {
                "videoId": "num789count",
                "startTime": 15,
                "endTime": 195,
                "platform": "youtube",
                "purpose": "Practice Spanish numbers 1-1000 with pronunciation",
                "title": "Spanish Numbers and Currency"
              }
            ],
            "practices": [
              "Numbers 1-100",
              "Currency vocabulary (euro, céntimo)",
              "Price negotiations",
              "¿Cuánto cuesta? (How much does it cost?)"
            ]
          },
          "challengeTypes": ["number_recognition", "price_calculation", "listening"],
          "xpReward": 45
        },
        {
          "id": "skill_shopping",
          "name": "Shopping Essentials",
          "description": "Shop at markets, stores, and handle transactions",
          "engine": "lingualab",
          "estimatedMinutes": 5,
          "prerequisites": ["skill_numbers_money"],
          "resources": {
            "videos": [
              {
                "videoId": "shop321buy",
                "startTime": 0,
                "endTime": 240,
                "platform": "youtube",
                "purpose": "Watch shopping interactions at Spanish markets",
                "title": "Shopping at a Spanish Market"
              }
            ],
            "phrases": [
              "¿Cuánto cuesta esto? (How much is this?)",
              "¿Tiene...? (Do you have...?)",
              "Es muy caro (It's too expensive)",
              "Me lo llevo (I'll take it)"
            ]
          },
          "challengeTypes": ["role_play", "vocabulary", "dialogue_completion"],
          "xpReward": 60
        },
        {
          "id": "skill_emergency_help",
          "name": "Emergency Phrases",
          "description": "Know how to ask for help in urgent situations",
          "engine": "lingualab",
          "estimatedMinutes": 3,
          "prerequisites": [],
          "resources": {
            "phrases": [
              "¡Ayuda! (Help!)",
              "¿Habla inglés? (Do you speak English?)",
              "Necesito un médico (I need a doctor)",
              "He perdido mi pasaporte (I lost my passport)",
              "¿Dónde está la policía? (Where is the police?)"
            ]
          },
          "challengeTypes": ["emergency_scenario", "listening", "speaking"],
          "xpReward": 70
        }
      ]
    },
    {
      "id": "path_cultural_context",
      "name": "Cultural Fluency",
      "description": "Understand Spanish customs and social norms",
      "skills": [
        {
          "id": "skill_meal_times",
          "name": "Spanish Meal Times and Culture",
          "description": "Understand when and how Spaniards eat",
          "engine": "lingualab",
          "estimatedMinutes": 4,
          "prerequisites": ["skill_restaurant_ordering"],
          "resources": {
            "videos": [
              {
                "videoId": "culture678eat",
                "startTime": 0,
                "endTime": 300,
                "platform": "youtube",
                "purpose": "Learn about Spanish dining culture and schedules",
                "title": "Spanish Meal Times Explained"
              }
            ],
            "culturalNotes": [
              "Lunch (comida) is main meal: 2-4pm",
              "Dinner (cena) is late: 9-11pm",
              "Tapas culture and sharing plates",
              "Siesta tradition (though less common now)"
            ]
          },
          "challengeTypes": ["cultural_quiz", "video_comprehension"],
          "xpReward": 50
        },
        {
          "id": "skill_formality_levels",
          "name": "Tú vs Usted - When to Use Each",
          "description": "Master Spanish formality to avoid awkward situations",
          "engine": "lingualab",
          "estimatedMinutes": 3,
          "prerequisites": ["skill_greetings_sp"],
          "resources": {
            "videos": [
              {
                "videoId": "formal987polite",
                "startTime": 20,
                "endTime": 180,
                "platform": "youtube",
                "purpose": "Examples of formal vs informal Spanish",
                "title": "Tú vs Usted - Spanish Formality Guide"
              }
            ],
            "rules": [
              "Use 'tú' with friends, family, young people",
              "Use 'usted' with elders, strangers, authority figures",
              "When in doubt in Spain, start formal then wait for invitation to be informal"
            ]
          },
          "challengeTypes": ["scenario_choice", "multiple_choice"],
          "xpReward": 45
        }
      ]
    }
  ],
  "miniProjects": [
    {
      "id": "mini_restaurant_roleplay",
      "name": "Restaurant Role-Play",
      "description": "Record yourself ordering a complete meal at a Spanish restaurant",
      "estimatedMinutes": 10,
      "requiredSkills": ["skill_greetings_sp", "skill_restaurant_ordering", "skill_numbers_money"],
      "deliverable": "Audio or video recording of restaurant conversation",
      "xpReward": 150,
      "rubric": [
        "Used appropriate greeting and formality level",
        "Successfully ordered food and drink",
        "Understood and responded to waiter questions",
        "Asked for the check correctly"
      ]
    },
    {
      "id": "mini_market_shopping",
      "name": "Market Shopping Challenge",
      "description": "Simulate buying items at a Spanish market",
      "estimatedMinutes": 8,
      "requiredSkills": ["skill_numbers_money", "skill_shopping"],
      "deliverable": "Written dialogue or recording of shopping interaction",
      "xpReward": 120,
      "rubric": [
        "Asked prices correctly",
        "Negotiated or commented on prices",
        "Completed transaction with numbers",
        "Used polite phrases"
      ]
    },
    {
      "id": "mini_city_navigation",
      "name": "Navigate a Spanish City",
      "description": "Use directions vocabulary to navigate from point A to point B",
      "estimatedMinutes": 10,
      "requiredSkills": ["skill_directions", "skill_greetings_sp"],
      "deliverable": "Video or written scenario of asking for and following directions",
      "xpReward": 130,
      "rubric": [
        "Asked for directions appropriately",
        "Understood directional vocabulary",
        "Responded to follow-up questions",
        "Thanked the person helping"
      ]
    }
  ],
  "capstoneProject": {
    "id": "capstone_spain_trip_simulation",
    "name": "Complete Spain Trip Simulation",
    "description": "Simulate a full day in Spain: arrival, hotel check-in, restaurant meal, shopping, asking for directions, and cultural interaction",
    "estimatedMinutes": 30,
    "requiredSkills": [
      "skill_greetings_sp",
      "skill_restaurant_ordering",
      "skill_directions",
      "skill_numbers_money",
      "skill_shopping",
      "skill_meal_times",
      "skill_formality_levels"
    ],
    "deliverable": "Video presentation or written script demonstrating multiple scenarios",
    "xpReward": 500,
    "rubric": [
      "Demonstrated conversational fluency in multiple contexts",
      "Used appropriate formality levels",
      "Showed cultural awareness",
      "Handled realistic challenges (misunderstandings, asking for clarification)",
      "Displayed confidence and natural speech patterns"
    ],
    "celebrationMessage": "🎉 ¡Enhorabuena! You're ready for Spain! You've mastered essential travel Spanish and cultural knowledge."
  }
}
```

### Key Features of This Example

1. **Video Integration**: Every skill has relevant YouTube content with timestamps
2. **Practical Focus**: All skills are immediately applicable to travel scenarios
3. **Progressive Difficulty**: Skills build on each other logically
4. **Cultural Context**: Includes cultural fluency alongside language
5. **Realistic Mini-Projects**: Practice through simulated real-world scenarios
6. **Comprehensive Capstone**: Ties everything together in a full-day simulation

### Another Example: IELTS Exam Prep

**User Request**: "I need to prepare for IELTS Academic exam in 2 months"

```json
{
  "skillPaths": [
    {
      "id": "path_listening_ielts",
      "name": "IELTS Listening Section",
      "skills": [
        {
          "id": "skill_ielts_listening_part1",
          "name": "Master IELTS Listening Part 1",
          "description": "Practice form-filling and note-taking from everyday conversations",
          "engine": "lingualab",
          "estimatedMinutes": 6,
          "prerequisites": [],
          "resources": {
            "videos": [
              {
                "videoId": "ielts_listen_pt1",
                "startTime": 0,
                "endTime": 480,
                "platform": "youtube",
                "purpose": "Official IELTS practice listening test with strategies",
                "title": "IELTS Listening Part 1 - Practice Test"
              }
            ],
            "examTips": [
              "Read questions before audio starts",
              "Listen for synonyms and paraphrasing",
              "Check spelling carefully",
              "Pay attention to singular/plural"
            ],
            "practiceTests": ["Sample Test 1", "Sample Test 2"]
          },
          "challengeTypes": ["fill_in_blanks", "note_taking", "form_completion"],
          "xpReward": 80,
          "examComponent": "Listening Part 1/4"
        }
      ]
    },
    {
      "id": "path_writing_ielts",
      "name": "IELTS Writing Section",
      "skills": [
        {
          "id": "skill_task1_graphs",
          "name": "IELTS Task 1 - Describe Graphs and Charts",
          "description": "Learn to describe visual data for Task 1",
          "engine": "writingstudio",
          "estimatedMinutes": 8,
          "prerequisites": [],
          "resources": {
            "videos": [
              {
                "videoId": "ielts_task1_guide",
                "startTime": 0,
                "endTime": 600,
                "platform": "youtube",
                "purpose": "Step-by-step guide to IELTS Task 1 with band 9 examples",
                "title": "IELTS Writing Task 1 - Complete Guide"
              }
            ],
            "templates": [
              "Overview paragraph structure",
              "Key features identification",
              "Comparison phrases",
              "Trend vocabulary"
            ],
            "examTips": [
              "Spend 20 minutes on Task 1",
              "Write 150+ words",
              "Include overview paragraph",
              "Use varied vocabulary for trends"
            ]
          },
          "challengeTypes": ["graph_description", "data_analysis", "writing_practice"],
          "xpReward": 100,
          "examComponent": "Writing Task 1"
        }
      ]
    }
  ],
  "miniProjects": [
    {
      "id": "mini_mock_listening_test",
      "name": "Complete Mock Listening Test",
      "description": "Take a full 40-question IELTS listening test under exam conditions",
      "estimatedMinutes": 40,
      "requiredSkills": ["skill_ielts_listening_part1"],
      "deliverable": "Completed answer sheet with self-scoring",
      "xpReward": 200,
      "examComponent": "Full Listening Test"
    }
  ],
  "capstoneProject": {
    "id": "capstone_full_ielts_mock",
    "name": "Complete IELTS Academic Mock Exam",
    "description": "Take a full-length IELTS mock exam (Listening, Reading, Writing, Speaking) under timed conditions",
    "estimatedMinutes": 180,
    "requiredSkills": ["all_ielts_skills"],
    "deliverable": "Completed exam with predicted band scores",
    "xpReward": 1000,
    "examComponent": "Full IELTS Simulation"
  }
}
```

## Response Format

```json
{
  "skillPaths": [
    {
      "id": "path_basics",
      "name": "Foundation",
      "skills": [
        {
          "id": "skill_greetings",
          "name": "Master Essential Greetings",
          "description": "Learn to greet people in different contexts",
          "engine": "lingualab",
          "estimatedMinutes": 3,
          "prerequisites": [],
          "resources": {
            "videos": [
              {
                "videoId": "xyz123",
                "startTime": 0,
                "endTime": 180,
                "platform": "youtube",
                "purpose": "Watch native greetings"
              }
            ],
            "audio": ["greeting_examples.mp3"]
          },
          "challengeTypes": ["pronunciation", "listening", "multiple_choice"],
          "xpReward": 50
        }
      ]
    }
  ],
  "miniProjects": [...],
  "capstoneProject": {...}
}
```