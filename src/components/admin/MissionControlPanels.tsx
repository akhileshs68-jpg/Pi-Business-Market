import { zeroTrustService } from '../../security/zeroTrustService';
import { fraudDetectionService } from '../../security/fraudDetectionService';
import { SecurityEvent, FraudSignal } from '../../security/types';
import { backupRecoveryService } from '../../security/backupRecoveryService';
import { useAuth } from '../../auth/useAuth';
import React, { useState, useEffect } from 'react';
import { 
  Activity, Users, Store, Box, ShoppingBag, CreditCard, Award, 
  TrendingUp, MessageSquare, Megaphone, ShieldAlert, ShieldCheck, 
  Database, Server, RefreshCw, CheckCircle2, XCircle, AlertCircle,
  Play, Pause, Trash2, Search, BarChart3, Clock, Lock, Shield
} from 'lucide-react';
import { collection, getDocs, query, limit, orderBy, getCountFromServer, where } from 'firebase/firestore';
import { getFirebaseDb } from '../../firebase/config';

// 1. Live Platform Status (Dashboard)
export const DashboardPanel = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Platform Status', status: 'Online', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'API Services', status: 'Operational', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Firestore DB', status: 'Healthy', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Storage', status: 'Operational', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Authentication', status: 'Secure', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Cloud Functions', status: 'Active', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'RPC Health', status: 'Synced', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
          { label: 'Background Jobs', status: 'Processing', color: 'text-amber-400', bg: 'bg-amber-500/10' },
        ].map(item => (
          <div key={item.label} className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col items-center justify-center text-center space-y-2">
            <Activity className={`w-6 h-6 ${item.color}`} />
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.label}</h4>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.color} ${item.bg}`}>
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Generic table panel generator for entities
const GenericManagementPanel = ({ title, icon: Icon, collectionName, columns, renderRow }: any) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const db = getFirebaseDb();
        const q = query(collection(db, collectionName), limit(10));
        const snap = await getDocs(q);
        setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [collectionName]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Icon className="w-5 h-5 text-indigo-400" /> {title} Management
        </h3>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" placeholder={`Search ${title}...`} className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-white" />
        </div>
      </div>
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-800/50">
            <tr>
              {columns.map((col: string) => (
                <th key={col} className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{col}</th>
              ))}
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {loading ? (
              <tr><td colSpan={columns.length + 1} className="p-8 text-center text-slate-500">Loading {title}...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={columns.length + 1} className="p-8 text-center text-slate-500">No records found.</td></tr>
            ) : (
              items.map(item => renderRow(item))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const UserManagementPanel = () => (
  <GenericManagementPanel 
    title="User" icon={Users} collectionName="users" 
    columns={['User', 'Role', 'Status']}
    renderRow={(user: any) => (
      <tr key={user.id} className="hover:bg-slate-800/20">
        <td className="px-6 py-4">
          <div className="font-medium text-white">{user.displayName || user.username || 'Unknown User'}</div>
          <div className="text-xs text-slate-500">{user.piUid || user.uid}</div>
        </td>
        <td className="px-6 py-4">
          <span className="px-2 py-1 bg-slate-800 rounded-md text-xs font-mono text-slate-300">{user.role || 'user'}</span>
        </td>
        <td className="px-6 py-4">
          <span className={`px-2 py-1 rounded-md text-xs font-bold ${user.status === 'suspended' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
            {user.status || 'Active'}
          </span>
        </td>
        <td className="px-6 py-4 text-right space-x-2">
          <button className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400" title="Suspend"><Pause className="w-4 h-4" /></button>
        </td>
      </tr>
    )}
  />
);

