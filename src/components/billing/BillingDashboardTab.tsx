/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Receipt, 
  Search, 
  Download, 
  Printer, 
  QrCode, 
  Share2, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Award, 
  TrendingUp, 
  Loader2,
  ExternalLink,
  Plus
} from 'lucide-react';
import { motion } from 'motion/react';
import { billingService } from '../../services/billingService';
import { EnterpriseInvoice, ProfessionalReceipt, BillingAnalytics } from '../../types/billing';
import { EnterpriseInvoiceModal } from './EnterpriseInvoiceModal';
import { ProfessionalReceiptModal } from './ProfessionalReceiptModal';
import { QRVerificationModal } from './QRVerificationModal';

interface Props {
  businessId: string;
}

export const BillingDashboardTab: React.FC<Props> = ({ businessId }) => {
  const [activeSubTab, setActiveSubTab] = useState<'invoices' | 'receipts'>('invoices');
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<EnterpriseInvoice[]>([]);
  const [receipts, setReceipts] = useState<ProfessionalReceipt[]>([]);
  const [analytics, setAnalytics] = useState<BillingAnalytics | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected modals
  const [selectedInvoice, setSelectedInvoice] = useState<EnterpriseInvoice | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<ProfessionalReceipt | null>(null);
  const [verifyQrCode, setVerifyQrCode] = useState<string | null>(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  useEffect(() => {
    fetchBillingData();
  }, [businessId]);

  const fetchBillingData = async () => {
    setLoading(true);
    try {
      const [invList, rcpList, stats] = await Promise.all([
        billingService.getBusinessInvoices(businessId),
        billingService.getBusinessReceipts(businessId),
        billingService.getBillingAnalytics(businessId)
      ]);
      setInvoices(invList);
      setReceipts(rcpList);
      setAnalytics(stats);
    } catch (err) {
      console.error('Failed fetching billing data', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    searchQuery === '' ||
    inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.buyer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredReceipts = receipts.filter(rcp => 
    searchQuery === '' ||
    rcp.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rcp.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rcp.buyerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <FileText className="w-6 h-6 text-indigo-400" />
            <span>Enterprise Billing & Receipts</span>
          </h2>
          <p className="text-xs text-slate-400 font-medium">Official invoice ledger, transaction receipts, and cryptographic QR verification.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setIsVerifyModalOpen(true)}
            className="px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-indigo-400 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all"
          >
            <QrCode className="w-4 h-4" />
            <span>Verify QR Token</span>
          </button>

          <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800">
            <button 
              onClick={() => setActiveSubTab('invoices')}
              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeSubTab === 'invoices' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tax Invoices ({invoices.length})
            </button>
            <button 
              onClick={() => setActiveSubTab('receipts')}
              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeSubTab === 'receipts' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              Payment Receipts ({receipts.length})
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-3xl">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Invoiced Volume</span>
          </div>
          <p className="text-2xl font-black text-white">{(analytics?.totalInvoicedAmount || 0).toFixed(1)} Pi</p>
          <p className="text-[10px] text-slate-500 mt-1">{analytics?.totalInvoicesCount || 0} Total Issued</p>
        </div>

        <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-3xl">
          <div className="flex items-center gap-2 mb-2">
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cleared Receipts</span>
          </div>
          <p className="text-2xl font-black text-white">{(analytics?.totalReceiptAmount || 0).toFixed(1)} Pi</p>
          <p className="text-[10px] text-slate-500 mt-1">{analytics?.totalReceiptsCount || 0} Cleared Receipts</p>
        </div>

        <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-3xl">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">BMP Rewards Issued</span>
          </div>
          <p className="text-2xl font-black text-amber-400">+{analytics?.bmpRewardsIssued || 0} BMP</p>
          <p className="text-[10px] text-slate-500 mt-1">Reward Ledger Active</p>
        </div>

        <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-3xl">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-violet-400" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">QR Ledger Verifications</span>
          </div>
          <p className="text-2xl font-black text-emerald-400">100% Valid</p>
          <p className="text-[10px] text-slate-500 mt-1">Cryptographic Proof</p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by invoice #, order #, or buyer name..."
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none transition-all"
        />
      </div>

      {/* Tables Section */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto" />
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest animate-pulse">Syncing Billing Ledger...</p>
        </div>
      ) : activeSubTab === 'invoices' ? (
        <div className="bg-slate-900/30 border border-slate-800 rounded-[2.5rem] overflow-hidden">
          {filteredInvoices.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-slate-700" />
              <p className="text-sm font-bold text-white mb-1">No Invoices Found</p>
              <p className="text-xs">Invoices are automatically generated when enterprise orders are placed.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <th className="p-5">Invoice Ref</th>
                    <th className="p-5">Order #</th>
                    <th className="p-5">Buyer</th>
                    <th className="p-5">Grand Total</th>
                    <th className="p-5">Status</th>
                    <th className="p-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-xs">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.invoiceId} className="hover:bg-slate-900/50 transition-colors">
                      <td className="p-5 font-bold font-mono text-white">{inv.invoiceNumber}</td>
                      <td className="p-5 font-mono text-slate-300">#{inv.orderNumber}</td>
                      <td className="p-5 font-bold text-slate-300">{inv.buyer.name}</td>
                      <td className="p-5 font-black text-indigo-400">{inv.summary.grandTotal.toFixed(2)} Pi</td>
                      <td className="p-5">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                          inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-5 text-right space-x-2">
                        <button 
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                        >
                          View Invoice
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-900/30 border border-slate-800 rounded-[2.5rem] overflow-hidden">
          {filteredReceipts.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <Receipt className="w-12 h-12 mx-auto mb-3 text-slate-700" />
              <p className="text-sm font-bold text-white mb-1">No Receipts Found</p>
              <p className="text-xs">Settlement receipts are generated upon successful Pi payment processing.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <th className="p-5">Receipt Ref</th>
                    <th className="p-5">Order #</th>
                    <th className="p-5">Buyer</th>
                    <th className="p-5">Amount Paid</th>
                    <th className="p-5">BMP Reward</th>
                    <th className="p-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-xs">
                  {filteredReceipts.map((rcp) => (
                    <tr key={rcp.receiptId} className="hover:bg-slate-900/50 transition-colors">
                      <td className="p-5 font-bold font-mono text-white">{rcp.receiptNumber}</td>
                      <td className="p-5 font-mono text-slate-300">#{rcp.orderNumber}</td>
                      <td className="p-5 font-bold text-slate-300">{rcp.buyerName}</td>
                      <td className="p-5 font-black text-emerald-400">{rcp.amountPaid.toFixed(2)} Pi</td>
                      <td className="p-5 font-bold text-violet-400">+{rcp.bmpRewardCredited} BMP</td>
                      <td className="p-5 text-right space-x-2">
                        <button 
                          onClick={() => setSelectedReceipt(rcp)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                        >
                          View Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Invoice Modal */}
      {selectedInvoice && (
        <EnterpriseInvoiceModal 
          invoice={selectedInvoice} 
          onClose={() => setSelectedInvoice(null)} 
          onVerifyQr={(code) => {
            setSelectedInvoice(null);
            setVerifyQrCode(code);
            setIsVerifyModalOpen(true);
          }}
        />
      )}

      {/* Receipt Modal */}
      {selectedReceipt && (
        <ProfessionalReceiptModal 
          receipt={selectedReceipt} 
          onClose={() => setSelectedReceipt(null)} 
          onVerifyQr={(code) => {
            setSelectedReceipt(null);
            setVerifyQrCode(code);
            setIsVerifyModalOpen(true);
          }}
        />
      )}

      {/* Verification Modal */}
      {isVerifyModalOpen && (
        <QRVerificationModal 
          initialCode={verifyQrCode || ''} 
          onClose={() => {
            setIsVerifyModalOpen(false);
            setVerifyQrCode(null);
          }} 
        />
      )}
    </div>
  );
};
