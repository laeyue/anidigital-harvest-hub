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

// This will be attached to window for console access
export const attachSeedToWindow = () => {
  // Dynamically import when called
  (window as any).seedTestUsers = async () => {
    const { createAndSeedTestUsers } = await import('./createTestUsers');
    return createAndSeedTestUsers();
  };
  console.log('✅ Seed function attached! Run: await window.seedTestUsers()');
};

