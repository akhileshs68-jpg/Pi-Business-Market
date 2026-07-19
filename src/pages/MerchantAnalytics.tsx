/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, Users, ShoppingBag, DollarSign, ArrowUpRight, ArrowDownRight, 
  Calendar, Download, RefreshCw, Filter, ChevronRight, Activity
} from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { analyticsService } from '../services/analyticsService';
import { BusinessMetrics } from '../types';
import { useAuth } from '../auth/useAuth';
import Navbar from '../components/Navbar';

export const MerchantAnalytics: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<BusinessMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  // Business ID hardcoded for simulation as per previous context or could be fetched
  const businessId = 'PI-CORP-001'; 

  useEffect(() => {
    if (!user) return;
    const loadMetrics = async () => {
      try {
        const data = await analyticsService.getBusinessMetrics(businessId);
        setMetrics(data.reverse()); // Chronological for charts
      } catch (err) {
        console.error('Failed to load metrics', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadMetrics();
  }, [user]);

  const latest = metrics[metrics.length - 1] || {
    revenue: 0,
    orderCount: 0,
    customerCount: 0,
    conversionRate: 0,
    avgOrderValue: 0,
    lowStockItems: 0,
    inventoryValue: 0,
    topProducts: []
  } as BusinessMetrics;

  const previous = metrics[metrics.length - 2] || latest;

  const calculateGrowth = (current: number, prev: number) => {
    if (prev === 0) return 0;
    return ((current - prev) / prev) * 100;
  };

  const StatCard = ({ title, value, unit = '', trend = 0, icon: Icon, color }: any) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${color} bg-opacity-10`}>
          <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold ${trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(trend).toFixed(1)}%
        </div>
      </div>
      <p className="text-slate-500 text-sm font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900 mt-1">
        {unit}{value.toLocaleString()}
      </h3>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar 
        currentUser={user as any} 
        currentView="merchant_analytics" 
        onNavigate={(view) => navigate(`/${view}`)} 
        cartCount={0}
        walletBalance={0}
        onWalletUpdate={() => {}}
        onToggleCart={() => {}} 
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Business Intelligence</h1>
            <p className="text-slate-500 mt-1 font-medium">Performance insights for {businessId}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
              {['7d', '30d', '90d', '1y'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    timeRange === range ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
            <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:text-slate-900 shadow-sm transition-all">
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard 
            title="Total Revenue" 
            value={latest.revenue} 
            unit="π " 
            trend={calculateGrowth(latest.revenue, previous.revenue)}
            icon={DollarSign}
            color="bg-emerald-500"
          />
          <StatCard 
            title="Total Orders" 
            value={latest.orderCount} 
            trend={calculateGrowth(latest.orderCount, previous.orderCount)}
            icon={ShoppingBag}
            color="bg-indigo-500"
          />
          <StatCard 
            title="Active Customers" 
            value={latest.customerCount} 
            trend={calculateGrowth(latest.customerCount, previous.customerCount)}
            icon={Users}
            color="bg-violet-500"
          />
          <StatCard 
            title="Avg Order Value" 
            value={latest.avgOrderValue} 
            unit="π "
            trend={calculateGrowth(latest.avgOrderValue, previous.avgOrderValue)}
            icon={TrendingUp}
            color="bg-amber-500"
          />
        </div>

        {/* Charts Row 1: Revenue & Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-bold text-slate-900">Revenue Over Time</h3>
              <Activity className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#64748b'}} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#64748b'}} 
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-bold text-slate-900">Order Frequency</h3>
              <div className="px-3 py-1 bg-indigo-50 rounded-full text-[10px] font-bold text-indigo-600 uppercase">Daily Volume</div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#64748b'}} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#64748b'}} 
                  />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="orderCount" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Row 2: Top Products & Conversion */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Top Performing Products</h3>
            <div className="space-y-6">
              {(latest.topProducts || []).map((prod, idx) => (
                <div key={prod.id} className="flex items-center gap-4">
                  <div className="w-8 h-8 flex-shrink-0 bg-slate-50 rounded-lg flex items-center justify-center text-xs font-bold text-slate-400">
                    #{idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1.5">
                      <p className="text-sm font-semibold text-slate-900 truncate">{prod.name}</p>
                      <span className="text-xs font-bold text-slate-600">{prod.sales} sales</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-500 h-full rounded-full" 
                        style={{ width: `${(prod.sales / Math.max(...latest.topProducts.map(p => p.sales))) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl p-8 text-white flex flex-col justify-between shadow-xl">
            <div>
              <h3 className="text-lg font-bold mb-2">Inventory Health</h3>
              <p className="text-slate-400 text-sm">Real-time stock monitoring</p>
            </div>
            
            <div className="py-10 flex flex-col items-center">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64" cy="64" r="58"
                    stroke="currentColor" strokeWidth="8" fill="transparent"
                    className="text-slate-800"
                  />
                  <circle
                    cx="64" cy="64" r="58"
                    stroke="currentColor" strokeWidth="8" fill="transparent"
                    strokeDasharray={364.4}
                    strokeDashoffset={364.4 * (1 - (latest.lowStockItems / 100))}
                    className="text-indigo-500 transition-all duration-1000"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-bold">{latest.lowStockItems}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Low Stock</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center px-4 py-3 bg-white/5 rounded-2xl border border-white/10">
                <span className="text-xs font-medium text-slate-400">Inventory Value</span>
                <span className="text-sm font-bold">π {latest.inventoryValue.toLocaleString()}</span>
              </div>
              <button className="w-full py-3 bg-indigo-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-500 transition-all">
                Restock Now
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MerchantAnalytics;
