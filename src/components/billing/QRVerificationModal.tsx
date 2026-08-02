/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  QrCode, 
  Search, 
  Building2, 
  Store, 
  Package, 
  CreditCard, 
  Clock, 
  Sparkles,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { billingService } from '../../services/billingService';
import { QRVerificationResult } from '../../types/billing';

interface Props {
  initialCode?: string;
  onClose: () => void;
}

export const QRVerificationModal: React.FC<Props> = ({ initialCode = '', onClose }) => {
  const [qrCodeInput, setQrCodeInput] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QRVerificationResult | null>(null);

  useEffect(() => {
    if (initialCode) {
      handleVerify(initialCode);
    }
  }, [initialCode]);

  const handleVerify = async (codeToVerify?: string) => {
    const code = codeToVerify || qrCodeInput;
    if (!code.trim()) return;

    setLoading(true);
    try {
      const res = await billingService.verifyQRToken(code);
      setResult(res);
    } catch (err) {
      console.error('Verification failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 sm:p-8 max-w-xl w-full text-slate-200 shadow-2xl relative"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-5 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-2xl border border-indigo-500/20">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">QR Ledger Verification</h2>
                <p className="text-xs text-slate-400 font-medium">Verify Invoice, Receipt & Order Authenticity</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* QR Code Input / Search Field */}
          <div className="flex items-center gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                value={qrCodeInput} 
                onChange={(e) => setQrCodeInput(e.target.value)}
                placeholder="Enter or paste QR token / Code..." 
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none font-mono"
              />
            </div>
            <button 
              onClick={() => handleVerify()}
              disabled={loading || !qrCodeInput.trim()}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
            </button>
          </div>

          {/* Verification Results Display */}
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Running Cryptographic Verification...</p>
            </div>
          ) : result ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Authenticity Badge */}
              <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
                result.isValid 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}>
                {result.isValid ? (
                  <ShieldCheck className="w-8 h-8 shrink-0 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-8 h-8 shrink-0 text-rose-400" />
                )}
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider">
                    {result.isValid ? 'AUTHENTIC & VERIFIED ON LEDGER' : 'INVALID OR UNVERIFIED QR TOKEN'}
                  </h3>
                  <p className="text-[11px] text-slate-300 font-medium">
                    {result.isValid 
                      ? `Target Document Type: ${(result.type || 'DOCUMENT').toUpperCase()}` 
                      : 'This token could not be matched with any active invoice or order on Pi Business Market.'}
                  </p>
                </div>
              </div>

              {result.isValid && (
                <div className="space-y-4 text-xs">
                  {/* Business & Store Information */}
                  {result.business && (
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                      <div className="flex items-center gap-2 text-indigo-400 font-black text-[10px] uppercase tracking-widest mb-1">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Business & Store Entity</span>
                      </div>
                      <p className="text-sm font-black text-white">{result.business.businessName}</p>
                      {result.business.registrationNumber && (
                        <p className="text-slate-400">Reg #: <span className="text-slate-200 font-mono">{result.business.registrationNumber}</span></p>
                      )}
                      {result.business.gstNumber && (
                        <p className="text-slate-400">GST / Tax ID: <span className="text-slate-200 font-mono">{result.business.gstNumber}</span></p>
                      )}
                      {result.store && (
                        <p className="text-slate-400 flex items-center gap-1.5 pt-1">
                          <Store className="w-3.5 h-3.5 text-slate-500" /> Store: <span className="text-slate-200 font-bold">{result.store.storeName}</span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Order Summary */}
                  {result.orderSummary && (
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                      <div className="flex items-center gap-2 text-violet-400 font-black text-[10px] uppercase tracking-widest mb-1">
                        <Package className="w-3.5 h-3.5" />
                        <span>Order Ledger Summary</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Order Reference:</span>
                        <span className="font-bold text-white font-mono">#{result.orderSummary.orderNumber}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Grand Total:</span>
                        <span className="font-black text-indigo-400 text-sm">{result.orderSummary.grandTotal.toFixed(2)} Pi</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Items Count:</span>
                        <span className="font-bold text-slate-200">{result.orderSummary.itemCount} Item(s)</span>
                      </div>
                      {result.orderSummary.items && result.orderSummary.items.length > 0 && (
                        <p className="text-[11px] text-slate-400 pt-1">
                          Items: <span className="text-slate-300">{result.orderSummary.items.join(', ')}</span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Payment Status & Security Signatures */}
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-black text-[10px] uppercase tracking-widest mb-1">
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Payment Status & Blockchain Ledger</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Payment Status:</span>
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[9px] font-black uppercase">
                        {result.paymentStatus}
                      </span>
                    </div>
                    {result.piTransactionHash && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Transaction Hash:</span>
                        <span className="font-mono text-slate-300 truncate max-w-[180px]">{result.piTransactionHash}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Verification Timestamp:</span>
                      <span className="text-slate-300 font-mono text-[10px]">{new Date(result.timestamp).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-indigo-400" /> Digital Stamp</span>
                    <span>{result.digitalSignature}</span>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-2xl">
              <QrCode className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-xs text-slate-400 font-medium">Scan or enter any invoice or receipt token to instantly verify its authenticity on the Pi Business Market ledger.</p>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
