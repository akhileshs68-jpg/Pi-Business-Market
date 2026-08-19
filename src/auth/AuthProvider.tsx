import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { authService, isRealPiBrowser } from './authService';
import { AuthContext } from './AuthContext';
import { isFirebaseConfigured } from '../firebase/config';
import { EnterpriseIdentity, Permission } from '../services/identity/identityTypes';
import { identityService } from '../services/identity/identityService';
import { RoleResolver } from '../services/identity/RoleResolver';
import { PiBusinessMarketDB } from '../services/storage';

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

    // Pre-initialize Pi SDK on mount & auto-synchronize authenticated Pi account inside Pi Browser
    authService.initPi().then(() => {
      if (isRealPiBrowser()) {
        console.log('[AuthProvider] Inside Pi Browser - auto-verifying live authenticated Pi account...');
        authService.verifyAndSynchronizePiAccount(false)
          .then(({ verifiedUser }) => {
            if (isMounted && verifiedUser) {
              console.log('[AuthProvider] Auto Pi Account verification successful for @' + verifiedUser.username);
              setUser(verifiedUser);
              setProfile(verifiedUser);
              console.log('[VALUE_SHOWN_IN_UI]', { uid: verifiedUser.uid, username: verifiedUser.username });
              setLoading(false);
            }
          })
          .catch((err) => {
            console.warn('[AuthProvider] Auto Pi Account verification on mount notice:', err?.message || err);
            if (isMounted) {
              setUser(null);
              setProfile(null);
              setLoading(false);
            }
          });
      } else if ((import.meta as any).env.VITE_ENABLE_DEV_MOCK === 'true' || import.meta.env.DEV) {
        authService.verifyAndSynchronizePiAccount(false)
          .then(({ verifiedUser }) => {
            if (isMounted && verifiedUser) {
              setUser(verifiedUser);
              setProfile(verifiedUser);
              setLoading(false);
            } else if (isMounted) {
              setUser(null);
              setProfile(null);
              setLoading(false);
            }
          })
          .catch(() => {
            if (isMounted) {
              setUser(null);
              setProfile(null);
              setLoading(false);
            }
          });
      } else {
        if (isMounted) {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    }).catch((err) => {
      console.error("[AuthProvider] Pi SDK init failed:", err);
      if (isMounted) {
        setUser(null);
        setProfile(null);
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
          // Check if we have a live authenticated user from Pi SDK first
          const liveUser = authService.getLatestVerifiedUser();
          let fetchedProfile = liveUser;
          if (!fetchedProfile && (isRealPiBrowser() || (import.meta as any).env.VITE_ENABLE_DEV_MOCK === 'true')) {
            fetchedProfile = await authService.getUserProfile(firebaseUser.uid);
          }

          console.log('[DEBUG] [AuthProvider] Profile fetched:', fetchedProfile);
          if (fetchedProfile) {
            fetchedProfile = await migrateProfileIfNeeded(fetchedProfile);
          }
          if (isMounted) {
            if (fetchedProfile) {
              setProfile(fetchedProfile);
              setUser(fetchedProfile);
              console.log('[VALUE_SHOWN_IN_UI]', { uid: fetchedProfile.uid, username: fetchedProfile.username });
            } else {
              setUser(null);
              setProfile(null);
              if (!isRealPiBrowser() && (import.meta as any).env.VITE_ENABLE_DEV_MOCK !== 'true') {
                setError('Pi Browser authentication is required. No Pi account is available.');
              }
            }

            // Resolve the canonical identity platform document if active identity exists
            const { identityResolver } = await import('../services/identity/identityResolver');
            const activePiUid = fetchedProfile?.piUid;
            const activeUsername = fetchedProfile?.username || activePiUid;
            const activeDisplayName = (fetchedProfile?.displayName && fetchedProfile.displayName !== 'Pioneer') ? fetchedProfile.displayName : (activeUsername ?? undefined);

            if (activePiUid && activeUsername) {
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
            }

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
      console.log('[VALUE_SHOWN_IN_UI]', { uid: loggedInUser.uid, username: loggedInUser.username });
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
      const roleResolver = new RoleResolver(user);
      const isCallingAsAdmin = roleResolver.isSuperAdmin();

      // 1. Instantly update React context states for immediate UI reactivity
      setUser(prev => prev ? { ...prev, ...updates } : null);
      setProfile(prev => prev ? { ...prev, ...updates } : null);

      // 2. Instantly update local storage and memory states
      try {
        const storedUser = PiBusinessMarketDB.getCurrentUser();
        if (storedUser && (storedUser.uid === user.uid || storedUser.piUid === user.uid)) {
          PiBusinessMarketDB.setCurrentUser({ ...storedUser, ...updates });
        }
      } catch (err) {
        console.warn('[AuthProvider] Local database sync warning:', err);
      }

      // 3. Sync to Firestore in background; catch and log any remote write failures gracefully
      try {
        await authService.updateUserProfile(user.uid, updates, isCallingAsAdmin);
      } catch (fsErr) {
        console.warn('[AuthProvider] Background Firestore profile write warning:', fsErr);
      }
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
