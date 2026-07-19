import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  MapPin, 
  Contact, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  Briefcase,
  Store,
  Globe,
  Settings2,
  ShieldCheck,
  Image as ImageIcon,
  Camera
} from 'lucide-react';
import { BusinessProfileType, MediaAsset } from '../../types';
import { businessService } from '../../services/businessService';
import { useAuth } from '../../auth/useAuth';
import { MediaPickerModal } from '../product/MediaPickerModal';

const BUSINESS_TYPES: BusinessProfileType[] = [
  'Store', 'Company', 'Service', 'Professional', 'Organization', 
  'Creator', 'Manufacturer', 'Supplier', 'Startup', 'Freelancer'
];

const CATEGORIES = [
  'Electronics', 'Fashion', 'Food & Beverage', 'Health & Beauty',
  'Automotive', 'Real Estate', 'Education', 'Technology',
  'Legal', 'Medical', 'Home Services', 'Consulting', 'Entertainment'
];

interface BusinessWizardProps {
  onComplete: () => void;
  onCancel: () => void;
}

export const BusinessWizard: React.FC<BusinessWizardProps> = ({ onComplete, onCancel }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    businessType: 'Store' as BusinessProfileType,
    businessCategory: 'Electronics',
    businessName: '',
    description: '',
    country: 'USA',
    state: '',
    city: '',
    address: '',
    email: '',
    phone: '',
    website: '',
    logo: '',
    banner: ''
  });

  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [activeMediaTarget, setActiveMediaTarget] = useState<'logo' | 'banner' | null>(null);

  const nextStep = () => setStep(s => Math.min(s + 1, 7));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleCreate = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const slug = await businessService.generateUniqueSlug(formData.businessName);
      
      await businessService.createBusiness({
        ownerUid: user.uid,
        ...formData,
        businessSlug: slug,
        latitude: 0, // Simplified for now
        longitude: 0,
        status: 'active'
      });

      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to create business profile');
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1: return !!formData.businessType;
      case 2: return !!formData.businessCategory;
      case 3: return formData.businessName.length >= 3 && !!formData.description;
      case 4: return true; // Media is optional
      case 5: return !!formData.country && !!formData.city && !!formData.address;
      case 6: return !!formData.email && !!formData.phone;
      default: return true;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center border border-violet-500/20">
              <Building2 className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white leading-none mb-1">Create Business Profile</h2>
              <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Step {step} of 7</p>
            </div>
          </div>
          <button 
            onClick={onCancel}
            className="text-slate-500 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-slate-800 w-full">
          <motion.div 
            className="h-full bg-violet-500" 
            animate={{ width: `${(step / 7) * 100}%` }} 
          />
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Step 1: Type */}
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Select Business Type</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {BUSINESS_TYPES.map(type => (
                      <button
                        key={type}
                        onClick={() => setFormData({ ...formData, businessType: type })}
                        className={`p-4 rounded-2xl border text-left transition-all ${
                          formData.businessType === type 
                            ? 'bg-violet-600/10 border-violet-500 text-white shadow-lg shadow-violet-500/5' 
                            : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <Store className={`w-5 h-5 mb-2 ${formData.businessType === type ? 'text-violet-400' : 'text-slate-600'}`} />
                        <span className="font-bold text-sm">{type}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Category */}
              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Select Category</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setFormData({ ...formData, businessCategory: cat })}
                        className={`p-3 rounded-xl border text-center text-sm font-medium transition-all ${
                          formData.businessCategory === cat 
                            ? 'bg-violet-600/10 border-violet-500 text-white' 
                            : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Identity */}
              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Business Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Business Name</label>
                      <input 
                        type="text"
                        value={formData.businessName}
                        onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-violet-500 outline-none transition-all"
                        placeholder="e.g. NextGen Electronics"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Description</label>
                      <textarea 
                        rows={4}
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-violet-500 outline-none transition-all resize-none"
                        placeholder="Describe your business and services..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Media & Branding */}
              {step === 4 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-white">Media & Branding</h3>
                  
                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Business Banner</label>
                    <div 
                      onClick={() => { setActiveMediaTarget('banner'); setIsMediaPickerOpen(true); }}
                      className="relative h-40 w-full rounded-2xl bg-slate-950 border-2 border-dashed border-slate-800 overflow-hidden cursor-pointer hover:border-violet-500 transition-all group"
                    >
                      {formData.banner ? (
                        <>
                          <img src={formData.banner} alt="Banner" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Camera className="w-8 h-8 text-white" />
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                          <ImageIcon className="w-10 h-10 mb-2" />
                          <span className="text-xs font-bold">Upload Business Banner</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-8 items-end">
                    <div className="space-y-4">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Business Logo</label>
                      <div 
                        onClick={() => { setActiveMediaTarget('logo'); setIsMediaPickerOpen(true); }}
                        className="relative w-32 h-32 rounded-2xl bg-slate-950 border-2 border-dashed border-slate-800 overflow-hidden cursor-pointer hover:border-violet-500 transition-all group"
                      >
                        {formData.logo ? (
                          <>
                            <img src={formData.logo} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Camera className="w-6 h-6 text-white" />
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                            <ImageIcon className="w-8 h-8 mb-2" />
                            <span className="text-[10px] font-bold">Upload Logo</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                      <p className="text-sm text-slate-400 italic">
                        Enterprise profiles with high-quality media receive 5x more engagement on the Pi Business Market.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Location */}
              {step === 5 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Location Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Country</label>
                      <input 
                        type="text"
                        value={formData.country}
                        onChange={e => setFormData({ ...formData, country: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-violet-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">City</label>
                      <input 
                        type="text"
                        value={formData.city}
                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-violet-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">State / Region</label>
                      <input 
                        type="text"
                        value={formData.state}
                        onChange={e => setFormData({ ...formData, state: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-violet-500 outline-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Full Address</label>
                      <input 
                        type="text"
                        value={formData.address}
                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-violet-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 6: Contact */}
              {step === 6 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Contact Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Business Email</label>
                      <input 
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-violet-500 outline-none"
                        placeholder="contact@business.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Phone Number</label>
                      <input 
                        type="tel"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-violet-500 outline-none"
                        placeholder="+1 234 567 890"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Website (Optional)</label>
                      <input 
                        type="url"
                        value={formData.website}
                        onChange={e => setFormData({ ...formData, website: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-violet-500 outline-none"
                        placeholder="https://www.business.com"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 7: Review */}
              {step === 7 && (
                <div className="space-y-6">
                  <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
                    <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
                      {formData.logo ? (
                        <img src={formData.logo} alt="" className="w-12 h-12 rounded-xl object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-white text-lg">{formData.businessName}</h4>
                        <p className="text-slate-400 text-sm">{formData.businessType} • {formData.businessCategory}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                      <div className="space-y-1">
                        <p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest">Location</p>
                        <p className="text-slate-300">{formData.city}, {formData.country}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest">Contact</p>
                        <p className="text-slate-300">{formData.phone}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800">
                      <p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest mb-2">Profile Status</p>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        Ready to Launch
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm font-medium">
                      {error}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={step === 1 || loading}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed font-bold"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          {step < 7 ? (
            <button
              onClick={nextStep}
              disabled={!isStepValid()}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-lg shadow-violet-600/20"
            >
              Next Step
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white transition-all disabled:opacity-50 font-bold shadow-xl shadow-violet-600/20"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  Launch Business
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>

      <MediaPickerModal 
        isOpen={isMediaPickerOpen}
        onClose={() => { setIsMediaPickerOpen(false); setActiveMediaTarget(null); }}
        ownerUid={user?.uid || ''}
        module="businesses"
        onSelect={(asset) => {
          if (activeMediaTarget === 'logo') setFormData({ ...formData, logo: asset.downloadUrl });
          if (activeMediaTarget === 'banner') setFormData({ ...formData, banner: asset.downloadUrl });
        }}
        title={`Select Business ${activeMediaTarget === 'logo' ? 'Logo' : 'Banner'}`}
      />
    </div>
  );
};
