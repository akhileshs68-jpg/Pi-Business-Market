/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  CreditCard,
  Zap,
  Award
} from 'lucide-react';
import { piPaymentService } from '../../services/piPaymentService';
import { useAuth } from '../../auth/useAuth';

export interface InAppProduct {
  id: string;
  name: string;
  amount: number;
  memo: string;
  description: string;
  badge?: string;
  icon?: string;
}

const DEFAULT_PRODUCTS: InAppProduct[] = [
  {
    id: 'prod_merchant_badge',
    name: 'Verified Pioneer Merchant Pass',
    amount: 10,
    memo: 'Verified Pioneer Merchant Pass upgrade on Pi Business Market',
    description: 'Unlocks gold verified seller badge, priority listing in marketplace search, and 0% escrow fee tier.',
    badge: 'Popular',
    icon: 'Award'
  },
  {
    id: 'prod_pioneer_tip',
    name: 'Pioneer Ecosystem Tip',
    amount: 5,
    memo: 'Support Pi Business Market ecosystem development',
    description: 'Contribute directly to maintaining open pioneer node infrastructure and marketplace scaling.',
    badge: 'Support',
    icon: 'Sparkles'
  },
  {
    id: 'prod_escrow_shield',
    name: 'Express Escrow Insurance',
    amount: 15,
    memo: 'Express Escrow Insurance activation',
    description: 'Insures up to 500 Pi of cross-border shipment cargo with instantaneous dispute arbitrage.',
    badge: 'Protection',
    icon: 'ShieldCheck'
  }
];

interface PiInAppPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customProduct?: InAppProduct;
  onSuccess?: (paymentId: string, txid: string) => void;
}

