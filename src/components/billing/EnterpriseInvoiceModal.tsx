/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Share2, 
  CheckCircle2, 
  ShieldCheck, 
  Copy, 
  Send, 
  Download, 
  QrCode, 
  Building2, 
  Store, 
  Award, 
  ExternalLink,
  Sparkles,
  FileCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EnterpriseInvoice } from '../../types/billing';

interface Props {
  invoice: EnterpriseInvoice;
  onClose: () => void;
  onVerifyQr?: (code: string) => void;
}

export const EnterpriseInvoiceModal: React.FC<Props> = ({ invoice, onClose, onVerifyQr }) => {
  const [copied, setCopied] = useState(false);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/invoice/${invoice.orderId}?verify=${invoice.qrVerificationCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`Enterprise Tax Invoice ${invoice.invoiceNumber} for Order #${invoice.orderNumber} - Grand Total: ${invoice.summary.grandTotal} Pi.\nVerify: ${window.location.origin}/verify-qr/${invoice.qrVerificationCode}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    setShareSuccess('Shared via WhatsApp!');
    setTimeout(() => setShareSuccess(null), 3000);
  };

  const handleShareTelegram = () => {
    const url = encodeURIComponent(`${window.location.origin}/invoice/${invoice.orderId}`);
    const text = encodeURIComponent(`Invoice ${invoice.invoiceNumber} (Order #${invoice.orderNumber})`);
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
          className="bg-white text-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-3xl my-8 overflow-hidden border border-slate-200 relative print:shadow-none print:border-none print:m-0 print:p-0 print:w-full print:max-w-none print:rounded-none"
        >
          {/* Header Action Bar - Non Printable */}
          <div className="bg-slate-900 px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 text-white print:hidden">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-violet-600/30 border border-violet-500/40 flex items-center justify-center text-violet-400 font-mono font-bold text-lg">
                π
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-white">Enterprise Tax Invoice</span>
                <p className="text-[10px] text-slate-400">Ref: {invoice.invoiceNumber}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={handlePrint}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>

              <button 
                onClick={handleCopyLink}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all"
                title="Copy Share Link"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Copied!' : 'Link'}</span>
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
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all ml-2"
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

          {/* Invoice Body Content */}
          <div className="p-6 sm:p-10 space-y-8 bg-white print:p-6" id="printable-invoice">
            {/* Top Brand Banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b-2 border-slate-900 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-950 flex items-center justify-center text-white font-black text-2xl shadow-lg shrink-0">
                  π
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">PI BUSINESS MARKET</h1>
                  <p className="text-[11px] font-black text-indigo-600 tracking-widest uppercase">Enterprise Global Commerce Ledger</p>
                  <p className="text-[10px] text-slate-500">Official Tax Invoice & Blockchain Proof of Transaction</p>
                </div>
              </div>

              <div className="text-left sm:text-right space-y-1">
                <div className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-black uppercase tracking-widest mb-1">
                  ✓ {invoice.paymentStatus}
                </div>
                <p className="text-lg font-black text-slate-900 font-mono">{invoice.invoiceNumber}</p>
                <p className="text-xs font-bold text-slate-500">Issued Date: {new Date(invoice.invoiceDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              </div>
            </div>

            {/* Quick Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Order Number</span>
                <span className="font-bold text-slate-800 font-mono">#{invoice.orderNumber}</span>
              </div>
              <div>
                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Transaction Hash</span>
                <span className="font-bold text-indigo-700 font-mono truncate block max-w-[120px]" title={invoice.transactionId}>
                  {invoice.transactionId}
                </span>
              </div>
              <div>
                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Payment Network</span>
                <span className="font-bold text-emerald-700">{invoice.piTestnetStatus}</span>
              </div>
              <div>
                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">BMP Rewards</span>
                <span className="font-bold text-violet-700 flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-500" />
                  +{invoice.summary.bmpRewardEarned} BMP Credited
                </span>
              </div>
            </div>

            {/* Buyer & Seller Information Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs pt-2">
              {/* Seller */}
              <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-black text-slate-900 uppercase tracking-wider text-[11px]">Seller / Merchant Information</h3>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  {invoice.businessLogo ? (
                    <img src={invoice.businessLogo} alt="Logo" className="w-10 h-10 rounded-xl object-cover border border-slate-200" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                      {invoice.seller.businessName.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{invoice.seller.businessName}</p>
                    {invoice.seller.storeName && (
                      <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                        <Store className="w-3 h-3 text-slate-400" /> {invoice.seller.storeName}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-slate-600"><span className="font-bold">Reg #:</span> {invoice.seller.registrationNumber || 'N/A'}</p>
                <p className="text-slate-600"><span className="font-bold">GST / Tax ID:</span> {invoice.seller.gstNumber || 'N/A'}</p>
                <p className="text-slate-600"><span className="font-bold">Address:</span> {invoice.seller.address}</p>
                <p className="text-slate-600"><span className="font-bold">Email:</span> {invoice.seller.email}</p>
              </div>

              {/* Buyer */}
              <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-2">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-black text-slate-900 uppercase tracking-wider text-[11px]">Billed To (Buyer Information)</h3>
                </div>
                <p className="font-bold text-slate-900 text-sm">{invoice.buyer.name}</p>
                <p className="text-slate-600">{invoice.buyer.address}</p>
                <p className="text-slate-600">{invoice.buyer.city}, {invoice.buyer.state} {invoice.buyer.postalCode}</p>
                <p className="text-slate-600">{invoice.buyer.country}</p>
                <p className="text-slate-600"><span className="font-bold">Email:</span> {invoice.buyer.email}</p>
                <p className="text-slate-600"><span className="font-bold">Phone:</span> {invoice.buyer.phone}</p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 font-black uppercase text-[10px] text-slate-600 tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Product / Service Item</th>
                    <th className="p-3.5 text-center">Qty</th>
                    <th className="p-3.5 text-right">Unit Price</th>
                    <th className="p-3.5 text-right">Discount</th>
                    <th className="p-3.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {invoice.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          {item.imageUrl && (
                            <img src={item.imageUrl} alt={item.productName} className="w-9 h-9 rounded-lg object-cover border border-slate-200" />
                          )}
                          <div>
                            <p className="font-bold text-slate-900">{item.productName}</p>
                            {item.isService && (
                              <span className="inline-block px-1.5 py-0.5 bg-violet-50 text-violet-600 text-[8px] font-bold uppercase rounded">
                                Professional Service
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 text-center font-bold">{item.quantity}</td>
                      <td className="p-3.5 text-right">{item.unitPrice.toFixed(2)} Pi</td>
                      <td className="p-3.5 text-right text-slate-500">{(item.discount || 0).toFixed(2)} Pi</td>
                      <td className="p-3.5 text-right font-black text-slate-900">{item.subtotal.toFixed(2)} Pi</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals & QR Verification Footer Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-end border-t border-slate-200 pt-6">
              {/* QR Code Verification Block */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center gap-4">
                <div className="p-2 bg-white rounded-xl shrink-0">
                  <div className="w-16 h-16 bg-slate-900 p-1 rounded flex items-center justify-center text-white">
                    <QrCode className="w-12 h-12 text-white" />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Cryptographic Verification</span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-mono break-all">{invoice.qrVerificationCode}</p>
                  {onVerifyQr && (
                    <button 
                      onClick={() => onVerifyQr(invoice.qrVerificationCode)}
                      className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 underline uppercase tracking-wider flex items-center gap-1 pt-1 print:hidden"
                    >
                      <span>Verify Authenticity</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Financial Calculation Column */}
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Items Subtotal:</span>
                  <span className="font-bold text-slate-900">{invoice.summary.subtotal.toFixed(2)} Pi</span>
                </div>
                {invoice.summary.discount > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-600">
                    <span>Discount / Coupon ({invoice.summary.couponCode || 'PROMO'}):</span>
                    <span className="font-bold">-{invoice.summary.discount.toFixed(2)} Pi</span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Logistics & Shipping:</span>
                  <span className="font-bold text-slate-900">{invoice.summary.shippingCharge.toFixed(2)} Pi</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Estimated Tax / GST:</span>
                  <span className="font-bold text-slate-900">{invoice.summary.tax.toFixed(2)} Pi</span>
                </div>
                <div className="flex justify-between py-3 border-t-2 border-slate-900 text-slate-900 text-lg font-black">
                  <span>Grand Total Paid:</span>
                  <span className="text-indigo-600">{invoice.summary.grandTotal.toFixed(2)} Pi</span>
                </div>
              </div>
            </div>

            {/* Digital Signature Footer */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-100 pt-6">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Digital Signature Hash: {invoice.digitalSignature}</span>
              </div>
              <span>Verified by Pi Business Market Architecture © 2026</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
