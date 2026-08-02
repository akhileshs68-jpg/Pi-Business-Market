/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { auditService } from '../services/auditService';

export const backupRecoveryService = {
  /**
   * Schedule a manual backup
   */
  async triggerManualBackup(adminUid: string, adminName: string): Promise<string> {
    try {
      const db = getFirebaseDb();
      const backupId = `BKP_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
      const docRef = doc(db, 'systemBackups', backupId);
      
      await setDoc(docRef, {
        backupId,
        triggeredBy: adminUid,
        status: 'in_progress',
        type: 'manual',
        startedAt: serverTimestamp()
      });

      await auditService.logAction(
        adminUid,
        adminName,
        'MANUAL_BACKUP_TRIGGERED',
        'system',
        backupId,
        'Manual database backup triggered'
      );

      // Simulate completion
      setTimeout(async () => {
        try {
          await setDoc(docRef, {
            status: 'completed',
            completedAt: serverTimestamp(),
            sizeBytes: Math.floor(Math.random() * 1024 * 1024 * 100) // Random size
          }, { merge: true });
        } catch (e) {
          console.error(e);
        }
      }, 5000);

      return backupId;
    } catch (err) {
      console.error('BackupRecovery: Manual backup trigger failed', err);
      throw err;
    }
  }
};
