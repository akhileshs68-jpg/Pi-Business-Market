/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, FolderTree, Search, Loader2, Tag, 
  Layers, ChevronRight, ChevronDown, CheckCircle2, AlertCircle, 
  HelpCircle, Archive, Trash, X, ArrowUpRight
} from 'lucide-react';
import { catalogService } from '../../services/catalogService';
import { Category, CategoryStatus } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

export const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'product' | 'service' | 'store' | 'business'>('product');
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    slug: string;
    description: string;
    icon: string;
    parentId: string;
    level: number;
    sortOrder: number;
    status: CategoryStatus;
    visibility: 'public' | 'private';
    featured: boolean;
    seoTitle: string;
    seoDescription: string;
  }>({
    name: '',
    slug: '',
    description: '',
    icon: '📁',
    parentId: '',
    level: 0,
    sortOrder: 0,
    status: 'active',
    visibility: 'public',
    featured: false,
    seoTitle: '',
    seoDescription: ''
  });

  const [savingForm, setSavingForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await catalogService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setFormData(prev => ({ ...prev, name, slug }));
  };

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      icon: '📁',
      parentId: '',
      level: 0,
      sortOrder: 0,
      status: 'active',
      visibility: 'public',
      featured: false,
      seoTitle: '',
      seoDescription: ''
    });
    setErrorMsg(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name || '',
      slug: cat.slug || '',
      description: cat.description || '',
      icon: cat.icon || '📁',
      parentId: cat.parentId || '',
      level: cat.level || 0,
      sortOrder: cat.sortOrder || 0,
      status: cat.status || 'active',
      visibility: cat.visibility || 'public',
      featured: cat.featured || false,
      seoTitle: cat.seoTitle || '',
      seoDescription: cat.seoDescription || ''
    });
    setErrorMsg(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category? Subcategories will become root categories.')) return;
    try {
      await catalogService.deleteCategory(id);
      await fetchCategories();
    } catch (err) {
      console.error('Failed to delete category:', err);
    }
  };

  const toggleExpand = (id: string) => {
    const next = new Set(expandedCats);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedCats(next);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingForm(true);
    setErrorMsg(null);

    try {
      const isUnique = await catalogService.isSlugUnique(formData.slug, 'categories', 'categoryId', editingCategory?.categoryId);
      if (!isUnique) {
        throw new Error('Category slug is already registered. Please use a unique title.');
      }

      const parentCat = categories.find(c => c.categoryId === formData.parentId);
      const level = parentCat ? (parentCat.level || 0) + 1 : 0;

      const payload = {
        ...formData,
        level,
        type: selectedType // Add category classification type
      };

      if (editingCategory) {
        await catalogService.updateCategory(editingCategory.categoryId, payload);
      } else {
        await catalogService.createCategory(payload);
      }

      setIsFormOpen(false);
      await fetchCategories();
    } catch (err: any) {
      console.error('Save category failed:', err);
      setErrorMsg(err.message || 'Failed to save category specifications.');
    } finally {
      setSavingForm(false);
    }
  };

  // Filter root categories for the selected type
  const rootCategories = categories.filter((c: any) => !c.parentId && (!c.type || c.type === selectedType));
  const getSubcategories = (parentId: string) => categories.filter(c => c.parentId === parentId);

  const renderCategoryNode = (cat: Category, index: number) => {
    const subs = getSubcategories(cat.categoryId);
    const isExpanded = expandedCats.has(cat.categoryId);
    const hasSubs = subs.length > 0;

    return (
      <div key={cat.categoryId} className="space-y-2">
        <div className="flex items-center justify-between p-4 bg-slate-900/40 border border-slate-800 rounded-2xl hover:border-slate-700/80 transition-all">
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={() => hasSubs && toggleExpand(cat.categoryId)}
              className={`p-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-500 transition-transform ${hasSubs ? 'hover:text-white cursor-pointer' : 'opacity-40 cursor-default'} ${isExpanded ? 'rotate-90' : ''}`}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <span className="text-lg">{cat.icon || '📁'}</span>
            <div>
              <h5 className="text-sm font-extrabold text-white flex items-center gap-2">
                {cat.name}
                <span className="text-[10px] font-mono text-indigo-400">/{cat.slug}</span>
              </h5>
              <p className="text-xs text-slate-400 line-clamp-1">{cat.description || 'Taxonomy branch definition.'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-slate-950 text-slate-400 border border-slate-800 text-[10px] font-bold rounded-full">
              Order: {cat.sortOrder || 0}
            </span>
            <button
              onClick={() => handleOpenEdit(cat)}
              className="p-1.5 bg-slate-950 hover:bg-indigo-600/10 border border-slate-800 hover:border-indigo-500/20 text-indigo-400 rounded-xl transition-all"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleDelete(cat.categoryId)}
              className="p-1.5 bg-slate-950 hover:bg-rose-600/10 border border-slate-800 hover:border-rose-500/20 text-rose-400 rounded-xl transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {isExpanded && hasSubs && (
          <div className="pl-8 border-l border-slate-800/60 space-y-2 mt-2">
            {subs.map((sub, i) => renderCategoryNode(sub, i))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Type Selector Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 p-5 rounded-3xl border border-slate-800">
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {[
            { id: 'product', label: 'Products' },
            { id: 'service', label: 'Services' },
            { id: 'store', label: 'Stores' },
            { id: 'business', label: 'Businesses' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedType(t.id as any)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${selectedType === t.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Category List */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : rootCategories.length > 0 ? (
        <div className="space-y-3">
          {rootCategories.map((cat, i) => renderCategoryNode(cat, i))}
        </div>
      ) : (
        <div className="py-20 text-center bg-slate-900/20 rounded-3xl border border-dashed border-slate-800">
          <FolderTree className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <h4 className="text-base font-bold text-white">No Categories Configured</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">Establish professional metadata taxonomy to organize your listings.</p>
          <button 
            onClick={handleOpenCreate}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl"
          >
            Create First Category
          </button>
        </div>
      )}

      {/* Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 sm:p-8 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-black text-white">
                    {editingCategory ? 'Edit Category Specifications' : 'Configure New Category'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Map search taxonomy, icons, parent bindings, and metadata tags.
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

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[11px] font-bold text-slate-400">Category Name *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:border-indigo-500 outline-none"
                      placeholder="e.g. Smart Watches"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400">Unicode Icon</label>
                    <input 
                      type="text" 
                      value={formData.icon}
                      onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-center text-white focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400">Taxonomy Slug (Unique Path) *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400">Parent Category (For Hierarchies)</label>
                  <select
                    value={formData.parentId}
                    onChange={(e) => setFormData(prev => ({ ...prev, parentId: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none cursor-pointer focus:border-indigo-500"
                  >
                    <option value="">-- None (Establish as Root) --</option>
                    {categories.filter(c => !c.parentId && c.categoryId !== editingCategory?.categoryId).map(c => (
                      <option key={c.categoryId} value={c.categoryId}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400">Category Outline / Description</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:border-indigo-500 outline-none min-h-[80px]"
                    placeholder="Short description for SEO indexers..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400">Display Order Index</label>
                    <input 
                      type="number" 
                      value={formData.sortOrder}
                      onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400">Taxonomy Type</label>
                    <select
                      value={selectedType}
                      disabled={true}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-400 outline-none cursor-not-allowed"
                    >
                      <option value="product">Products Catalog</option>
                      <option value="service">Services Catalog</option>
                      <option value="store">Stores Catalog</option>
                      <option value="business">Businesses Catalog</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-5">
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
                    Save Category Specifications
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
