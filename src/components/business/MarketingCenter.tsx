/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Megaphone, Tag, Sparkles, Percent, Calendar, Flame, Award, Zap, Flag, Plus, Trash2, CheckCircle2 
} from 'lucide-react';
import { collection, doc, setDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '../../firebase/config';

interface Coupon {
  couponId: string;
  code: string;
  discountType: 'percentage' | 'fixed_pi';
  discountValue: number;
  minOrderValue: number;
  maxUses: number;
  usedCount: number;
  active: boolean;
  businessId: string;
}

interface Campaign {
  campaignId: string;
  title: string;
  type: 'flash_sale' | 'festival' | 'referral' | 'featured';
  budgetBmp: number;
  status: 'Active' | 'Scheduled' | 'Completed';
  businessId: string;
}

interface Props {
  businessId: string;
  userId: string;
}

export const MarketingCenter: React.FC<Props> = ({ businessId, userId }) => {
  const [activeTab, setActiveTab] = useState<'coupons' | 'campaigns' | 'banners' | 'featured'>('coupons');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Coupon Form
  const [newCode, setNewCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed_pi'>('percentage');
  const [discountValue, setDiscountValue] = useState(10);
  const [minOrder, setMinOrder] = useState(5);

  useEffect(() => {
    loadMarketingData();
  }, [businessId]);

  const loadMarketingData = async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const db = getFirebaseDb();
      // Load Coupons
      const qC = query(collection(db, 'coupons'), where('businessId', '==', businessId));
      const snapC = await getDocs(qC);
      setCoupons(snapC.docs.map(d => ({ couponId: d.id, ...d.data() })) as Coupon[]);

      // Load Campaigns
      const qCamp = query(collection(db, 'campaigns'), where('businessId', '==', businessId));
      const snapCamp = await getDocs(qCamp);
      setCampaigns(snapCamp.docs.map(d => ({ campaignId: d.id, ...d.data() })) as Campaign[]);
    } catch (err) {
      console.warn('Failed to load marketing data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async () => {
    if (!newCode.trim() || !businessId) return;
    const db = getFirebaseDb();
    const cId = `c_${Date.now()}`;
    const couponData: Omit<Coupon, 'couponId'> = {
      code: newCode.trim().toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrder),
      maxUses: 100,
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

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-2xl">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-tight">Merchant Marketing & Growth Center</h2>
            <p className="text-xs text-slate-400">Manage Coupons, Flash Sales, Featured Listings & Promotional Campaigns</p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center bg-slate-950 p-1 border border-slate-800 rounded-2xl text-xs">
          <button
            onClick={() => setActiveTab('coupons')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'coupons' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tag className="w-3.5 h-3.5" /> Coupons
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
            onClick={() => setActiveTab('featured')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'featured' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Featured Ads
          </button>
        </div>
      </div>

      {/* Tab 1: Coupon Manager */}
      {activeTab === 'coupons' && (
        <div className="space-y-6">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4 text-violet-400" /> Create New Discount Coupon
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 font-bold block mb-1">Coupon Code</span>
                <input
                  type="text"
                  placeholder="e.g. PI2026"
                  value={newCode}
                  onChange={e => setNewCode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono uppercase focus:outline-none"
                />
              </div>
              <div>
                <span className="text-slate-400 font-bold block mb-1">Discount Type</span>
                <select
                  value={discountType}
                  onChange={e => setDiscountType(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed_pi">Fixed Pi Amount</option>
                </select>
              </div>
              <div>
                <span className="text-slate-400 font-bold block mb-1">Value</span>
                <input
                  type="number"
                  value={discountValue}
                  onChange={e => setDiscountValue(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleCreateCoupon}
                  className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-black uppercase text-xs transition-all shadow-md"
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
                <div key={c.couponId} className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-violet-950 text-violet-300 font-mono font-black border border-violet-800/40 rounded-md text-xs">
                        {c.code}
                      </span>
                      <span className="text-emerald-400 font-mono font-black text-xs">
                        {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `-${c.discountValue} Pi`}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">Min Order: {c.minOrderValue} Pi • Used: {c.usedCount}/{c.maxUses}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[9px] font-bold">
                    Active
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 col-span-2 text-center py-4">No coupons created yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Campaigns */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <Flame className="w-5 h-5 text-amber-400" />
              <h4 className="text-xs font-black text-white">Flash Sales Sprint</h4>
              <p className="text-[10px] text-slate-400">Launch a 24-hour limited time price drop to boost instant orders.</p>
              <button className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-bold uppercase">
                Setup Flash Sale
              </button>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              <h4 className="text-xs font-black text-white">Festival Campaign</h4>
              <p className="text-[10px] text-slate-400">Join Pi Network ecosystem global festival trade fairs.</p>
              <button className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg text-[10px] font-bold uppercase">
                Register Festival
              </button>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              <h4 className="text-xs font-black text-white">Referral Cashbacks</h4>
              <p className="text-[10px] text-slate-400">Offer BMP bonus to buyers who bring new customer orders.</p>
              <button className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg text-[10px] font-bold uppercase">
                Enable Cashbacks
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Featured Ads */}
      {activeTab === 'featured' && (
        <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-3">
          <Sparkles className="w-8 h-8 text-violet-400 mx-auto" />
          <h4 className="text-sm font-black text-white uppercase">Sponsored Product & Category Banners</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">Boost your products to the top of homepage discovery and marketplace searches using BMP Rewards budget.</p>
          <button className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg">
            Promote Product Listing
          </button>
        </div>
      )}
    </div>
  );
};
