/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Check,
  User,
  Store,
  Briefcase,
  Heart,
  Eye,
  Settings,
  Plus,
  Compass,
  Layout,
  Clock,
  MapPin,
  Coins,
  ShieldCheck,
  Languages,
  ArrowRight,
  Upload,
  Globe,
  Share2,
  Phone,
  Mail,
  AlertTriangle,
  FileText,
  Bookmark,
  TrendingUp,
  Search,
  Filter,
  CheckCircle2,
  Trash2,
  QrCode,
  Sliders
} from 'lucide-react';
import { PioneerProfile, User as UserType, ProfilePageType, PioneerCategory } from '../types';
import { PiBusinessMarketDB } from '../services/storage';

interface ProfileEngineProps {
  currentUser: UserType;
  onNavigate: (view: string, params?: any) => void;
  onRefreshUser?: () => void;
}

// ----------------------------------------------------------------------
// CONSTANTS & SEED OPTIONS
// ----------------------------------------------------------------------

const PROFILE_TYPES: { type: ProfilePageType; title: string; desc: string; icon: any; color: string }[] = [
  { type: 'store', title: 'Store Front', desc: 'Direct retail sales of physical goods, products, and equipment.', icon: Store, color: 'from-emerald-500 to-teal-600' },
  { type: 'service', title: 'Service Provider', desc: 'Local technician, plumber, repair shop, or cleaning agency.', icon: Sliders, color: 'from-violet-500 to-fuchsia-600' },
  { type: 'professional', title: 'Independent Professional', desc: 'Consultants, lawyers, doctors, teachers, or developers.', icon: Briefcase, color: 'from-blue-500 to-indigo-600' },
  { type: 'business', title: 'Enterprise / Organization', desc: 'NGOs, startup ventures, corporations, and community groups.', icon: Layout, color: 'from-amber-500 to-orange-600' },
  { type: 'creator', title: 'Digital Creator', desc: 'Video creators, copywriters, writers, designers, and developers.', icon: Sparkles, color: 'from-rose-500 to-pink-600' }
];

const RESERVED_NAMES = ['admin', 'pinetwork', 'kyc', 'wallet', 'mainnet', 'official', 'mine', 'moderator', 'support', 'testnet'];

const TEMPLATES = [
  { id: 'electronics', name: 'Electronics Store Template', desc: 'High-contrast neon-accent dark layout with technical specs grids.', industries: ['Electronics', 'Technology'] },
  { id: 'fashion', name: 'Fashion & Style Boutique', desc: 'Minimalist editorial display with soft tones and large margins.', industries: ['Fashion', 'Beauty', 'Salon'] },
  { id: 'grocery', name: 'Grocery & Organic Market', desc: 'Fresh bright clean layout optimized for lightning-fast product checkouts.', industries: ['Grocery', 'Agriculture'] },
  { id: 'restaurant', name: 'Restaurant & Cafe Menu', desc: 'Warm dark elegant dining view centering menu listings and reservation maps.', industries: ['Restaurant', 'Hotel'] },
  { id: 'freelancer', name: 'Modern Tech Freelancer', desc: 'Developer/designer terminal-accent portfolio highlighting github stats & skills.', industries: ['Freelancer', 'Consultant', 'Lawyer', 'Teacher'] },
  { id: 'workshop', name: 'Workshop & Industrial Care', desc: 'Bold rugged industrial-accent layout centering emergency call-out buttons.', industries: ['Workshop', 'Repair Center', 'Cleaning Service', 'Construction'] }
];

const OFFENSIVE_WORDS = ['scam', 'fraud', 'fake', 'hacker', 'exploit', 'phishing', 'cheat'];

// Mock categories for different profile types
const CATEGORIES_BY_TYPE: Record<string, string[]> = {
  store: ['Electronics', 'Fashion', 'Grocery', 'Pharmacy', 'Automobile', 'Agriculture', 'Technology'],
  service: ['Workshop', 'Repair Center', 'Cleaning Service', 'Construction', 'Salon', 'Beauty'],
  professional: ['Teacher', 'Doctor', 'Lawyer', 'Consultant', 'Freelancer'],
  business: ['Startup', 'NGO', 'Education', 'Healthcare', 'Real Estate']
};

