/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Briefcase,
  Building2,
  LayoutDashboard,
  Package,
  Store,
  ShoppingBag,
  Users,
  Megaphone,
  Sparkles,
  BarChart3,
  Calendar,
  Clock,
  CreditCard,
  ShieldAlert,
  User,
  ChevronDown,
  Truck,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { useBusiness } from '../../context/BusinessContext';
import { RoleResolver } from '../../services/identity/RoleResolver';

interface WorkspaceMenuProps {
  onNavigate?: (view: string, params?: any) => void;
  align?: 'left' | 'right';
  className?: string;
  closeParentMenu?: () => void;
}

export const WorkspaceMenu: React.FC<WorkspaceMenuProps> = ({
  onNavigate,
  align = 'right',
  className = '',
  closeParentMenu
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentBusiness } = useBusiness();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const roleResolver = new RoleResolver(user || null);
  const isSuperAdmin = roleResolver.isSuperAdmin();
  const activeRoleRaw = user?.activeRole || roleResolver.getCanonicalRole();
  const normalizedRole = (activeRoleRaw || '').toLowerCase().replace(/[\s_-]/g, '_');

  const handleNav = (route: string, view?: string) => {
    setIsOpen(false);
    if (closeParentMenu) closeParentMenu();
    if (onNavigate && view) {
      onNavigate(view);
    }
    navigate(route);
  };

  // Role-Aware Workspace Content Matrix
  const getRoleConfig = () => {
    switch (normalizedRole) {
      case 'seller':
        return {
          title: 'Seller Workspace',
          badge: 'Seller',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          items: [
            { label: 'Seller Dashboard', route: '/seller-dashboard', icon: LayoutDashboard, view: 'seller_dashboard' },
            { label: 'My Products', route: '/catalog', icon: Package, view: 'catalog' },
            { label: 'My Stores', route: '/seller-dashboard', icon: Store, view: 'seller_dashboard' },
            { label: 'My Sales / Orders', route: '/business-orders', icon: ShoppingBag, view: 'business_orders' },
            { label: 'My Customers', route: '/crm', icon: Users, view: 'crm' },
            { label: 'My Advertising', route: '/store-dashboard?tab=marketing', icon: Megaphone, view: 'marketing' },
            { label: 'My Campaigns', route: '/store-dashboard?tab=marketing', icon: Sparkles, view: 'marketing' },
            { label: 'My Reports', route: '/merchant-analytics', icon: BarChart3, view: 'analytics' },
          ]
        };

      case 'business_owner':
      case 'owner':
      case 'merchant':
        return {
          title: 'Business Workspace',
          badge: 'Business Owner',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          items: [
            { label: 'Business Dashboard', route: '/business-center', icon: LayoutDashboard, view: 'business_dashboard' },
            { label: 'My Business', route: '/business-center', icon: Building2, view: 'business_center' },
            { label: 'Stores', route: '/seller-dashboard', icon: Store, view: 'seller_dashboard' },
            { label: 'Products', route: '/catalog', icon: Package, view: 'catalog' },
            { label: 'Services', route: '/services', icon: Briefcase, view: 'services' },
            { label: 'Customers', route: '/crm', icon: Users, view: 'crm' },
            { label: 'Orders', route: '/business-orders', icon: ShoppingBag, view: 'business_orders' },
            { label: 'Advertising', route: '/store-dashboard?tab=marketing', icon: Megaphone, view: 'marketing' },
            { label: 'Reports', route: '/merchant-analytics', icon: BarChart3, view: 'analytics' },
          ]
        };

      case 'service_provider':
      case 'provider':
        return {
          title: 'Service Provider Workspace',
          badge: 'Provider',
          badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
          items: [
            { label: 'Service Dashboard', route: '/bookings', icon: LayoutDashboard, view: 'bookings' },
            { label: 'My Services', route: '/services', icon: Briefcase, view: 'services' },
            { label: 'My Bookings', route: '/bookings', icon: Calendar, view: 'bookings' },
            { label: 'Availability', route: '/services', icon: Clock, view: 'services' },
            { label: 'Earnings', route: '/bookings', icon: CreditCard, view: 'bookings' },
            { label: 'Advertising', route: '/store-dashboard?tab=marketing', icon: Megaphone, view: 'marketing' },
            { label: 'Reports', route: '/merchant-analytics', icon: BarChart3, view: 'analytics' },
          ]
        };

      case 'buyer':
      default:
        return {
          title: 'Buyer Workspace',
          badge: 'Buyer',
          badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
          items: [
            { label: 'My Orders', route: '/orders', icon: Clock, view: 'orders' },
            { label: 'My Purchases', route: '/orders', icon: ShoppingBag, view: 'orders' },
            { label: 'Order Tracking', route: '/orders', icon: Truck, view: 'orders' },
            { label: 'Profile', route: '/profile', icon: User, view: 'profile' },
          ]
        };
    }
  };

  const roleConfig = getRoleConfig();

  return (
    <div className={`relative inline-block ${className}`} ref={menuRef}>
      {/* TRIGGER CONTROL */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-violet-900/80 to-indigo-900/80 hover:from-violet-800 hover:to-indigo-800 border border-violet-500/40 rounded-xl text-xs font-bold text-white transition-all shadow-md hover:shadow-violet-500/10 cursor-pointer active:scale-95"
        id="nav_my_workspace_btn"
        title="My Workspace"
      >
        <Briefcase className="w-3.5 h-3.5 text-violet-300 shrink-0" />
        <span className="font-bold tracking-tight text-[11px] whitespace-nowrap">My Workspace</span>
        <ChevronDown className={`w-3 h-3 text-violet-300 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* DROPDOWN / POPUP MENU */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 w-64 bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-2xl p-2.5 shadow-2xl z-[99999] space-y-2`}
            id="nav_workspace_dropdown_menu"
          >
            {/* WORKSPACE HEADER */}
            <div className="px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block truncate">
                  {roleConfig.title}
                </span>
                <span className="text-[10px] font-semibold text-slate-200 block truncate mt-0.5">
                  {currentBusiness ? currentBusiness.businessName : `@${user?.username || 'Pioneer'}`}
                </span>
              </div>
              <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-md border shrink-0 ${roleConfig.badgeColor}`}>
                {roleConfig.badge}
              </span>
            </div>

            {/* SUPER ADMIN INDEPENDENT ACCESS POINT */}
            {isSuperAdmin && (
              <div className="p-2 bg-gradient-to-r from-violet-950/90 to-indigo-950/90 rounded-xl border border-violet-500/40 shadow-inner">
                <button
                  onClick={() => handleNav('/admin-console', 'admin')}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-black text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all cursor-pointer shadow-md"
                >
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                    <span>Admin Console</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-violet-200" />
                </button>
              </div>
            )}

            {/* MENU ITEMS */}
            <div className="space-y-0.5 max-h-72 overflow-y-auto scrollbar-thin">
              {roleConfig.items.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleNav(item.route, item.view)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-violet-600/20 hover:border-violet-500/30 border border-transparent transition-all cursor-pointer text-left group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className="w-4 h-4 text-violet-400 group-hover:scale-110 transition-transform shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
