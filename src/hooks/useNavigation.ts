/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { MAIN_NAVIGATION, NavigationItem } from '../config/navigation';
import { useAuth } from '../auth/useAuth';

export function useNavigation(): NavigationItem[] {
  const { user } = useAuth();
  
  return useMemo(() => {
    return MAIN_NAVIGATION;
  }, [user]);
}

export type { NavigationItem };
