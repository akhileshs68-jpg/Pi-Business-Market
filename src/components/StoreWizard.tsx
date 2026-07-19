/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Check,
  Store,
  Upload,
  Globe,
  Wallet,
  ShieldCheck,
  Cpu,
  Database,
  CloudLightning,
  AlertCircle
} from 'lucide-react';
import { Store as StoreType, ProductCategory } from '../types';
import { PiBusinessMarketDB } from '../services/storage';

interface StoreWizardProps {
  ownerUid: string;
  defaultWalletAddress: string;
  onStoreCreated: (store: StoreType) => void;
}

const BRANDING_BANNERS = [
  'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=600&h=200&q=80',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&h=200&q=80',
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&h=200&q=80',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&h=200&q=80'
];

const BRANDING_LOGOS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&h=150&q=80',
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=150&h=150&q=80',
  'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=150&h=150&q=80',
  'https://images.unsplash.com/photo-1516876437184-593fda40c7ce?auto=format&fit=crop&w=150&h=150&q=80'
];

export default function StoreWizard({
  ownerUid,
  defaultWalletAddress,
  onStoreCreated
}: StoreWizardProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState<ProductCategory>('electronics');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState(BRANDING_LOGOS[0]);
  const [bannerUrl, setBannerUrl] = useState(BRANDING_BANNERS[0]);
  const [piWalletAddress, setPiWalletAddress] = useState(defaultWalletAddress);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [telegram, setTelegram] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#7A1A78'); // Pi violet
  
  // Deploy stage states
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStep, setDeployStep] = useState(0);
  const [error, setError] = useState('');

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    // Generate slug
    const generated = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    setSlug(generated);
  };

  const validateStep = () => {
    setError('');
    if (step === 1) {
      if (!name.trim()) return 'Store Name is required';
      if (!slug.trim()) return 'Store URL Slug is required';
      const exists = PiBusinessMarketDB.getStores().some(s => s.slug === slug);
      if (exists) return 'This URL slug is already taken';
    }
    if (step === 2) {
      if (!description.trim() || description.length < 15) return 'Store description must be at least 15 characters';
    }
    if (step === 3) {
      if (!piWalletAddress.trim() || piWalletAddress.length < 20) return 'Please provide a valid Pi wallet address';
    }
    return '';
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(prev => Math.max(1, prev - 1));
  };

  const deployMessages = [
    { text: 'Registering Decentralized Merchant Signature on Chain...', icon: <ShieldCheck className="w-4 h-4 text-emerald-500 animate-pulse" /> },
    { text: 'Allocating Secure Store Sandbox Directory & Databases...', icon: <Database className="w-4 h-4 text-violet-500 animate-bounce" /> },
    { text: 'Configuring Pi Network Merchant Node API Sync...', icon: <Cpu className="w-4 h-4 text-amber-500 animate-spin" /> },
    { text: 'Indexing DNS Slug routes on Pi Browser Gateway...', icon: <Globe className="w-4 h-4 text-blue-500 animate-pulse" /> },
    { text: 'Merchant Workspace initialized successfully!', icon: <Check className="w-4 h-4 text-emerald-500" /> }
  ];

  const handleDeploy = () => {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }

    setIsDeploying(true);
    setDeployStep(0);

    // Run sequential simulated deploying animations
    const runDeploySequence = (idx: number) => {
      if (idx < deployMessages.length) {
        setTimeout(() => {
          setDeployStep(idx + 1);
          runDeploySequence(idx + 1);
        }, 1200);
      } else {
        // Final creation
        setTimeout(() => {
          const store = PiBusinessMarketDB.createStore({
            ownerUid,
            name,
            slug,
            description,
            logoUrl,
            bannerUrl,
            category,
            piWalletAddress,
            phone: phone || undefined,
            email: email || undefined,
            socials: (telegram || whatsapp) ? {
              telegram: telegram || undefined,
              whatsapp: whatsapp || undefined
            } : undefined,
            customTheme: {
              primaryColor,
              bannerText: '#FFFFFF'
            }
          });
          onStoreCreated(store);
        }, 800);
      }
    };

    runDeploySequence(0);
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6 lg:px-8 text-slate-100">
      {/* HEADER SECTION */}
      {!isDeploying && (
        <div className="text-center mb-8 select-none">
          <div className="w-12 h-12 bg-violet-500/10 border border-violet-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3 text-violet-400 shadow-md">
            <Store className="w-6 h-6" />
          </div>
          <h2 className="font-sans font-bold text-2xl text-slate-100 tracking-tight">Launch Your Store in under 2 minutes</h2>
          <p className="text-slate-400 text-sm mt-1 max-w-md mx-auto">
            Design a professional, high-performance storefront and instantly receive direct Pi coins from global shoppers.
          </p>

          {/* PROGRESS STEPS BAR */}
          <div className="flex items-center justify-center gap-12 mt-8 max-w-sm mx-auto">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2 relative">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-all border ${
                  step === s 
                    ? 'bg-violet-600 text-white border-violet-600 scale-110 shadow-md shadow-violet-500/10'
                    : step > s
                      ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20'
                      : 'bg-slate-950 text-slate-500 border-slate-850'
                }`}>
                  {step > s ? <Check className="w-3.5 h-3.5" /> : s}
                </div>
                <span className={`text-xs font-semibold ${step === s ? 'text-slate-200' : 'text-slate-500'}`}>
                  {s === 1 ? 'Profile' : s === 2 ? 'Branding' : 'Payouts'}
                </span>
                {s < 3 && (
                  <div className={`absolute left-20 h-0.5 w-10 bg-slate-800 hidden sm:block ${step > s ? 'bg-emerald-500/20' : ''}`}></div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ERROR CONTEXT BANNER */}
      {error && (
        <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* FORM CARDS AND ENGINE */}
      {!isDeploying ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-md">
          
          {/* STEP 1: GENERAL STOREFRONT IDENTITY */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-200 mb-1">Tell us about your business</h3>
                <p className="text-xs text-slate-400">Establish your name, category, and customized shop URL slug.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Store Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={handleNameChange}
                    className="w-full text-sm border border-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500 bg-slate-950 text-slate-200 placeholder-slate-600 transition-all font-medium"
                    placeholder="e.g. Satoshi Coffee Bar"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Primary Market Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ProductCategory)}
                    className="w-full text-sm border border-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500 bg-slate-950 text-slate-200 transition-all font-medium"
                  >
                    <option value="electronics">Electronics & Tech Devices</option>
                    <option value="fashion">Fashion, Clothes & Apparel</option>
                    <option value="food_delivery">Food, Coffee & Bakery</option>
                    <option value="digital_services">Digital Assets & Online Services</option>
                    <option value="home_living">Home & Living Goods</option>
                    <option value="health_beauty">Health & Beauty Supplies</option>
                    <option value="books_education">Books, Guides & Education</option>
                    <option value="others">Other Miscellaneous</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                  Custom Store URL Slug *
                  <span className="text-[10px] text-slate-500 font-normal">(Generated automatically)</span>
                </label>
                <div className="flex rounded-xl overflow-hidden border border-slate-800 focus-within:ring-1 focus-within:ring-violet-500 bg-slate-950 transition-all">
                  <span className="bg-slate-950 px-3 py-2.5 text-xs font-medium text-slate-500 border-r border-slate-850 flex items-center font-mono">
                    pibiz.mkt/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9\-]+/g, ''))}
                    className="flex-1 text-sm px-3.5 py-2 focus:outline-none font-mono text-slate-200 bg-slate-950 font-medium"
                    placeholder="satoshi-coffee-bar"
                  />
                </div>
              </div>

              <div className="border-t border-slate-800 pt-5">
                <h4 className="text-xs font-bold text-slate-300 mb-3">Optional Business Coordinates</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Merchant Support Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500 bg-slate-950 text-slate-200 font-medium placeholder-slate-600"
                      placeholder="support@satoshi.co"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Merchant Phone Number</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-xs border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500 bg-slate-950 text-slate-200 font-medium placeholder-slate-600"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CREATIVE BRANDING & DESIGNS */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-base font-bold text-slate-200 mb-1">Visual Branding & Description</h3>
                <p className="text-xs text-slate-400">Describe your catalog and pick beautiful custom templates.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Elevator Pitch Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full text-sm border border-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500 bg-slate-950 text-slate-200 placeholder-slate-600 transition-all"
                  placeholder="Tell customers what you specialize in, what unique products you sell for Pi, and delivery notes..."
                />
                <span className="text-[10px] text-slate-500 mt-1 block">At least 15 characters. Write detailed descriptions to attract Pi pioneers.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Select a Brand Logo Template</label>
                <div className="grid grid-cols-4 gap-4">
                  {BRANDING_LOGOS.map((logo, i) => (
                    <div 
                      key={logo}
                      onClick={() => setLogoUrl(logo)}
                      className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                        logoUrl === logo ? 'border-violet-600 ring-2 ring-violet-500/10' : 'border-transparent hover:scale-105'
                      }`}
                    >
                      <img src={logo} alt={`logo-${i}`} className="w-full h-full object-cover" />
                      {logoUrl === logo && (
                        <div className="absolute inset-0 bg-violet-600/20 flex items-center justify-center">
                          <Check className="w-5 h-5 text-white bg-violet-600 rounded-full p-1" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Select a Cover Header Banner</label>
                <div className="grid grid-cols-2 gap-3">
                  {BRANDING_BANNERS.map((banner, i) => (
                    <div 
                      key={banner}
                      onClick={() => setBannerUrl(banner)}
                      className={`relative h-16 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                        bannerUrl === banner ? 'border-violet-600' : 'border-transparent hover:scale-102'
                      }`}
                    >
                      <img src={banner} alt={`banner-${i}`} className="w-full h-full object-cover opacity-80" />
                      {bannerUrl === banner && (
                        <div className="absolute inset-0 bg-violet-600/10 flex items-center justify-end p-2">
                          <Check className="w-4 h-4 text-white bg-violet-600 rounded-full p-0.5" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Pick Brand Accent Theme Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
                  />
                  <div className="text-xs text-slate-400 font-medium">
                    We will style your buttons, borders, and accents in this <span className="font-mono font-semibold" style={{ color: primaryColor }}>{primaryColor}</span> shade.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PAYOUT CONFIGURATION */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-base font-bold text-slate-200 mb-1">Verify Payout Node Coordinates</h3>
                <p className="text-xs text-slate-400">All consumer payments go directly to your crypto wallet. There are no middle brokers.</p>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 text-slate-300 text-xs">
                <Wallet className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-400 block mb-0.5">Non-Custodial Decentralized Framework</span>
                  Our system utilizes peer-to-peer Pi Blockchain payment models. Verify your wallet public keys below carefully. Do NOT provide private seed key passphrases.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Your Destination Pi Wallet Address (Public Key) *</label>
                <input
                  type="text"
                  value={piWalletAddress}
                  onChange={(e) => setPiWalletAddress(e.target.value.replace(/[^A-Za-z0-9]/g, ''))}
                  className="w-full text-xs font-mono border border-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500 bg-slate-950 text-slate-200"
                  placeholder="GBC..."
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Starts with G. Max transparency. Safe to show publicly.</span>
              </div>

              <div className="border-t border-slate-800 pt-5">
                <h4 className="text-xs font-bold text-slate-300 mb-3">Store Social Links (Attract Customers)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Telegram Handle</label>
                    <input
                      type="text"
                      value={telegram}
                      onChange={(e) => setTelegram(e.target.value)}
                      className="w-full text-xs border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500 bg-slate-950 text-slate-200 font-medium placeholder-slate-600"
                      placeholder="e.g. satoshi_shop"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">WhatsApp Chat Link</label>
                    <input
                      type="text"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="w-full text-xs border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500 bg-slate-950 text-slate-200 font-medium placeholder-slate-600"
                      placeholder="e.g. +39 333 444 555"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BACK AND NEXT BUTTON ACTIONS */}
          <div className="flex items-center justify-between border-t border-slate-800 mt-8 pt-5 select-none">
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="flex items-center gap-1 py-2 px-4 border border-slate-800 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800 transition-all cursor-pointer bg-slate-950"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <div></div>
            )}

            {step < 3 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 py-2 px-5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ml-auto"
              >
                Next Step
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleDeploy}
                className="flex items-center gap-1.5 py-2.5 px-6 bg-gradient-to-r from-violet-600 to-purple-700 text-white hover:from-violet-550 hover:to-purple-650 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ml-auto"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                Deploy Storefront
              </button>
            )}
          </div>

        </div>
      ) : (
        /* BLOCKCHAIN DEPLOY ANIMATOR OVERLAY */
        <div className="bg-slate-950 text-slate-200 border border-slate-850 rounded-3xl p-8 shadow-2xl text-center select-none animate-fade-in">
          <div className="w-16 h-16 bg-violet-950/40 border border-violet-700/30 rounded-full flex items-center justify-center mx-auto mb-6 relative">
            <CloudLightning className="w-7 h-7 text-amber-400 animate-pulse" />
            <div className="absolute inset-0 rounded-full border-2 border-violet-500 border-t-transparent animate-spin"></div>
          </div>
          
          <h3 className="text-lg font-bold text-white tracking-tight">Deploying Decentralized Architecture</h3>
          <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto leading-relaxed">
            Please wait as we sync with Pi Consensus Nodes and provision your high-performance sandbox storefront ledger files.
          </p>

          <div className="mt-8 space-y-3.5 max-w-md mx-auto text-left bg-slate-900/60 border border-slate-800 rounded-2xl p-5 font-mono text-[11px]">
            {deployMessages.map((msg, i) => (
              <div 
                key={i} 
                className={`flex items-center gap-2.5 transition-all ${
                  deployStep > i 
                    ? 'text-emerald-400 font-bold opacity-100' 
                    : deployStep === i 
                      ? 'text-amber-400 font-bold opacity-100' 
                      : 'text-slate-600 opacity-40'
                }`}
              >
                {deployStep > i ? (
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                    {msg.icon}
                  </div>
                )}
                <span>{msg.text}</span>
              </div>
            ))}
          </div>

          <div className="text-[10px] text-slate-500 font-mono mt-6 flex justify-between px-1">
            <span>Status: Mining Deploy Contract</span>
            <span>Est: ~4.8s</span>
          </div>
        </div>
      )}
    </div>
  );
}
