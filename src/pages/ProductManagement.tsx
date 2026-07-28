/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  ArrowLeft, 
  ArrowUp, 
  Download, 
  Upload, 
  MoreHorizontal,
  LayoutGrid,
  List,
  Loader2,
  AlertCircle,
  Store as StoreIcon,
  Briefcase,
  X,
  Layers,
  ShoppingBag,
  TrendingUp,
  Users,
  DollarSign,
  Star,
  CheckCircle2,
  Calendar,
  Clock,
  ShieldCheck,
  MapPin,
  Trash2,
  Settings,
  FolderTree,
  Activity,
  FileText,
  Percent,
  Check,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Heart,
  Share2,
  Mic,
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
  Phone,
  Mail,
  Globe,
  Award,
  Truck,
  RotateCcw,
  BadgePercent,
  CreditCard,
  MessageCircle,
  Eye,
  Menu,
  ShieldAlert,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from '../components/Navbar';
import { ProductCard } from '../components/product/ProductCard';
import { ProductWizard } from '../components/product/ProductWizard';
import { VariantWizard } from '../components/product/VariantWizard';
import { VariantList } from '../components/product/VariantList';
import { productService } from '../services/productService';
import { storeService } from '../services/storeService';
import { orderService } from '../services/orderService';
import { adminService } from '../services/adminService';
import { getFirebaseDb } from '../firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../auth/useAuth';
import { Product, Store, Order, OrderStatus } from '../types';
import { CardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { BottomDrawer } from '../components/ui/BottomDrawer';
import { ConfirmModal } from '../components/ui/ConfirmModal';

// Modular Tab components
import { StoreCategoriesTab } from '../components/store/StoreCategoriesTab';
import { StoreInventoryTab } from '../components/store/StoreInventoryTab';
import { StoreOrdersTab } from '../components/store/StoreOrdersTab';
import { StoreCustomersTab } from '../components/store/StoreCustomersTab';
import { StoreAnalyticsTab } from '../components/store/StoreAnalyticsTab';
import { StoreSettingsTab } from '../components/store/StoreSettingsTab';

// Animated Counter Component for Premium Stats
const AnimatedCounter: React.FC<{ value: number; duration?: number; decimals?: number }> = ({ value, duration = 800, decimals = 0 }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(progress * value);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [value, duration]);
  return <>{count.toFixed(decimals)}</>;
};

