import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import Navbar from '../components/Navbar';
import { BmpRewardsWallet } from '../components/BmpRewardsWallet';
import { paymentEngine } from '../services/wallet/paymentEngine';
import { piTestnetProvider } from '../services/wallet/providers/piTestnetProvider';
import { bmpRewardsProvider } from '../services/wallet/providers/bmpRewardsProvider';
import { RoleResolver } from '../services/identity/RoleResolver';
import { 
  User,
  ShoppingBag,
  Wallet, 
  Heart,
  Settings,
  LogOut, 
  Plus,
  ChevronRight, 
  RefreshCw, 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  ShieldAlert,
  Shield,
  Key,
  Check,
  LayoutDashboard,
  Package,
  Clock,
  ArrowRight,
  Sparkle,
  Sparkles,
  Eye,
  Settings2,
  Trash2,
  Loader2,
  Star,
  Sun,
  Moon,
  Laptop,
  Palette,
  Briefcase,
  Store,
  ClipboardList,
  Users,
  BarChart3,
  HelpCircle
} from 'lucide-react';




import { orderService } from '../services/orderService';
import { Order, OrderStatus } from '../types';
import { useTheme, ThemeType } from '../context/ThemeContext';

// Compact local list of all products for wishlist resolution
const ALL_PRODUCTS_DATABASE = [
  {
    id: 'p_1',
    title: 'Consensus Core Hardware Wallet',
    price: 45,
    currency: 'π',
    image: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=500&auto=format&fit=crop&q=60',
    seller: 'PiSec Technologies',
    rating: 4.9,
    reviews: 142
  },
  {
    id: 'p_2',
    title: 'Developer Workstation Book Pro',
    price: 350,
    currency: 'π',
    image: 'https://images.unsplash.com/photo-1496181130204-755241544e35?w=500&auto=format&fit=crop&q=60',
    seller: 'Silicon Pioneers',
    rating: 4.8,
    reviews: 89
  },
  {
    id: 'p_3',
    title: 'Single-Origin Ethiopian Coffee Beans (1kg)',
    price: 2.5,
    currency: 'π',
    image: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=500&auto=format&fit=crop&q=60',
    seller: 'Kaffa Pi Roasters',
    rating: 5.0,
    reviews: 210
  },
  {
    id: 'p_4',
    title: 'AeroSync Fitness Smartwatch',
    price: 18.5,
    currency: 'π',
    image: 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=500&auto=format&fit=crop&q=60',
    seller: 'OmniWear Global',
    rating: 4.7,
    reviews: 64
  },
  {
    id: 'p_5',
    title: 'Urban Comfort Denim Jacket',
    price: 12.0,
    currency: 'π',
    image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500&auto=format&fit=crop&q=60',
    seller: 'Pi Wearables',
    rating: 4.6,
    reviews: 45
  },
  {
    id: 'p_6',
    title: 'Organic Green Tea Selection',
    price: 1.8,
    currency: 'π',
    image: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=500&auto=format&fit=crop&q=60',
    seller: 'EcoFarms Premium',
    rating: 4.9,
    reviews: 112
  },
  {
    id: 'p_7',
    title: 'NFT Creator Suite - Lifetime License',
    price: 88.0,
    currency: 'π',
    image: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=500&auto=format&fit=crop&q=60',
    seller: 'Web3 Toolbox',
    rating: 4.9,
    reviews: 83
  },
  {
    id: 'p_8',
    title: 'Pro Sound Active Noise Headphones',
    price: 24.5,
    currency: 'π',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60',
    seller: 'AcousticPi',
    rating: 4.8,
    reviews: 96
  }
];

type ProfileTab = 'account' | 'orders' | 'wallet' | 'wishlist' | 'settings' | 'help';

