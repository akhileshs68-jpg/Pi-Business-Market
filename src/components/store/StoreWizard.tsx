import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Store, 
  MapPin, 
  Clock, 
  ChevronRight, 
  ChevronLeft,
  LayoutDashboard,
  CheckCircle2,
  Building2,
  Globe,
  Settings2,
  ShoppingBag,
  Truck,
  Package,
  Image as ImageIcon,
  Camera,
  Trash2
} from 'lucide-react';
import { StoreType, Business, OpeningHours, MediaAsset } from '../../types';
import { storeService } from '../../services/storeService';
import { businessService } from '../../services/businessService';
import { useAuth } from '../../auth/useAuth';
import { MediaPickerModal } from '../product/MediaPickerModal';

const STORE_TYPES: StoreType[] = [
  'Physical Store', 'Online Store', 'Hybrid Store', 'Service Center', 
  'Restaurant', 'Hotel', 'Wholesale', 'Retail'
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface StoreWizardProps {
  onComplete: (storeId: string) => void;
  onCancel: () => void;
}

export const StoreWizard: React.FC<StoreWizardProps> = ({ onComplete, onCancel }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);

  const [formData, setFormData] = useState({
    businessId: '',
    storeType: 'Retail' as StoreType,
    storeCategory: 'Electronics',
    storeName: '',
    description: '',
    email: '',
    phone: '',
    website: '',
    country: 'USA',
    state: '',
    city: '',
    address: '',
    openingHours: DAYS.map(day => ({ day, open: '09:00', close: '18:00', closed: false })) as OpeningHours[],
    deliveryAvailable: false,
    pickupAvailable: true,
    logoUrl: '',
    logoPublicId: '',
    coverImageUrl: '',
    coverPublicId: ''
  });

  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [activeMediaTarget, setActiveMediaTarget] = useState<'logo' | 'banner' | null>(null);

  useEffect(() => {
    const fetchBusinesses = async () => {
      if (!user) return;
      const data = await businessService.getMyBusinesses(user.uid);
      setBusinesses(data);
      if (data.length > 0) setFormData(prev => ({ ...prev, businessId: data[0].id }));
    };
    fetchBusinesses();
  }, [user]);

  const nextStep = () => setStep(s => Math.min(s + 1, 7));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleCreate = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const slug = await storeService.generateUniqueSlug(formData.storeName);
      
      const newStoreId = await storeService.createStore({
        ownerUid: user.uid,
        ...formData,
        storeSlug: slug,
        latitude: 0,
        longitude: 0,
        status: 'active'
      });

      onComplete(newStoreId);
    } catch (err: any) {
      setError(err.message || 'Failed to create store profile');
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1: return !!formData.businessId;
      case 2: return !!formData.storeType;
      case 3: return formData.storeName.length >= 3 && !!formData.description && !!formData.email && !!formData.phone;
      case 4: return true; // Media is optional
      case 5: return !!formData.country && !!formData.city && !!formData.address;
      default: return true;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center border border-indigo-500/20">
              <ShoppingBag className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white leading-none mb-1">Store Creation Wizard</h2>
              <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Step {step} of 7</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-slate-500 hover:text-white transition-colors">Cancel</button>
        </div>

        {/* Progress */}
        <div className="h-1 bg-slate-800 w-full">
          <motion.div className="h-full bg-indigo-500" animate={{ width: `${(step / 7) * 100}%` }} />
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Step 1: Select Business */}
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Associate with Business</h3>
                  <div className="space-y-3">
                    {businesses.length === 0 ? (
                      <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200">
                        <p className="font-bold mb-2">No Business Profiles Found</p>
                        <p className="text-sm">You must create a business profile before you can open a store.</p>
                      </div>
                    ) : (
                      businesses.map(biz => (
                        <button
                          key={biz.id}
                          onClick={() => setFormData({ ...formData, businessId: biz.id })}
                          className={`w-full p-4 rounded-2xl border text-left flex items-center gap-4 transition-all ${
                            formData.businessId === biz.id 
                              ? 'bg-indigo-600/10 border-indigo-500 text-white' 
                              : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <Building2 className={`w-6 h-6 ${formData.businessId === biz.id ? 'text-indigo-400' : 'text-slate-600'}`} />
                          <div className="flex-1">
                            <p className="font-bold">{biz.businessName}</p>
                            <p className="text-xs opacity-60">{biz.businessType} • {biz.city}</p>
                          </div>
                          {formData.businessId === biz.id && <CheckCircle2 className="w-5 h-5 text-indigo-400" />}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Store Type */}
              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Select Store Type</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {STORE_TYPES.map(type => (
                      <button
                        key={type}
                        onClick={() => setFormData({ ...formData, storeType: type })}
                        className={`p-4 rounded-2xl border text-left transition-all ${
                          formData.storeType === type 
                            ? 'bg-indigo-600/10 border-indigo-500 text-white' 
                            : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <Store className={`w-5 h-5 mb-2 ${formData.storeType === type ? 'text-indigo-400' : 'text-slate-600'}`} />
                        <span className="font-bold text-sm">{type}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Information */}
              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Store Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Store Name</label>
                      <input 
                        type="text" 
                        value={formData.storeName}
                        onChange={e => setFormData({ ...formData, storeName: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500"
                        placeholder="e.g. Patna Electronics Store"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Description</label>
                      <textarea 
                        rows={3}
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Email</label>
                      <input 
                        type="email" 
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Phone</label>
                      <input 
                        type="tel" 
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500"
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
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Store Banner</label>
                    <div 
                      onClick={() => { setActiveMediaTarget('banner'); setIsMediaPickerOpen(true); }}
                      className="relative h-40 w-full rounded-2xl bg-slate-950 border-2 border-dashed border-slate-800 overflow-hidden cursor-pointer hover:border-indigo-500 transition-all group"
                    >
                      {formData.coverImageUrl ? (
                        <>
                          <img src={formData.coverImageUrl} alt="Banner" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Camera className="w-8 h-8 text-white" />
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                          <ImageIcon className="w-10 h-10 mb-2" />
                          <span className="text-xs font-bold">Upload Store Banner</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-8 items-end">
                    <div className="space-y-4">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Store Logo</label>
                      <div 
                        onClick={() => { setActiveMediaTarget('logo'); setIsMediaPickerOpen(true); }}
                        className="relative w-32 h-32 rounded-2xl bg-slate-950 border-2 border-dashed border-slate-800 overflow-hidden cursor-pointer hover:border-indigo-500 transition-all group"
                      >
                        {formData.logoUrl ? (
                          <>
                            <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
                        Professional branding increases customer trust and conversion rates by up to 40% on the Pi Network.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Location */}
              {step === 5 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Store Location</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Address</label>
                      <input 
                        type="text" 
                        value={formData.address}
                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">City</label>
                      <input 
                        type="text" 
                        value={formData.city}
                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Country</label>
                      <input 
                        type="text" 
                        value={formData.country}
                        onChange={e => setFormData({ ...formData, country: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none"
                      />
                    </div>
                    <div className="col-span-2 flex gap-4 pt-4">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={formData.deliveryAvailable}
                          onChange={e => setFormData({ ...formData, deliveryAvailable: e.target.checked })}
                          className="hidden" 
                        />
                        <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${formData.deliveryAvailable ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-950 border-slate-800'}`}>
                          {formData.deliveryAvailable && <Truck className="w-4 h-4 text-white" />}
                        </div>
                        <span className="text-sm font-bold text-slate-400 group-hover:text-white">Delivery Available</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={formData.pickupAvailable}
                          onChange={e => setFormData({ ...formData, pickupAvailable: e.target.checked })}
                          className="hidden" 
                        />
                        <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${formData.pickupAvailable ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-950 border-slate-800'}`}>
                          {formData.pickupAvailable && <Package className="w-4 h-4 text-white" />}
                        </div>
                        <span className="text-sm font-bold text-slate-400 group-hover:text-white">Pickup Available</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 6: Hours */}
              {step === 6 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Business Hours</h3>
                  <div className="space-y-3">
                    {formData.openingHours.map((oh, idx) => (
                      <div key={oh.day} className="flex items-center gap-4 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                        <span className="w-24 text-sm font-bold text-slate-400">{oh.day}</span>
                        <div className="flex-1 flex items-center gap-2">
                          {!oh.closed ? (
                            <>
                              <input 
                                type="time" 
                                value={oh.open}
                                onChange={e => {
                                  const newHours = [...formData.openingHours];
                                  newHours[idx].open = e.target.value;
                                  setFormData({ ...formData, openingHours: newHours });
                                }}
                                className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white"
                              />
                              <span className="text-slate-600">to</span>
                              <input 
                                type="time" 
                                value={oh.close}
                                onChange={e => {
                                  const newHours = [...formData.openingHours];
                                  newHours[idx].close = e.target.value;
                                  setFormData({ ...formData, openingHours: newHours });
                                }}
                                className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white"
                              />
                            </>
                          ) : (
                            <span className="text-xs font-bold text-red-500/60 uppercase">Closed</span>
                          )}
                        </div>
                        <button 
                          onClick={() => {
                            const newHours = [...formData.openingHours];
                            newHours[idx].closed = !oh.closed;
                            setFormData({ ...formData, openingHours: newHours });
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${oh.closed ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-500'}`}
                        >
                          {oh.closed ? 'Closed' : 'Open'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 7: Review */}
              {step === 7 && (
                <div className="space-y-6">
                  <div className="p-6 bg-indigo-600/10 border border-indigo-500/20 rounded-3xl">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center">
                        <ShoppingBag className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-white">{formData.storeName}</h4>
                        <p className="text-indigo-300 font-medium">{formData.storeType} Outlet</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 text-sm">
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Business Partner</p>
                        <p className="text-slate-300 truncate">
                          {businesses.find(b => b.id === formData.businessId)?.businessName || 'N/A'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Contact Info</p>
                        <p className="text-slate-300">{formData.phone}</p>
                      </div>
                      <div className="space-y-1 col-span-2 border-t border-indigo-500/10 pt-4">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Address</p>
                        <p className="text-slate-300">{formData.address}, {formData.city}, {formData.country}</p>
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

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={step === 1 || loading}
            className="px-6 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 font-bold hover:text-white transition-all disabled:opacity-30"
          >
            Back
          </button>

          {step < 7 ? (
            <button
              onClick={nextStep}
              disabled={!isStepValid()}
              className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all disabled:opacity-50"
            >
              Next Step
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={loading}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Launch Store'}
            </button>
          )}
        </div>
      </motion.div>

      <MediaPickerModal 
        isOpen={isMediaPickerOpen}
        onClose={() => { setIsMediaPickerOpen(false); setActiveMediaTarget(null); }}
        ownerUid={user?.uid || ''}
        module="stores"
        onSelect={(asset) => {
          if (activeMediaTarget === 'logo') setFormData({ ...formData, logoUrl: asset.downloadUrl, logoPublicId: asset.storagePath });
          if (activeMediaTarget === 'banner') setFormData({ ...formData, coverImageUrl: asset.downloadUrl, coverPublicId: asset.storagePath });
        }}
        title={`Select Store ${activeMediaTarget === 'logo' ? 'Logo' : 'Banner'}`}
      />
    </div>
  );
};
