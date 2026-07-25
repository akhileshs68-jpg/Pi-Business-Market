/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
import { User as UserType, Notification } from '../types';
import { PiSdkSim } from '../services/piSdk';
import { PiBusinessMarketDB } from '../services/storage';
import { CartDrawer } from './cart/CartDrawer';

import { NotificationCenter } from './NotificationCenter';

interface NavbarProps {
  currentUser: UserType;
  currentView: string;
  onNavigate: (view: string, params?: any) => void;
  cartCount: number;
  walletBalance: number;
  onWalletUpdate: (newBalance: number) => void;
  onToggleCart: () => void;
}

export default function Navbar({
  currentUser,
  currentView,
  onNavigate,
  cartCount,
  walletBalance,
  onWalletUpdate,
  onToggleCart
}: NavbarProps) {
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [faucetLoading, setFaucetLoading] = useState(false);

  const mobileMenuRef = useRef<HTMLDivElement>(null);

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

  const handleFaucet = () => {
    setFaucetLoading(true);
    setTimeout(() => {
      const updated = PiSdkSim.requestFaucet();
      onWalletUpdate(updated);
      setFaucetLoading(false);
    }, 800);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-900 shadow-lg shadow-violet-950/5 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* LOGO SECTION */}
        <div 
          onClick={() => onNavigate('marketplace')}
          className="flex items-center gap-2 cursor-pointer group select-none shrink-0"
          id="nav_logo_container"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-violet-500/10 group-hover:scale-105 transition-transform border border-violet-500/20">
            <span className="font-bold text-base sm:text-lg tracking-wider">π</span>
          </div>
          <div className="hidden xs:block">
            <h1 className="font-sans font-bold text-xs sm:text-base text-slate-100 tracking-tight leading-none flex items-center gap-1">
              <span className="truncate max-w-[80px] sm:max-w-none">Pi Market</span>
              <span className="text-[7px] sm:text-[9px] font-mono font-bold uppercase px-1 py-0.5 bg-amber-500/10 text-amber-400 rounded-md border border-amber-500/20">
                SB
              </span>
            </h1>
            <p className="hidden sm:block text-[10px] text-slate-500 font-medium mt-1">Web3 Commerce</p>
          </div>
        </div>

        {/* NAVIGATION / CONTROL TOOLS */}
        <div className="flex items-center gap-1.5 sm:gap-3 ml-auto">
          
          {/* DESKTOP-ONLY LINKS CONTAINER */}
          <div className="hidden xl:flex items-center gap-3" id="nav_desktop_links">
            {/* DASHBOARD NAV TRIGGER */}
            <button
              onClick={() => onNavigate('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                currentView === 'dashboard'
                  ? 'bg-slate-800 text-white border-slate-700 shadow-md shadow-slate-950/20'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            {/* DOCS PORTAL TRIGGER */}
            <button
              onClick={() => window.location.href = '/docs'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                currentView === 'docs'
                  ? 'bg-emerald-600 text-white border-emerald-500/30 shadow-md shadow-emerald-500/10'
                  : 'bg-emerald-950/50 border-emerald-800/60 text-emerald-300 hover:text-white hover:bg-emerald-900/80'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>Docs</span>
            </button>

            {/* MESSAGING HUB TRIGGER */}
            <button
              onClick={() => onNavigate('inbox')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                currentView === 'inbox'
                  ? 'bg-indigo-600 text-white border-indigo-500/30 shadow-md shadow-indigo-500/10'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              <span>Inbox</span>
            </button>

            {/* UNIVERSAL SEARCH NAV TRIGGER */}
            <button
              onClick={() => onNavigate('discovery')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                currentView === 'discovery'
                  ? 'bg-violet-600 text-white border-violet-500/30 shadow-md shadow-violet-500/10'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-violet-400" />
              <span>Market Search</span>
            </button>

            {/* BUSINESS DASHBOARD NAV TRIGGER */}
            <button
              onClick={() => onNavigate('business-dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                currentView === 'business-dashboard'
                  ? 'bg-violet-600 text-white border-violet-500/30 shadow-md shadow-violet-500/10'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-violet-400" />
              <span>Businesses</span>
            </button>

            <button
              onClick={() => onNavigate('merchant-analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                currentView === 'merchant-analytics'
                  ? 'bg-amber-600 text-white border-amber-500/30 shadow-md shadow-amber-500/10'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
              <span>BI</span>
            </button>

            <button
              onClick={() => onNavigate('admin-analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                currentView === 'admin-analytics'
                  ? 'bg-rose-600 text-white border-rose-500/30 shadow-md shadow-rose-500/10'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>System</span>
            </button>

            <button
              onClick={() => onNavigate('admin-console')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                currentView === 'admin-console'
                  ? 'bg-indigo-600 text-white border-indigo-500/30 shadow-md shadow-indigo-500/10'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              <span>Ops</span>
            </button>

            {/* STORE DASHBOARD NAV TRIGGER */}
            <button
              onClick={() => onNavigate('store-dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                currentView === 'store-dashboard'
                  ? 'bg-indigo-600 text-white border-indigo-500/30 shadow-md shadow-indigo-500/10'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Store className="w-3.5 h-3.5 text-indigo-400" />
              <span>Stores</span>
            </button>

            {/* MERCHANT ORDERS NAV TRIGGER */}
            <button
              onClick={() => onNavigate('business-orders')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                currentView === 'business-orders'
                  ? 'bg-indigo-600 text-white border-indigo-500/30 shadow-md shadow-indigo-500/10'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5 text-indigo-400" />
              <span>Order Hub</span>
            </button>

            <button
              onClick={() => onNavigate('business-payments')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                currentView === 'business-payments'
                  ? 'bg-indigo-600 text-white border-indigo-500/30 shadow-md shadow-indigo-500/10'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
              <span>Finance Hub</span>
            </button>

            <button
              onClick={() => onNavigate('logistics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                currentView === 'logistics'
                  ? 'bg-indigo-600 text-white border-indigo-500/30 shadow-md shadow-indigo-500/10'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Truck className="w-3.5 h-3.5 text-violet-400" />
              <span>Logistics Hub</span>
            </button>

            <button
              onClick={() => onNavigate('crm')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                currentView === 'crm'
                  ? 'bg-indigo-600 text-white border-indigo-500/30 shadow-md shadow-indigo-500/10'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>Customer 360</span>
            </button>
          </div>

          {/* MOBILE TOGGLE (COMPACT CLASS FOR VIEWPORTS < XL) */}
          <button
            onClick={() => {
              setIsMobileMenuOpen(!isMobileMenuOpen);
              setIsWalletOpen(false);
            }}
            className="xl:hidden p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer select-none"
            id="btn_nav_mobile_toggle"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>


          {/* SIMULATED PI WALLET STATUS */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              onClick={() => onNavigate('rewards')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-500/20 bg-indigo-600/10 hover:bg-indigo-600/20 transition-all cursor-pointer"
            >
              <Award className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hidden md:inline">Rewards</span>
            </button>

            <div className="relative">
              <button
                onClick={() => {
                  setIsWalletOpen(!isWalletOpen);
                }}
                className="flex items-center gap-1.5 px-2 py-1.5 sm:px-3 rounded-lg sm:rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-850 transition-all cursor-pointer"
                id="nav_wallet_button"
              >
              <Wallet className="w-3.5 h-3.5 text-violet-400" />
              <div className="text-left font-mono text-[10px] sm:text-xs font-bold text-slate-200">
                {walletBalance.toFixed(1)} <span className="text-violet-400 font-bold">π</span>
              </div>
              <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform hidden xs:block ${isWalletOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* WALLET DROPDOWN SHEET */}
            {isWalletOpen && (
              <div className="absolute right-0 mt-2.5 w-72 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl p-4.5 z-50 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pi Wallet Simulator</span>
                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold">Verified Active</span>
                </div>
                
                <div className="bg-gradient-to-br from-violet-950 to-indigo-950 rounded-xl p-3.5 text-white mb-4 shadow-inner border border-violet-800/20 relative overflow-hidden">
                  <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-20 h-20 rounded-full bg-violet-600/10"></div>
                  <span className="text-[9px] text-violet-300 uppercase tracking-wider font-semibold font-mono">Consensus balance</span>
                  <p className="text-2xl font-mono font-bold tracking-tight mt-1 flex items-baseline gap-1 text-slate-100">
                    {walletBalance.toFixed(2)} <span className="text-amber-400">π</span>
                  </p>
                  <p className="text-[9px] text-slate-400 font-mono mt-1.5 select-all truncate bg-slate-950/40 px-1.5 py-1 rounded">
                    {currentUser.walletAddress}
                  </p>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleFaucet}
                    disabled={faucetLoading}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-700 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md"
                  >
                    {faucetLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <PlusCircle className="w-3.5 h-3.5" />
                    )}
                    <span>Mine Sandbox Pi (+50 π Faucet)</span>
                  </button>
                  
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 px-1 font-mono">
                    <span>Platform: Testnet Node</span>
                    <span>Gas: ~0.01 π</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

          {/* ACTIVE NOTIFICATIONS BUTTON */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={() => onNavigate('inbox')}
              className={`p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all ${
                currentView === 'inbox' ? 'text-indigo-400 bg-slate-900 border-slate-800' : ''
              }`}
              title="Messages"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
            <NotificationCenter />
          </div>

          {/* ACTIVE CUSTOMER ORDERS / PURCHASES HUB */}
          <button
            onClick={() => onNavigate('orders')}
            className={`hidden xs:flex p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 border transition-all ${
              currentView === 'orders' ? 'bg-slate-900 text-violet-400 border-slate-800' : 'border-transparent'
            }`}
            title="My Orders"
          >
            <Clock className="w-4 h-4" />
          </button>

          {/* VISUAL CART TOGGLE */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="p-2 rounded-lg sm:rounded-xl bg-violet-600 text-white hover:bg-violet-500 transition-all relative flex items-center gap-1 sm:gap-1.5 cursor-pointer shadow-md border border-violet-500/30"
            id="nav_cart_button"
          >
            <ShoppingBag className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="text-[9px] sm:text-[10px] font-bold font-mono px-1 sm:px-1.5 py-0.5 bg-white text-violet-950 rounded-md">
                {cartCount}
              </span>
            )}
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
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
                  {/* Category Section: Core Services */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Core Marketplace</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => { onNavigate('marketplace'); setIsMobileMenuOpen(false); }} 
                        className={`flex flex-col items-start gap-2.5 p-4 rounded-2xl text-left border transition-all ${currentView === 'marketplace' ? 'bg-violet-600/10 border-violet-500/30 text-white shadow-lg shadow-violet-600/5' : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white'}`}
                      >
                        <Compass className="w-5 h-5 text-violet-400" />
                        <div className="space-y-0.5">
                          <span className="text-xs font-black uppercase tracking-wider block">Browse</span>
                          <span className="text-[9px] text-slate-500 block">Home feed</span>
                        </div>
                      </button>

                      <button 
                        onClick={() => { onNavigate('discovery'); setIsMobileMenuOpen(false); }} 
                        className={`flex flex-col items-start gap-2.5 p-4 rounded-2xl text-left border transition-all ${currentView === 'discovery' ? 'bg-violet-600/10 border-violet-500/30 text-white shadow-lg shadow-violet-600/5' : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white'}`}
                      >
                        <Search className="w-5 h-5 text-violet-400" />
                        <div className="space-y-0.5">
                          <span className="text-xs font-black uppercase tracking-wider block">Search</span>
                          <span className="text-[9px] text-slate-500 block">Find products</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Category Section: Merchant Portal */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Merchant Ecosystem</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => { onNavigate('business-dashboard'); setIsMobileMenuOpen(false); }} 
                        className={`flex flex-col items-start gap-2.5 p-4 rounded-2xl text-left border transition-all ${currentView === 'business-dashboard' ? 'bg-indigo-600/10 border-indigo-500/30 text-white shadow-lg' : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white'}`}
                      >
                        <Briefcase className="w-5 h-5 text-indigo-400" />
                        <div className="space-y-0.5">
                          <span className="text-xs font-black uppercase tracking-wider block">Businesses</span>
                          <span className="text-[9px] text-slate-500 block">Overview</span>
                        </div>
                      </button>

                      <button 
                        onClick={() => { onNavigate('store-dashboard'); setIsMobileMenuOpen(false); }} 
                        className={`flex flex-col items-start gap-2.5 p-4 rounded-2xl text-left border transition-all ${currentView === 'store-dashboard' ? 'bg-indigo-600/10 border-indigo-500/30 text-white shadow-lg' : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white'}`}
                      >
                        <Store className="w-5 h-5 text-indigo-400" />
                        <div className="space-y-0.5">
                          <span className="text-xs font-black uppercase tracking-wider block">Stores</span>
                          <span className="text-[9px] text-slate-500 block">Manage storefronts</span>
                        </div>
                      </button>

                      <button 
                        onClick={() => { onNavigate('business-orders'); setIsMobileMenuOpen(false); }} 
                        className={`flex flex-col items-start gap-2.5 p-4 rounded-2xl text-left border transition-all ${currentView === 'business-orders' ? 'bg-indigo-600/10 border-indigo-500/30 text-white shadow-lg' : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white'}`}
                      >
                        <ClipboardList className="w-5 h-5 text-indigo-400" />
                        <div className="space-y-0.5">
                          <span className="text-xs font-black uppercase tracking-wider block">Order Hub</span>
                          <span className="text-[9px] text-slate-500 block">Fulfillment</span>
                        </div>
                      </button>

                      <button 
                        onClick={() => { onNavigate('business-payments'); setIsMobileMenuOpen(false); }} 
                        className={`flex flex-col items-start gap-2.5 p-4 rounded-2xl text-left border transition-all ${currentView === 'business-payments' ? 'bg-indigo-600/10 border-indigo-500/30 text-white shadow-lg' : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white'}`}
                      >
                        <CreditCard className="w-5 h-5 text-emerald-400" />
                        <div className="space-y-0.5">
                          <span className="text-xs font-black uppercase tracking-wider block">Finance</span>
                          <span className="text-[9px] text-slate-500 block">Settlements</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Category Section: Analytics & Performance Ops */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Management & BI</h4>
                    <div className="space-y-2">
                      <button 
                        onClick={() => { onNavigate('merchant-analytics'); setIsMobileMenuOpen(false); }} 
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-left text-sm font-bold transition-all ${currentView === 'merchant-analytics' ? 'bg-amber-600/10 border-amber-500/30 text-white' : 'bg-slate-900/40 border-slate-900 hover:border-slate-800 text-slate-400 hover:text-white'}`}
                      >
                        <span className="flex items-center gap-3">
                          <BarChart3 className="w-4 h-4 text-amber-400" /> Merchant BI Analytics
                        </span>
                        <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-slate-600" />
                      </button>

                      <button 
                        onClick={() => { onNavigate('admin-analytics'); setIsMobileMenuOpen(false); }} 
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-left text-sm font-bold transition-all ${currentView === 'admin-analytics' ? 'bg-rose-600/10 border-rose-500/30 text-white' : 'bg-slate-900/40 border-slate-900 hover:border-slate-800 text-slate-400 hover:text-white'}`}
                      >
                        <span className="flex items-center gap-3">
                          <ShieldAlert className="w-4 h-4 text-rose-400" /> Platform System Health
                        </span>
                        <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-slate-600" />
                      </button>

                      <button 
                        onClick={() => { onNavigate('admin-console'); setIsMobileMenuOpen(false); }} 
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-left text-sm font-bold transition-all ${currentView === 'admin-console' ? 'bg-indigo-600/10 border-indigo-500/30 text-white' : 'bg-slate-900/40 border-slate-900 hover:border-slate-800 text-slate-400 hover:text-white'}`}
                      >
                        <span className="flex items-center gap-3">
                          <Terminal className="w-4 h-4 text-indigo-400" /> Admin Ops Console
                        </span>
                        <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-slate-600" />
                      </button>
                    </div>
                  </div>

                  {/* Category Section: Document Resources */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Platform Resources</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => { onNavigate('rewards'); setIsMobileMenuOpen(false); }} 
                        className="flex items-center justify-center gap-2.5 p-3 rounded-xl border border-indigo-500/20 bg-indigo-600/5 text-indigo-400 text-xs font-black uppercase tracking-wider transition-all"
                      >
                        <Award className="w-4 h-4 text-indigo-400" /> Rewards Hub
                      </button>
                      <button 
                        onClick={() => { window.location.href = '/docs'; setIsMobileMenuOpen(false); }} 
                        className="flex items-center justify-center gap-2.5 p-3 rounded-xl border border-emerald-500/20 bg-emerald-600/5 text-emerald-400 text-xs font-black uppercase tracking-wider transition-all"
                      >
                        <BookOpen className="w-4 h-4 text-emerald-400" /> Document Root
                      </button>
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
                      <span className="text-xs font-black text-slate-100 block truncate max-w-[120px]">@{currentUser.username || 'PiMember'}</span>
                      <span className="text-[9px] text-slate-500 block tracking-wider uppercase font-black">Consensus Participant</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:bg-slate-850"
                  >
                    Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
    )}

    {/* MOBILE BOTTOM NAVIGATION BAR - PREMIUM GLASS DESIGN WITH ACTIVE GLOWS */}
    <nav className="fixed bottom-0 left-0 right-0 z-50 xl:hidden bg-[#080d19]/80 backdrop-blur-xl border-t border-slate-900 px-2 pb-safe shadow-[0_-8px_32px_0_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto relative">
        
        {/* Market Tab */}
        <button 
          onClick={() => onNavigate('marketplace')}
          className="flex flex-col items-center justify-center gap-1.5 flex-1 h-full transition-all relative focus:outline-none"
        >
          <motion.div whileTap={{ scale: 0.88 }} className="flex flex-col items-center">
            <Compass className={`w-5 h-5 transition-all ${currentView === 'marketplace' ? 'text-violet-400 scale-110' : 'text-slate-500 hover:text-slate-350'}`} />
            <span className={`text-[8px] font-black uppercase tracking-widest mt-0.5 ${currentView === 'marketplace' ? 'text-slate-200 font-black' : 'text-slate-500'}`}>Market</span>
          </motion.div>
          {currentView === 'marketplace' && (
            <motion.div 
              layoutId="active_bottom_tab_glow" 
              className="absolute -bottom-1.5 w-8 h-1 bg-violet-500 rounded-full blur-[2.5px]" 
            />
          )}
        </button>

        {/* Search Tab */}
        <button 
          onClick={() => onNavigate('discovery')}
          className="flex flex-col items-center justify-center gap-1.5 flex-1 h-full transition-all relative focus:outline-none"
        >
          <motion.div whileTap={{ scale: 0.88 }} className="flex flex-col items-center">
            <Search className={`w-5 h-5 transition-all ${currentView === 'discovery' ? 'text-violet-400 scale-110' : 'text-slate-500 hover:text-slate-350'}`} />
            <span className={`text-[8px] font-black uppercase tracking-widest mt-0.5 ${currentView === 'discovery' ? 'text-slate-200 font-black' : 'text-slate-500'}`}>Search</span>
          </motion.div>
          {currentView === 'discovery' && (
            <motion.div 
              layoutId="active_bottom_tab_glow" 
              className="absolute -bottom-1.5 w-8 h-1 bg-violet-500 rounded-full blur-[2.5px]" 
            />
          )}
        </button>

        {/* Dashboard Tab */}
        <button 
          onClick={() => onNavigate('dashboard')}
          className="flex flex-col items-center justify-center gap-1.5 flex-1 h-full transition-all relative focus:outline-none"
        >
          <motion.div whileTap={{ scale: 0.88 }} className="flex flex-col items-center">
            <LayoutDashboard className={`w-5 h-5 transition-all ${currentView === 'dashboard' ? 'text-violet-400 scale-110' : 'text-slate-500 hover:text-slate-350'}`} />
            <span className={`text-[8px] font-black uppercase tracking-widest mt-0.5 ${currentView === 'dashboard' ? 'text-slate-200 font-black' : 'text-slate-500'}`}>Dashboard</span>
          </motion.div>
          {currentView === 'dashboard' && (
            <motion.div 
              layoutId="active_bottom_tab_glow" 
              className="absolute -bottom-1.5 w-8 h-1 bg-violet-500 rounded-full blur-[2.5px]" 
            />
          )}
        </button>

        {/* Orders Tab with Notification Badge */}
        <button 
          onClick={() => onNavigate('orders')}
          className="flex flex-col items-center justify-center gap-1.5 flex-1 h-full transition-all relative focus:outline-none"
        >
          <motion.div whileTap={{ scale: 0.88 }} className="flex flex-col items-center relative">
            <Clock className={`w-5 h-5 transition-all ${currentView === 'orders' ? 'text-violet-400 scale-110' : 'text-slate-500 hover:text-slate-350'}`} />
            <span className={`text-[8px] font-black uppercase tracking-widest mt-0.5 ${currentView === 'orders' ? 'text-slate-200 font-black' : 'text-slate-500'}`}>Orders</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
            )}
          </motion.div>
          {currentView === 'orders' && (
            <motion.div 
              layoutId="active_bottom_tab_glow" 
              className="absolute -bottom-1.5 w-8 h-1 bg-violet-500 rounded-full blur-[2.5px]" 
            />
          )}
        </button>

        {/* More Tab */}
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center gap-1.5 flex-1 h-full transition-all relative focus:outline-none"
        >
          <motion.div whileTap={{ scale: 0.88 }} className="flex flex-col items-center">
            <Menu className={`w-5 h-5 transition-all ${isMobileMenuOpen ? 'text-violet-400 scale-110' : 'text-slate-500 hover:text-slate-350'}`} />
            <span className={`text-[8px] font-black uppercase tracking-widest mt-0.5 ${isMobileMenuOpen ? 'text-slate-200 font-black' : 'text-slate-500'}`}>More</span>
          </motion.div>
          {isMobileMenuOpen && (
            <motion.div 
              layoutId="active_bottom_tab_glow" 
              className="absolute -bottom-1.5 w-8 h-1 bg-violet-500 rounded-full blur-[2.5px]" 
            />
          )}
        </button>

      </div>
    </nav>

      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        userUid={currentUser.uid}
        businessId="PI-CORP-001"
      />
    </header>
  );
}
