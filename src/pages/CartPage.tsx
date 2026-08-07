/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import Navbar from '../components/Navbar';
import { ShoppingCart } from '../components/cart/ShoppingCart';
import { Wishlist } from '../components/cart/Wishlist';
import { 
  ShoppingBag, 
  Heart, 
  Sparkles, 
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getFirebaseDb } from '../firebase/config';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'cart' | 'wishlist'>('cart');
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    const db = getFirebaseDb();
    
    // Wishlist snapshot
    const wishlistQuery = query(collection(db, 'wishlists'), where('userUid', '==', user.uid));
    const unsubWishlist = onSnapshot(wishlistQuery, (snapshot) => {
      setWishlistCount(snapshot.size);
    }, (err) => {
      console.warn('[CartPage] Wishlist snapshot error:', err);
    });

    // Carts snapshot
    const cartsQuery = query(collection(db, 'carts'), where('userUid', '==', user.uid));
    
    let unsubsItems: (() => void)[] = [];
    
    const unsubCarts = onSnapshot(cartsQuery, (snapshot) => {
      const cartDocs = snapshot.docs;
      
      // Cleanup previous items listeners
      unsubsItems.forEach(u => u());
      unsubsItems = [];
      
      if (cartDocs.length === 0) {
        setCartCount(0);
        return;
      }
      
      const cartIds = cartDocs.map(doc => doc.id);
      
      let countsMap = new Map<string, number>();

      cartIds.forEach(cartId => {
        const itemsQuery = query(collection(db, 'cartItems'), where('cartId', '==', cartId));
        const unsub = onSnapshot(itemsQuery, (itemsSnap) => {
          countsMap.set(cartId, itemsSnap.size);
          let total = 0;
          for (const count of countsMap.values()) {
            total += count;
          }
          setCartCount(total);
        }, (err) => {
          console.warn('[CartPage] Cart items snapshot error:', err);
        });
        unsubsItems.push(unsub);
      });
    }, (err) => {
      console.warn('[CartPage] Carts snapshot error:', err);
    });

    return () => {
      unsubWishlist();
      unsubCarts();
      unsubsItems.forEach(u => u());
    };
  }, [user]);

  const updateCounts = () => {};

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleCartUpdated = () => {
    updateCounts();
    showToast('Shopping Cart updated!');
  };

  const handleWishlistUpdated = () => {
    updateCounts();
    showToast('Wishlist updated!');
  };

  const handleItemMovedToWishlist = () => {
    updateCounts();
    showToast('Item saved to Wishlist!');
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-200">
        <p className="text-sm font-bold text-slate-400 mb-4">Please log in to view your cart.</p>
        <button 
          onClick={() => navigate('/login')}
          className="px-6 py-3 bg-violet-600 hover:bg-violet-500 rounded-xl text-white font-bold text-xs uppercase tracking-wider"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 relative overflow-hidden">
      {/* Background gradients for a futuristic, deep UI look */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-violet-600/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-10%] w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Unified Navbar */}
      <Navbar 
        currentUser={user as any}
        currentView="discovery"
        onNavigate={(view) => navigate(`/${view}`)}
        cartCount={cartCount}
        walletBalance={100}
        onWalletUpdate={() => {}}
        onToggleCart={() => setActiveTab('cart')}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-2">
            <button 
              onClick={() => navigate('/discovery')}
              className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-violet-400 font-bold uppercase tracking-wider transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Marketplace</span>
            </button>
            <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tighter">
              Universal Shopping Hub
            </h1>
            <p className="text-slate-400 text-sm font-medium max-w-xl">
              Manage your physical items, professional services, and saved favorites in one seamless non-custodial e-commerce cockpit.
            </p>
          </div>

          {/* Tab Toggles */}
          <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 shrink-0 self-start md:self-auto shadow-lg backdrop-blur-md">
            <button
              onClick={() => setActiveTab('cart')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                activeTab === 'cart' 
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/10' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Shopping Cart ({cartCount})</span>
            </button>
            
            <button
              onClick={() => setActiveTab('wishlist')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                activeTab === 'wishlist' 
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/10' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Heart className="w-4 h-4" />
              <span>Wishlist ({wishlistCount})</span>
            </button>
          </div>
        </div>

        {/* Toast Notification Container */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-24 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 px-6 py-3.5 rounded-2xl flex items-center gap-3 shadow-2xl z-50 backdrop-blur-md"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="text-xs font-bold text-white uppercase tracking-wider">{toastMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="space-y-12">
          {activeTab === 'cart' ? (
            <div className="space-y-12">
              <ShoppingCart 
                userUid={user.uid} 
                onItemMovedToWishlist={handleItemMovedToWishlist}
                onCartUpdated={handleCartUpdated}
              />
              
              {/* Secondary visual section: Quick display of Wishlist underneath for seamless saving/recalling */}
              {wishlistCount > 0 && (
                <div className="pt-8 border-t border-slate-800/60">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-white uppercase tracking-tight">Saved For Later</h3>
                    <p className="text-xs text-slate-500 font-medium">Quickly move items back to your active cart.</p>
                  </div>
                  <Wishlist 
                    userUid={user.uid}
                    onCartUpdated={handleCartUpdated}
                    onWishlistUpdated={handleWishlistUpdated}
                  />
                </div>
              )}
            </div>
          ) : (
            <Wishlist 
              userUid={user.uid}
              onCartUpdated={handleCartUpdated}
              onWishlistUpdated={handleWishlistUpdated}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default CartPage;
