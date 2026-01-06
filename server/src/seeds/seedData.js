/**
 * Seed Data Script
 *
 * Populates database with sample data for testing.
 * Run: npm run seed
 *
 * Creates:
 * - 1 Admin user
 * - 1 Customer user
 * - 10 Products (pizzas, drinks, breads)
 * - 3 Coupons
 */
require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');

// Sample Users
const users = [
  {
    name: 'Admin User',
    email: 'admin@crewplus.com',
    password: 'admin123',
    phone: '9999999999',
    role: 'ADMIN',
    address: {
      street: '123 Admin Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001'
    }
  },
  {
    name: 'John Customer',
    email: 'john@example.com',
    password: 'john123',
    phone: '9876543210',
    role: 'CUSTOMER',
    address: {
      street: '456 Customer Lane',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400002'
    }
  }
];

// Sample Products
const products = [
  // Pizzas
  {
    name: 'Margherita',
    description: 'Classic tomato sauce, fresh mozzarella, basil leaves',
    category: 'pizza',
    price: 249,
    sizes: {
      small: { price: 199, available: true },
      medium: { price: 299, available: true },
      large: { price: 399, available: true },
      extra_large: { price: 499, available: true }
    },
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',
    ingredients: ['Tomato Sauce', 'Mozzarella', 'Basil', 'Olive Oil'],
    isVegetarian: true,
    isSpicy: false,
    inventory: 50,
    rating: { average: 4.5, count: 120 },
    tags: ['bestseller', 'classic']
  },
  {
    name: 'Pepperoni',
    description: 'Loaded with spicy pepperoni and mozzarella cheese',
    category: 'pizza',
    price: 349,
    sizes: {
      small: { price: 299, available: true },
      medium: { price: 399, available: true },
      large: { price: 499, available: true },
      extra_large: { price: 599, available: true }
    },
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400',
    ingredients: ['Tomato Sauce', 'Mozzarella', 'Pepperoni'],
    isVegetarian: false,
    isSpicy: true,
    inventory: 40,
    rating: { average: 4.7, count: 200 },
    tags: ['bestseller', 'spicy']
  },
  {
    name: 'BBQ Chicken',
    description: 'Grilled chicken, BBQ sauce, red onions, cilantro',
    category: 'pizza',
    price: 399,
    sizes: {
      small: { price: 349, available: true },
      medium: { price: 449, available: true },
      large: { price: 549, available: true },
      extra_large: { price: 649, available: true }
    },
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
    ingredients: ['BBQ Sauce', 'Grilled Chicken', 'Mozzarella', 'Red Onion', 'Cilantro'],
    isVegetarian: false,
    isSpicy: false,
    inventory: 35,
    rating: { average: 4.6, count: 150 },
    tags: ['popular']
  },
  {
    name: 'Veggie Supreme',
    description: 'Bell peppers, onions, mushrooms, olives, tomatoes',
    category: 'pizza',
    price: 329,
    sizes: {
      small: { price: 279, available: true },
      medium: { price: 379, available: true },
      large: { price: 479, available: true },
      extra_large: { price: 579, available: true }
    },
    image: 'https://images.unsplash.com/photo-1511689660979-10d2b1aada49?w=400',
    ingredients: ['Tomato Sauce', 'Mozzarella', 'Bell Peppers', 'Onions', 'Mushrooms', 'Olives'],
    isVegetarian: true,
    isSpicy: false,
    inventory: 45,
    rating: { average: 4.3, count: 90 },
    tags: ['healthy', 'vegetarian']
  },
  {
    name: 'Spicy Paneer',
    description: 'Indian cottage cheese with spicy jalapeños and green chilies',
    category: 'pizza',
    price: 369,
    sizes: {
      small: { price: 319, available: true },
      medium: { price: 419, available: true },
      large: { price: 519, available: true },
      extra_large: { price: 619, available: true }
    },
    image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=400',
    ingredients: ['Tomato Sauce', 'Mozzarella', 'Paneer', 'Jalapeños', 'Green Chilies'],
    isVegetarian: true,
    isSpicy: true,
    inventory: 30,
    rating: { average: 4.4, count: 85 },
    tags: ['indian', 'spicy', 'vegetarian']
  },

  // Drinks
  {
    name: 'Coca Cola',
    description: 'Classic refreshing cola drink',
    category: 'drink',
    price: 60,
    sizes: {
      small: { price: 40, available: true },
      medium: { price: 60, available: true },
      large: { price: 80, available: true }
    },
    image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400',
    ingredients: ['Carbonated Water', 'Sugar', 'Natural Flavors'],
    isVegetarian: true,
    isSpicy: false,
    inventory: 100,
    rating: { average: 4.2, count: 50 },
    tags: ['cold', 'refreshing']
  },
  {
    name: 'Fresh Lemonade',
    description: 'Freshly squeezed lemonade with mint',
    category: 'drink',
    price: 79,
    sizes: {
      small: { price: 59, available: true },
      medium: { price: 79, available: true },
      large: { price: 99, available: true }
    },
    image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400',
    ingredients: ['Lemon', 'Water', 'Sugar', 'Mint'],
    isVegetarian: true,
    isSpicy: false,
    inventory: 60,
    rating: { average: 4.5, count: 75 },
    tags: ['fresh', 'healthy']
  },

  // Breads
  {
    name: 'Garlic Bread',
    description: 'Crispy bread with garlic butter and herbs',
    category: 'bread',
    price: 129,
    sizes: {
      small: { price: 99, available: true },
      medium: { price: 149, available: true },
      large: { price: 199, available: true }
    },
    image: 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=400',
    ingredients: ['Bread', 'Garlic Butter', 'Parsley', 'Oregano'],
    isVegetarian: true,
    isSpicy: false,
    inventory: 80,
    rating: { average: 4.6, count: 110 },
    tags: ['side', 'bestseller']
  },
  {
    name: 'Cheesy Breadsticks',
    description: 'Warm breadsticks stuffed with mozzarella cheese',
    category: 'bread',
    price: 149,
    sizes: {
      small: { price: 119, available: true },
      medium: { price: 169, available: true },
      large: { price: 219, available: true }
    },
    image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=400',
    ingredients: ['Bread', 'Mozzarella', 'Butter', 'Garlic'],
    isVegetarian: true,
    isSpicy: false,
    inventory: 70,
    rating: { average: 4.4, count: 95 },
    tags: ['cheesy', 'side']
  },
  {
    name: 'Spicy Chicken Wings',
    description: 'Crispy wings tossed in spicy buffalo sauce',
    category: 'bread',
    price: 249,
    sizes: {
      small: { price: 199, available: true },
      medium: { price: 299, available: true },
      large: { price: 399, available: true }
    },
    image: 'https://images.unsplash.com/photo-1608039755401-742074f0548d?w=400',
    ingredients: ['Chicken Wings', 'Buffalo Sauce', 'Butter'],
    isVegetarian: false,
    isSpicy: true,
    inventory: 40,
    rating: { average: 4.7, count: 130 },
    tags: ['spicy', 'popular']
  }
];

