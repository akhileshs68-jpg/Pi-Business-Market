/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface NavigationItem {
  id: string;
  label: string;
  iconName: string;
  view: string;
}

export const MAIN_NAVIGATION: NavigationItem[] = [
  { id: 'home', label: 'Home', iconName: 'Home', view: 'home' },
  { id: 'marketplace', label: 'Shop', iconName: 'Store', view: 'marketplace' },
  { id: 'orders', label: 'Orders', iconName: 'Clock', view: 'orders' },
  { id: 'business', label: 'My Business', iconName: 'Briefcase', view: 'my-business' },
  { id: 'tools', label: 'Tools', iconName: 'Wrench', view: 'tools' },
  { id: 'profile', label: 'Profile', iconName: 'User', view: 'profile' }
];

export const ROLE_NAVIGATION_MAP: Record<string, NavigationItem[]> = {
  default: MAIN_NAVIGATION
};
