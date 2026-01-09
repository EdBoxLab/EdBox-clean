import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import "./globals.css";
import { seoConfig } from "@/lib/seo/config";
import { OrganizationSchema, WebsiteSchema, SoftwareApplicationSchema } from "@/lib/seo/structured-data";
import ClientLayout from "./ClientLayout";

const inter = Inter({
  variable: "--font-primary",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// EdBox Brand System - Single Source of Truth
const EDBOX_BRAND = {
  colors: {
    primary: "#3B82F6",       // Primary blue - clarity, learning, trust
    secondary: "#8B5CF6",     // Purple - intelligence, AI
    bgLight: "#FFFFFF",       // Clean white
    bgDark: "#0F172A",        // Dark mode background
  }
} as const;

export const metadata: Metadata = {
  metadataBase: new URL(seoConfig.siteUrl),
  title: {
    default: seoConfig.defaultTitle,
    template: `%s | ${seoConfig.siteName}`,
  },
  description: seoConfig.defaultDescription,
  keywords: seoConfig.defaultKeywords,
  authors: [{ name: seoConfig.author.name, url: seoConfig.author.url }],
  creator: seoConfig.siteName,
  publisher: seoConfig.siteName,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: seoConfig.siteUrl,
    siteName: seoConfig.siteName,
    title: seoConfig.defaultTitle,
    description: seoConfig.defaultDescription,
    images: [
      {
        url: seoConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `${seoConfig.siteName} - Learning That Actually Works`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: seoConfig.twitterHandle,
    creator: seoConfig.twitterHandle,
    title: seoConfig.defaultTitle,
    description: seoConfig.defaultDescription,
    images: [seoConfig.ogImage],
  },
  alternates: {
    canonical: seoConfig.siteUrl,
  },
  category: 'education',
  classification: 'Educational Technology',
  applicationName: seoConfig.siteName,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: seoConfig.siteName,
  },
  formatDetection: {
    telephone: false,
  },
  verification: {
    google: 'YzGOxq7ul48yIOan9gd3sigS4kTp-9aiimYHo01po0s',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* PWA Theme Colors - EdBox Brand */}
        <meta name="theme-color" content={EDBOX_BRAND.colors.primary} media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content={EDBOX_BRAND.colors.bgDark} media="(prefers-color-scheme: dark)" />
        
        {/* Apple PWA - Enhanced */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="EdBox" />
        
        {/* Icons - Using EdBoxLogo.png */}
        <link rel="apple-touch-icon" href="/EdBoxLogo.png" />
        <link rel="icon" type="image/png" href="/EdBoxLogo.png" />
        <link rel="icon" type="image/x-icon" href="/logo_new.ico" />
        
        {/* Verification */}
        <meta name="google-site-verification" content="YzGOxq7ul48yIOan9gd3sigS4kTp-9aiimYHo01po0s" />
        
        {/* Structured Data - EdBox Brand */}
        <OrganizationSchema />
        <WebsiteSchema />
        <SoftwareApplicationSchema />
        
        {/* Dark Mode Flash Prevention - EdBox Branded */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const root = document.documentElement;
                  
                  if (prefersDark) {
                    root.classList.add('dark');
                    root.style.backgroundColor = '${EDBOX_BRAND.colors.bgDark}';
                    root.style.color = '#FFFFFF';
                  } else {
                    root.classList.remove('dark');
                    root.style.backgroundColor = '${EDBOX_BRAND.colors.bgLight}';
                    root.style.color = '#0F172A';
                  }
                  
                  // Dynamic theme-color update
                  const meta = document.querySelector('meta[name="theme-color"]');
                  if (meta) {
                    meta.setAttribute('content', prefersDark ? '${EDBOX_BRAND.colors.bgDark}' : '${EDBOX_BRAND.colors.primary}');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} font-primary antialiased bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-colors duration-200`}>
        <ClientLayout>{children}</ClientLayout>
        <Analytics />
        
        {/* AdSense - Lazy Loaded */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7134321558578802"
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}