export const ProductManagement: React.FC = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProductIndexCompiling, setIsProductIndexCompiling] = useState(false);
  
  // High-Level Mode: Owner can toggle between Customer Storefront or Seller Admin Console
  const [isMerchantConsoleMode, setIsMerchantConsoleMode] = useState(window.location.pathname.endsWith('/products'));
  
  // Customer Storefront View Tab
  const [customerTab, setCustomerTab] = useState<'shop' | 'products' | 'offers' | 'reviews' | 'gallery' | 'about'>('shop');
  const [isControlPanelDismissed, setIsControlPanelDismissed] = useState(false);
  const [isStoreMenuOpen, setIsStoreMenuOpen] = useState(false);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<string | null>(null);
  
  // Seller Console Tab Management
  const [activeTab, setActiveTab] = useState<'overview' | 'catalog' | 'categories' | 'inventory' | 'orders' | 'crm' | 'analytics' | 'settings'>('overview');
  const [merchantFilter, setMerchantFilter] = useState<'all' | 'published' | 'draft' | 'archived' | 'deleted' | 'low_stock' | 'out_of_stock' | 'featured' | 'trending'>('all');
  const [merchantSort, setMerchantSort] = useState<'newest' | 'oldest' | 'highest_price' | 'lowest_price' | 'highest_revenue' | 'best_seller' | 'highest_rating' | 'views' | 'wishlist' | 'alphabetical'>('newest');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Customer Filtering and Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<number>(500);
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, title: string, message: string, action: () => void, isDestructive?: boolean}>({
    isOpen: false,
    title: '',
    message: '',
    action: () => {},
    isDestructive: true
  });

  const confirmAction = (title: string, message: string, action: () => void, isDestructive = true) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      action,
      isDestructive
    });
  };

  const [isListening, setIsListening] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [selectedDiscount, setSelectedDiscount] = useState<number>(0);
  const [freeShippingOnly, setFreeShippingOnly] = useState<boolean>(false);

  // Followers & Favorited states stored locally
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isFavLoading, setIsFavLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  // Dynamic Coupons State
  const [coupons, setCoupons] = useState<any[]>([
    { code: 'PIWELCOME10', discount: '10% OFF', desc: 'On your first shopping purchase', minOrder: '10 π' },
    { code: 'PIONEERFREE', discount: 'FREE DELIVERY', desc: 'Free standard courier shipping', minOrder: '40 π' },
    { code: 'SUPERSAVER', discount: '20% OFF', desc: 'On high quality premium arrivals', minOrder: '100 π' }
  ]);

  // Dynamic Feature Flags (Optional/Configurable Features)
  const [featureFlags, setFeatureFlags] = useState({
    enableTrendingProducts: true,
    enableBestSellers: true,
    enableNewArrivals: true,
    enableFlashDeals: true,
    enableDynamicCoupons: true,
    enableInfiniteScroll: true,
  });

  // Lazy Loading & Infinite Scroll
  const [visibleCount, setVisibleCount] = useState<number>(6);
  const [loadMoreRef, setLoadMoreRef] = useState<HTMLDivElement | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Products Table state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  
  // Variant Management State
  const [isVariantWizardOpen, setIsVariantWizardOpen] = useState(false);
  const [isVariantListOpen, setIsVariantListOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Custom Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Intersection Observer for Infinite Scroll
  useEffect(() => {
    if (!loadMoreRef || !featureFlags.enableInfiniteScroll) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisibleCount(prev => prev + 6);
      }
    }, {
      rootMargin: '150px', // start loading before user reaches the absolute bottom
      threshold: 0.1
    });

    observer.observe(loadMoreRef);
    return () => observer.disconnect();
  }, [loadMoreRef, featureFlags.enableInfiniteScroll]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    setIsProductIndexCompiling(false);
    try {
      const storeData = await storeService.getStore(storeId!);
      if (!storeData) throw new Error('Store not found');
      
      const currentUserIsOwner = Boolean(
        user && (
          storeData.ownerUid === user.uid || 
          (user.piUid && storeData.ownerUid === user.piUid)
        )
      );

      if (window.location.pathname.endsWith('/products') && !currentUserIsOwner) {
        navigate(`/store/${storeId}`, { replace: true });
        setIsMerchantConsoleMode(false);
      }
      
      setStore(storeData);
      setFollowersCount(storeData.followers || 1250);

      // Fetch products in a separate try-catch so product index issue doesn't crash the profile
      let productsData: Product[] = [];
      try {
        productsData = await productService.getStoreProducts(storeId!, { includeDeleted: true });
        setProducts(productsData);
        
        // Dynamically adjust priceRange to show all products initially
        if (productsData.length > 0) {
          const calculatedMaxPrice = Math.max(...productsData.map(p => p.price || 0));
          setPriceRange(calculatedMaxPrice > 0 ? calculatedMaxPrice : 500);
        } else {
          setPriceRange(500);
        }
      } catch (pErr: any) {
        console.warn('Store products query notice: Database is currently setting up index or compiling. Gracefully rendering loader.');
        if (pErr?.message?.includes('index') || pErr?.message?.includes('FAILED_PRECONDITION')) {
          setIsProductIndexCompiling(true);
        } else {
          setIsProductIndexCompiling(true);
        }
      }

      // Fetch related orders
      try {
        const orderList = await orderService.getBusinessOrders(storeData.businessId);
        const storeOrders = orderList.filter(o => !o.storeId || o.storeId === storeId);
        setOrders(storeOrders);
      } catch (oErr) {
        console.warn('Could not fetch business orders.');
      }

      // Fetch dynamic coupons from Firestore subcollection /stores/{storeId}/coupons
      try {
        const db = getFirebaseDb();
        const couponsSnap = await getDocs(collection(db, 'stores', storeId!, 'coupons'));
        if (!couponsSnap.empty) {
          const loadedCoupons = couponsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setCoupons(loadedCoupons);
        }
      } catch (cErr) {
        console.warn('Could not fetch store coupons from database, using optimized defaults.', cErr);
      }

      // Fetch system feature flags to enable/disable features dynamically
      try {
        const flags = await adminService.getFeatureFlags();
        const updatedFlags = { ...featureFlags };
        flags.forEach(flag => {
          if (flag.flagId === 'enable_trending' || flag.name === 'enableTrendingProducts') {
            updatedFlags.enableTrendingProducts = flag.enabled;
          }
          if (flag.flagId === 'enable_bestsellers' || flag.name === 'enableBestSellers') {
            updatedFlags.enableBestSellers = flag.enabled;
          }
          if (flag.flagId === 'enable_newarrivals' || flag.name === 'enableNewArrivals') {
            updatedFlags.enableNewArrivals = flag.enabled;
          }
          if (flag.flagId === 'enable_flashdeals' || flag.name === 'enableFlashDeals') {
            updatedFlags.enableFlashDeals = flag.enabled;
          }
          if (flag.flagId === 'enable_dynamic_coupons' || flag.name === 'enableDynamicCoupons') {
            updatedFlags.enableDynamicCoupons = flag.enabled;
          }
        });
        setFeatureFlags(updatedFlags);
      } catch (fErr) {
        console.warn('Could not fetch feature flags, using stable default profile.', fErr);
      }

    } catch (err: any) {
      console.warn('Store profile loading issue.');
      if (err?.message?.includes('Store not found')) {
        setError('Store not found');
      } else {
        setError('Failed to load store profile');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (storeId) {
      loadData();
    }
    const handleProductsChanged = () => {
      if (storeId) loadData();
    };
    window.addEventListener('productsChanged', handleProductsChanged);
    return () => window.removeEventListener('productsChanged', handleProductsChanged);
  }, [storeId, authLoading]);

  // Sync following and favorite from localStorage on load
  useEffect(() => {
    if (storeId) {
      setIsFollowing(localStorage.getItem(`follow_store_${storeId}`) === 'true');
      setIsFavorited(localStorage.getItem(`favorite_store_${storeId}`) === 'true');
    }
  }, [storeId]);

  const toggleFollow = async () => {
    if (!store || isFollowLoading) return;
    setIsFollowLoading(true);
    await new Promise(r => setTimeout(r, 600)); // immersive simulation
    const newState = !isFollowing;
    setIsFollowing(newState);
    localStorage.setItem(`follow_store_${store.storeId}`, String(newState));
    
    const newCount = newState ? followersCount + 1 : Math.max(0, followersCount - 1);
    setFollowersCount(newCount);
    
    triggerToast(newState ? `You are now following ${store.storeName}!` : `Unfollowed ${store.storeName}`);
    
    try {
      await storeService.updateStore(store.storeId, { followers: newCount });
    } catch (err) {
      console.warn('Failed to persist followers to DB:', err);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!store || isFavLoading) return;
    setIsFavLoading(true);
    await new Promise(r => setTimeout(r, 600)); // immersive simulation
    const newState = !isFavorited;
    setIsFavorited(newState);
    localStorage.setItem(`favorite_store_${store.storeId}`, String(newState));
    triggerToast(newState ? 'Store added to your Favorites!' : 'Store removed from your Favorites.');
    setIsFavLoading(false);
  };

  const shareStore = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: store?.storeName,
        text: store?.description,
        url: url
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      triggerToast('Store link copied to clipboard!');
    }
  };

  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      triggerToast("Voice search is not supported on this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    
    recognition.onstart = () => {
      setIsListening(true);
      triggerToast("Listening... Speak clearly.");
    };
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      setIsListening(false);
      triggerToast(`Voice recognized: "${transcript}"`);
    };
    
    recognition.onerror = () => {
      setIsListening(false);
      triggerToast("Could not recognize voice. Please try again.");
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.start();
  };

  const handleDelete = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product? This action is irreversible.')) return;
    
    try {
      await productService.softDeleteProduct(productId);
      setProducts(prev => prev.filter(p => p.productId !== productId));
      triggerToast('Product soft-deleted successfully.');
    } catch (err: any) {
      setError('Failed to delete product: ' + err.message);
    }
  };

  const handleDeleteStore = async () => {
    if (!window.confirm('CRITICAL: Are you absolutely sure you want to delete this Entire Store? This will delete all catalog layouts, custom settings, and is irreversible.')) return;
    try {
      await storeService.deleteStore(storeId!);
      triggerToast('Store profile permanently deleted.');
      navigate('/store-dashboard');
    } catch (err: any) {
      alert('Deletion error: ' + err.message);
    }
  };

  const handleDuplicate = async (product: Product) => {
    try {
      const { productId, createdAt, updatedAt, ...rest } = product;
      const newSku = `${rest.sku}-COPY-${Math.floor(Math.random() * 1000)}`;
      const newSlug = `${rest.productSlug}-copy-${Math.floor(Math.random() * 1000)}`;
      
      await productService.createProduct({
        ...rest,
        productName: `${rest.productName} (Copy)`,
        productSlug: newSlug,
        sku: newSku,
        status: 'draft'
      });
      
      await loadData();
      triggerToast('Product duplicated as Draft copy.');
    } catch (err: any) {
      setError('Failed to duplicate product: ' + err.message);
    }
  };

  // Extract unique categories and brands for filtering
  const categoriesList = Array.from(new Set(products.map(p => p.category))).filter(Boolean);
  const brandsList = Array.from(new Set(products.map(p => p.brand))).filter(Boolean);
  const maxPrice = products.length > 0 ? Math.max(...products.map(p => p.price || 0)) : 500;

  // Filter products for CUSTOMER STOREFRONT
  const customerFilteredProducts = products.filter(p => {
    if (!p) return false;
    
    // Only display published/active/live products for customer storefront
    const pStatus = (p.status || 'published').toLowerCase();
    if (!isMerchantConsoleMode && pStatus !== 'published' && pStatus !== 'active' && pStatus !== 'live') {
      return false;
    }

    const name = (p.productName || '').toLowerCase();
    const sku = (p.sku || '').toLowerCase();
    const brand = (p.brand || '').toLowerCase();
    const category = (p.category || '').toLowerCase();
    const search = searchQuery.toLowerCase().trim();

    const matchesSearch = search === '' ||
                          name.includes(search) ||
                          sku.includes(search) ||
                          brand.includes(search) ||
                          category.includes(search);
    
    const matchesCategory = !selectedCategory || selectedCategory.toLowerCase() === 'all' || category === selectedCategory.toLowerCase();
    const matchesBrand = !selectedBrand || selectedBrand.toLowerCase() === 'all' || brand === selectedBrand.toLowerCase();
    const matchesPrice = priceRange === undefined || priceRange === null || (p.price || 0) <= priceRange;
    const matchesStock = !onlyInStock || (p.stock || 0) > 0;

    const ratingSeed = 4.3 + (p.productId.charCodeAt(0) % 8) * 0.1;
    const rating = Math.min(5, Math.max(4, ratingSeed));
    const compare = p.comparePrice || (p.price * 1.25);
    const discount = Math.round(((compare - p.price) / compare) * 100);
    const hasFreeShipping = true;

    const matchesRating = rating >= selectedRating;
    const matchesDiscount = discount >= selectedDiscount;
    const matchesShipping = !freeShippingOnly || hasFreeShipping;

    return matchesSearch && matchesCategory && matchesBrand && matchesPrice && matchesStock && matchesRating && matchesDiscount && matchesShipping;
  });

  // Sort products
  const sortedProducts = [...customerFilteredProducts].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
    if (sortBy === 'popularity') {
      // Deterministic calculation of popularity based on sales
      const salesA = 50 + (a.productId.charCodeAt(a.productId.length - 1) || 0) * 4;
      const salesB = 50 + (b.productId.charCodeAt(b.productId.length - 1) || 0) * 4;
      return salesB - salesA;
    }
    if (sortBy === 'rating') {
      const ratingA = 4.3 + (a.productId.charCodeAt(0) % 8) * 0.1;
      const ratingB = 4.3 + (b.productId.charCodeAt(0) % 8) * 0.1;
      return ratingB - ratingA;
    }
    if (sortBy === 'discount') return b.price - a.price; // High to Low
    return 0;
  });

  // Filter products for MERCHANT CONSOLE
  let filteredProductsMerchant = products.filter(p => {
    if (!p) return false;
    
    // Apply Filters
    if (merchantFilter !== 'all') {
      const pStatus = (p.status || 'published').toLowerCase();
      
      if (merchantFilter === 'low_stock') {
        if ((p.stock || 0) === 0 || (p.stock || 0) > 10) return false;
      } else if (merchantFilter === 'out_of_stock') {
        if ((p.stock || 0) > 0) return false;
      } else if (merchantFilter === 'featured') {
        if (!p.featured) return false;
      } else if (merchantFilter === 'trending') {
        // Example logic for trending
        if ((p.metrics?.views || 0) < 50) return false;
      } else {
        if (pStatus !== merchantFilter) return false;
      }
    }
    
    // Instant Search
    const search = searchQuery.toLowerCase().trim();
    if (search !== '') {
      const name = (p.productName || '').toLowerCase();
      const sku = (p.sku || '').toLowerCase();
      const barcode = (p.barcode || '').toLowerCase();
      const category = (p.category || '').toLowerCase();
      const brand = (p.brand || '').toLowerCase();
      const pStatus = (p.status || '').toLowerCase();
      const tags = (p.tags || []).join(' ').toLowerCase();
      const owner = (p.ownerUid || '').toLowerCase();

      return name.includes(search) || 
             sku.includes(search) || 
             barcode.includes(search) || 
             category.includes(search) || 
             brand.includes(search) || 
             pStatus.includes(search) || 
             tags.includes(search) || 
             owner.includes(search);
    }
    
    return true;
  });

  // Apply Sorting
  filteredProductsMerchant.sort((a, b) => {
    switch (merchantSort) {
      case 'newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'highest_price': return (b.price || 0) - (a.price || 0);
      case 'lowest_price': return (a.price || 0) - (b.price || 0);
      case 'highest_revenue': return (b.metrics?.revenue || 0) - (a.metrics?.revenue || 0);
      case 'best_seller': return (b.metrics?.orders || 0) - (a.metrics?.orders || 0);
      case 'highest_rating': return (b.metrics?.performanceScore || 0) - (a.metrics?.performanceScore || 0);
      case 'views': return (b.metrics?.views || 0) - (a.metrics?.views || 0);
      case 'wishlist': return (b.metrics?.wishlistCount || 0) - (a.metrics?.wishlistCount || 0);
      case 'alphabetical': return (a.productName || '').localeCompare(b.productName || '');
      default: return 0;
    }
  });

  // Stats calculation
  const totalStockCount = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  const outOfStockCount = products.filter(p => (p.stock || 0) === 0).length;
  const lowStockCount = products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 10).length;
  const totalRevenue = orders.reduce((acc, o) => acc + (o.grandTotal || 0), 0);
  const pendingOrdersCount = orders.filter(o => o.orderStatus === OrderStatus.PENDING_PAYMENT).length;
  const completedOrdersCount = orders.filter(o => o.orderStatus === OrderStatus.COMPLETED).length;

  const isOwner = Boolean(
    store && user && (
      store.ownerUid === user.uid || 
      (user.piUid && store.ownerUid === user.piUid)
    )
  );

  const toggleProductSelection = (productId: string, selected: boolean) => {
    setSelectedProductIds(prev => 
      selected ? [...prev, productId] : prev.filter(id => id !== productId)
    );
  };

  const handleBulkAction = async (action: 'archive' | 'delete' | 'restore' | 'publish' | 'draft' | 'permanent_delete') => {
    if (selectedProductIds.length === 0) return;
    
    const actionText = action.replace('_', ' ');
    confirmAction(
      `Confirm ${actionText}`,
      `Are you sure you want to ${actionText} ${selectedProductIds.length} product(s)?`,
      async () => {
        try {
          const promises = selectedProductIds.map(id => {
            switch (action) {
              case 'archive': return productService.archiveProduct(id);
              case 'restore': return productService.restoreProduct(id);
              case 'publish': return productService.updateProduct(id, { status: 'published' });
              case 'draft': return productService.updateProduct(id, { status: 'draft' });
              case 'delete': return productService.softDeleteProduct(id, user?.uid);
              case 'permanent_delete': return productService.permanentDeleteProduct(id);
            }
          });
          await Promise.all(promises);
          triggerToast(`Bulk ${actionText} successful`);
          setSelectedProductIds([]);
          window.dispatchEvent(new Event('productsChanged'));
        } catch (err) {
          console.error(err);
          triggerToast('Failed to perform bulk action');
        }
      },
      action === 'delete' || action === 'permanent_delete'
    );
    return; // Stop here, the modal will handle the execution


    try {
      const promises = selectedProductIds.map(id => {
        switch (action) {
          case 'archive': return productService.archiveProduct(id);
          case 'restore': return productService.restoreProduct(id);
          case 'publish': return productService.updateProduct(id, { status: 'published' });
          case 'draft': return productService.updateProduct(id, { status: 'draft' });
          case 'delete': return productService.softDeleteProduct(id, user?.uid);
          case 'permanent_delete': return productService.permanentDeleteProduct(id);
        }
      });
      await Promise.all(promises);
      triggerToast(`Bulk ${actionText} successful`);
      setSelectedProductIds([]);
      loadData();
    } catch (err) {
      console.error(err);
      triggerToast(`Error performing bulk ${actionText}`);
    }
  };

  const getCommonProductCardProps = (forConsole: boolean = false) => {
    return {
      ...(isOwner ? {
        onEdit: (p: Product) => { setEditingProduct(p); setIsWizardOpen(true); },
        onManageVariants: (p: Product) => { setSelectedProduct(p); setIsVariantListOpen(true); }
      } : {}),
      onView: (p: Product) => navigate(`/product/${p.productId}`),
      isMerchantView: forConsole,
      ...(forConsole ? {
        onSelect: toggleProductSelection
      } : {})
    };
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col text-slate-100 font-sans">
        <Navbar 
          currentUser={user}
          currentView="discovery"
          onNavigate={(view) => navigate(`/${view}`)}
          cartCount={0}
          walletBalance={100}
          onWalletUpdate={() => {}}
          onToggleCart={() => {}}
        />

        {/* Banner Skeleton */}
        <div className="w-full h-48 sm:h-72 bg-gradient-to-b from-slate-900 to-slate-950 animate-pulse relative rounded-b-[2rem] border-b border-slate-900" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full -mt-20 relative z-10 pb-20 space-y-8">
          {/* Floating Store Header Card Skeleton */}
          <div className="bg-slate-950/80 backdrop-blur-xl border border-slate-800/80 p-6 sm:p-8 rounded-[2rem] shadow-2xl space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-900">
              <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
                {/* Logo */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-900 border border-slate-800 rounded-full animate-pulse shadow-md" />
                <div className="space-y-3">
                  <div className="h-7 w-48 sm:w-64 bg-slate-900 rounded-lg animate-pulse border border-slate-800" />
                  <div className="flex gap-4 items-center justify-center md:justify-start">
                    <div className="h-4 w-24 bg-slate-900 rounded animate-pulse border border-slate-850" />
                    <div className="h-4 w-20 bg-slate-900 rounded animate-pulse border border-slate-850" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <div className="h-11 w-32 bg-slate-900 rounded-xl animate-pulse border border-slate-850 flex-1 md:flex-none" />
                <div className="h-11 w-32 bg-slate-900 rounded-xl animate-pulse border border-slate-850 flex-1 md:flex-none" />
              </div>
            </div>

            {/* About Row Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div className="h-12 bg-slate-900 rounded-xl animate-pulse border border-slate-850" />
              <div className="h-12 bg-slate-900 rounded-xl animate-pulse border border-slate-850" />
              <div className="h-12 bg-slate-900 rounded-xl animate-pulse border border-slate-850" />
            </div>
          </div>

          {/* Subtabs Skeleton */}
          <div className="flex gap-4 border-b border-slate-900 pb-3 overflow-x-auto scrollbar-none">
            <div className="h-10 w-24 bg-slate-900 rounded-full animate-pulse border border-slate-850 shrink-0" />
            <div className="h-10 w-32 bg-slate-900 rounded-full animate-pulse border border-slate-850 shrink-0" />
            <div className="h-10 w-28 bg-slate-900 rounded-full animate-pulse border border-slate-850 shrink-0" />
            <div className="h-10 w-24 bg-slate-900 rounded-full animate-pulse border border-slate-850 shrink-0" />
          </div>

          {/* Main Content Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Skeleton */}
            <div className="hidden lg:block space-y-6">
              <div className="h-40 bg-slate-950 border border-slate-900 rounded-2xl animate-pulse" />
              <div className="h-56 bg-slate-950 border border-slate-900 rounded-2xl animate-pulse" />
            </div>

            {/* Products Grid Skeleton */}
            <div className="lg:col-span-3 space-y-6">
              <div className="flex justify-between items-center">
                <div className="h-6 w-32 bg-slate-900 rounded animate-pulse" />
                <div className="h-10 w-36 bg-slate-900 rounded-xl animate-pulse" />
              </div>
              <CardSkeleton count={6} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !store) {
    const isIndexError = error?.includes('preparing your data') || error?.includes('FAILED_PRECONDITION') || error?.includes('index');
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col">
        <Navbar 
          currentUser={user}
          currentView="store-dashboard"
          onNavigate={(view) => navigate(`/${view}`)}
          cartCount={0}
          walletBalance={100}
          onWalletUpdate={() => {}}
          onToggleCart={() => {}}
        />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-16 h-16 rounded-full bg-[#6366f1]/10 flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8 text-[#6366f1]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {isIndexError ? 'Preparing Database' : 'Store Access Issue'}
          </h2>
          <p className="text-slate-400 mb-8 text-center max-w-md whitespace-pre-line">
            {isIndexError 
              ? 'Database is preparing your data.\nPlease try again in a few minutes.' 
              : error || 'Failed to load store profile'}
          </p>
          <button 
            onClick={() => navigate('/store-dashboard')}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold hover:bg-slate-800 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Pre-seed mock values for extreme high fidelity
  const ownerResponseRate = "99%";

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans selection:bg-violet-500/30">
      <Navbar 
        currentUser={user}
        currentView="discovery"
        onNavigate={(view) => navigate(`/${view}`)}
        cartCount={0}
        walletBalance={100}
        onWalletUpdate={() => {}}
        onToggleCart={() => {}}
      />

      {/* 1. SELLER COMMAND OVERLAY BANNER */}
      {isOwner && !isControlPanelDismissed && (
        <div className="mx-4 mt-4 bg-gradient-to-r from-violet-950/80 via-slate-950/90 to-indigo-950/80 border border-violet-500/30 p-3 sm:p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-40 overflow-hidden">
          {/* Ambient glow decoration inside */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-start sm:items-center gap-3 w-full sm:w-auto">
            <div className="p-2 bg-violet-500/10 rounded-xl border border-violet-500/20 text-violet-400 shrink-0">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-0.5">
              <span className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                Merchant Console Control
                <span className="px-1.5 py-0.5 text-[8px] bg-emerald-500/20 text-emerald-400 rounded-md uppercase tracking-widest font-black">
                  Owner
                </span>
              </span>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Store Visibility: <span className="text-emerald-400">Public Live</span> | Status: <span className="text-violet-400">Active</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <button 
              onClick={() => {
                setIsMerchantConsoleMode(!isMerchantConsoleMode);
                triggerToast(isMerchantConsoleMode ? "Switched to Public Storefront View" : "Switched to Seller Management Console");
              }}
              className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-widest shadow-lg shadow-violet-600/30 min-h-[44px] flex items-center justify-center cursor-pointer"
            >
              {isMerchantConsoleMode ? "View Public Storefront" : "Switch to Seller Console"}
            </button>

            {/* Dismiss Button */}
            <button 
              onClick={() => {
                setIsControlPanelDismissed(true);
                triggerToast("Merchant banner collapsed for this session.");
              }}
              className="p-2 text-slate-500 hover:text-slate-300 transition-colors rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. COVER BANNER AND PROFILE IDENTIFIER */}
      <div className="relative border-b border-slate-800/60 bg-slate-950 overflow-hidden">
        {/* Large Cover Banner Image - Reduced height by 40% */}
        <div className="h-32 sm:h-44 w-full relative bg-slate-950 overflow-hidden">
          {store.coverImageUrl ? (
            <img 
              src={store.coverImageUrl} 
              className="w-full h-full object-cover opacity-30" 
              alt="Store Cover Banner"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-violet-950 via-slate-950 to-indigo-950 opacity-40" />
          )}
          {/* Subtle grid lines & glow */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/30 to-black/30" />
        </div>

        {/* Floating Store Detail Card overlapping the banner - Redesigned completely */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 sm:-mt-16 pb-8 relative z-10">
          <div className="bg-[#080d19]/90 backdrop-blur-xl border border-slate-800 hover:border-violet-500/25 transition-all duration-350 p-6 rounded-[2rem] shadow-2xl shadow-black relative overflow-hidden group">
            {/* Soft background glows inside */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/5 rounded-full blur-3xl pointer-events-none group-hover:bg-violet-600/10 transition-colors duration-500" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

            {/* Info Layout */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              
              {/* Logo & Basic Info */}
              <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center flex-1 w-full">
                {/* Professional Store Logo with elegant Verified Badge Overlay */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center p-2.5 shadow-xl">
                  <div className="absolute inset-0 bg-violet-600/10" />
                  {store.logoUrl ? (
                    <img src={store.logoUrl} className="max-w-full max-h-full object-contain relative z-10 transition-transform duration-500 hover:scale-105 animate-fade-in" alt="Store logo" referrerPolicy="no-referrer" />
                  ) : (
                    <StoreIcon className="w-10 h-10 text-violet-400 relative z-10" />
                  )}
                  {/* Online Status Dot overlay */}
                  <span className="absolute bottom-1.5 right-1.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-950 animate-pulse z-20" title="Online" />
                </div>

                {/* Typography details */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-1.5">
                      {store.storeName}
                      {store.verified && (
                        <span className="p-1 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-full flex items-center justify-center" title="Verified Store Profile">
                          <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
                        </span>
                      )}
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest bg-emerald-500/10 border-emerald-500/20 text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> {store.status || 'Active'}
                    </span>
                    {store.storeCategory && (
                      <span className="px-2.5 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest bg-violet-500/10 border-violet-500/20 text-violet-400">
                        {store.storeCategory}
                      </span>
                    )}
                  </div>

                  {/* Core description preview */}
                  <p className="text-xs text-slate-400 font-medium max-w-xl leading-relaxed">
                    {store.description || 'Welcome to our exclusive decentralized marketplace portal. Browse high quality physical selections with secure Web3 checkout.'}
                  </p>

                  {/* Location and response info */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      {store.city || 'Chicago'}, {store.country || 'USA'}
                    </span>
                    <span className="text-slate-800">•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      Response Rate: 98% (Within 5 Mins)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Symmetrical Stats Grid - 5 identical height cards with Animated Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6">
              {/* Card 1: Rating */}
              <div className="bg-slate-900/40 hover:bg-slate-900/60 border border-slate-850 hover:border-violet-500/20 p-4 rounded-xl flex flex-col justify-between h-[82px] transition-all">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Rating</span>
                <div className="flex items-center gap-1.5 mt-1 text-amber-400">
                  <Star className="w-4 h-4 fill-current text-amber-400 shrink-0" />
                  <span className="text-base font-black text-slate-100 leading-none">
                    <AnimatedCounter value={Number(store.rating || 4.9)} decimals={1} />
                  </span>
                </div>
              </div>

              {/* Card 2: Followers */}
              <div className="bg-slate-900/40 hover:bg-slate-900/60 border border-slate-850 hover:border-violet-500/20 p-4 rounded-xl flex flex-col justify-between h-[82px] transition-all">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Followers</span>
                <div className="flex items-center gap-1.5 mt-1 text-violet-400">
                  <Users className="w-4 h-4 text-violet-400 shrink-0" />
                  <span className="text-base font-black text-slate-100 leading-none">
                    <AnimatedCounter value={followersCount} />
                  </span>
                </div>
              </div>

              {/* Card 3: Products / Listed SKUs */}
              <div className="bg-slate-900/40 hover:bg-slate-900/60 border border-slate-850 hover:border-violet-500/20 p-4 rounded-xl flex flex-col justify-between h-[82px] transition-all">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Listed SKUs</span>
                <div className="flex items-center gap-1.5 mt-1 text-indigo-400">
                  <Package className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="text-base font-black text-slate-100 leading-none">
                    <AnimatedCounter value={products.length} />
                  </span>
                </div>
              </div>

              {/* Card 4: Sales Count */}
              <div className="bg-slate-900/40 hover:bg-slate-900/60 border border-slate-850 hover:border-violet-500/20 p-4 rounded-xl flex flex-col justify-between h-[82px] transition-all">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Lifetime Sales</span>
                <div className="flex items-center gap-1.5 mt-1 text-emerald-400">
                  <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-base font-black text-slate-100 leading-none">
                    <AnimatedCounter value={orders.length} />
                  </span>
                </div>
              </div>

              {/* Card 5: Joined Since */}
              <div className="bg-slate-900/40 hover:bg-slate-900/60 border border-slate-850 hover:border-violet-500/20 p-4 rounded-xl flex flex-col justify-between h-[82px] col-span-2 lg:col-span-1 transition-all">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Joined Since</span>
                <div className="flex items-center gap-1.5 mt-1 text-slate-300">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-100 leading-none">
                    {new Date(store.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Premium Header Customer Action Panel - Touch Target 48px compliant buttons with ripple animations */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-800/60 mt-6 pt-5">
              <div className="flex flex-wrap gap-3 items-center w-full sm:w-auto">
                {/* Follow Button - Primary Accent */}
                <motion.button 
                  whileTap={{ scale: 0.96 }}
                  onClick={toggleFollow}
                  disabled={isFollowLoading}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 h-12 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md ${
                    isFollowing 
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/10' 
                      : 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-600/15'
                  }`}
                >
                  {isFollowLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Heart className={`w-4 h-4 ${isFollowing ? 'fill-current' : ''}`} />
                  )}
                  <span>{isFollowing ? 'Following' : 'Follow'}</span>
                </motion.button>

                {/* Message Seller Button - Secondary Neutral */}
                <motion.button 
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    navigate('/inbox', { 
                      state: { 
                        targetUid: store.ownerUid,
                        targetName: store.storeName,
                        contextType: 'store',
                        contextId: store.storeId
                      }
                    });
                  }}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 h-12 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all text-xs font-black uppercase tracking-wider"
                >
                  <MessageSquare className="w-4 h-4 text-violet-400" />
                  <span>Message Seller</span>
                </motion.button>

                {/* Visit Website Link (if any) */}
                {store.website && (
                  <motion.a 
                    whileTap={{ scale: 0.96 }}
                    href={store.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 h-12 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all text-xs font-black uppercase tracking-wider"
                  >
                    <Globe className="w-4 h-4 text-emerald-400" />
                    <span>Website</span>
                  </motion.a>
                )}
              </div>

              {/* Utility shortcuts: Favorite, Share with Ripple & Loading states */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {/* Favorite Button */}
                <motion.button 
                  whileTap={{ scale: 0.92 }}
                  onClick={toggleFavorite}
                  disabled={isFavLoading}
                  className={`h-12 w-12 rounded-xl border transition-all flex items-center justify-center ${
                    isFavorited 
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                  title="Favorite Store"
                >
                  {isFavLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Star className={`w-4 h-4 ${isFavorited ? 'fill-current text-amber-400' : ''}`} />
                  )}
                </motion.button>

                {/* Share Button */}
                <motion.button 
                  whileTap={{ scale: 0.92 }}
                  onClick={shareStore}
                  className="h-12 w-12 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all flex items-center justify-center"
                  title="Share Storefront"
                >
                  <Share2 className="w-4 h-4 text-indigo-400" />
                </motion.button>

                {/* THREE DOT OPTION MENU BUTTON */}
                <button 
                  onClick={() => setIsStoreMenuOpen(true)}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="More Store Options"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* 3. CORE VIEWS SWITCHBOARD */}
      {isMerchantConsoleMode ? (
        /* ==================== SELLER CONSOLE MODE ==================== */
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col lg:flex-row gap-8">
          {/* Left Navigation */}
          <div className="w-full lg:w-64 shrink-0 flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-1 pb-4 lg:pb-0 border-b lg:border-b-0 lg:border-r border-slate-850/60 lg:pr-6 pr-0">
            {[
              { id: 'overview', label: 'Console Home', icon: StoreIcon },
              { id: 'catalog', label: 'Product Catalog', icon: Package },
              { id: 'categories', label: 'Categories Hub', icon: FolderTree },
              { id: 'inventory', label: 'Stock Logistics', icon: Layers },
              { id: 'orders', label: 'Orders Ledger', icon: FileText },
              { id: 'crm', label: 'CRM Profiles', icon: Users },
              { id: 'analytics', label: 'Analytics Reports', icon: Activity },
              { id: 'settings', label: 'Settings Hub', icon: Settings }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-left border whitespace-nowrap transition-all ${
                    activeTab === tab.id 
                      ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-600/20' 
                      : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Content */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                {/* TAB 1: OVERVIEW */}
                {activeTab === 'overview' && (
                  <div className="space-y-8">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                          <StoreIcon className="w-5 h-5 text-violet-400" /> Store Console Dashboard
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">Real-time status, health, and analytical indicators of operations.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {[
                        { label: 'Listed Products', value: products.length, suffix: 'SKUs', color: 'text-violet-400', bg: 'bg-violet-500/10' },
                        { label: 'Lifetime Orders', value: orders.length, suffix: 'Orders', color: 'text-blue-400', bg: 'bg-blue-500/10' },
                        { label: 'Customer Profiles', value: '1.4k', suffix: 'Users', color: 'text-teal-400', bg: 'bg-teal-500/10' },
                        { label: 'Total Revenue', value: `${totalRevenue?.toLocaleString() || '18.4k'}`, suffix: 'Pi', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                        { label: 'Aggregate Stock', value: totalStockCount, suffix: 'Units', color: 'text-purple-400', bg: 'bg-purple-500/10' },
                        { label: 'Pending checkout', value: pendingOrdersCount, suffix: 'Orders', color: 'text-amber-400', bg: 'bg-amber-500/10' },
                        { label: 'Completed checkout', value: completedOrdersCount, suffix: 'Completed', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                        { label: 'Low Stock SKU', value: lowStockCount, suffix: 'Models', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
                        { label: 'Disputes/Returns', value: 'Pending', suffix: 'Disputes', color: 'text-rose-400', bg: 'bg-rose-500/10' },
                        { label: 'Operations Health', value: 'Pending', suffix: 'Health', color: 'text-teal-400', bg: 'bg-teal-500/10' },
                      ].map((card, idx) => (
                        <div key={idx} className="bg-[#090e1a]/95 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between h-28 hover:border-slate-700/80 transition-all">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-normal">{card.label}</span>
                          <div>
                            <p className={`text-xl font-black ${card.color}`}>{card.value}</p>
                            <span className="text-[9px] text-slate-500 font-bold uppercase mt-0.5 block">{card.suffix}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                      <div className="bg-[#090e1a]/90 border border-slate-800 p-6 rounded-2xl space-y-4">
                        <h4 className="text-sm font-black text-white flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Fast Console Actions
                        </h4>
                        <p className="text-xs text-slate-400 leading-relaxed">Instantly manage items, categorizations, and track ledger updates without page delays.</p>
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <button onClick={() => setActiveTab('catalog')} className="py-3 px-4 bg-[#030712] hover:bg-slate-900 border border-slate-850 rounded-xl text-[10px] font-bold uppercase tracking-wider text-violet-400 text-center transition-all">
                            View Catalog
                          </button>
                          <button onClick={() => setActiveTab('orders')} className="py-3 px-4 bg-[#030712] hover:bg-slate-900 border border-slate-850 rounded-xl text-[10px] font-bold uppercase tracking-wider text-violet-400 text-center transition-all">
                            View Orders
                          </button>
                        </div>
                      </div>
                      <div className="bg-[#090e1a]/90 border border-slate-800 p-6 rounded-2xl space-y-3 flex flex-col justify-between">
                        <div>
                          <h4 className="text-sm font-black text-white">Merchant Operational Guide</h4>
                          <p className="text-xs text-slate-400 mt-1">To test dynamic checkout flows, products should remain published with visibility toggled on. Keep inventory counts adjusted to prevent back-orders.</p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pi Network Merchant Standard v1.2</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: PRODUCT CATALOG */}
                {activeTab === 'catalog' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-4 border-b border-slate-850">
                      <div>
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                          <Package className="w-5 h-5 text-violet-400" /> Catalog Management
                        </h1>
                        <p className="text-xs text-slate-400">Manage digital inventory, prices, status options, and generate SKU copies.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => { setEditingProduct(undefined); setIsWizardOpen(true); }}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-500 transition-all text-xs"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Product</span>
                        </button>
                      </div>
                    </div>

                    {selectedProductIds.length > 0 && (
                      <div className="bg-violet-900/20 border border-violet-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-violet-300 text-xs font-bold pl-2">
                          <span className="bg-violet-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">{selectedProductIds.length}</span>
                          Selected
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button onClick={() => setSelectedProductIds(filteredProductsMerchant.map(p => p.productId))} className="px-3 py-1.5 rounded-lg bg-slate-900/50 text-slate-300 text-xs hover:bg-slate-800 transition-all border border-slate-700">Select All</button>
                          <button onClick={() => setSelectedProductIds([])} className="px-3 py-1.5 rounded-lg bg-slate-900/50 text-slate-300 text-xs hover:bg-slate-800 transition-all border border-slate-700">Clear</button>
                          <div className="w-px h-4 bg-slate-700 mx-1"></div>
                          <button onClick={() => handleBulkAction('publish')} className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs hover:bg-emerald-500/30 transition-all border border-emerald-500/30">Publish</button>
                          <button onClick={() => handleBulkAction('draft')} className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition-all border border-slate-600">Draft</button>
                          <button onClick={() => triggerToast('Update Price coming soon')} className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition-all border border-slate-600">Update Price</button>
                          <button onClick={() => triggerToast('Update Stock coming soon')} className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition-all border border-slate-600">Update Stock</button>
                          <button onClick={() => triggerToast('Export CSV coming soon')} className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition-all border border-slate-600">CSV</button>
                          <button onClick={() => triggerToast('Export Excel coming soon')} className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition-all border border-slate-600">Excel</button>
                          
                          {merchantFilter === 'deleted' ? (
                            <>
                              <button onClick={() => handleBulkAction('restore')} className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 text-xs hover:bg-blue-500/30 transition-all border border-blue-500/30">Restore</button>
                              <button onClick={() => handleBulkAction('permanent_delete')} className="px-3 py-1.5 rounded-lg bg-red-900/40 text-red-400 text-xs hover:bg-red-900/60 transition-all border border-red-500/30 flex items-center gap-1"><Trash2 className="w-3 h-3"/> Permanent Delete</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => handleBulkAction('archive')} className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-xs hover:bg-amber-500/30 transition-all border border-amber-500/30">Archive</button>
                              <button onClick={() => handleBulkAction('delete')} className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs hover:bg-red-500/30 transition-all border border-red-500/30 flex items-center gap-1"><Trash2 className="w-3 h-3"/> Delete</button>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Controls Bar */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                      <div className="relative flex-1">
                        <input 
                          type="text" 
                          placeholder="Search Name, SKU, Barcode, Brand, Tags, Owner..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-[#090e1a] border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-xs text-white focus:outline-none focus:border-violet-500 transition-all"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      </div>
                      
                      <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 hide-scrollbar shrink-0">
                        <select 
                          value={merchantFilter}
                          onChange={(e) => setMerchantFilter(e.target.value as any)}
                          className="bg-[#090e1a] border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-300 focus:outline-none focus:border-violet-500 transition-all font-bold appearance-none cursor-pointer pr-10"
                          style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem top 50%', backgroundSize: '0.65rem auto' }}
                        >
                          <option value="all">All Status</option>
                          <option value="published">Active</option>
                          <option value="draft">Draft</option>
                          <option value="archived">Archived</option>
                          <option value="deleted">Deleted</option>
                          <option value="out_of_stock">Out of Stock</option>
                          <option value="low_stock">Low Stock</option>
                          <option value="featured">Featured</option>
                          <option value="trending">Trending</option>
                        </select>

                        <select 
                          value={merchantSort}
                          onChange={(e) => setMerchantSort(e.target.value as any)}
                          className="bg-[#090e1a] border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-300 focus:outline-none focus:border-violet-500 transition-all font-bold appearance-none cursor-pointer pr-10"
                          style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem top 50%', backgroundSize: '0.65rem auto' }}
                        >
                          <option value="newest">Newest</option>
                          <option value="oldest">Oldest</option>
                          <option value="highest_price">Highest Price</option>
                          <option value="lowest_price">Lowest Price</option>
                          <option value="highest_revenue">Highest Revenue</option>
                          <option value="best_seller">Best Seller</option>
                          <option value="highest_rating">Highest Rating</option>
                          <option value="views">Most Views</option>
                          <option value="wishlist">Most Wishlist</option>
                          <option value="alphabetical">Alphabetical</option>
                        </select>

                        <div className="bg-[#090e1a] border border-slate-800 rounded-xl p-1 flex items-center shrink-0">
                          <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[#030712] text-violet-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
                            <LayoutGrid className="w-4 h-4" />
                          </button>
                          <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[#030712] text-violet-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
                            <List className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Product List */}
                    {filteredProductsMerchant.length === 0 ? (
                      <EmptyState 
                        icon={Package}
                        title={searchQuery ? 'No matching products' : 'Inventory Catalog Empty'}
                        description={searchQuery ? 'We couldn\'t find any products matching your current filters.' : 'Start building your digital inventory.'}
                        actionLabel={!searchQuery ? 'Add First Product' : undefined}
                        onAction={!searchQuery ? () => setIsWizardOpen(true) : undefined}
                      />
                    ) : (
                      <div className={viewMode === 'grid' ? 'premium-product-grid' : 'space-y-4'}>
                        {filteredProductsMerchant.map(product => (
                          <ProductCard 
                            key={product.productId}
                            product={product}
                            viewMode={viewMode}
                            isSelected={selectedProductIds.includes(product.productId)}
                            {...getCommonProductCardProps(true)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: CATEGORIES */}
                {activeTab === 'categories' && <StoreCategoriesTab storeId={storeId!} onToast={triggerToast} />}

                {/* TAB 4: STOCK LOGISTICS */}
                {activeTab === 'inventory' && <StoreInventoryTab storeId={storeId!} products={products} onRefreshProducts={loadData} onToast={triggerToast} />}

                {/* TAB 5: ORDERS LEDGER */}
                {activeTab === 'orders' && <StoreOrdersTab storeId={storeId!} businessId={store.businessId} onToast={triggerToast} />}

                {/* TAB 6: CRM PROFILES */}
                {activeTab === 'crm' && <StoreCustomersTab businessId={store.businessId} />}

                {/* TAB 7: ANALYTICS */}
                {activeTab === 'analytics' && <StoreAnalyticsTab products={products} orders={orders} />}

                {/* TAB 8: SETTINGS */}
                {activeTab === 'settings' && <StoreSettingsTab store={store} onRefreshStore={loadData} onToast={triggerToast} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      ) : (
        /* ==================== BILLION-DOLLAR CUSTOMER STOREFRONT MODE ==================== */
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 flex flex-col gap-8 pb-16">
          
          {/* Sub Navigation Bar - Sticky Segmented Control with smooth motion indicator */}
          <div className="sticky top-[64px] z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-900 overflow-x-auto no-scrollbar gap-1 py-1.5 flex items-center shadow-md">
            {[
              { id: 'shop', label: 'Overview', icon: Sparkles },
              { id: 'products', label: 'Products', icon: ShoppingBag },
              { id: 'offers', label: 'Deals', icon: BadgePercent },
              { id: 'gallery', label: 'Gallery', icon: LayoutGrid },
              { id: 'reviews', label: 'Reviews', icon: Star },
              { id: 'about', label: 'About', icon: Info }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = customerTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCustomerTab(tab.id as any)}
                  className={`relative flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap min-h-[44px] ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? 'text-violet-400 scale-110' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                  {isActive && (
                    <motion.div 
                      layoutId="activeSubTabIndicator" 
                      className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={customerTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              
              {/* SUBTAB 1: SHOP OVERVIEW */}
              {customerTab === 'shop' && (
                <div className="space-y-12">
                  {/* ABOUT STORE COMPACT WIDGET */}
                  <div className="bg-slate-900/35 border border-slate-800/80 p-5 rounded-2xl">
                    <div className="flex items-center gap-2 mb-3">
                      <Info className="w-4 h-4 text-violet-400" />
                      <h3 className="text-xs font-black uppercase tracking-widest text-white">About {store.storeName}</h3>
                    </div>
                    <p className="text-slate-400 text-xs font-semibold leading-relaxed mb-4 max-w-4xl">
                      {store.description || 'Welcome to our exclusive marketplace channel. Browse curated premium selections with secure checkout.'}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 pt-3 border-t border-slate-800/40">
                      <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-600" /> <span>{store.city || 'Chicago'}, {store.country || 'USA'}</span></div>
                      <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-slate-600" /> <span>Joined {new Date(store.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span></div>
                      <div className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-500" /> <span>Verified Merchant</span></div>
                      <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-violet-500" /> <span>Response: {ownerResponseRate}</span></div>
                    </div>
                  </div>

                  {/* 🔥 TRENDING PRODUCTS */}
                  {featureFlags.enableTrendingProducts && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-end border-b border-slate-850 pb-3">
                        <div>
                          <h2 className="text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-rose-500" /> 🔥 Trending Products
                          </h2>
                          <p className="text-xs text-slate-400">High engagement and high velocity catalog products right now.</p>
                        </div>
                        <button onClick={() => setCustomerTab('products')} className="text-xs font-bold uppercase tracking-wider text-violet-400 hover:text-white transition-colors flex items-center gap-1">
                          <span>See All</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      {isProductIndexCompiling ? (
                        <div className="py-8 text-center flex flex-col items-center justify-center space-y-3">
                          <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
                          <p className="text-xs text-slate-500 uppercase tracking-widest">Compiling catalog database...</p>
                        </div>
                      ) : products.length === 0 ? (
                        <EmptyState icon={Package} title="No products available" description="We are currently preparing our digital catalog collections." />
                      ) : (
                        <div className="premium-product-grid">
                          {products.slice(0, 4).map(product => (
                            <ProductCard 
                              key={product.productId}
                              product={product}
                              viewMode="grid"
                              {...getCommonProductCardProps(false)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ⭐ BEST SELLERS */}
                  {featureFlags.enableBestSellers && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-end border-b border-slate-850 pb-3">
                        <div>
                          <h2 className="text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
                            <Award className="w-5 h-5 text-amber-400" /> ⭐ Best Sellers
                          </h2>
                          <p className="text-xs text-slate-400">Our customer absolute favorites with flawless delivery track record.</p>
                        </div>
                        <button onClick={() => setCustomerTab('products')} className="text-xs font-bold uppercase tracking-wider text-violet-400 hover:text-white transition-colors flex items-center gap-1">
                          <span>See All</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      {isProductIndexCompiling ? (
                        <div className="py-8 text-center flex flex-col items-center justify-center space-y-3">
                          <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
                          <p className="text-xs text-slate-500 uppercase tracking-widest">Preparing catalog database...</p>
                        </div>
                      ) : products.length === 0 ? (
                        <EmptyState icon={Package} title="No products available" description="We are currently preparing our digital catalog collections." />
                      ) : (
                        <div className="premium-product-grid">
                          {[...products].reverse().slice(0, 4).map(product => (
                            <ProductCard 
                              key={product.productId}
                              product={product}
                              viewMode="grid"
                              {...getCommonProductCardProps(false)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 🆕 NEW ARRIVALS */}
                  {featureFlags.enableNewArrivals && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-end border-b border-slate-850 pb-3">
                        <div>
                          <h2 className="text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-violet-400" /> 🆕 New Arrivals
                          </h2>
                          <p className="text-xs text-slate-400">The latest additions and freshly listed merchandise.</p>
                        </div>
                        <button onClick={() => setCustomerTab('products')} className="text-xs font-bold uppercase tracking-wider text-violet-400 hover:text-white transition-colors flex items-center gap-1">
                          <span>See All</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      {isProductIndexCompiling ? (
                        <div className="py-8 text-center flex flex-col items-center justify-center space-y-3">
                          <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
                          <p className="text-xs text-slate-500 uppercase tracking-widest">Preparing catalog database...</p>
                        </div>
                      ) : products.length === 0 ? (
                        <EmptyState icon={Package} title="No products available" description="We are currently preparing our digital catalog collections." />
                      ) : (
                        <div className="premium-product-grid">
                          {[...products].sort((a,b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()).slice(0, 4).map(product => (
                            <ProductCard 
                              key={product.productId}
                              product={product}
                              viewMode="grid"
                              {...getCommonProductCardProps(false)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 💥 FLASH DEALS */}
                  {featureFlags.enableFlashDeals && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-end border-b border-slate-850 pb-3">
                        <div>
                          <h2 className="text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
                            <BadgePercent className="w-5 h-5 text-emerald-400" /> 💥 Flash Deals
                          </h2>
                          <p className="text-xs text-slate-400">Exclusive time-limited high savings discount catalog offers.</p>
                        </div>
                        <button onClick={() => setCustomerTab('products')} className="text-xs font-bold uppercase tracking-wider text-violet-400 hover:text-white transition-colors flex items-center gap-1">
                          <span>See All</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      {isProductIndexCompiling ? (
                        <div className="py-8 text-center flex flex-col items-center justify-center space-y-3">
                          <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
                          <p className="text-xs text-slate-500 uppercase tracking-widest">Preparing catalog database...</p>
                        </div>
                      ) : products.length === 0 ? (
                        <EmptyState icon={Package} title="No products available" description="We are currently preparing our digital catalog collections." />
                      ) : (
                        <div className="premium-product-grid">
                          {products.slice(0, 4).map(product => (
                            <ProductCard 
                              key={product.productId}
                              product={product}
                              viewMode="grid"
                              {...getCommonProductCardProps(false)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}

              {/* SUBTAB 2: PRODUCT SEARCH AND CATALOG */}
              {customerTab === 'products' && (
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                  {/* Left Desktop Filters Panel - Sticky & High Density */}
                  <div className="hidden lg:block w-64 shrink-0 bg-[#080d19]/60 backdrop-blur-md border border-slate-800/80 rounded-[20px] p-5 space-y-6 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-1 no-scrollbar">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <h4 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-1.5">
                        <SlidersHorizontal className="w-4 h-4 text-violet-400" /> Filters
                      </h4>
                      <button 
                        onClick={() => {
                          setSelectedCategory('all');
                          setSelectedBrand('all');
                          setPriceRange(maxPrice);
                          setOnlyInStock(false);
                          setSortBy('newest');
                          setSelectedRating(0);
                          setSelectedDiscount(0);
                          setFreeShippingOnly(false);
                        }}
                        className="text-[9px] font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                      >
                        Reset All
                      </button>
                    </div>

                    {/* Categories Filter */}
                    <div className="space-y-2.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Category</span>
                      <div className="space-y-1">
                        <button 
                          onClick={() => setSelectedCategory('all')}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                            selectedCategory === 'all' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
                          }`}
                        >
                          All Categories
                        </button>
                        {categoriesList.map(cat => (
                          <button 
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                              selectedCategory === cat ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Brands Filter */}
                    <div className="space-y-2.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Brand</span>
                      <div className="space-y-1">
                        <button 
                          onClick={() => setSelectedBrand('all')}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                            selectedBrand === 'all' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
                          }`}
                        >
                          All Brands
                        </button>
                        {brandsList.map(b => (
                          <button 
                            key={b}
                            onClick={() => setSelectedBrand(b)}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                              selectedBrand === b ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
                            }`}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Price Slider */}
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span>Max Price</span>
                        <span className="font-mono text-violet-400">{priceRange} π</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max={maxPrice} 
                        value={priceRange} 
                        onChange={(e) => setPriceRange(Number(e.target.value))}
                        className="w-full accent-violet-500 h-1 bg-slate-950 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Rating Filter */}
                    <div className="space-y-2.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Rating</span>
                      <div className="space-y-1">
                        {[0, 4, 3, 2, 1].map((ratingVal) => (
                          <button
                            key={ratingVal}
                            onClick={() => setSelectedRating(ratingVal)}
                            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              selectedRating === ratingVal 
                                ? 'bg-violet-600 text-white' 
                                : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
                            }`}
                          >
                            <Star className={`w-3.5 h-3.5 ${ratingVal > 0 ? 'fill-current text-amber-400' : 'text-slate-500'}`} />
                            <span>{ratingVal === 0 ? 'Any Rating' : `${ratingVal}★ & Up`}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Discount Filter */}
                    <div className="space-y-2.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Discount</span>
                      <div className="space-y-1">
                        {[0, 10, 20, 30].map((discountVal) => (
                          <button
                            key={discountVal}
                            onClick={() => setSelectedDiscount(discountVal)}
                            className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              selectedDiscount === discountVal 
                                ? 'bg-violet-600 text-white' 
                                : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
                            }`}
                          >
                            {discountVal === 0 ? 'Any Discount' : `${discountVal}% OFF & More`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Availability & Shipping Toggles */}
                    <div className="space-y-3 pt-2 border-t border-slate-800/40">
                      {/* Availability toggle */}
                      <label className="flex items-center gap-2.5 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={onlyInStock}
                          onChange={(e) => setOnlyInStock(e.target.checked)}
                          className="rounded border-slate-800 text-violet-650 focus:ring-violet-500 bg-slate-950 w-4 h-4 accent-violet-600 cursor-pointer"
                        />
                        <span className="text-xs text-slate-400 font-bold group-hover:text-white transition-colors uppercase tracking-wider cursor-pointer">In Stock Only</span>
                      </label>

                      {/* Shipping toggle */}
                      <label className="flex items-center gap-2.5 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={freeShippingOnly}
                          onChange={(e) => setFreeShippingOnly(e.target.checked)}
                          className="rounded border-slate-800 text-violet-650 focus:ring-violet-500 bg-slate-950 w-4 h-4 accent-violet-600 cursor-pointer"
                        />
                        <span className="text-xs text-slate-400 font-bold group-hover:text-white transition-colors uppercase tracking-wider cursor-pointer">Free Shipping</span>
                      </label>
                    </div>

                  </div>

                  {/* Main Catalog View Grid */}
                  <div className="flex-1 space-y-6 w-full">
                    {/* Catalog Header, Modern Voice Search & Grid controls */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Modern Rounded Search bar with Voice & Filters */}
                      <div className="relative flex-1">
                        <input 
                          type="text" 
                          placeholder="Search products by title, category, keywords..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-slate-900/50 border border-slate-800 hover:border-slate-700 rounded-full pl-12 pr-24 py-3.5 text-xs text-white focus:outline-none focus:border-violet-500 transition-all placeholder:text-slate-500 font-medium"
                        />
                        <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        
                        {/* Voice search button inside search bar */}
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={startVoiceSearch}
                            className={`p-2 rounded-full transition-colors ${isListening ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'text-slate-400 hover:text-white'}`}
                            title="Voice Search"
                          >
                            <Mic className="w-4 h-4" />
                          </button>
                          
                          {/* Mobile Filter toggle */}
                          <button 
                            onClick={() => setIsFilterDrawerOpen(true)}
                            className="lg:hidden p-2 text-slate-400 hover:text-white"
                            title="Filters Drawer"
                          >
                            <SlidersHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Sort dropdown and Grid selectors */}
                      <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-between md:justify-end">
                        <div className="flex items-center gap-2 bg-[#090e1a] border border-slate-800 rounded-full px-4 py-2">
                          <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest whitespace-nowrap">Sort By</span>
                          <select 
                            value={sortBy} 
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-transparent border-none text-xs font-bold text-slate-200 focus:ring-0 cursor-pointer focus:outline-none uppercase tracking-wider pr-2"
                          >
                            <option value="newest" className="bg-[#090e1a]">Newest Arrivals</option>
                            <option value="popularity" className="bg-[#090e1a]">Popularity</option>
                            <option value="rating" className="bg-[#090e1a]">Highest Rated</option>
                            <option value="discount" className="bg-[#090e1a]">Discount: High to Low</option>
                          </select>
                        </div>

                        <div className="bg-[#090e1a] border border-slate-800 rounded-xl p-1 flex items-center shrink-0">
                          <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[#030712] text-violet-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
                            <LayoutGrid className="w-4 h-4" />
                          </button>
                          <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[#030712] text-violet-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
                            <List className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Active filters summary */}
                    {(selectedCategory !== 'all' || selectedBrand !== 'all' || onlyInStock) && (
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Active Filters:</span>
                        {selectedCategory !== 'all' && (
                          <span className="px-3 py-1 bg-violet-600/10 border border-violet-500/20 rounded-full text-[9px] font-bold text-violet-300 flex items-center gap-1 uppercase tracking-widest">
                            Cat: {selectedCategory}
                            <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCategory('all')} />
                          </span>
                        )}
                        {selectedBrand !== 'all' && (
                          <span className="px-3 py-1 bg-violet-600/10 border border-violet-500/20 rounded-full text-[9px] font-bold text-violet-300 flex items-center gap-1 uppercase tracking-widest">
                            Brand: {selectedBrand}
                            <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedBrand('all')} />
                          </span>
                        )}
                        {onlyInStock && (
                          <span className="px-3 py-1 bg-violet-600/10 border border-violet-500/20 rounded-full text-[9px] font-bold text-violet-300 flex items-center gap-1 uppercase tracking-widest">
                            In Stock
                            <X className="w-3 h-3 cursor-pointer" onClick={() => setOnlyInStock(false)} />
                          </span>
                        )}
                      </div>
                    )}

                    {/* Grid List */}
                    {isProductIndexCompiling ? (
                      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 text-center max-w-lg mx-auto flex flex-col items-center justify-center space-y-4">
                        <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center animate-spin">
                          <Loader2 className="w-6 h-6 text-violet-400" />
                        </div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">Setting up Catalog Database</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          We are currently preparing the store's digital catalog index. This process takes a few minutes on first load. Please check back shortly!
                        </p>
                      </div>
                    ) : sortedProducts.length === 0 ? (
                      <EmptyState 
                        icon={Package}
                        title="No matching products"
                        description="Try adjusting your filter options, search keyword or check other categories."
                        actionLabel="Clear Filters"
                        onAction={() => {
                          setSelectedCategory('all');
                          setSelectedBrand('all');
                          setPriceRange(maxPrice);
                          setOnlyInStock(false);
                          setSearchQuery('');
                        }}
                      />
                    ) : (
                      <div className="space-y-8">
                        <div className={viewMode === 'grid' ? 'premium-product-grid' : 'space-y-4'}>
                          {sortedProducts.slice(0, visibleCount).map(product => (
                            <ProductCard 
                              key={product.productId}
                              product={product}
                              viewMode={viewMode}
                              {...getCommonProductCardProps(false)}
                            />
                          ))}
                        </div>

                        {/* Infinite Scroll target and loader indicator */}
                        {sortedProducts.length > visibleCount && (
                          <div 
                            ref={setLoadMoreRef} 
                            className="flex flex-col items-center justify-center pt-8 pb-4 w-full"
                          >
                            <button
                              onClick={() => setVisibleCount(prev => prev + 6)}
                              className="px-6 py-3 bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800 rounded-2xl text-xs font-black uppercase tracking-wider text-slate-300 hover:text-white transition-all flex items-center gap-2"
                            >
                              <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                              Loading More Curated Selections...
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                </div>
              )}

              {/* SUBTAB 3: COUPONS & DEALS */}
              {customerTab === 'offers' && (
                <div className="space-y-8">
                  <div className="pb-4 border-b border-slate-800">
                    <h2 className="text-xl font-black uppercase text-white tracking-tight flex items-center gap-2">
                      <BadgePercent className="w-5 h-5 text-violet-400" /> Active Coupons & Exclusive Deals
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">Copy coupon ticket codes during checkouts to get instant Pi coin deductions.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {coupons.map((c, idx) => (
                      <div 
                        key={idx} 
                        className="bg-slate-900/30 backdrop-blur-md border-2 border-dashed border-violet-500/40 p-8 rounded-3xl relative overflow-hidden flex flex-col justify-between h-56 hover:border-violet-500 transition-colors"
                      >
                        <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#030712] border-r-2 border-dashed border-violet-500/40" />
                        <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#030712] border-l-2 border-dashed border-violet-500/40" />

                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-2xl font-black text-white block uppercase tracking-tight">{c.discount}</span>
                            <span className="text-xs text-violet-400 font-extrabold uppercase mt-1 block">{c.code}</span>
                          </div>
                          <span className="px-3 py-1 bg-violet-600/10 border border-violet-500/20 rounded-full text-[9px] font-black uppercase tracking-widest text-violet-300">
                            OFFER ACTIVE
                          </span>
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-slate-300">{c.desc}</p>
                          <span className="text-[11px] text-slate-500 mt-1 block">Valid on orders equal or above {c.minOrder}</span>
                        </div>

                        <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Verified Merchant Escrow</span>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(c.code);
                              triggerToast(`Coupon Code ${c.code} copied!`);
                            }}
                            className="px-5 py-2.5 bg-violet-650 hover:bg-violet-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                          >
                            Copy Code
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUBTAB 4: CUSTOMER REVIEWS */}
              {customerTab === 'reviews' && (
                <div className="space-y-8">
                  <div className="pb-4 border-b border-slate-800">
                    <h2 className="text-xl font-black uppercase text-white tracking-tight flex items-center gap-2">
                      <Star className="w-5 h-5 text-amber-400 fill-amber-400" /> Customer Ratings & Feedbacks
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">Aggregated verified reviews directly from consumer orders ledger.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Metrics Panel */}
                    <div className="bg-[#080d19]/60 backdrop-blur-md border border-slate-800/80 p-6 rounded-3xl space-y-6">
                      <div className="text-center py-4">
                        <span className="text-5xl font-black text-white">4.9</span>
                        <div className="flex justify-center gap-1.5 mt-2">
                          {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 text-amber-400 fill-current" />)}
                        </div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-2 block">Aggregated Ratings</span>
                      </div>

                      <div className="space-y-2.5">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-slate-400 w-8">5 Star</span>
                          <div className="flex-1 bg-slate-950 h-2 rounded-full overflow-hidden">
                            <div className="bg-amber-400 h-full w-[92%]" />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 w-8 text-right">92%</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-slate-400 w-8">4 Star</span>
                          <div className="flex-1 bg-slate-950 h-2 rounded-full overflow-hidden">
                            <div className="bg-amber-400 h-full w-[6%]" />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 w-8 text-right">6%</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-slate-400 w-8">3 Star</span>
                          <div className="flex-1 bg-slate-950 h-2 rounded-full overflow-hidden">
                            <div className="bg-amber-400 h-full w-[2%]" />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 w-8 text-right">2%</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-slate-400 w-8">2 Star</span>
                          <div className="flex-1 bg-slate-950 h-2 rounded-full overflow-hidden">
                            <div className="bg-amber-400 h-full w-[0%]" />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 w-8 text-right">0%</span>
                        </div>
                      </div>
                    </div>

                    {/* Review List */}
                    <div className="lg:col-span-2 space-y-4">
                      {[
                        { author: "Michael K.", rating: 5, date: "July 12, 2026", text: "Astonishingly fast response rate and pristine product packaging. Will definitely buy again!" },
                        { author: "Sandra L.", rating: 5, date: "June 30, 2026", text: "Outstanding quality. Exactly as described, and the Pi network SDK checkout checkout was extremely smooth." },
                        { author: "Devon R.", rating: 4, date: "May 25, 2026", text: "Highly professional customer support when addressing stock status variants. Highly recommended." }
                      ].map((rev, idx) => (
                        <div key={idx} className="bg-slate-900/30 border border-slate-850 p-5 rounded-2xl space-y-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-xs font-black text-white">{rev.author}</span>
                              <div className="flex gap-1 mt-1">
                                {Array.from({ length: rev.rating }).map((_, i) => (
                                  <Star key={i} className="w-3 h-3 text-amber-400 fill-current" />
                                ))}
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{rev.date}</span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed font-medium">{rev.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SUBTAB: GALLERY */}
              {customerTab === 'gallery' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
                      <LayoutGrid className="w-5 h-5 text-violet-400" /> Storefront Gallery
                    </h2>
                    <p className="text-xs text-slate-400">Step inside our professional production facilities, curated collections, and physical showcases.</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[
                      { url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80", caption: "Premium Boutique Showroom" },
                      { url: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80", caption: "Direct Factory Shipping Hub" },
                      { url: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80", caption: "Handmade Premium Selections" },
                      { url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80", caption: "Acoustic Excellence Line" },
                      { url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80", caption: "Athletic Red Variant" },
                      { url: "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=800&q=80", caption: "Precision Crafted Minimalist Watch" },
                      { url: "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80", caption: "Acoustic Soundproofing Isolation" },
                      { url: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80", caption: "Luxury Summer Designer Line" }
                    ].map((img, idx) => (
                      <motion.div
                        key={idx}
                        whileHover={{ scale: 1.02, y: -4 }}
                        onClick={() => setSelectedGalleryImage(img.url)}
                        className="group relative h-48 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden cursor-pointer shadow-lg shadow-black/40"
                      >
                        <img 
                          src={img.url} 
                          alt={img.caption}
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white leading-normal">{img.caption}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUBTAB 5: ABOUT & POLICIES */}
              {customerTab === 'about' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Metadata Cards */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-900/20 border border-slate-800/80 p-6 rounded-3xl space-y-4">
                      <h3 className="text-md font-black uppercase text-white flex items-center gap-1.5">
                        <StoreIcon className="w-5 h-5 text-violet-400" /> Store Profile Description
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed font-medium">
                        {store.description || 'Welcome to our premium decentralized merchant outlet. We provide top-tier curated catalog items with fully certified production and transport standards. Feel secure in every transaction monitored by Pi network escrow services.'}
                      </p>
                    </div>

                    <div className="bg-slate-900/20 border border-slate-800/80 p-6 rounded-3xl space-y-4">
                      <h3 className="text-md font-black uppercase text-white flex items-center gap-1.5">
                        <ShieldCheck className="w-5 h-5 text-emerald-400" /> Decentralized Business Certifications
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed font-medium">
                        This store operates under strict business identity verification standards. All listed products are verified physical inventory with instant dispatch timelines. Payments are secured in escrow until shipment delivery confirmation.
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div className="flex items-start gap-3 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-850">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                          <div>
                            <span className="text-[11px] font-black text-white block uppercase tracking-wider">Verified Identity</span>
                            <span className="text-[9px] text-slate-500 block mt-0.5">UID Verified Merchant Escrow</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-850">
                          <Truck className="w-5 h-5 text-violet-400 shrink-0" />
                          <div>
                            <span className="text-[11px] font-black text-white block uppercase tracking-wider">Fast Courier Dispatch</span>
                            <span className="text-[9px] text-slate-500 block mt-0.5">Expected transit within 3-5 days</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Contact Info Sidebar */}
                  <div className="bg-[#080d19]/60 backdrop-blur-md border border-slate-800/80 p-6 rounded-3xl space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-white border-b border-slate-800 pb-3">
                      Contact & Business details
                    </h3>

                    <div className="space-y-4 text-xs font-medium">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-violet-400 shrink-0" />
                        <div>
                          <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider block">Physical Address</span>
                          <span className="text-slate-200 mt-1 block">{store.address || '123 Pi Pioneers Way'}, {store.city || 'San Francisco'}, {store.state || 'CA'}, {store.country || 'USA'}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Phone className="w-5 h-5 text-violet-400 shrink-0" />
                        <div>
                          <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider block">Phone Number</span>
                          <span className="text-slate-200 mt-1 block">{store.phone || '+1 555-0199'}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-violet-400 shrink-0" />
                        <div>
                          <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider block">E-mail Channel</span>
                          <span className="text-slate-200 mt-1 block">{store.email || 'support@merchant.pioneers'}</span>
                        </div>
                      </div>

                      {store.website && (
                        <div className="flex items-start gap-3">
                          <Globe className="w-5 h-5 text-violet-400 shrink-0" />
                          <div>
                            <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider block">Website link</span>
                            <a href={store.website} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline mt-1 block flex items-center gap-1">
                              {store.website} <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}

            </motion.div>
          </AnimatePresence>

          {/* 1. Mobile Filters Premium Bottom Drawer */}
          <BottomDrawer
            isOpen={isFilterDrawerOpen}
            onClose={() => setIsFilterDrawerOpen(false)}
            title="Curated Catalog Filters"
            description="Refine listed physical items by category, brand, pricing range, or availability."
          >
            <div className="space-y-6 pt-2 pb-6">
              {/* Categories Filter */}
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Catalog Category</span>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => setSelectedCategory('all')}
                    className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all min-h-[44px] ${
                      selectedCategory === 'all' 
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/20' 
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    All Items
                  </button>
                  {categoriesList.map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all min-h-[44px] ${
                        selectedCategory === cat 
                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/20' 
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Brands Filter */}
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Brand Collections</span>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => setSelectedBrand('all')}
                    className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all min-h-[44px] ${
                      selectedBrand === 'all' 
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/20' 
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    All Brands
                  </button>
                  {brandsList.map(b => (
                    <button 
                      key={b}
                      onClick={() => setSelectedBrand(b)}
                      className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all min-h-[44px] ${
                        selectedBrand === b 
                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/20' 
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <span>Price Limit (π)</span>
                  <span className="font-mono text-violet-400 text-xs font-bold">{priceRange} π</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max={maxPrice} 
                  value={priceRange} 
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                  className="w-full accent-violet-500 h-1.5 bg-slate-900 rounded-lg cursor-pointer"
                />
              </div>

              {/* Stock toggle with large touch target */}
              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer select-none bg-slate-900/50 border border-slate-850 p-4 rounded-xl hover:border-slate-800 transition-all min-h-[48px]">
                  <input 
                    type="checkbox" 
                    checked={onlyInStock}
                    onChange={(e) => setOnlyInStock(e.target.checked)}
                    className="rounded border-slate-800 text-violet-600 focus:ring-violet-500 bg-slate-950 w-5 h-5 accent-violet-600 cursor-pointer"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs text-slate-200 font-bold block uppercase tracking-wider">In Stock Selections Only</span>
                    <span className="text-[10px] text-slate-500 block">Exclude sold out and back-ordered listings.</span>
                  </div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-900">
                <button 
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedBrand('all');
                    setPriceRange(maxPrice);
                    setOnlyInStock(false);
                    setIsFilterDrawerOpen(false);
                    triggerToast("Catalog filters reset");
                  }}
                  className="w-full py-3.5 border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all min-h-[44px]"
                >
                  Reset All
                </button>
                <button 
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-violet-600/30 min-h-[44px]"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </BottomDrawer>

          {/* 2. Three-Dot Option Menu Premium Bottom Drawer */}
          <BottomDrawer
            isOpen={isStoreMenuOpen}
            onClose={() => setIsStoreMenuOpen(false)}
            title="Merchant Storefront Options"
            description={`Advanced shortcuts & settings for ${store.storeName}`}
          >
            <div className="space-y-3 pt-2 pb-6">
              {[
                { 
                  id: 'follow', 
                  label: isFollowing ? 'Unfollow Storefront' : 'Follow Storefront', 
                  icon: Heart, 
                  color: isFollowing ? 'text-rose-400' : 'text-slate-300',
                  action: () => {
                    toggleFollow();
                    setIsStoreMenuOpen(false);
                  }
                },
                { 
                  id: 'favorite', 
                  label: isFavorited ? 'Remove From Favorites' : 'Add to Favorites', 
                  icon: Star, 
                  color: isFavorited ? 'text-amber-400' : 'text-slate-300',
                  action: () => {
                    toggleFavorite();
                    setIsStoreMenuOpen(false);
                  }
                },
                { 
                  id: 'chat', 
                  label: 'Secure Merchant Chat', 
                  icon: MessageSquare, 
                  color: 'text-violet-400',
                  action: () => {
                    setIsStoreMenuOpen(false);
                    navigate('/inbox', { 
                      state: { 
                        targetUid: store.ownerUid,
                        targetName: store.storeName,
                        contextType: 'store',
                        contextId: store.storeId
                      }
                    });
                  }
                },
                { 
                  id: 'share', 
                  label: 'Share Store URL Link', 
                  icon: Share2, 
                  color: 'text-indigo-400',
                  action: () => {
                    shareStore();
                    setIsStoreMenuOpen(false);
                  }
                },
                { 
                  id: 'report', 
                  label: 'Report Store Violation', 
                  icon: ShieldAlert, 
                  color: 'text-slate-500',
                  action: () => {
                    setIsStoreMenuOpen(false);
                    triggerToast("Storefront flagged. Our decentralized moderation network will investigate.");
                  }
                }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={item.action}
                    className="w-full flex items-center gap-3.5 p-4 rounded-xl bg-slate-900/50 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 transition-all text-xs font-black uppercase tracking-wider text-left min-h-[48px]"
                  >
                    <Icon className={`w-5 h-5 ${item.color}`} />
                    <span className="text-slate-200">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </BottomDrawer>

          {/* 3. High Fidelity Gallery Fullscreen Lightbox Modal */}
          <AnimatePresence>
            {selectedGalleryImage && (
              <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center"
                >
                  <img 
                    src={selectedGalleryImage} 
                    className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl" 
                    alt="Lightbox Gallery Visual"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Action Bar */}
                  <div className="flex items-center gap-3 mt-4">
                    <button
                      onClick={() => {
                        setSelectedGalleryImage(null);
                        triggerToast("Gallery Lightbox closed");
                      }}
                      className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs font-black uppercase tracking-widest transition-all min-h-[44px]"
                    >
                      Close Lightbox
                    </button>
                  </div>

                  {/* Absolute Corner Exit icon button */}
                  <button 
                    onClick={() => setSelectedGalleryImage(null)}
                    className="absolute -top-12 right-0 p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </div>
      )}

      {/* 4. MODALS & TOASTS (SHARED) */}
      {/* Floating toast notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="fixed bottom-20 sm:bottom-6 right-6 z-[150] bg-violet-600 border border-violet-500 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-black uppercase tracking-widest"
          >
            <Check className="w-4 h-4 text-white" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Variant List Modal */}
      <AnimatePresence>
        {isVariantListOpen && selectedProduct && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#090e1a] border border-slate-800 rounded-[2.5rem] w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-violet-650/20 rounded-xl">
                    <Layers className="w-5 h-5 text-violet-450" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white leading-none mb-1">Product Variants</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{selectedProduct.productName}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsVariantListOpen(false)}
                  className="p-2 text-slate-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
                <VariantList 
                  product={selectedProduct} 
                  onUpdate={loadData} 
                />
              </div>

              <div className="p-6 bg-slate-900/50 border-t border-slate-800">
                <button 
                  onClick={() => {
                    setIsVariantListOpen(false);
                    setIsVariantWizardOpen(true);
                  }}
                  className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-violet-600/20 flex items-center justify-center gap-3"
                >
                  <Plus className="w-5 h-5" />
                  Generate New Variants
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Variant Wizard */}
      {isVariantWizardOpen && selectedProduct && (
        <VariantWizard 
          isOpen={isVariantWizardOpen}
          onClose={() => setIsVariantWizardOpen(false)}
          onSuccess={() => {
            setIsVariantWizardOpen(false);
            loadData();
          }}
          product={selectedProduct}
        />
      )}

      {/* Product Wizard Modal */}
      <AnimatePresence>
        {isWizardOpen && (
          <ProductWizard 
            storeId={storeId!}
            businessId={store.businessId}
            ownerUid={user?.uid || ''}
            initialProduct={editingProduct}
            onClose={() => setIsWizardOpen(false)}
            onComplete={() => {
              setIsWizardOpen(false);
              loadData();
            }}
          />
        )}
      </AnimatePresence>

      {/* Floating Scroll-to-Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            key="scroll-to-top"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-20 sm:bottom-6 left-6 z-[140] h-12 w-12 rounded-full bg-violet-600 hover:bg-violet-500 border border-violet-500 text-white shadow-2xl flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-violet-400"
            title="Scroll to Top"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

    </div>
  );
};
