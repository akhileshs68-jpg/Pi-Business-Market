/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Store, Product, CartItem } from './types';
import { PiBusinessMarketDB } from './services/storage';
import { PiSdkSim } from './services/piSdk';
import { ShoppingBag, Hammer, Briefcase } from 'lucide-react';

// Components
import Navbar from './components/Navbar';
import MarketplaceFeed from './components/MarketplaceFeed';
import StoreWizard from './components/StoreWizard';
import StoreDashboard from './components/StoreDashboard';
import StorePage from './components/StorePage';
import OrderTracker from './components/OrderTracker';
import ProductDetailsModal from './components/ProductDetailsModal';
import CheckoutModal from './components/CheckoutModal';
import CartDrawer from './components/CartDrawer';

// New Modular Super App Feeds
import PioneerServicesFeed from './components/PioneerServicesFeed';
import JobBoardFeed from './components/JobBoardFeed';
import ProfileEngine from './components/ProfileEngine';
import MarketplaceCore from './components/MarketplaceCore';
import IntelligentDiscoveryEngine from './components/IntelligentDiscoveryEngine';
import CommerceEngine from './components/CommerceEngine';
import EngagementPlatform from './components/EngagementPlatform';
import { AiPlatformHub } from './components/AiPlatformHub';
import { GlobalCommandCenter } from './components/GlobalCommandCenter';

