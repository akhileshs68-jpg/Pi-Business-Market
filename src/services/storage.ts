/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  User,
  Store,
  Product,
  Order,
  Review,
  Notification,
  OrderStatus,
  ProductCategory,
  PioneerCategory,
  PioneerProfile,
  Job,
  JobApplication,
  UnifiedListing,
  ProfileVersion,
  TrustMetrics,
  UnifiedAnalytics,
  ListingStatus,
  ListingType,
  VerificationLevel
} from '../types';

const STORAGE_KEY_PREFIX = 'pi_biz_mkt_';

const KEYS = {
  USERS: `${STORAGE_KEY_PREFIX}users`,
  STORES: `${STORAGE_KEY_PREFIX}stores`,
  PRODUCTS: `${STORAGE_KEY_PREFIX}products`,
  ORDERS: `${STORAGE_KEY_PREFIX}orders`,
  REVIEWS: `${STORAGE_KEY_PREFIX}reviews`,
  NOTIFICATIONS: `${STORAGE_KEY_PREFIX}notifications`,
  CURRENT_USER: `${STORAGE_KEY_PREFIX}current_user`,
  PIONEER_PROFILES: `${STORAGE_KEY_PREFIX}pioneer_profiles`,
  JOBS: `${STORAGE_KEY_PREFIX}jobs`,
  JOB_APPLICATIONS: `${STORAGE_KEY_PREFIX}job_applications`,
  UNIFIED_LISTINGS: `${STORAGE_KEY_PREFIX}unified_listings`
};

// ==========================================
// SEED DATA
// ==========================================

const DEFAULT_CURRENT_USER: User = {
  uid: 'user_active_pioneer',
  username: 'pi_pioneer_88',
  displayName: 'Alex Mercer',
  walletAddress: 'GBCWD32QYJ7LURP5H6V77JHYX345PPONNFFVVZZ44SSTT22XXYYZZ',
  createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  isMerchant: false,
  roles: ['user'],
  ratingCount: 0,
  averageRating: 5.0
};

const SEED_USERS: User[] = [
  DEFAULT_CURRENT_USER,
  {
    uid: 'merchant_tech_owner',
    username: 'satoshi_pi',
    displayName: 'Satoshi Gadgets',
    walletAddress: 'GBATECHHUB784632QYJ7LURPH6V77JHYX345PPONNFFVVZZ44S',
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    isMerchant: true,
    storeId: 'store_tech_hub',
    roles: ['user', 'merchant'],
    ratingCount: 12,
    averageRating: 4.8
  },
  {
    uid: 'merchant_fashion_owner',
    username: 'lisa_couture',
    displayName: 'Lisa Vintage',
    walletAddress: 'GBACOUTURE984632QYJ7LURPH6V77JHYX345PPONNFFVVZZ44S',
    createdAt: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000).toISOString(),
    isMerchant: true,
    storeId: 'store_fashion_vibe',
    roles: ['user', 'merchant'],
    ratingCount: 8,
    averageRating: 4.6
  },
  {
    uid: 'merchant_cafe_owner',
    username: 'pi_barista',
    displayName: 'Marco Coffee',
    walletAddress: 'GBACAFE9836421QYJ7LURPH6V77JHYX345PPONNFFVVZZ44S',
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    isMerchant: true,
    storeId: 'store_decentral_cafe',
    roles: ['user', 'merchant'],
    ratingCount: 32,
    averageRating: 4.9
  },
  {
    uid: 'pioneer_electrician',
    username: 'sparky_john',
    displayName: 'Johnathan Spark',
    walletAddress: 'GBAELECTRICAL9384819024318902534290124318902534290124',
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    isMerchant: false,
    profileId: 'profile_electrician_1',
    roles: ['user', 'pioneer_provider'],
    ratingCount: 14,
    averageRating: 4.9
  },
  {
    uid: 'pioneer_plumber',
    username: 'mario_plumber',
    displayName: 'Mario Rossi',
    walletAddress: 'GBAPLUMBER48293819024318902534290124318902534290124',
    createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
    isMerchant: false,
    profileId: 'profile_plumber_1',
    roles: ['user', 'pioneer_provider'],
    ratingCount: 9,
    averageRating: 4.8
  },
  {
    uid: 'pioneer_tutor',
    username: 'evelyn_tutor',
    displayName: 'Dr. Evelyn Carter',
    walletAddress: 'GBATECHHUB91283819024318902534290124318902534290124',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    isMerchant: false,
    profileId: 'profile_tutor_1',
    roles: ['user', 'pioneer_provider'],
    ratingCount: 18,
    averageRating: 5.0
  },
  {
    uid: 'pioneer_freelancer',
    username: 'alex_dev',
    displayName: 'Alex Rivera',
    walletAddress: 'GBAFREELANCER11923819024318902534290124318902534290124',
    createdAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString(),
    isMerchant: false,
    profileId: 'profile_freelancer_1',
    roles: ['user', 'pioneer_provider'],
    ratingCount: 22,
    averageRating: 4.9
  },
  {
    uid: 'pioneer_jobprovider',
    username: 'pi_ventures',
    displayName: 'Pi Global Ventures',
    walletAddress: 'GBAJOBPROVIDER88293819024318902534290124318902534290124',
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    isMerchant: false,
    profileId: 'profile_jobprovider_1',
    roles: ['user', 'pioneer_provider'],
    ratingCount: 3,
    averageRating: 4.7
  }
];

const SEED_STORES: Store[] = [
  {
    id: 'store_tech_hub',
    ownerUid: 'merchant_tech_owner',
    name: 'Pi Tech HQ',
    slug: 'pi-tech-hq',
    description: 'The ultimate destination for premium electronics, custom-built mechanical keyboards, and verified IoT hardware. Express global shipping with Pi payment confirmation.',
    logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&h=150&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&h=250&q=80',
    category: 'electronics',
    createdAt: new Date(Date.now() - 110 * 24 * 60 * 60 * 1000).toISOString(),
    verified: true,
    rating: 4.8,
    reviewCount: 12,
    piWalletAddress: 'GBATECHHUB784632QYJ7LURPH6V77JHYX345PPONNFFVVZZ44S',
    phone: '+1 415 889 0192',
    email: 'sales@pitechhq.io',
    socials: {
      telegram: 'pitechhq_portal',
      twitter: 'PiTechHQ'
    },
    featured: true,
    analytics: {
      totalRevenuePi: 3450.5,
      views: 12450,
      ordersCount: 42,
      conversionRate: 3.2,
      salesHistory: [
        { date: 'Jul 12', amount: 350, orders: 4 },
        { date: 'Jul 13', amount: 480, orders: 5 },
        { date: 'Jul 14', amount: 150, orders: 2 },
        { date: 'Jul 15', amount: 720, orders: 8 },
        { date: 'Jul 16', amount: 890, orders: 11 },
        { date: 'Jul 17', amount: 860, orders: 12 }
      ]
    }
  },
  {
    id: 'store_fashion_vibe',
    ownerUid: 'merchant_fashion_owner',
    name: 'Couture de Pi',
    slug: 'couture-de-pi',
    description: 'High-quality, hand-woven sustainable apparel and streetwear designed exclusively for the Pi Network community. Wear your consensus with pride.',
    logoUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=150&h=150&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&h=250&q=80',
    category: 'fashion',
    createdAt: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(),
    verified: true,
    rating: 4.6,
    reviewCount: 8,
    piWalletAddress: 'GBACOUTURE984632QYJ7LURPH6V77JHYX345PPONNFFVVZZ44S',
    email: 'hello@couturedepi.com',
    socials: {
      telegram: 'couturedepi',
      whatsapp: '+33 6 12 34 56 78'
    },
    featured: true,
    analytics: {
      totalRevenuePi: 1820.0,
      views: 7420,
      ordersCount: 26,
      conversionRate: 2.8,
      salesHistory: [
        { date: 'Jul 12', amount: 120, orders: 1 },
        { date: 'Jul 13', amount: 250, orders: 3 },
        { date: 'Jul 14', amount: 320, orders: 4 },
        { date: 'Jul 15', amount: 190, orders: 2 },
        { date: 'Jul 16', amount: 420, orders: 5 },
        { date: 'Jul 17', amount: 520, orders: 11 }
      ]
    }
  },
  {
    id: 'store_decentral_cafe',
    ownerUid: 'merchant_cafe_owner',
    name: 'Decentral Cafe & Bakery',
    slug: 'decentral-cafe',
    description: 'Fresh organic roasted whole coffee beans, specialty sourdough, and local delicacies. Fueling global node operators and developers with every purchase.',
    logoUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=150&h=150&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&w=800&h=250&q=80',
    category: 'food_delivery',
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    verified: true,
    rating: 4.9,
    reviewCount: 32,
    piWalletAddress: 'GBACAFE9836421QYJ7LURPH6V77JHYX345PPONNFFVVZZ44S',
    phone: '+39 06 1234 5678',
    email: 'beans@decentralcafe.pi',
    featured: false,
    analytics: {
      totalRevenuePi: 890.25,
      views: 3120,
      ordersCount: 68,
      conversionRate: 4.5,
      salesHistory: [
        { date: 'Jul 12', amount: 85, orders: 6 },
        { date: 'Jul 13', amount: 120, orders: 9 },
        { date: 'Jul 14', amount: 95, orders: 7 },
        { date: 'Jul 15', amount: 110, orders: 8 },
        { date: 'Jul 16', amount: 140, orders: 11 },
        { date: 'Jul 17', amount: 165, orders: 13 }
      ]
    }
  }
];

