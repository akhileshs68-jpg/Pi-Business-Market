/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { MAIN_NAVIGATION, NavigationItem } from '../config/navigation';
import { RoleResolver } from '../services/identity/RoleResolver';
import { useAuth } from '../auth/useAuth';

const BUSINESS_ITEMS: NavigationItem[] = [
  { id: 'marketing-center', label: 'Marketing Center', iconName: 'Sparkles', view: 'business-center?tab=marketing' },
  { id: 'business-wallet', label: 'Business Wallet', iconName: 'CreditCard', view: 'merchant-payments' },
  { id: 'products', label: 'Products', iconName: 'ShoppingBag', view: 'seller-dashboard' },
  { id: 'services', label: 'Services', iconName: 'Briefcase', view: 'services' },
  { id: 'business-orders', label: 'Orders', iconName: 'ClipboardList', view: 'business-orders' },
  { id: 'customers', label: 'Customers', iconName: 'Users', view: 'crm' },
  { id: 'verification', label: 'Verification', iconName: 'ShieldAlert', view: 'business-center?tab=verification' }
];

export function useNavigation(): NavigationItem[] {
  const { user } = useAuth();
  
  return useMemo(() => {
    const roleResolver = new RoleResolver(user);
    const isSuperAdmin = roleResolver.isSuperAdmin();
    const isSeller = roleResolver.isSeller();
    
    // Filter the primary navigation list
    const primaryNav = MAIN_NAVIGATION.filter(item => {
      if (item.id === 'admin' && !isSuperAdmin) {
        return false;
      }
      return true;
    });

    // If they are a seller/business user, append or integrate the specialized business modules
    if (isSeller) {
      return [...primaryNav, ...BUSINESS_ITEMS];
    }

    return primaryNav;
  }, [user]);
}

export type { NavigationItem };
