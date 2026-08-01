/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  runTransaction, 
  serverTimestamp 
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { WalletTransaction } from './wallet/walletTypes';
import { bmpRewardsProvider } from './wallet/providers/bmpRewardsProvider';

import { LedgerEntry } from '../types';

export interface LedgerAuditResult {
  userId: string;
  recordedBalance: number;
  calculatedBalance: number;
  hasDiscrepancy: boolean;
  discrepancyAmount: number;
  transactionCount: number;
}

export interface BmpTokenConfig {
  symbol: string;
  network: string;
  contractAddress?: string;
  decimals: number;
  isTokenized: boolean;
}

export const bmpTokenConfig: BmpTokenConfig = {
  symbol: 'BMP',
  network: 'Pi Network / Web3',
  decimals: 18,
  isTokenized: false, // Ready for future smart contract bridging
};

export const ledgerService = {
  /**
   * Fetch immutable transaction ledger history for a user
   */
  async getLedgerHistory(userId: string, maxResults: number = 50): Promise<WalletTransaction[]> {
    const db = getFirebaseDb();
    try {
      // Query without complex multi-field index requirements
      const q = query(
        collection(db, 'wallet_transactions'),
        where('userId', '==', userId),
        limit(maxResults)
      );
      const snap = await getDocs(q);
      const txs = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate?.()?.toISOString() || d.data().createdAt || new Date().toISOString()
      })) as WalletTransaction[];

      // Client-side sort by date descending
      return txs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
      console.warn('Failed to fetch ledger history:', err);
      return [];
    }
  },

  /**
   * Audit user's ledger and recalculate exact balance from credits & debits
   */
  async auditAndReconcile(userId: string): Promise<LedgerAuditResult> {
    const db = getFirebaseDb();
    const currentRecorded = await bmpRewardsProvider.getBalance(userId);
    
    const history = await this.getLedgerHistory(userId, 500);
    
    let calculated = 0;
    for (const tx of history) {
      if (tx.type === 'CREDIT') {
        calculated += tx.amount;
      } else if (tx.type === 'DEBIT') {
        calculated -= tx.amount;
      }
    }

    const discrepancyAmount = Math.abs(currentRecorded - calculated);
    const hasDiscrepancy = discrepancyAmount > 0.01;

    // Self-healing: if discrepancy exists, create an adjustment entry to restore balance integrity
    if (hasDiscrepancy) {
      console.info(`[Ledger] Reconciling discrepancy for user ${userId}: recorded=${currentRecorded}, calculated=${calculated}`);
      if (calculated > currentRecorded) {
        const diff = calculated - currentRecorded;
        await bmpRewardsProvider.credit(userId, diff, 'ADJUSTMENT', 'Ledger Audit Reconciled Credit');
      } else if (currentRecorded > calculated) {
        const diff = currentRecorded - calculated;
        await bmpRewardsProvider.debit(userId, diff, 'ADJUSTMENT', 'Ledger Audit Reconciled Debit');
      }
    }

    return {
      userId,
      recordedBalance: currentRecorded,
      calculatedBalance: calculated,
      hasDiscrepancy,
      discrepancyAmount,
      transactionCount: history.length
    };
  },

  /**
   * Fetch business-level ledger entries (for merchant accounting & financial reports)
   */
  async getBusinessLedger(businessId: string): Promise<LedgerEntry[]> {
    const db = getFirebaseDb();
    try {
      const q = query(
        collection(db, 'ledger_entries'),
        where('businessId', '==', businessId),
        limit(100)
      );
      const snap = await getDocs(q);
      const entries = snap.docs.map(d => ({
        ledgerId: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate?.()?.toISOString() || d.data().createdAt || new Date().toISOString()
      })) as LedgerEntry[];

      return entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
      console.warn('Failed to fetch business ledger:', err);
      return [];
    }
  }
};
