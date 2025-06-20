import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverComponentsExternalPackages: ['pdfjs-dist'],
  },
  webpack: (config) => {
    // Handle PDF.js worker
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    
    // Add rule for PDF.js
    config.module.rules.push({
      test: /\.pdf$/,
      use: 'file-loader',
    });

    return config;
  },
  // Configure file upload limits
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export default nextConfig;
