import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  
  // Source map configuration for proper debugging
  productionBrowserSourceMaps: process.env.NODE_ENV === 'development',
  
  webpack: (config, { isServer, dev }) => {
    // Configure source maps for webpack
    if (dev) {
      // Use high-quality source maps in development
      config.devtool = 'eval-source-map';
    } else {
      // Use lighter source maps in production for better performance
      config.devtool = 'source-map';
    }

    // Ensure source map generation is not interfered with by custom rules
    config.module.rules.push({
      test: /\.mts$/,
      use: {
        loader: 'ts-loader',
        options: {
          // Ensure source maps are generated for .mts files
          compilerOptions: {
            sourceMap: true,
            inlineSourceMap: false,
          },
        },
      },
      exclude: /node_modules/,
    });

    // Add the resolver for path aliases
    config.resolve.alias['@'] = __dirname + '/src';

    // Ensure source maps work with dynamic imports
    config.optimization = {
      ...config.optimization,
      moduleIds: dev ? 'named' : 'deterministic',
    };

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
