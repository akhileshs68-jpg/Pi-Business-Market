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

const MOCK_DIRECTORY_LISTINGS: DirectoryListing[] = [
  {
    id: 'doc_dr_sarah',
    name: 'Dr. Sarah Jenkins, MD',
    type: 'professional',
    professionCategory: 'Doctor',
    titleOrSpecialty: 'Telemedicine & General Cardiology',
    location: 'Boston, MA • Remote Consultation',
    rating: 4.9,
    reviewCount: 128,
    trustScore: 99,
    verified: true,
    imageUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300',
    description: 'Board-certified cardiologist providing online consultations paid in Pi cryptocurrency.',
    experienceYears: 14,
    consultationFeePi: 25
  },
  {
    id: 'law_lex_pioneer',
    name: 'Adv. Michael Vance & Partners',
    type: 'professional',
    professionCategory: 'Lawyer',
    titleOrSpecialty: 'Corporate Law, Smart Contracts & IP',
    location: 'London, UK',
    rating: 4.8,
    reviewCount: 94,
    trustScore: 97,
    verified: true,
    imageUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300',
    description: 'International legal advisory specializing in Web3 compliance, trademark protection & business disputes.',
    experienceYears: 18,
    consultationFeePi: 40
  },
  {
    id: 'eng_apex_struct',
    name: 'Apex Structural Engineering',
    type: 'professional',
    professionCategory: 'Engineer',
    titleOrSpecialty: 'Civil & Renewable Energy Systems',
    location: 'Frankfurt, Germany',
    rating: 5.0,
    reviewCount: 62,
    trustScore: 98,
    verified: true,
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300',
    description: 'Certified structural engineering firm delivering solar grid designs and commercial blueprints.',
    experienceYears: 12,
    consultationFeePi: 50
  },
  {
    id: 'arch_studio_v',
    name: 'Studio V Modern Architects',
    type: 'professional',
    professionCategory: 'Architect',
    titleOrSpecialty: 'Sustainable Eco-Architecture & 3D Renderings',
    location: 'Tokyo, Japan',
    rating: 4.9,
    reviewCount: 88,
    trustScore: 96,
    verified: true,
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=300',
    description: 'Award-winning architectural studio crafting passive energy homes and luxury commercial spaces.',
    experienceYears: 10,
    consultationFeePi: 35
  },
  {
    id: 'edu_pioneer_academy',
    name: 'Global Pioneer Academy',
    type: 'organization',
    professionCategory: 'School',
    titleOrSpecialty: 'K-12 STEM & Web3 Software Engineering School',
    location: 'Singapore Educational Hub',
    rating: 4.9,
    reviewCount: 310,
    trustScore: 99,
    verified: true,
    imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=300',
    description: 'Accredited international school accepting Pi tuition fees for coding, science, and languages.',
    experienceYears: 20
  },
  {
    id: 'hosp_st_jude',
    name: 'St. Jude International Hospital',
    type: 'organization',
    professionCategory: 'Hospital',
    titleOrSpecialty: 'Emergency Medicine & Diagnostic Center',
    location: 'Nairobi, Kenya',
    rating: 4.8,
    reviewCount: 420,
    trustScore: 98,
    verified: true,
    imageUrl: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=300',
    description: 'Full-service tertiary healthcare institution supporting pioneer health escrow programs.',
    experienceYears: 25
  },
  {
    id: 'ngo_green_earth',
    name: 'GreenEarth Reforestation Trust',
    type: 'organization',
    professionCategory: 'NGO',
    titleOrSpecialty: 'Environmental Protection & Carbon Offsets',
    location: 'Global Non-Profit',
    rating: 5.0,
    reviewCount: 512,
    trustScore: 100,
    verified: true,
    imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=300',
    description: 'Verified non-profit organization planting trees funded directly by Pi Pioneer donations.',
    experienceYears: 8
  },
  {
    id: 'freelance_alex_ui',
    name: 'Alex Rivera • Principal Designer',
    type: 'professional',
    professionCategory: 'Freelancer',
    titleOrSpecialty: 'UI/UX Design, React & Motion Graphics',
    location: 'Barcelona, Spain • Remote',
    rating: 4.9,
    reviewCount: 145,
    trustScore: 95,
    verified: true,
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
    description: 'Freelance product designer with 8+ years building enterprise SaaS dashboards & mobile apps.',
    experienceYears: 8,
    consultationFeePi: 15
  },
  {
    id: 'creator_studio_pi',
    name: 'Vanguard Media House',
    type: 'professional',
    professionCategory: 'Creator',
    titleOrSpecialty: '4K Video Production & Brand Storytelling',
    location: 'Los Angeles, CA',
    rating: 4.8,
    reviewCount: 76,
    trustScore: 94,
    verified: true,
    imageUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=300',
    description: 'High-end content creation studio helping Web3 enterprises launch promotional campaigns.',
    experienceYears: 6,
    consultationFeePi: 30
  },
  {
    id: 'local_express_plumb',
    name: 'QuickFix Express Plumbing & HVAC',
    type: 'professional',
    professionCategory: 'Local Service',
    titleOrSpecialty: '24/7 Emergency Plumbing & Solar Water Heating',
    location: 'Toronto, Canada',
    rating: 4.9,
    reviewCount: 230,
    trustScore: 96,
    verified: true,
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300',
    description: 'Licensed plumbers and technicians offering on-demand residential repairs paid in Pi.',
    experienceYears: 15,
    consultationFeePi: 20
  }
];

export const BusinessDirectory: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [listings, setListings] = useState<DirectoryListing[]>(MOCK_DIRECTORY_LISTINGS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDirectoryListings();
  }, [selectedCategory]);

  const fetchDirectoryListings = async () => {
    setLoading(true);
    try {
      const db = getFirebaseDb();
      const q = query(collection(db, 'businesses'), limit(20));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const fetchedList: DirectoryListing[] = snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            name: data.businessName || data.displayName || 'Verified Partner',
            type: 'business',
            professionCategory: (data.industry as any) || 'Enterprise',
            titleOrSpecialty: data.category || data.industry || 'General Business',
            location: data.location || data.city || 'Global Hub',
            rating: data.rating || 4.8,
            reviewCount: data.reviewCount || 35,
            trustScore: data.trustScore || 95,
            verified: data.verificationStatus === 'Verified',
            imageUrl: data.logoUrl || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=300',
            description: data.description || 'Verified Pioneer Business Ecosystem member.',
            experienceYears: data.experienceYears || 5
          };
        });
        setListings([...fetchedList, ...MOCK_DIRECTORY_LISTINGS]);
      } else {
        setListings(MOCK_DIRECTORY_LISTINGS);
      }
    } catch (e) {
      setListings(MOCK_DIRECTORY_LISTINGS);
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
