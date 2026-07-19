/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { inventoryService } from '../inventoryService';
import { getFirebaseDb } from '../../firebase/config';
import { runTransaction, doc, getDoc, setDoc } from 'firebase/firestore';

describe('InventoryService Production Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully initialize inventory if it does not exist', async () => {
    const mockData = {
      variantId: 'v1',
      warehouseId: 'w1',
      businessId: 'b1',
      productId: 'p1',
      reorderPoint: 10,
      sku: 'SKU-001'
    };

    // Simulate non-existent doc
    (getDoc as any).mockResolvedValueOnce({ exists: () => false });
    
    const id = await inventoryService.initInventory(mockData as any);
    
    expect(id).toBe('w1_v1');
    expect(setDoc).toHaveBeenCalled();
  });

  it('should retry on transient failures using withRetry', async () => {
    const mockData = { variantId: 'v1', warehouseId: 'w1' };
    
    // Fail first twice with transient error, then succeed
    (getDoc as any)
      .mockRejectedValueOnce({ code: 'unavailable' })
      .mockRejectedValueOnce({ code: 'unavailable' })
      .mockResolvedValueOnce({ exists: () => true });

    const id = await inventoryService.initInventory(mockData as any);
    
    expect(id).toBe('w1_v1');
    expect(getDoc).toHaveBeenCalledTimes(3);
  });

  it('should fail immediately on permission denied errors', async () => {
    const mockData = { variantId: 'v1', warehouseId: 'w1' };
    
    (getDoc as any).mockRejectedValueOnce({ code: 'permission-denied' });

    await expect(inventoryService.initInventory(mockData as any))
      .rejects.toThrow();
    
    expect(getDoc).toHaveBeenCalledTimes(1);
  });
});
