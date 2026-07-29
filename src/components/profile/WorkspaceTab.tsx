import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/useAuth';
import { businessService } from '../../services/businessService';
import { storeService } from '../../services/storeService';
import { productService } from '../../services/productService';
import { Business, Store, Product } from '../../types';
import { Building2, Store as StoreIcon, Package, Edit, Trash2, ChevronRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getProductImageUrl } from '../../utils/imageUtils';

export const WorkspaceTab: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWorkspaceData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [bizData, storeData, productData] = await Promise.all([
        businessService.getMyBusinesses(user.uid),
        storeService.getOwnedStores(user.uid),
        productService.getStoreProducts(user.uid) // this queries by ownerUid too!
      ]);
      setBusinesses(bizData);
      setStores(storeData);
      
      // Convert map to array if necessary, getStoreProducts returns a Map
      let prodArray: any[] = [];
      if (productData instanceof Map) {
        prodArray = Array.from(productData.values());
      } else if (Array.isArray(productData)) {
        prodArray = productData;
      }
      setProducts(prodArray);
    } catch (error) {
      console.error('Error loading workspace data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaceData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        <span className="text-xs font-bold uppercase tracking-widest">Loading Workspace...</span>
      </div>
    );
  }

  const publishedProducts = products.filter(p => p.status === 'published' || p.status === 'Active' || p.status === 'active').length;
  const draftProducts = products.length - publishedProducts;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
          <Building2 className="w-5 h-5 text-violet-400 mb-2" />
          <span className="text-2xl font-black text-white">{businesses.length}</span>
          <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mt-1">Businesses</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
          <StoreIcon className="w-5 h-5 text-indigo-400 mb-2" />
          <span className="text-2xl font-black text-white">{stores.length}</span>
          <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mt-1">Stores</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
          <Package className="w-5 h-5 text-blue-400 mb-2" />
          <span className="text-2xl font-black text-white">{products.length}</span>
          <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mt-1">Total Products</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-2" />
          <span className="text-2xl font-black text-white">{publishedProducts}</span>
          <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mt-1">Published</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
          <AlertCircle className="w-5 h-5 text-amber-400 mb-2" />
          <span className="text-2xl font-black text-white">{draftProducts}</span>
          <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mt-1">Drafts</span>
        </div>
      </div>

      {/* STORES */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-white uppercase tracking-widest border-b border-slate-800 pb-2">My Stores</h3>
        {stores.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed">
            No stores found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stores.map(store => {
              const anyStore = store as any;
              const storeProducts = products.filter(p => p.storeId === store.storeId || p.storeId === anyStore.id);
              return (
                <div key={store.storeId || anyStore.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
                  {store.coverImageUrl ? (
                    <img src={store.coverImageUrl} alt="Cover" className="w-full h-24 object-cover" />
                  ) : (
                    <div className="w-full h-24 bg-slate-800/50 flex items-center justify-center text-slate-600 text-xs">No Cover</div>
                  )}
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-start gap-3 mb-3">
                      {store.logoUrl ? (
                        <img src={store.logoUrl} alt="Logo" className="w-12 h-12 rounded-xl object-cover border-2 border-slate-900 -mt-8 bg-slate-900" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center -mt-8 border-2 border-slate-900">
                          <StoreIcon className="w-6 h-6 text-slate-500" />
                        </div>
                      )}
                      <div>
                        <h4 className="text-base font-bold text-white">{store.storeName}</h4>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest">{store.storeCategory || 'Uncategorized'}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-400 mb-4">
                      <span>Status: <span className="text-emerald-400 capitalize">{store.status || 'Active'}</span></span>
                      <span>Products: <span className="font-bold text-white">{storeProducts.length}</span></span>
                    </div>
                    <div className="mt-auto flex gap-2">
                      <button onClick={() => navigate(`/store/${store.storeId || anyStore.id}`)} className="flex-1 py-2 bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 font-bold rounded-xl text-xs transition-colors">
                        Open
                      </button>
                      <button onClick={() => navigate(`/store-dashboard`)} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors">
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PRODUCTS */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-white uppercase tracking-widest border-b border-slate-800 pb-2">My Products</h3>
        {products.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed">
            No products found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map(product => {
              const imgUrl = getProductImageUrl(product);
              return (
                <div key={product.productId || product.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center gap-3">
                  <img src={imgUrl} alt={product.productName || product.title} className="w-16 h-16 rounded-xl object-cover bg-slate-800" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{product.productName || product.title}</h4>
                    <div className="flex items-center gap-2 text-xs mt-1">
                      <span className="font-mono text-violet-400">{product.price} {product.currency || 'π'}</span>
                      <span className={`px-1.5 py-0.5 rounded-md text-[8px] uppercase tracking-wider font-bold ${
                        product.status === 'published' || product.status === 'Active' || product.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {product.status || 'Draft'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => navigate(`/catalog`)} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => {/* Delete logic */}} className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg text-rose-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
