/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  History, 
  ChevronRight, 
  FileText, 
  Download, 
  ExternalLink,
  ShieldCheck,
  Loader2,
  Package
} from 'lucide-react';
import { motion } from 'motion/react';
import Navbar from '../components/Navbar';
import { useAuth } from '../auth/useAuth';
import { paymentService } from '../services/paymentService';
import { Payment } from '../types';

export const CustomerPayments: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPayments();
    }
  }, [user]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      // For this foundation, we'll fetch payments by userUid
      // In a real app, paymentService would have a getCustomerPayments method
      // We'll simulate it by filtering or querying
      const data = await paymentService.getBusinessPayments('PI-CORP-001'); 
      // Filter for the current user
      const userPayments = data.filter(p => p.payerUid === user!.uid);
      setPayments(userPayments);
    } catch (err) {
      console.error('Failed to fetch payments', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <Navbar 
        currentUser={user!}
        currentView="discovery"
        onNavigate={(view) => navigate(`/${view}`)}
        cartCount={0}
        walletBalance={100}
        onWalletUpdate={() => {}}
        onToggleCart={() => {}}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">Payment History</h1>
            <p className="text-slate-500 font-medium">Review your Pi Network transactions and download receipts.</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-500">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Secured by Pi Node</span>
          </div>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            <p className="text-xs font-black text-slate-600 uppercase tracking-widest animate-pulse">Retrieving Receipts...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="py-32 text-center bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-[3rem]">
            <History className="w-16 h-16 text-slate-700 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-white mb-2">No Transactions Yet</h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-8">Your Pi Network payment history will appear here once you complete a purchase.</p>
            <button 
              onClick={() => navigate('/discovery')}
              className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs"
            >
              Start Exploring
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {payments.map((payment) => (
              <motion.div
                key={payment.paymentId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 hover:border-indigo-500/50 transition-all group"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-8">
                  <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-3xl flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 transition-colors group-hover:text-white">
                    <CreditCard className="w-8 h-8" />
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Transaction Verified</span>
                      <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-md text-[8px] font-black uppercase tracking-widest border border-indigo-500/20">
                        Pi Network
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Paid {payment.amount} Pi</h3>
                    <div className="flex items-center gap-6">
                       <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                        <Package className="w-3 h-3" /> Order {payment.orderId.slice(0, 8)}...
                      </p>
                      <p className="text-xs text-slate-500 font-medium">
                        {new Date(payment.paidAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button className="p-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl transition-all shadow-lg">
                      <Download className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => navigate(`/order-details/${payment.orderId}`)}
                      className="flex items-center gap-2 px-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20"
                    >
                      View Receipt <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
