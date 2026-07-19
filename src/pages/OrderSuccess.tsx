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
        className="w-24 h-24 bg-emerald-600/10 rounded-full flex items-center justify-center mb-8"
      >
        <CheckCircle2 className="w-12 h-12 text-emerald-500" />
      </motion.div>

      <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">
        Order <span className="text-emerald-500">Placed</span>
      </h1>
      <p className="text-slate-500 max-w-sm mx-auto mb-12 font-medium">
        Thank you for your purchase! Your order has been confirmed and the merchant is preparing your items.
      </p>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-12 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Order ID</span>
          <span className="text-xs font-black text-white uppercase">{orderId}</span>
        </div>
        <div className="flex items-center gap-3 text-left">
          <div className="p-3 bg-slate-800 rounded-xl">
            <Package className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white uppercase">Status: Confirmed</h4>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Processing at Merchant Hub</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
        <button 
          onClick={() => navigate('/discovery')}
          className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" /> Continue Shopping
        </button>
        <button 
          onClick={() => navigate('/discovery')}
          className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
        >
          View All Orders <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
