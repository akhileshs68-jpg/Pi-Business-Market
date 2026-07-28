import re

with open("src/services/storeService.ts", "r") as f:
    text = f.read()

new_update = """  async updateStore(storeId: string, updates: Partial<Store>): Promise<void> {
    const db = getFirebaseDb();
    const docRef = doc(db, 'stores', storeId);
    
    // First try 'stores' collection
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      return;
    }
    
    // Fallback: If it was mapped from 'businesses'
    const bizRef = doc(db, 'businesses', storeId);
    const bizSnap = await getDoc(bizRef);
    if (bizSnap.exists()) {
      await updateDoc(bizRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      return;
    }
  },"""

text = re.sub(r"async updateStore\(storeId: string, updates: Partial<Store>\): Promise<void> \{[\s\S]*?updatedAt: serverTimestamp\(\)\n    \}\);\n  \},", new_update, text)

# deleteStore as well
new_delete = """  async deleteStore(storeId: string): Promise<void> {
    const db = getFirebaseDb();
    const docRef = doc(db, 'stores', storeId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      await updateDoc(docRef, { status: 'deleted', updatedAt: serverTimestamp() });
      return;
    }
    const bizRef = doc(db, 'businesses', storeId);
    const bizSnap = await getDoc(bizRef);
    if (bizSnap.exists()) {
      await updateDoc(bizRef, { status: 'deleted', updatedAt: serverTimestamp() });
    }
  },"""
text = re.sub(r"async deleteStore\(storeId: string\): Promise<void> \{[\s\S]*?updatedAt: serverTimestamp\(\)\n    \}\);\n  \},", new_delete, text)

with open("src/services/storeService.ts", "w") as f:
    f.write(text)
