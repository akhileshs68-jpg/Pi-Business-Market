/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  Wallet,
  Bell,
  Store,
  Sparkles,
  ChevronDown,
  RefreshCw,
  PlusCircle,
  Clock,
  User,
  Home,
  Heart,
  Compass,
  CreditCard,
  MessageSquare,
  Shield,
  Menu,
  X,
  Briefcase,
  LayoutDashboard,
  Search,
  ClipboardList,
  Truck,
  Users,
  Award,
  BarChart3,
  ShieldAlert,
  Terminal,
  BookOpen,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../auth/useAuth';
import { User as UserType, Notification } from '../types';
import { PiBusinessMarketDB } from '../services/storage';
import { CartDrawer } from './cart/CartDrawer';
import { ROLES_CONFIG } from '../auth/authService';
import { useNavigation } from '../hooks/useNavigation';

import { NotificationCenter } from './NotificationCenter';

interface NavbarProps {
  currentUser?: UserType | null;
  currentView: string;
  onNavigate: (view: string, params?: any) => void;
  cartCount: number;
  walletBalance: number;
  onWalletUpdate: (newBalance: number) => void;
  onToggleCart: () => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  onSearchSubmit?: (val: string) => void;
}

export default function Navbar({
  currentUser,
  currentView,
  onNavigate,
  cartCount,
  walletBalance,
  onWalletUpdate,
  onToggleCart,
  searchQuery,
  onSearchChange,
  onSearchSubmit
}: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [localSearchVal, setLocalSearchVal] = useState('');
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { logout } = useAuth();
  const [faucetLoading, setFaucetLoading] = useState(false);

  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const navItems = useNavigation();

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, React.ComponentType<any>> = {
      Home,
      Search,
      Compass,
      ShoppingBag,
      Briefcase,
      Store,
      Clock,
      MessageSquare,
      User,
      LayoutDashboard,
      ClipboardList,
      CreditCard,
      BarChart3,
      ShieldAlert,
      Terminal,
      Truck,
      Users,
      Award,
      BookOpen,
      Sparkles
    };
    return icons[iconName] || Compass;
  };

  const getBottomNavItems = () => {
    return [
      { id: 'home', label: 'Home', iconName: 'Home', view: 'home' },
      { id: 'marketplace', label: 'Marketplace', iconName: 'Store', view: 'discovery' },
      { id: 'orders', label: 'Orders', iconName: 'Clock', view: 'orders' },
      { id: 'inbox', label: 'Inbox', iconName: 'MessageSquare', view: 'inbox' },
      { id: 'account', label: 'Profile', iconName: 'User', view: 'profile' }
    ];
  };

    const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/inbox') return 'inbox';
    if (path === '/profile') return 'account';
    if (path.startsWith('/orders') || path.startsWith('/business-orders')) return 'orders';
    if (path.startsWith('/discovery')) return 'marketplace';
    if (path === '/' || path === '/home') return 'home';

    // Fallbacks using currentView
    if (currentView === 'inbox') return 'inbox';
    if (currentView === 'profile') return 'profile';
    if (
      currentView === 'store-dashboard' || 
      currentView === 'dashboard' || 
      currentView === 'catalog' || 
      currentView === 'business_dashboard'
    ) {
      return 'sell';
    }
    if (currentView === 'discovery') {
      const hasQuery = searchQuery && searchQuery.trim() !== '';
      return hasQuery ? 'discover' : 'home';
    }
    return 'home';
  };

  // Lock scroll, keyboard capture, and restore scroll position
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const scrollY = window.scrollY;
    const originalStyle = {
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
      overflow: document.body.style.overflow,
    };

    // Prevent background scrolling completely without jumps
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        return;
      }

      if (e.key === 'Tab') {
        if (!mobileMenuRef.current) return;
        const focusable = mobileMenuRef.current.querySelectorAll(
          'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]'
        );
        const first = focusable[0] as HTMLElement;
        const last = focusable[focusable.length - 1] as HTMLElement;

        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Auto focus first item
    setTimeout(() => {
      if (mobileMenuRef.current) {
        const focusable = mobileMenuRef.current.querySelectorAll(
          'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]'
        );
        if (focusable.length > 0) {
          (focusable[0] as HTMLElement).focus();
        }
      }
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.position = originalStyle.position;
      document.body.style.top = originalStyle.top;
      document.body.style.width = originalStyle.width;
      document.body.style.overflow = originalStyle.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [isMobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-900 shadow-lg shadow-violet-950/5 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2.5 sm:gap-4">
        
        {/* LOGO SECTION */}
        <div 
          onClick={() => onNavigate('discovery')}
          className="flex items-center gap-1.5 sm:gap-2 cursor-pointer group select-none shrink-0"
          id="nav_logo_container"
        >
          <div className="w-7.5 h-7.5 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-violet-500/10 group-hover:scale-105 transition-transform border border-violet-500/20">
            <span className="font-bold text-sm sm:text-lg tracking-wider">π</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="font-sans font-bold text-xs sm:text-base text-slate-100 tracking-tight leading-none flex items-center gap-1">
              <span className="truncate">Pi Marketplace</span>
              <span className="text-[7px] sm:text-[9px] font-mono font-bold uppercase px-1 py-0.5 bg-amber-500/10 text-amber-400 rounded-md border border-amber-500/20">
                SB
              </span>
            </h1>
            <p className="hidden sm:block text-[10px] text-slate-500 font-medium mt-1">Decentralized Web3 Commerce</p>
          </div>
        </div>

        {/* UNIVERSAL SEARCH BAR CENTER */}
        <div className="flex items-center flex-1 mx-1 sm:mx-4" id="nav_center_search">
          <div className="relative w-full group">
            <input
              type="text"
              value={searchQuery !== undefined ? searchQuery : localSearchVal}
              onChange={(e) => {
                if (onSearchChange) {
                  onSearchChange(e.target.value);
                } else {
                  setLocalSearchVal(e.target.value);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = searchQuery !== undefined ? searchQuery : localSearchVal;
                  if (onSearchSubmit) {
                    onSearchSubmit(val);
                  } else {
                    onNavigate('discovery');
                    navigate('/discovery', { state: { query: val } });
                  }
                }
              }}
              onClick={() => {
                if (currentView !== 'discovery') {
                  onNavigate('discovery');
                }
              }}
              placeholder="Search products..."
              className="w-full bg-slate-900 border border-slate-850 focus:border-violet-500 rounded-xl py-1.5 pl-7 sm:pl-9 pr-3 text-[10px] sm:text-xs font-bold text-white placeholder:text-slate-600 outline-none transition-all shadow-inner"
            />
            <Search className="absolute left-2.5 top-2.5 sm:left-3 sm:top-3 w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500" />
          </div>
        </div>

        {/* NAVIGATION / CONTROL TOOLS RIGHT */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          
          {/* ACTIVE NOTIFICATIONS BUTTON */}
          <NotificationCenter />

          {/* VISUAL CART TOGGLE */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-violet-600 text-white hover:bg-violet-500 transition-all relative flex items-center gap-1 sm:gap-1.5 cursor-pointer shadow-md border border-violet-500/30"
            id="nav_cart_button"
          >
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {cartCount > 0 && (
              <span className="text-[8px] sm:text-[10px] font-bold font-mono px-1 sm:px-1.5 py-0.5 bg-white text-violet-950 rounded-md">
                {cartCount}
              </span>
            )}
          </button>

          {/* PROFILE ICON (OPENS PROFILE PAGE) */}
          <button
            onClick={() => onNavigate('profile')}
            className={`p-0.5 rounded-full border transition-all cursor-pointer ${
              currentView === 'profile' ? 'bg-violet-600 border-violet-500' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
            title="My Profile"
          >
            <div className="w-6.5 h-6.5 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-slate-950 flex items-center justify-center">
              {currentUser?.photoUrl ? (
                <img 
                  src={currentUser.photoUrl} 
                  alt={currentUser.displayName || 'Pioneer'} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User className="w-3.5 h-3.5 text-violet-400" />
              )}
            </div>
          </button>

        </div>
      </div>

      {/* MOBILE DASHBOARD EXPANSION SYSTEM - REDESIGNED FOR ENT-GRADE MOBILE UX VIA PORTAL */}
      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              {/* High-Fidelity Blurred & Darkened Backdrop Overlay */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  background: 'rgba(0,0,0,0.55)',
                  backdropFilter: 'blur(12px)',
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '100vw',
                  height: '100dvh',
                  zIndex: 99999
                }}
                className="cursor-pointer pointer-events-auto"
                id="mobile_nav_backdrop"
              />

              {/* Full-Screen Hardware-Accelerated Drawer with swipe & drag physics */}
              <motion.div 
                ref={mobileMenuRef}
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 26, stiffness: 210 }}
                drag="x"
                dragConstraints={{ left: 0, right: 300 }}
                dragElastic={{ left: 0.05, right: 0.85 }}
                onDragEnd={(_, info) => {
                  // Close on swipe right or swipe down
                  if (info.offset.x > 80 || info.velocity.x > 400 || info.offset.y > 80 || info.velocity.y > 400) {
                    setIsMobileMenuOpen(false);
                  }
                }}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '100vw',
                  height: '100dvh',
                  zIndex: 100000,
                }}
                className="bg-[#080d19]/95 backdrop-blur-md border-r border-slate-900 overflow-y-auto flex flex-col justify-between pt-safe pb-safe pointer-events-auto"
                id="mobile_nav_drawer"
              >
                {/* Header Profile Info & Action Controls */}
                <div className="flex-shrink-0 px-6 py-5 flex items-center justify-between border-b border-slate-900 bg-slate-950/40">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                      <span className="font-bold text-base tracking-wider">π</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-100 uppercase tracking-widest leading-none">Pi Market Menu</h3>
                      <p className="text-[10px] text-slate-500 font-semibold mt-1">v1.2.0 (Consensus Core)</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-violet-400"
                    aria-label="Close menu"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Symmetrical Scrollable Sections */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Marketplace Navigation</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {navItems.map((item) => {
                        const Icon = getIconComponent(item.iconName);
                        const isActive = currentView === item.view;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              if (item.view === 'docs') {
                                window.location.href = '/docs';
                              } else {
                                onNavigate(item.view);
                              }
                              setIsMobileMenuOpen(false);
                            }}
                            className={`flex flex-col items-start gap-2.5 p-4 rounded-2xl text-left border transition-all ${
                              isActive
                                ? 'bg-violet-600/10 border-violet-500/30 text-white shadow-lg shadow-violet-600/5'
                                : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white'
                            }`}
                          >
                            <Icon className="w-5 h-5 text-violet-400" />
                            <div className="space-y-0.5">
                              <span className="text-xs font-black uppercase tracking-wider block">{item.label}</span>
                              <span className="text-[9px] text-slate-500 block">Navigate</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer section matching Android / Apple Native design */}
                <div className="flex-shrink-0 px-6 py-5 border-t border-slate-900 bg-slate-950/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                      <User className="w-4.5 h-4.5 text-violet-400" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-100 block truncate max-w-[120px]">@{currentUser?.username || 'Guest'}</span>
                      <span className="text-[9px] text-slate-500 block tracking-wider uppercase font-black">Consensus Participant</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      logout();
                    }}
                    className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:bg-rose-600"
                  >
                    Logout
                  </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
    )}

    {/* BOTTOM NAVIGATION BAR - PREMIUM GLASS DESIGN WITH ACTIVE GLOWS */}
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#080d19]/90 backdrop-blur-xl border-t border-slate-900 px-2 shadow-[0_-8px_32px_0_rgba(0,0,0,0.5)]"
      style={{ paddingBottom: 'calc(0.25rem + env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center justify-around h-16 max-w-md sm:max-w-lg md:max-w-xl mx-auto relative">
        {getBottomNavItems().map((item) => {
          const Icon = getIconComponent(item.iconName);
          const activeTabId = getActiveTab();
          const isActive = activeTabId === item.id;
          const isSell = item.id === 'orders';

          if (isSell) {
            return (
              <button 
                key={item.id}
                onClick={() => onNavigate(item.view)}
                className="flex flex-col items-center justify-center flex-1 h-full relative focus:outline-none -top-2.5"
                id="nav_bottom_sell_fab"
              >
                <motion.div 
                  whileTap={{ scale: 0.88 }} 
                  className="flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 border border-violet-400/20 shadow-lg shadow-violet-500/30 text-white"
                >
                  <Icon className="w-5 h-5" />
                </motion.div>
                <span className="text-[7.5px] font-black uppercase tracking-widest mt-1 text-slate-400">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button 
              key={item.id}
              onClick={() => {
                if (item.id === 'home') {
                  if (onSearchChange) onSearchChange('');
                  if (onSearchSubmit) onSearchSubmit('');
                  onNavigate(item.view);
                } else if (item.id === 'discover') {
                  onNavigate('discovery');
                } else if (item.view === 'docs') {
                  window.location.href = '/docs';
                } else {
                  onNavigate(item.view);
                }
              }}
              className="flex flex-col items-center justify-center gap-1.5 flex-1 h-full transition-all relative focus:outline-none"
            >
              <motion.div whileTap={{ scale: 0.88 }} className="flex flex-col items-center">
                <Icon className={`w-5 h-5 transition-all ${isActive ? 'text-violet-400 scale-110' : 'text-slate-500 hover:text-slate-350'}`} />
                <span className={`text-[8px] font-black uppercase tracking-widest mt-0.5 ${isActive ? 'text-slate-200 font-black' : 'text-slate-500'}`}>
                  {item.label}
                </span>
              </motion.div>
              {isActive && (
                <motion.div 
                  layoutId="active_bottom_tab_glow" 
                  className="absolute -bottom-1.5 w-8 h-1 bg-violet-500 rounded-full blur-[2.5px]" 
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>

      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        userUid={currentUser?.uid || ''}
        businessId="PI-CORP-001"
      />
    </header>
  );
}
