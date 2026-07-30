/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  MapPin, 
  Mail, 
  Phone, 
  Globe, 
  ShieldCheck, 
  Image as ImageIcon, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  Upload,
  Briefcase,
  User,
  Zap,
  Info,
  X,
  Plus,
  ArrowRight,
  FileText,
  ShoppingCart,
  Wrench,
  Factory,
  Tractor,
  Store,
  Palette,
  Truck,
  HeartPulse,
  GraduationCap,
  Utensils,
  HardHat,
  MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../auth/useAuth';
import { businessService } from '../../services/businessService';
import { mediaService } from '../../services/mediaService';
import { Business } from '../../types';
import { FileUpload } from '../product/FileUpload';

interface WizardProps {
  onComplete: (businessId: string) => void;
  onCancel: () => void;
  initialData?: Partial<Business>;
  businessId?: string;
}

const BUSINESS_TYPES = [
  { id: 'Product Seller', label: 'Product Seller', icon: ShoppingCart, desc: 'Sell physical or digital products.' },
  { id: 'Service Provider', label: 'Service Provider', icon: Wrench, desc: 'Offer skills or services to customers.' },
  { id: 'Manufacturer', label: 'Manufacturer', icon: Factory, desc: 'Manufacture goods for wholesale or retail.' },
  { id: 'Freelancer', label: 'Freelancer', icon: User, desc: 'Independent professional offering specialized skills.' },
  { id: 'Professional', label: 'Professional', icon: Briefcase, desc: 'Consulting, accounting, legal, and more.' },
  { id: 'Farmer / Agriculture', label: 'Farmer / Agriculture', icon: Tractor, desc: 'Agriculture, farming, and organic produce.' },
  { id: 'Local Shop', label: 'Local Shop', icon: Store, desc: 'Retail store, grocery, or local boutique.' },
  { id: 'Company', label: 'Company', icon: Building2, desc: 'Registered corporate entity or agency.' },
  { id: 'Startup', label: 'Startup', icon: Zap, desc: 'Fast-growing tech or innovative business.' },
  { id: 'NGO', label: 'NGO', icon: ShieldCheck, desc: 'Non-profit, charity, or social enterprise.' },
  { id: 'Artist / Creator', label: 'Artist / Creator', icon: Palette, desc: 'Artists, musicians, creators, and crafters.' },
  { id: 'Distributor', label: 'Distributor', icon: Truck, desc: 'Supply chain distribution and logistics.' },
  { id: 'Wholesaler', label: 'Wholesaler', icon: Building2, desc: 'B2B seller of bulk goods and materials.' },
  { id: 'Transport', label: 'Transport', icon: Truck, desc: 'Logistics, delivery, and transportation.' },
  { id: 'Education', label: 'Education', icon: GraduationCap, desc: 'Schools, tutoring, and educational courses.' },
  { id: 'Healthcare', label: 'Healthcare', icon: HeartPulse, desc: 'Medical professionals, clinics, and wellness.' },
  { id: 'Hospitality', label: 'Hospitality', icon: Utensils, desc: 'Restaurants, cafes, hotels, and events.' },
  { id: 'Construction', label: 'Construction', icon: HardHat, desc: 'Building, architecture, and contracting.' },
  { id: 'Repair Services', label: 'Repair Services', icon: Wrench, desc: 'Electronics, automotive, and appliance repair.' },
  { id: 'Other', label: 'Other', icon: MoreHorizontal, desc: 'Other types of businesses not listed.' }
];

