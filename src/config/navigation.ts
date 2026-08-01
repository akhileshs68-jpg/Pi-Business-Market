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
  { id: 'marketplace', label: 'Marketplace', iconName: 'Store', view: 'marketplace' },
  { id: 'orders', label: 'Orders', iconName: 'Clock', view: 'orders' },
  { id: 'wishlist', label: 'Wishlist', iconName: 'Heart', view: 'wishlist' },
  { id: 'messages', label: 'Messages', iconName: 'MessageSquare', view: 'inbox' },
  { id: 'wallet', label: 'Wallet', iconName: 'Wallet', view: 'wallet' },
  { id: 'account', label: 'My Account', iconName: 'User', view: 'profile' },
  { id: 'business', label: 'Business Center', iconName: 'Briefcase', view: 'business-center' },
  { id: 'settings', label: 'Settings', iconName: 'Settings', view: 'settings' },
  { id: 'help', label: 'Help', iconName: 'HelpCircle', view: 'help' }
];

// Keeping this around just to prevent immediate build breaks, but it will return the same menu
export const ROLE_NAVIGATION_MAP: Record<string, NavigationItem[]> = {
  default: MAIN_NAVIGATION
};
