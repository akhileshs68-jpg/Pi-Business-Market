/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  setDoc, 
  deleteDoc, 
  limit, 
  orderBy, 
  startAfter, 
  limitToLast,
  endBefore,
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { getFirebaseDb } from '../../firebase/config';
import { isPendingSeller } from '../../utils/adminMetrics';
import { useAuth } from '../../auth/useAuth';
import { useBusiness } from '../../context/BusinessContext';
import { Business } from '../../types';
import { notificationService } from '../../services/notificationService';
import { 
  Store, Box, ShoppingBag, CreditCard, ShieldAlert, CheckCircle2, XCircle, 
  Archive, Trash2, Eye, Edit2, Play, Pause, ChevronLeft, ChevronRight, 
  RefreshCw, TrendingUp, HelpCircle, History, LogIn
} from 'lucide-react';

export const BusinessManagementPanel: React.FC = () => {
  const { user } = useAuth();
  const { refreshWorkspace } = useBusiness();
  const db = getFirebaseDb();

  // Pagination & Loading States
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [firstDoc, setFirstDoc] = useState<any>(null);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(false);
  const [prevDocs, setPrevDocs] = useState<any[]>([]);

  // Selected Filter for local visual sorting
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');

  // Stats Cache to prevent redundant collection reads
  const [businessStats, setBusinessStats] = useState<Record<string, {
    stores: number;
    products: number;
    orders: number;
    revenue: number;
  }>>({});

  // Active Modals & Selected items
  const [selectedBiz, setSelectedBiz] = useState<Business | null>(null);
  const [modalType, setModalType] = useState<'view' | 'edit' | 'confirm_action' | 'analytics' | 'switcher' | null>(null);
  const [actionType, setActionType] = useState<string>('');
  const [actionReason, setActionReason] = useState<string>('');
  
  // Edit Form Fields
  const [editFields, setEditFields] = useState({
    businessName: '',
    legalName: '',
    description: '',
    businessType: '',
    category: '',
    email: '',
    phone: '',
    website: '',
    verificationStatus: '',
    businessStatus: ''
  });

  // Load audit logs of selected business
  const [selectedBizLogs, setSelectedBizLogs] = useState<any[]>([]);

  // Fetch Businesses using Indexed Firestore Query Cursor Pagination
  const fetchBusinesses = async (direction: 'next' | 'prev' | 'init' = 'init') => {
    setLoading(true);
    try {
      let q = query(collection(db, 'businesses'), orderBy('createdAt', 'desc'));

      if (statusFilter !== 'all') {
        q = query(q, where('businessStatus', '==', statusFilter));
      }
      if (verificationFilter !== 'all') {
        q = query(q, where('verificationStatus', '==', verificationFilter));
      }

      // Pagination Cursor Application
      if (direction === 'next' && lastDoc) {
        q = query(q, startAfter(lastDoc), limit(pageSize));
      } else if (direction === 'prev' && firstDoc) {
        // Go back by popping from previous document stack
        const lastPrev = prevDocs[prevDocs.length - 2];
        if (lastPrev) {
          q = query(q, startAfter(lastPrev), limit(pageSize));
          setPrevDocs(prevDocs.slice(0, -1));
        } else {
          q = query(q, limit(pageSize));
          setPrevDocs([]);
        }
      } else {
        q = query(q, limit(pageSize));
        setPrevDocs([]);
      }

      const snap = await getDocs(q);
      const docs = snap.docs;

      if (docs.length > 0) {
        setFirstDoc(docs[0]);
        setLastDoc(docs[docs.length - 1]);
        
        // Track previous docs for back pagination
        if (direction === 'next') {
          setPrevDocs([...prevDocs, docs[0]]);
        }

        const list = docs.map(d => {
          const data = d.data();
          return {
            ...data,
            id: d.id,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt || '',
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt || '',
          } as Business;
        });

        setBusinesses(list);
        setHasMore(docs.length === pageSize);

        // Lazily fetch stats for these loaded businesses to avoid full collection scans
        list.forEach(biz => {
          lazyLoadBusinessStats(biz.id);
        });
      } else {
        setBusinesses([]);
        setHasMore(false);
      }
    } catch (e) {
      console.error('Error fetching businesses:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses('init');
  }, [statusFilter, verificationFilter]);

  // Lazy loading of sub-collection stats with indexed query
  const lazyLoadBusinessStats = async (bizId: string) => {
    if (businessStats[bizId]) return;

    try {
      // 1. Fetch stores
      const storeSnap = await getDocs(query(collection(db, 'stores'), where('businessId', '==', bizId)));
      // 2. Fetch products
      const prodSnap = await getDocs(query(collection(db, 'products'), where('businessId', '==', bizId)));
      // 3. Fetch orders
      const orderSnap = await getDocs(query(collection(db, 'orders'), where('businessId', '==', bizId)));

      let revenueSum = 0;
      orderSnap.docs.forEach(d => {
        const o = d.data();
        if (o.status === 'completed' || o.orderStatus === 'completed' || o.status === 'delivered') {
          revenueSum += Number(o.totalPrice || o.amount || 0);
        }
      });

      setBusinessStats(prev => ({
        ...prev,
        [bizId]: {
          stores: storeSnap.size,
          products: prodSnap.size,
          orders: orderSnap.size,
          revenue: revenueSum
        }
      }));
    } catch (err) {
      console.warn(`Failed to lazy load metrics for ${bizId}:`, err);
    }
  };

  // Fetch audit logs for a business
  const fetchBusinessAuditLogs = async (bizId: string) => {
    try {
      const q = query(
        collection(db, 'adminAuditLogs'), 
        where('businessId', '==', bizId),
        limit(20)
      );
      const snap = await getDocs(q);
      const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort client side to avoid demanding complex composite indexes
      logs.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setSelectedBizLogs(logs);
    } catch (e) {
      console.error('Error fetching audit logs:', e);
    }
  };

  // Trigger Audit Log Entry Creation
  const logAdminAction = async (biz: Business, action: string, oldValue: any, newValue: any, reason: string) => {
    const logId = `AUD_ADMIN_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
    const logRef = doc(db, 'adminAuditLogs', logId);
    
    const payload = {
      id: logId,
      adminId: user?.uid || 'system',
      adminName: user?.displayName || user?.username || 'Admin',
      businessId: biz.id,
      businessName: biz.businessName || biz.displayName,
      action,
      timestamp: new Date().toISOString(),
      oldValue: typeof oldValue === 'object' ? JSON.stringify(oldValue) : String(oldValue),
      newValue: typeof newValue === 'object' ? JSON.stringify(newValue) : String(newValue),
      reason: reason || 'Administrative modification'
    };

    await setDoc(logRef, payload);
  };

      // Execute State Changes
  const handleActionExecute = async () => {
    if (!selectedBiz) return;
    if ((actionType === 'Reject' || actionType === 'Suspend') && !actionReason.trim()) {
      alert(`Please provide a mandatory reason for administrative ${actionType.toLowerCase()}.`);
      return;
    }

    try {
      const bizRef = doc(db, 'businesses', selectedBiz.id);
      let updates: any = {};
      let oldVal = selectedBiz.verificationStatus || selectedBiz.businessStatus || 'Pending';
      let newVal = '';
      const nowIso = new Date().toISOString();
      const adminUid = user?.uid || 'admin';
      const reasonToSave = actionReason.trim() || `Administrative ${actionType.toLowerCase()} action.`;

      switch (actionType) {
        case 'Verify':
        case 'Approve':
          updates = {
            verificationStatus: 'Approved',
            approvalStatus: 'approved',
            businessStatus: 'active',
            status: 'active',
            verified: true,
            approvedAt: nowIso,
            approvedBy: adminUid,
          };
          newVal = 'Approved';
          break;
        case 'Reject':
          updates = {
            verificationStatus: 'Rejected',
            approvalStatus: 'rejected',
            businessStatus: 'rejected',
            status: 'rejected',
            verified: false,
            rejectedAt: nowIso,
            rejectedBy: adminUid,
            rejectionReason: reasonToSave,
          };
          newVal = 'Rejected';
          break;
        case 'Suspend':
          updates = {
            verificationStatus: 'Suspended',
            approvalStatus: 'suspended',
            businessStatus: 'suspended',
            status: 'suspended',
            suspendedAt: nowIso,
            suspendedBy: adminUid,
            suspensionReason: reasonToSave,
          };
          newVal = 'Suspended';
          break;
        case 'Activate':
          updates = {
            verificationStatus: 'Approved',
            approvalStatus: 'approved',
            businessStatus: 'active',
            status: 'active',
            verified: true,
          };
          newVal = 'Active';
          break;
        case 'Archive':
          updates = {
            businessStatus: 'archived',
            status: 'archived',
          };
          newVal = 'Archived';
          break;
        case 'Delete':
          await deleteDoc(bizRef);
          await logAdminAction(selectedBiz, 'Delete Business', selectedBiz.businessStatus, 'deleted', reasonToSave);
          setModalType(null);
          setSelectedBiz(null);
          setActionReason('');
          fetchBusinesses('init');
          return;
      }

      await setDoc(bizRef, {
        ...updates,
        updatedAt: nowIso,
        updatedBy: user?.displayName || 'Admin'
      }, { merge: true });

      // Sync matching universalApprovals document if present
      try {
        const appq = query(collection(db, 'universalApprovals'), where('entityId', '==', selectedBiz.id));
        const appSnap = await getDocs(appq);
        if (!appSnap.empty) {
          appSnap.forEach(async (ad) => {
            await setDoc(doc(db, 'universalApprovals', ad.id), {
              status: actionType === 'Verify' || actionType === 'Approve' ? 'Approved' : actionType === 'Reject' ? 'Rejected' : 'On Hold',
              updatedAt: nowIso
            }, { merge: true });
          });
        }
      } catch (appErr) {
        console.warn('Failed syncing universalApprovals record:', appErr);
      }

      // Dispatch notification to seller owner
      if (selectedBiz.ownerUid) {
        const notifTitle = actionType === 'Verify' || actionType === 'Approve' 
          ? 'Seller Account Approved' 
          : actionType === 'Reject' 
          ? 'Seller Account Application Rejected' 
          : actionType === 'Suspend' 
          ? 'Seller Account Suspended' 
          : 'Seller Account Status Update';
        
        const notifMsg = actionType === 'Verify' || actionType === 'Approve'
          ? `Congratulations! Your seller business profile "${selectedBiz.businessName}" has been approved.`
          : actionType === 'Reject'
          ? `Your seller application for "${selectedBiz.businessName}" was rejected. Reason: ${reasonToSave}`
          : actionType === 'Suspend'
          ? `Your business profile "${selectedBiz.businessName}" has been suspended. Reason: ${reasonToSave}`
          : `Your business profile "${selectedBiz.businessName}" status has been updated to ${newVal}.`;

        await notificationService.notify(
          selectedBiz.ownerUid,
          'system_alert',
          notifTitle,
          notifMsg,
          { entityId: selectedBiz.id, entityType: 'business', linkTo: '/business/dashboard' }
        ).catch(e => console.warn('Failed sending notification:', e));
      }

      // Record immutable admin audit log
      await logAdminAction(selectedBiz, `${actionType} Business`, oldVal, newVal, reasonToSave);

      setModalType(null);
      setSelectedBiz(null);
      setActionReason('');
      fetchBusinesses('init');
    } catch (e) {
      console.error('Error executing admin action:', e);
    }
  };

  const handleEditClick = (biz: Business) => {
    setSelectedBiz(biz);
    setEditFields({
      businessName: biz.businessName || '',
      legalName: biz.legalName || '',
      description: biz.description || '',
      businessType: biz.businessType || '',
      category: biz.category || '',
      email: biz.email || '',
      phone: biz.phone || '',
      website: biz.website || '',
      verificationStatus: biz.verificationStatus || '',
      businessStatus: biz.businessStatus || ''
    });
    setModalType('edit');
  };

  const handleEditSave = async () => {
    if (!selectedBiz) return;
    try {
      const bizRef = doc(db, 'businesses', selectedBiz.id);
      
      const beforeState = {
        businessName: selectedBiz.businessName,
        legalName: selectedBiz.legalName,
        description: selectedBiz.description,
        businessType: selectedBiz.businessType,
        category: selectedBiz.category,
        email: selectedBiz.email,
        phone: selectedBiz.phone,
        website: selectedBiz.website,
        verificationStatus: selectedBiz.verificationStatus,
        businessStatus: selectedBiz.businessStatus
      };

      await setDoc(bizRef, {
        ...editFields,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.displayName || 'Admin'
      }, { merge: true });

      await logAdminAction(
        selectedBiz, 
        'Edit Business Details', 
        beforeState, 
        editFields, 
        'Direct profile modification from Enterprise Admin Console'
      );

      setModalType(null);
      setSelectedBiz(null);
      fetchBusinesses('init');
    } catch (e) {
      console.error('Failed to update business details:', e);
    }
  };

  // Switcher Implementation
  const handleOpenSwitcher = (biz: Business) => {
    setSelectedBiz(biz);
    setModalType('switcher');
  };

  const executeSwitchMode = async (mode: 'read_only' | 'support') => {
    if (!selectedBiz) return;

    const reason = prompt(`Enter a reason for accessing ${selectedBiz.businessName} in ${mode === 'read_only' ? 'Read-Only' : 'Support'} mode:`);
    if (!reason?.trim()) {
      alert('A valid explanation is required to initiate business switcher bypass.');
      return;
    }

    // Set switcher state in localStorage
    localStorage.setItem('admin_switcher_active_business_id', selectedBiz.id);
    localStorage.setItem('admin_switcher_mode', mode);
    localStorage.setItem('admin_switcher_business_name', selectedBiz.businessName);

    // Write admin switcher session to Firestore for trusted backend enforcement
    if (user?.uid) {
      try {
        await setDoc(doc(db, 'adminSwitcherSessions', user.uid), {
          activeBusinessId: selectedBiz.id,
          mode: mode,
          businessName: selectedBiz.businessName,
          startedAt: new Date().toISOString(),
          adminUid: user.uid
        });
      } catch (err) {
        console.error('Failed to save admin switcher session to Firestore:', err);
      }
    }

    // Record administrative bypass start in audit log
    await logAdminAction(
      selectedBiz,
      `Bypass Active: Business Switcher (${mode.toUpperCase()})`,
      'none',
      mode,
      reason
    );

    // Reload layout and context cleanly
    window.location.href = '/business-center';
  };

  return (
    <div className="space-y-6">
      {/* Overview stats & Seller Approval Queue Header Banner */}
      <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl backdrop-blur-md space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Seller Account Approval System
              </span>
            </div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <Store className="w-5 h-5 text-indigo-400" /> Enterprise Business & Seller Management
            </h3>
            <p className="text-slate-400 text-xs mt-1">Review pending merchant registrations, approve accounts, audit business identity, and issue notifications.</p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => fetchBusinesses('init')}
              className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all flex items-center gap-2 text-xs font-bold"
              title="Refresh list"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Queue</span>
            </button>
          </div>
        </div>

        {/* Quick Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-800/80 pt-4">
          <button
            onClick={() => { setVerificationFilter('all'); setStatusFilter('all'); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              verificationFilter === 'all' && statusFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            All Businesses
          </button>

          <button
            onClick={() => { setVerificationFilter('Pending'); setStatusFilter('all'); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              verificationFilter === 'Pending'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Pending Approvals</span>
            <span className="ml-1 px-1.5 py-0.2 bg-slate-950/40 rounded-full text-[10px]">
              {businesses.filter(isPendingSeller).length}
            </span>
          </button>

          <button
            onClick={() => { setVerificationFilter('Verified'); setStatusFilter('active'); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              verificationFilter === 'Verified'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approved / Verified</span>
          </button>

          <button
            onClick={() => { setVerificationFilter('Rejected'); setStatusFilter('all'); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              verificationFilter === 'Rejected'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejected</span>
          </button>

          <button
            onClick={() => { setVerificationFilter('all'); setStatusFilter('suspended'); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              statusFilter === 'suspended'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-950 text-slate-400 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Pause className="w-3.5 h-3.5" />
            <span>Suspended</span>
          </button>
        </div>
      </div>

      {/* SELLER ACCOUNT APPROVAL QUEUE (DEDICATED CARDS SECTION) */}
      {businesses.filter(isPendingSeller).length > 0 && (
        <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-black text-white tracking-tight uppercase">SELLER ACCOUNT APPROVAL QUEUE</h3>
              <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-xs font-black">
                {businesses.filter(isPendingSeller).length} Action Required
              </span>
            </div>
            <span className="text-xs text-amber-300 font-medium">Super Admin Direct Verification</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {businesses
              .filter(isPendingSeller)
              .map(biz => (
                <div key={biz.id} className="p-5 bg-slate-950 border border-amber-500/30 rounded-xl flex flex-col justify-between gap-4 shadow-xl">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-base font-bold text-white flex items-center gap-1.5">
                          <Store className="w-4 h-4 text-amber-400" />
                          {biz.businessName || biz.displayName}
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">Category: <span className="text-indigo-400 font-semibold">{biz.category || 'General'}</span> | Type: <span className="text-slate-300 capitalize">{biz.businessType || 'Retail'}</span></p>
                      </div>
                      <span className="shrink-0 px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-[10px] font-black uppercase tracking-wider">
                        APPROVAL PENDING
                      </span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-400 space-y-1">
                      <div>Owner/Seller: <span className="text-slate-200 font-medium">{biz.createdBy || biz.ownerUid}</span></div>
                      <div>Location: <span className="text-slate-200 font-medium">{[biz.city, biz.state, biz.country].filter(Boolean).join(', ') || 'Global'}</span></div>
                      <div>Registration Date: <span className="text-slate-200 font-medium">{biz.createdAt ? new Date(biz.createdAt).toLocaleDateString() : 'Recent'}</span></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                    <button
                      onClick={() => { setSelectedBiz(biz); setActionType('Approve'); setModalType('confirm_action'); }}
                      className="flex-1 py-2 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-black text-xs flex items-center justify-center gap-1 transition-all shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> APPROVE
                    </button>
                    <button
                      onClick={() => { setSelectedBiz(biz); setActionType('Reject'); setModalType('confirm_action'); }}
                      className="flex-1 py-2 px-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-black text-xs flex items-center justify-center gap-1 transition-all shadow-md shadow-rose-600/20 active:scale-95 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" /> REJECT
                    </button>
                    <button
                      onClick={() => { setSelectedBiz(biz); setActionType('Suspend'); setModalType('confirm_action'); }}
                      className="flex-1 py-2 px-2 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-lg font-black text-xs flex items-center justify-center gap-1 transition-all shadow-md shadow-amber-600/20 active:scale-95 cursor-pointer"
                    >
                      <Pause className="w-3.5 h-3.5" /> SUSPEND
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Main Businesses Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-800/40">
              <tr className="border-b border-slate-800">
                <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Business</th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Owner / Contact</th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Type / Industry</th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verification</th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Metrics</th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500 text-sm">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
                      <span>Retrieving business identities...</span>
                    </div>
                  </td>
                </tr>
              ) : businesses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500 text-sm">
                    No businesses matching search parameters.
                  </td>
                </tr>
              ) : (
                businesses.map(biz => {
                  const stats = businessStats[biz.id] || { stores: 0, products: 0, orders: 0, revenue: 0 };
                  const isVerifiedOrApproved = biz.verificationStatus === 'Verified' || biz.verificationStatus === 'Approved' || (biz as any).approvalStatus === 'approved';
                  const isRejected = biz.verificationStatus === 'Rejected' || (biz as any).approvalStatus === 'rejected';
                  const isSuspended = biz.verificationStatus === 'Suspended' || biz.businessStatus === 'suspended' || (biz as any).approvalStatus === 'suspended';

                  return (
                    <tr key={biz.id} className="hover:bg-slate-800/20 transition-colors group">
                      {/* Name & Logo */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {biz.logoUrl ? (
                            <img 
                              src={biz.logoUrl} 
                              alt={biz.businessName} 
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-xl object-cover border border-slate-800" 
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-sm font-bold text-indigo-400">
                              {biz.businessName ? biz.businessName[0].toUpperCase() : 'B'}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-white group-hover:text-indigo-300 transition-colors">{biz.businessName || biz.displayName}</div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {biz.id}</div>
                          </div>
                        </div>
                      </td>

                      {/* Owner & Contact */}
                      <td className="px-5 py-4">
                        <div className="text-xs text-slate-300 font-medium truncate max-w-[140px]" title={biz.ownerUid}>
                          UID: {biz.ownerUid ? `${biz.ownerUid.substring(0, 8)}...` : 'N/A'}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[140px]">{biz.email}</div>
                      </td>

                      {/* Business Type */}
                      <td className="px-5 py-4">
                        <span className="px-2 py-0.5 bg-slate-800 border border-slate-700/50 rounded-md text-[10px] font-medium text-slate-300 capitalize">
                          {biz.businessType || 'retail'}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-1 capitalize">{biz.category}</div>
                      </td>

                      {/* Verification Status */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isVerifiedOrApproved ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                          isRejected ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                          isSuspended ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                          'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {isVerifiedOrApproved ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : null}
                          {isRejected ? <XCircle className="w-3 h-3 text-rose-400" /> : null}
                          {isVerifiedOrApproved ? 'Approved' : isRejected ? 'Rejected' : isSuspended ? 'Suspended' : 'Approval Pending'}
                        </span>
                      </td>

                      {/* Active / Suspended */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold capitalize ${
                          biz.businessStatus === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                          biz.businessStatus === 'suspended' ? 'bg-rose-500/10 text-rose-400' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {biz.businessStatus || 'active'}
                        </span>
                      </td>

                      {/* Metrics counts */}
                      <td className="px-5 py-4">
                        <div className="text-[10px] text-slate-300 grid grid-cols-2 gap-x-2 gap-y-0.5">
                          <span>Stores: <strong className="text-white">{stats.stores}</strong></span>
                          <span>Products: <strong className="text-white">{stats.products}</strong></span>
                          <span>Orders: <strong className="text-white">{stats.orders}</strong></span>
                          <span>Rev: <strong className="text-emerald-400 font-mono">{stats.revenue.toFixed(1)} π</strong></span>
                        </div>
                      </td>

                      {/* Administrative actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center gap-1.5 justify-end flex-wrap">
                          {/* Super Admin Direct Approvals Labeled Buttons */}
                          <button 
                            onClick={() => { setSelectedBiz(biz); setActionType('Approve'); setModalType('confirm_action'); }}
                            disabled={isVerifiedOrApproved}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] flex items-center gap-1 transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            title="Approve Seller Account"
                          >
                            <CheckCircle2 className="w-3 h-3" /> APPROVE
                          </button>

                          <button 
                            onClick={() => { setSelectedBiz(biz); setActionType('Reject'); setModalType('confirm_action'); }}
                            disabled={isRejected}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] flex items-center gap-1 transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            title="Reject Seller Account"
                          >
                            <XCircle className="w-3 h-3" /> REJECT
                          </button>

                          <button 
                            onClick={() => { setSelectedBiz(biz); setActionType('Suspend'); setModalType('confirm_action'); }}
                            disabled={isSuspended}
                            className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-[10px] flex items-center gap-1 transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            title="Suspend Seller Account"
                          >
                            <Pause className="w-3 h-3" /> SUSPEND
                          </button>

                          {/* Secondary options */}
                          <button 
                            onClick={() => { setSelectedBiz(biz); setModalType('view'); }}
                            className="p-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"
                            title="View Profile Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button 
                            onClick={() => handleEditClick(biz)}
                            className="p-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"
                            title="Edit Profile"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button 
                            onClick={() => { setSelectedBiz(biz); fetchBusinessAuditLogs(biz.id); setModalType('analytics'); }}
                            className="p-1 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg text-indigo-400 hover:text-indigo-300 transition-all"
                            title="View Analytics & Audit Logs"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>

                          <button 
                            onClick={() => handleOpenSwitcher(biz)}
                            className="p-1 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg text-emerald-400 hover:text-emerald-300 transition-all"
                            title="Open Business Dashboard (Switcher)"
                          >
                            <LogIn className="w-3.5 h-3.5" />
                          </button>

                          <button 
                            onClick={() => { setSelectedBiz(biz); setActionType('Delete'); setModalType('confirm_action'); }}
                            className="p-1 bg-rose-500/15 hover:bg-rose-500/30 rounded-lg text-rose-500 hover:text-rose-400"
                            title="Delete Business Profile"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Cursor Pagination Control Block */}
        <div className="px-5 py-4 border-t border-slate-800 flex items-center justify-between text-slate-400 text-xs">
          <div>
            Showing Page <strong className="text-white">{currentPage}</strong>
          </div>
          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => { setCurrentPage(c => c - 1); fetchBusinesses('prev'); }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-white font-semibold transition-all flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button 
              disabled={!hasMore}
              onClick={() => { setCurrentPage(c => c + 1); fetchBusinesses('next'); }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-lg text-white font-semibold transition-all flex items-center gap-1"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* --- View Modal --- */}
      {modalType === 'view' && selectedBiz && (
        <div className="fixed inset-0 z-[99] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h4 className="text-lg font-bold text-white">Business Profile Registry</h4>
              <button onClick={() => setModalType(null)} className="text-slate-500 hover:text-white">&times;</button>
            </div>
            <div className="p-6 space-y-4 text-xs overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500 font-bold uppercase block tracking-wider">Business Name</span>
                  <span className="text-sm text-white font-semibold">{selectedBiz.businessName}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase block tracking-wider">Legal Name</span>
                  <span className="text-sm text-white font-semibold">{selectedBiz.legalName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase block tracking-wider">Owner UID</span>
                  <span className="text-white font-mono break-all">{selectedBiz.ownerUid}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase block tracking-wider">Business ID</span>
                  <span className="text-white font-mono">{selectedBiz.id}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase block tracking-wider">Business Type</span>
                  <span className="text-white font-semibold capitalize">{selectedBiz.businessType}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase block tracking-wider">Category</span>
                  <span className="text-white font-semibold capitalize">{selectedBiz.category}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase block tracking-wider">Email</span>
                  <span className="text-white">{selectedBiz.email}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase block tracking-wider">Phone</span>
                  <span className="text-white">{selectedBiz.phone}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase block tracking-wider">Website</span>
                  <a href={selectedBiz.website} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">{selectedBiz.website || 'N/A'}</a>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase block tracking-wider">Created Date</span>
                  <span className="text-white">{selectedBiz.createdAt}</span>
                </div>
              </div>
              <div className="pt-2">
                <span className="text-slate-500 font-bold uppercase block tracking-wider">Description</span>
                <p className="text-slate-300 mt-1 leading-relaxed">{selectedBiz.description || 'No description provided.'}</p>
              </div>
            </div>
            <div className="p-4 bg-slate-950 border-t border-slate-800 text-right">
              <button onClick={() => setModalType(null)} className="px-4 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* --- Edit Modal --- */}
      {modalType === 'edit' && selectedBiz && (
        <div className="fixed inset-0 z-[99] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h4 className="text-lg font-bold text-white">Edit Business Settings</h4>
              <button onClick={() => setModalType(null)} className="text-slate-500 hover:text-white">&times;</button>
            </div>
            <div className="p-6 space-y-4 text-xs overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">Business Name</label>
                  <input 
                    type="text" 
                    value={editFields.businessName} 
                    onChange={e => setEditFields({...editFields, businessName: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" 
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">Legal Name</label>
                  <input 
                    type="text" 
                    value={editFields.legalName} 
                    onChange={e => setEditFields({...editFields, legalName: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" 
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">Email Address</label>
                  <input 
                    type="email" 
                    value={editFields.email} 
                    onChange={e => setEditFields({...editFields, email: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" 
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    value={editFields.phone} 
                    onChange={e => setEditFields({...editFields, phone: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" 
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">Website URL</label>
                  <input 
                    type="text" 
                    value={editFields.website} 
                    onChange={e => setEditFields({...editFields, website: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" 
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">Category</label>
                  <input 
                    type="text" 
                    value={editFields.category} 
                    onChange={e => setEditFields({...editFields, category: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-bold uppercase mb-1">Description</label>
                <textarea 
                  rows={3}
                  value={editFields.description} 
                  onChange={e => setEditFields({...editFields, description: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white" 
                />
              </div>
            </div>
            <div className="p-4 bg-slate-950 border-t border-slate-800 text-right space-x-2">
              <button onClick={() => setModalType(null)} className="px-4 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700">Cancel</button>
              <button onClick={handleEditSave} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* --- Action Reason Prompt Modal --- */}
      {modalType === 'confirm_action' && selectedBiz && (
        <div className="fixed inset-0 z-[99] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800">
              <h4 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500" /> Administrative Action Requirement
              </h4>
              <p className="text-slate-400 text-xs mt-1">Every administrative bypass or modification requires a valid reason for the system audit trail.</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <span className="text-slate-500 font-bold uppercase block tracking-wider text-[10px]">Target Business</span>
                <span className="text-sm text-white font-semibold">{selectedBiz.businessName}</span>
              </div>

              <div>
                <span className="text-slate-500 font-bold uppercase block tracking-wider text-[10px]">Action Request</span>
                <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-400 rounded-md text-xs font-bold font-mono">{actionType}</span>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase mb-1">Reason for {actionType}</label>
                <textarea 
                  rows={3}
                  placeholder="Provide precise explanation (e.g. Terms violations, KYC completion, user request)"
                  value={actionReason} 
                  onChange={e => setActionReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500" 
                />
              </div>
            </div>
            <div className="p-4 bg-slate-950 border-t border-slate-800 text-right space-x-2">
              <button onClick={() => { setModalType(null); setActionReason(''); }} className="px-4 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 text-xs">Cancel</button>
              <button onClick={handleActionExecute} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 text-xs">Confirm Execution</button>
            </div>
          </div>
        </div>
      )}

      {/* --- Switcher Choice Modal --- */}
      {modalType === 'switcher' && selectedBiz && (
        <div className="fixed inset-0 z-[99] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800">
              <h4 className="text-lg font-bold text-white flex items-center gap-2">
                <LogIn className="w-5 h-5 text-emerald-400" /> Business Workspace Switcher
              </h4>
              <p className="text-slate-400 text-xs mt-1">Impersonate and bypass business registry boundaries to manage or review operations.</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Selected Business</span>
                <span className="text-sm font-bold text-white mt-1 block">{selectedBiz.businessName}</span>
                <span className="text-xs text-slate-400 block mt-0.5">Owner: {selectedBiz.ownerUid}</span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={() => executeSwitchMode('read_only')}
                  className="p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-xl text-left transition-all"
                >
                  <div className="font-bold text-white flex items-center gap-2 text-sm">
                    <Eye className="w-4 h-4 text-sky-400" /> 1. Read-Only Mode
                  </div>
                  <p className="text-slate-400 text-[11px] mt-1">View the business dashboard, stores, and catalog perfectly. All modifications, updates, or additions are strictly disabled.</p>
                </button>

                <button 
                  onClick={() => executeSwitchMode('support')}
                  className="p-4 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 hover:border-indigo-500/40 rounded-xl text-left transition-all"
                >
                  <div className="font-bold text-indigo-300 flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-emerald-400" /> 2. Support Mode
                  </div>
                  <p className="text-indigo-200/60 text-[11px] mt-1">Gain temporary management access to create, update, or moderate stores and catalog products. Every administrative click and action will be fully tracked.</p>
                </button>
              </div>
            </div>
            <div className="p-4 bg-slate-950 border-t border-slate-800 text-right">
              <button onClick={() => setModalType(null)} className="px-4 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 text-xs">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* --- Analytics & Audit Logs Modal --- */}
      {modalType === 'analytics' && selectedBiz && (
        <div className="fixed inset-0 z-[99] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-400" /> {selectedBiz.businessName} Analytics & Audit Trail
                </h4>
                <p className="text-slate-400 text-[11px] mt-0.5">Real-time stats and chronological administrative logs.</p>
              </div>
              <button onClick={() => setModalType(null)} className="text-slate-500 hover:text-white">&times;</button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
              {/* Quick metrics grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Registered Stores', val: businessStats[selectedBiz.id]?.stores || 0, icon: Store, color: 'text-sky-400', bg: 'bg-sky-500/10' },
                  { label: 'Catalog Products', val: businessStats[selectedBiz.id]?.products || 0, icon: Box, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                  { label: 'Completed Orders', val: businessStats[selectedBiz.id]?.orders || 0, icon: ShoppingBag, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                  { label: 'Total Revenue', val: `${(businessStats[selectedBiz.id]?.revenue || 0).toFixed(1)} π`, icon: CreditCard, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                ].map((stat, idx) => {
                  const Icon = stat.icon;
                  return (
                    <div key={idx} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg ${stat.bg}`}>
                        <Icon className={`w-4 h-4 ${stat.color}`} />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">{stat.label}</span>
                        <span className="text-base font-black text-white mt-0.5 block">{stat.val}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chronological Audit logs */}
              <div>
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-indigo-400" /> System Action Log ({selectedBizLogs.length} entries)
                </h5>

                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden text-xs">
                  <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-900">
                    {selectedBizLogs.length === 0 ? (
                      <div className="p-8 text-center text-slate-500">
                        No administrative actions recorded for this business.
                      </div>
                    ) : (
                      selectedBizLogs.map(log => (
                        <div key={log.id} className="p-4 hover:bg-slate-900/50 transition-colors space-y-2">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <span className="font-bold text-white text-xs">{log.action}</span>
                              <span className="text-[10px] text-slate-500 block mt-0.5">Executed by: <strong className="text-slate-300">{log.adminName}</strong> ({log.adminId})</span>
                            </div>
                            <span className="text-[9px] font-mono text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
                          </div>
                          <div className="p-2.5 bg-slate-900 rounded-lg text-[11px] font-mono whitespace-pre-wrap text-slate-400 break-all border border-slate-800">
                            {log.oldValue !== 'none' && (
                              <div className="mb-1"><span className="text-slate-500">Before:</span> {log.oldValue}</div>
                            )}
                            <div><span className="text-emerald-400">After/Action:</span> {log.newValue}</div>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 bg-indigo-500/5 border border-indigo-500/10 p-2 rounded-lg">
                            <span className="text-indigo-400 font-bold uppercase text-[9px] tracking-wider">Reason:</span>
                            <span>{log.reason}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-slate-950 border-t border-slate-800 text-right">
              <button onClick={() => setModalType(null)} className="px-4 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 text-xs">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
