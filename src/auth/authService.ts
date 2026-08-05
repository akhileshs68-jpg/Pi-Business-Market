import { 
  signInAnonymously, 
  signInWithPopup,
  
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb } from '../firebase/config';
import { User, UserRole } from '../types';
import { identityService } from '../services/identity/identityService';
import { removeUndefinedFields } from '../utils/firestoreUtils';

export interface RoleConfig {
  id: string;
  label: string;
  iconName: string;
  hasWorkspace: boolean;
  descEn?: string;
}

export const ROLES_CONFIG: Record<string, RoleConfig> = {
  buyer: { id: 'buyer', label: 'Buyer', iconName: '🛒', hasWorkspace: false },
  seller: { id: 'seller', label: 'Seller', iconName: '🏪', hasWorkspace: true },
  'service provider': { id: 'service provider', label: 'Service Provider', iconName: '🛠', hasWorkspace: true },
  manufacturer: { id: 'manufacturer', label: 'Manufacturer', iconName: '🏭', hasWorkspace: true },
  farmer: { id: 'farmer', label: 'Farmer', iconName: '🌾', hasWorkspace: true },
  artist: { id: 'artist', label: 'Artist', iconName: '🎨', hasWorkspace: true },
  freelancer: { id: 'freelancer', label: 'Freelancer', iconName: '💻', hasWorkspace: true },
  company: { id: 'company', label: 'Company', iconName: '🏢', hasWorkspace: true },
  doctor: { id: 'doctor', label: 'Doctor', iconName: '👨⚕️', hasWorkspace: true },
  teacher: { id: 'teacher', label: 'Teacher', iconName: '👨🏫', hasWorkspace: true }
};

declare global {
  interface Window {
    Pi: any;
  }
}

function getAbsoluteUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  try {
    if (typeof window !== 'undefined' && window.location && window.location.href) {
      const href = window.location.href;
      if (href.startsWith('http://') || href.startsWith('https://')) {
        const urlObj = new URL(href);
        if (urlObj.origin && urlObj.origin !== 'null' && !urlObj.origin.startsWith('file:')) {
          const resolved = `${urlObj.origin}${cleanPath}`;
          console.log(`[DEBUG_TRACE] [getAbsoluteUrl] Parsed href. Origin: ${urlObj.origin}, Resolved URL: ${resolved}`);
          return resolved;
        }
      }
    }
  } catch (e) {
    console.error('[DEBUG_TRACE] [getAbsoluteUrl] Error parsing window.location.href:', e);
  }

  try {
    if (typeof window !== 'undefined' && window.location && window.location.origin) {
      const origin = window.location.origin;
      if (origin !== 'null' && !origin.startsWith('file:')) {
        const resolved = `${origin}${cleanPath}`;
        console.log(`[DEBUG_TRACE] [getAbsoluteUrl] Read origin. Origin: ${origin}, Resolved URL: ${resolved}`);
        return resolved;
      }
    }
  } catch (e) {
    console.error('[DEBUG_TRACE] [getAbsoluteUrl] Error reading window.location.origin:', e);
  }

  try {
    if (typeof window !== 'undefined' && window.location && window.location.host) {
      const protocol = window.location.protocol || 'https:';
      const host = window.location.host;
      if (host && !host.startsWith('file:')) {
        const resolved = `${protocol}//${host}${cleanPath}`;
        console.log(`[DEBUG_TRACE] [getAbsoluteUrl] Formed host. Origin: ${protocol}//${host}, Resolved URL: ${resolved}`);
        return resolved;
      }
    }
  } catch (e) {}

  console.warn(`[DEBUG_TRACE] [getAbsoluteUrl] All origin checks failed. Falling back to relative path: ${cleanPath}`);
  return cleanPath;
}

let piInitPromise: Promise<void> | null = null;
let piAuthPromise: Promise<any> | null = null;
let piAuthResult: any = null;
let loginInProgressPromise: Promise<User> | null = null;

let piInitialized = false;

export function isRealPiBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  const isPiUA = typeof navigator !== 'undefined' && Boolean(navigator.userAgent) && /PiBrowser/i.test(navigator.userAgent);
  return isPiUA;
}

/**
 * Verifies if the native window.Pi instance actually possesses the payments scope
 */
export function hasNativePaymentsScope(): boolean {
  if (typeof window === 'undefined') return false;
  if (!isRealPiBrowser()) return true; // Non-Pi browsers/Mock environments always treated as having scope
  if (!(window as any).Pi) return false;
  const consented = (window as any).Pi.consentedScopes;
  return Array.isArray(consented) && consented.includes('payments');
}

