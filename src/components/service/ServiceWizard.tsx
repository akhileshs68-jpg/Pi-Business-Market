/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronLeft,
  Loader2,
  Briefcase,
  Layers,
  Settings2,
  Package,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Globe,
  Database,
  Tag,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Service, ServicePricingType, ServiceLocationType, ServicePackage } from '../../types';
import { serviceMarketplaceService } from '../../services/serviceMarketplaceService';

interface ServiceWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  businessId: string;
}

type Step = 1 | 2 | 3;

export const ServiceWizard: React.FC<ServiceWizardProps> = ({
  isOpen,
  onClose,
  onSuccess,
  businessId
}) => {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [service, setService] = useState<Partial<Service>>({
    businessId,
    title: '',
    description: '',
    category: 'digital_services',
    subCategory: '',
    pricingType: 'fixed',
    basePrice: 0,
    currency: 'Pi',
    duration: 60,
    locationType: 'online',
    status: 'draft',
    visibility: 'public',
    imageUrls: []
  });

  const [packages, setPackages] = useState<Partial<ServicePackage>[]>([]);

  const nextStep = () => setStep(s => Math.min(s + 1, 3) as Step);
  const prevStep = () => setStep(s => Math.max(s - 1, 1) as Step);

  const addPackage = () => {
    setPackages([...packages, { 
      name: '', 
      description: '', 
      price: 0, 
      features: [], 
      status: 'active' 
    }]);
  };

  const removePackage = (index: number) => {
    setPackages(packages.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Create the Service
      const serviceId = await serviceMarketplaceService.createService(service as any);
      
      // 2. Create Packages
      if (packages.length > 0) {
        await Promise.all(packages.map(pkg => 
          serviceMarketplaceService.createPackage({ ...pkg, serviceId } as any)
        ));
      }
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to publish service');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-violet-600 rounded-2xl shadow-lg shadow-violet-600/20">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white leading-none mb-1">Service Publisher</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                <Database className="w-3 h-3 text-violet-400" />
                Enterprise Marketplace Engine
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-slate-800 w-full">
          <motion.div 
            className="h-full bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]" 
            animate={{ width: `${(step / 3) * 100}%` }} 
          />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold flex items-center gap-3">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">General Information</h3>
                  <p className="text-sm text-slate-500">Provide high-level details about your service offering.</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Service Title</label>
                    <input 
                      value={service.title}
                      onChange={(e) => setService({ ...service, title: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-violet-500 outline-none transition-all font-bold"
                      placeholder="e.g., Enterprise UI/UX Design Consultation"
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Full Description</label>
                    <textarea 
                      value={service.description}
                      onChange={(e) => setService({ ...service, description: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-violet-500 outline-none transition-all font-bold h-32 resize-none"
                      placeholder="Describe the scope, value, and expertise involved..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pricing Model</label>
                    <select 
                      value={service.pricingType}
                      onChange={(e) => setService({ ...service, pricingType: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-violet-500 outline-none transition-all font-bold"
                    >
                      <option value="fixed">Fixed Price</option>
                      <option value="hourly">Hourly Rate</option>
                      <option value="daily">Daily Rate</option>
                      <option value="weekly">Weekly Rate</option>
                      <option value="monthly">Monthly Rate</option>
                      <option value="quote">Custom Quote</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Base Rate ({service.currency})</label>
                    <input 
                      type="number"
                      value={service.basePrice}
                      onChange={(e) => setService({ ...service, basePrice: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-violet-500 outline-none transition-all font-bold"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="pt-8">
                  <button 
                    disabled={!service.title || !service.description}
                    onClick={nextStep}
                    className="w-full py-4 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-violet-600/20 flex items-center justify-center gap-2"
                  >
                    Next: Logistics & Scope <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Service Scope</h3>
                  <p className="text-sm text-slate-500">Define where and how the service is delivered.</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Location Type</label>
                    <select 
                      value={service.locationType}
                      onChange={(e) => setService({ ...service, locationType: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-violet-500 outline-none transition-all font-bold"
                    >
                      <option value="online">Online / Remote</option>
                      <option value="on-site">On-Site (At My Office)</option>
                      <option value="customer-location">Customer Location</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Est. Duration (Min)</label>
                    <input 
                      type="number"
                      value={service.duration}
                      onChange={(e) => setService({ ...service, duration: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-violet-500 outline-none transition-all font-bold"
                      placeholder="60"
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Service Area / Coverage</label>
                    <input 
                      value={service.serviceArea}
                      onChange={(e) => setService({ ...service, serviceArea: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-violet-500 outline-none transition-all font-bold"
                      placeholder="e.g., Global, New York Tri-State, Downtown LA"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-8">
                  <button onClick={prevStep} className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button 
                    onClick={nextStep}
                    className="flex-[2] py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-violet-600/20 flex items-center justify-center gap-2"
                  >
                    Next: Service Packages <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">Service Tiers & Packages</h3>
                    <p className="text-sm text-slate-500">Offer multiple levels of service to your clients.</p>
                  </div>
                  <button 
                    onClick={addPackage}
                    className="p-3 bg-violet-600/20 text-violet-400 hover:bg-violet-600 hover:text-white rounded-xl transition-all"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-2 no-scrollbar">
                  {packages.length === 0 ? (
                    <div className="p-12 text-center bg-slate-950/30 border-2 border-dashed border-slate-800 rounded-3xl">
                      <Layers className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                      <p className="text-slate-500 font-bold italic">No specialized packages. Standard base rate will apply.</p>
                    </div>
                  ) : (
                    packages.map((pkg, i) => (
                      <div key={i} className="p-6 bg-slate-950/50 border border-slate-800 rounded-3xl space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-black text-violet-400 text-xs uppercase tracking-widest">Package #{i + 1}</h4>
                          <button onClick={() => removePackage(i)} className="text-slate-500 hover:text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <input 
                            value={pkg.name}
                            onChange={(e) => {
                              const newPkgs = [...packages];
                              newPkgs[i].name = e.target.value;
                              setPackages(newPkgs);
                            }}
                            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-violet-500 outline-none"
                            placeholder="Package Name (e.g., Premium)"
                          />
                          <input 
                            type="number"
                            value={pkg.price}
                            onChange={(e) => {
                              const newPkgs = [...packages];
                              newPkgs[i].price = Number(e.target.value);
                              setPackages(newPkgs);
                            }}
                            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-violet-500 outline-none"
                            placeholder="Price"
                          />
                        </div>
                        <textarea 
                          value={pkg.description}
                          onChange={(e) => {
                            const newPkgs = [...packages];
                            newPkgs[i].description = e.target.value;
                            setPackages(newPkgs);
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-violet-500 outline-none h-20 resize-none"
                          placeholder="What's included in this tier?"
                        />
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-4 pt-8">
                  <button onClick={prevStep} className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-[2] py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-violet-600/20 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShieldCheck className="w-5 h-5" /> Publish Service Portfolio</>}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
