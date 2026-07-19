/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Search, 
  ChevronRight, 
  Loader2, 
  Image as ImageIcon,
  Layout,
  Globe,
  Settings,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Category, CategoryStatus } from '../../types';
import { catalogService } from '../../services/catalogService';

interface CategoryWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialCategory?: Category;
  categories: Category[];
}

export const CategoryWizard: React.FC<CategoryWizardProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialCategory,
  categories
}) => {
  const [formData, setFormData] = useState<Omit<Category, 'categoryId' | 'createdAt' | 'updatedAt'>>({
    name: initialCategory?.name || '',
    slug: initialCategory?.slug || '',
    description: initialCategory?.description || '',
    icon: initialCategory?.icon || '📁',
    banner: initialCategory?.banner || '',
    parentId: initialCategory?.parentId || '',
    level: initialCategory?.level || 0,
    sortOrder: initialCategory?.sortOrder || 0,
    status: initialCategory?.status || 'active',
    visibility: initialCategory?.visibility || 'public',
    featured: initialCategory?.featured || false,
    seoTitle: initialCategory?.seoTitle || '',
    seoDescription: initialCategory?.seoDescription || ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate slug uniqueness
      const isUnique = await catalogService.isSlugUnique(formData.slug, 'categories', 'categoryId', initialCategory?.categoryId);
      if (!isUnique) {
        throw new Error('Category slug already exists.');
      }

      if (initialCategory) {
        await catalogService.updateCategory(initialCategory.categoryId, formData);
      } else {
        await catalogService.createCategory(formData);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    setFormData(prev => ({ ...prev, name, slug }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl"
      >
        <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-violet-600 rounded-2xl">
              <Layout className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white leading-none mb-1">
                {initialCategory ? 'Edit Category' : 'New Category'}
              </h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Enterprise Taxonomy Definition</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Category Name</label>
              <input 
                required
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white focus:border-violet-500 outline-none transition-all"
                placeholder="e.g., Electronics"
              />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">URL Slug</label>
              <input 
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white focus:border-violet-500 outline-none transition-all font-mono text-xs"
                placeholder="electronics"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Description</label>
            <textarea 
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white focus:border-violet-500 outline-none transition-all h-24 resize-none"
              placeholder="Detailed category description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Parent Category</label>
              <select 
                value={formData.parentId}
                onChange={(e) => {
                  const parent = categories.find(c => c.categoryId === e.target.value);
                  setFormData({ 
                    ...formData, 
                    parentId: e.target.value,
                    level: parent ? parent.level + 1 : 0 
                  });
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white focus:border-violet-500 outline-none transition-all"
              >
                <option value="">Root Level</option>
                {categories.filter(c => c.categoryId !== initialCategory?.categoryId).map(cat => (
                  <option key={cat.categoryId} value={cat.categoryId}>
                    {cat.level > 0 ? '—'.repeat(cat.level) + ' ' : ''}{cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</label>
              <select 
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as CategoryStatus })}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white focus:border-violet-500 outline-none transition-all"
              >
                <option value="active">Active</option>
                <option value="archived">Archived</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-8 p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-violet-600 focus:ring-violet-500"
              />
              <span className="text-xs font-bold text-white">Featured Category</span>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox"
                checked={formData.visibility === 'public'}
                onChange={(e) => setFormData({ ...formData, visibility: e.target.checked ? 'public' : 'private' })}
                className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-violet-600 focus:ring-violet-500"
              />
              <span className="text-xs font-bold text-white">Public Visibility</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all"
            >
              Discard
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-violet-600/20 flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {initialCategory ? 'Update Taxonomy' : 'Create Category'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
