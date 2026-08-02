/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Settings, Flag, ShieldCheck, Database, Lock, Server, Save, Plus, AlertTriangle, 
  History, UserCheck, Activity, Users, Store, Box, ShoppingBag, CreditCard, Award, 
  MessageSquare, Megaphone, ShieldAlert, Shield, HeartPulse, Menu, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/adminService';
import { PlatformSettings, FeatureFlag, AuditLog } from '../types';
import { useAuth } from '../auth/useAuth';
import Navbar from '../components/Navbar';
import { BlockchainAdminDashboard } from '../components/admin/BlockchainAdminDashboard';
import { 
  DashboardPanel, UserManagementPanel, BusinessManagementPanel, StoreManagementPanel,
  ProductManagementPanel, ServiceManagementPanel, OrderAnalyticsPanel, PaymentAnalyticsPanel,
  BmpAnalyticsPanel, CommunityAnalyticsPanel, MarketingAnalyticsPanel, SystemHealthPanel,
  SecurityCenterPanel, BackupRecoveryPanel
} from '../components/admin/MissionControlPanels';

type AdminTab = 
  | 'dashboard' | 'users' | 'businesses' | 'stores' | 'products' | 'services'
  | 'orders' | 'payments' | 'bmp' | 'community' | 'marketing' | 'blockchain' 
  | 'health' | 'flags' | 'security' | 'backup' | 'governance' | 'settings';

