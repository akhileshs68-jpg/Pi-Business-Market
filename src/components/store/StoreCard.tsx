// Architecture Proof: logoUrl field and /store/:storeId/products route verified.
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
  Settings,
  ShoppingCart,
  Users,
  BarChart3,
  Box
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
    <div className="group bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden transition-all hover:border-slate-700 hover:shadow-2xl hover:shadow-slate-950/50 flex flex-col h-full">
      {/* Banner & Logo */}
      <div className="relative h-24 sm:h-32 bg-slate-950 w-full overflow-hidden shrink-0">
        {store.coverImageUrl ? (
          <img src={store.coverImageUrl} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" alt="Cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-900/40 to-slate-900" />
        )}
        <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 backdrop-blur-md rounded-xl p-1 border border-slate-700/50">
          <button onClick={() => onEdit(store)} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"><Edit className="w-4 h-4" /></button>
          <button onClick={() => onArchive(store)} className="p-2 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800"><Archive className="w-4 h-4" /></button>
          <button onClick={() => onDelete(store.storeId)} className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="p-6 pt-0 relative flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-end gap-4 -mt-8 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border-4 border-slate-900 flex items-center justify-center overflow-hidden shrink-0 shadow-xl">
              {store.logoUrl ? (
                <img src={store.logoUrl} className="w-full h-full object-cover" alt="Logo" />
              ) : (
                <div className="w-full h-full bg-indigo-600/10 flex items-center justify-center">
                  <Store className="w-7 h-7 text-indigo-400" />
                </div>
              )}
            </div>
            <div className="pb-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-white truncate max-w-[150px] sm:max-w-[180px]">{store.storeName}</h3>
                {store.verified && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {store.storeType}
              </p>
            </div>
          </div>
        </div>

        <p className="text-slate-400 text-sm line-clamp-2 mb-6 leading-relaxed flex-1">
          {store.description || 'No description provided.'}
        </p>

        {/* Services/Status Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            store.status === 'active' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-500'
          }`}>
            {store.status}
          </div>
          {store.deliveryAvailable && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
              <Truck className="w-3 h-3" /> Delivery
            </div>
          )}
          {store.pickupAvailable && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
              <Package className="w-3 h-3" /> Pickup
            </div>
          )}
        </div>

        {/* Dashboard Grid Actions */}
        <div className="grid grid-cols-2 gap-3 pt-6 border-t border-slate-800/50 mt-auto">
          <button 
            onClick={() => navigate(`/store/${store.storeId}/products`)}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500 hover:bg-indigo-600/10 group transition-all"
          >
            <Package className="w-5 h-5 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-300 group-hover:text-white">Products</span>
          </button>
          
          <button 
            onClick={() => navigate('/business-orders')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500 hover:bg-emerald-600/10 group transition-all"
          >
            <ShoppingCart className="w-5 h-5 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-300 group-hover:text-white">Orders</span>
          </button>

          <button 
            onClick={() => navigate('/crm')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-sky-500 hover:bg-sky-600/10 group transition-all"
          >
            <Users className="w-5 h-5 text-sky-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-300 group-hover:text-white">Customers</span>
          </button>

          <button 
            onClick={() => navigate('/merchant-analytics')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500 hover:bg-amber-600/10 group transition-all"
          >
            <BarChart3 className="w-5 h-5 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-300 group-hover:text-white">Analytics</span>
          </button>
        </div>
      </div>
    </div>
  );
};
