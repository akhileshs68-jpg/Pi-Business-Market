/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Hammer,
  Briefcase,
  CreditCard,
  Lock,
  RefreshCw,
  CheckCircle,
  Calendar,
  TrendingUp,
  Coins,
  AlertTriangle,
  FileText,
  QrCode,
  Shield,
  Activity,
  UserCheck,
  Compass,
  Trash2,
  Plus,
  Minus,
  Clock,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  X,
  FileCheck,
  Heart
} from 'lucide-react';
import { User, Product, Order, OrderStatus } from '../types';

interface CommerceEngineProps {
  currentUser: User;
  onNavigate: (view: string, params?: any) => void;
}

// Immutable ledger record schema
interface LedgerEntry {
  id: string;
  timestamp: string;
  type: 'PAYMENT' | 'ESCROW_LOCK' | 'ESCROW_RELEASE' | 'REFUND' | 'SETTLEMENT' | 'DISPUTE_HOLD' | 'ADJUSTMENT';
  amountPi: number;
  fromAddress: string;
  toAddress: string;
  status: 'SUCCESS' | 'PENDING' | 'REJECTED';
  referenceId: string; // Order / Booking / Contract ID
  memo: string;
}

// Service booking slot schema
interface ServiceBooking {
  id: string;
  serviceId: string;
  serviceTitle: string;
  providerName: string;
  pricePi: number;
  dateTime: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'COMPLETED' | 'CANCELLED';
  clientNotes: string;
}

// Job contract schema
interface JobContract {
  id: string;
  jobId: string;
  title: string;
  companyName: string;
  salaryPi: number;
  status: 'OFFER' | 'ACCEPTED' | 'INTERVIEWING' | 'REJECTED' | 'COMPLETED_PAYMENT_RELEASED';
  milestones: { name: string; amountPi: number; completed: boolean }[];
  candidateName: string;
}

// Wishlist & Save For Later item schema
interface CartItemDetail {
  id: string;
  type: 'product' | 'service';
  title: string;
  pricePi: number;
  quantity: number;
  imageUrl: string;
  selectedVariant?: string;
  merchantNotes?: string;
  merchantId: string;
  merchantName: string;
}

