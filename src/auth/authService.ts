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

export const authService = {
  /**
   * Orchestrates the Pi Network Authentication flow
   */
  async loginWithPi(): Promise<User> {
    try {
      const auth = getFirebaseAuth();
      const db = getFirebaseDb();

      // 1. Pi SDK Authentication
      const piAuth = await PiSdkSim.authenticate();
      
      // 2. Firebase Anonymous Auth (to get a session)
      const userCredential = await signInAnonymously(auth);
      const firebaseUid = userCredential.user.uid;

      // 3. Check/Create Firestore User
      const userRef = doc(db, 'users', firebaseUid);
      const userSnap = await getDoc(userRef);

      const now = new Date().toISOString();

      if (!userSnap.exists()) {
        const newUser: User = {
          uid: firebaseUid,
          piUid: piAuth.uid,
          username: piAuth.username,
          displayName: piAuth.username, // Default to username
          walletAddress: 'pi_wallet_' + Math.random().toString(36).substring(7), // Simulated
          role: 'Buyer', // Default role
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