const SEED_PRODUCTS: Product[] = [
  // TECH PRODUCTS
  {
    id: 'prod_keyboard',
    storeId: 'store_tech_hub',
    storeName: 'Pi Tech HQ',
    title: 'CyberLite-88 Custom Mechanical Keyboard',
    description: 'A premium, hot-swappable tenkeyless mechanical keyboard designed for high-speed developers and consensus node operators. Features pre-lubed Gateron Yellow switches, sound-absorbing foam casing, double-shot custom PBT keycaps with laser-etched Pi logos, and a custom gold-plated braided coiled USB-C cable.',
    pricePi: 145.0,
    category: 'electronics',
    imageUrls: [
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&h=400&q=80',
      'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=600&h=400&q=80'
    ],
    stock: 12,
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['keyboard', 'mech', 'developer', 'hardware'],
    attributes: [
      { name: 'Switch Type', options: ['Gateron Yellow (Linear)', 'Gateron Brown (Tactile)', 'Cherry MX Blue (Clicky)'] },
      { name: 'Case Color', options: ['Cosmic Grey', 'Sleek Obsidian', 'Pioneer Purple'] }
    ],
    isDigital: false,
    status: 'active',
    views: 1450,
    salesCount: 18,
    averageRating: 4.9,
    reviewCount: 5,
    aiOptimized: true,
    boostedWithAds: true
  },
  {
    id: 'prod_node_rpi',
    storeId: 'store_tech_hub',
    storeName: 'Pi Tech HQ',
    title: 'Pi Node Raspberry Pi 5 Pre-Configured Suite',
    description: 'Plug-and-play validation node solution. Comes with Raspberry Pi 5 (8GB RAM), a high-speed 1TB NVMe SSD with aluminum active cooling enclosure, pre-installed secure Linux OS, and optimization scripts to run your Pi Network consensus node with 99.9% uptime. Includes full telemetry panel and remote power management.',
    pricePi: 420.0,
    category: 'electronics',
    imageUrls: [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&h=400&q=80',
      'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=600&h=400&q=80'
    ],
    stock: 5,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['node', 'hardware', 'raspberrypi', 'server'],
    attributes: [
      { name: 'SSD Capacity', options: ['1TB NVMe', '2TB NVMe'] }
    ],
    isDigital: false,
    status: 'active',
    views: 3200,
    salesCount: 10,
    averageRating: 4.8,
    reviewCount: 4,
    aiOptimized: true,
    boostedWithAds: false
  },
  {
    id: 'prod_charger',
    storeId: 'store_tech_hub',
    storeName: 'Pi Tech HQ',
    title: 'GaN 140W Multi-Port Ultra-Fast Charger',
    description: 'Advanced Gallium Nitride (GaN) technology charging block. Dynamically splits 140W across 3x USB-C ports and 1x USB-A port to charge laptops, tablets, and phones simultaneously. Smart temperature guards prevent overheating.',
    pricePi: 45.0,
    category: 'electronics',
    imageUrls: [
      'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?auto=format&fit=crop&w=600&h=400&q=80'
    ],
    stock: 45,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['charger', 'gan', 'travel', 'accessories'],
    attributes: [],
    isDigital: false,
    status: 'active',
    views: 450,
    salesCount: 14,
    averageRating: 4.5,
    reviewCount: 3,
    aiOptimized: false,
    boostedWithAds: false
  },

  // FASHION PRODUCTS
  {
    id: 'prod_hoodie',
    storeId: 'store_fashion_vibe',
    storeName: 'Couture de Pi',
    title: 'Consensus Heavyweight Organic Cotton Hoodie',
    description: 'A masterpiece of premium streetwear. Crafted from ultra-heavyweight 450GSM certified organic French Terry cotton, featuring an oversized drop-shoulder silhouette, double-lined hood (no drawstrings), and an embossed minimalist golden Pi Network symbol on the center chest. Extremely durable, comfortable, and warm.',
    pricePi: 75.0,
    category: 'fashion',
    imageUrls: [
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=600&h=400&q=80',
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=600&h=400&q=80'
    ],
    stock: 32,
    createdAt: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['clothing', 'hoodie', 'organic', 'streetwear'],
    attributes: [
      { name: 'Size', options: ['S', 'M', 'L', 'XL', 'XXL'] },
      { name: 'Color', options: ['Minimalist Cream', 'Obsidian Slate', 'Consensus Gold'] }
    ],
    isDigital: false,
    status: 'active',
    views: 1800,
    salesCount: 15,
    averageRating: 4.7,
    reviewCount: 5,
    aiOptimized: true,
    boostedWithAds: true
  },
  {
    id: 'prod_tshirt',
    storeId: 'store_fashion_vibe',
    storeName: 'Couture de Pi',
    title: 'The Decentralized Tee (Luxury Bamboo Blend)',
    description: 'Incredibly breathable and soft summer tee, made from a 70% organic bamboo fiber and 30% cotton blend. Features the typographic text "Decentralized & Verified" in luxury micro-embroidery. Pre-shrunk and moisture-wicking.',
    pricePi: 35.0,
    category: 'fashion',
    imageUrls: [
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&h=400&q=80'
    ],
    stock: 80,
    createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['clothing', 'tshirt', 'luxury', 'bamboo'],
    attributes: [
      { name: 'Size', options: ['S', 'M', 'L', 'XL'] },
      { name: 'Color', options: ['Classic Black', 'Off-White', 'Olive Olive'] }
    ],
    isDigital: false,
    status: 'active',
    views: 920,
    salesCount: 11,
    averageRating: 4.5,
    reviewCount: 3,
    aiOptimized: false,
    boostedWithAds: false
  },

  // FOOD & DELIVERY PRODUCTS
  {
    id: 'prod_coffee_beans',
    storeId: 'store_decentral_cafe',
    storeName: 'Decentral Cafe & Bakery',
    title: 'Node-Fuel Premium Single-Origin Coffee Beans',
    description: '100% Arabica, hand-picked specialty coffee beans sourced sustainably from the volcanic valleys of Sidamo, Ethiopia. Roasted in micro-batches to a perfect medium level. Delivers elegant tasting notes of blueberries, sweet honey, and clean bergamot. Kept in multi-layer gas-valve zip-bags for maximum freshness.',
    pricePi: 12.0,
    category: 'food_delivery',
    imageUrls: [
      'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=600&h=400&q=80',
      'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=600&h=400&q=80'
    ],
    stock: 120,
    createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['coffee', 'organic', 'beverage', 'ethiopia'],
    attributes: [
      { name: 'Grind Selection', options: ['Whole Beans', 'Drip / Filter', 'Fine Espresso', 'French Press'] },
      { name: 'Package Size', options: ['250g bag', '500g gold bag (Save 10%)'] }
    ],
    isDigital: false,
    status: 'active',
    views: 840,
    salesCount: 45,
    averageRating: 4.9,
    reviewCount: 18,
    aiOptimized: true,
    boostedWithAds: false
  },

  // DIGITAL SERVICES
  {
    id: 'prod_blockchain_course',
    storeId: 'store_tech_hub',
    storeName: 'Pi Tech HQ',
    title: 'Mastering Smart Contracts & Web3 Security (Comprehensive E-Book)',
    description: 'A complete, detailed digital masterclass designed to take you from a junior developer to a senior blockchain security auditor. Covers decentralized state machines, gas optimization strategies, cryptography basics, real-world hacks (reentrancy, flash loans, signature malleability), and rigorous testing suites. Instant PDF and EPUB delivery upon Pi payment verification.',
    pricePi: 25.0,
    category: 'digital_services',
    imageUrls: [
      'https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=600&h=400&q=80'
    ],
    stock: 9999, // digital item
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['education', 'ebook', 'smart-contract', 'web3'],
    attributes: [],
    isDigital: true,
    downloadUrl: 'https://example.com/downloads/mastering-smart-contracts.pdf',
    status: 'active',
    views: 950,
    salesCount: 22,
    averageRating: 4.7,
    reviewCount: 3,
    aiOptimized: true,
    boostedWithAds: false
  }
];

