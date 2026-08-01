import React, { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { getFirebaseDb } from '../../firebase/config';
import { 
  FolderTree, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  ArrowUpDown, 
  Layers, 
  ChevronRight, 
  X,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Category {
  id: string;
  name: string;
  slug: string;
  parentCategoryId?: string;
  sortingOrder: number;
  visible: boolean;
  storeId: string;
}

interface StoreCategoriesTabProps {
  storeId: string;
  onToast: (msg: string) => void;
}

export const StoreCategoriesTab: React.FC<StoreCategoriesTabProps> = ({ storeId, onToast }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create / Edit Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [parentCategoryId, setParentCategoryId] = useState('');
  const [sortingOrder, setSortingOrder] = useState<number>(0);
  const [visible, setVisible] = useState(true);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const db = getFirebaseDb();
      const q = query(collection(db, 'store_categories'), where('storeId', '==', storeId));
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      // Sort by sortingOrder first, then name
      list.sort((a, b) => (a.sortingOrder - b.sortingOrder) || a.name.localeCompare(b.name));
      setCategories(list);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [storeId]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setName('');
    setSlug('');
    setParentCategoryId('');
    setSortingOrder(categories.length * 10);
    setVisible(true);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setParentCategoryId(cat.parentCategoryId || '');
    setSortingOrder(cat.sortingOrder);
    setVisible(cat.visible);
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const db = getFirebaseDb();
      const finalSlug = slug.trim() || name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      const payload: Omit<Category, 'id'> = {
        storeId,
        name: name.trim(),
        slug: finalSlug,
        parentCategoryId: parentCategoryId || undefined,
        sortingOrder: Number(sortingOrder),
        visible
      };

      if (editingId) {
        await updateDoc(doc(db, 'store_categories', editingId), {
          ...payload,
          updatedAt: serverTimestamp()
        });
        onToast('Category updated successfully!');
      } else {
        const newDocRef = doc(collection(db, 'store_categories'));
        await setDoc(newDocRef, {
          ...payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        onToast('New Category created successfully!');
      }

      setIsFormOpen(false);
      fetchCategories();
    } catch (err) {
      console.error('Failed to save category:', err);
      alert('Error saving category');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category? Sub-categories and products won\'t be deleted but will lose their link.')) return;
    try {
      const db = getFirebaseDb();
      await deleteDoc(doc(db, 'store_categories', id));
      onToast('Category deleted successfully.');
      fetchCategories();
    } catch (err) {
      console.error('Failed to delete category:', err);
    }
  };

  const toggleVisibility = async (cat: Category) => {
    try {
      const db = getFirebaseDb();
      await updateDoc(doc(db, 'store_categories', cat.id), {
        visible: !cat.visible,
        updatedAt: serverTimestamp()
      });
      onToast(`Category visibility changed!`);
      fetchCategories();
    } catch (err) {
      console.error('Failed to toggle visibility:', err);
    }
  };

  // Build parent hierarchical tree mapping
  const parentCategories = categories.filter(c => !c.parentCategoryId);
  const getSubcategories = (parentId: string) => categories.filter(c => c.parentCategoryId === parentId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-indigo-400" /> Catalog Category Management
          </h3>
          <p className="text-xs text-slate-400">Organize and structure items into custom departments and hierarchical catalogs.</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg"
        >
          <Plus className="w-4 h-4" /> Add Custom Category
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500">Loading Categories...</div>
      ) : categories.length === 0 ? (
        <div className="py-16 text-center bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
          <FolderTree className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <h4 className="text-sm font-bold text-slate-300">No Custom Categories Defined</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">Create structural tags or parent departments to organize your catalog products.</p>
          <button 
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-[#030712] border border-slate-800 text-indigo-400 text-xs font-bold rounded-xl"
          >
            Create Your First Category
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Category Tree Hierarchy (2 Columns) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#090e1a]/90 border border-slate-800/80 rounded-2xl p-6">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-500" /> Structure & Hierarchy
              </h4>
              
              <div className="space-y-3">
                {parentCategories.map(parent => {
                  const subs = getSubcategories(parent.id);
                  return (
                    <div key={parent.id} className="border border-slate-800/60 rounded-xl overflow-hidden bg-[#030712]/40">
                      {/* Parent Item */}
                      <div className="flex items-center justify-between p-4 bg-[#030712]/80">
                        <div className="flex items-center gap-3">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-md shadow-indigo-500/20" />
                          <div>
                            <span className="text-sm font-bold text-white">{parent.name}</span>
                            <span className="text-[10px] font-mono text-slate-500 block">/{parent.slug}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-500 px-2 py-0.5 bg-slate-900 border border-slate-800 rounded-md">Order: {parent.sortingOrder}</span>
                          <button 
                            onClick={() => toggleVisibility(parent)}
                            className={`p-1.5 rounded-lg border transition-all ${
                              parent.visible ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' : 'text-slate-500 bg-slate-900 border-slate-800'
                            }`}
                            title="Toggle Visibility"
                          >
                            {parent.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                          <button 
                            onClick={() => handleOpenEdit(parent)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg border border-transparent hover:border-slate-800 transition-all"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(parent.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg border border-transparent hover:border-rose-500/20 transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Subcategories */}
                      {subs.length > 0 && (
                        <div className="p-3 pl-8 border-t border-slate-800/40 space-y-2">
                          {subs.map(sub => (
                            <div key={sub.id} className="flex items-center justify-between p-2.5 bg-slate-900/40 border border-slate-850 rounded-lg">
                              <div className="flex items-center gap-2">
                                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                                <div>
                                  <span className="text-xs font-bold text-slate-300">{sub.name}</span>
                                  <span className="text-[9px] font-mono text-slate-500 block">/{sub.slug}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] text-slate-600 font-medium">Order: {sub.sortingOrder}</span>
                                <button 
                                  onClick={() => toggleVisibility(sub)}
                                  className={`p-1 rounded transition-all ${
                                    sub.visible ? 'text-indigo-400' : 'text-slate-600'
                                  }`}
                                >
                                  {sub.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                </button>
                                <button 
                                  onClick={() => handleOpenEdit(sub)}
                                  className="text-slate-500 hover:text-white"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button 
                                  onClick={() => handleDelete(sub.id)}
                                  className="text-slate-500 hover:text-rose-400"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Info & Stats */}
          <div className="space-y-6">
            <div className="bg-[#090e1a]/90 border border-slate-800/80 rounded-2xl p-6">
              <h4 className="text-sm font-bold text-white mb-3">Hierarchy Guidelines</h4>
              <ul className="text-xs text-slate-400 space-y-2 leading-relaxed list-disc pl-4">
                <li>Create top-level folders (e.g. "Footwear", "Hardware") first.</li>
                <li>Assign child sub-categories (e.g. "Sneakers" parented to "Footwear") to create hierarchical paths.</li>
                <li>Use **Sorting Order** to define custom display sequencing on client store interfaces (smaller numbers appear first).</li>
                <li>Toggle visibility off to temporarily hide items under maintenance.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Category Creation Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-[#090e1a]/95 backdrop-blur-md border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">{editingId ? 'Edit Category' : 'New Custom Category'}</h3>
                <button 
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 text-slate-500 hover:text-white rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Category Name</label>
                  <input 
                    type="text" 
                    required 
                    value={name} 
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!editingId) {
                        setSlug(e.target.value.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'));
                      }
                    }} 
                    className="w-full bg-[#030712] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                    placeholder="e.g. Leather Boots, Premium Coffee"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Custom Slug</label>
                  <input 
                    type="text" 
                    value={slug} 
                    onChange={(e) => setSlug(e.target.value)} 
                    className="w-full bg-[#030712] border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-indigo-500 transition-all"
                    placeholder="e.g. leather-boots"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Parent Category (Optional)</label>
                  <select 
                    value={parentCategoryId} 
                    onChange={(e) => setParentCategoryId(e.target.value)} 
                    className="w-full bg-[#030712] border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-300 focus:outline-none focus:border-indigo-500 transition-all"
                  >
                    <option value="">No Parent (Top-Level Category)</option>
                    {categories.filter(c => !c.parentCategoryId && c.id !== editingId).map(parent => (
                      <option key={parent.id} value={parent.id}>{parent.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Sorting Order</label>
                    <input 
                      type="number" 
                      value={sortingOrder} 
                      onChange={(e) => setSortingOrder(Number(e.target.value))} 
                      className="w-full bg-[#030712] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Visibility State</label>
                    <button 
                      type="button" 
                      onClick={() => setVisible(!visible)}
                      className={`w-full py-3 rounded-xl border text-xs font-bold transition-all uppercase tracking-wider ${
                        visible ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}
                    >
                      {visible ? 'Publicly Visible' : 'Hidden / Hidden'}
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-850 flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsFormOpen(false)} 
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" /> {editingId ? 'Save Edits' : 'Create Category'}
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
