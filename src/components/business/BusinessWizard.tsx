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
  MoreHorizontal,
  FileCheck,
  Wallet
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseDb } from '../../firebase/config';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../auth/useAuth';
import { businessService } from '../../services/businessService';
import { BusinessRegistrationEngine } from '../../services/businessRegistrationEngine';
import { UniversalBusinessCategory } from '../../core/business/universalBusinessTypes';
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
  { id: 'Retail Shop', label: 'Retail Shop', icon: Store, desc: 'Retail store, grocery, or local boutique.' },
  { id: 'Wholesale', label: 'Wholesale', icon: Building2, desc: 'B2B seller of bulk goods and materials.' },
  { id: 'Service Provider', label: 'Service Provider', icon: Wrench, desc: 'Offer professional, retail, or home services.' },
  { id: 'Freelancer', label: 'Freelancer', icon: User, desc: 'Independent professional offering specialized skills.' },
  { id: 'Private Limited Company', label: 'Private Limited Company', icon: Building2, desc: 'Registered Private Limited corporate entity.' },
  { id: 'Public Limited Company', label: 'Public Limited Company', icon: Building2, desc: 'Publicly listed corporate enterprise.' },
  { id: 'One Person Company (OPC)', label: 'One Person Company (OPC)', icon: User, desc: 'Single-owner registered company.' },
  { id: 'Partnership Firm', label: 'Partnership Firm', icon: Briefcase, desc: 'Business registered under a partnership agreement.' },
  { id: 'LLP', label: 'Limited Liability Partnership (LLP)', icon: Briefcase, desc: 'Partnership with limited liability protection.' },
  { id: 'Sole Proprietorship', label: 'Sole Proprietorship', icon: User, desc: 'Individual owned un-incorporated business.' },
  { id: 'NGO', label: 'NGO / Non-Profit', icon: ShieldCheck, desc: 'Non-profit, social enterprise, or charity.' },
  { id: 'Trust', label: 'Trust', icon: ShieldCheck, desc: 'Registered charitable or private trust.' },
  { id: 'Society', label: 'Society', icon: ShieldCheck, desc: 'Registered cooperative or welfare society.' },
  { id: 'Startup', label: 'Startup', icon: Zap, desc: 'Innovative tech or high-growth venture.' },
  { id: 'Manufacturer', label: 'Manufacturer', icon: Factory, desc: 'Manufacture goods for wholesale or distribution.' },
  { id: 'Distributor', label: 'Distributor', icon: Truck, desc: 'Supply chain distribution and logistics.' },
  { id: 'Dealer', label: 'Dealer', icon: Store, desc: 'Authorized product dealership or outlet.' },
  { id: 'School', label: 'School', icon: GraduationCap, desc: 'Primary, secondary, or vocational school.' },
  { id: 'College', label: 'College / University', icon: GraduationCap, desc: 'Higher learning college or university institution.' },
  { id: 'Coaching Institute', label: 'Coaching Institute', icon: GraduationCap, desc: 'Tutoring, academy, or competitive exam coaching.' },
  { id: 'Hospital', label: 'Hospital', icon: HeartPulse, desc: 'Full-scale hospital or healthcare center.' },
  { id: 'Clinic', label: 'Clinic', icon: HeartPulse, desc: 'Medical clinic or outpatient diagnostic facility.' },
  { id: 'Medical Store', label: 'Medical Store / Pharmacy', icon: HeartPulse, desc: 'Licensed pharmacy or medical equipment provider.' },
  { id: 'Laboratory', label: 'Diagnostic Laboratory', icon: HeartPulse, desc: 'Medical test and path lab facility.' },
  { id: 'Restaurant', label: 'Restaurant / Cafe', icon: Utensils, desc: 'Dining, cloud kitchen, cafe, or eatery.' },
  { id: 'Hotel', label: 'Hotel / Resort', icon: Utensils, desc: 'Hospitality, lodging, resort, or stay.' },
  { id: 'Agriculture', label: 'Agriculture / Farm', icon: Tractor, desc: 'Farming, organic produce, and agritech.' },
  { id: 'Transport', label: 'Transport / Logistics', icon: Truck, desc: 'Transportation, fleet, and delivery services.' },
  { id: 'Digital Business', label: 'Digital Business', icon: Globe, desc: 'E-commerce, digital products, and SaaS.' },
  { id: 'Software Company', label: 'Software Company', icon: Zap, desc: 'Software development and IT solutions.' },
  { id: 'Marketing Agency', label: 'Marketing Agency', icon: Briefcase, desc: 'Digital marketing, PR, and advertising.' },
  { id: 'Construction', label: 'Construction / Contracting', icon: HardHat, desc: 'Building, civil work, and interior design.' },
  { id: 'Real Estate', label: 'Real Estate', icon: Building2, desc: 'Property dealership, broker, or developer.' },
  { id: 'Home Business', label: 'Home Business', icon: Store, desc: 'Micro-business operating from home.' },
  { id: 'Other', label: 'Other Enterprise', icon: MoreHorizontal, desc: 'Other custom business entity type.' }
];