// Sample Coupons
const coupons = [
  {
    code: 'WELCOME50',
    type: 'percentage',
    value: 50,
    minOrderAmount: 300,
    maxDiscount: 200,
    usageLimit: 1000,
    userUsageLimit: 1,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    description: '50% off for new users, max ₹200 discount'
  },
  {
    code: 'FLAT100',
    type: 'fixed',
    value: 100,
    minOrderAmount: 500,
    usageLimit: 500,
    userUsageLimit: 3,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    description: '₹100 off on orders above ₹500'
  },
  {
    code: 'PIZZA20',
    type: 'percentage',
    value: 20,
    minOrderAmount: 400,
    maxDiscount: 150,
    usageLimit: null, // Unlimited
    userUsageLimit: null, // Unlimited per user
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    description: '20% off, max ₹150 - No usage limits!'
  }
];

// Seed function
const seedDatabase = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await Coupon.deleteMany({});

    // Create users (password will be hashed by pre-save hook)
    console.log('Creating users...');
    const createdUsers = await User.create(users);
    console.log(`Created ${createdUsers.length} users`);

    // Create products
    console.log('Creating products...');
    const createdProducts = await Product.create(products);
    console.log(`Created ${createdProducts.length} products`);

    // Create coupons
    console.log('Creating coupons...');
    const createdCoupons = await Coupon.create(coupons);
    console.log(`Created ${createdCoupons.length} coupons`);

    console.log('\n========================================');
    console.log('Database seeded successfully!');
    console.log('========================================');
    console.log('\nTest Accounts:');
    console.log('  Admin: admin@crewplus.com / admin123');
    console.log('  User:  john@example.com / john123');
    console.log('\nCoupon Codes:');
    console.log('  WELCOME50 - 50% off (max ₹200)');
    console.log('  FLAT100   - ₹100 off');
    console.log('  PIZZA20   - 20% off (max ₹150)');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

// Run seeder
seedDatabase();
