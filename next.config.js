/** @type {import('next').NextConfig} */
// Load environment variables from .env file
// Next.js automatically loads .env files and exposes NEXT_PUBLIC_* variables to the client
// We load it here to ensure it's available during config evaluation
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Debug: Check if environment variables are loaded
if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.log('✅ NEXT_PUBLIC_SUPABASE_URL is loaded:', process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30) + '...');
} else {
  console.warn('⚠️  NEXT_PUBLIC_SUPABASE_URL is NOT loaded from .env file');
}

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
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

