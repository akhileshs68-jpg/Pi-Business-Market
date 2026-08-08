/**
 * Pi Business Market - Enterprise Universal Approval Center
 * Centered dashboard, filtration system, pagination, detail drawer, and security-validated actions.
 */

import React, { useState, useEffect } from 'react';
import {
  Shield, CheckCircle, XCircle, AlertTriangle, Clock, RefreshCw, Filter,
  Search, Eye, FileText, User, Users, Calendar, ArrowRight, CornerDownRight,
  ChevronLeft, ChevronRight, Lock, MessageSquare, Paperclip, Send, TrendingDown,
  Activity, Star, ShieldCheck, Bookmark, DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../auth/useAuth';
import { RoleResolver } from '../../services/identity/RoleResolver';
import { approvalService, isValidTransition } from '../../services/approvalService';
import {
  UniversalApproval,
  ApprovalType,
  ApprovalStatus,
  ApprovalPriority,
  ApprovalAuditLog
} from '../../types';

export const UniversalApprovalCenter: React.FC = () => {
  const { user } = useAuth();
  const roleResolver = new RoleResolver(user);

  // Determine user's effective Approval Center Role
  const isPlatformOwner = user?.uid === 'akhileshs68' || roleResolver.isSuperAdmin();
  const isSuperAdminRole = roleResolver.isPlatformAdmin();
  const isReviewerRole = user?.platformRole === 'reviewer' || user?.role === 'Reviewer' || user?.permissions?.includes('review_queue');
  
  let rbacRole: 'Platform Owner' | 'Super Admin' | 'Reviewer' | 'Business Owner' = 'Business Owner';
  if (isPlatformOwner) {
    rbacRole = 'Platform Owner';
  } else if (isSuperAdminRole) {
    rbacRole = 'Super Admin';
  } else if (isReviewerRole) {
    rbacRole = 'Reviewer';
  }

  // Dashboard Stats State
  const [stats, setStats] = useState({
    pending: 0,
    approvedToday: 0,
    rejectedToday: 0,
    needChanges: 0,
    onHold: 0,
    highPriority: 0,
    overdue: 0,
    avgApprovalTimeMin: 15
  });

  // Approvals List States
  const [approvals, setApprovals] = useState<UniversalApproval[]>([]);
  const [auditLogs, setAuditLogs] = useState<ApprovalAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [hasMore, setHasMore] = useState(false);

  // Filters State
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [selectedReviewer, setSelectedReviewer] = useState<string>('All');
  const [selectedBusiness, setSelectedBusiness] = useState<string>('All');
  const [selectedStore, setSelectedStore] = useState<string>('All');
  const [keyword, setKeyword] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('All');

  // Selected Detail Modal
  const [selectedApproval, setSelectedApproval] = useState<UniversalApproval | null>(null);
  const [showActionForm, setShowActionForm] = useState<boolean>(false);
  const [actionType, setActionType] = useState<any>('');
  const [actionReason, setActionReason] = useState<string>('');
  const [actionNotes, setActionNotes] = useState<string>('');
  const [assigneeUid, setAssigneeUid] = useState<string>('');
  const [assigneeName, setAssigneeName] = useState<string>('');
  const [newComment, setNewComment] = useState<string>('');
  const [actionError, setActionError] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string>('');

  // 16 Approval Types definition
  const approvalTypesList: ApprovalType[] = [
    'Business Registration',
    'Store Registration',
    'Product Approval',
    'Service Approval',
    'Banner Campaign Approval',
    'Advertisement Approval',
    'Featured Product Approval',
    'Featured Store Approval',
    'Seller Verification',
    'Merchant Verification',
    'Withdrawal Requests',
    'Refund Requests',
    'BMP Mint Requests',
    'BMP Burn Requests',
    'Dispute Resolution Queue',
    'Report / Appeal Queue'
  ];

  // Load and auto-seed data on init
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        await approvalService.seedSampleApprovals();
        await loadDashboard();
        await loadApprovalsList();
      } catch (err) {
        console.error('Error initializing approvals:', err);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [selectedType, selectedStatus, selectedPriority, selectedReviewer, keyword, currentPage]);

  const loadDashboard = async () => {
    try {
      const dStats = await approvalService.getDashboardMetrics();
      setStats(dStats);
      const logs = await approvalService.getAuditLogs(15);
      setAuditLogs(logs);
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    }
  };

  const loadApprovalsList = async () => {
    setRefreshing(true);
    try {
      // Determine filter parameters
      let reviewerFilter = selectedReviewer;
      let applicantFilter: string | undefined = undefined;

      // Enforce RBAC filtering boundaries on the client/service layer
      if (rbacRole === 'Reviewer') {
        reviewerFilter = user?.uid || 'unknown'; // reviewer only sees assigned
      } else if (rbacRole === 'Business Owner') {
        applicantFilter = user?.uid || 'unknown'; // owner only sees own requests
      }

      const { approvals: items } = await approvalService.getApprovals({
        approvalType: selectedType,
        status: selectedStatus,
        priority: selectedPriority,
        reviewerUid: reviewerFilter,
        keyword: keyword,
        pageSize: pageSize + 1 // fetch 1 extra to check hasMore
      });

      let finalFiltered = items;
      if (applicantFilter) {
        finalFiltered = items.filter(i => i.submittedBy.uid === applicantFilter);
      }

      setHasMore(finalFiltered.length > pageSize);
      setApprovals(finalFiltered.slice(0, pageSize));
    } catch (err) {
      console.error('Error loading approvals list:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');

    if (!selectedApproval) return;
    if (!actionReason.trim()) {
      setActionError('Reason is mandatory for every approval action.');
      return;
    }

    // Role safety restrictions check prior to updating
    if (rbacRole === 'Reviewer' && selectedApproval.assignedReviewer?.uid !== user?.uid) {
      setActionError('Security Violation: Reviewers can only action requests specifically assigned to them.');
      return;
    }
    if (rbacRole === 'Business Owner') {
      setActionError('Security Violation: Business Owners cannot execute approval actions.');
      return;
    }

    try {
      let finalNotes = actionNotes;
      if (actionType === 'Assign Reviewer' || actionType === 'Reassign') {
        if (!assigneeUid || !assigneeName) {
          setActionError('Please specify assignee UID and Display Name.');
          return;
        }
        finalNotes = `${assigneeUid}|${assigneeName}`;
      }

      const adminUser = {
        uid: user?.uid || 'unknown',
        displayName: user?.displayName || 'System Admin',
        email: user?.email || undefined
      };

      const updated = await approvalService.performApprovalAction(
        selectedApproval.id,
        actionType,
        actionReason,
        finalNotes,
        adminUser
      );

      setNewComment('');
      setActionReason('');
      setActionNotes('');
      setShowActionForm(false);
      setSelectedApproval(updated);
      setActionSuccess(`Successfully completed action "${actionType}".`);
      
      // Reload stats and list
      await loadDashboard();
      await loadApprovalsList();
    } catch (err: any) {
      setActionError(err?.message || 'Error occurred during approval action.');
    }
  };

  const postComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApproval || !newComment.trim()) return;

    try {
      const author = {
        uid: user?.uid || 'unknown',
        displayName: user?.displayName || 'System User'
      };
      const updated = await approvalService.addComment(selectedApproval.id, author, newComment);
      setSelectedApproval(updated);
      setNewComment('');
      await loadApprovalsList();
    } catch (err) {
      console.error('Failed to post comment:', err);
    }
  };

  const getPriorityBadgeColor = (p: ApprovalPriority) => {
    switch (p) {
      case 'Critical': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'High': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Medium': return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getStatusBadgeColor = (s: ApprovalStatus) => {
    switch (s) {
      case 'Approved': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Rejected': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'On Hold': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Need Changes': return 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20';
      case 'Under Review': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'Submitted': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div id="universal-approval-center" className="space-y-8">
      {/* Header and RBAC Level Badge */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            Enterprise Universal Approval Center
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Global regulatory and administrative compliance registry.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Access Scope:</span>
            <span className="text-xs font-extrabold text-indigo-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              {rbacRole}
            </span>
          </div>
          <button
            onClick={() => { loadDashboard(); loadApprovalsList(); }}
            disabled={refreshing}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* DASHBOARD METRICS COUNTERS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-indigo-600/10 rounded-xl text-indigo-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Pending Queue</span>
            <span className="text-2xl font-black text-white">{stats.pending}</span>
          </div>
        </div>

        <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-emerald-600/10 rounded-xl text-emerald-400">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Approved Today</span>
            <span className="text-2xl font-black text-white">{stats.approvedToday}</span>
          </div>
        </div>

        <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-rose-600/10 rounded-xl text-rose-400">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Rejected Today</span>
            <span className="text-2xl font-black text-white">{stats.rejectedToday}</span>
          </div>
        </div>

        <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-amber-600/10 rounded-xl text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">High & Critical</span>
            <span className="text-2xl font-black text-white">{stats.highPriority}</span>
          </div>
        </div>

        <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-fuchsia-600/10 rounded-xl text-fuchsia-400">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Need Changes</span>
            <span className="text-2xl font-black text-white">{stats.needChanges}</span>
          </div>
        </div>

        <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-slate-600/10 rounded-xl text-slate-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">On Hold</span>
            <span className="text-2xl font-black text-white">{stats.onHold}</span>
          </div>
        </div>

        <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-red-600/10 rounded-xl text-red-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Overdue ({'>'}48h)</span>
            <span className="text-2xl font-black text-white">{stats.overdue}</span>
          </div>
        </div>

        <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-sky-600/10 rounded-xl text-sky-400">
            <Star className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Avg Approval Time</span>
            <span className="text-2xl font-black text-white">{stats.avgApprovalTimeMin}m</span>
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-slate-900/30 border border-slate-800 p-5 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-400" />
            Registry Filtration Matrix
          </h4>
          <button
            onClick={() => {
              setSelectedType('All');
              setSelectedStatus('All');
              setSelectedPriority('All');
              setSelectedReviewer('All');
              setSelectedBusiness('All');
              setSelectedStore('All');
              setKeyword('');
            }}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
          >
            Clear Filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Filter 1: Approval Type */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Queue / Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-all"
            >
              <option value="All">All queues (16 queues)</option>
              {approvalTypesList.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Filter 2: Status */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Approval Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-all"
            >
              <option value="All">All statuses</option>
              <option value="Draft">Draft</option>
              <option value="Submitted">Submitted</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Under Review">Under Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Need Changes">Need Changes</option>
              <option value="On Hold">On Hold</option>
              <option value="Expired">Expired</option>
            </select>
          </div>

          {/* Filter 3: Priority */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Priority</label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-all"
            >
              <option value="All">All priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          {/* Filter 4: Reviewer Assignment */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Reviewer</label>
            <select
              value={selectedReviewer}
              onChange={(e) => setSelectedReviewer(e.target.value)}
              disabled={rbacRole === 'Reviewer'}
              className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-all disabled:opacity-50"
            >
              {rbacRole === 'Reviewer' ? (
                <option value={user?.uid}>Self (Assigned Queue Only)</option>
              ) : (
                <>
                  <option value="All">All Reviewers</option>
                  <option value="reviewer_bob">Reviewer Bob</option>
                  <option value="compliance_officer">Compliance Officer</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* Global text filter matching Universal Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Type ID, title, business, store, or applicant name to query..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-white pl-10 pr-4 py-2 text-xs rounded-xl focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* APPROVALS REGISTRY TABLE */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <p className="text-slate-500 text-xs">Loading governance records...</p>
          </div>
        ) : approvals.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
            <FileText className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="font-bold text-slate-400">No approval requests match current filters.</p>
            <p>Ensure permissions match or adjust active filter scopes.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-400 border-collapse">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold">
                <tr>
                  <th className="p-4">Entity ID & Name</th>
                  <th className="p-4">Queue / Type</th>
                  <th className="p-4">Submitted By</th>
                  <th className="p-4">Business / Store</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Risk Score</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {approvals.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-900/30 transition-all">
                    <td className="p-4">
                      <div className="font-bold text-white max-w-[180px] truncate">{app.entityName}</div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{app.id}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-300">{app.approvalType}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Updated: {new Date(app.updatedAt).toLocaleDateString()}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-300">{app.submittedBy.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 max-w-[120px] truncate">{app.submittedBy.email || 'N/A'}</div>
                    </td>
                    <td className="p-4">
                      {app.business ? (
                        <>
                          <div className="font-medium text-slate-300 max-w-[120px] truncate">{app.business.name}</div>
                          {app.store && <div className="text-[10px] text-slate-500 truncate mt-0.5">Store: {app.store.name}</div>}
                        </>
                      ) : (
                        <span className="text-slate-600">Platform-wide</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 border rounded-lg text-[10px] font-bold ${getPriorityBadgeColor(app.priority)}`}>
                        {app.priority}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className={app.riskScore > 60 ? 'text-rose-400' : app.riskScore > 30 ? 'text-amber-400' : 'text-emerald-400'}>
                          {app.riskScore}%
                        </span>
                        <div className="w-12 bg-slate-800 rounded-full h-1.5 overflow-hidden hidden md:block">
                          <div
                            className={`h-full ${app.riskScore > 60 ? 'bg-rose-500' : app.riskScore > 30 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${app.riskScore}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 border rounded-lg text-[10px] font-bold ${getStatusBadgeColor(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedApproval(app);
                          setShowActionForm(false);
                          setActionError('');
                          setActionSuccess('');
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-400" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION MATRIX */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Showing page <span className="font-bold text-slate-400">{currentPage}</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (currentPage > 1) {
                  setCurrentPage(currentPage - 1);
                }
              }}
              disabled={currentPage === 1}
              className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white disabled:opacity-50 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (hasMore) {
                  setCurrentPage(currentPage + 1);
                }
              }}
              disabled={!hasMore}
              className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white disabled:opacity-50 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* DETAIL MODAL DRAWER */}
      <AnimatePresence>
        {selectedApproval && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={() => setSelectedApproval(null)} />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="relative w-full max-w-2xl bg-slate-950 border-l border-slate-800 h-full overflow-y-auto flex flex-col pt-4 pb-12 px-6 shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                <div>
                  <span className="text-[10px] bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-lg font-bold">
                    {selectedApproval.approvalType}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1.5 flex items-center gap-2">
                    {selectedApproval.entityName}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">ID: {selectedApproval.id}</p>
                </div>
                <button
                  onClick={() => setSelectedApproval(null)}
                  className="p-1.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Action Response Messages */}
              {actionSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs mb-4">
                  {actionSuccess}
                </div>
              )}
              {actionError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs mb-4">
                  {actionError}
                </div>
              )}

              {/* Main Info Blocks */}
              <div className="space-y-6 flex-1">
                {/* Meta Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Submitted By</span>
                    <span className="text-xs font-bold text-white">{selectedApproval.submittedBy.name}</span>
                    <span className="text-[10px] text-slate-500 block">{selectedApproval.submittedBy.uid}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Business</span>
                    <span className="text-xs font-bold text-white">{selectedApproval.business?.name || 'Platform-wide'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Store</span>
                    <span className="text-xs font-bold text-white">{selectedApproval.store?.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Created Date</span>
                    <span className="text-xs font-bold text-white">{new Date(selectedApproval.createdAt).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Risk Score</span>
                    <span className={`text-xs font-bold ${selectedApproval.riskScore > 60 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {selectedApproval.riskScore}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Verification Status</span>
                    <span className="text-xs font-bold text-white">{selectedApproval.verificationStatus || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Payment Status</span>
                    <span className="text-xs font-bold text-white">{selectedApproval.paymentStatus || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Assigned Reviewer</span>
                    <span className="text-xs font-bold text-white">{selectedApproval.assignedReviewer?.name || 'None'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Category</span>
                    <span className="text-xs font-bold text-white">{selectedApproval.category || 'N/A'}</span>
                  </div>
                </div>

                {/* Entity Preview JSON / Key-Value representation */}
                {selectedApproval.entityPreview && (
                  <div>
                    <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-indigo-400" />
                      Entity Parameter Payload
                    </h4>
                    <pre className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-[10px] text-emerald-400 overflow-x-auto">
                      {JSON.stringify(selectedApproval.entityPreview, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Attachments */}
                {selectedApproval.attachments && selectedApproval.attachments.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                      <Paperclip className="w-4 h-4 text-indigo-400" />
                      Submitted Documentation / Artifacts
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {selectedApproval.attachments.map((file, idx) => (
                        <a
                          key={idx}
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-[11px] font-bold text-slate-300 transition-all"
                        >
                          <span className="truncate max-w-[150px]">{file.name}</span>
                          <span className="text-[9px] text-slate-500 uppercase">{file.type.split('/')[1] || 'pdf'}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Active Action Panel (RBAC Guarded) */}
                {rbacRole !== 'Business Owner' && (
                  <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-indigo-400" />
                        Governance Control Panel
                      </h4>
                      {showActionForm && (
                        <button
                          onClick={() => { setShowActionForm(false); setActionType(''); }}
                          className="text-xs text-slate-400 hover:text-white"
                        >
                          Cancel Action
                        </button>
                      )}
                    </div>

                    {!showActionForm ? (
                      <div className="flex flex-wrap gap-2">
                        {/* Approve */}
                        <button
                          onClick={() => { setShowActionForm(true); setActionType('Approve'); }}
                          disabled={!isValidTransition(selectedApproval.status, 'Approved')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white rounded-lg text-xs font-bold transition-all"
                        >
                          Approve
                        </button>

                        {/* Reject */}
                        <button
                          onClick={() => { setShowActionForm(true); setActionType('Reject'); }}
                          disabled={!isValidTransition(selectedApproval.status, 'Rejected')}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-30 text-white rounded-lg text-xs font-bold transition-all"
                        >
                          Reject
                        </button>

                        {/* Need Changes */}
                        <button
                          onClick={() => { setShowActionForm(true); setActionType('Need Changes'); }}
                          disabled={!isValidTransition(selectedApproval.status, 'Need Changes')}
                          className="px-3 py-1.5 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-30 text-white rounded-lg text-xs font-bold transition-all"
                        >
                          Need Changes
                        </button>

                        {/* On Hold */}
                        <button
                          onClick={() => { setShowActionForm(true); setActionType('Hold'); }}
                          disabled={!isValidTransition(selectedApproval.status, 'On Hold')}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-30 text-white rounded-lg text-xs font-bold transition-all"
                        >
                          On Hold
                        </button>

                        {/* Resume */}
                        <button
                          onClick={() => { setShowActionForm(true); setActionType('Resume'); }}
                          disabled={!isValidTransition(selectedApproval.status, 'Under Review')}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white rounded-lg text-xs font-bold transition-all"
                        >
                          Resume
                        </button>

                        {/* Escalate */}
                        <button
                          onClick={() => { setShowActionForm(true); setActionType('Escalate'); }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-all"
                        >
                          Escalate
                        </button>

                        {/* Assign Reviewer */}
                        <button
                          onClick={() => { setShowActionForm(true); setActionType('Assign Reviewer'); }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-all"
                        >
                          Assign Reviewer
                        </button>

                        {/* Archive */}
                        <button
                          onClick={() => { setShowActionForm(true); setActionType('Archive'); }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-xs font-bold transition-all"
                        >
                          Archive
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleAction} className="space-y-4 pt-2">
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white flex items-center gap-2">
                          <CornerDownRight className="w-4 h-4 text-indigo-400" />
                          Executing Action: <span className="text-indigo-400 font-extrabold uppercase">{actionType}</span>
                        </div>

                        {/* Reviewer Assignment Extra fields */}
                        {(actionType === 'Assign Reviewer' || actionType === 'Reassign') && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Assignee UID</label>
                              <input
                                type="text"
                                placeholder="e.g. reviewer_bob"
                                value={assigneeUid}
                                onChange={(e) => setAssigneeUid(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Assignee Display Name</label>
                              <input
                                type="text"
                                placeholder="e.g. Reviewer Bob"
                                value={assigneeName}
                                onChange={(e) => setAssigneeName(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                              />
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                            Action Reason (Mandatory)*
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Please provide the detailed regulatory or business reason for this action..."
                            value={actionReason}
                            onChange={(e) => setActionReason(e.target.value)}
                            required
                            className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                            Internal Private Notes (Optional)
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Additional private notes for admin audit trail..."
                            value={actionNotes}
                            onChange={(e) => setActionNotes(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all"
                          >
                            Submit Action
                          </button>
                          <button
                            type="button"
                            onClick={() => { setShowActionForm(false); setActionType(''); }}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {/* History Timeline */}
                <div>
                  <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    Audit Trail & Timeline
                  </h4>
                  <div className="space-y-4 border-l border-slate-800 pl-4 ml-2">
                    {selectedApproval.historyTimeline?.map((evt, idx) => (
                      <div key={idx} className="relative">
                        <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-indigo-600/20 border-2 border-indigo-500 flex items-center justify-center">
                          <div className="w-1 h-1 bg-white rounded-full" />
                        </div>
                        <div className="text-[11px] font-bold text-white flex items-center gap-2">
                          <span>Action: {evt.action}</span>
                          <span className="text-[9px] text-slate-500 font-normal">{new Date(evt.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Reason: {evt.reason}
                        </div>
                        {evt.notes && (
                          <div className="text-[10px] text-slate-500 italic mt-0.5">
                            Notes: {evt.notes}
                          </div>
                        )}
                        <div className="text-[9px] text-indigo-400 mt-1">
                          By: {evt.adminName} ({evt.adminUid})
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comments Stream */}
                <div>
                  <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-indigo-400" />
                    Discussion & Comments
                  </h4>
                  <div className="space-y-3 bg-slate-900/30 border border-slate-800 rounded-2xl p-4">
                    {/* Comments list */}
                    <div className="space-y-3 max-h-[150px] overflow-y-auto pr-2">
                      {selectedApproval.comments && selectedApproval.comments.length > 0 ? (
                        selectedApproval.comments.map((c, idx) => (
                          <div key={idx} className="p-2.5 bg-slate-950 border border-slate-900 rounded-xl space-y-1">
                            <div className="flex justify-between items-center text-[9px]">
                              <span className="font-extrabold text-indigo-400">{c.authorName}</span>
                              <span className="text-slate-500">{new Date(c.timestamp).toLocaleString()}</span>
                            </div>
                            <p className="text-[10px] text-slate-300">{c.content}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-slate-500 text-center py-4">No comments posted yet.</p>
                      )}
                    </div>

                    {/* New Comment Input */}
                    <form onSubmit={postComment} className="flex gap-2 pt-2 border-t border-slate-800">
                      <input
                        type="text"
                        placeholder="Type a compliance or peer review comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
