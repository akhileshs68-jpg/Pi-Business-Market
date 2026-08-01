/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Building2, Store, Briefcase, Package, ClipboardList, Users, BarChart3, Wallet, Settings, ShieldCheck, ArrowRight, MessageSquare, Tag, Zap
} from 'lucide-react';
import { Business } from '../../types';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

interface BusinessHubProps {
  business: Business;
  onBack: () => void;
}

export const BusinessHub: React.FC<BusinessHubProps> = ({ business, onBack }) => {
  const navigate = useNavigate();

  const modules = [
    { label: 'Business Profile', path: '/business-profile', icon: Building2 },
    { label: 'Store Manager', path: '/store-dashboard', icon: Store },
    { label: 'Product Catalog', path: '/catalog-management', icon: Package },
    { label: 'Service Hub', path: '/service-management', icon: Briefcase },
    { label: 'Order Center', path: '/business-orders', icon: ClipboardList },
    { label: 'Customer CRM', path: '/customer-crm', icon: Users },
    { label: 'Analytics', path: '/merchant-analytics', icon: BarChart3 },
    { label: 'Business Wallet', path: '/merchant-payments', icon: Wallet },
    { label: 'Inbox', path: '/inbox', icon: MessageSquare },
    { label: 'Store Settings', path: '/store-dashboard', icon: Settings },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-slate-500 hover:text-white flex items-center gap-2">
          <ArrowRight className="w-5 h-5 rotate-180" /> Back to Registry
        </button>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/business-profile')} className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm font-bold text-white">Edit Profile</button>
          <button className="px-4 py-2 bg-indigo-600 rounded-xl text-sm font-bold text-white">Publish Business</button>
        </div>
      </div>

      {/* Professional Dashboard Header */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8">
        <div className="w-24 h-24 bg-slate-950 rounded-2xl flex items-center justify-center shrink-0">
          {business.logoUrl ? <img src={business.logoUrl} className="w-full h-full object-cover rounded-2xl" /> : <Building2 className="w-12 h-12 text-indigo-500" />}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-extrabold text-white">{business.businessName}</h1>
          <p className="text-slate-400 font-bold">{business.businessType} • {business.category}</p>
          <div className="flex items-center gap-3 mt-4">
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> Verified</span>
            <span className="text-slate-500 text-sm">Rating: 4.8/5</span>
            <span className="text-slate-500 text-sm">1.2k Followers</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center border-t md:border-t-0 md:border-l border-slate-800 pt-6 md:pt-0 md:pl-8">
          <div><p className="text-slate-500 text-xs uppercase font-bold">Revenue</p><p className="text-xl font-black text-white">$45k</p></div>
          <div><p className="text-slate-500 text-xs uppercase font-bold">Orders</p><p className="text-xl font-black text-white">128</p></div>
          <div><p className="text-slate-500 text-xs uppercase font-bold">Wallet</p><p className="text-xl font-black text-white">$12.4k</p></div>
          <div><p className="text-slate-500 text-xs uppercase font-bold">Messages</p><p className="text-xl font-black text-indigo-400">5</p></div>
        </div>
      </div>

      {/* Modules Grid */}
      <h2 className="text-lg font-bold text-white">Management Modules</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {modules.map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className="p-6 bg-slate-900/40 border border-slate-800 hover:border-indigo-500/50 rounded-3xl flex flex-col items-center gap-4 transition-all hover:bg-slate-900"
          >
            <item.icon className="w-8 h-8 text-indigo-400" />
            <span className="text-xs font-bold text-slate-300 text-center">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
