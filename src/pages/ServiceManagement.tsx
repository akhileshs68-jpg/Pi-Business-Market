/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  MapPin, 
  Globe, 
  Package, 
  Calendar,
  MoreVertical,
  Star,
  Loader2,
  AlertCircle,
  Settings2,
  Trash2,
  Archive,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from '../components/Navbar';
import { useAuth } from '../auth/useAuth';
import { serviceMarketplaceService } from '../services/serviceMarketplaceService';
import { Service, ServicePricingType, ServiceLocationType } from '../types';
import { ServiceWizard } from '../components/service/ServiceWizard';

export const ServiceManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessId] = useState('PI-CORP-001'); // Derived in production
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const data = await serviceMarketplaceService.getServices(businessId);
      setServices(data);
    } catch (err) {
      console.error('Failed to fetch services', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'draft': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <Navbar 
        currentUser={user!}
        currentView="services"
        onNavigate={(view) => navigate(`/${view}`)}
        cartCount={0}
        walletBalance={100}
        onWalletUpdate={() => {}}
        onToggleCart={() => {}}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-violet-600/20 rounded-xl">
                <Briefcase className="w-6 h-6 text-violet-400" />
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight uppercase">Service Portal</h1>
            </div>
            <p className="text-slate-500 font-medium">Enterprise marketplace for professional services and expertise.</p>
          </div>
          <button 
            onClick={() => setIsWizardOpen(true)}
            className="flex items-center gap-3 px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-violet-600/20 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Publish Service
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Stats */}
          <div className="lg:col-span-1 space-y-6">
            {[
              { label: 'Active Services', value: services.length, icon: Briefcase, color: 'text-violet-400' },
              { label: 'Pending Quotes', value: '4', icon: Clock, color: 'text-amber-400' },
              { label: 'Market Visibility', value: 'High', icon: Globe, color: 'text-emerald-400' },
            ].map((stat, i) => (
              <div key={i} className="p-6 bg-slate-900/50 border border-slate-800 rounded-3xl">
                <div className="flex items-center gap-3 mb-4">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
                </div>
                <p className="text-3xl font-black text-white">{stat.value}</p>
              </div>
            ))}

            <div className="p-8 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-[2.5rem] relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform">
                  <Settings2 className="w-24 h-24 text-white" />
               </div>
               <h4 className="text-white font-black text-lg mb-2 relative z-10 uppercase tracking-tight">Availability Rules</h4>
               <p className="text-violet-100/70 text-xs font-medium mb-6 relative z-10">Configure your global working hours and holiday blackout dates.</p>
               <button className="w-full py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative z-10 border border-white/10">
                 Manage Schedule
               </button>
            </div>
          </div>

          {/* Service List */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input 
                  placeholder="Search Service Portfolio..." 
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-sm text-white focus:border-violet-500 outline-none transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <button className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 hover:text-white transition-colors">
                  <Filter className="w-5 h-5" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
                <p className="text-sm font-black text-slate-600 uppercase tracking-widest animate-pulse">Scanning Service Registry...</p>
              </div>
            ) : services.length === 0 ? (
              <div className="py-32 text-center bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-[3rem]">
                <Briefcase className="w-16 h-16 text-slate-700 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-white mb-2">No Services Published</h3>
                <p className="text-slate-500 max-w-sm mx-auto mb-10">Begin offering your expertise to the Pi Network community by publishing your first service.</p>
                <button className="px-10 py-4 bg-violet-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-violet-600/20">
                  Launch Enterprise Service
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {services.map(service => (
                  <motion.div 
                    key={service.serviceId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group bg-slate-900/50 border border-slate-800 hover:border-violet-500/50 rounded-[2.5rem] p-6 transition-all relative overflow-hidden"
                  >
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="w-full md:w-48 h-48 rounded-3xl bg-slate-950 border border-slate-800 relative overflow-hidden group-hover:scale-105 transition-transform shrink-0">
                        {service.mainImage ? (
                          <img src={service.mainImage} alt={service.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Briefcase className="w-12 h-12 text-slate-800" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                           <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${getStatusColor(service.status)} backdrop-blur-md`}>
                             {service.status}
                           </span>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-2xl font-black text-white group-hover:text-violet-400 transition-colors uppercase tracking-tight truncate">{service.title}</h3>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            <span className="text-xs font-bold text-white">{service.rating}</span>
                          </div>
                        </div>

                        <p className="text-sm text-slate-500 line-clamp-2 mb-6 font-medium leading-relaxed">{service.description}</p>

                        <div className="flex flex-wrap gap-4 mb-6">
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950/50 rounded-xl border border-slate-800/50">
                            <Tag className="w-3 h-3 text-violet-400" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase">{service.pricingType}</span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950/50 rounded-xl border border-slate-800/50">
                            <MapPin className="w-3 h-3 text-indigo-400" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase">{service.locationType}</span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950/50 rounded-xl border border-slate-800/50">
                            <Clock className="w-3 h-3 text-emerald-400" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase">{service.duration} Min</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-slate-800/50">
                          <div className="flex items-center gap-3">
                            <p className="text-2xl font-black text-white">{service.basePrice} {service.currency}</p>
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Base Rate</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="p-3 bg-slate-800 hover:bg-violet-600 text-white rounded-xl transition-all">
                              <Settings2 className="w-4 h-4" />
                            </button>
                            <button className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                              Edit Portfolio <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <ServiceWizard 
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={() => {
          setIsWizardOpen(false);
          fetchServices();
        }}
        businessId={businessId}
      />
    </div>
  );
};