export default function CommerceEngine({ currentUser, onNavigate }: CommerceEngineProps) {
  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState<'cart_checkout' | 'orders_contracts' | 'escrow_settlement' | 'ledger_analytics' | 'specs_sandbox'>('specs_sandbox');

  // Network Selection
  const [isMainnet, setIsMainnet] = useState<boolean>(false);

  // Security Simulator States
  const [doubleSpendingShield, setDoubleSpendingShield] = useState<boolean>(true);
  const [priceIntegrityShield, setPriceIntegrityShield] = useState<boolean>(true);
  const [botShield, setBotShield] = useState<boolean>(true);
  const [tenantCheck, setTenantCheck] = useState<boolean>(true);

  // Shopping Cart & Wishlist Local States
  const [cart, setCart] = useState<CartItemDetail[]>([
    {
      id: 'prod_alpha',
      type: 'product',
      title: 'PiNode Elite Plug-and-Play Validator',
      pricePi: 45.0,
      quantity: 1,
      imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=60',
      selectedVariant: 'Pro Rackmount 2TB',
      merchantNotes: 'Deliver via verified secure post',
      merchantId: 'merchant_tech_owner',
      merchantName: 'Satoshi Gadgets'
    },
    {
      id: 'srv_beta',
      type: 'service',
      title: 'Smart Contract Audit & Optimization',
      pricePi: 15.0,
      quantity: 1,
      imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop&q=60',
      selectedVariant: 'Standard 3-Days turnaround',
      merchantNotes: 'Need detailed gas reporting',
      merchantId: 'pioneer_freelancer',
      merchantName: 'Alex Rivera'
    }
  ]);

  const [wishlist, setWishlist] = useState<CartItemDetail[]>([
    {
      id: 'prod_gamma',
      type: 'product',
      title: 'Decentralized Merchant Terminals',
      pricePi: 22.5,
      quantity: 1,
      imageUrl: 'https://images.unsplash.com/photo-1556742044-3c52d6e88c62?w=500&auto=format&fit=crop&q=60',
      merchantId: 'merchant_tech_owner',
      merchantName: 'Satoshi Gadgets'
    }
  ]);

  // Temporary Inputs
  const [merchantNotes, setMerchantNotes] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<string>('Standard');

  // Checkout Engine Processing States
  const [checkoutStep, setCheckoutStep] = useState<'idle' | 'validating' | 'authorized' | 'completed' | 'failed'>('idle');
  const [validationLogs, setValidationLogs] = useState<string[]>([]);
  const [priceTampered, setPriceTampered] = useState<boolean>(false);
  const [checkoutError, setCheckoutError] = useState<string>('');

  // QR Codes & Invoices States
  const [qrType, setQrType] = useState<'dynamic' | 'static' | 'invoice'>('dynamic');
  const [invoiceAmount, setInvoiceAmount] = useState<string>('5.0');
  const [qrCodeData, setQrCodeData] = useState<string>('');

  // Orders lists & statuses
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 'order_pi_9901',
      storeId: 'store_tech_hub',
      storeName: 'Satoshi Gadgets',
      buyerUid: currentUser.uid,
      buyerUsername: currentUser.username,
      items: [
        {
          productId: 'prod_alpha',
          title: 'PiNode Elite Plug-and-Play Validator',
          pricePi: 45.0,
          quantity: 1,
          imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=60',
          selectedAttributes: { 'Model': 'Pro Rackmount' }
        }
      ],
      totalPi: 45.0,
      status: OrderStatus.PAID_VERIFYING,
      createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
      blockchainTxId: 'pi_tx_hash_8849201a9df280cd7a911e',
      isDigital: false,
      notes: 'Please double-check shipment validation'
    }
  ]);

  // Bookings list
  const [bookings, setBookings] = useState<ServiceBooking[]>([
    {
      id: 'book_8291',
      serviceId: 'srv_beta',
      serviceTitle: 'Smart Contract Audit & Optimization',
      providerName: 'Alex Rivera',
      pricePi: 15.0,
      dateTime: '2026-07-22 14:00',
      status: 'PENDING_APPROVAL',
      clientNotes: 'Review our liquidity pool locking function'
    }
  ]);

  // Job applications / Contracts
  const [contracts, setContracts] = useState<JobContract[]>([
    {
      id: 'job_ctr_2241',
      jobId: 'job_web3_dev',
      title: 'Lead Solona / Pi-Core Developer',
      companyName: 'Pi Global Ventures',
      salaryPi: 125.0,
      status: 'OFFER',
      milestones: [
        { name: 'Milestone 1: Repository setup and auth flow', amountPi: 25.0, completed: true },
        { name: 'Milestone 2: Escrow ledger setup and test execution', amountPi: 50.0, completed: false },
        { name: 'Milestone 3: Mainnet production test delivery', amountPi: 50.0, completed: false }
      ],
      candidateName: currentUser.displayName || 'Pioneer User'
    }
  ]);

  // Settlement Balance tracking for active Merchant user
  const [settlement, setSettlement] = useState({
    pendingPi: 85.0,
    availablePi: 110.5,
    releasedPi: 450.0,
    feeRate: 0.015, // 1.5% platform fee
    history: [
      { id: 'set_8849', amountPi: 120.0, timestamp: '2026-07-16 09:30', status: 'COMPLETED', txHash: 'pi_tx_set_094a821' },
      { id: 'set_8811', amountPi: 45.0, timestamp: '2026-07-12 11:20', status: 'COMPLETED', txHash: 'pi_tx_set_084f10a' }
    ]
  });

  // Escrow protection state
  const [escrowLedger, setEscrowLedger] = useState<Array<{
    id: string;
    orderId: string;
    buyerAddress: string;
    merchantAddress: string;
    amountPi: number;
    protectionType: 'BUYER_SHIELD' | 'MERCHANT_SHIELD';
    milestoneSplit: string;
    status: 'LOCKED' | 'RELEASED' | 'DISPUTED_HOLD';
    autoReleaseTime: string;
  }>>([
    {
      id: 'escrow_pi_4431',
      orderId: 'order_pi_9901',
      buyerAddress: currentUser.walletAddress,
      merchantAddress: 'GBATECHHUB784632QYJ7LURPH6V77JHYX345PPONNFFVVZZ44S',
      amountPi: 45.0,
      protectionType: 'BUYER_SHIELD',
      milestoneSplit: '100% Release on Delivery',
      status: 'LOCKED',
      autoReleaseTime: '2026-07-25 18:20'
    }
  ]);

  // Immutable Ledger Store
  const [ledger, setLedger] = useState<LedgerEntry[]>([
    {
      id: 'tx_ledg_1001',
      timestamp: '2026-07-18 02:15:33',
      type: 'PAYMENT',
      amountPi: 45.0,
      fromAddress: currentUser.walletAddress,
      toAddress: 'GBATECHHUB784632QYJ7LURPH6V77JHYX345PPONNFFVVZZ44S',
      status: 'SUCCESS',
      referenceId: 'order_pi_9901',
      memo: 'Order payment for PiNode Elite Validator'
    },
    {
      id: 'tx_ledg_1002',
      timestamp: '2026-07-18 02:15:34',
      type: 'ESCROW_LOCK',
      amountPi: 45.0,
      fromAddress: 'GBATECHHUB784632QYJ7LURPH6V77JHYX345PPONNFFVVZZ44S',
      toAddress: 'SYSTEM_ESCROW_VAULT_P2P',
      status: 'SUCCESS',
      referenceId: 'order_pi_9901',
      memo: 'Locking funds under buyer protection protocol'
    }
  ]);

  // Notifications
  const [notifications, setNotifications] = useState<Array<{ id: string, title: string, body: string, time: string, type: string }>>([
    { id: 'not_1', title: 'Payment Lock Complete 🔐', body: '45.0 Pi successfully locked in escrow for order #9901', time: '4 hours ago', type: 'escrow' },
    { id: 'not_2', title: 'New Job Contract Offer 🚀', body: 'Pi Global Ventures offered you a contract with 125 Pi milestone potential', time: '1 day ago', type: 'job' }
  ]);

  // Dynamic QR Code generation helper
  useEffect(() => {
    const totalAmount = cart.reduce((sum, item) => sum + item.pricePi * item.quantity, 0).toFixed(2);
    const host = isMainnet ? 'mainnet' : 'testnet';
    if (qrType === 'dynamic') {
      setQrCodeData(`pi://${host}/pay?recipient=${currentUser.walletAddress}&amount=${totalAmount}&memo=MixedCartPurchase&ref=pi_mkt_cart`);
    } else if (qrType === 'static') {
      setQrCodeData(`pi://${host}/pay?recipient=${currentUser.walletAddress}&memo=MerchantDirect`);
    } else {
      setQrCodeData(`pi://${host}/pay?recipient=${currentUser.walletAddress}&amount=${parseFloat(invoiceAmount || '0').toFixed(2)}&memo=InvoicePay&ref=inv_9422`);
    }
  }, [qrType, invoiceAmount, cart, isMainnet]);

  // Cart operations
  const updateCartQty = (id: string, diff: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + diff);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const saveForLater = (item: CartItemDetail) => {
    setWishlist(prev => [...prev, item]);
    removeFromCart(item.id);
  };

  const moveToCart = (item: CartItemDetail) => {
    setCart(prev => [...prev, item]);
    setWishlist(prev => prev.filter(w => w.id !== item.id));
  };

  // Secure Checkout pipeline
  const executeSecureCheckout = () => {
    if (cart.length === 0) return;

    setCheckoutStep('validating');
    setCheckoutError('');
    setValidationLogs(['Initializing secure checkout engine pipeline...', 'Checking ledger communication status...']);

    const pipeline = [
      { text: 'Validating Pi Mainnet/Testnet wallet environment matching...', secCheck: true },
      { text: 'Verifying merchant account credibility & active business license...', secCheck: true },
      { text: 'Performing inventory checks & capacity matching metrics...', secCheck: true },
      { text: 'Auditing price integrity vectors (Anti-Tampering Checks)...', secCheck: true },
      { text: 'Checking for duplicate payment attempts & active double-spending states...', secCheck: true },
      { text: 'Scanning client trust score metrics & credential checks...', secCheck: true },
      { text: 'Hashing transaction payload with client anti-replay signature...', secCheck: true },
      { text: 'Securing P2P cryptographic escrow locking pathways...', secCheck: true }
    ];

    let logIndex = 0;
    const interval = setInterval(() => {
      if (logIndex < pipeline.length) {
        const check = pipeline[logIndex];
        
        // Anti-Tampering Check Simulation
        if (check.text.includes('price integrity') && priceIntegrityShield && priceTampered) {
          setValidationLogs(prev => [...prev, '🚨 SECURITY THREAT: Price tampering detected! Expected and real price mismatch.', 'Checkout pipeline aborted immediately.']);
          setCheckoutStep('failed');
          setCheckoutError('Security Integrity Error: Price mismatch detected during checkout. Reload catalog and try again.');
          clearInterval(interval);
          return;
        }

        // Double spending simulation
        if (check.text.includes('duplicate payment') && doubleSpendingShield && Math.random() < 0.05) {
          setValidationLogs(prev => [...prev, '🚨 DUPLICATE SYSTEM TRIGGER: Multi-tap identical checkout hash detected.', 'System prevented secondary tx replay attack successfully.']);
          setCheckoutStep('failed');
          setCheckoutError('Transaction Interrupted: Identical pending hash exists in node transaction queue.');
          clearInterval(interval);
          return;
        }

        setValidationLogs(prev => [...prev, `✓ [Secure Core] ${check.text}`]);
        logIndex++;
      } else {
        clearInterval(interval);
        
        // Success Checkout Execution
        const total = cart.reduce((sum, item) => sum + item.pricePi * item.quantity, 0);
        const orderId = `order_pi_${Math.floor(1000 + Math.random() * 9000)}`;
        const txHash = `pi_tx_hash_${Math.random().toString(16).substr(2, 22)}`;

        // Create Order object
        const newOrder: Order = {
          id: orderId,
          storeId: cart[0].merchantId,
          storeName: cart[0].merchantName,
          buyerUid: currentUser.uid,
          buyerUsername: currentUser.username,
          items: cart.map(c => ({
            productId: c.id,
            title: c.title,
            pricePi: c.pricePi,
            quantity: c.quantity,
            imageUrl: c.imageUrl,
            selectedAttributes: c.selectedVariant ? { 'Variant': c.selectedVariant } : {}
          })),
          totalPi: total,
          status: OrderStatus.PAID_VERIFYING,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          blockchainTxId: txHash,
          isDigital: cart.every(c => c.type === 'service')
        };

        // Add to orders
        setOrders(prev => [newOrder, ...prev]);

        // Lock in Escrow
        const escrowId = `escrow_pi_${Math.floor(1000 + Math.random() * 9000)}`;
        setEscrowLedger(prev => [{
          id: escrowId,
          orderId: orderId,
          buyerAddress: currentUser.walletAddress,
          merchantAddress: cart[0].merchantId === 'merchant_tech_owner' ? 'GBATECHHUB784632QYJ7LURPH6V77JHYX345PPONNFFVVZZ44S' : 'GBAPIONEERPROVIDER98348231',
          amountPi: total,
          protectionType: 'BUYER_SHIELD',
          milestoneSplit: '100% On Confirmation',
          status: 'LOCKED',
          autoReleaseTime: new Date(Date.now() + 7 * 24 * 3600 * 1000).toLocaleString()
        }, ...prev]);

        // Write to Immutable Ledger
        const ledg1: LedgerEntry = {
          id: `tx_ledg_${Math.floor(10000 + Math.random() * 90000)}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          type: 'PAYMENT',
          amountPi: total,
          fromAddress: currentUser.walletAddress,
          toAddress: cart[0].merchantId === 'merchant_tech_owner' ? 'GBATECHHUB784632QYJ7LURPH6V77JHYX345PPONNFFVVZZ44S' : 'GBAPIONEERPROVIDER98348231',
          status: 'SUCCESS',
          referenceId: orderId,
          memo: `Payment for Order #${orderId}`
        };

        const ledg2: LedgerEntry = {
          id: `tx_ledg_${Math.floor(10000 + Math.random() * 90000)}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          type: 'ESCROW_LOCK',
          amountPi: total,
          fromAddress: cart[0].merchantId === 'merchant_tech_owner' ? 'GBATECHHUB784632QYJ7LURPH6V77JHYX345PPONNFFVVZZ44S' : 'GBAPIONEERPROVIDER98348231',
          toAddress: 'SYSTEM_ESCROW_VAULT_P2P',
          status: 'SUCCESS',
          referenceId: orderId,
          memo: `Escrow hold for Order #${orderId}`
        };

        setLedger(prev => [ledg1, ledg2, ...prev]);

        // Trigger notifications
        setNotifications(prev => [
          {
            id: `not_${Date.now()}`,
            title: 'Payment Handshake Confirmed! 🛡️',
            body: `${total.toFixed(2)} Pi locked under transaction reference: ${txHash.substring(0, 12)}...`,
            time: 'Just now',
            type: 'payment'
          },
          {
            id: `not_${Date.now() + 1}`,
            title: 'Order Created successfully!',
            body: `Store has received Order #${orderId} and is preparing details.`,
            time: 'Just now',
            type: 'order'
          },
          ...prev
        ]);

        // Empty Cart
        setCart([]);
        setCheckoutStep('completed');
      }
    }, 450);
  };

  // Manage Order Life Cycle
  const advanceOrderStatus = (orderId: string, nextStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return { ...o, status: nextStatus, updatedAt: new Date().toISOString() };
      }
      return o;
    }));

    setNotifications(prev => [
      {
        id: `not_${Date.now()}`,
        title: `Order Status Shift 📦`,
        body: `Order #${orderId} has been updated to status: ${nextStatus.toUpperCase()}`,
        time: 'Just now',
        type: 'order'
      },
      ...prev
    ]);
  };

  // Escrow Fund Release
  const releaseEscrowFunds = (escrowId: string) => {
    setEscrowLedger(prev => prev.map(esc => {
      if (esc.id === escrowId) {
        // Complete settlement release update
        setSettlement(s => ({
          ...s,
          availablePi: s.availablePi + (esc.amountPi * (1 - s.feeRate)),
          releasedPi: s.releasedPi + esc.amountPi,
          pendingPi: Math.max(0, s.pendingPi - esc.amountPi)
        }));

        // Ledger Entry
        const lockReleaseTx: LedgerEntry = {
          id: `tx_ledg_${Math.floor(10000 + Math.random() * 90000)}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          type: 'ESCROW_RELEASE',
          amountPi: esc.amountPi,
          fromAddress: 'SYSTEM_ESCROW_VAULT_P2P',
          toAddress: esc.merchantAddress,
          status: 'SUCCESS',
          referenceId: esc.orderId,
          memo: `Escrow release approval for Order #${esc.orderId}`
        };
        setLedger(l => [lockReleaseTx, ...l]);

        setNotifications(n => [
          {
            id: `not_${Date.now()}`,
            title: 'Escrow Released Successfully! 🔓',
            body: `Locked funds of ${esc.amountPi} Pi have been released and cleared to merchant balance.`,
            time: 'Just now',
            type: 'escrow'
          },
          ...n
        ]);

        return { ...esc, status: 'RELEASED' };
      }
      return esc;
    }));
  };

  // Put Escrow on dispute hold
  const disputeEscrowFunds = (escrowId: string) => {
    setEscrowLedger(prev => prev.map(esc => {
      if (esc.id === escrowId) {
        // Log to ledger
        const disputeTx: LedgerEntry = {
          id: `tx_ledg_${Math.floor(10000 + Math.random() * 90000)}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          type: 'DISPUTE_HOLD',
          amountPi: esc.amountPi,
          fromAddress: 'SYSTEM_ESCROW_VAULT_P2P',
          toAddress: 'DISPUTE_RESOLUTION_HOLD',
          status: 'SUCCESS',
          referenceId: esc.orderId,
          memo: `Dispute hold applied. Release blocked pending compliance audit.`
        };
        setLedger(l => [disputeTx, ...l]);

        setNotifications(n => [
          {
            id: `not_${Date.now()}`,
            title: 'Dispute Lock Activated ⚠️',
            body: `Funds for Order #${esc.orderId} are temporarily frozen pending resolution.`,
            time: 'Just now',
            type: 'escrow'
          },
          ...n
        ]);

        return { ...esc, status: 'DISPUTED_HOLD' };
      }
      return esc;
    }));
  };

  // Refund Processor
  const processRefund = (orderId: string, amount: number, type: 'full' | 'partial') => {
    const refundId = `ref_pi_${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Add Ledger Event
    const refundTx: LedgerEntry = {
      id: `tx_ledg_${Math.floor(10000 + Math.random() * 90000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      type: 'REFUND',
      amountPi: amount,
      fromAddress: 'SYSTEM_ESCROW_VAULT_P2P',
      toAddress: currentUser.walletAddress,
      status: 'SUCCESS',
      referenceId: orderId,
      memo: `P2P Protective Refund processed for order #${orderId}`
    };

    setLedger(prev => [refundTx, ...prev]);

    // Update Order Status
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return { ...o, status: OrderStatus.CANCELLED, updatedAt: new Date().toISOString() };
      }
      return o;
    }));

    // Release settlement pending balance
    setSettlement(s => ({
      ...s,
      pendingPi: Math.max(0, s.pendingPi - amount)
    }));

    setNotifications(prev => [
      {
        id: `not_${Date.now()}`,
        title: `Refund Dispatched 💸`,
        body: `A protective refund of ${amount} Pi was returned safely to your verified wallet.`,
        time: 'Just now',
        type: 'refund'
      },
      ...prev
    ]);
  };

  // Service Booking Operations
  const createServiceBooking = () => {
    const bookingId = `book_${Math.floor(1000 + Math.random() * 9000)}`;
    const newBooking: ServiceBooking = {
      id: bookingId,
      serviceId: 'srv_beta',
      serviceTitle: 'On-site Fiber Network Calibration',
      providerName: 'Alex Rivera',
      pricePi: 20.0,
      dateTime: '2026-07-25 10:00 AM',
      status: 'PENDING_APPROVAL',
      clientNotes: 'Bring diagnostic transceivers'
    };

    setBookings(prev => [newBooking, ...prev]);
    setNotifications(prev => [
      {
        id: `not_${Date.now()}`,
        title: 'Booking Request Forwarded 🗓️',
        body: 'Your service slot has been submitted for provider approval.',
        time: 'Just now',
        type: 'booking'
      },
      ...prev
    ]);
  };

  const approveBooking = (id: string) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'APPROVED' } : b));
    setNotifications(prev => [
      {
        id: `not_${Date.now()}`,
        title: 'Booking Approved! ✅',
        body: 'Provider approved schedule. Service slot confirmed on blockchain ledger.',
        time: 'Just now',
        type: 'booking'
      },
      ...prev
    ]);
  };

  // Job Milestone Release Contract Operations
  const releaseContractMilestone = (contractId: string, milestoneIdx: number) => {
    setContracts(prev => prev.map(ctr => {
      if (ctr.id === contractId) {
        const milestones = [...ctr.milestones];
        if (milestones[milestoneIdx].completed) return ctr;

        milestones[milestoneIdx].completed = true;
        const amount = milestones[milestoneIdx].amountPi;

        // Ledger write
        const releaseTx: LedgerEntry = {
          id: `tx_ledg_${Math.floor(10000 + Math.random() * 90000)}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          type: 'PAYMENT',
          amountPi: amount,
          fromAddress: 'GBATECHHUB784632QYJ7LURPH6V77JHYX345PPONNFFVVZZ44S',
          toAddress: currentUser.walletAddress,
          status: 'SUCCESS',
          referenceId: contractId,
          memo: `Milestone release: ${milestones[milestoneIdx].name}`
        };
        setLedger(l => [releaseTx, ...l]);

        // Send notifications
        setNotifications(prev => [
          {
            id: `not_${Date.now()}`,
            title: 'Milestone Funds Released 💼',
            body: `You received ${amount} Pi for completing: ${milestones[milestoneIdx].name}`,
            time: 'Just now',
            type: 'job'
          },
          ...prev
        ]);

        const allDone = milestones.every(m => m.completed);
        return {
          ...ctr,
          milestones,
          status: allDone ? 'COMPLETED_PAYMENT_RELEASED' : ctr.status
        };
      }
      return ctr;
    }));
  };

  return (
    <div className="bg-slate-950 text-slate-100 rounded-2xl border border-slate-800/80 shadow-2xl p-6 relative overflow-hidden select-none animate-fade-in" id="commerce_engine_root">
      
      {/* SHIMMER GLOW */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-600/5 blur-[120px] rounded-full pointer-events-none"></div>

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-800/80 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] uppercase font-mono tracking-widest px-2.5 py-1 rounded-full border border-emerald-500/20 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
              Enterprise Module v1.0
            </span>
            <span className="text-slate-500 text-[10px] font-mono">Blocks Confirmed: 842,905</span>
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Coins className="w-6 h-6 text-emerald-400" />
            Enterprise Pi Commerce Engine
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            P2P settlement infrastructure, multi-currency escrow protection, dynamic invoicing, and robust fraud defense.
          </p>
        </div>

        {/* NETWORK & WALLET STATUS PANEL */}
        <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex items-center gap-4 text-xs">
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-500 uppercase tracking-wider font-mono">Current Chain Network</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <button
                onClick={() => setIsMainnet(false)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${!isMainnet ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-950 text-slate-500 hover:text-slate-300'}`}
              >
                Testnet
              </button>
              <button
                onClick={() => setIsMainnet(true)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${isMainnet ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-950 text-slate-500 hover:text-slate-300'}`}
              >
                Mainnet
              </button>
            </div>
          </div>
          
          <div className="w-px h-8 bg-slate-800"></div>

          <div className="text-left font-mono">
            <span className="text-[9px] text-slate-500 block uppercase tracking-wider">Pioneer Verified Wallet</span>
            <span className="text-[10px] text-slate-300 font-semibold max-w-[120px] truncate block">{currentUser.walletAddress}</span>
          </div>
        </div>
      </div>

      {/* MAIN NAV TABS */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-900 pb-3" id="commerce_engine_tabs">
        <button
          onClick={() => setActiveTab('specs_sandbox')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
            activeTab === 'specs_sandbox'
              ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/10'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Architecture & Sandbox</span>
        </button>

        <button
          onClick={() => setActiveTab('cart_checkout')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer relative ${
            activeTab === 'cart_checkout'
              ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/10'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Shopping Cart & Checkout</span>
          {cart.length > 0 && (
            <span className="absolute -top-1.5 -right-1 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-bounce">
              {cart.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('orders_contracts')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
            activeTab === 'orders_contracts'
              ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/10'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Orders & Booking Tracker</span>
        </button>

        <button
          onClick={() => setActiveTab('escrow_settlement')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
            activeTab === 'escrow_settlement'
              ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/10'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Escrow, Refunds & Settlements</span>
        </button>

        <button
          onClick={() => setActiveTab('ledger_analytics')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
            activeTab === 'ledger_analytics'
              ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/10'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Analytics & Immutable Ledger</span>
        </button>
      </div>

      {/* ==================================================== */}
      {/* TAB 1: ARCHITECTURE & SANDBOX */}
      {/* ==================================================== */}
      {activeTab === 'specs_sandbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="panel_specs_sandbox">
          
          {/* ARCHITECTURE SPECIFICATION OVERVIEW */}
          <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <FileText className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Enterprise Pi Commerce Architecture & Verification</h2>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Below is the comprehensive technical ledger architecture deployed to govern physical goods delivery, local service contracts, and escrow clearance on the Pi Block Network.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 text-xs">
              <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg space-y-1">
                <span className="font-bold text-emerald-400 block">1. Pi Payment Gateway</span>
                <p className="text-[11px] text-slate-400">P2P Mainnet cryptographic signatures verifying wallet address balances with double-spending locks.</p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg space-y-1">
                <span className="font-bold text-violet-400 block">2. Multi-Currency Escrow</span>
                <p className="text-[11px] text-slate-400">Security vault locking Pi assets until client signs off on physical dispatch or milestones completed.</p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg space-y-1">
                <span className="font-bold text-amber-400 block">3. Automated Refunds</span>
                <p className="text-[11px] text-slate-400">Instant full or partial refunds for physical delivery failures, backed by automated dispute timers.</p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg space-y-1">
                <span className="font-bold text-indigo-400 block">4. Secure Settlement Log</span>
                <p className="text-[11px] text-slate-400">Automatic platform fee deductions (1.5%) and instant routing to merchant balances upon confirmation.</p>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg space-y-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-[11px] uppercase tracking-wider text-slate-200">10-Year Global Scale Compliance Protocol</span>
              </div>
              <ul className="text-[11px] text-slate-400 space-y-1 list-disc pl-4 leading-relaxed">
                <li><strong className="text-slate-300">Firestore Indexes:</strong> Queries optimized using composite indexes (<code className="bg-slate-900 px-1 py-0.5 rounded text-violet-400">storeId_createdAt_desc</code>, <code className="bg-slate-900 px-1 py-0.5 rounded text-violet-400">buyerUid_status</code>).</li>
                <li><strong className="text-slate-300">Fraud Prevention Strategy:</strong> Wallet signature hashing, cross-tenant check middleware, and transaction limits per minute protect against Sybil bots.</li>
                <li><strong className="text-slate-300">Cost Optimization:</strong> Data is written into denormalized states to prevent deep reads/writes.</li>
                <li><strong className="text-slate-300">Performance Strategy:</strong> Geohash proximity clusters match nearest logistics partners.</li>
              </ul>
            </div>
          </div>

          {/* SANDBOX SECURITY SIMULATOR PANEL */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <Shield className="w-4 h-4 text-violet-400" />
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Security Sandbox Control</h2>
              </div>

              <p className="text-xs text-slate-400">
                Modify transaction-level safety locks to verify the system block routing protocols in real time.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between p-2 bg-slate-950 border border-slate-850 rounded-lg">
                  <div className="flex flex-col text-left">
                    <span className="text-[11px] font-bold text-slate-200">Anti-Double Spending Lock</span>
                    <span className="text-[9px] text-slate-500">Filters replay hashes in transaction pools</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={doubleSpendingShield}
                    onChange={(e) => setDoubleSpendingShield(e.target.checked)}
                    className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 bg-slate-900 border-slate-800"
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-slate-950 border border-slate-850 rounded-lg">
                  <div className="flex flex-col text-left">
                    <span className="text-[11px] font-bold text-slate-200">Price Integrity Shield</span>
                    <span className="text-[9px] text-slate-500">Prevents client-side price modification</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={priceIntegrityShield}
                    onChange={(e) => setPriceIntegrityShield(e.target.checked)}
                    className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 bg-slate-900 border-slate-800"
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-slate-950 border border-slate-850 rounded-lg">
                  <div className="flex flex-col text-left">
                    <span className="text-[11px] font-bold text-slate-200">Shield Bot Prevention</span>
                    <span className="text-[9px] text-slate-500">Mitigates automated checkout scripts</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={botShield}
                    onChange={(e) => setBotShield(e.target.checked)}
                    className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 bg-slate-900 border-slate-800"
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-slate-950 border border-slate-850 rounded-lg">
                  <div className="flex flex-col text-left">
                    <span className="text-[11px] font-bold text-slate-200">Cross-Tenant Middleware</span>
                    <span className="text-[9px] text-slate-500">Locks other merchant database manipulation</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={tenantCheck}
                    onChange={(e) => setTenantCheck(e.target.checked)}
                    className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 bg-slate-900 border-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* QUICK LINK */}
            <div className="pt-4 mt-4 border-t border-slate-800/80">
              <button
                onClick={() => setActiveTab('cart_checkout')}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
              >
                <span>Launch Shopping Cart Simulator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: ACTIVE SHOPPING CART & SECURE CHECKOUT */}
      {/* ==================================================== */}
      {activeTab === 'cart_checkout' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in text-left" id="panel_cart_checkout">
          
          {/* CART AND WISHLIST PLAYGROUND */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* CART CONTAINER */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-emerald-400" />
                  Your Active Shopping Cart ({cart.length})
                </span>
                
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-[10px] text-rose-400 hover:text-rose-300 font-bold uppercase transition-all"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <ShoppingBag className="w-8 h-8 text-slate-700 mx-auto" />
                  <p className="text-xs">Your shopping cart is currently empty.</p>
                  <button
                    onClick={() => {
                      setCart([
                        {
                          id: 'prod_alpha',
                          type: 'product',
                          title: 'PiNode Elite Plug-and-Play Validator',
                          pricePi: 45.0,
                          quantity: 1,
                          imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=60',
                          selectedVariant: 'Pro Rackmount 2TB',
                          merchantNotes: 'Deliver via verified secure post',
                          merchantId: 'merchant_tech_owner',
                          merchantName: 'Satoshi Gadgets'
                        }
                      ]);
                    }}
                    className="text-xs text-violet-400 hover:text-violet-300 font-bold underline transition-all"
                  >
                    Load Sample Cart Products
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 bg-slate-950 border border-slate-850 rounded-xl">
                      <div className="flex items-center gap-3">
                        <img src={item.imageUrl} alt={item.title} className="w-12 h-12 rounded-lg object-cover border border-slate-800 flex-shrink-0" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-100">{item.title}</h4>
                          <span className="text-[10px] text-slate-400 mt-0.5 block font-medium">Merchant: <strong className="text-slate-300">{item.merchantName}</strong></span>
                          
                          <div className="flex gap-2 mt-1.5">
                            <span className="text-[9px] bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-violet-400 font-mono">
                              Variant: {item.selectedVariant || 'Default'}
                            </span>
                            {item.merchantNotes && (
                              <span className="text-[9px] bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-amber-400">
                                Note: {item.merchantNotes}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                        {/* Quantity controls */}
                        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-lg">
                          <button onClick={() => updateCartQty(item.id, -1)} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-all">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold font-mono text-slate-200 px-1">{item.quantity}</span>
                          <button onClick={() => updateCartQty(item.id, 1)} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-all">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Price & Actions */}
                        <div className="text-right flex items-center gap-4">
                          <div className="font-mono">
                            <span className="text-xs font-bold text-emerald-400 block">{(item.pricePi * item.quantity).toFixed(2)} Pi</span>
                            <span className="text-[9px] text-slate-500 block">@ {item.pricePi} Pi each</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => saveForLater(item)}
                              title="Save For Later"
                              className="p-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-400 hover:text-violet-400 transition-all cursor-pointer"
                            >
                              <Heart className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              title="Remove"
                              className="p-1.5 bg-slate-900 border border-slate-850 hover:bg-rose-950 hover:border-rose-900 rounded-lg text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* WISHLIST & SAVE FOR LATER CONTAINER */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block pb-3 border-b border-slate-800 mb-4">
                Saved For Later / Wishlist ({wishlist.length})
              </span>

              {wishlist.length === 0 ? (
                <p className="text-[11px] text-slate-500 text-center py-4">No items saved in wishlist.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {wishlist.map(item => (
                    <div key={item.id} className="bg-slate-950 border border-slate-850 rounded-xl p-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <img src={item.imageUrl} alt={item.title} className="w-10 h-10 rounded-lg object-cover border border-slate-800 flex-shrink-0" />
                        <div>
                          <h5 className="text-[11px] font-bold text-slate-100 line-clamp-1">{item.title}</h5>
                          <span className="text-[10px] font-mono text-emerald-400">{item.pricePi.toFixed(2)} Pi</span>
                        </div>
                      </div>

                      <button
                        onClick={() => moveToCart(item)}
                        className="p-1.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-[10px] rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        <span>Move to Cart</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* STATIC / DYNAMIC QR INVOICE GENERATOR */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800 mb-4">
                <QrCode className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Dynamic QR Payment & Invoicing Hub</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <p className="text-xs text-slate-400 leading-normal">
                    Generate secure cryptographically signed QR codes. Pioneers scan to make immediate, authorized wallet settlements.
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setQrType('dynamic')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${qrType === 'dynamic' ? 'bg-violet-600/30 text-violet-300 border-violet-500/50' : 'bg-slate-950 border-slate-850 text-slate-400'}`}
                    >
                      Dynamic Cart QR
                    </button>
                    <button
                      onClick={() => setQrType('static')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${qrType === 'static' ? 'bg-violet-600/30 text-violet-300 border-violet-500/50' : 'bg-slate-950 border-slate-850 text-slate-400'}`}
                    >
                      Merchant Static QR
                    </button>
                    <button
                      onClick={() => setQrType('invoice')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${qrType === 'invoice' ? 'bg-violet-600/30 text-violet-300 border-violet-500/50' : 'bg-slate-950 border-slate-850 text-slate-400'}`}
                    >
                      Custom Invoice QR
                    </button>
                  </div>

                  {qrType === 'invoice' && (
                    <div className="space-y-2 p-3 bg-slate-950 border border-slate-850 rounded-lg max-w-sm">
                      <label className="text-[10px] font-mono text-slate-400 block uppercase">Invoice Value (Pi Coins)</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={invoiceAmount}
                          onChange={(e) => setInvoiceAmount(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 text-slate-200 p-2 pl-8 rounded-lg text-xs focus:ring-1 focus:ring-violet-500"
                          placeholder="e.g. 5.0"
                        />
                        <Coins className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-3" />
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg">
                    <span className="text-[10px] font-mono text-slate-500 block uppercase">Signed QR Payload Hash</span>
                    <code className="text-[10px] text-emerald-400 font-mono break-all leading-normal block mt-1">
                      {qrCodeData}
                    </code>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col items-center justify-center space-y-3">
                  <div className="relative p-2 bg-white rounded-lg">
                    {/* Simulated elegant vector QR Code */}
                    <div className="w-32 h-32 bg-slate-900 flex flex-col items-center justify-center p-3 text-center border-4 border-slate-950">
                      <QrCode className="w-16 h-16 text-emerald-400 animate-pulse" />
                      <span className="text-[8px] font-mono text-emerald-400 mt-1 uppercase tracking-widest font-bold">PI_GATEWAY</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono text-center">Scan with Pi Wallet to Pay</span>
                </div>
              </div>
            </div>

          </div>

          {/* SECURE CHECKOUT SIDEBAR PANEL */}
          <div className="space-y-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 sticky top-6">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block pb-3 border-b border-slate-800 mb-4">
                Secure Order Summary
              </span>

              {/* Price tampering sandbox switch */}
              <div className="p-2.5 bg-rose-950/20 border border-rose-900/40 rounded-lg mb-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-rose-400 block uppercase">Tamper Price Vector</span>
                  <span className="text-[9px] text-slate-500">Simulate malicious client hacks</span>
                </div>
                <input
                  type="checkbox"
                  checked={priceTampered}
                  onChange={(e) => setPriceTampered(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-rose-600 focus:ring-rose-500 bg-slate-900 border-slate-800"
                />
              </div>

              <div className="space-y-2.5 pb-4 border-b border-slate-800">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Subtotal:</span>
                  <span className="font-mono text-slate-200">
                    {priceTampered
                      ? (cart.reduce((sum, item) => sum + item.pricePi * item.quantity, 0) - 20.0).toFixed(2)
                      : cart.reduce((sum, item) => sum + item.pricePi * item.quantity, 0).toFixed(2)
                    } Pi
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Merchant Escrow Fee:</span>
                  <span className="font-mono text-slate-200">0.00 Pi</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Network Gas:</span>
                  <span className="font-mono text-emerald-400">Free</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Logistics Tax (Verified):</span>
                  <span className="font-mono text-slate-200">0.00 Pi</span>
                </div>
              </div>

              <div className="pt-4 pb-4 flex justify-between items-center mb-6">
                <span className="text-xs font-bold text-slate-200 uppercase">Gross Total Pi:</span>
                <span className="text-lg font-mono font-black text-emerald-400">
                  {priceTampered
                    ? (cart.reduce((sum, item) => sum + item.pricePi * item.quantity, 0) - 20.0).toFixed(2)
                    : cart.reduce((sum, item) => sum + item.pricePi * item.quantity, 0).toFixed(2)
                  } Pi
                </span>
              </div>

              {checkoutStep === 'idle' && (
                <button
                  onClick={executeSecureCheckout}
                  disabled={cart.length === 0}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    cart.length === 0
                      ? 'bg-slate-800 text-slate-500 border border-slate-850 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-600 to-indigo-600 text-white hover:opacity-90 shadow-lg shadow-emerald-500/10'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Execute Secure Escrow Checkout</span>
                </button>
              )}

              {/* VALIDATION PIPELINE LOADING */}
              {checkoutStep === 'validating' && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-violet-400 animate-spin" />
                    <span className="text-xs font-bold text-violet-400 uppercase tracking-widest animate-pulse">Running Validation Suite...</span>
                  </div>
                  
                  <div className="bg-slate-950 border border-slate-850 rounded-lg p-3 h-48 overflow-y-auto space-y-1.5 text-[9px] font-mono text-slate-400">
                    {validationLogs.map((log, idx) => (
                      <p key={idx} className={log.includes('🚨') ? 'text-rose-400 font-bold' : log.includes('✓') ? 'text-emerald-400' : 'text-slate-400'}>
                        {log}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* CHECKOUT SUCCEEDED */}
              {checkoutStep === 'completed' && (
                <div className="space-y-4 pt-2 text-center">
                  <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase">Purchase Secured successfully!</h4>
                    <p className="text-[10px] text-slate-400 leading-normal">Funds locked in secure multi-currency escrow vault. Check Orders tab to track progression.</p>
                  </div>
                  <button
                    onClick={() => setCheckoutStep('idle')}
                    className="w-full bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-300 py-1.5 px-3 rounded-lg text-[10px] font-bold transition-all"
                  >
                    Configure Another Purchase
                  </button>
                </div>
              )}

              {/* CHECKOUT FAILED */}
              {checkoutStep === 'failed' && (
                <div className="space-y-4 pt-2 text-center">
                  <div className="w-10 h-10 bg-rose-500/10 border border-rose-500/30 rounded-full flex items-center justify-center mx-auto text-rose-400">
                    <AlertTriangle className="w-6 h-6 animate-bounce" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-rose-400 uppercase">Checkout Pipeline Blocked</h4>
                    <p className="text-[10px] text-rose-300 font-mono leading-normal">{checkoutError}</p>
                  </div>
                  <button
                    onClick={() => {
                      setPriceTampered(false);
                      setCheckoutStep('idle');
                    }}
                    className="w-full bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-300 py-1.5 px-3 rounded-lg text-[10px] font-bold transition-all"
                  >
                    Retry with Secure Parameters
                  </button>
                </div>
              )}

            </div>
          </div>

        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 3: ORDERS, BOOKING TRACKER & CONTRACTS */}
      {/* ==================================================== */}
      {activeTab === 'orders_contracts' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in text-left" id="panel_orders_contracts">
          
          {/* ORDERS LIST */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* ORDERS CARD */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block pb-3 border-b border-slate-800 mb-4">
                Active Order Operations & Lifecycles
              </span>

              {orders.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No orders registered on ledger.</p>
              ) : (
                <div className="space-y-4">
                  {orders.map(o => (
                    <div key={o.id} className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-4">
                      
                      {/* ORDER HEAD */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-900">
                        <div className="space-y-1">
                          <span className="text-[11px] text-emerald-400 font-mono font-bold uppercase tracking-wider block">ID: {o.id}</span>
                          <span className="text-[10px] text-slate-400 block font-medium">Merchant: <strong className="text-slate-300">{o.storeName}</strong></span>
                        </div>

                        <div className="flex flex-col items-end">
                          <span className="text-xs font-mono font-bold text-slate-100">{o.totalPi.toFixed(2)} Pi</span>
                          <span className="text-[9px] text-slate-500 font-mono mt-0.5">{new Date(o.createdAt).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* ORDER BODY */}
                      <div className="space-y-2">
                        {o.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <img src={item.imageUrl} alt={item.title} className="w-10 h-10 rounded-lg object-cover border border-slate-900" />
                            <div>
                              <h5 className="text-xs font-bold text-slate-200">{item.title}</h5>
                              <span className="text-[10px] text-slate-400">Qty: {item.quantity} | {item.pricePi} Pi</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* BLOCKCHAIN INFO */}
                      {o.blockchainTxId && (
                        <div className="bg-slate-900 border border-slate-850 p-2 rounded-lg text-[9px] font-mono text-slate-400 flex justify-between items-center">
                          <span>Tx ID: <strong className="text-emerald-400">{o.blockchainTxId.substring(0, 16)}...</strong></span>
                          <span>Method: <strong className="text-slate-200">P2P Escrow Vault</strong></span>
                        </div>
                      )}

                      {/* ORDER STATUS LIFECYCLE PROGRESS BAR */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Lifecycle State</span>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-1 text-[9px] font-mono font-bold text-center">
                          <span className={`p-1 rounded ${o.status === OrderStatus.PENDING_PAYMENT ? 'bg-amber-600/20 text-amber-300 border border-amber-500/20' : 'bg-slate-900 text-slate-500'}`}>Created</span>
                          <span className={`p-1 rounded ${o.status === OrderStatus.PAID_VERIFYING ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20 animate-pulse' : 'bg-emerald-950/20 text-emerald-400'}`}>Escrow Locked</span>
                          <span className={`p-1 rounded ${o.status === OrderStatus.PREPARING ? 'bg-violet-600/20 text-violet-300 border border-violet-500/20' : 'bg-slate-900 text-slate-500'}`}>Preparing</span>
                          <span className={`p-1 rounded ${o.status === OrderStatus.SHIPPED ? 'bg-blue-600/20 text-blue-300 border border-blue-500/20' : 'bg-slate-900 text-slate-500'}`}>Shipped</span>
                          <span className={`p-1 rounded ${o.status === OrderStatus.DELIVERED ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/20' : 'bg-slate-900 text-slate-500'}`}>Delivered</span>
                          <span className={`p-1 rounded ${o.status === OrderStatus.COMPLETED ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/20' : 'bg-slate-900 text-slate-500'}`}>Completed</span>
                        </div>
                      </div>

                      {/* MERCHANT CONTROLS FOR LIFECYCLE */}
                      <div className="pt-2 border-t border-slate-900 flex flex-wrap gap-2 justify-end">
                        <button
                          onClick={() => advanceOrderStatus(o.id, OrderStatus.PREPARING)}
                          className="px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded text-[10px] font-bold text-slate-300 transition-all cursor-pointer"
                        >
                          Mark Preparing
                        </button>
                        <button
                          onClick={() => advanceOrderStatus(o.id, OrderStatus.SHIPPED)}
                          className="px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded text-[10px] font-bold text-slate-300 transition-all cursor-pointer"
                        >
                          Mark Shipped
                        </button>
                        <button
                          onClick={() => advanceOrderStatus(o.id, OrderStatus.DELIVERED)}
                          className="px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded text-[10px] font-bold text-slate-300 transition-all cursor-pointer"
                        >
                          Mark Delivered
                        </button>
                        <button
                          onClick={() => advanceOrderStatus(o.id, OrderStatus.COMPLETED)}
                          className="px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded text-[10px] transition-all cursor-pointer"
                        >
                          Complete Order
                        </button>
                        <button
                          onClick={() => processRefund(o.id, o.totalPi, 'full')}
                          className="px-2.5 py-1 bg-rose-950/20 border border-rose-900/40 hover:bg-rose-950/40 text-rose-400 font-bold rounded text-[10px] transition-all cursor-pointer"
                        >
                          Cancel & Refund
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SERVICES BOOKINGS */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-violet-400" />
                  Service Booking Calendars
                </span>
                <button
                  onClick={createServiceBooking}
                  className="px-2.5 py-1 bg-violet-600 hover:bg-violet-500 text-white font-bold text-[10px] rounded-lg transition-all cursor-pointer"
                >
                  Book New Slot
                </button>
              </div>

              <div className="space-y-4">
                {bookings.map(b => (
                  <div key={b.id} className="bg-slate-950 border border-slate-850 rounded-xl p-3.5 flex flex-col sm:flex-row justify-between gap-3 text-xs">
                    <div className="space-y-1 text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-200">{b.serviceTitle}</span>
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${b.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'}`}>
                          {b.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block font-medium">Provider: <strong className="text-slate-300">{b.providerName}</strong></span>
                      <span className="text-[10px] text-slate-400 block font-medium">Scheduled Time: <strong className="text-slate-300">{b.dateTime}</strong></span>
                      {b.clientNotes && <span className="text-[10px] text-slate-500 block">Note: "{b.clientNotes}"</span>}
                    </div>

                    <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2">
                      <span className="text-xs font-bold font-mono text-emerald-400">{b.pricePi.toFixed(2)} Pi</span>
                      
                      {b.status === 'PENDING_APPROVAL' && (
                        <button
                          onClick={() => approveBooking(b.id)}
                          className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-850 rounded text-[9px] font-mono text-slate-300 transition-all cursor-pointer"
                        >
                          Approve Request
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* JOB BOARD CONTRACTS */}
          <div className="space-y-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block pb-3 border-b border-slate-800 mb-4">
                Escrow Job Contracts
              </span>

              <p className="text-xs text-slate-400 mb-4 leading-normal">
                Web3 contracts protect developers & employers by locking project milestones in multisig escrow vaults.
              </p>

              <div className="space-y-4">
                {contracts.map(ctr => (
                  <div key={ctr.id} className="bg-slate-950 border border-slate-850 rounded-xl p-3.5 space-y-3 text-left">
                    <div className="space-y-1">
                      <div className="flex justify-between items-start">
                        <span className="text-[11px] font-bold text-slate-200">{ctr.title}</span>
                        <span className="text-xs font-mono font-extrabold text-emerald-400">{ctr.salaryPi} Pi</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block font-medium">Employer: <strong className="text-slate-300">{ctr.companyName}</strong></span>
                    </div>

                    {/* Milestones */}
                    <div className="space-y-2">
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider font-mono font-bold block">Milestones Structure</span>
                      <div className="space-y-1.5">
                        {ctr.milestones.map((m, mIdx) => (
                          <div key={mIdx} className="flex justify-between items-center text-[10px] bg-slate-900 border border-slate-850 p-1.5 rounded">
                            <div className="flex items-center gap-1.5 text-slate-300 max-w-[130px] truncate">
                              <span className={`w-1.5 h-1.5 rounded-full ${m.completed ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
                              <span>{m.name}</span>
                            </div>
                            
                            <div className="flex items-center gap-2 font-mono">
                              <span className="text-slate-400">{m.amountPi} Pi</span>
                              {!m.completed ? (
                                <button
                                  onClick={() => releaseContractMilestone(ctr.id, mIdx)}
                                  className="px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-[9px] transition-all cursor-pointer"
                                >
                                  Release
                                </button>
                              ) : (
                                <span className="text-emerald-400 text-[8px] font-mono font-bold uppercase">Released</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </div>

            {/* NOTIFICATION HUD LISTING */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block pb-3 border-b border-slate-800 mb-4">
                Commerce Logs & Broadcasts
              </span>

              <div className="space-y-2.5">
                {notifications.map(not => (
                  <div key={not.id} className="p-2.5 bg-slate-950 border border-slate-850 rounded-lg text-left">
                    <div className="flex justify-between text-[10px]">
                      <span className="font-bold text-slate-200">{not.title}</span>
                      <span className="text-slate-500 font-mono">{not.time}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-normal">{not.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 4: ESCROW SYSTEMS & BALANCES */}
      {/* ==================================================== */}
      {activeTab === 'escrow_settlement' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in text-left" id="panel_escrow_settlement">
          
          {/* ESCROW PROTECTION PROTOCOLS */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* ACTIVE ESCROWS */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block pb-3 border-b border-slate-800 mb-4">
                Active Escrow Hold Operations
              </span>

              <p className="text-xs text-slate-400 mb-4 leading-normal">
                Transactions marked with <span className="text-emerald-400 font-bold">Buyer Protection Vaults</span> hold Pi coins until the client validates order package delivery.
              </p>

              <div className="space-y-4">
                {escrowLedger.map(esc => (
                  <div key={esc.id} className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-900">
                      <div>
                        <span className="text-[11px] text-emerald-400 font-mono font-bold block uppercase tracking-wider">Escrow Reference ID: {esc.id}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Linked Order ID: <strong className="text-slate-300">{esc.orderId}</strong></span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-200">{esc.amountPi.toFixed(2)} Pi</span>
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                          esc.status === 'RELEASED'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : esc.status === 'DISPUTED_HOLD'
                              ? 'bg-rose-500/10 text-rose-400'
                              : 'bg-amber-500/10 text-amber-400 animate-pulse'
                        }`}>
                          {esc.status}
                        </span>
                      </div>
                    </div>

                    {/* Routing metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] font-mono text-slate-400">
                      <div className="p-2 bg-slate-900 border border-slate-850 rounded">
                        <span className="text-[9px] text-slate-500 block uppercase">Payer Wallet</span>
                        <span className="text-[9.5px] truncate block">{esc.buyerAddress}</span>
                      </div>
                      <div className="p-2 bg-slate-900 border border-slate-850 rounded">
                        <span className="text-[9px] text-slate-500 block uppercase">Merchant Target Wallet</span>
                        <span className="text-[9.5px] truncate block">{esc.merchantAddress}</span>
                      </div>
                    </div>

                    {/* Escrow Details */}
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                      <span>Milestone protocol: <strong className="text-violet-400">{esc.milestoneSplit}</strong></span>
                      <span>Auto release countdown: <strong className="text-slate-300">{esc.autoReleaseTime}</strong></span>
                    </div>

                    {/* Escrow protection controls */}
                    {esc.status === 'LOCKED' && (
                      <div className="pt-3 border-t border-slate-900 flex justify-end gap-2">
                        <button
                          onClick={() => disputeEscrowFunds(esc.id)}
                          className="px-3 py-1 bg-rose-950/20 border border-rose-900/40 hover:bg-rose-950/40 text-rose-400 rounded text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Lock Dispute Hold ⚠️
                        </button>
                        <button
                          onClick={() => releaseEscrowFunds(esc.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Release Locked Funds 🔓
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* MERCHANT BALANCE SETTLEMENT */}
          <div className="space-y-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block pb-3 border-b border-slate-800 mb-3">
                Merchant Settlements
              </span>

              {/* Settlement Balances display */}
              <div className="space-y-3">
                <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg text-left">
                  <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Pending Balance (In Escrow)</span>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-lg font-mono font-extrabold text-amber-400">{settlement.pendingPi.toFixed(2)} Pi</span>
                    <Clock className="w-4 h-4 text-slate-500" />
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg text-left">
                  <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Available Balance (Cleared)</span>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-lg font-mono font-extrabold text-emerald-400">{settlement.availablePi.toFixed(2)} Pi</span>
                    <Coins className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg text-left">
                  <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Released / Cleared Balance</span>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-lg font-mono font-extrabold text-slate-300">{settlement.releasedPi.toFixed(2)} Pi</span>
                    <CheckCircle className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              </div>

              {/* Direct bank / ledger routing trigger */}
              <div className="pt-4 mt-4 border-t border-slate-800 space-y-3">
                <button
                  onClick={() => {
                    if (settlement.availablePi === 0) return;
                    setSettlement(prev => ({
                      ...prev,
                      releasedPi: prev.releasedPi + prev.availablePi,
                      availablePi: 0,
                      history: [{
                        id: `set_${Math.floor(1000 + Math.random() * 9000)}`,
                        amountPi: prev.availablePi,
                        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
                        status: 'COMPLETED',
                        txHash: `pi_tx_set_${Math.random().toString(16).substr(2, 8)}`
                      }, ...prev.history]
                    }));

                    setNotifications(prev => [
                      {
                        id: `not_${Date.now()}`,
                        title: 'Settlement Initiated! 🏦',
                        body: 'Cleared available funds requested for external wallet withdrawal.',
                        time: 'Just now',
                        type: 'settlement'
                      },
                      ...prev
                    ]);
                  }}
                  disabled={settlement.availablePi === 0}
                  className={`w-full py-2 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    settlement.availablePi === 0
                      ? 'bg-slate-800 text-slate-500 border border-slate-850 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-600 to-indigo-600 text-white hover:opacity-90'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Withdraw cleared funds</span>
                </button>
              </div>
            </div>

            {/* WITHDRAWAL HISTORY */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block pb-3 border-b border-slate-800 mb-3">
                Settlement logs
              </span>

              <div className="space-y-2">
                {settlement.history.map(hist => (
                  <div key={hist.id} className="p-2.5 bg-slate-950 border border-slate-850 rounded-lg flex justify-between items-center text-xs">
                    <div className="text-left space-y-0.5">
                      <span className="text-[10px] font-mono text-slate-400 block font-bold">ID: {hist.id}</span>
                      <span className="text-[9px] text-slate-500 font-mono block">{hist.timestamp}</span>
                    </div>
                    
                    <div className="text-right space-y-0.5">
                      <span className="font-mono text-emerald-400 font-bold">+{hist.amountPi.toFixed(2)} Pi</span>
                      <span className="text-[8px] text-emerald-500 bg-emerald-950/20 px-1 rounded uppercase font-mono tracking-widest font-bold">Cleared</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 5: ANALYTICS & IMMUTABLE LEDGER */}
      {/* ==================================================== */}
      {activeTab === 'ledger_analytics' && (
        <div className="space-y-6 animate-fade-in text-left" id="panel_ledger_analytics">
          
          {/* ANALYTICS HUD HIGHLIGHTS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider font-bold">Gross Revenue Volume</span>
              <div className="flex justify-between items-center mt-1">
                <span className="text-lg font-mono font-black text-white">645.50 Pi</span>
                <Coins className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-[9.5px] text-emerald-400 font-mono font-medium block mt-1">+14.2% since last week</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider font-bold">Successful Settlements</span>
              <div className="flex justify-between items-center mt-1">
                <span className="text-lg font-mono font-black text-white">165 Orders</span>
                <ShoppingBag className="w-5 h-5 text-violet-400" />
              </div>
              <span className="text-[9.5px] text-slate-400 font-mono font-medium block mt-1">Conversion: 82.5%</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider font-bold">Dispute Resolution Rate</span>
              <div className="flex justify-between items-center mt-1">
                <span className="text-lg font-mono font-black text-white">99.2%</span>
                <Shield className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-[9.5px] text-rose-400 font-mono font-medium block mt-1">Dispute Rate: 0.8%</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider font-bold">Platform Revenue Share (1.5%)</span>
              <div className="flex justify-between items-center mt-1">
                <span className="text-lg font-mono font-black text-white">9.68 Pi</span>
                <TrendingUp className="w-5 h-5 text-indigo-400" />
              </div>
              <span className="text-[9.5px] text-slate-400 font-mono font-medium block mt-1">Audit Checksum: VERIFIED</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* COMPREHENSIVE REVENUE ANALYTICS CHART */}
            <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block pb-2 border-b border-slate-800">
                Pioneer Commerce Metrics
              </span>

              <p className="text-xs text-slate-400">
                Weekly transaction metric analysis across product markets, booking calendars, and job placements.
              </p>

              {/* Robust responsive SVG mini graph */}
              <div className="h-44 bg-slate-950 border border-slate-850 p-2 rounded-lg flex flex-col justify-between">
                <div className="flex-1 flex items-end justify-between px-2 pt-4">
                  {/* Visual columns */}
                  <div className="w-8 flex flex-col items-center gap-1.5">
                    <div className="w-full bg-slate-900 rounded-t h-12 relative group hover:bg-slate-800 transition-all cursor-pointer">
                      <div className="absolute bg-violet-650 text-[8px] font-mono p-1 rounded -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all">45Pi</div>
                      <div className="absolute bottom-0 left-0 w-full bg-violet-500 rounded-t" style={{ height: '70%' }}></div>
                    </div>
                    <span className="text-[8px] font-mono text-slate-500">Mon</span>
                  </div>

                  <div className="w-8 flex flex-col items-center gap-1.5">
                    <div className="w-full bg-slate-900 rounded-t h-18 relative group hover:bg-slate-800 transition-all cursor-pointer">
                      <div className="absolute bg-violet-650 text-[8px] font-mono p-1 rounded -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all">120Pi</div>
                      <div className="absolute bottom-0 left-0 w-full bg-violet-500 rounded-t" style={{ height: '90%' }}></div>
                    </div>
                    <span className="text-[8px] font-mono text-slate-500">Tue</span>
                  </div>

                  <div className="w-8 flex flex-col items-center gap-1.5">
                    <div className="w-full bg-slate-900 rounded-t h-14 relative group hover:bg-slate-800 transition-all cursor-pointer">
                      <div className="absolute bg-violet-650 text-[8px] font-mono p-1 rounded -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all">65Pi</div>
                      <div className="absolute bottom-0 left-0 w-full bg-violet-500 rounded-t" style={{ height: '40%' }}></div>
                    </div>
                    <span className="text-[8px] font-mono text-slate-500">Wed</span>
                  </div>

                  <div className="w-8 flex flex-col items-center gap-1.5">
                    <div className="w-full bg-slate-900 rounded-t h-24 relative group hover:bg-slate-800 transition-all cursor-pointer">
                      <div className="absolute bg-violet-650 text-[8px] font-mono p-1 rounded -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all">210Pi</div>
                      <div className="absolute bottom-0 left-0 w-full bg-emerald-500 rounded-t" style={{ height: '100%' }}></div>
                    </div>
                    <span className="text-[8px] font-mono text-slate-500">Thu</span>
                  </div>

                  <div className="w-8 flex flex-col items-center gap-1.5">
                    <div className="w-full bg-slate-900 rounded-t h-16 relative group hover:bg-slate-800 transition-all cursor-pointer">
                      <div className="absolute bg-violet-650 text-[8px] font-mono p-1 rounded -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all">85Pi</div>
                      <div className="absolute bottom-0 left-0 w-full bg-violet-500 rounded-t" style={{ height: '60%' }}></div>
                    </div>
                    <span className="text-[8px] font-mono text-slate-500">Fri</span>
                  </div>
                </div>

                <span className="text-[9px] text-slate-500 font-mono text-center">Standard UTC Time Coordinates Matrix</span>
              </div>

              <div className="text-[11px] text-slate-400 space-y-1.5 pt-2">
                <div className="flex justify-between">
                  <span>Product Sales Volume:</span>
                  <strong className="text-slate-200">312.0 Pi</strong>
                </div>
                <div className="flex justify-between">
                  <span>Service Bookings:</span>
                  <strong className="text-slate-200">125.0 Pi</strong>
                </div>
                <div className="flex justify-between">
                  <span>Job Milestone Payments:</span>
                  <strong className="text-slate-200">208.5 Pi</strong>
                </div>
              </div>
            </div>

            {/* IMMUTABLE LEDGER STREAM */}
            <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-5">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  Immutable Core Transaction Ledger Log
                </span>
                <span className="text-[9px] text-emerald-400 font-mono bg-emerald-950/20 px-2 py-0.5 rounded uppercase tracking-wider border border-emerald-500/20 font-bold">
                  SHA-256 Validated
                </span>
              </div>

              <p className="text-xs text-slate-400 mb-3 leading-normal">
                An audit trace records every single transaction, lock event, fee adjustment, and settlement with strict cryptographic time markers.
              </p>

              <div className="space-y-3 max-h-72 overflow-y-auto">
                {ledger.map(entry => (
                  <div key={entry.id} className="bg-slate-950 border border-slate-850 p-3 rounded-lg space-y-2 text-xs">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-widest ${
                          entry.type === 'PAYMENT'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : entry.type === 'ESCROW_LOCK'
                              ? 'bg-violet-500/10 text-violet-400'
                              : entry.type === 'ESCROW_RELEASE'
                                ? 'bg-indigo-500/10 text-indigo-400'
                                : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {entry.type}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">Reference: {entry.referenceId}</span>
                      </div>
                      
                      <span className="text-[9.5px] text-slate-500 font-mono">{entry.timestamp}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[9.5px] font-mono text-slate-400 bg-slate-900/60 p-2 rounded border border-slate-900">
                      <div>
                        <span className="text-[8px] text-slate-500 uppercase block">Source Account</span>
                        <span className="truncate block font-bold text-slate-300">{entry.fromAddress}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-500 uppercase block">Destination Account</span>
                        <span className="truncate block font-bold text-slate-300">{entry.toAddress}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10.5px] font-medium text-slate-300">
                      <span>Memo: "{entry.memo}"</span>
                      <strong className="font-mono text-emerald-400 font-bold">{entry.amountPi.toFixed(2)} Pi</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
