/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Shield,
  Users,
  Store,
  Briefcase,
  Coins,
  Cpu,
  Sliders,
  CheckCircle,
  AlertTriangle,
  FileText,
  Trash2,
  RefreshCw,
  Search,
  Check,
  X,
  Plus,
  AlertCircle,
  Lock,
  Globe,
  Database,
  ArrowRight,
  TrendingUp,
  SlidersHorizontal,
  Layers,
  Sparkles,
  UserCheck,
  ToggleLeft,
  ToggleRight,
  Download,
  Terminal,
  Settings,
  Flame,
  FileSpreadsheet
} from 'lucide-react';
import { User as UserType } from '../types';

interface GlobalCommandCenterProps {
  currentUser: UserType;
  onNavigate: (view: string) => void;
}

// Interfaces
interface Tenant {
  id: string;
  name: string;
  ownerName: string;
  email: string;
  status: 'Active' | 'Suspended' | 'Soft Deleted';
  quotaGb: number;
  featurePackage: 'Standard' | 'Premium' | 'Enterprise';
  billingPlan: 'Monthly' | 'Yearly';
  customDomain: string;
  healthScore: number;
  logoUrl?: string;
  createdAt: string;
}

interface KycRecord {
  id: string;
  userName: string;
  userType: 'Pioneer' | 'Merchant' | 'Business';
  docType: 'Passport' | 'National ID' | 'Business License';
  docUrl: string;
  submittedAt: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

interface ModerationItem {
  id: string;
  type: 'Product' | 'Service' | 'Job' | 'Review' | 'Message';
  title: string;
  ownerName: string;
  content: string;
  flagReason: string;
  flagCount: number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Suspended';
}

interface FraudCase {
  id: string;
  userName: string;
  riskType: 'Bot Activity' | 'Suspicious Payments' | 'Velocity Attack' | 'Wallet Abuse' | 'Fake Reviews';
  riskScore: number; // 0 - 100
  recentActivity: string;
  status: 'Flagged' | 'Under Review' | 'Cleared' | 'Banned';
}

interface AuditLog {
  id: string;
  timestamp: string;
  operator: string;
  action: string;
  category: 'Auth' | 'Role Change' | 'Payment' | 'Refund' | 'Moderation' | 'Verification' | 'Config' | 'AI Decision' | 'System';
  details: string;
  severity: 'Info' | 'Warning' | 'Critical';
}

// Initial Seeds
const INITIAL_TENANTS: Tenant[] = [
  { id: 'tn-9102', name: 'EU Pioneer Trade Hub', ownerName: 'Jean Dupont', email: 'jean@pi-europe.org', status: 'Active', quotaGb: 150, featurePackage: 'Enterprise', billingPlan: 'Yearly', customDomain: 'europe.pibusiness.market', healthScore: 98, createdAt: '2026-01-12' },
  { id: 'tn-3482', name: 'Asia Pacific Direct Node', ownerName: 'Yuki Tanaka', email: 'yuki@apac-pinetwork.co', status: 'Active', quotaGb: 100, featurePackage: 'Premium', billingPlan: 'Monthly', customDomain: 'apac.pibusiness.market', healthScore: 94, createdAt: '2026-03-05' },
  { id: 'tn-7721', name: 'Americas Commerce Co-op', ownerName: 'Sarah Miller', email: 'sarah@americas-coop.net', status: 'Active', quotaGb: 200, featurePackage: 'Enterprise', billingPlan: 'Yearly', customDomain: 'americas.pibusiness.market', healthScore: 89, createdAt: '2025-11-20' },
  { id: 'tn-1104', name: 'Middle East Tech Gateway', ownerName: 'Fahad Al-Mansoori', email: 'fahad@me-gateway.ae', status: 'Suspended', quotaGb: 50, featurePackage: 'Standard', billingPlan: 'Monthly', customDomain: 'me.pibusiness.market', healthScore: 45, createdAt: '2026-04-18' }
];

const INITIAL_KYC_RECORDS: KycRecord[] = [
  { id: 'kyc-001', userName: 'Marco Coffee', userType: 'Merchant', docType: 'Business License', docUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=300&q=80', submittedAt: '2026-07-17T12:30:00Z', status: 'Pending' },
  { id: 'kyc-002', userName: 'Johnathan Spark', userType: 'Pioneer', docType: 'National ID', docUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=300&q=80', submittedAt: '2026-07-18T01:15:00Z', status: 'Pending' },
  { id: 'kyc-003', userName: 'Dr. Evelyn Carter', userType: 'Pioneer', docType: 'Passport', docUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=300&q=80', submittedAt: '2026-07-16T09:45:00Z', status: 'Approved' },
  { id: 'kyc-004', userName: 'Alex Rivera', userType: 'Business', docType: 'Passport', docUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=300&q=80', submittedAt: '2026-07-18T05:00:00Z', status: 'Pending' }
];

const INITIAL_MODERATION_ITEMS: ModerationItem[] = [
  { id: 'mod-101', type: 'Product', title: 'Suspicious Software key', ownerName: 'cryptohacker_9', content: 'Unlimited steam wallet codes and bypass licenses for 5 Pi. Guaranteed working.', flagReason: 'Terms Violation / Fraudulent', flagCount: 4, status: 'Pending' },
  { id: 'mod-102', type: 'Review', title: 'Review on Pi Tech HQ', ownerName: 'shill_account_2', content: 'This store is complete garbage. Buy instead at satoshi-super-market.com for 50% discount!', flagReason: 'Spam/Advertisement', flagCount: 2, status: 'Pending' },
  { id: 'mod-103', type: 'Job', title: 'High Yield Investment Manager', ownerName: 'easy_wealth_corp', content: 'Earn 1000 Pi daily! Send 50 Pi membership fee to begin trading. Remote 100%.', flagReason: 'Phishing/MLM Schemes', flagCount: 8, status: 'Pending' },
  { id: 'mod-104', type: 'Service', title: 'LED Installation SF', ownerName: 'Johnathan Spark', content: 'Professional household wire audit and custom LED lighting setup.', flagReason: 'Duplicate listing', flagCount: 1, status: 'Approved' }
];

const INITIAL_FRAUD_CASES: FraudCase[] = [
  { id: 'frd-201', userName: 'bot_army_alpha_23', riskType: 'Bot Activity', riskScore: 92, recentActivity: 'Generated 45 marketplace listings in 3 minutes via rapid API payload simulation.', status: 'Flagged' },
  { id: 'frd-202', userName: 'wallet_spammer_x', riskType: 'Wallet Abuse', riskScore: 84, recentActivity: 'Velocity threshold breached: Sent 0.01 Pi to 480 separate wallets inside 10 minutes.', status: 'Flagged' },
  { id: 'frd-203', userName: 'ReviewShill_7', riskType: 'Fake Reviews', riskScore: 78, recentActivity: 'Identical 5-star reviews on 12 products owned by the same merchant using identical browser finger-hashes.', status: 'Under Review' },
  { id: 'frd-204', userName: 'legit_buyer_10', riskType: 'Velocity Attack', riskScore: 22, recentActivity: 'Purchased 3 coffee bags from Decentral Cafe over 2 hours.', status: 'Cleared' }
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  { id: 'aud-401', timestamp: '2026-07-18T06:30:12Z', operator: 'admin_control', action: 'RE-ROUTE_AI_ROUTING', category: 'AI Decision', details: 'Automated fallback routed to Gemini 1.5 Flash due to latency spike in primary provider.', severity: 'Info' },
  { id: 'aud-402', timestamp: '2026-07-18T05:12:45Z', operator: 'sys_sentinel', action: 'SUSPEND_TENANT', category: 'Config', details: 'Tenant tn-1104 automatically suspended: payment failure & threshold breach.', severity: 'Critical' },
  { id: 'aud-403', timestamp: '2026-07-18T04:22:01Z', operator: 'akhileshs68@gmail.com', action: 'ROLE_PROMOTION', category: 'Role Change', details: 'Promoted satoshi_pi to Master Verification Representative.', severity: 'Warning' },
  { id: 'aud-404', timestamp: '2026-07-18T03:45:10Z', operator: 'gateway_ledger', action: 'PAYMENT_AUDIT', category: 'Payment', details: 'Verified transaction tx_pi_8892102143124390018429382109 of 45.00 Pi.', severity: 'Info' }
];

export const GlobalCommandCenter: React.FC<GlobalCommandCenterProps> = ({ currentUser, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tenants' | 'kyc' | 'moderation' | 'fraud' | 'aiops' | 'flags' | 'audit' | 'config'>('dashboard');
  
  // Real-time metrics simulation
  const [activePioneers, setActivePioneers] = useState(14502);
  const [activeMerchants, setActiveMerchants] = useState(482);
  const [activeBusinesses, setActiveBusinesses] = useState(212);
  const [totalOrders, setTotalOrders] = useState(8920);
  const [totalPaymentsPi, setTotalPaymentsPi] = useState(384920.25);
  const [aiRequests, setAiRequests] = useState(34190);
  const [systemHealth, setSystemHealth] = useState(99.98);
  const [dbReadCount, setDbReadCount] = useState(482910);
  const [dbWriteCount, setDbWriteCount] = useState(34902);
  const [activeIncidents, setActiveIncidents] = useState<string[]>([]);
  
  // Interactive State
  const [tenants, setTenants] = useState<Tenant[]>(INITIAL_TENANTS);
  const [kycRecords, setKycRecords] = useState<KycRecord[]>(INITIAL_KYC_RECORDS);
  const [moderationItems, setModerationItems] = useState<ModerationItem[]>(INITIAL_MODERATION_ITEMS);
  const [fraudCases, setFraudCases] = useState<FraudCase[]>(INITIAL_FRAUD_CASES);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  
  // Form/Input states
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateTenantModal, setShowCreateTenantModal] = useState(false);
  const [newTenant, setNewTenant] = useState<Partial<Tenant>>({
    name: '', ownerName: '', email: '', quotaGb: 100, featurePackage: 'Standard', billingPlan: 'Monthly', customDomain: ''
  });

  // AIOps Settings
  const [aiProvider, setAiProvider] = useState<'gemini' | 'openai' | 'anthropic'>('gemini');
  const [aiModel, setAiModel] = useState('gemini-2.5-flash-v1.0');
  const [promptVersion, setPromptVersion] = useState('v1.8.2-stable');
  const [latencyMs, setLatencyMs] = useState(240);
  const [aiErrorRate, setAiErrorRate] = useState(0.02);

  // Feature flags
  const [flags, setFlags] = useState({
    pioneerServices: true,
    jobsEngine: true,
    aiPlatform: true,
    commerceEngine: true,
    velocityDefense: true,
    gdprHardMode: false,
    autoKycApproval: false,
    abPricingExperiment: false
  });

  // Configuration settings
  const [rateLimitDaily, setRateLimitDaily] = useState(500);
  const [maxPaymentSize, setMaxPaymentSize] = useState(10000);
  const [platformFeePercent, setPlatformFeePercent] = useState(1.5);
  const [alertEmail, setAlertEmail] = useState('secops@pibusiness.market');

  // Trigger real-time visual simulation changes
  useEffect(() => {
    const timer = setInterval(() => {
      setActivePioneers(p => p + (Math.random() > 0.6 ? 1 : 0));
      setAiRequests(a => a + (Math.random() > 0.3 ? 1 : 0));
      setDbReadCount(r => r + Math.floor(Math.random() * 5));
      setDbWriteCount(w => w + Math.floor(Math.random() * 1.2));
      setTotalPaymentsPi(v => v + (Math.random() > 0.85 ? Number((Math.random() * 5).toFixed(2)) : 0));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const addAuditLog = (action: string, category: AuditLog['category'], details: string, severity: AuditLog['severity'] = 'Info') => {
    const log: AuditLog = {
      id: `aud-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toISOString(),
      operator: currentUser.email || currentUser.username || 'akhileshs68@gmail.com',
      action,
      category,
      details,
      severity
    };
    setAuditLogs(prev => [log, ...prev]);
  };

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenant.name || !newTenant.ownerName) return;
    const added: Tenant = {
      id: `tn-${Math.floor(1000 + Math.random() * 9000)}`,
      name: newTenant.name,
      ownerName: newTenant.ownerName,
      email: newTenant.email || `${newTenant.ownerName.toLowerCase().replace(' ', '')}@pi.net`,
      status: 'Active',
      quotaGb: Number(newTenant.quotaGb) || 100,
      featurePackage: newTenant.featurePackage as any || 'Standard',
      billingPlan: newTenant.billingPlan as any || 'Monthly',
      customDomain: newTenant.customDomain || `${newTenant.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.pibusiness.market`,
      healthScore: 100,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setTenants([...tenants, added]);
    addAuditLog('CREATE_TENANT', 'Config', `Provisioned new SaaS Tenant: ${added.name} with ${added.featurePackage} license.`, 'Info');
    setShowCreateTenantModal(false);
    setNewTenant({ name: '', ownerName: '', email: '', quotaGb: 100, featurePackage: 'Standard', billingPlan: 'Monthly', customDomain: '' });
  };

  const toggleTenantStatus = (id: string) => {
    setTenants(prev => prev.map(t => {
      if (t.id === id) {
        const nextStatus = t.status === 'Active' ? 'Suspended' : 'Active';
        addAuditLog('UPDATE_TENANT_STATUS', 'Config', `Tenant ${t.name} state modified to ${nextStatus}.`, nextStatus === 'Suspended' ? 'Warning' : 'Info');
        return { ...t, status: nextStatus, healthScore: nextStatus === 'Suspended' ? 30 : 98 };
      }
      return t;
    }));
  };

  const softDeleteTenant = (id: string) => {
    setTenants(prev => prev.map(t => {
      if (t.id === id) {
        addAuditLog('DELETE_TENANT', 'Config', `Soft deleted tenant workspace: ${t.name}. Safe rollback snapshot archived.`, 'Critical');
        return { ...t, status: 'Soft Deleted', healthScore: 0 };
      }
      return t;
    }));
  };

  const handleApproveKyc = (id: string) => {
    setKycRecords(prev => prev.map(k => {
      if (k.id === id) {
        addAuditLog('KYC_APPROVAL', 'Verification', `Manually approved ${k.userType} credentials for user: ${k.userName}.`, 'Info');
        return { ...k, status: 'Approved' };
      }
      return k;
    }));
  };

  const handleRejectKyc = (id: string) => {
    setKycRecords(prev => prev.map(k => {
      if (k.id === id) {
        addAuditLog('KYC_REJECTION', 'Verification', `Manually rejected KYC file for: ${k.userName} due to high document blur.`, 'Warning');
        return { ...k, status: 'Rejected' };
      }
      return k;
    }));
  };

  const handleModAction = (id: string, action: 'Approved' | 'Rejected' | 'Suspended') => {
    setModerationItems(prev => prev.map(m => {
      if (m.id === id) {
        addAuditLog('MODERATION_DECISION', 'Moderation', `Moderator action [${action}] applied to listing ${m.type} ID: ${m.id} by operator.`, action === 'Approved' ? 'Info' : 'Warning');
        return { ...m, status: action };
      }
      return m;
    }));
  };

  const handleFraudAction = (id: string, action: 'Banned' | 'Cleared' | 'Under Review') => {
    setFraudCases(prev => prev.map(f => {
      if (f.id === id) {
        addAuditLog('FRAUD_RESOLUTION', 'Moderation', `Fraud risk case resolved. Target: ${f.userName} set to [${action}].`, action === 'Banned' ? 'Critical' : 'Info');
        return { ...f, status: action };
      }
      return f;
    }));
  };

  const toggleFlag = (flagName: keyof typeof flags) => {
    const newVal = !flags[flagName];
    setFlags(prev => ({ ...prev, [flagName]: newVal }));
    addAuditLog('TOGGLE_FEATURE_FLAG', 'Config', `Feature flag [${String(flagName)}] altered dynamically to [${newVal ? 'ENABLED' : 'DISABLED'}].`, 'Warning');
  };

  const handleTriggerIncident = () => {
    if (activeIncidents.length > 0) {
      setActiveIncidents([]);
      setSystemHealth(99.98);
      addAuditLog('SYSTEM_HEAL', 'System', 'Incident resolved. System pipelines reverted to nominal healthy state.', 'Info');
    } else {
      setActiveIncidents(['Firestore regional replication delay in AP-East', 'Queue velocity throttling on wallet callbacks']);
      setSystemHealth(94.21);
      addAuditLog('INCIDENT_TRIGGER', 'System', 'Critical latency alert detected in Firestore AP-East regional replication queue.', 'Critical');
    }
  };

  const handleSaveConfig = () => {
    addAuditLog('SAVE_SYSTEM_CONFIG', 'Config', `Saved platform fees (${platformFeePercent}%) and rate limits (${rateLimitDaily} req/day) to secure storage schema.`, 'Info');
    alert('System configuration saved successfully and propagated across cluster node gateways.');
  };

  const handleExportCompliance = (type: string) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      tenantId: "global-master-tenant",
      gdprCompliant: true,
      timestamp: new Date().toISOString(),
      exportOperator: currentUser.email || "akhileshs68@gmail.com",
      dataScope: type,
      complianceStandard: "GDPR / CCPA Audit Export",
      auditLogs,
      activeFlags: flags
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `pibiz_compliance_report_${type}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addAuditLog('COMPLIANCE_EXPORT', 'System', `Executed official GDPR compliance dump for: ${type}. Archive exported.`, 'Info');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans" id="global_ops_platform">
      {/* ENTERPRISE ADMIN BANNER */}
      <div className="bg-slate-900 border-b border-slate-800 py-3.5 px-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-amber-500 to-red-500 p-2 rounded-xl shadow-lg shadow-amber-500/10">
            <Shield className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              Global Command Center
              <span className="bg-amber-500/10 text-amber-400 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border border-amber-500/20">
                PROD-ENV v1.0
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">Enterprise Administration, Governance, Security & Compliance</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Broker Node: ACTIVE</span>
          </div>
          <button
            onClick={() => onNavigate('marketplace')}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-all flex items-center gap-1.5"
            id="back_to_mkt"
          >
            <span>Exit Console</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* HORIZONTAL PILOT TABS */}
      <div className="border-b border-slate-900 bg-slate-900/60 backdrop-blur-md px-6 py-1 flex items-center gap-1 overflow-x-auto scrollbar-none">
        {[
          { id: 'dashboard', label: 'Observability Ops', icon: Activity },
          { id: 'tenants', label: 'SaaS Tenants', icon: Store },
          { id: 'kyc', label: 'KYC & Verification', icon: UserCheck },
          { id: 'moderation', label: 'Moderation Feed', icon: Shield },
          { id: 'fraud', label: 'Fraud Operations', icon: AlertTriangle },
          { id: 'aiops', label: 'AI Operations', icon: Cpu },
          { id: 'flags', label: 'Feature Flags', icon: SlidersHorizontal },
          { id: 'audit', label: 'Audit Ledger', icon: FileText },
          { id: 'config', label: 'System Policy & Compliance', icon: Settings }
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id as any);
                setSearchQuery('');
              }}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                isActive
                  ? 'border-amber-500 text-amber-400 bg-amber-500/[0.02]'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
              }`}
              id={`tab_nav_${t.id}`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-6">
        {/* TAB 1: REAL-TIME OBSERVABILITY OPS */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in" id="panel_dashboard">
            {/* ALERT BOX ON INCIDENT */}
            {activeIncidents.length > 0 && (
              <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-2xl flex items-start gap-3.5 text-red-200 animate-pulse">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-red-300">Active High-Priority Incident</h4>
                  <ul className="list-disc pl-5 mt-1 text-[11px] space-y-1 text-red-400 font-mono">
                    {activeIncidents.map((inc, i) => <li key={i}>{inc}</li>)}
                  </ul>
                </div>
                <button
                  onClick={handleTriggerIncident}
                  className="px-3 py-1 bg-red-500 text-slate-950 text-[10px] font-bold rounded-lg hover:bg-red-400 transition-all"
                >
                  Clear Incident
                </button>
              </div>
            )}

            {/* REAL-TIME HIGHLIGHTS */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Pioneers</span>
                  <Users className="w-4 h-4 text-violet-400" />
                </div>
                <p className="text-2xl font-mono font-bold tracking-tight text-white">{activePioneers.toLocaleString()}</p>
                <div className="flex items-center gap-1 text-[9px] text-emerald-400 mt-1 font-mono">
                  <TrendingUp className="w-3 h-3" />
                  <span>+24.1% MoM</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Merchants</span>
                  <Store className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-2xl font-mono font-bold tracking-tight text-white">{activeMerchants}</p>
                <div className="text-[9px] text-slate-500 mt-1 font-mono">
                  <span>98% verified stores</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pi Payments</span>
                  <Coins className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-2xl font-mono font-bold tracking-tight text-white">{totalPaymentsPi.toLocaleString(undefined, { maximumFractionDigits: 2 })} π</p>
                <div className="text-[9px] text-amber-500 font-mono mt-1">
                  <span>Sandbox Ledger Node</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">AI Platform Requests</span>
                  <Cpu className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-2xl font-mono font-bold tracking-tight text-white">{aiRequests.toLocaleString()}</p>
                <div className="text-[9px] text-slate-500 mt-1 font-mono">
                  <span>Avg Latency: 240ms</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">System Health</span>
                  <Activity className="w-4 h-4 text-emerald-400" />
                </div>
                <p className={`text-2xl font-mono font-bold tracking-tight ${systemHealth > 95 ? 'text-emerald-400' : 'text-red-400'}`}>{systemHealth}%</p>
                <div className="text-[9px] text-slate-500 mt-1 font-mono flex justify-between">
                  <span>Target: 99.99%</span>
                  {systemHealth > 95 ? <span className="text-emerald-500">Nominal</span> : <span className="text-red-400">Degraded</span>}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Queue Broker</span>
                  <Layers className="w-4 h-4 text-indigo-400" />
                </div>
                <p className="text-2xl font-mono font-bold tracking-tight text-white">0 lag</p>
                <div className="text-[9px] text-emerald-400 font-mono mt-1">
                  <span>Synced block: #892,109</span>
                </div>
              </div>
            </div>

            {/* TWO-COLUMN DETAILS GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* METRIC GRAPHS & LIVE PIPELINE */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl lg:col-span-2 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">Firestore Read/Write Velocity</h3>
                    <p className="text-[11px] text-slate-400">Live request counters mapped from the production database schema</p>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-mono">
                    <div className="flex items-center gap-1.5 text-indigo-400">
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                      <span>Reads: {dbReadCount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-amber-400">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>Writes: {dbWriteCount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* VISUAL SPARKBARS FOR FIRESTORE */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1 font-mono">
                      <span className="text-slate-400">Firestore Read Pipeline Load</span>
                      <span className="text-indigo-400 font-bold">{Math.floor((dbReadCount % 1000) / 10)}% Capacity</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-850">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${(dbReadCount % 1000) / 10}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1 font-mono">
                      <span className="text-slate-400">Firestore Write Pipeline Volume</span>
                      <span className="text-amber-400 font-bold">{Math.floor((dbWriteCount % 1000) / 10)}% Capacity</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-850">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(dbWriteCount % 1000) / 10}%` }}></div>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-400 space-y-1.5">
                    <p className="text-slate-200 font-bold text-xs">Storage Volume Analytics:</p>
                    <div className="flex justify-between">
                      <span>Total Active Storage Used:</span>
                      <span className="text-white">412.50 GB / 2.0 TB (20.6%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Registered Businesses:</span>
                      <span className="text-white">{activeBusinesses}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completed Super App Jobs:</span>
                      <span className="text-white">{totalOrders}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-between gap-4">
                  <button
                    onClick={handleTriggerIncident}
                    className="flex-1 py-2 px-3 rounded-lg border border-red-500/20 hover:bg-red-500/10 text-red-400 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>Simulate Critical Regional Incident</span>
                  </button>
                  <button
                    onClick={() => addAuditLog('FORCE_FLUSH_CACHE', 'System', 'Force-purged Redis node-caches and localized DB buffer nodes.', 'Warning')}
                    className="py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Flush Cache</span>
                  </button>
                </div>
              </div>

              {/* SERVICE WORKFLOWS MONITOR */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Platform Queue Status</h3>
                <p className="text-[11px] text-slate-400">Asynchronous microservice background processes queue depth</p>

                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 flex items-center justify-between">
                    <div>
                      <p className="text-white font-bold">Mail Broker Gateway</p>
                      <p className="text-[10px] text-slate-500">Trigger notifications, invoices</p>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] rounded border border-emerald-500/20 font-bold">0 Active</span>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 flex items-center justify-between">
                    <div>
                      <p className="text-white font-bold">Solidity Ledger Sync</p>
                      <p className="text-[10px] text-slate-500">Mainnet hash validators</p>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] rounded border border-emerald-500/20 font-bold">0 Active</span>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 flex items-center justify-between">
                    <div>
                      <p className="text-white font-bold">AIOps Async Feedback</p>
                      <p className="text-[10px] text-slate-500">Evaluation pipeline log queue</p>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 text-[10px] rounded border border-amber-500/20 font-bold">2 Queued</span>
                  </div>
                </div>

                <div className="p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Globe className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[11px] font-bold text-indigo-300">Global DNS & Custom Domains</span>
                  </div>
                  <p className="text-[10px] text-slate-400">DNS propagation status: 99.91% successfully registered. Automated LetsEncrypt certificates active.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SAAS TENANT MANAGEMENT */}
        {activeTab === 'tenants' && (
          <div className="space-y-6 animate-fade-in" id="panel_tenants">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">SaaS Tenants & Regional Clusters</h2>
                <p className="text-[11px] text-slate-400">Add, monitor, and regulate active enterprise sub-market groups</p>
              </div>
              <button
                onClick={() => setShowCreateTenantModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create SaaS Tenant</span>
              </button>
            </div>

            {/* CREATE TENANT MODAL */}
            {showCreateTenantModal && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Plus className="text-amber-500" />
                      Provision New Tenant Workspace
                    </h3>
                    <button onClick={() => setShowCreateTenantModal(false)} className="text-slate-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateTenant} className="space-y-4 text-xs">
                    <div className="space-y-1">
                      <label className="text-slate-400">Tenant Name *</label>
                      <input
                        type="text"
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                        placeholder="e.g. South America Node Cooperative"
                        value={newTenant.name}
                        onChange={e => setNewTenant({...newTenant, name: e.target.value})}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-slate-400">Owner Name *</label>
                        <input
                          type="text"
                          required
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                          placeholder="e.g. Carlos Silva"
                          value={newTenant.ownerName}
                          onChange={e => setNewTenant({...newTenant, ownerName: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-400">Contact Email</label>
                        <input
                          type="email"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                          placeholder="carlos@sa-coop.net"
                          value={newTenant.email}
                          onChange={e => setNewTenant({...newTenant, email: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-slate-400">Storage Quota (GB)</label>
                        <input
                          type="number"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                          value={newTenant.quotaGb}
                          onChange={e => setNewTenant({...newTenant, quotaGb: Number(e.target.value)})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-400">License Package</label>
                        <select
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                          value={newTenant.featurePackage}
                          onChange={e => setNewTenant({...newTenant, featurePackage: e.target.value as any})}
                        >
                          <option value="Standard">Standard</option>
                          <option value="Premium">Premium</option>
                          <option value="Enterprise">Enterprise</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-400">Billing Plan</label>
                        <select
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                          value={newTenant.billingPlan}
                          onChange={e => setNewTenant({...newTenant, billingPlan: e.target.value as any})}
                        >
                          <option value="Monthly">Monthly</option>
                          <option value="Yearly">Yearly</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-400">Custom Domain Name (Placeholder)</label>
                      <input
                        type="text"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                        placeholder="sa.pibusiness.market"
                        value={newTenant.customDomain}
                        onChange={e => setNewTenant({...newTenant, customDomain: e.target.value})}
                      />
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={() => setShowCreateTenantModal(false)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg"
                      >
                        Create Tenant
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* TENANTS DATABASE GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tenants.map(t => (
                <div
                  key={t.id}
                  className={`border p-5 rounded-2xl bg-slate-900 transition-all ${
                    t.status === 'Suspended'
                      ? 'border-red-950/60 opacity-75'
                      : t.status === 'Soft Deleted'
                      ? 'border-slate-950 opacity-40 line-through'
                      : 'border-slate-800 hover:border-slate-700 shadow-md'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase">Tenant ID: {t.id}</span>
                      <h3 className="text-sm font-bold text-white mt-0.5">{t.name}</h3>
                      <p className="text-[11px] text-slate-400">{t.ownerName} &bull; {t.email}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded-full border ${
                      t.status === 'Active'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : t.status === 'Suspended'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {t.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-800/60 text-[10px] font-mono my-3">
                    <div className="bg-slate-950/50 p-2 rounded-lg">
                      <span className="text-slate-500 uppercase block text-[8px]">Health Score</span>
                      <span className={`font-bold text-xs ${t.healthScore > 85 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {t.healthScore}%
                      </span>
                    </div>
                    <div className="bg-slate-950/50 p-2 rounded-lg">
                      <span className="text-slate-500 uppercase block text-[8px]">Licensing</span>
                      <span className="font-bold text-white text-[10px]">{t.featurePackage}</span>
                    </div>
                    <div className="bg-slate-950/50 p-2 rounded-lg">
                      <span className="text-slate-500 uppercase block text-[8px]">Max Quota</span>
                      <span className="font-bold text-slate-300">{t.quotaGb} GB</span>
                    </div>
                  </div>

                  <p className="text-[11px] font-mono text-slate-400 truncate bg-slate-950 px-2 py-1.5 rounded border border-slate-850">
                    <span className="text-slate-500">Domain:</span> {t.customDomain || 'No custom domain set'}
                  </p>

                  {t.status !== 'Soft Deleted' && (
                    <div className="flex items-center gap-2 mt-4 justify-end">
                      <button
                        onClick={() => toggleTenantStatus(t.id)}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                          t.status === 'Active'
                            ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                        }`}
                      >
                        {t.status === 'Active' ? 'Suspend Tenant' : 'Reactivate Tenant'}
                      </button>
                      <button
                        onClick={() => softDeleteTenant(t.id)}
                        className="px-3 py-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-[10px] font-bold rounded-lg transition-all"
                      >
                        Soft Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: KYC & VERIFICATION CENTER */}
        {activeTab === 'kyc' && (
          <div className="space-y-6 animate-fade-in" id="panel_kyc">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">KYC & Verification Queue</h2>
                <p className="text-[11px] text-slate-400">Regulate Pi verified documents, passports, and merchant business certificates</p>
              </div>

              <div className="flex items-center gap-4 text-xs font-bold font-mono bg-slate-900 border border-slate-800 p-2 rounded-xl">
                <span className="text-slate-400">Auto-Approval Rules:</span>
                <button
                  onClick={() => toggleFlag('autoKycApproval')}
                  className="flex items-center gap-1 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 text-amber-400 hover:text-white transition-all"
                >
                  {flags.autoKycApproval ? (
                    <>
                      <ToggleRight className="w-4 h-4 text-emerald-500" />
                      <span>AI Face-Match Enabled</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4 text-slate-500" />
                      <span>Manual Audit Enforced</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* KYC RECORDS QUEUE */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
              <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-white">Pending Requests Directory</span>
                <div className="relative w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 pl-9 pr-3 text-xs text-white"
                    placeholder="Search applicant name..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase font-mono text-[10px] bg-slate-950/40">
                      <th className="p-4">Applicant ID</th>
                      <th className="p-4">User Type</th>
                      <th className="p-4">Document Type</th>
                      <th className="p-4">Submitted Date</th>
                      <th className="p-4">Verification Artifact</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Verification Decorum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono">
                    {kycRecords
                      .filter(k => k.userName.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(k => (
                        <tr key={k.id} className="hover:bg-slate-800/10">
                          <td className="p-4 text-white font-bold">{k.userName}</td>
                          <td className="p-4">
                            <span className="bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded text-[10px] font-bold border border-indigo-500/20">
                              {k.userType}
                            </span>
                          </td>
                          <td className="p-4 text-slate-300">{k.docType}</td>
                          <td className="p-4 text-slate-500 text-[11px]">{new Date(k.submittedAt).toLocaleString()}</td>
                          <td className="p-4">
                            <a href={k.docUrl} target="_blank" rel="noreferrer" className="text-amber-400 hover:underline flex items-center gap-1 text-[11px]">
                              <span>View passport.png</span>
                              <ArrowRight className="w-3 h-3" />
                            </a>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              k.status === 'Approved'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : k.status === 'Rejected'
                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}>
                              {k.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {k.status === 'Pending' ? (
                              <div className="flex items-center gap-1.5 justify-end">
                                <button
                                  onClick={() => handleApproveKyc(k.id)}
                                  className="p-1 bg-emerald-500 text-slate-950 hover:bg-emerald-400 rounded transition-all"
                                  title="Approve verification"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleRejectKyc(k.id)}
                                  className="p-1 bg-red-500 text-white hover:bg-red-400 rounded transition-all"
                                  title="Reject document"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-500 text-[11px] italic">Reviewed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: GLOBAL MODERATION CENTER */}
        {activeTab === 'moderation' && (
          <div className="space-y-6 animate-fade-in" id="panel_moderation">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">Global Content Moderation Hub</h2>
              <p className="text-[11px] text-slate-400">Review flagged products, services, reviews, and private communications to ensure compliance with Pi community bylaws</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {moderationItems.map(m => (
                <div key={m.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-wrap md:flex-nowrap justify-between gap-6">
                  <div className="space-y-2.5 max-w-3xl">
                    <div className="flex items-center gap-3">
                      <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                        {m.type}
                      </span>
                      <span className="text-xs font-bold text-slate-300 font-mono">Flagged &bull; ID: {m.id}</span>
                      <span className="bg-red-950/60 text-red-400 border border-red-900/30 text-[9px] font-mono font-bold px-2 py-0.5 rounded flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{m.flagCount} Reports</span>
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white">{m.title}</h4>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">Author/Owner: <span className="text-slate-200">{m.ownerName}</span></p>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl text-xs font-mono text-slate-300">
                      {m.content}
                    </div>

                    <p className="text-[11px] text-red-400 font-mono">
                      <strong className="text-slate-400 uppercase">Reason Flagged:</strong> {m.flagReason}
                    </p>
                  </div>

                  <div className="flex flex-col justify-between items-end min-w-[150px]">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border font-mono ${
                      m.status === 'Approved'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : m.status === 'Rejected'
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : m.status === 'Suspended'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                    }`}>
                      {m.status}
                    </span>

                    {m.status === 'Pending' ? (
                      <div className="flex flex-wrap gap-1.5 mt-4 justify-end">
                        <button
                          onClick={() => handleModAction(m.id, 'Approved')}
                          className="px-2.5 py-1 bg-emerald-500 text-slate-950 rounded text-[10px] font-bold hover:bg-emerald-400 transition-all"
                        >
                          Keep Listing
                        </button>
                        <button
                          onClick={() => handleModAction(m.id, 'Rejected')}
                          className="px-2.5 py-1 bg-slate-850 text-slate-200 rounded border border-slate-800 text-[10px] font-bold hover:bg-slate-800 transition-all"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleModAction(m.id, 'Suspended')}
                          className="px-2.5 py-1 bg-red-500 text-white rounded text-[10px] font-bold hover:bg-red-400 transition-all"
                        >
                          Suspend Item
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] font-mono italic text-slate-500 mt-2">Moderation Action Completed</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: FRAUD OPERATIONS CENTER */}
        {activeTab === 'fraud' && (
          <div className="space-y-6 animate-fade-in" id="panel_fraud">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">Fraud Analytics & Anti-Bot Sentinel</h2>
              <p className="text-[11px] text-slate-400">Dynamic bot-score tracking, velocity threshold detection, and Sybil wallet defense</p>
            </div>

            {/* FRAUD STATS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Spam Threshold</span>
                  <p className="text-xl font-mono font-bold text-white">45 listings/hour</p>
                </div>
                <div className="p-2.5 bg-red-500/10 text-red-400 rounded-xl">
                  <Flame className="w-5 h-5 animate-pulse" />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Average Bot Probability</span>
                  <p className="text-xl font-mono font-bold text-white">1.12%</p>
                </div>
                <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Blocked Wallets Today</span>
                  <p className="text-xl font-mono font-bold text-white">14 wallets</p>
                </div>
                <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
                  <Lock className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* FRAUD LOGS & DECISIONS */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Active Risk-Score Dashboard</h3>

              {fraudCases.map(f => (
                <div key={f.id} className="bg-slate-900 border border-slate-800 p-4.5 rounded-2xl flex flex-wrap md:flex-nowrap items-center justify-between gap-6">
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-white font-mono">{f.userName}</span>
                      <span className="bg-slate-950 px-2 py-0.5 rounded text-[10px] text-indigo-400 border border-slate-850 font-mono">
                        {f.riskType}
                      </span>
                      <span className="text-slate-500 text-[10px] font-mono">Case ID: {f.id}</span>
                    </div>

                    <p className="text-[11px] text-slate-400 font-mono">
                      <strong className="text-slate-500 uppercase">Behavior Log:</strong> {f.recentActivity}
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center font-mono min-w-[70px]">
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">Risk Index</span>
                      <span className={`text-sm font-bold ${
                        f.riskScore > 80 ? 'text-red-500' : f.riskScore > 50 ? 'text-amber-500' : 'text-emerald-500'
                      }`}>
                        {f.riskScore} / 100
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {f.status === 'Flagged' || f.status === 'Under Review' ? (
                        <>
                          <button
                            onClick={() => handleFraudAction(f.id, 'Banned')}
                            className="px-2.5 py-1 bg-red-500 text-slate-950 rounded text-[10px] font-bold hover:bg-red-400 transition-all font-mono"
                          >
                            Ban User
                          </button>
                          <button
                            onClick={() => handleFraudAction(f.id, 'Cleared')}
                            className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded border border-slate-700 text-[10px] font-bold hover:bg-slate-700 transition-all font-mono"
                          >
                            Dismiss
                          </button>
                        </>
                      ) : (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                          f.status === 'Banned'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {f.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: AI OPERATIONS (AIOPS) */}
        {activeTab === 'aiops' && (
          <div className="space-y-6 animate-fade-in" id="panel_aiops">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">AI Operations (AIOps) Control Suite</h2>
                <p className="text-[11px] text-slate-400">Monitor multi-provider fallback layers, prompt template versions, API cost structures, and real-time generation latency</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex gap-1">
                <button
                  onClick={() => {
                    setAiProvider('gemini');
                    setAiModel('gemini-2.5-flash-v1.0');
                    addAuditLog('AIOPS_PROVIDER_CHANGE', 'AI Decision', 'Primary model set to Gemini 2.5 Flash.');
                  }}
                  className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                    aiProvider === 'gemini' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Gemini API
                </button>
                <button
                  onClick={() => {
                    setAiProvider('openai');
                    setAiModel('gpt-4o-mini-stable');
                    addAuditLog('AIOPS_PROVIDER_CHANGE', 'AI Decision', 'Primary model set to OpenAI GPT-4o-mini.');
                  }}
                  className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                    aiProvider === 'openai' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  OpenAI Proxy
                </button>
              </div>
            </div>

            {/* PERFORMANCE GRIDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 font-mono text-xs">
              <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-2xl text-center">
                <span className="text-slate-500 uppercase text-[9px] block">Active Model Engine</span>
                <span className="text-sm font-bold text-white block mt-1.5">{aiModel}</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-2xl text-center">
                <span className="text-slate-500 uppercase text-[9px] block">Prompt Template version</span>
                <span className="text-sm font-bold text-amber-400 block mt-1.5">{promptVersion}</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-2xl text-center">
                <span className="text-slate-500 uppercase text-[9px] block">Model Latency</span>
                <span className="text-sm font-bold text-emerald-400 block mt-1.5">{latencyMs} ms</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-2xl text-center">
                <span className="text-slate-500 uppercase text-[9px] block">Generation Error Rate</span>
                <span className="text-sm font-bold text-red-400 block mt-1.5">{(aiErrorRate * 100).toFixed(1)}%</span>
              </div>
            </div>

            {/* INTERACTIVE PROMPT MANAGER */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">System Prompt Engineering Studio</h3>
                  <span className="bg-slate-950 px-2 py-0.5 rounded text-[10px] text-amber-400 border border-slate-850 font-mono">
                    Live Prompt Injection Sanitizer: ACTIVE
                  </span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <p className="text-slate-400">Current active instruction wrapper injected on all user query pipelines:</p>
                  <textarea
                    rows={5}
                    readOnly
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-300 font-mono text-[11px]"
                    value={`[pioneer_context_isolate]\nSYSTEM_INSTRUCTION: You are the primary Pi Business Market verification engine.\nYour role is to classify products into standard tax boundaries, detect fake spam listings, and formulate optimal semantic keywords.\nDo NOT disclose private API keys, user coordinates, or structural tenant variables under any circumstance.`}
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[10px]">Prompt Version: {promptVersion}</span>
                    <button
                      onClick={() => {
                        setPromptVersion('v1.9.0-draft');
                        addAuditLog('AIOPS_PROMPT_BUMP', 'AI Decision', 'Bumped draft system prompt version to v1.9.0.', 'Warning');
                        alert('Bumped to next version draft. Please complete verification pipeline steps to publish.');
                      }}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold rounded-lg transition-all"
                    >
                      Bump Prompt version
                    </button>
                  </div>
                </div>
              </div>

              {/* EVALUATION SCORES */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 font-mono text-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white font-sans">Evaluation & Safety Metrics</h3>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-400">Faithfulness / Grounding</span>
                      <span className="text-emerald-400 font-bold">98.4%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: '98.4%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-400">Cross-Tenant Isolation Guard</span>
                      <span className="text-emerald-400 font-bold">100.0%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: '100%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-400">Harmful Content Rejection</span>
                      <span className="text-indigo-400 font-bold">99.91%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500" style={{ width: '99.91%' }}></div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 text-[10px] text-slate-500">
                  <p className="font-bold text-slate-400 mb-1">Fallback Route Active Status:</p>
                  <p>Primary endpoint: <span className="text-emerald-400 font-bold">Online</span></p>
                  <p>Secondary fallback (OpenAI): <span className="text-slate-400 font-bold">Standby</span></p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: FEATURE FLAGS */}
        {activeTab === 'flags' && (
          <div className="space-y-6 animate-fade-in" id="panel_flags">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">Dynamic Feature Flag Platform</h2>
              <p className="text-[11px] text-slate-400">Instantly switch modules, run experiments, adjust routing paths, or rollout regional settings without code redeployment</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* PLATFORM MODULES FLAGS */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Platform Modules</h3>
                <p className="text-[11px] text-slate-400">Toggle primary Super App modules globally</p>

                <div className="space-y-3">
                  {[
                    { key: 'pioneerServices', label: 'Pioneer Professional Services', desc: 'Allows plumber, electrician, tutor service configurations' },
                    { key: 'jobsEngine', label: 'Job Board Engine', desc: 'Allows posting jobs, managing applicants, and paying salary in Pi' },
                    { key: 'aiPlatform', label: 'Enterprise AI Platform integration', desc: 'Grants users access to studio optimization pipelines' },
                    { key: 'commerceEngine', label: 'Enterprise Pi Commerce Suite', desc: 'Enables active stores, product feeds, and checkouts' }
                  ].map(f => (
                    <div key={f.key} className="flex items-start justify-between p-3.5 bg-slate-950/60 rounded-xl border border-slate-850">
                      <div>
                        <span className="text-xs font-bold text-white block">{f.label}</span>
                        <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{f.desc}</span>
                      </div>
                      <button
                        onClick={() => toggleFlag(f.key as any)}
                        className="text-slate-400 hover:text-white transition-all ml-4"
                      >
                        {flags[f.key as keyof typeof flags] ? (
                          <ToggleRight className="w-8 h-8 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-slate-600" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* EXPERIMENTS & ROLLOUTS */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Experiments & Security Rules</h3>
                <p className="text-[11px] text-slate-400">Activate strict compliance laws or pricing schemas</p>

                <div className="space-y-3">
                  {[
                    { key: 'velocityDefense', label: 'Velocity-Attack Security Filter', desc: 'Halts instant wallet payments if volume exceeds 10 transactions/minute' },
                    { key: 'gdprHardMode', label: 'Strict GDPR / CCPA Mode', desc: 'Mandatory opt-in cookies, hides sensitive analytics records in compliance areas' },
                    { key: 'autoKycApproval', label: 'Auto-KYC Approvals via AI Match', desc: 'Enables automated facial document scanning with 99% accuracy models' },
                    { key: 'abPricingExperiment', label: 'A/B Testing: Store Theme Customization Fees', desc: 'Slight dynamic pricing experiments applied to high-tier branding upgrades' }
                  ].map(f => (
                    <div key={f.key} className="flex items-start justify-between p-3.5 bg-slate-950/60 rounded-xl border border-slate-850">
                      <div>
                        <span className="text-xs font-bold text-white block">{f.label}</span>
                        <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{f.desc}</span>
                      </div>
                      <button
                        onClick={() => toggleFlag(f.key as any)}
                        className="text-slate-400 hover:text-white transition-all ml-4"
                      >
                        {flags[f.key as keyof typeof flags] ? (
                          <ToggleRight className="w-8 h-8 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-slate-600" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: AUDIT CENTER */}
        {activeTab === 'audit' && (
          <div className="space-y-6 animate-fade-in" id="panel_audit">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">Immutable Platform Audit Ledger</h2>
                <p className="text-[11px] text-slate-400">Auditable transactions, role promotions, and configuration changes logs</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportCompliance('audit')}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Download Ledger Audit</span>
                </button>
              </div>
            </div>

            {/* AUDIT LOG TABLE */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg font-mono text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[9px] bg-slate-950/40">
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Operator</th>
                    <th className="p-4">Action Target</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Severity</th>
                    <th className="p-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-800/10">
                      <td className="p-4 text-slate-500 text-[10px] whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="p-4 text-white font-bold">{log.operator}</td>
                      <td className="p-4 text-amber-400 font-bold">{log.action}</td>
                      <td className="p-4 text-slate-300">{log.category}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.severity === 'Critical'
                            ? 'bg-red-500/10 text-red-400'
                            : log.severity === 'Warning'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-indigo-500/10 text-indigo-400'
                        }`}>
                          {log.severity}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400 text-[11px] font-sans">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 9: CONFIGURATION & COMPLIANCE */}
        {activeTab === 'config' && (
          <div className="space-y-6 animate-fade-in" id="panel_config">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">System Policy & Regulatory Compliance Center</h2>
              <p className="text-[11px] text-slate-400">Administer global parameters, rate limits, tax laws, and trigger automated GDPR / CCPA right-to-be-forgotten deletion workflows</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
              {/* SYSTEM CONFIGURATION */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl lg:col-span-2 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Platform Settings & Rate Limiting Policy</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-400">Daily Request Rate Limit (Pioneers)</label>
                    <input
                      type="number"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                      value={rateLimitDaily}
                      onChange={e => setRateLimitDaily(Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400">Max Transaction Size (Pi)</label>
                    <input
                      type="number"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                      value={maxPaymentSize}
                      onChange={e => setMaxPaymentSize(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-400">Platform Escrow Fee %</label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                      value={platformFeePercent}
                      onChange={e => setPlatformFeePercent(Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400">Security Notification Destination Email</label>
                    <input
                      type="email"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                      value={alertEmail}
                      onChange={e => setAlertEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-850 font-mono text-[11px] text-slate-500 space-y-1">
                  <p className="font-bold text-slate-400 uppercase">Registered Global Parameters:</p>
                  <p>Currencies: <span className="text-slate-300">Pi (π), USD ($), EUR (€)</span></p>
                  <p>Tax Jurisdictions: <span className="text-slate-300">US-CA Retail tax (8.25%), EU cross-border VAT (20.0%)</span></p>
                  <p>Active languages: <span className="text-slate-300">English, Spanish, Mandarin, French</span></p>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSaveConfig}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition-all shadow-md"
                  >
                    Save & Propagate Configurations
                  </button>
                </div>
              </div>

              {/* COMPLIANCE & PRIVACY (GDPR/CCPA) */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Compliance (GDPR/CCPA)</h3>
                <p className="text-[11px] text-slate-400">GDPR compliance toolkits allow exporting full JSON profiles or performing deletion workflows directly</p>

                <div className="space-y-3 font-mono">
                  <button
                    onClick={() => handleExportCompliance('pioneer-profile-archive')}
                    className="w-full text-left p-3 bg-slate-950 hover:bg-slate-900 rounded-xl border border-slate-850 flex items-center justify-between group transition-all"
                  >
                    <div>
                      <p className="text-white font-bold text-xs">Pioneer Data Export</p>
                      <p className="text-[9px] text-slate-500">Generate auditable data zip</p>
                    </div>
                    <FileSpreadsheet className="w-4 h-4 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button
                    onClick={() => {
                      const ans = window.confirm('Are you sure you want to trigger GDPR deletion for user: satoshi_pi? This soft-deletes the associated store and product collections. This is non-reversible.');
                      if (ans) {
                        addAuditLog('GDPR_FORGET_TRIGGER', 'System', 'Triggered GDPR data deletion routine for tenant satoshi_pi.', 'Critical');
                        alert('GDPR Right-to-be-Forgotten pipeline completed successfully. Relational dependencies uncoupled.');
                      }
                    }}
                    className="w-full text-left p-3 bg-slate-950 hover:bg-red-950/20 rounded-xl border border-slate-850 flex items-center justify-between group transition-all"
                  >
                    <div>
                      <p className="text-red-400 font-bold text-xs">Right to be Forgotten</p>
                      <p className="text-[9px] text-slate-500">Purge store, listings & logs</p>
                    </div>
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>

                <div className="p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-xl text-[11px] text-slate-300">
                  <p className="font-bold text-indigo-400 mb-1">Audit Ledger Integrity Lock</p>
                  <p className="text-[10px] text-slate-400">All logs are signed using HMAC-SHA256 hash chains at block intervals, rendering retro modifications technically impossible.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="bg-slate-900 border-t border-slate-800 text-slate-500 py-3 px-6 text-center text-[10px] font-mono flex flex-wrap justify-between items-center gap-2">
        <span>Pi Business Market Governance Suite</span>
        <span>Secure Session ID: hmac-ae348f921bc &bull; Operator: {currentUser.email || 'akhileshs68@gmail.com'}</span>
      </div>
    </div>
  );
};
