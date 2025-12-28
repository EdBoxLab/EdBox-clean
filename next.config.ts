import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
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

  webpack: (config, { isServer, dev }) => {
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
  
  // Remove experimental.turbo entirely to force Webpack
  // experimental: { ... }, // Delete or comment out turbo:{}
  
  env: {
    GENERATE_SOURCEMAP: process.env.NODE_ENV === 'development' ? 'true' : 'false',
  },
};

export default nextConfig;