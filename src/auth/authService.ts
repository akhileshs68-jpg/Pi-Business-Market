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
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb } from '../firebase/config';
import { User, UserRole } from '../types';

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
   * Authenticates the user with specific scopes, with caching
   */
  async authenticatePi(scopes: string[]): Promise<any> {
    console.log('[AuthService] Pi.authenticate() called with scopes:', scopes);
    
    const includesPayments = scopes.includes('payments');

    if (piAuthResult && !includesPayments) {
      console.log('[AuthService] Returning cached Pi Authentication response');
      return piAuthResult;
    }

    if (piAuthPromise && !includesPayments) {
      console.log('[AuthService] Returning existing Pi Authentication promise');
      return piAuthPromise;
    }

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
        const isPiBrowser = true;
        if (typeof window !== 'undefined' && window.Pi && isPiBrowser) {
          console.log('[AuthService] Initiating window.Pi.authenticate...');
          
          // Wrap authenticate in a timeout to detect if it hangs forever
          const authPromise = window.Pi.authenticate(scopes, onIncompletePaymentFound);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Pi.authenticate timed out after 20 seconds")), 20000)
          );

          const piAuth = await Promise.race([authPromise, timeoutPromise]);
          
          console.log('[AuthService] Pi.authenticate resolved:', piAuth);
          piAuthResult = piAuth;
          return piAuth;
        } else {
          console.error('[AuthService] Pi SDK missing or not in Pi Browser');
          throw new Error("Pi SDK is not available. Please open in Pi Browser.");
        }
      } catch (err) {
        console.error('[AuthService] Pi.authenticate rejected:', err);
        piAuthPromise = null; // Allow retry on failure
        throw err;
      } finally {
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
        const isPiBrowser = true;
        const isPreviewDomain = window.location.hostname.includes('run.app') || 
                               window.location.hostname.includes('vercel.app') || 
                               window.location.hostname.includes('localhost');
        
        let piUid: string;
        let username: string;

        // Use real SDK when running in Pi Browser
        const hasPiSdk = typeof window !== 'undefined' && Boolean(window.Pi) && isPiBrowser;
        if (hasPiSdk) {
          try {
            let piAuth;
            if (import.meta.env.VITE_DEVELOPMENT_MODE === 'true') {
               console.log('[AuthService] Running in DEVELOPMENT_MODE, using mock auth');
               piAuth = { accessToken: "mock_token_123" };
            } else {
               piAuth = await this.authenticatePi(['username', 'payments']);
            }
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
        } else {
          throw new Error("Pi SDK is not available. Please open in Pi Browser.");
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

        // 5. Check/Create Firestore User with piUid persistence check
        const db = getFirebaseDb();
        const usersCol = collection(db, 'users');
        let effectiveUid = firebaseUid;
        let existingUserData: any = null;

        // First check by piUid
        if (piUid) {
          try {
            const piUidQuery = query(usersCol, where('piUid', '==', piUid));
            const piUidSnap = await getDocs(piUidQuery);
            if (!piUidSnap.empty) {
              const matchedDoc = piUidSnap.docs[0];
              effectiveUid = matchedDoc.id;
              existingUserData = matchedDoc.data();
            }
          } catch (qErr) {
            console.warn('[AuthService] piUid query failed, falling back to firebaseUid check:', qErr);
          }
        }

        // Force fixed UID for owner regardless of previous anonymous tokens
        const isOwnerPi = username === 'pi_pioneer_88';
        if (isOwnerPi) {
          effectiveUid = 'user_active_pioneer';
        }

        // If not found by piUid, check by firebaseUid
        if (!existingUserData && !isOwnerPi) {
          const userRef = doc(db, 'users', firebaseUid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            existingUserData = userSnap.data();
            effectiveUid = firebaseUid;
          }
        }
        
        // Also check if existingUserData exists under the forced owner UID
        if (!existingUserData && isOwnerPi) {
          const ownerRef = doc(db, 'users', effectiveUid);
          const ownerSnap = await getDoc(ownerRef);
          if (ownerSnap.exists()) {
            existingUserData = ownerSnap.data();
          }
        }

        const userRef = doc(db, 'users', effectiveUid);

        if (!existingUserData) {
          const isOwner = username === 'pi_pioneer_88';
          const newUser: any = {
            uid: effectiveUid,
            piUid,
            username,
            displayName: isOwner ? 'Pi Pioneer 88' : username, 
            walletAddress: '',
            photoUrl: '', // Will be updated if Pi provides image later
            roles: isOwner ? ['buyer', 'seller', 'business_owner', 'owner', 'superadmin'] : ['buyer'],
            activeRole: isOwner ? 'owner' : 'buyer',
            // Keeping these for backwards compatibility with existing types
            role: isOwner ? 'Super Admin' : 'Buyer', 
            accountType: isOwner ? 'business' : 'individual',
            verified: true,
            kycVerified: isOwner,
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

          return newUser as User;
        } else {
          const isOwner = username === 'pi_pioneer_88';
          
          let updateData: any = {
            lastLogin: serverTimestamp(),
            updatedAt: serverTimestamp(),
            piUid,
            username
          };
          
          if (isOwner) {
            const ownerRoles = ['buyer', 'seller', 'business_owner', 'owner', 'superadmin'];
            existingUserData.roles = ownerRoles;
            existingUserData.role = 'Super Admin';
            existingUserData.activeRole = 'owner';
            existingUserData.displayName = 'Pi Pioneer 88';
            existingUserData.accountType = 'business';
            
            updateData = {
              ...updateData,
              roles: ownerRoles,
              role: 'Super Admin',
              activeRole: 'owner',
              accountType: 'business',
              displayName: 'Pi Pioneer 88'
            };
          }

          // Update last login & owner enforcement
          await updateDoc(userRef, updateData);
          
          return {
            ...existingUserData,
            roles: existingUserData.roles || ['buyer'],
            activeRole: existingUserData.activeRole || 'buyer',
            uid: effectiveUid,
            piUid,
            username: isOwner ? 'pi_pioneer_88' : username,
            displayName: isOwner ? 'Pi Pioneer 88' : (existingUserData.displayName || username),
            createdAt: existingUserData.createdAt?.toDate?.()?.toISOString() || now,
            updatedAt: existingUserData.updatedAt?.toDate?.()?.toISOString() || now,
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
    console.log('[AuthService] getUserProfile() called for uid:', uid);
    try {
      const db = getFirebaseDb();
      const userRef = doc(db, 'users', uid);
      console.log('[AuthService] Fetching doc from Firestore...');
      const userSnap = await getDoc(userRef);
      console.log('[AuthService] Firestore getDoc finished. exists:', userSnap.exists());
      
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
      console.error('[AuthService] Get user profile failed:', error);
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

      const generatedUsername = firebaseUser.displayName?.toLowerCase().replace(/\s+/g, '_') || 'user_' + firebaseUid.slice(0, 5);
      const isOwnerEmail = firebaseUser.email === 'pioneer@pi-consensus.net' || firebaseUser.email === 'akhileshs68@gmail.com';
      const finalUsername = isOwnerEmail ? 'pi_pioneer_88' : generatedUsername;
      const isOwner = finalUsername === 'pi_pioneer_88';
      
      const effectiveUid = isOwner ? 'user_active_pioneer' : firebaseUid;
      const userRef = doc(db, 'users', effectiveUid);
      const userSnap = await getDoc(userRef);
      const now = new Date().toISOString();

      if (!userSnap.exists()) {
        const newUser: any = {
          uid: effectiveUid,
          piUid: 'google_' + firebaseUid,
          username: finalUsername,
          displayName: isOwner ? 'Pi Pioneer 88' : (firebaseUser.displayName || 'Enterprise User'),
          walletAddress: '',
          photoUrl: firebaseUser.photoURL || '',
          roles: isOwner ? ['buyer', 'seller', 'business_owner', 'owner', 'superadmin'] : ['buyer'],
          activeRole: isOwner ? 'owner' : 'buyer',
          role: isOwner ? 'Super Admin' : 'Buyer',
          accountType: isOwner ? 'business' : 'individual',
          verified: true,
          kycVerified: isOwner,
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

        return newUser as User;
      } else {
        const data = userSnap.data();
        const isOwnerEmail = firebaseUser.email === 'pioneer@pi-consensus.net' || firebaseUser.email === 'akhileshs68@gmail.com';
        const isOwner = data.username === 'pi_pioneer_88' || isOwnerEmail;
        
        const ownerUpdate = isOwner ? {
          roles: ['buyer', 'seller', 'business_owner', 'owner', 'superadmin'],
          role: 'Super Admin',
          activeRole: 'owner',
          accountType: 'business',
          displayName: 'Pi Pioneer 88',
          username: 'pi_pioneer_88'
        } : {};
        
        await updateDoc(userRef, {
          lastLogin: serverTimestamp(),
          updatedAt: serverTimestamp(),
          ...ownerUpdate
        });
        
        return {
          ...data,
          roles: isOwner ? ['buyer', 'seller', 'business_owner', 'owner', 'superadmin'] : (data.roles || ['buyer']),
          activeRole: isOwner ? 'owner' : (data.activeRole || 'buyer'),
          displayName: isOwner ? 'Pi Pioneer 88' : data.displayName,
          username: isOwner ? 'pi_pioneer_88' : data.username,
          uid: effectiveUid,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || now,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || now,
          lastLogin: now,
        } as User;
      }
    } catch (error: any) {
      console.error("[AuthService] Google Login failed:", error);
      if (import.meta.env.VITE_DEVELOPMENT_MODE === "true") {
        const mockUid = "user_active_pioneer";
        const now = new Date().toISOString();
        return {
          uid: mockUid,
          piUid: "google_" + mockUid,
          username: "pi_pioneer_88",
          displayName: "Pi Pioneer 88",
          walletAddress: "",
          photoUrl: "",
          roles: ["buyer", "seller", "business_owner", "owner", "superadmin"],
          activeRole: "owner",
          role: "Super Admin",
          accountType: "business",
          verified: true,
          kycVerified: true,
          createdAt: now,
          updatedAt: now,
          lastLogin: now,
          status: "active"
        } as User;
      }
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
      
      const sanitizedUpdates: any = {};
      Object.entries(updates).forEach(([k, v]) => {
        if (v !== undefined) {
          sanitizedUpdates[k] = v;
        }
      });
      
      if (userSnap.exists()) {
        await updateDoc(userRef, {
          ...sanitizedUpdates,
          updatedAt: serverTimestamp()
        });
      } else {
        await setDoc(userRef, {
          ...sanitizedUpdates,
          uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('[AuthService] Update user profile failed:', error);
      throw error;
    }
  }
};
