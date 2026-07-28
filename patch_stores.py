import re

with open("src/services/storeService.ts", "r") as f:
    text = f.read()

new_get = """  async getOwnedStores(ownerUid: string): Promise<Store[]> {
    if (ownerUid.startsWith('mock_')) {
      // Return mock data for demo purposes, but for real users we want real data.
    }
    const db = getFirebaseDb();
    const storesMap = new Map<string, Store>();

    // 1. Fetch stores by ownerUid
    try {
      let qOwner = query(
        collection(db, 'stores'), 
        where('ownerUid', '==', ownerUid)
      );
      let snapshotOwner = await getDocs(qOwner);
      
      // Legacy fallback: checking 'userId' if 'ownerUid' didn't match (just in case)
      if (snapshotOwner.empty) {
        qOwner = query(collection(db, 'stores'), where('userId', '==', ownerUid));
        snapshotOwner = await getDocs(qOwner);
      }
      // Or sellerId
      if (snapshotOwner.empty) {
        qOwner = query(collection(db, 'stores'), where('sellerId', '==', ownerUid));
        snapshotOwner = await getDocs(qOwner);
      }

      snapshotOwner.docs.forEach(doc => {
        const data = doc.data();
        const store: Store = {
          ...data,
          storeId: doc.id,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        } as Store;
        if (store.status !== 'deleted') {
          storesMap.set(store.storeId, store);
        }
      });
    } catch (err) {
      console.warn('Query stores by ownerUid error:', err);
    }

    // 2. Fetch stores by user's businesses
    try {
      const qBizProfile = query(collection(db, 'businesses'), where('ownerUid', '==', ownerUid));
      const bizSnap = await getDocs(qBizProfile);
      
      for (const docSnap of bizSnap.docs) {
        const bizData = docSnap.data();
        const bizId = docSnap.id;
        
        const qBizStores = query(
          collection(db, 'stores'),
          where('businessId', '==', bizId)
        );
        const snapshotBiz = await getDocs(qBizStores);
        
        // If the business has no stores, map the business itself as a store (Legacy fallback)
        if (snapshotBiz.empty && !storesMap.has(bizId)) {
          const store: Store = {
             storeId: bizId,
             businessId: bizId,
             ownerUid: ownerUid,
             storeName: bizData.businessName || bizData.displayName || 'My Store',
             storeSlug: bizData.businessSlug || bizId.toLowerCase(),
             storeType: bizData.businessType || 'Online Store',
             storeCategory: bizData.category || 'Retail',
             description: bizData.description || '',
             email: bizData.email || '',
             phone: bizData.phone || '',
             country: bizData.country || '',
             state: bizData.state || '',
             city: bizData.city || '',
             address: bizData.address || '',
             latitude: bizData.latitude || 0,
             longitude: bizData.longitude || 0,
             openingHours: [],
             deliveryAvailable: true,
             pickupAvailable: true,
             verified: false,
             featured: false,
             status: bizData.status || 'active',
             logoUrl: bizData.logoUrl || '',
             coverImageUrl: bizData.coverImageUrl || '',
             followers: bizData.followers || 0,
             rating: bizData.rating || 0,
             reviewCount: bizData.reviewCount || 0,
             createdAt: bizData.createdAt instanceof Timestamp ? bizData.createdAt.toDate().toISOString() : bizData.createdAt,
             updatedAt: bizData.updatedAt instanceof Timestamp ? bizData.updatedAt.toDate().toISOString() : bizData.updatedAt
          };
          storesMap.set(bizId, store);
        } else {
          snapshotBiz.docs.forEach(d => {
            const data = d.data();
            const store: Store = {
              ...data,
              storeId: d.id,
              createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
              updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
            } as Store;
            if (store.status !== 'deleted') {
              storesMap.set(store.storeId, store);
            }
          });
        }
      }
    } catch (err) {
      console.warn('Query stores by business error:', err);
    }
    
    return Array.from(storesMap.values());
  },"""

text = re.sub(r"async getOwnedStores\(ownerUid: string\): Promise<Store\[\]> \{[\s\S]*?return Array.from\(storesMap.values\(\)\);\n  \},", new_get, text)

with open("src/services/storeService.ts", "w") as f:
    f.write(text)
