// Helper functions to seed data for new users
// These functions can be called when users sign up or manually

import { supabase } from './supabase';

// Sample products data for Kapatagan users
const sampleProducts = [
  {
    name: 'Premium Jasmine Rice',
    description: 'High-quality jasmine rice, locally grown and processed. Excellent taste and aroma.',
    price: 65.00,
    unit: 'kg',
    quantity: 800,
    category: 'Grains',
    image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop',
  },
  {
    name: 'Fresh String Beans',
    description: 'Crisp and fresh string beans, perfect for adobo and other local dishes.',
    price: 30.00,
    unit: 'kg',
    quantity: 300,
    category: 'Vegetables',
    image_url: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&h=300&fit=crop',
  },
  {
    name: 'Fresh Cavendish Bananas',
    description: 'Sweet and fresh Cavendish bananas, organically grown. Perfect for eating or making banana chips.',
    price: 40.00,
    unit: 'kg',
    quantity: 600,
    category: 'Fruits',
    image_url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=300&fit=crop',
  },
  {
    name: 'Coconut (Buko)',
    description: 'Fresh young coconuts, ideal for buko juice and salad. Available in bulk.',
    price: 25.00,
    unit: 'piece',
    quantity: 200,
    category: 'Fruits',
    image_url: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=400&h=300&fit=crop',
  },
  {
    name: 'Fresh Eggplant (Talong)',
    description: 'Premium quality eggplants, perfect for tortang talong and other Filipino dishes.',
    price: 35.00,
    unit: 'kg',
    quantity: 400,
    category: 'Vegetables',
    image_url: 'https://images.unsplash.com/photo-1604977042228-3a3261485c7b?w=400&h=300&fit=crop',
  },
  {
    name: 'Red Bell Peppers',
    description: 'Colorful and fresh bell peppers, great for salads and cooking.',
    price: 80.00,
    unit: 'kg',
    quantity: 250,
    category: 'Vegetables',
    image_url: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400&h=300&fit=crop',
  },
  {
    name: 'Yellow Corn (Maize)',
    description: 'High-quality yellow corn, perfect for animal feed or human consumption.',
    price: 32.00,
    unit: 'kg',
    quantity: 1200,
    category: 'Grains',
    image_url: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&h=300&fit=crop',
  },
  {
    name: 'Mongo Beans',
    description: 'Fresh mongo beans, excellent source of protein. Great for making monggo guisado.',
    price: 60.00,
    unit: 'kg',
    quantity: 350,
    category: 'Grains',
    image_url: 'https://images.unsplash.com/photo-1614879007381-7f4a80f15a6c?w=400&h=300&fit=crop',
  },
];

// Sample transactions data
const sampleTransactions = [
  { type: 'income' as const, description: 'Sold 300kg Jasmine Rice', amount: 19500.00, daysAgo: 1 },
  { type: 'expense' as const, description: 'Rice Processing Fee', amount: 3000.00, daysAgo: 2 },
  { type: 'income' as const, description: 'Sold 150kg String Beans', amount: 4500.00, daysAgo: 4 },
  { type: 'income' as const, description: 'Sold 200kg Bananas', amount: 8000.00, daysAgo: 2 },
  { type: 'expense' as const, description: 'Harvesting Labor', amount: 2500.00, daysAgo: 3 },
];

/**
 * Seed products for a user in Kapatagan
 * @param userId - User ID
 * @param productSetKey - Optional key to select a specific product set (riceFarmer, fruitFarmer, vegetableFarmer, grainFarmer)
 */
