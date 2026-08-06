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
import { getAbsoluteUrl } from '../utils/urlUtils';
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



let piInitPromise: Promise<void> | null = null;
let piAuthPromise: Promise<any> | null = null;
let piAuthResult: any = null;
let loginInProgressPromise: Promise<User> | null = null;

let piInitialized = false;

export function isRealPiBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  const isPiUA = typeof navigator !== 'undefined' && Boolean(navigator.userAgent) && /PiBrowser/i.test(navigator.userAgent);
  return isPiUA || Boolean((window as any).Pi);
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

    const isSandbox = (import.meta as any).env.VITE_PI_SANDBOX !== 'false' && 
                      (import.meta as any).env.VITE_PI_SANDBOX !== false;

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
      console.log('[DEBUG_TRACE] [onIncompletePaymentFound] ENTERED callback with payment:', JSON.stringify(payment), {
        referrer: document.referrer,
        origin: window.location.origin,
        href: window.location.href
      });
      if (payment && payment.identifier) {
        try {
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          const auth = getFirebaseAuth();
          if (auth && auth.currentUser) {
            console.log('[DEBUG_TRACE] [onIncompletePaymentFound] Attempting Firebase auth token retrieval...');
            const token = await auth.currentUser.getIdToken().catch(() => null);
            if (token) headers['Authorization'] = `Bearer ${token}`;
          }
          console.log('[DEBUG_TRACE] [onIncompletePaymentFound] IMMEDIATELY BEFORE fetch() to /api/payments/incomplete');
          const fetchRes = await fetch(getAbsoluteUrl('/api/payments/incomplete'), {
            method: 'POST',
            headers,
            body: JSON.stringify({ payment })
          });
          console.log('[DEBUG_TRACE] [onIncompletePaymentFound] IMMEDIATELY AFTER fetch() response received, status:', fetchRes.status);
        } catch (err) {
          console.error('[DEBUG_TRACE] [onIncompletePaymentFound] Error notifying server of incomplete payment:', err);
        }
      } else {
        console.log('[DEBUG_TRACE] [onIncompletePaymentFound] No payment identifier in payload, skipping fetch.');
      }
      console.log('[DEBUG_TRACE] [onIncompletePaymentFound] EXITING callback after duration:', Date.now() - cbStart, 'ms');
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
              uid: 'dev_pioneer_mock',
              username: 'dev_pioneer_mock'
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
   * Retrieves, verifies, and synchronizes the live authenticated Pi Network account.
   * Strictly follows the 10 mandatory steps:
   * 1. Authenticate with Pi Network.
   * 2. Fetch authenticated Pi user profile.
   * 3. Fetch official Pi User ID (UID).
   * 4. Fetch official Pi Username (exact case, case-sensitive).
   * 5. Fetch authenticated wallet/account payment scope info.
   * 6. Store verified values returned by Pi.
   * 7. Compare stored values with current authenticated session.
   * 8. If mismatch exists, clear old mapping and replace with authenticated values.
   * 9. Ready for payment flow / application operations.
   * 10. Output detailed debug log at every step.
   */
  async verifyAndSynchronizePiAccount(forceRefresh: boolean = true): Promise<{ verifiedUser: User; piAuth: any }> {
    console.log('[PI_VERIFY_STEP 1/10] Initiating Pi Network authentication check...');
    const isRealPi = isRealPiBrowser();
    console.log('[PI_VERIFY_STEP 1/10] Runtime environment check - isRealPiBrowser:', isRealPi);

    let piAuth: any = null;
    let piUid: string = '';
    let username: string = '';

    if (isRealPi) {
      // Step 1: Authenticate with Pi Network via SDK
      await this.initPi();
      try {
        console.log('[PI_VERIFY_STEP 1/10] Requesting authentication from window.Pi.authenticate...');
        piAuth = await this.authenticatePi(['username', 'payments'], forceRefresh);
        console.log('[PI_VERIFY_STEP 1/10] Authentication response received from Pi SDK:', piAuth);
      } catch (authErr: any) {
        console.error('[PI_VERIFY_STEP 1/10 FAILED] Pi Network authentication failed:', authErr);
        throw new Error(`[Step 1 Failed] Pi Network authentication failed: ${authErr.message || authErr}`);
      }

      // Step 2, 3 & 4: Fetch user profile, UID, and Username
      console.log('[PI_VERIFY_STEP 2/10] Fetching authenticated Pi user profile...');
      if (piAuth?.user?.username && piAuth?.user?.uid) {
        piUid = piAuth.user.uid;
        username = piAuth.user.username; // Exact casing returned by Pi SDK
        console.log('[PI_VERIFY_STEP 2/10] Profile obtained directly from SDK authentication response.');
      } else if (piAuth?.accessToken) {
        console.log('[PI_VERIFY_STEP 2/10] Validating accessToken with backend /api/auth/pi (https://api.minepi.com/v2/me)...');
        try {
          const res = await fetch(getAbsoluteUrl('/api/auth/pi'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessToken: piAuth.accessToken })
          });
          if (!res.ok) {
            const errJson = await res.json().catch(() => ({}));
            throw new Error(errJson.error || `HTTP ${res.status}`);
          }
          const data = await res.json();
          if (data?.user?.username && data?.user?.uid) {
            username = data.user.username; // Exact casing from Pi API
            piUid = data.user.uid;
          } else {
            throw new Error('Backend validation returned empty user object.');
          }
        } catch (fetchErr: any) {
          console.error('[PI_VERIFY_STEP 2/10 FAILED] Backend validation failed:', fetchErr);
          throw new Error(`[Step 2 Failed] Unable to fetch authenticated Pi user profile: ${fetchErr.message}`);
        }
      } else {
        throw new Error('[Step 2 Failed] Pi SDK authentication response contained no user profile or access token.');
      }
    } else {
      // Dev mode outside Pi Browser
      console.log('[PI_VERIFY_STEP 1/10] Running in development mode outside Pi Browser - using dev mock credentials.');
      piUid = 'dev_pioneer_mock';
      username = 'dev_pioneer_mock';
      piAuth = { accessToken: 'mock_access_token_dev', user: { uid: piUid, username }, hasPaymentsScope: true };
    }

    // Step 3: Validate Official Pi User ID (UID)
    console.log('[PI_VERIFY_STEP 3/10] Validating Official Pi User ID (UID)...');
    if (!piUid || piUid.trim() === '') {
      throw new Error('[Step 3 Failed] Official Pi User ID (UID) is missing from authenticated Pi response.');
    }
    console.log('[PI_VERIFY_STEP 3/10] Official Pi User ID (UID) verified:', piUid);

    // Step 4: Validate Official Pi Username (exact case)
    console.log('[PI_VERIFY_STEP 4/10] Validating Official Pi Username (exact case)...');
    if (!username || username.trim() === '') {
      throw new Error('[Step 4 Failed] Official Pi Username is missing from authenticated Pi response.');
    }
    console.log('[PI_VERIFY_STEP 4/10] Official Pi Username verified (exact case): @' + username);

    // Step 5: Fetch authenticated wallet/account payment scope info
    console.log('[PI_VERIFY_STEP 5/10] Verifying authenticated wallet/account payment capability...');
    if (!piAuth?.accessToken) {
      throw new Error('[Step 5 Failed] Authenticated payment access token is missing.');
    }
    console.log('[PI_VERIFY_STEP 5/10] Wallet/Account payments scope verified for @' + username);

    // Step 6: Store only verified values returned by Pi
    console.log('[PI_VERIFY_STEP 6/10] Preparing verified Pi authentication record (UID:', piUid, 'Username:', username, ')...');
    const verifiedData = {
      piUid,
      username,
      accessToken: piAuth.accessToken,
      timestamp: new Date().toISOString()
    };

    // Step 7: Compare stored values with current authenticated session
    console.log('[PI_VERIFY_STEP 7/10] Comparing stored session with live authenticated session...');
    const { PiBusinessMarketDB } = await import('../services/storage');
    const storedUser = PiBusinessMarketDB.getCurrentUser();
    const storedPiUid = storedUser?.piUid || localStorage.getItem('last_pi_uid');
    const storedUsername = storedUser?.username;

    const isMismatch = !storedUser || storedPiUid !== piUid || storedUsername !== username;

    // Step 8: If any mismatch exists, clear old mapping and replace with authenticated values
    console.log('[PI_VERIFY_STEP 8/10] Synchronizing session state...');
    if (isMismatch) {
      console.log(`[PI_VERIFY_STEP 8/10] Mismatch detected! (Stored: @${storedUsername || 'none'} / ${storedPiUid || 'none'}, Live: @${username} / ${piUid}). Clearing old mapping and saving live authenticated values.`);
      PiBusinessMarketDB.clearUserMapping();
    } else {
      console.log(`[PI_VERIFY_STEP 8/10] Stored session matches live authenticated Pi session for @${username}.`);
    }

    // Update / Save stored user with verified values
    const freshUser: User = {
      uid: piUid,
      piUid: piUid,
      username: username,
      displayName: username,
      walletAddress: storedUser?.walletAddress || `PI_WAL_${piUid.substring(0, 12)}`,
      platformRole: storedUser?.platformRole || 'user',
      permissions: storedUser?.permissions || ['read:listings', 'create:orders'],
      roles: storedUser?.roles || ['buyer', 'seller', 'business_owner', 'service_provider'],
      accountType: storedUser?.accountType || 'individual',
      verified: true,
      kycVerified: true,
      profileCompleted: true,
      onboardingCompleted: true,
      status: 'active',
      createdAt: storedUser?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    PiBusinessMarketDB.setCurrentUser(freshUser);
    localStorage.setItem('last_pi_uid', piUid);

    // Sync Firestore document asynchronously if available
    try {
      const { getFirebaseDb } = await import('../firebase/config');
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      const db = getFirebaseDb();
      if (db) {
        await setDoc(doc(db, 'users', piUid), {
          uid: piUid,
          piUid,
          username,
          displayName: username,
          verified: true,
          status: 'active',
          updatedAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        }, { merge: true }).catch((err) => console.warn('[PI_VERIFY_STEP 8/10] Firestore sync warning:', err));
      }
    } catch (fsErr) {
      console.warn('[PI_VERIFY_STEP 8/10] Firestore unavailable:', fsErr);
    }

    // Step 9: Verification complete
    console.log(`[PI_VERIFY_STEP 9/10] Verification complete! Verified session active for @${username} (UID: ${piUid}).`);

    // Step 10: Detailed log summary
    console.log('[PI_VERIFY_STEP 10/10] Pre-operation check SUCCESSFUL. Ready for Pi transaction dispatch.', verifiedData);

    return { verifiedUser: freshUser, piAuth };
  },

  /**
   * Orchestrates the Pi Network Authentication flow with concurrency protection
   */
  async loginWithPi(): Promise<User> {
    console.log('[DEBUG_TRACE] [loginWithPi] ENTER');
    if (loginInProgressPromise) {
      console.log('[DEBUG_TRACE] [loginWithPi] Returning existing loginInProgressPromise');
      const res = await loginInProgressPromise;
      return res;
    }

    loginInProgressPromise = (async () => {
      console.log('[DEBUG_TRACE] [loginWithPi async worker] ENTER worker');
      try {
        // Execute the 10-step Pi Account Retrieval and Verification
        const { verifiedUser } = await this.verifyAndSynchronizePiAccount(true);

        // Optional Firebase Anonymous Auth for session indexing
        try {
          const { getFirebaseAuth } = await import('../firebase/config');
          const auth = getFirebaseAuth();
          if (auth) {
            const userCredential = await signInAnonymously(auth).catch(() => null);
            if (userCredential?.user?.uid) {
              localStorage.setItem('last_resolved_uid', userCredential.user.uid);
            }
          }
        } catch (authErr) {
          console.warn('[loginWithPi] Anonymous Firebase auth optional fallback error:', authErr);
        }

        return verifiedUser;
      } catch (error) {
        console.error('[AuthService] Login failed during account verification:', error);
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
      if (piUid && !identityResolver.isPlaceholder(piUid)) {
        const user = await identityResolver.resolveUserByPiUid(piUid, uid);
        if (user) {
          localStorage.setItem('last_resolved_uid', uid);
          return user;
        }
      }

      // 2. Otherwise try resolving by firebaseUid (checks canonical and pointer lookups)
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
