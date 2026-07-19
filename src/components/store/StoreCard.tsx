import React from 'react';
import { 
  Store, 
  MapPin, 
  Clock, 
  ExternalLink, 
  CheckCircle2, 
  Trash2, 
  Archive,
  Edit,
  Truck,
  Package,
  Star,
  Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Store as StoreType } from '../../types';

interface StoreCardProps {
  store: StoreType;
  onEdit: (s: StoreType) => void;
  onDelete: (id: string) => void;
  onArchive: (s: StoreType) => void;
}

export const StoreCard: React.FC<StoreCardProps> = ({ 
  store, 
  onEdit, 
  onDelete, 
  onArchive 
}) => {
  const navigate = useNavigate();

  return (
    <div className="group bg-slate-900 border border-slate-800 rounded-3xl p-6 transition-all hover:border-slate-700 hover:shadow-2xl hover:shadow-slate-950/50">
      
      {/* Header Info */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
            <Store className="w-7 h-7 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-white truncate max-w-[150px]">{store.storeName}</h3>
              {store.verified && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {store.storeType}
            </p>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(store)} className="p-2 text-slate-500 hover:text-white"><Edit className="w-4 h-4" /></button>
          <button onClick={() => onArchive(store)} className="p-2 text-slate-500 hover:text-amber-400"><Archive className="w-4 h-4" /></button>
          <button onClick={() => onDelete(store.storeId)} className="p-2 text-slate-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>

      <p className="text-slate-400 text-sm line-clamp-2 mb-6 leading-relaxed">
        {store.description}
      </p>

      {/* Services/Status Tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        {store.deliveryAvailable && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
            <Truck className="w-3 h-3" /> Delivery
          </div>
        )}
        {store.pickupAvailable && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
            <Package className="w-3 h-3" /> Pickup
          </div>
        )}
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          store.status === 'active' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-500'
        }`}>
          {store.status}
        </div>
      </div>

      {/* Stats Mini Grid */}
      <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-800/50 text-center">
        <div className="space-y-1 border-r border-slate-800/50">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
            <Star className="w-3 h-3 text-amber-400" /> Rating
          </p>
          <p className="text-sm font-bold text-white">{store.rating || '0.0'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
            <MapPin className="w-3 h-3 text-slate-500" /> City
          </p>
          <p className="text-sm font-bold text-white truncate px-2">{store.city}</p>
        </div>
      </div>

      <button 
        onClick={() => navigate(`/store/${store.storeId}/products`)}
        className="w-full mt-6 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 font-bold text-sm hover:bg-indigo-600 hover:text-white hover:border-indigo-500 transition-all flex items-center justify-center gap-2"
      >
        Manage Products
        <Package className="w-4 h-4 opacity-50" />
      </button>
    </div>
  );
};
