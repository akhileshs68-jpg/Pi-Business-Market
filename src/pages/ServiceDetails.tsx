/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Star, 
  Clock, 
  Calendar, 
  MapPin, 
  Globe, 
  Laptop, 
  Check, 
  Loader2, 
  X, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  Building,
  DollarSign,
  ArrowRight,
  ChevronRight,
  Briefcase,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from '../components/Navbar';
import { useAuth } from '../auth/useAuth';
import { serviceMarketplaceService } from '../services/serviceMarketplaceService';
import { businessProfileService } from '../services/businessProfileService';
import { bookingService } from '../services/bookingService';
import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { Service, ServicePackage, ServiceAvailability } from '../types';

export const ServiceDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [service, setService] = useState<Service | null>(null);
  const [provider, setProvider] = useState<any | null>(null);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [availability, setAvailability] = useState<ServiceAvailability | null>(null);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Booking Flow State
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
  const [bookingDate, setBookingDate] = useState<string>('');
  const [bookingTime, setBookingTime] = useState<string>('');
  const [bookingNotes, setBookingNotes] = useState<string>('');
  const [bookingSubmitting, setBookingSubmitting] = useState<boolean>(false);
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchAllDetails = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const db = getFirebaseDb();

        // 1. Fetch Service Doc
        const serviceDocRef = doc(db, 'services', id);
        const serviceDoc = await getDoc(serviceDocRef);
        
        if (!serviceDoc.exists()) {
          if (isMounted) setError('Service not found.');
          setLoading(false);
          return;
        }

        const serviceData = { id: serviceDoc.id, ...serviceDoc.data() } as any;
        if (isMounted) setService(serviceData);

        // 2. Fetch Provider/Business profile
        if (serviceData.businessId) {
          const providerData = await businessProfileService.getProfileById(serviceData.businessId);
          if (isMounted && providerData) setProvider(providerData);
        }

        // 3. Fetch Packages
        const packagesData = await serviceMarketplaceService.getPackages(id);
        if (isMounted) {
          setPackages(packagesData);
          
          // If custom packages exist, default to the first active package.
          // Otherwise, we construct a default package from base service fields.
          if (packagesData.length > 0) {
            const activePkgs = packagesData.filter(p => p.status === 'active');
            if (activePkgs.length > 0) {
              setSelectedPackage(activePkgs[0]);
            } else {
              setSelectedPackage(packagesData[0]);
            }
          } else {
            // Auto-create a standard package based on the service's base pricing
            const defaultPkg: ServicePackage = {
              packageId: 'standard-consultation',
              serviceId: id,
              name: 'Standard Consultation',
              description: 'Access the primary consultation package of this verified professional service.',
              price: serviceData.basePrice || serviceData.price || 0,
              duration: serviceData.duration || 60,
              features: ['Professional service consultation', 'Detailed review & brief discussion', 'Direct messaging and service hand-off support'],
              status: 'active'
            };
            setSelectedPackage(defaultPkg);
          }
        }

        // 4. Fetch Availability
        const availData = await serviceMarketplaceService.getAvailability(id) || 
                          (serviceData.businessId ? await serviceMarketplaceService.getAvailability(serviceData.businessId) : null);
        if (isMounted && availData) setAvailability(availData);

      } catch (err) {
        console.error('[ServiceDetails] Error fetching details:', err);
        if (isMounted) setError('Failed to load service details. Please try again later.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAllDetails();
    return () => { isMounted = false; };
  }, [id]);

  const handleBookingRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service || !selectedPackage || !user) return;
    if (!bookingDate || !bookingTime) {
      setBookingError('Please specify both preferred date and time.');
      return;
    }

    setBookingSubmitting(true);
    setBookingError(null);

    try {
      const price = selectedPackage.price;
      const currency = service.currency || 'π';

      const bookingPayload = {
        buyerId: user.uid,
        sellerId: service.ownerUid || provider?.ownerUid || provider?.ownerId || '',
        businessId: service.businessId || '',
        serviceId: service.serviceId || '',
        title: service.title,
        description: service.description || '',
        price: price,
        currency: currency,
        grandTotal: price,
        packageId: selectedPackage.packageId,
        packageName: selectedPackage.name,
        items: [
          {
            serviceId: service.serviceId || '',
            title: `${service.title} - ${selectedPackage.name}`,
            price: price,
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

      setTimeout(() => {
        setBookingSuccess(false);
        navigate('/orders');
      }, 2500);

    } catch (err) {
      console.error('[ServiceDetails] Booking submission failed:', err);
      setBookingError("We couldn't send your booking request. Please try again.");
    } finally {
      setBookingSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col">
        <Navbar 
          currentUser={user || null}
          currentView="discovery"
          onNavigate={(view) => navigate(`/${view}`)}
          cartCount={0}
          walletBalance={100}
          onWalletUpdate={() => {}}
          onToggleCart={() => {}}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Loading Service Profile...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col">
        <Navbar 
          currentUser={user || null}
          currentView="discovery"
          onNavigate={(view) => navigate(`/${view}`)}
          cartCount={0}
          walletBalance={100}
          onWalletUpdate={() => {}}
          onToggleCart={() => {}}
        />
        <div className="flex-1 max-w-xl mx-auto flex flex-col items-center justify-center p-6 text-center space-y-6">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center text-red-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black uppercase tracking-tight">Service Profile Unavailable</h2>
            <p className="text-sm text-slate-400">
              {error || 'This service is currently unavailable or doesn\'t exist.'}
            </p>
          </div>
          <button
            onClick={() => navigate('/discover?tab=services')}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
          >
            Back to Services Marketplace
          </button>
        </div>
      </div>
    );
  }

  const currencySymbol = service.currency || 'π';
  const metadata = (service as any).metadata || {};
  
  // Real rating evaluation logic
  const hasRating = typeof service.rating === 'number' && service.rating > 0;
  const ratingValue = hasRating ? service.rating : null;
  const reviewCount = hasRating && typeof (service as any).reviewCount === 'number' ? (service as any).reviewCount : null;

  // Format Location Type label and icon
  const getLocationDetails = () => {
    switch (service.locationType) {
      case 'online':
        return { icon: Globe, label: 'Remote / Online Consultation' };
      case 'on-site':
        return { icon: MapPin, label: service.serviceArea ? `On-site at: ${service.serviceArea}` : 'On-site Provider' };
      case 'customer-location':
        return { icon: User, label: service.serviceArea ? `Available at Customer Area: ${service.serviceArea}` : 'At Customer Location' };
      case 'hybrid':
        return { icon: Laptop, label: 'Hybrid (Online or Physical)' };
      default:
        return { icon: Briefcase, label: 'Service Appointment' };
    }
  };

  const LocationInfo = getLocationDetails();

  // Helper to resolve working days names
  const getDayNames = (days: number[]) => {
    const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map(d => names[d]).join(', ');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Navbar 
        currentUser={user || null}
        currentView="discovery"
        onNavigate={(view) => navigate(`/${view}`)}
        cartCount={0}
        walletBalance={100}
        onWalletUpdate={() => {}}
        onToggleCart={() => {}}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Breadcrumbs & Navigation Back */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <Link to="/discover?tab=services" className="hover:text-white transition-colors">Services</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-slate-600">{service.category || 'General'}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-slate-200 truncate max-w-[200px]">{service.title}</span>
          </div>

          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-850 hover:border-slate-800 text-slate-400 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all self-start"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
        </div>

        {/* Top Header Card */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-[2.5rem] p-6 sm:p-8 space-y-6">
          <div className="flex flex-col lg:flex-row justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <span className="px-2.5 py-1 bg-violet-600/10 border border-violet-500/20 text-violet-400 rounded-full text-[9px] font-black uppercase tracking-wider inline-block">
                {service.category || 'Professional Service'} {service.subCategory ? `• ${service.subCategory}` : ''}
              </span>
              
              <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight leading-tight">
                {service.title}
              </h1>

              {/* Real Rating UI */}
              {hasRating && ratingValue !== null && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-amber-400">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span className="text-xs font-black">{ratingValue.toFixed(1)}</span>
                  </div>
                  {reviewCount !== null && (
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                      ({reviewCount} verified {reviewCount === 1 ? 'review' : 'reviews'})
                    </span>
                  )}
                </div>
              )}

              {/* Provider Badge */}
              <div className="flex items-center gap-3 pt-1">
                <div className="w-10 h-10 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-center text-slate-400">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Service Provider</p>
                  {provider ? (
                    <Link 
                      to={`/business/${provider.id || service.businessId}`} 
                      className="text-sm font-black text-white hover:text-violet-400 transition-colors uppercase tracking-tight flex items-center gap-1.5 group"
                    >
                      {provider.businessName}
                      <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  ) : (
                    <span className="text-sm font-black text-slate-300 uppercase tracking-tight">Verified Specialist</span>
                  )}
                </div>
              </div>
            </div>

            {/* Price Info Box */}
            <div className="bg-slate-950/60 p-6 rounded-3xl border border-slate-850/60 flex flex-col justify-center min-w-[200px] lg:text-right">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Starting Price</span>
              <div className="text-2xl sm:text-3xl font-black text-violet-400 uppercase tracking-tight">
                {service.basePrice || 0} <span className="text-lg">{currencySymbol}</span>
              </div>
              {service.duration && (
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wide mt-1 inline-flex lg:justify-end items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Approx. {service.duration} mins
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Details and Sidebar Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main Details Panel */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Service Specific Info */}
            <div className="bg-slate-900/20 border border-slate-900/60 rounded-[2.5rem] p-6 sm:p-8 space-y-6">
              <h3 className="text-sm font-black text-white uppercase tracking-wider border-b border-slate-900 pb-3">
                Service Profile & Summary
              </h3>

              {/* Service Meta Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-slate-950/40 rounded-2xl border border-slate-850/30">
                  <div className="w-8 h-8 bg-violet-500/10 text-violet-400 rounded-lg flex items-center justify-center">
                    <LocationInfo.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Delivery Mode</p>
                    <p className="text-xs font-bold text-slate-200">{LocationInfo.label}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-950/40 rounded-2xl border border-slate-850/30">
                  <div className="w-8 h-8 bg-emerald-500/10 text-emerald-400 rounded-lg flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Verification Status</p>
                    <p className="text-xs font-bold text-slate-200">Verified Marketplace Specialist</p>
                  </div>
                </div>
              </div>

              {/* Description Body */}
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Service Description</p>
                <div className="text-xs text-slate-300 leading-relaxed space-y-3 whitespace-pre-wrap">
                  {service.description || 'No description provided by the service provider.'}
                </div>
              </div>
            </div>

            {/* Packages Comparison Section */}
            <div className="bg-slate-900/20 border border-slate-900/60 rounded-[2.5rem] p-6 sm:p-8 space-y-6">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Available Service Packages
                </h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                  Select the package that best fits your requirements.
                </p>
              </div>

              {packages.length > 0 ? (
                /* Dynamic Custom Packages Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {packages.map((pkg) => (
                    <div 
                      key={pkg.packageId}
                      className={`p-5 rounded-3xl border transition-all flex flex-col justify-between cursor-pointer ${
                        selectedPackage?.packageId === pkg.packageId 
                          ? 'bg-violet-600/10 border-violet-500 shadow-xl shadow-violet-500/5' 
                          : 'bg-slate-950/30 border-slate-900 hover:border-slate-850'
                      }`}
                      onClick={() => setSelectedPackage(pkg)}
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">{pkg.name}</h4>
                          <span className="text-sm font-black text-violet-400">{pkg.price} {currencySymbol}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-normal">{pkg.description}</p>
                        {pkg.duration && (
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                            <Clock className="w-3 h-3 text-violet-400" /> Approx. {pkg.duration} mins
                          </p>
                        )}
                        
                        {/* Package Features list */}
                        {pkg.features && pkg.features.length > 0 && (
                          <div className="pt-3 space-y-1.5 border-t border-slate-900/60">
                            {pkg.features.map((feature, idx) => (
                              <div key={idx} className="flex items-start gap-1.5 text-[10px] text-slate-300">
                                <Check className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-900/60">
                        <button
                          type="button"
                          className={`w-full py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${
                            selectedPackage?.packageId === pkg.packageId 
                              ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-md' 
                              : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800'
                          }`}
                        >
                          {selectedPackage?.packageId === pkg.packageId ? 'Selected Package' : 'Select Package'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Fallback/Default Single Consultation Card */
                <div className="p-5 rounded-3xl border bg-violet-600/10 border-violet-500 shadow-xl shadow-violet-500/5">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">Standard Consultation</h4>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Single Service Fulfillment Package</p>
                      </div>
                      <span className="text-sm font-black text-violet-400">
                        {service.basePrice || 0} {currencySymbol}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      This represents the complete standard service consultation with this verified service provider.
                    </p>
                    {service.duration && (
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-violet-400" /> Approx. {service.duration} mins
                      </p>
                    )}
                    <div className="pt-3 space-y-1.5 border-t border-slate-900/60">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-300">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Direct communication of requirements & schedule confirmation</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-300">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Fulfillment subject to standard review & milestone request</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Availability Detail Block */}
            <div className="bg-slate-900/20 border border-slate-900/60 rounded-[2.5rem] p-6 sm:p-8 space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Availability & Scheduling Policy
              </h3>
              
              {availability ? (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 bg-slate-950/40 rounded-2xl border border-slate-850/40">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Working Days</p>
                      <p className="text-xs font-bold text-slate-200">
                        {availability.workingDays && availability.workingDays.length > 0 
                          ? getDayNames(availability.workingDays) 
                          : 'Flexible / Appointment based'}
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-950/40 rounded-2xl border border-slate-850/40">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Working Hours</p>
                      <p className="text-xs font-bold text-slate-200">
                        {availability.workingHours && availability.workingHours.length > 0 
                          ? `${availability.workingHours[0].start} - ${availability.workingHours[0].end}` 
                          : 'Varies / Custom hours'}
                      </p>
                    </div>
                  </div>

                  {availability.timezone && (
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      Times displayed are subject to timezone: <span className="text-slate-300">{availability.timezone}</span>
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 leading-relaxed">
                  The service provider processes booking requests dynamically. Once your request is received, the specialist will coordinate to lock in a suitable calendar slot.
                </p>
              )}

              <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-850/40 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-200 uppercase tracking-wider">Booking Request Workflow</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    This is a booking request model. Scheduling a slot does not trigger a payment or finalize a transaction. The specialist will review your request details and confirm or propose adjustments before the appointment is formalized.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Sticky Booking CTA Sidebar */}
          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
            
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
              
              {/* Card Header */}
              <div className="space-y-1">
                <span className="px-2 py-0.5 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-full text-[8px] font-black uppercase tracking-wider inline-block">
                  Marketplace Appointment
                </span>
                <h3 className="text-base font-black text-white uppercase tracking-tight">
                  Request Service Slot
                </h3>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Send a booking inquiry for the selected package below.
                </p>
              </div>

              {bookingSuccess ? (
                /* Success Presentation */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-6 flex flex-col items-center justify-center text-center space-y-4"
                >
                  <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/5">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">Request Sent Successfully!</h4>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      Your appointment request has been transmitted. Redirecting to your bookings queue...
                    </p>
                  </div>
                </motion.div>
              ) : (
                /* Primary Request Form */
                <form onSubmit={handleBookingRequest} className="space-y-4">
                  {/* Selected Package Details */}
                  {selectedPackage && (
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex flex-col gap-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Choice</span>
                        <span className="text-[10px] font-black text-violet-400 uppercase tracking-wider">{selectedPackage.name}</span>
                      </div>
                      <div className="flex justify-between items-baseline pt-1 border-t border-slate-900/55 mt-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Subtotal:</span>
                        <span className="text-base font-black text-white">
                          {selectedPackage.price} {currencySymbol}
                        </span>
                      </div>
                    </div>
                  )}

                  {user ? (
                    <>
                      {/* Booking Fields */}
                      <div className="grid grid-cols-1 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-violet-400" /> Target Date
                          </label>
                          <input
                            type="date"
                            required
                            disabled={bookingSubmitting}
                            value={bookingDate}
                            onChange={(e) => setBookingDate(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none transition-all cursor-pointer"
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-violet-400" /> Target Time
                          </label>
                          <input
                            type="time"
                            required
                            disabled={bookingSubmitting}
                            value={bookingTime}
                            onChange={(e) => setBookingTime(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none transition-all cursor-pointer"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                          Appointment / Consultation Notes
                        </label>
                        <textarea
                          disabled={bookingSubmitting}
                          value={bookingNotes}
                          onChange={(e) => setBookingNotes(e.target.value)}
                          placeholder="List any details, specifications, or preferred contact channels for this booking..."
                          rows={3}
                          className="w-full bg-slate-950 border border-slate-850 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none transition-all resize-none"
                        />
                      </div>

                      {bookingError && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2 text-[10px] text-red-400 leading-normal">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{bookingError}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={bookingSubmitting}
                        className="w-full py-3 bg-violet-600 hover:bg-violet-500 active:scale-98 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg shadow-violet-600/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {bookingSubmitting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Transmitting...
                          </>
                        ) : (
                          'Request Booking'
                        )}
                      </button>
                    </>
                  ) : (
                    <div className="pt-2 text-center space-y-4">
                      <p className="text-[11px] text-slate-400">
                        Please sign in to your Pi account to request a consultation with this service specialist.
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                      >
                        Sign In / Register
                      </button>
                    </div>
                  )}
                </form>
              )}

              {/* Integrity Reminder */}
              <div className="pt-4 border-t border-slate-850 flex items-start gap-2 text-[9px] text-slate-500 leading-normal">
                <CheckCircle2 className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" />
                <span>By submitting, you agree to the marketplace terms. Service fulfillment is provider-dependent.</span>
              </div>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
};
