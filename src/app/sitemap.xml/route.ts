import { NextResponse } from 'next/server';
import { seoConfig } from '@/lib/seo/config';

export async function GET() {
  const baseUrl = seoConfig.siteUrl;
  const currentDate = new Date().toISOString();

  // Fully optimized sitemap URLs with priority and changefreq
  const sitemapEntries = [
    { path: '/', changefreq: 'daily', priority: 1.0 },
    { path: '/about', changefreq: 'monthly', priority: 0.9 },
    { path: '/fyp', changefreq: 'daily', priority: 0.9 },
    { path: '/tools', changefreq: 'weekly', priority: 0.8 },
    { path: '/research-assistant', changefreq: 'weekly', priority: 0.8 },
    { path: '/notes', changefreq: 'weekly', priority: 0.8 },
    { path: '/quiz-forge', changefreq: 'weekly', priority: 0.8 },
    { path: '/flashcard-gen', changefreq: 'weekly', priority: 0.8 },
    { path: '/socials', changefreq: 'daily', priority: 0.7 },
    { path: '/socials/study-circles', changefreq: 'daily', priority: 0.7 },
    { path: '/mathlab', changefreq: 'weekly', priority: 0.7 },
    { path: '/finlab', changefreq: 'weekly', priority: 0.7 },
    { path: '/chemlab', changefreq: 'weekly', priority: 0.7 },
    { path: '/bionexus', changefreq: 'weekly', priority: 0.7 },
    { path: '/codestudio', changefreq: 'weekly', priority: 0.7 },
    { path: '/lingualab', changefreq: 'weekly', priority: 0.7 },
    { path: '/artstudio', changefreq: 'weekly', priority: 0.7 },
    { path: '/physicssim', changefreq: 'weekly', priority: 0.7 },
    { path: '/historymach', changefreq: 'weekly', priority: 0.7 },
    { path: '/writingstudio', changefreq: 'weekly', priority: 0.7 },
    { path: '/login', changefreq: 'monthly', priority: 0.5 },
    { path: '/signup', changefreq: 'monthly', priority: 0.5 },
  ];

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${sitemapEntries
      .map(
        ({ path, changefreq, priority }) => `
      <url>
        <loc>${baseUrl}${path}</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>${changefreq}</changefreq>
        <priority>${priority}</priority>
      </url>
    `
      )
      .join('')}
  </urlset>`;

  return new NextResponse(sitemapXml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