export default function ProfileEngine({
  currentUser,
  onNavigate,
  onRefreshUser
}: ProfileEngineProps) {
  // State variables
  const [profiles, setProfiles] = useState<PioneerProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<PioneerProfile | null>(null);
  const [activeView, setActiveView] = useState<'hub' | 'create' | 'settings' | 'playground'>('hub');
  
  // Wizard States
  const [wizardType, setWizardType] = useState<ProfilePageType>('store');
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardData, setWizardData] = useState<any>({
    name: '',
    category: 'electronics',
    description: '',
    locationText: '',
    city: '',
    country: '',
    piWallet: currentUser.walletAddress,
    skills: '',
    experience: '',
    coverageArea: '',
    company: '',
    industry: ''
  });
  const [validationError, setValidationError] = useState('');
  
  // Settings view states
  const [theme, setTheme] = useState('violet');
  const [privacy, setPrivacy] = useState<'public' | 'private'>('public');
  const [visibility, setVisibility] = useState<'visible' | 'hidden'>('visible');
  const [hours, setHours] = useState('9:00 AM - 6:00 PM');
  const [socialLinks, setSocialLinks] = useState({
    website: '',
    telegram: '',
    whatsapp: '',
    instagram: '',
    linkedin: ''
  });
  
  // Media simulation states
  const [galleryItems, setGalleryItems] = useState<string[]>([]);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  
  // Search & filter Playground states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCity, setFilterCity] = useState<string>('');
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [playRating, setPlayRating] = useState<number>(0);
  
  // AI Builder Simulator State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuccessMsg, setAiSuccessMsg] = useState('');
  const [generatedItems, setGeneratedItems] = useState<any>(null);
  
  // QR Card Modal State
  const [showQrCard, setShowQrCard] = useState<PioneerProfile | null>(null);

  // Load profiles on start
  useEffect(() => {
    const list = PiBusinessMarketDB.getPioneerProfilesByOwner(currentUser.uid);
    setProfiles(list);
    if (list.length > 0 && !selectedProfile) {
      setSelectedProfile(list[0]);
    }
  }, [currentUser.uid, activeView]);

  const handleSelectProfile = (p: PioneerProfile) => {
    setSelectedProfile(p);
    setTheme(p.theme?.primaryColor || 'violet');
    setPrivacy(p.privacy || 'public');
    setVisibility(p.visibility || 'visible');
    setHours(p.workingHours || '9:00 AM - 6:00 PM');
    setSocialLinks({
      website: p.socialLinks?.website || '',
      telegram: p.contactInfo.telegram || '',
      whatsapp: p.contactInfo.whatsapp || '',
      instagram: p.socialLinks?.instagram || '',
      linkedin: p.socialLinks?.linkedin || ''
    });
    setGalleryItems(p.gallery || []);
  };

  // ----------------------------------------------------------------------
  // ENTERPRISE VALIDATION UTILITIES
  // ----------------------------------------------------------------------
  const validateWallet = (wallet: string) => {
    // Stellar public keys always start with 'G' and are 56 alphanumeric characters long
    const stellarRegex = /^G[A-Z2-7]{55}$/;
    return stellarRegex.test(wallet);
  };

  const handleWizardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // Common validations
    if (!wizardData.name.trim()) {
      setValidationError('Business Display Name is required');
      return;
    }

    if (wizardData.name.length < 3) {
      setValidationError('Display name must be at least 3 characters long');
      return;
    }

    const lowercaseName = wizardData.name.toLowerCase().trim();

    // Reserved Usernames Check
    if (RESERVED_NAMES.some(res => lowercaseName === res || lowercaseName.includes(res))) {
      setValidationError('The name contains reserved platform namespaces.');
      return;
    }

    // Offensive/Spam Content Check
    if (OFFENSIVE_WORDS.some(word => lowercaseName.includes(word))) {
      setValidationError('The business name contains unapproved terminology.');
      return;
    }

    // Wallet check
    if (!validateWallet(wizardData.piWallet)) {
      setValidationError('Invalid Stellar/Pi Wallet Address format. Must start with G and be 56 uppercase characters.');
      return;
    }

    // Location Formatting Check
    if (!wizardData.city.trim() || !wizardData.country.trim()) {
      setValidationError('Both City and Country are required for verified index mappings.');
      return;
    }

    // Generate Slug and check duplicates
    const slug = wizardData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const duplicateSlug = PiBusinessMarketDB.getPioneerProfiles().some(
      p => p.ownerUid !== currentUser.uid && p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') === slug
    );
    if (duplicateSlug) {
      setValidationError('This business URL slug/identity name is already registered.');
      return;
    }

    // Template Assign logic based on Category Mapping
    let assignedTemplate = 'electronics';
    const catLower = wizardData.category.toLowerCase();
    if (catLower.includes('fashion') || catLower.includes('beauty') || catLower.includes('salon')) {
      assignedTemplate = 'fashion';
    } else if (catLower.includes('grocery') || catLower.includes('agri')) {
      assignedTemplate = 'grocery';
    } else if (catLower.includes('food') || catLower.includes('restaurant')) {
      assignedTemplate = 'restaurant';
    } else if (catLower.includes('free') || catLower.includes('consult') || catLower.includes('teach')) {
      assignedTemplate = 'freelancer';
    } else if (catLower.includes('work') || catLower.includes('repair') || catLower.includes('clean')) {
      assignedTemplate = 'workshop';
    }

    // Prepare complete database entity
    const skillsList = wizardData.skills ? wizardData.skills.split(',').map((s: string) => s.trim()) : [];
    
    const preparedProfile: any = {
      ownerUid: currentUser.uid,
      name: wizardData.name,
      businessName: wizardData.company || wizardData.name,
      category: 'business_owner' as PioneerCategory, // Mapping category
      pageType: wizardType,
      skills: skillsList,
      description: wizardData.description || `Verified Pi Pioneer Business offering prime services.`,
      photoUrls: ['https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=600&h=400&q=80'],
      videoUrls: [],
      serviceArea: wizardData.coverageArea || `${wizardData.city}, ${wizardData.country}`,
      address: wizardData.locationText || `${wizardData.city}, ${wizardData.country}`,
      location: {
        addressText: wizardData.locationText || `${wizardData.city}, ${wizardData.country}`,
        city: wizardData.city,
        country: wizardData.country
      },
      contactInfo: {
        email: currentUser.username + '@pioneernetwork.pi',
        phone: '+1 415 889 0192'
      },
      workingHours: '9:00 AM - 6:00 PM',
      piPaymentSupported: true,
      piWalletAddress: wizardData.piWallet,
      availabilityStatus: 'available',
      theme: {
        primaryColor: 'violet',
        templateId: assignedTemplate
      },
      logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&h=150&q=80',
      coverUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=600&h=200&q=80',
      followersCount: 0,
      languages: ['English', 'Spanish'],
      privacy: 'public',
      visibility: 'visible',
      verificationBadge: true,
      analyticsEnterprise: {
        views: 12,
        interactions: 2,
        rating: 5.0
      }
    };

    // Save to Database
    const newProfile = PiBusinessMarketDB.createPioneerProfile(preparedProfile);
    
    // Create notifications for sandbox feedback
    PiBusinessMarketDB.createNotification(
      currentUser.uid,
      `New Profile Generated! 🚀`,
      `Your public identity "${preparedProfile.name}" is now live as a verified "${wizardType.toUpperCase()}" with template: "${assignedTemplate}".`,
      'system_announcement'
    );

    // Reset states
    setWizardStep(1);
    setWizardData({
      name: '',
      category: 'electronics',
      description: '',
      locationText: '',
      city: '',
      country: '',
      piWallet: currentUser.walletAddress,
      skills: '',
      experience: '',
      coverageArea: '',
      company: '',
      industry: ''
    });
    setSelectedProfile(newProfile);
    setActiveView('hub');
    if (onRefreshUser) onRefreshUser();
  };

  // ----------------------------------------------------------------------
  // AI BUSINESS BUILDER GENERATOR SIMULATION
  // ----------------------------------------------------------------------
  const handleSimulateAIGenerate = () => {
    if (!wizardData.category) {
      setValidationError('Please select or specify a category first so the AI builder knows what to construct.');
      return;
    }
    setAiLoading(true);
    setAiSuccessMsg('');
    setValidationError('');

    // Simulate Server-side latency of Gemini-3.5-Flash
    setTimeout(() => {
      let storeName = 'Satoshi Electronics';
      let desc = 'The next-generation Web3 retail depot facilitating fully automated payments via the Pi ecosystem. Verified high-quality components.';
      let bio = 'Alex Mercer is an certified technician with over 10 years of system repair experience across smart devices and IoT components.';
      let tags = ['NextGen', 'IoT', 'VerifiedStore', 'PiWeb3'];

      if (wizardType === 'service') {
        storeName = 'Alex Mercer Smart Solutions';
        desc = 'Certified repairs, custom wiring systems, and technical node installations powered by Pi Network micro-settlements.';
        bio = 'Alex Mercer provides ultra-fast technical support and diagnostic evaluations for global consensus networks and hardware.';
        tags = ['Technician', 'Plumbing', 'FastResponse', 'PiSettled'];
      } else if (wizardType === 'professional') {
        storeName = 'Mercer Tech Consulting';
        desc = 'Strategic enterprise system modeling, decentralized ledger planning, and Web3 training protocols customized for Pi pioneers.';
        tags = ['Consulting', 'VentureCapital', 'PiDeveloper', 'SEOReady'];
      } else if (wizardType === 'business') {
        storeName = 'Decentralized Pioneer Guild';
        desc = 'Empowering remote pioneers with micro-funding structures, regional training modules, and consensus resources.';
        tags = ['NGO', 'GlobalTech', 'StartupSaaS', 'Empowerment'];
      }

      setGeneratedItems({
        storeName,
        desc,
        bio,
        tags,
        cover: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&h=200&q=80',
        logo: 'https://images.unsplash.com/photo-1516876437184-593fda40c7ce?auto=format&fit=crop&w=150&h=150&q=80'
      });

      setWizardData(prev => ({
        ...prev,
        name: storeName,
        description: desc,
        skills: tags.join(', ')
      }));

      setAiSuccessMsg('Gemini-3.5-Flash parsed category metadata successfully and created rich profiles with SEO tags!');
      setAiLoading(false);
    }, 1500);
  };

  // Save profile settings
  const handleSaveSettings = () => {
    if (!selectedProfile) return;
    
    const updated = PiBusinessMarketDB.updatePioneerProfile(selectedProfile.id, {
      theme: {
        primaryColor: theme,
        templateId: selectedProfile.theme?.templateId || 'electronics'
      },
      privacy,
      visibility,
      workingHours: hours,
      contactInfo: {
        ...selectedProfile.contactInfo,
        whatsapp: socialLinks.whatsapp,
        telegram: socialLinks.telegram
      },
      socialLinks: {
        website: socialLinks.website,
        instagram: socialLinks.instagram,
        linkedin: socialLinks.linkedin
      },
      gallery: galleryItems
    });

    setSelectedProfile(updated);
    setProfiles(PiBusinessMarketDB.getPioneerProfilesByOwner(currentUser.uid));
    
    PiBusinessMarketDB.createNotification(
      currentUser.uid,
      `Settings Configured! ⚙️`,
      `Your settings for "${selectedProfile.name}" were compiled and saved successfully to the ledger.`,
      'system_announcement'
    );
    
    setActiveView('hub');
  };

  // ----------------------------------------------------------------------
  // MEDIA UPLOAD SIMULATOR
  // ----------------------------------------------------------------------
  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadStatus('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadStatus('Validation Failed: Upload exceeds enterprise 5MB threshold limit.');
      return;
    }

    // Validate type
    const validExtensions = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validExtensions.includes(file.type)) {
      setUploadStatus('Validation Failed: Invalid format. Only JPEG, PNG, WEBP and PDF certificates are supported.');
      return;
    }

    setUploadStatus('Optimizing image matrix & encrypting...');
    setTimeout(() => {
      const mockImgUrl = URL.createObjectURL(file);
      setGalleryItems(prev => [...prev, mockImgUrl]);
      setUploadStatus('Success: Media file verified, compressed to WebP and securely linked.');
    }, 1200);
  };

  // Filter play state profiles
  const allProfiles = PiBusinessMarketDB.getPioneerProfiles();
  const playFilteredProfiles = allProfiles.filter(p => {
    const matchesSearch = searchQuery
      ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    const matchesType = filterType === 'all' ? true : p.pageType === filterType;
    const matchesCity = filterCity ? p.location?.city?.toLowerCase() === filterCity.toLowerCase() : true;
    const matchesVerified = onlyVerified ? p.verificationBadge === true : true;
    const matchesRating = p.rating >= playRating;

    return matchesSearch && matchesType && matchesCity && matchesVerified && matchesRating;
  });

  return (
    <div className="w-full max-w-6xl mx-auto py-4 select-none font-sans" id="profile_engine_container">
      
      {/* ENTERPRISE TITLE HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-900 pb-6 mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Layout className="w-6 h-6 text-violet-500" />
            Dynamic Profile Engine
          </h2>
          <p className="text-xs text-slate-400 mt-1.5">
            Configure, deploy, and manage multiple public business identities and store entities from a single, unified Pi account.
          </p>
        </div>
        
        <div className="flex gap-2.5 w-full md:w-auto">
          <button
            onClick={() => setActiveView('playground')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
              activeView === 'playground'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Search Explorer</span>
          </button>
          
          <button
            onClick={() => {
              setActiveView('create');
              setWizardStep(1);
            }}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold bg-violet-600 text-white hover:bg-violet-500 transition-all rounded-xl shadow-lg shadow-violet-500/10 border border-violet-500/30"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Profile</span>
          </button>
        </div>
      </div>

      {/* VIEW DELEGATION LOGIC */}

      {/* HUB VIEW */}
      {activeView === 'hub' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* PROFILE SELECTOR PANEL (LEFT) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>Active Business Personas</span>
                <span className="font-mono text-[10px] text-violet-400 font-bold bg-violet-500/10 px-2 py-0.5 rounded-full">
                  {profiles.length} Ready
                </span>
              </h3>
              
              {profiles.length === 0 ? (
                <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                  <User className="w-8 h-8 text-slate-600" />
                  <p className="text-xs font-semibold">No active identities found</p>
                  <p className="text-[10px] text-slate-600 max-w-[200px]">Launch a store, service agency, or freelance professional card today.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {profiles.map(p => {
                    const isSelected = selectedProfile?.id === p.id;
                    const ProfileIcon = PROFILE_TYPES.find(t => t.type === p.pageType)?.icon || User;
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleSelectProfile(p)}
                        className={`p-3.5 rounded-xl border cursor-pointer text-left transition-all flex items-center gap-3 relative overflow-hidden ${
                          isSelected
                            ? 'bg-slate-850 border-violet-500/50 shadow-lg'
                            : 'bg-slate-950/40 border-slate-850 hover:bg-slate-850/50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white`}>
                          <ProfileIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-xs text-slate-200 truncate flex items-center gap-1.5">
                            {p.name}
                            {p.verificationBadge && <ShieldCheck className="w-3.5 h-3.5 text-amber-400 fill-amber-400/10 flex-shrink-0" />}
                          </h4>
                          <span className="text-[10px] text-slate-500 font-mono capitalize block mt-0.5">{p.pageType} Engine</span>
                        </div>
                        {isSelected && (
                          <div className="absolute right-0 top-0 w-1.5 h-full bg-violet-500"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* AI BUSINESS BUILDER PROMO BOX */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-900 border border-slate-850 rounded-2xl p-4.5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2.5">
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
              </div>
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Future Integration
              </span>
              <h4 className="font-bold text-xs text-slate-200 mt-3">Enterprise AI Business Builder</h4>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                Unlock full-stack automation. Generate rich bios, catalog categories, local SEO keyword registers, marketing plans, and customized responsive themes using Gemini-3.5-Flash.
              </p>
              <div className="mt-4 flex items-center gap-2 text-[10px] text-violet-400 font-bold hover:text-violet-300 cursor-pointer">
                <span>Explore Extension Points</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </div>

          {/* CHOSEN PROFILE HIGHLIGHT CARD (RIGHT) */}
          <div className="lg:col-span-8">
            {selectedProfile ? (
              <div className="space-y-6">
                
                {/* HERO BANNER BLOCK */}
                <div className="bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden shadow-xl">
                  <div className="h-32 bg-slate-800 relative overflow-hidden">
                    <img
                      src={selectedProfile.coverUrl || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&h=250&q=80'}
                      alt="Banner"
                      className="w-full h-full object-cover opacity-75"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                    
                    {/* Active Template Badge */}
                    <div className="absolute top-4 right-4 bg-slate-950/80 backdrop-blur border border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-1.5 text-[10px] text-slate-200 font-bold shadow-md">
                      <Layout className="w-3.5 h-3.5 text-violet-450" />
                      <span>Template: {selectedProfile.theme?.templateId?.toUpperCase() || 'ELECTRONICS'}</span>
                    </div>
                  </div>

                  <div className="px-6 pb-6 relative">
                    {/* Logo overlap offset */}
                    <div className="w-16 h-16 rounded-xl border border-slate-800 bg-slate-950 p-1.5 shadow-2xl absolute -top-8 left-6 overflow-hidden">
                      <img
                        src={selectedProfile.logoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&h=150&q=80'}
                        alt="Logo"
                        className="w-full h-full object-cover rounded-lg"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="pt-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold tracking-tight text-white">{selectedProfile.name}</h3>
                          {selectedProfile.verificationBadge && (
                            <span className="flex items-center gap-1 text-[9px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                              <ShieldCheck className="w-3 h-3 text-amber-400 fill-amber-400/10" />
                              Pi Verified KYC
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1 block">
                          Category: <span className="text-violet-400 font-bold uppercase font-mono">{selectedProfile.pageType}</span> | Area: {selectedProfile.serviceArea}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowQrCard(selectedProfile)}
                          className="p-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl transition-all border border-slate-700/30"
                          title="Generate QR Business Card"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => setActiveView('settings')}
                          className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-xl transition-all border border-slate-700/30"
                        >
                          <Settings className="w-3.5 h-3.5" />
                          <span>Settings</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* INFO DETAILS MATRIX */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Contact card */}
                  <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-850 pb-2">
                      Enterprise Contact Matrix
                    </h4>
                    <div className="space-y-3 font-mono text-xs">
                      <div className="flex items-center gap-2.5 text-slate-400">
                        <Mail className="w-4 h-4 text-violet-400" />
                        <span>{selectedProfile.contactInfo.email}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-slate-400">
                        <Phone className="w-4 h-4 text-violet-400" />
                        <span>{selectedProfile.contactInfo.phone}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-slate-400">
                        <MapPin className="w-4 h-4 text-violet-400" />
                        <span>{selectedProfile.address}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-slate-400">
                        <Clock className="w-4 h-4 text-violet-400" />
                        <span>{selectedProfile.workingHours}</span>
                      </div>
                    </div>
                  </div>

                  {/* Blockchain node credentials */}
                  <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-850 pb-2">
                      Pi Blockchain Configuration
                    </h4>
                    <div className="space-y-3 font-mono text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Destination Wallet:</span>
                        <span className="text-emerald-400 font-bold">Verified Direct</span>
                      </div>
                      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 select-all truncate text-[10px] text-slate-400 mt-1">
                        {selectedProfile.piWalletAddress}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span>Pi Payment Support:</span>
                        <span className="text-emerald-400 font-bold">ACTIVE</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* DETAILED BIO & SKILLS */}
                <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Business Biography & SEO Core
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {selectedProfile.description}
                  </p>
                  
                  <div className="pt-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase font-mono block mb-2">Category Keywords & Tags</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedProfile.skills.length === 0 ? (
                        <span className="text-xs text-slate-600 font-mono italic">No tags associated yet</span>
                      ) : (
                        selectedProfile.skills.map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 bg-violet-500/10 text-violet-400 font-mono text-[10px] font-bold rounded-lg border border-violet-500/20"
                          >
                            #{s}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* GALLERY / CERTIFICATE ATTACHMENTS PORTFOLIO */}
                <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                    <span>Business Media Gallery & Portfolio Certificates</span>
                    <span className="text-[10px] text-slate-500 font-mono">{galleryItems.length} Files</span>
                  </h4>

                  {galleryItems.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                      <FileText className="w-8 h-8 text-slate-750 mx-auto mb-2" />
                      <p className="text-xs font-semibold">No certificate media files uploaded yet</p>
                      <p className="text-[10px] text-slate-650 mt-1">Upload verified PDF credentials or high-res workshop image portfolios.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {galleryItems.map((url, idx) => (
                        <div key={idx} className="h-20 bg-slate-950 border border-slate-850 rounded-xl overflow-hidden relative group">
                          <img
                            src={url}
                            alt={`Gallery ${idx}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            onClick={() => setGalleryItems(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-1.5 right-1.5 p-1 bg-rose-650/80 hover:bg-rose-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-850 rounded-2xl p-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
                <Sparkles className="w-12 h-12 text-violet-500 animate-pulse" />
                <h3 className="text-base font-bold text-slate-300">Unlock Multi-Identity Business Setup</h3>
                <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                  As a verified Pi Pioneer, you are fully entitled to set up multiple identities tailored specifically to your trade. Click "Create Profile" to start.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* CREATE / ONBOARDING WIZARD VIEW */}
      {activeView === 'create' && (
        <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 md:p-8 max-w-3xl mx-auto shadow-2xl animate-fade-in relative">
          
          <button
            onClick={() => setActiveView('hub')}
            className="absolute top-6 right-6 text-slate-400 hover:text-white"
          >
            Cancel
          </button>

          {/* Stepper indicators */}
          <div className="flex items-center gap-2.5 mb-8">
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${wizardStep === 1 ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
              Step 1: Choose Profile Type
            </span>
            <ChevronRight className="w-3 h-3 text-slate-750" />
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${wizardStep === 2 ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
              Step 2: Dynamic Core Parameters
            </span>
          </div>

          {validationError && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-start gap-3 text-xs">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {/* STEP 1: SELECT TYPE */}
          {wizardStep === 1 && (
            <div>
              <h3 className="text-lg font-bold tracking-tight text-white mb-2">Select Public Identity Scope</h3>
              <p className="text-xs text-slate-400 mb-6">Assign the primary interface model for this profile. The template and metadata tags will adapt dynamically.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PROFILE_TYPES.map((t) => {
                  const Icon = t.icon;
                  const isSelected = wizardType === t.type;
                  return (
                    <div
                      key={t.type}
                      onClick={() => setWizardType(t.type)}
                      className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3.5 relative overflow-hidden group ${
                        isSelected
                          ? 'bg-slate-850 border-violet-500 shadow-md'
                          : 'bg-slate-950/40 border-slate-850 hover:bg-slate-850/40'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${t.color} flex items-center justify-center text-white`}>
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-100">{t.title}</h4>
                        <p className="text-[10px] text-slate-400 mt-1 leading-normal">{t.desc}</p>
                      </div>
                      {isSelected && (
                        <div className="absolute right-3 top-3 w-4 h-4 rounded-full bg-violet-600 flex items-center justify-center text-white">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setWizardStep(2)}
                  className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold bg-violet-600 text-white hover:bg-violet-500 transition-all rounded-xl"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DYNAMIC QUESTION FORM */}
          {wizardStep === 2 && (
            <form onSubmit={handleWizardSubmit} className="space-y-6">
              
              {/* AI BUILDER CO-PILOT ASSISTANCE HOOK */}
              <div className="bg-slate-950 p-4.5 rounded-xl border border-slate-850 flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-200">AI Business Builder Assistant</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 max-w-md leading-normal">
                      Automatically generate descriptive marketing profiles, localized category tags, and optimized titles matching the chosen profile scope.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSimulateAIGenerate}
                  disabled={aiLoading}
                  className="px-3 py-1.5 bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 rounded-lg text-[10px] font-bold border border-violet-500/35 flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                >
                  {aiLoading ? 'Thinking...' : 'Simulate Gemini'}
                </button>
              </div>

              {aiSuccessMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-[10px] font-mono">
                  {aiSuccessMsg}
                </div>
              )}

              {/* COMMON IDENTITY BLOCKS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Identity Display Name / Brand
                  </label>
                  <input
                    type="text"
                    required
                    value={wizardData.name}
                    onChange={(e) => setWizardData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={wizardType === 'store' ? 'e.g., Tokyo Gadget Hub' : 'e.g., Mercer Technical Consulting'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-violet-500 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Business Sector Category
                  </label>
                  <select
                    value={wizardData.category}
                    onChange={(e) => setWizardData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-violet-500 font-sans cursor-pointer"
                  >
                    {(CATEGORIES_BY_TYPE[wizardType] || ['Electronics', 'Technology', 'Services']).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* DYNAMIC FIELD DELEGATION BASED ON IDENTITY SCOPE */}
              {wizardType === 'store' && (
                <div className="space-y-4 border-t border-slate-850 pt-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Store Setup Scope</h4>
                  
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Store Description (Retail Core)
                    </label>
                    <textarea
                      required
                      value={wizardData.description}
                      onChange={(e) => setWizardData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe the physical/digital products offered at your storefront..."
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-violet-500 font-sans"
                    />
                  </div>
                </div>
              )}

              {wizardType === 'service' && (
                <div className="space-y-4 border-t border-slate-850 pt-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Service Setup Scope</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Core Technical Skills (Comma separated)
                      </label>
                      <input
                        type="text"
                        required
                        value={wizardData.skills}
                        onChange={(e) => setWizardData(prev => ({ ...prev, skills: e.target.value }))}
                        placeholder="e.g., Wiring, Custom diagnostic repair, active cooling"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-violet-500 font-sans"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Service Coverage Radius Area
                      </label>
                      <input
                        type="text"
                        required
                        value={wizardData.coverageArea}
                        onChange={(e) => setWizardData(prev => ({ ...prev, coverageArea: e.target.value }))}
                        placeholder="e.g., San Francisco Bay Area (25mi)"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-violet-500 font-sans"
                      />
                    </div>
                  </div>
                </div>
              )}

              {wizardType === 'professional' && (
                <div className="space-y-4 border-t border-slate-850 pt-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Professional Scope</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Practice Specialization
                      </label>
                      <input
                        type="text"
                        required
                        value={wizardData.skills}
                        onChange={(e) => setWizardData(prev => ({ ...prev, skills: e.target.value }))}
                        placeholder="e.g., Web3 Architecture, Ledger Engineering"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-violet-500 font-sans"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Corporate Experience (Years)
                      </label>
                      <input
                        type="text"
                        required
                        value={wizardData.experience}
                        onChange={(e) => setWizardData(prev => ({ ...prev, experience: e.target.value }))}
                        placeholder="e.g., 8+ Years Certified Specialist"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-violet-500 font-sans"
                      />
                    </div>
                  </div>
                </div>
              )}

              {wizardType === 'business' && (
                <div className="space-y-4 border-t border-slate-850 pt-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Enterprise Scope</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Company Name
                      </label>
                      <input
                        type="text"
                        required
                        value={wizardData.company}
                        onChange={(e) => setWizardData(prev => ({ ...prev, company: e.target.value }))}
                        placeholder="e.g., Satoshi Web3 Ventures Corp"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-violet-500 font-sans"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Industry Vertical
                      </label>
                      <input
                        type="text"
                        required
                        value={wizardData.industry}
                        onChange={(e) => setWizardData(prev => ({ ...prev, industry: e.target.value }))}
                        placeholder="e.g., Blockchain SaaS Development"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-violet-500 font-sans"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* GEOGRAPHIC LOCATION VALIDATION */}
              <div className="space-y-4 border-t border-slate-850 pt-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Verification Coordinates</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Physical Location / Address
                    </label>
                    <input
                      type="text"
                      value={wizardData.locationText}
                      onChange={(e) => setWizardData(prev => ({ ...prev, locationText: e.target.value }))}
                      placeholder="Street line/No."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-violet-500 font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      required
                      value={wizardData.city}
                      onChange={(e) => setWizardData(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="City (e.g. San Francisco)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-violet-500 font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      required
                      value={wizardData.country}
                      onChange={(e) => setWizardData(prev => ({ ...prev, country: e.target.value }))}
                      placeholder="Country (e.g. USA)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-violet-500 font-sans"
                    />
                  </div>
                </div>
              </div>

              {/* PI BLOCKCHAIN SETTLEMENT WALLET */}
              <div className="space-y-4 border-t border-slate-850 pt-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Blockchain Node Mapping</h4>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Settlement Pi Wallet Address (Verified Destination)
                  </label>
                  <input
                    type="text"
                    required
                    value={wizardData.piWallet}
                    onChange={(e) => setWizardData(prev => ({ ...prev, piWallet: e.target.value }))}
                    placeholder="Stellar format: G..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-violet-500 font-mono"
                  />
                </div>
              </div>

              {/* CONTROLS */}
              <div className="border-t border-slate-850 pt-6 flex justify-between">
                <button
                  type="button"
                  onClick={() => setWizardStep(1)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-violet-500/10 border border-violet-500/30 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Deploy Identity</span>
                </button>
              </div>

            </form>
          )}

        </div>
      )}

      {/* SETTINGS VIEW */}
      {activeView === 'settings' && selectedProfile && (
        <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 md:p-8 max-w-3xl mx-auto shadow-2xl animate-fade-in relative">
          
          <button
            onClick={() => setActiveView('hub')}
            className="absolute top-6 right-6 text-slate-400 hover:text-white"
          >
            Cancel
          </button>

          <h3 className="text-lg font-bold tracking-tight text-white mb-6">Profile Settings: {selectedProfile.name}</h3>

          <div className="space-y-6">
            
            {/* THEME CONFIGURATION */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">Custom Theme Branding</h4>
              
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase mb-2">Theme color accent</label>
                <div className="flex gap-3">
                  {['violet', 'emerald', 'amber', 'rose'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setTheme(c)}
                      className={`px-4 py-2 text-xs font-semibold rounded-lg border uppercase ${
                        theme === c
                          ? 'bg-violet-600/20 text-violet-400 border-violet-500'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* VISIBILITY & PRIVACY SCHEMES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">Discovery Visibility</h4>
                <div className="flex gap-3">
                  {['visible', 'hidden'].map((v) => (
                    <button
                      key={v}
                      onClick={() => setVisibility(v as any)}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg border uppercase ${
                        visibility === v
                          ? 'bg-violet-600/20 text-violet-400 border-violet-500'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">Privacy Level</h4>
                <div className="flex gap-3">
                  {['public', 'private'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setPrivacy(p as any)}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg border uppercase ${
                        privacy === p
                          ? 'bg-violet-600/20 text-violet-400 border-violet-500'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* HOURLY SCHEDULE picker */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">Business operating hours</h4>
              <div>
                <input
                  type="text"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="e.g., Monday - Friday 9:00 AM - 6:00 PM"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-violet-500 font-mono"
                />
              </div>
            </div>

            {/* ENTERPRISE SOCIAL MATRIX */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">Social Integration Coordinates</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase mb-2">Website</label>
                  <input
                    type="text"
                    value={socialLinks.website}
                    onChange={(e) => setSocialLinks(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://mybusiness.pi"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase mb-2">Telegram username</label>
                  <input
                    type="text"
                    value={socialLinks.telegram}
                    onChange={(e) => setSocialLinks(prev => ({ ...prev, telegram: e.target.value }))}
                    placeholder="@pioneer_hq"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase mb-2">WhatsApp Business</label>
                  <input
                    type="text"
                    value={socialLinks.whatsapp}
                    onChange={(e) => setSocialLinks(prev => ({ ...prev, whatsapp: e.target.value }))}
                    placeholder="+1 415 889..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase mb-2">LinkedIn Page</label>
                  <input
                    type="text"
                    value={socialLinks.linkedin}
                    onChange={(e) => setSocialLinks(prev => ({ ...prev, linkedin: e.target.value }))}
                    placeholder="linkedin.com/company/..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* SECURE CERTIFICATE & PORTFOLIO MEDIA UPLOAD */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">Portfolio Media Upload Verification</h4>
              
              <div className="border border-dashed border-slate-800 rounded-xl p-6 text-center">
                <Upload className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-300">Drag & Drop or Click to Select File</p>
                <p className="text-[10px] text-slate-500 mt-1">JPEG, PNG, WEBP or PDF (Max 5MB). Fully validated and encrypted.</p>
                
                <input
                  type="file"
                  onChange={handleMediaUpload}
                  className="hidden"
                  id="media_upload_input"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                />
                <label
                  htmlFor="media_upload_input"
                  className="mt-4 inline-block px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Browse Files
                </label>
              </div>

              {uploadStatus && (
                <div className="p-3 bg-violet-950/20 border border-violet-800/20 text-violet-300 rounded-xl text-[10px] font-mono leading-normal">
                  {uploadStatus}
                </div>
              )}
            </div>

            {/* ACTION TRIGGERS */}
            <div className="border-t border-slate-850 pt-6 flex justify-end gap-3">
              <button
                onClick={() => setActiveView('hub')}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              
              <button
                onClick={handleSaveSettings}
                className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-violet-500/10 border border-violet-500/30 cursor-pointer"
              >
                Save Settings
              </button>
            </div>

          </div>

        </div>
      )}

      {/* SEARCH explorer PLAYGROUND VIEW */}
      {activeView === 'playground' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* FILTER CRITERIA BOX */}
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4 font-mono">Enterprise Search Ready Directory</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-4 relative">
                <Search className="absolute left-3 top-3 w-4.5 h-4.5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Name, Skill, Category, Service..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <div className="md:col-span-3">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Profile Interfaces</option>
                  <option value="store">Store Front Profiles</option>
                  <option value="service">Service Profiles</option>
                  <option value="professional">Professional Profiles</option>
                  <option value="business">NGO / Business Profiles</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <input
                  type="text"
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  placeholder="Filter by City (e.g. Rome)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <div className="md:col-span-3 flex items-center justify-between px-2">
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyVerified}
                    onChange={(e) => setOnlyVerified(e.target.checked)}
                    className="rounded border-slate-800 text-violet-600 focus:ring-violet-500 cursor-pointer"
                  />
                  <span>KYC Verified only</span>
                </label>

                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterType('all');
                    setFilterCity('');
                    setOnlyVerified(false);
                  }}
                  className="text-[10px] font-bold text-violet-400 hover:text-violet-300"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* SEARCH RESULTS DIRECTORY */}
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-6 flex items-center justify-between font-mono">
              <span>Directory Results</span>
              <span>{playFilteredProfiles.length} Hits</span>
            </h4>

            {playFilteredProfiles.length === 0 ? (
              <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
                <Compass className="w-12 h-12 text-slate-800 animate-spin" />
                <h4 className="text-sm font-bold text-slate-300">No records found</h4>
                <p className="text-xs text-slate-450 max-w-sm">Try widening your geographic search queries or removing key sectors parameters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {playFilteredProfiles.map((p) => {
                  const ProfileIcon = PROFILE_TYPES.find(t => t.type === p.pageType)?.icon || User;
                  return (
                    <div
                      key={p.id}
                      className="bg-slate-950/60 border border-slate-850 rounded-2xl p-5 hover:border-violet-500/30 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-8 h-8 rounded-lg bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                            <ProfileIcon className="w-4.5 h-4.5" />
                          </div>
                          
                          {p.verificationBadge && (
                            <span className="flex items-center gap-1 text-[8px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                              KYC Approved
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">{p.name}</h4>
                        <span className="text-[10px] font-mono text-slate-550 capitalize mt-1 block">Sector: {p.pageType}</span>
                        
                        <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed font-sans line-clamp-3">
                          {p.description}
                        </p>
                      </div>

                      <div className="border-t border-slate-850/60 mt-4 pt-3.5 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {p.location?.city || p.serviceArea}
                        </span>

                        <span className="text-[10px] text-amber-400 font-bold font-mono">
                          ★ {p.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* QR BUSINESS CARD DIALOG / MODAL */}
      {showQrCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative text-center">
            <button
              onClick={() => setShowQrCard(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white font-bold"
            >
              ✕
            </button>
            
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-full border border-violet-500/20">
              Pi Digital Identity Card
            </span>

            <div className="mt-6 flex flex-col items-center">
              {/* Profile details */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white mb-3 shadow-md">
                <Store className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base text-slate-100">{showQrCard.name}</h4>
              <p className="text-xs text-slate-400 font-mono mt-1">{showQrCard.pageType.toUpperCase()} IDENTITY</p>

              {/* QR Image Box */}
              <div className="w-48 h-48 bg-white rounded-2xl mt-6 p-4 border-4 border-violet-600/20 flex items-center justify-center relative overflow-hidden">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://pi.business/profile/${showQrCard.id}`}
                  alt="Identity QR"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              <p className="text-[10px] text-slate-500 font-mono mt-4 leading-normal max-w-[240px]">
                Scan to resolve decentralized Pioneer ID: <span className="text-violet-400 break-all">{showQrCard.id}</span>
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