export const BusinessWizard: React.FC<WizardProps> = ({ onComplete, onCancel, initialData, businessId }) => {
  const { user, profile } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Business>>(() => {
    if (initialData) {
      return {
        businessType: '',
        businessName: '',
        legalName: '',
        displayName: '',
        email: '',
        phone: '',
        country: '',
        city: '',
        state: '',
        postalCode: '',
        fullAddress: '',
        description: '',
        profileData: {},
        ...initialData
      };
    }
    return {
      businessType: '',
      businessName: '',
      legalName: '',
      displayName: '',
      email: '',
      phone: '',
      country: '',
      city: '',
      state: '',
      postalCode: '',
      fullAddress: '',
      description: '',
      profileData: {}
    };
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(initialData?.logoUrl || null);
  const [coverPreview, setCoverPreview] = useState<string | null>(initialData?.coverImageUrl || null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const totalSteps = 6;

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else onCancel();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProfileDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      profileData: {
        ...(formData.profileData || {}),
        [e.target.name]: e.target.value
      }
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'logo') {
          setLogoPreview(reader.result as string);
          setFormData({ ...formData, logoUrl: reader.result as string }); 
          // Note: In real app, we'd upload to Cloudinary/Firebase Storage, for this demo we'll just save the data URL temporarily
        } else {
          setCoverPreview(reader.result as string);
          setFormData({ ...formData, coverImageUrl: reader.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!user || !profile) return;
    setIsSubmitting(true);
    setError(null);
    try {
      if (businessId) {
        const { id, createdAt, updatedAt, createdBy, updatedBy, rating, reviewCount, followers, employeeCount, storeCount, ownerUid, ...updates } = formData;
        await businessService.updateBusiness(businessId, user.uid, profile.displayName || user.email || 'User', updates);
        onComplete(businessId);
      } else {
        const newBusinessId = await businessService.createBusiness(user.uid, profile.displayName || user.email || 'User', formData as Omit<Business, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'rating' | 'reviewCount' | 'followers' | 'employeeCount' | 'storeCount'>);
        onComplete(newBusinessId);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || `Failed to ${businessId ? 'update' : 'create'} business`);
      setIsSubmitting(false);
    }
  };

  const renderDynamicFields = () => {
    const type = formData.businessType || '';
    const pd = formData.profileData || {};

    if (['Service Provider', 'Carpenter', 'Tailor', 'Doctor', 'Lawyer', 'Freelancer', 'Professional', 'Repair Services'].includes(type)) {
      return (
        <>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400">Skills / Expertise</label>
            <input name="skills" value={pd.skills || ''} onChange={handleProfileDataChange} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white" placeholder="e.g. Plumbing, SEO, Consulting..." />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400">Experience (Years)</label>
            <input type="number" name="experience" value={pd.experience || ''} onChange={handleProfileDataChange} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white" placeholder="e.g. 5" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400">Service Area</label>
            <input name="serviceArea" value={pd.serviceArea || ''} onChange={handleProfileDataChange} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white" placeholder="e.g. City-wide, Global..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Working Hours</label>
              <input name="workingHours" value={pd.workingHours || ''} onChange={handleProfileDataChange} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white" placeholder="e.g. 9 AM - 5 PM" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Starting Price</label>
              <input type="number" name="startingPrice" value={pd.startingPrice || ''} onChange={handleProfileDataChange} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white" placeholder="e.g. 10" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400">Languages</label>
            <input name="languages" value={pd.languages || ''} onChange={handleProfileDataChange} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white" placeholder="e.g. English, Spanish..." />
          </div>
          <div className="flex flex-col gap-3 mt-4">
            <div className="flex items-center gap-3">
              <input type="checkbox" name="homeVisit" checked={pd.homeVisit === 'true'} onChange={(e) => setFormData({ ...formData, profileData: { ...pd, homeVisit: e.target.checked ? 'true' : 'false' } })} className="w-4 h-4 bg-slate-900 border-slate-800 rounded text-indigo-600" />
              <label className="text-sm font-medium text-slate-300">Home Service</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" name="emergencyService" checked={pd.emergencyService === 'true'} onChange={(e) => setFormData({ ...formData, profileData: { ...pd, emergencyService: e.target.checked ? 'true' : 'false' } })} className="w-4 h-4 bg-slate-900 border-slate-800 rounded text-indigo-600" />
              <label className="text-sm font-medium text-slate-300">Emergency Service</label>
            </div>
          </div>
        </>
      );
    }
    
    if (['Farmer', 'Agriculture / Farmer', 'Farmer / Agriculture'].includes(type)) {
      return (
        <>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400">Farm Name</label>
            <input name="farmName" value={pd.farmName || ''} onChange={handleProfileDataChange} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white" placeholder="e.g. Green Valley Farms" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400">Crop Type</label>
            <input name="cropType" value={pd.cropType || ''} onChange={handleProfileDataChange} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white" placeholder="e.g. Organic Wheat, Apples..." />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400">Harvest Season</label>
            <input name="harvestSeason" value={pd.harvestSeason || ''} onChange={handleProfileDataChange} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white" placeholder="e.g. Fall, Summer..." />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400">Quantity Available</label>
            <input name="quantity" value={pd.quantity || ''} onChange={handleProfileDataChange} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white" placeholder="e.g. 500 kg" />
          </div>
          <div className="flex items-center gap-3 mt-4">
            <input type="checkbox" name="organic" checked={pd.organic === 'true'} onChange={(e) => setFormData({ ...formData, profileData: { ...pd, organic: e.target.checked ? 'true' : 'false' } })} className="w-4 h-4 bg-slate-900 border-slate-800 rounded text-indigo-600" />
            <label className="text-sm font-medium text-slate-300">Certified Organic</label>
          </div>
        </>
      );
    }

    if (['Manufacturer', 'Distributor', 'Wholesaler', 'Company'].includes(type)) {
      return (
        <>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400">Factory Name</label>
            <input name="factoryName" value={pd.factoryName || ''} onChange={handleProfileDataChange} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white" placeholder="e.g. Apex Manufacturing" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400">Production Capacity</label>
            <input name="productionCapacity" value={pd.productionCapacity || ''} onChange={handleProfileDataChange} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white" placeholder="e.g. 10,000 units/month" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400">Minimum Order Quantity (MOQ)</label>
            <input name="moq" value={pd.moq || ''} onChange={handleProfileDataChange} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white" placeholder="e.g. 500 pieces" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400">Factory Address</label>
            <textarea name="factoryAddress" value={pd.factoryAddress || ''} onChange={handleProfileDataChange} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white" rows={2} placeholder="Physical address of the factory/warehouse" />
          </div>
          <div className="flex flex-col gap-3 mt-4">
            <div className="flex items-center gap-3">
              <input type="checkbox" name="sellsWholesale" checked={pd.sellsWholesale === 'true'} onChange={(e) => setFormData({ ...formData, profileData: { ...pd, sellsWholesale: e.target.checked ? 'true' : 'false' } })} className="w-4 h-4 bg-slate-900 border-slate-800 rounded text-indigo-600" />
              <label className="text-sm font-medium text-slate-300">Sells Wholesale / Bulk</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" name="sellsRetail" checked={pd.sellsRetail === 'true'} onChange={(e) => setFormData({ ...formData, profileData: { ...pd, sellsRetail: e.target.checked ? 'true' : 'false' } })} className="w-4 h-4 bg-slate-900 border-slate-800 rounded text-indigo-600" />
              <label className="text-sm font-medium text-slate-300">Sells Retail</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" name="exportReady" checked={pd.exportReady === 'true'} onChange={(e) => setFormData({ ...formData, profileData: { ...pd, exportReady: e.target.checked ? 'true' : 'false' } })} className="w-4 h-4 bg-slate-900 border-slate-800 rounded text-indigo-600" />
              <label className="text-sm font-medium text-slate-300">Export Ready</label>
            </div>
          </div>
        </>
      );
    }

    if (['Product Seller', 'Local Shop'].includes(type)) {
        return (
          <>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Store Name</label>
              <input name="storeName" value={pd.storeName || ''} onChange={handleProfileDataChange} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white" placeholder="e.g. Tech World Store" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Product Categories Sold</label>
              <input name="productCategories" value={pd.productCategories || ''} onChange={handleProfileDataChange} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white" placeholder="e.g. Electronics, Clothing..." />
            </div>
            <div className="flex flex-col gap-3 mt-4">
              <div className="flex items-center gap-3">
                <input type="checkbox" name="deliveryAvailable" checked={pd.deliveryAvailable === 'true'} onChange={(e) => setFormData({ ...formData, profileData: { ...pd, deliveryAvailable: e.target.checked ? 'true' : 'false' } })} className="w-4 h-4 bg-slate-900 border-slate-800 rounded text-indigo-600" />
                <label className="text-sm font-medium text-slate-300">Delivery Available</label>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" name="pickupAvailable" checked={pd.pickupAvailable === 'true'} onChange={(e) => setFormData({ ...formData, profileData: { ...pd, pickupAvailable: e.target.checked ? 'true' : 'false' } })} className="w-4 h-4 bg-slate-900 border-slate-800 rounded text-indigo-600" />
                <label className="text-sm font-medium text-slate-300">Pickup Available</label>
              </div>
            </div>
          </>
        );
    }

    if (['Artist', 'Artist / Creator', 'Potter'].includes(type)) {
        return (
          <>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Art Medium / Niche</label>
              <input name="artMedium" value={pd.artMedium || ''} onChange={handleProfileDataChange} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white" placeholder="e.g. Digital Art, Ceramics, Music..." />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Portfolio Link</label>
              <input name="portfolio" value={pd.portfolio || ''} onChange={handleProfileDataChange} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white" placeholder="https://..." />
            </div>
            <div className="flex items-center gap-3 mt-4">
              <input type="checkbox" name="acceptsCommissions" checked={pd.acceptsCommissions === 'true'} onChange={(e) => setFormData({ ...formData, profileData: { ...pd, acceptsCommissions: e.target.checked ? 'true' : 'false' } })} className="w-4 h-4 bg-slate-900 border-slate-800 rounded text-indigo-600" />
              <label className="text-sm font-medium text-slate-300">Accepts Custom Commissions</label>
            </div>
          </>
        );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#030712]/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#090d16] border border-slate-800/80 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/50">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Business Setup</h2>
            <p className="text-xs text-slate-400">Step {step} of {totalSteps}</p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-400 hover:text-white" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-slate-900 shrink-0">
          <div 
            className="h-full bg-indigo-500 transition-all duration-300" 
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-6 sm:p-10 overflow-y-auto flex-1 custom-scrollbar">
          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3">
              <Info className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-200">{error}</p>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              {step === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-white mb-2">What best describes your business?</h3>
                    <p className="text-slate-400">Select the category that matches your primary operations.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                    {BUSINESS_TYPES.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, businessType: type.id })}
                        aria-pressed={formData.businessType === type.id}
                        className={`p-5 rounded-2xl border text-left transition-all flex flex-col gap-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          formData.businessType === type.id 
                            ? 'bg-indigo-600/10 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.1)]' 
                            : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className={`p-3 rounded-xl inline-flex w-fit ${formData.businessType === type.id ? 'bg-indigo-600/20 text-indigo-400' : 'bg-slate-800/80 text-slate-400'}`}>
                          <type.icon className="w-6 h-6" />
                        </div>
                        <div>
                          <p className={`text-base font-bold mb-1 ${formData.businessType === type.id ? 'text-indigo-300' : 'text-slate-200'}`}>
                            {type.label}
                          </p>
                          <p className={`text-xs leading-relaxed ${formData.businessType === type.id ? 'text-indigo-200/70' : 'text-slate-500'}`}>
                            {type.desc}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 max-w-2xl mx-auto">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-white mb-2">Basic Information</h3>
                    <p className="text-slate-400">Provide the core details of your business.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Business Name *</label>
                      <input 
                        name="businessName" 
                        value={formData.businessName} 
                        onChange={handleChange} 
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white" 
                        placeholder="Public name of your business" 
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Legal Name</label>
                        <input 
                          name="legalName" 
                          value={formData.legalName} 
                          onChange={handleChange} 
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white" 
                          placeholder="Registered entity name" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Contact Email</label>
                        <input 
                          type="email"
                          name="email" 
                          value={formData.email} 
                          onChange={handleChange} 
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white" 
                          placeholder="business@example.com" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Phone Number</label>
                      <input 
                        name="phone" 
                        value={formData.phone} 
                        onChange={handleChange} 
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white" 
                        placeholder="+1 (555) 000-0000" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Brief Description</label>
                      <textarea 
                        name="description" 
                        value={formData.description} 
                        onChange={handleChange} 
                        rows={3}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white" 
                        placeholder="What does your business do?" 
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6 max-w-2xl mx-auto">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-white mb-2">{formData.businessType} Details</h3>
                    <p className="text-slate-400">Specific information for your business category.</p>
                  </div>
                  <div className="space-y-5 bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                    {renderDynamicFields()}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6 max-w-2xl mx-auto">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-white mb-2">Location & Address</h3>
                    <p className="text-slate-400">Where is your business located?</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Country *</label>
                      <input name="country" value={formData.country} onChange={handleChange} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">State / Province</label>
                      <input name="state" value={formData.state} onChange={handleChange} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">City *</label>
                      <input name="city" value={formData.city} onChange={handleChange} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Postal Code</label>
                      <input name="postalCode" value={formData.postalCode} onChange={handleChange} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Full Address</label>
                    <textarea name="fullAddress" value={formData.fullAddress} onChange={handleChange} rows={2} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white" />
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                  <div className="text-center mb-4 md:col-span-2">
                    <h3 className="text-2xl font-bold text-white mb-2">Brand Identity</h3>
                    <p className="text-slate-400">Upload your logo and cover image.</p>
                  </div>
                  <div className="space-y-4">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Business Logo</label>
                    <div className="w-full">
                      {formData.logoUrl ? (
                        <div className="w-[180px] h-[180px] md:w-[200px] md:h-[200px] bg-slate-950 rounded-3xl overflow-hidden relative mx-auto md:mx-0 border border-slate-800 aspect-square">
                          <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                          <button onClick={() => setFormData({...formData, logoUrl: ''})} className="absolute top-2 right-2 p-1 bg-rose-500 text-white rounded-lg">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <FileUpload
                          ownerUid={user?.uid || ''}
                          module="businesses"
                          label="Upload Logo"
                          onUploadSuccess={(asset) => setFormData({ ...formData, logoUrl: asset.downloadUrl })}
                        />
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cover Image</label>
                    <div className="w-full">
                      {formData.coverImageUrl ? (
                        <div className="w-full aspect-[16/9] md:aspect-[3/1] bg-slate-950 rounded-3xl overflow-hidden relative border border-slate-800">
                          <img src={formData.coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
                          <button onClick={() => setFormData({...formData, coverImageUrl: ''})} className="absolute top-2 right-2 p-1 bg-rose-500 text-white rounded-lg">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <FileUpload
                          ownerUid={user?.uid || ''}
                          module="businesses"
                          label="Upload Cover"
                          onUploadSuccess={(asset) => setFormData({ ...formData, coverImageUrl: asset.downloadUrl })}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}

               {step === 6 && (
                <div className="space-y-6 max-w-2xl mx-auto">
                  <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden">
                    <div className="aspect-[3/1] bg-gradient-to-r from-indigo-900 to-violet-900 relative">
                       {coverPreview && <img src={coverPreview} className="w-full h-full object-cover opacity-50" />}
                    </div>
                    <div className="px-8 pb-8 -mt-12 md:-mt-16 relative z-10">
                      <div className="w-24 h-24 md:w-32 md:h-32 bg-slate-900 border-4 border-slate-950 rounded-2xl flex items-center justify-center mb-4 overflow-hidden relative shrink-0 aspect-square">
                        {logoPreview ? (
                          <img src={logoPreview} className="w-full h-full object-cover" />
                        ) : (
                          <Building2 className="w-10 h-10 text-indigo-400" />
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-white">{formData.businessName || 'Business Name'}</h3>
                      <p className="text-sm text-slate-500">{formData.businessType || 'Type not set'} • {formData.city || 'City not set'}</p>
                      
                      <div className="mt-6 grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                          <p className="text-[10px] font-bold text-slate-600 uppercase mb-1">Legal Entity</p>
                          <p className="text-xs text-slate-300 font-medium">{formData.legalName || 'N/A'}</p>
                        </div>
                        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                          <p className="text-[10px] font-bold text-slate-600 uppercase mb-1">Contact</p>
                          <p className="text-xs text-slate-300 font-medium">{formData.email || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
                        <p className="text-sm text-indigo-200">
                          {businessId ? 'Your changes are ready. Click save to update your business profile on the Pi Network.' : 'Your digital identity is ready. Click finalize to create your business profile on the Pi Network.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between shrink-0">
          <button
            onClick={handleBack}
            disabled={isSubmitting}
            className="px-6 py-2.5 text-sm font-bold text-slate-400 hover:text-white transition-all"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          
          {step < totalSteps ? (
            <button
              onClick={handleNext}
              disabled={step === 1 && !formData.businessType}
              className="px-8 py-2.5 bg-white text-slate-950 rounded-xl font-bold hover:bg-slate-200 transition-all disabled:opacity-50"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.businessName}
              className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (businessId ? 'Saving...' : 'Creating...') : (
                <>
                  <Zap className="w-4 h-4" />
                  {businessId ? 'Save Changes' : 'Finalize Business'}
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
