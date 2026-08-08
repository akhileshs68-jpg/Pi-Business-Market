/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Plus, Edit2, Trash2, Archive, Pause, Play, Eye, 
  Search, Loader2, Tag, Layers, Sliders, CheckCircle2,
  AlertCircle, ChevronDown, Check, Globe, RefreshCw, X,
  Upload, Star, Image as ImageIcon, Link as LinkIcon
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { useAuth } from '../../auth/useAuth';
import { productService } from '../../services/productService';
import { catalogService } from '../../services/catalogService';
import { mediaService } from '../../services/mediaService';
import { Product, Category, ProductStatus } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

// Category memory cache to avoid redundant network queries
let categoriesCache: Category[] | null = null;

interface ProductImageUploaderProps {
  imageUrls: string[];
  primaryImageUrl: string;
  onChange: (images: string[], primaryUrl: string) => void;
  maxFiles?: number;
}

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
  error?: string;
}

const ProductImageUploader: React.FC<ProductImageUploaderProps> = ({
  imageUrls = [],
  primaryImageUrl = '',
  onChange,
  maxFiles = 8,
}) => {
  const { user } = useAuth();
  const { currentBusiness, currentStore } = useBusiness();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);

  const setPrimary = useCallback((url: string) => {
    onChange(imageUrls, url);
  }, [imageUrls, onChange]);

  const removeImage = useCallback((urlToRemove: string) => {
    const updated = imageUrls.filter(u => u !== urlToRemove);
    let nextPrimary = primaryImageUrl;
    if (primaryImageUrl === urlToRemove) {
      nextPrimary = updated[0] || '';
    }
    onChange(updated, nextPrimary);
  }, [imageUrls, primaryImageUrl, onChange]);

  const handleFiles = async (files: FileList | File[]) => {
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0) return;

    const remainingSlots = maxFiles - imageUrls.length;
    const filesToUpload = validFiles.slice(0, remainingSlots);

    const newImageUrls = [...imageUrls];
    let currentPrimary = primaryImageUrl;

    for (const file of filesToUpload) {
      const uploadId = Math.random().toString(36).substring(2, 9);
      
      setUploadingFiles(prev => [...prev, { id: uploadId, name: file.name, progress: 10 }]);

      try {
        let uploadedUrl = '';
        const ownerUid = user?.uid || 'guest_merchant';
        const businessId = currentBusiness?.id || 'default_business';
        const storeId = currentStore?.storeId || 'default_store';

        try {
          const asset = await mediaService.uploadMedia(file, ownerUid, {
            module: 'products',
            businessId,
            storeId,
            onProgress: (pct) => {
              setUploadingFiles(prev => prev.map(item => item.id === uploadId ? { ...item, progress: pct } : item));
            }
          });
          uploadedUrl = asset.downloadUrl || (asset as any).imageUrl || '';
        } catch (uploadError: any) {
          console.warn('[ProductImageUploader] Cloudinary/backend upload fallback triggered:', uploadError?.message);
          uploadedUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string || '');
            reader.readAsDataURL(file);
          });
        }

        if (uploadedUrl) {
          newImageUrls.push(uploadedUrl);
          if (!currentPrimary) {
            currentPrimary = uploadedUrl;
          }
        }
      } catch (err: any) {
        console.error('[ProductImageUploader] Failed file upload:', err);
      } finally {
        setUploadingFiles(prev => prev.filter(f => f.id !== uploadId));
      }
    }

    onChange(newImageUrls, currentPrimary);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleAddCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    
    if (!customUrl.startsWith('http://') && !customUrl.startsWith('https://') && !customUrl.startsWith('data:image/')) {
      setUrlError('Please enter a valid URL starting with http:// or https://');
      return;
    }

    const updated = [...imageUrls, customUrl.trim()];
    const nextPrimary = primaryImageUrl || customUrl.trim();
    onChange(updated, nextPrimary);
    setCustomUrl('');
    setUrlError(null);
    setShowUrlInput(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
          <ImageIcon className="w-3.5 h-3.5 text-indigo-400" /> Product Gallery & Visuals ({imageUrls.length}/{maxFiles})
        </label>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 transition-colors"
        >
          <LinkIcon className="w-3 h-3" />
          {showUrlInput ? 'Cancel URL' : '+ Paste URL'}
        </button>
      </div>

      {showUrlInput && (
        <form onSubmit={handleAddCustomUrl} className="space-y-2 bg-slate-950 p-3 rounded-2xl border border-indigo-500/30">
          <div className="flex gap-2">
            <input
              type="url"
              value={customUrl}
              onChange={(e) => {
                setCustomUrl(e.target.value);
                setUrlError(null);
              }}
              placeholder="https://images.unsplash.com/photo-..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-indigo-500 outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all"
            >
              Add
            </button>
          </div>
          {urlError && <p className="text-[10px] text-rose-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {urlError}</p>}
        </form>
      )}

      {imageUrls.length < maxFiles && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-indigo-500 bg-indigo-500/10 scale-[0.99]'
              : 'border-slate-800 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-950'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />

          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="p-3 bg-indigo-600/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                Drop high-resolution product photos here, or <span className="text-indigo-400 underline">browse</span>
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Supports PNG, JPG, WEBP up to 10MB each
              </p>
            </div>
          </div>
        </div>
      )}

      {uploadingFiles.length > 0 && (
        <div className="space-y-2 bg-slate-950 p-3 rounded-2xl border border-slate-800">
          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
            <Loader2 className="w-3 h-3 animate-spin" /> Uploading to Marketplace Cloud...
          </p>
          {uploadingFiles.map((file) => (
            <div key={file.id} className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span className="truncate max-w-[200px]">{file.name}</span>
                <span className="font-mono">{file.progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-300 rounded-full"
                  style={{ width: `${file.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {imageUrls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {imageUrls.map((url, idx) => {
            const isPrimary = primaryImageUrl === url || (!primaryImageUrl && idx === 0);
            return (
              <div
                key={url + idx}
                className={`relative group aspect-square rounded-2xl overflow-hidden bg-slate-950 border transition-all ${
                  isPrimary
                    ? 'border-indigo-500 shadow-md shadow-indigo-500/20 ring-1 ring-indigo-500'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <img
                  src={url}
                  alt={`Product asset ${idx + 1}`}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />

                {isPrimary ? (
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-indigo-600 text-white text-[9px] font-black rounded-full shadow flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 fill-white" /> Primary
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPrimary(url)}
                    className="absolute top-2 left-2 px-2 py-0.5 bg-slate-900/80 hover:bg-indigo-600 text-slate-300 hover:text-white text-[9px] font-bold rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 backdrop-blur-sm"
                  >
                    <Star className="w-2.5 h-2.5" /> Set Main
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="absolute top-2 right-2 p-1.5 bg-rose-600/90 hover:bg-rose-600 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const ProductCardItem = React.memo<{
  p: Product;
  linkedStoreName?: string;
  actionLoading: string | null;
  onToggleStatus: (p: Product) => void;
  onOpenEdit: (p: Product) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}>(({ p, linkedStoreName, actionLoading, onToggleStatus, onOpenEdit, onArchive, onDelete }) => {
  const displayImage = p.mainImage || (p.imageUrls && p.imageUrls[0]) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500';

  return (
    <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-5 space-y-4 hover:border-slate-700/80 transition-all flex flex-col justify-between">
      <div className="space-y-3">
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
          <img 
            src={displayImage} 
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

        {linkedStoreName && (
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-950/40 p-2 rounded-xl border border-slate-800">
            <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">Store: {linkedStoreName}</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => onToggleStatus(p)}
            disabled={actionLoading === p.productId}
            className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 flex-1 cursor-pointer"
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
            onClick={() => onOpenEdit(p)}
            className="p-2 bg-slate-950 hover:bg-indigo-600/10 border border-slate-800 hover:border-indigo-500/20 text-indigo-400 rounded-xl transition-all cursor-pointer"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => onArchive(p.productId)}
            className="p-2 bg-slate-950 hover:bg-amber-600/10 border border-slate-800 hover:border-amber-500/20 text-amber-400 rounded-xl transition-all cursor-pointer"
          >
            <Archive className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDelete(p.productId)}
            className="p-2 bg-slate-950 hover:bg-rose-600/10 border border-slate-800 hover:border-rose-500/20 text-rose-400 rounded-xl transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
});
ProductCardItem.displayName = 'ProductCardItem';

export const ProductManager: React.FC = () => {
  const { currentBusiness, stores, currentStore } = useBusiness();
  const { user } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>(categoriesCache || []);
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
    imageUrls: string[];
    primaryImageUrl: string;
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
    imageUrls: [],
    primaryImageUrl: '',
    status: 'published',
    seoTitle: '',
    seoDescription: '',
    featured: false
  });

  const [savingForm, setSavingForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const businessId = currentBusiness?.id;

  const fetchProducts = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const fetched = await productService.getStoreProducts(businessId);
      let prodArray: Product[] = [];
      if (fetched instanceof Map) {
        prodArray = Array.from(fetched.values());
      } else if (Array.isArray(fetched)) {
        prodArray = fetched;
      }
      setProducts(prodArray);
    } catch (err) {
      console.error('[ProductManager] Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  const fetchCategories = useCallback(async () => {
    if (categoriesCache) {
      setCategories(categoriesCache);
      return;
    }
    try {
      const cats = await catalogService.getCategories();
      categoriesCache = cats;
      setCategories(cats);
    } catch (err) {
      console.error('[ProductManager] Error fetching categories:', err);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  const handleOpenCreate = useCallback(() => {
    const defaultImage = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500';
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
      imageUrls: [defaultImage],
      primaryImageUrl: defaultImage,
      status: 'published',
      seoTitle: '',
      seoDescription: '',
      featured: false
    });
    setErrorMsg(null);
    setIsFormOpen(true);
  }, [categories]);

  useEffect(() => {
    const action = new URLSearchParams(window.location.search).get('action');
    if (action === 'add_product' && !isFormOpen && categories.length > 0) {
      handleOpenCreate();
      const url = new URL(window.location.href);
      url.searchParams.delete('action');
      window.history.replaceState({}, '', url.toString());
    }
  }, [categories, handleOpenCreate, isFormOpen]);

  const handleOpenEdit = useCallback((product: Product) => {
    const defaultImage = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500';
    const existingImages = (product.imageUrls && product.imageUrls.length > 0)
      ? product.imageUrls 
      : [product.mainImage || defaultImage];
    const primary = product.mainImage || existingImages[0] || defaultImage;

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
      imageUrls: existingImages,
      primaryImageUrl: primary,
      status: product.status || 'published',
      seoTitle: product.seoTitle || '',
      seoDescription: product.seoDescription || '',
      featured: product.featured || false
    });
    setErrorMsg(null);
    setIsFormOpen(true);
  }, []);

  const handleToggleStatus = useCallback(async (product: Product) => {
    setActionLoading(product.productId);
    try {
      const newStatus = product.status === 'published' ? 'draft' : 'published';
      await productService.updateProduct(product.productId, { status: newStatus });
      await fetchProducts();
    } catch (err) {
      console.error('[ProductManager] Failed to toggle status:', err);
    } finally {
      setActionLoading(null);
    }
  }, [fetchProducts]);

  const handleArchive = useCallback(async (productId: string) => {
    if (!window.confirm('Archive this product? It will be hidden from the marketplace.')) return;
    setActionLoading(productId);
    try {
      await productService.archiveProduct(productId);
      await fetchProducts();
    } catch (err) {
      console.error('[ProductManager] Failed to archive:', err);
    } finally {
      setActionLoading(null);
    }
  }, [fetchProducts]);

  const handleDelete = useCallback(async (productId: string) => {
    if (!window.confirm('Permanently delete this product? This action is irreversible.')) return;
    setActionLoading(productId);
    try {
      await productService.permanentDeleteProduct(productId);
      await fetchProducts();
    } catch (err) {
      console.error('[ProductManager] Failed to delete:', err);
    } finally {
      setActionLoading(null);
    }
  }, [fetchProducts]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness) return;
    
    // Choose active store for assignment (optional)
    const targetStore = stores.find(s => (s.storeId || (s as any).id) === selectedStoreId) || stores[0] || currentStore;

    const resolvedStoreId = targetStore ? (targetStore.storeId || (targetStore as any).id || currentStore?.storeId) : 'no-store';
    const resolvedOwnerUid = user?.uid || currentBusiness.ownerUid || (targetStore ? targetStore.ownerUid : user?.uid);

    setSavingForm(true);
    setErrorMsg(null);
    try {
      const slug = formData.productName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 5);
      
      const finalMainImage = formData.primaryImageUrl || formData.imageUrls[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500';
      const finalImageUrls = formData.imageUrls.length > 0 ? formData.imageUrls : [finalMainImage];

      const payload = {
        productName: formData.productName,
        type: formData.type,
        category: formData.category,
        subCategory: formData.subCategory,
        description: formData.description,
        shortDescription: formData.shortDescription,
        price: formData.price,
        comparePrice: formData.comparePrice,
        stock: formData.stock,
        sku: formData.sku,
        barcode: formData.barcode,
        brand: formData.brand,
        status: formData.status,
        seoTitle: formData.seoTitle,
        seoDescription: formData.seoDescription,
        featured: formData.featured,
        productSlug: slug,
        ownerUid: resolvedOwnerUid,
        sellerId: resolvedOwnerUid,
        merchantId: resolvedOwnerUid,
        createdBy: resolvedOwnerUid,
        businessId: currentBusiness.id,
        storeId: resolvedStoreId,
        stockStatus: formData.stock > 0 ? 'in_stock' : 'out_of_stock',
        mainImage: finalMainImage,
        imageUrl: finalMainImage,
        imageUrls: finalImageUrls
      };

      if (editingProduct) {
        await productService.updateProduct(editingProduct.productId, payload);
      } else {
        await productService.createProduct(payload);
      }
      setIsFormOpen(false);
      await fetchProducts();
    } catch (err: any) {
      console.error('[ProductManager] Save failed:', err);
      setErrorMsg(err.message || 'An error occurred while saving the product.');
    } finally {
      setSavingForm(false);
    }
  };

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return products.filter(p => {
      const matchesSearch = !q || 
                            p.productName?.toLowerCase().includes(q) || 
                            p.sku?.toLowerCase().includes(q) ||
                            p.description?.toLowerCase().includes(q);
      const matchesStore = selectedStoreId === 'all' || p.storeId === selectedStoreId;
      const matchesStatus = selectedStatus === 'all' || p.status === selectedStatus;
      return matchesSearch && matchesStore && matchesStatus;
    });
  }, [products, searchQuery, selectedStoreId, selectedStatus]);

  const storesMap = useMemo(() => {
    const map = new Map<string, string>();
    stores.forEach(s => map.set(s.storeId, s.storeName));
    return map;
  }, [stores]);

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
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer self-start sm:self-auto shadow-lg shadow-indigo-600/10"
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
          {filteredProducts.map(p => (
            <ProductCardItem
              key={p.productId}
              p={p}
              linkedStoreName={storesMap.get(p.storeId)}
              actionLoading={actionLoading}
              onToggleStatus={handleToggleStatus}
              onOpenEdit={handleOpenEdit}
              onArchive={handleArchive}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-slate-900/20 rounded-3xl border border-dashed border-slate-800">
          <Tag className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <h4 className="text-base font-bold text-white">No Products Registered</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">Create physical or digital product listings under this business.</p>
          <button 
            onClick={handleOpenCreate}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer"
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
                  className="p-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
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

                    {/* Professional Marketplace Image Uploader */}
                    <ProductImageUploader
                      imageUrls={formData.imageUrls}
                      primaryImageUrl={formData.primaryImageUrl}
                      onChange={(images, primary) => {
                        setFormData(prev => ({
                          ...prev,
                          imageUrls: images,
                          primaryImageUrl: primary
                        }));
                      }}
                    />

                    <div className="space-y-1.5 pt-2">
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