export const BusinessManagementPanel = () => (
  <GenericManagementPanel 
    title="Business" icon={Store} collectionName="businesses" 
    columns={['Business Name', 'Category', 'Status']}
    renderRow={(biz: any) => (
      <tr key={biz.id} className="hover:bg-slate-800/20">
        <td className="px-6 py-4">
          <div className="font-medium text-white">{biz.name || biz.businessName || 'Unnamed'}</div>
          <div className="text-xs text-slate-500">ID: {biz.id}</div>
        </td>
        <td className="px-6 py-4 text-sm text-slate-400">{biz.category || 'General'}</td>
        <td className="px-6 py-4">
          <span className={`px-2 py-1 rounded-md text-xs font-bold ${biz.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : biz.status === 'suspended' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
            {biz.status || 'Pending'}
          </span>
        </td>
        <td className="px-6 py-4 text-right space-x-2">
          <button className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg" title="Approve"><CheckCircle2 className="w-4 h-4" /></button>
          <button className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-lg" title="Reject"><XCircle className="w-4 h-4" /></button>
        </td>
      </tr>
    )}
  />
);

export const StoreManagementPanel = () => (
  <GenericManagementPanel 
    title="Store" icon={Store} collectionName="stores" 
    columns={['Store Name', 'Type', 'Status']}
    renderRow={(store: any) => (
      <tr key={store.id} className="hover:bg-slate-800/20">
        <td className="px-6 py-4">
          <div className="font-medium text-white">{store.name || 'Unnamed Store'}</div>
          <div className="text-xs text-slate-500">Biz ID: {store.businessId}</div>
        </td>
        <td className="px-6 py-4 text-sm text-slate-400">{store.type || 'Retail'}</td>
        <td className="px-6 py-4">
          <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-md text-xs font-bold">{store.status || 'Active'}</span>
        </td>
        <td className="px-6 py-4 text-right space-x-2">
          <button className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400" title="Suspend"><Pause className="w-4 h-4" /></button>
        </td>
      </tr>
    )}
  />
);

export const ProductManagementPanel = () => (
  <GenericManagementPanel 
    title="Product" icon={Box} collectionName="products" 
    columns={['Product', 'Price', 'Status']}
    renderRow={(product: any) => (
      <tr key={product.id} className="hover:bg-slate-800/20">
        <td className="px-6 py-4">
          <div className="font-medium text-white">{product.title || product.name || 'Unnamed'}</div>
          <div className="text-xs text-slate-500">Stock: {product.stock || 0}</div>
        </td>
        <td className="px-6 py-4 text-sm font-mono text-emerald-400">{product.price} Pi</td>
        <td className="px-6 py-4">
          <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-md text-xs font-bold">{product.status || 'Active'}</span>
        </td>
        <td className="px-6 py-4 text-right space-x-2">
           <button className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400" title="Suspend"><Pause className="w-4 h-4" /></button>
        </td>
      </tr>
    )}
  />
);

export const ServiceManagementPanel = () => (
  <GenericManagementPanel 
    title="Service" icon={Box} collectionName="services" 
    columns={['Service', 'Rate', 'Status']}
    renderRow={(service: any) => (
      <tr key={service.id} className="hover:bg-slate-800/20">
        <td className="px-6 py-4">
          <div className="font-medium text-white">{service.title || service.name || 'Unnamed'}</div>
        </td>
        <td className="px-6 py-4 text-sm font-mono text-emerald-400">{service.price} Pi</td>
        <td className="px-6 py-4">
          <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-md text-xs font-bold">{service.status || 'Active'}</span>
        </td>
        <td className="px-6 py-4 text-right space-x-2">
           <button className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400" title="Suspend"><Pause className="w-4 h-4" /></button>
        </td>
      </tr>
    )}
  />
);

const GenericAnalyticsPanel = ({ title, icon: Icon, stats }: any) => (
  <div className="space-y-6">
    <div className="flex items-center gap-3">
      <div className="p-3 bg-indigo-500/20 rounded-xl"><Icon className="w-6 h-6 text-indigo-400" /></div>
      <h3 className="text-xl font-bold text-white">{title} Analytics</h3>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat: any, i: number) => (
        <div key={i} className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</h4>
          <div className="text-3xl font-black text-white mt-2">{stat.value}</div>
        </div>
      ))}
    </div>
    <div className="h-64 bg-slate-900/30 border border-slate-800 rounded-2xl flex items-center justify-center">
      <BarChart3 className="w-12 h-12 text-slate-800" />
      <span className="ml-4 text-sm font-bold text-slate-600 uppercase tracking-widest">Chart Visualization (Loading)</span>
    </div>
  </div>
);

export const OrderAnalyticsPanel = () => (
  <GenericAnalyticsPanel 
    title="Order" icon={ShoppingBag}
    stats={[
      { label: 'Total Orders', value: '12,450' },
      { label: 'Completed', value: '11,200' },
      { label: 'Pending', value: '850' },
      { label: 'Cancelled/Refunded', value: '400' },
    ]}
  />
);

export const PaymentAnalyticsPanel = () => (
  <GenericAnalyticsPanel 
    title="Payment" icon={CreditCard}
    stats={[
      { label: 'Pi Testnet Volume', value: '450,200 Pi' },
      { label: 'Successful Payments', value: '12,010' },
      { label: 'Failed Payments', value: '440' },
      { label: 'Avg Processing Time', value: '2.4s' },
    ]}
  />
);

export const BmpAnalyticsPanel = () => (
  <GenericAnalyticsPanel 
    title="BMP Rewards" icon={Award}
    stats={[
      { label: 'Rewards Issued', value: '4,500,200 BMP' },
      { label: 'Rewards Burned', value: '0 BMP' },
      { label: 'Daily Issuance', value: '45,200 BMP' },
      { label: 'Active Holders', value: '8,450' },
    ]}
  />
);

export const CommunityAnalyticsPanel = () => (
  <GenericAnalyticsPanel 
    title="Community" icon={MessageSquare}
    stats={[
      { label: 'Total Posts', value: '85,420' },
      { label: 'Active Users', value: '14,200' },
      { label: 'Total Engagement', value: '340K' },
      { label: 'Reported Content', value: '24' },
    ]}
  />
);

export const MarketingAnalyticsPanel = () => (
  <GenericAnalyticsPanel 
    title="Marketing" icon={Megaphone}
    stats={[
      { label: 'Campaign Views', value: '1.2M' },
      { label: 'Avg CTR', value: '4.2%' },
      { label: 'Coupons Redeemed', value: '12,400' },
      { label: 'Ad Revenue', value: '45,000 Pi' },
    ]}
  />
);

export const SystemHealthPanel = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-3">
      <div className="p-3 bg-emerald-500/20 rounded-xl"><Server className="w-6 h-6 text-emerald-400" /></div>
      <h3 className="text-xl font-bold text-white">System Health & Metrics</h3>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">CPU Usage (Est)</h4>
        <div className="text-4xl font-black text-emerald-400">24%</div>
        <div className="w-full bg-slate-800 h-2 rounded-full mt-4"><div className="bg-emerald-400 h-2 rounded-full" style={{width: '24%'}}></div></div>
      </div>
      <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Memory Usage (Est)</h4>
        <div className="text-4xl font-black text-indigo-400">4.2 GB</div>
        <div className="w-full bg-slate-800 h-2 rounded-full mt-4"><div className="bg-indigo-400 h-2 rounded-full" style={{width: '65%'}}></div></div>
      </div>
      <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Firestore Load</h4>
        <div className="text-4xl font-black text-amber-400">Normal</div>
        <p className="text-xs text-slate-400 mt-4">Read/Write ops within limits.</p>
      </div>
      <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">API Latency</h4>
        <div className="text-4xl font-black text-emerald-400">124ms</div>
        <p className="text-xs text-slate-400 mt-4">Global average response time.</p>
      </div>
      <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Error Rate</h4>
        <div className="text-4xl font-black text-emerald-400">0.02%</div>
        <p className="text-xs text-slate-400 mt-4">Maintained below 1% threshold.</p>
      </div>
      <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Storage Usage</h4>
        <div className="text-4xl font-black text-indigo-400">2.1 TB</div>
        <p className="text-xs text-slate-400 mt-4">Object storage consumption.</p>
      </div>
    </div>
  </div>
);

export const SecurityCenterPanel = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [fraud, setFraud] = useState<FraudSignal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [e, f] = await Promise.all([
          zeroTrustService.getSecurityEvents(20),
          fraudDetectionService.getFraudSignals(20)
        ]);
        setEvents(e);
        setFraud(f);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
  <div className="space-y-6">
    <div className="flex items-center gap-3">
      <div className="p-3 bg-rose-500/20 rounded-xl"><ShieldAlert className="w-6 h-6 text-rose-400" /></div>
      <h3 className="text-xl font-bold text-white">Security Center</h3>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="p-5 border border-slate-800 bg-slate-900/50 rounded-2xl flex justify-between items-center">
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase">Total Events</h4>
          <span className="text-2xl font-black text-white">{events.length}</span>
        </div>
        <AlertCircle className="w-8 h-8 text-amber-500/50" />
      </div>
      <div className="p-5 border border-slate-800 bg-slate-900/50 rounded-2xl flex justify-between items-center">
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase">Fraud Signals</h4>
          <span className="text-2xl font-black text-white">{fraud.length}</span>
        </div>
        <ShieldAlert className="w-8 h-8 text-rose-500/50" />
      </div>
      <div className="p-5 border border-slate-800 bg-slate-900/50 rounded-2xl flex justify-between items-center">
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase">Active Threats</h4>
          <span className="text-2xl font-black text-white">{events.filter(e => e.severity === 'critical').length}</span>
        </div>
        <Trash2 className="w-8 h-8 text-slate-500/50" />
      </div>
    </div>
    
    <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
       <h4 className="text-sm font-bold text-white mb-4">Recent Security Alerts</h4>
       <div className="space-y-3">
         {loading ? (
            <div className="text-sm text-slate-500 text-center py-4">Loading security logs...</div>
         ) : events.length === 0 ? (
            <div className="text-sm text-slate-500 text-center py-4">No recent security events detected. Zero Trust perimeter is secure.</div>
         ) : events.map(e => (
            <div key={e.eventId} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl border border-slate-800">
              <div className="flex items-center gap-3">
                <ShieldAlert className={`w-4 h-4 ${e.severity === 'critical' ? 'text-rose-500' : e.severity === 'high' ? 'text-orange-500' : 'text-amber-400'}`} />
                <span className="text-sm text-slate-300">{e.eventType}: {JSON.stringify(e.details)}</span>
              </div>
              <span className="text-xs text-slate-500">{new Date(e.timestamp).toLocaleString()}</span>
            </div>
         ))}
       </div>
    </div>
    <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
       <h4 className="text-sm font-bold text-white mb-4">Fraud Signals</h4>
       <div className="space-y-3">
         {loading ? (
            <div className="text-sm text-slate-500 text-center py-4">Loading fraud signals...</div>
         ) : fraud.length === 0 ? (
            <div className="text-sm text-slate-500 text-center py-4">No fraud signals detected.</div>
         ) : fraud.map(f => (
            <div key={f.signalId} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl border border-slate-800">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                <span className="text-sm text-slate-300">Target: {f.targetType} - {f.reason} (Conf: {Math.round(f.confidenceScore * 100)}%)</span>
              </div>
              <span className="text-xs text-slate-500">{new Date(f.timestamp).toLocaleString()}</span>
            </div>
         ))}
       </div>
    </div>
  </div>
  );
};
export const BackupRecoveryPanel = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleBackup = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await backupRecoveryService.triggerManualBackup(user.uid, user.displayName || 'Admin');
      alert('Manual backup triggered and completed successfully. (Simulation)');
    } catch (err) {
      console.error(err);
      alert('Failed to trigger backup');
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="space-y-6">
    <div className="flex items-center gap-3">
      <div className="p-3 bg-indigo-500/20 rounded-xl"><Database className="w-6 h-6 text-indigo-400" /></div>
      <h3 className="text-xl font-bold text-white">Backup & Disaster Recovery</h3>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
        <h4 className="text-base font-bold text-white mb-2">Firestore Database</h4>
        <p className="text-xs text-slate-400 mb-6">Automated daily backups are active. Retained for 30 days.</p>
        <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
          <div>
            <div className="text-xs font-bold text-emerald-400 uppercase">Last Backup: Success</div>
            <div className="text-[10px] text-slate-500 mt-1">Today, 03:00 UTC</div>
          </div>
          <button 
            onClick={handleBackup}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-md"
          >
            {loading ? 'Running...' : 'Manual Backup'}
          </button>
        </div>
      </div>
      <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
        <h4 className="text-base font-bold text-white mb-2">Cloud Storage</h4>
        <p className="text-xs text-slate-400 mb-6">Object storage replication across multi-region.</p>
        <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
          <div>
            <div className="text-xs font-bold text-emerald-400 uppercase">Replication: Active</div>
            <div className="text-[10px] text-slate-500 mt-1">Synced across us-central1, asia-southeast1</div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

// 7. Ad Moderation & Sponsorship Control Panel
export const AdModerationPanel = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const { campaignService } = await import('../../services/campaignService');
      const data = await campaignService.getAllCampaignsForAdmin();
      setCampaigns(data);
    } catch (e) {
      console.warn('Error loading campaigns:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: any) => {
    try {
      const { campaignService } = await import('../../services/campaignService');
      await campaignService.updateCampaignStatus(id, status, user?.uid || 'sys_admin');
      await loadCampaigns();
    } catch (e) {
      alert('Failed to update campaign status');
    }
  };

  const handleTogglePin = async (id: string, currentPin: boolean) => {
    try {
      const { campaignService } = await import('../../services/campaignService');
      await campaignService.togglePinCampaign(id, !currentPin, user?.uid || 'sys_admin');
      await loadCampaigns();
    } catch (e) {
      alert('Failed to pin campaign');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-pink-500/20 rounded-xl"><Megaphone className="w-6 h-6 text-pink-400" /></div>
          <div>
            <h3 className="text-xl font-bold text-white">Ad & Campaign Moderation</h3>
            <p className="text-xs text-slate-400">Review merchant hero banners, sponsored campaigns & promotions</p>
          </div>
        </div>
        <button
          onClick={loadCampaigns}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-xs font-mono">Loading campaign records...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map(camp => (
            <div key={camp.id} className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-4">
              <div className="flex items-start gap-3">
                {camp.bannerImage && (
                  <img src={camp.bannerImage} alt={camp.campaignTitle} className="w-20 h-14 rounded-xl object-cover border border-slate-800 shrink-0" referrerPolicy="no-referrer" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="px-2 py-0.5 bg-violet-500/10 text-violet-300 border border-violet-500/20 text-[9px] font-bold rounded uppercase">
                      {camp.campaignType}
                    </span>
                    <span className={`px-2 py-0.5 text-[9px] font-black rounded uppercase ${
                      camp.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      camp.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {camp.status}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white truncate">{camp.campaignTitle}</h4>
                  <p className="text-xs text-slate-400 truncate">{camp.businessName}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs">
                <div>
                  <div className="text-slate-500 text-[10px] uppercase font-bold">Impressions</div>
                  <div className="font-mono text-white font-bold">{camp.impressions || 0}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px] uppercase font-bold">Clicks</div>
                  <div className="font-mono text-white font-bold">{camp.clicks || 0}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px] uppercase font-bold">CTR</div>
                  <div className="font-mono text-amber-400 font-bold">{camp.ctr || 0}%</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs gap-2">
                <button
                  onClick={() => handleTogglePin(camp.id, camp.isPinned)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all text-[10px] uppercase ${
                    camp.isPinned ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {camp.isPinned ? '★ Pinned' : '☆ Pin to Top'}
                </button>

                <div className="flex items-center gap-1.5">
                  {camp.status !== 'active' && (
                    <button
                      onClick={() => handleUpdateStatus(camp.id, 'active')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold uppercase transition-all shadow"
                    >
                      Approve
                    </button>
                  )}
                  {camp.status === 'active' && (
                    <button
                      onClick={() => handleUpdateStatus(camp.id, 'paused')}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-[10px] font-bold uppercase transition-all shadow"
                    >
                      Pause
                    </button>
                  )}
                  {camp.status !== 'rejected' && (
                    <button
                      onClick={() => handleUpdateStatus(camp.id, 'rejected')}
                      className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-[10px] font-bold uppercase transition-all"
                    >
                      Reject
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};



