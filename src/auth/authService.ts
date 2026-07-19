import { 
  signInAnonymously, 
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

export const authService = {
  /**
   * Orchestrates the Pi Network Authentication flow
   */
  async loginWithPi(): Promise<User> {
    try {
      const auth = getFirebaseAuth();
      const db = getFirebaseDb();

      // 1. Initialize Pi SDK
      // The user wants to await Pi.init() fully
      await window.Pi.init({ version: "2.0", sandbox: true });

      // 2. Pi SDK Authentication
      const scopes = ['username'];
      const onIncompletePaymentFound = (payment: any) => {
        console.log('Incomplete payment found:', payment);
      };

      const piAuth = await window.Pi.authenticate(scopes, onIncompletePaymentFound);
      const accessToken = piAuth.accessToken;

      // 3. Validate Token on Backend
      const response = await fetch('/api/auth/pi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessToken }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Backend validation failed');
      }

      const backendResult = await response.json();
      const validatedPiUser = backendResult.user;
      
      // 4. Firebase Anonymous Auth (to get a session)
      const userCredential = await signInAnonymously(auth);
      const firebaseUid = userCredential.user.uid;

      // 5. Check/Create Firestore User
      const userRef = doc(db, 'users', firebaseUid);
      const userSnap = await getDoc(userRef);

      const now = new Date().toISOString();

      if (!userSnap.exists()) {
        const newUser: User = {
          uid: firebaseUid,
          piUid: validatedPiUser.uid,
          username: validatedPiUser.username,
          displayName: validatedPiUser.username, 
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
          piUid: validatedPiUser.uid,
          username: validatedPiUser.username
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
    }
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
    } catch (error) {
      console.error('[AuthService] Get user profile failed:', error);
      return null;
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