export const seedProductsForUser = async (userId: string, numProducts: number = 2, productSetKey?: string) => {
  const location = 'Kapatagan, Lanao Del Norte';
  
  // Select product set based on key, or use random
  let productsToUse = sampleProducts;
  if (productSetKey === 'riceFarmer') {
    productsToUse = [
      {
        name: 'Premium Jasmine Rice',
        description: 'High-quality jasmine rice, locally grown and processed. Excellent taste and aroma.',
        price: 65.00,
        unit: 'kg',
        quantity: 800,
        category: 'Grains',
        image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop',
      },
      {
        name: 'Fresh String Beans',
        description: 'Crisp and fresh string beans, perfect for adobo and other local dishes.',
        price: 30.00,
        unit: 'kg',
        quantity: 300,
        category: 'Vegetables',
        image_url: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&h=300&fit=crop',
      },
    ];
  } else if (productSetKey === 'fruitFarmer') {
    productsToUse = [
      {
        name: 'Fresh Cavendish Bananas',
        description: 'Sweet and fresh Cavendish bananas, organically grown. Perfect for eating or making banana chips.',
        price: 40.00,
        unit: 'kg',
        quantity: 600,
        category: 'Fruits',
        image_url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=300&fit=crop',
      },
      {
        name: 'Coconut (Buko)',
        description: 'Fresh young coconuts, ideal for buko juice and salad. Available in bulk.',
        price: 25.00,
        unit: 'piece',
        quantity: 200,
        category: 'Fruits',
        image_url: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=400&h=300&fit=crop',
      },
    ];
  } else if (productSetKey === 'vegetableFarmer') {
    productsToUse = [
      {
        name: 'Fresh Eggplant (Talong)',
        description: 'Premium quality eggplants, perfect for tortang talong and other Filipino dishes.',
        price: 35.00,
        unit: 'kg',
        quantity: 400,
        category: 'Vegetables',
        image_url: 'https://images.unsplash.com/photo-1604977042228-3a3261485c7b?w=400&h=300&fit=crop',
      },
      {
        name: 'Red Bell Peppers',
        description: 'Colorful and fresh bell peppers, great for salads and cooking.',
        price: 80.00,
        unit: 'kg',
        quantity: 250,
        category: 'Vegetables',
        image_url: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400&h=300&fit=crop',
      },
    ];
  } else if (productSetKey === 'grainFarmer') {
    productsToUse = [
      {
        name: 'Yellow Corn (Maize)',
        description: 'High-quality yellow corn, perfect for animal feed or human consumption.',
        price: 32.00,
        unit: 'kg',
        quantity: 1200,
        category: 'Grains',
        image_url: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&h=300&fit=crop',
      },
      {
        name: 'Mongo Beans',
        description: 'Fresh mongo beans, excellent source of protein. Great for making monggo guisado.',
        price: 60.00,
        unit: 'kg',
        quantity: 350,
        category: 'Grains',
        image_url: 'https://images.unsplash.com/photo-1614879007381-7f4a80f15a6c?w=400&h=300&fit=crop',
      },
    ];
  }
  
  const selectedProducts = productsToUse.slice(0, numProducts);

  const productsToInsert = selectedProducts.map((product) => ({
    seller_id: userId,
    name: product.name,
    description: product.description,
    price: product.price,
    unit: product.unit,
    quantity: product.quantity,
    category: product.category.toLowerCase(),
    location,
    rating: 4.5 + Math.random() * 0.4, // Random rating between 4.5 and 4.9
    image_url: product.image_url,
  }));

  const { data, error } = await supabase
    .from('products')
    .insert(productsToInsert)
    .select();

  if (error) {
    console.error('Error seeding products:', error);
    return null;
  }

  return data;
};

/**
 * Seed transactions for a user
 */
export const seedTransactionsForUser = async (userId: string, numTransactions: number = 3) => {
  const selectedTransactions = sampleTransactions.slice(0, numTransactions);

  const transactionsToInsert = selectedTransactions.map((transaction) => ({
    user_id: userId,
    type: transaction.type,
    description: transaction.description,
    amount: transaction.amount,
    date: new Date(Date.now() - transaction.daysAgo * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  }));

  const { data, error } = await supabase
    .from('transactions')
    .insert(transactionsToInsert)
    .select();

  if (error) {
    console.error('Error seeding transactions:', error);
    return null;
  }

  return data;
};

/**
 * Seed notifications for a user
 */
export const seedNotificationsForUser = async (userId: string) => {
  const notifications = [
    {
      user_id: userId,
      title: 'Payment Received',
      message: 'Payment received from recent sale. Check your finances for details.',
      type: 'success',
      read: false,
    },
    {
      user_id: userId,
      title: 'Welcome to AniDigital!',
      message: 'Welcome to AniDigital Harvest Hub! Start by adding your farm location in your profile.',
      type: 'info',
      read: true,
    },
  ];

  const { data, error } = await supabase
    .from('notifications')
    .insert(notifications)
    .select();

  if (error) {
    console.error('Error seeding notifications:', error);
    return null;
  }

  return data;
};

/**
 * Seed all data for a new user in Kapatagan
 * @param userId - User ID
 * @param productSetKey - Optional key to select a specific product set
 */
export const seedAllDataForUser = async (userId: string, productSetKey?: string) => {
  try {
    // Update profile location if needed
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ location: 'Kapatagan, Lanao Del Norte' })
      .eq('id', userId);

    if (updateError) {
      console.warn('Error updating profile location:', updateError);
    }

    // Seed products (2-3 products)
    const numProducts = Math.floor(Math.random() * 2) + 2; // 2 or 3 products
    const products = await seedProductsForUser(userId, numProducts, productSetKey);
    console.log(`Seeded ${products?.length || 0} products`);

    // Seed transactions (3-5 transactions)
    const numTransactions = Math.floor(Math.random() * 3) + 3; // 3 to 5 transactions
    const transactions = await seedTransactionsForUser(userId, numTransactions);
    console.log(`Seeded ${transactions?.length || 0} transactions`);

    // Seed notifications
    const notifications = await seedNotificationsForUser(userId);
    console.log(`Seeded ${notifications?.length || 0} notifications`);

    return { success: true, products, transactions, notifications };
  } catch (error) {
    console.error('Error seeding data for user:', error);
    return { success: false, error };
  }
};

