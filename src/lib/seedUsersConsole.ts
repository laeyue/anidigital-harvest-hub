/**
 * Console-friendly version of the seed script
 * This uses the existing supabase client from the app
 * 
 * To use: Copy this entire code block into your browser console
 * 
 * OR add this to your app temporarily:
 * Add to App.tsx or any component: window.seedTestUsers = createAndSeedTestUsers;
 * Then run in console: await window.seedTestUsers()
 */

import logger from './logger';

// This will be attached to window for console access
export const attachSeedToWindow = () => {
  if (typeof window === 'undefined') return; // Server-side guard
  // Dynamically import when called
  (window as Window & { seedTestUsers?: () => Promise<unknown> }).seedTestUsers = async () => {
    const { createAndSeedTestUsers } = await import('./createTestUsers');
    return createAndSeedTestUsers();
  };
  logger.log('✅ Seed function attached! Run: await window.seedTestUsers()');
};

