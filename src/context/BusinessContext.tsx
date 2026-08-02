/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../auth/useAuth';
import { businessService } from '../services/businessService';
import { storeService } from '../services/storeService';
import { Business, Store } from '../types';
import { RoleResolver } from '../services/identity/RoleResolver';
import { rbacEngine } from '../services/identity/rbacEngine';

export interface BusinessContextType {
  businesses: Business[];
  currentBusiness: Business | null;
  stores: Store[];
  currentStore: Store | null;
  currentRole: string;
  permissions: string[];
  isWorkspaceReady: boolean;
  isBusinessLoaded: boolean;
  setCurrentBusinessId: (id: string | null) => void;
  setCurrentStoreId: (id: string | null) => void;
  refreshWorkspace: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [isWorkspaceReady, setIsWorkspaceReady] = useState(false);
  
  // Track fetching states to prevent duplicate concurrent queries
  const [isFetching, setIsFetching] = useState(false);

  // Sync workspace from database
  const refreshWorkspace = useCallback(async () => {
    if (!user) {
      setBusinesses([]);
      setCurrentBusiness(null);
      setStores([]);
      setCurrentStore(null);
      setIsWorkspaceReady(true);
      return;
    }

    setIsFetching(true);
    try {
      // 1. Fetch businesses
      const fetchedBusinesses = await businessService.getMyBusinesses(user.uid);
      setBusinesses(fetchedBusinesses);

      // 2. Select current business
      let selectedBiz: Business | null = null;
      if (fetchedBusinesses.length > 0) {
        const cachedBizId = localStorage.getItem('pi_active_business_id');
        const matched = fetchedBusinesses.find(b => b.id === cachedBizId);
        selectedBiz = matched || fetchedBusinesses[0];
        localStorage.setItem('pi_active_business_id', selectedBiz.id);
      } else {
        localStorage.removeItem('pi_active_business_id');
      }
      setCurrentBusiness(selectedBiz);

      // 3. Fetch stores for the selected business
      if (selectedBiz) {
        const fetchedStores = await storeService.getStoresByBusiness(selectedBiz.id);
        setStores(fetchedStores);

        let selectedStore: Store | null = null;
        if (fetchedStores.length > 0) {
          const cachedStoreId = localStorage.getItem('pi_active_store_id');
          const matchedStore = fetchedStores.find(s => s.storeId === cachedStoreId);
          selectedStore = matchedStore || fetchedStores[0];
          localStorage.setItem('pi_active_store_id', selectedStore.storeId);
        } else {
          localStorage.removeItem('pi_active_store_id');
        }
        setCurrentStore(selectedStore);
      } else {
        setStores([]);
        setCurrentStore(null);
        localStorage.removeItem('pi_active_store_id');
      }
    } catch (err) {
      console.error('[BusinessProvider] Error syncing business workspace:', err);
    } finally {
      setIsFetching(false);
      setIsWorkspaceReady(true);
    }
  }, [user]);

  // Initial loads and dependency triggers
  useEffect(() => {
    refreshWorkspace();
  }, [refreshWorkspace]);

  // Handle active business change
  const setCurrentBusinessId = useCallback(async (id: string | null) => {
    if (!id) {
      setCurrentBusiness(null);
      setStores([]);
      setCurrentStore(null);
      localStorage.removeItem('pi_active_business_id');
      localStorage.removeItem('pi_active_store_id');
      return;
    }

    const matchedBiz = businesses.find(b => b.id === id);
    if (!matchedBiz) return;

    setCurrentBusiness(matchedBiz);
    localStorage.setItem('pi_active_business_id', id);

    try {
      const fetchedStores = await storeService.getStoresByBusiness(id);
      setStores(fetchedStores);

      let selectedStore: Store | null = null;
      if (fetchedStores.length > 0) {
        selectedStore = fetchedStores[0];
        localStorage.setItem('pi_active_store_id', selectedStore.storeId);
      } else {
        localStorage.removeItem('pi_active_store_id');
      }
      setCurrentStore(selectedStore);
    } catch (err) {
      console.error('[BusinessProvider] Error switching business stores:', err);
    }
  }, [businesses]);

  // Handle active store change
  const setCurrentStoreId = useCallback((id: string | null) => {
    if (!id) {
      setCurrentStore(null);
      localStorage.removeItem('pi_active_store_id');
      return;
    }

    const matchedStore = stores.find(s => s.storeId === id);
    if (matchedStore) {
      setCurrentStore(matchedStore);
      localStorage.setItem('pi_active_store_id', id);
    }
  }, [stores]);

  // Resolve role and permissions using RoleResolver and rbacEngine
  const currentRole = useMemo(() => {
    const roleResolver = new RoleResolver(user);
    return roleResolver.getCanonicalRole();
  }, [user]);

  const permissions = useMemo(() => {
    const roleResolver = new RoleResolver(user);
    const resolvedRoles = Array.from(roleResolver.getResolvedRoles());
    return rbacEngine.getPermissionsForRoles(resolvedRoles as any[]);
  }, [user]);

  const isBusinessLoaded = useMemo(() => {
    return currentBusiness !== null;
  }, [currentBusiness]);

  const value = useMemo(() => ({
    businesses,
    currentBusiness,
    stores,
    currentStore,
    currentRole,
    permissions,
    isWorkspaceReady,
    isBusinessLoaded,
    setCurrentBusinessId,
    setCurrentStoreId,
    refreshWorkspace
  }), [
    businesses,
    currentBusiness,
    stores,
    currentStore,
    currentRole,
    permissions,
    isWorkspaceReady,
    isBusinessLoaded,
    setCurrentBusinessId,
    setCurrentStoreId,
    refreshWorkspace
  ]);

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
};
