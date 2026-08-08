/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Calculator, 
  Wrench, 
  BookOpen, 
  ArrowLeft,
  Coins,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../auth/useAuth';
import { CommunityPriceCalculatorUI } from '../components/tools/CommunityPriceCalculator';

export const ToolsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const target = searchParams.get('target'); // 'product' | 'service' | null
  const returnUrl = searchParams.get('returnUrl');
  const initialCurrency = searchParams.get('currency') || 'INR';
  const initialAmount = searchParams.get('amount') ? parseFloat(searchParams.get('amount')!) : undefined;

  const [activeToolTab, setActiveToolTab] = useState<'calculator' | 'guide'>('calculator');
  const [appliedNotification, setAppliedNotification] = useState<string | null>(null);

  const handleSelectPrice = (piAmount: number, details?: { mode: 'COMMUNITY'; localCurrency?: string; localAmount?: number }) => {
    // If returning to product or service form, navigate back with state/query parameters
    if (target === 'product' || returnUrl?.includes('seller-dashboard') || returnUrl?.includes('products')) {
      navigate('/seller-dashboard', { 
        state: { 
          fromCalculator: true, 
          pricingMode: 'COMMUNITY', 
          communityPiAmount: piAmount,
          localCurrency: details?.localCurrency,
          localAmount: details?.localAmount
        } 
      });
      return;
    }

    if (target === 'service' || returnUrl?.includes('services')) {
      navigate('/services', { 
        state: { 
          fromCalculator: true, 
          pricingMode: 'COMMUNITY', 
          communityPiAmount: piAmount,
          localCurrency: details?.localCurrency,
          localAmount: details?.localAmount
        } 
      });
      return;
    }

    // Default notification feedback
    setAppliedNotification(`Selected Community Price: ${piAmount} π. Copy or navigate to Product/Service manager to save.`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-violet-500/30">
      <Navbar 
        currentUser={user!}
        currentView="tools"
        onNavigate={(view) => navigate(`/${view}`)}
        cartCount={0}
        walletBalance={100}
        onWalletUpdate={() => {}}
        onToggleCart={() => {}}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-900 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-2xl shadow-xl shadow-violet-600/20">
                <Wrench className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Tools & Utilities</h1>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-0.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
                  Decision Support & Business Calculations
                </p>
              </div>
            </div>
          </div>

          {/* Tools Navigation Tabs */}
          <div className="flex bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800 self-start md:self-auto">
            <button
              onClick={() => setActiveToolTab('calculator')}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeToolTab === 'calculator'
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calculator className="w-4 h-4" />
              Community Price Calculator
            </button>

            <button
              onClick={() => setActiveToolTab('guide')}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeToolTab === 'guide'
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Pricing Guide
            </button>
          </div>
        </div>

        {appliedNotification && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between text-emerald-400 text-xs font-bold">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{appliedNotification}</span>
            </div>
            <button 
              onClick={() => setAppliedNotification(null)}
              className="text-slate-400 hover:text-white text-[10px] uppercase font-black"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Content Tabs */}
        {activeToolTab === 'calculator' && (
          <div className="space-y-6">
            <CommunityPriceCalculatorUI 
              onSelectPrice={handleSelectPrice}
              targetLabel={target === 'product' ? 'Product Manager' : target === 'service' ? 'Service Wizard' : undefined}
              initialCurrency={initialCurrency}
              initialAmount={initialAmount}
            />
          </div>
        )}

        {activeToolTab === 'guide' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Coins className="w-5 h-5 text-violet-400" />
              Pricing Engine Architecture Overview
            </h2>

            <div className="grid md:grid-cols-2 gap-6 text-xs text-slate-300">
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                <h3 className="font-extrabold text-violet-400 uppercase tracking-wider text-xs">1. Exchange Pricing Mode</h3>
                <p className="text-slate-400 leading-relaxed">
                  Prices are defined in local fiat currency (INR, USD, EUR, GBP, AED, SAR, etc.) and dynamically converted to Pi at checkout using authoritative rate providers.
                </p>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                <h3 className="font-extrabold text-violet-400 uppercase tracking-wider text-xs">2. Community Pricing Mode</h3>
                <p className="text-slate-400 leading-relaxed">
                  Prices are manually set in Pi by the seller or service provider. A Community Price remains fixed in Pi and never automatically updates based on market exchange rates.
                </p>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
