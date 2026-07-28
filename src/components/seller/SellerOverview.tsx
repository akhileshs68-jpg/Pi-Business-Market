import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Zap, 
  ClipboardList, 
  Users, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  ArrowUpRight, 
  CheckCircle, 
  DollarSign,
  Plus,
  BarChart3,
  Percent,
  Calendar,
  Lock,
  Star
} from 'lucide-react';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface SellerOverviewProps {
  onActionClick: (action: string) => void;
}

// Highly descriptive, professional mock database
const MOCK_SALES_DATA = [
  { name: 'Mon', sales: 120 },
  { name: 'Tue', sales: 180 },
  { name: 'Wed', sales: 290 },
  { name: 'Thu', sales: 240 },
  { name: 'Fri', sales: 380 },
  { name: 'Sat', sales: 420 },
  { name: 'Sun', sales: 480 }
];

const MOCK_RECENT_ORDERS = [
  {
    id: 'ORD-9842',
    customer: 'David Vance',
    amount: '45.0 π',
    status: 'Pending',
    date: '2026-07-27',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60'
  },
  {
    id: 'ORD-9839',
    customer: 'Sarah Connor',
    amount: '12.5 π',
    status: 'Completed',
    date: '2026-07-26',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=60'
  },
  {
    id: 'ORD-9831',
    customer: 'Liam Neeson',
    amount: '150.0 π',
    status: 'Shipped',
    date: '2026-07-25',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60'
  },
  {
    id: 'ORD-9812',
    customer: 'Emma Watson',
    amount: '2.5 π',
    status: 'Cancelled',
    date: '2026-07-24',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60'
  }
];

const MOCK_LOW_STOCK = [
  {
    id: 'p_1',
    name: 'Consensus Core Hardware Wallet',
    stock: 3,
    image: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=150&auto=format&fit=crop&q=60'
  },
  {
    id: 'p_4',
    name: 'AeroSync Fitness Smartwatch',
    stock: 1,
    image: 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=150&auto=format&fit=crop&q=60'
  }
];

