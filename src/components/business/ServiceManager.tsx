/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, Archive, Pause, Play, Eye, 
  Search, Loader2, Tag, Layers, Sliders, CheckCircle2,
  AlertCircle, ChevronDown, Check, Globe, RefreshCw, Clock, MapPin, Briefcase, X
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { useAuth } from '../../auth/useAuth';
import { serviceMarketplaceService } from '../../services/serviceMarketplaceService';
import { EnterpriseServiceEngine } from '../../core/service/enterpriseServiceEngine';
import { Service, ServicePricingType, ServiceLocationType, ServiceStatus } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

export const ServiceManager: React.FC = () => {
  const { currentBusiness, stores } = useBusiness();
  const { user } = useAuth();
  
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    category: string;
    subCategory: string;
    pricingType: ServicePricingType;
    basePrice: number;
    currency: string;
    duration: number;
    locationType: ServiceLocationType;
    serviceArea: string;
    status: ServiceStatus;
    imageUrl: string;
    availableDays: string;
    availableTime: string;
    bookingRequired: boolean;
  }>({
    title: '',
    description: '',
    category: '',
    subCategory: '',
    pricingType: 'fixed',
    basePrice: 0,
    currency: 'π',
    duration: 60,
    locationType: 'online',
    serviceArea: '',
    status: 'published',
    imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500',
    availableDays: 'Monday - Friday',
    availableTime: '09:00 AM - 05:00 PM',
    bookingRequired: true
  });

  const [savingForm, setSavingForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
  }, [currentBusiness]);

  const fetchServices = async () => {
    if (!currentBusiness) return;
    setLoading(true);
    try {
      const fetched = await serviceMarketplaceService.getServices(currentBusiness.id);
      setServices(fetched);
    } catch (err) {
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingService(null);
    setFormData({
      title: '',
      description: '',
      category: 'Consulting',
      subCategory: '',
      pricingType: 'fixed',
      basePrice: 0,
      currency: 'π',
      duration: 60,
      locationType: 'online',
      serviceArea: 'Global',
      status: 'published',
      imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500',
      availableDays: 'Monday - Friday',
      availableTime: '09:00 AM - 05:00 PM',
      bookingRequired: true
    });
    setErrorMsg(null);
    setIsFormOpen(true);
  };

  useEffect(() => {
    const action = new URLSearchParams(window.location.search).get('action');
    if (action === 'add_service' && !isFormOpen) {
      handleOpenCreate();
      const url = new URL(window.location.href);
      url.searchParams.delete('action');
      window.history.replaceState({}, '', url.toString());
    }
  }, [isFormOpen]);

  const handleOpenEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      title: service.title || '',
      description: service.description || '',
      category: service.category || '',
      subCategory: service.subCategory || '',
      pricingType: service.pricingType || 'fixed',
      basePrice: service.basePrice || 0,
      currency: service.currency || 'π',
      duration: service.duration || 60,
      locationType: service.locationType || 'online',
      serviceArea: service.serviceArea || 'Global',
      status: service.status || 'published',
      imageUrl: service.mainImage || (service.imageUrls && service.imageUrls[0]) || 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500',
      availableDays: (service as any).availableDays || 'Monday - Friday',
      availableTime: (service as any).availableTime || '09:00 AM - 05:00 PM',
      bookingRequired: (service as any).bookingRequired !== undefined ? (service as any).bookingRequired : true
    });
    setErrorMsg(null);
    setIsFormOpen(true);
  };

  const handleToggleStatus = async (service: Service) => {
    setActionLoading(service.serviceId);
    try {
      const newStatus = service.status === 'published' ? 'draft' : 'published';
      await serviceMarketplaceService.updateService(service.serviceId, { status: newStatus });
      await fetchServices();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!window.confirm('Are you sure you want to delete this service listing?')) return;
    setActionLoading(serviceId);
    try {
      await serviceMarketplaceService.deleteService(serviceId);
      await fetchServices();
    } catch (err) {
      console.error('Failed to delete service:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness) return;

    setSavingForm(true);
    setErrorMsg(null);
    try {
      const activeStore = stores[0]; // Fallback to primary store

      const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const payload: any = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        subCategory: formData.subCategory,
        pricingType: formData.pricingType,
        basePrice: Number(formData.basePrice),
        currency: formData.currency,
        duration: Number(formData.duration),
        locationType: formData.locationType,
        serviceArea: formData.serviceArea,
        status: formData.status,
        visibility: 'public',
        slug,
        mainImage: formData.imageUrl,
        imageUrls: [formData.imageUrl],
        ownerUid: user?.uid || currentBusiness.ownerUid,
        businessId: currentBusiness.id,
        storeId: activeStore?.storeId || 'none',
        availableDays: formData.availableDays,
        availableTime: formData.availableTime,
        bookingRequired: formData.bookingRequired
      };

      if (editingService) {
        await serviceMarketplaceService.updateService(editingService.serviceId, payload);
      } else {
        await serviceMarketplaceService.createService(payload);
      }
      setIsFormOpen(false);
      await fetchServices();
    } catch (err: any) {
      console.error('Save service failed:', err);
      setErrorMsg(err.message || 'An error occurred while saving the service.');
    } finally {
      setSavingForm(false);
    }
  };

  const filteredServices = services.filter(s => {
    const matchesSearch = s.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || s.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 p-5 rounded-3xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-emerald-500 outline-none w-56 transition-all"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 outline-none cursor-pointer focus:border-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="paused">Paused</option>
          </select>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Service Listing
        </button>
      </div>

      {/* Service List */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      ) : filteredServices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map(s => (
            <div 
              key={s.serviceId} 
              className="bg-slate-900/30 border border-slate-800 rounded-3xl p-5 space-y-4 hover:border-slate-700/80 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
                  <img 
                    src={s.mainImage || (s.imageUrls && s.imageUrls[0]) || 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500'} 
                    alt={s.title} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2.5 right-2.5">
                    <span className={`px-2.5 py-1 text-[9px] font-bold rounded-full border ${
                      s.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    }`}>
                      {s.status}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">{s.category || 'Professional Services'}</span>
                  <h4 className="text-sm font-extrabold text-white line-clamp-1 mt-0.5">{s.title}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">{s.description}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 space-y-3 mt-auto">
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>{s.duration || 60} mins</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{s.locationType === 'online' ? 'Online' : (s.serviceArea || 'On-Site')}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 text-[10px] font-medium block">Base Price</span>
                    <span className="text-sm font-black text-white">{s.basePrice} π</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleStatus(s)}
                      disabled={actionLoading === s.serviceId}
                      className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl text-xs transition-all flex items-center gap-1"
                    >
                      {s.status === 'published' ? <Pause size={14} /> : <Play size={14} />}
                      <span className="hidden xl:inline">{s.status === 'published' ? 'Pause' : 'Activate'}</span>
                    </button>
                    <button
                      onClick={() => handleOpenEdit(s)}
                      className="p-2 bg-slate-950 hover:bg-emerald-600/10 border border-slate-800 hover:border-emerald-500/20 text-emerald-400 rounded-xl transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(s.serviceId)}
                      className="p-2 bg-slate-950 hover:bg-rose-600/10 border border-slate-800 hover:border-rose-500/20 text-rose-400 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-slate-900/20 rounded-3xl border border-dashed border-slate-800">
          <Briefcase className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <h4 className="text-base font-bold text-white">No Services Registered</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">Create consulting sessions, tutoring slots, or local contractor services.</p>
          <button 
            onClick={handleOpenCreate}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl"
          >
            Create First Service
          </button>
        </div>
      )}

      {/* Service Modal Form */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-black text-white">
                    {editingService ? 'Edit Service Specification' : 'Register Service Listing'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Publish consultant hours, contractor tasks, or tutoring services to the Marketplace.
                  </p>
                </div>
                <button 
                  onClick={() => setIsFormOpen(false)}
                  className="p-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {errorMsg && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-start gap-3 text-xs text-rose-400">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{errorMsg}</p>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest border-b border-slate-800/60 pb-1.5">Specification Info</h4>
                    
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400">Service Title *</label>
                      <input 
                        type="text" 
                        required
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:border-emerald-500 outline-none"
                        placeholder="e.g. Professional Smart Contract Auditing"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400">Category *</label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none cursor-pointer focus:border-emerald-500"
                        >
                          <option value="Consulting">Consulting & Advisory</option>
                          <option value="Development">Software Development</option>
                          <option value="Marketing">Digital Marketing</option>
                          <option value="Legal">Legal & Accounting</option>
                          <option value="Design">UI/UX Design</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400">Location Type *</label>
                        <select
                          value={formData.locationType}
                          onChange={(e) => setFormData(prev => ({ ...prev, locationType: e.target.value as any }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none cursor-pointer focus:border-emerald-500"
                        >
                          <option value="online">Fully Online / Digital</option>
                          <option value="on_premise">On-Premise (My Office)</option>
                          <option value="customer_site">Customer Site (In-Person)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400">Service Area / Scope</label>
                      <input 
                        type="text" 
                        value={formData.serviceArea}
                        onChange={(e) => setFormData(prev => ({ ...prev, serviceArea: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:border-emerald-500 outline-none"
                        placeholder="e.g. Global, New York Region"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400">Service Outline / Scope of Work *</label>
                      <textarea 
                        required
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:border-emerald-500 outline-none min-h-[100px]"
                        placeholder="Detail exact deliverables, hours included, etc..."
                      />
                    </div>
                  </div>

                  {/* Pricing and Availability */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest border-b border-slate-800/60 pb-1.5">Pricing & Hours</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400">Base Price (Pi) *</label>
                        <input 
                          type="number" 
                          required
                          min={0.001}
                          step={0.001}
                          value={formData.basePrice}
                          onChange={(e) => setFormData(prev => ({ ...prev, basePrice: parseFloat(e.target.value) || 0 }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:border-emerald-500 outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400">Estimated Duration (mins)</label>
                        <input 
                          type="number" 
                          min={5}
                          value={formData.duration}
                          onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:border-emerald-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400">Weekly Available Days</label>
                        <input 
                          type="text" 
                          value={formData.availableDays}
                          onChange={(e) => setFormData(prev => ({ ...prev, availableDays: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:border-emerald-500 outline-none"
                          placeholder="Monday - Friday"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400">Standard Daily Hours</label>
                        <input 
                          type="text" 
                          value={formData.availableTime}
                          onChange={(e) => setFormData(prev => ({ ...prev, availableTime: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:border-emerald-500 outline-none"
                          placeholder="09:00 AM - 05:00 PM"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400">Service Banner / Image URL</label>
                      <input 
                        type="url" 
                        value={formData.imageUrl}
                        onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:border-emerald-500 outline-none"
                        placeholder="https://images.unsplash.com/photo-..."
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-2.5">
                      <input 
                        type="checkbox"
                        id="booking-req-check"
                        checked={formData.bookingRequired}
                        onChange={(e) => setFormData(prev => ({ ...prev, bookingRequired: e.target.checked }))}
                        className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500"
                      />
                      <label htmlFor="booking-req-check" className="text-xs font-bold text-slate-300 cursor-pointer selection:bg-transparent">
                        Requires Upfront Booking Request
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-5">
                  <button 
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-5 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={savingForm}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/10"
                  >
                    {savingForm && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save Service Listing
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
