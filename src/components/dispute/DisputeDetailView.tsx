import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, 
  MessageSquare, 
  Clock, 
  Send, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  FileText, 
  Paperclip, 
  User, 
  Store, 
  ShieldCheck, 
  AlertTriangle,
  ChevronRight,
  X,
  ExternalLink
} from 'lucide-react';
import { 
  disputeService, 
  DisputeRecord, 
  DisputeMessage, 
  DisputeEvent, 
  DisputeStatus 
} from '../../services/disputeService';

interface DisputeDetailViewProps {
  disputeId: string;
  currentUserUid: string;
  currentUserRole?: 'BUYER' | 'SELLER' | 'ADMIN';
  onClose?: () => void;
}

const STATUS_FLOW: { key: DisputeStatus; label: string; description: string }[] = [
  { key: 'OPEN', label: 'Case Opened', description: 'Buyer filed formal dispute claim' },
  { key: 'UNDER_REVIEW', label: 'Under Review', description: 'Arbitration team inspecting evidence' },
  { key: 'BUYER_RESPONDED', label: 'Buyer Responded', description: 'Buyer provided additional response' },
  { key: 'SELLER_RESPONDED', label: 'Seller Responded', description: 'Seller submitted counter statement' },
  { key: 'RESOLVED', label: 'Resolved', description: 'Settlement reached between parties' },
  { key: 'REFUNDED', label: 'Refunded', description: 'Escrow funds returned to buyer' },
  { key: 'REJECTED', label: 'Rejected', description: 'Dispute dismissed by moderators' }
];

