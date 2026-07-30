import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { authService } from './authService';
import { AuthContext } from './AuthContext';
import { isFirebaseConfigured } from '../firebase/config';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isInitialLoad = React.useRef(true);
  const isProcessing = React.useRef(false);

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
          console.log('[AuthProvider] Fetching profile for:', firebaseUser.uid);
          const profile = await authService.getUserProfile(firebaseUser.uid);
          console.log('[AuthProvider] Profile fetched:', profile);
          if (isMounted) {
            setUser(profile);
            setLoading(false);
            isInitialLoad.current = false;
          }
          isProcessing.current = false;
        } else {
          console.log('[AuthProvider] No user');
          // If no user is logged in, we stay on the login screen
          // We do NOT attempt automatic Pi login here because Pi.authenticate requires a user gesture
          if (isInitialLoad.current) {
            if (isMounted) {
              setLoading(false);
              isInitialLoad.current = false;
            }
          } else {
            setUser(null);
            setLoading(false);
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
      const loggedInUser = await authService.loginWithPi();
      console.log('[AuthProvider] authService.loginWithPi() resolved:', loggedInUser?.uid);
      setUser(loggedInUser);
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

  const loginWithGoogle = async (): Promise<User> => {
    if (isProcessing.current && user) return user;
    isProcessing.current = true;
    setLoading(true);
    setError(null);
    try {
      const loggedInUser = await authService.loginWithGoogle();
      setUser(loggedInUser);
      return loggedInUser;
    } catch (err: any) {
      setError(err.message || 'Google Authentication failed');
      throw err;
    } finally {
      setLoading(false);
      isProcessing.current = false;
      isInitialLoad.current = false;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
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
    } catch (err: any) {
      setError(err.message || 'Update failed');
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile: user, loading, error, login, loginWithGoogle, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
