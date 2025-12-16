import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  
  // Source map configuration for proper debugging
  productionBrowserSourceMaps: false, // Changed: disabled in production
  
  webpack: (config, { isServer, dev }) => {
    // Configure source maps for webpack
    if (dev) {
      config.devtool = 'eval-cheap-module-source-map';
    } else {
      config.devtool = false;
    }

    config.resolve.alias['@'] = __dirname + '/src';

    config.optimization = {
      ...config.optimization,
      moduleIds: dev ? 'named' : 'deterministic',
    };

    config.ignoreWarnings = [
      /Failed to parse source map/,
      /source map.*node_modules/,
      /sourceMapURL could not be parsed/,
    ];

    return config;
  },
  
  // REMOVED turbopack config - let Next.js handle it
  
  env: {
    GENERATE_SOURCEMAP: process.env.NODE_ENV === 'development' ? 'true' : 'false',
  },
  
  // FIXED: Removed serverSourceMaps - causes Turbopack issues
  experimental: {
    // Removed serverSourceMaps
  },
};

export default nextConfig;