export const SellerOverview: React.FC<SellerOverviewProps> = ({ onActionClick }) => {
  const [storeOpen, setStoreOpen] = useState(true);

  return (
    <div className="space-y-10" id="seller_overview_container">
      
      {/* SECTION 1: Store Header */}
      <section id="seller_store_header" className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/5 blur-3xl -ml-20 -mb-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Store Logo */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 p-[2px] shadow-lg">
                <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&auto=format&fit=crop&q=60" 
                    alt="Pi-Enterprise" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
                  Pi-Enterprise Solutions Inc.
                </h1>
                <span className="inline-flex items-center gap-1 bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider">
                  <CheckCircle className="w-3 h-3 text-violet-400" /> Verified Merchant
                </span>
              </div>
              <p className="text-xs text-slate-400 font-semibold mt-1">
                Category: <span className="text-slate-300 font-bold">Information Technology</span>
              </p>
              <p className="text-[10px] text-slate-500 font-medium font-mono mt-0.5">
                Merchant Node ID: PMN-9482-TX81
              </p>
            </div>
          </div>

          {/* Store Status Control */}
          <div className="flex items-center gap-3 self-end md:self-auto bg-slate-950/80 border border-slate-800 p-2 rounded-2xl">
            <div className="px-3">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Store Status</span>
              <span className={`text-xs font-black uppercase tracking-wider ${storeOpen ? 'text-emerald-400' : 'text-rose-400'}`}>
                {storeOpen ? 'Open for Business' : 'Temporarily Closed'}
              </span>
            </div>
            <button
              onClick={() => setStoreOpen(!storeOpen)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                storeOpen 
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/10' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/10'
              }`}
            >
              {storeOpen ? 'Close Store' : 'Open Store'}
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 2: Quick Statistics */}
      <section id="seller_statistics_grid" className="space-y-4">
        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-4 bg-violet-500 rounded-full inline-block" />
          Quick Statistics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {[
            { label: 'Products', value: '24', icon: ShoppingBag, color: 'text-violet-400', bg: 'bg-violet-500/5' },
            { label: 'Services', value: '8', icon: Zap, color: 'text-indigo-400', bg: 'bg-indigo-500/5' },
            { label: 'Total Orders', value: '142', icon: ClipboardList, color: 'text-emerald-400', bg: 'bg-emerald-500/5' },
            { label: 'Customers', value: '98', icon: Users, color: 'text-amber-400', bg: 'bg-amber-500/5' },
            { label: 'Revenue', value: '1,420 π', icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/5' },
            { label: 'Pending', value: '3', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/5' },
            { label: 'Cancelled', value: '2', icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/5' }
          ].map((stat, idx) => (
            <div 
              key={idx} 
              className="bg-slate-900/50 border border-slate-850/80 p-4 rounded-2xl flex flex-col justify-between gap-3 shadow-md hover:border-slate-700 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{stat.label}</span>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className="text-lg font-black text-white tracking-tight leading-none font-mono">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3: Quick Actions */}
      <section id="seller_quick_actions" className="space-y-4">
        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-4 bg-violet-500 rounded-full inline-block" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: 'Add Product', action: 'add_product', icon: Plus, highlight: true },
            { label: 'Add Service', action: 'add_service', icon: Plus, highlight: true },
            { label: 'Inventory', action: 'inventory', icon: ShoppingBag },
            { label: 'Orders', action: 'orders', icon: ClipboardList },
            { label: 'Customers', action: 'customers', icon: Users },
            { label: 'Analytics', action: 'analytics', icon: BarChart3 },
            { label: 'Coupons', action: 'coupons', icon: Percent },
          ].map((act, idx) => (
            <button
              key={idx}
              onClick={() => onActionClick(act.action)}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center gap-2.5 transition-all cursor-pointer group select-none ${
                act.highlight 
                  ? 'bg-violet-600 hover:bg-violet-500 border-violet-500 text-white shadow-lg shadow-violet-600/10' 
                  : 'bg-slate-900/40 hover:bg-slate-800/80 border-slate-850 text-slate-300 hover:text-white'
              }`}
            >
              <div className={`p-2 rounded-xl transition-all ${act.highlight ? 'bg-white/10 text-white' : 'bg-slate-950 group-hover:bg-violet-600/10 group-hover:text-violet-400'}`}>
                <act.icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider leading-none">
                {act.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Grid of Content: Recent Orders & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* SECTION 4: Recent Orders */}
        <section id="seller_recent_orders" className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-4 bg-violet-500 rounded-full inline-block" />
              Recent Orders
            </h2>
            <button 
              onClick={() => onActionClick('orders')}
              className="text-[10px] font-black text-violet-400 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-1"
            >
              All Orders <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-slate-900/40 border border-slate-850 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-850 bg-slate-950/40 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    <th className="py-4 px-6">Order ID</th>
                    <th className="py-4 px-6">Customer</th>
                    <th className="py-4 px-6 text-right">Amount</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/50">
                  {MOCK_RECENT_ORDERS.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-900/20 transition-all text-xs">
                      <td className="py-3.5 px-6 font-mono font-bold text-slate-300">
                        {ord.id}
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={ord.avatar} 
                            alt={ord.customer} 
                            className="w-6 h-6 rounded-full object-cover border border-slate-800"
                            referrerPolicy="no-referrer"
                          />
                          <span className="font-bold text-slate-200">{ord.customer}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-right font-mono font-bold text-white">
                        {ord.amount}
                      </td>
                      <td className="py-3.5 px-6">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                          ord.status === 'Completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                          ord.status === 'Shipped' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                          ord.status === 'Pending' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                          'bg-rose-500/10 border-rose-500/20 text-rose-400'
                        }`}>
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-slate-500 font-semibold font-mono">
                        {ord.date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SECTION 5: Low Stock Products */}
        <section id="seller_low_stock" className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-4 bg-rose-500 rounded-full inline-block" />
              Low Stock Alert
            </h2>
            <button 
              onClick={() => onActionClick('inventory')}
              className="text-[10px] font-black text-rose-400 hover:text-white uppercase tracking-widest transition-colors"
            >
              Restock
            </button>
          </div>

          <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 space-y-4 shadow-xl">
            {MOCK_LOW_STOCK.map((prod) => (
              <div key={prod.id} className="flex items-center justify-between gap-4 p-3 bg-slate-950/40 border border-slate-850 rounded-xl">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 shrink-0">
                    <img 
                      src={prod.image} 
                      alt={prod.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-200 truncate leading-tight mb-1">
                      {prod.name}
                    </h4>
                    <span className="text-[9px] font-black uppercase tracking-wider text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded-md">
                      Only {prod.stock} left
                    </span>
                  </div>
                </div>
                
                <button 
                  onClick={() => onActionClick('inventory')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-violet-600 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all text-slate-400"
                >
                  Restock
                </button>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* PERFORMANCE & VERIFICATION GRIDS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* SECTION 6: Business Performance (Sales Chart & Metrics) */}
        <section id="seller_business_performance" className="lg:col-span-8 space-y-4">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-4 bg-violet-500 rounded-full inline-block" />
            Performance & Insights
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {[
              { label: "Today's Sales", value: '480 π', trend: '+15.2%', positive: true },
              { label: 'Weekly Sales', value: '2,110 π', trend: '+8.4%', positive: true },
              { label: 'Monthly Sales', value: '8,420 π', trend: '-2.1%', positive: false }
            ].map((perf, idx) => (
              <div key={idx} className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl flex items-center justify-between shadow-md">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">{perf.label}</span>
                  <span className="text-lg font-black text-white font-mono">{perf.value}</span>
                </div>
                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${perf.positive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                  {perf.trend}
                </span>
              </div>
            ))}
          </div>

          <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-200">Sales Trend</h3>
                <p className="text-[10px] text-slate-500">Weekly breakdown of gross sales volumes</p>
              </div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-850">
                <Calendar className="w-3.5 h-3.5 text-violet-400" /> Mon - Sun
              </span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_SALES_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#475569" fontSize={10} fontWeight="bold" />
                  <YAxis stroke="#475569" fontSize={10} fontWeight="bold" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '11px' }}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* SECTION 7: Verification Status */}
        <section id="seller_verification_status" className="lg:col-span-4 space-y-4">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-4 bg-violet-500 rounded-full inline-block" />
            Verification Status
          </h2>

          <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-6 space-y-6 shadow-xl h-full flex flex-col justify-between">
            <div className="space-y-5">
              
              <div className="flex items-center justify-between p-3.5 bg-slate-950/40 border border-slate-850 rounded-xl">
                <div>
                  <h4 className="text-xs font-black text-slate-200 uppercase tracking-wide">Pi Network Verified</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Consensus member confirmation</p>
                </div>
                <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider">
                  Verified
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-950/40 border border-slate-850 rounded-xl">
                <div>
                  <h4 className="text-xs font-black text-slate-200 uppercase tracking-wide">Business Entity Verified</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Corporate document audit status</p>
                </div>
                <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider">
                  Approved
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-400">Profile Completion</span>
                  <span className="font-mono font-black text-violet-400">85%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-850">
                  <div className="bg-violet-600 h-full rounded-full" style={{ width: '85%' }} />
                </div>
              </div>

            </div>

            <div className="pt-6 border-t border-slate-850 bg-violet-600/5 p-4 rounded-xl border border-violet-500/10 mt-auto">
              <div className="flex gap-3">
                <Star className="w-5 h-5 text-amber-400 shrink-0 fill-amber-400" />
                <div>
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block">Average rating</span>
                  <p className="text-base font-black text-white leading-none mt-1">4.9 <span className="text-slate-500 text-xs font-semibold">/ 5.0 (212 reviews)</span></p>
                </div>
              </div>
            </div>

          </div>
        </section>

      </div>

    </div>
  );
};
