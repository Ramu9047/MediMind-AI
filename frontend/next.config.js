/** @type {import('next').NextConfig} */
const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion'],
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl.replace(/\/$/, '')}/api/v1/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
