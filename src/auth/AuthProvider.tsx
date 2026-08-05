import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { authService } from './authService';
import { AuthContext } from './AuthContext';
import { isFirebaseConfigured } from '../firebase/config';
import { EnterpriseIdentity, Permission } from '../services/identity/identityTypes';
import { identityService } from '../services/identity/identityService';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [identity, setIdentity] = useState<EnterpriseIdentity | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isInitialLoad = React.useRef(true);
  const isProcessing = React.useRef(false);

  const migrateProfileIfNeeded = async (profileObj: User): Promise<User> => {
    const updates: Partial<User> = {};
    if (profileObj.onboardingCompleted === undefined) {
      updates.onboardingCompleted = true;
    }
    if (profileObj.profileCompleted === undefined) {
      updates.profileCompleted = true;
    }
    if (Object.keys(updates).length > 0) {
      console.log('[AuthProvider] Migrating existing legacy profile. Missing fields updates:', updates);
      try {
        await authService.updateUserProfile(profileObj.uid, updates);
        return { ...profileObj, ...updates };
      } catch (err) {
        console.error('[AuthProvider] Migration database write failed:', err);
        return { ...profileObj, ...updates };
      }
    }
    return profileObj;
  };

  useEffect(() => {
    let isMounted = true;

    // Pre-initialize Pi SDK on mount
    authService.initPi().catch((err) => {
      console.error("[AuthProvider] Pi SDK init failed:", err);
      if (isMounted) {
        setError("Unable to connect to Pi Network. Please try again.");
        setLoading(false);
      }
    });
    
    if (!isFirebaseConfigured()) {
      setError('Firebase configuration is missing. Authentication services are currently offline.');
      setLoading(false);
      return;
    }
    
    // Listen for Firebase Auth state changes
    const unsubscribe = authService.onAuthStateChange(async (firebaseUser) => {
      console.log('[AuthProvider] Auth state change:', firebaseUser?.uid);
      if (!isMounted) return;
      
      // If we are already processing a login (auto or manual), ignore state changes
      if (isProcessing.current) {
        console.log('[AuthProvider] Ignoring state change, already processing');
        return;
      }

      try {
        if (firebaseUser) {
          isProcessing.current = true;
          console.log('[DEBUG] [AuthProvider] Authenticated UID:', firebaseUser.uid);
          const lastPiUid = localStorage.getItem('last_pi_uid');
          let fetchedProfile = await authService.getUserProfile(firebaseUser.uid, lastPiUid || undefined);
          console.log('[DEBUG] [AuthProvider] Profile fetched:', fetchedProfile);
          if (fetchedProfile) {
            fetchedProfile = await migrateProfileIfNeeded(fetchedProfile);
          }
          if (isMounted) {
            if (fetchedProfile) {
              setProfile(fetchedProfile);
              setUser(fetchedProfile);
            } else {
              // Construct a normalized profile on the fly using the identityResolver
              const { identityResolver } = await import('../services/identity/identityResolver');
              const mockPiUid = lastPiUid || 'pi_' + firebaseUser.uid.slice(0, 10);
              const mockUsername = firebaseUser.displayName?.toLowerCase().replace(/\s+/g, '_') || 'user_' + firebaseUser.uid.slice(0, 8);
              
              const freshUser = identityResolver.normalizeUserModel({
                uid: mockPiUid,
                piUid: mockPiUid,
                username: mockUsername,
                displayName: firebaseUser.displayName || 'Pioneer',
                roles: ['buyer'],
                status: 'active'
              }, firebaseUser.uid);
              
              setUser(freshUser);
              setProfile(freshUser);
              
              // Persist it
              const { getFirebaseDb } = await import('../firebase/config');
              const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
              setDoc(doc(getFirebaseDb(), 'users', mockPiUid), {
                ...freshUser,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                lastLogin: serverTimestamp()
              }, { merge: true }).catch(console.error);
            }

            // Resolve the canonical identity platform document
            const activePiUid = fetchedProfile?.piUid || lastPiUid || 'pi_' + firebaseUser.uid.slice(0, 10);
            const activeUsername = fetchedProfile?.username || firebaseUser.displayName?.toLowerCase().replace(/\s+/g, '_') || 'user_' + firebaseUser.uid.slice(0, 8);
            const activeDisplayName = fetchedProfile?.displayName || firebaseUser.displayName || 'Pioneer';

            identityService.resolveIdentity(
              firebaseUser.uid,
              activePiUid,
              activeUsername,
              activeDisplayName
            ).then(entIdentity => {
              if (isMounted) {
                setIdentity(entIdentity);
                setPermissions(entIdentity.permissions || []);
              }
            }).catch(e => {
              console.error('[AuthProvider] Identity resolution error:', e);
            });

            setLoading(false);
            isInitialLoad.current = false;
          }
          isProcessing.current = false;
        } else {
          console.log('[AuthProvider] No user');
          if (isMounted) {
            setUser(null);
            setProfile(null);
            setIdentity(null);
            setPermissions([]);
            setLoading(false);
            isInitialLoad.current = false;
          }
        }
      } catch (err) {
        console.error('[AuthProvider] State change error:', err);
        if (isMounted) {
          setError('Failed to load user profile');
          setLoading(false);
          isInitialLoad.current = false;
        }
        isProcessing.current = false;
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const login = async (): Promise<User> => {
    console.log('[AuthProvider] login() called. current state:', { isProcessing: isProcessing.current, user: user?.uid });
    if (isProcessing.current && user) {
      console.log('[AuthProvider] login() already processing and user exists, returning current user');
      return user;
    }
    if (isProcessing.current) {
      console.log('[AuthProvider] login() already processing, throwing error');
      throw new Error('Authentication already in progress');
    }
    
    isProcessing.current = true;
    setLoading(true);
    setError(null);
    try {
      console.log('[AuthProvider] Calling authService.loginWithPi()...');
      let loggedInUser = await authService.loginWithPi();
      console.log('[AuthProvider] authService.loginWithPi() resolved:', loggedInUser?.uid);
      if (loggedInUser) {
        loggedInUser = await migrateProfileIfNeeded(loggedInUser);
      }
      setUser(loggedInUser);
      setProfile(loggedInUser);
      return loggedInUser;
    } catch (err: any) {
      console.error('[AuthProvider] authService.loginWithPi() rejected:', err);
      setError(err.message || 'Pi Authentication failed');
      throw err;
    } finally {
      console.log('[AuthProvider] login() finally block. Clearing loading states.');
      setLoading(false);
      isProcessing.current = false;
      isInitialLoad.current = false;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      setUser(null);
      setProfile(null);
      setIdentity(null);
      setPermissions([]);
      await authService.logout();
    } catch (err: any) {
      setError(err.message || 'Logout failed');
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    try {
      await authService.updateUserProfile(user.uid, updates);
      setUser(prev => prev ? { ...prev, ...updates } : null);
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    } catch (err: any) {
      setError(err.message || 'Update failed');
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, identity, permissions, loading, error, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
