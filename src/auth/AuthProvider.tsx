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
    authService.initPi().catch(err => console.warn('[AuthProvider] SDK Pre-init failed:', err));
    
    if (!isFirebaseConfigured()) {
      setError('Firebase configuration is missing. Authentication services are currently offline.');
      setLoading(false);
      return;
    }
    
    // Listen for Firebase Auth state changes
    const unsubscribe = authService.onAuthStateChange(async (firebaseUser) => {
      if (!isMounted) return;
      
      // If we are already processing a login (auto or manual), ignore state changes
      if (isProcessing.current) {
        console.log('[AuthProvider] Ignoring state change while processing');
        return;
      }

      try {
        if (firebaseUser) {
          console.log('[AuthProvider] Firebase user detected, fetching profile');
          isProcessing.current = true;
          const profile = await authService.getUserProfile(firebaseUser.uid);
          if (isMounted) {
            setUser(profile);
            setLoading(false);
            isInitialLoad.current = false;
          }
          isProcessing.current = false;
        } else {
          // If no user is logged in, we stay on the login screen
          // We do NOT attempt automatic Pi login here because Pi.authenticate requires a user gesture
          if (isInitialLoad.current) {
            console.log('[AuthProvider] No Firebase user on initial load');
            if (isMounted) {
              setLoading(false);
              isInitialLoad.current = false;
            }
          } else {
            console.log('[AuthProvider] User logged out');
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
    if (isProcessing.current && user) return user;
    if (isProcessing.current) throw new Error('Authentication already in progress');
    
    isProcessing.current = true;
    setLoading(true);
    setError(null);
    try {
      const loggedInUser = await authService.loginWithPi();
      setUser(loggedInUser);
      return loggedInUser;
    } catch (err: any) {
      setError(err.message || 'Pi Authentication failed');
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
    <AuthContext.Provider value={{ user, loading, error, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
