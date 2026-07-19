/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Warehouse as WarehouseIcon, 
  Plus, 
  MapPin, 
  Package, 
  Search, 
  Filter,
  ChevronRight,
  MoreVertical,
  Activity,
  ShieldCheck,
  Building2,
  Box,
  Truck,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from '../components/Navbar';
import { useAuth } from '../auth/useAuth';
import { warehouseService } from '../services/warehouseService';
import { Warehouse, WarehouseType } from '../types';

export const WarehouseDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState('PI-CORP-001'); // In real app, derived from user profile

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const data = await warehouseService.getWarehouses(businessId);
      setWarehouses(data);
    } catch (err) {
      console.error('Failed to fetch warehouses', err);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: WarehouseType) => {
    switch (type) {
      case 'main': return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
      case 'fulfillment': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'returns': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'retail': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <Navbar 
        currentUser={user!}
        currentView="warehouses"
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
              <div className="p-2 bg-indigo-600/20 rounded-xl">
                <Building2 className="w-6 h-6 text-indigo-400" />
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight uppercase">Logistics Command</h1>
            </div>
            <p className="text-slate-500 font-medium">Manage enterprise warehouse networks and storage zones.</p>
          </div>
          <button 
            className="group flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            Provision Warehouse
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Active Warehouses', value: warehouses.length, icon: WarehouseIcon, color: 'text-indigo-400' },
            { label: 'Total Capacity', value: '85%', icon: Activity, color: 'text-emerald-400' },
            { label: 'Pending Shipments', value: '12', icon: Truck, color: 'text-amber-400' },
            { label: 'SKU Coverage', value: '1,240', icon: Box, color: 'text-blue-400' },
          ].map((stat, i) => (
            <div key={i} className="p-6 bg-slate-900/50 border border-slate-800 rounded-3xl">
              <div className="flex items-center gap-3 mb-4">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
              </div>
              <p className="text-3xl font-black text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Warehouse List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <MapPin className="w-5 h-5 text-indigo-400" />
              Global Nodes
            </h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input 
                  placeholder="Search Node..." 
                  className="bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:border-indigo-500 outline-none w-64"
                />
              </div>
              <button className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 hover:text-white">
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
              <p className="text-sm font-black text-slate-600 uppercase tracking-widest animate-pulse">Scanning Logistics Network...</p>
            </div>
          ) : warehouses.length === 0 ? (
            <div className="py-32 text-center bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-[3rem]">
              <Building2 className="w-16 h-16 text-slate-700 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-white mb-2">No Warehouses Found</h3>
              <p className="text-slate-500 max-w-sm mx-auto mb-10">Provision your first physical or virtual warehouse to begin managing inventory.</p>
              <button className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs">
                Start Provisioning
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {warehouses.map(wh => (
                <motion.div 
                  key={wh.warehouseId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => navigate(`/inventory?warehouse=${wh.warehouseId}`)}
                  className="group bg-slate-900/50 border border-slate-800 hover:border-indigo-500/50 rounded-[2.5rem] p-8 transition-all cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getTypeColor(wh.type)}`}>
                      {wh.type} Node
                    </span>
                  </div>

                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-16 h-16 rounded-3xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <WarehouseIcon className="w-8 h-8 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{wh.name}</h3>
                      <p className="text-xs font-mono text-slate-500">{wh.code} | {wh.city}, {wh.state}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="p-4 bg-slate-950/50 border border-slate-800/50 rounded-2xl text-center">
                      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Stock</p>
                      <p className="text-xl font-bold text-white">4.2k</p>
                    </div>
                    <div className="p-4 bg-slate-950/50 border border-slate-800/50 rounded-2xl text-center">
                      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Zones</p>
                      <p className="text-xl font-bold text-white">12</p>
                    </div>
                    <div className="p-4 bg-slate-950/50 border border-slate-800/50 rounded-2xl text-center">
                      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Status</p>
                      <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Active</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-slate-800/50">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Enterprise Verified</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-700 group-hover:text-indigo-400 group-hover:translate-x-2 transition-all" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
