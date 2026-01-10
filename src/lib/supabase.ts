import { createClient } from '@supabase/supabase-js';
import logger from './logger';

// Get Supabase configuration from environment variables (REQUIRED)
// IMPORTANT: Use direct property access (not dynamic) so webpack can replace them at build time
// Webpack only replaces process.env.NEXT_PUBLIC_* when accessed as literals, not dynamically
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate that environment variables are set
if (!supabaseUrl || supabaseUrl.trim().length === 0) {
  // Provide helpful debugging info
  const availableEnvKeys = typeof window !== 'undefined' 
    ? [] // Client-side: process.env won't have all keys
    : Object.keys(process.env)
        .filter(k => k.includes('SUPABASE') || k.includes('NEXT_PUBLIC'))
        .slice(0, 10);
  
  const errorMsg = `Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL.\n\n` +
    `Available related env vars: ${availableEnvKeys.length > 0 ? availableEnvKeys.join(', ') : 'none'}\n\n` +
    `Please ensure:\n` +
    `1. Your .env or .env.local file exists in the project root\n` +
    `2. It contains: NEXT_PUBLIC_SUPABASE_URL=your-value\n` +
    `3. The variable name is exactly correct (case-sensitive)\n` +
    `4. You have restarted the dev server after adding/updating the file\n` +
    `5. There are no spaces around the = sign (use KEY=value, not KEY = value)`;
  
  logger.error(errorMsg);
  throw new Error(errorMsg);
}

if (!supabaseAnonKey || supabaseAnonKey.trim().length === 0) {
  const errorMsg = `Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY. Please add it to your .env or .env.local file and restart the dev server.`;
  logger.error(errorMsg);
  throw new Error(errorMsg);
}

// Trim whitespace
const trimmedUrl = supabaseUrl.trim();
const trimmedKey = supabaseAnonKey.trim();

// Validate URL format before creating client
if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
  const errorMsg = `Invalid Supabase URL format: "${trimmedUrl}". Must be a valid HTTP or HTTPS URL. Please check your NEXT_PUBLIC_SUPABASE_URL environment variable.`;
  logger.error(errorMsg);
  throw new Error(errorMsg);
}

// Create Supabase client
export const supabase = createClient(trimmedUrl, trimmedKey);

