/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Settings, Flag, Wrench, Megaphone, ShieldCheck, 
  Database, Lock, Server, Terminal, Save, 
  Plus, Trash2, Edit3, CheckCircle2, AlertTriangle,
  History, Eye, UserCheck, Activity, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/adminService';
import { auditService } from '../services/auditService';
import { 
  PlatformSettings, FeatureFlag, MaintenanceWindow, 
  SystemAnnouncement, AuditLog 
} from '../types';
import { useAuth } from '../auth/useAuth';
import Navbar from '../components/Navbar';

type AdminTab = 'settings' | 'flags' | 'maintenance' | 'announcements' | 'governance';

export const AdminConsole: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('settings');
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceWindow[]>([]);
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user, activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      switch (activeTab) {
        case 'settings':
          const s = await adminService.getPlatformSettings();
          setSettings(s);
          break;
        case 'flags':
          const f = await adminService.getFeatureFlags();
          setFlags(f);
          break;
        case 'maintenance':
          const m = await adminService.getMaintenanceWindows();
          setMaintenance(m);
          break;
        case 'announcements':
          const a = await adminService.getAnnouncements();
          setAnnouncements(a);
          break;
        case 'governance':
          const logs = await auditService.getAuditLogs({}, 20);
          setAuditLogs(logs);
          break;
      }
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !settings) return;
    setIsSaving(true);
    try {
      await adminService.updatePlatformSettings(user.uid, user.displayName || 'Admin', settings);
      // Show success toast here if available
    } catch (err) {
      console.error('Failed to update settings', err);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFlag = async (flag: FeatureFlag) => {
    if (!user) return;
    const updated = { ...flag, enabled: !flag.enabled };
    await adminService.upsertFeatureFlag(user.uid, user.displayName || 'Admin', updated);
    setFlags(flags.map(f => f.flagId === flag.flagId ? updated : f));
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <Navbar 
        currentUser={user as any} 
        currentView="admin_console" 
        onNavigate={(view) => navigate(`/${view}`)} 
        cartCount={0}
        walletBalance={0}
        onWalletUpdate={() => {}}
        onToggleCart={() => {}} 
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20">
              <Terminal className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Ops Console</h1>
              <p className="text-slate-500 font-medium">Enterprise governance & platform control</p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-full border border-slate-800">
            <Server className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Global Instance: Active</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-10 p-1.5 bg-slate-900/50 rounded-2xl border border-slate-800 w-fit">
          {[
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'flags', label: 'Feature Flags', icon: Flag },
            { id: 'maintenance', label: 'Maintenance', icon: Wrench },
            { id: 'announcements', label: 'Communications', icon: Megaphone },
            { id: 'governance', label: 'Governance', icon: ShieldCheck },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === tab.id 
                  ? 'bg-indigo-600 text-white shadow-lg' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-8 min-h-[500px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <Activity className="w-8 h-8 text-indigo-500 animate-pulse" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {activeTab === 'settings' && settings && (
                  <form onSubmit={handleUpdateSettings} className="max-w-3xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                      <div className="space-y-6">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                          <Globe className="w-5 h-5 text-indigo-400" />
                          Marketplace Core
                        </h3>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Default Currency</label>
                          <input 
                            type="text" 
                            value={settings.currency}
                            onChange={(e) => setSettings({...settings, currency: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Marketplace Fee (%)</label>
                          <input 
                            type="number" 
                            value={settings.marketplaceFeePercentage}
                            onChange={(e) => setSettings({...settings, marketplaceFeePercentage: parseFloat(e.target.value)})}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-all"
                          />
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
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-all"
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
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={isSaving}
                      className="flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20"
                    >
                      <Save className="w-5 h-5" />
                      {isSaving ? 'Synchronizing...' : 'Save Configuration'}
                    </button>
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
                        <div key={flag.flagId} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
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
                      {auditLogs.map((log) => (
                        <div key={log.logId} className="flex gap-4 p-4 hover:bg-white/5 rounded-xl transition-all border-b border-slate-800/50">
                          <div className={`mt-1 p-2 rounded-lg ${
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

                {/* Other tabs would follow similar structure */}
                {(activeTab === 'maintenance' || activeTab === 'announcements') && (
                  <div className="flex flex-col items-center justify-center h-96 text-center space-y-4">
                    <Database className="w-12 h-12 text-slate-800" />
                    <div>
                      <h3 className="text-lg font-bold text-white">Module Initializing</h3>
                      <p className="text-sm text-slate-600">This operations module is currently synchronized with the global cluster.</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminConsole;
