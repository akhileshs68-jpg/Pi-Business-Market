import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  orderBy,
  limit 
} from 'firebase/firestore';
import { getFirebaseDb } from '../../firebase/config';
import { Product } from '../../types';
import { productService } from '../../services/productService';
import { 
  Package, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Plus,
  Minus,
  Check,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../auth/useAuth';

interface InventoryLog {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: 'addition' | 'reduction' | 'correction';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  operatorName: string;
  createdAt: any;
}

interface StoreInventoryTabProps {
  storeId: string;
  products: Product[];
  onRefreshProducts: () => void;
  onToast: (msg: string) => void;
}

export const StoreInventoryTab: React.FC<StoreInventoryTabProps> = ({ 
  storeId, 
  products, 
  onRefreshProducts, 
  onToast 
}) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  
  // Adjustment Modal State
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustmentQty, setAdjustmentQty] = useState<number>(0);
  const [adjustmentType, setAdjustmentType] = useState<'addition' | 'reduction' | 'correction'>('addition');
  const [adjustmentReason, setAdjustmentReason] = useState('Routine restocking cycle');

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const db = getFirebaseDb();
      const q = query(
        collection(db, 'store_inventory_logs'), 
        where('storeId', '==', storeId),
        orderBy('createdAt', 'desc'),
        limit(25)
      );
      const snap = await getDocs(q);
      setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryLog)));
    } catch (err) {
      console.error('Failed to fetch inventory logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [storeId]);

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;

    const currentStock = adjustingProduct.stock || 0;
    let newStock = currentStock;

    if (adjustmentType === 'addition') {
      newStock += adjustmentQty;
    } else if (adjustmentType === 'reduction') {
      newStock = Math.max(0, currentStock - adjustmentQty);
    } else {
      newStock = Math.max(0, adjustmentQty);
    }

    try {
      // 1. Update Product stock in DB
      await productService.updateProduct(adjustingProduct.productId, {
        stock: newStock,
        stockStatus: newStock === 0 ? 'out_of_stock' : (newStock < 10 ? 'on_backorder' : 'in_stock')
      });

      // 2. Log Transaction
      const db = getFirebaseDb();
      await addDoc(collection(db, 'store_inventory_logs'), {
        storeId,
        productId: adjustingProduct.productId,
        productName: adjustingProduct.productName,
        sku: adjustingProduct.sku,
        type: adjustmentType,
        quantity: adjustmentType === 'correction' ? adjustmentQty : adjustmentQty,
        previousStock: currentStock,
        newStock,
        reason: adjustmentReason,
        operatorName: user?.displayName || user?.username || 'Operator',
        createdAt: serverTimestamp()
      });

      onToast(`Stock adjusted successfully to ${newStock} units!`);
      setAdjustingProduct(null);
      setAdjustmentQty(0);
      onRefreshProducts();
      fetchLogs();
    } catch (err) {
      console.error('Adjustment failed:', err);
      alert('Failed to update inventory.');
    }
  };

  // Compute stats
  const totalStockItems = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  const outOfStockItems = products.filter(p => (p.stock || 0) === 0).length;
  const lowStockItems = products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 10).length;

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.productName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'out_of_stock') return matchesSearch && (p.stock || 0) === 0;
    if (statusFilter === 'low_stock') return matchesSearch && (p.stock || 0) > 0 && (p.stock || 0) <= 10;
    if (statusFilter === 'in_stock') return matchesSearch && (p.stock || 0) > 10;
    return matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#090e1a]/95 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Current Stock Sum</span>
            <p className="text-3xl font-black text-white">{totalStockItems} <span className="text-xs text-slate-500">Units</span></p>
          </div>
          <div className="p-3.5 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#090e1a]/95 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Low Stock Alerts</span>
            <p className="text-3xl font-black text-amber-500">{lowStockItems} <span className="text-xs text-slate-500">SKUs</span></p>
          </div>
          <div className="p-3.5 bg-amber-600/10 border border-amber-500/20 text-amber-400 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#090e1a]/95 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Out of Stock</span>
            <p className="text-3xl font-black text-rose-500">{outOfStockItems} <span className="text-xs text-slate-500">SKUs</span></p>
          </div>
          <div className="p-3.5 bg-rose-600/10 border border-rose-500/20 text-rose-400 rounded-xl">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Inventory Management Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#090e1a]/90 border border-slate-800/80 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-400" /> Active Inventory Logs
              </h4>

              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                {[
                  { id: 'all', label: 'All items' },
                  { id: 'in_stock', label: 'In stock' },
                  { id: 'low_stock', label: 'Low Stock' },
                  { id: 'out_of_stock', label: 'Out of stock' }
                ].map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap transition-all ${
                      statusFilter === tab.id 
                        ? 'bg-indigo-600 border-indigo-500 text-white' 
                        : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <input 
                type="text" 
                placeholder="Search catalog inventory by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#030712] border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            </div>

            {/* List */}
            <div className="space-y-3">
              {filteredProducts.map(p => {
                const stockVal = p.stock || 0;
                let badgeClass = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
                let statusLabel = 'In Stock';

                if (stockVal === 0) {
                  badgeClass = 'bg-rose-500/10 border-rose-500/20 text-rose-400';
                  statusLabel = 'Out of Stock';
                } else if (stockVal <= 10) {
                  badgeClass = 'bg-amber-500/10 border-amber-500/20 text-amber-400';
                  statusLabel = 'Low Stock';
                }

                return (
                  <div key={p.productId} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-[#030712]/40 border border-slate-800/80 rounded-xl hover:border-slate-700 transition-all gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 overflow-hidden shrink-0 border border-slate-800">
                        {(p.mainImage || p.imageUrls?.[0]) ? (
                          <img src={p.mainImage || p.imageUrls?.[0]} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-indigo-600/10 text-indigo-400 font-bold text-xs">PI</div>
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-indigo-400 block mb-0.5">{p.sku}</span>
                        <h5 className="text-xs font-black text-white">{p.productName}</h5>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mt-0.5">{p.category}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 justify-between w-full sm:w-auto">
                      <div className="text-left sm:text-right">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Level</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-white">{stockVal} <span className="text-[10px] font-normal text-slate-400">pcs</span></span>
                          <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${badgeClass}`}>{statusLabel}</span>
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          setAdjustingProduct(p);
                          setAdjustmentQty(0);
                          setAdjustmentType('addition');
                          setAdjustmentReason('Stock refilling');
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all"
                      >
                        Adjust Stock
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* History Log Trail */}
        <div className="space-y-4">
          <div className="bg-[#090e1a]/90 border border-slate-800/80 rounded-2xl p-6">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <History className="w-4 h-4 text-indigo-400" /> Stock Audit Trail
            </h4>

            {loadingLogs ? (
              <div className="py-10 text-center text-xs text-slate-500">Loading trail logs...</div>
            ) : logs.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                No stock adjustments logged yet.
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
                {logs.map(log => (
                  <div key={log.id} className="p-3 bg-[#030712]/60 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[10px] font-mono text-slate-500 block">{log.sku}</span>
                        <h5 className="text-[11px] font-bold text-white truncate max-w-[150px]">{log.productName}</h5>
                      </div>
                      <div className="flex items-center gap-1">
                        {log.type === 'addition' && <span className="flex items-center text-emerald-400 text-[10px] font-bold"><ArrowUpRight className="w-3.5 h-3.5" /> +{log.quantity}</span>}
                        {log.type === 'reduction' && <span className="flex items-center text-rose-400 text-[10px] font-bold"><ArrowDownLeft className="w-3.5 h-3.5" /> -{log.quantity}</span>}
                        {log.type === 'correction' && <span className="flex items-center text-amber-400 text-[10px] font-bold">Correction ({log.newStock})</span>}
                      </div>
                    </div>
                    
                    <p className="text-[10px] text-slate-400 leading-relaxed italic">"{log.reason}"</p>

                    <div className="flex justify-between items-center pt-1 text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                      <span>By {log.operatorName}</span>
                      <span>{log.createdAt?.toDate ? log.createdAt.toDate().toLocaleDateString() : 'Just now'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Adjust Inventory Modal */}
      <AnimatePresence>
        {adjustingProduct && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAdjustingProduct(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-[#090e1a]/95 backdrop-blur-md border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-black text-white">Adjust Stock</h3>
                  <p className="text-[10px] font-mono text-indigo-400 mt-0.5">{adjustingProduct.sku}</p>
                </div>
                <button 
                  onClick={() => setAdjustingProduct(null)}
                  className="p-1 text-slate-500 hover:text-white rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAdjustStock} className="space-y-5">
                <div className="p-4 bg-[#030712] border border-slate-800 rounded-xl flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400">Current Stock Level</span>
                  <span className="text-sm font-extrabold text-white">{adjustingProduct.stock || 0} Units</span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Adjustment Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'addition', label: 'Receive / Add' },
                      { id: 'reduction', label: 'Dispatch / Remove' },
                      { id: 'correction', label: 'Force Count' }
                    ].map(type => (
                      <button 
                        key={type.id}
                        type="button"
                        onClick={() => {
                          setAdjustmentType(type.id as any);
                          setAdjustmentQty(0);
                        }}
                        className={`py-2 px-1 rounded-xl border text-[10px] font-bold uppercase tracking-wider text-center transition-all ${
                          adjustmentType === type.id 
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' 
                            : 'bg-[#030712] border-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Quantity</label>
                  <div className="flex items-center gap-3">
                    <button 
                      type="button" 
                      onClick={() => setAdjustmentQty(prev => Math.max(0, prev - 1))}
                      className="p-3 bg-[#030712] border border-slate-800 rounded-xl text-slate-300 hover:text-white hover:border-slate-700"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input 
                      type="number" 
                      required 
                      min="0"
                      value={adjustmentQty} 
                      onChange={(e) => setAdjustmentQty(Math.max(0, Number(e.target.value)))} 
                      className="w-full bg-[#030712] border border-slate-800 rounded-xl px-4 py-3 text-center text-sm text-white font-extrabold focus:outline-none focus:border-indigo-500"
                    />
                    <button 
                      type="button" 
                      onClick={() => setAdjustmentQty(prev => prev + 1)}
                      className="p-3 bg-[#030712] border border-slate-800 rounded-xl text-slate-300 hover:text-white hover:border-slate-700"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Adjustment Reason</label>
                  <select 
                    value={adjustmentReason} 
                    onChange={(e) => setAdjustmentReason(e.target.value)} 
                    className="w-full bg-[#030712] border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-300 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Restocking order arrival">Restocking order arrival</option>
                    <option value="Damaged inventory audit exclusion">Damaged inventory audit exclusion</option>
                    <option value="Manual stocktake audit correction">Manual stocktake audit correction</option>
                    <option value="Return to vendor batch exclusion">Return to vendor batch exclusion</option>
                    <option value="Fulfillment checkout manual bypass">Fulfillment checkout manual bypass</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-slate-850 flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setAdjustingProduct(null)} 
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Apply Adjustment
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
