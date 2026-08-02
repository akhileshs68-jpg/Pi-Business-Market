/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Megaphone, Tag, Sparkles, Percent, Calendar, Flame, Award, Zap, Flag, Plus, Trash2, CheckCircle2, TrendingUp, Users, Target, Activity, Pause, Play, Copy, Edit2, Archive, Share2
} from 'lucide-react';
import { collection, doc, setDoc, getDocs, query, where, serverTimestamp, updateDoc, deleteDoc } from 'firebase/firestore';
import { getFirebaseDb } from '../../firebase/config';
import { campaignService, Campaign, CampaignType, CampaignStatus, CtaType } from '../../services/campaignService';

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
  const [loading, setLoading] = useState(false);
  
  // Coupon Form
  const [newCode, setNewCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed_pi' | 'free_shipping'>('percentage');
  const [couponClass, setCouponClass] = useState<'business' | 'store' | 'festival' | 'referral' | 'first_purchase'>('business');
  const [discountValue, setDiscountValue] = useState(10);
  const [minOrder, setMinOrder] = useState(5);
  const [maxUses, setMaxUses] = useState(100);

  // Campaign Form
  const [newCampaignTitle, setNewCampaignTitle] = useState('');
  const [newCampaignType, setNewCampaignType] = useState<CampaignType>('flash_sale');
  const [newCampaignBudget, setNewCampaignBudget] = useState(100);
  const [newCampaignCta, setNewCampaignCta] = useState<CtaType>('shop_now');

  useEffect(() => {
    loadMarketingData();
  }, [businessId]);

  const loadMarketingData = async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const db = getFirebaseDb();
      
      const qC = query(collection(db, 'coupons'), where('businessId', '==', businessId));
      const snapC = await getDocs(qC);
      setCoupons(snapC.docs.map(d => ({ couponId: d.id, ...d.data() })) as Coupon[]);

      const qCamp = query(collection(db, 'campaigns'), where('businessId', '==', businessId));
      const snapCamp = await getDocs(qCamp);
      setCampaigns(snapCamp.docs.map(d => ({ id: d.id, ...d.data() })) as Campaign[]);
      
    } catch (err) {
      console.warn('Failed to load marketing data', err);
    } finally {
      setLoading(false);
    }
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

  const handleCreateCampaign = async () => {
    if (!newCampaignTitle.trim() || !businessId) return;
    
    await campaignService.createCampaign({
      merchantId: userId,
      businessId,
      businessName: 'My Business',
      campaignTitle: newCampaignTitle.trim(),
      shortDescription: 'New promotional campaign.',
      campaignType: newCampaignType,
      bannerImage: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800',
      targetRoute: '/marketplace',
      status: 'active',
      startDate: new Date().toISOString(),
      ctaType: newCampaignCta,
      budgetPi: Number(newCampaignBudget)
    });
    
    setNewCampaignTitle('');
    loadMarketingData();
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
  const totalConversions = 0; 
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
        <div className="flex flex-wrap items-center bg-slate-950 p-1 border border-slate-800 rounded-2xl text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'overview' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> Overview
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'campaigns' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" /> Campaigns
          </button>
          <button
            onClick={() => setActiveTab('coupons')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'coupons' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tag className="w-3.5 h-3.5" /> Coupons
          </button>
          <button
            onClick={() => setActiveTab('featured')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'featured' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Featured Ads
          </button>
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
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4 text-violet-400" /> Create New Campaign
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
              <div className="sm:col-span-2">
                <span className="text-slate-400 font-bold block mb-1">Campaign Title</span>
                <input
                  type="text"
                  placeholder="e.g. Summer Flash Sale"
                  value={newCampaignTitle}
                  onChange={e => setNewCampaignTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>
              <div className="sm:col-span-1">
                <span className="text-slate-400 font-bold block mb-1">Campaign Type</span>
                <select
                  value={newCampaignType}
                  onChange={e => setNewCampaignType(e.target.value as CampaignType)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="flash_sale">Flash Sale</option>
                  <option value="festival">Festival Integration</option>
                  <option value="featured_product">Featured Product</option>
                  <option value="featured_store">Featured Store</option>
                  <option value="sponsored_ad">Sponsored Ad</option>
                </select>
              </div>
              <div className="sm:col-span-1">
                <span className="text-slate-400 font-bold block mb-1">CTA Action</span>
                <select
                  value={newCampaignCta}
                  onChange={e => setNewCampaignCta(e.target.value as CtaType)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="shop_now">Shop Now</option>
                  <option value="visit_store">Visit Store</option>
                  <option value="learn_more">Learn More</option>
                </select>
              </div>
              <div className="sm:col-span-1">
                <span className="text-slate-400 font-bold block mb-1">Budget (Pi)</span>
                <input
                  type="number"
                  value={newCampaignBudget}
                  onChange={e => setNewCampaignBudget(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none"
                />
              </div>
              <div className="sm:col-span-5 flex justify-end">
                <button
                  onClick={handleCreateCampaign}
                  className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-black uppercase text-xs transition-all shadow-md"
                >
                  Launch Campaign
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.length > 0 ? (
              campaigns.map(camp => (
                <div key={camp.id} className={`bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 ${camp.status === 'expired' ? 'opacity-60 grayscale' : ''}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        {camp.campaignTitle}
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          camp.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 
                          camp.status === 'paused' ? 'bg-amber-500/20 text-amber-400' :
                          camp.status === 'pending' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {camp.status}
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-500 capitalize">{camp.campaignType.replace('_', ' ')} • {camp.ctaType.replace('_', ' ')}</p>
                    </div>
                    <div className="flex items-center gap-1">
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
                  
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/50">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Impressions</span>
                      <span className="text-xs font-mono text-white">{camp.impressions}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Clicks</span>
                      <span className="text-xs font-mono text-white">{camp.clicks}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">CTR</span>
                      <span className="text-xs font-mono text-emerald-400">{camp.ctr}%</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 col-span-2 text-center py-8">No active campaigns. Start growing your business above.</p>
            )}
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
