/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Building2, 
  MapPin, 
  ChevronRight, 
  ShieldCheck, 
  Users, 
  Store, 
  BarChart3, 
  MoreHorizontal,
  ExternalLink,
  Edit,
  Trash2
} from 'lucide-react';
import { Business } from '../../types';
import { motion } from 'motion/react';

interface BusinessCardProps {
  business: Business;
  onEdit: (business: Business) => void;
  onDelete: (id: string) => void;
  onToggle: (business: Business) => void;
  onClick: (business: Business) => void;
}

export const BusinessCard: React.FC<BusinessCardProps> = ({ business, onEdit, onDelete, onToggle, onClick }) => {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="group relative bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden hover:bg-slate-900 transition-all hover:border-indigo-500/50 cursor-pointer"
      onClick={() => onClick(business)}
    >
      {/* Visual Header */}
      <div className="h-24 bg-gradient-to-br from-indigo-900/20 to-slate-900 relative">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:16px_16px]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
        
        {/* Verification Badge */}
        {business.verificationStatus === 'Verified' && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Verified</span>
          </div>
        )}
      </div>

      <div className="px-6 pb-6 -mt-8 relative z-10">
        {/* Avatar/Logo */}
        <div className="w-16 h-16 bg-slate-950 border-4 border-slate-950 rounded-2xl overflow-hidden mb-4 shadow-xl flex items-center justify-center group-hover:scale-105 transition-transform">
          {business.logoUrl ? (
            <img src={business.logoUrl} alt={business.businessName} className="w-full h-full object-cover" />
          ) : (
            <Building2 className="w-8 h-8 text-indigo-400" />
          )}
        </div>

        {/* Content */}
        <div>
          <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
            {business.businessName}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-widest">{business.businessType}</span>
            <span className="w-1 h-1 rounded-full bg-slate-700" />
            <span className="text-[10px] font-bold uppercase tracking-widest">{business.category}</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-6 pt-6 border-t border-slate-800/50 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1 text-slate-400">
              <Users className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">{business.employeeCount}</span>
            </div>
            <p className="text-[9px] text-slate-600 font-bold uppercase">Staff</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1 text-slate-400">
              <Store className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">{business.storeCount}</span>
            </div>
            <p className="text-[9px] text-slate-600 font-bold uppercase">Stores</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1 text-slate-400">
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">{business.rating}</span>
            </div>
            <p className="text-[9px] text-slate-600 font-bold uppercase">Rating</p>
          </div>
        </div>

        {/* Quick Location */}
        <div className="mt-6 flex items-center gap-2 text-slate-500">
          <MapPin className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">{business.city}, {business.country}</span>
        </div>

        {/* Action Button */}
        <div className="mt-6 flex items-center gap-2">
           <button 
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/10"
          >
            Manage Identity
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onEdit(business);
            }}
            className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
