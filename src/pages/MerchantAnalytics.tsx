/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, Users, ShoppingBag, ArrowUpRight, ArrowDownRight, 
  Download, RefreshCw, Activity, Eye, Percent, Package,
  AlertTriangle, CheckCircle2, ChevronRight, BarChart3, Building2,
  Calendar, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { analyticsService } from '../services/analyticsService';
import { BusinessMetrics } from '../types';
import { useAuth } from '../auth/useAuth';
import Navbar from '../components/Navbar';
import { useBusiness } from '../context/BusinessContext';

export const MerchantAnalytics: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { currentBusiness, businesses, setCurrentBusinessId, isWorkspaceReady } = useBusiness();
  const [metrics, setMetrics] = useState<BusinessMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [exportSuccess, setExportSuccess] = useState(false);

  const businessId = currentBusiness?.id || businesses[0]?.id || user?.uid || 'no-business';
  const businessName = currentBusiness?.businessName || (businesses[0] ? businesses[0].businessName : 'Enterprise Merchant');

  const loadMetrics = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await analyticsService.getBusinessMetrics(businessId);
      setMetrics(data.reverse()); // Chronological for charts
    } catch (err) {
      console.error('Failed to load metrics', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user || (!isWorkspaceReady && !currentBusiness)) return;
    loadMetrics();
  }, [user, currentBusiness, businesses, isWorkspaceReady, businessId]);

  const latest: BusinessMetrics = metrics[metrics.length - 1] || {
    metricId: '',
    businessId: businessId,
    date: new Date().toISOString().split('T')[0],
    revenue: 0,
    orderCount: 0,
    productViews: 0,
    customerCount: 0,
    avgOrderValue: 0,
    conversionRate: 0,
    lowStockItems: 0,
    inventoryValue: 0,
    topProducts: [],
    updatedAt: new Date().toISOString()
  };

  const previous: BusinessMetrics = metrics[metrics.length - 2] || latest;

  const calculateGrowth = (current: number, prev: number) => {
    if (prev === 0) return 0;
    return ((current - prev) / prev) * 100;
  };

  const handleExportCSV = () => {
    if (metrics.length === 0) return;
    const headers = ['Date', 'Revenue', 'Orders', 'Views', 'Customers', 'AvgOrderValue', 'ConversionRate', 'LowStockItems', 'InventoryValue'];
    const rows = metrics.map(m => [
      m.date,
      m.revenue,
      m.orderCount,
      m.productViews || 0,
      m.customerCount || 0,
      m.avgOrderValue || 0,
      m.conversionRate || 0,
      m.lowStockItems || 0,
      m.inventoryValue || 0
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${businessName.replace(/\s+/g, '_')}_Analytics_${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  interface StatCardProps {
    id: string;
    title: string;
    value: number | string;
    unitPrefix?: string;
    unitSuffix?: string;
    trend?: number;
    icon: React.ElementType;
    badgeColor: string;
  }

  const StatCard: React.FC<StatCardProps> = ({ 
    id, 
    title, 
    value, 
    unitPrefix = '', 
    unitSuffix = '', 
    trend = 0, 
    icon: Icon, 
    badgeColor 
  }) => (
    <motion.div 
      id={id}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/60 p-5 sm:p-6 rounded-3xl border border-slate-800/80 shadow-lg hover:border-slate-700 transition-all flex flex-col justify-between"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${badgeColor} flex items-center justify-center shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== 0 && (
          <div className={`inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full border ${
            trend > 0 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}>
            {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{title}</p>
        <h3 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight truncate">
          {unitPrefix}{typeof value === 'number' ? value.toLocaleString() : value}{unitSuffix}
        </h3>
      </div>
    </motion.div>
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-2xl text-xs space-y-1">
          <p className="text-slate-400 font-mono text-[10px] uppercase font-bold">{label}</p>
          {payload.map((item: any, idx: number) => (
            <p key={idx} className="font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color || item.fill || '#6366f1' }} />
              <span className="capitalize">{item.name}:</span>
              <span className="font-mono text-indigo-300">
                {item.name === 'revenue' ? `π ${Number(item.value).toLocaleString()}` : item.value}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <Navbar 
        currentUser={user as any} 
        currentView="merchant_analytics" 
        onNavigate={(view) => navigate(`/${view}`)} 
        cartCount={0}
        walletBalance={0}
        onWalletUpdate={() => {}}
        onToggleCart={() => {}} 
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 pb-28 sm:pb-28 lg:pb-28">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 sm:mb-10 pb-6 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
              <div className="p-1.5 bg-indigo-600/20 border border-indigo-500/30 rounded-lg">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
              </div>
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                Seller Intelligence & Insights
              </span>
              {currentBusiness?.verificationStatus === 'Verified' && (
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {businesses.length > 1 ? (
                <div className="flex items-center gap-2">
                  <label htmlFor="analytics-biz-select" className="text-slate-400 text-xs font-bold">Business:</label>
                  <select
                    id="analytics-biz-select"
                    value={businessId}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      setCurrentBusinessId(selectedId);
                    }}
                    className="min-h-[44px] bg-slate-900 border border-slate-800 text-sm font-extrabold text-white rounded-xl px-3 py-2 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none cursor-pointer"
                  >
                    {businesses.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.businessName}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {businessName}
                </h1>
              )}
            </div>
            <p className="text-slate-400 text-xs mt-1">Real-time performance indicators, order volumes, and financial trajectories.</p>
          </div>
          
          {/* Controls: Time Range & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Time Range Selector */}
            <div className="flex bg-slate-900/90 border border-slate-800 rounded-2xl p-1 shadow-inner" role="group" aria-label="Time range selector">
              {(['7d', '30d', '90d', '1y'] as const).map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setTimeRange(range)}
                  aria-pressed={timeRange === range}
                  className={`min-h-[44px] px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none ${
                    timeRange === range 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            {/* Refresh Action */}
            <button 
              type="button"
              onClick={loadMetrics}
              aria-label="Refresh analytics data"
              title="Refresh Analytics"
              disabled={isLoading}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-300 hover:text-white hover:bg-slate-800 shadow-sm transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>

            {/* Export CSV Action */}
            <button 
              type="button"
              onClick={handleExportCSV}
              aria-label="Export analytics report to CSV"
              title="Export Report"
              className="min-h-[44px] flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl text-slate-300 hover:text-white text-xs font-bold shadow-sm transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Export Toast Feedback */}
        <AnimatePresence>
          {exportSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Analytics report exported successfully.</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        {isLoading ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-slate-900/40 border border-slate-800/80 rounded-3xl animate-pulse" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-80 bg-slate-900/40 border border-slate-800/80 rounded-3xl animate-pulse" />
              <div className="h-80 bg-slate-900/40 border border-slate-800/80 rounded-3xl animate-pulse" />
            </div>
          </div>
        ) : (
          <>
            {/* Top Performance Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-10">
              <StatCard 
                id="stat-revenue"
                title="Total Revenue" 
                value={latest.revenue} 
                unitPrefix="π " 
                trend={calculateGrowth(latest.revenue, previous.revenue)}
                icon={TrendingUp}
                badgeColor="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              />
              <StatCard 
                id="stat-orders"
                title="Total Orders" 
                value={latest.orderCount} 
                trend={calculateGrowth(latest.orderCount, previous.orderCount)}
                icon={ShoppingBag}
                badgeColor="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
              />
              <StatCard 
                id="stat-customers"
                title="Active Customers" 
                value={latest.customerCount} 
                trend={calculateGrowth(latest.customerCount, previous.customerCount)}
                icon={Users}
                badgeColor="bg-violet-500/10 text-violet-400 border border-violet-500/20"
              />
              <StatCard 
                id="stat-avg-order"
                title="Avg Order Value" 
                value={latest.avgOrderValue} 
                unitPrefix="π "
                trend={calculateGrowth(latest.avgOrderValue, previous.avgOrderValue)}
                icon={Percent}
                badgeColor="bg-amber-500/10 text-amber-400 border border-amber-500/20"
              />
            </div>

            {/* Secondary KPIs Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
              <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Product Views</span>
                <span className="text-lg sm:text-xl font-black text-white">{(latest.productViews || 0).toLocaleString()}</span>
              </div>
              <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Conversion Rate</span>
                <span className="text-lg sm:text-xl font-black text-emerald-400">{(latest.conversionRate || 0).toFixed(1)}%</span>
              </div>
              <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Inventory Valuation</span>
                <span className="text-lg sm:text-xl font-black text-indigo-400">π {(latest.inventoryValue || 0).toLocaleString()}</span>
              </div>
              <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Low Stock Alerts</span>
                <span className={`text-lg sm:text-xl font-black ${latest.lowStockItems > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                  {latest.lowStockItems || 0} items
                </span>
              </div>
            </div>

            {/* Charts Row 1: Revenue Over Time & Order Frequency */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-10">
              {/* Revenue Area Chart */}
              <div className="bg-slate-900/50 p-6 sm:p-8 rounded-3xl border border-slate-800/80 shadow-xl flex flex-col justify-between">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white">Revenue Trajectory</h3>
                    <p className="text-xs text-slate-400">Pi Network gross settlement volume</p>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>

                <div className="h-72 w-full">
                  {metrics.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                      <BarChart3 className="w-8 h-8 mb-2 opacity-30" />
                      <span>No revenue data recorded for this window</span>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={metrics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fill: '#64748b' }} 
                          dy={10}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fill: '#64748b' }} 
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#10b981" 
                          strokeWidth={2.5} 
                          fillOpacity={1} 
                          fill="url(#colorRev)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Order Frequency Bar Chart */}
              <div className="bg-slate-900/50 p-6 sm:p-8 rounded-3xl border border-slate-800/80 shadow-xl flex flex-col justify-between">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white">Order Frequency</h3>
                    <p className="text-xs text-slate-400">Daily transaction volume count</p>
                  </div>
                  <span className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-black text-indigo-400 uppercase tracking-wider">
                    Volume
                  </span>
                </div>

                <div className="h-72 w-full">
                  {metrics.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                      <ShoppingBag className="w-8 h-8 mb-2 opacity-30" />
                      <span>No order frequency data recorded yet</span>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metrics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fill: '#64748b' }} 
                          dy={10}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fill: '#64748b' }} 
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b', opacity: 0.4 }} />
                        <Bar dataKey="orderCount" fill="#6366f1" radius={[6, 6, 0, 0]} name="Orders" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* Charts Row 2: Top Products & Inventory Health */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
              
              {/* Top Performing Products */}
              <div className="lg:col-span-2 bg-slate-900/50 p-6 sm:p-8 rounded-3xl border border-slate-800/80 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white">Top Performing Products</h3>
                    <p className="text-xs text-slate-400">Best-selling catalog items by customer purchase volume</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/catalog')}
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none p-1 rounded-lg"
                  >
                    View Catalog <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {(latest.topProducts && latest.topProducts.length > 0) ? (
                  <div className="space-y-4 sm:space-y-5">
                    {latest.topProducts.map((prod, idx) => {
                      const maxSales = Math.max(...latest.topProducts.map(p => p.sales || 1), 1);
                      const percent = Math.round((prod.sales / maxSales) * 100);
                      return (
                        <div key={prod.id || idx} className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/80 flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                            idx === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            idx === 1 ? 'bg-slate-300/20 text-slate-200 border border-slate-300/30' :
                            idx === 2 ? 'bg-amber-700/20 text-amber-600 border border-amber-700/30' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            #{idx + 1}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1.5">
                              <p className="text-xs sm:text-sm font-bold text-white truncate">{prod.name}</p>
                              <span className="text-xs font-extrabold text-indigo-400 shrink-0">{prod.sales} sales</span>
                            </div>
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-500" 
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-10 text-center bg-slate-950/40 rounded-2xl border border-slate-800/50">
                    <Package className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                    <p className="text-xs font-bold text-slate-300">No Product Sales Recorded Yet</p>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                      As customers purchase items from your storefronts, top-ranking products will be cataloged here automatically.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('/catalog')}
                      className="min-h-[44px] mt-4 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                    >
                      Manage Products
                    </button>
                  </div>
                )}
              </div>

              {/* Inventory & Stock Health */}
              <div className="bg-slate-900/50 p-6 sm:p-8 rounded-3xl border border-slate-800/80 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base sm:text-lg font-bold text-white">Stock Health</h3>
                    <Package className="w-4 h-4 text-indigo-400" />
                  </div>
                  <p className="text-xs text-slate-400 mb-6">Real-time inventory levels</p>

                  <div className="p-6 bg-slate-950/60 rounded-2xl border border-slate-800/80 mb-6 flex flex-col items-center justify-center text-center">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${
                      latest.lowStockItems > 0 
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {latest.lowStockItems > 0 ? (
                        <AlertTriangle className="w-7 h-7" />
                      ) : (
                        <CheckCircle2 className="w-7 h-7" />
                      )}
                    </div>
                    <span className="text-2xl sm:text-3xl font-black text-white">{latest.lowStockItems || 0}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      Low Stock SKUs
                    </span>
                    <p className="text-[11px] text-slate-500 mt-2">
                      {latest.lowStockItems > 0 
                        ? 'Restock needed to maintain fulfillment speed.' 
                        : 'All catalog items adequately stocked.'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center px-4 py-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                    <span className="text-xs font-medium text-slate-400">Total Stock Value</span>
                    <span className="text-xs font-extrabold text-white font-mono">π {(latest.inventoryValue || 0).toLocaleString()}</span>
                  </div>

                  <button 
                    type="button"
                    onClick={() => navigate('/inventory')}
                    className="min-h-[44px] w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                  >
                    Open Inventory Manager <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default MerchantAnalytics;
