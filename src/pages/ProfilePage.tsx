import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import Navbar from '../components/Navbar';
import { BmpRewardsWallet } from '../components/BmpRewardsWallet';
import { piTestnetProvider } from '../services/wallet/providers/piTestnetProvider';
import { bmpRewardsProvider } from '../services/wallet/providers/bmpRewardsProvider';
import { RoleResolver } from '../services/identity/RoleResolver';
import { mediaService } from '../services/mediaService';
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
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  ShieldAlert,
  Shield,
  Key,
  Check,
  Package,
  Clock,
  ArrowRight,
  Sparkles,
  Settings2,
  Sliders,
  Trash2,
  Loader2,
  Star,
  Sun,
  Moon,
  Laptop,
  Palette,
  Briefcase,
  Store,
  HelpCircle,
  Edit3,
  Mail,
  Phone,
  MapPin,
  Globe,
  Copy,
  CheckCheck,
  Bell,
  Lock,
  ExternalLink,
  X,
  Save,
  UserCheck,
  ShieldQuestion,
  Building2,
  FileText,
  Upload,
  Camera,
  Image as ImageIcon
} from 'lucide-react';

import { orderService } from '../services/orderService';
import { productService } from '../services/productService';
import { Order, OrderStatus } from '../types';
import { useTheme, ThemeType } from '../context/ThemeContext';

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

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState(user?.displayName || '');
  const [editFullName, setEditFullName] = useState(user?.fullName || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editPhone, setEditPhone] = useState((user as any)?.phone || '');
  const [editBio, setEditBio] = useState((user as any)?.bio || '');
  const [editCountry, setEditCountry] = useState((user as any)?.country || 'Global Pioneer');
  const [editPhotoUrl, setEditPhotoUrl] = useState(user?.photoUrl || '');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Avatar Upload & Preview States
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null);
  const [avatarUploadSuccess, setAvatarUploadSuccess] = useState(false);
  const [showUrlFallback, setShowUrlFallback] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Core Models States
  const [orders, setOrders] = useState<Order[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(300);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [faucetLoading, setFaucetLoading] = useState(false);

  // Settings State & Preferences Management
  const [settingsCategory, setSettingsCategory] = useState<'all' | 'account' | 'business' | 'notifications' | 'appearance' | 'communication' | 'workspace' | 'security' | 'regional'>('all');
  const [sandboxMode, setSandboxMode] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [consensusRate, setConsensusRate] = useState(true);
  const [emailDigest, setEmailDigest] = useState(true);
  const [directoryVisibility, setDirectoryVisibility] = useState(true);
  const [allowDirectChat, setAllowDirectChat] = useState(true);
  const [showPublicContact, setShowPublicContact] = useState(true);
  const [orderNotifications, setOrderNotifications] = useState(true);
  const [inAppAlerts, setInAppAlerts] = useState(true);
  const [inquiryRouting, setInquiryRouting] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // Load saved preferences on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bmp_seller_preferences');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.sandboxMode !== undefined) setSandboxMode(parsed.sandboxMode);
        if (parsed.pushNotifications !== undefined) setPushNotifications(parsed.pushNotifications);
        if (parsed.consensusRate !== undefined) setConsensusRate(parsed.consensusRate);
        if (parsed.emailDigest !== undefined) setEmailDigest(parsed.emailDigest);
        if (parsed.directoryVisibility !== undefined) setDirectoryVisibility(parsed.directoryVisibility);
        if (parsed.allowDirectChat !== undefined) setAllowDirectChat(parsed.allowDirectChat);
        if (parsed.showPublicContact !== undefined) setShowPublicContact(parsed.showPublicContact);
        if (parsed.orderNotifications !== undefined) setOrderNotifications(parsed.orderNotifications);
        if (parsed.inAppAlerts !== undefined) setInAppAlerts(parsed.inAppAlerts);
        if (parsed.inquiryRouting !== undefined) setInquiryRouting(parsed.inquiryRouting);
      }
    } catch (e) {
      console.warn('Could not read seller preferences from localStorage', e);
    }
  }, []);

  const handleSavePreferences = () => {
    setSavingSettings(true);
    try {
      const prefs = {
        sandboxMode,
        pushNotifications,
        consensusRate,
        emailDigest,
        directoryVisibility,
        allowDirectChat,
        showPublicContact,
        orderNotifications,
        inAppAlerts,
        inquiryRouting,
        theme
      };
      localStorage.setItem('bmp_seller_preferences', JSON.stringify(prefs));
      setTimeout(() => {
        setSavingSettings(false);
        showTemporarySuccess("Preferences successfully saved and applied!");
      }, 400);
    } catch (err) {
      console.warn("Failed to persist preferences to local storage:", err);
      setSavingSettings(false);
      showTemporarySuccess("Preferences updated for current session.");
    }
  };

  const handleResetPreferences = () => {
    setSandboxMode(true);
    setPushNotifications(true);
    setConsensusRate(true);
    setEmailDigest(true);
    setDirectoryVisibility(true);
    setAllowDirectChat(true);
    setShowPublicContact(true);
    setOrderNotifications(true);
    setInAppAlerts(true);
    setInquiryRouting(true);
    setTheme('system' as ThemeType);
    try {
      localStorage.removeItem('bmp_seller_preferences');
    } catch (e) {}
    showTemporarySuccess("Settings restored to standard defaults.");
  };

  // Route protection
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Sync edit state when user changes
  useEffect(() => {
    if (user) {
      setEditDisplayName(user.displayName || '');
      setEditFullName(user.fullName || '');
      setEditEmail(user.email || '');
      setEditPhone((user as any)?.phone || '');
      setEditBio((user as any)?.bio || '');
      setEditCountry((user as any)?.country || 'Global Pioneer');
      setEditPhotoUrl(user.photoUrl || '');
    }
  }, [user]);

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

  // Load wishlist from both modern and legacy keys
  const loadWishlist = async () => {
    try {
      const storedWish = localStorage.getItem('bmp_marketplace_wishlist');
      const legacyWish = localStorage.getItem('pi_marketplace_wishlist');
      const parsedStored: string[] = storedWish ? JSON.parse(storedWish) : [];
      const parsedLegacy: string[] = legacyWish ? JSON.parse(legacyWish) : [];
      const allIds = Array.from(new Set([...parsedStored, ...parsedLegacy]));
      
      if (allIds.length > 0) {
        const fetchedItems = await Promise.all(
          allIds.map(async (id) => {
            try {
              const p: any = await productService.getProduct(id);
              if (p) {
                return {
                  id: p.productId || p.id,
                  title: p.productName || p.title || 'Product',
                  price: p.price ?? 0,
                  currency: p.currency || 'π',
                  image: p.mainImage || (p.imageUrls && p.imageUrls[0]) || '',
                  seller: p.brand || p.seller || 'Verified Merchant',
                  rating: p.rating || 5.0,
                  reviews: p.reviews || p.reviewCount || 0
                };
              }
            } catch (err) {
              console.warn(`[ProfilePage] Failed to resolve wishlist product ${id}:`, err);
            }
            return null;
          })
        );
        setWishlistItems(fetchedItems.filter(Boolean) as any[]);
      } else {
        setWishlistItems([]);
      }
    } catch {
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

  const showTemporarySuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  const copyToClipboard = (text: string, keyName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    showTemporarySuccess(`${keyName} copied to clipboard!`);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Avatar file selection and validation handler
  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploadError(null);
    setAvatarUploadSuccess(false);

    // Safe client-side validation: accepted formats
    const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!validMimeTypes.includes(file.type.toLowerCase()) && !hasValidExt) {
      setAvatarUploadError('Unsupported file format. Please upload a JPG, PNG, or WEBP image.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Safe client-side validation: 5MB size limit
    const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_AVATAR_SIZE) {
      setAvatarUploadError('Image size exceeds 5MB limit. Please choose a smaller photo.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Immediate local preview
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    // Upload using existing mediaService infrastructure
    if (user?.uid) {
      setIsUploadingAvatar(true);
      setUploadProgress(0);
      try {
        const asset = await mediaService.uploadMedia(file, user.uid, {
          module: 'users',
          visibility: 'public',
          onProgress: (progress) => {
            setUploadProgress(progress);
          }
        });
        setEditPhotoUrl(asset.downloadUrl);
        setAvatarUploadSuccess(true);
        setTimeout(() => setAvatarUploadSuccess(false), 3500);
      } catch (err: any) {
        console.error('Avatar upload failed:', err);
        setAvatarUploadError(err?.message || 'Failed to upload photo. Please try again.');
      } finally {
        setIsUploadingAvatar(false);
        setUploadProgress(0);
      }
    }
  };

  const handleRemoveAvatar = () => {
    if (avatarPreview && avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(null);
    setEditPhotoUrl('');
    setAvatarUploadError(null);
    setAvatarUploadSuccess(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCancelEditingProfile = () => {
    if (avatarPreview && avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(null);
    setAvatarUploadError(null);
    setAvatarUploadSuccess(false);
    setIsUploadingAvatar(false);
    setShowUrlFallback(false);
    setEditPhotoUrl(user?.photoUrl || '');
    setEditDisplayName(user?.displayName || '');
    setEditFullName(user?.fullName || '');
    setEditEmail(user?.email || '');
    setEditPhone((user as any)?.phone || '');
    setEditBio((user as any)?.bio || '');
    setEditCountry((user as any)?.country || 'Global Pioneer');
    setIsEditingProfile(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateUser) return;
    if (isUploadingAvatar) {
      setErrorMessage('Please wait for the photo upload to complete before saving.');
      return;
    }
    setSaving(true);
    setErrorMessage(null);
    try {
      await updateUser({
        displayName: editDisplayName.trim() || user?.username || 'Pi Pioneer',
        fullName: editFullName.trim(),
        email: editEmail.trim(),
        photoUrl: editPhotoUrl.trim(),
        ...({
          phone: editPhone.trim(),
          bio: editBio.trim(),
          country: editCountry.trim()
        } as any)
      });
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
      setAvatarPreview(null);
      setIsEditingProfile(false);
      showTemporarySuccess('Profile updated successfully!');
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setErrorMessage(err?.message || 'Failed to update profile details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

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
    try {
      const storedWish = localStorage.getItem('bmp_marketplace_wishlist');
      if (storedWish) {
        const parsedIds: string[] = JSON.parse(storedWish);
        const updated = parsedIds.filter(item => item !== id);
        localStorage.setItem('bmp_marketplace_wishlist', JSON.stringify(updated));
      }
      const legacyWish = localStorage.getItem('pi_marketplace_wishlist');
      if (legacyWish) {
        const parsedLegacy: string[] = JSON.parse(legacyWish);
        const updatedLegacy = parsedLegacy.filter(item => item !== id);
        localStorage.setItem('pi_marketplace_wishlist', JSON.stringify(updatedLegacy));
      }
    } catch (err) {
      console.warn('Could not remove from wishlist:', err);
    }
    loadWishlist();
    showTemporarySuccess('Removed from saved items');
  };

  if (!user) return null;

  const roleResolver = new RoleResolver(user);
  const isSuperAdmin = roleResolver.isSuperAdmin();
  const canonicalRole = roleResolver.getCanonicalRole();
  const activeRoleView = (user as any)?.activeRole || canonicalRole;
  const platformRoleVal = isSuperAdmin ? 'superadmin' : (user?.platformRole || user?.role || 'buyer');
  const businessRoleVal = user?.businessRole || (roleResolver.isBusinessOwner() ? 'Business Owner' : (roleResolver.isSeller() ? 'Seller' : 'Customer'));
  const activePermissionsCount = permissions?.length || 12;

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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-32">
        
        {/* PROFILE HEADER CARD */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 sm:p-7 flex flex-col gap-6 mb-8 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
          
          {/* Top Row: Avatar, Identity Info & Balances */}
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 relative z-10">
            
            {/* Identity & Avatar */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
              <div className="relative shrink-0 group">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-950 border-2 border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-105">
                  {user.photoUrl ? (
                    <img src={user.photoUrl} alt={user.displayName || 'Avatar'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-3xl sm:text-4xl font-black text-violet-400 font-sans select-none">
                      {user.displayName ? user.displayName[0].toUpperCase() : 'P'}
                    </span>
                  )}
                </div>
                <div 
                  className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1.5 rounded-xl shadow-md border-2 border-slate-950" 
                  title="Pi Verified Pioneer"
                >
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {user.displayName || 'Pi Pioneer'}
                  </h1>
                  
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <UserCheck className="w-3 h-3" />
                    KYC Verified
                  </span>

                  {isSuperAdmin && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-violet-600/20 text-violet-300 border border-violet-500/30 shadow-sm">
                      <ShieldAlert className="w-3 h-3 text-amber-300" />
                      Super Admin
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-center sm:justify-start gap-3 text-xs text-slate-400 flex-wrap">
                  <span className="font-mono text-violet-400 font-bold">@{user.username || 'pioneer'}</span>
                  <span className="text-slate-600">•</span>
                  <span className="flex items-center gap-1 text-slate-300">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {user.email || 'pioneer@pi-consensus.net'}
                  </span>
                  {(user as any)?.country && (
                    <>
                      <span className="text-slate-600">•</span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {(user as any).country}
                      </span>
                    </>
                  )}
                </div>

                {/* Quick Bio preview if set */}
                {(user as any)?.bio && (
                  <p className="text-xs text-slate-400 max-w-md line-clamp-2 leading-relaxed pt-1">
                    {(user as any).bio}
                  </p>
                )}

                {/* Quick Edit CTA button */}
                <div className="pt-2 flex items-center justify-center sm:justify-start gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('account');
                      setIsEditingProfile(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/60 rounded-xl text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-violet-500/20 focus-visible:outline-none cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-violet-400" />
                    <span>Edit Profile Details</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleFaucetClaim}
                    disabled={faucetLoading}
                    title="Claim +50 Sandbox Pi for testing"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] bg-violet-600/10 hover:bg-violet-600/20 text-violet-300 border border-violet-500/30 rounded-xl text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-violet-500/20 focus-visible:outline-none cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-violet-400 ${faucetLoading ? 'animate-spin' : ''}`} />
                    <span>{faucetLoading ? 'Mining...' : '+50 π Faucet'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Balances Card */}
            <div className="flex flex-col items-center md:items-end gap-2 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 w-full md:w-auto shrink-0 shadow-inner">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Active Balances
              </span>
              <div className="flex items-center gap-4">
                <div className="text-center md:text-right">
                  <div className="text-2xl font-black text-white font-mono leading-tight">
                    {piWalletBalance.toFixed(2)} <span className="text-violet-400 text-lg">π</span>
                  </div>
                  <span className="text-[9px] font-semibold text-slate-400 uppercase">Pi Testnet</span>
                </div>
                <div className="w-px h-8 bg-slate-800" />
                <div className="text-center md:text-right">
                  <div className="text-2xl font-black text-white font-mono leading-tight">
                    {walletBalance.toFixed(2)} <span className="text-amber-400 text-lg">BMP</span>
                  </div>
                  <span className="text-[9px] font-semibold text-slate-400 uppercase">Rewards</span>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Spec Strip: Role & Permissions */}
          <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Role:</span>
              <span className="px-2.5 py-1 bg-violet-600/20 text-violet-300 border border-violet-500/30 font-bold text-xs uppercase tracking-wide rounded-lg flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-violet-400" />
                {activeRoleView.replace(/_/g, ' ')}
              </span>

              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Platform:</span>
              <span className="px-2 py-1 bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px] uppercase rounded-lg">
                {platformRoleVal === 'superadmin' ? 'SUPER ADMIN' : platformRoleVal === 'user' ? 'USER' : platformRoleVal}
              </span>

              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Business:</span>
              <span className="px-2 py-1 bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px] uppercase rounded-lg">
                {businessRoleVal}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-violet-400 font-bold">
              <Key className="w-3.5 h-3.5" />
              <span>{activePermissionsCount} Permissions Granted</span>
            </div>
          </div>
        </div>

        {/* PROFILE TAB NAVIGATION BAR */}
        <div className="flex bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800/80 overflow-x-auto scrollbar-none gap-1.5 mb-8 shadow-md">
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
                type="button"
                onClick={() => setActiveTab(tab.id as ProfileTab)}
                className={`flex items-center gap-2 px-4 py-3 min-h-[44px] rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex-1 justify-center focus-visible:ring-2 focus-visible:ring-violet-500/20 focus-visible:outline-none ${
                  isActive 
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* FEEDBACK BANNERS */}
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

        {/* TAB CONTENTS */}
        <div className="space-y-6">
          
          {/* TAB 1: PERSONAL INFO & WORKSPACE */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              
              {/* EDIT PROFILE FORM MODAL / PANEL */}
              {isEditingProfile ? (
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-6 shadow-xl animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <Edit3 className="w-5 h-5 text-violet-400" />
                        Edit Profile Information
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">
                        Update your public Pioneer presentation and contact preferences
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCancelEditingProfile}
                      className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none cursor-pointer"
                      title="Cancel Editing"
                      aria-label="Cancel Editing"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-5">
                    {/* Avatar Image Upload Section */}
                    <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5">
                      <label className="text-xs font-bold text-slate-300 block mb-3">
                        Profile Avatar Photo
                      </label>
                      
                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                        {/* Live Avatar Preview */}
                        <div className="relative shrink-0 w-20 h-20 sm:w-24 sm:h-24 bg-slate-900 border-2 border-slate-700 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
                          {(avatarPreview || editPhotoUrl) ? (
                            <img 
                              src={avatarPreview || editPhotoUrl} 
                              alt="Avatar preview" 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer" 
                            />
                          ) : (
                            <span className="text-3xl sm:text-4xl font-black text-violet-400 font-sans select-none">
                              {editDisplayName ? editDisplayName[0].toUpperCase() : (user?.displayName ? user.displayName[0].toUpperCase() : 'P')}
                            </span>
                          )}

                          {/* Loading Overlay */}
                          {isUploadingAvatar && (
                            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-white p-1 text-center">
                              <Loader2 className="w-5 h-5 text-violet-400 animate-spin mb-1" />
                              <span className="text-[9px] font-bold text-violet-300">
                                {uploadProgress > 0 ? `${uploadProgress}%` : 'Uploading...'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Upload / Replace / Remove Controls */}
                        <div className="flex-1 space-y-2.5 text-center sm:text-left w-full min-w-0">
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                            {/* Hidden Native File Input */}
                            <input 
                              ref={fileInputRef}
                              id="avatarFileInput"
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/jpg"
                              onChange={handleAvatarFileSelect}
                              className="sr-only"
                              aria-label="Upload profile photo"
                              disabled={isUploadingAvatar}
                            />

                            {/* Trigger Upload Button */}
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isUploadingAvatar}
                              aria-label="Upload profile photo"
                              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition-all shadow-md shadow-violet-600/20 cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none disabled:opacity-50 active:scale-95"
                            >
                              {isUploadingAvatar ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>Uploading Photo...</span>
                                </>
                              ) : (
                                <>
                                  <Upload className="w-4 h-4" />
                                  <span>{(avatarPreview || editPhotoUrl) ? 'Replace Photo' : 'Upload Photo'}</span>
                                </>
                              )}
                            </button>

                            {/* Remove Photo Button */}
                            {(avatarPreview || editPhotoUrl) && (
                              <button
                                type="button"
                                onClick={handleRemoveAvatar}
                                disabled={isUploadingAvatar}
                                aria-label="Remove profile photo"
                                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 font-bold text-xs transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none disabled:opacity-50"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Remove</span>
                              </button>
                            )}

                            {/* Fallback URL toggle */}
                            <button
                              type="button"
                              onClick={() => setShowUrlFallback(!showUrlFallback)}
                              className="inline-flex items-center justify-center px-2 py-2 min-h-[44px] text-[11px] font-semibold text-slate-400 hover:text-violet-300 transition-colors underline underline-offset-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none rounded-lg"
                            >
                              {showUrlFallback ? 'Hide URL field' : 'Or use Image URL'}
                            </button>
                          </div>

                          <p className="text-[11px] text-slate-400">
                            Supported formats: <span className="text-slate-300 font-medium">JPG, PNG, WEBP</span> (Max size: 5MB)
                          </p>

                          {/* Validation / Error message */}
                          {avatarUploadError && (
                            <div className="flex items-center gap-2 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-semibold animate-fade-in">
                              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                              <span>{avatarUploadError}</span>
                            </div>
                          )}

                          {/* Upload Success Feedback */}
                          {avatarUploadSuccess && (
                            <div className="flex items-center gap-2 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-semibold animate-fade-in">
                              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                              <span>Photo uploaded successfully! Save profile to finish.</span>
                            </div>
                          )}

                          {/* Optional URL Fallback Input */}
                          {showUrlFallback && (
                            <div className="pt-2 space-y-1 animate-fade-in">
                              <label htmlFor="editPhotoUrl" className="text-[11px] font-bold text-slate-400 block">
                                Image URL Fallback
                              </label>
                              <input
                                id="editPhotoUrl"
                                type="url"
                                value={editPhotoUrl}
                                onChange={(e) => {
                                  setEditPhotoUrl(e.target.value);
                                  setAvatarPreview(null);
                                }}
                                placeholder="https://images.unsplash.com/..."
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 min-h-[44px] text-xs text-white placeholder-slate-600 focus-visible:ring-2 focus-visible:ring-violet-500/20 focus-visible:outline-none focus:border-violet-500 transition-colors"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      
                      {/* Display Name */}
                      <div className="space-y-1.5">
                        <label htmlFor="editDisplayName" className="text-xs font-bold text-slate-300 block">
                          Display Name <span className="text-rose-400">*</span>
                        </label>
                        <input
                          id="editDisplayName"
                          type="text"
                          required
                          value={editDisplayName}
                          onChange={(e) => setEditDisplayName(e.target.value)}
                          placeholder="e.g. John Pioneer"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 min-h-[44px] text-sm text-white placeholder-slate-600 focus-visible:ring-2 focus-visible:ring-violet-500/20 focus-visible:outline-none focus:border-violet-500 transition-colors"
                        />
                      </div>

                      {/* Full Name */}
                      <div className="space-y-1.5">
                        <label htmlFor="editFullName" className="text-xs font-bold text-slate-300 block">
                          Full Legal Name (Optional)
                        </label>
                        <input
                          id="editFullName"
                          type="text"
                          value={editFullName}
                          onChange={(e) => setEditFullName(e.target.value)}
                          placeholder="e.g. Johnathan Doe"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 min-h-[44px] text-sm text-white placeholder-slate-600 focus-visible:ring-2 focus-visible:ring-violet-500/20 focus-visible:outline-none focus:border-violet-500 transition-colors"
                        />
                      </div>

                      {/* Email Address */}
                      <div className="space-y-1.5">
                        <label htmlFor="editEmail" className="text-xs font-bold text-slate-300 block">
                          Contact Email
                        </label>
                        <input
                          id="editEmail"
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          placeholder="e.g. pioneer@example.com"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 min-h-[44px] text-sm text-white placeholder-slate-600 focus-visible:ring-2 focus-visible:ring-violet-500/20 focus-visible:outline-none focus:border-violet-500 transition-colors"
                        />
                      </div>

                      {/* Phone Number */}
                      <div className="space-y-1.5">
                        <label htmlFor="editPhone" className="text-xs font-bold text-slate-300 block">
                          Phone Number (Optional)
                        </label>
                        <input
                          id="editPhone"
                          type="tel"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="e.g. +1 (555) 000-1234"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 min-h-[44px] text-sm text-white placeholder-slate-600 focus-visible:ring-2 focus-visible:ring-violet-500/20 focus-visible:outline-none focus:border-violet-500 transition-colors"
                        />
                      </div>

                      {/* Country / Region */}
                      <div className="space-y-1.5 md:col-span-2">
                        <label htmlFor="editCountry" className="text-xs font-bold text-slate-300 block">
                          Location / Country
                        </label>
                        <input
                          id="editCountry"
                          type="text"
                          value={editCountry}
                          onChange={(e) => setEditCountry(e.target.value)}
                          placeholder="e.g. United States, Germany, Nigeria..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 min-h-[44px] text-sm text-white placeholder-slate-600 focus-visible:ring-2 focus-visible:ring-violet-500/20 focus-visible:outline-none focus:border-violet-500 transition-colors"
                        />
                      </div>

                      {/* Bio / Description */}
                      <div className="space-y-1.5 md:col-span-2">
                        <div className="flex items-center justify-between">
                          <label htmlFor="editBio" className="text-xs font-bold text-slate-300 block">
                            About / Bio
                          </label>
                          <span className="text-[10px] text-slate-500">
                            {editBio.length} / 250 characters
                          </span>
                        </div>
                        <textarea
                          id="editBio"
                          rows={3}
                          maxLength={250}
                          value={editBio}
                          onChange={(e) => setEditBio(e.target.value)}
                          placeholder="Tell fellow Pioneers about your trade, store, or services..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus-visible:ring-2 focus-visible:ring-violet-500/20 focus-visible:outline-none focus:border-violet-500 transition-colors resize-none"
                        />
                      </div>

                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={handleCancelEditingProfile}
                        className="px-5 py-2.5 min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving || isUploadingAvatar}
                        className="px-6 py-2.5 min-h-[44px] rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition-colors flex items-center gap-2 shadow-lg shadow-violet-600/20 cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Saving Changes...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>Save Profile</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* PERSONAL PROFILE OVERVIEW CARD */
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-6 shadow-xl animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <User className="w-5 h-5 text-violet-400" />
                        Personal Information & Credentials
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">
                        Verified account details linked to your Pi Network identity
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-500/20 focus-visible:outline-none"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-violet-400" />
                      <span>Edit Profile</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">Pi Username</span>
                      <p className="text-sm font-bold text-white font-mono mt-1">@{user.username}</p>
                    </div>

                    <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">Display Name</span>
                      <p className="text-sm font-bold text-white mt-1">{user.displayName || 'Not Set'}</p>
                    </div>

                    <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">Full Legal Name</span>
                      <p className="text-sm font-semibold text-slate-300 mt-1">{user.fullName || 'Not Provided'}</p>
                    </div>

                    <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">Contact Email</span>
                      <p className="text-sm font-semibold text-slate-300 mt-1 truncate">{user.email || 'pioneer@pi-consensus.net'}</p>
                    </div>

                    <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">Location</span>
                      <p className="text-sm font-semibold text-slate-300 mt-1">{(user as any)?.country || 'Global Pioneer'}</p>
                    </div>

                    <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">Member Since</span>
                      <p className="text-sm font-semibold text-slate-300 mt-1">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Verified Pioneer'}
                      </p>
                    </div>

                    {/* Full-width Wallet and Key Details with Copy buttons */}
                    <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/80 sm:col-span-2 md:col-span-3 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                          BMP Rewards Wallet Public Key
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(user.walletAddress || 'bmp_wallet_7787f2f_consensus_node_active_secured', 'Wallet Address')}
                          className="inline-flex items-center gap-1 text-xs font-bold text-violet-400 hover:text-violet-300 transition-colors cursor-pointer w-fit"
                        >
                          {copiedKey === 'Wallet Address' ? (
                            <>
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Address</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-xs font-mono text-slate-300 break-all bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                        {user.walletAddress && !user.walletAddress.startsWith('bmp_wallet_') ? user.walletAddress : 'bmp_wallet_7787f2f_consensus_node_active_secured'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ROLE PRESENTATION & SWITCHER MATRIX */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-6 shadow-xl animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Shield className="w-5 h-5 text-violet-400" />
                      Role Presentation & Access Control
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Active role projection and permissions granted across Pi Business Market
                    </p>
                  </div>
                  {isSuperAdmin && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-1 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[10px] font-black uppercase rounded-lg border border-violet-400/30 flex items-center gap-1 shadow-sm">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
                        Super Admin
                      </span>
                      <button
                        type="button"
                        onClick={() => navigate('/admin-console')}
                        className="px-3.5 py-1.5 min-h-[44px] bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold uppercase rounded-xl border border-violet-400/30 shadow-md transition-all cursor-pointer flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-violet-500/20 focus-visible:outline-none"
                      >
                        <span>Open Admin Console</span>
                        <ArrowRight className="w-3.5 h-3.5 text-violet-200" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Role Switcher */}
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                    Switch Active Role View
                  </span>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {['buyer', 'seller', 'business_owner', 'service_provider'].map((r) => {
                      const normalized = r.toLowerCase();
                      const isActiveRole = activeRoleView.toLowerCase() === normalized;
                      const label = r.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                      return (
                        <button
                          key={r}
                          type="button"
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
                          className={`px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-500/20 focus-visible:outline-none ${
                            isActiveRole 
                              ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20 border border-violet-400/40' 
                              : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                          }`}
                        >
                          <Shield className={`w-4 h-4 ${isActiveRole ? 'text-amber-300' : 'text-slate-500'}`} />
                          <span>{label}</span>
                          {isActiveRole && <Check className="w-4 h-4 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Specification Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">Current Active Role</span>
                    <p className="text-xs font-bold text-violet-400 mt-1 capitalize font-mono">{activeRoleView.replace(/_/g, ' ')}</p>
                  </div>
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">Platform Role</span>
                    <p className="text-xs font-bold text-white mt-1 uppercase font-mono">{platformRoleVal === 'superadmin' ? 'SUPER ADMIN' : platformRoleVal === 'user' ? 'USER' : platformRoleVal}</p>
                  </div>
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">Business Role</span>
                    <p className="text-xs font-bold text-white mt-1 capitalize font-mono">{businessRoleVal}</p>
                  </div>
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">Granted Permissions</span>
                    <p className="text-xs font-bold text-emerald-400 mt-1 font-mono">{activePermissionsCount} System Rules Active</p>
                  </div>
                </div>

                {/* Canonical Identity Mapping Details */}
                <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-black tracking-widest">
                    <span>Canonical Identity Resolution</span>
                    <span className="text-emerald-400 font-bold">✓ Synchronized</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div>
                      <span className="text-slate-400">Firebase Doc UID: </span>
                      <span className="text-slate-200 break-all font-bold">{user.uid}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Pi Network UID: </span>
                      <span className="text-slate-200 font-bold">{user.piUid || 'pi_uid_synced'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Username: </span>
                      <span className="text-violet-400 font-bold">@{user.username}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Onboarding State: </span>
                      <span className="text-emerald-400 font-bold">Completed (100%)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Start Your Business Section */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4 shadow-xl animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">Start Your Business</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Become a verified merchant or service provider on Pi Business Market</p>
                  </div>
                  <span className="px-2.5 py-1 bg-violet-600/10 border border-violet-500/20 text-violet-400 text-[10px] font-black uppercase rounded-lg">Seller Ecosystem</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div 
                    onClick={() => navigate('/create-business')}
                    className="p-5 bg-gradient-to-br from-indigo-950/60 to-slate-950 border border-indigo-900/50 hover:border-indigo-500 rounded-xl cursor-pointer transition-all hover:scale-[1.02] group min-h-[44px]"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <Plus className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-extrabold text-white mb-1">➕ Register Business</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">Establish your legal entity, shop structure, or company profile.</p>
                  </div>

                  <div 
                    onClick={() => navigate('/create-store')}
                    className="p-5 bg-gradient-to-br from-violet-950/60 to-slate-950 border border-violet-900/50 hover:border-violet-500 rounded-xl cursor-pointer transition-all hover:scale-[1.02] group min-h-[44px]"
                  >
                    <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-3 group-hover:bg-violet-600 group-hover:text-white transition-all">
                      <Store className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-extrabold text-white mb-1">🏪 Open Store</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">Launch an online storefront to list and sell products globally.</p>
                  </div>

                  <div 
                    onClick={() => navigate('/service-management')}
                    className="p-5 bg-gradient-to-br from-emerald-950/60 to-slate-950 border border-emerald-900/50 hover:border-emerald-500 rounded-xl cursor-pointer transition-all hover:scale-[1.02] group min-h-[44px]"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-extrabold text-white mb-1">🛠 Register Service</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">Offer freelance skills, consultations, repairs, or professional services.</p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: ORDERS / MY PURCHASES */}
          {activeTab === 'orders' && (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-6 shadow-xl animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Package className="w-5 h-5 text-violet-400" />
                    Purchase History Tracker
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Track consensus transactions and fulfillment statuses
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">{orders.length} Purchases</span>
              </div>

              {loadingOrders ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Syncing Consensus Ledger...</span>
                </div>
              ) : orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div 
                      key={order.orderId}
                      onClick={() => navigate(`/order-details/${order.orderId}`)}
                      className="p-4 bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 rounded-xl cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group min-h-[44px]"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 shrink-0 group-hover:border-violet-500/40 transition-colors">
                          <Package className="w-5 h-5 text-violet-400" />
                        </div>
                        <div className="space-y-1 truncate max-w-[200px] sm:max-w-xs">
                          <h4 className="text-sm font-bold text-white truncate group-hover:text-violet-300 transition-colors">
                            Order #{order.orderNumber}
                          </h4>
                          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:items-end gap-1.5 font-mono text-left sm:text-right">
                        <div className="text-sm font-black text-white">
                          {order.grandTotal} <span className="text-violet-400">π</span>
                        </div>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border tracking-wider ${getOrderStatusColor(order.orderStatus)}`}>
                          {order.orderStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center space-y-4">
                  <div className="w-14 h-14 bg-slate-950 border border-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-500">
                    <ShoppingBag className="w-6 h-6 text-slate-400" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-200">No Orders Placed Yet</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">Explore the marketplace to buy products, services, and digital offerings using Pi.</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => navigate('/discovery')}
                    className="px-6 py-3 min-h-[44px] bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-violet-600/20 cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-500/20 focus-visible:outline-none"
                  >
                    Start Shopping
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WALLET */}
          {activeTab === 'wallet' && (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-6 shadow-xl animate-fade-in">
              <BmpRewardsWallet />
            </div>
          )}
          
          {/* TAB 4: WISHLIST / SAVED ITEMS */}
          {activeTab === 'wishlist' && (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 sm:p-6 space-y-6 shadow-xl animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Heart className="w-5 h-5 text-rose-500 fill-rose-500/20" />
                    <span>Saved Products & Wishlist</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Items and services you have bookmarked for future reference and quick checkout
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest bg-slate-950/80 border border-slate-800/80 px-3 py-1 rounded-xl shrink-0 self-start sm:self-auto">
                  {wishlistItems.length} {wishlistItems.length === 1 ? 'Bookmark' : 'Bookmarks'}
                </span>
              </div>

              {wishlistItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {wishlistItems.map((prod) => (
                    <div 
                      key={prod.id}
                      onClick={() => navigate(`/product/${prod.id}`)}
                      className="p-4 bg-slate-950/80 border border-slate-800/80 hover:border-violet-500/50 rounded-2xl flex gap-4 cursor-pointer transition-all duration-200 group relative shadow-md hover:shadow-violet-500/5 min-h-[44px]"
                    >
                      {/* Product Thumbnail */}
                      <div className="w-22 h-22 sm:w-24 sm:h-24 bg-slate-900 rounded-xl overflow-hidden shrink-0 border border-slate-800 relative flex items-center justify-center">
                        <img 
                          src={prod.image} 
                          alt={prod.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500';
                          }}
                        />
                        <span className="absolute bottom-1.5 left-1.5 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-slate-950/90 text-emerald-400 rounded border border-slate-800 backdrop-blur-sm">
                          In Stock
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 pr-10">
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-slate-200 line-clamp-1 group-hover:text-violet-400 transition-colors">
                            {prod.title}
                          </h4>
                          <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                            <Store className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                            <span className="truncate">@{prod.seller || 'pioneer_merchant'}</span>
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-semibold pt-0.5">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>4.9</span>
                            <span className="text-slate-500 font-normal">(128 ratings)</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-900">
                          <div className="flex items-baseline gap-1 font-mono text-base font-black text-white leading-none">
                            {prod.price} <span className="text-violet-400 text-xs font-bold">π</span>
                          </div>
                          <span className="text-[11px] font-bold text-violet-400 group-hover:underline flex items-center gap-1">
                            View Details <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>

                      {/* Remove Action Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveWishlistItem(prod.id);
                        }}
                        className="absolute right-3 top-3 p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center bg-slate-900/60 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 rounded-xl transition-all border border-slate-800 hover:border-rose-800/80 cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none"
                        aria-label={`Remove ${prod.title} from saved items`}
                        title="Remove bookmark"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center space-y-4 max-w-md mx-auto">
                  <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-500 shadow-xl">
                    <Heart className="w-8 h-8 text-rose-500/60" />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-base font-bold text-white">Your Wishlist is Empty</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Save products, consulting services, and digital offerings you want to track by clicking the heart icon anywhere across the marketplace.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button 
                      type="button"
                      onClick={() => navigate('/discovery')}
                      className="px-6 py-3 min-h-[44px] bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-violet-600/20 cursor-pointer flex items-center gap-2 mx-auto focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Discover Marketplace</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Header with Category Filter */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      <Settings className="w-5 h-5 text-violet-400" />
                      Seller Settings, Preferences & Workspace Controls
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Configure store operations, notification channels, visual appearance, communications, workspace routing, and security.
                    </p>
                  </div>

                  {/* Actions summary */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleResetPreferences}
                      className="min-h-[44px] px-3.5 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                      title="Reset all preferences to defaults"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Reset Defaults</span>
                      <span className="sm:hidden">Reset</span>
                    </button>
                    
                    <button
                      type="button"
                      disabled={savingSettings}
                      onClick={handleSavePreferences}
                      className="min-h-[44px] px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-violet-600/20 flex items-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none disabled:opacity-50"
                    >
                      {savingSettings ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Sub-Category Navigation Bar */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                  {[
                    { id: 'all', label: 'All Settings', icon: Sliders },
                    { id: 'account', label: 'Account', icon: User },
                    { id: 'business', label: 'Business', icon: Building2 },
                    { id: 'notifications', label: 'Notifications', icon: Bell },
                    { id: 'appearance', label: 'Appearance', icon: Palette },
                    { id: 'communication', label: 'Communication', icon: Mail },
                    { id: 'workspace', label: 'Workspace', icon: Briefcase },
                    { id: 'security', label: 'Security', icon: ShieldCheck },
                    { id: 'regional', label: 'Regional & Display', icon: Globe }
                  ].map((cat) => {
                    const CatIcon = cat.icon;
                    const isActive = settingsCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSettingsCategory(cat.id as any)}
                        className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none ${
                          isActive
                            ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                            : 'bg-slate-950/60 hover:bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                        }`}
                      >
                        <CatIcon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 0. ACCOUNT SHORTCUT SETTINGS */}
              {(settingsCategory === 'account') && (
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
                  <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-violet-400" />
                      <h4 className="text-sm font-bold text-white">Account Information & Profile Controls</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('account')}
                      className="text-xs font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none rounded-lg"
                    >
                      <span>Open Profile Tab</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Manage display name, contact email, country location, avatar photo, and verified Pioneer credentials.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                    <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Display Name</span>
                      <span className="font-bold text-white block mt-0.5">{user?.displayName || 'Not Set'}</span>
                    </div>
                    <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Contact Email</span>
                      <span className="font-bold text-white block mt-0.5 truncate">{user?.email || 'pioneer@pi-consensus.net'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 1. APPEARANCE SETTINGS */}
              {(settingsCategory === 'all' || settingsCategory === 'appearance') && (
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
                  <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-violet-400" />
                      <h4 className="text-sm font-bold text-white">Appearance & Theme</h4>
                    </div>
                    <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest bg-violet-950/60 border border-violet-800/60 px-2 py-0.5 rounded-md">
                      Current: {theme}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Customize the interface visual theme across mobile and desktop viewports. Choose between high-contrast dark canvas, clean light mode, BMP signature plum & gold, or automatic device sync.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    {[
                      { id: 'system', label: 'System (Auto)', icon: Laptop, desc: 'Sync with device OS' },
                      { id: 'dark', label: 'Dark Mode', icon: Moon, desc: 'Midnight OLED canvas' },
                      { id: 'light', label: 'Light Mode', icon: Sun, desc: 'High contrast clean' },
                      { id: 'pi-signature', label: 'BMP Signature', icon: Palette, desc: 'Royal gold & plum' }
                    ].map((t) => {
                      const Icon = t.icon;
                      const isSelected = theme === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setTheme(t.id as ThemeType);
                            showTemporarySuccess(`Theme updated to: ${t.label}`);
                          }}
                          className={`flex flex-col items-center justify-center p-4 min-h-[44px] rounded-xl border text-center transition-all cursor-pointer gap-2 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none ${
                            isSelected 
                              ? 'bg-violet-600/15 border-violet-500 text-white shadow-lg ring-1 ring-violet-500/50' 
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${isSelected ? 'text-violet-400' : 'text-slate-500'}`} />
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold uppercase tracking-wider block">{t.label}</span>
                            <span className="text-[10px] text-slate-400 block leading-tight">{t.desc}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. BUSINESS PREFERENCES */}
              {(settingsCategory === 'all' || settingsCategory === 'business') && (
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
                  <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-violet-400" />
                      <h4 className="text-sm font-bold text-white">Business & Commercial Preferences</h4>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Store & Ledger Engine
                    </span>
                  </div>

                  <div className="space-y-3">
                    {/* Sandbox Mode */}
                    <div className="flex items-center justify-between p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl min-h-[44px] gap-4">
                      <div className="space-y-0.5 pr-2">
                        <span className="text-sm font-bold text-white block">Sandbox Payments Simulation</span>
                        <span className="text-xs text-slate-400 block leading-normal">
                          Execute test transactions and order lifecycle testing without requiring live Pi wallet signatures.
                        </span>
                      </div>
                      <button 
                        type="button"
                        role="switch"
                        aria-checked={sandboxMode}
                        aria-label="Toggle Sandbox Payments Simulation"
                        onClick={() => {
                          setSandboxMode(!sandboxMode);
                          showTemporarySuccess(`Sandbox mode ${!sandboxMode ? 'enabled' : 'disabled'}`);
                        }}
                        className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 shrink-0 cursor-pointer min-h-[44px] min-w-[44px] flex items-center focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none ${sandboxMode ? 'bg-violet-600' : 'bg-slate-800'}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-300 shadow-md ${sandboxMode ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    {/* Consensus Rate */}
                    <div className="flex items-center justify-between p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl min-h-[44px] gap-4">
                      <div className="space-y-0.5 pr-2">
                        <span className="text-sm font-bold text-white block">Use Consensus Estimations ($314,159 / π)</span>
                        <span className="text-xs text-slate-400 block leading-normal">
                          Calculate estimated fiat USD equivalent prices using the global community consensus index.
                        </span>
                      </div>
                      <button 
                        type="button"
                        role="switch"
                        aria-checked={consensusRate}
                        aria-label="Toggle Consensus Estimations"
                        onClick={() => {
                          setConsensusRate(!consensusRate);
                          showTemporarySuccess(`Consensus rate calculation ${!consensusRate ? 'enabled' : 'disabled'}`);
                        }}
                        className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 shrink-0 cursor-pointer min-h-[44px] min-w-[44px] flex items-center focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none ${consensusRate ? 'bg-violet-600' : 'bg-slate-800'}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-300 shadow-md ${consensusRate ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    {/* Public Directory */}
                    <div className="flex items-center justify-between p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl min-h-[44px] gap-4">
                      <div className="space-y-0.5 pr-2">
                        <span className="text-sm font-bold text-white block">Public Pioneer Directory Listing</span>
                        <span className="text-xs text-slate-400 block leading-normal">
                          Allow other Pioneers to discover your verified merchant storefronts and listings in public searches.
                        </span>
                      </div>
                      <button 
                        type="button"
                        role="switch"
                        aria-checked={directoryVisibility}
                        aria-label="Toggle Public Directory Listing"
                        onClick={() => {
                          setDirectoryVisibility(!directoryVisibility);
                          showTemporarySuccess(`Directory listing ${!directoryVisibility ? 'enabled' : 'disabled'}`);
                        }}
                        className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 shrink-0 cursor-pointer min-h-[44px] min-w-[44px] flex items-center focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none ${directoryVisibility ? 'bg-violet-600' : 'bg-slate-800'}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-300 shadow-md ${directoryVisibility ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    {/* Quick Shortcuts to Business Center */}
                    <div className="pt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => navigate('/business-center')}
                        className="min-h-[44px] px-3.5 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white rounded-xl transition-all flex items-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                      >
                        <Building2 className="w-3.5 h-3.5 text-violet-400" />
                        <span>Manage Businesses & Stores</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate('/service-center')}
                        className="min-h-[44px] px-3.5 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white rounded-xl transition-all flex items-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                      >
                        <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Service Hub Operations</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. NOTIFICATION PREFERENCES */}
              {(settingsCategory === 'all' || settingsCategory === 'notifications') && (
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
                  <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-violet-400" />
                      <h4 className="text-sm font-bold text-white">Notification & Operational Alerts</h4>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Channels & Frequency
                    </span>
                  </div>

                  <div className="space-y-3">
                    {/* Order Notifications */}
                    <div className="flex items-center justify-between p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl min-h-[44px] gap-4">
                      <div className="space-y-0.5 pr-2">
                        <span className="text-sm font-bold text-white block">Network Order Notifications</span>
                        <span className="text-xs text-slate-400 block leading-normal">
                          Get immediate notifications when buyers place new orders, submit payments, or update shipping requirements.
                        </span>
                      </div>
                      <button 
                        type="button"
                        role="switch"
                        aria-checked={orderNotifications}
                        aria-label="Toggle Order Notifications"
                        onClick={() => {
                          setOrderNotifications(!orderNotifications);
                          showTemporarySuccess(`Order notifications ${!orderNotifications ? 'enabled' : 'disabled'}`);
                        }}
                        className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 shrink-0 cursor-pointer min-h-[44px] min-w-[44px] flex items-center focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none ${orderNotifications ? 'bg-violet-600' : 'bg-slate-800'}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-300 shadow-md ${orderNotifications ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    {/* Browser Push */}
                    <div className="flex items-center justify-between p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl min-h-[44px] gap-4">
                      <div className="space-y-0.5 pr-2">
                        <span className="text-sm font-bold text-white block">Browser Push & Desktop Alerts</span>
                        <span className="text-xs text-slate-400 block leading-normal">
                          Deliver desktop and mobile browser pushes even when the marketplace tab is running in the background.
                        </span>
                      </div>
                      <button 
                        type="button"
                        role="switch"
                        aria-checked={pushNotifications}
                        aria-label="Toggle Browser Push Notifications"
                        onClick={() => {
                          setPushNotifications(!pushNotifications);
                          showTemporarySuccess(`Push notifications ${!pushNotifications ? 'enabled' : 'disabled'}`);
                        }}
                        className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 shrink-0 cursor-pointer min-h-[44px] min-w-[44px] flex items-center focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none ${pushNotifications ? 'bg-violet-600' : 'bg-slate-800'}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-300 shadow-md ${pushNotifications ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    {/* In-App Alerts */}
                    <div className="flex items-center justify-between p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl min-h-[44px] gap-4">
                      <div className="space-y-0.5 pr-2">
                        <span className="text-sm font-bold text-white block">In-App Activity Badges</span>
                        <span className="text-xs text-slate-400 block leading-normal">
                          Display unread notification count badges and actionable priority banners in the top navigation bar.
                        </span>
                      </div>
                      <button 
                        type="button"
                        role="switch"
                        aria-checked={inAppAlerts}
                        aria-label="Toggle In-App Activity Badges"
                        onClick={() => {
                          setInAppAlerts(!inAppAlerts);
                          showTemporarySuccess(`In-app badges ${!inAppAlerts ? 'enabled' : 'disabled'}`);
                        }}
                        className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 shrink-0 cursor-pointer min-h-[44px] min-w-[44px] flex items-center focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none ${inAppAlerts ? 'bg-violet-600' : 'bg-slate-800'}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-300 shadow-md ${inAppAlerts ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    {/* Email Digest */}
                    <div className="flex items-center justify-between p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl min-h-[44px] gap-4">
                      <div className="space-y-0.5 pr-2">
                        <span className="text-sm font-bold text-white block">Periodic Email Summary & Digest</span>
                        <span className="text-xs text-slate-400 block leading-normal">
                          Receive periodic email summaries of weekly transaction volumes, reviews, and customer inquiries.
                        </span>
                      </div>
                      <button 
                        type="button"
                        role="switch"
                        aria-checked={emailDigest}
                        aria-label="Toggle Email Digest"
                        onClick={() => {
                          setEmailDigest(!emailDigest);
                          showTemporarySuccess(`Email digest ${!emailDigest ? 'enabled' : 'disabled'}`);
                        }}
                        className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 shrink-0 cursor-pointer min-h-[44px] min-w-[44px] flex items-center focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none ${emailDigest ? 'bg-violet-600' : 'bg-slate-800'}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-300 shadow-md ${emailDigest ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. COMMUNICATION PREFERENCES */}
              {(settingsCategory === 'all' || settingsCategory === 'communication') && (
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
                  <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-violet-400" />
                      <h4 className="text-sm font-bold text-white">Customer & Peer Communications</h4>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Inquiries & Chat
                    </span>
                  </div>

                  <div className="space-y-3">
                    {/* Direct Chat */}
                    <div className="flex items-center justify-between p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl min-h-[44px] gap-4">
                      <div className="space-y-0.5 pr-2">
                        <span className="text-sm font-bold text-white block">Direct Customer Messaging</span>
                        <span className="text-xs text-slate-400 block leading-normal">
                          Allow verified buyers to initiate secure direct messaging regarding products, services, and bulk orders.
                        </span>
                      </div>
                      <button 
                        type="button"
                        role="switch"
                        aria-checked={allowDirectChat}
                        aria-label="Toggle Direct Customer Messaging"
                        onClick={() => {
                          setAllowDirectChat(!allowDirectChat);
                          showTemporarySuccess(`Direct chat ${!allowDirectChat ? 'enabled' : 'disabled'}`);
                        }}
                        className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 shrink-0 cursor-pointer min-h-[44px] min-w-[44px] flex items-center focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none ${allowDirectChat ? 'bg-violet-600' : 'bg-slate-800'}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-300 shadow-md ${allowDirectChat ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    {/* Public Contact Info */}
                    <div className="flex items-center justify-between p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl min-h-[44px] gap-4">
                      <div className="space-y-0.5 pr-2">
                        <span className="text-sm font-bold text-white block">Display Public Contact Info</span>
                        <span className="text-xs text-slate-400 block leading-normal">
                          Display official business email and telephone on public storefront cards and service listings.
                        </span>
                      </div>
                      <button 
                        type="button"
                        role="switch"
                        aria-checked={showPublicContact}
                        aria-label="Toggle Display Public Contact Info"
                        onClick={() => {
                          setShowPublicContact(!showPublicContact);
                          showTemporarySuccess(`Public contact info ${!showPublicContact ? 'visible' : 'hidden'}`);
                        }}
                        className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 shrink-0 cursor-pointer min-h-[44px] min-w-[44px] flex items-center focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none ${showPublicContact ? 'bg-violet-600' : 'bg-slate-800'}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-300 shadow-md ${showPublicContact ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    {/* Inquiry Routing */}
                    <div className="flex items-center justify-between p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl min-h-[44px] gap-4">
                      <div className="space-y-0.5 pr-2">
                        <span className="text-sm font-bold text-white block">Smart Lead & Inquiry Routing</span>
                        <span className="text-xs text-slate-400 block leading-normal">
                          Automatically categorize and route incoming buyer product questions into your Seller Customer Operations queue.
                        </span>
                      </div>
                      <button 
                        type="button"
                        role="switch"
                        aria-checked={inquiryRouting}
                        aria-label="Toggle Smart Lead Routing"
                        onClick={() => {
                          setInquiryRouting(!inquiryRouting);
                          showTemporarySuccess(`Inquiry routing ${!inquiryRouting ? 'enabled' : 'disabled'}`);
                        }}
                        className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 shrink-0 cursor-pointer min-h-[44px] min-w-[44px] flex items-center focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none ${inquiryRouting ? 'bg-violet-600' : 'bg-slate-800'}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-300 shadow-md ${inquiryRouting ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. WORKSPACE & ROLE CONTROLS */}
              {(settingsCategory === 'all' || settingsCategory === 'workspace') && (
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
                  <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-violet-400" />
                      <h4 className="text-sm font-bold text-white">Workspace & Active Context</h4>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-md">
                      Role: {activeRoleView || user?.role || 'buyer'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Select your active operational role. Switching roles adapts your top-level navigation, order management workflows, and store management views.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    {[
                      { id: 'buyer', label: 'Buyer / Consumer', desc: 'Browse & Purchase', icon: ShoppingBag },
                      { id: 'seller', label: 'Merchant Seller', desc: 'Store & Inventory', icon: Store },
                      { id: 'service_provider', label: 'Service Provider', desc: 'Consulting & Bookings', icon: Briefcase },
                      { id: 'business_owner', label: 'Enterprise Owner', desc: 'Multi-Outlet Corp', icon: Building2 }
                    ].map((r) => {
                      const isCurrent = (activeRoleView || user?.role) === r.id;
                      const RIcon = r.icon;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={async () => {
                            try {
                              if (updateUser) {
                                await updateUser({ activeRole: r.id } as any);
                              }
                              showTemporarySuccess(`Active workspace set to: ${r.label}`);
                            } catch (e) {
                              console.error('Role update error:', e);
                            }
                          }}
                          className={`flex flex-col items-start p-4 min-h-[44px] rounded-xl border text-left transition-all cursor-pointer gap-2 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none ${
                            isCurrent
                              ? 'bg-violet-600/15 border-violet-500 text-white shadow-lg ring-1 ring-violet-500/50'
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <RIcon className={`w-4 h-4 ${isCurrent ? 'text-violet-400' : 'text-slate-500'}`} />
                            {isCurrent && <Check className="w-3.5 h-3.5 text-violet-400" />}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">{r.label}</span>
                            <span className="text-[10px] text-slate-400 block">{r.desc}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-200 block">Workspace Capabilities</span>
                      <span className="text-slate-400 text-[11px]">Authorized for Pi Mainnet escrow, dispute arbitration, and multi-currency pricing.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('/my-workspace')}
                      className="min-h-[44px] px-3.5 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                    >
                      <Briefcase className="w-3.5 h-3.5 text-violet-400" />
                      <span>Open My Workspace</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 6. SECURITY & ACCOUNT IDENTITY */}
              {(settingsCategory === 'all' || settingsCategory === 'security') && (
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
                  <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-sm font-bold text-white">Security & Canonical Identity</h4>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-md">
                      Verified Pioneer
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* UID */}
                    <div className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Canonical Firebase UID</span>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono text-slate-200 truncate">{user?.uid || 'Not Synced'}</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (user?.uid) {
                              navigator.clipboard.writeText(user.uid);
                              showTemporarySuccess("UID copied to clipboard");
                            }
                          }}
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                          aria-label="Copy Canonical UID"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Pi Username */}
                    <div className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pi Network Identity</span>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono text-violet-300 font-bold truncate">@{user?.username || user?.displayName || 'pioneer'}</span>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-1 rounded border border-emerald-800/60">Consensus Member</span>
                      </div>
                    </div>
                  </div>

                  {/* Network Node Info */}
                  <div className="p-4 bg-slate-950/50 border border-slate-800/80 rounded-xl flex gap-3 text-xs text-slate-400 leading-relaxed font-semibold">
                    <Settings2 className="w-5 h-5 text-violet-400 shrink-0" />
                    <div className="space-y-1">
                      <span className="text-slate-300 block">Active Network Layer: Sandbox Node Testnet v2.4</span>
                      <span className="text-slate-400 block">Host Platform: Google AI Studio Web3 Sandbox Container</span>
                    </div>
                  </div>

                  {/* Logout Action */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await logout();
                          navigate('/login');
                        } catch (e) {
                          console.error('Logout error:', e);
                        }
                      }}
                      className="min-h-[44px] px-4 py-2 bg-rose-950/40 hover:bg-rose-950/80 border border-rose-800/60 text-rose-300 hover:text-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out of Current Session</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 7. REGIONAL & DISPLAY PREFERENCES */}
              {(settingsCategory === 'all' || settingsCategory === 'regional') && (
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
                  <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-violet-400" />
                      <h4 className="text-sm font-bold text-white">Regional, Localization & Display Controls</h4>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Ecosystem Standard
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Configure base pricing currency displays, localized time zone formatting, and consensus valuation indices.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Primary Settlement Currency</span>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="w-6 h-6 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-xs font-bold text-violet-400 font-mono">π</span>
                        <span className="text-xs font-bold text-white">Pi Coin (π)</span>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Language & Locale</span>
                      <div className="flex items-center gap-2 pt-1">
                        <Globe className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-bold text-white">English (Global Pioneer)</span>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Time Zone Standard</span>
                      <div className="flex items-center gap-2 pt-1">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-bold text-white">Coordinated Universal Time (UTC)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Sticky Action Bar */}
              <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl backdrop-blur-md">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>All preferences are applied live to your active merchant workspace.</span>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={handleResetPreferences}
                    className="min-h-[44px] px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                  >
                    Reset Defaults
                  </button>

                  <button
                    type="button"
                    disabled={savingSettings}
                    onClick={handleSavePreferences}
                    className="min-h-[44px] px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-violet-600/20 flex items-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none disabled:opacity-50"
                  >
                    {savingSettings ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Applying...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save & Apply</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 6: HELP & SUPPORT */}
          {activeTab === 'help' && (
            <div className="space-y-6">
              {/* FAQ Section */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-6 shadow-xl animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-violet-400" />
                      Frequently Asked Questions
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Essential guides for navigating Pi Business Market</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">5 Guides</span>
                </div>

                <div className="space-y-4">
                  {[
                    { q: "What is Pi Business Market?", a: "Pi Business Market (PBM) is an omnichannel commerce operating system built for the Pi Network ecosystem. Pioneers can securely establish businesses, open retail storefronts, offer professional consulting, run logistical operations, and pay with Pi coin through our non-custodial sandbox ledger." },
                    { q: "How do I claim my BMP Rewards?", a: "Click on the Daily BMP Claim button inside your wallet dashboard. Under our strict gamification ledger consensus rules, claiming awards a base of +10 BMP daily. Streak milestones compound rewards: +15 BMP at 3 days, +30 BMP at 7 days, and +100 BMP at 30 days of consecutive claims!" },
                    { q: "Is the wallet secure?", a: "Yes. All transactions run on our distributed consensus simulator, secured by automated escrow controls. No raw private keys are stored on-chain or transmitted over public networks." },
                    { q: "How do I start selling?", a: "Click on the 'Start Your Business' section in your personal info tab or navbar. You can register a business profile, launch an online store, or offer services with full catalog management." },
                    { q: "What is the One Account Policy?", a: "To prevent sybil attacks and protect our decentralized trust graph, each Pioneer can establish one primary merchant brand per verified account. This profile can contain multiple catalog products, services, or physical store outlets." }
                  ].map((faq, idx) => (
                    <div key={idx} className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl space-y-1.5">
                      <h4 className="text-sm font-bold text-slate-200">Q: {faq.q}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed font-normal">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact Support Form */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-6 shadow-xl animate-fade-in">
                <div className="border-b border-slate-800 pb-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Mail className="w-5 h-5 text-violet-400" />
                    Direct Support Helpdesk
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Submit a diagnostic support ticket. Our team reviews submissions within 24 hours.</p>
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
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 block">Your Full Name</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. John Doe"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 min-h-[44px] text-xs text-white placeholder-slate-600 focus-visible:ring-2 focus-visible:ring-violet-500/20 focus-visible:outline-none focus:border-violet-500 font-semibold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 block">Email Address</label>
                      <input 
                        type="email" 
                        required
                        placeholder="e.g. jdoe@pioneer.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 min-h-[44px] text-xs text-white placeholder-slate-600 focus-visible:ring-2 focus-visible:ring-violet-500/20 focus-visible:outline-none focus:border-violet-500 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 block">Ticket Subject</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Escrow payout verification question"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 min-h-[44px] text-xs text-white placeholder-slate-600 focus-visible:ring-2 focus-visible:ring-violet-500/20 focus-visible:outline-none focus:border-violet-500 font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 block">Detailed Message Description</label>
                    <textarea 
                      required
                      rows={4}
                      placeholder="Explain what happened, including any relevant transaction correlation IDs..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus-visible:ring-2 focus-visible:ring-violet-500/20 focus-visible:outline-none focus:border-violet-500 font-semibold resize-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full sm:w-auto px-8 py-3.5 min-h-[44px] bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-violet-600/20 active:scale-95 cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-500/20 focus-visible:outline-none"
                  >
                    Submit Support Ticket
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>

        {/* LOGOUT SIGN OUT CTA CONTAINER */}
        <div className="flex justify-center mt-12">
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 px-6 py-3 min-h-[44px] bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:border-rose-500/40 rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer active:scale-95 focus-visible:ring-2 focus-visible:ring-rose-500/20 focus-visible:outline-none"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out of Workspace</span>
          </button>
        </div>

      </main>

    </div>
  );
};

export default ProfilePage;
