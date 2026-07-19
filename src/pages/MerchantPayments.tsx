/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle2, 
  Loader2,
  TrendingUp,
  Wallet,
  FileText,
  DollarSign,
  History,
  Activity
} from 'lucide-react';
import { motion } from 'motion/react';
import Navbar from '../components/Navbar';
import { useAuth } from '../auth/useAuth';
import { paymentService } from '../services/paymentService';
import { ledgerService } from '../services/ledgerService';
import { Payment, LedgerEntry, PaymentStatus } from '../types';

export const MerchantPayments: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [payments, setPayments] = useState<Payment[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'payments' | 'ledger'>('payments');
  
  const businessId = 'PI-CORP-001'; // Mocked for foundation

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      const [paymentsData, ledgerData] = await Promise.all([
        paymentService.getBusinessPayments(businessId),
        ledgerService.getBusinessLedger(businessId)
      ]);
      setPayments(paymentsData);
      setLedger(ledgerData);
    } catch (err) {
      console.error('Failed to fetch financial data', err);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = ledger.reduce((acc, entry) => acc + entry.balanceImpact, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <Navbar 
        currentUser={user!}
        currentView="employer"
        onNavigate={(view) => navigate(`/${view}`)}
        cartCount={0}
        walletBalance={100}
        onWalletUpdate={() => {}}
        onToggleCart={() => {}}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-600/20 rounded-xl text-indigo-400">
                <CreditCard className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight uppercase">Financial Hub</h1>
            </div>
            <p className="text-slate-500 font-medium">Manage your revenue, payments, and immutable ledger history.</p>
          </div>

          <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800">
            <button 
              onClick={() => setActiveTab('payments')}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'payments' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'
              }`}
            >
              Recent Payments
            </button>
            <button 
              onClick={() => setActiveTab('ledger')}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'ledger' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'
              }`}
            >
              Enterprise Ledger
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <StatCard label="Total Revenue" value={`${totalRevenue.toFixed(2)} Pi`} icon={<TrendingUp />} color="text-emerald-400" />
          <StatCard label="Settled Funds" value={`${(totalRevenue * 0.95).toFixed(2)} Pi`} icon={<Wallet />} color="text-indigo-400" />
          <StatCard label="Pending Verif." value="12.50 Pi" icon={<Clock />} color="text-amber-400" />
          <StatCard label="Active Refund Req." value="0" icon={<Activity />} color="text-rose-400" />
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            <p className="text-sm font-black text-slate-600 uppercase tracking-widest animate-pulse">Syncing Financial Ledger...</p>
          </div>
        ) : activeTab === 'payments' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Payment Stream</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white rounded-xl transition-all">
                <FileText className="w-4 h-4" /> Export CSV
              </button>
            </div>
            
            <div className="bg-slate-900/30 border border-slate-800 rounded-[2.5rem] overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <th className="px-8 py-6">Payment ID</th>
                    <th className="px-8 py-6">Amount</th>
                    <th className="px-8 py-6">Customer</th>
                    <th className="px-8 py-6">Provider</th>
                    <th className="px-8 py-6">Status</th>
                    <th className="px-8 py-6">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.paymentId} className="border-b border-slate-800/50 hover:bg-slate-900/50 transition-colors">
                      <td className="px-8 py-6">
                        <span className="text-xs font-black text-white uppercase">{p.paymentId}</span>
                        <p className="text-[8px] font-bold text-slate-600 uppercase mt-1 truncate max-w-[100px]">{p.piTransactionId}</p>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm font-black text-emerald-500">+{p.amount} {p.currency}</span>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-xs font-bold text-slate-300">UID: {p.payerUid.slice(0, 8)}...</p>
                      </td>
                      <td className="px-8 py-6">
                        <span className="px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg text-[8px] font-black uppercase">Pi Network</span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-[8px] font-black uppercase border border-emerald-500/20">
                          {p.paymentStatus}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{new Date(p.paidAt).toLocaleDateString()}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
             <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                <History className="w-6 h-6 text-indigo-400" /> Immutable Ledger Records
              </h2>
            </div>

            <div className="bg-slate-900/30 border border-slate-800 rounded-[2.5rem] overflow-hidden">
               <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <th className="px-8 py-6">Ledger Ref</th>
                    <th className="px-8 py-6">Type</th>
                    <th className="px-8 py-6">Reference</th>
                    <th className="px-8 py-6">Impact</th>
                    <th className="px-8 py-6">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((entry) => (
                    <tr key={entry.ledgerId} className="border-b border-slate-800/50 hover:bg-slate-900/50 transition-colors">
                      <td className="px-8 py-6">
                        <span className="text-xs font-black text-slate-400 uppercase">{entry.ledgerId}</span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded-lg text-[8px] font-black uppercase">
                          {entry.entryType}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-xs font-bold text-slate-500 uppercase">{entry.referenceType}: </span>
                        <span className="text-xs font-black text-white uppercase">{entry.referenceId}</span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          {entry.balanceImpact > 0 ? <ArrowUpRight className="w-3 h-3 text-emerald-500" /> : <ArrowDownLeft className="w-3 h-3 text-rose-500" />}
                          <span className={`text-sm font-black ${entry.balanceImpact > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {entry.balanceImpact > 0 ? '+' : ''}{entry.balanceImpact.toFixed(2)} Pi
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-[10px] font-bold text-slate-600 uppercase">{new Date(entry.createdAt).toLocaleString()}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: any) => (
  <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-3xl">
    <div className="flex items-center gap-3 mb-4">
      <div className={`${color} p-2 bg-slate-950 rounded-xl border border-slate-800`}>
        {React.cloneElement(icon, { size: 18 })}
      </div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
    </div>
    <p className="text-2xl font-black text-white">{value}</p>
  </div>
);
