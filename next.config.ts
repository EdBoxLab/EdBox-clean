import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  webpack: (config, {
    isServer
  }) => {
    // Add a rule to handle .mts files with ts-loader
    config.module.rules.push({
      test: /\.mts$/,
      use: 'ts-loader',
      exclude: /node_modules/,
    });

    // Add the resolver for path aliases
    config.resolve.alias['@'] = __dirname + '/src';

    return config;
  },
  turbopack: {},
};

export default nextConfig;
