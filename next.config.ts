import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // MOVED: React Compiler is now a top-level option in Next.js 16
  // We cast to any to avoid type errors if your @types/next package lags behind the runtime
  ...({ reactCompiler: true } as any),

  productionBrowserSourceMaps: process.env.NODE_ENV === 'development',

  // PostHog reverse proxy configuration
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },

  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,

  // Merged Webpack Configuration
  webpack: (config, { isServer, dev }) => {
    // 1. Fix for PDF/Canvas processing on the server
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'pdfjs-dist': 'commonjs pdfjs-dist',
        'canvas': 'commonjs canvas',
        '@napi-rs/canvas': 'commonjs @napi-rs/canvas'
      });
    }

    // 2. DevTools and Source Maps
    if (dev) {
      config.devtool = 'eval-cheap-module-source-map';
    } else {
      config.devtool = false;
    }

    // 3. Aliases
    config.resolve.alias['@'] = path.join(__dirname, 'src');

    // 4. Optimizations
    config.optimization = {
      ...config.optimization,
      moduleIds: dev ? 'named' : 'deterministic',
    };

    // 5. Ignore Warnings
    config.ignoreWarnings = [
      /Failed to parse source map/,
      /source map.*node_modules/,
      /sourceMapURL could not be parsed/,
    ];

    return config;
  },

  env: {
    GENERATE_SOURCEMAP: process.env.NODE_ENV === 'development' ? 'true' : 'false',
  },
};

export default nextConfig;
