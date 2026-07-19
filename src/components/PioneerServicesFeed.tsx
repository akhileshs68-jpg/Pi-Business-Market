/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  SlidersHorizontal,
  Star,
  CheckCircle,
  MapPin,
  Clock,
  Briefcase,
  UserCheck,
  Calendar,
  Sparkles,
  Phone,
  Mail,
  Shield,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { PioneerProfile, User, PioneerCategory } from '../types';
import { PiBusinessMarketDB } from '../services/storage';
import { PiSdkSim } from '../services/piSdk';

interface PioneerServicesFeedProps {
  currentUser: User;
  onNavigate: (view: string, params?: any) => void;
  onWalletUpdate: (newBalance: number) => void;
}

const CATEGORY_MAP: Record<PioneerCategory, { label: string; group: 'store' | 'service' | 'professional' | 'business' }> = {
  product_seller: { label: 'Product Seller', group: 'store' },
  store_owner: { label: 'Store Owner', group: 'store' },
  business_owner: { label: 'Business Owner', group: 'store' },
  service_provider: { label: 'Service Provider', group: 'service' },
  technician: { label: 'Technician', group: 'service' },
  electrician: { label: 'Electrician', group: 'service' },
  plumber: { label: 'Plumber', group: 'service' },
  carpenter: { label: 'Carpenter', group: 'service' },
  mechanic: { label: 'Mechanic', group: 'service' },
  mobile_repair: { label: 'Mobile Repair', group: 'service' },
  repair_appliances: { label: 'Appliance Repair', group: 'service' },
  freelancer: { label: 'Freelancer', group: 'professional' },
  teacher_tutor: { label: 'Teacher / Tutor', group: 'professional' },
  consultant: { label: 'Consultant', group: 'professional' },
  delivery_partner: { label: 'Delivery Partner', group: 'service' },
  skilled_worker: { label: 'Skilled Worker', group: 'professional' },
  labour: { label: 'Skilled Labour', group: 'professional' },
  house_cleaning: { label: 'House Cleaning', group: 'service' },
  job_provider: { label: 'Job Provider', group: 'business' },
  job_seeker: { label: 'Job Seeker', group: 'professional' }
};

