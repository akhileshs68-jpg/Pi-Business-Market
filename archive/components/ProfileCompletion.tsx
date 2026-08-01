/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon,
  Phone,
  Mail,
  Calendar,
  Globe,
  MapPin,
  Lock,
  Camera,
  Heart,
  Eye,
  CheckCircle,
  AlertTriangle,
  Save,
  Check,
  Shield,
  Bell,
  Sun,
  Moon,
  Layers,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';

interface ProfileCompletionProps {
  user: any;
  onSave: (updates: any) => Promise<void>;
  saving: boolean;
  roleSwitcherElement: React.ReactNode;
}

export const ProfileCompletion: React.FC<ProfileCompletionProps> = ({
  user,
  onSave,
  saving,
  roleSwitcherElement
}) => {
  // Local form state representing the editable profile fields
  const [formData, setFormData] = useState({
    displayName: user.displayName || '',
    photoUrl: user.photoUrl || '',
    fullName: user.fullName || '',
    mobileNumber: user.mobileNumber || user.phone || '',
    email: user.email || '',
    dob: user.dob || '',
    gender: user.gender || '',
    country: user.country || '',
    state: user.state || '',
    city: user.city || '',
    language: user.language || 'English',
    addressLine1: user.addressLine1 || '',
    addressLine2: user.addressLine2 || '',
    postalCode: user.postalCode || '',
    preferredLanguage: user.preferredLanguage || 'English',
    preferredCurrency: user.preferredCurrency || 'Pi',
    notificationsEmail: user.notificationsEmail !== false,
    notificationsPush: user.notificationsPush !== false,
    notificationsInApp: user.notificationsInApp !== false,
    darkMode: user.darkMode === true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Re-sync with user changes if necessary
  useEffect(() => {
    setFormData({
      displayName: user.displayName || '',
      photoUrl: user.photoUrl || '',
      fullName: user.fullName || '',
      mobileNumber: user.mobileNumber || user.phone || '',
      email: user.email || '',
      dob: user.dob || '',
      gender: user.gender || '',
      country: user.country || '',
      state: user.state || '',
      city: user.city || '',
      language: user.language || 'English',
      addressLine1: user.addressLine1 || '',
      addressLine2: user.addressLine2 || '',
      postalCode: user.postalCode || '',
      preferredLanguage: user.preferredLanguage || 'English',
      preferredCurrency: user.preferredCurrency || 'Pi',
      notificationsEmail: user.notificationsEmail !== false,
      notificationsPush: user.notificationsPush !== false,
      notificationsInApp: user.notificationsInApp !== false,
      darkMode: user.darkMode === true
    });
  }, [user]);

  // Define completion metrics
  const completionFields = [
    { name: 'Profile Photo', key: 'photoUrl', label: 'Upload or add a profile image URL' },
    { name: 'Display Name', key: 'displayName', label: 'Set your public display name' },
    { name: 'Full Name', key: 'fullName', label: 'Fill in your legal full name' },
    { name: 'Mobile Number', key: 'mobileNumber', label: 'Verify your contact phone number' },
    { name: 'Email Address', key: 'email', label: 'Add a valid email address' },
    { name: 'Country', key: 'country', label: 'Select your country of residence' },
    { name: 'State', key: 'state', label: 'Specify your state or province' },
    { name: 'City', key: 'city', label: 'Specify your current city' },
    { name: 'Address Line 1', key: 'addressLine1', label: 'Add your primary street address' },
    { name: 'Postal Code', key: 'postalCode', label: 'Specify your local postal code' }
  ];

  // Calculate percentage and missing fields
  const missingFields = completionFields.filter(field => !formData[field.key as keyof typeof formData]);
  const completionPercentage = Math.round(((completionFields.length - missingFields.length) / completionFields.length) * 100);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: val
    }));
    
    // Clear errors for this input
    if (errors[name]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Basic fields validation
    if (!formData.displayName.trim()) newErrors.displayName = 'Display Name is required.';
    if (!formData.fullName.trim()) newErrors.fullName = 'Full Name is required.';
    
    // Email verification
    if (!formData.email.trim()) {
      newErrors.email = 'Email Address is required.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please provide a valid email address.';
      }
    }

    // Phone verification
    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile Number is required.';
    } else {
      const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
      if (!phoneRegex.test(formData.mobileNumber.trim())) {
        newErrors.mobileNumber = 'Please specify a valid phone number (at least 7 digits).';
      }
    }

    // Address verification
    if (!formData.country.trim()) newErrors.country = 'Country is required.';
    if (!formData.state.trim()) newErrors.state = 'State is required.';
    if (!formData.city.trim()) newErrors.city = 'City is required.';
    if (!formData.addressLine1.trim()) newErrors.addressLine1 = 'Address Line 1 is required.';
    if (!formData.postalCode.trim()) newErrors.postalCode = 'Postal Code is required.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(null);
    setSaveError(null);

    if (!validateForm()) {
      setSaveError('Please resolve the validation errors before saving.');
      // Scroll to the error banner/first error
      window.scrollTo({ top: 300, behavior: 'smooth' });
      return;
    }

    try {
      // Use merge update to update only changed fields on the profile
      const changedUpdates: Record<string, any> = {};
      Object.keys(formData).forEach(key => {
        const currentValue = formData[key as keyof typeof formData];
        const originalValue = user[key];
        if (currentValue !== originalValue) {
          changedUpdates[key] = currentValue;
        }
      });

      if (Object.keys(changedUpdates).length === 0) {
        setSaveSuccess('No changes were made.');
        return;
      }

      await onSave(changedUpdates);
      setSaveSuccess('Your profile has been saved and completed successfully!');
    } catch (err: any) {
      console.error('[ProfileCompletion] Save failed:', err);
      setSaveError(err.message || 'An unexpected error occurred while saving your profile.');
    }
  };

  // Helper colors for percentage bar
  const getProgressColorClass = (pct: number) => {
    if (pct < 40) return 'bg-rose-500';
    if (pct < 70) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getProgressBgColorClass = (pct: number) => {
    if (pct < 40) return 'from-rose-500/20 to-rose-600/10';
    if (pct < 70) return 'from-amber-500/20 to-amber-600/10';
    return 'from-emerald-500/20 to-emerald-600/10';
  };

  const getProgressTextColorClass = (pct: number) => {
    if (pct < 40) return 'text-rose-400 border-rose-500/20 bg-rose-500/5';
    if (pct < 70) return 'text-amber-400 border-amber-500/20 bg-amber-500/5';
    return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* SECTION 5: Verification & Completion Status Panel */}
      <div className={`border rounded-3xl p-6 sm:p-8 shadow-xl transition-all relative overflow-hidden bg-slate-900/40 border-slate-800`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 rounded-bl-full pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-violet-400" />
              <h3 className="text-lg font-bold text-white">Profile Verification & Completion</h3>
            </div>
            <p className="text-slate-400 text-xs font-medium max-w-xl">
              Completing your unified identity improves your marketplace trust score, seller discoverability, and enables smoother checkout.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className={`px-4 py-2 border rounded-2xl font-black text-lg sm:text-xl tracking-tight text-center ${getProgressTextColorClass(completionPercentage)}`}>
              {completionPercentage}% <span className="text-[10px] uppercase font-bold block tracking-wider">Completed</span>
            </div>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="mt-6 relative h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full ${getProgressColorClass(completionPercentage)}`}
          />
        </div>

        {/* Checklist of missing information */}
        {missingFields.length > 0 ? (
          <div className="mt-6 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Missing Profile Fields ({missingFields.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {missingFields.map(field => (
                <div key={field.key} className="flex items-start gap-2 text-xs text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                  <div>
                    <span className="font-bold text-slate-300">{field.name}</span>
                    <span className="block text-[10px] text-slate-500 leading-tight">{field.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-6 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-3 text-emerald-400">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <div className="text-xs">
              <p className="font-bold">Excellent! Your profile is 100% complete.</p>
              <p className="text-slate-400 mt-0.5">Your business, buyer, and service profiles are fully synchronized with this identity.</p>
            </div>
          </div>
        )}
      </div>

      {/* Success/Error Alerts inside Form */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-400 shadow-lg animate-fadeIn">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-semibold">{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-400 shadow-lg animate-fadeIn">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-semibold">{saveError}</span>
        </div>
      )}

      {/* SECTION 1 & 2: Basic & Personal Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Basic Information & Avatar Selection */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800/60">
            <UserIcon className="w-5 h-5 text-violet-400" />
            <h3 className="text-base font-bold text-white">Basic Information</h3>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Profile Photo URL</label>
              <div className="flex gap-3">
                <div className="relative group shrink-0">
                  <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center">
                    {formData.photoUrl ? (
                      <img src={formData.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-5 h-5 text-slate-500" />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                </div>
                <input
                  type="url"
                  name="photoUrl"
                  value={formData.photoUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com/photo.jpg"
                  className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl font-bold text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                />
              </div>
              <p className="text-[10px] text-slate-500 leading-normal">Enter any direct image address URL to set your avatar.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Display Name *</label>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  placeholder="Display Name"
                  className={`w-full px-4 py-3 bg-slate-950 border rounded-xl font-bold text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all ${errors.displayName ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-800'}`}
                />
                {errors.displayName && <p className="text-[10px] text-rose-400 font-semibold">{errors.displayName}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Pi Username</label>
                <div className="relative">
                  <input
                    type="text"
                    value={`@${user.username}`}
                    readOnly
                    className="w-full px-4 py-3 pr-10 bg-slate-950/40 border border-slate-900 rounded-xl font-bold text-xs text-slate-500 cursor-not-allowed select-none focus:outline-none"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-600 absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[10px] text-slate-600">Pi Username cannot be changed.</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Wallet Address</label>
              <div className="relative">
                <input
                  type="text"
                  value={(user.walletAddress && !user.walletAddress.startsWith('pi_wallet_')) ? user.walletAddress : 'Wallet not available'}
                  readOnly
                  className="w-full px-4 py-3 pr-10 bg-slate-950/40 border border-slate-900 rounded-xl font-mono text-xs text-slate-500 cursor-not-allowed select-none focus:outline-none truncate"
                />
                <Lock className="w-3.5 h-3.5 text-slate-600 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl text-left">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Member Since</p>
                <p className="text-slate-300 font-bold text-xs">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Today'}
                </p>
              </div>
              <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl text-left">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Last Login</p>
                <p className="text-slate-300 font-bold text-xs">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Now'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800/60">
            <Heart className="w-5 h-5 text-violet-400" />
            <h3 className="text-base font-bold text-white">Personal Information</h3>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  className={`w-full px-4 py-3 bg-slate-950 border rounded-xl font-bold text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all ${errors.fullName ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-800'}`}
                />
                {errors.fullName && <p className="text-[10px] text-rose-400 font-semibold">{errors.fullName}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Mobile Number *</label>
                <div className="relative">
                  <input
                    type="tel"
                    name="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 000-0000"
                    className={`w-full pl-9 pr-4 py-3 bg-slate-950 border rounded-xl font-bold text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all ${errors.mobileNumber ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-800'}`}
                  />
                  <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                {errors.mobileNumber && <p className="text-[10px] text-rose-400 font-semibold">{errors.mobileNumber}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Email Address *</label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="name@domain.com"
                  className={`w-full pl-9 pr-4 py-3 bg-slate-950 border rounded-xl font-bold text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all ${errors.email ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-800'}`}
                />
                <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              {errors.email && <p className="text-[10px] text-rose-400 font-semibold">{errors.email}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Date of Birth (Optional)</label>
                <div className="relative">
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleInputChange}
                    className="w-full pl-9 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl font-bold text-xs text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                  />
                  <Calendar className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Gender (Optional)</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl font-bold text-xs text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all cursor-pointer"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Primary Language</label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl font-bold text-xs text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all cursor-pointer"
                >
                  <option value="English">English</option>
                  <option value="Mandarin">Mandarin</option>
                  <option value="Spanish">Spanish</option>
                  <option value="Vietnamese">Vietnamese</option>
                  <option value="Hindi">Hindi</option>
                  <option value="French">French</option>
                  <option value="Arabic">Arabic</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Country *</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  placeholder="United States"
                  className={`w-full px-4 py-3 bg-slate-950 border rounded-xl font-bold text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all ${errors.country ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-800'}`}
                />
                {errors.country && <p className="text-[10px] text-rose-400 font-semibold">{errors.country}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Contact Information */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800/60">
          <MapPin className="w-5 h-5 text-violet-400" />
          <h3 className="text-base font-bold text-white">Contact & Address Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Address Line 1 *</label>
              <input
                type="text"
                name="addressLine1"
                value={formData.addressLine1}
                onChange={handleInputChange}
                placeholder="123 Main Street"
                className={`w-full px-4 py-3 bg-slate-950 border rounded-xl font-bold text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all ${errors.addressLine1 ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-800'}`}
              />
              {errors.addressLine1 && <p className="text-[10px] text-rose-400 font-semibold">{errors.addressLine1}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Address Line 2 (Optional)</label>
              <input
                type="text"
                name="addressLine2"
                value={formData.addressLine2}
                onChange={handleInputChange}
                placeholder="Apt, Suite, Building"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl font-bold text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">State / Province *</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                placeholder="California"
                className={`w-full px-4 py-3 bg-slate-950 border rounded-xl font-bold text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all ${errors.state ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-800'}`}
              />
              {errors.state && <p className="text-[10px] text-rose-400 font-semibold">{errors.state}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">City *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="San Francisco"
                  className={`w-full px-4 py-3 bg-slate-950 border rounded-xl font-bold text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all ${errors.city ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-800'}`}
                />
                {errors.city && <p className="text-[10px] text-rose-400 font-semibold">{errors.city}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Postal Code *</label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  placeholder="94111"
                  className={`w-full px-4 py-3 bg-slate-950 border rounded-xl font-bold text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all ${errors.postalCode ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-800'}`}
                />
                {errors.postalCode && <p className="text-[10px] text-rose-400 font-semibold">{errors.postalCode}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: Professional Information (Role Switcher element passed down) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800/60 mb-2">
          <Layers className="w-5 h-5 text-violet-400" />
          <h3 className="text-base font-bold text-white">Professional Information & Roles</h3>
        </div>
        {roleSwitcherElement}
      </div>

      {/* SECTION 6: Marketplace Preferences */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800/60">
          <Globe className="w-5 h-5 text-violet-400" />
          <h3 className="text-base font-bold text-white">Marketplace Preferences</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Language & Currency Selection */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Preferred Language</label>
                <select
                  name="preferredLanguage"
                  value={formData.preferredLanguage}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl font-bold text-xs text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all cursor-pointer"
                >
                  <option value="English">English</option>
                  <option value="Mandarin">Mandarin</option>
                  <option value="Spanish">Spanish</option>
                  <option value="Vietnamese">Vietnamese</option>
                  <option value="Hindi">Hindi</option>
                  <option value="French">French</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Preferred Currency</label>
                <select
                  name="preferredCurrency"
                  value={formData.preferredCurrency}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl font-bold text-xs text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all cursor-pointer"
                >
                  <option value="Pi">Pi (π)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="VND">VND (₫)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>
            </div>

            {/* Dark Mode selector */}
            <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400">
                  {formData.darkMode ? <Moon className="w-4 h-4 text-violet-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Dark Mode Preference</h4>
                  <p className="text-[10px] text-slate-500">Enable modern dark mode interface defaults.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, darkMode: !prev.darkMode }))}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${formData.darkMode ? 'bg-violet-600' : 'bg-slate-800'}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.darkMode ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          {/* Notifications Panel */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-violet-400" /> Notification Settings
            </h4>

            <div className="space-y-3 bg-slate-950/60 border border-slate-850 p-4 rounded-2xl">
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white group-hover:text-violet-400 transition-colors">Email Notifications</span>
                  <span className="text-[10px] text-slate-500 block">Receive transaction receipts and account reports.</span>
                </div>
                <input
                  type="checkbox"
                  name="notificationsEmail"
                  checked={formData.notificationsEmail}
                  onChange={(e) => setFormData(p => ({ ...p, notificationsEmail: e.target.checked }))}
                  className="w-4 h-4 accent-violet-600 rounded cursor-pointer"
                />
              </label>

              <div className="h-px bg-slate-900" />

              <label className="flex items-center justify-between cursor-pointer group">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white group-hover:text-violet-400 transition-colors">Push Notifications</span>
                  <span className="text-[10px] text-slate-500 block">Get instant updates about your active orders or jobs.</span>
                </div>
                <input
                  type="checkbox"
                  name="notificationsPush"
                  checked={formData.notificationsPush}
                  onChange={(e) => setFormData(p => ({ ...p, notificationsPush: e.target.checked }))}
                  className="w-4 h-4 accent-violet-600 rounded cursor-pointer"
                />
              </label>

              <div className="h-px bg-slate-900" />

              <label className="flex items-center justify-between cursor-pointer group">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white group-hover:text-violet-400 transition-colors">In-App Notifications</span>
                  <span className="text-[10px] text-slate-500 block">See platform alerts and direct customer messages.</span>
                </div>
                <input
                  type="checkbox"
                  name="notificationsInApp"
                  checked={formData.notificationsInApp}
                  onChange={(e) => setFormData(p => ({ ...p, notificationsInApp: e.target.checked }))}
                  className="w-4 h-4 accent-violet-600 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={saving}
          className={`flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-sm font-black transition-all shadow-lg ${
            saving
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-55'
              : 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-600/10 cursor-pointer'
          }`}
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-500 border-t-white rounded-full animate-spin shrink-0" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Profile Changes</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
