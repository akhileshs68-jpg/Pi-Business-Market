/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderTree, 
  Settings, 
  Plus, 
  Search, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  ChevronRight, 
  ChevronDown,
  Layers,
  Tag,
  Eye,
  Archive,
  Loader2,
  HardDrive,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from '../components/Navbar';
import { catalogService } from '../services/catalogService';
import { useAuth } from '../auth/useAuth';
import { Category, AttributeGroup, ProductAttribute } from '../types';
import { CategoryWizard } from '../components/product/CategoryWizard';
import { seederService } from '../services/seederService';

export const CatalogManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [groups, setGroups] = useState<AttributeGroup[]>([]);
  const [allAttributes, setAllAttributes] = useState<ProductAttribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [activeTab, setActiveTab] = useState<'categories' | 'attributes'>('categories');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // Wizard States
  const [isCategoryWizardOpen, setIsCategoryWizardOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>(undefined);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cats, ags, attrs] = await Promise.all([
        catalogService.getCategories(),
        catalogService.getAttributeGroups(),
        catalogService.getAllAttributes()
      ]);
      setCategories(cats);
      setGroups(ags);
      setAllAttributes(attrs);
    } catch (err) {
      console.error('Failed to fetch catalog data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    if (!window.confirm('This will seed the initial enterprise taxonomy. Continue?')) return;
    setSeeding(true);
    await seederService.seedCatalog();
    await fetchData();
    setSeeding(false);
  };

  const toggleExpand = (id: string) => {
    const next = new Set(expandedCategories);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedCategories(next);
  };

  const rootCategories = categories.filter(c => !c.parentId);
  const getSubcategories = (parentId: string) => categories.filter(c => c.parentId === parentId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-violet-500/30">
      <Navbar 
        currentUser={user!}
        currentView="catalog"
        onNavigate={(view) => navigate(`/${view}`)}
        cartCount={0}
        walletBalance={100} // Simulated
        onWalletUpdate={() => {}}
        onToggleCart={() => {}}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-violet-600 rounded-2xl shadow-xl shadow-violet-600/20">
                <FolderTree className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-white tracking-tight">Catalog Engine</h1>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1 flex items-center gap-2">
                  <HardDrive className="w-3 h-3 text-violet-400" />
                  Enterprise Category & Attribute Management
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800">
            <button 
              onClick={() => setActiveTab('categories')}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'categories' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' : 'text-slate-500 hover:text-white'}`}
            >
              Categories
            </button>
            <button 
              onClick={() => setActiveTab('attributes')}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'attributes' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' : 'text-slate-500 hover:text-white'}`}
            >
              Attributes
            </button>
          </div>
        </header>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Rail: Stats & Quick Actions */}
            <div className="lg:col-span-1 space-y-6">
              <section className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm">
                <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-violet-400" />
                  Catalog Health
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Categories</p>
                    <p className="text-2xl font-black text-white">{categories.length}</p>
                  </div>
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Attr Groups</p>
                    <p className="text-2xl font-black text-white">{groups.length}</p>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-800">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Enterprise Utilities</h4>
                  <button 
                    onClick={handleSeed}
                    disabled={seeding}
                    className="w-full flex items-center justify-center gap-2 p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-slate-400 hover:text-white hover:border-violet-500/50 transition-all"
                  >
                    {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Seed Enterprise Taxonomy
                  </button>
                </div>
              </section>

              <button 
                onClick={() => {
                  setSelectedCategory(undefined);
                  setIsCategoryWizardOpen(true);
                }}
                className="w-full group p-6 bg-violet-600 hover:bg-violet-500 text-white rounded-3xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-violet-600/20 flex items-center justify-center gap-3"
              >
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                {activeTab === 'categories' ? 'Create Category' : 'New Attribute'}
              </button>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {activeTab === 'categories' ? (
                  <motion.div
                    key="cats"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    {rootCategories.length === 0 ? (
                      <div className="py-24 text-center bg-slate-900/30 border border-slate-800 border-dashed rounded-3xl">
                        <FolderTree className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">No Categories Found</h3>
                        <p className="text-slate-500 mb-8 max-w-xs mx-auto">Build your enterprise taxonomy by creating the first category.</p>
                        <button 
                          onClick={() => setIsCategoryWizardOpen(true)}
                          className="px-8 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                        >
                          Create First Category
                        </button>
                      </div>
                    ) : (
                      rootCategories.map(cat => (
                        <CategoryItem 
                          key={cat.categoryId} 
                          category={cat} 
                          expanded={expandedCategories.has(cat.categoryId)}
                          onToggle={() => toggleExpand(cat.categoryId)}
                          onEdit={(c) => {
                            setSelectedCategory(c);
                            setIsCategoryWizardOpen(true);
                          }}
                          onDelete={async (id) => {
                            if (window.confirm('Archive this category?')) {
                              await catalogService.deleteCategory(id);
                              fetchData();
                            }
                          }}
                          subcategories={getSubcategories(cat.categoryId)}
                          getAllSubs={getSubcategories}
                          expandedSet={expandedCategories}
                          toggleExpandFn={toggleExpand}
                        />
                      ))
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="attrs"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {groups.map(group => {
                      const groupAttrs = allAttributes.filter(a => a.groupId === group.groupId);
                      return (
                        <div key={group.groupId} className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden">
                          <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                            <h4 className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-tight">
                              <Tag className="w-4 h-4 text-violet-400" />
                              {group.name}
                            </h4>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                              {groupAttrs.length} Attributes
                            </span>
                          </div>
                          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {groupAttrs.map(attr => (
                              <div key={attr.attributeId} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between hover:border-violet-500/30 transition-all group">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-bold text-white text-sm">{attr.name}</p>
                                    {attr.required && <span className="w-1 h-1 bg-red-500 rounded-full" title="Required" />}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono text-violet-400 uppercase">{attr.dataType}</span>
                                    {attr.unit && <span className="text-[10px] text-slate-500 font-mono">({attr.unit})</span>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button className="p-1.5 text-slate-500 hover:text-white"><Edit2 className="w-3.5 h-3.5" /></button>
                                  <button className="p-1.5 text-slate-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              </div>
                            ))}
                            <button className="p-4 bg-slate-950/30 border border-slate-800 border-dashed rounded-2xl flex items-center justify-center gap-2 text-slate-600 hover:text-slate-400 hover:bg-slate-900/50 transition-all group">
                              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Add Attr to {group.name}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        <CategoryWizard 
          isOpen={isCategoryWizardOpen}
          onClose={() => setIsCategoryWizardOpen(false)}
          onSuccess={fetchData}
          initialCategory={selectedCategory}
          categories={categories}
        />
      </main>
    </div>
  );
};

const CategoryItem: React.FC<{ 
  category: Category; 
  expanded: boolean; 
  onToggle: () => void;
  onEdit: (cat: Category) => void;
  onDelete: (id: string) => void;
  subcategories: Category[];
  getAllSubs: (id: string) => Category[];
  expandedSet: Set<string>;
  toggleExpandFn: (id: string) => void;
}> = ({ category, expanded, onToggle, onEdit, onDelete, subcategories, getAllSubs, expandedSet, toggleExpandFn }) => {
  return (
    <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl overflow-hidden">
      <div 
        onClick={onToggle}
        className="p-4 flex items-center gap-4 hover:bg-slate-800/50 cursor-pointer transition-colors"
      >
        <div className={`transition-transform ${expanded ? 'rotate-90' : ''}`}>
          {subcategories.length > 0 ? <ChevronRight className="w-4 h-4 text-slate-500" /> : <div className="w-4" />}
        </div>
        
        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl">
          {category.icon || '📁'}
        </div>

        <div className="flex-1">
          <h4 className="font-bold text-white">{category.name}</h4>
          <p className="text-[10px] font-mono text-slate-500 uppercase">{category.slug}</p>
        </div>

        <div className="flex items-center gap-2">
          {category.featured && (
            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase rounded-lg border border-amber-500/20">Featured</span>
          )}
          <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase border ${
            category.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'
          }`}>
            {category.status}
          </span>
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(category); }}
            className="p-2 text-slate-500 hover:text-white rounded-lg"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(category.categoryId); }}
            className="p-2 text-slate-500 hover:text-red-400 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && subcategories.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-800/50 bg-slate-950/20 pl-8 pb-4"
          >
            <div className="space-y-2 mt-2 pr-4">
              {subcategories.map(sub => (
                <CategoryItem 
                  key={sub.categoryId} 
                  category={sub} 
                  expanded={expandedSet.has(sub.categoryId)}
                  onToggle={() => toggleExpandFn(sub.categoryId)} 
                  onEdit={onEdit}
                  onDelete={onDelete}
                  subcategories={getAllSubs(sub.categoryId)}
                  getAllSubs={getAllSubs}
                  expandedSet={expandedSet}
                  toggleExpandFn={toggleExpandFn}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
