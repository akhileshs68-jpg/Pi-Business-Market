/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { WORKSPACE_CONFIG } from '../config/workspaceConfig';
import { ShoppingBag, ClipboardList, Clock, CreditCard, Calendar, Users, FileText, CheckCircle2, BookOpen, Star, Briefcase, Megaphone, Sparkles } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';

const ICON_MAP: Record<string, React.FC<any>> = {
  ShoppingBag, ClipboardList, Clock, CreditCard, Calendar, Users, FileText, CheckCircle2, BookOpen, Star, Briefcase, Megaphone, Sparkles
};

export const Sidebar: React.FC<{ activeRole: string }> = ({ activeRole }) => {
  const navigate = useNavigate();
  const { currentBusiness } = useBusiness();
  const config = WORKSPACE_CONFIG[activeRole] || WORKSPACE_CONFIG['buyer'];
  
  if (activeRole === 'buyer') {
    return null; 
  }

  return (
    <div className="w-64 border-r border-slate-800 bg-slate-900/20 hidden lg:block pt-8 px-4">
      {currentBusiness && (
        <div className="mb-6 px-3 py-2.5 rounded-2xl bg-violet-600/10 border border-violet-500/20">
          <div className="text-[9px] font-black text-violet-400 uppercase tracking-widest leading-none">Active Business</div>
          <div className="text-sm font-bold text-white mt-1.5 truncate">{currentBusiness.businessName}</div>
          <div className="text-[10px] text-slate-400 font-semibold mt-1 capitalize">
            {currentBusiness.category.replace(/_/g, ' ')}
          </div>
        </div>
      )}
      
      <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 pl-3">
        {config.title} Modules
      </div>
      
      <div className="space-y-2">
        {config.modules.map(mod => {
          const Icon = ICON_MAP[mod.iconName] || Briefcase;
          return (
            <button
              key={mod.id}
              type="button"
              onClick={() => navigate(mod.path)}
              className="w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
            >
              <Icon className="w-4 h-4 text-slate-400 group-hover:text-violet-400 shrink-0" />
              <span className="truncate">{mod.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
