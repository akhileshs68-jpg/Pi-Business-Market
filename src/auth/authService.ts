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

let piInitPromise: Promise<void> | null = null;
let piAuthPromise: Promise<any> | null = null;
let piAuthResult: any = null;
let loginInProgressPromise: Promise<User> | null = null;

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
    if (typeof window === 'undefined') return;
    if (piInitPromise) return piInitPromise;

    piInitPromise = new Promise((resolve, reject) => {
      const initNow = () => {
        try {
          const isSandbox = (import.meta as any).env.VITE_PI_SANDBOX === 'true' || (import.meta as any).env.VITE_PI_SANDBOX === true;
          console.log('[AuthService] Pi.init() called with sandbox:', isSandbox);
          window.Pi.init({ version: "2.0", sandbox: isSandbox });
          resolve();
        } catch (err) {
          console.error('[AuthService] Pi.init() failed:', err);
          piInitPromise = null;
          reject(err);
        }
      };

      if (window.Pi) {
        initNow();
      } else {
        const checkPi = setInterval(() => {
          if (window.Pi) {
            clearInterval(checkPi);
            initNow();
          }
        }, 500);

        setTimeout(() => {
          clearInterval(checkPi);
          if (window.Pi) {
            initNow();
          } else {
            console.warn('[AuthService] Pi SDK load timeout, resolving anyway');
            resolve();
          }
        }, 3000);
      }
    });

    return piInitPromise;
  },

  /**
   * Authenticates the user with specific scopes, with caching and payments scope verification
   */
  async authenticatePi(requestedScopes: string[] = ['username', 'payments'], forceRefresh: boolean = false): Promise<any> {
    const scopes = Array.from(new Set([...requestedScopes, 'username', 'payments']));
    console.log('[AuthService] Pi.authenticate() called with scopes:', scopes, 'forceRefresh:', forceRefresh);
    
    if (!forceRefresh && piAuthResult && piAuthResult.hasPaymentsScope) {
      console.log('[PiAuth] Existing session with payments scope detected');
      return piAuthResult;
    }

    if (!forceRefresh && !piAuthResult) {
      try {
        const cachedStr = sessionStorage.getItem('pi_auth_session');
        if (cachedStr) {
          const parsed = JSON.parse(cachedStr);
          if (parsed && parsed.hasPaymentsScope) {
            piAuthResult = parsed;
            console.log('[PiAuth] Existing session with payments scope restored from sessionStorage');
            return piAuthResult;
          }
        }
      } catch (e) {
        console.error('[AuthService] Failed to parse cached session', e);
      }
    }

    if (piAuthPromise && !forceRefresh) {
      console.log('[AuthService] Returning existing Pi Authentication promise');
      return piAuthPromise;
    }

    console.log('[PiAuth] Authentication required natively');
    await this.initPi();
    
    const onIncompletePaymentFound = async (payment: any) => {
      console.log('[AuthService] Incomplete payment found during authentication:', payment);
      if (payment && payment.identifier) {
        try {
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          const auth = getFirebaseAuth();
          if (auth && auth.currentUser) {
            const token = await auth.currentUser.getIdToken().catch(() => null);
            if (token) headers['Authorization'] = `Bearer ${token}`;
          }
          await fetch('/api/payments/incomplete', {
            method: 'POST',
            headers,
            body: JSON.stringify({ payment })
          });
          console.log('[AuthService] Incomplete payment reported to server successfully');
        } catch (err) {
          console.error('[AuthService] Error notifying server of incomplete payment:', err);
        }
      }
    };

    piAuthPromise = (async () => {
      try {
        const isPiBrowser = typeof window !== 'undefined' && typeof window.Pi !== 'undefined';
        const isPreviewDomain = typeof window !== 'undefined' && !import.meta.env.PROD && (
          window.location.hostname.includes('run.app') || 
          window.location.hostname.includes('vercel.app') || 
          window.location.hostname.includes('localhost') ||
          window.location.hostname.includes('127.0.0.1')
        );
        const isPiBrowserApp = typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.includes('PiBrowser');

        if (!isPiBrowser && isPreviewDomain && !isPiBrowserApp) {
          console.log('[AuthService] Running in preview/dev environment outside PiBrowser app, using mock Pi auth result');
          const mockAuth = {
            accessToken: 'mock_access_token_pioneer_123',
            user: {
              uid: 'mock_pi_uid_123',
              username: 'pi_pioneer_88'
            },
            hasPaymentsScope: true
          };
          piAuthResult = mockAuth;
          try {
            sessionStorage.setItem('pi_auth_session', JSON.stringify(mockAuth));
          } catch (e) {}
          return mockAuth;
        }

        if (isPiBrowser) {
          console.log('[AuthService] Initiating native window.Pi.authenticate with scopes:', scopes);
          
          const result = await window.Pi.authenticate(scopes, onIncompletePaymentFound);
          console.log('[AuthService] window.Pi.authenticate() resolved successfully natively:', result);
          
          const piAuth = {
            ...result,
            hasPaymentsScope: true
          };

          piAuthResult = piAuth;
          try {
            sessionStorage.setItem('pi_auth_session', JSON.stringify(piAuth));
          } catch(e) {
            console.error('[AuthService] Failed to save session', e);
          }
          return piAuth;
        } else {
          console.error('[AuthService] Pi SDK missing or not in Pi Browser');
          throw new Error("Pi Payments are available only inside Pi Browser.");
        }
      } catch (err) {
        console.error('[AuthService] Pi.authenticate rejected:', err);
        piAuthResult = null;
        try { sessionStorage.removeItem('pi_auth_session'); } catch(e) {}
        throw err;
      } finally {
        piAuthPromise = null;
        console.log('[AuthService] Pi.authenticate execution finished');
      }
    })();

    return piAuthPromise;
  },

  /**
   * Orchestrates the Pi Network Authentication flow with concurrency protection
   */
  async loginWithPi(): Promise<User> {
    if (loginInProgressPromise) {
      return loginInProgressPromise;
    }

    loginInProgressPromise = (async () => {
      try {
        const isPiBrowser = typeof window !== 'undefined' && typeof window.Pi !== 'undefined';
        const isPreviewDomain = window.location.hostname.includes('run.app') || 
                               window.location.hostname.includes('vercel.app') || 
                               window.location.hostname.includes('localhost');
        
        let piUid: string;
        let username: string;

        // Use mock SDK when running in development or preview environments
        if (isPreviewDomain) {
          console.log('[AuthService] Running in preview/dev environment');
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
          // Official Pi SDK Login
          if (!isPiBrowser) {
            throw new Error("Pi SDK is not available. Please open in Pi Browser.");
          }
          try {
            const piAuth = await this.authenticatePi(['username', 'payments']);
            const accessToken = piAuth.accessToken;
            console.log('[AuthService] Sending accessToken to backend /api/auth/pi...');

            const response = await fetch('/api/auth/pi', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ accessToken }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Backend validation failed');
            }

            const backendResult = await response.json();
            piUid = backendResult.user.uid;
            username = backendResult.user.username;
          } catch (sdkErr) {
            console.error('[AuthService] Real Pi SDK failed:', sdkErr);
            throw sdkErr;
          }
        }

        // 4. Firebase Auth (to get a session)
        let firebaseUid: string;
        try {
          const { getFirebaseAuth } = await import('../firebase/config');
          const auth = getFirebaseAuth();
          if (!auth) throw new Error('Firebase Auth unavailable');
          
          const userCredential = await signInAnonymously(auth);
          firebaseUid = userCredential.user.uid;
        } catch (authErr: any) {
          console.error('[AuthService] Anonymous Auth failed:', authErr);
          throw authErr;
        }

        const now = new Date().toISOString();

        // 5. Check/Create/Migrate Firestore User profile under canonical firebaseUid
        const db = getFirebaseDb();
        const usersCol = collection(db, 'users');
        const canonicalRef = doc(db, 'users', firebaseUid);
        const canonicalSnap = await getDoc(canonicalRef);

        let existingUserData: any = null;
        let legacyDocId: string | null = null;

        if (canonicalSnap.exists()) {
          existingUserData = canonicalSnap.data();
        } else {
          // Look for legacy document to migrate ONE-TIME to users/{firebaseUid}
          if (piUid) {
            try {
              const piSnap = await getDocs(query(usersCol, where('piUid', '==', piUid)));
              if (!piSnap.empty) {
                legacyDocId = piSnap.docs[0].id;
                existingUserData = piSnap.docs[0].data();
              }
            } catch (e) {
              console.warn('[AuthService] Query by piUid failed:', e);
            }
          }

          if (!existingUserData && username) {
            try {
              const userSnap = await getDocs(query(usersCol, where('username', '==', username)));
              if (!userSnap.empty) {
                legacyDocId = userSnap.docs[0].id;
                existingUserData = userSnap.docs[0].data();
              }
            } catch (e) {
              console.warn('[AuthService] Query by username failed:', e);
            }
          }

          if (!existingUserData && (username === 'pi_pioneer_88' || piUid === 'mock_pi_uid_123')) {
            const pioneerSnap = await getDoc(doc(db, 'users', 'user_active_pioneer'));
            if (pioneerSnap.exists()) {
              legacyDocId = pioneerSnap.id;
              existingUserData = pioneerSnap.data();
            }
          }
        }

        const isOwner = username === 'pi_pioneer_88' || existingUserData?.roles?.includes('superadmin') || existingUserData?.roles?.includes('super_admin');
        const defaultRoles = isOwner ? ['buyer', 'seller', 'business_owner', 'owner', 'superadmin'] : (existingUserData?.roles || ['buyer']);
        const displayName = existingUserData?.displayName || (isOwner ? 'Pi Pioneer 88' : username);

        let finalUserData: any;

        if (!existingUserData) {
          // Create brand new user document at users/{firebaseUid}
          finalUserData = {
            uid: firebaseUid,
            firebaseUid,
            piUid,
            username,
            displayName,
            roles: defaultRoles,
            accountType: isOwner ? 'business' : 'individual',
            verified: true,
            kycVerified: Boolean(isOwner),
            profileCompleted: true,
            onboardingCompleted: true,
            lastResolvedUid: firebaseUid,
            createdAt: now,
            updatedAt: now,
            lastLogin: now,
            status: 'active'
          };

          const newUserData = removeUndefinedFields({
            ...finalUserData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastLogin: serverTimestamp()
          });

          await setDoc(canonicalRef, newUserData);
        } else {
          // Perform ONE-TIME migration or update canonical document users/{firebaseUid}
          finalUserData = {
            ...existingUserData,
            uid: firebaseUid,
            firebaseUid,
            piUid: piUid || existingUserData.piUid,
            username: username || existingUserData.username,
            displayName,
            roles: Array.from(new Set([...(existingUserData.roles || []), ...defaultRoles])),
            kycVerified: Boolean(existingUserData.kycVerified ?? isOwner ?? false),
            profileCompleted: true,
            onboardingCompleted: true,
            lastResolvedUid: firebaseUid,
            ...(legacyDocId ? { migratedFromUid: legacyDocId } : {}),
            updatedAt: now,
            lastLogin: now
          };

          const updatedUserData = removeUndefinedFields({
            ...finalUserData,
            updatedAt: serverTimestamp(),
            lastLogin: serverTimestamp()
          });

          await setDoc(canonicalRef, updatedUserData, { merge: true });
        }

        localStorage.setItem('last_resolved_uid', firebaseUid);
        if (piUid) localStorage.setItem('last_pi_uid', piUid);

        // Sync with Enterprise Identity Platform
        const identity = await identityService.resolveIdentity(firebaseUid, piUid, username, displayName);

        return {
          ...finalUserData,
          uid: firebaseUid,
          platformRole: identity.roles[0] || 'buyer',
          permissions: identity.permissions,
        } as User;
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
    console.log('[AuthService] getUserProfile() for uid:', uid);
    try {
      const db = getFirebaseDb();
      const canonicalRef = doc(db, 'users', uid);
      const canonicalSnap = await getDoc(canonicalRef);

      if (canonicalSnap.exists()) {
        const data = canonicalSnap.data();
        localStorage.setItem('last_resolved_uid', uid);
        return {
          ...data,
          uid,
          profileCompleted: true,
          onboardingCompleted: true,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          lastLogin: data.lastLogin?.toDate?.()?.toISOString() || new Date().toISOString(),
        } as User;
      }

      // If canonical document users/{uid} does NOT exist yet, check if there is an exact match by piUid
      // ONLY if piUid belongs specifically to this user (not generic/mock values)
      if (piUid && piUid !== 'user_active_pioneer_pi' && piUid !== 'mock_pi_uid_123') {
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const piSnap = await getDocs(query(collection(db, 'users'), where('piUid', '==', piUid)));
        if (!piSnap.empty) {
          const matchedDoc = piSnap.docs[0];
          const matchedData = matchedDoc.data();
          if (matchedData.uid === uid || matchedData.firebaseUid === uid) {
            return {
              ...matchedData,
              uid,
              createdAt: matchedData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastLogin: new Date().toISOString()
            } as User;
          }
        }
      }

      // DO NOT fallback to last_resolved_uid or user_active_pioneer!
      // Multi-tenant privacy invariant: Return null so AuthProvider can construct a fresh profile for this UID.
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

      try { sessionStorage.removeItem('pi_auth_session'); } catch (e) {}
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
