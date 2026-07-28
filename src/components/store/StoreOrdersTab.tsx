import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  getDocs, 
  query, 
  where
} from 'firebase/firestore';
import { getFirebaseDb } from '../../firebase/config';
import { Order, OrderStatus, PaymentStatus, OrderHistoryLog, LogisticsDetails } from '../../types';
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
  MoreVertical,
  Package,
  Calendar,
  AlertTriangle,
  ChevronDown
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
  
  // Advanced Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [courierFilter, setCourierFilter] = useState<string>('all');
  
  // Bulk Actions
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  
  // Selected Order for Details Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  
  // Print Invoice State
  const [isPrintingInvoice, setIsPrintingInvoice] = useState<Order | null>(null);
  const [isPrintingPackingSlip, setIsPrintingPackingSlip] = useState<Order | null>(null);

  // Update Status Modal
  const [updatingStatusFor, setUpdatingStatusFor] = useState<Order | null>(null);
  const [newStatusValue, setNewStatusValue] = useState<OrderStatus>(OrderStatus.NEW_ORDER);
  const [statusRemarks, setStatusRemarks] = useState('');

  // Update Logistics Modal
  const [updatingLogisticsFor, setUpdatingLogisticsFor] = useState<Order | null>(null);
  const [logisticsForm, setLogisticsForm] = useState<Partial<LogisticsDetails>>({});

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const db = getFirebaseDb();
      const q = query(
        collection(db, 'orders'), 
        where('businessId', '==', businessId)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      const filtered = list.filter((ord: any) => !ord.storeId || ord.storeId === storeId);
      
      filtered.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
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
      const items = await orderService.getOrderItems(orderId);
      setOrderItems(items);
    } catch (err) {
      console.error('Failed to fetch items:', err);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingStatusFor || !user) return;
    try {
      await orderService.updateOrderStatus(
        updatingStatusFor.orderId,
        newStatusValue,
        user.uid,
        user.displayName || 'Merchant',
        statusRemarks
      );
      onToast(`Status updated to ${newStatusValue}`);
      setUpdatingStatusFor(null);
      if (selectedOrder?.orderId === updatingStatusFor.orderId) {
        const updated = await orderService.getOrder(updatingStatusFor.orderId);
        setSelectedOrder(updated);
      }
      fetchOrders();
    } catch (err) {
      onToast('Failed to update status');
      console.error(err);
    }
  };

  const handleUpdateLogistics = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingLogisticsFor || !user) return;
    try {
      await orderService.updateLogisticsDetails(
        updatingLogisticsFor.orderId,
        logisticsForm,
        user.uid,
        user.displayName || 'Merchant'
      );
      onToast('Logistics updated');
      setUpdatingLogisticsFor(null);
      if (selectedOrder?.orderId === updatingLogisticsFor.orderId) {
        const updated = await orderService.getOrder(updatingLogisticsFor.orderId);
        setSelectedOrder(updated);
      }
      fetchOrders();
    } catch (err) {
      onToast('Failed to update logistics');
      console.error(err);
    }
  };

  const toggleOrderSelection = (id: string) => {
    const next = new Set(selectedOrderIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedOrderIds(next);
  };

  const toggleAllSelection = () => {
    if (selectedOrderIds.size === filteredOrders.length) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(filteredOrders.map(o => o.orderId)));
    }
  };

  const handleBulkStatusUpdate = async (status: OrderStatus) => {
    if (!user || selectedOrderIds.size === 0) return;
    if (!window.confirm(`Update ${selectedOrderIds.size} orders to ${status}?`)) return;
    
    let count = 0;
    for (const id of Array.from(selectedOrderIds)) {
      try {
        await orderService.updateOrderStatus(id, status, user.uid, user.displayName || 'Merchant', 'Bulk Update');
        count++;
      } catch (err) {
        console.error(err);
      }
    }
    onToast(`Successfully updated ${count} orders`);
    setSelectedOrderIds(new Set());
    fetchOrders();
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchSearch = 
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.shippingAddress?.fullName?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchStatus = statusFilter === 'all' || order.orderStatus === statusFilter;
      const matchCourier = courierFilter === 'all' || order.logistics?.courierName === courierFilter;
      
      return matchSearch && matchStatus && matchCourier;
    });
  }, [orders, searchQuery, statusFilter, courierFilter]);

  const getStatusColor = (status: OrderStatus) => {
    switch(status) {
      case OrderStatus.PENDING_PAYMENT: return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case OrderStatus.PAYMENT_VERIFIED: return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case OrderStatus.NEW_ORDER: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case OrderStatus.ACCEPTED: return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case OrderStatus.PACKED: return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
      case OrderStatus.READY_FOR_PICKUP: return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      case OrderStatus.SHIPPED: return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case OrderStatus.OUT_FOR_DELIVERY: return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case OrderStatus.DELIVERED: return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case OrderStatus.COMPLETED: return 'bg-green-500/20 text-green-400 border-green-500/30';
      case OrderStatus.CANCELLED: return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case OrderStatus.RETURNED: return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-20">
      
      {/* Header & Metrics */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-violet-400" /> Order Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">Manage lifecycle, logistics, and shipments.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchOrders} className="p-2 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors">
            <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Analytics Mini-board */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#030712]/50 border border-slate-850 p-4 rounded-[20px]">
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Total Orders</p>
          <p className="text-2xl font-black text-white">{orders.length}</p>
        </div>
        <div className="bg-[#030712]/50 border border-slate-850 p-4 rounded-[20px]">
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Pending Processing</p>
          <p className="text-2xl font-black text-amber-400">
            {orders.filter(o => o.orderStatus === OrderStatus.NEW_ORDER || o.orderStatus === OrderStatus.ACCEPTED).length}
          </p>
        </div>
        <div className="bg-[#030712]/50 border border-slate-850 p-4 rounded-[20px]">
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">In Transit</p>
          <p className="text-2xl font-black text-sky-400">
            {orders.filter(o => o.orderStatus === OrderStatus.SHIPPED || o.orderStatus === OrderStatus.OUT_FOR_DELIVERY).length}
          </p>
        </div>
        <div className="bg-[#030712]/50 border border-slate-850 p-4 rounded-[20px]">
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Completed</p>
          <p className="text-2xl font-black text-emerald-400">
            {orders.filter(o => o.orderStatus === OrderStatus.COMPLETED).length}
          </p>
        </div>
      </div>

      {/* Advanced Filters & Actions */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-[20px] p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex-1 w-full flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search by ID or customer..." 
              className="w-full bg-[#030712] border border-slate-800 text-sm text-white rounded-xl pl-10 pr-4 py-2.5 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all placeholder:text-slate-600"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#030712] border border-slate-800 text-sm font-bold text-white rounded-xl px-4 py-2.5 focus:border-violet-500 outline-none"
          >
            <option value="all">All Statuses</option>
            {Object.values(OrderStatus).map(st => (
              <option key={st} value={st}>{st.replace(/_/g, ' ').toUpperCase()}</option>
            ))}
          </select>
          <select 
            value={courierFilter} 
            onChange={(e) => setCourierFilter(e.target.value)}
            className="bg-[#030712] border border-slate-800 text-sm font-bold text-white rounded-xl px-4 py-2.5 focus:border-violet-500 outline-none"
          >
            <option value="all">All Couriers</option>
            <option value="Delhivery">Delhivery</option>
            <option value="Blue Dart">Blue Dart</option>
            <option value="Shiprocket">Shiprocket</option>
            <option value="Self Delivery">Self Delivery</option>
          </select>
        </div>
        
        {/* Bulk Actions */}
        {selectedOrderIds.size > 0 && (
          <div className="flex items-center gap-2 pl-4 border-l border-slate-800">
            <span className="text-xs font-bold text-slate-400">{selectedOrderIds.size} Selected</span>
            <select
              onChange={(e) => {
                if(e.target.value) handleBulkStatusUpdate(e.target.value as OrderStatus);
                e.target.value = '';
              }}
              className="bg-violet-600 text-xs font-bold text-white rounded-xl px-3 py-2 outline-none appearance-none cursor-pointer hover:bg-violet-500 transition-colors"
            >
              <option value="">Bulk Update Status...</option>
              {Object.values(OrderStatus).map(st => (
                <option key={st} value={st}>{st.replace(/_/g, ' ').toUpperCase()}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Orders List */}
      <div className="bg-[#030712]/30 border border-slate-800/60 rounded-[24px] overflow-hidden">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center gap-3">
            <RefreshCw className="w-6 h-6 text-violet-400 animate-spin" />
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Loading Orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center gap-3">
            <Package className="w-10 h-10 text-slate-700" />
            <p className="text-sm font-bold text-white">No Orders Found</p>
            <p className="text-xs text-slate-500">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-900/50">
                  <th className="py-4 px-4">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-700 bg-slate-800/50 text-violet-500 focus:ring-violet-500/20"
                      checked={selectedOrderIds.size > 0 && selectedOrderIds.size === filteredOrders.length}
                      onChange={toggleAllSelection}
                    />
                  </th>
                  <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Order ID & Date</th>
                  <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Customer</th>
                  <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Total</th>
                  <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Payment</th>
                  <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                  <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredOrders.map((order) => (
                  <tr key={order.orderId} className="hover:bg-slate-800/20 transition-colors group">
                    <td className="py-4 px-4">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-700 bg-slate-800/50 text-violet-500 focus:ring-violet-500/20"
                        checked={selectedOrderIds.has(order.orderId)}
                        onChange={() => toggleOrderSelection(order.orderId)}
                      />
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">{order.orderNumber}</span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-200">{order.shippingAddress?.fullName || 'Walk-in'}</span>
                        <span className="text-[10px] text-slate-500">{order.shippingAddress?.city || 'No Address'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-emerald-400">{order.grandTotal.toLocaleString()} {order.currency}</span>
                        <span className="text-[10px] text-slate-500">{orderItems.length} items</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${
                        order.paymentStatus === PaymentStatus.PAID 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {order.paymentStatus === PaymentStatus.PAID ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${getStatusColor(order.orderStatus)}`}>
                        {order.orderStatus.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button 
                        onClick={() => {
                          setSelectedOrder(order);
                          loadOrderItems(order.orderId);
                        }}
                        className="p-2 bg-slate-800 text-slate-300 hover:text-white hover:bg-violet-600 rounded-xl transition-all"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setSelectedOrder(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl max-h-[90vh] bg-[#090e1a] border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b border-slate-800/80 bg-slate-900/30">
                <div>
                  <h3 className="text-xl font-black text-white flex items-center gap-3">
                    Order #{selectedOrder.orderNumber}
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${getStatusColor(selectedOrder.orderStatus)}`}>
                      {selectedOrder.orderStatus.replace(/_/g, ' ')}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(selectedOrder.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => {
                    setIsPrintingInvoice(selectedOrder);
                    setTimeout(() => window.print(), 500);
                  }} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors">
                    <Printer className="w-4 h-4" /> Invoice
                  </button>
                  <button onClick={() => {
                    setIsPrintingPackingSlip(selectedOrder);
                    setTimeout(() => window.print(), 500);
                  }} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors">
                    <FileText className="w-4 h-4" /> Packing Slip
                  </button>
                  <button onClick={() => setSelectedOrder(null)} className="p-2 bg-slate-800/50 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl transition-colors ml-2">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-950/20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Column (Items & Logistics) */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Line Items */}
                    <div className="bg-[#030712] border border-slate-800/80 rounded-2xl p-5">
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                        <Package className="w-4 h-4 text-violet-400" /> Line Items
                      </h4>
                      {loadingItems ? (
                        <div className="text-center py-4 text-xs text-slate-500">Loading...</div>
                      ) : (
                        <div className="space-y-4">
                          {orderItems.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center pb-4 border-b border-slate-800/50 last:border-0 last:pb-0">
                              <div className="flex flex-col">
                                <span className="font-bold text-sm text-white">{item.productName}</span>
                                <span className="text-[10px] text-slate-500">SKU: {item.sku || 'N/A'}</span>
                              </div>
                              <div className="text-right">
                                <span className="font-black text-sm text-white block">{item.price?.toLocaleString()} Pi</span>
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-900 px-2 py-0.5 rounded">Qty: {item.quantity}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Logistics Tracking */}
                    <div className="bg-[#030712] border border-slate-800/80 rounded-2xl p-5">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                          <Truck className="w-4 h-4 text-sky-400" /> Logistics Details
                        </h4>
                        <button 
                          onClick={() => {
                            setUpdatingLogisticsFor(selectedOrder);
                            setLogisticsForm(selectedOrder.logistics || {});
                          }}
                          className="text-[10px] font-bold text-violet-400 hover:text-white uppercase px-3 py-1 bg-violet-500/10 rounded-lg"
                        >
                          Update
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Courier</p>
                          <p className="font-bold text-white">{selectedOrder.logistics?.courierName || 'Not Assigned'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Tracking Number</p>
                          <p className="font-mono text-emerald-400 bg-emerald-500/10 inline-block px-2 py-0.5 rounded">{selectedOrder.logistics?.trackingNumber || 'Pending'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Dispatch Date</p>
                          <p className="text-slate-300">{selectedOrder.logistics?.dispatchDate ? new Date(selectedOrder.logistics.dispatchDate).toLocaleDateString() : '-'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Expected Delivery</p>
                          <p className="text-slate-300">{selectedOrder.logistics?.expectedDelivery ? new Date(selectedOrder.logistics.expectedDelivery).toLocaleDateString() : '-'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Log */}
                    <div className="bg-[#030712] border border-slate-800/80 rounded-2xl p-5">
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400" /> Activity Timeline
                      </h4>
                      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-800 before:to-transparent">
                        {(selectedOrder.historyLog || []).map((log, i) => (
                          <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className="flex items-center justify-center w-4 h-4 rounded-full border border-slate-700 bg-slate-900 text-slate-500 group-[.is-active]:text-emerald-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10" />
                            <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-2.5rem)] bg-slate-900/50 border border-slate-800/50 p-4 rounded-xl shadow">
                              <div className="flex items-center justify-between space-x-2 mb-1">
                                <div className="font-bold text-white text-sm">{log.status.replace(/_/g, ' ').toUpperCase()}</div>
                                <time className="font-mono text-[9px] text-slate-500">{new Date(log.timestamp).toLocaleString()}</time>
                              </div>
                              {log.remarks && <div className="text-slate-400 text-xs">{log.remarks}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column (Totals, Customer, Actions) */}
                  <div className="space-y-6">
                    {/* Actions Panel */}
                    <div className="bg-gradient-to-br from-violet-600/20 to-indigo-600/10 border border-violet-500/30 rounded-2xl p-5">
                      <h4 className="text-xs font-black uppercase tracking-widest text-violet-300 mb-4">Quick Actions</h4>
                      <button 
                        onClick={() => {
                          setUpdatingStatusFor(selectedOrder);
                          setNewStatusValue(selectedOrder.orderStatus);
                        }}
                        className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-violet-900/20 transition-all mb-3"
                      >
                        Update Order Status
                      </button>
                    </div>

                    {/* Customer Info */}
                    <div className="bg-[#030712] border border-slate-800/80 rounded-2xl p-5">
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-emerald-400" /> Customer & Shipping
                      </h4>
                      {selectedOrder.shippingAddress ? (
                        <div className="text-sm space-y-1 text-slate-300">
                          <p className="font-bold text-white">{selectedOrder.shippingAddress.fullName}</p>
                          <p>{selectedOrder.shippingAddress.street}</p>
                          <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.postalCode}</p>
                          <p className="text-xs text-slate-500 mt-2">📞 {selectedOrder.shippingAddress.phone}</p>
                          <p className="text-xs text-slate-500">✉️ {selectedOrder.shippingAddress.email}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 italic">No delivery details.</p>
                      )}
                    </div>

                    {/* Order Summary */}
                    <div className="bg-[#030712] border border-slate-800/80 rounded-2xl p-5 space-y-3 text-sm">
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Financials</h4>
                      <div className="flex justify-between text-slate-400">
                        <span>Subtotal</span>
                        <span className="font-mono">{selectedOrder.subtotal?.toLocaleString()} Pi</span>
                      </div>
                      {selectedOrder.discount > 0 && (
                        <div className="flex justify-between text-rose-400">
                          <span>Discount</span>
                          <span className="font-mono">-{selectedOrder.discount?.toLocaleString()} Pi</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-400">
                        <span>Tax</span>
                        <span className="font-mono">{selectedOrder.tax?.toLocaleString()} Pi</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Shipping</span>
                        <span className="font-mono">{selectedOrder.shipping?.toLocaleString()} Pi</span>
                      </div>
                      <div className="pt-3 border-t border-slate-800 flex justify-between font-black text-white text-base">
                        <span>Grand Total</span>
                        <span className="text-emerald-400">{selectedOrder.grandTotal?.toLocaleString()} Pi</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Update Status Modal */}
      <AnimatePresence>
        {updatingStatusFor && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setUpdatingStatusFor(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-[#090e1a] border border-slate-800 rounded-2xl shadow-2xl p-6"
            >
              <h3 className="text-xl font-bold text-white mb-4">Update Status</h3>
              <form onSubmit={handleUpdateStatus} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">New Status</label>
                  <select 
                    value={newStatusValue} 
                    onChange={e => setNewStatusValue(e.target.value as OrderStatus)}
                    className="w-full bg-[#030712] border border-slate-800 text-sm font-bold text-white rounded-xl px-4 py-3 focus:border-violet-500 outline-none"
                  >
                    {Object.values(OrderStatus).map(st => (
                      <option key={st} value={st}>{st.replace(/_/g, ' ').toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">Remarks / Notes</label>
                  <textarea 
                    value={statusRemarks}
                    onChange={e => setStatusRemarks(e.target.value)}
                    className="w-full bg-[#030712] border border-slate-800 text-sm text-white rounded-xl px-4 py-3 min-h-[100px] focus:border-violet-500 outline-none"
                    placeholder="E.g. Package dropped at front desk..."
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button type="button" onClick={() => setUpdatingStatusFor(null)} className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white">Cancel</button>
                  <button type="submit" className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-xl transition-colors">Save Update</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Update Logistics Modal */}
      <AnimatePresence>
        {updatingLogisticsFor && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setUpdatingLogisticsFor(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-[#090e1a] border border-slate-800 rounded-2xl shadow-2xl p-6"
            >
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-sky-400" /> Update Logistics
              </h3>
              <form onSubmit={handleUpdateLogistics} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2">Courier Name</label>
                    <input 
                      type="text"
                      value={logisticsForm.courierName || ''}
                      onChange={e => setLogisticsForm({...logisticsForm, courierName: e.target.value})}
                      className="w-full bg-[#030712] border border-slate-800 text-sm text-white rounded-xl px-4 py-2 focus:border-violet-500 outline-none"
                      placeholder="e.g. Delhivery"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2">Tracking Number</label>
                    <input 
                      type="text"
                      value={logisticsForm.trackingNumber || ''}
                      onChange={e => setLogisticsForm({...logisticsForm, trackingNumber: e.target.value})}
                      className="w-full bg-[#030712] border border-slate-800 text-sm text-white rounded-xl px-4 py-2 focus:border-violet-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2">Dispatch Date</label>
                    <input 
                      type="date"
                      value={logisticsForm.dispatchDate ? new Date(logisticsForm.dispatchDate).toISOString().split('T')[0] : ''}
                      onChange={e => setLogisticsForm({...logisticsForm, dispatchDate: new Date(e.target.value).toISOString()})}
                      className="w-full bg-[#030712] border border-slate-800 text-sm text-white rounded-xl px-4 py-2 focus:border-violet-500 outline-none [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2">Expected Delivery</label>
                    <input 
                      type="date"
                      value={logisticsForm.expectedDelivery ? new Date(logisticsForm.expectedDelivery).toISOString().split('T')[0] : ''}
                      onChange={e => setLogisticsForm({...logisticsForm, expectedDelivery: new Date(e.target.value).toISOString()})}
                      className="w-full bg-[#030712] border border-slate-800 text-sm text-white rounded-xl px-4 py-2 focus:border-violet-500 outline-none [color-scheme:dark]"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button type="button" onClick={() => setUpdatingLogisticsFor(null)} className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white">Cancel</button>
                  <button type="submit" className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-xl transition-colors">Save Details</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Print Templates */}
      <div className="hidden print:block fixed inset-0 bg-white text-black z-[200] p-10 font-sans">
        {isPrintingInvoice && (
          <div className="space-y-8">
            <div className="flex justify-between items-start border-b-2 border-black pb-6">
              <div>
                <h1 className="text-4xl font-black uppercase">TAX INVOICE</h1>
                <p className="text-sm font-bold mt-2">PI BUSINESS MARKET</p>
                <p className="text-xs mt-1 text-gray-600">Store ID: {storeId}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">#{isPrintingInvoice.orderNumber}</p>
                <p className="text-sm text-gray-600">Date: {new Date(isPrintingInvoice.createdAt).toLocaleDateString()}</p>
                <p className="text-sm font-bold mt-2">Status: {isPrintingInvoice.orderStatus.replace(/_/g, ' ').toUpperCase()}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-12 text-sm border-b pb-8">
              <div>
                <h3 className="font-bold border-b border-gray-300 pb-2 mb-3 uppercase tracking-wider">Billed To</h3>
                <p className="font-bold">{isPrintingInvoice.billingAddress?.fullName || 'Customer'}</p>
                <p>{isPrintingInvoice.billingAddress?.street}</p>
                <p>{isPrintingInvoice.billingAddress?.city}, {isPrintingInvoice.billingAddress?.state} {isPrintingInvoice.billingAddress?.postalCode}</p>
                <p className="mt-2 text-gray-600">{isPrintingInvoice.billingAddress?.phone}</p>
              </div>
              <div>
                <h3 className="font-bold border-b border-gray-300 pb-2 mb-3 uppercase tracking-wider">Shipped To</h3>
                <p className="font-bold">{isPrintingInvoice.shippingAddress?.fullName || 'Walk-in'}</p>
                <p>{isPrintingInvoice.shippingAddress?.street}</p>
                <p>{isPrintingInvoice.shippingAddress?.city}, {isPrintingInvoice.shippingAddress?.state} {isPrintingInvoice.shippingAddress?.postalCode}</p>
                <p className="mt-2 text-gray-600">{isPrintingInvoice.shippingAddress?.phone}</p>
              </div>
            </div>

            <div>
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-black">
                    <th className="py-3 font-bold uppercase tracking-wider">Item Description</th>
                    <th className="py-3 font-bold uppercase tracking-wider text-center">Qty</th>
                    <th className="py-3 font-bold uppercase tracking-wider text-right">Unit Price</th>
                    <th className="py-3 font-bold uppercase tracking-wider text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map((item, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="py-4">
                        <p className="font-bold">{item.productName}</p>
                        <p className="text-xs text-gray-500">SKU: {item.sku || 'N/A'}</p>
                      </td>
                      <td className="py-4 text-center">{item.quantity}</td>
                      <td className="py-4 text-right">{item.price?.toLocaleString()} Pi</td>
                      <td className="py-4 text-right font-bold">{(item.quantity * item.price)?.toLocaleString()} Pi</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-4">
              <div className="w-72 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-bold">{isPrintingInvoice.subtotal?.toLocaleString()} Pi</span>
                </div>
                {isPrintingInvoice.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount:</span>
                    <span className="font-bold">-{isPrintingInvoice.discount?.toLocaleString()} Pi</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-bold">{isPrintingInvoice.tax?.toLocaleString()} Pi</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="font-bold">{isPrintingInvoice.shipping?.toLocaleString()} Pi</span>
                </div>
                <div className="flex justify-between font-black text-xl border-t-2 border-black pt-3">
                  <span>Total:</span>
                  <span>{isPrintingInvoice.grandTotal?.toLocaleString()} Pi</span>
                </div>
              </div>
            </div>
            <div className="mt-20 pt-8 border-t text-center text-xs text-gray-500">
              <p>Thank you for your business!</p>
              <p>Payment processed via Pi Network.</p>
            </div>
          </div>
        )}

        {isPrintingPackingSlip && (
          <div className="space-y-8">
            <div className="flex justify-between items-start border-b-2 border-black pb-6">
              <div>
                <h1 className="text-4xl font-black uppercase">PACKING SLIP</h1>
                <p className="text-sm font-bold mt-2">PI BUSINESS MARKET</p>
                <p className="text-xs mt-1 text-gray-600">Store ID: {storeId}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">#{isPrintingPackingSlip.orderNumber}</p>
                <p className="text-sm text-gray-600">Date: {new Date(isPrintingPackingSlip.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-12 text-sm border-b pb-8">
              <div>
                <h3 className="font-bold border-b border-gray-300 pb-2 mb-3 uppercase tracking-wider">Ship To</h3>
                <p className="font-bold text-lg">{isPrintingPackingSlip.shippingAddress?.fullName || 'Walk-in'}</p>
                <p>{isPrintingPackingSlip.shippingAddress?.street}</p>
                <p>{isPrintingPackingSlip.shippingAddress?.city}, {isPrintingPackingSlip.shippingAddress?.state} {isPrintingPackingSlip.shippingAddress?.postalCode}</p>
                <p className="mt-2 text-gray-600">Phone: {isPrintingPackingSlip.shippingAddress?.phone}</p>
              </div>
              <div className="border-l pl-8">
                <h3 className="font-bold border-b border-gray-300 pb-2 mb-3 uppercase tracking-wider">Shipping Method</h3>
                <p className="font-bold text-xl">{isPrintingPackingSlip.logistics?.courierName || 'Standard Delivery'}</p>
                <div className="mt-4 p-4 border-2 border-dashed border-gray-400 text-center">
                  <p className="text-xs uppercase tracking-widest text-gray-500">Tracking Number</p>
                  <p className="text-2xl font-mono font-black mt-1">{isPrintingPackingSlip.logistics?.trackingNumber || '____________________'}</p>
                </div>
              </div>
            </div>

            <div>
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-black">
                    <th className="py-3 font-bold uppercase tracking-wider">Item / SKU</th>
                    <th className="py-3 font-bold uppercase tracking-wider text-center w-24">Order Qty</th>
                    <th className="py-3 font-bold uppercase tracking-wider text-center w-24">Packed</th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map((item, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="py-6">
                        <p className="font-bold text-lg">{item.productName}</p>
                        <p className="text-sm text-gray-500 mt-1">SKU: {item.sku || 'N/A'}</p>
                      </td>
                      <td className="py-6 text-center font-bold text-2xl">{item.quantity}</td>
                      <td className="py-6 text-center">
                        <div className="w-8 h-8 border-2 border-black mx-auto"></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-10 p-6 border-2 border-black">
              <h4 className="font-bold uppercase tracking-widest border-b border-gray-300 pb-2 mb-4">Packer Checklist</h4>
              <ul className="space-y-4">
                <li className="flex items-center gap-3"><div className="w-5 h-5 border border-black" /> All items scanned and verified</li>
                <li className="flex items-center gap-3"><div className="w-5 h-5 border border-black" /> Quality check passed</li>
                <li className="flex items-center gap-3"><div className="w-5 h-5 border border-black" /> Marketing inserts included</li>
                <li className="flex items-center gap-3"><div className="w-5 h-5 border border-black" /> Box sealed and weighed</li>
              </ul>
              <div className="mt-8 flex gap-8 border-t pt-4">
                <div>Packed By: ___________________</div>
                <div>Date: ___________________</div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
