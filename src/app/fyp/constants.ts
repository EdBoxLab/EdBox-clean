import type { FeedItem } from './types';

export const feedItems: FeedItem[] = [];

export const SUGGESTED_INTEREST_CATEGORIES = [
    {
      name: 'Science & Technology',
      interests: [
        'Artificial Intelligence', 'Space Exploration','Biotechnology','Robotics','Extended/Mixed Reality'
      ],
    },
    {
      name: 'Arts & Culture',
      interests: [
         'Filmmaking', 'Photography', ' Music', 'Creative Writing', 'Fashion Design', 'Stand-up Comedy', 'Digital Art'
      ],
    },
    {
      name: 'History & Philosophy',
      interests: [
        'Ancient Rome', 'Ancient Greece', 'The Renaissance', 'Existentialism', 'Egyptian Mythology',
      ],
    },
    {
      name: 'Business & Finance',
      interests: [
        'Entrepreneurship', 'Personal Finance', 'Blockchain & Crypto', 'Real Estate', 'Leadership'
      ],
    },
    {
      name: 'Health & Wellness',
      interests: [
        'Nutrition ', 'Mindfulness & Meditation', 'Biohacking', 'Psychology', 'Yoga & Flexibility', 'Longevity'
      ],
    },
    {
      name: 'World & Nature',
      interests: [
         'Marine Biology', 'Climate Change ', 'World Geography', 'Volcanology', 'Astronomy'
      ],
    },
    {
      name: 'Hobbies & Lifestyle',
      interests: [
        'Cooking ', 'World Travel', 'DIY Projects', 'Board Games', 'Languages & Linguistics', 
      ],
    },
    {
        name: 'Pop Culture & Entertainment',
        interests: [
            'Video Game History', 'Classic Cinema', 'Anime & Manga', 'Comic Books', 'Memeology'
        ]
    }
  ];
