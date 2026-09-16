/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
    NEXT_PUBLIC_RAG_HISTORY_URL: process.env.NEXT_PUBLIC_RAG_HISTORY_URL || 'http://localhost:8000/api',
    NEXT_PUBLIC_RAG_PREBID_URL: process.env.NEXT_PUBLIC_RAG_PREBID_URL || 'http://localhost:8001/api',
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: 'http://localhost:3001/api/:path*',
        },
      ],
    };
  },
};

module.exports = nextConfig;