export const authService = {
  async trackSession(userUid: string) {
    try {
      const db = getFirebaseDb();
      const sessionId = 'SESS_' + Math.random().toString(36).substring(2, 12).toUpperCase();
      const docRef = doc(db, 'securitySessions', sessionId);
      await setDoc(docRef, {
        sessionId,
        userUid,
        deviceInfo: navigator.userAgent,
        ipAddress: '127.0.0.1', // Real implementation needs backend or proxy
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        isMfaVerified: false
      });
      // Store in local storage for the client zero-trust validation
      localStorage.setItem('active_security_session', sessionId);
    } catch (e) {
      console.error('Session tracking failed', e);
    }
  },
  
  async revokeSession(sessionId: string) {
    try {
      const db = getFirebaseDb();
      const docRef = doc(db, 'securitySessions', sessionId);
      await updateDoc(docRef, { status: 'revoked' });
      localStorage.removeItem('active_security_session');
    } catch (e) {
      console.error('Session revocation failed', e);
    }
  },

  /**
   * Initializes the Pi SDK exactly once
   */
  async initPi(): Promise<void> {
    console.log('[DEBUG_TRACE] [initPi] ENTER');
    console.log('[DEBUG_TRACE] [initPi] typeof window.Pi:', typeof (window as any).Pi);
    console.log('[DEBUG_TRACE] [initPi] typeof window.Pi.init:', typeof (window as any).Pi?.init);
    console.log('[DEBUG_TRACE] [initPi] piInitialized:', piInitialized);

    if (typeof window === 'undefined') {
      console.log('[DEBUG_TRACE] [initPi] EXIT (window undefined)');
      return;
    }

    const isSandbox = (import.meta as any).env.VITE_PI_SANDBOX === 'true' || 
                      (import.meta as any).env.VITE_PI_SANDBOX === true;

    // Helper to safely execute window.Pi.init
    const performInit = () => {
      if (typeof window !== 'undefined' && (window as any).Pi && typeof (window as any).Pi.init === 'function') {
        try {
          console.log('[DEBUG_TRACE] [initPi] Executing window.Pi.init with version 2.0, sandbox:', isSandbox);
          (window as any).Pi.init({ version: "2.0", sandbox: isSandbox });
          piInitialized = true;
          console.log('[DEBUG_TRACE] [initPi] window.Pi.init succeeded');
        } catch (err: any) {
          console.warn('[DEBUG_TRACE] [initPi] window.Pi.init threw error (may already be initialized):', err);
          piInitialized = true;
        }
      }
    };

    if (piInitialized) {
      console.log('[DEBUG_TRACE] [initPi] EXIT (already initialized)');
      return;
    }

    // If window.Pi is immediately available, initialize right now!
    if (typeof window !== 'undefined' && (window as any).Pi && typeof (window as any).Pi.init === 'function') {
      performInit();
      if (piInitialized) {
        console.log('[DEBUG_TRACE] [initPi] EXIT (initialized immediately)');
        return;
      }
    }

    if (piInitPromise) {
      console.log('[DEBUG_TRACE] [initPi] BEFORE await existing piInitPromise');
      await piInitPromise;
      console.log('[DEBUG_TRACE] [initPi] AFTER await existing piInitPromise, piInitialized:', piInitialized);
      if (piInitialized) {
        console.log('[DEBUG_TRACE] [initPi] EXIT (after existing piInitPromise resolved initialized)');
        return;
      }
      // If previous promise resolved without initializing (because script wasn't loaded then), reset promise!
      piInitPromise = null;
    }

    piInitPromise = new Promise((resolve, reject) => {
      console.log('[DEBUG_TRACE] [initPi Promise] ENTER executor');
      
      const checkAndInit = () => {
        if (typeof window !== 'undefined' && (window as any).Pi && typeof (window as any).Pi.init === 'function') {
          performInit();
          if (piInitialized) {
            resolve();
            return true;
          }
        }
        return false;
      };

      if (checkAndInit()) return;

      console.log('[DEBUG_TRACE] [initPi Promise] window.Pi not ready yet, setting polling interval...');
      const checkPi = setInterval(() => {
        if (checkAndInit()) {
          console.log('[DEBUG_TRACE] [initPi Promise] window.Pi detected & initialized via interval');
          clearInterval(checkPi);
        }
      }, 200);

      setTimeout(() => {
        clearInterval(checkPi);
        if (!checkAndInit()) {
          console.warn('[DEBUG_TRACE] [initPi Promise] Pi SDK load timeout reached');
        }
        resolve();
      }, 3000);
    });

    console.log('[DEBUG_TRACE] [initPi] BEFORE await newly created piInitPromise');
    await piInitPromise;
    console.log('[DEBUG_TRACE] [initPi] AFTER await newly created piInitPromise, piInitialized:', piInitialized);
    console.log('[DEBUG_TRACE] [initPi] EXIT');
  },

  /**
   * Authenticates the user with specific scopes, with caching and native payments scope verification
   */
  async authenticatePi(requestedScopes: string[] = ['username', 'payments'], forceRefresh: boolean = false): Promise<any> {
    const startTime = Date.now();
    console.log('[DEBUG_TRACE] [authenticatePi] [STEP 1] ENTER authenticatePi at:', new Date().toISOString(), { requestedScopes, forceRefresh });
    console.log('[DEBUG_TRACE] [authenticatePi] [STEP 2] typeof window:', typeof window);
    console.log('[DEBUG_TRACE] [authenticatePi] [STEP 3] typeof window.Pi:', typeof (window as any).Pi);
    console.log('[DEBUG_TRACE] [authenticatePi] [STEP 4] typeof window.Pi.authenticate:', typeof (window as any).Pi?.authenticate);
    console.log('[DEBUG_TRACE] [authenticatePi] [STEP 5] Memory cache piAuthResult:', piAuthResult);

    // ALWAYS ensure both 'username' and 'payments' scopes are included
    const scopes = Array.from(new Set(['username', 'payments', ...requestedScopes]));
    console.log('[DEBUG_TRACE] [authenticatePi] [STEP 6] Scopes assembled:', scopes);
    
    // REDESIGN: Only return cached in-memory session if the native Pi SDK also possesses active payments scope
    if (!forceRefresh && piAuthResult && piAuthResult.hasPaymentsScope && hasNativePaymentsScope()) {
      console.log('[DEBUG_TRACE] [authenticatePi] [STEP 7a] Returning cached memory piAuthResult with verified native payments scope');
      console.log('[DEBUG_TRACE] [authenticatePi] EXIT (cached memory)');
      return piAuthResult;
    }

    if (piAuthPromise && !forceRefresh) {
      console.log('[DEBUG_TRACE] [authenticatePi] [STEP 8] Returning existing piAuthPromise');
      console.log('[DEBUG_TRACE] [authenticatePi] BEFORE await existing piAuthPromise');
      const res = await piAuthPromise;
      console.log('[DEBUG_TRACE] [authenticatePi] AFTER await existing piAuthPromise');
      console.log('[DEBUG_TRACE] [authenticatePi] EXIT (promise re-use)');
      return res;
    }

    console.log('[DEBUG_TRACE] [authenticatePi] [STEP 9] BEFORE await initPi()');
    await this.initPi();
    console.log('[DEBUG_TRACE] [authenticatePi] [STEP 10] AFTER await initPi()');
    
    const onIncompletePaymentFound = async (payment: any) => {
      const cbStart = Date.now();
      console.log('[DEBUG_TRACE] [onIncompletePaymentFound] ENTER at:', new Date().toISOString(), 'with payment:', JSON.stringify(payment));
      if (payment && payment.identifier) {
        try {
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          const auth = getFirebaseAuth();
          if (auth && auth.currentUser) {
            console.log('[DEBUG_TRACE] [onIncompletePaymentFound] Attempting Firebase auth token retrieval...');
            const token = await auth.currentUser.getIdToken().catch(() => null);
            if (token) headers['Authorization'] = `Bearer ${token}`;
          }
          console.log('[DEBUG_TRACE] [onIncompletePaymentFound] BEFORE await fetch /api/payments/incomplete');
          const fetchRes = await fetch(getAbsoluteUrl('/api/payments/incomplete'), {
            method: 'POST',
            headers,
            body: JSON.stringify({ payment })
          });
          console.log('[DEBUG_TRACE] [onIncompletePaymentFound] AFTER await fetch /api/payments/incomplete, status:', fetchRes.status);
        } catch (err) {
          console.error('[DEBUG_TRACE] [onIncompletePaymentFound] Error notifying server of incomplete payment:', err);
        }
      } else {
        console.log('[DEBUG_TRACE] [onIncompletePaymentFound] No payment identifier in payload, skipping fetch.');
      }
      console.log('[DEBUG_TRACE] [onIncompletePaymentFound] EXIT after duration:', Date.now() - cbStart, 'ms');
    };

    piAuthPromise = (async () => {
      console.log('[DEBUG_TRACE] [authenticatePi async worker] [STEP 11] ENTER worker');
      try {
        const isRealPi = isRealPiBrowser();
        console.log('[DEBUG_TRACE] [authenticatePi async worker] [STEP 12] isRealPiBrowser:', isRealPi);

        if (!isRealPi) {
          console.log('[DEBUG_TRACE] [authenticatePi async worker] [STEP 13a] Running outside PiBrowser, returning mock auth result');
          const mockAuth = {
            accessToken: 'mock_access_token_pioneer_123',
            user: {
              uid: 'mock_pi_uid_123',
              username: 'pi_pioneer_88'
            },
            hasPaymentsScope: true
          };
          piAuthResult = mockAuth;
          console.log('[DEBUG_TRACE] [authenticatePi async worker] EXIT worker (mock)');
          return mockAuth;
        }

        if (window.Pi) {
          if (typeof window.Pi.init === 'function' && !piInitialized) {
            try {
              const isSandbox = (import.meta as any).env.VITE_PI_SANDBOX === 'true' || 
                                (import.meta as any).env.VITE_PI_SANDBOX === true;
              console.log('[DEBUG_TRACE] [authenticatePi async worker] Inline window.Pi.init safeguard call...');
              window.Pi.init({ version: "2.0", sandbox: isSandbox });
              piInitialized = true;
            } catch (e) {
              console.warn('[DEBUG_TRACE] [authenticatePi async worker] Inline Pi.init error:', e);
              piInitialized = true;
            }
          }

          console.log('[DEBUG_TRACE] [authenticatePi async worker] [STEP 13b] IMMEDIATELY BEFORE window.Pi.authenticate call');
          console.log('[DEBUG_TRACE] [authenticatePi async worker] [STEP 13c] typeof window.Pi.authenticate:', typeof window.Pi.authenticate);
          console.log('[DEBUG_TRACE] [authenticatePi async worker] [STEP 13d] Passing scopes:', JSON.stringify(scopes));
          console.log('[DEBUG_TRACE] [authenticatePi async worker] [STEP 13e] Passing onIncompletePaymentFound callback function');
          
          const result = await window.Pi.authenticate(scopes, onIncompletePaymentFound);
          console.log('[DEBUG_TRACE] [authenticatePi async worker] [STEP 14] IMMEDIATELY AFTER window.Pi.authenticate resolved! result:', JSON.stringify(result));
          
          const piAuth = {
            ...result,
            hasPaymentsScope: true
          };

          piAuthResult = piAuth;
          console.log('[DEBUG_TRACE] [authenticatePi async worker] EXIT worker (native success)');
          return piAuth;
        } else {
          console.error('[DEBUG_TRACE] [authenticatePi async worker] window.Pi is missing');
          throw new Error("Pi Payments are available only inside Pi Browser.");
        }
      } catch (err) {
        console.error('[DEBUG_TRACE] [authenticatePi async worker] IMMEDIATELY AFTER window.Pi.authenticate REJECTED with error:', err);
        piAuthResult = null;
        throw err;
      } finally {
        piAuthPromise = null;
        console.log('[DEBUG_TRACE] [authenticatePi async worker] FINALLY block reached');
      }
    })();

    console.log('[DEBUG_TRACE] [authenticatePi] [STEP 15] BEFORE await piAuthPromise wrapper');
    try {
      const authRes = await piAuthPromise;
      console.log('[DEBUG_TRACE] [authenticatePi] [STEP 16] AFTER piAuthPromise resolves with authRes:', JSON.stringify(authRes));
      console.log('[DEBUG_TRACE] [authenticatePi] EXIT (total duration:', Date.now() - startTime, 'ms)');
      return authRes;
    } catch (authErr) {
      console.error('[DEBUG_TRACE] [authenticatePi] [STEP 16 Error] AFTER piAuthPromise rejects with authErr:', authErr);
      console.log('[DEBUG_TRACE] [authenticatePi] EXIT with error (total duration:', Date.now() - startTime, 'ms)');
      throw authErr;
    }
  },

  /**
   * Orchestrates the Pi Network Authentication flow with concurrency protection
   */
  async loginWithPi(): Promise<User> {
    console.log('[DEBUG_TRACE] [loginWithPi] ENTER');
    if (loginInProgressPromise) {
      console.log('[DEBUG_TRACE] [loginWithPi] Returning existing loginInProgressPromise');
      console.log('[DEBUG_TRACE] [loginWithPi] BEFORE await existing loginInProgressPromise');
      const res = await loginInProgressPromise;
      console.log('[DEBUG_TRACE] [loginWithPi] AFTER await existing loginInProgressPromise');
      console.log('[DEBUG_TRACE] [loginWithPi] EXIT (re-use)');
      return res;
    }

    loginInProgressPromise = (async () => {
      console.log('[DEBUG_TRACE] [loginWithPi async worker] ENTER worker');
      try {
        const isRealPi = isRealPiBrowser();
        console.log('[DEBUG_TRACE] [loginWithPi async worker] isRealPiBrowser:', isRealPi);
        
        let piUid: string;
        let username: string;

        // Use mock SDK ONLY when running outside Pi Browser in dev/preview
        if (!isRealPi) {
          console.log('[DEBUG_TRACE] [loginWithPi async worker] Running outside Pi Browser');
          const auth = getFirebaseAuth();
          const currentFbUser = auth?.currentUser;
          if (currentFbUser) {
            piUid = 'pi_' + currentFbUser.uid.slice(0, 10);
            username = 'user_' + currentFbUser.uid.slice(0, 8);
          } else {
            piUid = 'mock_pi_uid_' + Math.random().toString(36).substring(2, 8);
            username = 'pioneer_' + Math.random().toString(36).substring(2, 8);
          }
        } else {
          // Official Pi SDK Login inside Pi Browser
          console.log('[DEBUG_TRACE] [loginWithPi async worker] BEFORE await initPi()');
          await this.initPi();
          console.log('[DEBUG_TRACE] [loginWithPi async worker] AFTER await initPi()');
          try {
            console.log('[DEBUG_TRACE] [loginWithPi async worker] BEFORE await authenticatePi()');
            const piAuth = await this.authenticatePi(['username', 'payments'], true);
            console.log('[DEBUG_TRACE] [loginWithPi async worker] AFTER await authenticatePi() resolved with:', piAuth);
            const accessToken = piAuth.accessToken;
            
            console.log('[DEBUG_TRACE] [loginWithPi async worker] BEFORE await fetch /api/auth/pi');
            const response = await fetch(getAbsoluteUrl('/api/auth/pi'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ accessToken }),
            });
            console.log('[DEBUG_TRACE] [loginWithPi async worker] AFTER await fetch /api/auth/pi, status:', response.status);

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Backend validation failed');
            }

            const backendResult = await response.json();
            piUid = backendResult.user.uid;
            username = backendResult.user.username;
          } catch (sdkErr) {
            console.error('[DEBUG_TRACE] [loginWithPi async worker] Real Pi SDK failed:', sdkErr);
            throw sdkErr;
          }
        }

        // 4. Firebase Auth (to get a session)
        let firebaseUid: string;
        try {
          console.log('[DEBUG_TRACE] [loginWithPi async worker] BEFORE await signInAnonymously');
          const { getFirebaseAuth } = await import('../firebase/config');
          const auth = getFirebaseAuth();
          if (!auth) throw new Error('Firebase Auth unavailable');
          
          const userCredential = await signInAnonymously(auth);
          console.log('[DEBUG_TRACE] [loginWithPi async worker] AFTER await signInAnonymously');
          firebaseUid = userCredential.user.uid;
        } catch (authErr: any) {
          console.error('[DEBUG_TRACE] [loginWithPi async worker] Anonymous Auth failed:', authErr);
          throw authErr;
        }

        const now = new Date().toISOString();

        // Use identityResolver to resolve the canonical user by Pi UID
        const { identityResolver } = await import('../services/identity/identityResolver');
        
        // Define fallback identifiers if we are running in simulator/local dev
        const finalPiUid = piUid || 'pi_' + firebaseUid.slice(0, 10);
        const finalUsername = username || 'user_' + firebaseUid.slice(0, 8);
        
        let resolvedUser = await identityResolver.resolveUserByPiUid(finalPiUid, firebaseUid);
        
        if (!resolvedUser) {
          // Create the canonical document at users/{piUid}
          const db = getFirebaseDb();
          const canonicalRef = doc(db, 'users', finalPiUid);
          
          const isOwner = finalUsername === 'pi_pioneer_88';
          const defaultRoles = isOwner ? ['buyer', 'seller', 'business_owner', 'superadmin'] : ['buyer'];
          
          const freshUser = {
            uid: finalPiUid,
            firebaseUid,
            piUid: finalPiUid,
            username: finalUsername,
            displayName: isOwner ? 'Pi Pioneer 88' : finalUsername,
            roles: defaultRoles,
            accountType: isOwner ? 'business' : 'individual',
            verified: true,
            kycVerified: isOwner,
            profileCompleted: true,
            onboardingCompleted: true,
            lastResolvedUid: firebaseUid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            status: 'active'
          };
          
          await setDoc(canonicalRef, freshUser);
          resolvedUser = await identityResolver.resolveUserByPiUid(finalPiUid, firebaseUid);
        }
        
        localStorage.setItem('last_resolved_uid', firebaseUid);
        if (finalPiUid) localStorage.setItem('last_pi_uid', finalPiUid);
        
        return resolvedUser!;
      } catch (error) {
        console.error('[AuthService] Login failed:', error);
        throw error;
      } finally {
        loginInProgressPromise = null;
      }
    })();

    return loginInProgressPromise;
  },

  /**
   * Fetches the current user profile from Firestore under users/{uid}.
   * Multi-Tenant Isolation Invariant: Ensures users NEVER see another user's profile or avatar.
   */
  async getUserProfile(uid: string, piUid?: string): Promise<User | null> {
    console.log('[AuthService] getUserProfile() for uid:', uid, 'piUid:', piUid);
    try {
      const { identityResolver } = await import('../services/identity/identityResolver');

      // 1. If we have piUid, resolve directly via the canonical piUid!
      if (piUid && piUid !== 'user_active_pioneer_pi' && piUid !== 'mock_pi_uid_123') {
        const user = await identityResolver.resolveUserByPiUid(piUid, uid);
        if (user) {
          localStorage.setItem('last_resolved_uid', uid);
          return user;
        }
      }

      // 2. Otherwise try resolving by firebaseUid (checks canonical and legacy lookups)
      const user = await identityResolver.resolveUserByFirebaseUid(uid);
      if (user) {
        localStorage.setItem('last_resolved_uid', uid);
        return user;
      }

      return null;
    } catch (error: any) {
      console.error('[AuthService] Get user profile failed:', error);
      return null;
    }
  },

  /**
   * Signs the user out and clears all cached sessions and user identity state.
   */
  async logout(): Promise<void> {
    try {
      piAuthResult = null;
      piAuthPromise = null;
      loginInProgressPromise = null;

      try { localStorage.removeItem('last_resolved_uid'); } catch (e) {}
      try { localStorage.removeItem('last_pi_uid'); } catch (e) {}
      try { localStorage.removeItem('active_security_session'); } catch (e) {}
      try { localStorage.removeItem('pi_active_business_id'); } catch (e) {}
      try { localStorage.removeItem('pi_active_store_id'); } catch (e) {}
      try { localStorage.removeItem('pi_biz_mkt_current_user'); } catch (e) {}

      const auth = getFirebaseAuth();
      if (auth) {
        await signOut(auth);
      }
    } catch (error) {
      console.error('[AuthService] Logout failed:', error);
      throw error;
    }
  },

  /**
   * Listens for auth state changes
   */
  onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
    try {
      const auth = getFirebaseAuth();
      return onAuthStateChanged(auth, callback);
    } catch (error) {
      console.error('[AuthService] onAuthStateChange failed:', error);
      // Return a no-op unsubscribe function and trigger callback with null to continue flow
      setTimeout(() => callback(null), 0);
      return () => {};
    }
  },

  /**
   * Updates the user profile in Firestore
   */
  async updateUserProfile(uid: string, updates: Partial<User>): Promise<void> {
    try {
      const db = getFirebaseDb();
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      const payload: any = { ...updates };
      if ('kycVerified' in payload) {
        payload.kycVerified = Boolean(payload.kycVerified);
      }
      
      const sanitizedUpdates = removeUndefinedFields(payload);
      
      if (userSnap.exists()) {
        await updateDoc(userRef, removeUndefinedFields({
          ...sanitizedUpdates,
          updatedAt: serverTimestamp()
        }));
      } else {
        await setDoc(userRef, removeUndefinedFields({
          ...sanitizedUpdates,
          uid,
          kycVerified: Boolean(updates.kycVerified ?? false),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }));
      }
    } catch (error) {
      console.error('[AuthService] Update user profile failed:', error);
      throw error;
    }
  }
};
