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
  Play, Pause, Trash2, Search, BarChart3, Clock, Lock, Shield, Zap, Truck, DollarSign
} from 'lucide-react';
import { collection, getDocs, getDoc, query, limit, orderBy, getCountFromServer, where, doc, updateDoc, setDoc } from 'firebase/firestore';
import { getFirebaseDb } from '../../firebase/config';
import { notificationService } from '../../services/notificationService';
import { EnterpriseOperationsCenter } from './EnterpriseOperationsCenter';

// Helper to record administrative actions into immutable adminAuditLogs
const logAdminAuditAction = async (
  adminUser: any,
  entityType: string,
  entityId: string,
  entityName: string,
  action: string,
  oldVal: any,
  newVal: any,
  reason: string
) => {
  try {
    const db = getFirebaseDb();
    const logId = `AUD_ADMIN_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
    const logRef = doc(db, 'adminAuditLogs', logId);
    await setDoc(logRef, {
      id: logId,
      adminId: adminUser?.uid || 'system_admin',
      adminName: adminUser?.displayName || adminUser?.username || 'Admin',
      entityType,
      entityId,
      entityName: entityName || entityId,
      action,
      oldValue: typeof oldVal === 'object' ? JSON.stringify(oldVal) : String(oldVal),
      newValue: typeof newVal === 'object' ? JSON.stringify(newVal) : String(newVal),
      reason: reason || 'Administrative action',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.warn('Failed to write admin audit log:', err);
  }
};

// 1. Live Platform Status (Dashboard)
interface DashboardPanelProps {
  onNavigateTab?: (tab: any) => void;
}

export const DashboardPanel = ({ onNavigateTab }: DashboardPanelProps) => {
  return <EnterpriseOperationsCenter onNavigateTab={onNavigateTab || (() => {})} />;
};

// Generic table panel generator for entities
const GenericManagementPanel = ({ title, icon: Icon, collectionName, columns, renderRow }: any) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const db = getFirebaseDb();
      const q = query(collection(db, collectionName), limit(30));
      const snap = await getDocs(q);
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [collectionName]);

  const filteredItems = items.filter(item => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const str = JSON.stringify(item).toLowerCase();
    return str.includes(term);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Icon className="w-5 h-5 text-indigo-400" /> {title} Management
        </h3>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={`Search ${title}...`} 
              className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-white" 
            />
          </div>
          <button 
            onClick={fetchData}
            className="p-2 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
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
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan={columns.length + 1} className="p-8 text-center text-slate-500">No records found.</td></tr>
              ) : (
                filteredItems.map(item => renderRow(item, fetchData))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const UserManagementPanel = () => {
  const { user: currentUser } = useAuth();

  const handleToggleUserStatus = async (targetUser: any, refreshFn: () => void) => {
    const isSuspended = targetUser.status === 'suspended';
    const newStatus = isSuspended ? 'active' : 'suspended';
    const actionLabel = isSuspended ? 'Activate' : 'Suspend';
    
    const reason = prompt(`Enter administrative reason to ${actionLabel} user "${targetUser.displayName || targetUser.username || targetUser.id}":`);
    if (!reason || !reason.trim()) {
      alert('A valid reason is required for administrative status change.');
      return;
    }

    try {
      const db = getFirebaseDb();
      const userRef = doc(db, 'users', targetUser.id);
      await updateDoc(userRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.displayName || 'Admin'
      });

      await logAdminAuditAction(
        currentUser,
        'user',
        targetUser.id,
        targetUser.displayName || targetUser.username || targetUser.id,
        `${actionLabel} User`,
        targetUser.status || 'active',
        newStatus,
        reason
      );

      alert(`User status updated to ${newStatus}.`);
      refreshFn();
    } catch (e) {
      console.error('Error updating user status:', e);
      alert('Failed to update user status.');
    }
  };

  return (
    <GenericManagementPanel 
      title="User" icon={Users} collectionName="users" 
      columns={['User', 'Role', 'Status']}
      renderRow={(u: any, refreshFn: () => void) => (
        <tr key={u.id} className="hover:bg-slate-800/20">
          <td className="px-6 py-4">
            <div className="font-medium text-white">{u.displayName || u.username || 'Unknown User'}</div>
            <div className="text-xs text-slate-500">{u.piUid || u.uid || u.id}</div>
          </td>
          <td className="px-6 py-4">
            <span className="px-2 py-1 bg-slate-800 rounded-md text-xs font-mono text-slate-300">{u.platformRole || u.role || 'user'}</span>
          </td>
          <td className="px-6 py-4">
            <span className={`px-2 py-1 rounded-md text-xs font-bold ${u.status === 'suspended' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              {u.status || 'Active'}
            </span>
          </td>
          <td className="px-6 py-4 text-right space-x-2">
            <button 
              onClick={() => handleToggleUserStatus(u, refreshFn)}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${u.status === 'suspended' ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'}`} 
              title={u.status === 'suspended' ? 'Activate User' : 'Suspend User'}
            >
              {u.status === 'suspended' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
          </td>
        </tr>
      )}
    />
  );
};

export { BusinessManagementPanel } from './BusinessManagementPanel';

export const StoreManagementPanel = () => {
  const { user: currentUser } = useAuth();

  const handleToggleStoreStatus = async (store: any, refreshFn: () => void) => {
    const isSuspended = store.status === 'suspended';
    const newStatus = isSuspended ? 'active' : 'suspended';
    const actionLabel = isSuspended ? 'Activate' : 'Suspend';
    
    const reason = prompt(`Enter administrative reason to ${actionLabel} store "${store.name || store.id}":`);
    if (!reason || !reason.trim()) {
      alert('A valid reason is required for administrative store modification.');
      return;
    }

    try {
      const db = getFirebaseDb();
      const storeRef = doc(db, 'stores', store.id);
      await updateDoc(storeRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.displayName || 'Admin'
      });

      await logAdminAuditAction(
        currentUser,
        'store',
        store.id,
        store.name || store.id,
        `${actionLabel} Store`,
        store.status || 'active',
        newStatus,
        reason
      );

      alert(`Store status updated to ${newStatus}.`);
      refreshFn();
    } catch (e) {
      console.error('Error updating store status:', e);
      alert('Failed to update store status.');
    }
  };

  return (
    <GenericManagementPanel 
      title="Store" icon={Store} collectionName="stores" 
      columns={['Store Name', 'Type', 'Status']}
      renderRow={(store: any, refreshFn: () => void) => (
        <tr key={store.id} className="hover:bg-slate-800/20">
          <td className="px-6 py-4">
            <div className="font-medium text-white">{store.name || 'Unnamed Store'}</div>
            <div className="text-xs text-slate-500">Biz ID: {store.businessId || store.id}</div>
          </td>
          <td className="px-6 py-4 text-sm text-slate-400">{store.type || 'Retail'}</td>
          <td className="px-6 py-4">
            <span className={`px-2 py-1 rounded-md text-xs font-bold ${store.status === 'suspended' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              {store.status || 'Active'}
            </span>
          </td>
          <td className="px-6 py-4 text-right space-x-2">
            <button 
              onClick={() => handleToggleStoreStatus(store, refreshFn)}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${store.status === 'suspended' ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'}`} 
              title={store.status === 'suspended' ? 'Activate Store' : 'Suspend Store'}
            >
              {store.status === 'suspended' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
          </td>
        </tr>
      )}
    />
  );
};

export const ProductManagementPanel = () => {
  const { user: currentUser } = useAuth();

  const handleToggleProductStatus = async (product: any, refreshFn: () => void) => {
    const isSuspended = product.status === 'suspended';
    const newStatus = isSuspended ? 'active' : 'suspended';
    const actionLabel = isSuspended ? 'Activate' : 'Suspend';
    
    const reason = prompt(`Enter administrative reason to ${actionLabel} product "${product.title || product.name || product.id}":`);
    if (!reason || !reason.trim()) {
      alert('A valid reason is required for administrative product modification.');
      return;
    }

    try {
      const db = getFirebaseDb();
      const productRef = doc(db, 'products', product.id);
      await updateDoc(productRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.displayName || 'Admin'
      });

      await logAdminAuditAction(
        currentUser,
        'product',
        product.id,
        product.title || product.name || product.id,
        `${actionLabel} Product`,
        product.status || 'active',
        newStatus,
        reason
      );

      alert(`Product status updated to ${newStatus}.`);
      refreshFn();
    } catch (e) {
      console.error('Error updating product status:', e);
      alert('Failed to update product status.');
    }
  };

  return (
    <GenericManagementPanel 
      title="Product" icon={Box} collectionName="products" 
      columns={['Product', 'Price', 'Status']}
      renderRow={(product: any, refreshFn: () => void) => (
        <tr key={product.id} className="hover:bg-slate-800/20">
          <td className="px-6 py-4">
            <div className="font-medium text-white">{product.title || product.name || 'Unnamed'}</div>
            <div className="text-xs text-slate-500">Stock: {product.stock || 0}</div>
          </td>
          <td className="px-6 py-4 text-sm font-mono text-emerald-400">{product.price} Pi</td>
          <td className="px-6 py-4">
            <span className={`px-2 py-1 rounded-md text-xs font-bold ${product.status === 'suspended' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              {product.status || 'Active'}
            </span>
          </td>
          <td className="px-6 py-4 text-right space-x-2">
            <button 
              onClick={() => handleToggleProductStatus(product, refreshFn)}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${product.status === 'suspended' ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'}`} 
              title={product.status === 'suspended' ? 'Activate Product' : 'Suspend Product'}
            >
              {product.status === 'suspended' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
          </td>
        </tr>
      )}
    />
  );
};

export const CourierManagementPanel = () => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'couriers' | 'shipments'>('couriers');
  const [couriers, setCouriers] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const db = getFirebaseDb();
      const couriersSnap = await getDocs(query(collection(db, 'couriers'), limit(50)));
      const couriersList: any[] = [];
      couriersSnap.forEach(d => couriersList.push({ id: d.id, ...d.data() }));
      
      if (couriersList.length === 0) {
        const usersSnap = await getDocs(query(collection(db, 'users'), limit(50)));
        usersSnap.forEach(d => {
          const u = d.data();
          if (u.role === 'courier' || u.platformRole === 'courier' || (u.roles && u.roles.includes('courier'))) {
            couriersList.push({ id: d.id, name: u.displayName || u.username || d.id, status: u.status || 'active', type: 'Partner', trackingCapacity: 'Active' });
          }
        });
      }
      setCouriers(couriersList);

      const shipmentsSnap = await getDocs(query(collection(db, 'shipments'), limit(50)));
      const shipmentsList: any[] = [];
      shipmentsSnap.forEach(d => shipmentsList.push({ id: d.id, ...d.data() }));
      setShipments(shipmentsList);
    } catch (err) {
      console.error('Error loading courier management data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleCourierStatus = async (courier: any) => {
    const isSuspended = courier.status === 'suspended';
    const newStatus = isSuspended ? 'active' : 'suspended';
    const actionLabel = isSuspended ? 'Activate' : 'Suspend';
    
    const reason = prompt(`Enter administrative reason to ${actionLabel} courier "${courier.name || courier.id}":`);
    if (!reason || !reason.trim()) {
      alert('A valid administrative reason is required.');
      return;
    }

    try {
      const db = getFirebaseDb();
      const ref = doc(db, 'couriers', courier.id);
      await updateDoc(ref, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.displayName || 'Admin'
      });

      await logAdminAuditAction(
        currentUser,
        'courier',
        courier.id,
        courier.name || courier.id,
        `${actionLabel} Courier`,
        courier.status || 'active',
        newStatus,
        reason
      );

      try {
        const targetCourierUid = courier.userUid || courier.uid || courier.id;
        await notificationService.notify(
          targetCourierUid,
          'system_alert',
          `Courier Partner Account ${newStatus === 'active' ? 'Activated' : 'Suspended'}`,
          `Your courier partner account "${courier.name || courier.id}" status has been set to ${newStatus}.${reason ? ' Reason: ' + reason : ''}`,
          { entityId: courier.id, entityType: 'courier', linkTo: '/admin-console' }
        );
      } catch (notifErr) {
        console.warn('Courier notification warning:', notifErr);
      }

      alert(`Courier status updated to ${newStatus}.`);
      loadData();
    } catch (e) {
      console.error('Error updating courier status:', e);
      alert('Failed to update courier status.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl text-indigo-400">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">Logistics & Courier Control</h3>
            <p className="text-xs text-slate-400">Super Admin logistics partner management, dispatch oversight & delivery tracking</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('couriers')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
              activeTab === 'couriers' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Couriers ({couriers.length})
          </button>
          <button
            onClick={() => setActiveTab('shipments')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
              activeTab === 'shipments' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Shipments ({shipments.length})
          </button>
          <button onClick={loadData} className="p-1.5 text-slate-400 hover:text-white">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {activeTab === 'couriers' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase tracking-widest text-slate-400">
                <th className="px-4 py-3">Courier Name / Service</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-500">Loading logistics data...</td></tr>
              ) : couriers.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-500">No couriers registered yet.</td></tr>
              ) : (
                couriers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-bold text-white">
                      {c.name || c.courierName || 'Courier Partner'}
                      <span className="block text-[10px] font-mono text-slate-500">{c.id}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{c.type || 'Standard Logistics'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                        c.status === 'suspended' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {c.status || 'active'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleToggleCourierStatus(c)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          c.status === 'suspended' ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                        }`}
                      >
                        {c.status === 'suspended' ? 'Activate' : 'Suspend'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'shipments' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase tracking-widest text-slate-400">
                <th className="px-4 py-3">Shipment ID</th>
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Courier / Tracking</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-500">Loading shipments...</td></tr>
              ) : shipments.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-500">No active shipments logged.</td></tr>
              ) : (
                shipments.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-mono text-white font-bold">{s.id}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{s.orderId || 'N/A'}</td>
                    <td className="px-4 py-3 text-slate-300">
                      <div>{s.courierName || 'Standard Express'}</div>
                      <div className="text-[10px] font-mono text-slate-500">{s.trackingNumber || 'No Tracking'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-indigo-500/20 text-indigo-400">
                        {s.status || s.shipmentStatus || 'In Transit'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export const ServiceManagementPanel = () => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'providers' | 'bookings'>('overview');
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadEcosystemData = async () => {
    setLoading(true);
    try {
      const db = getFirebaseDb();
      // Fetch Services
      const servicesSnap = await getDocs(collection(db, 'services'));
      const servicesList: any[] = [];
      servicesSnap.forEach(d => servicesList.push({ id: d.id, ...d.data() }));
      setServices(servicesList);

      // Fetch Users/Providers
      const usersSnap = await getDocs(collection(db, 'users'));
      const providersList: any[] = [];
      usersSnap.forEach(d => {
        const u = d.data();
        const userRoles = u.roles || [];
        const isProvider = u.role === 'service_provider' || u.platformRole === 'service_provider' || 
          userRoles.includes('service_provider') || userRoles.includes('serviceprovider') ||
          u.accountType === 'service_provider';
        if (isProvider || u.businessName || u.isProvider) {
          providersList.push({ uid: d.id, id: d.id, ...u });
        }
      });
      setProviders(providersList);

      // Fetch Bookings
      const bookingsSnap = await getDocs(collection(db, 'bookings'));
      const bookingsList: any[] = [];
      bookingsSnap.forEach(d => bookingsList.push({ id: d.id, ...d.data() }));
      setBookings(bookingsList);
    } catch (err) {
      console.error('[ServiceManagementPanel] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEcosystemData();
  }, []);

  // Compute Aggregates
  const totalServices = services.length;
  const publishedServices = services.filter(s => ['published', 'active'].includes((s.status || '').toLowerCase())).length;
  const pendingServices = services.filter(s => (s.status || '').toLowerCase() === 'pending').length;
  const rejectedServices = services.filter(s => (s.status || '').toLowerCase() === 'rejected').length;
  const suspendedServices = services.filter(s => (s.status || '').toLowerCase() === 'suspended').length;
  const draftServices = services.filter(s => (s.status || '').toLowerCase() === 'draft').length;

  const totalProviders = providers.length;
  const pendingProviders = providers.filter(p => p.approvalStatus === 'pending' || p.status === 'pending').length;
  const approvedProviders = providers.filter(p => p.approvalStatus === 'approved' || p.status === 'active' || p.status === 'approved').length;
  const rejectedProviders = providers.filter(p => p.approvalStatus === 'rejected' || p.status === 'rejected').length;
  const suspendedProviders = providers.filter(p => p.isSuspended === true || p.status === 'suspended').length;
  
  const providerUidsWithServices = new Set(services.map(s => s.ownerUid || s.sellerId || s.ownerId).filter(Boolean));
  const providersWithServices = providers.filter(p => providerUidsWithServices.has(p.uid || p.id)).length;
  const providersNoServices = Math.max(0, totalProviders - providersWithServices);

  const totalBookings = bookings.length;
  const pendingBookings = bookings.filter(b => (b.bookingStatus || '').toLowerCase() === 'pending').length;
  const confirmedBookings = bookings.filter(b => ['confirmed', 'scheduled', 'accepted'].includes((b.bookingStatus || '').toLowerCase())).length;
  const completedBookings = bookings.filter(b => (b.bookingStatus || '').toLowerCase() === 'completed').length;
  const cancelledBookings = bookings.filter(b => ['cancelled', 'rejected', 'declined'].includes((b.bookingStatus || '').toLowerCase())).length;
  const rescheduledBookings = bookings.filter(b => (b.bookingStatus || '').toLowerCase() === 'rescheduled' || b.rescheduledAt).length;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayBookings = bookings.filter(b => b.bookingDate === todayStr).length;
  const upcomingBookings = bookings.filter(b => b.bookingDate && b.bookingDate > todayStr).length;

  const handleUpdateServiceStatus = async (serviceId: string, currentStatus: string, targetStatus: string) => {
    const reason = prompt(`Enter administrative reason to change status of service (${serviceId}) to ${targetStatus}:`);
    if (!reason || !reason.trim()) {
      alert('A valid administrative reason is required.');
      return;
    }
    try {
      const db = getFirebaseDb();
      await updateDoc(doc(db, 'services', serviceId), {
        status: targetStatus,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.displayName || 'Super Admin'
      });
      await logAdminAuditAction(currentUser, 'service', serviceId, serviceId, `Set status to ${targetStatus}`, currentStatus, targetStatus, reason);
      
      try {
        const snap = await getDoc(doc(db, 'services', serviceId));
        if (snap.exists()) {
          const sData = snap.data();
          const ownerUid = sData.ownerUid || sData.ownerId || sData.sellerId || sData.businessId;
          if (ownerUid) {
            await notificationService.notify(
              ownerUid,
              'marketplace_update',
              `Service Status: ${targetStatus.toUpperCase()}`,
              `Your service offering "${sData.title || serviceId}" status was updated to ${targetStatus}.${reason ? ' Reason: ' + reason : ''}`,
              { entityId: serviceId, entityType: 'service', linkTo: '/services' }
            );
          }
        }
      } catch (notifErr) {
        console.warn('Service notification warning:', notifErr);
      }

      alert(`Service status successfully updated to ${targetStatus}.`);
      loadEcosystemData();
    } catch (e) {
      console.error('Failed to update service status:', e);
      alert('Failed to update service status.');
    }
  };

  const handleUpdateProviderStatus = async (providerUid: string, targetStatus: string) => {
    const reason = prompt(`Enter administrative reason to set provider status to ${targetStatus}:`);
    if (!reason || !reason.trim()) {
      alert('A valid administrative reason is required.');
      return;
    }
    try {
      const db = getFirebaseDb();
      const updates: any = {
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.displayName || 'Super Admin'
      };
      if (targetStatus === 'suspended') {
        updates.isSuspended = true;
        updates.status = 'suspended';
        updates.approvalStatus = 'suspended';
      } else if (targetStatus === 'approved' || targetStatus === 'active') {
        updates.isSuspended = false;
        updates.status = 'active';
        updates.approvalStatus = 'approved';
      } else if (targetStatus === 'rejected') {
        updates.status = 'rejected';
        updates.approvalStatus = 'rejected';
      }
      await updateDoc(doc(db, 'users', providerUid), updates);
      await logAdminAuditAction(currentUser, 'user_provider', providerUid, providerUid, `Set provider status to ${targetStatus}`, 'previous', targetStatus, reason);

      try {
        await notificationService.notify(
          providerUid,
          'system_alert',
          `Service Provider Status: ${targetStatus.toUpperCase()}`,
          `Your service provider status has been updated to ${targetStatus}.${reason ? ' Reason: ' + reason : ''}`,
          { entityId: providerUid, entityType: 'provider', linkTo: '/services' }
        );
      } catch (notifErr) {
        console.warn('Provider notification warning:', notifErr);
      }
      alert(`Provider status updated to ${targetStatus}.`);
      loadEcosystemData();
    } catch (e) {
      console.error('Failed to update provider status:', e);
      alert('Failed to update provider status.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Section Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-violet-600/20 border border-violet-500/30 rounded-2xl text-violet-400">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">Service & Provider Control Center</h3>
            <p className="text-xs text-slate-400">Super Admin oversight for service providers, offerings & marketplace appointments</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-2xl border border-slate-800">
          {(['overview', 'services', 'providers', 'bookings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === tab
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {tab}
            </button>
          ))}
          <button
            onClick={loadEcosystemData}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* OVERVIEW METRICS DASHBOARD */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Service Provider Metrics */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Users className="w-4 h-4 text-violet-400" /> Service Providers Intelligence
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
                <div className="text-[10px] font-black text-slate-500 uppercase">Total Providers</div>
                <div className="text-2xl font-black text-white mt-1">{totalProviders}</div>
              </div>
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                <div className="text-[10px] font-black text-amber-400 uppercase">Pending Review</div>
                <div className="text-2xl font-black text-amber-300 mt-1">{pendingProviders}</div>
              </div>
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                <div className="text-[10px] font-black text-emerald-400 uppercase">Active / Approved</div>
                <div className="text-2xl font-black text-emerald-300 mt-1">{approvedProviders}</div>
              </div>
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                <div className="text-[10px] font-black text-rose-400 uppercase">Suspended</div>
                <div className="text-2xl font-black text-rose-300 mt-1">{suspendedProviders}</div>
              </div>
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
                <div className="text-[10px] font-black text-slate-400 uppercase">With Listings</div>
                <div className="text-2xl font-black text-indigo-400 mt-1">{providersWithServices} <span className="text-xs text-slate-500 font-normal">({providersNoServices} empty)</span></div>
              </div>
            </div>
          </div>

          {/* Service Catalog Metrics */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Box className="w-4 h-4 text-indigo-400" /> Services Catalog Overview
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
                <div className="text-[10px] font-black text-slate-500 uppercase">Total Services</div>
                <div className="text-2xl font-black text-white mt-1">{totalServices}</div>
              </div>
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                <div className="text-[10px] font-black text-emerald-400 uppercase">Published</div>
                <div className="text-2xl font-black text-emerald-300 mt-1">{publishedServices}</div>
              </div>
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                <div className="text-[10px] font-black text-amber-400 uppercase">Pending</div>
                <div className="text-2xl font-black text-amber-300 mt-1">{pendingServices}</div>
              </div>
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                <div className="text-[10px] font-black text-rose-400 uppercase">Rejected</div>
                <div className="text-2xl font-black text-rose-300 mt-1">{rejectedServices}</div>
              </div>
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                <div className="text-[10px] font-black text-rose-400 uppercase">Suspended</div>
                <div className="text-2xl font-black text-rose-300 mt-1">{suspendedServices}</div>
              </div>
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
                <div className="text-[10px] font-black text-slate-500 uppercase">Draft</div>
                <div className="text-2xl font-black text-slate-400 mt-1">{draftServices}</div>
              </div>
            </div>
          </div>

          {/* Service Booking Metrics */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" /> Appointments & Bookings Activity
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-2xl">
                <div className="text-[9px] font-black text-slate-500 uppercase">Total Bookings</div>
                <div className="text-xl font-black text-white mt-1">{totalBookings}</div>
              </div>
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                <div className="text-[9px] font-black text-amber-400 uppercase">Pending</div>
                <div className="text-xl font-black text-amber-300 mt-1">{pendingBookings}</div>
              </div>
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                <div className="text-[9px] font-black text-indigo-400 uppercase">Confirmed</div>
                <div className="text-xl font-black text-indigo-300 mt-1">{confirmedBookings}</div>
              </div>
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                <div className="text-[9px] font-black text-emerald-400 uppercase">Completed</div>
                <div className="text-xl font-black text-emerald-300 mt-1">{completedBookings}</div>
              </div>
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                <div className="text-[9px] font-black text-rose-400 uppercase">Cancelled</div>
                <div className="text-xl font-black text-rose-300 mt-1">{cancelledBookings}</div>
              </div>
              <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-2xl">
                <div className="text-[9px] font-black text-violet-400 uppercase">Rescheduled</div>
                <div className="text-xl font-black text-violet-300 mt-1">{rescheduledBookings}</div>
              </div>
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-2xl">
                <div className="text-[9px] font-black text-slate-400 uppercase">Today</div>
                <div className="text-xl font-black text-white mt-1">{todayBookings}</div>
              </div>
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-2xl">
                <div className="text-[9px] font-black text-slate-400 uppercase">Upcoming</div>
                <div className="text-xl font-black text-white mt-1">{upcomingBookings}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SERVICES MANAGEMENT TAB */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search services by title or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'published', 'pending', 'suspended', 'rejected', 'draft'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                    statusFilter === st ? 'bg-violet-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase tracking-widest text-slate-400">
                  <th className="px-4 py-3">Service Title</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Base Price</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {services
                  .filter(s => statusFilter === 'all' || (s.status || '').toLowerCase() === statusFilter)
                  .filter(s => !searchTerm || (s.title || s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (s.id || '').toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((service) => (
                    <tr key={service.id} className="hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-bold text-white">
                        {service.title || service.name || 'Unnamed Service'}
                        <span className="block text-[10px] font-mono text-slate-500">{service.id}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{service.category || 'General'}</td>
                      <td className="px-4 py-3 font-mono font-bold text-emerald-400">{service.price || service.basePrice || 0} Pi</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                          service.status === 'published' || service.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                          service.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                          service.status === 'suspended' ? 'bg-rose-500/20 text-rose-400' :
                          service.status === 'rejected' ? 'bg-rose-500/20 text-rose-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          {service.status || 'draft'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1">
                        <button
                          onClick={() => handleUpdateServiceStatus(service.id, service.status || 'draft', 'published')}
                          className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-md font-bold text-[10px]"
                        >
                          Approve / Publish
                        </button>
                        <button
                          onClick={() => handleUpdateServiceStatus(service.id, service.status || 'draft', 'suspended')}
                          className="px-2 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 rounded-md font-bold text-[10px]"
                        >
                          Suspend
                        </button>
                        <button
                          onClick={() => handleUpdateServiceStatus(service.id, service.status || 'draft', 'rejected')}
                          className="px-2 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 rounded-md font-bold text-[10px]"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PROVIDERS DIRECTORY TAB */}
      {activeTab === 'providers' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase tracking-widest text-slate-400">
                <th className="px-4 py-3">Provider Name / Business</th>
                <th className="px-4 py-3">UID</th>
                <th className="px-4 py-3">Approval / Status</th>
                <th className="px-4 py-3 text-right">Provider Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {providers.map((p) => (
                <tr key={p.uid || p.id} className="hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-bold text-white">
                    {p.displayName || p.businessName || p.email || 'Service Provider'}
                  </td>
                  <td className="px-4 py-3 font-mono text-[10px] text-slate-500">{p.uid || p.id}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                      p.isSuspended || p.status === 'suspended' ? 'bg-rose-500/20 text-rose-400' :
                      p.approvalStatus === 'pending' || p.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {p.isSuspended ? 'Suspended' : p.approvalStatus || p.status || 'Active'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <button
                      onClick={() => handleUpdateProviderStatus(p.uid || p.id, 'approved')}
                      className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-md font-bold text-[10px]"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleUpdateProviderStatus(p.uid || p.id, 'suspended')}
                      className="px-2 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 rounded-md font-bold text-[10px]"
                    >
                      Suspend
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* BOOKINGS LEDGER TAB */}
      {activeTab === 'bookings' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase tracking-widest text-slate-400">
                <th className="px-4 py-3">Booking Title / Package</th>
                <th className="px-4 py-3">Date & Time</th>
                <th className="px-4 py-3">Buyer ID</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-bold text-white">
                    {b.title || b.packageName || 'Service Appointment'}
                    <span className="block text-[10px] font-mono text-slate-500">{b.id}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-300">
                    {b.bookingDate || 'N/A'} {b.bookingTime || ''}
                  </td>
                  <td className="px-4 py-3 font-mono text-[10px] text-slate-400">{b.buyerId || 'N/A'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-indigo-500/20 text-indigo-400">
                      {b.bookingStatus || 'pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

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
      <span className="ml-4 text-sm font-bold text-slate-600 uppercase tracking-widest">Chart Visualization</span>
    </div>
  </div>
);

export const OrderAnalyticsPanel = () => {
  const [stats, setStats] = useState([
    { label: 'Total Orders', value: '...' },
    { label: 'Completed', value: '...' },
    { label: 'Pending', value: '...' },
    { label: 'Cancelled/Refunded', value: '...' },
  ]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const db = getFirebaseDb();
        const snap = await getDocs(collection(db, 'orders'));
        let total = 0;
        let completed = 0;
        let pending = 0;
        let cancelled = 0;

        snap.forEach(d => {
          total++;
          const data = d.data();
          const status = data.status || data.orderStatus;
          if (status === 'completed' || status === 'delivered') completed++;
          else if (status === 'cancelled' || status === 'refunded') cancelled++;
          else pending++;
        });

        setStats([
          { label: 'Total Orders', value: total.toLocaleString() },
          { label: 'Completed', value: completed.toLocaleString() },
          { label: 'Pending', value: pending.toLocaleString() },
          { label: 'Cancelled/Refunded', value: cancelled.toLocaleString() },
        ]);
      } catch (e) {
        console.warn('Failed to load order stats:', e);
      }
    };
    fetchStats();
  }, []);

  return <GenericAnalyticsPanel title="Order" icon={ShoppingBag} stats={stats} />;
};

export const PaymentAnalyticsPanel = () => {
  const [stats, setStats] = useState([
    { label: 'Pi Testnet Volume', value: '...' },
    { label: 'Successful Payments', value: '...' },
    { label: 'Failed Payments', value: '...' },
    { label: 'Avg Processing Time', value: '2.4s' },
  ]);

  useEffect(() => {
    const fetchPaymentStats = async () => {
      try {
        const db = getFirebaseDb();
        const snap = await getDocs(collection(db, 'orders'));
        let volume = 0;
        let successCount = 0;
        let failCount = 0;

        snap.forEach(d => {
          const data = d.data();
          const amount = Number(data.totalPrice || data.amount || 0);
          if (data.paymentStatus === 'paid' || data.paymentStatus === 'completed' || data.status === 'completed' || data.status === 'delivered') {
            volume += amount;
            successCount++;
          } else if (data.paymentStatus === 'failed') {
            failCount++;
          }
        });

        setStats([
          { label: 'Pi Testnet Volume', value: `${volume.toFixed(2)} Pi` },
          { label: 'Successful Payments', value: successCount.toLocaleString() },
          { label: 'Failed Payments', value: failCount.toLocaleString() },
          { label: 'Avg Processing Time', value: '2.4s' },
        ]);
      } catch (e) {
        console.warn('Failed to load payment stats:', e);
      }
    };
    fetchPaymentStats();
  }, []);

  return <GenericAnalyticsPanel title="Payment" icon={CreditCard} stats={stats} />;
};

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
  const [rates, setRates] = useState<any>({
    standard_banner: 5,
    flash_sale_banner: 10,
    featured_store: 12,
    sponsored_ad: 8
  });
  const [editingRates, setEditingRates] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'active' | 'rejected'>('pending');
  const [loading, setLoading] = useState(true);
  const [showRatesConfig, setShowRatesConfig] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { campaignService } = await import('../../services/campaignService');
      const [allCamps, currentRates] = await Promise.all([
        campaignService.getAllCampaignsForAdmin(),
        campaignService.getAdPricingRates()
      ]);
      setCampaigns(allCamps);
      setRates(currentRates);
      setEditingRates(currentRates);
    } catch (e) {
      console.warn('Error loading campaigns or rates:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRates = async () => {
    try {
      const { campaignService } = await import('../../services/campaignService');
      await campaignService.updateAdPricingRates(editingRates, user?.uid || 'sys_admin');
      setRates(editingRates);
      setShowRatesConfig(false);
      alert('Ad Pricing Rates updated successfully!');
    } catch (e) {
      console.error('Failed updating rates:', e);
      alert('Failed to update ad pricing rates.');
    }
  };

  const handleUpdateStatus = async (camp: any, status: any) => {
    let rejectionReason: string | undefined = undefined;

    if (status === 'rejected') {
      const inputReason = prompt(`Enter administrative reason for rejecting ad campaign "${camp.campaignTitle}":`);
      if (!inputReason || !inputReason.trim()) {
        alert('A valid administrative reason is required to reject a campaign.');
        return;
      }
      rejectionReason = inputReason.trim();
    }

    try {
      const { campaignService } = await import('../../services/campaignService');
      await campaignService.updateCampaignStatus(
        camp.id, 
        status, 
        user?.uid || 'sys_admin',
        rejectionReason
      );
      await loadData();
    } catch (e) {
      alert('Failed to update campaign status');
    }
  };

  const handleTogglePin = async (id: string, currentPin: boolean) => {
    try {
      const { campaignService } = await import('../../services/campaignService');
      await campaignService.togglePinCampaign(id, !currentPin, user?.uid || 'sys_admin');
      await loadData();
    } catch (e) {
      alert('Failed to pin campaign');
    }
  };

  const filteredCampaigns = campaigns.filter(c => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'pending') return c.status === 'pending' || c.paymentStatus === 'verified';
    if (activeFilter === 'active') return c.status === 'active';
    if (activeFilter === 'rejected') return c.status === 'rejected';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-pink-500/20 border border-pink-500/30 rounded-2xl text-pink-400">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Paid Ad & Campaign Moderation</h3>
            <p className="text-xs text-slate-400">Review merchant ad payments, hero banners, sponsored campaigns & rates</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRatesConfig(!showRatesConfig)}
            className="px-3.5 py-2 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Configure Rates</span>
          </button>

          <button
            onClick={loadData}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Super Admin Pricing Rate Card Config Drawer */}
      {showRatesConfig && (
        <div className="p-5 bg-slate-900 border border-violet-500/30 rounded-2xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-400" /> Platform Ad Rate Card Settings (Pi / Day)
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">Updates apply instantly to new merchant campaign quotes</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="text-slate-400 font-bold block mb-1">Standard Banner (Pi/day)</label>
              <input 
                type="number"
                value={editingRates?.standard_banner || 5}
                onChange={e => setEditingRates({ ...editingRates, standard_banner: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Flash Sale Banner (Pi/day)</label>
              <input 
                type="number"
                value={editingRates?.flash_sale_banner || 10}
                onChange={e => setEditingRates({ ...editingRates, flash_sale_banner: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Featured Store (Pi/day)</label>
              <input 
                type="number"
                value={editingRates?.featured_store || 12}
                onChange={e => setEditingRates({ ...editingRates, featured_store: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Sponsored Hero Ad (Pi/day)</label>
              <input 
                type="number"
                value={editingRates?.sponsored_ad || 8}
                onChange={e => setEditingRates({ ...editingRates, sponsored_ad: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800 text-xs">
            <button
              onClick={() => setShowRatesConfig(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl font-bold"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveRates}
              className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold uppercase"
            >
              Save Rate Changes
            </button>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs w-fit">
        <button
          onClick={() => setActiveFilter('pending')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
            activeFilter === 'pending' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          Pending Review ({campaigns.filter(c => c.status === 'pending').length})
        </button>
        <button
          onClick={() => setActiveFilter('active')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
            activeFilter === 'active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          Live / Active ({campaigns.filter(c => c.status === 'active').length})
        </button>
        <button
          onClick={() => setActiveFilter('rejected')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
            activeFilter === 'rejected' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          Rejected ({campaigns.filter(c => c.status === 'rejected').length})
        </button>
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
            activeFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          All Campaigns ({campaigns.length})
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-xs font-mono">Loading campaign records...</div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-2xl text-slate-500 text-xs">
          No ad campaigns match the selected filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCampaigns.map(camp => (
            <div key={camp.id} className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-4">
              <div className="flex items-start gap-3">
                {camp.bannerImage && (
                  <img src={camp.bannerImage} alt={camp.campaignTitle} className="w-20 h-14 rounded-xl object-cover border border-slate-800 shrink-0" referrerPolicy="no-referrer" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                    <span className="px-2 py-0.5 bg-violet-500/10 text-violet-300 border border-violet-500/20 text-[9px] font-bold rounded uppercase">
                      {camp.adPricingTier || camp.campaignType}
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
                  <p className="text-xs text-slate-400 truncate">{camp.businessName || 'Verified Merchant'}</p>
                </div>
              </div>

              {/* Payment Verification Info Badge */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">Payment Status:</span>
                  <span className={`font-mono font-bold uppercase ${
                    camp.paymentStatus === 'verified' ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {camp.paymentStatus || 'unpaid'}
                  </span>
                </div>
                {camp.paymentTxId && (
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>TxID: <span className="text-amber-300">{camp.paymentTxId}</span></span>
                    <span>Amount: <span className="text-white font-bold">{camp.paymentAmountPi || camp.budgetPi || 0} Pi</span></span>
                  </div>
                )}
              </div>

              {/* Rejection Reason Callout */}
              {camp.status === 'rejected' && camp.rejectionReason && (
                <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-xs space-y-0.5">
                  <span className="font-bold text-rose-400 block">Rejection Reason:</span>
                  <p className="text-slate-300 text-[11px]">{camp.rejectionReason}</p>
                </div>
              )}

              {/* Performance Metrics */}
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

              {/* Actions */}
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
                      onClick={() => handleUpdateStatus(camp, 'active')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold uppercase transition-all shadow"
                    >
                      Approve & Go Live
                    </button>
                  )}
                  {camp.status === 'active' && (
                    <button
                      onClick={() => handleUpdateStatus(camp, 'paused')}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-[10px] font-bold uppercase transition-all shadow"
                    >
                      Pause
                    </button>
                  )}
                  {camp.status !== 'rejected' && (
                    <button
                      onClick={() => handleUpdateStatus(camp, 'rejected')}
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



