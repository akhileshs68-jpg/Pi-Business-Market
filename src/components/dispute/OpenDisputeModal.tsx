import React, { useState } from 'react';
import { 
  AlertCircle, 
  Upload, 
  X, 
  CheckCircle2, 
  FileText, 
  ShieldAlert, 
  DollarSign, 
  Image as ImageIcon 
} from 'lucide-react';
import { disputeService } from '../../services/disputeService';

interface OpenDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id?: string;
    orderId?: string;
    orderNumber?: string;
    buyerId?: string;
    userUid?: string;
    sellerId?: string;
    businessId?: string;
    grandTotal?: number;
    items?: any[];
  };
  currentUserUid: string;
  onDisputeCreated?: (disputeId: string) => void;
}

const CATEGORIES = [
  'Item Not Received',
  'Item Significantly Not as Described',
  'Damaged or Defective Goods',
  'Wrong Item Sent',
  'Incomplete Order / Missing Items',
  'Billing or Refund Discrepancy',
  'Service Quality Issue'
];

export const OpenDisputeModal: React.FC<OpenDisputeModalProps> = ({
  isOpen,
  onClose,
  order,
  currentUserUid,
  onDisputeCreated
}) => {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [requestedRefund, setRequestedRefund] = useState<number>(order.grandTotal || 0);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddAttachment = () => {
    if (!attachmentUrl.trim()) return;
    if (attachments.length >= 5) {
      setError('Maximum 5 image evidence attachments allowed.');
      return;
    }
    setAttachments(prev => [...prev, attachmentUrl.trim()]);
    setAttachmentUrl('');
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a brief summary of the issue.');
      return;
    }
    if (!description.trim() || description.trim().length < 15) {
      setError('Please provide a detailed explanation of the issue (at least 15 characters).');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const buyerUid = currentUserUid || order.buyerId || order.userUid || 'buyer';
      const sellerUid = order.sellerId || order.businessId || 'seller';

      const disputeId = await disputeService.createDispute({
        orderId: order.orderId || order.id || '',
        orderNumber: order.orderNumber || order.orderId || order.id,
        buyerUid,
        sellerUid,
        businessId: order.businessId,
        category,
        reason: reason.trim(),
        description: description.trim(),
        requestedRefundAmount: Number(requestedRefund) || order.grandTotal || 0,
        attachments
      });

      if (onDisputeCreated) onDisputeCreated(disputeId);
      onClose();
    } catch (err: any) {
      console.error('Failed to open dispute:', err);
      setError(err?.message || 'Failed to file dispute case. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Open Dispute Case
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  #{order.orderNumber || (order.orderId || order.id || '').slice(-6)}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Submit claim for formal community arbitration and escrow freeze
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dispute modal"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div 
              role="alert"
              className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Category Dropdown */}
          <div>
            <label htmlFor="dispute-category" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Dispute Category <span className="text-rose-400">*</span>
            </label>
            <select
              id="dispute-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none focus:border-rose-500/50"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Issue Summary */}
          <div>
            <label htmlFor="dispute-summary" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Issue Summary / Headline <span className="text-rose-400">*</span>
            </label>
            <input
              id="dispute-summary"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Item received is damaged / missing parts"
              className="w-full min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none focus:border-rose-500/50"
              maxLength={120}
            />
          </div>

          {/* Detailed Explanation */}
          <div>
            <label htmlFor="dispute-description" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Detailed Explanation <span className="text-rose-400">*</span>
            </label>
            <textarea
              id="dispute-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe what went wrong, tracking details, or unfulfilled promises..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-white placeholder-slate-500 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none focus:border-rose-500/50 resize-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Minimum 15 characters. This will be reviewed by the merchant and platform moderators.
            </p>
          </div>

          {/* Requested Refund Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="dispute-refund" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Requested Refund (Pi)
              </label>
              <div className="relative">
                <input
                  id="dispute-refund"
                  type="number"
                  step="0.01"
                  min="0"
                  max={order.grandTotal || 99999}
                  value={requestedRefund}
                  onChange={(e) => setRequestedRefund(parseFloat(e.target.value) || 0)}
                  className="w-full min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-amber-400 font-mono font-bold focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none focus:border-rose-500/50"
                />
                <DollarSign className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Order Total
              </span>
              <div className="w-full min-h-[44px] bg-slate-950/50 border border-slate-800/80 rounded-xl px-4 py-2.5 text-sm text-slate-400 font-mono flex items-center">
                {order.grandTotal?.toFixed(2) || '0.00'} Pi
              </div>
            </div>
          </div>

          {/* Image & Document Attachment Upload */}
          <div>
            <label htmlFor="dispute-attachment" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Evidence Attachments (Image URL)
            </label>
            <div className="flex gap-2">
              <input
                id="dispute-attachment"
                type="url"
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
                placeholder="https://example.com/evidence-photo.jpg"
                className="flex-1 min-h-[44px] bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none focus:border-rose-500/50"
              />
              <button
                type="button"
                onClick={handleAddAttachment}
                className="min-h-[44px] px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none"
              >
                <Upload className="w-3.5 h-3.5" />
                Add
              </button>
            </div>

            {/* Attachments Preview */}
            {attachments.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {attachments.map((url, idx) => (
                  <div key={idx} className="relative group bg-slate-950 border border-slate-800 rounded-lg p-1.5 flex items-center gap-2 max-w-xs">
                    <ImageIcon className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="text-[11px] text-slate-300 truncate max-w-[140px]">{url}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(idx)}
                      aria-label={`Remove attachment ${idx + 1}`}
                      className="min-h-[28px] min-w-[28px] flex items-center justify-center text-slate-500 hover:text-rose-400 p-0.5 rounded focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-[44px] px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[44px] px-6 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/20 flex items-center gap-2 transition-all focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Submitting Claim...
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  Submit Official Dispute
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
