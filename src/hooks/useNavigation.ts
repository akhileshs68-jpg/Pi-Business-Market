/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { MAIN_NAVIGATION, NavigationItem } from '../config/navigation';

export function useNavigation(activeRole?: string): NavigationItem[] {
  return useMemo(() => {
    return MAIN_NAVIGATION;
  }, [activeRole]);
}

export type { NavigationItem };
