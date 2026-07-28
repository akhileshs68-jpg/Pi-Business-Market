/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { ROLE_NAVIGATION_MAP, NavigationItem } from '../config/navigation';

export function useNavigation(activeRole?: string): NavigationItem[] {
  return useMemo(() => {
    const roleKey = activeRole ? String(activeRole).trim().toLowerCase() : 'buyer';

    // Direct match
    if (ROLE_NAVIGATION_MAP[roleKey]) {
      return ROLE_NAVIGATION_MAP[roleKey];
    }

    // Check for admin/super admin containing keywords
    if (roleKey.includes('admin')) {
      return ROLE_NAVIGATION_MAP['admin'] || ROLE_NAVIGATION_MAP['super admin'] || [];
    }

    // Check for service-oriented standard roles
    if (['service provider', 'teacher', 'doctor', 'freelancer'].includes(roleKey)) {
      return ROLE_NAVIGATION_MAP['service provider'] || [];
    }

    // Check for product-oriented standard roles or fallbacks
    if (['seller', 'manufacturer', 'farmer', 'artist', 'company'].includes(roleKey)) {
      return ROLE_NAVIGATION_MAP[roleKey] || ROLE_NAVIGATION_MAP['seller'] || [];
    }

    // Default fallback is buyer
    return ROLE_NAVIGATION_MAP['buyer'] || [];
  }, [activeRole]);
}
export type { NavigationItem };
