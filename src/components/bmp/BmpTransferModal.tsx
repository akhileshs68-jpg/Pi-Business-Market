import React, { useState } from 'react';
import { Send, X, AlertCircle, CheckCircle2, UserCheck, ArrowRight, Wallet } from 'lucide-react';
import { bmpTokenService } from '../../services/bmpTokenService';

interface BmpTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  senderUid: string;
  senderBalance: number;
  initialRecipient?: string;
  initialAmount?: number;
  onSuccess?: () => void;
}

export const BmpTransferModal: React.FC<BmpTransferModalProps> = ({
  isOpen,
  onClose,
  senderUid,
  senderBalance,
  initialRecipient = '',
  initialAmount = 0,
  onSuccess
}) => {
  const [recipient, setRecipient] = useState(initialRecipient);
  const [amount, setAmount] = useState<number | ''>(initialAmount || '');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successTx, setSuccessTx] = useState<{ txId: string; remaining: number } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmt = Number(amount);
    if (!recipient.trim()) {
      setError('Please enter a recipient User ID, Email, or BMP Wallet Address.');
      return;
    }
    if (!numAmt || numAmt <= 0) {
      setError('Transfer amount must be greater than 0 BMP.');
      return;
    }
    if (numAmt > senderBalance) {
      setError(`Insufficient BMP Balance. You have ${senderBalance.toFixed(2)} BMP available.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await bmpTokenService.transferBmp({
        senderId: senderUid,
        recipientIdentifier: recipient.trim(),
        amount: numAmt,
        note: note.trim()
      });

      setSuccessTx({ txId: res.txId, remaining: res.remainingBalance });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Transfer failed:', err);
      setError(err?.message || 'Failed to complete BMP transfer. Check recipient details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-tight">Transfer BMP Tokens</h3>
              <p className="text-[11px] text-slate-400">Instant atomic P2P token transfer</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Screen */}
        {successTx ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Transfer Completed Successfully!</h4>
              <p className="text-xs text-slate-400 mt-1 font-mono">Tx ID: {successTx.txId}</p>
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono">
              Remaining Balance: <strong className="text-amber-400 font-bold">{successTx.remaining.toFixed(2)} BMP</strong>
            </div>
            <button
              onClick={() => { setSuccessTx(null); onClose(); }}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          /* Form Screen */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Recipient */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Recipient (ID, Email, or Wallet)
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="bmp1... or user@example.com or userUid"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            {/* Amount */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Amount (BMP)
                </label>
                <span className="text-[10px] text-slate-400">
                  Available: <strong className="text-amber-400 font-mono">{senderBalance.toFixed(2)} BMP</strong>
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={senderBalance}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-16 py-2.5 text-sm font-mono font-bold text-amber-400 placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
                />
                <button
                  type="button"
                  onClick={() => setAmount(senderBalance)}
                  className="absolute right-2 top-2 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded-lg uppercase"
                >
                  MAX
                </button>
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Memo / Note (Optional)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Thanks for the product!"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                maxLength={80}
              />
            </div>

            {/* Network Fee Warning */}
            <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Network Gas Fee</span>
              <span className="text-emerald-400 font-bold font-mono">0.00 BMP (Free)</span>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors"
              >
                {isSubmitting ? 'Transferring...' : 'Confirm Transfer'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
