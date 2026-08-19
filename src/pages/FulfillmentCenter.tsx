/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Truck, 
  Search, 
  Filter, 
  ChevronRight, 
  Package, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ExternalLink,
  ArrowRight,
  Boxes,
  ClipboardCheck,
  Ship
} from 'lucide-react';
import { motion } from 'motion/react';
import Navbar from '../components/Navbar';
import { useAuth } from '../auth/useAuth';
import { shippingService } from '../services/shippingService';
import { Shipment, ShipmentStatus, ShippingMethod } from '../types';
import { useBusiness } from '../context/BusinessContext';

export const FulfillmentCenter: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { currentBusiness, businesses, isWorkspaceReady } = useBusiness();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  
  const businessId = currentBusiness?.id || businesses[0]?.id || user?.uid || 'no-business';

  useEffect(() => {
    if (isWorkspaceReady || user) {
      fetchShipments();
    }
  }, [user, currentBusiness, businesses, isWorkspaceReady]);

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const data = await shippingService.getBusinessShipments(businessId);
      setShipments(data);
    } catch (err) {
      console.error('Failed to fetch shipments', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: ShipmentStatus) => {
    switch (status) {
      case ShipmentStatus.DELIVERED: return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
      case ShipmentStatus.IN_TRANSIT: 
      case ShipmentStatus.HUB_PROCESSING:
      case ShipmentStatus.OUT_FOR_DELIVERY: return 'bg-sky-500/10 text-sky-300 border-sky-500/20';
      case ShipmentStatus.PENDING: 
      case ShipmentStatus.CREATED: 
      case ShipmentStatus.PACKED:
      case ShipmentStatus.READY_FOR_PICKUP:
      case ShipmentStatus.PICKUP_SCHEDULED: return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
      case ShipmentStatus.CANCELLED: 
      case ShipmentStatus.DELIVERY_FAILED:
      case ShipmentStatus.RETURNED: return 'bg-rose-500/10 text-rose-300 border-rose-500/20';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const filteredShipments = shipments.filter(s => activeFilter === 'all' || s.status === activeFilter);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <Navbar 
        currentUser={user!}
        currentView="employer"
        onNavigate={(view) => navigate(`/${view}`)}
        cartCount={0}
        walletBalance={100}
        onWalletUpdate={() => {}}
        onToggleCart={() => {}}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 md:mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-violet-600/10 rounded-2xl text-violet-400 border border-violet-500/20 shrink-0">
                <Truck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight uppercase">Logistics Hub</h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">Coordinate fulfillment, track shipments, and manage carriers across your enterprise.</p>
          </div>
 
          <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800/80 overflow-x-auto scrollbar-hide touch-pan-x gap-1.5">
            {['all', ShipmentStatus.PENDING, ShipmentStatus.IN_TRANSIT, ShipmentStatus.DELIVERED].map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`min-h-[44px] px-4 sm:px-5 py-2.5 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none cursor-pointer ${
                  activeFilter === filter 
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {filter.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
 
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-8 md:mb-10">
          <StatBox label="Pending" value={shipments.filter(s => s.status === ShipmentStatus.PENDING).length.toString()} icon={<ClipboardCheck />} color="text-amber-400" />
          <StatBox label="Active Transit" value={shipments.filter(s => s.status === ShipmentStatus.IN_TRANSIT).length.toString()} icon={<Truck />} color="text-sky-400" />
          <StatBox label="Delivered" value={shipments.filter(s => s.status === ShipmentStatus.DELIVERED).length.toString()} icon={<CheckCircle2 />} color="text-emerald-400" />
          <StatBox label="Performance" value="98.2%" icon={<Ship />} color="text-violet-400" />
        </div>
 
        {/* Content */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest animate-pulse">Syncing Fulfillment Ledger...</p>
          </div>
        ) : filteredShipments.length === 0 ? (
          <div className="py-20 md:py-28 text-center bg-slate-900/30 border-2 border-dashed border-slate-800/80 rounded-3xl p-6">
            <Boxes className="w-12 h-12 md:w-14 md:h-14 text-slate-700 mx-auto mb-4" />
            <h3 className="text-lg md:text-xl font-bold text-white mb-2">No shipments found</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">Your fulfillment queue is currently clear.</p>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-5">
            {filteredShipments.map((shipment) => (
              <motion.div
                key={shipment.shipmentId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900/40 border border-slate-800/80 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-7 hover:border-violet-500/40 transition-all group"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-violet-400 group-hover:bg-violet-600 transition-colors group-hover:text-white shrink-0">
                    <Package className="w-6 h-6 md:w-7 md:h-7" />
                  </div>
                  
                  <div className="flex-1 space-y-1.5 md:space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">{shipment.shipmentId}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${getStatusColor(shipment.status)}`}>
                        {shipment.status.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="text-base md:text-lg font-black text-white uppercase tracking-tight">Order #{shipment.orderId.slice(0, 8)}</h3>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                      <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-violet-400" /> {shipment.shippingAddress.city}, {shipment.shippingAddress.state}
                      </p>
                      <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-violet-400" /> {shipment.shippingMethod}
                      </p>
                    </div>
                  </div>
 
                  <div className="flex items-center justify-between md:justify-end gap-5 pt-3 md:pt-0 border-t border-slate-800 md:border-0">
                    <div className="text-left md:text-right">
                      <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Updated At</p>
                      <p className="text-xs font-bold text-slate-200 uppercase">{new Date(shipment.updatedAt).toLocaleDateString()}</p>
                    </div>
                    <button 
                      type="button"
                      aria-label="View Shipment Details"
                      onClick={() => navigate(`/shipment/${shipment.shipmentId}`)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center p-3 bg-slate-800 group-hover:bg-violet-600 text-white rounded-xl md:rounded-2xl transition-all shadow-md focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                    >
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

const StatBox = ({ label, value, icon, color }: any) => (
  <div className="p-4 sm:p-6 bg-slate-900/50 border border-slate-800/80 rounded-2xl sm:rounded-3xl">
    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
      <div className={`${color} p-1.5 sm:p-2 bg-slate-950 rounded-xl border border-slate-800`}>
        {React.cloneElement(icon, { size: 16 })}
      </div>
      <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    </div>
    <p className="text-lg sm:text-2xl font-black text-white font-mono">{value}</p>
  </div>
);
