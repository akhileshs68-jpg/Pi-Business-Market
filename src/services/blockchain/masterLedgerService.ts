/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getFirebaseDb } from '../../firebase/config';
import { collection, doc, setDoc, query, where, getDocs, limit, serverTimestamp } from 'firebase/firestore';
import { MasterLedgerEntry } from './blockchainTypes';

export class MasterLedgerService {
  /**
   * Record immutable master ledger entry for every blockchain transaction
   */
  public async recordEntry(entryData: Omit<MasterLedgerEntry, 'entryId' | 'timestamp'>): Promise<MasterLedgerEntry> {
    const db = getFirebaseDb();
    const entryId = `mledg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const timestamp = new Date().toISOString();

    const entry: MasterLedgerEntry = {
      ...entryData,
      entryId,
      timestamp,
      hash: entryData.hash || `0x_mledg_${Math.random().toString(36).substring(2, 14)}`,
      blockHeight: entryData.blockHeight || 18492042
    };

    try {
      const ref = doc(db, 'master_ledger', entryId);
      await setDoc(ref, {
        ...entry,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.warn('[MasterLedgerService] Failed writing master ledger entry:', err);
    }

    return entry;
  }

  /**
   * Get user master ledger history
   */
  public async getUserLedger(userId: string, maxResults: number = 50): Promise<MasterLedgerEntry[]> {
    const db = getFirebaseDb();
    try {
      const q = query(
        collection(db, 'master_ledger'),
        where('userId', '==', userId),
        limit(maxResults)
      );
      const snap = await getDocs(q);
      const entries = snap.docs.map(d => ({
        entryId: d.id,
        ...d.data(),
        timestamp: d.data().timestamp || d.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      })) as MasterLedgerEntry[];

      return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (err) {
      console.warn('[MasterLedgerService] Failed querying master ledger:', err);
      return [];
    }
  }

  /**
   * Audit ledger entries for wallet reconciliation
   */
  public async auditWalletLedger(userId: string, asset: string): Promise<{ totalCalculated: number; entryCount: number }> {
    const entries = await this.getUserLedger(userId, 500);
    const filtered = entries.filter(e => e.asset === asset);
    const total = filtered.reduce((acc, e) => acc + e.amount, 0);

    return {
      totalCalculated: total,
      entryCount: filtered.length
    };
  }
}

export const masterLedgerService = new MasterLedgerService();