export const AdminConsole: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user, activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'settings') {
        const s = await adminService.getPlatformSettings();
        setSettings(s);
      } else if (activeTab === 'flags') {
        const f = await adminService.getFeatureFlags();
        setFlags(f);
      } else if (activeTab === 'governance') {
        const logs = await adminService.getAuditLogs(50);
        setAuditLogs(logs);
      }
    } catch (err) {
      console.error("Failed to load admin data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setIsSaving(true);
    try {
      await adminService.updatePlatformSettings(user?.uid || 'unknown', user?.displayName || 'Unknown Admin', settings);
      const updatedLogs = await adminService.getAuditLogs(50);
      setAuditLogs(updatedLogs);
    } catch (error) {
      console.error("Failed to save settings", error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFlag = async (flag: FeatureFlag) => {
    try {
      const updated = { ...flag, enabled: !flag.enabled };
      await adminService.updateFeatureFlag(flag.flagId, updated, user?.uid || 'unknown');
      setFlags(flags.map(f => f.flagId === flag.flagId ? updated : f));
    } catch (error) {
      console.error("Failed to toggle flag", error);
    }
  };

  const navCategories = [
    {
      title: 'Platform Overview',
      items: [
        { id: 'dashboard', label: 'Mission Control', icon: Activity },
      ]
    },
    {
      title: 'Directory',
      items: [
        { id: 'users', label: 'Users', icon: Users },
        { id: 'businesses', label: 'Businesses', icon: Store },
        { id: 'stores', label: 'Stores', icon: Store },
        { id: 'products', label: 'Products', icon: Box },
        { id: 'services', label: 'Services', icon: Box },
      ]
    },
    {
      title: 'Analytics & Insights',
      items: [
        { id: 'orders', label: 'Orders', icon: ShoppingBag },
        { id: 'payments', label: 'Payments', icon: CreditCard },
        { id: 'bmp', label: 'BMP Rewards', icon: Award },
        { id: 'marketing', label: 'Marketing', icon: Megaphone },
        { id: 'community', label: 'Community', icon: MessageSquare },
      ]
    },
    {
      title: 'Operations',
      items: [
        { id: 'blockchain', label: 'Blockchain & RPC', icon: Server },
        { id: 'health', label: 'System Health', icon: HeartPulse },
        { id: 'flags', label: 'Feature Flags', icon: Flag },
      ]
    },
    {
      title: 'Security & Compliance',
      items: [
        { id: 'security', label: 'Security Center', icon: ShieldAlert },
        { id: 'governance', label: 'Audit Logs', icon: History },
        { id: 'backup', label: 'Backup & Recovery', icon: Database },
        { id: 'settings', label: 'Settings', icon: Settings },
      ]
    }
  ];

  if (isLoading && !settings && activeTab === 'settings') {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] selection:bg-indigo-500/30 flex flex-col">
      <Navbar 
        currentView="admin_console"
        onNavigate={() => {}}
        cartCount={0}
        walletBalance={0}
        onWalletUpdate={() => {}}
        onToggleCart={() => {}}
      />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Mobile Sidebar Toggle */}
        <div className="md:hidden absolute top-20 left-4 z-50">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static inset-y-0 left-0 z-40 w-64 bg-slate-950 border-r border-slate-800 overflow-y-auto transition-transform duration-300 ease-in-out pt-20 md:pt-0`}>
          <div className="p-6">
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Shield className="w-6 h-6 text-indigo-500" /> 
              Ops Center
            </h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Enterprise Grade</p>
          </div>
          
          <div className="px-4 pb-6 space-y-6">
            {navCategories.map((category, idx) => (
              <div key={idx}>
                <h3 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">{category.title}</h3>
                <div className="space-y-1">
                  {category.items.map(item => (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id as AdminTab); setSidebarOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        activeTab === item.id 
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                          : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-[#020617] p-6 lg:p-10 pt-20 md:pt-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-6xl mx-auto"
            >
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-white tracking-tight capitalize">
                  {navCategories.flatMap(c => c.items).find(i => i.id === activeTab)?.label || activeTab}
                </h1>
                <p className="text-sm text-slate-500 mt-1">Mission Control / {navCategories.find(c => c.items.some(i => i.id === activeTab))?.title}</p>
              </div>

              {activeTab === 'dashboard' && <DashboardPanel />}
              {activeTab === 'users' && <UserManagementPanel />}
              {activeTab === 'businesses' && <BusinessManagementPanel />}
              {activeTab === 'stores' && <StoreManagementPanel />}
              {activeTab === 'products' && <ProductManagementPanel />}
              {activeTab === 'services' && <ServiceManagementPanel />}
              {activeTab === 'orders' && <OrderAnalyticsPanel />}
              {activeTab === 'payments' && <PaymentAnalyticsPanel />}
              {activeTab === 'bmp' && <BmpAnalyticsPanel />}
              {activeTab === 'community' && <CommunityAnalyticsPanel />}
              {activeTab === 'marketing' && <MarketingAnalyticsPanel />}
              {activeTab === 'blockchain' && <BlockchainAdminDashboard />}
              {activeTab === 'health' && <SystemHealthPanel />}
              {activeTab === 'security' && <SecurityCenterPanel />}
              {activeTab === 'backup' && <BackupRecoveryPanel />}
              
              {activeTab === 'settings' && settings && (
                <form onSubmit={handleSaveSettings} className="space-y-8 bg-slate-900/50 p-6 md:p-8 rounded-3xl border border-slate-800">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-indigo-400" />
                        Platform Global Toggles
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                          <div>
                            <span className="text-sm font-bold text-white block">Maintenance Mode</span>
                            <span className="text-xs text-slate-500">Suspend all non-admin access</span>
                          </div>
                          <button 
                            type="button"
                            onClick={() => setSettings({...settings, isMaintenanceMode: !settings.isMaintenanceMode})}
                            className={`w-12 h-6 rounded-full relative transition-all ${settings.isMaintenanceMode ? 'bg-indigo-600' : 'bg-slate-800'}`}
                          >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.isMaintenanceMode ? 'left-7' : 'left-1'}`} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                          <div>
                            <span className="text-sm font-bold text-white block">New Registrations</span>
                            <span className="text-xs text-slate-500">Allow new users to sign up</span>
                          </div>
                          <button 
                            type="button"
                            onClick={() => setSettings({...settings, allowNewRegistrations: !settings.allowNewRegistrations})}
                            className={`w-12 h-6 rounded-full relative transition-all ${settings.allowNewRegistrations ? 'bg-indigo-600' : 'bg-slate-800'}`}
                          >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.allowNewRegistrations ? 'left-7' : 'left-1'}`} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-emerald-400" />
                        Governance & Access
                      </h3>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Registration Policy</label>
                        <select 
                          value={settings.registrationPolicy}
                          onChange={(e) => setSettings({...settings, registrationPolicy: e.target.value as any})}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-all text-white"
                        >
                          <option value="open">Open (Public)</option>
                          <option value="invite_only">Invite Only</option>
                          <option value="restricted">Restricted (Admin Approval)</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-3 py-4">
                        <input 
                          type="checkbox" 
                          checked={settings.businessVerificationRequired}
                          onChange={(e) => setSettings({...settings, businessVerificationRequired: e.target.checked})}
                          className="w-5 h-5 rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm font-medium text-slate-300">Require Business Verification</span>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Marketplace Fee (%)</label>
                        <input 
                          type="number" 
                          value={settings.marketplaceFeePercentage}
                          onChange={(e) => setSettings({...settings, marketplaceFeePercentage: parseFloat(e.target.value)})}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-all text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-800">
                    <button 
                      type="submit"
                      disabled={isSaving}
                      className="flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20"
                    >
                      <Save className="w-5 h-5" />
                      {isSaving ? 'Synchronizing...' : 'Save Configuration'}
                    </button>
                  </div>
                </form>
              )}

              {activeTab === 'flags' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">Runtime Feature Gates</h3>
                    <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-xl text-xs font-bold text-white hover:bg-indigo-500 transition-all">
                      <Plus className="w-4 h-4" /> New Flag
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {flags.map((flag) => (
                      <div key={flag.flagId} className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-white">{flag.name}</h4>
                          <p className="text-xs text-slate-500 mt-1">{flag.description}</p>
                          <div className="mt-3 flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-600 uppercase">Rollout: {flag.rolloutPercentage}%</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => toggleFlag(flag)}
                          className={`w-14 h-8 rounded-full relative transition-all ${flag.enabled ? 'bg-indigo-600' : 'bg-slate-800'}`}
                        >
                          <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${flag.enabled ? 'left-7' : 'left-1'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'governance' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-6 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl mb-8">
                    <History className="w-6 h-6 text-indigo-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white">Immutable Governance Logs</h3>
                      <p className="text-xs text-slate-500">Every administrative action is recorded and cannot be deleted or modified.</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {auditLogs.length === 0 && (
                       <p className="text-center text-slate-500 py-8 text-sm">No audit logs found.</p>
                    )}
                    {auditLogs.map((log) => (
                      <div key={log.logId} className="flex gap-4 p-4 bg-slate-900/50 hover:bg-slate-800/80 rounded-xl transition-all border border-slate-800">
                        <div className={`mt-1 p-2 rounded-lg h-fit ${
                          log.severity === 'critical' ? 'bg-rose-500/20 text-rose-500' : 
                          log.severity === 'warning' ? 'bg-amber-500/20 text-amber-500' : 
                          'bg-emerald-500/20 text-emerald-500'
                        }`}>
                          <Lock className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className="text-xs font-bold text-slate-200">{log.action}</h4>
                            <span className="text-[10px] text-slate-600 font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{log.description}</p>
                          <div className="mt-2 flex items-center gap-3">
                            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Actor: {log.actorName}</span>
                            <span className="text-[10px] text-slate-600 font-mono">ID: {log.logId}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default AdminConsole;
