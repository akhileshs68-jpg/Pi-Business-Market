/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Megaphone, Tag, Sparkles, Percent, Calendar, Flame, Award, Zap, Flag, Plus, Trash2, 
  CheckCircle2, TrendingUp, Users, Target, Activity, Pause, Play, Copy, Edit2, Archive, 
  Share2, CreditCard, ShieldAlert, AlertCircle, Eye, ArrowRight, Check, Search, Filter, 
  Clock, ExternalLink, Store, ShoppingBag, Wrench, Info, Upload, X, RotateCcw, BarChart3, 
  HelpCircle, CheckCheck, FileText, ChevronDown, SlidersHorizontal, Layers, Globe, DollarSign,
  Loader2, RefreshCw
} from 'lucide-react';
import { collection, doc, setDoc, getDoc, getDocs, query, where, serverTimestamp, updateDoc, deleteDoc } from 'firebase/firestore';
import { getFirebaseDb, getFirebaseAuth } from '../../firebase/config';
import { campaignService, Campaign, CampaignType, CampaignStatus, CtaType, AdPricingTier, AdPricingRates, DEFAULT_AD_PRICING_RATES } from '../../services/campaignService';
import { piPaymentService } from '../../services/piPaymentService';
import { storeService } from '../../services/storeService';
import { productService } from '../../services/productService';
import { serviceMarketplaceService } from '../../services/serviceMarketplaceService';
import { getAbsoluteUrl } from '../../utils/urlUtils';
import { isRealPiBrowser } from '../../auth/authService';
import { mediaService } from '../../services/mediaService';

interface Coupon {
  couponId: string;
  code: string;
  discountType: 'percentage' | 'fixed_pi' | 'free_shipping';
  discountValue: number;
  minOrderValue: number;
  maxUses: number;
  usedCount: number;
  active: boolean;
  businessId: string;
  couponClass?: 'business' | 'store' | 'festival' | 'referral' | 'first_purchase';
}

interface Props {
  businessId: string;
  userId: string;
}

