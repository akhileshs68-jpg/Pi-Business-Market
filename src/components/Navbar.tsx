/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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

      {/* MOBILE DASHBOARD EXPANSION SYSTEM */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[55] xl:hidden"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 w-80 bg-slate-950 border-l border-slate-900 z-[60] xl:hidden overflow-y-auto"
            >
              <div className="p-6 space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Navigation</h3>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-500 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Marketplace</h4>
                    <div className="grid gap-2">
                      <button onClick={() => { onNavigate('marketplace'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 p-3 rounded-xl text-sm font-bold border transition-all ${currentView === 'marketplace' ? 'bg-violet-600/10 border-violet-500/30 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                        <Compass className="w-5 h-5 text-violet-400" /> Marketplace
                      </button>
                      <button onClick={() => { onNavigate('discovery'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 p-3 rounded-xl text-sm font-bold border transition-all ${currentView === 'discovery' ? 'bg-violet-600/10 border-violet-500/30 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                        <Search className="w-5 h-5 text-violet-400" /> Search Market
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Enterprise Suite</h4>
                    <div className="grid gap-2">
                      <button onClick={() => { onNavigate('business-dashboard'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 p-3 rounded-xl text-sm font-bold border transition-all ${currentView === 'business-dashboard' ? 'bg-indigo-600/10 border-indigo-500/30 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                        <Briefcase className="w-5 h-5 text-indigo-400" /> Businesses
                      </button>
                      <button onClick={() => { onNavigate('store-dashboard'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 p-3 rounded-xl text-sm font-bold border transition-all ${currentView === 'store-dashboard' ? 'bg-indigo-600/10 border-indigo-500/30 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                        <Store className="w-5 h-5 text-indigo-400" /> Stores
                      </button>
                      <button onClick={() => { onNavigate('business-orders'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 p-3 rounded-xl text-sm font-bold border transition-all ${currentView === 'business-orders' ? 'bg-indigo-600/10 border-indigo-500/30 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                        <ClipboardList className="w-5 h-5 text-indigo-400" /> Order Hub
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">System</h4>
                    <div className="grid gap-2">
                      <button onClick={() => { onNavigate('admin-console'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 p-3 rounded-xl text-sm font-bold border transition-all ${currentView === 'admin-console' ? 'bg-rose-600/10 border-rose-500/30 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                        <Terminal className="w-5 h-5 text-rose-400" /> Ops Console
                      </button>
                      <button onClick={() => { window.location.href = '/docs'; setIsMobileMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-xl text-sm font-bold border border-emerald-500/20 bg-emerald-600/10 text-emerald-400">
                        <BookOpen className="w-5 h-5" /> Documentation
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 xl:hidden bg-slate-950/90 backdrop-blur-lg border-t border-slate-900 px-2 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-around h-16 max-w-md mx-auto">
          <button 
            onClick={() => onNavigate('marketplace')}
            className={`flex flex-col items-center gap-1 flex-1 transition-all ${currentView === 'marketplace' ? 'text-violet-400' : 'text-slate-500'}`}
          >
            <Compass className="w-5 h-5" />
            <span className="text-[8px] font-bold uppercase tracking-widest">Market</span>
          </button>
          <button 
            onClick={() => onNavigate('discovery')}
            className={`flex flex-col items-center gap-1 flex-1 transition-all ${currentView === 'discovery' ? 'text-violet-400' : 'text-slate-500'}`}
          >
            <Search className="w-5 h-5" />
            <span className="text-[8px] font-bold uppercase tracking-widest">Search</span>
          </button>
          <button 
            onClick={() => onNavigate('dashboard')}
            className={`flex flex-col items-center gap-1 flex-1 transition-all ${currentView === 'dashboard' ? 'text-violet-400' : 'text-slate-500'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[8px] font-bold uppercase tracking-widest">Dash</span>
          </button>
          <button 
            onClick={() => onNavigate('orders')}
            className={`flex flex-col items-center gap-1 flex-1 transition-all ${currentView === 'orders' ? 'text-violet-400' : 'text-slate-500'}`}
          >
            <Clock className="w-5 h-5" />
            <span className="text-[8px] font-bold uppercase tracking-widest">Orders</span>
          </button>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className={`flex flex-col items-center gap-1 flex-1 transition-all ${isMobileMenuOpen ? 'text-violet-400' : 'text-slate-500'}`}
          >
            <Menu className="w-5 h-5" />
            <span className="text-[8px] font-bold uppercase tracking-widest">Menu</span>
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
