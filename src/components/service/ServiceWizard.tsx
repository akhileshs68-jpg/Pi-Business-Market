/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronLeft,
  Loader2,
  Briefcase,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Globe,
  Database,
  Tag,
  ShieldCheck,
  Building2,
  UserCheck,
  FileText,
  Calendar,
  Image as ImageIcon,
  Award,
  FileCode,
  DollarSign,
  Send,
  Video
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '../../firebase/config';
import { useAuth } from '../../auth/useAuth';
import { EnterpriseServiceEngine } from '../../core/service/enterpriseServiceEngine';
import { mediaService } from '../../services/mediaService';

interface ServiceWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  businessId: string;
}

const BUSINESS_TYPES = [
  'Freelancer',
  'Consultant',
  'Teacher',
  'Doctor',
  'Lawyer',
  'Repair',
  'Electrician',
  'Plumber',
  'Mechanic',
  'Designer',
  'Developer',
  'Digital Marketing',
  'NGO',
  'Education',
  'Healthcare',
  'Beauty',
  'Home Service',
  'Transport',
  'Other'
];

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const ServiceWizard: React.FC<ServiceWizardProps> = ({
  isOpen,
  onClose,
  onSuccess,
  businessId
}) => {
  // ALL HOOKS MUST BE DECLARED UNCONDITIONALLY AT THE TOP
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Business Type
  const [businessType, setBusinessType] = useState<string>('Freelancer');

  // Step 2: Service Information
  const [serviceName, setServiceName] = useState<string>('');
  const [category, setCategory] = useState<string>('Digital Services & Tech');
  const [subCategory, setSubCategory] = useState<string>('Software Engineering');
  const [description, setDescription] = useState<string>('');
  const [experience, setExperience] = useState<string>('3+ Years');
  const [languages, setLanguages] = useState<string[]>(['English']);
  const [langInput, setLangInput] = useState<string>('');
  const [priceType, setPriceType] = useState<'Hourly' | 'Fixed' | 'Negotiable'>('Fixed');
  const [minPrice, setMinPrice] = useState<number>(25);
  const [maxPrice, setMaxPrice] = useState<number>(150);

  // Step 3: Location
  const [country, setCountry] = useState<string>('United States');
  const [state, setState] = useState<string>('California');
  const [district, setDistrict] = useState<string>('San Francisco');
  const [city, setCity] = useState<string>('San Francisco');
  const [pin, setPin] = useState<string>('94105');
  const [serviceRadius, setServiceRadius] = useState<number>(50);
  const [locationType, setLocationType] = useState<'Online Service' | 'On-site Service' | 'Hybrid'>('Online Service');

  // Step 4: Availability
  const [workingDays, setWorkingDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [workingHours, setWorkingHours] = useState<string>('09:00 AM - 06:00 PM');
  const [holiday, setHoliday] = useState<string>('Sunday & Public Holidays');
  const [emergencyService, setEmergencyService] = useState<boolean>(false);

  // Step 5: Portfolio
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500'
  ]);
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const [video, setVideo] = useState<string>('');
  const [certificates, setCertificates] = useState<string[]>(['Verified Industry Specialist']);
  const [certInput, setCertInput] = useState<string>('');
  const [documents, setDocuments] = useState<string[]>(['Service_Specification.pdf']);
  const [docInput, setDocInput] = useState<string>('');

  // Step 5 Upload states
  const [imageUploadState, setImageUploadState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [imageUploadProgress, setImageUploadProgress] = useState<number>(0);
  const [certUploading, setCertUploading] = useState<boolean>(false);
  const [certProgress, setCertProgress] = useState<number>(0);
  const [certUploadError, setCertUploadError] = useState<string | null>(null);
  const [docUploading, setDocUploading] = useState<boolean>(false);
  const [docProgress, setDocProgress] = useState<number>(0);
  const [docUploadError, setDocUploadError] = useState<string | null>(null);

  // Reset or initialize state when wizard opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setError(null);
    }
  }, [isOpen]);

  // CONDITIONAL EARLY RETURN MUST COME STRICTLY AFTER ALL HOOKS
  if (!isOpen) return null;

  const handleAddLanguage = () => {
    if (langInput.trim() && !languages.includes(langInput.trim())) {
      setLanguages([...languages, langInput.trim()]);
      setLangInput('');
    }
  };

  const handleRemoveLanguage = (lang: string) => {
    setLanguages(languages.filter(l => l !== lang));
  };

  const toggleWorkingDay = (day: string) => {
    if (workingDays.includes(day)) {
      setWorkingDays(workingDays.filter(d => d !== day));
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  const handleAddImage = () => {
    if (imageUrlInput.trim() && !images.includes(imageUrlInput.trim())) {
      setImages([...images, imageUrlInput.trim()]);
      setImageUrlInput('');
    }
  };

  const handleAddCertificate = () => {
    if (certInput.trim() && !certificates.includes(certInput.trim())) {
      setCertificates([...certificates, certInput.trim()]);
      setCertInput('');
    }
  };

  const handleAddDocument = () => {
    if (docInput.trim() && !documents.includes(docInput.trim())) {
      setDocuments([...documents, docInput.trim()]);
      setDocInput('');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only JPG, JPEG, PNG, and WEBP image formats are allowed.');
      setImageUploadState('error');
      return;
    }

    // Validate size (10MB limit)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert('Image exceeds the maximum allowed size of 10MB.');
      setImageUploadState('error');
      return;
    }

    setImageUploadState('uploading');
    setImageUploadProgress(0);

    try {
      const asset = await mediaService.uploadMedia(file, user?.uid || 'anonymous', {
        module: 'services',
        businessId: businessId || 'PI-CORP-001',
        onProgress: (p) => setImageUploadProgress(p)
      });

      if (asset && asset.downloadUrl) {
        if (images.includes(asset.downloadUrl)) {
          alert('This image has already been uploaded.');
          setImageUploadState('idle');
          return;
        }
        setImages(prev => [...prev, asset.downloadUrl]);
        setImageUploadState('success');
        setTimeout(() => setImageUploadState('idle'), 3000);
      } else {
        throw new Error('No download URL returned');
      }
    } catch (err: any) {
      console.error('Image upload failed:', err);
      setImageUploadState('error');
    }
  };

  const handleCertificateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setCertUploadError('Only PDF, JPG, JPEG, PNG, and WEBP formats are allowed.');
      return;
    }

    // Validate size (10MB limit)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setCertUploadError('File exceeds the maximum allowed size of 10MB.');
      return;
    }

    setCertUploading(true);
    setCertProgress(0);
    setCertUploadError(null);

    try {
      const asset = await mediaService.uploadMedia(file, user?.uid || 'anonymous', {
        module: 'services',
        businessId: businessId || 'PI-CORP-001',
        onProgress: (p) => setCertProgress(p)
      });

      if (asset && asset.downloadUrl) {
        if (certificates.includes(asset.downloadUrl)) {
          setCertUploadError('This certificate has already been uploaded.');
          setCertUploading(false);
          return;
        }
        setCertificates(prev => [...prev, asset.downloadUrl]);
        setCertProgress(100);
        setTimeout(() => {
          setCertUploading(false);
          setCertProgress(0);
        }, 1500);
      } else {
        throw new Error('No download URL returned');
      }
    } catch (err: any) {
      console.error('Certificate upload failed:', err);
      setCertUploadError('Upload failed — Please try again.');
      setCertUploading(false);
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (!allowedTypes.includes(file.type)) {
      setDocUploadError('Only PDF, DOC, and DOCX formats are allowed.');
      return;
    }

    // Validate size (10MB limit)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setDocUploadError('File exceeds the maximum allowed size of 10MB.');
      return;
    }

    setDocUploading(true);
    setDocProgress(0);
    setDocUploadError(null);

    try {
      const asset = await mediaService.uploadMedia(file, user?.uid || 'anonymous', {
        module: 'services',
        businessId: businessId || 'PI-CORP-001',
        onProgress: (p) => setDocProgress(p)
      });

      if (asset && asset.downloadUrl) {
        if (documents.includes(asset.downloadUrl)) {
          setDocUploadError('This document has already been uploaded.');
          setDocUploading(false);
          return;
        }
        setDocuments(prev => [...prev, asset.downloadUrl]);
        setDocProgress(100);
        setTimeout(() => {
          setDocUploading(false);
          setDocProgress(0);
        }, 1500);
      } else {
        throw new Error('No download URL returned');
      }
    } catch (err: any) {
      console.error('Document upload failed:', err);
      setDocUploadError('Upload failed — Please try again.');
      setDocUploading(false);
    }
  };

  const handlePublish = async () => {
    setLoading(true);
    setError(null);
    try {
      const db = getFirebaseDb();
      const serviceId = 'srv_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
      const ownerId = user?.uid || 'provider_' + (businessId || 'default');

      const serviceData = {
        serviceId,
        ownerId,
        businessId: businessId || 'PI-CORP-001',
        businessType,
        serviceName: serviceName || 'Professional Service',
        title: serviceName || 'Professional Service',
        category,
        subCategory,
        description,
        experience,
        languages,
        pricingType: priceType.toLowerCase(),
        priceType,
        minPrice: Number(minPrice) || 0,
        maxPrice: Number(maxPrice) || 0,
        basePrice: Number(minPrice) || 0,
        currency: 'π',
        location: {
          country,
          state,
          district,
          city,
          pin,
          serviceRadius: Number(serviceRadius) || 0,
          locationType
        },
        locationType,
        availability: {
          workingDays,
          workingHours,
          holiday,
          emergencyService
        },
        portfolio: {
          images,
          video,
          certificates,
          documents
        },
        mainImage: images[0] || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500',
        duration: 60,
        status: 'published',
        featured: true,
        rating: 5.0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'services', serviceId), serviceData);

      // Re-index into Enterprise Universal Search Engine
      await EnterpriseServiceEngine.saveService({
        serviceId,
        ownerUid: ownerId,
        businessId: businessId || 'PI-CORP-001',
        title: serviceName || 'Professional Service',
        category,
        subCategory,
        description,
        pricingType: priceType.toLowerCase() as any,
        basePrice: Number(minPrice) || 0,
        currency: 'π',
        locationType: locationType.toLowerCase().includes('online') ? 'online' : 'on-site',
        status: 'published',
        visibility: 'public',
        featured: true,
        rating: 5.0,
        mainImage: images[0] || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500',
        imageUrls: images,
        emergencyService
      }, true, serviceId);

      onSuccess();
      onClose();
      // Navigate to Business Center / My Services
      navigate('/services');
    } catch (err: any) {
      console.error('Service publish error:', err);
      setError(err.message || 'Failed to publish service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-violet-600 rounded-2xl shadow-lg shadow-violet-600/20">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white leading-none mb-1">Service Registration Wizard</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                <Database className="w-3 h-3 text-violet-400" />
                Step {step} of 6 — {
                  step === 1 ? 'Business Type' :
                  step === 2 ? 'Service Information' :
                  step === 3 ? 'Location & Scope' :
                  step === 4 ? 'Availability Rules' :
                  step === 5 ? 'Portfolio & Credentials' :
                  'Preview & Publish'
                }
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="h-1 bg-slate-800 w-full flex">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div 
              key={i} 
              className={`flex-1 h-full transition-all duration-300 ${i <= step ? 'bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.6)]' : 'bg-slate-800'}`} 
            />
          ))}
        </div>

        {/* Wizard Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 no-scrollbar">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold flex items-center gap-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* STEP 1: BUSINESS TYPE */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Step 1: Select Business Type</h3>
                  <p className="text-sm text-slate-400">Choose the category that best represents your professional discipline.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[45vh] overflow-y-auto pr-2 no-scrollbar">
                  {BUSINESS_TYPES.map((bt) => {
                    const isSelected = businessType === bt;
                    return (
                      <button
                        key={bt}
                        type="button"
                        onClick={() => setBusinessType(bt)}
                        className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 ${
                          isSelected 
                            ? 'bg-violet-600/20 border-violet-500 text-white shadow-lg shadow-violet-600/10 ring-1 ring-violet-500' 
                            : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <UserCheck className={`w-5 h-5 ${isSelected ? 'text-violet-400' : 'text-slate-500'}`} />
                        <span className="text-xs font-bold">{bt}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-6 border-t border-slate-800 flex justify-end">
                  <button 
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-violet-600/20 flex items-center gap-2"
                  >
                    Next: Service Information <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: SERVICE INFORMATION */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Step 2: Service Information</h3>
                  <p className="text-sm text-slate-400">Detail your service title, pricing model, and professional experience.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Service Name *</label>
                    <input 
                      value={serviceName}
                      onChange={(e) => setServiceName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm text-white focus:border-violet-500 outline-none font-bold"
                      placeholder="e.g., Full Stack React & Node Architecture Consulting"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Category</label>
                    <input 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm text-white focus:border-violet-500 outline-none font-bold"
                      placeholder="e.g., Digital Services & Tech"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sub Category</label>
                    <input 
                      value={subCategory}
                      onChange={(e) => setSubCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm text-white focus:border-violet-500 outline-none font-bold"
                      placeholder="e.g., Custom Development"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Description *</label>
                    <textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm text-white focus:border-violet-500 outline-none font-medium h-24 resize-none"
                      placeholder="Provide a comprehensive summary of deliverables, process, and value..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Years of Experience</label>
                    <input 
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm text-white focus:border-violet-500 outline-none font-bold"
                      placeholder="e.g., 5+ Years"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Price Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Hourly', 'Fixed', 'Negotiable'] as const).map(pt => (
                        <button
                          key={pt}
                          type="button"
                          onClick={() => setPriceType(pt)}
                          className={`py-3 rounded-xl border text-center text-xs font-bold transition-all ${
                            priceType === pt 
                              ? 'bg-violet-600 text-white border-violet-500' 
                              : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {pt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Minimum Price (π)</label>
                    <input 
                      type="number"
                      value={minPrice}
                      onChange={(e) => setMinPrice(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm text-white focus:border-violet-500 outline-none font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Maximum Price (π)</label>
                    <input 
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm text-white focus:border-violet-500 outline-none font-bold"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Languages Spoken</label>
                    <div className="flex gap-2">
                      <input 
                        value={langInput}
                        onChange={(e) => setLangInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLanguage())}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-sm text-white focus:border-violet-500 outline-none font-bold"
                        placeholder="Add language (e.g. English, Spanish)..."
                      />
                      <button 
                        type="button" 
                        onClick={handleAddLanguage}
                        className="px-5 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-bold text-xs"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {languages.map(lang => (
                        <span key={lang} className="px-3 py-1 bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2">
                          {lang}
                          <X className="w-3 h-3 cursor-pointer hover:text-red-400" onClick={() => handleRemoveLanguage(lang)} />
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-800 flex justify-between gap-4">
                  <button 
                    type="button" 
                    onClick={() => setStep(1)} 
                    className="px-6 py-4 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button 
                    type="button"
                    disabled={!serviceName.trim() || !description.trim()}
                    onClick={() => setStep(3)}
                    className="px-8 py-4 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-violet-600/20 flex items-center gap-2"
                  >
                    Next: Location & Scope <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: LOCATION */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Step 3: Location & Service Scope</h3>
                  <p className="text-sm text-slate-400">Define your geographic coverage and service delivery model.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Delivery Type</label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['Online Service', 'On-site Service', 'Hybrid'] as const).map(lt => (
                        <button
                          key={lt}
                          type="button"
                          onClick={() => setLocationType(lt)}
                          className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
                            locationType === lt 
                              ? 'bg-violet-600/20 border-violet-500 text-white font-bold ring-1 ring-violet-500' 
                              : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <MapPin className="w-5 h-5 text-violet-400" />
                          <span className="text-xs font-bold">{lt}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Country</label>
                    <input 
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm text-white focus:border-violet-500 outline-none font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">State / Province</label>
                    <input 
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm text-white focus:border-violet-500 outline-none font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">District</label>
                    <input 
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm text-white focus:border-violet-500 outline-none font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">City</label>
                    <input 
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm text-white focus:border-violet-500 outline-none font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Postal PIN Code</label>
                    <input 
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm text-white focus:border-violet-500 outline-none font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Service Radius (KM)</label>
                    <input 
                      type="number"
                      value={serviceRadius}
                      onChange={(e) => setServiceRadius(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm text-white focus:border-violet-500 outline-none font-bold"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-800 flex justify-between gap-4">
                  <button 
                    type="button" 
                    onClick={() => setStep(2)} 
                    className="px-6 py-4 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button 
                    type="button"
                    onClick={() => setStep(4)}
                    className="px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-violet-600/20 flex items-center gap-2"
                  >
                    Next: Availability <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: AVAILABILITY */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Step 4: Availability & Schedule</h3>
                  <p className="text-sm text-slate-400">Configure your operating days, working hours, and emergency response option.</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Working Days</label>
                    <div className="flex flex-wrap gap-2">
                      {WEEK_DAYS.map(day => {
                        const active = workingDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleWorkingDay(day)}
                            className={`px-5 py-3 rounded-xl border text-xs font-black transition-all ${
                              active 
                                ? 'bg-violet-600 text-white border-violet-500 shadow-md shadow-violet-600/20' 
                                : 'bg-slate-950/50 border-slate-800 text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Working Hours</label>
                      <input 
                        value={workingHours}
                        onChange={(e) => setWorkingHours(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm text-white focus:border-violet-500 outline-none font-bold"
                        placeholder="e.g., 09:00 AM - 06:00 PM"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Holiday / Off Days</label>
                      <input 
                        value={holiday}
                        onChange={(e) => setHoliday(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm text-white focus:border-violet-500 outline-none font-bold"
                        placeholder="e.g., Sunday & National Holidays"
                      />
                    </div>
                  </div>

                  <div className="p-5 bg-slate-950/50 border border-slate-800 rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white mb-1">Emergency 24/7 Service</h4>
                      <p className="text-[11px] text-slate-500">Provide urgent on-call assistance for emergency inquiries.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEmergencyService(!emergencyService)}
                      className={`w-12 h-6 rounded-full transition-colors relative p-1 ${emergencyService ? 'bg-violet-600' : 'bg-slate-800'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${emergencyService ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-800 flex justify-between gap-4">
                  <button 
                    type="button" 
                    onClick={() => setStep(3)} 
                    className="px-6 py-4 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button 
                    type="button"
                    onClick={() => setStep(5)}
                    className="px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-violet-600/20 flex items-center gap-2"
                  >
                    Next: Portfolio <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 5: PORTFOLIO */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Step 5: Portfolio & Credentials</h3>
                  <p className="text-sm text-slate-400">Add showcase images, demo videos, and verified certifications.</p>
                </div>

                <div className="space-y-5">
                  {/* Images */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Portfolio Images</label>
                      <span className="text-[10px] text-slate-400">JPG, JPEG, PNG, WEBP (Max 10MB)</span>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3 items-stretch">
                      <div className="flex-1 flex gap-2">
                        <input 
                          value={imageUrlInput}
                          onChange={(e) => setImageUrlInput(e.target.value)}
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-sm text-white focus:border-violet-500 outline-none font-bold"
                          placeholder="Or paste image URL (https://...)"
                        />
                        <button 
                          type="button" 
                          onClick={handleAddImage}
                          className="px-5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold text-xs whitespace-nowrap"
                        >
                          Add URL
                        </button>
                      </div>

                      <label className="px-5 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-bold text-xs cursor-pointer transition-all duration-200 text-center flex items-center justify-center gap-2 shrink-0 select-none shadow-lg shadow-violet-600/10">
                        <ImageIcon className="w-4 h-4" />
                        <span>
                          {imageUploadState === 'idle' && 'Upload Image'}
                          {imageUploadState === 'uploading' && `Uploading... (${imageUploadProgress}%)`}
                          {imageUploadState === 'success' && 'Uploaded ✓'}
                          {imageUploadState === 'error' && 'Upload failed — Please try again.'}
                        </span>
                        <input 
                          type="file" 
                          accept="image/png, image/jpeg, image/jpg, image/webp" 
                          className="hidden" 
                          onChange={handleImageUpload}
                          disabled={imageUploadState === 'uploading'}
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-2">
                      {images.map((img, i) => (
                        <div key={i} className="relative h-20 rounded-xl overflow-hidden border border-slate-800 group">
                          <img src={img} alt={`Showcase ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <button 
                            type="button" 
                            onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                            className="absolute top-1 right-1 p-1 bg-red-600/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Video */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Demo Video Link (Optional)</label>
                    <input 
                      value={video}
                      onChange={(e) => setVideo(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm text-white focus:border-violet-500 outline-none font-bold"
                      placeholder="e.g., https://youtube.com/watch?v=..."
                    />
                  </div>

                  {/* Certificates */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Certificates / License</label>
                      <span className="text-[10px] text-slate-400">PDF, JPG, JPEG, PNG, WEBP (Max 10MB)</span>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3">
                      <div className="flex-1 flex gap-2">
                        <input 
                          value={certInput}
                          onChange={(e) => setCertInput(e.target.value)}
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-sm text-white focus:border-violet-500 outline-none font-bold"
                          placeholder="Enter certification name or description"
                        />
                        <button 
                          type="button" 
                          onClick={handleAddCertificate}
                          className="px-5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold text-xs whitespace-nowrap"
                        >
                          Add Text
                        </button>
                      </div>

                      <label className="px-5 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-bold text-xs cursor-pointer transition-all duration-200 text-center flex items-center justify-center gap-2 shrink-0 select-none shadow-lg shadow-violet-600/10">
                        <Award className="w-4 h-4" />
                        <span>
                          {!certUploading && 'Upload Certificate'}
                          {certUploading && `Uploading... (${certProgress}%)`}
                        </span>
                        <input 
                          type="file" 
                          accept="application/pdf, image/png, image/jpeg, image/jpg, image/webp" 
                          className="hidden" 
                          onChange={handleCertificateUpload}
                          disabled={certUploading}
                        />
                      </label>
                    </div>

                    {certUploadError && (
                      <div className="text-xs text-red-400 flex items-center gap-2 font-mono bg-red-950/20 border border-red-900/30 px-3 py-2 rounded-xl">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{certUploadError}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-1">
                      {certificates.map((cert, i) => {
                        const isUrl = cert.startsWith('http://') || cert.startsWith('https://');
                        const fileName = isUrl ? cert.split('/').pop()?.split('?')[0] || 'certificate' : cert;
                        const fileExt = isUrl ? fileName.split('.').pop()?.toUpperCase() : 'TEXT';

                        return (
                          <div key={i} className="px-3 py-1.5 bg-slate-950 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl flex items-center gap-2 hover:border-slate-700 transition-colors">
                            <Award className="w-3.5 h-3.5 text-amber-400" />
                            {isUrl ? (
                              <a 
                                href={cert} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="hover:text-violet-400 hover:underline transition-colors flex items-center gap-1.5"
                              >
                                <span>{decodeURIComponent(fileName)}</span>
                                <span className="text-[9px] bg-slate-900 text-slate-500 px-1.5 py-0.5 rounded uppercase font-mono font-black">{fileExt}</span>
                              </a>
                            ) : (
                              <span>{cert}</span>
                            )}
                            <X 
                              className="w-3.5 h-3.5 cursor-pointer text-slate-500 hover:text-red-400 ml-1 transition-colors" 
                              onClick={() => setCertificates(certificates.filter((_, idx) => idx !== i))} 
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Brochures & Documents</label>
                      <span className="text-[10px] text-slate-400">PDF, DOC, DOCX (Max 10MB)</span>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3">
                      <div className="flex-1 flex gap-2">
                        <input 
                          value={docInput}
                          onChange={(e) => setDocInput(e.target.value)}
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-sm text-white focus:border-violet-500 outline-none font-bold"
                          placeholder="Enter document name or file description"
                        />
                        <button 
                          type="button" 
                          onClick={handleAddDocument}
                          className="px-5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold text-xs whitespace-nowrap"
                        >
                          Add Text
                        </button>
                      </div>

                      <label className="px-5 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-bold text-xs cursor-pointer transition-all duration-200 text-center flex items-center justify-center gap-2 shrink-0 select-none shadow-lg shadow-violet-600/10">
                        <FileText className="w-4 h-4" />
                        <span>
                          {!docUploading && 'Upload Document'}
                          {docUploading && `Uploading... (${docProgress}%)`}
                        </span>
                        <input 
                          type="file" 
                          accept="application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
                          className="hidden" 
                          onChange={handleDocumentUpload}
                          disabled={docUploading}
                        />
                      </label>
                    </div>

                    {docUploadError && (
                      <div className="text-xs text-red-400 flex items-center gap-2 font-mono bg-red-950/20 border border-red-900/30 px-3 py-2 rounded-xl">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{docUploadError}</span>
                      </div>
                    )}

                    <div className="flex flex-col gap-2 pt-1">
                      {documents.map((d, i) => {
                        const isUrl = d.startsWith('http://') || d.startsWith('https://');
                        const fileName = isUrl ? d.split('/').pop()?.split('?')[0] || 'document' : d;
                        const fileExt = isUrl ? fileName.split('.').pop()?.toUpperCase() : 'TEXT';

                        return (
                          <div key={i} className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl transition-all">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                              {isUrl ? (
                                <a 
                                  href={d} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="text-slate-300 text-xs font-bold hover:text-violet-400 hover:underline truncate"
                                >
                                  {decodeURIComponent(fileName)}
                                </a>
                              ) : (
                                <span className="text-slate-300 text-xs font-bold truncate">{d}</span>
                              )}
                              {isUrl && (
                                <span className="text-[9px] bg-slate-900 text-slate-500 px-1.5 py-0.5 rounded uppercase font-mono font-black shrink-0">
                                  {fileExt}
                                </span>
                              )}
                            </div>
                            <button 
                              type="button"
                              onClick={() => setDocuments(documents.filter((_, idx) => idx !== i))}
                              className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-800 flex justify-between gap-4">
                  <button 
                    type="button" 
                    onClick={() => setStep(4)} 
                    className="px-6 py-4 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button 
                    type="button"
                    onClick={() => setStep(6)}
                    className="px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-violet-600/20 flex items-center gap-2"
                  >
                    Next: Review & Submit <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 6: PREVIEW & SUBMIT */}
            {step === 6 && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Step 6: Review & Final Submit</h3>
                  <p className="text-sm text-slate-400">Review all details before publishing to the Enterprise Marketplace.</p>
                </div>

                <div className="p-6 bg-slate-950/80 border border-slate-800 rounded-3xl space-y-6 max-h-[45vh] overflow-y-auto pr-2 no-scrollbar">
                  <div className="flex flex-col sm:flex-row gap-5 items-start">
                    <div className="w-24 h-24 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0">
                      <img 
                        src={images[0] || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500'} 
                        alt="Service Main" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-black uppercase tracking-widest">
                          {businessType}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                          {locationType}
                        </span>
                      </div>
                      <h4 className="text-xl font-black text-white">{serviceName || 'Untitled Service'}</h4>
                      <p className="text-xs text-slate-400 font-medium line-clamp-2 mt-1">{description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-bold pt-4 border-t border-slate-800">
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block mb-1">Category</span>
                      <span className="text-slate-200">{category}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block mb-1">Pricing Model</span>
                      <span className="text-slate-200">{priceType} ({minPrice} - {maxPrice} π)</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block mb-1">Experience</span>
                      <span className="text-slate-200">{experience}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block mb-1">Location</span>
                      <span className="text-slate-200">{city}, {state}, {country}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block mb-1">Working Days</span>
                      <span className="text-slate-200">{workingDays.join(', ')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block mb-1">Emergency 24/7</span>
                      <span className="text-slate-200">{emergencyService ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-800 flex justify-between gap-4">
                  <button 
                    type="button" 
                    onClick={() => setStep(5)} 
                    className="px-6 py-4 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button 
                    type="button"
                    onClick={handlePublish}
                    disabled={loading}
                    className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> Publish Service
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