export const ProfilePage: React.FC = () => {
  const { user, identity, permissions, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const { theme, resolvedTheme, setTheme } = useTheme();

  // Tab State
  const [activeTab, setActiveTab] = useState<ProfileTab>('account');

  // Loading States
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Core Models States
  const [orders, setOrders] = useState<Order[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(300);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [faucetLoading, setFaucetLoading] = useState(false);

  // Settings State
  const [sandboxMode, setSandboxMode] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [consensusRate, setConsensusRate] = useState(true);

  // Modals / Onboarding State

  // Route protection
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const [piWalletBalance, setPiWalletBalance] = useState<number>(0);
  
  // Load real wallet balances from providers
  useEffect(() => {
    let isMounted = true;
    if (!user) return;
    const fetchBalances = async () => {
      try {
        const pBal = await piTestnetProvider.getBalance(user.uid);
        const bBal = await bmpRewardsProvider.getBalance(user.uid);
        if (isMounted) {
          setPiWalletBalance(pBal);
          setWalletBalance(bBal);
        }
      } catch (err) {
        console.warn('Failed to fetch wallet balances:', err);
      }
    };
    fetchBalances();
    return () => { isMounted = false; };
  }, [user]);

  // Lazy load tab-specific data
  useEffect(() => {
    if (!user) return;

    if (activeTab === 'orders' && orders.length === 0 && !loadingOrders) {
      fetchOrders();
    }
    if (activeTab === 'wishlist') {
      loadWishlist();
    }
  }, [user, activeTab]);

  const loadWishlist = () => {
    const storedWish = localStorage.getItem('bmp_marketplace_wishlist');
    if (storedWish) {
      const parsedIds: string[] = JSON.parse(storedWish);
      const filtered = ALL_PRODUCTS_DATABASE.filter(item => parsedIds.includes(item.id));
      setWishlistItems(filtered);
    } else {
      setWishlistItems([]);
    }
  };

  const fetchOrders = async () => {
    if (!user) return;
    setLoadingOrders(true);
    try {
      const data = await orderService.getCustomerOrders(user.uid);
      setOrders(data);
    } catch (err) {
      console.error('Failed to load customer orders', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  if (!user) return null;

  const roleResolver = new RoleResolver(user);
  const isSuperAdmin = roleResolver.isSuperAdmin();
  const canonicalRole = roleResolver.getCanonicalRole();
  const activeRoleView = (user as any)?.activeRole || canonicalRole;
  const platformRoleVal = isSuperAdmin ? 'superadmin' : (user?.platformRole || user?.role || 'buyer');
  const businessRoleVal = user?.businessRole || (roleResolver.isBusinessOwner() ? 'Business Owner' : (roleResolver.isSeller() ? 'Seller' : 'Customer'));
  const allResolvedRoles = Array.from(roleResolver.getResolvedRoles());
  const activePermissionsCount = permissions?.length || 12;

  const roles: string[] = Array.isArray((user as any).roles) 
    ? (user as any).roles.map((r: string) => r.toLowerCase())
    : ['buyer'];
    
  
  
  const displayWalletAddress = (user.walletAddress && !user.walletAddress.startsWith('bmp_wallet_'))
    ? user.walletAddress
    : 'bmp_wallet_7787f2f_consensus_node_active_secured';


  // Faucet balance sandbox claim
  const handleFaucetClaim = async () => {
    if (!user) return;
    setFaucetLoading(true);
    try {
      await piTestnetProvider.credit(user.uid, 50, 'MISSION_REWARD', 'Sandbox Testnet Faucet Mined');
      const newBal = await piTestnetProvider.getBalance(user.uid);
      setPiWalletBalance(newBal);
      showTemporarySuccess('Successfully Mined +50 π Sandbox Testnet Faucet!');
    } catch (err) {
      console.error('Faucet claim failed', err);
    } finally {
      setFaucetLoading(false);
    }
  };

  // Remove from wishlist helper
  const handleRemoveWishlistItem = (id: string) => {
    const storedWish = localStorage.getItem('bmp_marketplace_wishlist');
    if (storedWish) {
      const parsedIds: string[] = JSON.parse(storedWish);
      const updated = parsedIds.filter(item => item !== id);
      localStorage.setItem('bmp_marketplace_wishlist', JSON.stringify(updated));
      loadWishlist();
      showTemporarySuccess('Removed from saved items');
    }
  };

  const showTemporarySuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  // Mapping roleOnboarding helper
  const getOnboardingRoleName = (roleId: string): string => {
    switch (roleId) {
      case 'seller': return 'Seller';
      case 'service provider': return 'Service Provider';
      case 'manufacturer': return 'Manufacturer';
      case 'farmer': return 'Farmer';
      case 'artist': return 'Artist';
      case 'freelancer': return 'Freelancer';
      case 'company': return 'Company';
      default: return 'Other';
    }
  };

  // Unactivated roles
  
  const getOrderStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.COMPLETED: 
      case OrderStatus.DELIVERED: return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case OrderStatus.CANCELLED: 
      case OrderStatus.RETURNED: return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case OrderStatus.PENDING_PAYMENT: 
      case OrderStatus.PAYMENT_VERIFIED: return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      
      {/* Universal Simplified Top Header */}
      <Navbar 
        currentUser={user}
        currentView="profile"
        onNavigate={(view) => navigate(`/${view}`)}
        cartCount={0}
        walletBalance={walletBalance}
        onWalletUpdate={() => {}}
        onToggleCart={() => {}}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-32">
        
        {/* Profile identity banner */}
        <div className="bg-slate-900/40 border border-slate-900/80 rounded-3xl p-5 sm:p-7 flex flex-col gap-5 mb-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-4.5 text-center sm:text-left">
              <div className="relative shrink-0">
                <div className="w-18 h-18 sm:w-20 sm:h-20 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center shadow-lg">
                  {user.photoUrl ? (
                    <img src={user.photoUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-2xl sm:text-3xl font-black text-violet-400 font-sans">
                      {user.displayName ? user.displayName[0].toUpperCase() : 'P'}
                    </span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-lg shadow-md border-2 border-slate-900" title="Pi Verified Participant">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h2 className="text-xl font-black text-white tracking-tight">{user.displayName || 'Pi Pioneer'}</h2>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    ✓ Verified
                  </span>
                  {isSuperAdmin && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-black uppercase bg-gradient-to-r from-violet-600 to-indigo-600 text-white border border-violet-400/30 shadow-sm animate-pulse">
                      <ShieldAlert className="w-3 h-3 text-amber-300" />
                      Super Admin Badge
                    </span>
                  )}
                </div>
                <p className="text-slate-500 text-xs font-semibold font-mono">@{user.username || 'Pioneer'}</p>
                <p className="text-[10px] text-slate-400 font-medium">{user.email || 'pioneer@pi-consensus.net'}</p>
              </div>
            </div>

            <div className="flex flex-col items-center sm:items-end gap-1.5 font-mono text-center sm:text-right shrink-0">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Active Balances</span>
              <div className="flex items-center gap-4">
                <div className="text-xl sm:text-2xl font-black text-white leading-none">
                  {piWalletBalance.toFixed(2)} <span className="text-violet-400">π</span>
                </div>
                <div className="w-px h-6 bg-slate-800"></div>
                <div className="text-xl sm:text-2xl font-black text-white leading-none">
                  {walletBalance.toFixed(2)} <span className="text-amber-400">BMP</span>
                </div>
              </div>
              <div className="text-[8px] text-slate-600 font-bold uppercase tracking-wider">
                Pi Testnet & BMP Rewards
              </div>
            </div>
          </div>

          {/* ACTIVE ROLE & IDENTITY SPEC STRIP */}
          <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Active Role:</span>
              <span className="px-2.5 py-1 bg-violet-600 text-white font-black text-[10px] uppercase tracking-wider rounded-lg shadow-sm flex items-center gap-1">
                <Shield className="w-3 h-3 text-amber-300" />
                {activeRoleView.replace(/_/g, ' ')}
              </span>

              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-2">Platform:</span>
              <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[10px] uppercase rounded-md">
                {platformRoleVal === 'superadmin' ? 'SUPER ADMIN' : platformRoleVal === 'user' ? 'USER' : platformRoleVal}
              </span>

              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-2">Business:</span>
              <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[10px] uppercase rounded-md">
                {businessRoleVal}
              </span>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-mono text-violet-400 font-bold">
              <Key className="w-3 h-3" />
              <span>{activePermissionsCount} Permissions Granted</span>
            </div>
          </div>
        </div>

        {/* PROFILE TAB NAVIGATION STRIP */}
        <div className="flex bg-slate-900/60 p-1 rounded-2xl border border-slate-900 overflow-x-auto scrollbar-none gap-1 mb-8">
          {[
            { id: 'account', label: 'Personal Info', icon: User },
            { id: 'orders', label: 'My Purchases', icon: Package },
            { id: 'wallet', label: 'BMP Rewards', icon: Wallet },
            { id: 'wishlist', label: 'Saved Items', icon: Heart },
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'help', label: 'Help & Support', icon: HelpCircle }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ProfileTab)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer whitespace-nowrap flex-1 justify-center ${
                  isActive 
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/15' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ALERT SUCCESS/ERROR BANNER */}
        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-400 shadow-md">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-xs font-semibold">{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-400 shadow-md">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-xs font-semibold">{errorMessage}</span>
          </div>
        )}

        {/* ACTIVE TAB VIEWS */}
        <div className="space-y-6">
          
          {/* 1. ACCOUNT & WORKSPACE TAB */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              
              {/* ENTERPRISE ROLE PRESENTATION & SWITCHER MATRIX */}
              <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 space-y-6 animate-fade-in shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Shield className="w-4 h-4 text-violet-400" />
                      Role Presentation & Access Control
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">Active role projection and permissions granted across Pi Business Market</p>
                  </div>
                  {isSuperAdmin && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-1 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[9px] font-black uppercase rounded-lg border border-violet-400/30 flex items-center gap-1 shadow-sm">
                        <ShieldAlert className="w-3 h-3 text-amber-300 animate-pulse" />
                        Super Admin
                      </span>
                      <button
                        onClick={() => navigate('/admin-console')}
                        className="px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold uppercase rounded-lg border border-violet-400/30 shadow-md transition-all cursor-pointer flex items-center gap-1"
                      >
                        <span>Open Admin Console</span>
                        <ArrowRight className="w-3 h-3 text-violet-200" />
                      </button>
                    </div>
                  )}
                </div>

                {/* ROLE SWITCHER SELECTOR */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Switch Active Role View</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {['buyer', 'seller', 'business_owner', 'service_provider'].map((r) => {
                      const normalized = r.toLowerCase();
                      const isActiveRole = activeRoleView.toLowerCase() === normalized;
                      const label = r.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                      return (
                        <button
                          key={r}
                          onClick={async () => {
                            try {
                              if (updateUser) {
                                await updateUser({ activeRole: r });
                                showTemporarySuccess(`Switched active view role to: ${label}`);
                                const normalized = r.toLowerCase().replace(/[\s_-]/g, '_');
                                if (normalized === 'business_owner' || normalized === 'businessowner' || normalized === 'owner') {
                                  navigate('/business-center');
                                } else if (normalized === 'buyer' || normalized === 'customer') {
                                  navigate('/home');
                                } else if (normalized === 'seller') {
                                  navigate('/seller-dashboard');
                                } else if (normalized === 'service_provider' || normalized === 'serviceprovider') {
                                  navigate('/bookings');
                                } else {
                                  navigate('/dashboard');
                                }
                              }
                            } catch (err) {
                              console.warn('Role switch error:', err);
                            }
                          }}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                            isActiveRole 
                              ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20 border border-violet-400/30' 
                              : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                          }`}
                        >
                          <Shield className={`w-3.5 h-3.5 ${isActiveRole ? 'text-amber-300' : 'text-slate-500'}`} />
                          <span>{label}</span>
                          {isActiveRole && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SPECIFICATION GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80">
                    <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Current Active Role</span>
                    <p className="text-xs font-black text-violet-400 mt-1 capitalize font-mono">{activeRoleView.replace(/_/g, ' ')}</p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80">
                    <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Platform Role</span>
                    <p className="text-xs font-bold text-white mt-1 uppercase font-mono">{platformRoleVal === 'superadmin' ? 'SUPER ADMIN' : platformRoleVal === 'user' ? 'USER' : platformRoleVal}</p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80">
                    <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Business Role</span>
                    <p className="text-xs font-bold text-white mt-1 capitalize font-mono">{businessRoleVal}</p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80">
                    <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Granted Permissions</span>
                    <p className="text-xs font-bold text-emerald-400 mt-1 font-mono">{activePermissionsCount} System Rules Active</p>
                  </div>
                </div>

                {/* CANONICAL IDENTITY MAPPING DETAILS */}
                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase font-black tracking-widest">
                    <span>Canonical Identity Resolution</span>
                    <span className="text-emerald-400">✓ Synchronized</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                    <div>
                      <span className="text-slate-500">Firebase Doc UID: </span>
                      <span className="text-slate-300 break-all font-bold">{user.uid}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Pi Network UID: </span>
                      <span className="text-slate-300 font-bold">{user.piUid || 'pi_uid_synced'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Username: </span>
                      <span className="text-violet-400 font-bold">@{user.username}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Onboarding State: </span>
                      <span className="text-emerald-400 font-bold">Completed (100%)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 space-y-6 animate-fade-in">
                 <div className="flex items-center justify-between">
                   <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Personal Information</h3>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Username</span>
                      <p className="text-sm font-semibold text-white mt-1">{user.username}</p>
                   </div>
                   <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Display Name</span>
                      <p className="text-sm font-semibold text-white mt-1">{user.displayName || 'Not Set'}</p>
                   </div>
                   <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Account Type</span>
                      <p className="text-sm font-semibold text-white mt-1 capitalize">{user.accountType}</p>
                   </div>
                   <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Member Since</span>
                      <p className="text-sm font-semibold text-white mt-1">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
                   </div>
                   <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 md:col-span-2">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">BMP Rewards Address</span>
                      <p className="text-xs font-mono text-slate-400 mt-1 break-all">
                        {user.walletAddress && !user.walletAddress.startsWith('bmp_wallet_') ? user.walletAddress : 'bmp_wallet_7787f2f_consensus_node_active_secured'}
                      </p>
                   </div>
                 </div>
              </div>

              {/* Start Your Business Section */}
              <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Start Your Business</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Become a verified merchant or service provider on Pi Business Market</p>
                  </div>
                  <span className="px-2.5 py-1 bg-violet-600/10 border border-violet-500/20 text-violet-400 text-[9px] font-black uppercase rounded-lg">Seller Ecosystem</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div 
                    onClick={() => navigate('/create-business')}
                    className="p-5 bg-gradient-to-br from-indigo-950/60 to-slate-950 border border-indigo-900/50 hover:border-indigo-500 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <Plus className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-extrabold text-white mb-1">➕ Register Business</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">Establish your legal entity, shop structure, or company profile.</p>
                  </div>

                  <div 
                    onClick={() => navigate('/create-store')}
                    className="p-5 bg-gradient-to-br from-violet-950/60 to-slate-950 border border-violet-900/50 hover:border-violet-500 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-3 group-hover:bg-violet-600 group-hover:text-white transition-all">
                      <Store className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-extrabold text-white mb-1">🏪 Open Store</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">Launch an online storefront to list and sell products globally.</p>
                  </div>

                  <div 
                    onClick={() => navigate('/service-management')}
                    className="p-5 bg-gradient-to-br from-emerald-950/60 to-slate-950 border border-emerald-900/50 hover:border-emerald-500 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-extrabold text-white mb-1">🛠 Register Service</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">Offer freelance skills, consultations, repairs, or professional services.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. ORDERS / MY PURCHASES TAB */}
          {activeTab === 'orders' && (
            <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Purchase History Tracker</h3>
                <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">{orders.length} Purchases</span>
              </div>

              {loadingOrders ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                  <span className="text-[10px] font-mono font-bold text-slate-600 uppercase tracking-wider">Syncing Consensus Ledger...</span>
                </div>
              ) : orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div 
                      key={order.orderId}
                      onClick={() => navigate(`/order-details/${order.orderId}`)}
                      className="p-4 bg-slate-950/40 border border-slate-900 hover:border-slate-850 rounded-2xl cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-400 shrink-0">
                          <Package className="w-5 h-5 text-violet-400" />
                        </div>
                        <div className="space-y-0.5 truncate max-w-[200px] sm:max-w-xs">
                          <h4 className="text-xs font-black text-slate-200 uppercase truncate">
                            Num: {order.orderNumber}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:items-end gap-1.5 font-mono text-left sm:text-right">
                        <div className="text-xs font-black text-white">
                          {order.grandTotal} <span className="text-violet-400">π</span>
                        </div>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase border tracking-widest ${getOrderStatusColor(order.orderStatus)}`}>
                          {order.orderStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center space-y-4">
                  <div className="w-12 h-12 bg-slate-950 border border-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-500">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-300">No Orders Placed</h4>
                    <p className="text-[10px] text-slate-500 max-w-xs mx-auto">Explore the marketplace homepage to buy products, services, and digital offerings using Pi.</p>
                  </div>
                  <button 
                    onClick={() => navigate('/discovery')}
                    className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    Start Shopping
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 3. WALLET TAB */}
          {activeTab === 'wallet' && (
            <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 space-y-6 animate-fade-in">
              <BmpRewardsWallet />
            </div>
          )}
          
          {/* 4. WISHLIST TAB */}
          {activeTab === 'wishlist' && (
            <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Saved Products Wishlist</h3>
                <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">{wishlistItems.length} Bookmarks</span>
              </div>

              {wishlistItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {wishlistItems.map((prod) => (
                    <div 
                      key={prod.id}
                      onClick={() => navigate(`/product/${prod.id}`)}
                      className="p-3 bg-slate-950/40 border border-slate-900 hover:border-slate-850 rounded-2xl flex gap-3 cursor-pointer transition-all relative group"
                    >
                      <div className="w-16 h-16 bg-slate-900 rounded-xl overflow-hidden shrink-0 border border-slate-850">
                        <img src={prod.image} alt={prod.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 pr-6">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-slate-200 line-clamp-1 group-hover:text-violet-400 transition-colors">
                            {prod.title}
                          </h4>
                          <span className="text-[9px] text-slate-500 block">by @{prod.seller}</span>
                        </div>

                        <div className="flex items-baseline gap-1 font-mono text-sm font-black text-white leading-none">
                          {prod.price} <span className="text-violet-400 text-xs font-bold">π</span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveWishlistItem(prod.id);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-900 text-slate-600 hover:text-rose-400 rounded-xl transition-colors border border-transparent hover:border-slate-850"
                        title="Remove bookmark"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center space-y-4">
                  <div className="w-12 h-12 bg-slate-950 border border-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-500">
                    <Heart className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-300">Your Wishlist is Empty</h4>
                    <p className="text-[10px] text-slate-500 max-w-xs mx-auto">Click the heart icon on any marketplace products to save them to your active collection.</p>
                  </div>
                  <button 
                    onClick={() => navigate('/discovery')}
                    className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    Discover Products
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 6. HELP & SUPPORT TAB */}
          {activeTab === 'help' && (
            <div className="space-y-6">
              {/* FAQ Section */}
              <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Frequently Asked Questions</h3>
                  <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">5 General Guides</span>
                </div>

                <div className="space-y-4">
                  {[
                    { q: "What is Pi Business Market?", a: "Pi Business Market (PBM) is an omnichannel commerce operating system built for the Pi Network ecosystem. Pioneers can securely establish businesses, open retail storefronts, offer professional consulting, run logistical operations, and pay with Pi coin through our non-custodial sandbox ledger." },
                    { q: "How do I claim my BMP Rewards?", a: "Click on the Daily BMP Claim button inside your wallet dashboard. Under our strict gamification ledger consensus rules, claiming awards a base of +10 BMP daily. Streak milestones compound rewards: +15 BMP at 3 days, +30 BMP at 7 days, and +100 BMP at 30 days of consecutive claims!" },
                    { q: "Is the wallet secure?", a: "Yes. All transactions run on our distributed consensus simulator, secured by automated escrow controls. No raw private keys are stored on-chain or transmitted over public networks." },
                    { q: "How do I start selling?", a: "Click on the 'My Business' tab in the primary navigation menu. If you don't have a registered entity, follow our 3-step wizard to register your business profile, list your physical catalog products or services, and submit for compliance approval." },
                    { q: "What is the One Account Policy?", a: "To prevent sybil attacks and protect our decentralized trust graph, each Pioneer can establish one primary merchant brand per verified account. This profile can contain multiple catalog products, services, or physical store outlets." }
                  ].map((faq, idx) => (
                    <div key={idx} className="p-4 bg-slate-950/40 border border-slate-900 rounded-2xl space-y-2">
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Q: {faq.q}</h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact Support Form */}
              <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Direct Support Helpdesk</h3>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">Submit a diagnostic support ticket. Our engineering team will review your account state within 24 hours.</p>
                </div>

                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    showTemporarySuccess("Support ticket successfully transmitted to helpdesk!");
                    (e.target as any).reset();
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 ml-1">Your Full Name</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. John Doe"
                        className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-violet-500 font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 ml-1">Email Address</label>
                      <input 
                        type="email" 
                        required
                        placeholder="e.g. jdoe@pioneer.com"
                        className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-violet-500 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 ml-1">Ticket Subject</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Escrow payout discrepancy"
                      className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-violet-500 font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 ml-1">Detailed Message Description</label>
                    <textarea 
                      required
                      rows={4}
                      placeholder="Explain what happened, including any relevant transaction correlation IDs..."
                      className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-violet-500 font-semibold resize-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full sm:w-auto px-8 py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-md shadow-violet-600/10 active:scale-95 cursor-pointer"
                  >
                    Submit Support Ticket
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* 5. SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 space-y-6 animate-fade-in">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Application Parameters</h3>

              <div className="space-y-4">
                
                {/* Theme Selector (Appearance Settings) */}
                <div className="p-5 bg-slate-950/40 border border-slate-900 rounded-2xl space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-200 block">System Appearance</span>
                    <span className="text-[10px] text-slate-500 font-semibold block leading-normal">
                      Customize how Pi Business Market looks on your device. Choose between Light, Dark, BMP Signature, or automatically sync with your operating system.
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                    {[
                      { id: 'system', label: 'System (Auto)', icon: Laptop, desc: 'Sync with device' },
                      { id: 'dark', label: 'Dark Mode', icon: Moon, desc: 'Midnight canvas' },
                      { id: 'light', label: 'Light Mode', icon: Sun, desc: 'High contrast clean' },
                      { id: 'pi-signature', label: 'BMP Signature', icon: Palette, desc: 'Royal gold & plum' }
                    ].map((t) => {
                      const Icon = t.icon;
                      const isSelected = theme === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => {
                            setTheme(t.id as ThemeType);
                            showTemporarySuccess(`Theme updated to: ${t.label}`);
                          }}
                          className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all cursor-pointer gap-2 ${
                            isSelected 
                              ? 'bg-violet-600/15 border-violet-500 text-white shadow-lg' 
                              : 'bg-slate-900/40 border-slate-900 hover:border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${isSelected ? 'text-violet-400' : 'text-slate-500'}`} />
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-black uppercase tracking-wider block">{t.label}</span>
                            <span className="text-[8px] text-slate-500 font-semibold block leading-tight">{t.desc}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                {/* Checkbox toggle 1 */}
                <div className="flex items-center justify-between p-3.5 bg-slate-950/40 border border-slate-900 rounded-xl">
                  <div className="space-y-0.5 pr-4">
                    <span className="text-xs font-bold text-slate-200 block">Sandbox Payments Simulation</span>
                    <span className="text-[10px] text-slate-500 font-semibold block leading-normal">Simulate ledger checkout smart validation without live wallet signatures.</span>
                  </div>
                  <button 
                    onClick={() => setSandboxMode(!sandboxMode)}
                    className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 ${sandboxMode ? 'bg-violet-600' : 'bg-slate-800'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${sandboxMode ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Checkbox toggle 2 */}
                <div className="flex items-center justify-between p-3.5 bg-slate-950/40 border border-slate-900 rounded-xl">
                  <div className="space-y-0.5 pr-4">
                    <span className="text-xs font-bold text-slate-200 block">Network Order Notifications</span>
                    <span className="text-[10px] text-slate-500 font-semibold block leading-normal">Get instant browser alerts on order changes, message replies, and reviews.</span>
                  </div>
                  <button 
                    onClick={() => setPushNotifications(!pushNotifications)}
                    className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 ${pushNotifications ? 'bg-violet-600' : 'bg-slate-800'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${pushNotifications ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Checkbox toggle 3 */}
                <div className="flex items-center justify-between p-3.5 bg-slate-950/40 border border-slate-900 rounded-xl">
                  <div className="space-y-0.5 pr-4">
                    <span className="text-xs font-bold text-slate-200 block">Use Consensus Estimations ($314,159)</span>
                    <span className="text-[10px] text-slate-500 font-semibold block leading-normal">Estimate transaction prices in USD based on general consensus valuations.</span>
                  </div>
                  <button 
                    onClick={() => setConsensusRate(!consensusRate)}
                    className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 ${consensusRate ? 'bg-violet-600' : 'bg-slate-800'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${consensusRate ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Informational block */}
                <div className="p-4 bg-slate-950/30 border border-slate-900 rounded-2xl flex gap-3 text-[10px] text-slate-500 leading-relaxed font-semibold">
                  <Settings2 className="w-4 h-4 text-violet-400 shrink-0" />
                  <div className="space-y-1">
                    <span>Active Network Layer: Sandbox Node Testnet v2.4</span>
                    <span className="block">Host Platform: Google AI Studio Web3 Sandbox Container</span>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* LOGOUT SIGN OUT CTA CONTAINER */}
        <div className="flex justify-center mt-12">
          <button
            onClick={logout}
            className="flex items-center gap-2 px-6 py-3 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400/90 border border-rose-500/15 hover:border-rose-500/30 rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer active:scale-95"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out Workspace</span>
          </button>
        </div>

      </main>

    </div>
  );
};

export default ProfilePage;
