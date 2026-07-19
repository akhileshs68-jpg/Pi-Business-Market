/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp, 
  runTransaction,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { Inventory, InventoryTransaction, InventoryTransactionType } from '../types';
import { withRetry } from '../lib/retry';

export const inventoryService = {
  /**
   * INITIALIZE INVENTORY RECORD
   */
  async initInventory(inventory: Omit<Inventory, 'inventoryId' | 'updatedAt' | 'availableStock' | 'reservedStock' | 'incomingStock' | 'damagedStock' | 'returnedStock'>): Promise<string> {
    return withRetry(async () => {
      const db = getFirebaseDb();
      const inventoryId = `${inventory.warehouseId}_${inventory.variantId}`;
      
      const docRef = doc(db, 'inventory', inventoryId);
      const existing = await getDoc(docRef);
      
      if (existing.exists()) return inventoryId;

      await setDoc(docRef, {
        ...inventory,
        inventoryId,
        availableStock: 0,
        reservedStock: 0,
        incomingStock: 0,
        damagedStock: 0,
        returnedStock: 0,
        updatedAt: serverTimestamp()
      });

      return inventoryId;
    });
  },

  /**
   * TRANSACTIONAL STOCK ADJUSTMENT
   * Ensuring atomicity and immutable audit logs
   */
  async adjustStock(params: {
    inventoryId: string;
    type: InventoryTransactionType;
    quantity: number;
    userId: string;
    reason: string;
    referenceType?: any;
    referenceId?: string;
  }): Promise<void> {
    return withRetry(async () => {
      const db = getFirebaseDb();
      const inventoryRef = doc(db, 'inventory', params.inventoryId);
      const transactionRef = doc(collection(db, 'inventoryTransactions'));

      await runTransaction(db, async (transaction) => {
        const invDoc = await transaction.get(inventoryRef);
        if (!invDoc.exists()) throw new Error('Inventory record not found');

        const currentData = invDoc.data() as Inventory;
        let newStock = currentData.availableStock;
        let newReserved = currentData.reservedStock || 0;

        // Logic based on transaction type
        switch (params.type) {
          case 'stock-in':
          case 'return':
          case 'correction':
            newStock += params.quantity;
            break;
          case 'stock-out':
          case 'damage':
            if (currentData.availableStock < params.quantity) {
              throw new Error('Insufficient available stock');
            }
            newStock -= params.quantity;
            break;
          case 'reservation':
            if (currentData.availableStock < params.quantity) {
              throw new Error('Insufficient stock for reservation');
            }
            newStock -= params.quantity;
            newReserved += params.quantity;
            break;
          case 'release-reservation':
            newStock += params.quantity;
            newReserved = Math.max(0, newReserved - params.quantity);
            break;
          case 'fulfill-reservation':
            newReserved = Math.max(0, newReserved - params.quantity);
            // Stock was already moved from available to reserved during reservation step
            break;
          case 'adjustment':
            newStock = params.quantity;
            break;
        }

        // 1. Update Inventory Record
        transaction.update(inventoryRef, {
          availableStock: newStock,
          status: newStock <= (currentData.reorderPoint || 10) ? 'low-stock' : (newStock <= 0 ? 'out-of-stock' : 'in-stock'),
          updatedAt: serverTimestamp()
        });

        // 2. Create Audit Transaction
        transaction.set(transactionRef, {
          transactionId: transactionRef.id,
          inventoryId: params.inventoryId,
          transactionType: params.type,
          quantity: params.quantity,
          beforeQuantity: currentData.availableStock,
          afterQuantity: newStock,
          referenceType: params.referenceType,
          referenceId: params.referenceId,
          performedBy: params.userId,
          reason: params.reason,
          timestamp: serverTimestamp()
        });
      });
    });
  },

  /**
   * QUERIES
   */
  async getInventoryForWarehouse(warehouseId: string): Promise<Inventory[]> {
    const db = getFirebaseDb();
    const q = query(collection(db, 'inventory'), where('warehouseId', '==', warehouseId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Inventory);
  },

  async getInventoryForVariant(variantId: string): Promise<Inventory[]> {
    const db = getFirebaseDb();
    const q = query(collection(db, 'inventory'), where('variantId', '==', variantId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Inventory);
  },

  async getTransactions(inventoryId: string, max: number = 50): Promise<InventoryTransaction[]> {
    const db = getFirebaseDb();
    const q = query(
      collection(db, 'inventoryTransactions'),
      where('inventoryId', '==', inventoryId),
      orderBy('timestamp', 'desc'),
      limit(max)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate().toISOString() : data.timestamp
      } as InventoryTransaction;
    });
  }
};