export const PiInAppPaymentModal: React.FC<PiInAppPaymentModalProps> = ({
  isOpen,
  onClose,
  customProduct,
  onSuccess
}) => {
  const { user } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState<InAppProduct>(customProduct || DEFAULT_PRODUCTS[0]);
  const [customAmount, setCustomAmount] = useState<string>('10');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'approving' | 'completing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [lastTxid, setLastTxid] = useState<string>('');

  if (!isOpen) return null;

  const handlePurchase = async () => {
    setIsProcessing(true);
    setPaymentStatus('approving');
    setStatusMessage('Initiating Pi Network payment request...');

    const amount = selectedProduct.id === 'custom' 
      ? parseFloat(customAmount) || 5 
      : selectedProduct.amount;

    const metadata = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      productType: 'InAppProduct',
      buyerUid: user?.uid || 'guest_pioneer',
      timestamp: new Date().toISOString()
    };

    try {
      await piPaymentService.createPayment(
        {
          amount,
          memo: selectedProduct.memo,
          metadata
        },
        {
          onReadyForServerApproval: async (paymentId) => {
            console.log('[InAppModal] Approval Callback Entered for Payment ID:', paymentId);
            try {
              setPaymentStatus('completing');
              setStatusMessage('Requesting server approval...');
              
              console.log('[InAppModal] Approve Request Started...');
              const authModule = await import('../../firebase/config');
              const auth = authModule.getFirebaseAuth();
              const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';

              const res = await fetch('/api/payments/approve', {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ paymentId, metadata })
              });
              const resText = await res.text();
              console.log('[InAppModal] Approve Response status:', res.status, 'body:', resText);
              
              if (!res.ok) {
                console.error('[InAppModal] Server approval returned non-ok status');
                throw new Error(`InAppModal approval failed (${res.status}): ${resText}`);
              }
              
              console.log('[InAppModal] Approval Callback Finished.');
              setStatusMessage('Server approved. Signing transaction on Pi Network blockchain...');
            } catch (err) {
              console.error('[InAppModal] Exception in onReadyForServerApproval:', err);
              throw err;
            }
          },
          onReadyForServerCompletion: async (paymentId, txid) => {
            console.log('[InAppModal] Completion Callback Entered for Payment ID:', paymentId, 'TxID:', txid);
            try {
              console.log('[InAppModal] Completion Request Started...');
              const authModule = await import('../../firebase/config');
              const auth = authModule.getFirebaseAuth();
              const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
              
              const res = await fetch('/api/payments/complete', {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ paymentId, txid, metadata })
              });
              const resText = await res.text();
              console.log('[InAppModal] Complete Response status:', res.status, 'body:', resText);

              if (!res.ok) {
                throw new Error(`InAppModal completion failed (${res.status}): ${resText}`);
              }

              console.log('[InAppModal] Completion Finished.');
              setPaymentStatus('success');
              setLastTxid(txid);
              setStatusMessage('Payment successfully confirmed on Pi Network Mainnet!');
              setIsProcessing(false);
              if (onSuccess) {
                onSuccess(paymentId, txid);
              }
            } catch (err) {
              console.error('[InAppModal] Exception in onReadyForServerCompletion:', err);
              throw err;
            }
          },
          onCancel: async (paymentId) => {
            console.log('[InAppModal] Payment cancelled:', paymentId);
            setPaymentStatus('idle');
            setStatusMessage('Payment was cancelled.');
            setIsProcessing(false);
          },
          onError: async (error, paymentId) => {
            console.error('[InAppModal] Payment error:', error, paymentId);
            setPaymentStatus('error');
            setStatusMessage(error.message || 'Payment failed. Please try again.');
            setIsProcessing(false);
          }
        }
      );
    } catch (err: any) {
      console.error('[InAppModal] Failed to initiate payment:', err);
      setPaymentStatus('error');
      setStatusMessage(err.message || 'Could not start Pi payment.');
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative"
        >
          {/* Header */}
          <div className="px-6 py-5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Pi Network In-App Purchase</h3>
                <p className="text-xs text-slate-400">Official User-to-App (U2A) Pi Payment</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {paymentStatus === 'success' ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">Purchase Successful!</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    {selectedProduct.name} has been activated for your account.
                  </p>
                </div>
                {lastTxid && (
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 font-mono text-[10px] text-slate-400 break-all">
                    TxID: {lastTxid}
                  </div>
                )}
                <button
                  onClick={onClose}
                  className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                {/* Product Selection */}
                {!customProduct && (
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Select Product to Buy
                    </label>
                    <div className="space-y-2.5">
                      {DEFAULT_PRODUCTS.map((prod) => (
                        <div
                          key={prod.id}
                          onClick={() => !isProcessing && setSelectedProduct(prod)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                            selectedProduct.id === prod.id
                              ? 'bg-violet-600/10 border-violet-500 text-white'
                              : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-white">{prod.name}</span>
                              {prod.badge && (
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                                  {prod.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{prod.description}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-base font-black text-violet-400">{prod.amount} Pi</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selected Summary Card */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Product</span>
                    <span className="font-bold text-white">{selectedProduct.name}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Payment Type</span>
                    <span className="font-bold text-emerald-400">User-to-App (U2A)</span>
                  </div>
                  <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-sm font-bold text-white">
                    <span>Total Pi Amount</span>
                    <span className="text-lg text-violet-400">{selectedProduct.amount} Pi</span>
                  </div>
                </div>

                {/* Status or Error Notice */}
                {paymentStatus === 'error' && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{statusMessage}</span>
                  </div>
                )}

                {isProcessing && (
                  <div className="p-3.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs flex items-center gap-2.5 animate-pulse">
                    <Loader2 className="w-4 h-4 shrink-0 animate-spin text-violet-400" />
                    <span>{statusMessage}</span>
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={handlePurchase}
                  disabled={isProcessing}
                  className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-sm uppercase tracking-wider rounded-2xl shadow-xl flex items-center justify-center gap-2.5 transition-all"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Processing Payment...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      <span>Pay {selectedProduct.amount} Pi with Pi Wallet</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
