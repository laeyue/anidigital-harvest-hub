/**
 * Standalone script to seed test users
 * Copy and paste this entire script into your browser console
 */

(async function seedTestUsers() {
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  
  const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || window.location.origin.includes('localhost') 
    ? 'YOUR_SUPABASE_URL' // Replace with your actual URL
    : window.location.origin;
  
  const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'; // Replace with your actual key
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  const testUsers = [
    {
      email: 'maria.santos@example.com',
      password: 'Test123!@#',
      name: 'Maria Santos',
      role: 'farmer',
      location: 'Kapatagan, Philippines',
      farm_size: '10 hectares',
      crops_planted: ['Rice', 'Corn', 'Vegetables'],
      bio: 'Experienced rice farmer with 15 years of experience in sustainable farming practices.',
    },
    {
      email: 'juan.delacruz@example.com',
      password: 'Test123!@#',
      name: 'Juan Dela Cruz',
      role: 'farmer',
      location: 'Kapatagan, Philippines',
      farm_size: '8 hectares',
      crops_planted: ['Bananas', 'Coconut', 'Mangoes'],
      bio: 'Fruit farmer specializing in organic fruit production.',
    },
    {
      email: 'rosa.garcia@example.com',
      password: 'Test123!@#',
      name: 'Rosa Garcia',
      role: 'both',
      location: 'Kapatagan, Philippines',
      farm_size: '12 hectares',
      crops_planted: ['Tomatoes', 'Eggplant', 'Peppers'],
      bio: 'Farm owner and buyer, specializing in vegetables and herbs.',
    },
    {
      email: 'carlos.reyes@example.com',
      password: 'Test123!@#',
      name: 'Carlos Reyes',
      role: 'farmer',
      location: 'Kapatagan, Philippines',
      farm_size: '15 hectares',
      crops_planted: ['Corn', 'Beans', 'Squash'],
      bio: 'Large-scale farmer focused on corn and legumes production.',
    },
  ];

  // Product sets for each user type
  const productSets = {
    riceFarmer: [
      { name: 'Premium Jasmine Rice', description: 'High-quality jasmine rice, locally grown and processed.', price: 65.00, unit: 'kg', quantity: 800, category: 'Grains', image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop' },
      { name: 'Fresh String Beans', description: 'Crisp and fresh string beans, perfect for adobo.', price: 30.00, unit: 'kg', quantity: 300, category: 'Vegetables', image_url: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&h=300&fit=crop' },
    ],
    fruitFarmer: [
      { name: 'Fresh Cavendish Bananas', description: 'Sweet and fresh Cavendish bananas, organically grown.', price: 40.00, unit: 'kg', quantity: 600, category: 'Fruits', image_url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=300&fit=crop' },
      { name: 'Coconut (Buko)', description: 'Fresh young coconuts, ideal for buko juice.', price: 25.00, unit: 'piece', quantity: 200, category: 'Fruits', image_url: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=400&h=300&fit=crop' },
    ],
    vegetableFarmer: [
      { name: 'Fresh Eggplant (Talong)', description: 'Premium quality eggplants, perfect for tortang talong.', price: 35.00, unit: 'kg', quantity: 400, category: 'Vegetables', image_url: 'https://images.unsplash.com/photo-1604977042228-3a3261485c7b?w=400&h=300&fit=crop' },
      { name: 'Red Bell Peppers', description: 'Colorful and fresh bell peppers.', price: 80.00, unit: 'kg', quantity: 250, category: 'Vegetables', image_url: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400&h=300&fit=crop' },
    ],
    grainFarmer: [
      { name: 'Yellow Corn (Maize)', description: 'High-quality yellow corn.', price: 32.00, unit: 'kg', quantity: 1200, category: 'Grains', image_url: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&h=300&fit=crop' },
      { name: 'Mongo Beans', description: 'Fresh mongo beans, excellent source of protein.', price: 60.00, unit: 'kg', quantity: 350, category: 'Grains', image_url: 'https://images.unsplash.com/photo-1614879007381-7f4a80f15a6c?w=400&h=300&fit=crop' },
    ],
  };

  const results = [];

  for (const userData of testUsers) {
    try {
      console.log(`\n📝 Creating user: ${userData.email}`);

      // Determine product set
      let productSetKey = 'riceFarmer';
      if (userData.email.includes('juan')) productSetKey = 'fruitFarmer';
      else if (userData.email.includes('rosa')) productSetKey = 'vegetableFarmer';
      else if (userData.email.includes('carlos')) productSetKey = 'grainFarmer';

      // Sign up the user
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

      let userId = null;

      if (signUpError && !signUpError.message.includes('already registered')) {
        // Try to sign in if user exists
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: userData.email,
          password: userData.password,
        });

        if (signInError || !signInData?.user) {
          results.push({ email: userData.email, success: false, error: signUpError?.message || signInError?.message });
          continue;
        }
        userId = signInData.user.id;
      } else if (authData?.user) {
        userId = authData.user.id;
      }

      if (!userId) {
        results.push({ email: userData.email, success: false, error: 'Could not get user ID' });
        continue;
      }

      console.log(`✅ User created/found: ${userData.email} (${userId.substring(0, 8)}...)`);

      // Update profile
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
        }, { onConflict: 'id' });

      if (profileError) {
        console.error(`❌ Profile error:`, profileError);
        results.push({ email: userData.email, success: false, error: profileError.message });
        continue;
      }

      // Seed products
      const products = productSets[productSetKey];
      const productsToInsert = products.map(p => ({
        seller_id: userId,
        ...p,
        category: p.category.toLowerCase(),
        location: 'Kapatagan, Philippines',
        rating: 4.5 + Math.random() * 0.4,
      }));

      const { error: productsError } = await supabase
        .from('products')
        .insert(productsToInsert);

      if (productsError) console.warn(`⚠️ Products error:`, productsError);
      else console.log(`✅ Seeded ${products.length} products`);

      // Seed transactions
      const transactions = [
        { type: 'income', description: `Sold ${products[0]?.quantity || 300}kg ${products[0]?.name || 'produce'}`, amount: (products[0]?.price || 50) * 3, date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0] },
        { type: 'expense', description: 'Fertilizer Purchase', amount: 3000, date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0] },
        { type: 'income', description: `Sold ${products[1]?.quantity || 200}kg ${products[1]?.name || 'produce'}`, amount: (products[1]?.price || 40) * 2, date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0] },
      ];

      const { error: transactionsError } = await supabase
        .from('transactions')
        .insert(transactions.map(t => ({ user_id: userId, ...t })));

      if (transactionsError) console.warn(`⚠️ Transactions error:`, transactionsError);
      else console.log(`✅ Seeded ${transactions.length} transactions`);

      // Seed notifications
      const { error: notificationsError } = await supabase
        .from('notifications')
        .insert([
          { user_id: userId, title: 'Payment Received', message: 'Payment received from recent sale.', type: 'success', read: false },
          { user_id: userId, title: 'Welcome!', message: 'Welcome to AniDigital Harvest Hub!', type: 'info', read: true },
        ]);

      if (notificationsError) console.warn(`⚠️ Notifications error:`, notificationsError);
      else console.log(`✅ Seeded 2 notifications`);

      // Sign out
      await supabase.auth.signOut();

      results.push({ email: userData.email, success: true, userId });
      console.log(`✅ ✅ ✅ Completed: ${userData.email}\n`);

    } catch (error) {
      console.error(`❌ Error for ${userData.email}:`, error);
      results.push({ email: userData.email, success: false, error: error.message });
      await supabase.auth.signOut();
    }
  }

  console.log('\n📊 Seeding Results:', results);
  console.log(`\n✅ Successfully created ${results.filter(r => r.success).length} users`);
  console.log(`❌ Failed: ${results.filter(r => !r.success).length} users`);
  
  return results;
})();

