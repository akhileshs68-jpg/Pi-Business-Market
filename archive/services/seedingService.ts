import { collection, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';

export const seedingService = {
  async seedAllIfNeeded(): Promise<void> {
    try {
      const db = getFirebaseDb();

      // 1. Seed Products if empty
      const productsSnap = await getDocs(collection(db, 'products'));
      if (productsSnap.empty) {
        console.log('Seeding products to Firestore...');
        const productsToSeed = [
          {
            id: 'p_1',
            productName: 'Consensus Core Hardware Wallet',
            category: 'Electronics',
            description: 'The ultimate offline cold storage for your Pi Network holdings. Features full biometric validation, multi-sig consensus backup, and Bluetooth 5.0 integration with the Pi Node app.',
            price: 45,
            discount: 45, // real discount from 90
            oldPrice: 90,
            currency: 'π',
            stock: 80,
            sku: 'HW-WALLET-01',
            brand: 'PiSec',
            tags: 'wallet,hardware,security',
            status: 'Published',
            ownerUid: 'mock_seller_uid_1',
            roleId: 'seller',
            featured: true,
            isTrending: true,
            isRecommended: true,
            isBestDeal: true,
            isPiExclusive: true,
            imageUrl: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=500&auto=format&fit=crop&q=60'
          },
          {
            id: 'p_2',
            productName: 'Developer Workstation Book Pro',
            category: 'Electronics',
            description: 'Unleash direct Web3 integration with pre-configured Pi Node testing environments. Built with a high-performance CPU, 32GB RAM, and direct terminal access to local testnets.',
            price: 350,
            discount: 70, // real discount from 420
            oldPrice: 420,
            currency: 'π',
            stock: 15,
            sku: 'WORKSTATION-PRO',
            brand: 'Silicon Pioneers',
            tags: 'developer,laptop,workstation',
            status: 'Published',
            ownerUid: 'mock_seller_uid_1',
            roleId: 'seller',
            featured: true,
            isTrending: true,
            isRecommended: true,
            isBestDeal: true,
            isPiExclusive: false,
            imageUrl: 'https://images.unsplash.com/photo-1496181130204-755241544e35?w=500&auto=format&fit=crop&q=60'
          },
          {
            id: 'p_3',
            productName: 'Single-Origin Ethiopian Coffee Beans (1kg)',
            category: 'Agriculture',
            description: 'Ethically sourced, high-altitude organic Arabica beans from Yirgacheffe. Roasted to a perfect medium level to unleash citrus notes and clean, floral complexity.',
            price: 2.5,
            discount: 1.5, // real discount from 4.0
            oldPrice: 4.0,
            currency: 'π',
            stock: 500,
            sku: 'ETH-COFFEE-01',
            brand: 'Kaffa Pi Roasters',
            tags: 'coffee,organic,agriculture',
            status: 'Published',
            ownerUid: 'mock_seller_uid_2',
            roleId: 'seller',
            featured: false,
            isTrending: true,
            isRecommended: false,
            isBestDeal: true,
            isPiExclusive: true,
            imageUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=500&auto=format&fit=crop&q=60'
          },
          {
            id: 'p_4',
            productName: 'AeroSync Fitness Smartwatch',
            category: 'Electronics',
            description: 'Track your steps, heart rate, sleep quality, and active minutes with this sleek IP68 waterproof smartwatch. Seamlessly synchronizes health telemetry.',
            price: 18.5,
            discount: 6.5, // real discount from 25.0
            oldPrice: 25.0,
            currency: 'π',
            stock: 120,
            sku: 'FITWATCH-AERO',
            brand: 'OmniWear Global',
            tags: 'watch,fitness,smartwatch',
            status: 'Published',
            ownerUid: 'mock_seller_uid_1',
            roleId: 'seller',
            featured: true,
            isTrending: true,
            isRecommended: true,
            isBestDeal: true,
            isPiExclusive: false,
            imageUrl: 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=500&auto=format&fit=crop&q=60'
          },
          {
            id: 'p_5',
            productName: 'Urban Comfort Denim Jacket',
            category: 'Fashion',
            description: 'Standard regular-fit denim jacket featuring reinforced double-needle stitching, copper hardware, and dual button-flap chest pockets. Timeless casual style.',
            price: 12.0,
            discount: 6.0, // real discount from 18.0
            oldPrice: 18.0,
            currency: 'π',
            stock: 45,
            sku: 'DENIM-JACKET-BLU',
            brand: 'Pi Wearables',
            tags: 'fashion,denim,jacket',
            status: 'Published',
            ownerUid: 'mock_seller_uid_3',
            roleId: 'seller',
            featured: false,
            isTrending: false,
            isRecommended: true,
            isBestDeal: true,
            isPiExclusive: false,
            imageUrl: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500&auto=format&fit=crop&q=60'
          },
          {
            id: 'p_6',
            productName: 'Organic Green Tea Selection',
            category: 'Agriculture',
            description: 'Carefully handpicked sencha green tea leaves from high-grade organic estates. Loaded with natural antioxidants, offering a subtle, sweet, grassy finish.',
            price: 1.8,
            discount: 0.7, // real discount from 2.5
            oldPrice: 2.5,
            currency: 'π',
            stock: 300,
            sku: 'TEA-GREEN-ORG',
            brand: 'EcoFarms Premium',
            tags: 'tea,green,organic',
            status: 'Published',
            ownerUid: 'mock_seller_uid_2',
            roleId: 'seller',
            featured: false,
            isTrending: false,
            isRecommended: true,
            isBestDeal: true,
            isPiExclusive: true,
            imageUrl: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=500&auto=format&fit=crop&q=60'
          },
          {
            id: 'p_7',
            productName: 'NFT Creator Suite - Lifetime License',
            category: 'Education',
            description: 'Learn and create digital art seamlessly. Includes modular code-templates to bundle layers, generate metadata arrays, and deploy contracts easily on secondary testnets.',
            price: 88.0,
            discount: 32.0, // real discount from 120.0
            oldPrice: 120.0,
            currency: 'π',
            stock: 999,
            sku: 'NFT-CREATOR-LIC',
            brand: 'Web3 Toolbox',
            tags: 'nft,education,software',
            status: 'Published',
            ownerUid: 'mock_seller_uid_4',
            roleId: 'seller',
            featured: true,
            isTrending: true,
            isRecommended: true,
            isBestDeal: true,
            isPiExclusive: true,
            imageUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=500&auto=format&fit=crop&q=60'
          },
          {
            id: 'p_8',
            productName: 'Pro Sound Active Noise Headphones',
            category: 'Electronics',
            description: 'Industry-leading Active Noise Cancellation (ANC) with exceptional sound quality and 40-hour battery life. Designed for complete audio immersion.',
            price: 24.5,
            discount: 10.5, // real discount from 35.0
            oldPrice: 35.0,
            currency: 'π',
            stock: 65,
            sku: 'ANC-HEADPHONE-X',
            brand: 'AcousticPi',
            tags: 'audio,headphone,sound',
            status: 'Published',
            ownerUid: 'mock_seller_uid_1',
            roleId: 'seller',
            featured: true,
            isTrending: false,
            isRecommended: false,
            isBestDeal: true,
            isPiExclusive: true,
            imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60'
          }
        ];

        for (const item of productsToSeed) {
          const itemRef = doc(db, 'products', item.id);
          await setDoc(itemRef, {
            ...item,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      }

      // 2. Seed Services if empty
      const servicesSnap = await getDocs(collection(db, 'services'));
      if (servicesSnap.empty) {
        console.log('Seeding services to Firestore...');
        const servicesToSeed = [
          {
            id: 's_1',
            serviceName: 'Smart Contract Consensus Audit',
            category: 'Services',
            description: 'Comprehensive code security analysis of your smart contract or distributed dapp. Our certified pioneers audit lines for re-entrancy issues, edge overflows, and optimization.',
            price: 150,
            currency: 'π',
            duration: '3-5 Days',
            bookingRequired: true,
            availableDays: 'Mon-Fri',
            availableTime: '09:00 - 17:00',
            status: 'Published',
            ownerUid: 'mock_provider_uid_1',
            roleId: 'service provider',
            imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500&auto=format&fit=crop&q=60'
          },
          {
            id: 's_2',
            serviceName: 'Certified Web3 Development Consulting',
            category: 'Services',
            description: 'One-on-one architecture review for custom merchant integrations, Pi SDK connection, local storage setups, and secure transaction handshakes.',
            price: 75,
            currency: 'π',
            duration: '1 Hour',
            bookingRequired: true,
            availableDays: 'Mon-Sat',
            availableTime: '10:00 - 19:00',
            status: 'Published',
            ownerUid: 'mock_provider_uid_1',
            roleId: 'service provider',
            imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=500&auto=format&fit=crop&q=60'
          },
          {
            id: 's_3',
            serviceName: 'Pioneer Agricultural Logistics Consultation',
            category: 'Services',
            description: 'Streamline local supply chain management, fresh crop delivery routing, and smart merchant distribution plans using consensus ledger records.',
            price: 45,
            currency: 'π',
            duration: '2 Hours',
            bookingRequired: false,
            availableDays: 'Mon, Wed, Fri',
            availableTime: '08:00 - 12:00',
            status: 'Published',
            ownerUid: 'mock_provider_uid_2',
            roleId: 'service provider',
            imageUrl: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=500&auto=format&fit=crop&q=60'
          }
        ];

        for (const item of servicesToSeed) {
          const itemRef = doc(db, 'services', item.id);
          await setDoc(itemRef, {
            ...item,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      }

      // 3. Seed Banners if empty
      const bannersSnap = await getDocs(collection(db, 'banners'));
      if (bannersSnap.empty) {
        console.log('Seeding banners to Firestore...');
        const bannersToSeed = [
          {
            id: 'b_1',
            tag: 'FESTIVAL DEALS',
            title: 'Pi Network Day Grand Festival',
            description: 'Unlock 50% discount on Hardware Wallets with secure consensus smart checking.',
            badge: 'Exclusive',
            bgClass: 'from-violet-900 via-indigo-950 to-slate-950',
            imageUrl: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=300&auto=format&fit=crop&q=60',
            targetRoute: 'product/p_1',
            status: 'active'
          },
          {
            id: 'b_2',
            tag: 'SPONSORED PROMOTION',
            title: 'EcoFarms Direct Delivery Campaigns',
            description: 'Get single-origin coffee and premium organic green tea shipped right to your hub.',
            badge: 'Consensus Approved',
            bgClass: 'from-emerald-950 via-teal-950 to-slate-950',
            imageUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=300&auto=format&fit=crop&q=60',
            targetRoute: 'product/p_3',
            status: 'active'
          },
          {
            id: 'b_3',
            tag: 'FLASH DEALS',
            title: 'Silicon Pioneers Cyber Sprint',
            description: 'Premium workstations and smart accessories up to 40% off using direct Pi transactions.',
            badge: 'Limited Time',
            bgClass: 'from-pink-950 via-violet-950 to-slate-950',
            imageUrl: 'https://images.unsplash.com/photo-1496181130204-755241544e35?w=300&auto=format&fit=crop&q=60',
            targetRoute: 'product/p_2',
            status: 'active'
          }
        ];

        for (const item of bannersToSeed) {
          const itemRef = doc(db, 'banners', item.id);
          await setDoc(itemRef, {
            ...item,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      }

      // 4. Seed Stores if empty
      const storesSnap = await getDocs(collection(db, 'stores'));
      if (storesSnap.empty) {
        console.log('Seeding stores to Firestore...');
        const storesToSeed = [
          {
            storeId: 'mock_store_1',
            businessId: 'mock_biz_1',
            ownerUid: 'mock_seller_uid_1',
            storeName: 'Silicon Pioneers Hub',
            storeSlug: 'silicon-pioneers',
            storeType: 'Online Store',
            storeCategory: 'Retail',
            description: 'The premier hardware and technology provider for Web3 developers and pioneers.',
            email: 'silicon@pioneers.com',
            phone: '+15550199',
            country: 'United States',
            state: 'California',
            city: 'San Francisco',
            address: '123 Pi Pioneers Way',
            verified: true,
            featured: true,
            status: 'active',
            logoUrl: 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=150',
            coverImageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
            followers: 1250,
            rating: 4.8,
            reviewCount: 36
          },
          {
            storeId: 'mock_store_2',
            businessId: 'mock_biz_2',
            ownerUid: 'mock_seller_uid_2',
            storeName: 'EcoFarms Premium',
            storeSlug: 'ecofarms',
            storeType: 'Organic Farm',
            storeCategory: 'Agriculture',
            description: 'Ethically grown crops, single-origin coffees, and fine organic green teas.',
            email: 'contact@ecofarms.com',
            phone: '+15550233',
            country: 'United States',
            state: 'Oregon',
            city: 'Portland',
            address: '777 Green Leaf Blvd',
            verified: true,
            featured: true,
            status: 'active',
            logoUrl: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=150',
            coverImageUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800',
            followers: 820,
            rating: 4.9,
            reviewCount: 42
          }
        ];

        for (const store of storesToSeed) {
          const storeRef = doc(db, 'stores', store.storeId);
          await setDoc(storeRef, {
            ...store,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      }
    } catch (e) {
      console.error('Seeding Firestore error:', e);
    }
  }
};