export const BusinessWizard: React.FC<WizardProps> = ({ onComplete, onCancel, initialData, businessId }) => {
  const { user, profile, updateUser } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Business> & {
    gstNumber?: string;
    panNumber?: string;
    piWalletAddress?: string;
    bmpWalletAddress?: string;
    documents?: Record<string, string>;
  }>(() => {
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
        gstNumber: '',
        panNumber: '',
        piWalletAddress: '',
        bmpWalletAddress: '',
        documents: {},
        profileData: {},
        ...initialData
      };
    }
    // Try restoring draft from localStorage
    try {
      const saved = localStorage.getItem('pi_business_wizard_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.formData && !businessId) {
          return parsed.formData;
        }
      }
    } catch (e) {
      console.warn('Failed to load business registration draft:', e);
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
      gstNumber: '',
      panNumber: '',
      piWalletAddress: '',
      bmpWalletAddress: '',
      documents: {},
      profileData: {}
    };
  });

  // Save draft auto-save effect
  useEffect(() => {
    if (!businessId) {
      try {
        localStorage.setItem('pi_business_wizard_draft', JSON.stringify({ step, formData }));
      } catch (e) {
        // ignore draft save error
      }
    }
  }, [formData, step, businessId]);

  const [logoPreview, setLogoPreview] = useState<string | null>(initialData?.logoUrl || formData.logoUrl || null);
  const [coverPreview, setCoverPreview] = useState<string | null>(initialData?.coverImageUrl || formData.coverImageUrl || null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const totalSteps = 6;

  const handleNext = () => {
    setError(null);

    if (step === 1) {
      if (!formData.businessType) {
        setError('Business Type is required.');
        return;
      }
    }

    if (step === 2) {
      if (!formData.businessName || formData.businessName.trim() === '') {
        setError('Business Name is required.');
        return;
      }
      if (!formData.legalName || formData.legalName.trim() === '') {
        setError('Legal Name is required.');
        return;
      }
      if (!formData.email || formData.email.trim() === '') {
        setError('Contact Email is required.');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        setError('Please enter a valid email address.');
        return;
      }
      if (!formData.phone || formData.phone.trim() === '') {
        setError('Phone Number is required.');
        return;
      }
    }

    if (step === 3) {
      if (!formData.category || formData.category.trim() === '') {
        setError('Business Category is required.');
        return;
      }
      // Validate dynamic fields from config
      const config = BusinessRegistrationEngine.getFormConfigForType(formData.businessType || 'Retail Shop');
      if (config?.customFields) {
        for (const field of config.customFields) {
          if (field.required) {
            const val = (formData.profileData as any)?.[field.id];
            if (val === undefined || val === null || val === '') {
              setError(`Field '${field.label}' is required.`);
              return;
            }
          }
        }
      }
    }

    if (step === 4) {
      if (!formData.fullAddress || formData.fullAddress.trim() === '') {
        setError('Full Address is required.');
        return;
      }
      if (!formData.country || formData.country.trim() === '') {
        setError('Country is required.');
        return;
      }
      if (!formData.state || formData.state.trim() === '') {
        setError('State / Province is required.');
        return;
      }
      if (!formData.city || formData.city.trim() === '') {
        setError('City is required.');
        return;
      }
    }

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

  const handleDocumentChange = (docKey: string, url: string) => {
    setFormData({
      ...formData,
      documents: {
        ...(formData.documents || {}),
        [docKey]: url
      }
    });
  };

  const handleSubmit = async () => {
    if (!user || !profile) return;
    setIsSubmitting(true);
    setError(null);
    try {
      if (businessId) {
        const { id, createdAt, updatedAt, createdBy, updatedBy, rating, reviewCount, followers, employeeCount, storeCount, ownerUid, ...updates } = formData;
        await businessService.updateBusiness(businessId, user.uid, profile.displayName || user.email || 'User', updates);
        try {
          localStorage.removeItem('pi_business_wizard_draft');
        } catch (e) {}
        onComplete(businessId);
      } else {
        // Validation check
        if (!formData.businessType) {
          throw new Error('Business Type is required.');
        }
        if (!formData.businessName || formData.businessName.trim() === '') {
          throw new Error('Business Name is required.');
        }
        if (!formData.legalName || formData.legalName.trim() === '') {
          throw new Error('Legal Name is required.');
        }
        if (!formData.email || formData.email.trim() === '') {
          throw new Error('Contact Email is required.');
        }
        if (!formData.phone || formData.phone.trim() === '') {
          throw new Error('Phone Number is required.');
        }
        if (!formData.category || formData.category.trim() === '') {
          throw new Error('Business Category is required.');
        }
        if (!formData.fullAddress || formData.fullAddress.trim() === '') {
          throw new Error('Full Address is required.');
        }
        if (!formData.country || formData.country.trim() === '') {
          throw new Error('Country is required.');
        }
        if (!formData.state || formData.state.trim() === '') {
          throw new Error('State / Province is required.');
        }
        if (!formData.city || formData.city.trim() === '') {
          throw new Error('City is required.');
        }

        // Universal Registration Engine Call
        const config = BusinessRegistrationEngine.getFormConfigForType(formData.businessType || 'Retail Shop');
        const res = await BusinessRegistrationEngine.registerBusiness({
          ownerUid: user.uid,
          ownerName: profile.displayName || user.email || 'User',
          businessName: formData.businessName || '',
          legalName: formData.legalName || formData.businessName || '',
          businessCategory: (formData.category || config.category || 'retail_wholesale') as UniversalBusinessCategory,
          businessType: formData.businessType || 'Retail Shop',
          description: formData.description || '',
          email: formData.email || user.email || '',
          phone: formData.phone || '',
          address: formData.fullAddress || '',
          city: formData.city || '',
          state: formData.state || '',
          country: formData.country || '',
          postalCode: formData.postalCode || '',
          gstNumber: formData.gstNumber || '',
          panNumber: formData.panNumber || '',
          logoUrl: formData.logoUrl || logoPreview || '',
          coverImageUrl: formData.coverImageUrl || coverPreview || '',
          piWalletAddress: formData.piWalletAddress || '',
          bmpWalletAddress: formData.bmpWalletAddress || '',
          dynamicFields: {
            ...(formData.profileData || {}),
            ...(formData.documents ? { uploadedDocuments: formData.documents } : {})
          },
          primaryStoreConfig: config.requiresStore ? {
            storeName: `${formData.businessName || 'Business'} Outlet`,
            storeType: 'Retail Outlet',
            deliveryAvailable: true,
            pickupAvailable: true
          } : undefined
        });

        // Fetch fresh user data from firestore to get exact values set by engine
        try {
          if (updateUser) {
            const db = getFirebaseDb();
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              await updateUser({
                ...userData,
                profileCompleted: true,
                onboardingCompleted: true
              });
            }
          }
        } catch (syncErr) {
          console.error('Failed to sync user context in BusinessWizard:', syncErr);
        }

        try {
          localStorage.removeItem('pi_business_wizard_draft');
        } catch (e) {}

        onComplete(res.businessId);
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
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Legal Name *</label>
                        <input 
                          name="legalName" 
                          value={formData.legalName} 
                          onChange={handleChange} 
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white" 
                          placeholder="Registered entity name" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Contact Email *</label>
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
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Phone Number *</label>
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
                    <div className="space-y-2 mb-6 border-b border-slate-800 pb-6">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Business Category *</label>
                      <select
                        name="category"
                        value={formData.category || ''}
                        onChange={handleChange}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">-- Select Category --</option>
                        <option value="retail_wholesale">Retail & Wholesale</option>
                        <option value="professional_services">Professional Services</option>
                        <option value="organizations_institutions">Organizations & Institutions</option>
                        <option value="service_industries">Service Industries</option>
                        <option value="agriculture_production">Agriculture & Production</option>
                        <option value="technology_creative">Technology & Creative</option>
                      </select>
                      <p className="text-[10px] text-slate-500">Must map to a primary category type for compliance.</p>
                    </div>
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
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">State / Province *</label>
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
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Full Address *</label>
                    <textarea name="fullAddress" value={formData.fullAddress} onChange={handleChange} rows={2} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white" />
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-8 max-w-3xl mx-auto">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-white mb-2">Brand, Verification & Wallet Mapping</h3>
                    <p className="text-slate-400 text-sm">Upload branding assets, verification documents, and Pi Testnet wallet credentials.</p>
                  </div>

                  {/* Brand Assets */}
                  <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 space-y-4">
                    <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                      <Building2 className="w-4 h-4" /> Brand Identity
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Business Logo</label>
                        {formData.logoUrl ? (
                          <div className="w-[140px] h-[140px] bg-slate-950 rounded-2xl overflow-hidden relative border border-slate-800">
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

                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Cover Banner</label>
                        {formData.coverImageUrl ? (
                          <div className="w-full h-[140px] bg-slate-950 rounded-2xl overflow-hidden relative border border-slate-800">
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

                  {/* Tax & Registration Info */}
                  <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 space-y-4">
                    <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                      <FileCheck className="w-4 h-4" /> Tax & Legal Identification
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">GSTIN / Tax ID</label>
                        <input
                          name="gstNumber"
                          value={formData.gstNumber || ''}
                          onChange={handleChange}
                          placeholder="e.g. 22AAAAA0000A1Z5"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">PAN / Legal Registration No</label>
                        <input
                          name="panNumber"
                          value={formData.panNumber || ''}
                          onChange={handleChange}
                          placeholder="e.g. ABCDE1234F"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white"
                        />
                      </div>
                    </div>

                    <div className="pt-2 space-y-3">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Document Verification Uploads</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-xs text-slate-400">Business License / Certificate</span>
                          <FileUpload
                            ownerUid={user?.uid || ''}
                            module="documents"
                            label="Upload Registration Doc"
                            onUploadSuccess={(asset) => handleDocumentChange('businessLicense', asset.downloadUrl)}
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-slate-400">GST / Tax Certificate</span>
                          <FileUpload
                            ownerUid={user?.uid || ''}
                            module="documents"
                            label="Upload Tax Doc"
                            onUploadSuccess={(asset) => handleDocumentChange('gstCertificate', asset.downloadUrl)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Blockchain Ready Wallet Mappings */}
                  <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 space-y-4">
                    <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                      <Wallet className="w-4 h-4" /> Blockchain Wallet Mappings
                    </h4>
                    <p className="text-xs text-slate-400">Connect your Pi Testnet wallet and BMP rewards wallet for instant settlement and reward distribution.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pi Testnet Wallet Address</label>
                        <input
                          name="piWalletAddress"
                          value={formData.piWalletAddress || ''}
                          onChange={handleChange}
                          placeholder="G..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs font-mono text-amber-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">BMP Reward Wallet Address</label>
                        <input
                          name="bmpWalletAddress"
                          value={formData.bmpWalletAddress || ''}
                          onChange={handleChange}
                          placeholder="BMP..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs font-mono text-indigo-300"
                        />
                      </div>
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
