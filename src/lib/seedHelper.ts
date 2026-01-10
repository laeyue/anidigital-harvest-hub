/**
 * Helper script to seed data for additional users
 * 
 * To seed data for new users:
 * 1. Create the user account through the signup page
 * 2. Get their user ID from Supabase dashboard or use this script
 * 3. Call seedAllDataForUser with their user ID
 * 
 * Or use the seedUserData function below in the browser console
 */

import { seedAllDataForUser } from './seedData';

/**
 * Pre-defined user data for seeding (these are example user profiles)
 * Once these users sign up, you can seed their data using their actual user IDs
 */
export const mockUsers = [
  {
    name: 'Maria Santos',
    email: 'maria.santos@example.com',
    role: 'farmer',
    location: 'Kapatagan, Lanao Del Norte',
    farm_size: '10 hectares',
    crops_planted: ['Rice', 'Corn', 'Vegetables'],
    bio: 'Experienced rice farmer with 15 years of experience in sustainable farming practices.',
  },
  {
    name: 'Juan Dela Cruz',
    email: 'juan.delacruz@example.com',
    role: 'farmer',
    location: 'Kapatagan, Lanao Del Norte',
    farm_size: '8 hectares',
    crops_planted: ['Bananas', 'Coconut', 'Mangoes'],
    bio: 'Fruit farmer specializing in organic fruit production.',
  },
  {
    name: 'Rosa Garcia',
    email: 'rosa.garcia@example.com',
    role: 'both',
    location: 'Kapatagan, Lanao Del Norte',
    farm_size: '12 hectares',
    crops_planted: ['Tomatoes', 'Eggplant', 'Peppers'],
    bio: 'Farm owner and buyer, specializing in vegetables and herbs.',
  },
  {
    name: 'Carlos Reyes',
    email: 'carlos.reyes@example.com',
    role: 'farmer',
    location: 'Kapatagan, Lanao Del Norte',
    farm_size: '15 hectares',
    crops_planted: ['Corn', 'Beans', 'Squash'],
    bio: 'Large-scale farmer focused on corn and legumes production.',
  },
];

/**
 * Seed data for a user by their email
 * Use this in the browser console after the user has signed up
 * 
 * Example usage:
 * import { seedDataForUserByEmail } from '@/lib/seedHelper';
 * await seedDataForUserByEmail('maria.santos@example.com');
 */
export const seedDataForUserByEmail = async (email: string) => {
  const { supabase } = await import('./supabase');
  
  // Get user profile by email
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();

  if (error || !profile) {
    console.error('User not found:', email);
    return null;
  }

  console.log(`Seeding data for user: ${email} (ID: ${profile.id})`);
  await seedAllDataForUser(profile.id);
  console.log(`Data seeded successfully for ${email}`);
  
  return profile.id;
};

/**
 * Seed data for all mock users (if they exist)
 */
export const seedDataForAllMockUsers = async () => {
  const { seedAllDataForUser } = await import('./seedData');
  const { supabase } = await import('./supabase');
  const results = [];
  
  for (const user of mockUsers) {
    try {
      // Get user profile by email
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', user.email)
        .single();

      if (profile) {
        // Update profile with user details
        await supabase
          .from('profiles')
          .update({
            name: user.name,
            role: user.role,
            location: user.location,
            farm_size: user.farm_size,
            crops_planted: user.crops_planted,
            bio: user.bio,
          })
          .eq('id', profile.id);

        // Determine product set based on user
        let productSetKey = undefined;
        if (user.email === 'maria.santos@example.com') productSetKey = 'riceFarmer';
        else if (user.email === 'juan.delacruz@example.com') productSetKey = 'fruitFarmer';
        else if (user.email === 'rosa.garcia@example.com') productSetKey = 'vegetableFarmer';
        else if (user.email === 'carlos.reyes@example.com') productSetKey = 'grainFarmer';

        // Seed data with appropriate product set
        const seedResult = await seedAllDataForUser(profile.id, productSetKey);
        if (seedResult?.success) {
          results.push({ email: user.email, success: true, userId: profile.id });
        } else {
          results.push({ email: user.email, success: false, error: 'Seeding failed' });
        }
      } else {
        results.push({ email: user.email, success: false, error: 'User not found - please sign up first' });
      }
    } catch (error) {
      results.push({ email: user.email, success: false, error: String(error) });
    }
  }
  
  console.log('Seeding results:', results);
  return results;
};

