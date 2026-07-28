/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Loader2, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Coins,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { piPaymentService, PiPaymentData } from '../../services/piPaymentService';

export type PiPaymentState = 'Idle' | 'Pending' | 'Approved' | 'Completed' | 'Cancelled' | 'Failed';

interface PiPaymentButtonProps {
  amount: number;
  memo: string;
  metadata: Record<string, any>;
  onSuccess: (paymentId: string, txid: string) => void;
  onCancel: (paymentId: string) => void;
  onError: (error: Error, paymentId: string) => void;
  disabled?: boolean;
}

export const PiPaymentButton: React.FC<PiPaymentButtonProps> = ({
  amount,
  memo,
  metadata,
  onSuccess,
  onCancel,
  onError,
  disabled = false
}) => {
  const [paymentState, setPaymentState] = useState<PiPaymentState>('Idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);

  const handlePayClick = async () => {
    setPaymentState('Pending');
    setErrorMessage(null);

    const paymentData: PiPaymentData = {
      amount,
      memo,
      metadata
    };

    try {
      await piPaymentService.createPayment(paymentData, {
        onReadyForServerApproval: (paymentId) => {
          console.log('[PiPaymentButton] Payment approved by blockchain/user, ID:', paymentId);
          setCurrentPaymentId(paymentId);
          setPaymentState('Approved');
        },
        onReadyForServerCompletion: (paymentId, txid) => {
          console.log('[PiPaymentButton] Payment completed, TxId:', txid);
          setPaymentState('Completed');
          onSuccess(paymentId, txid);
        },
        onCancel: (paymentId) => {
          console.log('[PiPaymentButton] Payment cancelled by user, ID:', paymentId);
          setPaymentState('Cancelled');
          onCancel(paymentId);
        },
        onError: (error, paymentId) => {
          console.error('[PiPaymentButton] Payment failed, ID:', paymentId, error);
          setPaymentState('Failed');
          setErrorMessage(error.message || 'Payment transaction encountered an unexpected error.');
          onError(error, paymentId);
        }
      });
    } catch (err: any) {
      console.error('[PiPaymentButton] Initialization error:', err);
      setPaymentState('Failed');
      setErrorMessage(err.message || 'Initialization of Pi SDK Payment failed.');
      onError(err instanceof Error ? err : new Error(String(err)), 'init_failed');
    }
  };

  const handleRetry = () => {
    setPaymentState('Idle');
    setErrorMessage(null);
    setCurrentPaymentId(null);
  };

  return (
    <div className="space-y-4" id="pi_payment_button_component">
      {/* Dynamic payment state status overlays */}
      <AnimatePresence mode="wait">
        {paymentState === 'Pending' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-violet-600/10 border border-violet-500/20 rounded-2xl flex items-center gap-3"
            id="pi_payment_state_pending"
          >
            <Loader2 className="w-5 h-5 text-violet-400 animate-spin shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-white block uppercase tracking-wider">Awaiting User Confirmation</span>
              <p className="text-slate-400 leading-normal mt-0.5">Please check and approve the payment dialog inside your secure Pi Browser.</p>
            </div>
          </motion.div>
        )}

        {paymentState === 'Approved' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3"
            id="pi_payment_state_approved"
          >
            <Loader2 className="w-5 h-5 text-amber-400 animate-spin shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-white block uppercase tracking-wider">Consensus Approval Verified</span>
              <p className="text-slate-400 leading-normal mt-0.5">Payment approved by merchant node. Finalizing blockchain settlement signature...</p>
            </div>
          </motion.div>
        )}

        {paymentState === 'Cancelled' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-slate-800 border border-slate-700/50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            id="pi_payment_state_cancelled"
          >
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-slate-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-white block uppercase tracking-wider">Payment Cancelled</span>
                <p className="text-slate-400 leading-normal mt-0.5">You cancelled the payment. The order has not been charged.</p>
              </div>
            </div>
            <button
              onClick={handleRetry}
              className="py-1.5 px-3 bg-slate-700 hover:bg-slate-650 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
            >
              Retry Payment
            </button>
          </motion.div>
        )}

        {paymentState === 'Failed' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex flex-col gap-3.5"
            id="pi_payment_state_failed"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-rose-400 block uppercase tracking-wider">Payment Processing Error</span>
                <p className="text-slate-300 leading-normal mt-1 font-medium">{errorMessage}</p>
              </div>
            </div>
            <button
              onClick={handleRetry}
              className="py-2 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 w-fit self-end shadow-md shadow-rose-600/10"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Click to Retry</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Button Render */}
      {paymentState === 'Idle' && (
        <button
          onClick={handlePayClick}
          disabled={disabled}
          className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2.5 shadow-lg ${
            disabled 
              ? 'bg-slate-800 text-slate-500 border border-slate-800/50 cursor-not-allowed opacity-50' 
              : 'bg-gradient-to-r from-amber-500 via-violet-600 to-indigo-600 hover:from-amber-400 hover:via-violet-500 hover:to-indigo-500 text-white active:scale-[0.99] shadow-violet-600/20'
          }`}
          id="btn_pay_with_pi"
        >
          <Coins className="w-5 h-5 text-amber-300 animate-bounce" />
          <span>Pay {amount.toFixed(2)} Pi with Secure Wallet</span>
        </button>
      )}

      {/* Security validation shield badge */}
      <div className="flex items-center justify-center gap-2 text-[9px] text-slate-500 font-bold uppercase tracking-wider pt-1">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        <span>Official Non-Custodial Pi API Validation Secured</span>
      </div>
    </div>
  );
};
