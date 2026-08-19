/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Package, ArrowRight, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';

export const OrderSuccess: React.FC = () => {
  const { draftId: orderId } = useParams<{ draftId: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-20 h-20 bg-emerald-600/10 border border-emerald-500/20 rounded-3xl flex items-center justify-center mb-6 shadow-xl"
      >
        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
      </motion.div>

      <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight mb-2">
        Order <span className="text-emerald-400">Placed</span>
      </h1>
      <p className="text-slate-400 max-w-sm mx-auto mb-8 font-medium text-xs sm:text-sm leading-relaxed">
        Thank you for your purchase! Your order has been confirmed and the merchant is preparing your items.
      </p>

      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 mb-8 w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Order ID</span>
          <span className="text-xs font-mono font-bold text-white uppercase">{orderId}</span>
        </div>
        <div className="flex items-center gap-3 text-left">
          <div className="p-3 bg-violet-950/60 border border-violet-800/60 rounded-xl">
            <Package className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase">Status: Confirmed</h4>
            <p className="text-[11px] font-medium text-slate-400">Processing at Merchant Hub</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3.5 w-full max-w-sm">
        <button 
          onClick={() => navigate('/discovery')}
          aria-label="Continue Shopping"
          className="flex-1 min-h-[48px] py-3.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 shadow-lg shadow-violet-600/20"
        >
          <ShoppingBag className="w-4 h-4" /> Continue Shopping
        </button>
        <button 
          onClick={() => navigate('/orders')}
          aria-label="View All Orders"
          className="flex-1 min-h-[48px] py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          View All Orders <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
