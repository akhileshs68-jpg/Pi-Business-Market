[1mdiff --git a/runMigration.ts b/runMigration.ts[m
[1mnew file mode 100644[m
[1mindex 0000000..e68866c[m
[1m--- /dev/null[m
[1m+++ b/runMigration.ts[m
[36m@@ -0,0 +1,155 @@[m
[32m+[m[32mimport { initializeApp } from 'firebase/app';[m
[32m+[m[32mimport { initializeFirestore, collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';[m
[32m+[m[32mimport fs from 'fs';[m
[32m+[m
[32m+[m[32masync function run() {[m
[32m+[m[32m  console.log('[Migration] Starting product & cart migration...');[m
[32m+[m[32m  const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));[m
[32m+[m[32m  const app = initializeApp({[m
[32m+[m[32m    apiKey: config.apiKey,[m
[32m+[m[32m    authDomain: config.authDomain,[m
[32m+[m[32m    projectId: config.projectId,[m
[32m+[m[32m    storageBucket: config.storageBucket,[m
[32m+[m[32m    messagingSenderId: config.messagingSenderId,[m
[32m+[m[32m    appId: config.appId[m
[32m+[m[32m  });[m
[32m+[m[32m  const db = initializeFirestore(app, {}, config.firestoreDatabaseId);[m
[32m+[m
[32m+[m[32m  // 1. Fetch stores and businesses for lookup[m
[32m+[m[32m  const storesSnap = await getDocs(collection(db, 'stores'));[m
[32m+[m[32m  const stores = storesSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));[m
[32m+[m[41m  [m
[32m+[m[32m  const bizSnap = await getDocs(collection(db, 'businesses'));[m
[32m+[m[32m  const businesses = bizSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));[m
[32m+[m
[32m+[m[32m  console.log(`[Migration] Loaded ${stores.length} stores and ${businesses.length} businesses.`);[m
[32m+[m
[32m+[m[32m  const fallbackStore = stores[0] || null;[m
[32m+[m[32m  const fallbackBiz = businesses[0] || null;[m
[32m+[m
[32m+[m[32m  // Helper to test if a string identifier is invalid[m
[32m+[m[32m  const isInvalid = (val: any) => !val || val === 'none' || val === 'unknown' || val === 'null' || val === 'undefined' || val === '';[m
[32m+[m
[32m+[m[32m  // 2. Scan & Repair Products[m
[32m+[m[32m  const productsSnap = await getDocs(collection(db, 'products'));[m
[32m+[m[32m  console.log(`[Migration] Total products found: ${productsSnap.size}`);[m
[32m+[m
[32m+[m[32m  const repairedProducts: string[] = [];[m
[32m+[m[32m  const unrepairableProducts: string[] = [];[m
[32m+[m
[32m+[m[32m  for (const pDoc of productsSnap.docs) {[m
[32m+[m[32m    const pData = pDoc.data() as any;[m
[32m+[m[32m    const pid = pDoc.id;[m
[32m+[m
[32m+[m[32m    let storeId = pData.storeId;[m
[32m+[m[32m    let businessId = pData.businessId;[m
[32m+[m[32m    let ownerId = pData.ownerUid || pData.ownerId || pData.sellerId || pData.merchantId || pData.createdBy || pData.createdByUid;[m
[32m+[m
[32m+[m[32m    const needsFix = isInvalid(storeId) || isInvalid(businessId) || isInvalid(ownerId) || isInvalid(pData.sellerId) || isInvalid(pData.ownerId);[m
[32m+[m
[32m+[m[32m    if (needsFix) {[m
[32m+[m[32m      console.log(`[Migration] Product ${pid} ("${pData.productName || pData.title}") needs repair. Current:`, { storeId, businessId, ownerId, sellerId: pData.sellerId });[m
[32m+[m
[32m+[m[32m      // Resolve Store[m
[32m+[m[32m      let matchedStore = stores.find(s => s.id === storeId || s.storeId === storeId);[m
[32m+[m[32m      if (!matchedStore && ownerId && !isInvalid(ownerId)) {[m
[32m+[m[32m        matchedStore = stores.find(s => s.ownerId === ownerId || s.ownerUid === ownerId);[m
[32m+[m[32m      }[m
[32m+[m[32m      if (!matchedStore) {[m
[32m+[m[32m        matchedStore = fallbackStore;[m
[32m+[m[32m      }[m
[32m+[m
[32m+[m[32m      if (matchedStore) {[m
[32m+[m[32m        storeId = matchedStore.id || matchedStore.storeId;[m
[32m+[m[32m        if (isInvalid(businessId)) {[m
[32m+[m[32m          businessId = matchedStore.businessId;[m
[32m+[m[32m        }[m
[32m+[m[32m        if (isInvalid(ownerId)) {[m
[32m+[m[32m          ownerId = matchedStore.ownerId || matchedStore.ownerUid;[m
[32m+[m[32m        }[m
[32m+[m[32m      }[m
[32m+[m
[32m+[m[32m      // Resolve Business[m
[32m+[m[32m      let matchedBiz = businesses.find(b => b.id === businessId);[m
[32m+[m[32m      if (!matchedBiz && ownerId && !isInvalid(ownerId)) {[m
[32m+[m[32m        matchedBiz = businesses.find(b => b.ownerUid === ownerId || b.ownerId === ownerId);[m
[32m+[m[32m      }[m
[32m+[m[32m      if (!matchedBiz) {[m
[32m+[m[32m        matchedBiz = fallbackBiz;[m
[32m+[m[32m      }[m
[32m+[m
[32m+[m[32m      if (matchedBiz) {[m
[32m+[m[32m        if (isInvalid(businessId)) {[m
[32m+[m[32m          businessId = matchedBiz.id;[m
[32m+[m[32m        }[m
[32m+[m[32m        if (isInvalid(ownerId)) {[m
[32m+[m[32m          ownerId = matchedBiz.ownerUid || matchedBiz.ownerId;[m
[32m+[m[32m        }[m
[32m+[m[32m      }[m
[32m+[m
[32m+[m[32m      // Final check[m
[32m+[m[32m      if (isInvalid(storeId) || isInvalid(businessId) || isInvalid(ownerId)) {[m
[32m+[m[32m        console.error(`[Migration] Unrepairable Product ${pid}: missing store/biz/owner even after fallback.`);[m
[32m+[m[32m        unrepairableProducts.push(pid);[m
[32m+[m[32m        continue;[m
[32m+[m[32m      }[m
[32m+[m
[32m+[m[32m      const updates: any = {[m
[32m+[m[32m        storeId,[m
[32m+[m[32m        businessId,[m
[32m+[m[32m        sellerId: ownerId,[m
[32m+[m[32m        ownerId,[m
[32m+[m[32m        ownerUid: ownerId,[m
[32m+[m[32m        merchantId: ownerId,[m
[32m+[m[32m        createdBy: ownerId,[m
[32m+[m[32m        createdByUid: ownerId,[m
[32m+[m[32m        updatedAt: new Date().toISOString()[m
[32m+[m[32m      };[m
[32m+[m
[32m+[m[32m      await updateDoc(doc(db, 'products', pid), updates);[m
[32m+[m[32m      console.log(`[Migration] Repaired product ${pid} ->`, updates);[m
[32m+[m[32m      repairedProducts.push(pid);[m
[32m+[m[32m    }[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  // 3. Scan & Repair Cart Items[m
[32m+[m[32m  const cartItemsSnap = await getDocs(collection(db, 'cartItems'));[m
[32m+[m[32m  console.log(`[Migration] Total cart items found: ${cartItemsSnap.size}`);[m
[32m+[m
[32m+[m[32m  const repairedCartItems: string[] = [];[m
[32m+[m
[32m+[m[32m  for (const cDoc of cartItemsSnap.docs) {[m
[32m+[m[32m    const cData = cDoc.data() as any;[m
[32m+[m[32m    const cid = cDoc.id;[m
[32m+[m
[32m+[m[32m    if (isInvalid(cData.storeId) || isInvalid(cData.businessId) || isInvalid(cData.ownerId) || isInvalid(cData.sellerId)) {[m
[32m+[m[32m      console.log(`[Migration] Cart item ${cid} needs repair. Fetching product ${cData.productId}...`);[m
[32m+[m[32m      if (cData.productId) {[m
[32m+[m[32m        const prodSnap = await getDoc(doc(db, 'products', cData.productId));[m
[32m+[m[32m        if (prodSnap.exists()) {[m
[32m+[m[32m          const prodData = prodSnap.data() as any;[m
[32m+[m[32m          const updates: any = {[m
[32m+[m[32m            storeId: prodData.storeId,[m
[32m+[m[32m            businessId: prodData.businessId,[m
[32m+[m[32m            sellerId: prodData.ownerId || prodData.ownerUid || prodData.sellerId,[m
[32m+[m[32m            ownerId: prodData.ownerId || prodData.ownerUid,[m
[32m+[m[32m            ownerUid: prodData.ownerId || prodData.ownerUid,[m
[32m+[m[32m            merchantId: prodData.ownerId || prodData.ownerUid,[m
[32m+[m[32m            updatedAt: new Date().toISOString()[m
[32m+[m[32m          };[m
[32m+[m[32m          await updateDoc(doc(db, 'cartItems', cid), updates);[m
[32m+[m[32m          console.log(`[Migration] Repaired cart item ${cid} ->`, updates);[m
[32m+[m[32m          repairedCartItems.push(cid);[m
[32m+[m[32m        }[m
[32m+[m[32m      }[m
[32m+[m[32m    }[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  console.log('\n================ MIGRATION SUMMARY ================');[m
[