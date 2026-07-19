import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { authService } from './authService';
import { AuthContext } from './AuthContext';
import { isFirebaseConfigured } from '../firebase/config';
import { useNavigate } from "react-router-dom";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    if (!isFirebaseConfigured()) {
      setError('Firebase configuration is missing. Authentication services are currently offline.');
      setLoading(false);
      return;
    }
    
    // Listen for Firebase Auth state changes
    const unsubscribe = authService.onAuthStateChange(async (firebaseUser) => {
      if (!isMounted) return;

      
      
      try {
        if (firebaseUser) {
          const profile = await authService.getUserProfile(firebaseUser.uid);

          

          setUser(profile);
        } else {
          
          setUser(null);
        }
      } catch (err) {
        console.error('[AuthProvider] State change error:', err);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    });

    // If the auth provider is not yet configured, we should still allow 
    // the app to load (e.g. to show the login screen which explains the missing config)
    // We check if loading is still true after a short delay or if we can detect failure
    const timer = setTimeout(() => {
      if (isMounted && loading) {
        setLoading(false);
      }
    }, 2000);

    return () => {
      isMounted = false;
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const login = async () => {
    setLoading(true);
    setError(null);
    try {
      const loggedInUser = await authService.loginWithPi();
      setUser(loggedInUser);
    } catch (err: any) {
      setError(err.message || 'Pi Authentication failed');
      throw err;
    } finally {
      setLoading(false);
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
