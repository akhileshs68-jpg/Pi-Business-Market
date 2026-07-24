import { 
  signInAnonymously, 
  signInWithPopup,
  GoogleAuthProvider,
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb } from '../firebase/config';
import { PiSdkSim } from '../services/piSdk';
import { User, UserRole } from '../types';

declare global {
  interface Window {
    Pi: any;
  }
}

let piInitPromise: Promise<void> | null = null;
let loginInProgressPromise: Promise<User> | null = null;

export const authService = {
  /**
   * Initializes the Pi SDK exactly once
   */
  async initPi(): Promise<void> {
    if (piInitPromise) return piInitPromise;

    piInitPromise = (async () => {
      try {
        if (!window.Pi) {
          return;
        }

        // Check if we are in a production Pi Browser environment
        const isPiBrowser = /PiBrowser/i.test(navigator.userAgent);
        const isPreviewDomain = window.location.hostname.includes('run.app') || 
                               window.location.hostname.includes('vercel.app') || 
                               window.location.hostname.includes('localhost') ||
                               window.location.hostname.includes('127.0.0.1');
        
        // ONLY use the real SDK if in Pi Browser AND NOT on a preview/dev domain
        // Real SDK will ALWAYS timeout on run.app/vercel.app domains because they aren't registered in the Pi Portal
        if (!isPiBrowser || isPreviewDomain) {
          return;
        }


        // Guard against the 120s SDK hang with a strict 15s timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Pi SDK init timeout - check domain whitelist')), 15000)
        );

        await Promise.race([
          window.Pi.init({ version: "2.0", sandbox: true }),
          timeoutPromise
        ]);

      } catch (err) {
        piInitPromise = null; // Clear lock on failure to allow retry
        throw err;
      }
    })();

    return piInitPromise;
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
        const auth = getFirebaseAuth();
        const db = getFirebaseDb();

        const isPiBrowser = /PiBrowser/i.test(navigator.userAgent);
        const isPreviewDomain = window.location.hostname.includes('run.app') || 
                               window.location.hostname.includes('vercel.app') || 
                               window.location.hostname.includes('localhost');
        
        let piUid: string;
        let username: string;

        // Use real SDK ONLY in production Pi Browser on registered domains
        if (isPiBrowser && !isPreviewDomain) {
          try {
            await this.initPi();
            const scopes = ['username'];
            const onIncompletePaymentFound = (payment: any) => {
            };

            const piAuth = await window.Pi.authenticate(scopes, onIncompletePaymentFound);
            const accessToken = piAuth.accessToken;

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
            console.error('[AuthService] Real Pi SDK failed, falling back to Simulator:', sdkErr);
            const simUser = await PiSdkSim.authenticate();
            piUid = simUser.uid;
            username = simUser.username;
          }
        } else {
          const simUser = await PiSdkSim.authenticate();
          piUid = simUser.uid;
          username = simUser.username;
        }

        // 4. Firebase Auth (to get a session)
        let firebaseUid: string;
        let isMockAuth = false;
        try {
          const userCredential = await signInAnonymously(auth);
          firebaseUid = userCredential.user.uid;
        } catch (authErr: any) {
          console.warn('[AuthService] Anonymous Auth failed, checking for local dev fallback:', authErr);
          if (authErr.code === 'auth/admin-restricted-operation' || authErr.code === 'auth/operation-not-allowed') {
            firebaseUid = 'mock_fb_' + piUid;
            isMockAuth = true;
          } else {
            throw authErr;
          }
        }

        const now = new Date().toISOString();

        if (isMockAuth) {
          const localUserKey = `mock_user_${firebaseUid}`;
          const localUserStr = localStorage.getItem(localUserKey);
          if (localUserStr) {
            try {
              return JSON.parse(localUserStr) as User;
            } catch (e) {
              // Ignore and regenerate
            }
          }

          const newUser: User = {
            uid: firebaseUid,
            piUid,
            username,
            displayName: username, 
            walletAddress: 'pi_wallet_' + Math.random().toString(36).substring(7),
            role: 'Buyer', 
            accountType: 'individual',
            verified: true,
            kycVerified: false,
            createdAt: now,
            updatedAt: now,
            lastLogin: now,
            status: 'active'
          };

          localStorage.setItem(localUserKey, JSON.stringify(newUser));
          return newUser;
        }

        // 5. Check/Create Firestore User
        const userRef = doc(db, 'users', firebaseUid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          const newUser: User = {
            uid: firebaseUid,
            piUid,
            username,
            displayName: username, 
            walletAddress: 'pi_wallet_' + Math.random().toString(36).substring(7),
            role: 'Buyer', 
            accountType: 'individual',
            verified: true,
            kycVerified: false,
            createdAt: now,
            updatedAt: now,
            lastLogin: now,
            status: 'active'
          };

          await setDoc(userRef, {
            ...newUser,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastLogin: serverTimestamp()
          });

          return newUser;
        } else {
          // Update last login
          await updateDoc(userRef, {
            lastLogin: serverTimestamp(),
            updatedAt: serverTimestamp(),
            piUid,
            username
          });
          
          const data = userSnap.data();
          return {
            ...data,
            uid: firebaseUid,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || now,
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || now,
            lastLogin: now,
          } as User;
        }
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
   * Fetches the current user profile from Firestore
   */
  async getUserProfile(uid: string): Promise<User | null> {
    try {
      const db = getFirebaseDb();
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        return {
          ...data,
          uid,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          lastLogin: data.lastLogin?.toDate?.()?.toISOString() || new Date().toISOString(),
        } as User;
      }
      return null;
    } catch (error: any) {
      if (error.code === 'unavailable' || error.message?.includes('offline')) {
      } else {
        console.error('[AuthService] Get user profile failed:', error);
      }
      return null;
    }
  },

  /**
   * Signs in with Google as a fallback or alternative
   */
  async loginWithGoogle(): Promise<User> {
    try {
      const auth = getFirebaseAuth();
      const db = getFirebaseDb();
      const provider = new GoogleAuthProvider();
      
      const userCredential = await signInWithPopup(auth, provider);
      const firebaseUid = userCredential.user.uid;
      const firebaseUser = userCredential.user;

      const userRef = doc(db, 'users', firebaseUid);
      const userSnap = await getDoc(userRef);
      const now = new Date().toISOString();

      if (!userSnap.exists()) {
        const newUser: User = {
          uid: firebaseUid,
          piUid: 'google_' + firebaseUid,
          username: firebaseUser.displayName?.toLowerCase().replace(/\s+/g, '_') || 'user_' + firebaseUid.slice(0, 5),
          displayName: firebaseUser.displayName || 'Enterprise User',
          walletAddress: 'pi_wallet_' + Math.random().toString(36).substring(7),
          role: 'Buyer',
          accountType: 'individual',
          verified: true,
          kycVerified: false,
          createdAt: now,
          updatedAt: now,
          lastLogin: now,
          status: 'active'
        };

        await setDoc(userRef, {
          ...newUser,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        });

        return newUser;
      } else {
        await updateDoc(userRef, {
          lastLogin: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        const data = userSnap.data();
        return {
          ...data,
          uid: firebaseUid,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || now,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || now,
          lastLogin: now,
        } as User;
      }
    } catch (error) {
      console.error('[AuthService] Google Login failed:', error);
      throw error;
    }
  },

  /**
   * Signs the user out
   */
  async logout(): Promise<void> {
    try {
      const auth = getFirebaseAuth();
      await signOut(auth);
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
      // Return a no-op unsubscribe function
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
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('[AuthService] Update user profile failed:', error);
      throw error;
    }
  }
};
