import re

with open("src/services/productService.ts", "r") as f:
    text = f.read()

# Fix getStoreProducts to actually find products for the store
new_get_store_products = """  async getStoreProducts(storeIdOrOwnerUid: string, ...args: any[]): Promise<any> {
    const db = getFirebaseDb();
    // In legacy, products belong to ownerUid. The parameter passed might be storeId or ownerUid.
    // To fix this universally:
    // First try querying by storeId (in case new schema added storeId)
    let q = query(collection(db, 'products'), where('storeId', '==', storeIdOrOwnerUid));
    let snap = await getDocs(q);
    
    if (snap.empty) {
      // Then try businessId
      q = query(collection(db, 'products'), where('businessId', '==', storeIdOrOwnerUid));
      snap = await getDocs(q);
    }
    
    if (snap.empty) {
      // Then try ownerUid (the old way)
      q = query(collection(db, 'products'), where('ownerUid', '==', storeIdOrOwnerUid));
      snap = await getDocs(q);
    }
    
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },"""

text = re.sub(r"async getStoreProducts\(storeId: string, \.\.\.args: any\[\]\): Promise<any> \{[\s\S]*?\},", new_get_store_products, text)

# Also fix getItemsByOwner to not restrict by roleId if it's returning empty, 
# because roleId might be 'Individual' or undefined in old data
new_get_items = """  async getItemsByOwner(ownerUid: string, roleId: string, type: 'product' | 'service') {
    const db = getFirebaseDb();
    const collectionName = type === 'product' ? 'products' : 'services';
    
    let q = query(
      collection(db, collectionName),
      where('ownerUid', '==', ownerUid),
      where('roleId', '==', roleId)
    );
    let snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      // Fallback: just find by ownerUid
      q = query(collection(db, collectionName), where('ownerUid', '==', ownerUid));
      snapshot = await getDocs(q);
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
  },"""
text = re.sub(r"async getItemsByOwner\(ownerUid: string, roleId: string, type: 'product' \| 'service'\) \{[\s\S]*?return snapshot.docs.map\(doc => \(\{ id: doc.id, \.\.\.doc.data\(\) \} as any\)\);\n  \},", new_get_items, text)

with open("src/services/productService.ts", "w") as f:
    f.write(text)
