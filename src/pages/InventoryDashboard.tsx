/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw,
  MoreVertical,
  History,
  Tag,
  Warehouse as WarehouseIcon,
  AlertCircle,
  Activity,
  ShieldCheck,
  Package,
  Loader2,
  Database,
  ArrowRightLeft,
  Settings2,
  Download,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from '../components/Navbar';
import { useAuth } from '../auth/useAuth';
import { inventoryService } from '../services/inventoryService';
import { warehouseService } from '../services/warehouseService';
import { Inventory, Warehouse, InventoryTransaction } from '../types';

export const InventoryDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const warehouseId = searchParams.get('warehouse');

  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Inventory | null>(null);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);

  useEffect(() => {
    if (warehouseId) {
      loadData();
    }
  }, [warehouseId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invData] = await Promise.all([
        inventoryService.getInventoryForWarehouse(warehouseId!)
      ]);
      setInventory(invData);
    } catch (err) {
      console.error('Failed to load inventory', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async (invId: string) => {
    try {
      const data = await inventoryService.getTransactions(invId);
      setTransactions(data);
    } catch (err) {
      console.error('Failed to load transactions', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <Navbar 
        currentUser={user!}
        currentView="inventory"
        onNavigate={(view) => navigate(`/${view}`)}
        cartCount={0}
        walletBalance={100}
        onWalletUpdate={() => {}}
        onToggleCart={() => {}}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-600/20 rounded-xl">
                <Database className="w-6 h-6 text-emerald-400" />
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight uppercase">Inventory Ledger</h1>
            </div>
            <p className="text-slate-500 font-medium">Enterprise SKU management and transactional stock auditing.</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all">
              <Upload className="w-4 h-4" /> Import
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between bg-slate-900/50 border border-slate-800 rounded-3xl p-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input 
                  placeholder="Scan Barcode or Search SKU..." 
                  className="w-full bg-transparent border-none pl-12 pr-4 py-2 text-sm text-white focus:ring-0 outline-none"
                />
              </div>
              <div className="flex items-center gap-2 border-l border-slate-800 pl-4 ml-4">
                <button className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
                  <Filter className="w-4 h-4" />
                </button>
                <button className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all" onClick={loadData}>
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
                <p className="text-sm font-black text-slate-600 uppercase tracking-widest animate-pulse">Syncing Ledger State...</p>
              </div>
            ) : inventory.length === 0 ? (
              <div className="py-32 text-center bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-[3rem]">
                <Box className="w-16 h-16 text-slate-700 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-white mb-2">No Stock Registered</h3>
                <p className="text-slate-500 max-w-sm mx-auto mb-10">Select a warehouse or register new products to populate the inventory system.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {inventory.map(item => (
                  <motion.div 
                    key={item.inventoryId}
                    layoutId={item.inventoryId}
                    onClick={() => {
                      setSelectedItem(item);
                      loadTransactions(item.inventoryId);
                    }}
                    className={`p-6 border rounded-3xl cursor-pointer transition-all ${
                      selectedItem?.inventoryId === item.inventoryId 
                      ? 'bg-indigo-600/10 border-indigo-500/50 shadow-lg shadow-indigo-600/10' 
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center">
                          <Package className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-white uppercase tracking-tight">{item.sku}</h4>
                          <div className="flex items-center gap-2">
                            <Tag className="w-3 h-3 text-slate-500" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Bin: {item.locationId}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-black ${item.availableStock <= item.reorderPoint ? 'text-red-400' : 'text-white'}`}>
                          {item.availableStock}
                        </p>
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Available Units</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      {[
                        { label: 'Reserved', value: item.reservedStock, color: 'text-amber-500' },
                        { label: 'Incoming', value: item.incomingStock, color: 'text-blue-500' },
                        { label: 'Damaged', value: item.damagedStock, color: 'text-red-500' },
                        { label: 'Min/Max', value: `${item.minimumStock}/${item.maximumStock}`, color: 'text-slate-500' },
                      ].map((stat, i) => (
                        <div key={i} className="p-3 bg-slate-950/50 border border-slate-800/50 rounded-2xl">
                          <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">{stat.label}</p>
                          <p className={`text-sm font-bold ${stat.color}`}>{stat.value}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Details Sidebar */}
          <div className="space-y-8">
            <AnimatePresence mode="wait">
              {selectedItem ? (
                <motion.div 
                  key="details"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-8"
                >
                  {/* Quick Actions */}
                  <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-[2.5rem]">
                    <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6">Stock Operations</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => setShowAdjustmentModal(true)}
                        className="flex flex-col items-center gap-3 p-4 bg-emerald-600/10 hover:bg-emerald-600 border border-emerald-500/20 text-emerald-400 hover:text-white rounded-3xl transition-all group"
                      >
                        <ArrowUpRight className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Adjustment</span>
                      </button>
                      <button className="flex flex-col items-center gap-3 p-4 bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 text-indigo-400 hover:text-white rounded-3xl transition-all group">
                        <ArrowRightLeft className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Transfer</span>
                      </button>
                    </div>
                  </div>

                  {/* Transaction History */}
                  <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-[2.5rem]">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Audit History</h3>
                      <History className="w-4 h-4 text-slate-700" />
                    </div>

                    <div className="space-y-6">
                      {transactions.length === 0 ? (
                        <div className="py-12 text-center">
                          <Activity className="w-10 h-10 text-slate-800 mx-auto mb-4" />
                          <p className="text-xs font-bold text-slate-600 uppercase">No recent movements</p>
                        </div>
                      ) : (
                        transactions.map(tx => (
                          <div key={tx.transactionId} className="flex gap-4 relative">
                            <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center border ${
                              ['stock-in', 'return'].includes(tx.transactionType) 
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                              : 'bg-red-500/10 border-red-500/20 text-red-400'
                            }`}>
                              {['stock-in', 'return'].includes(tx.transactionType) ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs font-black text-white uppercase truncate">{tx.transactionType.replace('-', ' ')}</p>
                                <p className="text-[10px] font-black text-slate-500">{tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}</p>
                              </div>
                              <p className="text-[10px] text-slate-500 font-medium truncate mb-1">{tx.reason}</p>
                              <p className="text-[9px] font-mono text-slate-700">{new Date(tx.timestamp).toLocaleString()}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="p-12 text-center bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-[3rem]">
                  <Settings2 className="w-12 h-12 text-slate-800 mx-auto mb-6" />
                  <p className="text-xs font-black text-slate-600 uppercase tracking-widest leading-relaxed">
                    Select a SKU from the ledger to view detailed analytics and performance history.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Stock Adjustment Modal */}
      {showAdjustmentModal && selectedItem && (
        <StockAdjustmentModal 
          inventory={selectedItem}
          onClose={() => setShowAdjustmentModal(false)}
          onSuccess={() => {
            setShowAdjustmentModal(false);
            loadData();
            loadTransactions(selectedItem.inventoryId);
          }}
        />
      )}
    </div>
  );
};

interface StockAdjustmentModalProps {
  inventory: Inventory;
  onClose: () => void;
  onSuccess: () => void;
}

const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({ inventory, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'adjustment' as any,
    quantity: 0,
    reason: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await inventoryService.adjustStock({
        inventoryId: inventory.inventoryId,
        type: formData.type,
        quantity: formData.quantity,
        userId: user!.uid,
        reason: formData.reason
      });
      onSuccess();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 border border-slate-800 rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl"
      >
        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Stock Correction</h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">SKU: {inventory.sku}</p>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-center min-w-[80px]">
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Current</p>
              <p className="text-xl font-black text-white">{inventory.availableStock}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Transaction Type</label>
              <select 
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-indigo-500 outline-none transition-all font-bold"
              >
                <option value="stock-in">Stock In (+)</option>
                <option value="stock-out">Stock Out (-)</option>
                <option value="damage">Damage (-)</option>
                <option value="return">Return (+)</option>
                <option value="adjustment">Manual Adjustment (Set)</option>
                <option value="correction">Correction (Audit)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Quantity</label>
              <input 
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-indigo-500 outline-none transition-all font-bold"
                placeholder="Enter volume..."
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Adjustment Reason</label>
              <textarea 
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-indigo-500 outline-none transition-all font-bold h-32 resize-none"
                placeholder="Why is this change occurring? (e.g., Physical cycle count discrepancy)"
                required
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-5 bg-slate-800 hover:bg-slate-700 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-[2] py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShieldCheck className="w-5 h-5" /> Commit to Ledger</>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
