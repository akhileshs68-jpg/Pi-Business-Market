/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Tag, 
  DollarSign, 
  Database, 
  Search, 
  Eye, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  X,
  Plus,
  Image as ImageIcon,
  Trash2,
  MoveUp,
  MoveDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Product, 
  ProductType, 
  ProductStatus, 
  VisibilityStatus,
  StockStatus,
  MediaAsset
} from '../../types';
import { productService } from '../../services/productService';
import { MediaPickerModal } from './MediaPickerModal';

interface ProductWizardProps {
  storeId: string;
  businessId: string;
  ownerUid: string;
  onClose: () => void;
  onComplete: (productId: string) => void;
  initialProduct?: Product;
}

type Step = 'basic' | 'category' | 'media' | 'pricing' | 'inventory' | 'seo' | 'review';

const STEPS: { id: Step; label: string; icon: any }[] = [
  { id: 'basic', label: 'Basic Info', icon: Package },
  { id: 'category', label: 'Category', icon: Tag },
  { id: 'media', label: 'Media', icon: ImageIcon },
  { id: 'pricing', label: 'Pricing', icon: DollarSign },
  { id: 'inventory', label: 'Inventory', icon: Database },
  { id: 'seo', label: 'SEO', icon: Search },
  { id: 'review', label: 'Review', icon: Eye },
];

