import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  
  // Source map configuration for proper debugging
  productionBrowserSourceMaps: process.env.NODE_ENV === 'development',
  
  webpack: (config, { isServer, dev }) => {
    // Configure source maps for webpack
    if (dev) {
      config.devtool = 'eval-cheap-module-source-map';
    } else {
      config.devtool = false;
    }

    // Add the resolver for path aliases
    config.resolve.alias['@'] = __dirname + '/src';

    // Ensure source maps work with dynamic imports
    config.optimization = {
      ...config.optimization,
      moduleIds: dev ? 'named' : 'deterministic',
    };

    // Ignore source map warnings from node_modules
    config.ignoreWarnings = [
      /Failed to parse source map/,
      /source map.*node_modules/,
      /sourceMapURL could not be parsed/,
    ];

    return config;
  },
  
  // ============================================
  // DISABLE TURBOPACK (This is the fix!)
  // ============================================
  experimental: {
    turbo:{}, // Disable Turbopack completely
    serverSourceMaps: process.env.NODE_ENV === 'development',
  },
  
  // Environment-specific configurations
  env: {
    GENERATE_SOURCEMAP: process.env.NODE_ENV === 'development' ? 'true' : 'false',
  },
};

export default nextConfig;