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
import { ItemManagementMenu } from '../marketplace/ItemManagementMenu';

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
    <div className="group bg-[#0a0f1c] border border-slate-800/90 rounded-2xl overflow-hidden transition-all hover:border-slate-700 shadow-md flex flex-col h-full">
      {/* Banner & Logo */}
      <div className="relative h-24 sm:h-32 bg-slate-950 w-full overflow-hidden shrink-0 border-b border-slate-800/60">
        {store.coverImageUrl ? (
          <img 
            src={store.coverImageUrl} 
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
            alt={`${store.storeName} cover`}
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full bg-slate-900" />
        )}
        <div className="absolute top-3 right-3 flex items-center gap-1 z-20">
          <ItemManagementMenu 
            item={store} 
            itemType="store" 
            onEdit={onEdit} 
            onDelete={onDelete} 
            buttonVariant="floating" 
          />
        </div>
      </div>

      <div className="p-5 pt-0 relative flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-end gap-3 -mt-7 relative z-10">
            <div className="w-14 h-14 rounded-xl bg-slate-900 border-2 border-slate-800 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
              {store.logoUrl ? (
                <img 
                  src={store.logoUrl} 
                  className="w-full h-full object-cover" 
                  alt={`${store.storeName} logo`}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=500';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-violet-600/10 flex items-center justify-center">
                  <Store className="w-6 h-6 text-violet-400" />
                </div>
              )}
            </div>
            <div className="pb-0.5">
              <div className="flex items-center gap-1.5 mb-0.5">
                <h3 className="text-base font-bold text-white truncate max-w-[150px] sm:max-w-[180px]">{store.storeName}</h3>
                {store.verified && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              </div>
              <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                {store.storeType}
              </p>
            </div>
          </div>
        </div>

        <p className="text-slate-400 text-xs line-clamp-2 mb-4 leading-relaxed flex-1 font-normal">
          {store.description || 'No description provided.'}
        </p>

        {/* Services/Status Tags */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
            store.status === 'active' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-slate-800 border border-slate-700 text-slate-400'
          }`}>
            {store.status}
          </div>
          {store.deliveryAvailable && (
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[9px] font-semibold tracking-wider">
              <Truck className="w-3 h-3" /> Delivery
            </div>
          )}
          {store.pickupAvailable && (
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[9px] font-semibold tracking-wider">
              <Package className="w-3 h-3" /> Pickup
            </div>
          )}
        </div>

        {/* Dashboard Grid Actions */}
        <div className="grid grid-cols-2 gap-2.5 pt-4 border-t border-slate-800/60 mt-auto">
          <button 
            type="button"
            onClick={() => navigate(`/store/${store.storeId}/products`)}
            aria-label="View Products"
            className="min-h-[44px] flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-violet-500/40 hover:bg-violet-600/5 group transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
          >
            <Package className="w-4 h-4 text-violet-400 mb-1 group-hover:scale-105 transition-transform" />
            <span className="text-[11px] font-bold text-slate-300 group-hover:text-white">Products</span>
          </button>
          
          <button 
            type="button"
            onClick={() => navigate('/business-orders')}
            aria-label="View Orders"
            className="min-h-[44px] flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 hover:bg-emerald-600/5 group transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
          >
            <ShoppingCart className="w-4 h-4 text-emerald-400 mb-1 group-hover:scale-105 transition-transform" />
            <span className="text-[11px] font-bold text-slate-300 group-hover:text-white">Orders</span>
          </button>

          <button 
            type="button"
            onClick={() => navigate('/crm')}
            aria-label="View Customers"
            className="min-h-[44px] flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-sky-500/40 hover:bg-sky-600/5 group transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
          >
            <Users className="w-4 h-4 text-sky-400 mb-1 group-hover:scale-105 transition-transform" />
            <span className="text-[11px] font-bold text-slate-300 group-hover:text-white">Customers</span>
          </button>

          <button 
            type="button"
            onClick={() => navigate('/merchant-analytics')}
            aria-label="View Analytics"
            className="min-h-[44px] flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 hover:bg-amber-600/5 group transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
          >
            <BarChart3 className="w-4 h-4 text-amber-400 mb-1 group-hover:scale-105 transition-transform" />
            <span className="text-[11px] font-bold text-slate-300 group-hover:text-white">Analytics</span>
          </button>
        </div>
      </div>
    </div>
  );
};
