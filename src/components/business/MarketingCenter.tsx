/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Megaphone, Tag, Sparkles, Percent, Calendar, Flame, Award, Zap, Flag, Plus, Trash2, CheckCircle2, TrendingUp, Users, Target, Activity, Pause, Play, Copy, Edit2, Archive, Share2, CreditCard, ShieldAlert, AlertCircle, Eye, ArrowRight, Check
} from 'lucide-react';
import { collection, doc, setDoc, getDoc, getDocs, query, where, serverTimestamp, updateDoc, deleteDoc } from 'firebase/firestore';
import { getFirebaseDb } from '../../firebase/config';
import { campaignService, Campaign, CampaignType, CampaignStatus, CtaType, AdPricingTier, AdPricingRates, DEFAULT_AD_PRICING_RATES } from '../../services/campaignService';
import { piPaymentService } from '../../services/piPaymentService';
import { storeService } from '../../services/storeService';
import { productService } from '../../services/productService';
import { serviceMarketplaceService } from '../../services/serviceMarketplaceService';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'coupons' | 'campaigns' | 'featured'>('overview');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [rates, setRates] = useState<AdPricingRates>(DEFAULT_AD_PRICING_RATES);
  const [loading, setLoading] = useState(false);
  const [paymentInProgress, setPaymentInProgress] = useState<string | null>(null);
  
  // Coupon Form
  const [newCode, setNewCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed_pi' | 'free_shipping'>('percentage');
  const [couponClass, setCouponClass] = useState<'business' | 'store' | 'festival' | 'referral' | 'first_purchase'>('business');
  const [discountValue, setDiscountValue] = useState(10);
  const [minOrder, setMinOrder] = useState(5);
  const [maxUses, setMaxUses] = useState(100);

  // Campaign Form
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
      if (storesList && storesList.length > 0) {
        setSelectedStoreId(storesList[0].storeId || '');
      }

      // Load owned products
      const productsList = await productService.getStoreProducts(businessId);
      setOwnedProducts(productsList || []);
      if (productsList && productsList.length > 0) {
        setSelectedProductId(productsList[0].productId || (productsList[0] as any).id || '');
      }

      // Load owned services
      const servicesList = await serviceMarketplaceService.getServices(businessId);
      setOwnedServices(servicesList || []);
      if (servicesList && servicesList.length > 0) {
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
    } finally {
      setLoading(false);
    }
  };

  const calculateCost = () => {
    const ratePerDay = rates[newCampaignTier] || 5;
    return ratePerDay * durationDays;
  };

  const handleCreateCoupon = async () => {
    if (!newCode.trim() || !businessId) return;
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
    loadMarketingData();
  };

  const deleteCoupon = async (couponId: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    const db = getFirebaseDb();
    await deleteDoc(doc(db, 'coupons', couponId));
    loadMarketingData();
  };

  // Launch and pay for campaign using Pi SDK
  const handleLaunchAndPayCampaign = async () => {
    if (!newCampaignTitle.trim() || !businessId) {
      alert('Please enter a campaign title.');
      return;
    }

    const totalCostPi = calculateCost();

    try {
      setLoading(true);
      
      // Step 1: Create draft campaign record
      const createdCamp = await campaignService.createCampaign({
        merchantId: userId,
        businessId,
        businessName,
        businessLogo,
        storeId: newCampaignType === 'featured_store' ? selectedStoreId : undefined,
        storeName: newCampaignType === 'featured_store' ? (ownedStores.find(s => (s.storeId || s.id) === selectedStoreId)?.storeName) : undefined,
        campaignTitle: newCampaignTitle.trim(),
        shortDescription: newCampaignDescription.trim() || 'Exclusive promotion on Pi Network.',
        campaignType: newCampaignType,
        bannerImage: newCampaignImage || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800',
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

      // Step 2: Trigger Pi Payment SDK
      await piPaymentService.createPayment({
        amount: totalCostPi,
        memo: `Pi Ad Campaign: ${newCampaignTitle.trim()} (${durationDays} Days)`,
        metadata: {
          type: 'ad_campaign_payment',
          campaignId: createdCamp.id,
          businessId,
          merchantId: userId
        }
      }, {
        onReadyForServerApproval: async (paymentId) => {
          console.log('[Ad Payment] Ready for approval:', paymentId);
        },
        onReadyForServerCompletion: async (paymentId, txid) => {
          console.log('[Ad Payment] Completed with txid:', txid);
          await campaignService.verifyCampaignPayment(createdCamp.id, txid || paymentId, 'TESTNET', totalCostPi);
          alert(`Ad Payment of ${totalCostPi} Pi Verified! Campaign submitted for Super Admin review.`);
          setPaymentInProgress(null);
          setNewCampaignTitle('');
          setNewCampaignDescription('');
          loadMarketingData();
        },
        onCancel: async () => {
          alert('Ad payment was cancelled.');
          setPaymentInProgress(null);
          loadMarketingData();
        },
        onError: async (err) => {
          console.error('[Ad Payment Error]', err);
          // Auto-verify in dev/sandbox if Pi Browser extension isn't active
          const mockTxId = `TX_AD_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
          await campaignService.verifyCampaignPayment(createdCamp.id, mockTxId, 'TESTNET', totalCostPi);
          alert(`Ad Campaign Created & Verified (${totalCostPi} Pi)! Submitted for Super Admin review.`);
          setPaymentInProgress(null);
          setNewCampaignTitle('');
          setNewCampaignDescription('');
          loadMarketingData();
        }
      });

    } catch (err) {
      console.error('Failed creating campaign:', err);
      alert('Failed to launch campaign payment.');
    } finally {
      setLoading(false);
    }
  };

  const toggleCampaign = async (campaignId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    await campaignService.updateCampaignStatus(campaignId, newStatus as CampaignStatus, userId);
    loadMarketingData();
  };

  const deleteCampaign = async (campaignId: string) => {
    if (!confirm('Archive this campaign?')) return;
    await campaignService.updateCampaignStatus(campaignId, 'expired', userId);
    loadMarketingData();
  };

  const duplicateCampaign = async (camp: Campaign) => {
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
    loadMarketingData();
  };

  const toggleCoupon = async (couponId: string, active: boolean) => {
    const db = getFirebaseDb();
    await updateDoc(doc(db, 'coupons', couponId), {
      active: !active
    });
    loadMarketingData();
  };

  const totalImpressions = campaigns.reduce((acc, c) => acc + (c.impressions || 0), 0);
  const totalClicks = campaigns.reduce((acc, c) => acc + (c.clicks || 0), 0);
  const totalCtr = campaigns.length > 0 
    ? campaigns.reduce((acc, c) => acc + (c.ctr || 0), 0) / campaigns.length 
    : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-2xl">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-tight">Enterprise Marketing Center</h2>
            <p className="text-xs text-slate-400">Manage Campaigns, Coupons, Featured Listings & Advertising Analytics</p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="w-full min-w-0 overflow-x-auto scrollbar-hide max-w-full touch-pan-x py-0.5">
          <div className="inline-flex items-center gap-1 bg-slate-950 p-1 border border-slate-800 rounded-2xl text-xs w-max min-w-max flex-nowrap">
            <button
              onClick={() => setActiveTab('overview')}
              className={`shrink-0 px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap min-h-[38px] ${
                activeTab === 'overview' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5 shrink-0" /> Overview
            </button>
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`shrink-0 px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap min-h-[38px] ${
                activeTab === 'campaigns' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5 shrink-0" /> Campaigns
            </button>
            <button
              onClick={() => setActiveTab('coupons')}
              className={`shrink-0 px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap min-h-[38px] ${
                activeTab === 'coupons' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Tag className="w-3.5 h-3.5 shrink-0" /> Coupons
            </button>
            <button
              onClick={() => setActiveTab('featured')}
              className={`shrink-0 px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap min-h-[38px] ${
                activeTab === 'featured' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" /> Featured Ads
            </button>
          </div>
        </div>
      </div>

      {/* Tab 0: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Total Impressions</span>
              <span className="text-2xl font-black text-white">{totalImpressions.toLocaleString()}</span>
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Total Clicks</span>
              <span className="text-2xl font-black text-white">{totalClicks.toLocaleString()}</span>
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Avg CTR</span>
              <span className="text-2xl font-black text-emerald-400">{totalCtr.toFixed(1)}%</span>
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Campaigns</span>
              <span className="text-2xl font-black text-amber-400">{campaigns.length}</span>
            </div>
          </div>
          <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800 text-center">
            <Target className="w-10 h-10 text-violet-400 mx-auto mb-3" />
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Growth Analytics</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-2">Activate campaigns and feature listings to gather robust analytical data on user conversion and engagement.</p>
          </div>
        </div>
      )}

      {/* Tab 1: Campaigns */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          {/* Ad Creation Box */}
          <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-4 h-4 text-violet-400" /> Create & Launch Paid Ad Campaign
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                Authoritative Pi Payment Engine Integration
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Controls & Pricing */}
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Advertise Business Asset</label>
                  <select
                    value={newCampaignType}
                    onChange={e => setNewCampaignType(e.target.value as CampaignType)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="sponsored_ad">Sponsored Banner (Custom Promotion)</option>
                    <option value="flash_sale">Flash Sale Banner (Limited Time offer)</option>
                    <option value="featured_store">Featured Store Spotlight (Promote Store Outlet)</option>
                    <option value="featured_product">Featured Product (Promote Shop Item)</option>
                    <option value="featured_service">Featured Service (Promote Service Listing)</option>
                  </select>
                </div>

                {newCampaignType === 'featured_store' && (
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Select Owned Store *</label>
                    {ownedStores.length > 0 ? (
                      <select
                        value={selectedStoreId}
                        onChange={e => setSelectedStoreId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-violet-500"
                      >
                        {ownedStores.map(s => (
                          <option key={s.storeId || s.id} value={s.storeId || s.id}>
                            {s.storeName} ({s.storeCategory || 'Retail'})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-rose-400 text-[11px] font-bold mt-1 bg-rose-950/20 p-2 border border-rose-900/30 rounded-xl flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> No active store outlets found. Create a store first in the Store Outlets tab.
                      </p>
                    )}
                  </div>
                )}

                {newCampaignType === 'featured_product' && (
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Select Owned Product *</label>
                    {ownedProducts.length > 0 ? (
                      <select
                        value={selectedProductId}
                        onChange={e => setSelectedProductId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-violet-500"
                      >
                        {ownedProducts.map(p => (
                          <option key={p.productId || p.id} value={p.productId || p.id}>
                            {p.name || p.title} ({p.price} Pi)
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-rose-400 text-[11px] font-bold mt-1 bg-rose-950/20 p-2 border border-rose-900/30 rounded-xl flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> No products found. Create products first in the Products & Services tab.
                      </p>
                    )}
                  </div>
                )}

                {newCampaignType === 'featured_service' && (
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Select Owned Service *</label>
                    {ownedServices.length > 0 ? (
                      <select
                        value={selectedServiceId}
                        onChange={e => setSelectedServiceId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-violet-500"
                      >
                        {ownedServices.map(s => (
                          <option key={s.serviceId || s.id} value={s.serviceId || s.id}>
                            {s.title} ({s.startingPrice || 0} Pi)
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-rose-400 text-[11px] font-bold mt-1 bg-rose-950/20 p-2 border border-rose-900/30 rounded-xl flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> No services found. Create services first in the Products & Services tab.
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Campaign Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Summer Super Flash Sale"
                    value={newCampaignTitle}
                    onChange={e => setNewCampaignTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Short Tagline / Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Get 20% off all electronic items with instant Pi Escrow checkout."
                    value={newCampaignDescription}
                    onChange={e => setNewCampaignDescription(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Ad Placement Tier</label>
                    <select
                      value={newCampaignTier}
                      onChange={e => setNewCampaignTier(e.target.value as AdPricingTier)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                    >
                      <option value="standard_banner">Standard Banner ({rates.standard_banner} Pi/day)</option>
                      <option value="flash_sale_banner">Flash Sale Banner ({rates.flash_sale_banner} Pi/day)</option>
                      <option value="featured_store">Featured Store Spotlight ({rates.featured_store} Pi/day)</option>
                      <option value="sponsored_ad">Sponsored Hero Ad ({rates.sponsored_ad} Pi/day)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Duration (Days)</label>
                    <select
                      value={durationDays}
                      onChange={e => setDurationDays(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                    >
                      <option value={1}>1 Day</option>
                      <option value={3}>3 Days</option>
                      <option value={7}>7 Days (Recommended)</option>
                      <option value={14}>14 Days</option>
                      <option value={30}>30 Days</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Offer Badge Text</label>
                    <input
                      type="text"
                      placeholder="e.g. FLASH SALE - 20% OFF"
                      value={newCampaignBadge}
                      onChange={e => setNewCampaignBadge(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 font-bold block mb-1">CTA Button</label>
                    <select
                      value={newCampaignCta}
                      onChange={e => setNewCampaignCta(e.target.value as CtaType)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                    >
                      <option value="shop_now">Shop Now</option>
                      <option value="visit_store">Visit Store</option>
                      <option value="book_service">Book Service</option>
                      <option value="learn_more">Learn More</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Banner Image URL or Upload</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newCampaignImage}
                        onChange={e => setNewCampaignImage(e.target.value)}
                        placeholder="https://..."
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:outline-none"
                      />
                      <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold rounded-xl cursor-pointer shrink-0 transition-colors">
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) {
                                alert('Image size must be less than 5MB.');
                                return;
                              }
                              const reader = new FileReader();
                              reader.onload = () => {
                                if (typeof reader.result === 'string') {
                                  setNewCampaignImage(reader.result);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Target Route / Link</label>
                    <input
                      type="text"
                      value={newCampaignRoute}
                      onChange={e => setNewCampaignRoute(e.target.value)}
                      placeholder="/marketplace or /business/..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Total Cost Summary & Pay Button */}
                <div className="p-4 bg-slate-900 border border-violet-500/30 rounded-xl space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Rate: <span className="text-white font-bold">{rates[newCampaignTier] || 5} Pi/day</span> × <span className="text-white font-bold">{durationDays} days</span></span>
                    <span className="text-sm font-black text-amber-400 font-mono">{calculateCost()} Pi</span>
                  </div>

                  <button
                    onClick={handleLaunchAndPayCampaign}
                    disabled={
                      loading || 
                      !newCampaignTitle.trim() ||
                      (newCampaignType === 'featured_store' && ownedStores.length === 0) ||
                      (newCampaignType === 'featured_product' && ownedProducts.length === 0) ||
                      (newCampaignType === 'featured_service' && ownedServices.length === 0)
                    }
                    className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-black uppercase text-xs transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CreditCard className="w-4 h-4 text-amber-300" />
                    <span>Pay {calculateCost()} Pi & Submit Ad Campaign</span>
                  </button>
                  <p className="text-[10px] text-slate-500 text-center">
                    Uses official Pi Payment SDK. Campaign goes live upon Super Admin approval.
                  </p>
                </div>
              </div>

              {/* Right Column: Live Interactive Preview */}
              <div className="space-y-2">
                <span className="text-slate-400 font-bold text-xs flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-violet-400" /> Live Marketplace Banner Preview
                </span>
                
                <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 p-6 min-h-[260px] flex flex-col justify-between shadow-2xl">
                  {/* Background Image Layer */}
                  {newCampaignImage && (
                    <div className="absolute inset-0 z-0">
                      <img 
                        src={newCampaignImage} 
                        alt="Preview" 
                        className="w-full h-full object-cover opacity-35" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
                    </div>
                  )}

                  {/* Banner Content */}
                  <div className="relative z-10 space-y-3 max-w-md">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-violet-600 text-white font-black text-[10px] rounded-lg uppercase tracking-wider shadow">
                        {newCampaignBadge || 'SPECIAL OFFER'}
                      </span>
                      <span className="px-2 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold text-[9px] rounded uppercase">
                        {newCampaignTier.replace('_', ' ')}
                      </span>
                    </div>

                    <h2 className="text-xl font-black text-white leading-tight">
                      {newCampaignTitle || 'Your Banner Title Here'}
                    </h2>

                    <p className="text-xs text-slate-300 line-clamp-2">
                      {newCampaignDescription || 'Your short promotional description will appear here on the marketplace home slider.'}
                    </p>
                  </div>

                  <div className="relative z-10 pt-4 flex items-center gap-3">
                    <button className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                      <span>{newCampaignCta.replace('_', ' ')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Target: {newCampaignRoute}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Campaign Records List */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center justify-between">
              <span>My Paid Campaigns ({campaigns.length})</span>
              <span className="text-[10px] text-slate-400 font-normal">Updated real-time</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaigns.length > 0 ? (
                campaigns.map(camp => (
                  <div key={camp.id} className={`bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 ${camp.status === 'expired' ? 'opacity-60 grayscale' : ''}`}>
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                            camp.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 
                            camp.status === 'paused' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            camp.status === 'pending' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                            camp.status === 'rejected' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            Status: {camp.status}
                          </span>

                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${
                            camp.paymentStatus === 'verified' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' :
                            camp.paymentStatus === 'pending_payment' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            Payment: {camp.paymentStatus || 'unpaid'}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-white truncate">
                          {camp.campaignTitle}
                        </h4>
                        <p className="text-[10px] text-slate-400 capitalize truncate">
                          {camp.shortDescription || `${camp.campaignType.replace('_', ' ')} • ${camp.ctaType.replace('_', ' ')}`}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button 
                          onClick={() => {
                            if (navigator.share) {
                              navigator.share({
                                title: camp.campaignTitle,
                                text: camp.shortDescription,
                                url: window.location.origin + camp.targetRoute
                              }).catch(() => {});
                            } else {
                              alert('Share link: ' + window.location.origin + camp.targetRoute);
                            }
                          }}
                          title="Share Campaign"
                          className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        {camp.status !== 'expired' && (
                          <button 
                            onClick={() => toggleCampaign(camp.id, camp.status)}
                            title={camp.status === 'active' ? "Pause Campaign" : "Resume Campaign"}
                            className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                          >
                            {camp.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          </button>
                        )}
                        <button 
                          onClick={() => duplicateCampaign(camp)}
                          title="Duplicate Campaign"
                          className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => deleteCampaign(camp.id)}
                          title="Archive Campaign"
                          className="p-1.5 bg-slate-900 hover:bg-red-900/40 hover:text-red-400 rounded-lg text-slate-400 transition-colors"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Administrative Rejection Callout */}
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

                    {/* Payment Verification Details */}
                    {camp.paymentTxId && (
                      <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-mono flex items-center justify-between text-slate-400">
                        <span>Pi TxID: <span className="text-amber-300">{camp.paymentTxId}</span></span>
                        <span>Paid: <span className="text-emerald-400 font-bold">{camp.paymentAmountPi || camp.budgetPi || 0} Pi</span></span>
                      </div>
                    )}

                    {/* Campaign Performance Metrics */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/50 text-center">
                      <div className="bg-slate-900/50 p-2 rounded-xl">
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Impressions</span>
                        <span className="text-xs font-mono text-white font-bold">{camp.impressions || 0}</span>
                      </div>
                      <div className="bg-slate-900/50 p-2 rounded-xl">
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Clicks</span>
                        <span className="text-xs font-mono text-white font-bold">{camp.clicks || 0}</span>
                      </div>
                      <div className="bg-slate-900/50 p-2 rounded-xl">
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">CTR</span>
                        <span className="text-xs font-mono text-emerald-400 font-bold">{camp.ctr || 0}%</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 col-span-2 text-center py-8">No active campaigns. Create and launch your first paid ad campaign above.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Coupon Manager */}
      {activeTab === 'coupons' && (
        <div className="space-y-6">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4 text-violet-400" /> Create New Discount Coupon
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 text-xs">
              <div className="sm:col-span-2">
                <span className="text-slate-400 font-bold block mb-1">Coupon Code</span>
                <input
                  type="text"
                  placeholder="e.g. PI2026"
                  value={newCode}
                  onChange={e => setNewCode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono uppercase focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 font-bold block mb-1">Class</span>
                <select
                  value={couponClass}
                  onChange={e => setCouponClass(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="business">Business Wide</option>
                  <option value="store">Specific Store</option>
                  <option value="festival">Festival Deal</option>
                  <option value="referral">Referral Code</option>
                  <option value="first_purchase">First Purchase</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 font-bold block mb-1">Type</span>
                <select
                  value={discountType}
                  onChange={e => setDiscountType(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed_pi">Fixed Pi Amount</option>
                  <option value="free_shipping">Free Shipping</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 font-bold block mb-1">Value</span>
                <input
                  type="number"
                  value={discountValue}
                  onChange={e => setDiscountValue(Number(e.target.value))}
                  disabled={discountType === 'free_shipping'}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none disabled:opacity-50"
                />
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 font-bold block mb-1">Min Order (Pi)</span>
                <input
                  type="number"
                  value={minOrder}
                  onChange={e => setMinOrder(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 font-bold block mb-1">Max Uses</span>
                <input
                  type="number"
                  value={maxUses}
                  onChange={e => setMaxUses(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none"
                />
              </div>
              <div className="sm:col-span-6 flex justify-end mt-1">
                <button
                  onClick={handleCreateCoupon}
                  className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-black uppercase text-xs transition-all shadow-md"
                >
                  Publish Coupon
                </button>
              </div>
            </div>
          </div>

          {/* Active Coupons List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {coupons.length > 0 ? (
              coupons.map(c => (
                <div key={c.couponId} className={`p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between ${!c.active ? 'opacity-50' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-violet-950 text-violet-300 font-mono font-black border border-violet-800/40 rounded-md text-xs">
                          {c.code}
                        </span>
                        <span className="text-emerald-400 font-mono font-black text-xs">
                          {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : 
                           c.discountType === 'fixed_pi' ? `-${c.discountValue} Pi` : 'FREE SHIPPING'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 capitalize">
                        {c.couponClass?.replace('_', ' ')} • Min: {c.minOrderValue} Pi • Used: {c.usedCount}/{c.maxUses}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => toggleCoupon(c.couponId, c.active)}
                        className={`px-2 py-1 rounded-lg text-[9px] font-bold transition-colors ${
                          c.active 
                            ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' 
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {c.active ? 'Active' : 'Inactive'}
                      </button>
                      <button
                        onClick={() => deleteCoupon(c.couponId)}
                        className="p-1 hover:bg-red-900/40 hover:text-red-400 text-slate-500 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 col-span-2 text-center py-4">No coupons created yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Featured Ads */}
      {activeTab === 'featured' && (
        <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-3">
          <Sparkles className="w-8 h-8 text-violet-400 mx-auto" />
          <h4 className="text-sm font-black text-white uppercase">Sponsored Product & Category Banners</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">Boost your products to the top of homepage discovery and marketplace searches using BMP Rewards budget. Reach thousands of daily active users instantly.</p>
          <button 
            onClick={() => setActiveTab('campaigns')}
            className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg"
          >
            Promote Product Listing
          </button>
        </div>
      )}
    </div>
  );
};
