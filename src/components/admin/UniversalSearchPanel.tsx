/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Building, Store, UserCheck, ShoppingBag, Users, Box, Sparkles, 
  FileText, CreditCard, Coins, Wallet, Megaphone, TrendingUp, AlertTriangle, 
  HelpCircle, Bell, ArrowRight, Check, Loader, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { searchService } from '../../services/searchService';
import { getFirebaseDb } from '../../firebase/config';
import { collection, query, limit, getDocs, where } from 'firebase/firestore';

interface SearchResult {
  id: string;
  entityType: 'business' | 'store' | 'seller' | 'buyer' | 'employee' | 'product' | 'service' | 'order' | 'payment' | 'pi_wallet' | 'bmp_wallet' | 'campaign' | 'advertisement' | 'dispute' | 'support_ticket' | 'notification';
  title: string;
  secondary: string;
  status: string;
  lastUpdated: string;
  metadata?: any;
}

export const UniversalSearchPanel: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Filter types definitions
  const filtersList = [
    { id: 'all', label: 'All' },
    { id: 'business', label: 'Businesses', icon: Building },
    { id: 'store', label: 'Stores', icon: Store },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'product', label: 'Products', icon: Box },
    { id: 'service', label: 'Services', icon: Sparkles },
    { id: 'order', label: 'Orders', icon: FileText },
    { id: 'payment', label: 'Payments', icon: CreditCard },
    { id: 'wallet', label: 'Wallets', icon: Wallet },
    { id: 'campaign', label: 'Campaigns', icon: Megaphone },
    { id: 'dispute', label: 'Disputes', icon: AlertTriangle }
  ];

  // Map entity types to visual configurations
  const getEntityConfig = (type: string) => {
    switch (type) {
      case 'business':
        return { icon: Building, color: 'text-sky-400 bg-sky-400/10 border-sky-400/20', label: 'Business', path: '/business/' };
      case 'store':
        return { icon: Store, color: 'text-amber-400 bg-amber-400/10 border-amber-400/20', label: 'Store', path: '/store/' };
      case 'seller':
        return { icon: UserCheck, color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', label: 'Seller', path: '/profile' };
      case 'buyer':
        return { icon: ShoppingBag, color: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20', label: 'Buyer', path: '/profile' };
      case 'employee':
        return { icon: Users, color: 'text-violet-400 bg-violet-400/10 border-violet-400/20', label: 'Employee', path: '/crm' };
      case 'product':
        return { icon: Box, color: 'text-teal-400 bg-teal-400/10 border-teal-400/20', label: 'Product', path: '/product/' };
      case 'service':
        return { icon: Sparkles, color: 'text-pink-400 bg-pink-400/10 border-pink-400/20', label: 'Service', path: '/service/' };
      case 'order':
        return { icon: FileText, color: 'text-rose-400 bg-rose-400/10 border-rose-400/20', label: 'Order', path: '/order-details/' };
      case 'payment':
        return { icon: CreditCard, color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', label: 'Payment', path: '/business-payments' };
      case 'pi_wallet':
        return { icon: Coins, color: 'text-orange-400 bg-orange-400/10 border-orange-400/20', label: 'Pi Wallet', path: '/wallet' };
      case 'bmp_wallet':
        return { icon: Wallet, color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', label: 'BMP Wallet', path: '/wallet' };
      case 'campaign':
        return { icon: Megaphone, color: 'text-fuchsia-400 bg-fuchsia-400/10 border-fuchsia-400/20', label: 'Campaign', path: '/admin-console' };
      case 'advertisement':
        return { icon: TrendingUp, color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20', label: 'Ad', path: '/admin-console' };
      case 'dispute':
        return { icon: AlertTriangle, color: 'text-red-400 bg-red-400/10 border-red-400/20', label: 'Dispute', path: '/admin-console' };
      case 'support_ticket':
        return { icon: HelpCircle, color: 'text-purple-400 bg-purple-400/10 border-purple-400/20', label: 'Ticket', path: '/admin-console' };
      case 'notification':
        return { icon: Bell, color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', label: 'Alert', path: '/notifications' };
      default:
        return { icon: Box, color: 'text-slate-400 bg-slate-400/10 border-slate-400/20', label: 'Item', path: '/' };
    }
  };

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounce search input and handle triggers
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      performSearch();
      generateSuggestions();
    }, 350);

    return () => clearTimeout(delayDebounceFn);
  }, [keyword, selectedFilter]);

  const generateSuggestions = () => {
    if (!keyword.trim()) {
      setSuggestions([]);
      return;
    }
    const baseSg = [
      `${keyword} store`,
      `${keyword} products`,
      `Verified ${keyword}`,
      `Manage ${keyword}`,
      `Audit ${keyword}`
    ];
    setSuggestions(baseSg.slice(0, 3));
  };

  const performSearch = async () => {
    setIsLoading(true);
    try {
      const db = getFirebaseDb();
      let searchKeyword = keyword.trim().toLowerCase();
      let matches: SearchResult[] = [];

      // Helper to add matches safely
      const addMatches = (list: any[], type: any, mapper: (item: any) => Omit<SearchResult, 'entityType'>) => {
        list.forEach(item => {
          const mapped = mapper(item);
          // Apply fuzzy scoring client side for high reliability
          let score = 0;
          const textToSearch = `${mapped.title} ${mapped.secondary} ${mapped.status}`.toLowerCase();
          
          if (!searchKeyword) {
            score = 1; // Return all on empty search
          } else if (textToSearch.includes(searchKeyword)) {
            score = 100;
          } else {
            // Fuzzy match characters
            let kwIdx = 0;
            for (let i = 0; i < textToSearch.length && kwIdx < searchKeyword.length; i++) {
              if (textToSearch[i] === searchKeyword[kwIdx]) kwIdx++;
            }
            if (kwIdx === searchKeyword.length) score = 50;
          }

          if (score > 0) {
            matches.push({
              ...mapped,
              entityType: type
            });
          }
        });
      };

      // 1. Businesses
      if (selectedFilter === 'all' || selectedFilter === 'business') {
        const snap = await getDocs(query(collection(db, 'businesses'), limit(50)));
        addMatches(snap.docs.map(d => ({ id: d.id, ...d.data() })), 'business', (b) => ({
          id: b.id,
          title: b.displayName || b.businessName || 'Unnamed Business',
          secondary: `${b.industry || 'General'} • ${b.category || 'No Category'}`,
          status: b.businessStatus || b.status || 'Active',
          lastUpdated: b.updatedAt || b.createdAt || new Date().toISOString(),
          metadata: b
        }));
      }

      // 2. Stores
      if (selectedFilter === 'all' || selectedFilter === 'store') {
        const snap = await getDocs(query(collection(db, 'stores'), limit(50)));
        addMatches(snap.docs.map(d => ({ id: d.id, ...d.data() })), 'store', (s) => ({
          id: s.id || s.storeId,
          title: s.storeName || 'Unnamed Store',
          secondary: `${s.storeType || 'Retail'} • Business ID: ${s.businessId || 'N/A'}`,
          status: s.status || 'Active',
          lastUpdated: s.updatedAt || new Date().toISOString(),
          metadata: s
        }));
      }

      // 3. Users (Sellers / Buyers / Employees)
      if (selectedFilter === 'all' || selectedFilter === 'users') {
        const snap = await getDocs(query(collection(db, 'users'), limit(50)));
        const users = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
        
        // Map Sellers
        addMatches(users.filter(u => u.roles?.includes('seller')), 'seller', (u) => ({
          id: u.id || u.uid,
          title: u.displayName || u.username || 'Pioneer Seller',
          secondary: u.email || 'No Email',
          status: u.status || 'Active',
          lastUpdated: u.updatedAt || new Date().toISOString(),
          metadata: u
        }));

        // Map Buyers
        addMatches(users.filter(u => u.roles?.includes('buyer') || !u.roles), 'buyer', (u) => ({
          id: u.id || u.uid,
          title: u.displayName || u.username || 'Pioneer Buyer',
          secondary: u.email || 'No Email',
          status: u.status || 'Active',
          lastUpdated: u.updatedAt || new Date().toISOString(),
          metadata: u
        }));

        // Map Employees
        addMatches(users.filter(u => u.roles?.includes('employee')), 'employee', (u) => ({
          id: u.id || u.uid,
          title: u.displayName || u.username || 'Pioneer Employee',
          secondary: `${u.role || 'Staff'} • ${u.email || 'No Email'}`,
          status: u.status || 'Active',
          lastUpdated: u.updatedAt || new Date().toISOString(),
          metadata: u
        }));
      }

      // 4. Products
      if (selectedFilter === 'all' || selectedFilter === 'product') {
        const snap = await getDocs(query(collection(db, 'products'), limit(50)));
        addMatches(snap.docs.map(d => ({ id: d.id, ...d.data() })), 'product', (p) => ({
          id: p.id || p.productId,
          title: p.productName || p.name || 'Unnamed Product',
          secondary: `${p.basePrice || p.price || 0} ${p.currency || 'Pi'} • Category: ${p.category || 'General'}`,
          status: p.status || 'Published',
          lastUpdated: p.updatedAt || new Date().toISOString(),
          metadata: p
        }));
      }

      // 5. Services
      if (selectedFilter === 'all' || selectedFilter === 'service') {
        const snap = await getDocs(query(collection(db, 'services'), limit(50)));
        addMatches(snap.docs.map(d => ({ id: d.id, ...d.data() })), 'service', (s) => ({
          id: s.id || s.serviceId,
          title: s.title || s.serviceName || 'Unnamed Service',
          secondary: `${s.basePrice || 0} ${s.currency || 'Pi'} • Area: ${s.serviceArea || 'Global'}`,
          status: s.status || 'Active',
          lastUpdated: s.updatedAt || new Date().toISOString(),
          metadata: s
        }));
      }

      // 6. Orders
      if (selectedFilter === 'all' || selectedFilter === 'order') {
        const snap = await getDocs(query(collection(db, 'orders'), limit(50)));
        addMatches(snap.docs.map(d => ({ id: d.id, ...d.data() })), 'order', (o) => ({
          id: o.id || o.orderId,
          title: `Order #${(o.id || o.orderId || '').substring(0, 8)}`,
          secondary: `Buyer: ${o.buyerName || 'Pioneer'} • Total: ${o.totalPrice || o.amount || 0} ${o.currency || 'Pi'}`,
          status: o.status || o.orderStatus || 'Pending',
          lastUpdated: o.updatedAt || new Date().toISOString(),
          metadata: o
        }));
      }

      // 7. Payments
      if (selectedFilter === 'all' || selectedFilter === 'payment') {
        const snap = await getDocs(query(collection(db, 'payments'), limit(50)));
        addMatches(snap.docs.map(d => ({ id: d.id, ...d.data() })), 'payment', (p) => ({
          id: p.id,
          title: `Payment for Order #${(p.orderId || '').substring(0, 8)}`,
          secondary: `Amount: ${p.amount || 0} ${p.currency || 'Pi'} • Type: ${p.paymentMethod || 'Escrow'}`,
          status: p.status || p.paymentStatus || 'Completed',
          lastUpdated: p.updatedAt || new Date().toISOString(),
          metadata: p
        }));
      }

      // 8. Wallets (Pi / BMP)
      if (selectedFilter === 'all' || selectedFilter === 'wallet') {
        const walletsSnap = await getDocs(query(collection(db, 'wallets'), limit(30)));
        addMatches(walletsSnap.docs.map(d => ({ id: d.id, ...d.data() })), 'pi_wallet', (w) => ({
          id: w.id,
          title: `Pi Wallet (${(w.userId || w.id).substring(0, 10)})`,
          secondary: `Address: ${(w.walletAddress || 'N/A').substring(0, 12)}...`,
          status: `Bal: ${w.balance || 0} Pi`,
          lastUpdated: w.updatedAt || new Date().toISOString(),
          metadata: w
        }));

        const bmpSnap = await getDocs(query(collection(db, 'bmp_wallets'), limit(30)));
        addMatches(bmpSnap.docs.map(d => ({ id: d.id, ...d.data() })), 'bmp_wallet', (w) => ({
          id: w.id || w.userId,
          title: `BMP Wallet (${(w.userId || w.id).substring(0, 10)})`,
          secondary: `Address: ${(w.walletAddress || 'N/A').substring(0, 12)}...`,
          status: `Bal: ${w.balance || 0} BMP`,
          lastUpdated: w.updatedAt || new Date().toISOString(),
          metadata: w
        }));
      }

      // 9. Campaigns / Advertisements
      if (selectedFilter === 'all' || selectedFilter === 'campaign') {
        const snap = await getDocs(query(collection(db, 'campaigns'), limit(50)));
        const campaigns = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
        
        // Campaigns
        addMatches(campaigns.filter(c => c.campaignType !== 'sponsored_ad'), 'campaign', (c) => ({
          id: c.id,
          title: c.campaignTitle || c.title || 'Platform Promotion',
          secondary: `Type: ${c.campaignType || 'Ecosystem'} • CTR: ${c.ctr || 0}%`,
          status: c.status || 'Active',
          lastUpdated: c.updatedAt || new Date().toISOString(),
          metadata: c
        }));

        // Advertisements
        addMatches(campaigns.filter(c => c.campaignType === 'sponsored_ad'), 'advertisement', (c) => ({
          id: c.id,
          title: c.campaignTitle || c.title || 'Sponsored Ad',
          secondary: `Budget: ${c.budgetPi || 0} Pi • Clicks: ${c.clicks || 0}`,
          status: c.status || 'Active',
          lastUpdated: c.updatedAt || new Date().toISOString(),
          metadata: c
        }));
      }

      // 10. Disputes
      if (selectedFilter === 'all' || selectedFilter === 'dispute') {
        const snap = await getDocs(query(collection(db, 'disputes'), limit(50)));
        addMatches(snap.docs.map(d => ({ id: d.id, ...d.data() })), 'dispute', (d) => ({
          id: d.id,
          title: `Dispute on Order #${(d.orderId || '').substring(0, 8)}`,
          secondary: `Reason: ${d.reason || d.issueCategory || 'Claims'} • ${d.evidenceUrl ? 'Has Evidence' : 'No Evidence'}`,
          status: d.status || 'Pending Review',
          lastUpdated: d.updatedAt || new Date().toISOString(),
          metadata: d
        }));
      }

      // 11. Support Tickets
      const ticketsSnap = await getDocs(query(collection(db, 'support_tickets'), limit(20)));
      addMatches(ticketsSnap.docs.map(d => ({ id: d.id, ...d.data() })), 'support_ticket', (t) => ({
        id: t.id,
        title: t.subject || t.title || 'Support Request',
        secondary: `${t.category || 'General'} • User: ${t.userId || 'N/A'}`,
        status: t.status || 'Open',
        lastUpdated: t.updatedAt || new Date().toISOString(),
        metadata: t
      }));

      // 12. Notifications
      if (selectedFilter === 'all') {
        const notifSnap = await getDocs(query(collection(db, 'notifications'), limit(20)));
        addMatches(notifSnap.docs.map(d => ({ id: d.id, ...d.data() })), 'notification', (n) => ({
          id: n.id,
          title: n.title || 'Alert Notification',
          secondary: n.message || n.body || '',
          status: n.read ? 'Read' : 'Unread',
          lastUpdated: n.timestamp || new Date().toISOString(),
          metadata: n
        }));
      }

      // Apply strict RBAC filtering to respect privacy limits!
      const filtered = matches.filter(m => {
        // Platform Owner: Can search everything
        const isPO = user?.platformRole === 'superadmin' || user?.roles?.includes('superadmin');
        if (isPO) return true;

        // Scoped roles mapping
        const userId = user?.uid;
        if (!userId) return false;

        switch (m.entityType) {
          case 'business':
            return m.metadata?.ownerUid === userId;
          case 'store':
            return m.metadata?.ownerUid === userId || m.metadata?.managerUid === userId;
          case 'order':
            return m.metadata?.buyerUid === userId || m.metadata?.sellerUid === userId || m.metadata?.merchantId === userId;
          case 'payment':
            return m.metadata?.userId === userId || m.metadata?.buyerId === userId || m.metadata?.merchantId === userId;
          case 'pi_wallet':
          case 'bmp_wallet':
            return m.metadata?.userId === userId || m.metadata?.userUid === userId;
          case 'campaign':
          case 'advertisement':
            return m.metadata?.merchantId === userId;
          case 'dispute':
            return m.metadata?.buyerUid === userId || m.metadata?.sellerUid === userId;
          case 'notification':
            return m.metadata?.recipientUid === userId;
          case 'support_ticket':
            return m.metadata?.userId === userId;
          case 'product':
          case 'service':
            // Publicly searchable
            return true;
          default:
            return false;
        }
      });

      // Sort by status or title relevance
      setResults(filtered);
    } catch (err) {
      console.error("Error executing enterprise global search:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultClick = (res: SearchResult) => {
    const config = getEntityConfig(res.entityType);
    if (res.entityType === 'campaign' || res.entityType === 'advertisement' || res.entityType === 'dispute') {
      // Navigate to correct dashboard panel
      navigate(config.path);
    } else {
      navigate(`${config.path}${res.id}`);
    }
  };

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) {
      return <span>{text}</span>;
    }
    const regex = new RegExp(`(${highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) => 
          regex.test(part) ? (
            <mark key={i} className="bg-yellow-500/30 text-yellow-200 px-0.5 rounded-sm font-semibold">{part}</mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  // Group results by entityType for elegant structured view
  const groupedResults = results.reduce((acc, current) => {
    const type = current.entityType;
    if (!acc[type]) acc[type] = [];
    acc[type].push(current);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <div className="space-y-6">
      {/* Search Header and Bar */}
      <div className="relative" ref={searchContainerRef}>
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center bg-slate-900/40 p-4 border border-slate-800/80 rounded-3xl">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input 
              type="text"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Search across businesses, stores, orders, wallets, disputes..."
              className="w-full bg-slate-950 border border-slate-800/80 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-white placeholder-slate-500"
            />
            {isLoading && (
              <Loader className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400 animate-spin" />
            )}
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-950 border border-slate-800/80 rounded-2xl">
            <Filter className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-slate-400">Filters Active</span>
          </div>
        </div>

        {/* Live suggestions dropdown */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute left-0 right-0 top-full mt-2 bg-slate-950 border border-slate-800/80 rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-3 bg-slate-900/40 border-b border-slate-800/80">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Suggestions</span>
              </div>
              <div className="divide-y divide-slate-900">
                {suggestions.map((sg, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setKeyword(sg);
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-900/50 hover:text-white transition-all flex items-center justify-between"
                  >
                    <span>{sg}</span>
                    <ArrowRight className="w-4 h-4 text-slate-600" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dynamic Filter Pills */}
      <div className="flex flex-wrap gap-2 pb-2 overflow-x-auto scrollbar-none">
        {filtersList.map((f) => {
          const Icon = f.icon;
          const isActive = selectedFilter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setSelectedFilter(f.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 border border-transparent' 
                  : 'bg-slate-900/40 text-slate-400 hover:text-white hover:bg-slate-900/80 border border-slate-800/80'
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Results grid / groups */}
      <div className="space-y-8">
        {Object.keys(groupedResults).length === 0 && !isLoading && (
          <div className="text-center py-16 bg-slate-900/10 border border-dashed border-slate-800/80 rounded-3xl">
            <AlertTriangle className="w-10 h-10 text-slate-500 mx-auto mb-4" />
            <h3 className="text-base font-bold text-slate-300">No search results found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">Try typing another query or adjust your filters to locate the desired resource.</p>
          </div>
        )}

        {Object.entries(groupedResults).map(([entityType, list]) => {
          const config = getEntityConfig(entityType);
          const EntityIcon = config.icon;
          return (
            <div key={entityType} className="space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-800/60 pb-2">
                <div className={`p-1.5 rounded-lg ${config.color}`}>
                  <EntityIcon className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {config.label}s ({list.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {list.slice(0, 6).map((res) => (
                  <div
                    key={res.id}
                    onClick={() => handleResultClick(res)}
                    className="group bg-slate-900/30 hover:bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 p-4 rounded-2xl flex items-start justify-between gap-4 transition-all cursor-pointer shadow-sm hover:shadow-md hover:shadow-indigo-500/5"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors truncate">
                        {highlightText(res.title, keyword)}
                      </h4>
                      <p className="text-xs text-slate-400 truncate">
                        {highlightText(res.secondary, keyword)}
                      </p>
                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        <span className="text-[10px] bg-slate-850 border border-slate-800 px-2 py-0.5 rounded-full text-slate-500 font-medium">
                          {res.status}
                        </span>
                        {res.lastUpdated && (
                          <span className="text-[9px] text-slate-600">
                            Updated: {new Date(res.lastUpdated).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end justify-between h-full min-h-[50px]">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${config.color}`}>
                        {config.label}
                      </span>
                      <button className="opacity-0 group-hover:opacity-100 p-1.5 bg-slate-850 hover:bg-indigo-600 border border-slate-800 hover:border-indigo-500 text-slate-400 hover:text-white rounded-lg transition-all">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
