/** @type {import('next').NextConfig} */
// Load environment variables from .env file
// Next.js automatically loads .env files and exposes NEXT_PUBLIC_* variables to the client
// We load it here to ensure it's available during config evaluation
const path = require('path');
const fs = require('fs');

// Only try to load .env if it exists (for Docker builds, env vars come from build args)
try {
  const envPath = path.resolve(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
  }
} catch (error) {
  // Ignore errors - environment variables should come from build args in Docker
  console.log('Note: .env file not found, using environment variables from build context');
}

// Debug: Check if environment variables are loaded
if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.log('✅ NEXT_PUBLIC_SUPABASE_URL is loaded:', process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30) + '...');
} else {
  console.warn('⚠️  NEXT_PUBLIC_SUPABASE_URL is NOT loaded - make sure to set it as a build arg');
}

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  // Explicitly use Pages Router (src/pages) - ignore app directory if it exists
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  images: {
    // Allow images from any Supabase project (uses wildcard pattern)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  // Next.js automatically exposes NEXT_PUBLIC_* variables to the client
  // No need to explicitly set them in env config
};

module.exports = nextConfig;

