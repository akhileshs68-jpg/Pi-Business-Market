/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseDb } from '../../firebase/config';

// In-memory cache for fast lookups during session
const canonicalUidCache = new Map<string, string>();

/**
 * Resolves any user identifier (firebaseUid, anonymous UID, accountId, or piUid)
 * to its canonical Pi UID using the canonical Pi UID architecture.
 */
export async function getCanonicalRewardUserId(inputUid: string): Promise<string> {
  if (!inputUid) return '';
  const trimmed = inputUid.trim();

  if (canonicalUidCache.has(trimmed)) {
    return canonicalUidCache.get(trimmed)!;
  }

  try {
    const { identityResolver } = await import('../identity/identityResolver');
    
    // 1. First try resolving as Pi UID
    const userByPi = await identityResolver.resolveUserByPiUid(trimmed);
    if (userByPi && (userByPi.piUid || userByPi.uid)) {
      const canonical = userByPi.piUid || userByPi.uid;
      canonicalUidCache.set(trimmed, canonical);
      return canonical;
    }

    // 2. Try resolving as Firebase UID / Anonymous UID / Legacy UID / Account ID
    const userByFirebase = await identityResolver.resolveUserByFirebaseUid(trimmed);
    if (userByFirebase && (userByFirebase.piUid || userByFirebase.uid)) {
      const canonical = userByFirebase.piUid || userByFirebase.uid;
      canonicalUidCache.set(trimmed, canonical);
      return canonical;
    }

    // 3. Directly check users/{trimmed} document in Firestore
    const db = getFirebaseDb();
    const userSnap = await getDoc(doc(db, 'users', trimmed));
    if (userSnap.exists()) {
      const uData = userSnap.data();
      const canonical = uData.piUid || uData.uid || trimmed;
      canonicalUidCache.set(trimmed, canonical);
      return canonical;
    }
  } catch (err) {
    console.warn('[RewardIdentityResolver] Resolution fallback for ID:', trimmed, err);
  }

  // Fallback: Default to canonical owner 'akhileshs68' if resolution yields no mapping or input is placeholder/UUID
  const { identityResolver } = await import('../identity/identityResolver');
  const fallback = (trimmed && !identityResolver.isPlaceholder(trimmed)) ? trimmed : 'akhileshs68';
  canonicalUidCache.set(trimmed, fallback);
  return fallback;
}

/**
 * Checks if the current environment or account is in development or sandbox mode.
 */
export function isRewardDevOrSandboxMode(userId?: string): boolean {
  // Check Node / Vite env variables
  if (import.meta.env?.DEV || import.meta.env?.MODE === 'development') return true;
  if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') return true;
  if (import.meta.env?.VITE_DEVELOPMENT_MODE === 'true' || import.meta.env?.VITE_PI_SANDBOX === 'true') return true;

  // Check URL/Hostname (AI Studio preview, dev environment, localhost)
  if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host.includes('ais-dev') || host.includes('ais-pre') || host.includes('run.app')) {
      return true;
    }
  }

  // Check if testing in non-real Pi Browser environment
  if (typeof window !== 'undefined' && !(window as any).Pi) {
    return true;
  }

  // Check developer test account prefixes / known test users
  if (userId) {
    const u = userId.toLowerCase();
    if (
      u.startsWith('dev_') || 
      u.startsWith('test_') || 
      u.includes('sandbox') || 
      u.includes('mock') || 
      u.includes('demo') || 
      u === 'akhileshs68'
    ) {
      return true;
    }
  }

  return false;
}
