import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { businessProfileService } from '../services/businessProfileService';
import { businessService } from '../services/businessService';
import { bookingService } from '../services/bookingService';
import { motion, AnimatePresence } from 'motion/react';
import { BUSINESS_PROFILE_CONFIG } from '../config/businessProfileConfig';
import { BusinessProfileForm } from '../components/BusinessProfileForm';
import Navbar from '../components/Navbar';
import { ProductCard } from '../components/product/ProductCard';
import { Product } from '../types';
import { 
  Edit2, Eye, MapPin, Mail, Phone, Globe, Shield, Star, Briefcase, 
  ExternalLink, MessageSquare, Share2, Package, Building2, Store, 
  ShieldCheck, CheckCircle2, ArrowLeft, Plus, Copy, Check, X, Calendar, Clock
} from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { DangerZoneCard } from '../components/danger/DangerZoneCard';
import { DeleteConfirmationModal } from '../components/danger/DeleteConfirmationModal';
import { DeleteProgressDialog } from '../components/danger/DeleteProgressDialog';
import { UniversalShareModal } from '../components/sharing/UniversalShareModal';

export const BusinessProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // businessId, storeId, or slug
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'about'>('products');
  const [isShareOpen, setIsShareOpen] = useState(false);

  useEffect(() => {
    if (profileData) {
      document.title = `${profileData.businessName || profileData.name || 'Business Store'} | Pi Business Market`;
    }
  }, [profileData]);
  
  const [storeProducts, setStoreProducts] = useState<Product[]>([]);
  const [storeServices, setStoreServices] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  
  const [copied, setCopied] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<string | null>(null);

  // Service Booking state
  const [selectedServiceForBooking, setSelectedServiceForBooking] = useState<any | null>(null);
  const [bookingDate, setBookingDate] = useState<string>('');
  const [bookingTime, setBookingTime] = useState<string>('');
  const [bookingNotes, setBookingNotes] = useState<string>('');
  const [bookingSubmitting, setBookingSubmitting] = useState<boolean>(false);
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceForBooking || !user) return;
    if (!bookingDate || !bookingTime) {
      alert('Please select both a booking date and time.');
      return;
    }

    setBookingSubmitting(true);
    try {
      const dbPrice = selectedServiceForBooking.basePrice || selectedServiceForBooking.price || 0;
      const dbCurrency = selectedServiceForBooking.currency || 'π';
      
      const bookingPayload = {
        buyerId: user.uid,
        sellerId: profileData.ownerUid || profileData.ownerId || '',
        businessId: profileData.id || profileData.businessId || '',
        serviceId: selectedServiceForBooking.id || selectedServiceForBooking.serviceId || '',
        title: selectedServiceForBooking.serviceName || selectedServiceForBooking.title || 'Service Appointment',
        description: selectedServiceForBooking.description || '',
        price: dbPrice,
        currency: dbCurrency,
        grandTotal: dbPrice,
        items: [
          {
            serviceId: selectedServiceForBooking.id || selectedServiceForBooking.serviceId || '',
            title: selectedServiceForBooking.serviceName || selectedServiceForBooking.title || 'Service Appointment',
            price: dbPrice,
          }
        ],
        bookingDate,
        bookingTime,
        bookingNotes,
        bookingStatus: 'pending',
      };

      await bookingService.createBooking(bookingPayload);
      setBookingSuccess(true);
      setBookingDate('');
      setBookingTime('');
      setBookingNotes('');
      
      // Auto close and redirect to bookings view
      setTimeout(() => {
        setSelectedServiceForBooking(null);
        setBookingSuccess(false);
        navigate('/orders');
      }, 2000);
    } catch (err) {
      console.error('Failed to submit booking:', err);
      alert('Failed to submit booking request. Please try again.');
    } finally {
      setBookingSubmitting(false);
    }
  };

  // Sync window profile context
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (profileData) {
        const isStorePath = window.location.pathname.includes('/store/');
        if (isStorePath) {
          (window as any).__currentStoreProfile = profileData;
          (window as any).__currentBusinessProfile = null;
        } else {
          (window as any).__currentBusinessProfile = profileData;
          (window as any).__currentStoreProfile = null;
        }
      } else {
        (window as any).__currentStoreProfile = null;
        (window as any).__currentBusinessProfile = null;
      }
    }
  }, [profileData]);

  // Load business profile document
  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      try {
        setLoading(true);
        let data: any = null;

        if (id) {
          console.log('[BusinessProfile] Resolving business profile by ID or slug:', id);
          data = await businessProfileService.getProfileById(id);
        }

        // Fallback if no ID passed or ID lookup returned null for logged-in user
        if (!data && user) {
          console.log('[BusinessProfile] Attempting active user profile resolution for user:', user.uid);
          data = await businessProfileService.getProfile(user.uid, (user as any).activeRole || 'seller');
          if (!data) {
            const myBizs = await businessService.getMyBusinesses(user.uid);
            if (myBizs && myBizs.length > 0) {
              data = myBizs[0];
            }
          }
        }

        if (isMounted) {
          if (data) {
            console.log('[BusinessProfile] Resolved profile successfully:', data.id || data.businessId, data.businessName);
            setProfileData(data);
          } else {
            console.warn('[BusinessProfile] Could not resolve business profile for id:', id);
            setProfileData(null);
          }
        }
      } catch (err) {
        console.error('[BusinessProfile] Error loading business profile:', err);
        if (isMounted) setProfileData(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadProfile();
    return () => { isMounted = false; };
  }, [id, user]);

  // Load products & services strictly tied to this business
  useEffect(() => {
    let isMounted = true;
    const fetchBusinessListings = async () => {
      if (!profileData) return;
      
      const canonBusinessId = profileData.id || profileData.businessId || id;
      const ownerUid = profileData.ownerUid;

      if (!canonBusinessId && !ownerUid) return;

      try {
        setLoadingItems(true);
        const db = getFirebaseDb();

        // 1. Fetch Products
        const qProdBiz = query(collection(db, 'products'), where('businessId', '==', canonBusinessId));
        const qProdStore = query(collection(db, 'products'), where('storeId', '==', canonBusinessId));
        const qProdOwner = ownerUid ? query(collection(db, 'products'), where('ownerUid', '==', ownerUid)) : null;

        const [snapBiz, snapStore, snapOwner] = await Promise.all([
          getDocs(qProdBiz),
          getDocs(qProdStore),
          qProdOwner ? getDocs(qProdOwner) : Promise.resolve({ docs: [] })
        ]);

        const productsMap = new Map<string, Product>();

        const isOwner = Boolean(user && ownerUid && user.uid === ownerUid);

        const isListingPublic = (itemData: any): boolean => {
          if (!itemData) return false;
          if (itemData.deletedAt) return false;
          if (itemData.archived === true) return false;
          if (itemData.isPublished === false) return false;
          if (itemData.isActive === false) return false;

          const status = (itemData.status || '').toLowerCase();
          if (
            status === 'draft' ||
            status === 'archived' ||
            status === 'deleted' ||
            status === 'inactive' ||
            status === 'suspended' ||
            status === 'rejected' ||
            status === 'pending'
          ) {
            return false;
          }

          const approvalStatus = (itemData.approvalStatus || '').toLowerCase();
          if (
            approvalStatus === 'rejected' ||
            approvalStatus === 'suspended' ||
            approvalStatus === 'pending'
          ) {
            return false;
          }

          return true;
        };

        const processProductDoc = (d: any) => {
          const data = d.data();
          const docId = d.id;

          // Strict filter: Match explicitly by businessId/storeId, or legacy match by ownerUid if businessId is unset or matching
          const matchesBusiness = (data.businessId && data.businessId === canonBusinessId) || (data.storeId && data.storeId === canonBusinessId);
          const matchesOwnerLegacy = (!data.businessId || data.businessId === canonBusinessId) && (ownerUid && data.ownerUid === ownerUid);

          if (matchesBusiness || matchesOwnerLegacy) {
            // For public visitors (non-owner), filter out draft/archived/deleted/suspended/rejected products
            if (!isOwner && !isListingPublic(data)) {
              return;
            }

            if (!productsMap.has(docId)) {
              const fullProd: Product = {
                id: docId,
                productId: docId,
                storeId: data.storeId || canonBusinessId,
                businessId: data.businessId || canonBusinessId,
                ownerUid: data.ownerUid || ownerUid,
                sku: data.sku || docId,
                productName: data.productName || data.name || data.title || 'Untitled Product',
                productSlug: data.productSlug || docId,
                shortDescription: data.shortDescription || data.description || '',
                description: data.description || '',
                brand: data.brand || profileData.businessName || '',
                type: data.type || 'physical',
                category: data.category || 'General',
                subCategory: data.subCategory || '',
                tags: data.tags || [],
                price: typeof data.price === 'string' ? parseFloat(data.price) : (data.price || 0),
                comparePrice: typeof data.oldPrice === 'string' ? parseFloat(data.oldPrice) : (data.oldPrice || 0),
                currency: data.currency || 'π',
                taxClass: data.taxClass || 'standard',
                pricingMode: data.pricingMode || 'EXCHANGE',
                localCurrency: data.localCurrency,
                localAmount: data.localAmount,
                communityPiAmount: data.communityPiAmount,
                stock: typeof data.stock === 'number' ? data.stock : (data.inventory || 10),
                stockStatus: data.stockStatus || 'in_stock',
                minOrderQty: data.minOrderQty || 1,
                maxOrderQty: data.maxOrderQty || 99,
                mainImage: data.mainImage || data.imageUrl || data.image || (data.imageUrls && data.imageUrls[0]) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
                imageUrls: Array.isArray(data.imageUrls) && data.imageUrls.length > 0 ? data.imageUrls : [data.mainImage || data.imageUrl || data.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'],
                rating: typeof data.rating === 'number' ? data.rating : 4.8,
                reviewCount: typeof data.reviewCount === 'number' ? data.reviewCount : (data.reviews || 0),
                variants: data.variants || [],
                status: data.status || 'published',
                exchangeRate: data.exchangeRate,
                piPrice: data.piPrice,
                usdPrice: data.usdPrice,
                pricingModel: data.pricingModel,
                ...data
              };
              productsMap.set(docId, fullProd);
            }
          }
        };

        snapBiz.docs.forEach(processProductDoc);
        snapStore.docs.forEach(processProductDoc);
        snapOwner.docs.forEach(processProductDoc);

        // 2. Fetch Services
        const qSvcBiz = query(collection(db, 'services'), where('businessId', '==', canonBusinessId));
        const qSvcOwner = ownerUid ? query(collection(db, 'services'), where('ownerUid', '==', ownerUid)) : null;

        const [snapSvcBiz, snapSvcOwner] = await Promise.all([
          getDocs(qSvcBiz),
          qSvcOwner ? getDocs(qSvcOwner) : Promise.resolve({ docs: [] })
        ]);

        const servicesMap = new Map<string, any>();
        const processServiceDoc = (d: any) => {
          const data = d.data();
          const docId = d.id;
          const matches = (data.businessId && data.businessId === canonBusinessId) || (!data.businessId && ownerUid && data.ownerUid === ownerUid);
          if (matches) {
            if (!isOwner && !isListingPublic(data)) {
              return;
            }
            if (!servicesMap.has(docId)) {
              servicesMap.set(docId, { id: docId, ...data });
            }
          }
        };

        snapSvcBiz.docs.forEach(processServiceDoc);
        snapSvcOwner.docs.forEach(processServiceDoc);

        if (isMounted) {
          setStoreProducts(Array.from(productsMap.values()));
          setStoreServices(Array.from(servicesMap.values()));
        }
      } catch (err) {
        console.error('[BusinessProfile] Error fetching business listings:', err);
      } finally {
        if (isMounted) setLoadingItems(false);
      }
    };

    fetchBusinessListings();
    return () => { isMounted = false; };
  }, [profileData, id]);

  const handleDelete = async () => {
    const targetId = profileData?.id || id;
    if (!targetId) return;
    setDeleteStatus('Deleting business...');
    try {
      const response = await fetch('/api/delete-resource', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceType: 'business', resourceId: targetId }),
      });
      if (!response.ok) throw new Error('Failed to delete business');
      navigate('/business-center');
    } catch (err) {
      console.error(err);
      setDeleteStatus(null);
      setShowDeleteModal(false);
      alert('Failed to delete business');
    }
  };

  const handleSave = async (data: any, publish: boolean) => {
    if (!user) return;
    try {
      setSaving(true);
      const activeRole = profileData?.businessType || (user as any).activeRole || 'seller';
      const newId = await businessProfileService.saveProfile(user.uid, activeRole, data, publish);
      const updated = await businessProfileService.getProfileById(newId);
      setProfileData(updated);
      setIsEditing(false);
      if (!id) {
        navigate(`/business/${newId}`);
      }
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleShare = () => {
    setIsShareOpen(true);
  };

  const handleMessageBusiness = () => {
    if (!profileData || !user) return;
    navigate('/inbox', {
      state: {
        targetUid: profileData.ownerUid,
        targetName: profileData.businessName || profileData.name,
        contextType: 'business_customer',
        contextId: profileData.id || profileData.businessId || profileData.ownerUid
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navbar 
          currentUser={user as any}
          currentView="dashboard"
          onNavigate={(view) => navigate(`/${view}`)}
          cartCount={0}
          walletBalance={0}
          onWalletUpdate={() => {}}
          onToggleCart={() => {}}
        />
        <div className="flex-1 flex items-center justify-center text-slate-400 font-bold gap-3">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          Loading business profile...
        </div>
      </div>
    );
  }

  if (!profileData && !isEditing) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
        <Navbar 
          currentUser={user as any}
          currentView="dashboard"
          onNavigate={(view) => navigate(`/${view}`)}
          cartCount={0}
          walletBalance={0}
          onWalletUpdate={() => {}}
          onToggleCart={() => {}}
        />
        <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center mb-6 text-slate-600 shadow-xl">
            <Building2 className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mb-2">Business Profile Not Found</h1>
          <p className="text-sm text-slate-400 max-w-md mb-8">
            The business profile you are looking for does not exist or may have been updated or moved.
          </p>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Go Back
            </button>
            <button 
              onClick={() => navigate('/directory')}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-indigo-600/20"
            >
              Explore Business Directory
            </button>
          </div>
        </div>
      </div>
    );
  }

  const role = profileData?.businessType || 'seller';
  const roleConfig = BUSINESS_PROFILE_CONFIG[role] || BUSINESS_PROFILE_CONFIG['seller'];
  const isOwner = user && profileData && (user.uid === profileData.ownerUid || user.uid === profileData.createdByUid);
  const isVerified = profileData?.verificationStatus === 'Verified' || profileData?.verificationStatus === 'Approved' || profileData?.approvalStatus === 'approved' || profileData?.isVerified === true;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      <Navbar 
        currentUser={user as any}
        currentView="dashboard"
        onNavigate={(view) => navigate(`/${view}`)}
        cartCount={0}
        walletBalance={0}
        onWalletUpdate={() => {}}
        onToggleCart={() => {}}
      />

      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="group text-slate-400 hover:text-white flex items-center gap-2 text-xs font-bold transition-colors"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back
          </button>

          {isOwner && (
            <button 
              onClick={() => navigate('/business-center')}
              className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-all flex items-center gap-2"
            >
              <Briefcase className="w-4 h-4" />
              Open Business Center
            </button>
          )}
        </div>

        {/* Hero Cover & Profile Header */}
        <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800/80 shadow-2xl">
          {/* Cover Banner */}
          <div className="aspect-[16/9] md:aspect-[3.5/1] bg-gradient-to-tr from-violet-950 via-slate-900 to-indigo-950 w-full relative overflow-hidden">
            {profileData?.coverImageUrl ? (
              <img src={profileData.coverImageUrl} alt="Cover" className="w-full h-full object-cover opacity-60" />
            ) : (
              <div className="absolute inset-0 bg-grid-white/[0.03] bg-[size:24px_24px]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          </div>

          {/* Action Buttons Overlay */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
            <button 
              onClick={handleShare}
              className="px-4 py-2 bg-slate-900/80 backdrop-blur border border-slate-700/80 rounded-xl text-xs font-bold text-white hover:bg-slate-800 flex items-center gap-2 transition-all shadow-lg"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              {copied ? 'Copied Link' : 'Share'}
            </button>

            {isOwner && (
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all"
              >
                {isEditing ? <Eye className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                {isEditing ? 'View Public Profile' : 'Edit Profile'}
              </button>
            )}
          </div>

          {/* Business Profile Identity Box */}
          <div className="px-6 sm:px-8 pb-8 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-20 md:-mt-24">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
              {/* Logo Avatar */}
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-slate-950 border-4 border-slate-950 flex items-center justify-center shadow-2xl overflow-hidden shrink-0 aspect-square group">
                {profileData?.logoUrl ? (
                  <img src={profileData.logoUrl} alt={profileData.businessName} className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-14 h-14 text-indigo-400" />
                )}
              </div>

              {/* Title & Metadata */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400 text-[10px] font-black uppercase tracking-wider border border-violet-500/20">
                    {profileData?.businessType || roleConfig.roleId}
                  </span>
                  {isVerified && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/20 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified Enterprise
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {profileData?.businessName || profileData?.name || profileData?.storeName || 'Unnamed Business'}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-400">
                  {profileData?.category && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                      {profileData.category}
                    </span>
                  )}
                  {(profileData?.city || profileData?.country || profileData?.location) && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      {[profileData.city, profileData.country || profileData.location].filter(Boolean).join(', ')}
                    </span>
                  )}
                  {profileData?.rating && (
                    <span className="flex items-center gap-1 text-amber-400 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {profileData.rating} ({profileData.reviewCount || 0} reviews)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Customer Contact Button */}
            {!isOwner && user && (
              <button 
                onClick={handleMessageBusiness}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 shrink-0"
              >
                <MessageSquare className="w-4 h-4" />
                Contact Business
              </button>
            )}
          </div>
        </div>

        {/* Content View Modes: Form vs Public View */}
        {isEditing ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8">
            <h2 className="text-lg font-black text-white mb-6">Edit Business Profile Details</h2>
            <BusinessProfileForm
              generalFields={roleConfig.generalFields}
              specificFields={roleConfig.specificFields}
              initialData={profileData}
              onSave={handleSave}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tab Navigation Controls */}
            <div className="flex items-center gap-2 border-b border-slate-800/80 pb-4">
              <button 
                onClick={() => setActiveTab('products')}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'products'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Package className="w-4 h-4" />
                Products & Offerings
                <span className="ml-1.5 px-2 py-0.5 rounded-full bg-indigo-950/60 text-indigo-300 text-[10px]">
                  {storeProducts.length}
                </span>
              </button>

              <button 
                onClick={() => setActiveTab('about')}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'about'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Building2 className="w-4 h-4" />
                About & Information
              </button>
            </div>

            {/* TAB 1: PRODUCTS & OFFERINGS */}
            {activeTab === 'products' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight">Marketplace Listings</h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      Products and items published directly by {profileData?.businessName || 'this business'}.
                    </p>
                  </div>

                  {isOwner && (
                    <button 
                      onClick={() => navigate('/business-center?tab=catalog&subTab=products&action=add_product')}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Add Product
                    </button>
                  )}
                </div>

                {loadingItems ? (
                  <div className="py-12 text-center text-slate-500 text-xs font-bold flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    Loading products...
                  </div>
                ) : storeProducts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {storeProducts.map((product) => (
                      <ProductCard key={product.productId || (product as any).id} product={product} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-600 mb-4">
                      <Package className="w-8 h-8" />
                    </div>
                    <h4 className="text-base font-bold text-white mb-1">No Products Published Yet</h4>
                    <p className="text-xs text-slate-400 max-w-sm mb-6">
                      This business has not listed any active products in the Pi Business Market.
                    </p>
                    {isOwner && (
                      <button 
                        onClick={() => navigate('/business-center?tab=catalog&subTab=products&action=add_product')}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> Create First Product
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: ABOUT & INFORMATION */}
            {activeTab === 'about' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Description Column */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-4">
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-indigo-400" />
                      About {profileData?.businessName || 'Business'}
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                      {profileData?.description || profileData?.bio || profileData?.about || 'No detailed description provided by business owner.'}
                    </p>
                  </div>

                  {/* Services section if available */}
                  {storeServices.length > 0 && (
                    <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-4">
                      <h3 className="text-lg font-black text-white flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-violet-400" />
                        Services Offered ({storeServices.length})
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {storeServices.map((svc) => (
                          <div 
                            key={svc.id} 
                            onClick={() => setSelectedServiceForBooking(svc)}
                            className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 hover:border-violet-500/50 transition-all cursor-pointer space-y-3 relative group flex flex-col justify-between"
                          >
                            <div className="space-y-1">
                              <h4 className="text-sm font-black text-white group-hover:text-violet-400 transition-colors uppercase tracking-tight">{svc.serviceName || svc.title || 'Service'}</h4>
                              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{svc.description || 'No description provided.'}</p>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                              <span className="text-sm font-black text-violet-400">
                                {svc.price !== undefined ? `${svc.price} π` : 'Contact for Quote'}
                              </span>
                              <button 
                                className="px-3 py-1 bg-violet-600/10 hover:bg-violet-600 border border-violet-500/20 hover:border-violet-500 text-violet-400 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                              >
                                Book Service
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sidebar Details Column */}
                <div className="space-y-6">
                  <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-3">
                      Business Details
                    </h4>

                    <div className="space-y-3 text-xs">
                      <div className="flex items-start gap-3">
                        <Briefcase className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase font-bold">Category</span>
                          <span className="text-slate-200 font-bold">{profileData?.category || 'General'}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Store className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase font-bold">Business Type</span>
                          <span className="text-slate-200 font-bold capitalize">{profileData?.businessType || 'Seller'}</span>
                        </div>
                      </div>

                      {(profileData?.city || profileData?.country || profileData?.location) && (
                        <div className="flex items-start gap-3">
                          <MapPin className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                          <div>
                            <span className="text-slate-500 block text-[10px] uppercase font-bold">Location</span>
                            <span className="text-slate-200 font-bold">
                              {[profileData.city, profileData.country || profileData.location].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        </div>
                      )}

                      {profileData?.email && (
                        <div className="flex items-start gap-3">
                          <Mail className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                          <div>
                            <span className="text-slate-500 block text-[10px] uppercase font-bold">Email</span>
                            <a href={`mailto:${profileData.email}`} className="text-indigo-400 font-bold hover:underline">
                              {profileData.email}
                            </a>
                          </div>
                        </div>
                      )}

                      {profileData?.phone && (
                        <div className="flex items-start gap-3">
                          <Phone className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                          <div>
                            <span className="text-slate-500 block text-[10px] uppercase font-bold">Phone</span>
                            <span className="text-slate-200 font-bold">{profileData.phone}</span>
                          </div>
                        </div>
                      )}

                      {profileData?.website && (
                        <div className="flex items-start gap-3">
                          <Globe className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                          <div>
                            <span className="text-slate-500 block text-[10px] uppercase font-bold">Website</span>
                            <a 
                              href={profileData.website.startsWith('http') ? profileData.website : `https://${profileData.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-400 font-bold hover:underline flex items-center gap-1"
                            >
                              {profileData.website} <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Owner Danger Zone Controls */}
        {isOwner && (
          <div className="mt-12 border-t border-slate-900 pt-8">
            <DangerZoneCard
              title="Danger Zone"
              description="Irreversible administrative controls for this business profile. Permanent deletion will remove all associated stores, listings, and metadata."
              onDeleteRequested={() => setShowDeleteModal(true)}
            />
          </div>
        )}
      </div>

      {/* Delete Modals */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        resourceName={profileData?.businessName || profileData?.name || 'this business'}
      />
      {deleteStatus && <DeleteProgressDialog isOpen={!!deleteStatus} status={deleteStatus} />}

      {/* Service Booking Request Dialog */}
      <AnimatePresence>
        {selectedServiceForBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!bookingSubmitting) setSelectedServiceForBooking(null);
              }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-lg p-6 sm:p-8 relative overflow-hidden shadow-2xl z-10 space-y-6"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2.5 py-1 bg-violet-600/10 border border-violet-500/20 text-violet-400 rounded-full text-[9px] font-black uppercase tracking-wider block w-max mb-2">
                    Service Appointment Request
                  </span>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">
                    {selectedServiceForBooking.serviceName || selectedServiceForBooking.title || 'Book Service'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Provided by {profileData?.businessName || 'Verified Professional'}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={bookingSubmitting}
                  onClick={() => setSelectedServiceForBooking(null)}
                  className="p-2 bg-slate-950 border border-slate-850 hover:border-slate-700 text-slate-500 hover:text-white rounded-full transition-all disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {bookingSuccess ? (
                /* Success View */
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="py-12 flex flex-col items-center justify-center text-center space-y-4"
                >
                  <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/5">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-white uppercase tracking-tight">Booking Requested!</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                      Your booking request has been sent to the service provider. You are being redirected to your Bookings list.
                    </p>
                  </div>
                </motion.div>
              ) : (
                /* Booking Form */
                <form onSubmit={handleCreateBooking} className="space-y-4">
                  {/* Service Price Info */}
                  <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850/60 flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Estimated Service Total:</span>
                    <span className="text-lg font-black text-violet-400">
                      {selectedServiceForBooking.basePrice || selectedServiceForBooking.price || 0} π
                    </span>
                  </div>

                  {/* Date & Time Selectors */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-violet-400" /> Target Date
                      </label>
                      <input
                        type="date"
                        required
                        disabled={bookingSubmitting}
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-violet-400" /> Target Time
                      </label>
                      <input
                        type="time"
                        required
                        disabled={bookingSubmitting}
                        value={bookingTime}
                        onChange={(e) => setBookingTime(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Booking Notes / Special Requests
                    </label>
                    <textarea
                      disabled={bookingSubmitting}
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      placeholder="Specify details, requirements, or special instructions for the provider..."
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-850 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none transition-all resize-none"
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-850/50">
                    <button
                      type="button"
                      disabled={bookingSubmitting}
                      onClick={() => setSelectedServiceForBooking(null)}
                      className="px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={bookingSubmitting || !user}
                      className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 active:scale-95 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg shadow-violet-600/10 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {bookingSubmitting ? 'Requesting...' : 'Request Booking'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Universal Share Modal */}
      {isShareOpen && profileData && (
        <UniversalShareModal
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          userId={user?.uid || 'guest'}
          entityType="business"
          entityId={profileData.id || id!}
          entityName={profileData.businessName || profileData.name || 'Business Store'}
          entityImage={profileData.logoUrl || profileData.bannerUrl}
        />
      )}
    </div>
  );
};
