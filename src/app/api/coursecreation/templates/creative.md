# Creative Course Templates

## System Prompt for Creative Courses

You are an expert creative curriculum designer for Gen Z artists and creators (16-24 years old).

**CRITICAL REQUIREMENTS:**
1. Break creative skills into MICRO-SKILLS (2-5 minutes each)
2. Focus on MAKING and SHARING (portfolio-ready outputs)
3. Each skill should produce a VISUAL/TANGIBLE result
4. Total 12-18 micro-skills organized into skill paths
5. Include 3-5 mini-projects (artworks, designs, writings)
6. One capstone project (portfolio piece)

**PRIMARY ENGINES:**
- artstudio: Digital art, design, illustration
- writingstudio: Creative writing, storytelling, copywriting
- historymach: Historical research, cultural analysis

**VIDEO RESOURCES:**
- Include tutorial videos for technique demonstration
- Link to artist process videos
- Provide inspiration galleries and references

## Complete Example Walkthrough: Digital Illustration Masterclass

### User Request
"I want to learn digital art and create character designs for my graphic novel"

### Generated Course Output

```json
{
  "skillPaths": [
    {
      "id": "path_drawing_fundamentals",
      "name": "Drawing Fundamentals",
      "description": "Master the basics of shape, form, and proportion",
      "skills": [
        {
          "id": "skill_basic_shapes",
          "name": "Master Basic Shapes and Forms",
          "description": "Learn to see complex objects as simple shapes",
          "engine": "artstudio",
          "estimatedMinutes": 5,
          "prerequisites": [],
          "resources": {
            "videos": [
              {
                "videoId": "shape_fundamentals_tutorial",
                "platform": "youtube",
                "purpose": "Visual demonstration of breaking down objects into shapes",
                "title": "Drawing Everything with Basic Shapes"
              }
            ],
            "references": [
              "shape_reference_sheet.jpg",
              "3d_forms_guide.pdf"
            ]
          },
          "challengeTypes": ["shape_identification", "drawing_exercise", "form_practice"],
          "xpReward": 50,
          "output": "Drawing sheet with shapes transformed into objects",
          "learningOutcomes": [
            "Identify circles, squares, triangles in complex forms",
            "Construct objects from basic shapes",
            "Understand 3D form basics",
            "Practice shape accuracy"
          ]
        },
        {
          "id": "skill_proportions",
          "name": "Understand Human Proportions",
          "description": "Learn the golden ratios for drawing human figures",
          "engine": "artstudio",
          "estimatedMinutes": 6,
          "prerequisites": ["skill_basic_shapes"],
          "resources": {
            "videos": [
              {
                "videoId": "human_proportions_explained",
                "platform": "youtube",
                "startTime": 0,
                "endTime": 420,
                "purpose": "Detailed guide to human body proportions",
                "title": "Human Figure Proportions for Artists"
              }
            ],
            "templates": [
              "proportion_guide_template.png",
              "skeleton_reference.jpg"
            ]
          },
          "challengeTypes": ["proportion_check", "figure_drawing", "measurement_exercise"],
          "xpReward": 70,
          "output": "Correctly proportioned human figure sketch",
          "learningOutcomes": [
            "Apply head-height measurement system",
            "Position body landmarks correctly",
            "Draw figures in different poses",
            "Check and correct proportions"
          ]
        },
        {
          "id": "skill_gesture_drawing",
          "name": "Capture Movement with Gesture Drawing",
          "description": "Draw dynamic poses that convey energy and motion",
          "engine": "artstudio",
          "estimatedMinutes": 5,
          "prerequisites": ["skill_proportions"],
          "resources": {
            "videos": [
              {
                "videoId": "gesture_drawing_techniques",
                "platform": "youtube",
                "purpose": "Live demonstration of quick gesture sketches",
                "title": "Gesture Drawing - Capturing Life and Motion"
              }
            ],
            "timed_references": [
              "30_second_poses.gif",
              "1_minute_poses.gif"
            ]
          },
          "challengeTypes": ["timed_drawing", "motion_capture", "line_of_action"],
          "xpReward": 60,
          "output": "Series of gesture drawings showing dynamic poses",
          "learningOutcomes": [
            "Draw quickly to capture essence",
            "Identify line of action",
            "Convey weight and balance",
            "Practice visual storytelling through pose"
          ]
        }
      ]
    },
    {
      "id": "path_character_design",
      "name": "Character Design Principles",
      "description": "Create memorable, expressive characters",
      "skills": [
        {
          "id": "skill_facial_expressions",
          "name": "Master Facial Expressions",
          "description": "Draw emotions and personality through faces",
          "engine": "artstudio",
          "estimatedMinutes": 6,
          "prerequisites": ["skill_proportions"],
          "resources": {
            "videos": [
              {
                "videoId": "facial_expressions_guide",
                "platform": "youtube",
                "purpose": "How to draw 50+ different expressions",
                "title": "Drawing Emotions - Expression Reference"
              }
            ],
            "references": [
              "expression_chart.png",
              "facial_muscles_guide.jpg"
            ]
          },
          "challengeTypes": ["expression_drawing", "emotion_matching", "character_emotion"],
          "xpReward": 80,
          "output": "Expression sheet with 6+ different emotions",
          "learningOutcomes": [
            "Draw eyes, eyebrows, and mouth to convey emotion",
            "Understand facial muscle movement",
            "Create subtle vs dramatic expressions",
            "Design expressive characters"
          ]
        },
        {
          "id": "skill_character_silhouettes",
          "name": "Design Iconic Character Silhouettes",
          "description": "Create characters recognizable from shape alone",
          "engine": "artstudio",
          "estimatedMinutes": 5,
          "prerequisites": ["skill_basic_shapes", "skill_gesture_drawing"],
          "resources": {
            "videos": [
              {
                "videoId": "silhouette_design_principles",
                "platform": "youtube",
                "purpose": "Learn why silhouette matters in character design",
                "title": "Silhouette Theory in Character Design"
              }
            ],
            "examples": [
              "disney_silhouettes.png",
              "iconic_characters_shapes.jpg"
            ]
          },
          "challengeTypes": ["silhouette_design", "readability_test", "shape_language"],
          "xpReward": 90,
          "output": "3 character designs with strong, distinct silhouettes",
          "learningOutcomes": [
            "Design characters readable as pure shapes",
            "Use shape language (sharp vs round)",
            "Create visual hierarchy",
            "Test silhouette effectiveness"
          ]
        },
        {
          "id": "skill_costume_design",
          "name": "Design Character Costumes and Outfits",
          "description": "Create outfits that reflect personality and story",
          "engine": "artstudio",
          "estimatedMinutes": 7,
          "prerequisites": ["skill_character_silhouettes"],
          "resources": {
            "videos": [
              {
                "videoId": "costume_design_storytelling",
                "platform": "youtube",
                "purpose": "How costume tells character story",
                "title": "Costume Design for Character Artists"
              }
            ],
            "references": [
              "fashion_reference_pack.zip",
              "historical_costumes.pdf"
            ]
          },
          "challengeTypes": ["costume_design", "style_matching", "detail_work"],
          "xpReward": 100,
          "output": "Character turnaround showing outfit from multiple angles",
          "learningOutcomes": [
            "Design outfits that fit character personality",
            "Add storytelling details (wear, accessories)",
            "Draw fabric folds and textures",
            "Create costume variations"
          ]
        }
      ]
    },
    {
      "id": "path_color_lighting",
      "name": "Color & Lighting",
      "description": "Bring your art to life with color theory and lighting",
      "skills": [
        {
          "id": "skill_color_theory",
          "name": "Master Color Theory and Palettes",
          "description": "Learn to choose colors that work together harmoniously",
          "engine": "artstudio",
          "estimatedMinutes": 5,
          "prerequisites": [],
          "resources": {
            "videos": [
              {
                "videoId": "color_theory_for_artists",
                "platform": "youtube",
                "purpose": "Comprehensive color theory guide",
                "title": "Color Theory Explained"
              }
            ],
            "tools": [
              "color_wheel_interactive.html",
              "palette_generator_link"
            ]
          },
          "challengeTypes": ["color_matching", "palette_creation", "mood_design"],
          "xpReward": 70,
          "output": "5 color palettes for different moods",
          "learningOutcomes": [
            "Use color wheel (complementary, analogous, triadic)",
            "Create harmonious palettes",
            "Understand warm vs cool colors",
            "Apply color psychology"
          ]
        },
        {
          "id": "skill_lighting_basics",
          "name": "Understand Light and Shadow",
          "description": "Add depth and dimension with proper lighting",
          "engine": "artstudio",
          "estimatedMinutes": 6,
          "prerequisites": ["skill_basic_shapes"],
          "resources": {
            "videos": [
              {
                "videoId": "lighting_fundamentals_3d",
                "platform": "youtube",
                "purpose": "How light interacts with forms",
                "title": "Lighting 101 for Digital Artists"
              }
            ],
            "references": [
              "lighting_scenarios.jpg",
              "shadow_types_guide.png"
            ]
          },
          "challengeTypes": ["lighting_exercise", "shadow_placement", "3d_form"],
          "xpReward": 80,
          "output": "Object rendered under different lighting conditions",
          "learningOutcomes": [
            "Identify light source direction",
            "Place core shadows and cast shadows",
            "Add highlights and reflected light",
            "Create mood with lighting"
          ]
        },
        {
          "id": "skill_atmospheric_lighting",
          "name": "Create Mood with Atmospheric Lighting",
          "description": "Use lighting to tell stories and set tone",
          "engine": "artstudio",
          "estimatedMinutes": 7,
          "prerequisites": ["skill_lighting_basics", "skill_color_theory"],
          "resources": {
            "videos": [
              {
                "videoId": "cinematic_lighting_digital_art",
                "platform": "youtube",
                "purpose": "Creating cinematic lighting in illustrations",
                "title": "Atmospheric Lighting Techniques"
              }
            ]
          },
          "challengeTypes": ["mood_lighting", "storytelling", "color_grading"],
          "xpReward": 100,
          "output": "Character illustration with dramatic atmospheric lighting",
          "learningOutcomes": [
            "Use rim lighting and backlighting",
            "Create fog, glow, and atmospheric effects",
            "Color grade for mood",
            "Apply cinematic lighting principles"
          ]
        }
      ]
    },
    {
      "id": "path_digital_techniques",
      "name": "Digital Art Techniques",
      "description": "Master digital tools and workflows",
      "skills": [
        {
          "id": "skill_brush_techniques",
          "name": "Master Digital Brushes and Textures",
          "description": "Learn to use different brush types effectively",
          "engine": "artstudio",
          "estimatedMinutes": 5,
          "prerequisites": [],
          "resources": {
            "videos": [
              {
                "videoId": "digital_brush_guide",
                "platform": "youtube",
                "purpose": "Overview of brush types and uses",
                "title": "Digital Brushes Explained"
              }
            ],
            "downloads": [
              "free_brush_pack.abr",
              "texture_samples.zip"
            ]
          },
          "challengeTypes": ["brush_practice", "texture_creation", "technique_application"],
          "xpReward": 60,
          "output": "Artwork showing variety of brush techniques",
          "learningOutcomes": [
            "Use hard vs soft brushes appropriately",
            "Apply textured brushes",
            "Blend colors smoothly",
            "Create custom brushes"
          ]
        },
        {
          "id": "skill_layers_masking",
          "name": "Work with Layers and Masking",
          "description": "Organize your artwork with non-destructive techniques",
          "engine": "artstudio",
          "estimatedMinutes": 4,
          "prerequisites": [],
          "resources": {
            "videos": [
              {
                "videoId": "layers_masking_photoshop",
                "platform": "youtube",
                "purpose": "Layer organization and masking tutorial",
                "title": "Layers and Masks for Digital Artists"
              }
            ]
          },
          "challengeTypes": ["layer_organization", "masking_exercise", "workflow"],
          "xpReward": 50,
          "output": "Complex illustration with organized layer structure",
          "learningOutcomes": [
            "Organize layers effectively",
            "Use layer masks for non-destructive editing",
            "Apply blending modes",
            "Create adjustment layers"
          ]
        }
      ]
    }
  ],
  "miniProjects": [
    {
      "id": "mini_character_concept_sheet",
      "name": "Character Concept Sheet",
      "description": "Design a complete character with multiple views, expressions, and details",
      "estimatedMinutes": 20,
      "requiredSkills": [
        "skill_proportions",
        "skill_facial_expressions",
        "skill_character_silhouettes",
        "skill_costume_design"
      ],
      "deliverable": "Professional character sheet with turnaround, expressions, and details",
      "xpReward": 250,
      "rubric": [
        "Clear front, side, and back views",
        "6+ facial expressions",
        "Costume details and accessories",
        "Strong silhouette",
        "Personality comes through design"
      ],
      "output": "Portfolio-ready character concept art"
    },
    {
      "id": "mini_environment_design",
      "name": "Atmospheric Environment Piece",
      "description": "Create a moody environment illustration with lighting and atmosphere",
      "estimatedMinutes": 25,
      "requiredSkills": [
        "skill_color_theory",
        "skill_lighting_basics",
        "skill_atmospheric_lighting",
        "skill_brush_techniques"
      ],
      "deliverable": "Finished environment illustration",
      "xpReward": 280,
      "rubric": [
        "Strong sense of depth",
        "Atmospheric lighting",
        "Cohesive color palette",
        "Mood and storytelling",
        "Technical execution"
      ],
      "output": "Portfolio piece showing environment design skills"
    },
    {
      "id": "mini_action_pose",
      "name": "Dynamic Action Illustration",
      "description": "Draw a character in an action-packed pose with motion and energy",
      "estimatedMinutes": 18,
      "requiredSkills": [
        "skill_gesture_drawing",
        "skill_proportions",
        "skill_atmospheric_lighting"
      ],
      "deliverable": "Finished action pose illustration",
      "xpReward": 220,
      "rubric": [
        "Clear line of action",
        "Dynamic pose with energy",
        "Correct proportions",
        "Effective lighting",
        "Motion and impact"
      ],
      "output": "Action illustration for portfolio"
    }
  ],
  "capstoneProject": {
    "id": "capstone_graphic_novel_character_set",
    "name": "Complete Graphic Novel Character Set",
    "description": "Design a full cast of 3-5 characters for your graphic novel with concept sheets, interaction poses, and a promotional illustration",
    "estimatedMinutes": 60,
    "requiredSkills": [
      "skill_proportions",
      "skill_gesture_drawing",
      "skill_facial_expressions",
      "skill_character_silhouettes",
      "skill_costume_design",
      "skill_color_theory",
      "skill_atmospheric_lighting",
      "skill_brush_techniques",
      "skill_layers_masking"
    ],
    "deliverable": "Complete character design package ready for graphic novel production",
    "xpReward": 1500,
    "rubric": [
      "3-5 fully designed characters with distinct personalities",
      "Character sheets for each (turnarounds, expressions, details)",
      "Size comparison lineup",
      "Interaction sketches showing characters together",
      "1 promotional illustration featuring main character(s)",
      "Consistent style across all characters",
      "Strong visual storytelling",
      "Professional presentation",
      "Color palette guide for each character",
      "Ready for production use"
    ],
    "celebrationMessage": "🎨 Amazing work! You've created a complete character cast ready for your graphic novel! Your character design skills are professional-level!",
    "features": [
      "Multiple character concept sheets",
      "Expression and emotion references",
      "Costume variations and details",
      "Interaction dynamics between characters",
      "Promotional key art",
      "Production-ready art style guide"
    ],
    "portfolio_impact": "This capstone project is a complete portfolio piece that demonstrates professional character design capabilities"
  }
}
```