export default function App() {
  // Core user states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(350.0);

  // Navigation states
  const [currentView, setCurrentView] = useState<string>('marketplace');
  const [currentViewParams, setCurrentViewParams] = useState<any>(null);
  const [superAppHub, setSuperAppHub] = useState<'products' | 'services' | 'jobs'>('products');

  // Cart & checkout states
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [checkoutQueue, setCheckoutQueue] = useState<CartItem[]>([]);

  // Startup Initialization
  useEffect(() => {
    // Init LocalStorage repositories
    PiBusinessMarketDB.init();

    // Fetch details
    const user = PiBusinessMarketDB.getCurrentUser();
    setCurrentUser(user);

    if (user.isMerchant && user.storeId) {
      const store = PiBusinessMarketDB.getStoreById(user.storeId);
      if (store) {
        setCurrentStore(store);
      }
    }

    setWalletBalance(PiSdkSim.getBalance());
  }, []);

  const handleRefreshUser = () => {
    const user = PiBusinessMarketDB.getCurrentUser();
    setCurrentUser(user);
    if (user.isMerchant && user.storeId) {
      const store = PiBusinessMarketDB.getStoreById(user.storeId);
      if (store) {
        setCurrentStore(store);
      }
    }
  };

  const handleNavigate = (view: string, params: any = null) => {
    setCurrentView(view);
    setCurrentViewParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ==========================================
  // CART OPERATIONS
  // ==========================================

  const handleAddToCart = (product: Product, quantity: number, selectedAttributes: Record<string, string>) => {
    setCart((prevCart) => {
      // Check if product with identical attributes already exists
      const existingIdx = prevCart.findIndex(
        (item) =>
          item.product.id === product.id &&
          JSON.stringify(item.selectedAttributes) === JSON.stringify(selectedAttributes)
      );

      if (existingIdx !== -1) {
        const updated = [...prevCart];
        updated[existingIdx].quantity += quantity;
        return updated;
      } else {
        return [...prevCart, { product, quantity, selectedAttributes }];
      }
    });

    // Close product details and open shopping cart slider as delightful visual feedback
    setSelectedProduct(null);
    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (idx: number, newQty: number) => {
    if (newQty < 1) return;
    setCart((prevCart) => {
      const updated = [...prevCart];
      updated[idx].quantity = newQty;
      return updated;
    });
  };

  const handleRemoveCartItem = (idx: number) => {
    setCart((prevCart) => prevCart.filter((_, i) => i !== idx));
  };

  const handleWalletUpdate = (newBalance: number) => {
    setWalletBalance(newBalance);
  };

  // ==========================================
  // CHECKOUT OPERATIONS
  // ==========================================

  const handleInstantCheckout = (product: Product, quantity: number, selectedAttributes: Record<string, string>) => {
    setSelectedProduct(null);
    setCheckoutQueue([{ product, quantity, selectedAttributes }]);
  };

  const handleCartCheckout = () => {
    setIsCartOpen(false);
    setCheckoutQueue(itemsToCheckout => {
      return cart;
    });
  };

  const handlePaymentSuccess = (newBalance: number) => {
    setWalletBalance(newBalance);
    // If completed checkout originated from general shopping cart, clear shopping cart
    if (checkoutQueue.length === cart.length && checkoutQueue.every((item, i) => item.product.id === cart[i].product.id)) {
      setCart([]);
    }
    // Sync current store metrics if merchant self-bought or checked metrics
    if (currentUser?.isMerchant && currentUser.storeId) {
      const store = PiBusinessMarketDB.getStoreById(currentUser.storeId);
      if (store) {
        setCurrentStore(store);
      }
    }
  };

  // Rendering Routing Views
  const renderMainView = () => {
    if (!currentUser) return null;

    switch (currentView) {
      case 'marketplace':
        if (superAppHub === 'services') {
          return (
            <PioneerServicesFeed
              currentUser={currentUser}
              onNavigate={handleNavigate}
              onWalletUpdate={handleWalletUpdate}
            />
          );
        }
        if (superAppHub === 'jobs') {
          return (
            <JobBoardFeed
              currentUser={currentUser}
              onNavigate={handleNavigate}
            />
          );
        }
        return (
          <MarketplaceFeed
            onNavigate={handleNavigate}
            onOpenProduct={(p) => setSelectedProduct(p)}
          />
        );

      case 'store_wizard':
        return (
          <StoreWizard
            ownerUid={currentUser.uid}
            defaultWalletAddress={currentUser.walletAddress}
            onStoreCreated={(newStore) => {
              setCurrentStore(newStore);
              handleRefreshUser();
              handleNavigate('merchant_dashboard');
            }}
          />
        );

      case 'profile_engine':
        return (
          <ProfileEngine
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onRefreshUser={handleRefreshUser}
          />
        );

      case 'marketplace_core':
        return (
          <MarketplaceCore
            currentUser={currentUser}
            onNavigate={handleNavigate}
          />
        );

      case 'merchant_dashboard':
        return currentStore ? (
          <StoreDashboard
            store={currentStore}
            onNavigate={handleNavigate}
            onRefreshUser={handleRefreshUser}
          />
        ) : (
          <StoreWizard
            ownerUid={currentUser.uid}
            defaultWalletAddress={currentUser.walletAddress}
            onStoreCreated={(newStore) => {
              setCurrentStore(newStore);
              handleRefreshUser();
              handleNavigate('merchant_dashboard');
            }}
          />
        );

      case 'store_page':
        return (
          <StorePage
            storeId={currentViewParams?.storeId}
            onNavigate={handleNavigate}
            onOpenProduct={(p) => setSelectedProduct(p)}
          />
        );

      case 'orders':
        return (
          <OrderTracker
            buyerUid={currentUser.uid}
            buyerUsername={currentUser.username}
            onNavigate={handleNavigate}
          />
        );

      case 'discovery_engine':
        return (
          <IntelligentDiscoveryEngine
            currentUser={currentUser}
            onNavigate={handleNavigate}
          />
        );

      case 'commerce_engine':
        return (
          <CommerceEngine
            currentUser={currentUser}
            onNavigate={handleNavigate}
          />
        );

      case 'engagement_platform':
        return (
          <EngagementPlatform
            currentUser={currentUser}
            onNavigate={handleNavigate}
          />
        );
 
      case 'ai_platform':
        return (
          <AiPlatformHub
            currentUser={currentUser}
            onNavigate={handleNavigate}
          />
        );

      case 'global_ops':
        return (
          <GlobalCommandCenter
            currentUser={currentUser}
            onNavigate={handleNavigate}
          />
        );

      default:
        return (
          <MarketplaceFeed
            onNavigate={handleNavigate}
            onOpenProduct={(p) => setSelectedProduct(p)}
          />
        );
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 font-sans select-none text-slate-400">
        <span className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mr-2"></span>
        <span className="text-sm font-semibold tracking-tight text-slate-200">Initializing Pi Sandbox Engine...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-violet-500/30 selection:text-white">
      
      {/* NAVBAR */}
      <Navbar
        currentUser={currentUser}
        currentView={currentView}
        onNavigate={handleNavigate}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        walletBalance={walletBalance}
        onWalletUpdate={handleWalletUpdate}
        onToggleCart={() => setIsCartOpen(!isCartOpen)}
      />

      {/* CORE DISPLAY WINDOW */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        
        {/* SUPER APP HUD HUB SWITCHER */}
        {(currentView === 'marketplace' || currentView === 'marketplace_core') && (
          <div className="mb-8 flex justify-center animate-fade-in select-none">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-1.5 flex flex-wrap justify-center gap-1 shadow-lg relative z-20">
              <button
                onClick={() => {
                  setSuperAppHub('products');
                  setCurrentView('marketplace');
                }}
                className={`py-2 px-5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'marketplace' && superAppHub === 'products'
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Product Market</span>
              </button>
              <button
                onClick={() => {
                  setSuperAppHub('services');
                  setCurrentView('marketplace');
                }}
                className={`py-2 px-5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'marketplace' && superAppHub === 'services'
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <Hammer className="w-3.5 h-3.5" />
                <span>Local Services</span>
              </button>
              <button
                onClick={() => {
                  setSuperAppHub('jobs');
                  setCurrentView('marketplace');
                }}
                className={`py-2 px-5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'marketplace' && superAppHub === 'jobs'
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Job Board</span>
              </button>
              <button
                onClick={() => {
                  setCurrentView('marketplace_core');
                }}
                className={`py-2 px-5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 relative overflow-hidden group ${
                  currentView === 'marketplace_core'
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-500/25 border-violet-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0"></span>
                <span>Unified Engine (Phase 5)</span>
              </button>
            </div>
          </div>
        )}

        {renderMainView()}
      </main>

      {/* SHOPPING CART OVERLAY DRAWER */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onCheckout={handleCartCheckout}
      />

      {/* PRODUCT LISTING SHEET DETAILED MODAL */}
      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          onInstantCheckout={handleInstantCheckout}
        />
      )}

      {/* INTERACTIVE CHECKOUT GATEWAY */}
      {checkoutQueue.length > 0 && (
        <CheckoutModal
          items={checkoutQueue}
          currentUser={currentUser}
          onClose={() => setCheckoutQueue([])}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* SUBTLE FOOTER COORDINATES */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 select-none mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-500 font-semibold font-mono">
          <span>Pi Business Market Networks © 2026</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Mainnet Sandbox: Active
            </span>
            <span>Blocks confirmed: 842,905</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
