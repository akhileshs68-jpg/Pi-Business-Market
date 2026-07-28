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

export const ROLE_NAVIGATION_MAP: Record<string, NavigationItem[]> = {
  buyer: [
    { id: 'home', label: 'Home', iconName: 'Home', view: 'discovery' },
    { id: 'search', label: 'Search', iconName: 'Search', view: 'discovery' },
    { id: 'categories', label: 'Categories', iconName: 'Compass', view: 'catalog' },
    { id: 'products', label: 'Products', iconName: 'ShoppingBag', view: 'discovery' },
    { id: 'services', label: 'Services', iconName: 'Briefcase', view: 'jobs' },
    { id: 'stores', label: 'Stores', iconName: 'Store', view: 'discovery' },
    { id: 'cart', label: 'Cart', iconName: 'ShoppingBag', view: 'cart' },
    { id: 'orders', label: 'Orders', iconName: 'Clock', view: 'orders' },
    { id: 'inbox', label: 'Inbox', iconName: 'MessageSquare', view: 'inbox' },
    { id: 'profile', label: 'Profile', iconName: 'User', view: 'profile' }
  ],
  seller: [
    { id: 'home', label: 'Home', iconName: 'Home', view: 'discovery' },
    { id: 'search', label: 'Search', iconName: 'Search', view: 'discovery' },
    { id: 'workspace', label: 'My Workspace', iconName: 'LayoutDashboard', view: 'dashboard' },
    { id: 'products', label: 'Products', iconName: 'ShoppingBag', view: 'store-dashboard' },
    { id: 'inventory', label: 'Inventory', iconName: 'ClipboardList', view: 'inventory' },
    { id: 'orders', label: 'Orders', iconName: 'Clock', view: 'business-orders' },
    { id: 'finance', label: 'Finance', iconName: 'CreditCard', view: 'business-payments' },
    { id: 'inbox', label: 'Inbox', iconName: 'MessageSquare', view: 'inbox' },
    { id: 'profile', label: 'Profile', iconName: 'User', view: 'profile' }
  ],
  'service provider': [
    { id: 'home', label: 'Home', iconName: 'Home', view: 'discovery' },
    { id: 'search', label: 'Search', iconName: 'Search', view: 'discovery' },
    { id: 'workspace', label: 'My Workspace', iconName: 'LayoutDashboard', view: 'dashboard' },
    { id: 'services', label: 'Services', iconName: 'Briefcase', view: 'services' },
    { id: 'bookings', label: 'Bookings', iconName: 'ClipboardList', view: 'services' },
    { id: 'clients', label: 'Clients', iconName: 'Users', view: 'crm' },
    { id: 'inbox', label: 'Inbox', iconName: 'MessageSquare', view: 'inbox' },
    { id: 'profile', label: 'Profile', iconName: 'User', view: 'profile' }
  ],
  manufacturer: [
    { id: 'home', label: 'Home', iconName: 'Home', view: 'discovery' },
    { id: 'search', label: 'Search', iconName: 'Search', view: 'discovery' },
    { id: 'workspace', label: 'My Workspace', iconName: 'LayoutDashboard', view: 'dashboard' },
    { id: 'products', label: 'Products', iconName: 'ShoppingBag', view: 'store-dashboard' },
    { id: 'manufacturing', label: 'Manufacturing', iconName: 'Briefcase', view: 'dashboard' },
    { id: 'inventory', label: 'Inventory', iconName: 'ClipboardList', view: 'inventory' },
    { id: 'orders', label: 'Orders', iconName: 'Clock', view: 'business-orders' },
    { id: 'finance', label: 'Finance', iconName: 'CreditCard', view: 'business-payments' },
    { id: 'profile', label: 'Profile', iconName: 'User', view: 'profile' }
  ],
  farmer: [
    { id: 'home', label: 'Home', iconName: 'Home', view: 'discovery' },
    { id: 'search', label: 'Search', iconName: 'Search', view: 'discovery' },
    { id: 'workspace', label: 'My Workspace', iconName: 'LayoutDashboard', view: 'dashboard' },
    { id: 'farmProducts', label: 'Farm Products', iconName: 'ShoppingBag', view: 'store-dashboard' },
    { id: 'orders', label: 'Orders', iconName: 'Clock', view: 'business-orders' },
    { id: 'profile', label: 'Profile', iconName: 'User', view: 'profile' }
  ],
  admin: [
    { id: 'home', label: 'Home', iconName: 'Home', view: 'discovery' },
    { id: 'workspace', label: 'My Workspace', iconName: 'LayoutDashboard', view: 'dashboard' },
    { id: 'businesses', label: 'Businesses', iconName: 'Briefcase', view: 'business-dashboard' },
    { id: 'bi', label: 'BI', iconName: 'BarChart3', view: 'merchant-analytics' },
    { id: 'system', label: 'System', iconName: 'ShieldAlert', view: 'admin-analytics' },
    { id: 'ops', label: 'Ops', iconName: 'Terminal', view: 'admin-console' },
    { id: 'stores', label: 'Stores', iconName: 'Store', view: 'store-dashboard' },
    { id: 'orderHub', label: 'Order Hub', iconName: 'ClipboardList', view: 'business-orders' },
    { id: 'financeHub', label: 'Finance Hub', iconName: 'CreditCard', view: 'business-payments' },
    { id: 'logisticsHub', label: 'Logistics Hub', iconName: 'Truck', view: 'logistics' },
    { id: 'customer360', label: 'Customer 360', iconName: 'Users', view: 'crm' },
    { id: 'profile', label: 'Profile', iconName: 'User', view: 'profile' }
  ],
  'super admin': [
    { id: 'home', label: 'Home', iconName: 'Home', view: 'discovery' },
    { id: 'workspace', label: 'My Workspace', iconName: 'LayoutDashboard', view: 'dashboard' },
    { id: 'businesses', label: 'Businesses', iconName: 'Briefcase', view: 'business-dashboard' },
    { id: 'bi', label: 'BI', iconName: 'BarChart3', view: 'merchant-analytics' },
    { id: 'system', label: 'System', iconName: 'ShieldAlert', view: 'admin-analytics' },
    { id: 'ops', label: 'Ops', iconName: 'Terminal', view: 'admin-console' },
    { id: 'stores', label: 'Stores', iconName: 'Store', view: 'store-dashboard' },
    { id: 'orderHub', label: 'Order Hub', iconName: 'ClipboardList', view: 'business-orders' },
    { id: 'financeHub', label: 'Finance Hub', iconName: 'CreditCard', view: 'business-payments' },
    { id: 'logisticsHub', label: 'Logistics Hub', iconName: 'Truck', view: 'logistics' },
    { id: 'customer360', label: 'Customer 360', iconName: 'Users', view: 'crm' },
    { id: 'profile', label: 'Profile', iconName: 'User', view: 'profile' }
  ]
};
