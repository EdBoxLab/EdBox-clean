import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  
  // Source map configuration for proper debugging
  productionBrowserSourceMaps: process.env.NODE_ENV === 'development',
  
  webpack: (config, { isServer, dev }) => {
    // Configure source maps for webpack
    if (dev) {
      // Use eval-cheap-module-source-map for better performance and fewer errors
      config.devtool = 'eval-cheap-module-source-map';
    } else {
      // Disable source maps in production to avoid parsing errors
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
  
  // Turbopack-specific source map configuration
  turbopack: {
    // Turbopack automatically handles source maps in development
  },
  
  // Environment-specific configurations
  env: {
    GENERATE_SOURCEMAP: process.env.NODE_ENV === 'development' ? 'true' : 'false',
  },
  
  // Experimental features for better source map handling
  experimental: {
    // Enable source maps for server components
    serverSourceMaps: process.env.NODE_ENV === 'development',
  },
};

export default nextConfig;
