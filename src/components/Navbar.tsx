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
  X
} from 'lucide-react';
import { User as UserType, Notification } from '../types';
import { PiSdkSim } from '../services/piSdk';
import { PiBusinessMarketDB } from '../services/storage';

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
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [faucetLoading, setFaucetLoading] = useState(false);

  useEffect(() => {
    const fetchNotifs = () => {
      const list = PiBusinessMarketDB.getNotifications(currentUser.uid);
      setNotifications(list);
    };
    fetchNotifs();
    // Poll every 5 seconds for new background notifications
    const interval = setInterval(fetchNotifs, 5000);
    return () => clearInterval(interval);
  }, [currentUser.uid]);

  const handleFaucet = () => {
    setFaucetLoading(true);
    setTimeout(() => {
      const updated = PiSdkSim.requestFaucet();
      onWalletUpdate(updated);
      setFaucetLoading(false);
      
      // Seed a notification
      PiBusinessMarketDB.createNotification(
        currentUser.uid,
        'Sandbox Faucet Success! 🪙',
        'You successfully claimed +50.00 Pi Test coins from the Pi Network Sandbox Mining Pool.',
        'ads_milestone'
      );
      // Trigger instant list refresh
      setNotifications(PiBusinessMarketDB.getNotifications(currentUser.uid));
    }, 800);
  };

  const handleMarkAllRead = () => {
    PiBusinessMarketDB.markAllNotificationsAsRead(currentUser.uid);
    setNotifications(PiBusinessMarketDB.getNotifications(currentUser.uid));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-50 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-900 shadow-lg shadow-violet-950/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* LOGO SECTION */}
        <div 
          onClick={() => onNavigate('marketplace')}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
          id="nav_logo_container"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-violet-500/10 group-hover:scale-105 transition-transform border border-violet-500/20">
            <span className="font-bold text-lg tracking-wider">π</span>
          </div>
          <div>
            <h1 className="font-sans font-bold text-base text-slate-100 tracking-tight leading-none flex items-center gap-1.5">
              Pi Business Market
              <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded-md border border-amber-500/20">
                Sandbox
              </span>
            </h1>
            <p className="text-[10px] text-slate-500 font-medium mt-1">Decentralized Web3 Commerce</p>
          </div>
        </div>

        {/* NAVIGATION / CONTROL TOOLS */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          
          {/* DESKTOP-ONLY LINKS CONTAINER */}
          <div className="hidden xl:flex items-center gap-3" id="nav_desktop_links">
            {/* PROFILE ENGINE NAV TRIGGER */}
            <button
              onClick={() => onNavigate('profile_engine')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                currentView === 'profile_engine'
                  ? 'bg-violet-600 text-white border-violet-500/30 shadow-md shadow-violet-500/10'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850'
              }`}
              id="btn_nav_profile_engine"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Profile Engine</span>
            </button>

            {/* AI DISCOVERY ENGINE NAV TRIGGER */}
            <button
              onClick={() => onNavigate('discovery_engine')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                currentView === 'discovery_engine'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-violet-500/30 shadow-md shadow-indigo-500/10'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850'
              }`}
              id="btn_nav_discovery_engine"
            >
              <Compass className="w-3.5 h-3.5 text-violet-400" />
              <span>AI Discovery Hub</span>
            </button>

            {/* PI COMMERCE ENGINE NAV TRIGGER */}
            <button
              onClick={() => onNavigate('commerce_engine')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                currentView === 'commerce_engine'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-violet-500/30 shadow-md shadow-indigo-500/10'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850'
              }`}
              id="btn_nav_commerce_engine"
            >
              <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
              <span>Commerce Hub</span>
            </button>

            {/* PI ENGAGEMENT & ENGAGEMENT NAV TRIGGER */}
            <button
              onClick={() => onNavigate('engagement_platform')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                currentView === 'engagement_platform'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-violet-500/30 shadow-md shadow-indigo-500/10'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850'
              }`}
              id="btn_nav_engagement_platform"
            >
              <MessageSquare className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
              <span>Communication Hub</span>
            </button>

            {/* ENTERPRISE AI PLATFORM TRIGGER */}
            <button
              onClick={() => onNavigate('ai_platform')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                currentView === 'ai_platform'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-violet-500/30 shadow-md shadow-indigo-500/10'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850'
              }`}
              id="btn_nav_ai_platform"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Enterprise AI</span>
            </button>

            {/* GLOBAL COMMAND CENTER TRIGGER */}
            <button
              onClick={() => onNavigate('global_ops')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                currentView === 'global_ops'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 border-amber-400/30 shadow-md shadow-amber-500/10'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850'
              }`}
              id="btn_nav_global_ops"
            >
              <Shield className={`w-3.5 h-3.5 ${currentView === 'global_ops' ? 'text-slate-950' : 'text-amber-400'}`} />
              <span>Global Ops</span>
            </button>

            {/* USER PORTFOLIO CONTROL */}
            {currentUser.isMerchant ? (
              <button
                onClick={() => onNavigate(currentView.startsWith('merchant') ? 'marketplace' : 'merchant_dashboard')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  currentView.startsWith('merchant')
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                    : 'bg-violet-600 text-white shadow-md hover:bg-violet-500 hover:shadow-violet-600/10 border border-violet-500/30'
                }`}
                id="btn_toggle_merchant"
              >
                <Store className="w-3.5 h-3.5" />
                <span className="hidden sm:inline font-sans">
                  {currentView.startsWith('merchant') ? 'Switch to Marketplace' : 'Merchant Suite'}
                </span>
              </button>
            ) : (
              <button
                onClick={() => onNavigate('store_wizard')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md hover:from-violet-500 hover:to-indigo-500 transition-all group border border-violet-500/30 cursor-pointer"
                id="btn_launch_store"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 group-hover:rotate-12 transition-transform" />
                <span className="font-sans">Sell on Pi</span>
              </button>
            )}
          </div>

          {/* MOBILE TOGGLE (COMPACT CLASS FOR VIEWPORTS < XL) */}
          <button
            onClick={() => {
              setIsMobileMenuOpen(!isMobileMenuOpen);
              setIsWalletOpen(false);
              setIsNotifOpen(false);
            }}
            className="xl:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer select-none"
            id="btn_nav_mobile_toggle"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          {/* SIMULATED PI WALLET STATUS */}
          <div className="relative">
            <button
              onClick={() => {
                setIsWalletOpen(!isWalletOpen);
                setIsNotifOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-850 hover:border-slate-750 transition-all cursor-pointer"
              id="nav_wallet_button"
            >
              <Wallet className="w-3.5 h-3.5 text-violet-450" />
              <div className="text-left font-mono text-xs font-bold text-slate-200">
                {walletBalance.toFixed(2)} <span className="text-violet-400 font-bold">π</span>
              </div>
              <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${isWalletOpen ? 'rotate-180' : ''}`} />
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

          {/* ACTIVE NOTIFICATIONS BUTTON */}
          <div className="relative">
            <button
              onClick={() => {
                setIsNotifOpen(!isNotifOpen);
                setIsWalletOpen(false);
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all relative"
              id="nav_notif_button"
            >
              <Bell className="w-4.5 h-4.5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-rose-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold font-mono">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* NOTIFICATION OVERLAY */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2.5 w-80 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl z-50 overflow-hidden">
                <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">Transactional Alerts</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] text-violet-400 hover:text-violet-300 font-bold"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/40">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 flex flex-col items-center justify-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-600" />
                      <p className="text-xs">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div 
                        key={n.id} 
                        onClick={() => {
                          PiBusinessMarketDB.markNotificationAsRead(n.id);
                          setNotifications(PiBusinessMarketDB.getNotifications(currentUser.uid));
                          if (n.linkTo) {
                            onNavigate(n.linkTo === '/orders' ? 'orders' : 'merchant_orders');
                          }
                          setIsNotifOpen(false);
                        }}
                        className={`p-3.5 text-left cursor-pointer transition-all hover:bg-slate-850 ${!n.read ? 'bg-violet-950/20' : ''}`}
                      >
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-xs font-bold text-slate-200 leading-tight block">{n.title}</span>
                          {!n.read && <span className="w-1.5 h-1.5 bg-violet-500 rounded-full mt-1.5 flex-shrink-0"></span>}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-normal">{n.message}</p>
                        <span className="text-[9px] text-slate-550 font-mono block mt-1.5">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ACTIVE CUSTOMER ORDERS / PURCHASES HUB */}
          <button
            onClick={() => onNavigate('orders')}
            className={`p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 border transition-all ${
              currentView === 'orders' ? 'bg-slate-900 text-violet-400 border-slate-800' : 'border-transparent'
            }`}
            title="My Orders"
          >
            <Clock className="w-4.5 h-4.5" />
          </button>

          {/* VISUAL CART TOGGLE */}
          <button
            onClick={onToggleCart}
            className="p-2 rounded-xl bg-violet-600 text-white hover:bg-violet-500 transition-all relative flex items-center gap-1.5 cursor-pointer shadow-md border border-violet-500/30"
            id="nav_cart_button"
          >
            <ShoppingBag className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 bg-white text-violet-950 rounded-md">
                {cartCount}
              </span>
            )}
          </button>

        </div>
      </div>

      {/* MOBILE DASHBOARD EXPANSION SYSTEM */}
      {isMobileMenuOpen && (
        <div className="xl:hidden bg-slate-950 border-t border-slate-900 px-4 py-5 space-y-4 shadow-2xl animate-fade-in relative z-40 max-h-[85vh] overflow-y-auto select-none">
          <div>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-2 px-1">Network Hub Navigation</h3>
            <div className="grid grid-cols-2 gap-2">
              
              {/* PROFILE ENGINE */}
              <button
                onClick={() => {
                  onNavigate('profile_engine');
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2 p-3 rounded-xl text-xs font-bold border transition-all h-12 cursor-pointer ${
                  currentView === 'profile_engine'
                    ? 'bg-violet-600/15 border-violet-500 text-white shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-300 flex-shrink-0" />
                <span className="truncate">Profile Engine</span>
              </button>

              {/* AI DISCOVERY HUB */}
              <button
                onClick={() => {
                  onNavigate('discovery_engine');
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2 p-3 rounded-xl text-xs font-bold border transition-all h-12 cursor-pointer ${
                  currentView === 'discovery_engine'
                    ? 'bg-gradient-to-r from-violet-600/15 to-indigo-600/15 border-violet-500 text-white shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300'
                }`}
              >
                <Compass className="w-4 h-4 text-violet-400 flex-shrink-0" />
                <span className="truncate">Discovery Hub</span>
              </button>

              {/* COMMERCE HUB */}
              <button
                onClick={() => {
                  onNavigate('commerce_engine');
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2 p-3 rounded-xl text-xs font-bold border transition-all h-12 cursor-pointer ${
                  currentView === 'commerce_engine'
                    ? 'bg-gradient-to-r from-violet-600/15 to-indigo-600/15 border-violet-500 text-white shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300'
                }`}
              >
                <CreditCard className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="truncate">Commerce Hub</span>
              </button>

              {/* COMMUNICATION HUB */}
              <button
                onClick={() => {
                  onNavigate('engagement_platform');
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2 p-3 rounded-xl text-xs font-bold border transition-all h-12 cursor-pointer ${
                  currentView === 'engagement_platform'
                    ? 'bg-gradient-to-r from-violet-600/15 to-indigo-600/15 border-violet-500 text-white shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-violet-400 flex-shrink-0" />
                <span className="truncate">Comms Hub</span>
              </button>

              {/* ENTERPRISE AI */}
              <button
                onClick={() => {
                  onNavigate('ai_platform');
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2 p-3 rounded-xl text-xs font-bold border transition-all h-12 cursor-pointer ${
                  currentView === 'ai_platform'
                    ? 'bg-gradient-to-r from-violet-600/15 to-indigo-600/15 border-violet-500 text-white shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span className="truncate">Enterprise AI</span>
              </button>

              {/* GLOBAL OPS */}
              <button
                onClick={() => {
                  onNavigate('global_ops');
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2 p-3 rounded-xl text-xs font-bold border transition-all h-12 cursor-pointer ${
                  currentView === 'global_ops'
                    ? 'bg-gradient-to-r from-amber-500/15 to-orange-500/15 border-amber-400 text-amber-400 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300'
                }`}
              >
                <Shield className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span className="truncate">Global Ops</span>
              </button>

            </div>
          </div>

          <div className="border-t border-slate-900 pt-3.5 space-y-2">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono px-1">Merchant Suite Control</h4>
            {currentUser.isMerchant ? (
              <button
                onClick={() => {
                  onNavigate(currentView.startsWith('merchant') ? 'marketplace' : 'merchant_dashboard');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold border transition-all cursor-pointer h-12 ${
                  currentView.startsWith('merchant')
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-violet-600 text-white border-violet-500/30 shadow-md shadow-violet-500/10'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>{currentView.startsWith('merchant') ? 'Switch to Marketplace' : 'Open Merchant Suite'}</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  onNavigate('store_wizard');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white border border-violet-500/30 cursor-pointer h-12"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Sell on Pi (Create Store)</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