const SEED_REVIEWS: Review[] = [
  {
    id: 'rev_1',
    productId: 'prod_keyboard',
    productTitle: 'CyberLite-88 Custom Mechanical Keyboard',
    storeId: 'store_tech_hub',
    buyerUid: 'user_buyer_1',
    buyerUsername: 'pi_pioneer_romeo',
    rating: 5,
    comment: 'Absolutely legendary mechanical keyboard! The Gateron Yellow switches are silky smooth. Custom keys look beautiful and high-end. Paid in Pi, transaction resolved in 10 seconds. Highly recommended store!',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    merchantResponse: 'Thank you Romeo! We lubricate the switches by hand to ensure the premium linear touch. Glad the Pi checkout was flawless.'
  },
  {
    id: 'rev_2',
    productId: 'prod_keyboard',
    productTitle: 'CyberLite-88 Custom Mechanical Keyboard',
    storeId: 'store_tech_hub',
    buyerUid: 'user_buyer_2',
    buyerUsername: 'crypto_juliet',
    rating: 4,
    comment: 'The build quality is rock solid. The typing acoustics are deep and thocky. Deducted one star because shipping took 5 days, but the support team kept me updated over Telegram.',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'rev_3',
    productId: 'prod_coffee_beans',
    productTitle: 'Node-Fuel Premium Single-Origin Coffee Beans',
    storeId: 'store_decentral_cafe',
    buyerUid: 'user_active_pioneer', // current user has purchased and reviewed!
    buyerUsername: 'pi_pioneer_88',
    rating: 5,
    comment: 'This is the absolute fuel I need. The blueberry and honey notes are incredibly vivid. Freshly roasted, arrived in vacuum-sealed gold packing. Will purchase again using Pi.',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    merchantResponse: 'Awesome Alex! We love roasting this Sidamo bean. Fuel your nodes, fuel consensus!'
  }
];

const SEED_ORDERS: Order[] = [
  {
    id: 'order_1',
    storeId: 'store_tech_hub',
    storeName: 'Pi Tech HQ',
    buyerUid: 'user_buyer_1',
    buyerUsername: 'pi_pioneer_romeo',
    items: [
      {
        productId: 'prod_keyboard',
        title: 'CyberLite-88 Custom Mechanical Keyboard',
        pricePi: 145.0,
        quantity: 1,
        imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=150&h=150&q=80',
        selectedAttributes: { 'Switch Type': 'Gateron Yellow (Linear)', 'Case Color': 'Cosmic Grey' }
      }
    ],
    totalPi: 145.0,
    status: OrderStatus.COMPLETED,
    shippingAddress: {
      fullName: 'Romeo Montague',
      streetAddress: 'Viale della Repubblica 12',
      city: 'Verona',
      state: 'Veneto',
      postalCode: '37121',
      country: 'Italy',
      phoneNumber: '+39 045 123 4567'
    },
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
    blockchainTxId: 'tx_pi_78463289190532252190874362151',
    isDigital: false
  },
  {
    id: 'order_2',
    storeId: 'store_decentral_cafe',
    storeName: 'Decentral Cafe & Bakery',
    buyerUid: 'user_active_pioneer',
    buyerUsername: 'pi_pioneer_88',
    items: [
      {
        productId: 'prod_coffee_beans',
        title: 'Node-Fuel Premium Coffee Beans',
        pricePi: 12.0,
        quantity: 2,
        imageUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=150&h=150&q=80',
        selectedAttributes: { 'Grind Selection': 'Whole Beans', 'Package Size': '250g bag' }
      }
    ],
    totalPi: 24.0,
    status: OrderStatus.COMPLETED,
    shippingAddress: {
      fullName: 'Alex Mercer',
      streetAddress: '128 Mission Street',
      city: 'San Francisco',
      state: 'California',
      postalCode: '94103',
      country: 'United States',
      phoneNumber: '+1 415 555 2671'
    },
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    blockchainTxId: 'tx_pi_21890382901243128910432290812',
    isDigital: false
  },
  {
    id: 'order_pending_1',
    storeId: 'store_tech_hub',
    storeName: 'Pi Tech HQ',
    buyerUid: 'user_active_pioneer',
    buyerUsername: 'pi_pioneer_88',
    items: [
      {
        productId: 'prod_charger',
        title: 'GaN 140W Multi-Port Ultra-Fast Charger',
        pricePi: 45.0,
        quantity: 1,
        imageUrl: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?auto=format&fit=crop&w=150&h=150&q=80',
        selectedAttributes: {}
      }
    ],
    totalPi: 45.0,
    status: OrderStatus.PREPARING,
    shippingAddress: {
      fullName: 'Alex Mercer',
      streetAddress: '128 Mission Street',
      city: 'San Francisco',
      state: 'California',
      postalCode: '94103',
      country: 'United States',
      phoneNumber: '+1 415 555 2671'
    },
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    blockchainTxId: 'tx_pi_8892102143124390018429382109',
    isDigital: false
  }
];

const SEED_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif_1',
    recipientUid: 'user_active_pioneer',
    title: 'Welcome to Pi Business Market!',
    message: 'Your account is active. Explore verified stores and pay securely using Pi cryptocurrency.',
    type: 'system_announcement',
    read: false,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'notif_2',
    recipientUid: 'user_active_pioneer',
    title: 'Order Completed successfully',
    message: 'Your order of Node-Fuel Premium Coffee Beans has been delivered. Leave a review to help the merchant!',
    type: 'order_shipped',
    read: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    linkTo: '/orders'
  }
];

