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
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../auth/useAuth';
import { businessService } from '../../services/businessService';
import { businessCategoryService } from '../../services/businessCategoryService';
import { businessVerificationService } from '../../services/businessVerificationService';
import { mediaService } from '../../services/mediaService';
import { Business, BusinessType, BusinessCategory } from '../../types';

interface WizardProps {
  onComplete: (businessId: string) => void;
  onCancel: () => void;
}

export const BusinessWizard: React.FC<WizardProps> = ({ onComplete, onCancel }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const totalSteps = 9;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<BusinessCategory[]>([]);

  // Wizard State
  const [formData, setFormData] = useState<Partial<Business>>({
    businessType: 'Individual',
    businessName: '',
    legalName: '',
    displayName: '',
    industry: '',
    category: '',
    subcategory: '',
    description: '',
    email: user?.email || '',
    phone: '',
    alternatePhone: '',
    website: '',
    country: 'India', // Default for Pi Network prevalence
    state: '',
    city: '',
    postalCode: '',
    fullAddress: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    currency: 'Pi',
    language: 'English',
    verificationStatus: 'Pending',
    businessStatus: 'active',
  });

  const [docs, setDocs] = useState<{ type: string; file: File | null; name: string }[]>([]);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [activeDocType, setActiveDocType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover' | 'document') => {
    const file = e.target.files?.[0];
    console.log(`[BusinessWizard] File selected for ${type}:`, file?.name);
    
    if (!file) {
      console.warn(`[BusinessWizard] No file selected for ${type}`);
      return;
    }
    
    // Validate file
    if (file.size > 10 * 1024 * 1024) {
      console.error(`[BusinessWizard] File too large: ${file.size} bytes`);
      setError('File size must be less than 10MB');
      return;
    }

    if (!user) {
      console.error('[BusinessWizard] User not authenticated for upload');
      return;
    }

    try {
      console.log(`[BusinessWizard] Starting upload for ${type}...`);
      
      // For images, show local preview immediately
      if (type === 'logo') {
        setFormData(prev => ({ ...prev, logo: URL.createObjectURL(file) }));
      } else if (type === 'cover') {
        setFormData(prev => ({ ...prev, coverImage: URL.createObjectURL(file) }));
      }

      const asset = await mediaService.uploadMedia(file, user.uid, {
        module: 'businesses',
        onProgress: (progress: number) => {
          console.log(`[BusinessWizard] ${type} upload progress: ${progress}%`);
        }
      });
      
      console.log(`[BusinessWizard] ${type} upload success:`, asset.downloadUrl);
      
      if (type === 'logo') {
        setFormData(prev => ({ ...prev, logo: asset.downloadUrl }));
      } else if (type === 'cover') {
        setFormData(prev => ({ ...prev, coverImage: asset.downloadUrl }));
      } else if (type === 'document' && activeDocType) {
        setDocs(prev => {
          const filtered = prev.filter(d => d.type !== activeDocType);
          return [...filtered, { type: activeDocType, file: null, name: asset.originalName, url: asset.downloadUrl } as any];
        });
      }
    } catch (err) {
      console.error(`[BusinessWizard] ${type} upload failed:`, err);
      setError(`Failed to upload ${type}. Please try again.`);
    }
  };

  useEffect(() => {
    const loadCategories = async () => {
      const cats = await businessCategoryService.getAllCategories();
      setCategories(cats);
    };
    loadCategories();
  }, []);

  const handleNext = () => setStep(s => Math.min(s + 1, totalSteps));
  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const businessId = await businessService.createBusiness(
        user.uid,
        user.displayName || 'Owner',
        formData as any
      );

      // Upload docs (Simulated for this implementation as we don't have a real storage bucket setup yet)
      // In a real app, we'd loop through `docs` and call businessVerificationService.uploadDocument

      onComplete(businessId);
    } catch (err) {
      console.error('Failed to create business:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (step / totalSteps) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl shadow-indigo-500/10 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Progress Header */}
        <div className="px-8 pt-8 pb-6 border-b border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-xl">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Business Onboarding</h2>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Step {step} of {totalSteps}: {getStepTitle(step)}</p>
              </div>
            </div>
            <button onClick={onCancel} className="p-2 hover:bg-slate-800 rounded-full transition-all">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-indigo-600 to-violet-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        {/* Wizard Steps */}
        <div className="flex-1 overflow-y-auto px-8 py-10 scrollbar-hide">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {step === 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {BUSINESS_TYPES.map(type => (
                    <button
                      key={type.id}
                      onClick={() => setFormData({ ...formData, businessType: type.id as BusinessType })}
                      className={`p-6 rounded-2xl border text-left transition-all group ${
                        formData.businessType === type.id 
                          ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-500/20' 
                          : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <type.icon className={`w-8 h-8 mb-4 ${formData.businessType === type.id ? 'text-white' : 'text-slate-500'}`} />
                      <h4 className={`text-sm font-bold ${formData.businessType === type.id ? 'text-white' : 'text-slate-300'}`}>{type.label}</h4>
                      <p className={`text-[10px] mt-1 leading-relaxed ${formData.businessType === type.id ? 'text-indigo-100' : 'text-slate-500'}`}>{type.desc}</p>
                    </button>
                  ))}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 max-w-2xl mx-auto">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Business Public Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Acme Tech Solutions"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-indigo-500 transition-all"
                      value={formData.businessName}
                      onChange={e => setFormData({ ...formData, businessName: e.target.value, displayName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Legal Entity Name (As per Documents)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Acme Technologies Pvt Ltd"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-indigo-500 transition-all"
                      value={formData.legalName}
                      onChange={e => setFormData({ ...formData, legalName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Business Description</label>
                    <textarea 
                      rows={4}
                      placeholder="Tell us what your business does..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-indigo-500 transition-all resize-none"
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                   <div className="col-span-full">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Full Registered Address</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-indigo-500 transition-all"
                      value={formData.fullAddress}
                      onChange={e => setFormData({ ...formData, fullAddress: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">City</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-indigo-500 transition-all"
                      value={formData.city}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Postal Code</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-indigo-500 transition-all"
                      value={formData.postalCode}
                      onChange={e => setFormData({ ...formData, postalCode: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6 max-w-2xl mx-auto">
                  <div className="flex items-center gap-4 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl mb-4">
                    <Mail className="w-5 h-5 text-indigo-400" />
                    <p className="text-xs text-slate-400 font-medium">Verify your contact details for official communications.</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Business Email Address</label>
                    <input 
                      type="email" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-indigo-500 transition-all"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Primary Phone Number</label>
                    <input 
                      type="tel" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-indigo-500 transition-all"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-8 max-w-3xl mx-auto">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['Retail', 'IT', 'Manufacturing', 'Finance', 'Education', 'Healthcare', 'Agriculture', 'Logistics'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setFormData({ ...formData, category: cat })}
                        className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all ${
                          formData.category === cat 
                            ? 'bg-indigo-600 border-indigo-500 text-white' 
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Industry Focus</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Artificial Intelligence, Real Estate Tech"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-indigo-500 transition-all"
                      value={formData.industry}
                      onChange={e => setFormData({ ...formData, industry: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {step === 6 && (
                <div className="space-y-6 max-w-2xl mx-auto">
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
                    <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Verification Documents
                    </h4>
                    <div className="space-y-4">
                      {['GST Certificate', 'Company PAN', 'Trade License'].map(docType => (
                        <div key={docType} className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-slate-500" />
                            <span className="text-xs font-bold text-slate-300">{docType}</span>
                          </div>
                          <button 
                            onClick={() => {
                              console.log(`[Upload] Selecting document for: ${docType}`);
                              setActiveDocType(docType);
                              docInputRef.current?.click();
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] font-bold text-white transition-all"
                          >
                            <Upload className="w-3 h-3" /> 
                            {docs.find(d => d.type === docType) ? 'Replace' : 'Upload'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <input 
                    type="file"
                    ref={docInputRef}
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, 'document')}
                  />
                </div>
              )}

              {step === 7 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                  <div className="space-y-4">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Business Logo</label>
                    <input 
                      type="file"
                      ref={logoInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleFileSelect(e, 'logo')}
                    />
                    <div 
                      onClick={() => {
                        console.log('[Upload] Opening logo file picker');
                        logoInputRef.current?.click();
                      }}
                      className="w-32 h-32 bg-slate-950 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-indigo-500 transition-all group overflow-hidden"
                    >
                      {formData.logo ? (
                        <img src={formData.logo} alt="Logo Preview" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <ImageIcon className="w-6 h-6 text-slate-600 group-hover:text-indigo-400" />
                          <span className="text-[10px] font-bold text-slate-600">Square SVG</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cover Image</label>
                    <input 
                      type="file"
                      ref={coverInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleFileSelect(e, 'cover')}
                    />
                    <div 
                      onClick={() => {
                        console.log('[Upload] Opening cover file picker');
                        coverInputRef.current?.click();
                      }}
                      className="w-full h-32 bg-slate-950 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-indigo-500 transition-all group overflow-hidden"
                    >
                      {formData.coverImage ? (
                        <img src={formData.coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <ImageIcon className="w-6 h-6 text-slate-600 group-hover:text-indigo-400" />
                          <span className="text-[10px] font-bold text-slate-600">Landscape 16:9</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {step === 8 && (
                <div className="space-y-6 max-w-2xl mx-auto">
                  <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden">
                    <div className="h-24 bg-gradient-to-r from-indigo-900 to-violet-900" />
                    <div className="px-8 pb-8 -mt-10">
                      <div className="w-20 h-20 bg-slate-900 border-4 border-slate-950 rounded-2xl flex items-center justify-center mb-4">
                        <Building2 className="w-8 h-8 text-indigo-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white">{formData.businessName || 'Business Name'}</h3>
                      <p className="text-sm text-slate-500">{formData.businessType} • {formData.category}</p>
                      <div className="mt-6 grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                          <p className="text-[10px] font-bold text-slate-600 uppercase mb-1">Legal Entity</p>
                          <p className="text-xs text-slate-300 font-medium">{formData.legalName || 'N/A'}</p>
                        </div>
                        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                          <p className="text-[10px] font-bold text-slate-600 uppercase mb-1">Location</p>
                          <p className="text-xs text-slate-300 font-medium">{formData.city || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 9 && (
                <div className="flex flex-col items-center justify-center text-center py-10 space-y-6">
                  <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white tracking-tight">Ready for Deployment</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mt-2 leading-relaxed">
                      Your business profile and verification documents are prepared. Click below to launch your identity on the Pi Business Market.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-6 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={step === 1 || isSubmitting}
            className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-slate-400 hover:text-white transition-all disabled:opacity-0"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          
          {step < totalSteps ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-8 py-3 bg-white text-slate-950 rounded-xl font-bold hover:bg-slate-200 transition-all shadow-xl shadow-white/5"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-10 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>Deploying Identity...</>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Finalize & Launch
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const getStepTitle = (step: number) => {
  switch(step) {
    case 1: return 'Business Entity Type';
    case 2: return 'Basic Profile';
    case 3: return 'Operational Address';
    case 4: return 'Governance Contacts';
    case 5: return 'Industry Classification';
    case 6: return 'Regulatory Compliance';
    case 7: return 'Brand Identity';
    case 8: return 'Visual Review';
    case 9: return 'Submission';
    default: return '';
  }
};

const BUSINESS_TYPES = [
  { id: 'Individual', label: 'Individual', icon: User, desc: 'Single owner, no legal registration.' },
  { id: 'Sole Proprietorship', label: 'Proprietorship', icon: Building2, desc: 'Regulated single-owner business.' },
  { id: 'Partnership', label: 'Partnership', icon: Briefcase, desc: 'Multiple partners sharing liability.' },
  { id: 'Private Limited', label: 'Pvt Ltd', icon: Zap, desc: 'Private corporation with limited liability.' },
  { id: 'Public Limited', label: 'Public Ltd', icon: Building2, desc: 'Corporation with publicly traded shares.' },
  { id: 'NGO', label: 'NGO / Trust', icon: ShieldCheck, desc: 'Non-profit or social enterprise.' },
];

export default BusinessWizard;
