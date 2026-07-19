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

export const FulfillmentCenter: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  
  const businessId = 'PI-CORP-001'; // Simulated for foundation

  useEffect(() => {
    fetchShipments();
  }, []);

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
      case ShipmentStatus.DELIVERED: return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case ShipmentStatus.IN_TRANSIT: return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case ShipmentStatus.PENDING: return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case ShipmentStatus.CANCELLED: return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-600/20 rounded-xl text-indigo-400 border border-indigo-500/20">
                <Truck className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight uppercase">Logistics Hub</h1>
            </div>
            <p className="text-slate-500 font-medium">Coordinate fulfillment, track shipments, and manage carriers across your enterprise.</p>
          </div>

          <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800">
            {['all', ShipmentStatus.PENDING, ShipmentStatus.IN_TRANSIT, ShipmentStatus.DELIVERED].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeFilter === filter 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                    : 'text-slate-500 hover:text-white'
                }`}
              >
                {filter.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <StatBox label="Pending Labels" value={shipments.filter(s => s.status === ShipmentStatus.PENDING).length.toString()} icon={<ClipboardCheck />} color="text-amber-400" />
          <StatBox label="Active Shipments" value={shipments.filter(s => s.status === ShipmentStatus.IN_TRANSIT).length.toString()} icon={<Truck />} color="text-indigo-400" />
          <StatBox label="Delivered (7d)" value={shipments.filter(s => s.status === ShipmentStatus.DELIVERED).length.toString()} icon={<CheckCircle2 />} color="text-emerald-400" />
          <StatBox label="Carrier Perf." value="98.2%" icon={<Ship />} color="text-violet-400" />
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            <p className="text-xs font-black text-slate-600 uppercase tracking-widest animate-pulse">Syncing Fulfillment Ledger...</p>
          </div>
        ) : filteredShipments.length === 0 ? (
          <div className="py-32 text-center bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-[3rem]">
            <Boxes className="w-16 h-16 text-slate-700 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-white mb-2">No shipments found</h3>
            <p className="text-slate-500">Your fulfillment queue is currently clear.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredShipments.map((shipment) => (
              <motion.div
                key={shipment.shipmentId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 hover:border-indigo-500/50 transition-all group"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-8">
                  <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-3xl flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 transition-colors group-hover:text-white">
                    <Package className="w-8 h-8" />
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{shipment.shipmentId}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${getStatusColor(shipment.status)}`}>
                        {shipment.status.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Order #{shipment.orderId.slice(0, 8)}</h3>
                    <div className="flex items-center gap-6">
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" /> {shipment.shippingAddress.city}, {shipment.shippingAddress.state}
                      </p>
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                        <Truck className="w-3 h-3" /> {shipment.shippingMethod}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right hidden md:block">
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Updated At</p>
                      <p className="text-xs font-bold text-slate-300 uppercase">{new Date(shipment.updatedAt).toLocaleDateString()}</p>
                    </div>
                    <button 
                      onClick={() => navigate(`/shipment/${shipment.shipmentId}`)}
                      className="p-4 bg-slate-800 group-hover:bg-indigo-600 text-white rounded-2xl transition-all shadow-xl"
                    >
                      <ArrowRight className="w-5 h-5" />
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
  <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-3xl">
    <div className="flex items-center gap-3 mb-4">
      <div className={`${color} p-2 bg-slate-950 rounded-xl border border-slate-800`}>
        {React.cloneElement(icon, { size: 18 })}
      </div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
    </div>
    <p className="text-3xl font-black text-white">{value}</p>
  </div>
);
