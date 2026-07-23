/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  ArrowLeft, 
  Download, 
  Upload, 
  MoreHorizontal,
  LayoutGrid,
  List,
  Loader2,
  AlertCircle,
  Store as StoreIcon,
  Briefcase,
  X,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from '../components/Navbar';
import { ProductCard } from '../components/product/ProductCard';
import { ProductWizard } from '../components/product/ProductWizard';
import { VariantWizard } from '../components/product/VariantWizard';
import { VariantList } from '../components/product/VariantList';
import { productService } from '../services/productService';
import { storeService } from '../services/storeService';
import { useAuth } from '../auth/useAuth';
import { Product, Store } from '../types';
import { CardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';

export const ProductManagement: React.FC = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  
  // Variant Management State
  const [isVariantWizardOpen, setIsVariantWizardOpen] = useState(false);
  const [isVariantListOpen, setIsVariantListOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (storeId) {
      loadData();
    }
  }, [storeId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [storeData, productsData] = await Promise.all([
        storeService.getStore(storeId!),
        productService.getStoreProducts(storeId!)
      ]);
      
      if (!storeData) throw new Error('Store not found');
      
      // Verify ownership
      if (storeData.ownerUid !== user?.uid) {
        throw new Error('You do not have permission to manage this store');
      }
      
      setStore(storeData);
      setProducts(productsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product? This action is irreversible.')) return;
    
    try {
      await productService.softDeleteProduct(productId);
      setProducts(prev => prev.filter(p => p.productId !== productId));
    } catch (err: any) {
      setError('Failed to delete product: ' + err.message);
    }
  };

  const handleDuplicate = async (product: Product) => {
    try {
      const { productId, createdAt, updatedAt, ...rest } = product;
      const newSku = `${rest.sku}-COPY-${Math.floor(Math.random() * 1000)}`;
      const newSlug = `${rest.productSlug}-copy-${Math.floor(Math.random() * 1000)}`;
      
      await productService.createProduct({
        ...rest,
        productName: `${rest.productName} (Copy)`,
        productSlug: newSlug,
        sku: newSku,
        status: 'draft'
      });
      
      await loadData();
    } catch (err: any) {
      setError('Failed to duplicate product: ' + err.message);
    }
  };

  const filteredProducts = products.filter(p => 
    p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navbar 
          currentUser={user!}
          currentView="store-dashboard"
          onNavigate={(view) => navigate(`/${view}`)}
          cartCount={0}
          walletBalance={100}
          onWalletUpdate={() => {}}
          onToggleCart={() => {}}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full space-y-12">
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <div className="w-16 h-16 bg-slate-800 rounded-2xl animate-pulse" />
              <div className="space-y-2">
                <div className="h-8 w-64 bg-slate-800 rounded-lg animate-pulse" />
                <div className="h-4 w-48 bg-slate-800 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
          <CardSkeleton count={4} />
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navbar 
          currentUser={user!}
          currentView="store-dashboard"
          onNavigate={(view) => navigate(`/${view}`)}
          cartCount={0}
          walletBalance={100}
          onWalletUpdate={() => {}}
          onToggleCart={() => {}}
        />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-slate-400 mb-8 text-center max-w-md">{error}</p>
          <button 
            onClick={() => navigate('/store-dashboard')}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold hover:bg-slate-800 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Navbar 
        currentUser={user!}
        currentView="store-dashboard"
        onNavigate={(view) => navigate(`/${view}`)}
        cartCount={0}
        walletBalance={100}
        onWalletUpdate={() => {}}
        onToggleCart={() => {}}
      />

      {/* Hero Header */}
      <div className="relative overflow-hidden bg-slate-900 border-b border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-indigo-600/10 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-600/20 shrink-0">
                <Package className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <button 
                    onClick={() => navigate('/store-dashboard')}
                    className="text-[10px] sm:text-xs font-bold text-slate-500 hover:text-violet-400 flex items-center gap-1 transition-colors"
                  >
                    <StoreIcon className="w-3 h-3" />
                    <span className="truncate max-w-[100px] sm:max-w-none">{store.storeName}</span>
                  </button>
                  <span className="text-slate-700">/</span>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-400">Products</span>
                </div>
                <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">Product Management</h1>
                <p className="text-slate-400 text-[10px] sm:text-sm font-medium mt-0.5 sm:mt-1">Manage inventory, pricing, and catalog details.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button 
                onClick={() => { setEditingProduct(undefined); setIsWizardOpen(true); }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-xl bg-violet-600 text-white font-bold shadow-lg shadow-violet-600/20 hover:bg-violet-500 transition-all text-xs sm:text-base"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Add Product</span>
              </button>
              <button className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all">
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 w-full">
        {/* Controls Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div className="relative flex-1 lg:max-w-md">
            <input 
              type="text"
              placeholder="Search by name, SKU, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500 transition-all"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 flex items-center">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
            
            <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all font-bold text-xs uppercase tracking-widest">
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>

        {/* Product List */}
        {filteredProducts.length === 0 ? (
          <EmptyState 
            icon={Package}
            title={searchQuery ? 'No matching products' : 'Inventory Catalog Empty'}
            description={searchQuery ? 'We couldn\'t find any products matching your current filters. Try adjusting your search query.' : 'Start building your digital inventory by adding your first product to this store.'}
            actionLabel={!searchQuery ? 'Add First Product' : undefined}
            onAction={!searchQuery ? () => setIsWizardOpen(true) : undefined}
          />
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
            {filteredProducts.map(product => (
              <ProductCard 
                key={product.productId}
                product={product}
                onEdit={(p) => { setEditingProduct(p); setIsWizardOpen(true); }}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onView={(p) => navigate(`/product/${p.productId}`)}
                onManageVariants={(p) => {
                  setSelectedProduct(p);
                  setIsVariantListOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Variant List Modal */}
      <AnimatePresence>
        {isVariantListOpen && selectedProduct && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-600/20 rounded-xl">
                    <Layers className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white leading-none mb-1">Product Variants</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{selectedProduct.productName}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsVariantListOpen(false)}
                  className="p-2 text-slate-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
                <VariantList 
                  product={selectedProduct} 
                  onUpdate={loadData} 
                />
              </div>

              <div className="p-6 bg-slate-900/50 border-t border-slate-800">
                <button 
                  onClick={() => {
                    setIsVariantListOpen(false);
                    setIsVariantWizardOpen(true);
                  }}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3"
                >
                  <Plus className="w-5 h-5" />
                  Generate New Variants
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Variant Wizard */}
      {isVariantWizardOpen && selectedProduct && (
        <VariantWizard 
          isOpen={isVariantWizardOpen}
          onClose={() => setIsVariantWizardOpen(false)}
          onSuccess={() => {
            setIsVariantWizardOpen(false);
            loadData();
          }}
          product={selectedProduct}
        />
      )}

      {/* Product Wizard Modal */}
      <AnimatePresence>
        {isWizardOpen && (
          <ProductWizard 
            storeId={storeId!}
            businessId={store.businessId}
            ownerUid={user!.uid}
            initialProduct={editingProduct}
            onClose={() => setIsWizardOpen(false)}
            onComplete={(id) => {
              setIsWizardOpen(false);
              loadData();
            }}
          />
        )}
      </AnimatePresence>

      {/* Bulk Action Bar (Overlay if items selected) */}
    </div>
  );
};