export const DisputeDetailView: React.FC<DisputeDetailViewProps> = ({
  disputeId,
  currentUserUid,
  currentUserRole = 'BUYER',
  onClose
}) => {
  const [dispute, setDispute] = useState<DisputeRecord | null>(null);
  const [messages, setMessages] = useState<DisputeMessage[]>([]);
  const [events, setEvents] = useState<DisputeEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'timeline' | 'evidence'>('chat');
  
  const [msgText, setMsgText] = useState('');
  const [attachmentInput, setAttachmentInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const [adminNotes, setAdminNotes] = useState('');
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Subscribe to Dispute, Messages & Events
  useEffect(() => {
    const unsubDispute = disputeService.subscribeDispute(disputeId, (data) => {
      setDispute(data);
      if (data?.requestedRefundAmount) {
        setRefundAmount(data.requestedRefundAmount);
      }
    });

    const unsubMsgs = disputeService.subscribeDisputeMessages(disputeId, (msgs) => {
      setMessages(msgs);
    });

    const unsubEvents = disputeService.subscribeDisputeEvents(disputeId, (evs) => {
      setEvents(evs);
    });

    return () => {
      unsubDispute();
      unsubMsgs();
      unsubEvents();
    };
  }, [disputeId]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  if (!dispute) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-mono uppercase tracking-widest">Loading Dispute Case...</p>
      </div>
    );
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgText.trim()) return;

    setIsSending(true);
    try {
      let role: 'BUYER' | 'SELLER' | 'ADMIN' = currentUserRole;
      if (currentUserUid === dispute.buyerUid) role = 'BUYER';
      else if (currentUserUid === dispute.sellerUid) role = 'SELLER';

      const attachments = attachmentInput.trim() ? [attachmentInput.trim()] : [];

      await disputeService.sendMessage({
        disputeId,
        senderUid: currentUserUid,
        senderName: role === 'ADMIN' ? 'Platform Moderator' : (role === 'SELLER' ? (dispute.sellerName || 'Seller') : (dispute.buyerName || 'Buyer')),
        senderRole: role,
        text: msgText.trim(),
        attachments
      });

      setMsgText('');
      setAttachmentInput('');
    } catch (err: any) {
      console.error('Failed to send dispute message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdateStatus = async (newStatus: DisputeStatus) => {
    setIsUpdatingStatus(true);
    setActionError(null);

    try {
      let role: 'BUYER' | 'SELLER' | 'ADMIN' = currentUserRole;
      if (currentUserUid === dispute.buyerUid) role = 'BUYER';
      else if (currentUserUid === dispute.sellerUid) role = 'SELLER';

      await disputeService.updateStatus({
        disputeId,
        newStatus,
        actorUid: currentUserUid,
        actorRole: role,
        notes: adminNotes.trim() || `Dispute marked as ${newStatus}`,
        grantedRefundAmount: newStatus === 'REFUNDED' ? Number(refundAmount) : undefined
      });

      setAdminNotes('');
    } catch (err: any) {
      console.error('Failed to update status:', err);
      setActionError(err?.message || 'Failed to update dispute status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status: DisputeStatus) => {
    switch (status) {
      case 'OPEN':
        return <span className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-lg uppercase">Open</span>;
      case 'UNDER_REVIEW':
        return <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold rounded-lg uppercase">Under Review</span>;
      case 'BUYER_RESPONDED':
        return <span className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold rounded-lg uppercase">Buyer Responded</span>;
      case 'SELLER_RESPONDED':
        return <span className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold rounded-lg uppercase">Seller Responded</span>;
      case 'RESOLVED':
        return <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg uppercase">Resolved</span>;
      case 'REFUNDED':
        return <span className="px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold rounded-lg uppercase">Refunded</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 bg-slate-500/10 border border-slate-500/20 text-slate-400 text-xs font-bold rounded-lg uppercase">Rejected</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-800 text-slate-400 text-xs font-bold rounded-lg">{status}</span>;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-w-5xl mx-auto my-4">
      
      {/* Top Banner */}
      <div className="px-6 py-4 bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Dispute #{dispute.id.slice(-6).toUpperCase()}</h2>
              {getStatusBadge(dispute.status)}
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Order #{dispute.orderNumber || dispute.orderId.slice(-6)} • Filed on {new Date(dispute.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {onClose && (
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
        
        {/* Left Column: Dispute Claim Details & Actions */}
        <div className="p-6 space-y-6 lg:col-span-1 bg-slate-950/40">
          
          {/* Claim Summary */}
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">Claim Details</span>
            <h3 className="text-sm font-bold text-white mt-1">{dispute.reason}</h3>
            <p className="text-xs text-slate-400 mt-2 bg-slate-900/80 p-3 rounded-xl border border-slate-800 leading-relaxed">
              "{dispute.description}"
            </p>
          </div>

          {/* Refund Stats */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Requested Refund</span>
              <span className="text-sm font-mono font-bold text-amber-400">{dispute.requestedRefundAmount?.toFixed(2) || '0.00'} Pi</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Granted Refund</span>
              <span className="text-sm font-mono font-bold text-emerald-400">{dispute.grantedRefundAmount?.toFixed(2) || '0.00'} Pi</span>
            </div>
          </div>

          {/* Party Cards */}
          <div className="space-y-2">
            <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-blue-400" /> Buyer</span>
              <span className="font-mono font-bold text-white">{dispute.buyerName || dispute.buyerUid.slice(0, 8)}</span>
            </div>
            <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5"><Store className="w-3.5 h-3.5 text-purple-400" /> Merchant</span>
              <span className="font-mono font-bold text-white">{dispute.sellerName || dispute.sellerUid.slice(0, 8)}</span>
            </div>
          </div>

          {/* Evidence Attachments */}
          {dispute.attachments && dispute.attachments.length > 0 && (
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Evidence Files</span>
              <div className="space-y-1.5">
                {dispute.attachments.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs text-rose-300 flex items-center justify-between group transition-colors"
                  >
                    <span className="truncate max-w-[180px]">{url}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Resolution Controls (For Admin or Seller) */}
          {(currentUserRole === 'ADMIN' || currentUserUid === dispute.sellerUid) && (
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">Arbitration Panel</span>
              
              {actionError && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg">
                  {actionError}
                </div>
              )}

              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Official resolution statement or verdict notes..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 resize-none"
              />

              <div className="space-y-2">
                {dispute.status !== 'UNDER_REVIEW' && (
                  <button
                    onClick={() => handleUpdateStatus('UNDER_REVIEW')}
                    disabled={isUpdatingStatus}
                    className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5" /> Mark Under Review
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleUpdateStatus('REFUNDED')}
                    disabled={isUpdatingStatus}
                    className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Issue Refund
                  </button>

                  <button
                    onClick={() => handleUpdateStatus('REJECTED')}
                    disabled={isUpdatingStatus}
                    className="py-2 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-400 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject Claim
                  </button>
                </div>

                <button
                  onClick={() => handleUpdateStatus('RESOLVED')}
                  disabled={isUpdatingStatus}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Resolve Settlement
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Interactive Tabs (Chat vs Timeline) */}
        <div className="lg:col-span-2 flex flex-col h-[560px]">
          
          {/* Tab Bar */}
          <div className="px-6 py-3 bg-slate-900 border-b border-slate-800 flex items-center gap-4 text-xs font-bold">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 pb-1 border-b-2 transition-colors ${
                activeTab === 'chat' ? 'border-rose-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-4 h-4" /> Dispute Chat ({messages.length})
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center gap-2 pb-1 border-b-2 transition-colors ${
                activeTab === 'timeline' ? 'border-rose-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-4 h-4" /> Audit Timeline ({events.length})
            </button>
          </div>

          {/* CHAT TAB */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col justify-between p-4 overflow-hidden">
              
              {/* Message History */}
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-2">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    No messages in dispute channel yet. Send a message to communicate with the counterparty.
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderUid === currentUserUid;
                    const isAdminMsg = m.senderRole === 'ADMIN';

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 font-mono">
                          <span className="font-bold text-slate-300">{m.senderName}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                            m.senderRole === 'ADMIN' ? 'bg-amber-500/20 text-amber-300' : (
                              m.senderRole === 'SELLER' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
                            )
                          }`}>
                            {m.senderRole}
                          </span>
                          <span>• {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        <div className={`p-3.5 rounded-2xl max-w-md text-xs leading-relaxed ${
                          isAdminMsg ? 'bg-amber-500/10 border border-amber-500/30 text-amber-200' : (
                            isMe ? 'bg-rose-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 border border-slate-700/60 rounded-bl-none'
                          )
                        }`}>
                          {m.text}

                          {m.attachments && m.attachments.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
                              {m.attachments.map((att, idx) => (
                                <a
                                  key={idx}
                                  href={att}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] underline block truncate opacity-90 hover:opacity-100"
                                >
                                  📎 Attachment #{idx + 1}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-800 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={msgText}
                    onChange={(e) => setMsgText(e.target.value)}
                    placeholder="Type dispute response message..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !msgText.trim()}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send
                  </button>
                </div>

                <input
                  type="url"
                  value={attachmentInput}
                  onChange={(e) => setAttachmentInput(e.target.value)}
                  placeholder="Optional Image URL evidence attachment..."
                  className="w-full bg-slate-950 border border-slate-800/80 rounded-lg px-3 py-1.5 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none"
                />
              </form>

            </div>
          )}

          {/* TIMELINE TAB */}
          {activeTab === 'timeline' && (
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {events.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">No timeline events logged.</div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                  {events.map((ev) => (
                    <div key={ev.id} className="relative group">
                      <div className="absolute -left-6 top-0.5 w-3 h-3 rounded-full bg-rose-500 ring-4 ring-slate-900" />
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span className="font-bold text-white uppercase">{ev.type}</span>
                        <span>{new Date(ev.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        {ev.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
