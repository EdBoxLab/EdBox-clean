import { MetadataRoute } from 'next';
import { seoConfig } from '@/lib/seo/config';

/**
 * Dynamic sitemap generation for Google indexing
 * This file generates sitemap.xml automatically
 * Access at: https://yourdomain.com/sitemap.xml
 */

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = seoConfig.siteUrl;
  const currentDate = new Date();

  // ============================================
  // STATIC PAGES (EdBox - Public vs Auth-Required)
  // ============================================
  
  // PUBLIC PAGES (Accessible to everyone - HIGH PRIORITY for SEO)
  const publicPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1.0, // HIGHEST - Only public landing page
    },
    {
      url: baseUrl, // Homepage (likely redirects to /about or /dashboard)
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  // AUTH-REQUIRED PAGES (Lower priority - Google can't access them anyway)
  // Include these so authenticated users benefit from sitemap navigation
  const authPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/feed`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.5, // Lower - requires login
    },
    {
      url: `${baseUrl}/courses`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/creator`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/study-kit`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/tools`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/socials`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  const staticPages = [...publicPages, ...authPages];

  // ============================================
  // DYNAMIC PAGES (Fetch from database)
  // ============================================

  // Example: Fetch public courses/challenges
  let dynamicPages: MetadataRoute.Sitemap = [];

  try {
    // If you have a Supabase table with public courses:
    /*
    const { createSupabaseServerClient } = await import('@/lib/supabase/server');
    const supabase = await createSupabaseServerClient();
    
    const { data: courses } = await supabase
      .from('courses')
      .select('id, slug, updated_at')
      .eq('is_public', true)
      .order('updated_at', { ascending: false });

    if (courses) {
      dynamicPages = courses.map((course) => ({
        url: `${baseUrl}/learn/${course.slug}`,
        lastModified: new Date(course.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
    }
    */

    // Example: Fetch blog posts
    /*
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('slug, updated_at')
      .eq('published', true)
      .order('updated_at', { ascending: false });

    if (posts) {
      const blogPages = posts.map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: new Date(post.updated_at),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }));
      
      dynamicPages = [...dynamicPages, ...blogPages];
    }
    */
  } catch (error) {
    console.error('Error generating dynamic sitemap entries:', error);
    // Continue with static pages even if dynamic fetch fails
  }

  // ============================================
  // COMBINE AND RETURN
  // ============================================
  return [...staticPages, ...dynamicPages];
}

// ============================================
// ALTERNATIVE: MULTIPLE SITEMAPS (For large sites)
// ============================================

/*
If you have 1000+ pages, create multiple sitemaps:

// app/sitemap.ts (main sitemap index)
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${baseUrl}/sitemap-courses.xml`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/sitemap-blog.xml`,
      lastModified: new Date(),
    },
  ];
}

// app/sitemap-courses.xml/route.ts
export async function GET() {
  // Generate course sitemap
}

// app/sitemap-blog.xml/route.ts  
export async function GET() {
  // Generate blog sitemap
}
*/