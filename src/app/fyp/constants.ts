import type { FeedItem } from './types';

export const feedItems: FeedItem[] = [];

export const SUGGESTED_INTEREST_CATEGORIES = [
    {
      name: 'Science & Technology',
      interests: [
        'Artificial Intelligence', 'Machine Learning', 'Space Exploration', 'Quantum Physics', 'Biotechnology', 'Cybersecurity', 'Renewable Energy', 'Neuroscience', 'Robotics', 'Software Development', 'Virtual Reality', 'Augmented Reality', '3D Printing', 'Data Science', 'Gadgets & Gizmos', 'Electric Vehicles'
      ],
    },
    {
      name: 'Arts & Culture',
      interests: [
        'Art History', 'Classical Music', 'Filmmaking', 'Photography', 'Modern Architecture', 'Street Art', 'Shakespearean Literature', 'Jazz Music', 'Creative Writing', 'Fashion Design', 'Stand-up Comedy', 'Digital Art', 'Ballet & Dance', 'Opera', 'Museums & Galleries', 'Poetry'
      ],
    },
    {
      name: 'History & Philosophy',
      interests: [
        'Ancient Rome', 'Ancient Greece', 'World War II', 'The Renaissance', 'Stoicism', 'Existentialism', 'Egyptian Mythology', 'The Cold War', 'Medieval History', 'Political Philosophy', 'Viking Age', 'Industrial Revolution', 'American Civil War', 'Philosophy of Mind', 'Ethics'
      ],
    },
    {
      name: 'Business & Finance',
      interests: [
        'Entrepreneurship', 'Stock Market Investing', 'Personal Finance', 'Marketing Strategies', 'Blockchain & Crypto', 'Real Estate', 'Global Economics', 'Venture Capital', 'Product Management', 'Leadership', 'Behavioral Economics', 'Supply Chain Management'
      ],
    },
    {
      name: 'Health & Wellness',
      interests: [
        'Nutrition Science', 'Mindfulness & Meditation', 'Fitness & Exercise Science', 'Biohacking', 'Psychology', 'Sleep Science', 'Yoga & Flexibility', 'Mental Health Awareness', 'Longevity', 'Human Anatomy', 'Preventative Medicine'
      ],
    },
    {
      name: 'World & Nature',
      interests: [
        'Environmental Science', 'Marine Biology', 'Geology & Earth Science', 'Climate Change Solutions', 'Cultural Anthropology', 'World Geography', 'Volcanology', 'National Parks', 'Astronomy', 'Botany', 'Zoology', 'Oceanography', 'Conservation'
      ],
    },
    {
      name: 'Hobbies & Lifestyle',
      interests: [
        'Cooking & Gastronomy', 'Chess Strategy', 'Gardening & Horticulture', 'World Travel', 'Woodworking', 'Coffee Culture', 'DIY Projects', 'Modern Board Games', 'Languages & Linguistics', 'Minimalism', 'Urban Planning', 'Sustainable Living'
      ],
    },
    {
        name: 'Pop Culture & Entertainment',
        interests: [
            'Video Game History', 'Classic Cinema', 'Anime & Manga', 'Comic Books', 'Science Fiction Literature', 'Fantasy Worlds', 'Music Production', 'TV Series Analysis', 'Internet Culture', 'Memeology'
        ]
    }
  ];
