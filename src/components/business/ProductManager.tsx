/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, Archive, Pause, Play, Eye, 
  Search, Loader2, Tag, Layers, Sliders, CheckCircle2,
  AlertCircle, ChevronDown, Check, Globe, RefreshCw, X
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { useAuth } from '../../auth/useAuth';
import { productService } from '../../services/productService';
import { catalogService } from '../../services/catalogService';
import { Product, Category, ProductStatus } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

export const ProductManager: React.FC = () => {
  const { currentBusiness, stores, currentStore } = useBusiness();
  const { user } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<{
    productName: string;
    type: string;
    category: string;
    subCategory: string;
    description: string;
    shortDescription: string;
    price: number;
    comparePrice: number;
    stock: number;
    sku: string;
    barcode: string;
    brand: string;
    imageUrl: string;
    status: ProductStatus;
    seoTitle: string;
    seoDescription: string;
    featured: boolean;
  }>({
    productName: '',
    type: 'physical',
    category: '',
    subCategory: '',
    description: '',
    shortDescription: '',
    price: 0,
    comparePrice: 0,
    stock: 0,
    sku: '',
    barcode: '',
    brand: '',
    imageUrl: '',
    status: 'published',
    seoTitle: '',
    seoDescription: '',
    featured: false
  });

  const [savingForm, setSavingForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [currentBusiness]);

  const fetchProducts = async () => {
    if (!currentBusiness) return;
    setLoading(true);
    try {
      // Get all products. Since we want to load by businessId, we query Firestore.
      const fetched = await productService.getStoreProducts(currentBusiness.id);
      let prodArray: Product[] = [];
      if (fetched instanceof Map) {
        prodArray = Array.from(fetched.values());
      } else if (Array.isArray(fetched)) {
        prodArray = fetched;
      }
      setProducts(prodArray);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const cats = await catalogService.getCategories();
      setCategories(cats);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      productName: '',
      type: 'physical',
      category: categories[0]?.name || 'Electronics',
      subCategory: '',
      description: '',
      shortDescription: '',
      price: 0,
      comparePrice: 0,
      stock: 50,
      sku: 'SKU-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
      barcode: '',
      brand: '',
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
      status: 'published',
      seoTitle: '',
      seoDescription: '',
      featured: false
    });
    setErrorMsg(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      productName: product.productName || '',
      type: product.type || 'physical',
      category: product.category || '',
      subCategory: product.subCategory || '',
      description: product.description || '',
      shortDescription: product.shortDescription || '',
      price: product.price || 0,
      comparePrice: product.comparePrice || 0,
      stock: product.stock || 0,
      sku: product.sku || '',
      barcode: product.barcode || '',
      brand: product.brand || '',
      imageUrl: product.mainImage || (product.imageUrls && product.imageUrls[0]) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
      status: product.status || 'published',
      seoTitle: product.seoTitle || '',
      seoDescription: product.seoDescription || '',
      featured: product.featured || false
    });
    setErrorMsg(null);
    setIsFormOpen(true);
  };

  const handleToggleStatus = async (product: Product) => {
    setActionLoading(product.productId);
    try {
      const newStatus = product.status === 'published' ? 'draft' : 'published';
      await productService.updateProduct(product.productId, { status: newStatus });
      await fetchProducts();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleArchive = async (productId: string) => {
    if (!window.confirm('Archive this product? It will be hidden from the marketplace.')) return;
    setActionLoading(productId);
    try {
      await productService.archiveProduct(productId);
      await fetchProducts();
    } catch (err) {
      console.error('Failed to archive:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!window.confirm('Permanently delete this product? This action is irreversible.')) return;
    setActionLoading(productId);
    try {
      await productService.permanentDeleteProduct(productId);
      await fetchProducts();
    } catch (err) {
      console.error('Failed to delete:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness) return;
    
    // Choose active store for assignment
    const targetStore = stores.find(s => s.storeId === selectedStoreId) || stores[0];
    if (!targetStore) {
      setErrorMsg('You must have at least one store outlet active to assign products.');
      return;
    }

    setSavingForm(true);
    setErrorMsg(null);
    try {
      const slug = formData.productName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 5);
      
      const payload = {
        ...formData,
        productSlug: slug,
        ownerUid: user?.uid || currentBusiness.ownerUid,
        businessId: currentBusiness.id,
        storeId: targetStore.storeId,
        stockStatus: formData.stock > 0 ? 'in_stock' : 'out_of_stock',
        imageUrls: [formData.imageUrl]
      };

      if (editingProduct) {
        await productService.updateProduct(editingProduct.productId, payload);
      } else {
        await productService.createProduct(payload);
      }
      setIsFormOpen(false);
      await fetchProducts();
    } catch (err: any) {
      console.error('Save failed:', err);
      setErrorMsg(err.message || 'An error occurred while saving the product.');
    } finally {
      setSavingForm(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.productName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStore = selectedStoreId === 'all' || p.storeId === selectedStoreId;
    const matchesStatus = selectedStatus === 'all' || p.status === selectedStatus;
    return matchesSearch && matchesStore && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 p-5 rounded-3xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text"
              placeholder="Search products, SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none w-56 transition-all"
            />
          </div>

          <select
            value={selectedStoreId}
            onChange={(e) => setSelectedStoreId(e.target.value)}
            className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 outline-none cursor-pointer"
          >
            <option value="all">All Stores</option>
            {stores.map(s => (
              <option key={s.storeId} value={s.storeId}>{s.storeName}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="paused">Paused</option>
            <option value="Inactive">Inactive/Archived</option>
          </select>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Product
        </button>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(p => {
            const linkedStore = stores.find(s => s.storeId === p.storeId);
            return (
              <div 
                key={p.productId} 
                className="bg-slate-900/30 border border-slate-800 rounded-3xl p-5 space-y-4 hover:border-slate-700/80 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
                    <img 
                      src={p.mainImage || (p.imageUrls && p.imageUrls[0]) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'} 
                      alt={p.productName} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2.5 right-2.5 flex gap-1.5">
                      <span className={`px-2.5 py-1 text-[9px] font-bold rounded-full border ${
                        p.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        p.status === 'draft' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {p.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{p.category || 'Uncategorized'}</span>
                    <h4 className="text-sm font-extrabold text-white line-clamp-1 mt-0.5">{p.productName}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">{p.shortDescription || p.description}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80 space-y-3.5 mt-auto">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-500 text-[10px] font-medium block">Price</span>
                      <span className="text-sm font-black text-white">{p.price} π</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 text-[10px] font-medium block">Stock Inventory</span>
                      <span className={`font-bold ${p.stock > 10 ? 'text-emerald-400' : 'text-amber-400'}`}>{p.stock} units</span>
                    </div>
                  </div>

                  {linkedStore && (
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-950/40 p-2 rounded-xl border border-slate-800">
                      <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="truncate">Store: {linkedStore.storeName}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleToggleStatus(p)}
                      disabled={actionLoading === p.productId}
                      className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 flex-1"
                    >
                      {p.status === 'published' ? (
                        <>
                          <Pause className="w-3.5 h-3.5" /> Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" /> Resume
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="p-2 bg-slate-950 hover:bg-indigo-600/10 border border-slate-800 hover:border-indigo-500/20 text-indigo-400 rounded-xl transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleArchive(p.productId)}
                      className="p-2 bg-slate-950 hover:bg-amber-600/10 border border-slate-800 hover:border-amber-500/20 text-amber-400 rounded-xl transition-all"
                    >
                      <Archive className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(p.productId)}
                      className="p-2 bg-slate-950 hover:bg-rose-600/10 border border-slate-800 hover:border-rose-500/20 text-rose-400 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center bg-slate-900/20 rounded-3xl border border-dashed border-slate-800">
          <Tag className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <h4 className="text-base font-bold text-white">No Products Registered</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">Create physical or digital product listings under this business.</p>
          <button 
            onClick={handleOpenCreate}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl"
          >
            Launch First Product
          </button>
        </div>
      )}

      {/* Product Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-black text-white">
                    {editingProduct ? 'Edit Commercial Product' : 'Register Commercial Product'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Define price, inventory, brand assets, and search discovery options.
                  </p>
                </div>
                <button 
                  onClick={() => setIsFormOpen(false)}
                  className="p-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {errorMsg && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-start gap-3 text-xs text-rose-400">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{errorMsg}</p>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest border-b border-slate-800/60 pb-1.5">Basic Listing</h4>
                    
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400">Product Title *</label>
                      <input 
                        type="text" 
                        required
                        value={formData.productName}
                        onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:border-indigo-500 outline-none"
                        placeholder="e.g. Premium Leather Smart Wallet"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400">Type *</label>
                        <select
                          value={formData.type}
                          onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none cursor-pointer focus:border-indigo-500"
                        >
                          <option value="physical">Physical Product</option>
                          <option value="digital">Digital Download</option>
                          <option value="wholesale">Wholesale Supply</option>
                          <option value="agricultural">Agricultural Produce</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400">Category *</label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none cursor-pointer focus:border-indigo-500"
                        >
                          {categories.map(cat => (
                            <option key={cat.categoryId} value={cat.name}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400">Short Summary</label>
                      <input 
                        type="text" 
                        value={formData.shortDescription}
                        onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:border-indigo-500 outline-none"
                        placeholder="One line display description"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400">Fulfillment Details / Description *</label>
                      <textarea 
                        required
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:border-indigo-500 outline-none min-h-[100px]"
                        placeholder="Comprehensive specifications and shipping notes..."
                      />
                    </div>
                  </div>

                  {/* Financial and Inventory */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest border-b border-slate-800/60 pb-1.5">Pricing & Supply</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400">Price (Pi) *</label>
                        <input 
                          type="number" 
                          required
                          min={0.001}
                          step={0.001}
                          value={formData.price}
                          onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:border-indigo-500 outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400">Regular / MRP Price</label>
                        <input 
                          type="number" 
                          min={0}
                          value={formData.comparePrice}
                          onChange={(e) => setFormData(prev => ({ ...prev, comparePrice: parseFloat(e.target.value) || 0 }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:border-indigo-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400">Initial Inventory *</label>
                        <input 
                          type="number" 
                          required
                          min={0}
                          value={formData.stock}
                          onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:border-indigo-500 outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400">SKU Identifier</label>
                        <input 
                          type="text" 
                          value={formData.sku}
                          onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:border-indigo-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400">Product Image URL</label>
                      <input 
                        type="url" 
                        value={formData.imageUrl}
                        onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:border-indigo-500 outline-none"
                        placeholder="https://images.unsplash.com/photo-..."
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400">Target Store Outlet for Listing</label>
                      <select
                        value={selectedStoreId}
                        onChange={(e) => setSelectedStoreId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none cursor-pointer focus:border-indigo-500"
                      >
                        {stores.map(s => (
                          <option key={s.storeId} value={s.storeId}>{s.storeName}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* SEO Config */}
                <div className="bg-slate-950/40 border border-slate-800/80 p-5 rounded-2xl space-y-4">
                  <h4 className="text-xs font-bold text-violet-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" /> Google SEO Meta Settings
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400">SEO Custom Title</label>
                      <input 
                        type="text" 
                        value={formData.seoTitle}
                        onChange={(e) => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:border-indigo-500 outline-none"
                        placeholder="Meta search preview heading"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400">SEO Meta Description</label>
                      <input 
                        type="text" 
                        value={formData.seoDescription}
                        onChange={(e) => setFormData(prev => ({ ...prev, seoDescription: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:border-indigo-500 outline-none"
                        placeholder="Under 160 characters summary"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-800 pt-5">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      id="featured-check"
                      checked={formData.featured}
                      onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                      className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-indigo-500 focus:ring-indigo-500"
                    />
                    <label htmlFor="featured-check" className="text-xs font-bold text-slate-300 cursor-pointer selection:bg-transparent">
                      Feature on Store Homepage
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <button 
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="px-5 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={savingForm}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/10"
                    >
                      {savingForm && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Save Product
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
