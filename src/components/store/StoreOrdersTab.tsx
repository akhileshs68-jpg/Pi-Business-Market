import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { getFirebaseDb } from '../../firebase/config';
import { Order, OrderStatus, PaymentStatus, FulfillmentStatus } from '../../types';
import { orderService } from '../../services/orderService';
import { 
  FileText, 
  Search, 
  Filter, 
  Eye, 
  Printer, 
  CheckCircle2, 
  X, 
  Clock, 
  Truck, 
  CreditCard,
  RefreshCw,
  TrendingUp,
  SlidersHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../auth/useAuth';

interface StoreOrdersTabProps {
  storeId: string;
  businessId: string;
  onToast: (msg: string) => void;
}

export const StoreOrdersTab: React.FC<StoreOrdersTabProps> = ({ storeId, businessId, onToast }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Selected Order for Details Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  
  // Print Invoice State
  const [isPrintingInvoice, setIsPrintingInvoice] = useState<Order | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const db = getFirebaseDb();
      // Fetch business orders and filter for the specific store if stored
      const q = query(
        collection(db, 'orders'), 
        where('businessId', '==', businessId)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      // Filter for this store if storeId matches or fallback if empty
      const filtered = list.filter((ord: any) => !ord.storeId || ord.storeId === storeId);
      
      // Sort newest first
      filtered.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
        return dateB - dateA;
      });

      setOrders(filtered);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [storeId, businessId]);

  const loadOrderItems = async (orderId: string) => {
    setLoadingItems(true);
    try {
      const db = getFirebaseDb();
      const q = query(collection(db, 'orderItems'), where('orderId', '==', orderId));
      const snap = await getDocs(q);
      setOrderItems(snap.docs.map(doc => doc.data()));
    } catch (err) {
      console.error('Failed to fetch items:', err);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleOpenDetails = (ord: Order) => {
    setSelectedOrder(ord);
    loadOrderItems(ord.orderId);
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const db = getFirebaseDb();
      await orderService.updateOrderStatus(
        orderId, 
        status, 
        user?.uid || 'system', 
        user?.displayName || 'Merchant Manager',
        `Order status updated to ${status.replace('_', ' ')}`
      );
      onToast(`Order #${orderId.slice(-6)} is now ${status}!`);
      
      // Reload lists
      fetchOrders();
      if (selectedOrder && selectedOrder.orderId === orderId) {
        const updated = { ...selectedOrder, orderStatus: status };
        setSelectedOrder(updated);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handlePrint = (order: Order) => {
    setIsPrintingInvoice(order);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const filteredOrders = orders.filter(ord => {
    const matchesSearch = ord.orderId.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ord.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (ord.shippingAddress?.fullName || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && ord.orderStatus === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'All Orders', val: orders.length, color: 'text-indigo-400', bg: 'bg-indigo-600/10' },
          { label: 'Pending Payment', val: orders.filter(o => o.orderStatus === OrderStatus.PENDING_PAYMENT).length, color: 'text-amber-400', bg: 'bg-amber-600/10' },
          { label: 'Processing', val: orders.filter(o => o.orderStatus === OrderStatus.PROCESSING).length, color: 'text-blue-400', bg: 'bg-blue-600/10' },
          { label: 'Completed', val: orders.filter(o => o.orderStatus === OrderStatus.COMPLETED).length, color: 'text-emerald-400', bg: 'bg-emerald-600/10' },
          { label: 'Cancelled / Refunded', val: orders.filter(o => o.orderStatus === OrderStatus.CANCELLED || o.orderStatus === OrderStatus.REFUNDED).length, color: 'text-rose-400', bg: 'bg-rose-600/10' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-[#090e1a]/95 border border-slate-800 p-4 rounded-xl">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">{stat.label}</span>
            <p className="text-xl font-black text-white flex items-center justify-between">
              {stat.val}
              <span className={`w-2 h-2 rounded-full ${stat.color.replace('text', 'bg')}`} />
            </p>
          </div>
        ))}
      </div>

      <div className="bg-[#090e1a]/90 border border-slate-800/80 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" /> Orders Ledger
          </h4>

          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto overflow-x-auto">
            {[
              { id: 'all', label: 'All' },
              { id: OrderStatus.PENDING_PAYMENT, label: 'Pending' },
              { id: OrderStatus.PROCESSING, label: 'Processing' },
              { id: OrderStatus.COMPLETED, label: 'Completed' },
              { id: OrderStatus.CANCELLED, label: 'Cancelled' },
              { id: OrderStatus.REFUNDED, label: 'Refunded' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap transition-all ${
                  statusFilter === tab.id 
                    ? 'bg-indigo-600 border-indigo-500 text-white' 
                    : 'bg-[#030712] border-slate-800 text-slate-500 hover:text-slate-300'
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
            placeholder="Search orders ledger by ID, order number, or customer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#030712] border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-12 text-center text-slate-500">Loading Order Ledger...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-slate-800 rounded-xl text-slate-500">
            No orders match the current search filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-850 text-slate-500 uppercase tracking-widest font-extrabold text-[9px]">
                  <th className="py-3.5 px-4">Order info</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4 text-right">Total sum</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/40">
                {filteredOrders.map(ord => (
                  <tr key={ord.orderId} className="hover:bg-[#030712]/30 transition-all">
                    <td className="py-4 px-4">
                      <span className="text-[10px] font-mono text-indigo-400 block">{ord.orderNumber}</span>
                      <span className="text-[10px] text-slate-500 block">{new Date(ord.createdAt).toLocaleDateString()}</span>
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-300">
                      {ord.shippingAddress?.fullName || 'Walk-in Customer'}
                      <span className="text-[9px] text-slate-500 block font-normal">{ord.shippingAddress?.email || 'N/A'}</span>
                    </td>
                    <td className="py-4 px-4 text-right font-black text-white">
                      {ord.grandTotal?.toLocaleString()} <span className="text-[9px] text-slate-400 font-normal">{ord.currency || 'Pi'}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                        ord.orderStatus === OrderStatus.COMPLETED ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                        ord.orderStatus === OrderStatus.PROCESSING ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                        ord.orderStatus === OrderStatus.PENDING_PAYMENT ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                        'bg-rose-500/10 border-rose-500/20 text-rose-400'
                      }`}>
                        {ord.orderStatus?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenDetails(ord)}
                          className="p-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handlePrint(ord)}
                          className="p-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                          title="Invoice"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details & Action Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl bg-[#090e1a] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-850">
                <div>
                  <h3 className="text-lg font-black text-white">Order: {selectedOrder.orderNumber}</h3>
                  <p className="text-[10px] text-slate-500 font-semibold">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="p-1 text-slate-500 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Status Adjuster */}
                <div className="bg-[#030712] border border-slate-850 p-4 rounded-xl">
                  <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Lifecycle Progress</h5>
                  
                  <div className="space-y-2">
                    <div className="text-xs text-slate-400">Current Order State: <span className="font-bold text-white">{selectedOrder.orderStatus?.replace('_', ' ')}</span></div>
                    
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      <button 
                        onClick={() => updateOrderStatus(selectedOrder.orderId, OrderStatus.PROCESSING)}
                        className="px-2.5 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-[10px] font-bold uppercase hover:bg-blue-500 hover:text-white transition-all"
                      >
                        Process
                      </button>
                      <button 
                        onClick={() => updateOrderStatus(selectedOrder.orderId, OrderStatus.COMPLETED)}
                        className="px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-bold uppercase hover:bg-emerald-500 hover:text-white transition-all"
                      >
                        Complete
                      </button>
                      <button 
                        onClick={() => updateOrderStatus(selectedOrder.orderId, OrderStatus.CANCELLED)}
                        className="px-2.5 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-[10px] font-bold uppercase hover:bg-rose-500 hover:text-white transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>

                {/* Delivery Information */}
                <div className="bg-[#030712] border border-slate-850 p-4 rounded-xl">
                  <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Shipping Details</h5>
                  {selectedOrder.shippingAddress ? (
                    <div className="text-xs text-slate-300 space-y-1">
                      <p className="font-bold text-white">{selectedOrder.shippingAddress.fullName}</p>
                      <p>{selectedOrder.shippingAddress.street}</p>
                      <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.postalCode}</p>
                      <p className="text-[10px] text-slate-500">{selectedOrder.shippingAddress.phone}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No delivery address provided.</p>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div className="mb-6">
                <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Line Items</h5>
                {loadingItems ? (
                  <div className="text-center text-xs text-slate-500 py-4">Fetching order items...</div>
                ) : orderItems.length === 0 ? (
                  <div className="text-center text-xs text-slate-500 py-4">No item links found.</div>
                ) : (
                  <div className="space-y-3 bg-[#030712]/30 border border-slate-850 p-4 rounded-xl">
                    {orderItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs pb-3 border-b border-slate-850/30 last:border-0 last:pb-0">
                        <div>
                          <p className="font-bold text-white">{item.productName}</p>
                          <p className="text-[10px] text-slate-500">SKU: {item.sku || 'N/A'} | Qty: {item.quantity}</p>
                        </div>
                        <span className="font-bold text-white">{item.price?.toLocaleString()} Pi</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Order Invoice Totals */}
              <div className="bg-[#030712]/50 border border-slate-850 p-4 rounded-xl space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Subtotal</span>
                  <span>{selectedOrder.subtotal?.toLocaleString()} {selectedOrder.currency || 'Pi'}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-xs text-rose-400">
                    <span>Discount Coupon</span>
                    <span>-{selectedOrder.discount?.toLocaleString()} {selectedOrder.currency || 'Pi'}</span>
                  </div>
                )}
                {selectedOrder.tax > 0 && (
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Tax</span>
                    <span>+{selectedOrder.tax?.toLocaleString()} {selectedOrder.currency || 'Pi'}</span>
                  </div>
                )}
                {selectedOrder.shipping > 0 && (
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Shipping Charges</span>
                    <span>+{selectedOrder.shipping?.toLocaleString()} {selectedOrder.currency || 'Pi'}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-slate-800">
                  <span>Grand Total</span>
                  <span>{selectedOrder.grandTotal?.toLocaleString()} {selectedOrder.currency || 'Pi'}</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Ready-to-Print invoice modal structure (visible only during media print queries) */}
      <div className="hidden print:block fixed inset-0 bg-white text-black z-[200] p-10 font-sans">
        {isPrintingInvoice && (
          <div className="space-y-6">
            <div className="flex justify-between items-start border-b pb-6">
              <div>
                <h1 className="text-2xl font-bold">PI BUSINESS MARKET</h1>
                <p className="text-sm">Invoice # {isPrintingInvoice.orderNumber}</p>
                <p className="text-xs text-gray-500">Created: {new Date(isPrintingInvoice.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="text-right text-xs">
                <p className="font-bold">Store ID: {storeId}</p>
                <p>Status: {isPrintingInvoice.orderStatus}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 text-sm">
              <div>
                <h3 className="font-bold border-b pb-2 mb-2">Billing Address</h3>
                <p>{isPrintingInvoice.billingAddress?.fullName || 'Walk-in'}</p>
                <p>{isPrintingInvoice.billingAddress?.street}</p>
                <p>{isPrintingInvoice.billingAddress?.city}, {isPrintingInvoice.billingAddress?.state}</p>
              </div>
              <div>
                <h3 className="font-bold border-b pb-2 mb-2">Shipping Address</h3>
                <p>{isPrintingInvoice.shippingAddress?.fullName || 'Walk-in'}</p>
                <p>{isPrintingInvoice.shippingAddress?.street}</p>
                <p>{isPrintingInvoice.shippingAddress?.city}, {isPrintingInvoice.shippingAddress?.state}</p>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-bold mb-4">Invoice Line Items</h3>
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-2">Item</th>
                    <th className="py-2 text-center">Quantity</th>
                    <th className="py-2 text-right">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2">{item.productName}</td>
                      <td className="py-2 text-center">{item.quantity}</td>
                      <td className="py-2 text-right">{item.price?.toLocaleString()} Pi</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-6">
              <div className="w-64 space-y-2 text-sm border-t pt-4">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{isPrintingInvoice.subtotal?.toLocaleString()} Pi</span>
                </div>
                {isPrintingInvoice.discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount:</span>
                    <span>-{isPrintingInvoice.discount?.toLocaleString()} Pi</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base">
                  <span>Grand Total:</span>
                  <span>{isPrintingInvoice.grandTotal?.toLocaleString()} Pi</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
