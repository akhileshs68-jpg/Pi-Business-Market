import React from 'react';
import { 
  Building2, 
  MapPin, 
  Star, 
  Users, 
  ExternalLink, 
  MoreVertical,
  CheckCircle2,
  Trash2,
  Power,
  Edit
} from 'lucide-react';
import { BusinessProfile } from '../../types';

interface BusinessCardProps {
  business: BusinessProfile;
  onEdit: (b: BusinessProfile) => void;
  onDelete: (id: string) => void;
  onToggle: (b: BusinessProfile) => void;
}

export const BusinessCard: React.FC<BusinessCardProps> = ({ 
  business, 
  onEdit, 
  onDelete, 
  onToggle 
}) => {
  return (
    <div className="group relative bg-slate-900 border border-slate-800 rounded-3xl p-6 transition-all hover:border-slate-700 hover:shadow-2xl hover:shadow-slate-950/50">
      
      {/* Status Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${business.status === 'active' ? 'bg-emerald-500' : 'bg-slate-500'}`} />
          <span className={`text-[10px] uppercase tracking-widest font-bold ${business.status === 'active' ? 'text-emerald-400' : 'text-slate-500'}`}>
            {business.status}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => onEdit(business)}
            className="p-2 text-slate-500 hover:text-white transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onToggle(business)}
            className="p-2 text-slate-500 hover:text-violet-400 transition-colors"
          >
            <Power className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onDelete(business.businessId)}
            className="p-2 text-slate-500 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Info */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden">
          {business.logo ? (
            <img src={business.logo} alt={business.businessName} className="w-full h-full object-cover" />
          ) : (
            <Building2 className="w-8 h-8 text-slate-700" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-white truncate">{business.businessName}</h3>
            {business.verified && <CheckCircle2 className="w-4 h-4 text-violet-400" />}
          </div>
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">
            {business.businessType} • {business.businessCategory}
          </p>
        </div>
      </div>

      <p className="text-slate-400 text-sm line-clamp-2 mb-6 leading-relaxed">
        {business.description}
      </p>

      {/* Footer Stats */}
      <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800/50">
        <div className="space-y-1 text-center border-r border-slate-800/50">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
            <Star className="w-3 h-3 text-amber-400" /> Rating
          </p>
          <p className="text-sm font-bold text-white">{business.rating || '0.0'}</p>
        </div>
        <div className="space-y-1 text-center border-r border-slate-800/50">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
            <Users className="w-3 h-3 text-violet-400" /> Fans
          </p>
          <p className="text-sm font-bold text-white">{business.followers || '0'}</p>
        </div>
        <div className="space-y-1 text-center">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
            <MapPin className="w-3 h-3 text-slate-500" /> City
          </p>
          <p className="text-sm font-bold text-white truncate px-1">{business.city}</p>
        </div>
      </div>

      {/* Action Overlay */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-10 pointer-events-none transition-opacity">
        <Building2 className="w-24 h-24 text-white" />
      </div>

      <button className="w-full mt-6 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-bold text-sm hover:bg-slate-800 hover:text-white transition-all flex items-center justify-center gap-2 group/btn">
        View Public Profile
        <ExternalLink className="w-4 h-4 opacity-50 group-hover/btn:opacity-100 transition-opacity" />
      </button>
    </div>
  );
};
