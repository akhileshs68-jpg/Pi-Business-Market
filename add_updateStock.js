import fs from 'fs';
let content = fs.readFileSync('src/services/productService.ts', 'utf8');

// Insert the method
content = content.replace(
  /async updateProduct\(/,
  `async updateStock(productId: string, quantityChange: number): Promise<void> {
    const db = getFirebaseDb();
    const productRef = doc(db, 'products', productId);
    try {
      const snap = await getDoc(productRef);
      if (snap.exists()) {
        const currentStock = snap.data().stock || 0;
        const newStock = Math.max(0, currentStock + quantityChange); // Prevent negative stock
        await updateDoc(productRef, {
          stock: newStock,
          updatedAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.error('Failed to update stock for product', productId, err);
      throw err;
    }
  },

  async updateProduct(`
);

fs.writeFileSync('src/services/productService.ts', content);
