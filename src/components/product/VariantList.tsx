/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Edit2, 
  Trash2, 
  Package, 
  Tag, 
  Archive, 
  Eye, 
  EyeOff,
  Loader2,
  AlertCircle,
  Database
} from 'lucide-react';
import { ProductVariant, Product } from '../../types';
import { variantService } from '../../services/variantService';

interface VariantListProps {
  product: Product;
  onUpdate: () => void;
}

export const VariantList: React.FC<VariantListProps> = ({ product, onUpdate }) => {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVariants();
  }, [product.productId]);

  const fetchVariants = async () => {
    setLoading(true);
    try {
      const data = await variantService.getVariants(product.productId);
      setVariants(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch variants');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (variantId: string, status: any) => {
    try {
      await variantService.updateVariant(variantId, { status });
      fetchVariants();
      onUpdate();
    } catch (err) {
      console.error('Failed to update variant status', err);
    }
  };

  const handleDelete = async (variantId: string) => {
    if (!window.confirm('Archive this variant?')) return;
    try {
      await variantService.deleteVariant(variantId);
      fetchVariants();
      onUpdate();
    } catch (err) {
      console.error('Failed to delete variant', err);
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Accessing SKU Matrix...</p>
      </div>
    );
  }

  if (variants.length === 0) {
    return (
      <div className="py-12 text-center bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-3xl">
        <Database className="w-12 h-12 text-slate-700 mx-auto mb-4" />
        <h4 className="text-white font-bold mb-1">No Variants Found</h4>
        <p className="text-xs text-slate-500">This product currently exists as a single standard item.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold flex items-center gap-3">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {variants.map(variant => (
          <div key={variant.variantId} className="group bg-slate-950 border border-slate-800/50 hover:border-indigo-500/30 rounded-2xl p-4 transition-all">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                  <Package className="w-6 h-6 text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-white truncate">{variant.variantName}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                      variant.status === 'published' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {variant.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-indigo-500 uppercase font-bold">{variant.sku}</span>
                    <span className="w-1 h-1 bg-slate-800 rounded-full" />
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                      {variant.price} {variant.currency}
                    </span>
                    <span className="w-1 h-1 bg-slate-800 rounded-full" />
                    <span className={`text-[10px] font-bold uppercase ${variant.stock > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {variant.stock} In Stock
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleStatusChange(variant.variantId, variant.status === 'published' ? 'archived' : 'published')}
                  className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                  title={variant.status === 'published' ? 'Archive' : 'Publish'}
                >
                  {variant.status === 'published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button className="p-2 text-slate-500 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-all">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(variant.variantId)}
                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Attributes Chips */}
            <div className="mt-3 pt-3 border-t border-slate-900 flex flex-wrap gap-2">
              {Object.entries(variant.attributes).map(([key, val]) => (
                <div key={key} className="px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg flex items-center gap-2">
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{key}:</span>
                  <span className="text-[9px] font-bold text-slate-300">{val}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
