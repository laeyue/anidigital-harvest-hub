/**
 * Script to create test users and seed their data
 * 
 * To use this in the browser console, access it through the window object:
 * 1. Make sure you're logged in as any user
 * 2. In browser console, run: window.seedTestUsers()
 * 
 * Or import in a component:
 * import { createAndSeedTestUsers } from '@/lib/createTestUsers';
 * await createAndSeedTestUsers();
 */

import { supabase } from './supabase';
import { seedAllDataForUser } from './seedData';

const testUsers = [
  {
    email: 'maria.santos@example.com',
    password: 'Test123!@#',
    name: 'Maria Santos',
    role: 'farmer',
    location: 'Kapatagan, Lanao Del Norte',
    farm_size: '10 hectares',
    crops_planted: ['Rice', 'Corn', 'Vegetables'],
    bio: 'Experienced rice farmer with 15 years of experience in sustainable farming practices.',
    productSetKey: 'riceFarmer' as const,
  },
  {
    email: 'juan.delacruz@example.com',
    password: 'Test123!@#',
    name: 'Juan Dela Cruz',
    role: 'farmer',
    location: 'Kapatagan, Lanao Del Norte',
    farm_size: '8 hectares',
    crops_planted: ['Bananas', 'Coconut', 'Mangoes'],
    bio: 'Fruit farmer specializing in organic fruit production.',
    productSetKey: 'fruitFarmer' as const,
  },
  {
    email: 'rosa.garcia@example.com',
    password: 'Test123!@#',
    name: 'Rosa Garcia',
    role: 'both',
    location: 'Kapatagan, Lanao Del Norte',
    farm_size: '12 hectares',
    crops_planted: ['Tomatoes', 'Eggplant', 'Peppers'],
    bio: 'Farm owner and buyer, specializing in vegetables and herbs.',
    productSetKey: 'vegetableFarmer' as const,
  },
  {
    email: 'carlos.reyes@example.com',
    password: 'Test123!@#',
    name: 'Carlos Reyes',
    role: 'farmer',
    location: 'Kapatagan, Lanao Del Norte',
    farm_size: '15 hectares',
    crops_planted: ['Corn', 'Beans', 'Squash'],
    bio: 'Large-scale farmer focused on corn and legumes production.',
    productSetKey: 'grainFarmer' as const,
  },
];

export const createAndSeedTestUsers = async () => {
  const results = [];

  for (const userData of testUsers) {
    try {
      console.log(`Creating user: ${userData.email}`);

      // Try to sign up the user (may fail if user already exists - that's okay)
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            role: userData.role,
            location: userData.location,
          },
        },
      });

      // If signup fails with 422, user likely already exists - that's fine, we'll sign in instead
      const userExists = signUpError && (signUpError.message.includes('already registered') || signUpError.message.includes('already exists'));

      // Sign in as the user (whether new or existing) to pass RLS policies
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: userData.password,
      });

      if (signInError) {
        results.push({
          email: userData.email,
          success: false,
          error: userExists 
            ? `User exists but sign in failed: ${signInError.message}` 
            : `Sign up failed: ${signUpError?.message || 'Unknown'}. Sign in failed: ${signInError.message}`,
        });
        continue;
      }

      if (userExists) {
        console.log(`✓ User ${userData.email} already exists, signing in and updating data...`);
      } else {
        console.log(`✓ Created new user: ${userData.email}`);
      }

      const userId = signInData.user.id;

      // Wait a moment for profile trigger if user was just created
      if (!signUpError && authData?.user) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Create or update profile (signed in as user, so RLS allows it)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          location: userData.location,
          farm_size: userData.farm_size,
          crops_planted: userData.crops_planted,
          bio: userData.bio,
        }, {
          onConflict: 'id',
        });

      if (profileError) {
        console.error(`Profile error for ${userData.email}:`, profileError);
        results.push({
          email: userData.email,
          success: false,
          error: `Profile error: ${profileError.message}`,
        });
        await supabase.auth.signOut();
        continue;
      }

      // Seed data (while signed in as the user, so RLS allows inserting)
      console.log(`📦 Seeding data for ${userData.email}...`);
      const seedResult = await seedAllDataForUser(userId, userData.productSetKey);
      
      if (seedResult?.success) {
        console.log(`✅ Successfully seeded data for ${userData.email}`);
      } else {
        console.warn(`⚠️ Some data seeding failed for ${userData.email}:`, seedResult?.error);
      }
      
      results.push({
        email: userData.email,
        success: seedResult?.success || false,
        userId,
      });

      // Sign out after creating
      await supabase.auth.signOut();
      console.log(`\n`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.push({
        email: userData.email,
        success: false,
        error: errorMessage,
      });
    }
  }

  console.log('\n📊 ===== Seeding Complete =====');
  console.log(`✅ Successfully processed: ${results.filter(r => r.success).length}/${results.length} users`);
  const failed = results.filter(r => !r.success);
  if (failed.length > 0) {
    console.log(`❌ Failed: ${failed.length} users`);
    failed.forEach(f => console.log(`   - ${f.email}: ${f.error}`));
  }
  console.log('\n💡 Note: 422 errors are normal if users already exist. The script handles this by signing in instead.\n');
  return results;
};

