// ============================================
// Open Graph Meta Tags Generator
// For better social media sharing previews
// ============================================

import { ShareableContent } from '@/lib/services/sharing-service';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://edbox-weld.vercel.app/';
const APP_NAME = 'EdBox';
const DEFAULT_IMAGE = `${APP_URL}/og-image.png`;

export interface OGMetaTags {
  title: string;
  description: string;
  url: string;
  image: string;
  type: string;
  siteName: string;
  locale: string;
}

/**
 * Generate Open Graph meta tags for shareable content
 */
export function generateOGTags(content: ShareableContent, customUrl?: string): OGMetaTags {
  const baseUrl = APP_URL.endsWith('/') ? APP_URL.slice(0, -1) : APP_URL;
  
  // Generate content URL
  let contentUrl = customUrl;
  if (!contentUrl) {
    switch (content.type) {
      case 'course':
        contentUrl = `${baseUrl}/courses/${content.id}`;
        break;
      case 'studylist':
        contentUrl = `${baseUrl}/studylist/${content.id}`;
        break;
      case 'learning-path':
        contentUrl = `${baseUrl}/learning-path/${content.id}`;
        break;
      default:
        contentUrl = baseUrl;
    }
  }

  // Generate title
  const typeLabel = content.type === 'course' ? 'Course' : 
                    content.type === 'studylist' ? 'Study List' : 'Learning Path';
  const title = `${content.title} - ${typeLabel} on ${APP_NAME}`;

  // Generate description
  let description = content.description || `Discover this amazing ${typeLabel.toLowerCase()} on ${APP_NAME}`;
  if (content.creatorName) {
    description += ` Created by ${content.creatorName}.`;
  }
  description += ` Join thousands of learners on ${APP_NAME}!`;

  // Ensure description is not too long for social media
  if (description.length > 160) {
    description = description.substring(0, 157) + '...';
  }

  return {
    title,
    description,
    url: contentUrl,
    image: content.imageUrl || DEFAULT_IMAGE,
    type: 'article',
    siteName: APP_NAME,
    locale: 'en_US'
  };
}

/**
 * Generate Twitter Card meta tags
 */
export function generateTwitterTags(content: ShareableContent, customUrl?: string) {
  const ogTags = generateOGTags(content, customUrl);
  
  return {
    card: 'summary_large_image',
    site: '@EdBoxLearning', // Replace with your Twitter handle
    creator: content.creatorName ? `@${content.creatorName}` : '@EdBoxLearning',
    title: ogTags.title,
    description: ogTags.description,
    image: ogTags.image,
    url: ogTags.url
  };
}

/**
 * Generate structured data (JSON-LD) for better SEO
 */
export function generateStructuredData(content: ShareableContent, customUrl?: string) {
  const ogTags = generateOGTags(content, customUrl);
  
  const baseStructure: any = {
    '@context': 'https://schema.org',
    '@type': content.type === 'course' ? 'Course' : 'CreativeWork',
    name: content.title,
    description: content.description || ogTags.description,
    url: ogTags.url,
    image: ogTags.image,
    provider: {
      '@type': 'Organization',
      name: APP_NAME,
      url: APP_URL
    }
  };

  if (content.creatorName) {
    baseStructure.author = {
      '@type': 'Person',
      name: content.creatorName
    };
  }

  if (content.type === 'course') {
    return {
      ...baseStructure,
      '@type': 'Course',
      courseMode: 'online',
      educationalLevel: 'beginner',
      teaches: content.description || content.title
    };
  }

  return baseStructure;
}

/**
 * Generate all meta tags as HTML string (for server-side rendering)
 */
export function generateMetaTagsHTML(content: ShareableContent, customUrl?: string): string {
  const ogTags = generateOGTags(content, customUrl);
  const twitterTags = generateTwitterTags(content, customUrl);
  const structuredData = generateStructuredData(content, customUrl);

  return `
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="${ogTags.title}" />
    <meta property="og:description" content="${ogTags.description}" />
    <meta property="og:url" content="${ogTags.url}" />
    <meta property="og:image" content="${ogTags.image}" />
    <meta property="og:type" content="${ogTags.type}" />
    <meta property="og:site_name" content="${ogTags.siteName}" />
    <meta property="og:locale" content="${ogTags.locale}" />
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="${twitterTags.card}" />
    <meta name="twitter:site" content="${twitterTags.site}" />
    <meta name="twitter:creator" content="${twitterTags.creator}" />
    <meta name="twitter:title" content="${twitterTags.title}" />
    <meta name="twitter:description" content="${twitterTags.description}" />
    <meta name="twitter:image" content="${twitterTags.image}" />
    <meta name="twitter:url" content="${twitterTags.url}" />
    
    <!-- Structured Data -->
    <script type="application/ld+json">
      ${JSON.stringify(structuredData, null, 2)}
    </script>
  `.trim();
}

/**
 * Generate meta tags for Next.js metadata API
 */
export function generateNextMetadata(content: ShareableContent, customUrl?: string) {
  const ogTags = generateOGTags(content, customUrl);
  const twitterTags = generateTwitterTags(content, customUrl);

  return {
    title: ogTags.title,
    description: ogTags.description,
    openGraph: {
      title: ogTags.title,
      description: ogTags.description,
      url: ogTags.url,
      images: [
        {
          url: ogTags.image,
          width: 1200,
          height: 630,
          alt: content.title
        }
      ],
      type: ogTags.type,
      siteName: ogTags.siteName,
      locale: ogTags.locale
    },
    twitter: {
      card: twitterTags.card,
      site: twitterTags.site,
      creator: twitterTags.creator,
      title: twitterTags.title,
      description: twitterTags.description,
      images: [twitterTags.image]
    },
    other: {
      'application/ld+json': JSON.stringify(generateStructuredData(content, customUrl))
    }
  };
}