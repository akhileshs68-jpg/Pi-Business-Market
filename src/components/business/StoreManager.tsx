/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, Store as StoreIcon, Search, Loader2, Tag, 
  Layers, ChevronRight, ChevronDown, CheckCircle2, AlertCircle, 
  HelpCircle, Archive, Trash, X, ArrowUpRight, BarChart3, Users, 
  MapPin, Phone, Mail, Globe, Pause, Play, ShoppingBag
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { storeService } from '../../services/storeService';
import { Store } from '../../types';
import { StoreWizard } from '../store/StoreWizard';
import { motion, AnimatePresence } from 'motion/react';

export const StoreManager: React.FC = () => {
  const { currentBusiness, stores, refreshWorkspace } = useBusiness();
  const [loading, setLoading] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form edit states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editData, setEditData] = useState({
    storeName: '',
    description: '',
    storeCategory: '',
    email: '',
    phone: '',
    website: '',
    logoUrl: '',
    coverImageUrl: '',
    city: '',
    country: ''
  });

  const [savingEdit, setSavingEdit] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleOpenEdit = (store: Store) => {
    setEditingStore(store);
    setEditData({
      storeName: store.storeName || '',
      description: store.description || '',
      storeCategory: store.storeCategory || 'General Retail',
      email: store.email || '',
      phone: store.phone || '',
      website: store.website || '',
      logoUrl: store.logoUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500',
      coverImageUrl: store.coverImageUrl || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1000',
      city: store.city || '',
      country: store.country || ''
    });
    setErrorMsg(null);
    setIsEditOpen(true);
  };

  const handleTogglePause = async (store: Store) => {
    setActionLoading(store.storeId);
    try {
      const nextStatus = store.status === 'archived' ? 'active' : 'archived';
      await storeService.updateStore(store.storeId, { status: nextStatus as any });
      await refreshWorkspace();
    } catch (err) {
      console.error('Failed to toggle store status:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStore) return;

    setSavingEdit(true);
    setErrorMsg(null);
    try {
      await storeService.updateStore(editingStore.storeId, editData);
      setIsEditOpen(false);
      await refreshWorkspace();
    } catch (err: any) {
      console.error('Failed to update store:', err);
      setErrorMsg(err.message || 'An error occurred while updating the store.');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80">
        <div>
          <h4 className="text-sm font-black text-white">Commercial Outlet Workstations</h4>
          <p className="text-xs text-slate-400">Configure fulfillment, branding assets, and status metrics.</p>
        </div>

        <button
          type="button"
          onClick={() => setShowWizard(true)}
          className="min-h-[44px] px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer self-start sm:self-auto shadow-md shadow-violet-600/20 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
          aria-label="Add new store outlet"
        >
          <Plus className="w-4 h-4" />
          Add Store Outlet
        </button>
      </div>

      {/* Stores List */}
      {stores.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {stores.map(s => {
            const isPaused = s.status === 'archived';
            return (
              <div 
                key={s.storeId}
                className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 space-y-6 hover:border-slate-700/80 transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-violet-600/10 border border-violet-500/20 rounded-2xl">
                        <StoreIcon className="w-5 h-5 text-violet-400" />
                      </div>
                      <div>
                        <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                          {s.storeName}
                          {isPaused && (
                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[8px] uppercase font-bold rounded-full">
                              Paused
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-slate-400">{s.city || 'Central Outlet'}, {s.country || 'Global'}</p>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 text-[9px] font-bold rounded-full border ${
                      s.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    }`}>
                      {s.status || 'Active'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2">{s.description || 'Primary merchant fulfillment workstation.'}</p>

                  {/* Micro-Analytics Section */}
                  <div className="grid grid-cols-3 gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
                    <div className="text-center">
                      <span className="text-[9px] text-slate-500 uppercase font-bold block">Followers</span>
                      <span className="text-xs font-bold text-white mt-0.5 block">{s.followers || 0}</span>
                    </div>
                    <div className="text-center border-x border-slate-800/80">
                      <span className="text-[9px] text-slate-500 uppercase font-bold block">Rating</span>
                      <span className="text-xs font-bold text-amber-400 mt-0.5 block">★ {s.rating || '5.0'}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[9px] text-slate-500 uppercase font-bold block">Outlet Type</span>
                      <span className="text-[10px] font-bold text-violet-400 mt-0.5 block truncate capitalize">{s.storeType || 'Retail'}</span>
                    </div>
                  </div>

                  {/* Brand Assets */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate max-w-[120px]">{s.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>{s.phone || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => handleTogglePause(s)}
                    disabled={actionLoading === s.storeId}
                    className="min-h-[44px] px-3.5 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 flex-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none disabled:opacity-50"
                    aria-label={isPaused ? `Resume outlet ${s.storeName}` : `Pause outlet ${s.storeName}`}
                  >
                    {isPaused ? (
                      <>
                        <Play className="w-4 h-4 text-emerald-400" /> Resume Outlet
                      </>
                    ) : (
                      <>
                        <Pause className="w-4 h-4 text-amber-400" /> Pause Outlet
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(s)}
                    className="min-h-[44px] min-w-[44px] p-2.5 bg-slate-950 hover:bg-violet-600/10 border border-slate-800 hover:border-violet-500/20 text-violet-400 rounded-xl transition-all flex items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                    aria-label={`Edit configuration for ${s.storeName}`}
                    title="Edit Store Configuration"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center bg-slate-900/20 rounded-2xl border border-dashed border-slate-800">
          <StoreIcon className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <h4 className="text-base font-bold text-white">No Outlets Formed</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-6">Create physical or digital stores to categorize inventory distribution.</p>
          <button 
            type="button"
            onClick={() => setShowWizard(true)}
            className="min-h-[44px] px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl shadow-md shadow-violet-600/20 cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
          >
            Launch First Outlet
          </button>
        </div>
      )}

      {/* Wizard Modal */}
      {showWizard && (
        <StoreWizard 
          onComplete={async () => {
            setShowWizard(false);
            await refreshWorkspace();
          }}
          onCancel={() => setShowWizard(false)}
        />
      )}

      {/* Edit Store Modal */}
      <AnimatePresence>
        {isEditOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 sm:p-8 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-black text-white">Edit Store Configuration</h3>
                  <p className="text-xs text-slate-500">Update branding assets, fulfillment contact, and geo-presence.</p>
                </div>
                <button 
                  onClick={() => setIsEditOpen(false)}
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

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="edit-store-name" className="text-xs font-bold text-slate-300">Store Outlet Name *</label>
                  <input 
                    id="edit-store-name"
                    type="text" 
                    required
                    value={editData.storeName}
                    onChange={(e) => setEditData(prev => ({ ...prev, storeName: e.target.value }))}
                    className="w-full min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="edit-store-cat" className="text-xs font-bold text-slate-300">Category / Industry *</label>
                  <input 
                    id="edit-store-cat"
                    type="text" 
                    required
                    value={editData.storeCategory}
                    onChange={(e) => setEditData(prev => ({ ...prev, storeCategory: e.target.value }))}
                    className="w-full min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none transition-all"
                    placeholder="e.g. Groceries, Tech Accessories"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="edit-store-desc" className="text-xs font-bold text-slate-300">Description *</label>
                  <textarea 
                    id="edit-store-desc"
                    required
                    rows={3}
                    value={editData.description}
                    onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full min-h-[90px] bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none transition-all resize-y"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="edit-store-email" className="text-xs font-bold text-slate-300">Contact Email *</label>
                    <input 
                      id="edit-store-email"
                      type="email" 
                      required
                      value={editData.email}
                      onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="edit-store-phone" className="text-xs font-bold text-slate-300">Contact Phone *</label>
                    <input 
                      id="edit-store-phone"
                      type="text" 
                      required
                      value={editData.phone}
                      onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="edit-store-city" className="text-xs font-bold text-slate-300">City</label>
                    <input 
                      id="edit-store-city"
                      type="text" 
                      value={editData.city}
                      onChange={(e) => setEditData(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="edit-store-country" className="text-xs font-bold text-slate-300">Country</label>
                    <input 
                      id="edit-store-country"
                      type="text" 
                      value={editData.country}
                      onChange={(e) => setEditData(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-5">
                  <button 
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="min-h-[44px] px-5 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={savingEdit}
                    className="min-h-[44px] px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                  >
                    {savingEdit && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save Specifications
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
