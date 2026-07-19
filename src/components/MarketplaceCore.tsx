/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  Shield,
  Award,
  TrendingUp,
  SlidersHorizontal,
  History,
  RotateCcw,
  Trash2,
  RefreshCw,
  Plus,
  Eye,
  CheckCircle,
  AlertCircle,
  Briefcase,
  Wrench,
  ShoppingBag,
  Cpu,
  BarChart2,
  QrCode,
  DollarSign,
  Users,
  ChevronRight,
  Sparkles,
  Info,
  Calendar,
  Layers,
  ArrowLeft
} from 'lucide-react';
import {
  UnifiedListing,
  PioneerProfile,
  VerificationLevel,
  ListingType,
  ListingStatus,
  ProfileVersion,
  TrustMetrics,
  User
} from '../types';
import { PiBusinessMarketDB } from '../services/storage';

interface MarketplaceCoreProps {
  currentUser: User;
  onNavigate: (view: string, params?: any) => void;
}

export default function MarketplaceCore({
  currentUser,
  onNavigate
}: MarketplaceCoreProps) {
  // Database States
  const [listings, setListings] = useState<UnifiedListing[]>([]);
  const [profiles, setProfiles] = useState<PioneerProfile[]>([]);
  const [selectedListing, setSelectedListing] = useState<UnifiedListing | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<PioneerProfile | null>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ListingType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<ListingStatus | 'all'>('published');
  
  // Geolocation & Radius Search
  const [userLat, setUserLat] = useState<number>(37.7749); // SF center by default
  const [userLng, setUserLng] = useState<number>(-122.4194);
  const [radiusKm, setRadiusKm] = useState<number>(50);
  const [enableGeoFilter, setEnableGeoFilter] = useState(false);
  const [simulatedCity, setSimulatedCity] = useState('San Francisco, CA');

  // Trust & Verification Filters
  const [minTrustScore, setMinTrustScore] = useState<number>(100);
  const [minVerification, setMinVerification] = useState<VerificationLevel | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Listing Form Creation State
  const [isCreating, setIsCreating] = useState(false);
  const [newListingType, setNewListingType] = useState<ListingType>('physical');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    pricePi: 10,
    status: 'published' as ListingStatus,
    tags: '',
    imageUrl: '',
    addressText: 'Pioneer Square, San Francisco',
    city: 'San Francisco',
    state: 'California',
    country: 'United States',
    pinCode: '94103',
    lat: 37.7749,
    lng: -122.4194,
    // Physical / Digital
    stock: 10,
    isDigital: false,
    downloadUrl: '',
    // Service
    durationMinutes: 60,
    coverageRadiusKm: 10,
    availabilitySchedule: 'Weekdays 9 AM - 5 PM',
    // Job
    salaryType: 'fixed' as 'hourly' | 'fixed' | 'monthly',
    locationType: 'on_site' as 'remote' | 'on_site' | 'hybrid',
    requirements: 'Reliability, clean record, professional gear',
    salaryRange: '10 - 25 Pi'
  });

  // Load Initial Data
  const loadData = () => {
    setListings(PiBusinessMarketDB.getUnifiedListings());
    setProfiles(PiBusinessMarketDB.getPioneerProfiles());
    
    // Auto-update if a profile is currently open to reflect snapshot rollbacks immediately
    if (selectedProfile) {
      const fresh = PiBusinessMarketDB.getPioneerProfileById(selectedProfile.id);
      if (fresh) setSelectedProfile(fresh);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Quick preset locations for the simulated Pioneer GPS
  const handleSetSimulatedLocation = (city: string, lat: number, lng: number) => {
    setUserLat(lat);
    setUserLng(lng);
    setSimulatedCity(city);
    loadData();
  };

  // Filter listings
  const filteredListings = listings.filter(l => {
    // 1. Text Search match
    const text = searchQuery.toLowerCase();
    const matchesText = 
      l.title.toLowerCase().includes(text) ||
      l.description.toLowerCase().includes(text) ||
      l.tags.some(t => t.toLowerCase().includes(text)) ||
      l.ownerName.toLowerCase().includes(text);

    // 2. Listing Type match
    const matchesType = selectedType === 'all' || l.type === selectedType;

    // 3. Status match
    const matchesStatus = selectedStatus === 'all' || l.status === selectedStatus;

    // 4. Geolocation Circle radius search
    let matchesGeo = true;
    if (enableGeoFilter && l.location) {
      const distance = PiBusinessMarketDB.calculateDistanceKm(
        userLat,
        userLng,
        l.location.lat,
        l.location.lng
      );
      matchesGeo = distance <= radiusKm;
    }

    // 5. Trust and Verification matches from profile owner
    const ownerProfile = profiles.find(p => p.id === l.profileId);
    let matchesTrust = true;
    let matchesVerification = true;

    if (ownerProfile) {
      if (minTrustScore > 100) {
        matchesTrust = (ownerProfile.trustScore || 500) >= minTrustScore;
      }
      if (minVerification !== 'all') {
        const tiers: VerificationLevel[] = [
          'basic', 'email_verified', 'phone_verified', 'pi_verified', 
          'kyc_verified', 'business_verified', 'professional_verified', 
          'official_partner', 'government_verified'
        ];
        const currentIdx = tiers.indexOf(ownerProfile.verificationLevel || 'basic');
        const requiredIdx = tiers.indexOf(minVerification);
        matchesVerification = currentIdx >= requiredIdx;
      }
    }

    return matchesText && matchesType && matchesStatus && matchesGeo && matchesTrust && matchesVerification;
  });

  // Calculate distance helper for rendering items
  const getDistanceText = (l: UnifiedListing) => {
    if (!l.location) return 'N/A';
    const dist = PiBusinessMarketDB.calculateDistanceKm(userLat, userLng, l.location.lat, l.location.lng);
    return `${dist.toFixed(1)} km away`;
  };

  // Rollback trigger
  const handleRollback = (profileId: string, version: number) => {
    try {
      const updated = PiBusinessMarketDB.rollbackProfileVersion(profileId, version);
      setSelectedProfile(updated);
      loadData();
    } catch (err) {
      alert('Rollback failed: ' + err);
    }
  };

  // Soft delete trigger
  const handleToggleSoftDelete = (profileId: string, isDeleted: boolean) => {
    if (isDeleted) {
      PiBusinessMarketDB.recoverPioneerProfile(profileId);
    } else {
      PiBusinessMarketDB.softDeletePioneerProfile(profileId);
    }
    loadData();
  };

  // Submit new Listing
  const handleCreateListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return;

    // Resolve or find the current active Pioneer's Profile. If none, create a sandbox profile automatically
    let activeProfile = profiles.find(p => p.ownerUid === currentUser.uid);
    if (!activeProfile) {
      // Auto deploy professional profile in database
      activeProfile = PiBusinessMarketDB.createPioneerProfile({
        ownerUid: currentUser.uid,
        name: currentUser.displayName,
        businessName: `${currentUser.displayName} Services`,
        category: 'freelancer',
        pageType: 'professional',
        skills: ['Web3 Development', 'Consultancy'],
        description: 'Autodeployed Sandbox Developer Profile',
        photoUrls: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80'],
        videoUrls: [],
        serviceArea: 'San Francisco, CA',
        address: 'Downtown, San Francisco, CA',
        location: {
          lat: userLat,
          lng: userLng,
          addressText: 'Financial District, San Francisco'
        },
        contactInfo: {
          email: 'pioneer@pinetwork.org',
          phone: '+1 555-PI-COIN'
        },
        workingHours: '9:00 AM - 6:00 PM',
        piPaymentSupported: true,
        piWalletAddress: currentUser.walletAddress,
        availabilityStatus: 'available',
        verificationLevel: 'kyc_verified'
      });
    }

    const price = Number(formData.pricePi) || 1;

    // Structure metadata based on selected domain
    let productDetails;
    let serviceDetails;
    let jobDetails;

    if (newListingType === 'physical' || newListingType === 'digital') {
      productDetails = {
        stock: Number(formData.stock) || 1,
        isDigital: newListingType === 'digital',
        downloadUrl: formData.downloadUrl || undefined,
        category: newListingType === 'digital' ? 'digital_services' : 'electronics'
      };
    } else if (newListingType === 'service') {
      serviceDetails = {
        durationMinutes: Number(formData.durationMinutes) || 60,
        coverageRadiusKm: Number(formData.coverageRadiusKm) || 10,
        availabilitySchedule: formData.availabilitySchedule
      };
    } else if (newListingType === 'job') {
      jobDetails = {
        salaryType: formData.salaryType,
        locationType: formData.locationType,
        requirements: formData.requirements.split(',').map(r => r.trim()),
        salaryRange: formData.salaryRange
      };
    }

    // Call store method
    PiBusinessMarketDB.createUnifiedListing({
      profileId: activeProfile.id,
      ownerUid: currentUser.uid,
      ownerName: activeProfile.name,
      type: newListingType,
      title: formData.title,
      description: formData.description,
      pricePi: price,
      status: formData.status,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      imageUrls: [formData.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&h=400&q=80'],
      location: {
        lat: Number(formData.lat) || userLat,
        lng: Number(formData.lng) || userLng,
        addressText: formData.addressText,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        pinCode: formData.pinCode,
        geoHash: '' // computed in store
      },
      productDetails,
      serviceDetails,
      jobDetails
    });

    setIsCreating(false);
    // Reset form
    setFormData(prev => ({
      ...prev,
      title: '',
      description: '',
      pricePi: 10,
      tags: ''
    }));
    loadData();
  };

  return (
    <div className="space-y-8 py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left select-none" id="marketplace_core_root">
      
      {/* ENTERPRISE ARCHITECTURAL BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden" id="hero_header">
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-600/10 text-violet-400 font-mono text-[9px] font-bold uppercase tracking-wider border border-violet-500/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Unified SuperApp Architecture • Phase 5 Core
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-sans text-slate-100 tracking-tight">
              Pi Marketplace Core Engine
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Experience the global consensus hub. Cross-query, locate, and transact physical goods, professional services, and high-paying jobs in real-time. Verified by the Pi Network Trust Engine.
            </p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-lg shadow-violet-500/10 transition-all border border-violet-500/30 shrink-0 self-start md:self-center cursor-pointer"
            id="btn_publish_listing_root"
          >
            <Plus className="w-4 h-4" />
            <span>Publish Unified Listing</span>
          </button>
        </div>
      </div>

      {/* THREE INTERACTIVE BLOCKS IN A ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: CRITICAL CONTROLS & GPS (4 COLS) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* SIMULATED PIONEER GPS CORE */}
          <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 shadow-lg space-y-4" id="pioneer_gps_control">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold font-sans text-slate-200 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-violet-400" />
                Simulated Pioneer GPS
              </h3>
              <span className="text-[10px] font-mono font-bold uppercase bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-md border border-violet-500/20">
                Live Satellites
              </span>
            </div>
            
            <div className="bg-slate-900 rounded-xl p-3 border border-slate-800/80 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">GPS Coordinate Lat:</span>
                <span className="font-mono text-slate-100 font-bold">{userLat.toFixed(5)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">GPS Coordinate Lng:</span>
                <span className="font-mono text-slate-100 font-bold">{userLng.toFixed(5)}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-slate-800 pt-2">
                <span className="text-slate-400 font-medium">Simulated Location:</span>
                <span className="font-semibold text-amber-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  {simulatedCity}
                </span>
              </div>
            </div>

            {/* PRESETS */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider">Select Preset Pioneer Nodes:</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSetSimulatedLocation('San Francisco, CA', 37.7749, -122.4194)}
                  className={`px-3 py-1.5 rounded-lg text-left text-[11px] font-medium border transition-all cursor-pointer ${
                    simulatedCity.includes('San Francisco') 
                      ? 'bg-violet-600/10 text-violet-300 border-violet-500/30' 
                      : 'bg-slate-900 border-slate-850 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                  }`}
                >
                  📍 San Francisco
                </button>
                <button
                  onClick={() => handleSetSimulatedLocation('San Jose, CA', 37.3382, -121.8863)}
                  className={`px-3 py-1.5 rounded-lg text-left text-[11px] font-medium border transition-all cursor-pointer ${
                    simulatedCity.includes('San Jose') 
                      ? 'bg-violet-600/10 text-violet-300 border-violet-500/30' 
                      : 'bg-slate-900 border-slate-850 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                  }`}
                >
                  📍 San Jose
                </button>
                <button
                  onClick={() => handleSetSimulatedLocation('Oakland, CA', 37.8044, -122.2711)}
                  className={`px-3 py-1.5 rounded-lg text-left text-[11px] font-medium border transition-all cursor-pointer ${
                    simulatedCity.includes('Oakland') 
                      ? 'bg-violet-600/10 text-violet-300 border-violet-500/30' 
                      : 'bg-slate-900 border-slate-850 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                  }`}
                >
                  📍 Oakland
                </button>
                <button
                  onClick={() => handleSetSimulatedLocation('Berkeley, CA', 37.8715, -122.2730)}
                  className={`px-3 py-1.5 rounded-lg text-left text-[11px] font-medium border transition-all cursor-pointer ${
                    simulatedCity.includes('Berkeley') 
                      ? 'bg-violet-600/10 text-violet-300 border-violet-500/30' 
                      : 'bg-slate-900 border-slate-850 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                  }`}
                >
                  📍 Berkeley
                </button>
              </div>
            </div>

            {/* RAD SEARCH TOGGLE */}
            <div className="border-t border-slate-800 pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Enable Radius Search</span>
                <input
                  type="checkbox"
                  checked={enableGeoFilter}
                  onChange={(e) => setEnableGeoFilter(e.target.checked)}
                  className="w-4 h-4 text-violet-600 bg-slate-900 border-slate-800 rounded focus:ring-violet-500 cursor-pointer"
                />
              </div>
              
              {enableGeoFilter && (
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>Radius Limit:</span>
                    <span className="text-violet-400 font-bold">{radiusKm} km</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                  />
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Uses high-fidelity Haversine calculation to filter localized Pioneer services & jobs on the fly.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* SAAS TRUST & VERIFICATION TIER CONTROLS */}
          <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 shadow-lg space-y-4" id="trust_and_verification_filter_module">
            <h3 className="text-sm font-bold font-sans text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Shield className="w-4 h-4 text-amber-400" />
              Consensus Verification Gate
            </h3>

            {/* TRUST SLIDER */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-medium">Minimum Trust Score:</span>
                <span className="font-mono text-amber-400 font-bold">{minTrustScore} / 1000</span>
              </div>
              <input
                type="range"
                min="100"
                max="1000"
                step="50"
                value={minTrustScore}
                onChange={(e) => setMinTrustScore(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <p className="text-[10px] text-slate-500">
                Harden requirements to filter listings authored by Pioneers with proven on-chain completion histories.
              </p>
            </div>

            {/* VERIFICATION LEVEL */}
            <div className="space-y-2 pt-2 border-t border-slate-850">
              <label className="block text-xs font-semibold text-slate-300">Required Verification Level:</label>
              <select
                value={minVerification}
                onChange={(e) => setMinVerification(e.target.value as VerificationLevel | 'all')}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-slate-300 focus:outline-none focus:border-violet-500 cursor-pointer"
              >
                <option value="all">Any Account Level (Inclusive)</option>
                <option value="basic">Basic Node</option>
                <option value="email_verified">Email Verified</option>
                <option value="phone_verified">Phone Verified</option>
                <option value="pi_verified">Pi Network Account Verified</option>
                <option value="kyc_verified">Consensus KYC Verified</option>
                <option value="business_verified">Verified Local Merchant</option>
                <option value="professional_verified">Verified Service Provider</option>
                <option value="official_partner">Official SuperApp Partner</option>
                <option value="government_verified">Government Registry Authenticated</option>
              </select>
            </div>
          </div>

          {/* BACKWARD COMPATIBILITY GATEWAY */}
          <div className="bg-slate-950 rounded-2xl p-4 border border-slate-850 shadow-sm space-y-2 text-center">
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md font-bold">
              Complete Backward Compatibility
            </span>
            <p className="text-[11px] text-slate-500">
              Synchronized legacy structures. Products, Services, and Jobs items remain fully accessible to legacy API and database clients without modifications.
            </p>
          </div>

        </div>

        {/* RIGHT COLUMN: SEARCH, FEED & RESULTS (8 COLS) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* FILTER CONTROLS HUB */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4" id="listings_query_hub">
            
            {/* SEARCH INPUT */}
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search products, jobs, and services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 font-medium"
              />
            </div>

            {/* FILTERS */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              {/* Type Category Filter Buttons */}
              <button
                onClick={() => setSelectedType('all')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  selectedType === 'all' 
                    ? 'bg-violet-600 text-white border-violet-500/20' 
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                All Unified Feed
              </button>
              <button
                onClick={() => setSelectedType('physical')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  selectedType === 'physical' 
                    ? 'bg-violet-600 text-white border-violet-500/20' 
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Physical Products
              </button>
              <button
                onClick={() => setSelectedType('digital')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  selectedType === 'digital' 
                    ? 'bg-violet-600 text-white border-violet-500/20' 
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Digital Assets
              </button>
              <button
                onClick={() => setSelectedType('service')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  selectedType === 'service' 
                    ? 'bg-violet-600 text-white border-violet-500/20' 
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Local Services
              </button>
              <button
                onClick={() => setSelectedType('job')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  selectedType === 'job' 
                    ? 'bg-violet-600 text-white border-violet-500/20' 
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Consensus Jobs
              </button>
            </div>
          </div>

          {/* SELECTION STATE OVERLAYS OR FEED */}
          {filteredListings.length === 0 ? (
            <div className="bg-slate-950 rounded-2xl border border-slate-850 p-12 text-center space-y-4" id="listings_empty_state">
              <AlertCircle className="w-12 h-12 text-slate-600 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-slate-200 font-bold text-sm">No Listings Match Filters</h4>
                <p className="text-slate-500 text-xs max-w-md mx-auto">
                  Try clearing search inputs, disabling simulated radius circles, lowering required trust sliders, or expanding your presets.
                </p>
              </div>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedType('all');
                  setEnableGeoFilter(false);
                  setMinTrustScore(100);
                  setMinVerification('all');
                }}
                className="px-4 py-2 bg-slate-900 text-slate-300 border border-slate-800 rounded-xl text-xs font-semibold hover:bg-slate-850 transition-all cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="listings_grid">
              {filteredListings.map(l => {
                const ownerProfile = profiles.find(p => p.id === l.profileId);
                const score = ownerProfile?.trustScore || 500;
                const level = ownerProfile?.verificationLevel || 'pi_verified';

                return (
                  <div
                    key={l.id}
                    onClick={() => {
                      setSelectedListing(l);
                      if (ownerProfile) setSelectedProfile(ownerProfile);
                    }}
                    className="bg-slate-950 rounded-2xl border border-slate-850 hover:border-violet-500/50 transition-all overflow-hidden flex flex-col justify-between group cursor-pointer shadow-md"
                  >
                    
                    {/* TOP HALF METADATA */}
                    <div>
                      {/* Image Frame */}
                      <div className="relative h-44 overflow-hidden bg-slate-900">
                        <img
                          src={l.imageUrls[0]}
                          alt={l.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
                        
                        {/* Tags & Type badges */}
                        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wide border shadow-md ${
                            l.type === 'physical' ? 'bg-indigo-600/90 text-white border-indigo-500/20' :
                            l.type === 'digital' ? 'bg-violet-600/90 text-white border-violet-500/20' :
                            l.type === 'service' ? 'bg-amber-600/90 text-slate-950 border-amber-500/20 font-bold' :
                            'bg-emerald-600/90 text-white border-emerald-500/20'
                          }`}>
                            {l.type.toUpperCase()}
                          </span>
                          
                          {l.status !== 'published' && (
                            <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[8px] font-bold uppercase">
                              {l.status}
                            </span>
                          )}
                        </div>

                        {/* Price Tag Overlay */}
                        <div className="absolute bottom-3 right-3 px-3 py-1 bg-amber-400 text-slate-950 font-bold font-mono text-sm rounded-xl border border-amber-300 shadow-lg">
                          π {l.pricePi}
                        </div>
                      </div>

                      {/* Info body */}
                      <div className="p-4 space-y-2 text-left">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            {l.location?.city || 'San Francisco'} • {getDistanceText(l)}
                          </span>
                          <span className="text-[9px] text-slate-500 font-bold">
                            HASH: {l.location?.geoHash || 'N/A'}
                          </span>
                        </div>

                        <h4 className="font-bold text-sm text-slate-100 group-hover:text-violet-400 transition-colors tracking-tight">
                          {l.title}
                        </h4>

                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {l.description}
                        </p>
                      </div>
                    </div>

                    {/* BOTTOM HALF TRUST ENGINE STRIP */}
                    <div className="p-3.5 bg-slate-900/60 border-t border-slate-900 flex items-center justify-between">
                      {/* Author */}
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-900/40 border border-indigo-500/10 flex items-center justify-center font-bold text-slate-200 text-xs">
                          {l.ownerName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-200 leading-none">{l.ownerName}</p>
                          <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-wider font-mono font-bold flex items-center gap-0.5">
                            <Shield className="w-2.5 h-2.5 text-amber-400" />
                            {level.replace('_', ' ')}
                          </p>
                        </div>
                      </div>

                      {/* Trust Score circular design */}
                      <div className="text-right flex items-center gap-2">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold font-sans">Trust Index</p>
                          <p className="text-[11px] font-bold font-mono text-amber-400">{score}/1000</p>
                        </div>
                        <div className="w-8 h-8 rounded-full border-2 border-amber-400/20 flex items-center justify-center relative">
                          {/* Circle completion graphic */}
                          <div className="absolute inset-0.5 rounded-full border border-amber-400/40 border-dashed animate-spin duration-10000"></div>
                          <span className="text-[8px] font-mono text-amber-400 font-extrabold">π</span>
                        </div>
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>

      {/* DETAIL MODAL DRAWER OVERLAY (COMPREHENSIVE MULTI-MODULE) */}
      {selectedListing && selectedProfile && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50 animate-fade-in" id="enterprise_detail_drawer_overlay">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative flex flex-col justify-between">
            
            {/* Header with dismiss */}
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900 sticky top-0 z-20">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-violet-600/15 text-violet-400 border border-violet-500/20 text-[10px] font-mono font-bold rounded">
                  TRANSACTION CORE
                </span>
                <h2 className="text-base font-bold text-slate-200 font-sans tracking-tight">
                  {selectedListing.title}
                </h2>
              </div>
              <button
                onClick={() => {
                  setSelectedListing(null);
                  setSelectedProfile(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Inner modular body */}
            <div className="p-6 space-y-8 text-left">
              
              {/* SECTION A: PRODUCT/SERVICE METADATA AND PRICING */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Visual */}
                <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 h-56 relative">
                  <img
                    src={selectedListing.imageUrls[0]}
                    alt={selectedListing.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 px-4 py-1.5 bg-amber-400 text-slate-950 font-mono font-bold rounded-xl border border-amber-300 text-base shadow-lg">
                    π {selectedListing.pricePi}
                  </div>
                </div>

                {/* Scope specific lists */}
                <div className="space-y-4">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-violet-600/10 text-violet-400 font-mono text-[9px] font-bold uppercase tracking-wider border border-violet-500/20">
                    Unified Category: {selectedListing.type}
                  </span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {selectedListing.description}
                  </p>

                  {/* DOMAIN SPECIFICS */}
                  {selectedListing.productDetails && (
                    <div className="bg-slate-950 rounded-xl p-3 border border-slate-850 text-xs space-y-1">
                      <p className="text-slate-400 font-medium">Physical Stock: <span className="text-slate-100 font-bold">{selectedListing.productDetails.stock} units</span></p>
                      <p className="text-slate-400 font-medium">Digital Product: <span className="text-slate-100 font-bold">{selectedListing.productDetails.isDigital ? 'Yes (Download Link Available)' : 'No'}</span></p>
                      {selectedListing.productDetails.downloadUrl && (
                        <p className="text-slate-400 font-medium">Download URL: <span className="text-violet-400 font-mono font-bold break-all">{selectedListing.productDetails.downloadUrl}</span></p>
                      )}
                    </div>
                  )}

                  {selectedListing.serviceDetails && (
                    <div className="bg-slate-950 rounded-xl p-3 border border-slate-850 text-xs space-y-1">
                      <p className="text-slate-400 font-medium">Service Duration: <span className="text-slate-100 font-bold">{selectedListing.serviceDetails.durationMinutes} minutes</span></p>
                      <p className="text-slate-400 font-medium">Coverage Radius: <span className="text-slate-100 font-bold">{selectedListing.serviceDetails.coverageRadiusKm} km</span></p>
                      <p className="text-slate-400 font-medium">Availability Calendar: <span className="text-amber-400 font-semibold">{selectedListing.serviceDetails.availabilitySchedule}</span></p>
                    </div>
                  )}

                  {selectedListing.jobDetails && (
                    <div className="bg-slate-950 rounded-xl p-3 border border-slate-850 text-xs space-y-2">
                      <p className="text-slate-400 font-medium">Employment Type: <span className="text-slate-100 font-bold uppercase">{selectedListing.jobDetails.locationType} • {selectedListing.jobDetails.salaryType}</span></p>
                      <p className="text-slate-400 font-medium">Salary Range: <span className="text-emerald-400 font-bold font-mono">{selectedListing.jobDetails.salaryRange || 'Commission Based'}</span></p>
                      <div>
                        <p className="text-slate-400 font-medium">Candidate Requirements:</p>
                        <ul className="list-disc list-inside text-slate-300 mt-1 pl-1 space-y-0.5">
                          {selectedListing.jobDetails.requirements.map((req, i) => (
                            <li key={i}>{req}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Buy / Book / Apply CTA */}
                  <button
                    onClick={() => {
                      alert(`Transaction for "${selectedListing.title}" initiated on Pi Blockchain Sandbox. Wallet designated: ${selectedProfile.piWalletAddress}`);
                    }}
                    className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-500/10 transition-all border border-violet-500/30 cursor-pointer text-center"
                  >
                    {selectedListing.type === 'job' ? 'Apply for job listing (π)' : selectedListing.type === 'service' ? 'Book Local Service (π)' : 'Secure purchase via Pi Wallet'}
                  </button>

                </div>
              </div>

              {/* MODULE B: THE DYNAMIC PROFILE ENGINE SUBPANEL */}
              <div className="border-t border-slate-800 pt-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <Users className="w-4 h-4 text-violet-400" />
                      Dynamic Profile Engine Context
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Single-account multi-identity context verified through dynamic trust scores.
                    </p>
                  </div>
                  
                  {/* Soft Delete recover */}
                  <div className="flex items-center gap-2.5">
                    {selectedProfile.softDeleted ? (
                      <button
                        onClick={() => handleToggleSoftDelete(selectedProfile.id, true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold transition-all cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Recover Profile
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleSoftDelete(selectedProfile.id, false)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] font-bold transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        Soft Delete Profile
                      </button>
                    )}
                  </div>
                </div>

                {/* Profile Card Summary */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Bio details */}
                  <div className="md:col-span-4 space-y-3 border-b md:border-b-0 md:border-r border-slate-800 pb-4 md:pb-0 md:pr-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center font-bold text-slate-200">
                        {selectedProfile.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-100 leading-none">{selectedProfile.name}</h4>
                        <span className="text-[10px] text-violet-400 font-mono mt-1 block uppercase tracking-wider font-semibold">
                          {selectedProfile.pageType} • {selectedProfile.category.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {selectedProfile.description}
                    </p>
                    <div className="text-[10px] space-y-1 text-slate-500 font-mono">
                      <p>📧 {selectedProfile.contactInfo.email}</p>
                      <p>📞 {selectedProfile.contactInfo.phone}</p>
                      <p>🕒 Hours: {selectedProfile.workingHours}</p>
                    </div>
                  </div>

                  {/* Trust metrics circular rings & Progress logs */}
                  <div className="md:col-span-4 space-y-4">
                    <h5 className="text-[11px] font-mono uppercase text-amber-400 tracking-wider font-bold">Trust Metrics Breakdown</h5>
                    
                    {selectedProfile.trustMetrics && (
                      <div className="space-y-2 text-xs">
                        {/* Rating */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-slate-400">
                            <span>Customer Satisfaction Rate</span>
                            <span className="text-slate-100 font-bold">{selectedProfile.trustMetrics.customerSatisfactionRate}%</span>
                          </div>
                          <div className="w-full bg-slate-900 rounded-full h-1.5">
                            <div
                              className="bg-emerald-500 h-1.5 rounded-full"
                              style={{ width: `${selectedProfile.trustMetrics.customerSatisfactionRate}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Completion logs */}
                        <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-900/60 p-2 rounded-xl border border-slate-900">
                          <div>
                            <p className="text-slate-500">Orders Finished</p>
                            <p className="text-slate-200 font-bold font-mono">{selectedProfile.trustMetrics.completedOrders}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Services Filled</p>
                            <p className="text-slate-200 font-bold font-mono">{selectedProfile.trustMetrics.completedServices}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Cancellation Rate</p>
                            <p className="text-red-400 font-bold font-mono">{selectedProfile.trustMetrics.cancellationRate}%</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Avg Response</p>
                            <p className="text-emerald-400 font-bold font-mono">{selectedProfile.trustMetrics.responseTimeMinutes}m</p>
                          </div>
                        </div>

                        <div className="text-[10px] text-slate-500 leading-tight">
                          Dynamic Trust Index score is recalculating constantly based on transaction completions.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Granular Enterprise Analytics */}
                  <div className="md:col-span-4 space-y-3">
                    <h5 className="text-[11px] font-mono uppercase text-violet-400 tracking-wider font-bold">Account Analytics</h5>
                    
                    {selectedProfile.unifiedAnalytics && (
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="bg-slate-900/40 p-2 rounded-xl border border-slate-900">
                          <p className="text-slate-500">Profile Views</p>
                          <p className="text-slate-200 font-bold font-mono">{selectedProfile.unifiedAnalytics.profileViews}</p>
                        </div>
                        <div className="bg-slate-900/40 p-2 rounded-xl border border-slate-900">
                          <p className="text-slate-500">QR Code Scans</p>
                          <p className="text-slate-200 font-bold font-mono">{selectedProfile.unifiedAnalytics.qrScansCount}</p>
                        </div>
                        <div className="bg-slate-900/40 p-2 rounded-xl border border-slate-900">
                          <p className="text-slate-500">Total Revenue Pi</p>
                          <p className="text-amber-400 font-bold font-mono">π {selectedProfile.unifiedAnalytics.revenuePi}</p>
                        </div>
                        <div className="bg-slate-900/40 p-2 rounded-xl border border-slate-900">
                          <p className="text-slate-500">DApp Click-thru</p>
                          <p className="text-slate-200 font-bold font-mono">{selectedProfile.unifiedAnalytics.clicksCount}</p>
                        </div>
                      </div>
                    )}

                    {/* Verification Level Banner */}
                    <div className="p-2.5 rounded-xl bg-violet-600/10 text-violet-400 text-[10px] border border-violet-500/20 flex items-center gap-2 font-mono">
                      <Award className="w-4 h-4 text-amber-300 shrink-0" />
                      <div>
                        <p className="font-bold text-slate-200 leading-none">KYC VERIFIED</p>
                        <p className="text-[8px] text-slate-400 mt-1 uppercase">Unlocked Tier: {selectedProfile.verificationLevel}</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* MODULE C: VERSION CONTROL ENGINE AND ROLLBACK snap */}
              <div className="border-t border-slate-800 pt-6 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <History className="w-4 h-4 text-violet-400" />
                    Profile Versioning Control & Snapshot Audits
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Real-time rollback capabilities powered by structured JSON snaps. Roll back previous bios or addresses.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-4">
                  {selectedProfile.versionHistory && selectedProfile.versionHistory.length > 0 ? (
                    <div className="space-y-3">
                      {selectedProfile.versionHistory.map((v, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-slate-900/60 rounded-xl border border-slate-900 gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-violet-600 text-white font-mono text-[9px] font-bold rounded">
                                VER {v.version}
                              </span>
                              <span className="text-xs text-slate-200 font-bold">
                                {v.changeSummary}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-mono">
                              Saved on: {new Date(v.updatedAt).toLocaleString()} | Author: {v.updatedBy || 'Pioneer System'}
                            </p>
                          </div>
                          
                          {/* Rollback Trigger */}
                          <button
                            onClick={() => handleRollback(selectedProfile.id, v.version)}
                            disabled={v.version === selectedProfile.version}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
                              v.version === selectedProfile.version 
                                ? 'bg-violet-600/10 text-violet-400 border-violet-500/20 cursor-not-allowed opacity-60' 
                                : 'bg-slate-800 border-slate-750 text-slate-300 hover:bg-slate-700 hover:text-white'
                            }`}
                          >
                            <RotateCcw className="w-3 h-3" />
                            {v.version === selectedProfile.version ? 'Current Version' : 'Rollback here'}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-2">No previous version commits registered in ledger.</p>
                  )}
                </div>
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="p-5 border-t border-slate-800 flex justify-end bg-slate-900 sticky bottom-0 z-20">
              <button
                onClick={() => {
                  setSelectedListing(null);
                  setSelectedProfile(null);
                }}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Close Transaction Context
              </button>
            </div>

          </div>
        </div>
      )}

      {/* NEW PUBLISHING WIZARD MODAL POPUP */}
      {isCreating && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50 animate-fade-in" id="listings_creator_modal_overlay">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col justify-between" id="form_wizard_container">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900 sticky top-0 z-20 text-left">
              <div>
                <h2 className="text-base font-bold text-slate-200">Publish Unified Listing</h2>
                <p className="text-[10px] text-slate-400 mt-1">Cross-registers Goods, Services and Jobs to the local grid.</p>
              </div>
              <button
                onClick={() => setIsCreating(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateListing} className="p-6 space-y-5 text-left">
              
              {/* SELECT TYPE FIRST */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Select Listing Format:</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['physical', 'digital', 'service', 'job'] as ListingType[]).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewListingType(t)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        newListingType === t 
                          ? 'bg-violet-600 text-white border-violet-500/20' 
                          : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {t.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* SHARED GENERAL DETAILS */}
              <div className="space-y-4 pt-3 border-t border-slate-850">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">1. Core Metadata</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">Listing Title:</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Smart IoT Relays Setup"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">Price (Pi coins):</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.pricePi}
                      onChange={(e) => setFormData({...formData, pricePi: Number(e.target.value)})}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-violet-500 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Listing Description:</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide a comprehensive breakdown of the offering, items, qualifications, schedules, etc..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500 leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">Image Asset URL:</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">Keyword Tags (comma-separated):</label>
                    <input
                      type="text"
                      placeholder="electronics, service, wiring"
                      value={formData.tags}
                      onChange={(e) => setFormData({...formData, tags: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>
              </div>

              {/* GEOLOCATION CONFIGS */}
              <div className="space-y-4 pt-3 border-t border-slate-850">
                <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider font-mono">2. Geolocation Parameters</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">Latitude Coordinate:</label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={formData.lat}
                      onChange={(e) => setFormData({...formData, lat: Number(e.target.value)})}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-violet-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">Longitude Coordinate:</label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={formData.lng}
                      onChange={(e) => setFormData({...formData, lng: Number(e.target.value)})}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-violet-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">Street Address Text:</label>
                    <input
                      type="text"
                      required
                      value={formData.addressText}
                      onChange={(e) => setFormData({...formData, addressText: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">City / Municipality:</label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>
              </div>

              {/* SPECIFIC PARAMETERS */}
              <div className="space-y-4 pt-3 border-t border-slate-850">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">3. Specific Domain Parameters</h4>

                {/* PHYSICAL/DIGITAL SPECIFICS */}
                {(newListingType === 'physical' || newListingType === 'digital') && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-300">In-Stock units:</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.stock}
                        onChange={(e) => setFormData({...formData, stock: Number(e.target.value)})}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    {newListingType === 'digital' && (
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-300">Download Relocation Link:</label>
                        <input
                          type="url"
                          placeholder="https://myserver.com/download"
                          value={formData.downloadUrl}
                          onChange={(e) => setFormData({...formData, downloadUrl: e.target.value})}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-violet-500"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* SERVICE SPECIFICS */}
                {newListingType === 'service' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-300">Duration (Minutes):</label>
                      <input
                        type="number"
                        value={formData.durationMinutes}
                        onChange={(e) => setFormData({...formData, durationMinutes: Number(e.target.value)})}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-300">Availability Schedule:</label>
                      <input
                        type="text"
                        value={formData.availabilitySchedule}
                        onChange={(e) => setFormData({...formData, availabilitySchedule: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-violet-500"
                      />
                    </div>
                  </div>
                )}

                {/* JOB SPECIFICS */}
                {newListingType === 'job' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-300">Salary Payout Model:</label>
                        <select
                          value={formData.salaryType}
                          onChange={(e) => setFormData({...formData, salaryType: e.target.value as any})}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-300 focus:outline-none"
                        >
                          <option value="hourly">Hourly wage</option>
                          <option value="fixed">Fixed contract fee</option>
                          <option value="monthly">Monthly retainer</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-300">Location Type:</label>
                        <select
                          value={formData.locationType}
                          onChange={(e) => setFormData({...formData, locationType: e.target.value as any})}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-300 focus:outline-none"
                        >
                          <option value="on_site">On site physical location</option>
                          <option value="remote">Fully Remote work</option>
                          <option value="hybrid">Hybrid setup</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-300">Salary Range:</label>
                        <input
                          type="text"
                          value={formData.salaryRange}
                          onChange={(e) => setFormData({...formData, salaryRange: e.target.value})}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-300">Job Requirements:</label>
                      <input
                        type="text"
                        value={formData.requirements}
                        onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* LISTING STATUS SELECT */}
              <div className="pt-3 border-t border-slate-850 space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Publish Status Stage:</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 text-xs text-slate-300 font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={formData.status === 'published'}
                      onChange={() => setFormData({...formData, status: 'published'})}
                      className="text-violet-600 focus:ring-violet-500 cursor-pointer"
                    />
                    <span>Publish Immediately ('published')</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-300 font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={formData.status === 'draft'}
                      onChange={() => setFormData({...formData, status: 'draft'})}
                      className="text-violet-600 focus:ring-violet-500 cursor-pointer"
                    />
                    <span>Save as Draft ('draft')</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-300 font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={formData.status === 'pending_review'}
                      onChange={() => setFormData({...formData, status: 'pending_review'})}
                      className="text-violet-600 focus:ring-violet-500 cursor-pointer"
                    />
                    <span>Submit for Review ('pending_review')</span>
                  </label>
                </div>
              </div>

              {/* CTA buttons */}
              <div className="pt-5 border-t border-slate-800 flex justify-end gap-3 sticky bottom-0 bg-slate-900">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-violet-500/10 transition-all border border-violet-500/30 cursor-pointer"
                >
                  Commit Listing
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
