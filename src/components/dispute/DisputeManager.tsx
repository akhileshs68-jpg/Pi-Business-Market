import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  MessageSquare, 
  ChevronRight, 
  RefreshCw 
} from 'lucide-react';
import { disputeService, DisputeRecord, DisputeStatus } from '../../services/disputeService';
import { DisputeDetailView } from './DisputeDetailView';

interface DisputeManagerProps {
  currentUserUid: string;
  currentUserRole?: 'BUYER' | 'SELLER' | 'ADMIN';
}

export const DisputeManager: React.FC<DisputeManagerProps> = ({
  currentUserUid,
  currentUserRole = 'ADMIN'
}) => {
  const [disputes, setDisputes] = useState<DisputeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const records = await disputeService.getDisputes({
        userId: currentUserRole === 'ADMIN' ? undefined : currentUserUid,
        role: currentUserRole
      });
      setDisputes(records);
    } catch (e) {
      console.warn('Failed to load disputes:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, [currentUserUid, currentUserRole]);

  const filteredDisputes = disputes.filter(d => {
    if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        d.id.toLowerCase().includes(q) ||
        d.orderId.toLowerCase().includes(q) ||
        d.reason.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status: DisputeStatus) => {
    switch (status) {
      case 'OPEN':
        return <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold rounded-md uppercase">Open</span>;
      case 'UNDER_REVIEW':
        return <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold rounded-md uppercase">Under Review</span>;
      case 'BUYER_RESPONDED':
        return <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold rounded-md uppercase">Buyer Responded</span>;
      case 'SELLER_RESPONDED':
        return <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold rounded-md uppercase">Seller Responded</span>;
      case 'RESOLVED':
        return <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-md uppercase">Resolved</span>;
      case 'REFUNDED':
        return <span className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold rounded-md uppercase">Refunded</span>;
      case 'REJECTED':
        return <span className="px-2 py-0.5 bg-slate-500/10 border border-slate-500/20 text-slate-400 text-[10px] font-bold rounded-md uppercase">Rejected</span>;
      default:
        return <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] font-bold rounded-md">{status}</span>;
    }
  };

  if (selectedDisputeId) {
    return (
      <DisputeDetailView
        disputeId={selectedDisputeId}
        currentUserUid={currentUserUid}
        currentUserRole={currentUserRole}
        onClose={() => setSelectedDisputeId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white uppercase tracking-tight">Dispute Resolution Portal</h2>
            <p className="text-xs text-slate-400">
              Manage marketplace disputes, evidence, and community arbitration
            </p>
          </div>
        </div>

        <button
          onClick={fetchDisputes}
          className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative col-span-2">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Dispute ID, Order ID, Reason..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="BUYER_RESPONDED">Buyer Responded</option>
            <option value="SELLER_RESPONDED">Seller Responded</option>
            <option value="RESOLVED">Resolved</option>
            <option value="REFUNDED">Refunded</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Disputes Table / Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading dispute records...
          </div>
        ) : filteredDisputes.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No dispute cases matching criteria.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredDisputes.map((d) => (
              <div
                key={d.id}
                onClick={() => setSelectedDisputeId(d.id)}
                className="p-4 hover:bg-slate-800/50 transition-colors cursor-pointer flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 shrink-0">
                    <MessageSquare className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">{d.reason}</span>
                      {getStatusBadge(d.status)}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-1 font-mono">
                      <span>Case #{d.id.slice(-6).toUpperCase()}</span>
                      <span>Order #{d.orderNumber || d.orderId.slice(-6)}</span>
                      <span>{new Date(d.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <span className="text-xs font-mono font-bold text-amber-400 block">{d.requestedRefundAmount?.toFixed(2) || '0.00'} Pi</span>
                    <span className="text-[10px] text-slate-500 uppercase">{d.category}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
