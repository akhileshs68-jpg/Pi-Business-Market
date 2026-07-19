/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  CreditCard,
  ShieldCheck,
  Truck,
  Download,
  CheckCircle,
  Clock,
  Wallet,
  AlertTriangle,
  RefreshCw,
  Cpu,
  Database,
  Lock,
  Compass
} from 'lucide-react';
import { Product, ShippingAddress, OrderStatus } from '../types';
import { PiSdkSim } from '../services/piSdk';
import { PiBusinessMarketDB } from '../services/storage';

interface CheckoutItem {
  product: Product;
  quantity: number;
  selectedAttributes: Record<string, string>;
}

interface CheckoutModalProps {
  items: CheckoutItem[];
  currentUser: { uid: string; username: string; walletAddress: string };
  onClose: () => void;
  onPaymentSuccess: (walletBalance: number) => void;
}

export default function CheckoutModal({
  items,
  currentUser,
  onClose,
  onPaymentSuccess
}: CheckoutModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Shipping/Sum, 2: Pi Wallet sign-off, 3: Success
  const [fullName, setFullName] = useState('Alex Mercer');
  const [streetAddress, setStreetAddress] = useState('128 Mission Street');
  const [city, setCity] = useState('San Francisco');
  const [state, setState] = useState('California');
  const [postalCode, setPostalCode] = useState('94103');
  const [country, setCountry] = useState('United States');
  const [phoneNumber, setPhoneNumber] = useState('+1 (415) 555-2671');
  const [notes, setNotes] = useState('');

  // Wallet simulation states
  const [walletStatus, setWalletStatus] = useState<'idle' | 'authorizing' | 'nodes_polling' | 'failed'>('idle');
  const [txLog, setTxLog] = useState<string[]>([]);
  const [confirmedTxId, setConfirmedTxId] = useState('');
  const [confirmedOrderId, setConfirmedOrderId] = useState('');
  const [walletError, setWalletError] = useState('');

  const isDigitalOnly = items.every(item => item.product.isDigital);
  const totalPi = items.reduce((sum, item) => sum + item.product.pricePi * item.quantity, 0);

  const handleNextToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleExecutePayment = () => {
    setWalletStatus('authorizing');
    setWalletError('');
    setTxLog(['Initiating secure connection with Pi Browser Wallet...']);

    // Run simulated blockchain checks
    const logs = [
      'Authenticating cryptographic non-custodial signatures...',
      'Checking available ledger wallet balances...',
      'Polling decentralized validator nodes...',
      'Consensus validated on Block #428905!',
      'Executing peer-to-peer escrow payment locks...',
      'Transaction approved successfully!'
    ];

    const runLogs = (idx: number) => {
      if (idx < logs.length) {
        setTimeout(() => {
          setTxLog(prev => [...prev, logs[idx]]);
          if (idx === 2) {
            setWalletStatus('nodes_polling');
          }
          runLogs(idx + 1);
        }, 800);
      } else {
        // Complete checkout database write
        setTimeout(() => {
          const storeId = items[0].product.storeId;
          const storeName = items[0].product.storeName;

          const shippingAddr: ShippingAddress | undefined = isDigitalOnly ? undefined : {
            fullName,
            streetAddress,
            city,
            state,
            postalCode,
            country,
            phoneNumber
          };

          // SDK Simulated Call
          PiSdkSim.executePayment({
            amount: totalPi,
            memo: `Pi Business Market purchase: ${items.map(i => i.product.title).join(', ')}`,
            metadata: {
              storeId,
              productId: items[0].product.id,
              itemsCount: items.length
            }
          }, {
            onReadyForServerApproval: (paymentId) => {
              console.log('[Checkout] Approved by Pi Core. PaymentID:', paymentId);
            },
            onReadyForServerCompletion: (paymentId, txid) => {
              setConfirmedTxId(txid);

              // Write to Repository
              const order = PiBusinessMarketDB.createOrder({
                storeId,
                storeName,
                buyerUid: currentUser.uid,
                buyerUsername: currentUser.username,
                items: items.map(i => ({
                  productId: i.product.id,
                  title: i.product.title,
                  pricePi: i.product.pricePi,
                  quantity: i.quantity,
                  imageUrl: i.product.imageUrls[0],
                  selectedAttributes: i.selectedAttributes
                })),
                totalPi,
                status: OrderStatus.PREPARING,
                shippingAddress: shippingAddr,
                blockchainTxId: txid,
                notes: notes || undefined,
                isDigital: isDigitalOnly
              });

              setConfirmedOrderId(order.id);
              setStep(3);
              onPaymentSuccess(PiSdkSim.getBalance());
            },
            onCancel: () => {
              setWalletStatus('idle');
              setWalletError('Payment was cancelled by user.');
            },
            onError: (err) => {
              setWalletStatus('failed');
              setWalletError(err.message);
            }
          });
        }, 600);
      }
    };

    runLogs(0);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl animate-fade-in text-left">
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-800/85 flex items-center justify-between sticky top-0 bg-slate-900 z-10 select-none">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-violet-400" />
            {step === 1 ? 'Order Checkout Details' : step === 2 ? 'Authorize Pi Payout' : 'Payment Completed!'}
          </h3>
          {step !== 3 && (
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ==============================================
            STEP 1: SHIPPING & ITEMS SUMMARY
            ============================================== */}
        {step === 1 && (
          <form onSubmit={handleNextToPayment} className="p-6 space-y-5">
            
            {/* ITEMS SUMMARY PANEL */}
            <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 space-y-3">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Shopping Bag Summary</span>
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">{item.product.title}</span>
                    <span className="text-slate-500">×{item.quantity}</span>
                  </div>
                  <span className="font-mono text-slate-400 font-semibold">{item.product.pricePi * item.quantity} π</span>
                </div>
              ))}
              <div className="border-t border-slate-800 pt-2.5 mt-2.5 flex justify-between items-baseline select-none">
                <span className="text-xs font-bold text-slate-400">Total Purchase Price</span>
                <span className="text-lg font-mono font-bold text-violet-400">
                  {totalPi.toFixed(2)} π
                </span>
              </div>
            </div>

            {/* SHIPPING ADDRESS PANEL */}
            {!isDigitalOnly ? (
              <div className="space-y-3.5">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Logistics Shipping Coordinates</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full text-xs border border-slate-800 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500 bg-slate-950 text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Mobile Telephone *</label>
                    <input
                      type="text"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full text-xs border border-slate-800 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500 bg-slate-950 text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Street Address *</label>
                  <input
                    type="text"
                    required
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    className="w-full text-xs border border-slate-800 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500 bg-slate-950 text-slate-200"
                    placeholder="App, suite, street name"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full text-xs border border-slate-800 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500 bg-slate-950 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Zip Code *</label>
                    <input
                      type="text"
                      required
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full text-xs border border-slate-800 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500 bg-slate-950 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Country *</label>
                    <input
                      type="text"
                      required
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full text-xs border border-slate-800 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500 bg-slate-950 text-slate-200"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex gap-3 text-slate-300 text-xs">
                <Download className="w-5 h-5 text-emerald-450 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-emerald-400 block mb-0.5">Instant Virtual Delivery Protocol</span>
                  This transaction consists strictly of digital items. All file download coordinates will activate on this page immediately upon payment consensus confirmation.
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">Fulfillment instructions or notes (Optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs border border-slate-800 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500 bg-slate-950 text-slate-200"
                placeholder="e.g. Leave package by side gate, or digital email handle"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              Authorize Pi Payment
              <CreditCard className="w-4 h-4 text-violet-300" />
            </button>
          </form>
        )}

        {/* ==============================================
            STEP 2: PI WALLET AUTHORIZER (SANDBOX INTERACTIVE)
            ============================================== */}
        {step === 2 && (
          <div className="p-6 space-y-6 select-none text-center">
            
            {walletStatus === 'idle' && (
              <div className="space-y-6">
                <div className="w-14 h-14 bg-violet-500/10 rounded-2xl flex items-center justify-center text-violet-400 mx-auto border border-violet-500/20">
                  <Wallet className="w-7 h-7" />
                </div>
                
                <div>
                  <h4 className="text-base font-bold text-slate-200">Sign Blockchain Transaction</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-normal">
                    Secure Web3 portal. Approve the payment signature of **{totalPi.toFixed(2)} Pi** using sandbox tokens.
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 max-w-sm mx-auto space-y-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Platform Service Charge</span>
                    <span className="font-mono font-semibold text-slate-300">0.00 π</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Est. Consensus Gas Fees</span>
                    <span className="font-mono font-semibold text-slate-300">~0.01 π</span>
                  </div>
                  <div className="border-t border-slate-800 pt-2 flex justify-between text-xs font-bold text-slate-300">
                    <span>Authorized Sum</span>
                    <span className="font-mono text-violet-400">{totalPi.toFixed(2)} π</span>
                  </div>
                </div>

                {walletError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2 max-w-sm mx-auto font-medium">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{walletError}</span>
                  </div>
                )}

                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setStep(1)}
                    className="px-5 py-2.5 border border-slate-800 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800 transition-all cursor-pointer bg-slate-950"
                  >
                    Go Back
                  </button>
                  <button
                    onClick={handleExecutePayment}
                    className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
                  >
                    Confirm Payout
                  </button>
                </div>
              </div>
            )}

            {/* BLOCKCHAIN POLLING OVERLAY COVERS */}
            {(walletStatus === 'authorizing' || walletStatus === 'nodes_polling') && (
              <div className="space-y-6">
                <div className="w-16 h-16 bg-violet-950/40 border border-violet-500/20 rounded-full flex items-center justify-center mx-auto relative">
                  <Cpu className="w-6 h-6 text-violet-400 animate-pulse" />
                  <div className="absolute inset-0 rounded-full border-2 border-violet-500 border-t-transparent animate-spin"></div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-200 animate-pulse">
                    {walletStatus === 'nodes_polling' ? 'Confirming Ledger Nodes Consensus' : 'Establishing Secure Wallet Node Bridge'}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                    Do not close your Pi Browser. Mining validation logs executing in sandbox environment below.
                  </p>
                </div>

                {/* CONSENSUS LOGS BOX */}
                <div className="bg-slate-950 rounded-2xl p-4 max-w-sm mx-auto font-mono text-[10px] text-slate-300 text-left space-y-2 max-h-44 overflow-y-auto leading-relaxed border border-slate-850">
                  {txLog.map((log, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-violet-500 font-bold">»</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==============================================
            STEP 3: DECENTRALIZED RECEIPT & DOWNLOADS
            ============================================== */}
        {step === 3 && (
          <div className="p-8 text-center space-y-6 select-none animate-fade-in">
            <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-450 mx-auto border border-emerald-500/20">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-lg font-bold text-slate-100">Transaction Cleared Successfully!</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-sm mx-auto">
                Your payment of **{totalPi.toFixed(2)} Pi** has been successfully written to the sandbox blockchain ledger. The merchant has been notified.
              </p>
            </div>

            {/* RECEIPT METADATA CARD */}
            <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 text-left max-w-md mx-auto space-y-2.5 text-xs text-slate-400">
              <div className="flex justify-between items-center">
                <span>Verification Order ID:</span>
                <span className="font-mono font-bold text-slate-200 select-all">{confirmedOrderId}</span>
              </div>
              <div className="flex justify-between items-start gap-1">
                <span>Blockchain Tx Hash:</span>
                <span className="font-mono text-slate-500 select-all truncate block max-w-[200px]">{confirmedTxId}</span>
              </div>
              <div className="border-t border-slate-800 pt-2.5 mt-2.5">
                <span className="font-bold text-slate-300 block mb-1">Fulfillment Parameters</span>
                {isDigitalOnly ? (
                  <p className="text-[11px] text-emerald-400 bg-emerald-500/10 p-2.5 border border-emerald-500/20 rounded-lg">
                    ✓ Access codes verified. You can find downloading targets below or inside your personal orders dashboard.
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    The merchant is packing your physical products. Check the **Orders Tracking** page to follow active logistics nodes.
                  </p>
                )}
              </div>
            </div>

            {/* DIGITAL PRODUCT DOWNLOADS */}
            {isDigitalOnly && (
              <div className="max-w-md mx-auto">
                {items.map((item, idx) => (
                  <a
                    key={idx}
                    href={item.product.downloadUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md mb-2 block text-center"
                  >
                    <Download className="w-4 h-4 inline-block mr-1" />
                    <span>Download: {item.product.title}</span>
                  </a>
                ))}
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-xs transition-all max-w-md mx-auto block cursor-pointer shadow-md"
            >
              Continue Exploring
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
