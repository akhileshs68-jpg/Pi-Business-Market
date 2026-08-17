/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { FileUpload } from '../components/product/FileUpload';
import { businessService } from '../services/businessService';
import { 
  User as UserIcon, 
  Search, 
  MapPin, 
  Building2, 
  Phone, 
  Globe, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  Loader2, 
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Categories required by user instruction
const BUSINESS_CATEGORIES = [
  'Retail Shop',
  'Wholesale',
  'Manufacturer',
  'Distributor',
  'IT Developer',
  'Software Company',
  'Digital Services',
  'Freelancer',
  'Education',
  'Healthcare',
  'Agriculture',
  'Restaurant',
  'Grocery',
  'Fashion',
  'Electronics',
  'Mobile Shop',
  'Hardware',
  'Automobile',
  'Real Estate',
  'Tourism',
  'Transport',
  'Beauty & Cosmetics',
  'Other'
];

export const OnboardingPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [displayName, setDisplayName] = useState(user?.displayName || user?.username || '');
  const [photoUrl, setPhotoUrl] = useState(user?.photoUrl || '');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categorySearch, setCategorySearch] = useState('');

  // Business states
  const [businessName, setBusinessName] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [website, setWebsite] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [businessEmail, setBusinessEmail] = useState(user?.email || '');
  const [businessLogo, setBusinessLogo] = useState('');
  const [businessBanner, setBusinessBanner] = useState('');

  // Search filter for business categories
  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return BUSINESS_CATEGORIES;
    return BUSINESS_CATEGORIES.filter(cat => 
      cat.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [categorySearch]);

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      if (!fullName.trim()) {
        setError('Full Name is required.');
        return;
      }
      if (!displayName.trim()) {
        setError('Display Name is required.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!selectedCategory) {
        setError('Please select a business category to continue.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!businessName.trim()) {
        setError('Business Name is required.');
        return;
      }
      if (!businessDescription.trim()) {
        setError('Business Description is required.');
        return;
      }
      if (!fullAddress.trim()) {
        setError('Full Address is required.');
        return;
      }
      if (!country.trim()) {
        setError('Country is required.');
        return;
      }
      if (!city.trim()) {
        setError('City is required.');
        return;
      }
      if (!pincode.trim()) {
        setError('Pincode is required.');
        return;
      }
      if (!contactNumber.trim()) {
        setError('Contact Number is required.');
        return;
      }
      setStep(4);
    }
  };

  const handleBack = () => {
    setError(null);
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleFinalSave = async () => {
    if (!user || loading) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Create Business using existing schema & services
      const businessId = await businessService.createBusiness(
        user.uid,
        displayName || user.username || 'User',
        {
          ownerUid: user.uid,
          businessName,
          legalName: businessName,
          displayName: businessName,
          businessType: selectedCategory,
          industry: selectedCategory,
          category: selectedCategory,
          description: businessDescription,
          logoUrl: businessLogo || photoUrl || undefined,
          coverImageUrl: businessBanner || undefined,
          email: businessEmail || user.email || '',
          phone: contactNumber,
          website: website || undefined,
          gstNumber: gstNumber || undefined,
          country,
          state,
          city,
          postalCode: pincode,
          fullAddress,
          timezone: 'UTC',
          currency: 'Pi',
          language: 'English',
          verificationStatus: 'Approved',
          kycStatus: 'Verified',
          businessStatus: 'active'
        }
      );

      // 2. Update user profile to active and mark profileCompleted and onboardingCompleted
      await updateUser({
        fullName,
        displayName,
        photoUrl: photoUrl || undefined,
        activeRole: 'seller', // default to active seller since they set up a business
        roles: Array.from(new Set([...(user.roles || []), 'seller', 'buyer', 'business_owner'])),
        profileCompleted: true,
        onboardingCompleted: true,
        status: 'active'
      });

      // 3. Navigate to dashboard
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error('[Onboarding] Final Save failed:', err);
      setError(err.message || 'An error occurred while saving your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between p-4 sm:p-6 text-slate-100 font-sans relative">
      {/* Background Subtle Accent */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Header */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between py-4 border-b border-slate-900 shrink-0 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center font-black text-white text-base">
            Pi
          </div>
          <div>
            <h1 className="text-sm font-black text-white tracking-tight uppercase">Pi Business Market</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Onboarding Wizard</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Step {step} of 4</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto flex items-center justify-center py-8 sm:py-12 relative z-10">
        <div className="w-full bg-slate-900/45 border border-slate-800/80 p-6 sm:p-10 rounded-3xl shadow-2xl overflow-hidden relative backdrop-blur-md">
          
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 animate-shake">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
              <p className="text-sm text-red-200 font-medium leading-relaxed">{error}</p>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* STEP 1: Basic Info */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-black text-white mb-2">Let's get to know you</h2>
                    <p className="text-sm text-slate-400 leading-relaxed font-medium">
                      Fill in your identity details to build trust within the Pi Network marketplace.
                    </p>
                  </div>

                  {/* Profile Photo Upload */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Profile Photo (Optional)</label>
                    <div className="flex flex-col sm:flex-row items-center gap-6 p-5 bg-slate-950/40 border border-slate-800/60 rounded-2xl">
                      <div className="w-20 h-20 rounded-2xl bg-slate-850 border border-slate-800 flex items-center justify-center overflow-hidden relative shrink-0">
                        {photoUrl ? (
                          <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="w-8 h-8 text-slate-500" />
                        )}
                        {photoUrl && (
                          <button 
                            type="button" 
                            onClick={() => setPhotoUrl('')}
                            className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold text-red-400"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="w-full">
                        <FileUpload 
                          ownerUid={user?.uid || ''}
                          module="users"
                          label="Upload Image"
                          onUploadSuccess={(asset) => setPhotoUrl(asset.downloadUrl)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                        placeholder="John Doe"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Display Name *</label>
                      <input
                        type="text"
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                        placeholder="john_pioneer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Business Category */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-black text-white mb-2">Select Business Category</h2>
                    <p className="text-sm text-slate-400 leading-relaxed font-medium">
                      Which industry best represents your primary operations or services?
                    </p>
                  </div>

                  {/* Search Box */}
                  <div className="relative">
                    <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      placeholder="Search business categories..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                    />
                  </div>

                  {/* Categories Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                    {filteredCategories.length > 0 ? (
                      filteredCategories.map((cat) => {
                        const isSelected = selectedCategory === cat;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setSelectedCategory(cat)}
                            className={`p-3.5 text-left text-sm rounded-xl font-bold transition-all border flex items-center justify-between ${
                              isSelected 
                                ? 'bg-indigo-600/10 border-indigo-500 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.08)]' 
                                : 'bg-slate-950/40 border-slate-850 hover:bg-slate-800 text-slate-300'
                            }`}
                          >
                            <span>{cat}</span>
                            {isSelected && <CheckCircle2 className="w-4.5 h-4.5 text-indigo-400 shrink-0" />}
                          </button>
                        );
                      })
                    ) : (
                      <p className="text-slate-500 text-sm py-4 text-center font-bold">No matching categories found.</p>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 3: Business Details */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-black text-white mb-2">Establish Business Identity</h2>
                    <p className="text-sm text-slate-400 leading-relaxed font-medium">
                      Register your professional business details to enable marketplace listings.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Business Name *</label>
                      <div className="relative">
                        <Building2 className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          required
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                          placeholder="e.g. Apex Tech Solutions"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Business Description *</label>
                      <textarea
                        required
                        value={businessDescription}
                        onChange={(e) => setBusinessDescription(e.target.value)}
                        rows={2}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                        placeholder="Explain what your business offers or manufactures..."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Full Address *</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          required
                          value={fullAddress}
                          onChange={(e) => setFullAddress(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                          placeholder="Street name, suite, shop number"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Country *</label>
                        <input
                          type="text"
                          required
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                          placeholder="e.g. United States"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">State / Province</label>
                        <input
                          type="text"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                          placeholder="e.g. California"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">City *</label>
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                          placeholder="e.g. San Francisco"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Pincode / Postal Code *</label>
                        <input
                          type="text"
                          required
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                          placeholder="e.g. 94103"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Contact Number *</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                          <input
                            type="text"
                            required
                            value={contactNumber}
                            onChange={(e) => setContactNumber(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                            placeholder="e.g. +1 555 0199"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Website (Optional)</label>
                        <div className="relative">
                          <Globe className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                          <input
                            type="text"
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                            placeholder="e.g. www.apex.com"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">GST Number (Optional)</label>
                        <input
                          type="text"
                          value={gstNumber}
                          onChange={(e) => setGstNumber(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                          placeholder="e.g. 22AAAAA0000A1Z5"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Business Email *</label>
                        <input
                          type="email"
                          required
                          value={businessEmail}
                          onChange={(e) => setBusinessEmail(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                          placeholder="business@example.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Business Logo (Optional)</label>
                      <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-950/40 border border-slate-800/60 rounded-xl">
                        <div className="w-16 h-16 rounded-xl bg-slate-850 border border-slate-800 flex items-center justify-center overflow-hidden relative shrink-0">
                          {businessLogo ? (
                            <img src={businessLogo} alt="Logo" className="w-full h-full object-cover" />
                          ) : (
                            <Building2 className="w-6 h-6 text-slate-500" />
                          )}
                        </div>
                        <div className="w-full">
                          <FileUpload 
                            ownerUid={user?.uid || ''}
                            module="businesses"
                            label="Upload Business Logo"
                            onUploadSuccess={(asset) => setBusinessLogo(asset.downloadUrl)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Business Banner (Optional)</label>
                      <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-950/40 border border-slate-800/60 rounded-xl">
                        <div className="w-24 h-12 rounded-xl bg-slate-850 border border-slate-800 flex items-center justify-center overflow-hidden relative shrink-0">
                          {businessBanner ? (
                            <img src={businessBanner} alt="Banner" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] text-slate-500 font-bold uppercase">No Banner</span>
                          )}
                        </div>
                        <div className="w-full">
                          <FileUpload 
                            ownerUid={user?.uid || ''}
                            module="businesses"
                            label="Upload Business Banner"
                            onUploadSuccess={(asset) => setBusinessBanner(asset.downloadUrl)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Review and Finalize */}
              {step === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-black text-white mb-2">Review & Finalize</h2>
                    <p className="text-sm text-slate-400 leading-relaxed font-medium">
                      Verify your details before launching your official business profile on the Pi Network.
                    </p>
                  </div>

                  <div className="space-y-4 bg-slate-950/50 p-6 rounded-2xl border border-slate-850">
                    <div className="flex items-center gap-4 pb-4 border-b border-slate-850/80">
                      <div className="w-14 h-14 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
                        {photoUrl ? (
                          <img src={photoUrl} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="w-6 h-6 text-slate-500" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white leading-tight">{fullName}</h4>
                        <p className="text-xs text-slate-500 font-bold">@{displayName}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                      <div className="space-y-1">
                        <span className="text-slate-500 font-bold uppercase tracking-wider block">Business Type</span>
                        <span className="text-slate-300 font-semibold">{selectedCategory}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-500 font-bold uppercase tracking-wider block">Business Name</span>
                        <span className="text-slate-300 font-semibold">{businessName}</span>
                      </div>
                      <div className="space-y-1 col-span-2">
                        <span className="text-slate-500 font-bold uppercase tracking-wider block">Description</span>
                        <span className="text-slate-300 block leading-relaxed">{businessDescription}</span>
                      </div>
                      <div className="space-y-1 col-span-2">
                        <span className="text-slate-500 font-bold uppercase tracking-wider block">Address</span>
                        <span className="text-slate-300 block leading-relaxed">
                          {fullAddress}, {city}, {state ? `${state}, ` : ''}{country} - {pincode}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-500 font-bold uppercase tracking-wider block">Contact Number</span>
                        <span className="text-slate-300 font-semibold">{contactNumber}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-500 font-bold uppercase tracking-wider block">Website</span>
                        <span className="text-slate-300 font-semibold">{website || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-indigo-500/5 border border-indigo-500/15 rounded-2xl flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-indigo-200 leading-relaxed font-semibold">
                      By completing your registration, you will gain access to your Business Workspace and Store Dashboard to begin listing products and services for Pi.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Controls Footer */}
          <div className="mt-8 pt-6 border-t border-slate-850 flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={step === 1 || loading}
              className={`px-4 py-2.5 text-sm font-bold flex items-center gap-1.5 rounded-xl transition-all ${
                step === 1 
                  ? 'text-slate-600 cursor-not-allowed' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            {step < 4 ? (
              <button
                onClick={handleNext}
                className="px-6 py-2.5 bg-white hover:bg-slate-200 text-slate-950 font-black rounded-xl text-sm transition-all flex items-center gap-1.5 shadow-lg shadow-white/5 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinalSave}
                disabled={loading}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-sm transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-600/25 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Finalizing...</span>
                  </>
                ) : (
                  <>
                    <Briefcase className="w-4 h-4" />
                    <span>Finalize Profile</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="max-w-4xl w-full mx-auto py-4 border-t border-slate-900 text-center shrink-0 relative z-10">
        <p className="text-slate-600 text-[10px] uppercase tracking-[0.2em] font-mono">
          Powered by Pi Network Blockchain & Firestore
        </p>
      </footer>
    </div>
  );
};
