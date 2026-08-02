/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Share2, 
  ShieldCheck, 
  Copy, 
  Send, 
  QrCode, 
  Building2, 
  Store, 
  Award, 
  CreditCard,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProfessionalReceipt } from '../../types/billing';

interface Props {
  receipt: ProfessionalReceipt;
  onClose: () => void;
  onVerifyQr?: (code: string) => void;
}

export const ProfessionalReceiptModal: React.FC<Props> = ({ receipt, onClose, onVerifyQr }) => {
  const [copied, setCopied] = useState(false);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/receipt/${receipt.orderId}?verify=${receipt.receiptQrCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`Payment Receipt ${receipt.receiptNumber} for Order #${receipt.orderNumber} - Paid ${receipt.amountPaid} Pi via ${receipt.paymentMethod}.\nVerify: ${window.location.origin}/verify-qr/${receipt.receiptQrCode}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    setShareSuccess('Shared via WhatsApp!');
    setTimeout(() => setShareSuccess(null), 3000);
  };

  const handleShareTelegram = () => {
    const url = encodeURIComponent(`${window.location.origin}/receipt/${receipt.orderId}`);
    const text = encodeURIComponent(`Receipt ${receipt.receiptNumber} (${receipt.amountPaid} Pi)`);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
    setShareSuccess('Shared via Telegram!');
    setTimeout(() => setShareSuccess(null), 3000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white text-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-xl my-8 overflow-hidden border border-slate-200 relative print:shadow-none print:border-none print:m-0 print:p-0 print:w-full print:max-w-none print:rounded-none"
        >
          {/* Header Action Bar - Non Printable */}
          <div className="bg-slate-900 px-6 py-4 flex items-center justify-between gap-4 border-b border-slate-800 text-white print:hidden">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-white">Payment Receipt</span>
                <p className="text-[10px] text-slate-400">{receipt.receiptNumber}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={handlePrint}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>

              <button 
                onClick={handleCopyLink}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all"
                title="Copy Link"
              >
                <Copy className="w-4 h-4" />
              </button>

              <button 
                onClick={handleShareWhatsApp}
                className="p-2 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-xl transition-all"
                title="Share via WhatsApp"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <button 
                onClick={handleShareTelegram}
                className="p-2 bg-sky-600/20 text-sky-400 hover:bg-sky-600 hover:text-white rounded-xl transition-all"
                title="Share via Telegram"
              >
                <Send className="w-4 h-4" />
              </button>

              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {shareSuccess && (
            <div className="bg-emerald-500 text-white px-4 py-2 text-center text-xs font-bold uppercase tracking-widest print:hidden">
              {shareSuccess}
            </div>
          )}

          {/* Receipt Body */}
          <div className="p-8 space-y-6 bg-white print:p-6" id="printable-receipt">
            <div className="text-center space-y-2 border-b border-dashed border-slate-300 pb-6">
              <div className="w-12 h-12 rounded-2xl bg-slate-950 text-white mx-auto flex items-center justify-center font-black text-2xl mb-2">
                π
              </div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">PI BUSINESS MARKET</h2>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Official Settlement Receipt</p>
              <div className="pt-2">
                <span className="text-3xl font-black text-indigo-900 font-mono">{receipt.amountPaid.toFixed(2)} Pi</span>
              </div>
              <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black uppercase tracking-widest">
                Payment Success & Cleared
              </span>
            </div>

            {/* Receipt Details Grid */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Receipt Number</span>
                <span className="font-bold text-slate-900 font-mono">{receipt.receiptNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Payment ID</span>
                <span className="font-bold text-slate-900 font-mono">{receipt.paymentId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Transaction ID</span>
                <span className="font-bold text-indigo-700 font-mono truncate max-w-[180px]">{receipt.transactionId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Order Number</span>
                <span className="font-bold text-slate-900 font-mono">#{receipt.orderNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Payment Method</span>
                <span className="font-bold text-slate-900 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                  {receipt.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Payment Time</span>
                <span className="font-bold text-slate-900">{new Date(receipt.paymentTime).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Buyer (Pioneer)</span>
                <span className="font-bold text-slate-900">{receipt.buyerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Seller / Store</span>
                <span className="font-bold text-slate-900">{receipt.businessName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 text-violet-700">
                <span className="font-medium flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-500" /> BMP Reward Credited
                </span>
                <span className="font-black">+{receipt.bmpRewardCredited} BMP</span>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center gap-4 mt-6">
              <div className="p-2 bg-white rounded-xl shrink-0">
                <QrCode className="w-12 h-12 text-slate-900" />
              </div>
              <div className="space-y-1 overflow-hidden">
                <div className="flex items-center gap-1 text-emerald-400 text-[9px] font-black uppercase tracking-widest">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Tamper-Proof Receipt QR</span>
                </div>
                <p className="text-[9px] text-slate-400 font-mono truncate">{receipt.receiptQrCode}</p>
                {onVerifyQr && (
                  <button 
                    onClick={() => onVerifyQr(receipt.receiptQrCode)}
                    className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 underline uppercase tracking-wider flex items-center gap-1 print:hidden"
                  >
                    <span>Scan & Verify</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest pt-2">
              Thank you for trading on Pi Business Market
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
