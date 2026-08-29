/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  Store, 
  Stethoscope, 
  Scale, 
  GraduationCap, 
  Wrench, 
  Palette, 
  HeartHandshake, 
  Hospital, 
  Search, 
  MapPin, 
  CheckCircle2, 
  Star, 
  ShieldCheck, 
  ChevronRight, 
  Filter, 
  UserCheck, 
  Sparkles,
  Phone,
  Globe,
  Award,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { getFirebaseDb } from '../../firebase/config';
import { useNavigate } from 'react-router-dom';
import { PriceDisplay } from '../pricing/PriceDisplay';
import { ItemManagementMenu } from '../marketplace/ItemManagementMenu';

export interface DirectoryListing {
  id: string;
  name: string;
  type: 'business' | 'store' | 'professional' | 'organization';
  professionCategory: 
    | 'Doctor' 
    | 'Lawyer' 
    | 'Teacher' 
    | 'Engineer' 
    | 'Architect' 
    | 'NGO' 
    | 'School' 
    | 'Hospital' 
    | 'Freelancer' 
    | 'Creator' 
    | 'Local Service'
    | 'Enterprise'
    | 'Store';
  titleOrSpecialty: string;
  location: string;
  rating: number;
  reviewCount: number;
  trustScore: number;
  verified: boolean;
  imageUrl: string;
  bannerUrl?: string;
  description: string;
  phone?: string;
  website?: string;
  experienceYears?: number;
  consultationFeePi?: number;
}

export const BusinessDirectory: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [listings, setListings] = useState<DirectoryListing[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDirectoryListings();
  }, [selectedCategory]);

  const fetchDirectoryListings = async () => {
    setLoading(true);
    try {
      const db = getFirebaseDb();
      const q = query(collection(db, 'businesses'), limit(50));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const fetchedList: DirectoryListing[] = snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            name: data.businessName || data.displayName || 'Verified Partner',
            type: 'business',
            professionCategory: (data.industry as any) || data.category || 'Enterprise',
            titleOrSpecialty: data.category || data.industry || 'General Business',
            location: data.location || data.city || 'Global Hub',
            rating: data.rating || 5.0,
            reviewCount: data.reviewCount || 0,
            trustScore: data.trustScore || 95,
            verified: data.verificationStatus === 'Verified' || data.verified === true,
            imageUrl: data.logoUrl || data.bannerUrl || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=300',
            description: data.description || 'Verified Pioneer Business Ecosystem member.',
            experienceYears: data.experienceYears || 1
          };
        });
        setListings(fetchedList);
      } else {
        setListings([]);
      }
    } catch (e) {
      console.warn('Error fetching directory listings:', e);
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const categoriesList = [
    { id: 'all', label: 'All Listings', icon: Sparkles },
    { id: 'Doctor', label: 'Doctors & Medical', icon: Stethoscope },
    { id: 'Lawyer', label: 'Lawyers & Legal', icon: Scale },
    { id: 'Teacher', label: 'Teachers & Education', icon: GraduationCap },
    { id: 'Engineer', label: 'Engineers', icon: Wrench },
    { id: 'Architect', label: 'Architects', icon: Building2 },
    { id: 'NGO', label: 'NGOs & Non-Profits', icon: HeartHandshake },
    { id: 'Hospital', label: 'Hospitals & Clinics', icon: Hospital },
    { id: 'Freelancer', label: 'Freelancers & Tech', icon: UserCheck },
    { id: 'Creator', label: 'Creators & Media', icon: Palette },
    { id: 'Local Service', label: 'Local Services', icon: Store },
  ];

  const filteredListings = useMemo(() => {
    return listings.filter(item => {
      const matchSearch = 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.titleOrSpecialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCat = selectedCategory === 'all' || item.professionCategory === selectedCategory;
      const matchVer = !verifiedOnly || item.verified;

      return matchSearch && matchCat && matchVer;
    });
  }, [listings, searchTerm, selectedCategory, verifiedOnly]);

  return (
    <div className="space-y-8">
      {/* Directory Banner */}
      <div className="bg-gradient-to-r from-violet-950 via-indigo-950 to-slate-950 border border-violet-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="px-3 py-1 bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-black uppercase rounded-full tracking-widest inline-flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-400" /> Enterprise Discovery Directory
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight leading-tight">
            Find Verified Professionals, Businesses & Services
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
            Discover accredited doctors, legal consultants, software engineers, architects, schools, hospitals & verified local services — all accepting Pi payments.
          </p>
        </div>
      </div>

      {/* Search & Filter Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          
          {/* Universal Search Input */}
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search doctors, lawyers, engineers, schools, hospitals, local services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-white placeholder-slate-500 outline-none transition-all"
            />
          </div>

          {/* Toggle Verified */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end shrink-0">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-violet-500 focus:ring-violet-500"
              />
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified Only</span>
              </span>
            </label>

            <span className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-2.5 rounded-xl border border-slate-800 font-bold">
              {filteredListings.length} Listed
            </span>
          </div>
        </div>

        {/* Profession Categories Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
          {categoriesList.map(cat => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 uppercase tracking-wider text-[10px] ${
                  isSelected 
                    ? 'bg-violet-600 text-white font-black shadow-md' 
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Directory Listings Grid */}
      {filteredListings.length === 0 ? (
        <div className="py-20 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl p-8 space-y-4">
          <Building2 className="w-12 h-12 text-slate-700 mx-auto" />
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">No Businesses or Specialists Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              There are no directory listings matching your search criteria or category filter.
            </p>
          </div>
          <button
            onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-violet-600/20"
          >
            Clear Search & Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredListings.map(item => (
            <motion.div
              key={item.id}
              whileHover={{ y: -3 }}
              onClick={() => navigate(`/business/${item.id}`)}
              className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-violet-500/40 rounded-2xl p-4 transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4 shadow-lg group"
            >
              <div className="flex items-start gap-3">
                <img 
                  src={item.imageUrl} 
                  alt={item.name} 
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-800 shrink-0 shadow"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="px-2 py-0.5 bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[8px] font-black uppercase rounded">
                      {item.professionCategory}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.verified && (
                        <span className="flex items-center gap-1 text-emerald-400 text-[9px] font-bold">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Trust: {item.trustScore}</span>
                        </span>
                      )}
                      <ItemManagementMenu item={item} itemType="business" buttonVariant="card" />
                    </div>
                  </div>

                  <h3 className="text-sm font-black text-white group-hover:text-violet-400 transition-colors truncate">
                    {item.name}
                  </h3>
                  
                  <p className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">
                    {item.titleOrSpecialty}
                  </p>

                  <div className="flex items-center gap-1 text-[9px] text-slate-500 mt-1">
                    <MapPin className="w-3 h-3 text-slate-600 shrink-0" />
                    <span className="truncate">{item.location}</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 font-medium">
                {item.description}
              </p>

              <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-amber-400 font-bold text-[10px]">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{item.rating.toFixed(1)}</span>
                  <span className="text-slate-500 font-normal">({item.reviewCount})</span>
                </div>

                {item.consultationFeePi ? (
                  <PriceDisplay 
                    item={{ price: item.consultationFeePi, currency: 'Pi', serviceName: item.titleOrSpecialty, pricingType: 'session' }} 
                    type="service" 
                    size="sm" 
                  />
                ) : (
                  <span className="text-[10px] font-bold text-violet-400 group-hover:underline flex items-center gap-0.5">
                    <span>View Details</span>
                    <ChevronRight className="w-3 h-3" />
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