export const MarketingCenter: React.FC<Props> = ({ businessId, userId }) => {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'coupons' | 'analytics' | 'guidelines'>('campaigns');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [rates, setRates] = useState<AdPricingRates>(DEFAULT_AD_PRICING_RATES);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [paymentInProgress, setPaymentInProgress] = useState<string | null>(null);
  
  // Feedback Banner
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const showFeedback = (type: 'success' | 'error' | 'info', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Campaign Search & Filters
  const [campaignSearch, setCampaignSearch] = useState('');
  const [campaignStatusFilter, setCampaignStatusFilter] = useState<string>('all');
  const [campaignTypeFilter, setCampaignTypeFilter] = useState<string>('all');
  const [campaignSortBy, setCampaignSortBy] = useState<'newest' | 'oldest' | 'impressions' | 'clicks' | 'ctr' | 'budget'>('newest');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [previewModalCampaign, setPreviewModalCampaign] = useState<Campaign | null>(null);
  const [copiedLinkCampaignId, setCopiedLinkCampaignId] = useState<string | null>(null);

  // Coupon Search & Filters
  const [couponSearch, setCouponSearch] = useState('');
  const [couponStatusFilter, setCouponStatusFilter] = useState<string>('all');
  const [couponTypeFilter, setCouponTypeFilter] = useState<string>('all');
  const [showCreateCouponForm, setShowCreateCouponForm] = useState(false);
  const [copiedCouponId, setCopiedCouponId] = useState<string | null>(null);

  // Coupon Form State
  const [newCode, setNewCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed_pi' | 'free_shipping'>('percentage');
  const [couponClass, setCouponClass] = useState<'business' | 'store' | 'festival' | 'referral' | 'first_purchase'>('business');
  const [discountValue, setDiscountValue] = useState(10);
  const [minOrder, setMinOrder] = useState(5);
  const [maxUses, setMaxUses] = useState(100);

  // Campaign Form State
  const [newCampaignTitle, setNewCampaignTitle] = useState('');
  const [newCampaignDescription, setNewCampaignDescription] = useState('');
  const [newCampaignType, setNewCampaignType] = useState<CampaignType>('flash_sale');
  const [newCampaignCta, setNewCampaignCta] = useState<CtaType>('shop_now');
  const [newCampaignTier, setNewCampaignTier] = useState<AdPricingTier>('standard_banner');
  const [newCampaignImage, setNewCampaignImage] = useState('https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800');
  const [newCampaignBadge, setNewCampaignBadge] = useState('Special Offer');
  const [newCampaignDiscount, setNewCampaignDiscount] = useState(15);
  const [newCampaignRoute, setNewCampaignRoute] = useState('/marketplace');
  const [newCampaignBgClass, setNewCampaignBgClass] = useState('from-violet-950 via-indigo-950 to-slate-950');
  const [durationDays, setDurationDays] = useState(7);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  // Owned Asset States for dropdown validation
  const [ownedStores, setOwnedStores] = useState<any[]>([]);
  const [ownedProducts, setOwnedProducts] = useState<any[]>([]);
  const [ownedServices, setOwnedServices] = useState<any[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [businessName, setBusinessName] = useState('My Business');
  const [businessLogo, setBusinessLogo] = useState('');

  useEffect(() => {
    loadMarketingData();
  }, [businessId]);

  // Synchronize campaign form inputs when selected asset changes
  useEffect(() => {
    if (newCampaignType === 'featured_store' && selectedStoreId) {
      const store = ownedStores.find(s => (s.storeId || s.id) === selectedStoreId);
      if (store) {
        setNewCampaignTitle(`Discover ${store.storeName}`);
        setNewCampaignDescription(store.description || `Visit our ${store.storeCategory || 'retail'} store outlet.`);
        setNewCampaignImage(store.logoUrl || store.imageUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100');
        setNewCampaignRoute(`/store/${selectedStoreId}`);
        setNewCampaignTier('featured_store');
        setNewCampaignCta('visit_store');
      }
    }
  }, [selectedStoreId, newCampaignType, ownedStores]);

  useEffect(() => {
    if (newCampaignType === 'featured_product' && selectedProductId) {
      const prod = ownedProducts.find(p => (p.productId || p.id) === selectedProductId);
      if (prod) {
        setNewCampaignTitle(prod.name || prod.title || '');
        setNewCampaignDescription(prod.description || prod.tagline || `Exclusive product available at our store.`);
        setNewCampaignImage(prod.imageUrl || prod.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800');
        setNewCampaignRoute(`/product/${selectedProductId}`);
        setNewCampaignTier('standard_banner');
        setNewCampaignCta('shop_now');
      }
    }
  }, [selectedProductId, newCampaignType, ownedProducts]);

  useEffect(() => {
    if (newCampaignType === 'featured_service' && selectedServiceId) {
      const serv = ownedServices.find(s => (s.serviceId || s.id) === selectedServiceId);
      if (serv) {
        setNewCampaignTitle(serv.title || '');
        setNewCampaignDescription(serv.shortDescription || serv.description || `Professional business service bookable now.`);
        setNewCampaignImage(serv.imageUrl || serv.coverImage || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800');
        setNewCampaignRoute(`/service/${selectedServiceId}`);
        setNewCampaignTier('sponsored_ad');
        setNewCampaignCta('book_service');
      }
    }
  }, [selectedServiceId, newCampaignType, ownedServices]);

  const loadMarketingData = async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const db = getFirebaseDb();
      
      const rateData = await campaignService.getAdPricingRates();
      setRates(rateData);

      const qC = query(collection(db, 'coupons'), where('businessId', '==', businessId));
      const snapC = await getDocs(qC);
      setCoupons(snapC.docs.map(d => ({ couponId: d.id, ...d.data() })) as Coupon[]);

      const qCamp = query(collection(db, 'campaigns'), where('businessId', '==', businessId));
      const snapCamp = await getDocs(qCamp);
      setCampaigns(snapCamp.docs.map(d => ({ id: d.id, ...d.data() })) as Campaign[]);
      
      // Load owned stores
      const storesList = await storeService.getStoresByBusiness(businessId);
      setOwnedStores(storesList || []);
      if (storesList && storesList.length > 0 && !selectedStoreId) {
        setSelectedStoreId(storesList[0].storeId || '');
      }

      // Load owned products
      const productsList = await productService.getStoreProducts(businessId);
      setOwnedProducts(productsList || []);
      if (productsList && productsList.length > 0 && !selectedProductId) {
        setSelectedProductId(productsList[0].productId || (productsList[0] as any).id || '');
      }

      // Load owned services
      const servicesList = await serviceMarketplaceService.getServices(businessId);
      setOwnedServices(servicesList || []);
      if (servicesList && servicesList.length > 0 && !selectedServiceId) {
        setSelectedServiceId(servicesList[0].serviceId || '');
      }

      // Load business details
      const bizDoc = await getDoc(doc(db, 'businesses', businessId));
      if (bizDoc.exists()) {
        const data = bizDoc.data();
        setBusinessName(data.businessName || data.name || 'My Business');
        setBusinessLogo(data.logoUrl || data.logo || '');
      }
      
    } catch (err) {
      console.warn('Failed to load marketing data', err);
      showFeedback('error', 'Could not refresh marketing records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateCost = () => {
    const ratePerDay = rates[newCampaignTier] || 5;
    return ratePerDay * durationDays;
  };

  const generateRandomCouponCode = () => {
    const prefixes = ['PI', 'SAVE', 'DEAL', 'SUPER', 'COMMERCE', 'FESTIVAL'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(10 + Math.random() * 90);
    setNewCode(`${prefix}${randomNum}`);
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !businessId) {
      showFeedback('error', 'Please enter a valid coupon code.');
      return;
    }
    setActionLoading('create_coupon');
    try {
      const db = getFirebaseDb();
      const cId = `coupon_${Date.now()}`;
      const couponData: Omit<Coupon, 'couponId'> = {
        code: newCode.trim().toUpperCase(),
        discountType,
        couponClass,
        discountValue: discountType === 'free_shipping' ? 0 : Number(discountValue),
        minOrderValue: Number(minOrder),
        maxUses: Number(maxUses),
        usedCount: 0,
        active: true,
        businessId
      };

      await setDoc(doc(db, 'coupons', cId), {
        ...couponData,
        createdAt: serverTimestamp()
      });
      setNewCode('');
      setShowCreateCouponForm(false);
      showFeedback('success', `Coupon ${couponData.code} published successfully!`);
      loadMarketingData();
    } catch (err: any) {
      console.error('Failed to create coupon:', err);
      showFeedback('error', err?.message || 'Failed to create discount coupon.');
    } finally {
      setActionLoading(null);
    }
  };

  const deleteCoupon = async (couponId: string, code: string) => {
    if (!confirm(`Are you sure you want to permanently delete coupon "${code}"?`)) return;
    setActionLoading(couponId);
    try {
      const db = getFirebaseDb();
      await deleteDoc(doc(db, 'coupons', couponId));
      showFeedback('info', `Coupon ${code} removed.`);
      loadMarketingData();
    } catch (err: any) {
      console.error('Failed to delete coupon:', err);
      showFeedback('error', 'Failed to delete coupon.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showFeedback('error', 'Image size must be less than 5MB.');
      if (bannerFileInputRef.current) bannerFileInputRef.current.value = '';
      return;
    }
    setIsUploadingBanner(true);
    try {
      const auth = getFirebaseAuth();
      const activeUserId = userId || auth?.currentUser?.uid || '';
      const asset = await mediaService.uploadMedia(file, activeUserId, {
        module: 'businesses',
        businessId: businessId,
      });
      if (asset && asset.downloadUrl) {
        setNewCampaignImage(asset.downloadUrl);
        showFeedback('success', 'Banner image uploaded successfully!');
      }
    } catch (uploadErr: any) {
      console.error('Failed to upload image:', uploadErr);
      showFeedback('error', `Failed to upload image: ${uploadErr.message || String(uploadErr)}`);
    } finally {
      setIsUploadingBanner(false);
      if (bannerFileInputRef.current) bannerFileInputRef.current.value = '';
    }
  };

  // Launch and pay for campaign using Pi SDK
  const handleLaunchAndPayCampaign = async () => {
    if (!newCampaignTitle.trim() || !businessId) {
      showFeedback('error', 'Please provide a campaign title.');
      return;
    }

    const totalCostPi = calculateCost();
    const auth = getFirebaseAuth();
    const activeUserId = userId || auth?.currentUser?.uid || '';

    try {
      setLoading(true);
      
      // Step 1: Create draft campaign record
      let bannerImageUrl = newCampaignImage || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800';
      if (bannerImageUrl && !bannerImageUrl.startsWith('http') && !bannerImageUrl.startsWith('data:')) {
        bannerImageUrl = getAbsoluteUrl(bannerImageUrl);
      }

      if (!bannerImageUrl || bannerImageUrl.startsWith('data:')) {
        throw new Error('A valid banner image URL is required. Please upload the image or provide a valid link starting with http/https.');
      }

      const createdCamp = await campaignService.createCampaign({
        merchantId: activeUserId,
        businessId,
        businessName,
        businessLogo,
        storeId: newCampaignType === 'featured_store' ? selectedStoreId : undefined,
        storeName: newCampaignType === 'featured_store' ? (ownedStores.find(s => (s.storeId || s.id) === selectedStoreId)?.storeName) : undefined,
        campaignTitle: newCampaignTitle.trim(),
        shortDescription: newCampaignDescription.trim() || 'Exclusive promotion on Pi Network.',
        campaignType: newCampaignType,
        bannerImage: bannerImageUrl,
        bgClass: newCampaignBgClass,
        targetRoute: newCampaignRoute || '/marketplace',
        offerBadge: newCampaignBadge || 'Special Offer',
        discountPercent: Number(newCampaignDiscount) || 0,
        status: 'pending',
        paymentStatus: 'pending_payment',
        durationDays: Number(durationDays),
        adPricingTier: newCampaignTier,
        budgetPi: totalCostPi,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + durationDays * 86400000).toISOString(),
        ctaType: newCampaignCta
      });

      setPaymentInProgress(createdCamp.id);

      // Helper function to get authorization headers for backend requests
      const getHeaders = async (): Promise<Record<string, string>> => {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        try {
          if (auth && auth.currentUser) {
            const token = await auth.currentUser.getIdToken();
            if (token) headers['Authorization'] = `Bearer ${token}`;
          }
        } catch (authErr) {
          console.warn('[Ad Payment] Failed to acquire auth token for callback:', authErr);
        }
        return headers;
      };

      // Step 2: Trigger Pi Payment SDK
      await piPaymentService.createPayment({
        amount: totalCostPi,
        memo: `Pi Ad Campaign: ${newCampaignTitle.trim()} (${durationDays} Days)`,
        metadata: {
          type: 'ad_campaign_payment',
          campaignId: createdCamp.id,
          businessId,
          merchantId: activeUserId
        }
      }, {
        onReadyForServerApproval: async (paymentId: string) => {
          console.log('[Ad Payment] Ready for server approval:', paymentId);
          const url = getAbsoluteUrl('/api/payments/approve');
          const headers = await getHeaders();
          const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              paymentId,
              metadata: {
                type: 'ad_campaign_payment',
                campaignId: createdCamp.id,
                businessId,
                merchantId: activeUserId
              }
            })
          });

          if (!response.ok) {
            const errText = await response.text();
            console.error('[Ad Payment Server Approval Failed]', response.status, errText);
            throw new Error(`Server approval failed (${response.status}): ${errText}`);
          }
          console.log('[Ad Payment] Server approval successful for paymentId:', paymentId);
        },
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          console.log('[Ad Payment] Ready for server completion:', paymentId, txid);
          const url = getAbsoluteUrl('/api/payments/complete');
          const headers = await getHeaders();
          const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              paymentId,
              txid,
              metadata: {
                type: 'ad_campaign_payment',
                campaignId: createdCamp.id,
                businessId,
                merchantId: activeUserId
              }
            })
          });

          if (!response.ok) {
            const errText = await response.text();
            console.warn('[Ad Payment Server Completion Notice]', response.status, errText);
          }

          await campaignService.verifyCampaignPayment(createdCamp.id, txid || paymentId, 'TESTNET', totalCostPi);
          showFeedback('success', `Ad Payment of ${totalCostPi} Pi Verified! Campaign submitted for Super Admin review.`);
          setPaymentInProgress(null);
          setShowCreateForm(false);
          setNewCampaignTitle('');
          setNewCampaignDescription('');
          loadMarketingData();
        },
        onCancel: async (paymentId: string) => {
          console.log('[Ad Payment Cancelled]', paymentId);
          showFeedback('info', 'Ad payment was cancelled.');
          setPaymentInProgress(null);
          loadMarketingData();
        },
        onError: async (err: Error, paymentId?: string) => {
          console.error('[Ad Payment Error]', err, paymentId);
          if (!isRealPiBrowser()) {
            console.log('[Ad Payment] Desktop / Non-Pi Browser environment detected. Applying dev fallback verification...');
            const mockTxId = `TX_AD_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
            await campaignService.verifyCampaignPayment(createdCamp.id, mockTxId, 'TESTNET', totalCostPi);
            showFeedback('success', `Ad Campaign Created & Verified (${totalCostPi} Pi - Dev Mode)! Submitted for Super Admin review.`);
            setPaymentInProgress(null);
            setShowCreateForm(false);
            setNewCampaignTitle('');
            setNewCampaignDescription('');
            loadMarketingData();
          } else {
            showFeedback('error', `Ad Campaign Payment Error: ${err.message || 'Payment launch failed.'}`);
            setPaymentInProgress(null);
          }
        }
      });

    } catch (err: any) {
      console.error('Failed creating campaign:', err);
      const errMsg = err?.message || String(err);
      showFeedback('error', `Failed to launch campaign payment: ${errMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleCampaign = async (campaignId: string, currentStatus: string) => {
    setActionLoading(campaignId);
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      await campaignService.updateCampaignStatus(campaignId, newStatus as CampaignStatus, userId);
      showFeedback('info', `Campaign status set to ${newStatus}.`);
      loadMarketingData();
    } catch (err: any) {
      showFeedback('error', 'Failed to change campaign status.');
    } finally {
      setActionLoading(null);
    }
  };

  const deleteCampaign = async (campaignId: string, title: string) => {
    if (!confirm(`Are you sure you want to archive campaign "${title}"?`)) return;
    setActionLoading(campaignId);
    try {
      await campaignService.updateCampaignStatus(campaignId, 'expired', userId);
      showFeedback('info', `Campaign "${title}" archived.`);
      loadMarketingData();
    } catch (err: any) {
      showFeedback('error', 'Failed to archive campaign.');
    } finally {
      setActionLoading(null);
    }
  };

  const duplicateCampaign = async (camp: Campaign) => {
    setActionLoading(camp.id);
    try {
      await campaignService.createCampaign({
        merchantId: userId,
        businessId,
        businessName: camp.businessName,
        campaignTitle: camp.campaignTitle + ' (Copy)',
        shortDescription: camp.shortDescription,
        campaignType: camp.campaignType,
        bannerImage: camp.bannerImage,
        targetRoute: camp.targetRoute,
        status: 'pending',
        paymentStatus: 'draft',
        startDate: new Date().toISOString(),
        ctaType: camp.ctaType,
        budgetPi: camp.budgetPi || 100
      });
      showFeedback('success', `Campaign duplicated as draft.`);
      loadMarketingData();
    } catch (err: any) {
      showFeedback('error', 'Failed to duplicate campaign.');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleCoupon = async (couponId: string, active: boolean, code: string) => {
    setActionLoading(couponId);
    try {
      const db = getFirebaseDb();
      await updateDoc(doc(db, 'coupons', couponId), {
        active: !active
      });
      showFeedback('info', `Coupon ${code} is now ${!active ? 'Active' : 'Inactive'}.`);
      loadMarketingData();
    } catch (err: any) {
      showFeedback('error', 'Failed to update coupon status.');
    } finally {
      setActionLoading(null);
    }
  };

  const copyCouponCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCouponId(id);
    showFeedback('info', `Coupon code "${code}" copied to clipboard!`);
    setTimeout(() => setCopiedCouponId(null), 2500);
  };

  const shareCampaignLink = (camp: Campaign) => {
    const shareUrl = window.location.origin + camp.targetRoute;
    if (navigator.share) {
      navigator.share({
        title: camp.campaignTitle,
        text: camp.shortDescription,
        url: shareUrl
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      setCopiedLinkCampaignId(camp.id);
      showFeedback('info', 'Campaign destination link copied to clipboard!');
      setTimeout(() => setCopiedLinkCampaignId(null), 2500);
    }
  };

  // Filter and Sort Campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(camp => {
      // Search filter
      if (campaignSearch.trim()) {
        const query = campaignSearch.toLowerCase();
        const matchesTitle = camp.campaignTitle?.toLowerCase().includes(query);
        const matchesDesc = camp.shortDescription?.toLowerCase().includes(query);
        const matchesRoute = camp.targetRoute?.toLowerCase().includes(query);
        const matchesStore = camp.storeName?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesRoute && !matchesStore) return false;
      }

      // Status filter
      if (campaignStatusFilter !== 'all') {
        if (camp.status !== campaignStatusFilter) return false;
      }

      // Type filter
      if (campaignTypeFilter !== 'all') {
        if (camp.campaignType !== campaignTypeFilter) return false;
      }

      return true;
    }).sort((a, b) => {
      if (campaignSortBy === 'newest') {
        return new Date(b.createdAt || b.startDate || 0).getTime() - new Date(a.createdAt || a.startDate || 0).getTime();
      }
      if (campaignSortBy === 'oldest') {
        return new Date(a.createdAt || a.startDate || 0).getTime() - new Date(b.createdAt || b.startDate || 0).getTime();
      }
      if (campaignSortBy === 'impressions') {
        return (b.impressions || 0) - (a.impressions || 0);
      }
      if (campaignSortBy === 'clicks') {
        return (b.clicks || 0) - (a.clicks || 0);
      }
      if (campaignSortBy === 'ctr') {
        return (b.ctr || 0) - (a.ctr || 0);
      }
      if (campaignSortBy === 'budget') {
        return (b.budgetPi || 0) - (a.budgetPi || 0);
      }
      return 0;
    });
  }, [campaigns, campaignSearch, campaignStatusFilter, campaignTypeFilter, campaignSortBy]);

  // Filter Coupons
  const filteredCoupons = useMemo(() => {
    return coupons.filter(c => {
      if (couponSearch.trim()) {
        const query = couponSearch.toLowerCase();
        if (!c.code.toLowerCase().includes(query) && !(c.couponClass || '').toLowerCase().includes(query)) return false;
      }
      if (couponStatusFilter === 'active' && !c.active) return false;
      if (couponStatusFilter === 'inactive' && c.active) return false;
      if (couponTypeFilter !== 'all' && c.discountType !== couponTypeFilter) return false;
      return true;
    });
  }, [coupons, couponSearch, couponStatusFilter, couponTypeFilter]);

  // High-level marketing analytics
  const totalImpressions = campaigns.reduce((acc, c) => acc + (c.impressions || 0), 0);
  const totalClicks = campaigns.reduce((acc, c) => acc + (c.clicks || 0), 0);
  const totalCtr = campaigns.length > 0 
    ? campaigns.reduce((acc, c) => acc + (c.ctr || 0), 0) / campaigns.length 
    : 0;
  const totalBudgetDeployed = campaigns.reduce((acc, c) => acc + (c.budgetPi || 0), 0);
  const activeCampaignCount = campaigns.filter(c => c.status === 'active').length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 lg:p-8 space-y-6 shadow-xl text-slate-100">
      
      {/* Top Header & Overview Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-br from-violet-600/20 to-indigo-600/20 text-violet-400 border border-violet-500/30 rounded-2xl shrink-0 shadow-inner">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">Marketing & Promotions Center</h2>
              {businessName && (
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px] font-bold border border-slate-700">
                  {businessName}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Launch paid banner ads, issue discount coupons, and track campaign ROI on Pi Network.
            </p>
          </div>
        </div>

        {/* Action Controls & Data Refresh */}
        <div className="flex items-center gap-2 self-start md:self-center">
          <button
            onClick={loadMarketingData}
            disabled={loading}
            title="Refresh Marketing Data"
            aria-label="Refresh Marketing Data"
            className="p-2.5 min-h-[44px] min-w-[44px] rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors flex items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-violet-400' : ''}`} />
          </button>
          
          <button
            onClick={() => {
              setActiveTab('campaigns');
              setShowCreateForm(true);
            }}
            aria-label="Create New Paid Campaign"
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition-all shadow-lg shadow-violet-600/25 cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none active:scale-95"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Create Campaign</span>
          </button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-semibold animate-fade-in ${
          feedback.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' :
          feedback.type === 'error' ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' :
          'bg-violet-500/10 border-violet-500/30 text-violet-300'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> :
           feedback.type === 'error' ? <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" /> :
           <Info className="w-5 h-5 text-violet-400 shrink-0" />}
          <span className="flex-1">{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modern Navigation Tabs */}
      <div className="w-full overflow-x-auto scrollbar-hide py-1">
        <div className="inline-flex items-center gap-1.5 bg-slate-950 p-1.5 border border-slate-800 rounded-2xl w-max min-w-full sm:min-w-max">
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 min-h-[44px] cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none ${
              activeTab === 'campaigns'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <Flame className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Ad Campaigns</span>
            <span className="px-1.5 py-0.5 rounded-md bg-slate-900/80 text-[10px] text-slate-300 font-mono">
              {campaigns.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('coupons')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 min-h-[44px] cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none ${
              activeTab === 'coupons'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <Tag className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Coupons & Discounts</span>
            <span className="px-1.5 py-0.5 rounded-md bg-slate-900/80 text-[10px] text-slate-300 font-mono">
              {coupons.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 min-h-[44px] cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none ${
              activeTab === 'analytics'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0 text-sky-400" />
            <span>Performance Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('guidelines')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 min-h-[44px] cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none ${
              activeTab === 'guidelines'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <HelpCircle className="w-4 h-4 shrink-0 text-indigo-400" />
            <span>Placement Guide & Pricing</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CAMPAIGNS & ADS */}
      {/* ========================================================================= */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Campaigns</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xl sm:text-2xl font-black text-white">{activeCampaignCount}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {campaigns.length} Total
                </span>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Impressions</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xl sm:text-2xl font-black text-white">{totalImpressions.toLocaleString()}</span>
                <Eye className="w-4 h-4 text-violet-400" />
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Clicks</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xl sm:text-2xl font-black text-white">{totalClicks.toLocaleString()}</span>
                <TrendingUp className="w-4 h-4 text-sky-400" />
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Avg. Click Rate</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xl sm:text-2xl font-black text-emerald-400">{totalCtr.toFixed(1)}%</span>
                <span className="text-[10px] font-mono text-slate-400">{totalBudgetDeployed} Pi Budget</span>
              </div>
            </div>
          </div>

          {/* CREATE CAMPAIGN COLLAPSIBLE FORM */}
          {showCreateForm && (
            <div className="p-5 sm:p-7 bg-slate-950 border-2 border-violet-500/40 rounded-3xl space-y-6 shadow-2xl animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" /> Launch Paid Promotion Campaign
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Deploy featured banners on Buyer Home slider, category pages, and search feeds.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="p-2 min-h-[44px] min-w-[44px] rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                  aria-label="Close Campaign Creation Form"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Side: Campaign Configuration Form (7 cols) */}
                <div className="lg:col-span-7 space-y-5 text-xs">
                  
                  {/* Step 1: Asset Type Selector */}
                  <div className="space-y-1.5">
                    <label htmlFor="newCampaignType" className="text-slate-300 font-bold block">
                      Promotion Category & Type <span className="text-rose-400">*</span>
                    </label>
                    <select
                      id="newCampaignType"
                      value={newCampaignType}
                      onChange={e => setNewCampaignType(e.target.value as CampaignType)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 min-h-[44px] text-sm text-white focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none transition-colors"
                    >
                      <option value="flash_sale">Flash Sale Banner (Urgent discount promotion)</option>
                      <option value="sponsored_ad">Sponsored Banner (Custom brand campaign)</option>
                      <option value="featured_store">Featured Store Spotlight (Promote store outlet)</option>
                      <option value="featured_product">Featured Product (Promote single catalogue item)</option>
                      <option value="featured_service">Featured Service (Promote service listing)</option>
                    </select>
                  </div>

                  {/* Dynamic Asset Selector */}
                  {newCampaignType === 'featured_store' && (
                    <div className="space-y-1.5 bg-slate-900/60 p-4 border border-slate-800 rounded-2xl">
                      <label htmlFor="selectedStoreId" className="text-slate-300 font-bold block">
                        Select Owned Store Outlet <span className="text-rose-400">*</span>
                      </label>
                      {ownedStores.length > 0 ? (
                        <select
                          id="selectedStoreId"
                          value={selectedStoreId}
                          onChange={e => setSelectedStoreId(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 min-h-[44px] text-sm text-white focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none transition-colors"
                        >
                          {ownedStores.map(s => (
                            <option key={s.storeId || s.id} value={s.storeId || s.id}>
                              {s.storeName} — {s.storeCategory || 'Retail Outlet'}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>No store outlets found. Create a store outlet first in the Store Outlets tab.</span>
                        </div>
                      )}
                    </div>
                  )}

                  {newCampaignType === 'featured_product' && (
                    <div className="space-y-1.5 bg-slate-900/60 p-4 border border-slate-800 rounded-2xl">
                      <label htmlFor="selectedProductId" className="text-slate-300 font-bold block">
                        Select Catalogue Product <span className="text-rose-400">*</span>
                      </label>
                      {ownedProducts.length > 0 ? (
                        <select
                          id="selectedProductId"
                          value={selectedProductId}
                          onChange={e => setSelectedProductId(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 min-h-[44px] text-sm text-white focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none transition-colors"
                        >
                          {ownedProducts.map(p => (
                            <option key={p.productId || p.id} value={p.productId || p.id}>
                              {p.name || p.title} ({p.price} Pi)
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>No products found. Add products first in the Products catalogue.</span>
                        </div>
                      )}
                    </div>
                  )}

                  {newCampaignType === 'featured_service' && (
                    <div className="space-y-1.5 bg-slate-900/60 p-4 border border-slate-800 rounded-2xl">
                      <label htmlFor="selectedServiceId" className="text-slate-300 font-bold block">
                        Select Service Listing <span className="text-rose-400">*</span>
                      </label>
                      {ownedServices.length > 0 ? (
                        <select
                          id="selectedServiceId"
                          value={selectedServiceId}
                          onChange={e => setSelectedServiceId(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 min-h-[44px] text-sm text-white focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none transition-colors"
                        >
                          {ownedServices.map(s => (
                            <option key={s.serviceId || s.id} value={s.serviceId || s.id}>
                              {s.title} ({s.startingPrice || 0} Pi)
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>No services found. Create service listings first in the Services tab.</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Campaign Title */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="newCampaignTitle" className="text-slate-300 font-bold block">
                        Campaign Headline Title <span className="text-rose-400">*</span>
                      </label>
                      <span className="text-[11px] text-slate-500">{newCampaignTitle.length}/60</span>
                    </div>
                    <input
                      id="newCampaignTitle"
                      type="text"
                      maxLength={60}
                      required
                      placeholder="e.g. Summer Super Flash Sale — 20% Off All Electronics"
                      value={newCampaignTitle}
                      onChange={e => setNewCampaignTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 min-h-[44px] text-sm text-white placeholder-slate-600 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none transition-colors"
                    />
                  </div>

                  {/* Tagline / Description */}
                  <div className="space-y-1.5">
                    <label htmlFor="newCampaignDescription" className="text-slate-300 font-bold block">
                      Promotional Description / Subtitle
                    </label>
                    <input
                      id="newCampaignDescription"
                      type="text"
                      maxLength={140}
                      placeholder="e.g. Instant Pi Escrow checkout with 100% consensus pricing on top verified brands."
                      value={newCampaignDescription}
                      onChange={e => setNewCampaignDescription(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 min-h-[44px] text-sm text-white placeholder-slate-600 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none transition-colors"
                    />
                  </div>

                  {/* Tier & Duration Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="newCampaignTier" className="text-slate-300 font-bold block">
                        Ad Placement Tier
                      </label>
                      <select
                        id="newCampaignTier"
                        value={newCampaignTier}
                        onChange={e => setNewCampaignTier(e.target.value as AdPricingTier)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 min-h-[44px] text-xs text-white focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none transition-colors"
                      >
                        <option value="standard_banner">Standard Banner ({rates.standard_banner} Pi/day)</option>
                        <option value="flash_sale_banner">Flash Sale Slider ({rates.flash_sale_banner} Pi/day)</option>
                        <option value="featured_store">Featured Store Spotlight ({rates.featured_store} Pi/day)</option>
                        <option value="sponsored_ad">Sponsored Hero Ad ({rates.sponsored_ad} Pi/day)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="durationDays" className="text-slate-300 font-bold block">
                        Campaign Duration
                      </label>
                      <select
                        id="durationDays"
                        value={durationDays}
                        onChange={e => setDurationDays(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 min-h-[44px] text-xs text-white focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none transition-colors"
                      >
                        <option value={1}>1 Day (Pilot run)</option>
                        <option value={3}>3 Days (Weekend burst)</option>
                        <option value={7}>7 Days (Recommended standard)</option>
                        <option value={14}>14 Days (Bi-weekly push)</option>
                        <option value={30}>30 Days (Monthly dominance)</option>
                      </select>
                    </div>
                  </div>

                  {/* Badge Text & CTA Button Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="newCampaignBadge" className="text-slate-300 font-bold block">
                        Offer Badge Text
                      </label>
                      <input
                        id="newCampaignBadge"
                        type="text"
                        placeholder="e.g. FLASH SALE - 20% OFF"
                        value={newCampaignBadge}
                        onChange={e => setNewCampaignBadge(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 min-h-[44px] text-xs text-white placeholder-slate-600 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="newCampaignCta" className="text-slate-300 font-bold block">
                        Call-To-Action (CTA)
                      </label>
                      <select
                        id="newCampaignCta"
                        value={newCampaignCta}
                        onChange={e => setNewCampaignCta(e.target.value as CtaType)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 min-h-[44px] text-xs text-white focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none transition-colors"
                      >
                        <option value="shop_now">Shop Now</option>
                        <option value="visit_store">Visit Store</option>
                        <option value="book_service">Book Service</option>
                        <option value="learn_more">Learn More</option>
                      </select>
                    </div>
                  </div>

                  {/* Banner Image Selection (File Upload + URL) */}
                  <div className="space-y-2">
                    <label htmlFor="newCampaignImage" className="text-slate-300 font-bold block">
                      Banner Artwork Image (Upload file or enter URL)
                    </label>
                    <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                      <input
                        id="newCampaignImage"
                        type="text"
                        value={newCampaignImage}
                        onChange={e => setNewCampaignImage(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 min-h-[44px] text-xs text-white font-mono placeholder-slate-600 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none transition-colors"
                      />
                      
                      <input
                        ref={bannerFileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        onChange={handleBannerUpload}
                        className="hidden"
                        id="bannerFileUpload"
                        aria-label="Upload banner image"
                        disabled={isUploadingBanner}
                      />

                      <button
                        type="button"
                        onClick={() => bannerFileInputRef.current?.click()}
                        disabled={isUploadingBanner}
                        className="px-4 py-2.5 min-h-[44px] bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none disabled:opacity-50"
                      >
                        {isUploadingBanner ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span>Upload Image</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Recommended aspect ratio: 2:1 or 16:9 • Formats: JPG, PNG, WEBP • Max 5MB
                    </p>
                  </div>

                  {/* Destination Route */}
                  <div className="space-y-1.5">
                    <label htmlFor="newCampaignRoute" className="text-slate-300 font-bold block">
                      Target Destination Route on Pi Business Market
                    </label>
                    <input
                      id="newCampaignRoute"
                      type="text"
                      value={newCampaignRoute}
                      onChange={e => setNewCampaignRoute(e.target.value)}
                      placeholder="/marketplace or /store/... or /product/..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 min-h-[44px] text-xs text-white font-mono placeholder-slate-600 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none transition-colors"
                    />
                  </div>

                </div>

                {/* Right Side: Live Banner Preview & Checkout Card (5 cols) */}
                <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                  
                  {/* Live Banner Preview Box */}
                  <div className="space-y-2">
                    <span className="text-slate-400 font-bold text-xs flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-violet-400" /> Live Marketplace Banner Preview
                    </span>
                    
                    <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 p-5 min-h-[260px] flex flex-col justify-between shadow-2xl">
                      {/* Background Image Layer */}
                      {newCampaignImage && (
                        <div className="absolute inset-0 z-0">
                          <img 
                            src={newCampaignImage} 
                            alt="Preview" 
                            className="w-full h-full object-cover opacity-30" 
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
                        </div>
                      )}

                      {/* Banner Content */}
                      <div className="relative z-10 space-y-2.5 max-w-sm">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2.5 py-0.5 bg-violet-600 text-white font-black text-[10px] rounded-md uppercase tracking-wider shadow">
                            {newCampaignBadge || 'SPECIAL OFFER'}
                          </span>
                          <span className="px-2 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold text-[9px] rounded uppercase">
                            {newCampaignTier.replace('_', ' ')}
                          </span>
                        </div>

                        <h2 className="text-lg sm:text-xl font-black text-white leading-tight line-clamp-2">
                          {newCampaignTitle || 'Your Banner Title Here'}
                        </h2>

                        <p className="text-xs text-slate-300 line-clamp-2">
                          {newCampaignDescription || 'Your short promotional description will appear here on the marketplace home slider.'}
                        </p>
                      </div>

                      <div className="relative z-10 pt-3 flex flex-wrap items-center gap-3">
                        <span className="px-4 py-2 bg-amber-400 text-slate-950 font-black text-xs rounded-xl uppercase tracking-wider inline-flex items-center gap-1.5 shadow-md">
                          <span>{newCampaignCta.replace('_', ' ')}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono truncate max-w-[160px]">
                          Target: {newCampaignRoute}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pi Payment Checkout Box */}
                  <div className="p-5 bg-slate-900 border border-violet-500/30 rounded-2xl space-y-4 shadow-xl">
                    <div className="border-b border-slate-800 pb-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Budget Breakdown</span>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-xs text-slate-300">
                          {rates[newCampaignTier] || 5} Pi/day × {durationDays} days
                        </span>
                        <span className="text-2xl font-black text-amber-400 font-mono">
                          {calculateCost()} π
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleLaunchAndPayCampaign}
                      disabled={
                        loading || 
                        paymentInProgress !== null ||
                        !newCampaignTitle.trim() ||
                        (newCampaignType === 'featured_store' && ownedStores.length === 0) ||
                        (newCampaignType === 'featured_product' && ownedProducts.length === 0) ||
                        (newCampaignType === 'featured_service' && ownedServices.length === 0)
                      }
                      className="w-full py-3.5 min-h-[44px] bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-black uppercase text-xs transition-all shadow-lg shadow-violet-600/25 flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none disabled:opacity-50 active:scale-98"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                          <span>Processing Pi Payment...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 text-amber-300" />
                          <span>Pay {calculateCost()} Pi & Deploy Ad</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" /> Official Pi SDK Escrow
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowCreateForm(false)}
                        className="text-slate-400 hover:text-white underline cursor-pointer p-1 min-h-[44px] flex items-center"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* SEARCH, FILTER & SORT CONTROLS */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              
              {/* Search input */}
              <div className="sm:col-span-4 relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search campaigns by title, description, or target..."
                  value={campaignSearch}
                  onChange={e => setCampaignSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-9 py-2.5 min-h-[44px] text-xs text-white placeholder-slate-500 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none transition-colors"
                />
                {campaignSearch && (
                  <button
                    onClick={() => setCampaignSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-md"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="sm:col-span-3">
                <select
                  value={campaignStatusFilter}
                  onChange={e => setCampaignStatusFilter(e.target.value)}
                  aria-label="Filter by campaign status"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 min-h-[44px] text-xs text-white focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none transition-colors"
                >
                  <option value="all">All Statuses ({campaigns.length})</option>
                  <option value="active">Active Only</option>
                  <option value="pending">Pending Approval</option>
                  <option value="paused">Paused</option>
                  <option value="rejected">Rejected</option>
                  <option value="expired">Archived / Expired</option>
                </select>
              </div>

              {/* Type Filter */}
              <div className="sm:col-span-3">
                <select
                  value={campaignTypeFilter}
                  onChange={e => setCampaignTypeFilter(e.target.value)}
                  aria-label="Filter by campaign type"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 min-h-[44px] text-xs text-white focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none transition-colors"
                >
                  <option value="all">All Placement Types</option>
                  <option value="flash_sale">Flash Sale</option>
                  <option value="sponsored_ad">Sponsored Banner</option>
                  <option value="featured_store">Featured Store</option>
                  <option value="featured_product">Featured Product</option>
                  <option value="featured_service">Featured Service</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="sm:col-span-2">
                <select
                  value={campaignSortBy}
                  onChange={e => setCampaignSortBy(e.target.value as any)}
                  aria-label="Sort campaigns"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 min-h-[44px] text-xs text-white focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none transition-colors"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="impressions">Most Impressions</option>
                  <option value="clicks">Most Clicks</option>
                  <option value="ctr">Highest CTR</option>
                  <option value="budget">Highest Budget</option>
                </select>
              </div>

            </div>

            {/* Active Filters indicator */}
            {(campaignSearch || campaignStatusFilter !== 'all' || campaignTypeFilter !== 'all') && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
                <span className="text-slate-400">
                  Showing <strong className="text-white">{filteredCampaigns.length}</strong> of {campaigns.length} campaigns
                </span>
                <button
                  onClick={() => {
                    setCampaignSearch('');
                    setCampaignStatusFilter('all');
                    setCampaignTypeFilter('all');
                  }}
                  className="text-violet-400 hover:text-violet-300 font-semibold underline cursor-pointer p-1"
                >
                  Reset all filters
                </button>
              </div>
            )}
          </div>

          {/* CAMPAIGN RECORDS LIST */}
          <div className="space-y-4">
            {filteredCampaigns.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCampaigns.map(camp => (
                  <div 
                    key={camp.id} 
                    className={`bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg transition-all hover:border-slate-700 flex flex-col justify-between ${
                      camp.status === 'expired' ? 'opacity-65 grayscale' : ''
                    }`}
                  >
                    {/* Header Row: Status, Tier & Quick Actions */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* Status Badge */}
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase inline-flex items-center gap-1.5 ${
                            camp.status === 'active' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 
                            camp.status === 'paused' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                            camp.status === 'pending' ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30' :
                            camp.status === 'rejected' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                            'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                            {camp.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                            {camp.status === 'paused' && <Pause className="w-2.5 h-2.5" />}
                            {camp.status === 'pending' && <Clock className="w-2.5 h-2.5" />}
                            {camp.status === 'rejected' && <AlertCircle className="w-2.5 h-2.5" />}
                            <span>Status: {camp.status}</span>
                          </span>

                          {/* Payment Badge */}
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${
                            camp.paymentStatus === 'verified' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' :
                            camp.paymentStatus === 'pending_payment' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            Payment: {camp.paymentStatus || 'unpaid'}
                          </span>

                          {/* Ad Tier Badge */}
                          {camp.adPricingTier && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 border border-slate-800 text-[9px] font-mono capitalize">
                              {camp.adPricingTier.replace('_', ' ')}
                            </span>
                          )}
                        </div>

                        {/* Top Actions: Share & Preview */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setPreviewModalCampaign(camp)}
                            title="Preview Banner"
                            aria-label="Preview Banner"
                            className="p-2 min-h-[44px] min-w-[44px] bg-slate-900 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors flex items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button 
                            onClick={() => shareCampaignLink(camp)}
                            title="Share Campaign Link"
                            aria-label="Share Campaign Link"
                            className="p-2 min-h-[44px] min-w-[44px] bg-slate-900 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors flex items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                          >
                            {copiedLinkCampaignId === camp.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Main Title & Banner Thumbnail */}
                      <div className="flex items-start gap-3">
                        {camp.bannerImage && (
                          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shrink-0">
                            <img 
                              src={camp.bannerImage} 
                              alt={camp.campaignTitle}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            {camp.offerBadge && (
                              <span className="absolute bottom-0 inset-x-0 bg-violet-950/90 text-violet-300 font-bold text-[8px] px-1 py-0.5 text-center truncate">
                                {camp.offerBadge}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm sm:text-base font-bold text-white leading-tight truncate">
                            {camp.campaignTitle}
                          </h4>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                            {camp.shortDescription || `${camp.campaignType.replace('_', ' ')} promotion`}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-slate-500">
                            <span className="font-mono">Route: <span className="text-slate-400">{camp.targetRoute}</span></span>
                            {camp.storeName && <span>• Outlet: <span className="text-slate-300 font-medium">{camp.storeName}</span></span>}
                          </div>
                        </div>
                      </div>

                      {/* Rejection Alert */}
                      {camp.status === 'rejected' && (
                        <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl space-y-1 text-xs">
                          <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>Campaign Rejected by Super Admin</span>
                          </div>
                          <p className="text-slate-300 text-[11px] pl-5">
                            Reason: {camp.rejectionReason || 'Did not meet platform advertising guidelines.'}
                          </p>
                        </div>
                      )}

                      {/* TxID & Budget details */}
                      <div className="p-2.5 bg-slate-900/80 border border-slate-800/80 rounded-xl text-[11px] font-mono flex flex-wrap items-center justify-between gap-2 text-slate-400">
                        <span>Pi TxID: <span className="text-amber-300 font-semibold">{camp.paymentTxId ? `${camp.paymentTxId.slice(0, 16)}...` : 'Pending'}</span></span>
                        <span>Budget: <span className="text-emerald-400 font-bold">{camp.budgetPi || camp.paymentAmountPi || 0} Pi</span></span>
                      </div>
                    </div>

                    {/* Bottom Row: Metrics & Actions */}
                    <div className="space-y-3 pt-3 border-t border-slate-800/60">
                      {/* Performance Grid */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800/40">
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">Impressions</span>
                          <span className="text-xs font-mono text-white font-bold">{camp.impressions || 0}</span>
                        </div>
                        <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800/40">
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">Clicks</span>
                          <span className="text-xs font-mono text-white font-bold">{camp.clicks || 0}</span>
                        </div>
                        <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800/40">
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">CTR</span>
                          <span className="text-xs font-mono text-emerald-400 font-bold">{camp.ctr || 0}%</span>
                        </div>
                      </div>

                      {/* Operational Action Buttons */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-1.5">
                          {camp.status !== 'expired' && (
                            <button 
                              onClick={() => toggleCampaign(camp.id, camp.status)}
                              disabled={actionLoading === camp.id}
                              title={camp.status === 'active' ? "Pause Campaign" : "Resume Campaign"}
                              aria-label={camp.status === 'active' ? "Pause Campaign" : "Resume Campaign"}
                              className="px-3 py-2 min-h-[44px] bg-slate-900 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none disabled:opacity-50"
                            >
                              {camp.status === 'active' ? (
                                <>
                                  <Pause className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Pause</span>
                                </>
                              ) : (
                                <>
                                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Resume</span>
                                </>
                              )}
                            </button>
                          )}

                          <button 
                            onClick={() => duplicateCampaign(camp)}
                            disabled={actionLoading === camp.id}
                            title="Duplicate Campaign"
                            aria-label="Duplicate Campaign"
                            className="px-3 py-2 min-h-[44px] bg-slate-900 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none disabled:opacity-50"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </button>
                        </div>

                        {camp.status !== 'expired' && (
                          <button 
                            onClick={() => deleteCampaign(camp.id, camp.campaignTitle)}
                            disabled={actionLoading === camp.id}
                            title="Archive Campaign"
                            aria-label="Archive Campaign"
                            className="px-3 py-2 min-h-[44px] bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none disabled:opacity-50"
                          >
                            <Archive className="w-3.5 h-3.5" />
                            <span>Archive</span>
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              /* EMPTY STATE */
              <div className="p-8 sm:p-12 bg-slate-950 border border-slate-800 rounded-3xl text-center space-y-4">
                <div className="w-14 h-14 bg-violet-600/10 text-violet-400 rounded-2xl border border-violet-500/20 flex items-center justify-center mx-auto">
                  <Flame className="w-7 h-7" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h4 className="text-base font-bold text-white">
                    {campaignSearch || campaignStatusFilter !== 'all' ? 'No campaigns match your search filters' : 'No promotional campaigns created yet'}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {campaignSearch || campaignStatusFilter !== 'all' 
                      ? 'Try adjusting your search keywords or resetting your status filters.'
                      : 'Launch your first paid banner ad campaign to feature your products and stores on the marketplace homepage.'}
                  </p>
                </div>
                <div className="pt-2">
                  {campaignSearch || campaignStatusFilter !== 'all' ? (
                    <button
                      onClick={() => {
                        setCampaignSearch('');
                        setCampaignStatusFilter('all');
                        setCampaignTypeFilter('all');
                      }}
                      className="px-5 py-2.5 min-h-[44px] bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="px-6 py-2.5 min-h-[44px] bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-violet-600/20 cursor-pointer"
                    >
                      Create First Ad Campaign
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: COUPONS & DISCOUNTS */}
      {/* ========================================================================= */}
      {activeTab === 'coupons' && (
        <div className="space-y-6">
          
          {/* Action Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-400" /> Discount Coupons Manager
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Issue discount vouchers and promotion codes applied at checkout.
              </p>
            </div>

            <button
              onClick={() => setShowCreateCouponForm(!showCreateCouponForm)}
              className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition-all shadow-md shadow-violet-600/20 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>{showCreateCouponForm ? 'Close Form' : 'New Coupon'}</span>
            </button>
          </div>

          {/* CREATE COUPON FORM */}
          {showCreateCouponForm && (
            <form onSubmit={handleCreateCoupon} className="p-5 sm:p-6 bg-slate-950 border border-slate-800 rounded-3xl space-y-4 animate-fade-in shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" /> Configure New Discount Coupon
                </h4>
                <button 
                  type="button" 
                  onClick={generateRandomCouponCode} 
                  className="text-violet-400 hover:text-violet-300 text-xs font-semibold underline p-1 cursor-pointer min-h-[44px] flex items-center"
                >
                  Generate Code
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 text-xs">
                
                {/* Coupon Code */}
                <div className="lg:col-span-2 space-y-1.5">
                  <label htmlFor="couponCode" className="text-slate-300 font-bold block">
                    Coupon Code <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="couponCode"
                    type="text"
                    required
                    placeholder="e.g. PI2026"
                    value={newCode}
                    onChange={e => setNewCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 min-h-[44px] text-sm text-white font-mono uppercase focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none transition-colors"
                  />
                </div>

                {/* Class */}
                <div className="lg:col-span-2 space-y-1.5">
                  <label htmlFor="couponClass" className="text-slate-300 font-bold block">
                    Applicability Class
                  </label>
                  <select
                    id="couponClass"
                    value={couponClass}
                    onChange={e => setCouponClass(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 min-h-[44px] text-xs text-white focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none transition-colors"
                  >
                    <option value="business">Business Wide</option>
                    <option value="store">Specific Store</option>
                    <option value="festival">Festival Deal</option>
                    <option value="referral">Referral Code</option>
                    <option value="first_purchase">First Purchase</option>
                  </select>
                </div>

                {/* Type */}
                <div className="lg:col-span-2 space-y-1.5">
                  <label htmlFor="discountType" className="text-slate-300 font-bold block">
                    Discount Type
                  </label>
                  <select
                    id="discountType"
                    value={discountType}
                    onChange={e => setDiscountType(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 min-h-[44px] text-xs text-white focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none transition-colors"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed_pi">Fixed Pi Amount</option>
                    <option value="free_shipping">Free Shipping</option>
                  </select>
                </div>

                {/* Value */}
                <div className="lg:col-span-2 space-y-1.5">
                  <label htmlFor="discountValue" className="text-slate-300 font-bold block">
                    Discount Value {discountType === 'percentage' ? '(%)' : '(Pi)'}
                  </label>
                  <input
                    id="discountValue"
                    type="number"
                    min={1}
                    value={discountValue}
                    onChange={e => setDiscountValue(Number(e.target.value))}
                    disabled={discountType === 'free_shipping'}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 min-h-[44px] text-sm text-white font-mono focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none transition-colors disabled:opacity-50"
                  />
                </div>

                {/* Min Order */}
                <div className="lg:col-span-2 space-y-1.5">
                  <label htmlFor="minOrder" className="text-slate-300 font-bold block">
                    Minimum Order (Pi)
                  </label>
                  <input
                    id="minOrder"
                    type="number"
                    min={0}
                    value={minOrder}
                    onChange={e => setMinOrder(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 min-h-[44px] text-sm text-white font-mono focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none transition-colors"
                  />
                </div>

                {/* Max Uses */}
                <div className="lg:col-span-2 space-y-1.5">
                  <label htmlFor="maxUses" className="text-slate-300 font-bold block">
                    Max Redemptions
                  </label>
                  <input
                    id="maxUses"
                    type="number"
                    min={1}
                    value={maxUses}
                    onChange={e => setMaxUses(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 min-h-[44px] text-sm text-white font-mono focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none transition-colors"
                  />
                </div>

                {/* Submit button */}
                <div className="lg:col-span-6 flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateCouponForm(false)}
                    className="px-5 py-2.5 min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading === 'create_coupon'}
                    className="px-6 py-2.5 min-h-[44px] bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-violet-600/20 cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading === 'create_coupon' ? 'Publishing...' : 'Publish Coupon'}
                  </button>
                </div>

              </div>
            </form>
          )}

          {/* Coupon Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div className="sm:col-span-6 relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search coupons by code or class..."
                value={couponSearch}
                onChange={e => setCouponSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 min-h-[44px] text-xs text-white placeholder-slate-500 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none transition-colors"
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={couponStatusFilter}
                onChange={e => setCouponStatusFilter(e.target.value)}
                aria-label="Filter coupons by active state"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 min-h-[44px] text-xs text-white focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none transition-colors"
              >
                <option value="all">All States</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <select
                value={couponTypeFilter}
                onChange={e => setCouponTypeFilter(e.target.value)}
                aria-label="Filter coupons by discount type"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 min-h-[44px] text-xs text-white focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none transition-colors"
              >
                <option value="all">All Discount Types</option>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed_pi">Fixed Pi Amount</option>
                <option value="free_shipping">Free Shipping</option>
              </select>
            </div>
          </div>

          {/* ACTIVE COUPONS LIST */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCoupons.length > 0 ? (
              filteredCoupons.map(c => (
                <div 
                  key={c.couponId} 
                  className={`p-4 sm:p-5 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-4 shadow-lg transition-all hover:border-slate-700 ${
                    !c.active ? 'opacity-60 grayscale' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-3 py-1 bg-violet-950 text-violet-300 font-mono font-black border border-violet-800/60 rounded-lg text-sm tracking-wider">
                          {c.code}
                        </span>
                        <span className="text-emerald-400 font-mono font-black text-sm">
                          {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : 
                           c.discountType === 'fixed_pi' ? `-${c.discountValue} Pi` : 'FREE SHIPPING'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 capitalize">
                        {c.couponClass?.replace('_', ' ')} • Min Order: <span className="text-white font-mono">{c.minOrderValue} Pi</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button 
                        onClick={() => copyCouponCode(c.code, c.couponId)}
                        title="Copy Coupon Code"
                        aria-label="Copy Coupon Code"
                        className="p-2 min-h-[44px] min-w-[44px] bg-slate-900 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors flex items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                      >
                        {copiedCouponId === c.couponId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => deleteCoupon(c.couponId, c.code)}
                        title="Delete Coupon"
                        aria-label="Delete Coupon"
                        className="p-2 min-h-[44px] min-w-[44px] bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl transition-colors flex items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Usage Progress & Active Toggle */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 gap-4">
                        <span>Redemptions</span>
                        <span className="font-mono font-bold text-white">{c.usedCount} / {c.maxUses}</span>
                      </div>
                      <div className="w-32 bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-violet-500 h-full rounded-full" 
                          style={{ width: `${Math.min(100, ((c.usedCount || 0) / (c.maxUses || 1)) * 100)}%` }} 
                        />
                      </div>
                    </div>

                    <button 
                      onClick={() => toggleCoupon(c.couponId, c.active, c.code)}
                      disabled={actionLoading === c.couponId}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all min-h-[44px] flex items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none ${
                        c.active 
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25' 
                          : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {c.active ? 'Active Status' : 'Inactive Status'}
                    </button>
                  </div>

                </div>
              ))
            ) : (
              <div className="p-8 bg-slate-950 border border-slate-800 rounded-2xl text-center col-span-2 space-y-3">
                <Tag className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">No coupons matching your criteria</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">Create a promotional code to give customers percentage discounts or free shipping.</p>
                <button
                  onClick={() => setShowCreateCouponForm(true)}
                  className="px-5 py-2.5 min-h-[44px] bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Create Discount Coupon
                </button>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PERFORMANCE ANALYTICS */}
      {/* ========================================================================= */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-1 shadow-lg">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Gross Impressions</span>
                <Eye className="w-4 h-4 text-violet-400" />
              </div>
              <span className="text-2xl sm:text-3xl font-black text-white block">{totalImpressions.toLocaleString()}</span>
              <span className="text-[11px] text-slate-500">Across all active & archived campaigns</span>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-1 shadow-lg">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Direct Ad Clicks</span>
                <TrendingUp className="w-4 h-4 text-sky-400" />
              </div>
              <span className="text-2xl sm:text-3xl font-black text-white block">{totalClicks.toLocaleString()}</span>
              <span className="text-[11px] text-slate-500">Buyer redirects to store/product routes</span>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-1 shadow-lg">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Average CTR</span>
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 block">{totalCtr.toFixed(2)}%</span>
              <span className="text-[11px] text-slate-500">Click-through conversion efficiency</span>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-1 shadow-lg">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Total Pi Deployed</span>
                <DollarSign className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-2xl sm:text-3xl font-black text-amber-400 block font-mono">{totalBudgetDeployed} π</span>
              <span className="text-[11px] text-slate-500">Total advertising investment</span>
            </div>
          </div>

          {/* Efficiency Table */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-violet-400" /> Campaign Performance Breakdown
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                    <th className="py-3 px-4">Campaign Title</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Impressions</th>
                    <th className="py-3 px-4 text-right">Clicks</th>
                    <th className="py-3 px-4 text-right">CTR (%)</th>
                    <th className="py-3 px-4 text-right">Budget (Pi)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {campaigns.length > 0 ? (
                    campaigns.map(camp => (
                      <tr key={camp.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white max-w-[200px] truncate">
                          {camp.campaignTitle}
                        </td>
                        <td className="py-3.5 px-4 capitalize text-slate-400">
                          {camp.campaignType.replace('_', ' ')}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${
                            camp.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                            camp.status === 'paused' ? 'bg-amber-500/10 text-amber-400' :
                            camp.status === 'pending' ? 'bg-sky-500/10 text-sky-400' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {camp.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                          {camp.impressions || 0}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                          {camp.clicks || 0}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                          {camp.ctr || 0}%
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-amber-300 font-bold">
                          {camp.budgetPi || 0} π
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No campaign performance records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PLACEMENT GUIDELINES & AD PRICING */}
      {/* ========================================================================= */}
      {activeTab === 'guidelines' && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Standard Banner */}
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-lg text-xs font-bold uppercase">
                  Standard Banner
                </span>
                <span className="text-sm font-black text-amber-400 font-mono">{rates.standard_banner} Pi / day</span>
              </div>
              <h4 className="text-sm font-bold text-white">Homepage & Category Carousel</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Appears in standard rotation on the Buyer Home banner slider and category browsing views. Ideal for ongoing seasonal promotions.
              </p>
              <ul className="text-[11px] text-slate-500 space-y-1">
                <li>• Recommended Size: 1200 × 600 px (2:1 Ratio)</li>
                <li>• Format: WebP, PNG, or high-quality JPG</li>
                <li>• Instant approval by Super Admin</li>
              </ul>
            </div>

            {/* Flash Sale Banner */}
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-bold uppercase">
                  Flash Sale Banner
                </span>
                <span className="text-sm font-black text-amber-400 font-mono">{rates.flash_sale_banner} Pi / day</span>
              </div>
              <h4 className="text-sm font-bold text-white">Top Priority Flash Deals Carousel</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pinned prominently in the Flash Deals section with high-contrast urgency badges and countdown timer indicators.
              </p>
              <ul className="text-[11px] text-slate-500 space-y-1">
                <li>• Recommended Size: 1200 × 600 px</li>
                <li>• Requires valid promotional discount (&gt;10%)</li>
                <li>• Top priority CTR placement</li>
              </ul>
            </div>

            {/* Featured Store Spotlight */}
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-bold uppercase">
                  Featured Store Spotlight
                </span>
                <span className="text-sm font-black text-amber-400 font-mono">{rates.featured_store} Pi / day</span>
              </div>
              <h4 className="text-sm font-bold text-white">Direct Store Outlet Discovery</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Positions your entire verified physical or digital store outlet on the curated "Verified Store Outlets" carousel.
              </p>
              <ul className="text-[11px] text-slate-500 space-y-1">
                <li>• Uses official store logo and banner image</li>
                <li>• Direct "Visit Store" routing</li>
                <li>• Ideal for driving brand loyalty</li>
              </ul>
            </div>

            {/* Sponsored Hero Ad */}
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-lg text-xs font-bold uppercase">
                  Sponsored Hero Ad
                </span>
                <span className="text-sm font-black text-amber-400 font-mono">{rates.sponsored_ad} Pi / day</span>
              </div>
              <h4 className="text-sm font-bold text-white">Full-Width Hero Section Integration</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Appears as high-impact sponsored cards across search results, checkout confirmation screens, and category discovery grids.
              </p>
              <ul className="text-[11px] text-slate-500 space-y-1">
                <li>• Maximum screen visibility</li>
                <li>• Flexible CTA buttons</li>
                <li>• Detailed conversion metrics</li>
              </ul>
            </div>

          </div>

          {/* Guidelines Box */}
          <div className="p-6 bg-slate-950 border border-slate-800 rounded-3xl space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-violet-400" /> Platform Advertising Compliance
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              All promotional campaigns submitted through the Enterprise Marketing Center must comply with the Pi Network Community Guidelines and Pi Business Market Standards. Advertisements for counterfeit goods, illegal services, deceptive claims, or unauthorized external crypto tokens are strictly prohibited and will be rejected by Super Admins without refund.
            </p>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* CAMPAIGN PREVIEW MODAL */}
      {/* ========================================================================= */}
      {previewModalCampaign && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-violet-400" />
                <h3 className="text-base font-bold text-white">Live Banner Ad Preview</h3>
              </div>
              <button
                onClick={() => setPreviewModalCampaign(null)}
                className="p-2 min-h-[44px] min-w-[44px] rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center"
                aria-label="Close Preview Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* The Live Banner Simulation */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 p-6 min-h-[280px] flex flex-col justify-between shadow-2xl">
              {previewModalCampaign.bannerImage && (
                <div className="absolute inset-0 z-0">
                  <img 
                    src={previewModalCampaign.bannerImage} 
                    alt={previewModalCampaign.campaignTitle} 
                    className="w-full h-full object-cover opacity-35" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
                </div>
              )}

              <div className="relative z-10 space-y-3 max-w-md">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 bg-violet-600 text-white font-black text-[10px] rounded-md uppercase tracking-wider shadow">
                    {previewModalCampaign.offerBadge || 'SPECIAL OFFER'}
                  </span>
                  <span className="px-2 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold text-[9px] rounded uppercase">
                    {previewModalCampaign.campaignType.replace('_', ' ')}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  {previewModalCampaign.campaignTitle}
                </h2>

                <p className="text-xs text-slate-300 line-clamp-3">
                  {previewModalCampaign.shortDescription}
                </p>
              </div>

              <div className="relative z-10 pt-4 flex flex-wrap items-center gap-3">
                <span className="px-5 py-2.5 bg-amber-400 text-slate-950 font-black text-xs rounded-xl uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                  <span>{previewModalCampaign.ctaType?.replace('_', ' ') || 'Shop Now'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Destination: {previewModalCampaign.targetRoute}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setPreviewModalCampaign(null)}
                className="px-6 py-2.5 min-h-[44px] bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