export default function PioneerServicesFeed({
  currentUser,
  onNavigate,
  onWalletUpdate
}: PioneerServicesFeedProps) {
  const [profiles, setProfiles] = useState<PioneerProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PioneerCategory | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'available' | 'busy'>('all');
  
  // Modals / Details states
  const [viewingProfile, setViewingProfile] = useState<PioneerProfile | null>(null);
  const [bookingProfile, setBookingProfile] = useState<PioneerProfile | null>(null);
  
  // Booking inputs
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingService, setBookingService] = useState('');
  const [bookingAmount, setBookingAmount] = useState(20); // Default estimate in Pi
  
  // Booking status
  const [bookingStep, setBookingStep] = useState<'input' | 'signing' | 'success' | 'error'>('input');
  const [bookingError, setBookingError] = useState('');
  const [bookingTxHash, setBookingTxHash] = useState('');

  useEffect(() => {
    setProfiles(PiBusinessMarketDB.getPioneerProfiles());
  }, []);

  const handleRefresh = () => {
    setProfiles(PiBusinessMarketDB.getPioneerProfiles());
  };

  // Filter Logic
  const filteredProfiles = profiles.filter(p => {
    // Only services or professionals profiles (we filter out pure store owners as they go in the marketplace tab)
    if (p.pageType === 'store' || p.pageType === 'business') return false;

    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.businessName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || p.availabilityStatus === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Handle Hiring Transaction Workflow via Pi Wallet simulation
  const handleConfirmBooking = () => {
    if (!bookingProfile) return;
    if (!bookingDate || !bookingTime || !bookingService) {
      setBookingError('Please select a service type, date, and time slot.');
      setBookingStep('error');
      return;
    }

    setBookingStep('signing');
    setBookingError('');

    // Initiate Pi SDK transactional payment workflow
    const memo = `Booking: "${bookingService}" with ${bookingProfile.name} on ${bookingDate} at ${bookingTime}`;
    PiSdkSim.executePayment(
      {
        amount: bookingAmount,
        memo,
        metadata: {
          storeId: bookingProfile.id,
          itemsCount: 1
        }
      },
      {
        onReadyForServerApproval: (paymentId) => {
          console.log('[Pi SDK] Booking payment ready for approval:', paymentId);
        },
        onReadyForServerCompletion: (paymentId, txid) => {
          setBookingTxHash(txid);
          onWalletUpdate(PiSdkSim.getBalance());
          
          // Create instant system notification
          PiBusinessMarketDB.createNotification(
            currentUser.uid,
            'Booking Confirmed! 📅',
            `You successfully booked "${bookingService}" with Pioneer ${bookingProfile.name} for ${bookingAmount} Pi. Tx ID: ${txid.substring(0, 16)}...`,
            'payment_received'
          );

          // Create notification for the Service Provider too
          PiBusinessMarketDB.createNotification(
            bookingProfile.ownerUid,
            'New Booking Secured! ⚡',
            `Pioneer ${currentUser.username} booked you for "${bookingService}" on ${bookingDate} at ${bookingTime}. Payment of ${bookingAmount} Pi is locked in escrow.`,
            'system_announcement'
          );

          setBookingStep('success');
        },
        onCancel: () => {
          setBookingError('Payment cancelled by customer.');
          setBookingStep('error');
        },
        onError: (err) => {
          setBookingError(err.message || 'Payment processing failed.');
          setBookingStep('error');
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      
      {/* DIRECTORY FILTERS CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-md flex flex-col gap-4 text-left select-none">
        <div className="flex flex-col md:flex-row items-center gap-3">
          
          {/* Search bar */}
          <div className="relative flex-1 w-full flex items-center border border-slate-800 focus-within:ring-2 focus-within:ring-violet-500/20 focus-within:border-violet-500 rounded-xl px-3.5 transition-all bg-slate-950/40">
            <Search className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 text-sm pl-2 py-2.5 focus:outline-none text-slate-200 font-semibold bg-transparent placeholder-slate-600"
              placeholder="Search services, skills, plumbing, electricians, tutors..."
            />
          </div>

          {/* Quick select dropdowns */}
          <div className="flex gap-2 w-full md:w-auto">
            <select
              value={selectedCategory}
              onChange={(e: any) => setSelectedCategory(e.target.value)}
              className="flex-1 text-xs border border-slate-800 rounded-xl px-3 py-2.5 bg-slate-950 focus:outline-none font-bold text-slate-300 cursor-pointer"
            >
              <option value="all">All Service Categories</option>
              <option value="electrician">Electrician</option>
              <option value="plumber">Plumber</option>
              <option value="technician">General Technician</option>
              <option value="teacher_tutor">Teacher & Tutor</option>
              <option value="consultant">Professional Consultant</option>
              <option value="freelancer">Freelancer / Developer</option>
              <option value="house_cleaning">House Cleaning</option>
              <option value="delivery_partner">Delivery & Courier</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e: any) => setSelectedStatus(e.target.value)}
              className="text-xs border border-slate-800 rounded-xl px-3 py-2.5 bg-slate-950 focus:outline-none font-bold text-slate-300 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="available">🟢 Available</option>
              <option value="busy">🟡 Busy</option>
            </select>
          </div>
        </div>

        {/* Informative Label */}
        <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
          <Shield className="w-3.5 h-3.5 text-violet-400" />
          <span>Every provider is a KYC-Verified Pi Pioneer executing self-signed services in a decentralized network.</span>
        </div>
      </div>

      {/* SERVICE PROVIDERS LIST */}
      {filteredProfiles.length === 0 ? (
        <div className="bg-slate-900 border border-dashed border-slate-800 rounded-3xl py-16 text-center text-slate-500">
          <Briefcase className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h4 className="font-sans font-bold text-slate-300">No Services Matching Search</h4>
          <p className="text-xs max-w-xs mx-auto mt-1 leading-normal text-slate-550">
            Try resetting your filters or typing different skills like "Wiring", "React", or "Pipe".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map((p) => {
            const isAvailable = p.availabilityStatus === 'available';
            const isBusy = p.availabilityStatus === 'busy';
            return (
              <div
                key={p.id}
                className="bg-slate-900 border border-slate-800 hover:border-violet-500/30 rounded-3xl p-5 flex flex-col justify-between shadow-md hover:-translate-y-0.5 transition-all text-left group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex justify-between items-start">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-950 text-slate-400 border border-slate-800/80 font-mono text-[9px] font-bold uppercase tracking-wider">
                      {CATEGORY_MAP[p.category]?.label || p.category.replace('_', ' ')}
                    </span>
                    
                    {/* Availability status badge */}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                      isAvailable ? 'bg-emerald-500/10 text-emerald-400' : isBusy ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        isAvailable ? 'bg-emerald-400 animate-pulse' : isBusy ? 'bg-amber-400' : 'bg-slate-500'
                      }`}></span>
                      {p.availabilityStatus.toUpperCase()}
                    </span>
                  </div>

                  {/* Profile Identification */}
                  <div className="mt-4 flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-inner flex-shrink-0">
                      {p.photoUrls[0] ? (
                        <img src={p.photoUrls[0]} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold uppercase">
                          {p.name.substring(0, 2)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-sans font-bold text-slate-100 text-sm flex items-center gap-1 group-hover:text-violet-400 transition-colors">
                        {p.name}
                        <CheckCircle className="w-3.5 h-3.5 text-violet-400 fill-violet-500/10 flex-shrink-0" />
                      </h4>
                      {p.businessName && <span className="text-[10px] text-slate-500 font-semibold block">{p.businessName}</span>}
                      
                      <div className="flex items-center gap-1 text-[10px] text-slate-550 font-bold mt-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{p.rating.toFixed(1)}</span>
                        <span>({p.reviewCount} hires)</span>
                      </div>
                    </div>
                  </div>

                  {/* Description bio */}
                  <p className="text-xs text-slate-400 mt-4 line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>

                  {/* Service coordinates */}
                  <div className="space-y-1.5 mt-4 text-[10px] text-slate-500 font-mono">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-600" />
                      <span className="line-clamp-1">Area: {p.serviceArea}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-600" />
                      <span>Hours: {p.workingHours}</span>
                    </div>
                  </div>

                  {/* Core skills microtags */}
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {p.skills.slice(0, 4).map((skill, sIdx) => (
                      <span key={sIdx} className="text-[10px] font-bold font-mono px-2 py-0.5 bg-slate-950 text-violet-300/80 border border-slate-800/80 rounded-md">
                        {skill}
                      </span>
                    ))}
                    {p.skills.length > 4 && (
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-slate-950 text-slate-500 border border-slate-800/80 rounded-md">
                        +{p.skills.length - 4}
                      </span>
                    )}
                  </div>
                </div>

                {/* Primary Card action bar */}
                <div className="flex gap-2.5 mt-5 border-t border-slate-800/60 pt-4">
                  <button
                    onClick={() => setViewingProfile(p)}
                    className="flex-1 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold rounded-xl text-[11px] transition-all cursor-pointer"
                  >
                    View Page
                  </button>
                  <button
                    onClick={() => {
                      setBookingProfile(p);
                      setBookingStep('input');
                      setBookingService(p.skills[0] || 'Consultation');
                      setBookingDate('');
                      setBookingTime('');
                      setBookingNotes('');
                    }}
                    className="flex-1 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-[11px] transition-all cursor-pointer shadow-md shadow-violet-500/10"
                  >
                    Hire with Pi
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* PROFILE DETAIL PUBLIC PAGE SIMULATOR MODAL */}
      {viewingProfile && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 text-left relative scrollbar-none animate-scale-in">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 border border-slate-800/80 text-violet-300 font-mono text-[9px] font-bold uppercase tracking-wider">
                  Verified Public Profile ({viewingProfile.pageType.toUpperCase()})
                </span>
                <h3 className="font-sans font-extrabold text-slate-100 text-xl mt-3 flex items-center gap-1.5">
                  {viewingProfile.name}
                  <CheckCircle className="w-4 h-4 text-violet-400 fill-violet-500/10 flex-shrink-0" />
                </h3>
                {viewingProfile.businessName && <span className="text-xs text-slate-500 font-semibold">{viewingProfile.businessName}</span>}
              </div>
              <button
                onClick={() => setViewingProfile(null)}
                className="p-1.5 rounded-lg hover:bg-slate-850 text-slate-550 hover:text-slate-200 transition-colors cursor-pointer text-xs font-bold font-mono border border-slate-800"
              >
                Close
              </button>
            </div>

            {/* Profile body content */}
            <div className="space-y-6 mt-6">
              
              {/* Profile showcase image */}
              {viewingProfile.photoUrls[0] && (
                <div className="h-48 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-inner select-none">
                  <img src={viewingProfile.photoUrls[0]} alt={viewingProfile.name} className="w-full h-full object-cover" />
                </div>
              )}

              {/* Bio description */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-450">About Business & Services</h4>
                <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/40 p-4 border border-slate-850 rounded-2xl">
                  {viewingProfile.description}
                </p>
              </div>

              {/* Detailed coordinates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono text-slate-400 bg-slate-950/30 p-4 border border-slate-850 rounded-2xl">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-violet-400" />
                    <span>Coverage: {viewingProfile.serviceArea}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-violet-400" />
                    <span>Hours: {viewingProfile.workingHours}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-violet-400" />
                    <span>Availability: {viewingProfile.availabilityStatus.toUpperCase()}</span>
                  </div>
                </div>

                <div className="space-y-2 border-t sm:border-t-0 sm:border-l border-slate-850 pt-2 sm:pt-0 sm:pl-4">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <span>{viewingProfile.contactInfo.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-500" />
                    <span>{viewingProfile.contactInfo.phone}</span>
                  </div>
                  {viewingProfile.contactInfo.telegram && (
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-sky-400" />
                      <span>Telegram: @{viewingProfile.contactInfo.telegram}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Skills and specialties */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-450">Verified Skills & Services</h4>
                <div className="flex flex-wrap gap-2">
                  {viewingProfile.skills.map((skill, sIdx) => (
                    <span key={sIdx} className="text-xs font-bold font-mono px-3 py-1 bg-slate-950 text-violet-300 border border-slate-800 rounded-lg">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Portfolio section (If exists) */}
              {viewingProfile.portfolio.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-450">Previous Project Showcases</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {viewingProfile.portfolio.map((item) => (
                      <div key={item.id} className="bg-slate-950 border border-slate-850 rounded-2xl p-3 flex flex-col justify-between">
                        <div>
                          {item.imageUrl && (
                            <div className="h-28 rounded-xl overflow-hidden mb-2 shadow-inner">
                              <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <h5 className="text-xs font-bold text-slate-200">{item.title}</h5>
                          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Secure Pi Wallet coordinate */}
              <div className="bg-slate-950/70 border border-slate-850 p-4 rounded-2xl text-xs font-mono flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Escrow Settlement Destination</span>
                  <span className="text-slate-300 mt-1 block line-clamp-1">{viewingProfile.piWalletAddress}</span>
                </div>
                <div className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                  <UserCheck className="w-3.5 h-3.5" /> Checked
                </div>
              </div>

              {/* Dynamic trigger button */}
              <button
                onClick={() => {
                  setViewingProfile(null);
                  setBookingProfile(viewingProfile);
                  setBookingStep('input');
                  setBookingService(viewingProfile.skills[0] || 'Consultation');
                }}
                className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-2xl text-xs transition-all cursor-pointer shadow-lg shadow-violet-500/15 text-center block"
              >
                Hire & Book with Pi Coins
              </button>

            </div>
          </div>
        </div>
      )}

      {/* BOOKING FLOW TRANSACTION MODAL */}
      {bookingProfile && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 text-left relative select-none shadow-xl animate-scale-in">
            
            {/* Modal close icon */}
            {bookingStep !== 'signing' && (
              <button
                onClick={() => setBookingProfile(null)}
                className="absolute right-5 top-5 p-1 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-200 transition-colors"
              >
                ✕
              </button>
            )}

            {bookingStep === 'input' && (
              <div className="space-y-5">
                <div>
                  <span className="text-[10px] text-violet-400 font-bold uppercase font-mono tracking-wider">Pioneer Escrow Settlement</span>
                  <h3 className="font-sans font-bold text-slate-100 text-base mt-1">Book: {bookingProfile.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">Select dates and service specifics. Pi will be held securely in sandbox escrow.</p>
                </div>

                <div className="space-y-3 text-xs">
                  
                  {/* Select Service Specifics */}
                  <div className="space-y-1.5 text-left">
                    <label className="font-bold text-slate-400">Select Requested Service</label>
                    <select
                      value={bookingService}
                      onChange={(e) => {
                        setBookingService(e.target.value);
                        // randomize some price depending on length or service to make it fun
                        setBookingAmount(Math.floor(15 + Math.random() * 35));
                      }}
                      className="w-full text-xs border border-slate-800 rounded-xl px-3 py-2.5 bg-slate-950 focus:outline-none font-semibold text-slate-300 cursor-pointer"
                    >
                      {bookingProfile.skills.map((skill, idx) => (
                        <option key={idx} value={skill}>{skill}</option>
                      ))}
                      <option value="Custom General Consult">Custom Consultation</option>
                    </select>
                  </div>

                  {/* Date Input */}
                  <div className="space-y-1.5 text-left">
                    <label className="font-bold text-slate-400">Requested Date</label>
                    <input
                      type="date"
                      value={bookingDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full text-xs border border-slate-800 rounded-xl px-3 py-2.5 bg-slate-950 focus:outline-none font-semibold text-slate-300"
                    />
                  </div>

                  {/* Time input */}
                  <div className="space-y-1.5 text-left">
                    <label className="font-bold text-slate-400">Time Slot</label>
                    <input
                      type="time"
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="w-full text-xs border border-slate-800 rounded-xl px-3 py-2.5 bg-slate-950 focus:outline-none font-semibold text-slate-300"
                    />
                  </div>

                  {/* Optional Notes */}
                  <div className="space-y-1.5 text-left">
                    <label className="font-bold text-slate-400">Specific Requirements (Optional)</label>
                    <textarea
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      rows={2}
                      className="w-full text-xs border border-slate-800 rounded-xl px-3 py-2.5 bg-slate-950 focus:outline-none font-semibold text-slate-300 resize-none"
                      placeholder="Add specific instructions for the contractor..."
                    />
                  </div>

                  {/* Estimated Pi Cost */}
                  <div className="bg-slate-950 p-3.5 border border-slate-850 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-500 text-[10px] uppercase block">Contract Pricing</span>
                      <span className="text-[10px] text-slate-600 block mt-0.5">Determined dynamically by protocol</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-mono font-bold text-amber-300">{bookingAmount} π</span>
                      <span className="text-[9px] font-semibold text-slate-500 block">0% service fee</span>
                    </div>
                  </div>

                </div>

                <button
                  onClick={handleConfirmBooking}
                  className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer text-center block shadow-md shadow-violet-500/10"
                >
                  Pay & Confirm Booking
                </button>
              </div>
            )}

            {bookingStep === 'signing' && (
              <div className="py-10 text-center space-y-4 select-none">
                <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div>
                  <h4 className="font-sans font-bold text-slate-250 text-sm">Waiting for Consensus Nodes</h4>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                    Simulating Pi Blockchain SDK callbacks. Please authorize payment of {bookingAmount} Pi in your Pi Wallet popup...
                  </p>
                </div>
                <div className="text-[9px] font-mono text-slate-600">
                  PAYMENT_ID: pay_sim_{Math.random().toString(36).substring(2, 6)}
                </div>
              </div>
            )}

            {bookingStep === 'success' && (
              <div className="text-center py-6 space-y-5">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-sans font-extrabold text-slate-100 text-base">Booking Settled!</h4>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed px-4">
                    Your appointment for <span className="font-semibold text-slate-200">"{bookingService}"</span> has been booked successfully on <span className="font-semibold text-slate-200">{bookingDate}</span>.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 border border-slate-850 rounded-2xl text-left space-y-1.5 text-[10px] font-mono text-slate-500">
                  <div>
                    <span className="font-bold text-slate-600 uppercase block">Tx Block Hash:</span>
                    <span className="text-slate-450 line-clamp-1">{bookingTxHash}</span>
                  </div>
                  <div className="pt-1.5 border-t border-slate-850/60 flex justify-between">
                    <span>Ledger Status:</span>
                    <span className="text-emerald-400 font-bold">CONCURRENTLY_CONFIRMED</span>
                  </div>
                </div>

                <button
                  onClick={() => setBookingProfile(null)}
                  className="w-full py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </div>
            )}

            {bookingStep === 'error' && (
              <div className="text-center py-6 space-y-4">
                <div className="w-12 h-12 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-sans font-bold text-slate-200 text-sm">Booking Settle Failed</h4>
                  <p className="text-xs text-rose-400/90 mt-1 px-4 leading-relaxed">{bookingError}</p>
                </div>
                <button
                  onClick={() => setBookingStep('input')}
                  className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Adjust Booking Details
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