const SEED_PIONEER_PROFILES: PioneerProfile[] = [
  {
    id: 'profile_electrician_1',
    ownerUid: 'pioneer_electrician',
    name: 'Johnathan Spark',
    businessName: 'Sparky Electrical Services',
    category: 'electrician',
    pageType: 'service',
    skills: ['Emergency Repair', 'Home rewiring', 'Circuit breakers', 'Smart switches', 'LED Installation'],
    description: 'Certified master electrician with 10+ years of experience. We handle full home electrical audits, panel upgrades, troubleshooting short-circuits, and smart light integrations. All services can be booked and settled instantly in Pi.',
    photoUrls: [
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&h=400&q=80',
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&h=400&q=80'
    ],
    videoUrls: [],
    serviceArea: 'San Francisco & Bay Area',
    address: '455 Mission St, San Francisco, CA',
    location: { addressText: 'Downtown San Francisco' },
    contactInfo: {
      email: 'john@sparkyelectrical.pi',
      phone: '+1 (415) 555-0199',
      whatsapp: '+14155550199',
      telegram: 'sparky_john_pi'
    },
    workingHours: '8:00 AM - 7:00 PM',
    rating: 4.9,
    reviewCount: 14,
    portfolio: [
      { id: 'port_1', title: 'Tesla Charger Installation', description: 'Installed a Gen 3 Tesla wall connector in a residential garage, upgrading the panel to 200A.', imageUrl: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=300&h=200&q=80' },
      { id: 'port_2', title: 'Complete Office Rewire', description: 'Reconfigured all conduits and power nodes for a local Web3 startup co-working space.', imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=300&h=200&q=80' }
    ],
    piPaymentSupported: true,
    piWalletAddress: 'GBAELECTRICAL9384819024318902534290124318902534290124',
    availabilityStatus: 'available',
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'profile_plumber_1',
    ownerUid: 'pioneer_plumber',
    name: 'Mario Rossi',
    businessName: 'Decentralized Plumbing Hub',
    category: 'plumber',
    pageType: 'service',
    skills: ['Clog Removal', 'Leak Detection', 'Water Heaters', 'Pipe Replacement', 'Emergency Plumbing'],
    description: 'Expert residential plumbing contractor. Specialty in high-accuracy water leak detection, thermal pipe audits, boiler replacements, and bathroom remodeling. Accepting Pi payments directly with 10% discount for validated Pioneers.',
    photoUrls: [
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&h=400&q=80'
    ],
    videoUrls: [],
    serviceArea: 'Oakland, Berkeley & Richmond',
    address: '1228 Broadway, Oakland, CA',
    location: { addressText: 'Oakland Center' },
    contactInfo: {
      email: 'mario@plumbinghub.pi',
      phone: '+1 (510) 555-3344',
      whatsapp: '+15105553344',
      telegram: 'mario_plumber_pi'
    },
    workingHours: '24/7 Emergency Service',
    rating: 4.8,
    reviewCount: 9,
    portfolio: [
      { id: 'port_pl_1', title: 'Tankless Boiler Swap', description: 'Swapped an outdated 50-gallon tank heater with an eco-friendly tankless system.', imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&h=200&q=80' }
    ],
    piPaymentSupported: true,
    piWalletAddress: 'GBAPLUMBER48293819024318902534290124318902534290124',
    availabilityStatus: 'available',
    createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'profile_tutor_1',
    ownerUid: 'pioneer_tutor',
    name: 'Dr. Evelyn Carter',
    businessName: 'Web3 Academics',
    category: 'teacher_tutor',
    pageType: 'professional',
    skills: ['College Mathematics', 'Web3 & Cryptography', 'Python Programming', 'Algorithms', 'SAT Prep'],
    description: 'Ph.D. in Computer Science offering highly structured one-on-one virtual tutor consultations. Focused on preparing students for advanced calculus, cryptography concepts, data structures, and tech interviews. Interactive online whiteboard and recording included.',
    photoUrls: [
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&h=400&q=80'
    ],
    videoUrls: [],
    serviceArea: 'Global Online (Zoom / Meet)',
    address: 'Virtual Service',
    location: { addressText: 'Remote Virtual Whiteboard' },
    contactInfo: {
      email: 'evelyn@web3academics.com',
      phone: '+1 (800) 555-9011'
    },
    workingHours: '4:00 PM - 10:00 PM EST',
    rating: 5.0,
    reviewCount: 18,
    portfolio: [
      { id: 'port_ed_1', title: 'Syllabus Development', description: 'Created an open-source introduction to cryptographic math used by 1,000+ pioneers.' }
    ],
    piPaymentSupported: true,
    piWalletAddress: 'GBATECHHUB91283819024318902534290124318902534290124',
    availabilityStatus: 'available',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'profile_freelancer_1',
    ownerUid: 'pioneer_freelancer',
    name: 'Alex Rivera',
    businessName: 'Rivera DecentLabs',
    category: 'freelancer',
    pageType: 'professional',
    skills: ['Fullstack React', 'Node.js Express', 'Solidity Smart Contracts', 'Firebase Integration', 'Tailwind CSS'],
    description: 'Senior Fullstack developer specialized in custom-tailored dApps, high-performance responsive web user interfaces, and modular REST APIs. Fast turnarounds, clean modular code, and comprehensive unit tests.',
    photoUrls: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&h=400&q=80'
    ],
    videoUrls: [],
    serviceArea: 'Global Remote',
    address: 'Remote',
    location: { addressText: 'Global Remote' },
    contactInfo: {
      email: 'alex@decentlabs.io',
      phone: '+1 (305) 555-8822',
      telegram: 'alex_decentlabs'
    },
    workingHours: 'Flexible Hours',
    rating: 4.9,
    reviewCount: 22,
    portfolio: [
      { id: 'port_fl_1', title: 'P2P Storefront Engine', description: 'Designed a fully functional LocalStorage-based dApp prototype matching merchant ledger coordinates.', imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=300&h=200&q=80' }
    ],
    piPaymentSupported: true,
    piWalletAddress: 'GBAFREELANCER11923819024318902534290124318902534290124',
    availabilityStatus: 'available',
    createdAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'profile_jobprovider_1',
    ownerUid: 'pioneer_jobprovider',
    name: 'Pi Global Ventures',
    businessName: 'Pi Global Ventures LLC',
    category: 'job_provider',
    pageType: 'business',
    skills: ['Venture Capital', 'Incubation', 'Consensus Infrastructure', 'Strategic Partnerships'],
    description: 'An international venture group backing next-generation utilities for the Pi Network ecosystem. We offer structural funding, advisory circles, and connect talent with promising global Pi startups.',
    photoUrls: [
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&h=400&q=80'
    ],
    videoUrls: [],
    serviceArea: 'Global Corporate / Hybrid',
    address: '100 Pine Street, San Francisco, CA',
    location: { addressText: 'Financial District' },
    contactInfo: {
      email: 'careers@piglobalventures.pi',
      phone: '+1 (415) 555-9000',
      telegram: 'pi_global_ventures'
    },
    workingHours: '9:00 AM - 5:00 PM EST',
    rating: 4.7,
    reviewCount: 3,
    portfolio: [],
    piPaymentSupported: true,
    piWalletAddress: 'GBAJOBPROVIDER88293819024318902534290124318902534290124',
    availabilityStatus: 'available',
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const SEED_JOBS: Job[] = [
  {
    id: 'job_1',
    providerUid: 'pioneer_jobprovider',
    providerProfileId: 'profile_jobprovider_1',
    providerName: 'Pi Global Ventures',
    title: 'Senior Pi SDK Integration Architect',
    description: 'We are seeking an expert Frontend Engineer to architect security patterns, lazy SDK initialization guards, and server-side payment validation gateways for our portfolio dApps. You will lead a small remote team of three engineers and coordinate with our security audit partners.',
    requirements: [
      '3+ years of experience with React (Vite) and TypeScript.',
      'Proven expertise integrating non-custodial Web3 wallets and handling complex asynchronous callbacks.',
      'Familiarity with serverless microservice proxies to hide private API keys.',
      'Good written communication skills.'
    ],
    salaryPi: 85.0,
    salaryType: 'hourly',
    locationType: 'remote',
    location: 'Global Remote',
    category: 'Technology & Development',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'open',
    applicantCount: 2
  },
  {
    id: 'job_2',
    providerUid: 'pioneer_jobprovider',
    providerProfileId: 'profile_jobprovider_1',
    providerName: 'Pi Global Ventures',
    title: 'Web3 Content Writer & Community Manager',
    description: 'Looking for a passionate writer who understands the Pi Network consensus model and can create high-quality, engaging content (articles, tutorials, social threads, infographics) to explain decentralized commerce utilities to mainstream Pioneers.',
    requirements: [
      'Strong writing portfolio explaining complex technology simply.',
      'Active Twitter/X or Telegram channel in the crypto space.',
      'Fluency in English.'
    ],
    salaryPi: 800.0,
    salaryType: 'fixed',
    locationType: 'remote',
    location: 'Remote (Anywhere)',
    category: 'Marketing & Writing',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'open',
    applicantCount: 1
  }
];

const SEED_JOB_APPLICATIONS: JobApplication[] = [
  {
    id: 'app_1',
    jobId: 'job_1',
    jobTitle: 'Senior Pi SDK Integration Architect',
    providerUid: 'pioneer_jobprovider',
    applicantUid: 'user_active_pioneer',
    applicantUsername: 'pi_pioneer_88',
    applicantName: 'Alex Mercer',
    coverLetter: 'Hello! I have been building full-stack applications with React, Vite, and Node.js for over four years. I have extensive experience setting up secure APIs and local state engines. I also run a private Pi Network validator node and would love to contribute to your portfolio of dApps.',
    piWalletAddress: 'GBCWD32QYJ7LURP5H6V77JHYX345PPONNFFVVZZ44SSTT22XXYYZZ',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending'
  }
];

const SEED_UNIFIED_LISTINGS: UnifiedListing[] = [
  {
    id: 'listing_phys_1',
    profileId: 'profile_electronics_1',
    ownerUid: 'merchant_tech_owner',
    ownerName: 'Satoshi Gadgets',
    type: 'physical',
    title: 'Model-X Custom mechanical keyboard',
    description: 'Bespoke hand-soldered mechanical keyboard featuring Gateron Brown silent tactile switches, double-shot PBT keycaps, and a weight-tuned anodized aluminum case. Includes a premium braided USB-C cable. Fully backed by local service.',
    pricePi: 45,
    status: 'published',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['keyboard', 'electronics', 'custom', 'setup'],
    imageUrls: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&h=400&q=80'],
    rating: 4.9,
    reviewCount: 18,
    location: {
      lat: 37.7749,
      lng: -122.4194,
      addressText: '100 Pine St, San Francisco, CA 94111',
      city: 'San Francisco',
      district: 'Financial District',
      state: 'California',
      country: 'United States',
      pinCode: '94111',
      geoHash: '9q8yyzh81'
    },
    productDetails: {
      stock: 8,
      isDigital: false,
      category: 'electronics'
    }
  },
  {
    id: 'listing_digi_1',
    profileId: 'profile_freelancer_1',
    ownerUid: 'pioneer_freelancer',
    ownerName: 'Alex Rivera',
    type: 'digital',
    title: 'The Ultimate Web3 Pioneer Blueprint',
    description: 'Comprehensive video masterclass and handbook outlining core strategies to build decentralised applications, secure smart contracts, integrate Pi Platform APIs, and launch high-conversion P2P commerce storefronts.',
    pricePi: 5,
    status: 'published',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['ebook', 'education', 'development', 'programming'],
    imageUrls: ['https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&h=400&q=80'],
    rating: 4.8,
    reviewCount: 32,
    location: {
      lat: 37.7891,
      lng: -122.4014,
      addressText: 'Market Street, San Francisco, CA 94103',
      city: 'San Francisco',
      district: 'SOMA',
      state: 'California',
      country: 'United States',
      pinCode: '94103',
      geoHash: '9q8yyzh82'
    },
    productDetails: {
      stock: 999,
      isDigital: true,
      downloadUrl: 'https://pitechhq.io/blueprint-download',
      category: 'digital_services'
    }
  },
  {
    id: 'listing_serv_1',
    profileId: 'profile_electrician_1',
    ownerUid: 'pioneer_electrician',
    ownerName: 'Johnathan Spark',
    type: 'service',
    title: 'Smart Home IoT Installation & Wiring',
    description: 'Professional smart switches, relays, security alarms, smart thermostats, and intelligent lighting installation and electrical wiring configuration. Fully compliant with modern code. Fast response and 3-month warranty.',
    pricePi: 12,
    status: 'published',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['electrician', 'service', 'wiring', 'smarthome'],
    imageUrls: ['https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&h=400&q=80'],
    rating: 4.9,
    reviewCount: 14,
    location: {
      lat: 37.7651,
      lng: -122.4418,
      addressText: 'Castro District, San Francisco, CA 94114',
      city: 'San Francisco',
      district: 'Castro',
      state: 'California',
      country: 'United States',
      pinCode: '94114',
      geoHash: '9q8yyzh83'
    },
    serviceDetails: {
      durationMinutes: 90,
      coverageRadiusKm: 15,
      availabilitySchedule: 'Mon-Sat (9 AM - 6 PM)'
    }
  },
  {
    id: 'listing_serv_2',
    profileId: 'profile_plumber_1',
    ownerUid: 'pioneer_plumber',
    ownerName: 'Mario Rossi',
    type: 'service',
    title: 'Emergency Leak repair & Pipe Fitting',
    description: 'Rapid resolution of structural water leaks, burst pipes, high-pressure line blockages, tap rebuilds, kitchen drainage overhaul, and sewer repairs. Over 15 years of master plumbing experience.',
    pricePi: 15,
    status: 'published',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['plumbing', 'emergency', 'service', 'leak'],
    imageUrls: ['https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=600&h=400&q=80'],
    rating: 4.8,
    reviewCount: 9,
    location: {
      lat: 37.7512,
      lng: -122.4140,
      addressText: 'Mission District, San Francisco, CA 94110',
      city: 'San Francisco',
      district: 'Mission',
      state: 'California',
      country: 'United States',
      pinCode: '94110',
      geoHash: '9q8yyzh84'
    },
    serviceDetails: {
      durationMinutes: 60,
      coverageRadiusKm: 10,
      availabilitySchedule: '24/7 Emergency Support'
    }
  },
  {
    id: 'listing_job_1',
    profileId: 'profile_jobprovider_1',
    ownerUid: 'pioneer_jobprovider',
    ownerName: 'Pi Global Ventures',
    type: 'job',
    title: 'Senior Mobile Application Lead Engineer',
    description: 'We are recruiting a Lead Software Engineer to direct architectural design and product execution of our multi-chain Web3 native commerce system. Strong background in React Native, Solidity, and decentralized identity is essential.',
    pricePi: 850,
    status: 'published',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['reactnative', 'developer', 'lead', 'web3', 'solidity'],
    imageUrls: ['https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=600&h=400&q=80'],
    location: {
      lat: 37.7749,
      lng: -122.4194,
      addressText: 'Financial District, San Francisco, CA 94104',
      city: 'San Francisco',
      district: 'Financial District',
      state: 'California',
      country: 'United States',
      pinCode: '94104',
      geoHash: '9q8yyzh85'
    },
    jobDetails: {
      salaryType: 'monthly',
      locationType: 'hybrid',
      requirements: ['7+ years mobile development', 'React Native expertise', 'Prior security audits background', 'Excellent leadership skills']
    }
  }
];

// ==========================================
// SERVICE IMPLEMENTATION
// ==========================================

export class PiBusinessMarketDB {
  static init() {
    if (!localStorage.getItem(KEYS.USERS)) {
      localStorage.setItem(KEYS.USERS, JSON.stringify(SEED_USERS));
    }
    if (!localStorage.getItem(KEYS.STORES)) {
      localStorage.setItem(KEYS.STORES, JSON.stringify(SEED_STORES));
    }
    if (!localStorage.getItem(KEYS.PRODUCTS)) {
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(SEED_PRODUCTS));
    }
    if (!localStorage.getItem(KEYS.ORDERS)) {
      localStorage.setItem(KEYS.ORDERS, JSON.stringify(SEED_ORDERS));
    }
    if (!localStorage.getItem(KEYS.REVIEWS)) {
      localStorage.setItem(KEYS.REVIEWS, JSON.stringify(SEED_REVIEWS));
    }
    if (!localStorage.getItem(KEYS.NOTIFICATIONS)) {
      localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(SEED_NOTIFICATIONS));
    }
    if (!localStorage.getItem(KEYS.PIONEER_PROFILES)) {
      localStorage.setItem(KEYS.PIONEER_PROFILES, JSON.stringify(SEED_PIONEER_PROFILES));
    }
    if (!localStorage.getItem(KEYS.JOBS)) {
      localStorage.setItem(KEYS.JOBS, JSON.stringify(SEED_JOBS));
    }
    if (!localStorage.getItem(KEYS.JOB_APPLICATIONS)) {
      localStorage.setItem(KEYS.JOB_APPLICATIONS, JSON.stringify(SEED_JOB_APPLICATIONS));
    }
    if (!localStorage.getItem(KEYS.UNIFIED_LISTINGS)) {
      localStorage.setItem(KEYS.UNIFIED_LISTINGS, JSON.stringify(SEED_UNIFIED_LISTINGS));
    }
    if (!localStorage.getItem(KEYS.CURRENT_USER)) {
      localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(DEFAULT_CURRENT_USER));
    }
  }

  // ==========================================
  // GENERAL HELPER METHDOS
  // ==========================================

  private static get<T>(key: string): T[] {
    this.init();
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private static save<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // ==========================================
  // USER METHDOS
  // ==========================================

  static getCurrentUser(): User {
    this.init();
    const userStr = localStorage.getItem(KEYS.CURRENT_USER);
    return userStr ? JSON.parse(userStr) : DEFAULT_CURRENT_USER;
  }

  static saveCurrentUser(user: User): void {
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
    // sync in general users array
    const users = this.get<User>(KEYS.USERS);
    const index = users.findIndex(u => u.uid === user.uid);
    if (index !== -1) {
      users[index] = user;
    } else {
      users.push(user);
    }
    this.save(KEYS.USERS, users);
  }

  static getUsers(): User[] {
    return this.get<User>(KEYS.USERS);
  }

  // ==========================================
  // STORE METHDOS
  // ==========================================

  static getStores(): Store[] {
    return this.get<Store>(KEYS.STORES);
  }

  static getStoreById(id: string): Store | undefined {
    return this.getStores().find(s => s.id === id);
  }

  static getStoreByOwner(ownerUid: string): Store | undefined {
    return this.getStores().find(s => s.ownerUid === ownerUid);
  }

  static createStore(store: Omit<Store, 'id' | 'createdAt' | 'rating' | 'reviewCount' | 'analytics' | 'verified' | 'featured'>): Store {
    const stores = this.getStores();
    const newStore: Store = {
      ...store,
      id: `store_${Math.random().toString(36).substring(2, 11)}`,
      createdAt: new Date().toISOString(),
      verified: true, // Auto-verified for this sandbox environment
      rating: 5.0,
      reviewCount: 0,
      featured: false,
      analytics: {
        totalRevenuePi: 0,
        views: 1,
        ordersCount: 0,
        conversionRate: 0,
        salesHistory: []
      }
    };

    stores.push(newStore);
    this.save(KEYS.STORES, stores);

    // Update user status
    const currentUser = this.getCurrentUser();
    currentUser.isMerchant = true;
    currentUser.storeId = newStore.id;
    if (!currentUser.roles.includes('merchant')) {
      currentUser.roles.push('merchant');
    }
    this.saveCurrentUser(currentUser);

    // Send notification
    this.createNotification(
      currentUser.uid,
      'Store Launched!',
      `Congratulations! Your storefront "${newStore.name}" is now live on the Pi Business Market network.`,
      'system_announcement'
    );

    return newStore;
  }

  static updateStore(storeId: string, updates: Partial<Store>): Store {
    const stores = this.getStores();
    const index = stores.findIndex(s => s.id === storeId);
    if (index === -1) throw new Error('Store not found');

    const updated = { ...stores[index], ...updates };
    stores[index] = updated;
    this.save(KEYS.STORES, stores);
    return updated;
  }

  // ==========================================
  // PRODUCT METHDOS
  // ==========================================

  static getProducts(): Product[] {
    return this.get<Product>(KEYS.PRODUCTS);
  }

  static getProductById(id: string): Product | undefined {
    return this.getProducts().find(p => p.id === id);
  }

  static getProductsByStore(storeId: string): Product[] {
    return this.getProducts().filter(p => p.storeId === storeId);
  }

  static createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'salesCount' | 'averageRating' | 'reviewCount'>): Product {
    const products = this.getProducts();
    const newProduct: Product = {
      ...product,
      id: `prod_${Math.random().toString(36).substring(2, 11)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      views: 1,
      salesCount: 0,
      averageRating: 5.0,
      reviewCount: 0
    };

    products.push(newProduct);
    this.save(KEYS.PRODUCTS, products);

    // update store total products views counts if needed
    return newProduct;
  }

  static updateProduct(productId: string, updates: Partial<Product>): Product {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === productId);
    if (index === -1) throw new Error('Product not found');

    const updated: Product = {
      ...products[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    products[index] = updated;
    this.save(KEYS.PRODUCTS, products);
    return updated;
  }

  static deleteProduct(productId: string): void {
    const products = this.getProducts();
    const filtered = products.filter(p => p.id !== productId);
    this.save(KEYS.PRODUCTS, filtered);
  }

  static incrementProductViews(productId: string): void {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === productId);
    if (index !== -1) {
      products[index].views += 1;
      this.save(KEYS.PRODUCTS, products);
    }
  }

  // ==========================================
  // ORDER METHDOS
  // ==========================================

  static getOrders(): Order[] {
    return this.get<Order>(KEYS.ORDERS);
  }

  static getOrdersByBuyer(buyerUid: string): Order[] {
    return this.getOrders().filter(o => o.buyerUid === buyerUid);
  }

  static getOrdersByStore(storeId: string): Order[] {
    return this.getOrders().filter(o => o.storeId === storeId);
  }

  static getOrderById(id: string): Order | undefined {
    return this.getOrders().find(o => o.id === id);
  }

  static createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Order {
    const orders = this.getOrders();
    const newOrder: Order = {
      ...orderData,
      id: `order_${Math.random().toString(36).substring(2, 11)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    orders.push(newOrder);
    this.save(KEYS.ORDERS, orders);

    // Adjust product stock & increments salesCount
    const products = this.getProducts();
    newOrder.items.forEach(item => {
      const idx = products.findIndex(p => p.id === item.productId);
      if (idx !== -1) {
        products[idx].stock = Math.max(0, products[idx].stock - item.quantity);
        products[idx].salesCount += item.quantity;
      }
    });
    this.save(KEYS.PRODUCTS, products);

    // Update store analytics & balance
    const store = this.getStoreById(newOrder.storeId);
    if (store) {
      const currentSalesToday = store.analytics.salesHistory[store.analytics.salesHistory.length - 1];
      if (currentSalesToday) {
        currentSalesToday.amount += newOrder.totalPi;
        currentSalesToday.orders += 1;
      }
      store.analytics.totalRevenuePi += newOrder.totalPi;
      store.analytics.ordersCount += 1;
      this.updateStore(store.id, { analytics: store.analytics });

      // Notify Store Owner
      const storeOwner = this.getUsers().find(u => u.storeId === store.id);
      if (storeOwner) {
        this.createNotification(
          storeOwner.uid,
          'New Order Received! 🛍️',
          `An order of ${newOrder.totalPi} Pi has been placed for your store "${store.name}". Status: Preparing.`,
          'order_placed',
          `/merchant/orders`
        );
      }
    }

    // Notify Buyer
    this.createNotification(
      newOrder.buyerUid,
      'Order Placed Successfully! 🎉',
      `Your payment of ${newOrder.totalPi} Pi has been verified on the blockchain. Merchant "${newOrder.storeName}" is preparing your items.`,
      'payment_received',
      '/orders'
    );

    return newOrder;
  }

  static updateOrderStatus(orderId: string, status: OrderStatus): Order {
    const orders = this.getOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index === -1) throw new Error('Order not found');

    const updated = {
      ...orders[index],
      status,
      updatedAt: new Date().toISOString()
    };
    orders[index] = updated;
    this.save(KEYS.ORDERS, orders);

    // Send status notification to buyer
    let statusEmoji = '📦';
    let statusDesc = 'is being prepared';
    if (status === OrderStatus.SHIPPED) {
      statusEmoji = '🚚';
      statusDesc = 'has been shipped! Tracking numbers updated';
    } else if (status === OrderStatus.DELIVERED) {
      statusEmoji = '🏡';
      statusDesc = 'has been marked as Delivered';
    } else if (status === OrderStatus.COMPLETED) {
      statusEmoji = '✅';
      statusDesc = 'is fully completed. Thank you!';
    } else if (status === OrderStatus.CANCELLED) {
      statusEmoji = '❌';
      statusDesc = 'has been cancelled. Pi coins refunded';
    }

    this.createNotification(
      updated.buyerUid,
      `Order Status Update ${statusEmoji}`,
      `Your order from "${updated.storeName}" ${statusDesc}.`,
      status === OrderStatus.SHIPPED ? 'order_shipped' : 'system_announcement',
      '/orders'
    );

    return updated;
  }

  // ==========================================
  // REVIEW METHDOS
  // ==========================================

  static getReviews(): Review[] {
    return this.get<Review>(KEYS.REVIEWS);
  }

  static getReviewsByProduct(productId: string): Review[] {
    return this.getReviews().filter(r => r.productId === productId);
  }

  static getReviewsByStore(storeId: string): Review[] {
    return this.getReviews().filter(r => r.storeId === storeId);
  }

  static createReview(reviewData: Omit<Review, 'id' | 'createdAt'>): Review {
    const reviews = this.getReviews();
    const newReview: Review = {
      ...reviewData,
      id: `rev_${Math.random().toString(36).substring(2, 11)}`,
      createdAt: new Date().toISOString()
    };

    reviews.push(newReview);
    this.save(KEYS.REVIEWS, reviews);

    // Recompute product ratings
    const prodReviews = reviews.filter(r => r.productId === newReview.productId);
    const avgProductRating = prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length;
    this.updateProduct(newReview.productId, {
      averageRating: parseFloat(avgProductRating.toFixed(1)),
      reviewCount: prodReviews.length
    });

    // Recompute store ratings
    const storeReviews = reviews.filter(r => r.storeId === newReview.storeId);
    const avgStoreRating = storeReviews.reduce((sum, r) => sum + r.rating, 0) / storeReviews.length;
    this.updateStore(newReview.storeId, {
      rating: parseFloat(avgStoreRating.toFixed(1)),
      reviewCount: storeReviews.length
    });

    // Notify Store Owner
    const store = this.getStoreById(newReview.storeId);
    if (store) {
      const storeOwner = this.getUsers().find(u => u.storeId === store.id);
      if (storeOwner) {
        this.createNotification(
          storeOwner.uid,
          'New Review Received ⭐',
          `A customer reviewed your product "${newReview.productTitle}" with a ${newReview.rating} star rating.`,
          'new_review',
          '/merchant/reviews'
        );
      }
    }

    return newReview;
  }

  static replyToReview(reviewId: string, responseText: string): Review {
    const reviews = this.getReviews();
    const index = reviews.findIndex(r => r.id === reviewId);
    if (index === -1) throw new Error('Review not found');

    reviews[index].merchantResponse = responseText;
    this.save(KEYS.REVIEWS, reviews);

    // Notify Buyer
    this.createNotification(
      reviews[index].buyerUid,
      'Merchant Replied to Your Review 💬',
      `The owner of "${reviews[index].productTitle}" has responded to your review comments.`,
      'system_announcement',
      '/orders'
    );

    return reviews[index];
  }

  // ==========================================
  // NOTIFICATION METHDOS
  // ==========================================

  static getNotifications(recipientUid: string): Notification[] {
    return this.get<Notification>(KEYS.NOTIFICATIONS)
      .filter(n => n.recipientUid === recipientUid)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static createNotification(
    recipientUid: string,
    title: string,
    message: string,
    type: Notification['type'],
    linkTo?: string
  ): Notification {
    const notifications = this.get<Notification>(KEYS.NOTIFICATIONS);
    const newNotif: Notification = {
      id: `notif_${Math.random().toString(36).substring(2, 11)}`,
      recipientUid,
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString(),
      linkTo
    };

    notifications.push(newNotif);
    this.save(KEYS.NOTIFICATIONS, notifications);
    return newNotif;
  }

  static markNotificationAsRead(notifId: string): void {
    const notifications = this.get<Notification>(KEYS.NOTIFICATIONS);
    const index = notifications.findIndex(n => n.id === notifId);
    if (index !== -1) {
      notifications[index].read = true;
      this.save(KEYS.NOTIFICATIONS, notifications);
    }
  }

  static markAllNotificationsAsRead(recipientUid: string): void {
    const notifications = this.get<Notification>(KEYS.NOTIFICATIONS);
    notifications.forEach(n => {
      if (n.recipientUid === recipientUid) {
        n.read = true;
      }
    });
    this.save(KEYS.NOTIFICATIONS, notifications);
  }

  // ==========================================
  // PIONEER PROFILE METHODS
  // ==========================================

  static getPioneerProfiles(): PioneerProfile[] {
    return this.get<PioneerProfile>(KEYS.PIONEER_PROFILES);
  }

  static getPioneerProfileById(id: string): PioneerProfile | undefined {
    return this.getPioneerProfiles().find(p => p.id === id);
  }

  static getPioneerProfileByOwner(ownerUid: string): PioneerProfile | undefined {
    return this.getPioneerProfiles().find(p => p.ownerUid === ownerUid);
  }

  static getPioneerProfilesByOwner(ownerUid: string): PioneerProfile[] {
    return this.getPioneerProfiles().filter(p => p.ownerUid === ownerUid && !p.softDeleted);
  }

  // Simple geohash simulator mapping coordinates to unique 9-char hashes
  static encodeGeohash(lat: number, lng: number): string {
    const chars = "0123456789bcdefghjkmnpqrstuvwxyz";
    let hash = "";
    const seed = Math.abs((lat || 0) * 100000 + (lng || 0) * 100000);
    for (let i = 0; i < 9; i++) {
      const idx = Math.floor((seed * (i + 1) * 17) % chars.length);
      hash += chars[idx];
    }
    return hash;
  }

  static calculateDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  static calculateProfileTrustScore(profile: Partial<PioneerProfile>): { score: number, metrics: TrustMetrics } {
    const completedOrders = Math.floor(Math.random() * 20) + 12;
    const completedServices = Math.floor(Math.random() * 15) + 6;
    const completedJobs = Math.floor(Math.random() * 5) + 2;
    const successfulDeliveries = completedOrders + Math.floor(Math.random() * 3);
    const avgRating = profile.rating || 4.8;
    const reviewQualityScore = Math.floor(avgRating * 20);
    const responseTimeMinutes = Math.floor(Math.random() * 35) + 8;
    const cancellationRate = parseFloat((Math.random() * 2).toFixed(1));
    const accountAgeDays = 45;
    const platformViolations = 0;
    const disputeHistoryCount = 0;
    const customerSatisfactionRate = Math.floor(96 + Math.random() * 4);

    let score = 650; // Base score for sandbox setup
    score += (avgRating - 3.0) * 100;
    
    const levels: Record<VerificationLevel, number> = {
      basic: 10,
      email_verified: 30,
      phone_verified: 50,
      pi_verified: 100,
      kyc_verified: 150,
      business_verified: 200,
      professional_verified: 200,
      official_partner: 245,
      government_verified: 250
    };
    const levelBonus = levels[profile.verificationLevel || 'pi_verified'] || 10;
    score += levelBonus;

    const completions = completedOrders + completedServices + completedJobs;
    score += Math.min(completions * 4, 150);
    score -= cancellationRate * 20;
    score -= Math.max(0, (responseTimeMinutes - 15) * 0.4);

    score = Math.max(100, Math.min(1000, Math.round(score)));

    const metrics: TrustMetrics = {
      completedOrders,
      completedServices,
      completedJobs,
      successfulDeliveries,
      avgRating,
      reviewQualityScore,
      responseTimeMinutes,
      cancellationRate,
      accountAgeDays,
      platformViolations,
      disputeHistoryCount,
      customerSatisfactionRate
    };

    return { score, metrics };
  }

  static createPioneerProfile(profileData: Omit<PioneerProfile, 'id' | 'createdAt' | 'rating' | 'reviewCount' | 'portfolio'> & { id?: string; portfolio?: PioneerProfile['portfolio'] }): PioneerProfile {
    const profiles = this.getPioneerProfiles();
    
    let existingIndex = -1;
    if (profileData.id) {
      existingIndex = profiles.findIndex(p => p.id === profileData.id);
    } else {
      existingIndex = profiles.findIndex(p => p.ownerUid === profileData.ownerUid && p.pageType === profileData.pageType);
    }
    
    const existing = existingIndex !== -1 ? profiles[existingIndex] : null;
    const currentVersion = (existing?.version || 0) + 1;
    const verificationLevel: VerificationLevel = profileData.verificationLevel || existing?.verificationLevel || 'pi_verified';

    const lat = profileData.location?.lat || 37.7749 + (Math.random() - 0.5) * 0.1;
    const lng = profileData.location?.lng || -122.4194 + (Math.random() - 0.5) * 0.1;
    const geoHash = this.encodeGeohash(lat, lng);

    const completeLocation = {
      ...profileData.location,
      lat,
      lng,
      geoHash,
      city: profileData.location?.city || 'San Francisco',
      district: profileData.location?.district || 'Financial District',
      state: profileData.location?.state || 'California',
      country: profileData.location?.country || 'United States',
      pinCode: profileData.location?.pinCode || '94104'
    };

    const nextProfile: PioneerProfile = {
      ...profileData,
      id: profileData.id || (existing?.id || `profile_${Math.random().toString(36).substring(2, 11)}`),
      rating: existing?.rating || 4.8,
      reviewCount: existing?.reviewCount || 12,
      portfolio: profileData.portfolio || existing?.portfolio || [],
      createdAt: existing?.createdAt || new Date().toISOString(),
      verificationLevel,
      verificationBadge: true,
      location: completeLocation,
      version: currentVersion,
      versionHistory: existing?.versionHistory || [],
      softDeleted: false,
      unifiedAnalytics: existing?.unifiedAnalytics || {
        profileViews: 142,
        productViews: 85,
        serviceViews: 64,
        jobViews: 41,
        searchQueriesCount: 202,
        clicksCount: 94,
        ordersCount: 12,
        bookingsCount: 8,
        applicationsCount: 4,
        qrScansCount: 23,
        piPaymentsCount: 14,
        followersCount: 18,
        conversionRate: 8.4,
        customerRetention: 85,
        revenuePi: 382.5
      }
    };

    // Calculate trust metrics dynamically
    const trust = this.calculateProfileTrustScore(nextProfile);
    nextProfile.trustScore = trust.score;
    nextProfile.trustMetrics = trust.metrics;

    // Save version history snapshot
    const historyItem: ProfileVersion = {
      version: currentVersion,
      updatedAt: new Date().toISOString(),
      updatedBy: profileData.name,
      changeSummary: existing ? `Profile version updated to ${currentVersion}` : 'Initial profile deployment',
      snapshot: JSON.stringify({
        name: nextProfile.name,
        description: nextProfile.description,
        skills: nextProfile.skills,
        location: nextProfile.location,
        contactInfo: nextProfile.contactInfo,
        workingHours: nextProfile.workingHours,
        piWalletAddress: nextProfile.piWalletAddress,
        verificationLevel: nextProfile.verificationLevel,
        trustScore: nextProfile.trustScore
      })
    };
    nextProfile.versionHistory = [...(nextProfile.versionHistory || []), historyItem];

    if (existingIndex !== -1) {
      profiles[existingIndex] = nextProfile;
    } else {
      profiles.push(nextProfile);
    }

    this.save(KEYS.PIONEER_PROFILES, profiles);

    // Update user link
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.uid === profileData.ownerUid);
    if (userIndex !== -1) {
      users[userIndex].profileId = nextProfile.id;
      if (!users[userIndex].roles.includes('pioneer_provider')) {
        users[userIndex].roles.push('pioneer_provider');
      }
      this.save(KEYS.USERS, users);
      
      const curr = this.getCurrentUser();
      if (curr && curr.uid === profileData.ownerUid) {
        localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify({
          ...curr,
          profileId: nextProfile.id,
          roles: Array.from(new Set([...curr.roles, 'pioneer_provider']))
        }));
      }
    }

    return nextProfile;
  }

  static updatePioneerProfile(id: string, updates: Partial<PioneerProfile>): PioneerProfile {
    const profiles = this.getPioneerProfiles();
    const index = profiles.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Profile not found');

    const existing = profiles[index];
    const currentVersion = (existing.version || 1) + 1;

    // Prepare complete profile location parameters if geo lat/lng updated
    let completeLocation = existing.location;
    if (updates.location) {
      const lat = updates.location.lat || existing.location.lat || 37.7749;
      const lng = updates.location.lng || existing.location.lng || -122.4194;
      completeLocation = {
        ...existing.location,
        ...updates.location,
        lat,
        lng,
        geoHash: this.encodeGeohash(lat, lng)
      };
    }

    const updatedProfile: PioneerProfile = {
      ...existing,
      ...updates,
      location: completeLocation,
      version: currentVersion
    };

    // Recalculate trust score
    const trust = this.calculateProfileTrustScore(updatedProfile);
    updatedProfile.trustScore = trust.score;
    updatedProfile.trustMetrics = trust.metrics;

    // Append version log snapshot
    const historyItem: ProfileVersion = {
      version: currentVersion,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedProfile.name,
      changeSummary: updates.description ? 'Biography details and settings configured' : `Metadata settings version ${currentVersion}`,
      snapshot: JSON.stringify({
        name: updatedProfile.name,
        description: updatedProfile.description,
        skills: updatedProfile.skills,
        location: updatedProfile.location,
        contactInfo: updatedProfile.contactInfo,
        workingHours: updatedProfile.workingHours,
        piWalletAddress: updatedProfile.piWalletAddress,
        verificationLevel: updatedProfile.verificationLevel,
        trustScore: updatedProfile.trustScore
      })
    };
    updatedProfile.versionHistory = [...(existing.versionHistory || []), historyItem];

    profiles[index] = updatedProfile;
    this.save(KEYS.PIONEER_PROFILES, profiles);
    return updatedProfile;
  }

  static rollbackProfileVersion(profileId: string, targetVersion: number): PioneerProfile {
    const profiles = this.getPioneerProfiles();
    const index = profiles.findIndex(p => p.id === profileId);
    if (index === -1) throw new Error('Profile not found');

    const profile = profiles[index];
    const targetHistory = profile.versionHistory?.find(h => h.version === targetVersion);
    if (!targetHistory) throw new Error(`Version history item ${targetVersion} not found`);

    const parsedSnapshot = JSON.parse(targetHistory.snapshot);

    const rolledBackProfile: PioneerProfile = {
      ...profile,
      name: parsedSnapshot.name,
      description: parsedSnapshot.description,
      skills: parsedSnapshot.skills,
      location: {
        ...profile.location,
        ...parsedSnapshot.location
      },
      contactInfo: {
        ...profile.contactInfo,
        ...parsedSnapshot.contactInfo
      },
      workingHours: parsedSnapshot.workingHours,
      piWalletAddress: parsedSnapshot.piWalletAddress,
      verificationLevel: parsedSnapshot.verificationLevel || profile.verificationLevel,
      trustScore: parsedSnapshot.trustScore || profile.trustScore,
      version: targetVersion
    };

    profiles[index] = rolledBackProfile;
    this.save(KEYS.PIONEER_PROFILES, profiles);
    return rolledBackProfile;
  }

  static softDeletePioneerProfile(id: string): PioneerProfile {
    return this.updatePioneerProfile(id, { softDeleted: true });
  }

  static recoverPioneerProfile(id: string): PioneerProfile {
    return this.updatePioneerProfile(id, { softDeleted: false });
  }

  // ==========================================
  // JOBS BOARD METHODS
  // ==========================================

  static getJobs(): Job[] {
    return this.get<Job>(KEYS.JOBS);
  }

  static getJobById(id: string): Job | undefined {
    return this.getJobs().find(j => j.id === id);
  }

  static getJobsByProvider(providerUid: string): Job[] {
    return this.getJobs().filter(j => j.providerUid === providerUid);
  }

  static createJob(jobData: Omit<Job, 'id' | 'createdAt' | 'status' | 'applicantCount'>): Job {
    const jobs = this.getJobs();
    const newJob: Job = {
      ...jobData,
      id: `job_${Math.random().toString(36).substring(2, 11)}`,
      createdAt: new Date().toISOString(),
      status: 'open',
      applicantCount: 0
    };

    jobs.push(newJob);
    this.save(KEYS.JOBS, jobs);
    return newJob;
  }

  static updateJobStatus(jobId: string, status: 'open' | 'closed'): Job {
    const jobs = this.getJobs();
    const index = jobs.findIndex(j => j.id === jobId);
    if (index === -1) throw new Error('Job not found');

    jobs[index].status = status;
    this.save(KEYS.JOBS, jobs);
    return jobs[index];
  }

  // ==========================================
  // JOB APPLICATIONS METHODS
  // ==========================================

  static getJobApplications(): JobApplication[] {
    return this.get<JobApplication>(KEYS.JOB_APPLICATIONS);
  }

  static getApplicationsForJob(jobId: string): JobApplication[] {
    return this.getJobApplications().filter(a => a.jobId === jobId);
  }

  static getApplicationsByApplicant(applicantUid: string): JobApplication[] {
    return this.getJobApplications().filter(a => a.applicantUid === applicantUid);
  }

  static applyToJob(appData: Omit<JobApplication, 'id' | 'createdAt' | 'status'>): JobApplication {
    const apps = this.getJobApplications();
    const newApp: JobApplication = {
      ...appData,
      id: `app_${Math.random().toString(36).substring(2, 11)}`,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    apps.push(newApp);
    this.save(KEYS.JOB_APPLICATIONS, apps);

    // Increment applicant count on job
    const jobs = this.getJobs();
    const jobIdx = jobs.findIndex(j => j.id === appData.jobId);
    if (jobIdx !== -1) {
      jobs[jobIdx].applicantCount += 1;
      this.save(KEYS.JOBS, jobs);
    }

    // Notify Job Provider
    const jobsList = this.getJobs();
    const job = jobsList.find(j => j.id === appData.jobId);
    if (job) {
      this.createNotification(
        job.providerUid,
        'New Job Application Received! 💼',
        `Pioneer ${appData.applicantUsername} has applied to your job listing "${appData.jobTitle}". Review their cover letter now.`,
        'system_announcement',
        '/job-board'
      );
    }

    return newApp;
  }

  static updateApplicationStatus(appId: string, status: JobApplication['status']): JobApplication {
    const apps = this.getJobApplications();
    const index = apps.findIndex(a => a.id === appId);
    if (index === -1) throw new Error('Application not found');

    apps[index].status = status;
    this.save(KEYS.JOB_APPLICATIONS, apps);

    // Notify Applicant
    this.createNotification(
      apps[index].applicantUid,
      `Job Application Status Update`,
      `Your application for "${apps[index].jobTitle}" has been marked as "${status.toUpperCase()}".`,
      'system_announcement'
    );

    return apps[index];
  }

  // ==========================================
  // UNIFIED LISTINGS METHODS (PHASE 5)
  // ==========================================

  static getUnifiedListings(): UnifiedListing[] {
    return this.get<UnifiedListing>(KEYS.UNIFIED_LISTINGS);
  }

  static getUnifiedListingById(id: string): UnifiedListing | undefined {
    return this.getUnifiedListings().find(l => l.id === id);
  }

  static getUnifiedListingsByOwner(ownerUid: string): UnifiedListing[] {
    return this.getUnifiedListings().filter(l => l.ownerUid === ownerUid);
  }

  static createUnifiedListing(listingData: Omit<UnifiedListing, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): UnifiedListing {
    const listings = this.getUnifiedListings();
    
    // Auto-calculate Geohash if lat/lng are provided
    const lat = listingData.location?.lat || 37.7749;
    const lng = listingData.location?.lng || -122.4194;
    const geoHash = this.encodeGeohash(lat, lng);

    const completeLocation = {
      ...listingData.location,
      lat,
      lng,
      geoHash,
      city: listingData.location?.city || 'San Francisco',
      country: listingData.location?.country || 'United States'
    };

    const newListing: UnifiedListing = {
      ...listingData,
      id: listingData.id || `listing_${Math.random().toString(36).substring(2, 11)}`,
      location: completeLocation,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    listings.push(newListing);
    this.save(KEYS.UNIFIED_LISTINGS, listings);

    // Notify user
    this.createNotification(
      newListing.ownerUid,
      'Listing Published! 🚀',
      `Your unified listing "${newListing.title}" of type ${newListing.type.toUpperCase()} is now live. Status: ${newListing.status}.`,
      'system_announcement'
    );

    return newListing;
  }

  static updateUnifiedListing(id: string, updates: Partial<UnifiedListing>): UnifiedListing {
    const listings = this.getUnifiedListings();
    const index = listings.findIndex(l => l.id === id);
    if (index === -1) throw new Error('Listing not found');

    const existing = listings[index];

    let completeLocation = existing.location;
    if (updates.location) {
      const lat = updates.location.lat || existing.location.lat || 37.7749;
      const lng = updates.location.lng || existing.location.lng || -122.4194;
      completeLocation = {
        ...existing.location,
        ...updates.location,
        lat,
        lng,
        geoHash: this.encodeGeohash(lat, lng)
      };
    }

    const updated: UnifiedListing = {
      ...existing,
      ...updates,
      location: completeLocation,
      updatedAt: new Date().toISOString()
    };

    listings[index] = updated;
    this.save(KEYS.UNIFIED_LISTINGS, listings);
    return updated;
  }

  static deleteUnifiedListing(id: string): void {
    const listings = this.getUnifiedListings();
    const filtered = listings.filter(l => l.id !== id);
    this.save(KEYS.UNIFIED_LISTINGS, filtered);
  }

  // ==========================
  // CLEAR ENTIRE DATABASE
  // ==========================
  static resetDB(): void {
    localStorage.removeItem(KEYS.USERS);
    localStorage.removeItem(KEYS.STORES);
    localStorage.removeItem(KEYS.PRODUCTS);
    localStorage.removeItem(KEYS.ORDERS);
    localStorage.removeItem(KEYS.REVIEWS);
    localStorage.removeItem(KEYS.NOTIFICATIONS);
    localStorage.removeItem(KEYS.PIONEER_PROFILES);
    localStorage.removeItem(KEYS.JOBS);
    localStorage.removeItem(KEYS.JOB_APPLICATIONS);
    localStorage.removeItem(KEYS.UNIFIED_LISTINGS);
    localStorage.removeItem(KEYS.CURRENT_USER);
    this.init();
  }
}
