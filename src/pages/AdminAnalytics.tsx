/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, ComposedChart, Scatter 
} from 'recharts';
import { 
  Activity, Shield, Zap, Globe, AlertCircle, CheckCircle2, 
  Clock, Search, Database, Lock, Eye, HardDrive, Server,
  Users, ShoppingBag, RefreshCw, Terminal
} from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { analyticsService } from '../services/analyticsService';
import { auditService } from '../services/auditService';
import { SystemMetrics, AuditLog } from '../types';
import { useAuth } from '../auth/useAuth';
import Navbar from '../components/Navbar';

export const AdminAnalytics: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<SystemMetrics[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'observability' | 'audit'>('overview');

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const [m, a] = await Promise.all([
          analyticsService.getSystemMetrics(),
          auditService.getAuditLogs()
        ]);
        setMetrics(m.reverse());
        setAuditLogs(a);
      } catch (err) {
        console.error('Failed to load admin analytics', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user]);

  const latest = metrics[metrics.length - 1] || {
    dau: 0,
    mau: 0,
    totalRevenue: 0,
    totalOrders: 0,
    paymentSuccessRate: 0,
    apiErrorCount: 0,
    avgFulfillmentTime: 0
  };

  const StatusPill = ({ label, status }: { label: string, status: 'healthy' | 'warning' | 'error' }) => (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 rounded-full border border-slate-800">
      <div className={`w-2 h-2 rounded-full ${
        status === 'healthy' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 
        status === 'warning' ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' : 
        'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
      }`} />
      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{label}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <Navbar 
        currentUser={user as any} 
        currentView="admin_analytics" 
        onNavigate={(view) => navigate(`/${view}`)} 
        cartCount={0}
        walletBalance={0}
        onWalletUpdate={() => {}}
        onToggleCart={() => {}} 
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 pb-24 sm:pb-10">
        {/* System Status Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 md:mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-600 rounded-xl">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">System Control</h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium md:ml-12">Global infrastructure & observability</p>
          </div>
 
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <StatusPill label="API" status="healthy" />
            <StatusPill label="DB" status="healthy" />
            <StatusPill label="Pi" status="healthy" />
            <button 
              onClick={() => navigate('/admin-console')}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-full text-[10px] font-bold text-white uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20"
            >
              <Terminal className="w-3 h-3" />
              Ops
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 mb-8 overflow-x-auto scrollbar-hide">
          {[
            { id: 'overview', label: 'Overview', icon: Globe },
            { id: 'observability', label: 'Nodes', icon: Activity },
            { id: 'audit', label: 'Audit', icon: Lock },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 sm:px-6 py-4 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all relative whitespace-nowrap ${
                activeTab === tab.id ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
              )}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-10">
            {/* High Level Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[
                { title: 'DAU', value: latest.dau, icon: Users, color: 'text-indigo-400' },
                { title: 'MAU', value: latest.mau, icon: Activity, color: 'text-violet-400' },
                { title: 'Revenue (π)', value: latest.totalRevenue, icon: Zap, color: 'text-amber-400' },
                { title: 'Trans.', value: latest.totalOrders, icon: ShoppingBag, color: 'text-emerald-400' },
              ].map((stat, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-slate-900/50 border border-slate-800 p-4 sm:p-6 rounded-2xl sm:rounded-3xl"
                >
                  <div className="flex justify-between items-center mb-2 sm:mb-4">
                    <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
                    <span className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden xs:inline">Global</span>
                  </div>
                  <p className="text-slate-500 text-[9px] sm:text-xs font-bold uppercase tracking-wider">{stat.title}</p>
                  <h3 className="text-lg sm:text-2xl font-bold text-white mt-0.5 sm:mt-1 truncate">{stat.value.toLocaleString()}</h3>
                </motion.div>
              ))}
            </div>

            {/* Growth Chart */}
            <div className="bg-slate-900/50 border border-slate-800 p-4 sm:p-8 rounded-3xl">
              <h3 className="text-base sm:text-lg font-bold text-white mb-6 sm:mb-8">Traffic Velocity</h3>
              <div className="h-64 sm:h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b'}} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                    />
                    <Area type="monotone" dataKey="dau" fill="#6366f1" stroke="#6366f1" fillOpacity={0.1} />
                    <Line type="monotone" dataKey="mau" stroke="#8b5cf6" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'observability' && (          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            <div className="bg-slate-900/50 border border-slate-800 p-6 md:p-8 rounded-3xl">
              <div className="flex justify-between items-center mb-6 md:mb-8">
                <h3 className="text-base md:text-lg font-bold text-white">System Error Volume</h3>
                <AlertCircle className="w-5 h-5 text-rose-500" />
              </div>
              <div className="h-48 md:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b'}} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} />
                    <Bar dataKey="apiErrorCount" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
 
            <div className="bg-slate-900/50 border border-slate-800 p-6 md:p-8 rounded-3xl">
              <div className="flex justify-between items-center mb-6 md:mb-8">
                <h3 className="text-base md:text-lg font-bold text-white">Payment Health</h3>
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="flex items-center justify-center h-48 md:h-64">
                <div className="relative w-36 h-36 md:w-48 md:h-48 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="50%" cy="50%" r="40%" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                    <circle cx="50%" cy="50%" r="40%" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - latest.paymentSuccessRate / 100)} className="text-emerald-500 transition-all duration-1000" />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl md:text-4xl font-bold">{latest.paymentSuccessRate}%</span>
                    <span className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Success</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        )}

        {activeTab === 'audit' && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="px-8 py-6 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">Immutable Audit Stream</h3>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-[10px] font-bold text-slate-300 uppercase tracking-widest transition-all">
                <RefreshCw className="w-3 h-3" /> Refresh Logs
              </button>
            </div>
            
            <div className="overflow-x-auto scrollbar-hide -mx-4 sm:mx-0">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-800/30 text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">
                    <th className="px-6 sm:px-8 py-4">Timestamp</th>
                    <th className="px-6 sm:px-8 py-4">Actor</th>
                    <th className="px-6 sm:px-8 py-4">Action</th>
                    <th className="px-6 sm:px-8 py-4">Target</th>
                    <th className="px-6 sm:px-8 py-4">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {auditLogs.map((log) => (
                    <tr key={log.logId} className="hover:bg-slate-800/20 transition-colors group">
                      <td className="px-6 sm:px-8 py-4">
                        <div className="flex flex-col">
                          <span className="text-[11px] sm:text-xs font-medium text-slate-300">
                            {new Date(log.timestamp).toLocaleDateString()}
                          </span>
                          <span className="text-[9px] sm:text-[10px] text-slate-600 font-mono">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 sm:px-8 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">
                            {log.actorName.charAt(0)}
                          </div>
                          <span className="text-[11px] sm:text-xs text-slate-400">{log.actorName}</span>
                        </div>
                      </td>
                      <td className="px-6 sm:px-8 py-4">
                        <span className="px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-md text-[9px] sm:text-[10px] font-bold border border-indigo-500/20">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 sm:px-8 py-4">
                        <div className="flex flex-col">
                          <span className="text-[11px] sm:text-xs text-slate-300 capitalize">{log.targetType}</span>
                          <span className="text-[9px] sm:text-[10px] text-slate-600 font-mono truncate max-w-[100px]">{log.targetId}</span>
                        </div>
                      </td>
                      <td className="px-6 sm:px-8 py-4">
                        <div className={`flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-tighter ${
                          log.severity === 'critical' ? 'text-rose-500' : 
                          log.severity === 'warning' ? 'text-amber-500' : 
                          'text-emerald-500'
                        }`}>
                          {log.severity === 'critical' ? <AlertCircle className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          {log.severity}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminAnalytics;
