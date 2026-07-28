/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Store, 
  Wrench, 
  Factory, 
  Tractor, 
  User as UserIcon, 
  Palette, 
  Building2, 
  MoreHorizontal,
  ChevronRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Sparkles,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Business } from '../../types';
import { businessService } from '../../services/businessService';
import { BusinessWizard } from '../business/BusinessWizard';
import { ServiceWizard } from '../service/ServiceWizard';

interface RoleOnboardingLauncherProps {
  role: string;
  user: any;
  onClose: () => void;
  onComplete: () => void;
}

export const RoleOnboardingLauncher: React.FC<RoleOnboardingLauncherProps> = ({
  role,
  user,
  onClose,
  onComplete
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  
  // For Service Provider flow
  const [serviceFlowState, setServiceFlowState] = useState<'check' | 'needs_business' | 'create_business' | 'create_service'>('check');
  const [tempBusinessId, setTempBusinessId] = useState<string | null>(null);

  // Load user's businesses if the role is Service Provider
  useEffect(() => {
    if (role === 'Service Provider') {
      const checkBusinesses = async () => {
        setLoading(true);
        setError(null);
        try {
          const myBiz = await businessService.getMyBusinesses(user.uid);
          setBusinesses(myBiz);
          if (myBiz.length > 0) {
            setTempBusinessId(myBiz[0].id);
            setServiceFlowState('create_service');
          } else {
            setServiceFlowState('needs_business');
          }
        } catch (err: any) {
          console.error('[RoleOnboardingLauncher] Error checking businesses:', err);
          setError('Failed to query your business profile status. Please try again.');
        } finally {
          setLoading(false);
        }
      };
      checkBusinesses();
    }
  }, [role, user.uid]);

  // Specific configuration for un-implemented onboarding wizards
  const roleMeta: Record<string, { label: string; icon: any; desc: string; gradient: string }> = {
    'Buyer': {
      label: 'Buyer Profile Wizard',
      icon: ShoppingBag,
      desc: 'Set up your buyer preferences, delivery addresses, and purchasing profile to start shopping.',
      gradient: 'from-blue-600 to-indigo-600'
    },
    'Manufacturer': {
      label: 'Manufacturer Wizard',
      icon: Factory,
      desc: 'Set up your manufacturing capacities, machinery details, certifications, and product catalogs.',
      gradient: 'from-amber-600 to-orange-600'
    },
    'Farmer': {
      label: 'Farmer Wizard',
      icon: Tractor,
      desc: 'List your farmlands, crop cycles, organic certifications, and seasonal fresh produce.',
      gradient: 'from-green-600 to-emerald-600'
    },
    'Freelancer': {
      label: 'Freelancer Wizard',
      icon: UserIcon,
      desc: 'Create your individual resume, hourly rate, list of soft skills, and portfolio highlights.',
      gradient: 'from-cyan-600 to-blue-600'
    },
    'Artist': {
      label: 'Artist Wizard',
      icon: Palette,
      desc: 'Build your creative gallery, sell original works, art licenses, or accept custom commissions.',
      gradient: 'from-pink-600 to-rose-600'
    },
    'Company': {
      label: 'Company Wizard',
      icon: Building2,
      desc: 'Configure your company legal registration, tax documents, employee structure, and corporate services.',
      gradient: 'from-slate-600 to-slate-800'
    },
    'Other': {
      label: 'Generic Professional Wizard',
      icon: MoreHorizontal,
      desc: 'Configure custom business parameters suited to your specific operations.',
      gradient: 'from-gray-600 to-gray-700'
    }
  };

  const handleBusinessComplete = (bizId: string) => {
    if (role === 'Service Provider') {
      setTempBusinessId(bizId);
      setServiceFlowState('create_service');
    } else {
      onComplete();
    }
  };

  const handleServiceSuccess = () => {
    onComplete();
  };

  // Rendering loading state
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
          <Loader2 className="w-10 h-10 text-violet-500 animate-spin mx-auto mb-4" />
          <p className="text-white font-bold text-lg mb-1">Preparing Onboarding</p>
          <p className="text-slate-400 text-sm">Setting up your onboarding wizard...</p>
        </div>
      </div>
    );
  }

  // Rendering Seller onboarding flow (BusinessWizard)
  if (role === 'Seller') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 overflow-y-auto">
        <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-600/10 flex items-center justify-center text-violet-400 border border-violet-500/20">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">Seller Registration</h2>
                  <p className="text-xs text-slate-400">Step up your Pi Business</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="text-xs font-bold px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
              >
                Back to Profile
              </button>
            </div>
            <div className="p-6 sm:p-8 bg-slate-950/20">
              <BusinessWizard 
                onComplete={handleBusinessComplete} 
                onCancel={onClose} 
                initialData={{ businessType: 'Product Seller' }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Rendering Service Provider onboarding flow
  if (role === 'Service Provider') {
    if (error) {
      return (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-4" />
            <p className="text-white font-bold text-lg mb-1">Error Occurred</p>
            <p className="text-slate-400 text-sm mb-6">{error}</p>
            <button 
              onClick={onClose}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-sm transition-all"
            >
              Back to Profile
            </button>
          </div>
        </div>
      );
    }

    if (serviceFlowState === 'needs_business') {
      return (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-400 mb-6 mx-auto sm:mx-0">
              <Info className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black text-white mb-2 text-center sm:text-left">
              Business Profile Required
            </h3>
            <p className="text-slate-400 text-sm mb-6 text-center sm:text-left leading-relaxed">
              To list services in our marketplace, you must first initialize a corporate or individual Business Profile.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-sm transition-all order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={() => setServiceFlowState('create_business')}
                className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-violet-600/10 flex items-center justify-center gap-1.5 order-1 sm:order-2"
              >
                Create Profile
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (serviceFlowState === 'create_business') {
      return (
        <div className="fixed inset-0 z-50 bg-slate-950 overflow-y-auto">
          <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setServiceFlowState('needs_business')}
                    className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h2 className="text-lg font-black text-white">Service Provider Profile</h2>
                    <p className="text-xs text-slate-400">Step 1: Set up your business profile</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="text-xs font-bold px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
                >
                  Back to Profile
                </button>
              </div>
              <div className="p-6 sm:p-8 bg-slate-950/20">
                <BusinessWizard 
                  onComplete={handleBusinessComplete} 
                  onCancel={() => setServiceFlowState('needs_business')} 
                  initialData={{ businessType: 'Service Provider' }}
                />
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (serviceFlowState === 'create_service' && tempBusinessId) {
      return (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md overflow-y-auto flex items-center justify-center p-4">
          <div className="max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-600/10 flex items-center justify-center text-violet-400 border border-violet-500/20">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">Service Wizard</h2>
                  <p className="text-xs text-slate-400">Step 2: List your first service offering</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="text-xs font-bold px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
              >
                Back to Profile
              </button>
            </div>
            <div className="p-6 sm:p-8 bg-slate-950/10 max-h-[80vh] overflow-y-auto">
              <ServiceWizard 
                isOpen={true}
                onClose={onClose}
                onSuccess={handleServiceSuccess}
                businessId={tempBusinessId}
              />
            </div>
          </div>
        </div>
      );
    }
  }

  // Rendering un-implemented roles ("Coming Soon")
  const meta = roleMeta[role];
  if (!meta) return null;
  const MetaIcon = meta.icon;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-center overflow-hidden">
        {/* Subtle decorative background gradient */}
        <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${meta.gradient}`} />
        
        <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-300 mb-6 mx-auto shadow-inner relative z-10">
          <MetaIcon className="w-8 h-8" />
        </div>
        
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full text-xs font-bold text-violet-400 mb-4 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" /> Coming Soon
        </div>

        <h3 className="text-2xl font-black text-white mb-2">
          {meta.label}
        </h3>
        
        <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto leading-relaxed font-medium">
          {meta.desc}
        </p>

        <div className="bg-slate-950/50 border border-slate-800/80 p-4 rounded-2xl mb-8 flex items-center justify-center text-slate-400 font-bold text-xs gap-2">
          <span className="text-violet-400">Status:</span>
          <span>This onboarding is coming soon.</span>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onComplete}
            className="w-full py-4 bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-black rounded-2xl text-sm transition-all border border-violet-500/30"
          >
            Skip & Activate Role
          </button>
          
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white font-bold rounded-2xl text-sm transition-all border border-slate-700/30"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
