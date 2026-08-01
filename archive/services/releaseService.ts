/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getFirebaseDb } from '../firebase/config';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

export interface SystemStatus {
  status: 'healthy' | 'degraded' | 'maintenance';
  version: string;
  lastChecked: string;
  services: {
    firestore: boolean;
    piGateway: boolean;
    auth: boolean;
  };
}

export const releaseService = {
  VERSION: '1.0.0-production',

  async checkSystemHealth(): Promise<SystemStatus> {
    const db = getFirebaseDb();
    let firestoreHealthy = false;
    
    try {
      // Small heartbeat write/read
      const heartRef = doc(db, 'systemStatus', 'heartbeat');
      await setDoc(heartRef, { lastHeartbeat: serverTimestamp() });
      firestoreHealthy = true;
    } catch (err) {
      console.error('HEALTH_CHECK_FAILURE: Firestore', err);
    }

    return {
      status: firestoreHealthy ? 'healthy' : 'degraded',
      version: this.VERSION,
      lastChecked: new Date().toISOString(),
      services: {
        firestore: firestoreHealthy,
        piGateway: true, // Mocked as true for sim
        auth: true
      }
    };
  },

  async getProductionConfig() {
    const db = getFirebaseDb();
    const snap = await getDoc(doc(db, 'platformSettings', 'global'));
    return snap.exists() ? snap.data() : null;
  }
};