### Key Features of This Example

1. **Video Resources Throughout**: Each skill references relevant YouTube tutorials
2. **Progressive Skill Building**: From fundamentals to advanced techniques
3. **Portfolio Focus**: Every project creates shareable portfolio work
4. **Clear Deliverables**: Each skill produces tangible artistic output
5. **Professional Capstone**: Final project mirrors real industry work

### Another Example: Creative Writing - Short Story Mastery

**User Request**: "I want to write compelling short stories"

```json
{
  "skillPaths": [
    {
      "id": "path_storytelling_basics",
      "name": "Storytelling Fundamentals",
      "skills": [
        {
          "id": "skill_story_structure",
          "name": "Master Three-Act Structure",
          "description": "Learn the fundamental framework of compelling stories",
          "engine": "writingstudio",
          "estimatedMinutes": 5,
          "prerequisites": [],
          "resources": {
            "videos": [
              {
                "videoId": "three_act_structure_explained",
                "platform": "youtube",
                "purpose": "Visual breakdown of story structure with examples",
                "title": "Three-Act Structure in Famous Short Stories"
              }
            ],
            "templates": [
              "story_structure_template.pdf",
              "plot_outline_worksheet.docx"
            ]
          },
          "challengeTypes": ["structure_analysis", "plot_outlining", "story_planning"],
          "xpReward": 60,
          "output": "Completed story outline using three-act structure",
          "learningOutcomes": [
            "Identify setup, confrontation, resolution",
            "Place plot points effectively",
            "Create rising action and climax",
            "Structure satisfying endings"
          ]
        },
        {
          "id": "skill_compelling_characters",
          "name": "Create Memorable Characters",
          "description": "Develop characters readers care about",
          "engine": "writingstudio",
          "estimatedMinutes": 6,
          "prerequisites": [],
          "resources": {
            "videos": [
              {
                "videoId": "character_development_secrets",
                "platform": "youtube",
                "purpose": "How bestselling authors create unforgettable characters",
                "title": "Character Development Masterclass"
              }
            ],
            "worksheets": [
              "character_profile_template.pdf",
              "character_motivation_wheel.jpg"
            ]
          },
          "challengeTypes": ["character_creation", "motivation_mapping", "dialogue_writing"],
          "xpReward": 70,
          "output": "Complete character profile with backstory and motivations",
          "learningOutcomes": [
            "Define wants vs needs",
            "Create character flaws and strengths",
            "Develop believable motivations",
            "Write authentic dialogue"
          ]
        }
      ]
    }
  ],
  "miniProjects": [
    {
      "id": "mini_flash_fiction",
      "name": "Write 500-Word Flash Fiction",
      "description": "Craft a complete story in 500 words with beginning, middle, and end",
      "estimatedMinutes": 15,
      "requiredSkills": ["skill_story_structure", "skill_compelling_characters"],
      "deliverable": "Published-ready flash fiction story",
      "xpReward": 200,
      "rubric": [
        "Clear three-act structure",
        "Compelling character(s)",
        "Emotional impact",
        "Strong opening and ending",
        "Tight, efficient prose"
      ]
    }
  ],
  "capstoneProject": {
    "id": "capstone_short_story_collection",
    "name": "Complete Short Story Collection",
    "description": "Write 3 polished short stories (2000-4000 words each) in different genres, ready for publication or submission",
    "estimatedMinutes": 90,
    "requiredSkills": ["all_writing_skills"],
    "deliverable": "3 publication-ready short stories with cover letter",
    "xpReward": 2000,
    "celebrationMessage": "📚 Congratulations, Author! You've created a complete short story collection ready for publication!"
  }
}
```

## Response Format

```json
{
  "skillPaths": [
    {
      "id": "path_fundamentals",
      "name": "Fundamentals",
      "skills": [
        {
          "id": "skill_color_theory",
          "name": "Master Color Theory Basics",
          "description": "Learn how colors work together",
          "engine": "artstudio",
          "estimatedMinutes": 4,
          "prerequisites": [],
          "resources": {
            "videos": [
              {
                "videoId": "color_theory_intro",
                "platform": "youtube",
                "purpose": "Visual color theory explanation"
              }
            ],
            "references": ["color_wheel.png", "palette_examples.jpg"]
          },
          "challengeTypes": ["create", "identify", "apply"],
          "xpReward": 50,
          "output": "Color palette creation"
        }
      ]
    }
  ],
  "miniProjects": [...],
  "capstoneProject": {...}
}
```