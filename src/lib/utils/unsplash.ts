const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || '';

export interface UnsplashPhoto {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string | null;
  user: {
    name: string;
    username: string;
  };
}

export async function searchUnsplashPhoto(query: string): Promise<string | null> {
  if (!UNSPLASH_ACCESS_KEY) {
    return getFallbackImage(query);
  }

  try {
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodedQuery}&per_page=1&orientation=portrait&content_filter=high`,
      {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      console.error('Unsplash API error:', response.status);
      return getFallbackImage(query);
    }

    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return `${data.results[0].urls.regular}&w=800&h=1200&fit=crop`;
    }
    return getFallbackImage(query);
  } catch (error) {
    console.error('Unsplash fetch error:', error);
    return getFallbackImage(query);
  }
}

const IMAGE_CATEGORIES: Record<string, string[]> = {
  math: ['abstract', 'geometry', 'architecture', 'pattern'],
  science: ['laboratory', 'nature', 'technology', 'space'],
  programming: ['technology', 'code', 'computer', 'digital'],
  language: ['books', 'culture', 'travel', 'city'],
  history: ['architecture', 'museum', 'ancient', 'monument'],
  art: ['painting', 'gallery', 'creative', 'design'],
  music: ['concert', 'instrument', 'performance', 'studio'],
  physics: ['space', 'energy', 'technology', 'light'],
  chemistry: ['laboratory', 'molecules', 'science', 'colorful'],
  biology: ['nature', 'wildlife', 'plants', 'microscope'],
  finance: ['city', 'business', 'chart', 'office'],
  psychology: ['brain', 'people', 'mind', 'abstract'],
  default: ['education', 'learning', 'knowledge', 'books']
};

function getImageCategory(keywords: string): string {
  const lowered = keywords.toLowerCase();
  for (const [category, terms] of Object.entries(IMAGE_CATEGORIES)) {
    if (category !== 'default' && (lowered.includes(category) || terms.some(t => lowered.includes(t)))) {
      return terms[Math.floor(Math.random() * terms.length)];
    }
  }
  const defaults = IMAGE_CATEGORIES.default;
  return defaults[Math.floor(Math.random() * defaults.length)];
}

export function getFallbackImage(query: string): string {
  const seed = Math.abs(hashCode(query + Date.now()));
  const imageId = (seed % 1000) + 100;
  return `https://picsum.photos/seed/${imageId}/800/1200`;
}

export function getUnsplashImageUrl(query: string): string {
  const seed = Math.abs(hashCode(query + Date.now().toString().slice(-4)));
  const imageId = (seed % 900) + 100;
  return `https://picsum.photos/seed/${imageId}/800/1200`;
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
}