export const ProductWizard: React.FC<ProductWizardProps> = ({
  storeId,
  businessId,
  ownerUid,
  onClose,
  onComplete,
  initialProduct
}) => {
  const [currentStep, setCurrentStep] = useState<Step>('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>>({
    storeId,
    businessId,
    ownerUid,
    sku: initialProduct?.sku || '',
    barcode: initialProduct?.barcode || '',
    productName: initialProduct?.productName || '',
    productSlug: initialProduct?.productSlug || '',
    type: initialProduct?.type || 'physical',
    shortDescription: initialProduct?.shortDescription || '',
    description: initialProduct?.description || '',
    brand: initialProduct?.brand || '',
    category: initialProduct?.category || '',
    subCategory: initialProduct?.subCategory || '',
    tags: initialProduct?.tags || [],
    price: initialProduct?.price || 0,
    comparePrice: initialProduct?.comparePrice || undefined,
    currency: initialProduct?.currency || 'Pi',
    taxClass: initialProduct?.taxClass || 'standard',
    stock: initialProduct?.stock || 0,
    stockStatus: initialProduct?.stockStatus || 'in_stock',
    minOrderQty: initialProduct?.minOrderQty || 1,
    maxOrderQty: initialProduct?.maxOrderQty || 999,
    featured: initialProduct?.featured || false,
    status: initialProduct?.status || 'draft',
    visibility: initialProduct?.visibility || 'public',
    seoTitle: initialProduct?.seoTitle || '',
    seoDescription: initialProduct?.seoDescription || '',
    imageUrls: initialProduct?.imageUrls || [],
    mainImage: initialProduct?.mainImage || undefined,
  });

  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  // Auto-generate slug and SEO from name
  useEffect(() => {
    if (!initialProduct && currentStep === 'basic') {
      const slug = formData.productName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      setFormData(prev => ({
        ...prev,
        productSlug: slug,
        seoTitle: prev.productName,
      }));
    }
  }, [formData.productName, initialProduct]);

  const validateStep = (step: Step): boolean => {
    setError(null);
    switch (step) {
      case 'basic':
        if (!formData.productName) return false;
        if (!formData.productSlug) return false;
        return true;
      case 'category':
        if (!formData.category) return false;
        return true;
      case 'media':
        // Optional but recommended
        return true;
      case 'pricing':
        if (formData.price < 0) return false;
        return true;
      case 'inventory':
        if (!formData.sku) return false;
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
    if (currentIndex < STEPS.length - 1) {
      if (validateStep(currentStep)) {
        setCurrentStep(STEPS[currentIndex + 1].id);
      } else {
        setError('Please complete all required fields.');
      }
    }
  };

  const handleBack = () => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      // Validate SKU and Slug uniqueness
      const isSkuUnique = await productService.isSkuUnique(storeId, formData.sku, initialProduct?.productId);
      if (!isSkuUnique) {
        setError('SKU already exists in this store.');
        setCurrentStep('inventory');
        return;
      }

      const isSlugUnique = await productService.isSlugUnique(formData.productSlug, initialProduct?.productId);
      if (!isSlugUnique) {
        setError('Product slug already exists.');
        setCurrentStep('basic');
        return;
      }

      let productId: string;
      if (initialProduct) {
        await productService.updateProduct(initialProduct.productId, formData);
        productId = initialProduct.productId;
      } else {
        productId = await productService.createProduct(formData);
      }
      onComplete(productId);
    } catch (err: any) {
      setError(err.message || 'Failed to save product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
    }
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter((_, i) => i !== index) }));
  };

  const handleImageSelect = (asset: MediaAsset) => {
    setFormData(prev => {
      const newUrls = [...prev.imageUrls, asset.downloadUrl];
      return {
        ...prev,
        imageUrls: newUrls,
        mainImage: prev.mainImage || asset.downloadUrl
      };
    });
  };

  const removeImage = (index: number) => {
    setFormData(prev => {
      const newUrls = prev.imageUrls.filter((_, i) => i !== index);
      let newMainImage = prev.mainImage;
      if (prev.mainImage === prev.imageUrls[index]) {
        newMainImage = newUrls.length > 0 ? newUrls[0] : undefined;
      }
      return {
        ...prev,
        imageUrls: newUrls,
        mainImage: newMainImage
      };
    });
  };

  const setMainImage = (url: string) => {
    setFormData(prev => ({ ...prev, mainImage: url }));
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= formData.imageUrls.length) return;

    const newUrls = [...formData.imageUrls];
    [newUrls[index], newUrls[newIndex]] = [newUrls[newIndex], newUrls[index]];
    setFormData(prev => ({ ...prev, imageUrls: newUrls }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-slate-900 border border-slate-800 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Package className="w-6 h-6 text-violet-400" />
              {initialProduct ? 'Edit Product' : 'Create New Product'}
            </h2>
            <p className="text-sm text-slate-400">Enterprise Product Management Engine</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Stepper */}
        <div className="px-6 py-4 bg-slate-900/30 border-b border-slate-800 flex items-center justify-between overflow-x-auto">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = STEPS.findIndex(s => s.id === currentStep) > idx;

            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex flex-col items-center gap-1 min-w-[80px] group transition-all ${isActive ? 'scale-110' : 'opacity-60'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    isActive ? 'border-violet-500 bg-violet-500/20 text-violet-400' : 
                    isCompleted ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400' : 'border-slate-700 text-slate-500'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-violet-400' : 'text-slate-500'}`}>
                    {step.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`w-8 sm:w-16 h-0.5 mx-2 rounded-full transition-all ${
                    isCompleted ? 'bg-emerald-500/50' : 'bg-slate-800'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {currentStep === 'basic' && (
              <motion.div 
                key="basic"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300">Product Name *</label>
                    <input 
                      type="text"
                      value={formData.productName}
                      onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
                      placeholder="e.g. Premium Cotton T-Shirt"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300">Product Slug *</label>
                    <div className="relative">
                      <input 
                        type="text"
                        value={formData.productSlug}
                        onChange={(e) => setFormData(prev => ({ ...prev, productSlug: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-10 py-3 text-white focus:outline-none focus:border-violet-500 transition-all font-mono text-sm"
                      />
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300">Product Type</label>
                    <select 
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as ProductType }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-all"
                    >
                      <option value="physical">Physical Product</option>
                      <option value="digital">Digital Product</option>
                      <option value="service">Service Product</option>
                      <option value="subscription">Subscription</option>
                      <option value="rental">Rental</option>
                      <option value="downloadable">Downloadable</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300">Brand</label>
                    <input 
                      type="text"
                      value={formData.brand}
                      onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                      placeholder="e.g. Nike, Apple"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300">Status</label>
                    <select 
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as ProductStatus }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-all"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="pending">Pending Review</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300">Short Description</label>
                  <textarea 
                    value={formData.shortDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
                    placeholder="Brief overview of the product..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-all h-24 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300">Full Description</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Detailed specifications, features, and information..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-all h-40 resize-none"
                  />
                </div>
              </motion.div>
            )}

            {currentStep === 'category' && (
              <motion.div 
                key="category"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300">Primary Category *</label>
                    <input 
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="e.g. Electronics, Fashion"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300">Sub-Category</label>
                    <input 
                      type="text"
                      value={formData.subCategory}
                      onChange={(e) => setFormData(prev => ({ ...prev, subCategory: e.target.value }))}
                      placeholder="e.g. Smartphones, T-Shirts"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-bold text-slate-300">Product Tags</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.tags.map((tag, idx) => (
                      <span key={idx} className="bg-violet-500/10 text-violet-400 px-3 py-1 rounded-lg text-xs font-bold border border-violet-500/20 flex items-center gap-2">
                        {tag}
                        <button onClick={() => removeTag(idx)} className="hover:text-white">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      id="tag-input"
                      placeholder="Add a tag..."
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-violet-500 transition-all text-sm"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addTag((e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                    <button 
                      onClick={() => {
                        const input = document.getElementById('tag-input') as HTMLInputElement;
                        addTag(input.value);
                        input.value = '';
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl transition-all"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 'media' && (
              <motion.div 
                key="media"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">Product Gallery</h3>
                    <p className="text-sm text-slate-400">Add up to 10 images. First image is the cover.</p>
                  </div>
                  <button 
                    onClick={() => setIsMediaPickerOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-violet-600/20"
                  >
                    <Plus className="w-4 h-4" />
                    Add Media
                  </button>
                </div>

                {formData.imageUrls.length === 0 ? (
                  <div 
                    onClick={() => setIsMediaPickerOpen(true)}
                    className="border-2 border-dashed border-slate-800 rounded-3xl p-12 flex flex-col items-center justify-center text-center space-y-4 hover:border-slate-700 hover:bg-slate-900/30 cursor-pointer transition-all"
                  >
                    <div className="p-4 bg-slate-900 rounded-full">
                      <ImageIcon className="w-12 h-12 text-slate-700" />
                    </div>
                    <div>
                      <p className="text-white font-bold">No images added yet</p>
                      <p className="text-sm text-slate-500">Click to open media library or upload new assets</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {formData.imageUrls.map((url, idx) => (
                      <motion.div
                        layout
                        key={url}
                        className={`
                          relative group aspect-square rounded-2xl overflow-hidden bg-slate-900 border-2 transition-all
                          ${formData.mainImage === url ? 'border-violet-500 ring-2 ring-violet-500/20' : 'border-slate-800 hover:border-slate-700'}
                        `}
                      >
                        <img src={url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        
                        {formData.mainImage === url && (
                          <div className="absolute top-2 left-2 px-2 py-1 bg-violet-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg">
                            Cover
                          </div>
                        )}

                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                          <button 
                            onClick={() => setMainImage(url)}
                            className="px-3 py-1 bg-white text-black text-[10px] font-bold rounded-lg hover:bg-violet-500 hover:text-white transition-all"
                          >
                            Set as Cover
                          </button>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => moveImage(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-30"
                            >
                              <MoveUp className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => moveImage(idx, 'down')}
                              disabled={idx === formData.imageUrls.length - 1}
                              className="p-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-30"
                            >
                              <MoveDown className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => removeImage(idx)}
                              className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    
                    <button 
                      onClick={() => setIsMediaPickerOpen(true)}
                      className="aspect-square border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500 hover:border-violet-500/50 hover:text-violet-400 hover:bg-violet-500/5 transition-all"
                    >
                      <Plus className="w-6 h-6 mb-1" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Add More</span>
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {currentStep === 'pricing' && (
              <motion.div 
                key="pricing"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div className="bg-violet-500/5 border border-violet-500/10 p-6 rounded-2xl mb-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-violet-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white">Pricing Model</h4>
                      <p className="text-xs text-slate-400">Set regular, sale, and comparison prices.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-300">Regular Price (Pi) *</label>
                      <div className="relative">
                        <input 
                          type="number"
                          value={formData.price}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            price: parseFloat(e.target.value) || 0 
                          }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-all"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">π</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-300">Compare at Price</label>
                      <div className="relative">
                        <input 
                          type="number"
                          value={formData.comparePrice || ''}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            comparePrice: parseFloat(e.target.value) || undefined 
                          }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-all"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">π</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-300">Tax Class</label>
                      <select 
                        value={formData.taxClass}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          taxClass: e.target.value 
                        }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-all"
                      >
                        <option value="standard">Standard Tax</option>
                        <option value="zero">Zero Rate</option>
                        <option value="reduced">Reduced Rate</option>
                        <option value="exempt">Tax Exempt</option>
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 'inventory' && (
              <motion.div 
                key="inventory"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300">SKU (Stock Keeping Unit) *</label>
                    <input 
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        sku: e.target.value.toUpperCase() 
                      }))}
                      placeholder="e.g. TSH-BLK-LRG"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-all font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300">Barcode</label>
                    <input 
                      type="text"
                      value={formData.barcode || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        barcode: e.target.value 
                      }))}
                      placeholder="e.g. 123456789012"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300">Quantity In Stock</label>
                    <input 
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        stock: parseInt(e.target.value) || 0 
                      }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300">Stock Status</label>
                    <select 
                      value={formData.stockStatus}
                      onChange={(e) => setFormData(prev => ({ ...prev, stockStatus: e.target.value as StockStatus }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-all"
                    >
                      <option value="in_stock">In Stock</option>
                      <option value="out_of_stock">Out of Stock</option>
                      <option value="on_backorder">On Backorder</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300">Min Order Qty</label>
                    <input 
                      type="number"
                      value={formData.minOrderQty}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        minOrderQty: parseInt(e.target.value) || 1 
                      }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-all"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 'seo' && (
              <motion.div 
                key="seo"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300">SEO Title</label>
                  <input 
                    type="text"
                    value={formData.seoTitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))}
                    placeholder="Meta title for search engines"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300">SEO Description</label>
                  <textarea 
                    value={formData.seoDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, seoDescription: e.target.value }))}
                    placeholder="Brief description for search results..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-all h-24 resize-none"
                  />
                </div>
              </motion.div>
            )}

            {currentStep === 'review' && (
              <motion.div 
                key="review"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div className="bg-slate-950/50 border border-slate-800 p-6 rounded-2xl">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 text-center">Final Review</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <div className="flex justify-between border-b border-slate-800 py-2">
                        <span className="text-xs text-slate-400">Product Name:</span>
                        <span className="text-xs font-bold text-white">{formData.productName}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 py-2">
                        <span className="text-xs text-slate-400">Type:</span>
                        <span className="text-xs font-bold text-violet-400 uppercase">{formData.type}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 py-2">
                        <span className="text-xs text-slate-400">SKU:</span>
                        <span className="text-xs font-mono font-bold text-white">{formData.sku}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between border-b border-slate-800 py-2">
                        <span className="text-xs text-slate-400">Price:</span>
                        <span className="text-xs font-bold text-emerald-400">{formData.price} π</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 py-2">
                        <span className="text-xs text-slate-400">Stock:</span>
                        <span className="text-xs font-bold text-white">{formData.stock} Units</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 py-2">
                        <span className="text-xs text-slate-400">Status:</span>
                        <span className="text-xs font-bold text-amber-400 uppercase">{formData.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 flex items-center justify-between bg-slate-900/50">
          <button 
            onClick={handleBack}
            disabled={currentStep === 'basic' || isSubmitting}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
              currentStep === 'basic' || isSubmitting
                ? 'opacity-30 cursor-not-allowed text-slate-500'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl text-sm font-bold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            
            {currentStep === 'review' ? (
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-10 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/20 hover:from-violet-500 hover:to-indigo-500 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {initialProduct ? 'Update Product' : 'Publish Product'}
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : (
              <button 
                onClick={handleNext}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-10 py-3 rounded-xl text-sm font-bold bg-violet-600 text-white shadow-lg shadow-violet-600/20 hover:bg-violet-500 transition-all"
              >
                Next Step
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>

      <MediaPickerModal 
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        ownerUid={ownerUid}
        module="products"
        onSelect={handleImageSelect}
        title="Product Media Selection"
        selectedIds={[]} // We could pass current IDs to highlight them
      />
    </div>
  );
};
