import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import Navbar from '../components/Navbar';
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
  Palette
} from 'lucide-react';
import { RoleOnboardingLauncher } from '../components/profile/RoleOnboardingLauncher';
import { ROLES_CONFIG, RoleConfig } from '../auth/authService';
import { AddBusinessRoleDialog } from '../components/AddBusinessRoleDialog';
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

type ProfileTab = 'account' | 'orders' | 'wallet' | 'wishlist' | 'settings';

export const ProfilePage: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
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
  const [walletBalance, setWalletBalance] = useState<number>(100);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [faucetLoading, setFaucetLoading] = useState(false);

  // Settings State
  const [sandboxMode, setSandboxMode] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [consensusRate, setConsensusRate] = useState(true);

  // Modals / Onboarding State
  const [roleSelectionOpen, setRoleSelectionOpen] = useState(false);
  const [selectedRoleForOnboarding, setSelectedRoleForOnboarding] = useState<string | null>(null);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [activeOnboardingRole, setActiveOnboardingRole] = useState<string | null>(null);

  // Route protection
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Load persistence states on mount
  useEffect(() => {
    if (user) {
      // 1. Fetch Orders
      fetchOrders();

      // 2. Load Wallet Balance
      const storedBalance = localStorage.getItem('pi_wallet_balance');
      if (storedBalance) {
        setWalletBalance(parseFloat(storedBalance));
      } else {
        localStorage.setItem('pi_wallet_balance', '100');
        setWalletBalance(100);
      }

      // 3. Load Wishlist Items
      loadWishlist();
    }
  }, [user]);

  const loadWishlist = () => {
    const storedWish = localStorage.getItem('pi_marketplace_wishlist');
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

  const roles: string[] = Array.isArray((user as any).roles) 
    ? (user as any).roles.map((r: string) => r.toLowerCase())
    : ['buyer'];
    
  const activeRole: string = (user as any).activeRole 
    ? String((user as any).activeRole).toLowerCase() 
    : 'buyer';

  const isBusinessRoleActive = ROLES_CONFIG[activeRole]?.hasWorkspace || false;

  const displayWalletAddress = (user.walletAddress && !user.walletAddress.startsWith('pi_wallet_'))
    ? user.walletAddress
    : 'pi_wallet_7787f2f_consensus_node_active_secured';

  // Switch active role
  const handleSwitchActiveRole = async (roleId: string) => {
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      await updateUser({
        activeRole: roleId
      } as any);
      const label = ROLES_CONFIG[roleId]?.label || roleId.toUpperCase();
      showTemporarySuccess(`Switched active workspace role to: ${label}`);
    } catch (err: any) {
      console.error('[ProfilePage] Error switching active role:', err);
      setErrorMessage(err.message || 'Failed to switch active role.');
    } finally {
      setSaving(false);
    }
  };

  // Faucet balance sandbox claim
  const handleFaucetClaim = () => {
    setFaucetLoading(true);
    setTimeout(() => {
      const newBal = walletBalance + 50;
      setWalletBalance(newBal);
      localStorage.setItem('pi_wallet_balance', String(newBal));
      setFaucetLoading(false);
      showTemporarySuccess('Successfully Mined +50 π Sandbox Testnet Faucet!');
    }, 1200);
  };

  // Remove from wishlist helper
  const handleRemoveWishlistItem = (id: string) => {
    const storedWish = localStorage.getItem('pi_marketplace_wishlist');
    if (storedWish) {
      const parsedIds: string[] = JSON.parse(storedWish);
      const updated = parsedIds.filter(item => item !== id);
      localStorage.setItem('pi_marketplace_wishlist', JSON.stringify(updated));
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
  const unactivatedBusinessRoles: RoleConfig[] = Object.values(ROLES_CONFIG).filter(
    (r: RoleConfig) => r.id !== 'buyer' && !roles.includes(r.id)
  );

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
        <div className="bg-slate-900/40 border border-slate-900/80 rounded-3xl p-5 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-6 mb-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 rounded-full blur-2xl pointer-events-none" />
          
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
              </div>
              <p className="text-slate-500 text-xs font-semibold font-mono">@{user.username || 'pioneer'}</p>
              <p className="text-[10px] text-slate-400 font-medium">{user.email || 'pioneer@pi-consensus.net'}</p>
            </div>
          </div>

          <div className="flex flex-col items-center sm:items-end gap-1.5 font-mono text-center sm:text-right shrink-0">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Active Balance</span>
            <div className="text-xl sm:text-2xl font-black text-white leading-none">
              {walletBalance.toFixed(2)} <span className="text-violet-400">π</span>
            </div>
            <div className="text-[8px] text-slate-600 font-bold uppercase tracking-wider">
              Est: ${(walletBalance * 314.159).toLocaleString(undefined, {maximumFractionDigits: 2})} USD
            </div>
          </div>
        </div>

        {/* PROFILE TAB NAVIGATION STRIP */}
        <div className="flex bg-slate-900/60 p-1 rounded-2xl border border-slate-900 overflow-x-auto scrollbar-none gap-1 mb-8">
          {[
            { id: 'account', label: 'Account & Workspace', icon: User },
            { id: 'orders', label: 'My Purchases', icon: Package },
            { id: 'wallet', label: 'Pi Wallet', icon: Wallet },
            { id: 'wishlist', label: 'Saved Items', icon: Heart },
            { id: 'settings', label: 'Settings', icon: Settings }
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
            <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 space-y-6 animate-fade-in">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Workspace Profile Management</h3>
              
              {/* Role info & swapper */}
              <div className="p-4.5 bg-slate-950/60 rounded-2xl border border-slate-900/80 space-y-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Active Network Role</span>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-600/15 border border-violet-500/20 text-xs font-black text-violet-400 capitalize rounded-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                    {ROLES_CONFIG[activeRole]?.iconName} {ROLES_CONFIG[activeRole]?.label || activeRole}
                  </div>
                </div>

                {roles.length > 1 && (
                  <div className="space-y-2 pt-2 border-t border-slate-900/80">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Swap Active Workspace</span>
                    <div className="flex flex-wrap gap-2">
                      {roles.map((rId) => {
                        const rConfig = ROLES_CONFIG[rId];
                        const isSelected = activeRole === rId;
                        return (
                          <button
                            key={rId}
                            onClick={() => handleSwitchActiveRole(rId)}
                            disabled={saving}
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              isSelected 
                                ? 'bg-violet-600 text-white border-violet-500/30 shadow-md' 
                                : 'bg-slate-900 border-slate-850 hover:border-slate-750 text-slate-400 hover:text-white'
                            }`}
                          >
                            <span>{rConfig?.iconName || '👤'}</span>
                            <span className="capitalize">{rConfig?.label || rId}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Direct Workspace Redirect */}
              {isBusinessRoleActive && (
                <div className="p-5 bg-gradient-to-br from-violet-950/15 to-indigo-950/5 border border-violet-500/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">Business Management Desk</h4>
                    <p className="text-[10px] text-slate-400 font-semibold">Access catalog listings, customer bookings, inventory analytics, and payments.</p>
                  </div>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all duration-300 cursor-pointer shrink-0"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>My Workspace</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Direct Store & Products Shortcuts for Sellers */}
              {roles.includes('seller') && (
                <div className="p-5 bg-slate-950/60 border border-slate-900 rounded-2xl space-y-4">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">My Store & Business Shortcuts</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => navigate('/store-dashboard')}
                      className="flex items-center justify-between p-3.5 bg-slate-900 border border-slate-850 hover:border-violet-500/30 rounded-xl text-left transition-all cursor-pointer group"
                    >
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-200 group-hover:text-violet-400 transition-colors block">Store Dashboard</span>
                        <span className="text-[9px] text-slate-500 block">Manage store metrics and orders</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-violet-400 transition-colors shrink-0" />
                    </button>

                    <button
                      onClick={() => navigate('/catalog')}
                      className="flex items-center justify-between p-3.5 bg-slate-900 border border-slate-850 hover:border-violet-500/30 rounded-xl text-left transition-all cursor-pointer group"
                    >
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-200 group-hover:text-violet-400 transition-colors block">My Products Catalog</span>
                        <span className="text-[9px] text-slate-500 block">Create and edit store inventory</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-violet-400 transition-colors shrink-0" />
                    </button>
                  </div>
                </div>
              )}

              {/* Add role onboarding action */}
              <div className="pt-4 border-t border-slate-900/60 flex flex-col items-center justify-center text-center space-y-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-300">Expand Your Business Network</h4>
                  <p className="text-[10px] text-slate-500 max-w-sm leading-relaxed font-medium">Activate additional seller, service provider, farmer, manufacturer, or company workspace profiles to sell on the Pi Marketplace.</p>
                </div>
                <button
                  onClick={() => setRoleSelectionOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-slate-900 border border-slate-850 hover:border-violet-500/30 text-slate-300 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-violet-400" />
                  <span>Activate Business Role</span>
                </button>
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
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Pi Sandbox Wallet</h3>

              {/* Premium holographic-style Card design */}
              <div className="bg-gradient-to-br from-violet-950 via-indigo-950 to-slate-950 rounded-2xl p-5 sm:p-6 text-white border border-violet-800/20 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 w-32 h-32 rounded-full bg-violet-600/10 blur-2xl pointer-events-none" />
                <div className="absolute left-1/3 bottom-0 w-24 h-24 rounded-full bg-indigo-500/5 blur-xl pointer-events-none" />
                
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-violet-300">Consensus Testnet Card</span>
                  </div>
                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">Verified Secured</span>
                </div>

                <div className="space-y-0.5 mb-6">
                  <span className="text-[9px] text-violet-300 uppercase tracking-widest font-bold">Consensus Sandbox Balance</span>
                  <div className="text-3xl font-mono font-black flex items-baseline gap-1 text-slate-100 leading-none">
                    {walletBalance.toFixed(2)} <span className="text-amber-400 font-bold text-xl">π</span>
                  </div>
                </div>

                <div className="space-y-1 bg-slate-950/40 p-2.5 rounded-xl border border-slate-900/60 font-mono">
                  <span className="text-[7px] text-slate-500 uppercase font-black block">Public Wallet Key Address</span>
                  <p className="text-[9px] text-slate-300 select-all truncate">
                    {displayWalletAddress}
                  </p>
                </div>
              </div>

              {/* Faucet Sandbox claim panel */}
              <div className="p-4.5 bg-slate-950/60 border border-slate-900 rounded-2xl space-y-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-300">Sandbox Testnet Faucet Miner</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">Mine sandbox mock Pi coins to test checkout ordering, payments, and shopping flow systems securely.</p>
                </div>

                <button
                  onClick={handleFaucetClaim}
                  disabled={faucetLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-700 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer active:scale-95"
                >
                  {faucetLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <PlusCircle className="w-4 h-4" />
                  )}
                  <span>Claim +50 π Sandbox Coins</span>
                </button>
              </div>

              {/* Mining Stats logs */}
              <div className="grid grid-cols-2 gap-3.5 pt-2 font-mono text-[9px] text-slate-500 uppercase font-black">
                <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-xl flex flex-col gap-1">
                  <span className="text-slate-600">Gas fee standard</span>
                  <span className="text-slate-300">0.01 π</span>
                </div>
                <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-xl flex flex-col gap-1">
                  <span className="text-slate-600">Mining status</span>
                  <span className="text-emerald-500">Online & Syncing</span>
                </div>
              </div>

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
                      Customize how Pi Business Market looks on your device. Choose between Light, Dark, Pi Signature, or automatically sync with your operating system.
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                    {[
                      { id: 'system', label: 'System (Auto)', icon: Laptop, desc: 'Sync with device' },
                      { id: 'dark', label: 'Dark Mode', icon: Moon, desc: 'Midnight canvas' },
                      { id: 'light', label: 'Light Mode', icon: Sun, desc: 'High contrast clean' },
                      { id: 'pi-signature', label: 'Pi Signature', icon: Palette, desc: 'Royal gold & plum' }
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

      {/* 1. ROLE SELECTION DIALOG (MODAL) */}
      {roleSelectionOpen && (
        <AddBusinessRoleDialog
          unactivatedRoles={unactivatedBusinessRoles}
          onClose={() => setRoleSelectionOpen(false)}
          onSelectRole={(roleId) => {
            setSelectedRoleForOnboarding(roleId);
            setShowConfirmationDialog(true);
          }}
        />
      )}

      {/* 2. CONFIRMATION DIALOG (MODAL) */}
      {showConfirmationDialog && selectedRoleForOnboarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setShowConfirmationDialog(false)}
          />
          <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl max-w-sm w-full relative z-10 shadow-2xl space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-black text-white tracking-tight">
                Become a {ROLES_CONFIG[selectedRoleForOnboarding]?.label}?
              </h3>
              <p className="text-slate-400 text-xs font-medium leading-relaxed">
                Are you sure you want to activate the {ROLES_CONFIG[selectedRoleForOnboarding]?.label} role? This will launch the corresponding onboarding wizard.
              </p>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmationDialog(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmationDialog(false);
                  setRoleSelectionOpen(false);
                  setActiveOnboardingRole(selectedRoleForOnboarding);
                }}
                className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Confirm & Onboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. ONBOARDING LAUNCHER WIZARD OVERLAY */}
      {activeOnboardingRole && (
        <RoleOnboardingLauncher
          role={getOnboardingRoleName(activeOnboardingRole)}
          user={user}
          onClose={() => {
            setActiveOnboardingRole(null);
            setSelectedRoleForOnboarding(null);
          }}
          onComplete={async () => {
            const roleToActivate = activeOnboardingRole;
            setActiveOnboardingRole(null);
            setSelectedRoleForOnboarding(null);
            
            // Activate the selected role upon successful onboarding
            setSaving(true);
            try {
              const updatedRoles = roles.includes(roleToActivate) ? roles : [...roles, roleToActivate];
              await updateUser({
                roles: updatedRoles,
                activeRole: roleToActivate
              } as any);
              const label = ROLES_CONFIG[roleToActivate]?.label || roleToActivate.toUpperCase();
              showTemporarySuccess(`Onboarding completed! Switched active role to: ${label}`);
            } catch (err: any) {
              console.error('[ProfilePage] Error completing onboarding activation:', err);
              setErrorMessage('Onboarding succeeded, but we failed to activate the role on your profile.');
            } finally {
              setSaving(false);
            }
          }}
        />
      )}
    </div>
  );
};

export default ProfilePage;
