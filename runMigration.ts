import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import fs from 'fs';

async function run() {
  console.log('[Migration] Starting product & cart migration...');
  const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
  const app = initializeApp({
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    projectId: config.projectId,
    storageBucket: config.storageBucket,
    messagingSenderId: config.messagingSenderId,
    appId: config.appId
  });
  const db = initializeFirestore(app, {}, config.firestoreDatabaseId);

  // 1. Fetch stores and businesses for lookup
  const storesSnap = await getDocs(collection(db, 'stores'));
  const stores = storesSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
  
  const bizSnap = await getDocs(collection(db, 'businesses'));
  const businesses = bizSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));

  console.log(`[Migration] Loaded ${stores.length} stores and ${businesses.length} businesses.`);

  const fallbackStore = stores[0] || null;
  const fallbackBiz = businesses[0] || null;

  // Helper to test if a string identifier is invalid
  const isInvalid = (val: any) => !val || val === 'none' || val === 'unknown' || val === 'null' || val === 'undefined' || val === '';

  // 2. Scan & Repair Products
  const productsSnap = await getDocs(collection(db, 'products'));
  console.log(`[Migration] Total products found: ${productsSnap.size}`);

  const repairedProducts: string[] = [];
  const unrepairableProducts: string[] = [];

  for (const pDoc of productsSnap.docs) {
    const pData = pDoc.data() as any;
    const pid = pDoc.id;

    let storeId = pData.storeId;
    let businessId = pData.businessId;
    let ownerId = pData.ownerUid || pData.ownerId || pData.sellerId || pData.merchantId || pData.createdBy || pData.createdByUid;

    const needsFix = isInvalid(storeId) || isInvalid(businessId) || isInvalid(ownerId) || isInvalid(pData.sellerId) || isInvalid(pData.ownerId);

    if (needsFix) {
      console.log(`[Migration] Product ${pid} ("${pData.productName || pData.title}") needs repair. Current:`, { storeId, businessId, ownerId, sellerId: pData.sellerId });

      // Resolve Store
      let matchedStore = stores.find(s => s.id === storeId || s.storeId === storeId);
      if (!matchedStore && ownerId && !isInvalid(ownerId)) {
        matchedStore = stores.find(s => s.ownerId === ownerId || s.ownerUid === ownerId);
      }
      if (!matchedStore) {
        matchedStore = fallbackStore;
      }

      if (matchedStore) {
        storeId = matchedStore.id || matchedStore.storeId;
        if (isInvalid(businessId)) {
          businessId = matchedStore.businessId;
        }
        if (isInvalid(ownerId)) {
          ownerId = matchedStore.ownerId || matchedStore.ownerUid;
        }
      }

      // Resolve Business
      let matchedBiz = businesses.find(b => b.id === businessId);
      if (!matchedBiz && ownerId && !isInvalid(ownerId)) {
        matchedBiz = businesses.find(b => b.ownerUid === ownerId || b.ownerId === ownerId);
      }
      if (!matchedBiz) {
        matchedBiz = fallbackBiz;
      }

      if (matchedBiz) {
        if (isInvalid(businessId)) {
          businessId = matchedBiz.id;
        }
        if (isInvalid(ownerId)) {
          ownerId = matchedBiz.ownerUid || matchedBiz.ownerId;
        }
      }

      // Final check
      if (isInvalid(storeId) || isInvalid(businessId) || isInvalid(ownerId)) {
        console.error(`[Migration] Unrepairable Product ${pid}: missing store/biz/owner even after fallback.`);
        unrepairableProducts.push(pid);
        continue;
      }

      const updates: any = {
        storeId,
        businessId,
        sellerId: ownerId,
        ownerId,
        ownerUid: ownerId,
        merchantId: ownerId,
        createdBy: ownerId,
        createdByUid: ownerId,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(doc(db, 'products', pid), updates);
      console.log(`[Migration] Repaired product ${pid} ->`, updates);
      repairedProducts.push(pid);
    }
  }

  // 3. Scan & Repair Cart Items
  const cartItemsSnap = await getDocs(collection(db, 'cartItems'));
  console.log(`[Migration] Total cart items found: ${cartItemsSnap.size}`);

  const repairedCartItems: string[] = [];

  for (const cDoc of cartItemsSnap.docs) {
    const cData = cDoc.data() as any;
    const cid = cDoc.id;

    if (isInvalid(cData.storeId) || isInvalid(cData.businessId) || isInvalid(cData.ownerId) || isInvalid(cData.sellerId)) {
      console.log(`[Migration] Cart item ${cid} needs repair. Fetching product ${cData.productId}...`);
      if (cData.productId) {
        const prodSnap = await getDoc(doc(db, 'products', cData.productId));
        if (prodSnap.exists()) {
          const prodData = prodSnap.data() as any;
          const updates: any = {
            storeId: prodData.storeId,
            businessId: prodData.businessId,
            sellerId: prodData.ownerId || prodData.ownerUid || prodData.sellerId,
            ownerId: prodData.ownerId || prodData.ownerUid,
            ownerUid: prodData.ownerId || prodData.ownerUid,
            merchantId: prodData.ownerId || prodData.ownerUid,
            updatedAt: new Date().toISOString()
          };
          await updateDoc(doc(db, 'cartItems', cid), updates);
          console.log(`[Migration] Repaired cart item ${cid} ->`, updates);
          repairedCartItems.push(cid);
        }
      }
    }
  }

  console.log('\n================ MIGRATION SUMMARY ================');
  console.log(`Products Repaired: ${repairedProducts.length} (${repairedProducts.join(', ') || 'None'})`);
  console.log(`Products Unrepairable: ${unrepairableProducts.length} (${unrepairableProducts.join(', ') || 'None'})`);
  console.log(`Cart Items Repaired: ${repairedCartItems.length} (${repairedCartItems.join(', ') || 'None'})`);
  console.log('===================================================\n');
}

run().catch(console.error);
