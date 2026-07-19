/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Eye, 
  TrendingUp,
  Tag,
  Database,
  BarChart3,
  Copy,
  AlertTriangle,
  Layers
} from 'lucide-react';
import { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onDuplicate: (product: Product) => void;
  onView: (product: Product) => void;
  onManageVariants: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onEdit,
  onDelete,
  onDuplicate,
  onView,
  onManageVariants
}) => {
  const [showMenu, setShowMenu] = React.useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'draft': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      case 'pending': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'archived': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const isLowStock = product.stock <= 5 && product.stock > 0;
  const isOutOfStock = product.stock === 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden group hover:border-slate-700 transition-all hover:shadow-xl hover:shadow-slate-950/40">
      <div className="h-1 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 group-hover:from-violet-600 group-hover:to-indigo-600 transition-all" />
      
      <div className="p-5 space-y-4">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${getStatusColor(product.status)}`}>
                {product.status}
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
                {product.type}
              </span>
            </div>
            <h3 className="font-bold text-white truncate text-base group-hover:text-violet-400 transition-colors">
              {product.productName}
            </h3>
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 mt-0.5">
              <Database className="w-3 h-3" />
              SKU: {product.sku}
            </div>
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-20 overflow-hidden py-1">
                  <button onClick={() => { onView(product); setShowMenu(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                    <Eye className="w-4 h-4" /> View Details
                  </button>
                  <button onClick={() => { onEdit(product); setShowMenu(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                    <Edit2 className="w-4 h-4" /> Edit
                  </button>
                  <button onClick={() => { onDuplicate(product); setShowMenu(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                    <Copy className="w-4 h-4" /> Duplicate
                  </button>
                  <div className="border-t border-slate-700 my-1" />
                  <button onClick={() => { onDelete(product.productId); setShowMenu(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/50">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Pricing</p>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-white">{product.price}</span>
              <span className="text-xs font-bold text-slate-500">π</span>
            </div>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/50">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Category</p>
            <div className="flex items-center gap-1.5 text-slate-300">
              <Tag className="w-3 h-3 text-violet-400" />
              <span className="text-xs font-bold truncate">{product.category}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50 space-y-2">
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
            <span className="flex items-center gap-1">
              <Database className="w-3 h-3" />
              Stock Level
            </span>
            <span className={isOutOfStock ? 'text-red-400' : isLowStock ? 'text-amber-400' : 'text-emerald-400'}>
              {isOutOfStock ? 'OUT OF STOCK' : `${product.stock} Units`}
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                isOutOfStock ? 'w-0' :
                isLowStock ? 'w-1/4 bg-amber-500' : 'w-full bg-emerald-500'
              }`}
            />
          </div>
          {isLowStock && (
            <div className="flex items-center gap-1 text-[9px] text-amber-500 font-bold">
              <AlertTriangle className="w-3 h-3" />
              LOW STOCK ALERT
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Views</span>
              <span className="text-xs font-bold text-white flex items-center gap-1">
                <BarChart3 className="w-3 h-3 text-violet-400" /> 0
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sales</span>
              <span className="text-xs font-bold text-white flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" /> 0
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onManageVariants(product)}
              className="p-2 rounded-lg bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white transition-all border border-indigo-500/20"
              title="Manage Variants"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button 
              onClick={() => onEdit(product)}
              className="px-4 py-1.5 rounded-lg bg-violet-600/10 hover:bg-violet-600 text-violet-400 hover:text-white text-xs font-bold transition-all border border-violet-500/20"
            >
              Manage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
