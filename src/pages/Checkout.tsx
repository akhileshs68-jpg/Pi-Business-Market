/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckoutInput } from '../components/checkout/CheckoutInput';
import { PaymentSelector } from '../components/PaymentSelector';
import { PaymentMethodId } from '../types/payment';
import { 
  ArrowLeft, 
  MapPin, 
  CreditCard, 
  Truck, 
  CheckCircle2, 
  Loader2,
  ShieldCheck,
  Package,
  ShoppingBag,
  AlertCircle,
  RefreshCcw
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../auth/useAuth';
import { checkoutService } from '../services/checkoutService';
import { cartService } from '../services/cartService';
import { orderService } from '../services/orderService';
import { paymentService } from '../services/paymentService';
import { piPaymentService } from '../services/piPaymentService';
import { CheckoutSession, CartItem, Address, OrderItem, PaymentStatus, OrderStatus } from '../types';

export const Checkout: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'shipping' | 'payment' | 'review'>('shipping');
  const [isProcessing, setIsProcessing] = useState(false);

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodId>('pi');
  
  const [paymentState, setPaymentState] = useState<'idle' | 'success' | 'recovery'>('idle');
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  const [paymentTxId, setPaymentTxId] = useState<string>('');
  const [recoveryError, setRecoveryError] = useState<string>('');
  const [address, setAddress] = useState<Address>({
    fullName: '',
    email: user?.email || '',
    phone: '',
    street: '',
    city: '',
    state: '',
    country: 'USA',
    postalCode: ''
  });

  useEffect(() => {
    if (sessionId) {
      fetchSession();
    }
  }, [sessionId]);

  const fetchSession = async () => {
    setLoading(true);
    try {
      const data = await checkoutService.getSession(sessionId!);
      if (data) {
        setSession(data);
        const sessionCartIds = data.cartIds || [data.cartId];
        const allItems: CartItem[] = [];
        for (const cid of sessionCartIds) {
          const itemsFromCart = await cartService.getCartItems(cid);
          allItems.push(...itemsFromCart);
        }
        setItems(allItems);
      }
    } catch (err) {
      console.error('Failed to fetch session', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!session || !user || isProcessing) return;
    setIsProcessing(true);
    try {
      // 1. Map CartItems to OrderItems
      const orderItems: OrderItem[] = items.map(item => ({
        itemId: '', 
        orderId: '', 
        productId: item.productId,
        variantId: item.variantId,
        sku: item.sku,
        productName: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        tax: item.subtotal * 0.05,
        discount: 0,
        status: 'active'
      }));

      const grandTotal = session.grandTotal || items.reduce((acc, item) => acc + (item.subtotal || 0), 0) * 1.05;
      const businessId = session.storeId || session.businessId || 'UNKNOWN';

      // 3. Create Transaction in Payment Engine
      const paymentId = await paymentService.createTransaction({
        buyerId: user.uid,
        businessId: businessId,
        orderId: session.sessionId,
        currency: 'Pi', // Or whatever currency is configured
        paymentMethod: selectedPaymentMethod,
        amount: grandTotal
      });

      if (selectedPaymentMethod === 'pi') {
        // 4. Launch Pi SDK Payment (U2A Payment Flow)
        await paymentService.processPiPayment(
          paymentId,
          grandTotal,
          `Order at Pi Business Market`,
          {
            productType: 'MarketplaceOrder',
            orderId: session.sessionId,
            storeId: businessId,
            itemsCount: orderItems.length,
            transactionId: paymentId
          },
          async (txid) => {
            try {
              // 1. Verify the payment on the server
              await paymentService.updateTransactionStatus(paymentId, 'Completed', txid);
              
              // 2. Save the order in Firestore / 3. Update paymentStatus / 4. Update orderStatus
              const orderId = await orderService.createFromSession({
                ...session,
                shippingAddress: address,
                billingAddress: address,
                paymentStatus: 'SUCCESS',
                orderStatus: 'CONFIRMED',
                paymentId: paymentId,
                transactionId: txid,
                amount: grandTotal,
                timestamp: Date.now()
              }, orderItems);
              const order = await orderService.getOrder(orderId);
              if (!order) throw new Error('Order creation failed');
              
              // 5. Clear the shopping cart
              await checkoutService.updateSession(session.sessionId, { status: 'completed' });
              if (session.cartIds) {
                for (const cid of session.cartIds) {
                  await cartService.clearCart(cid);
                }
              } else if (session.cartId) {
                await cartService.clearCart(session.cartId);
              }
              
              setCompletedOrder(order);
              setPaymentTxId(txid);
              setPaymentState('success');
              
              // 7. Show a success toast
              const event = new CustomEvent('toast', { detail: { message: 'Payment Successful! Your order has been placed.', type: 'success' } });
              window.dispatchEvent(event);
              
              // 8. Automatically redirect to the Order Details page after 5 seconds
              setTimeout(() => {
                navigate(`/order-details/${orderId}`);
              }, 5000);
            } catch (err) {
              setRecoveryError(err instanceof Error ? err.message : 'Payment processing failed after success.');
              setPaymentState('recovery');
              setIsProcessing(false);
            }
          },
          (err) => {
            // Error callback
            console.error('[Checkout] Payment failed:', err);
            setRecoveryError(typeof err === 'string' ? err : 'Payment failed');
            setPaymentState('recovery');
            setIsProcessing(false);
          }
        );
      } else {
        // Handle future or alternative payment methods (e.g., BMT, UPI, Cash)
        await paymentService.updateTransactionStatus(paymentId, 'Completed', 'simulated_tx');
        const orderId = await orderService.createFromSession({
          ...session,
          shippingAddress: address,
          billingAddress: address,
          paymentStatus: 'SUCCESS',
          orderStatus: 'CONFIRMED',
          paymentId: paymentId,
          transactionId: 'simulated_tx',
          amount: grandTotal,
          timestamp: Date.now()
        }, orderItems);
        const order = await orderService.getOrder(orderId);
        if (!order) throw new Error('Order creation failed');
        await checkoutService.updateSession(session.sessionId, { status: 'completed' });
        if (session.cartIds) {
          for (const cid of session.cartIds) {
            await cartService.clearCart(cid);
          }
        } else if (session.cartId) {
          await cartService.clearCart(session.cartId);
        }
        
        setCompletedOrder(order);
        setPaymentTxId('simulated_tx');
        setPaymentState('success');
        
        const event = new CustomEvent('toast', { detail: { message: 'Payment Successful! Your order has been placed.', type: 'success' } });
        window.dispatchEvent(event);
        
        setTimeout(() => {
          navigate(`/order-details/${orderId}`);
        }, 5000);
      }
    } catch (err) {
      console.error('Order placement failed', err);
      setRecoveryError(err instanceof Error ? err.message : 'Failed to initiate order checkout.');
      setPaymentState('recovery');
      setIsProcessing(false);
    }
  };

  if (paymentState === 'success' && completedOrder) {
    return <PaymentSuccessScreen 
      order={completedOrder} 
      paymentTxId={paymentTxId} 
      address={address} 
      navigate={navigate} 
    />;
  }

  if (paymentState === 'recovery') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center z-50">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-rose-600/10 rounded-full flex items-center justify-center mb-8"
        >
          <AlertCircle className="w-12 h-12 text-rose-500" />
        </motion.div>
        
        <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">
          Payment <span className="text-rose-500">Failed</span>
        </h1>
        <p className="text-slate-500 max-w-sm mx-auto mb-12 font-medium">
          {recoveryError || 'Something went wrong during payment processing. Please review and try again.'}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
          <button 
            onClick={() => { setPaymentState('idle'); setRecoveryError(''); }}
            className="flex-1 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
          >
            <RefreshCcw className="w-4 h-4" /> Try Again
          </button>
          <button 
            onClick={() => navigate('/discovery')}
            className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
          >
             Go Back
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        <p className="text-xs font-black text-slate-600 uppercase tracking-widest animate-pulse">Securing Checkout Session...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-black text-white uppercase mb-4">Session Expired</h2>
        <p className="text-slate-500 mb-8">This checkout session is no longer active. Please return to your cart.</p>
        <button onClick={() => navigate('/discovery')} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold uppercase tracking-widest text-xs">
          Return to Market
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6 sm:mb-12">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group w-fit">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">Back to Bag</span>
          </button>
          
          <div className="flex items-center justify-between md:justify-start gap-4 sm:gap-8 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <StepIndicator current={step === 'shipping'} done={step !== 'shipping'} label="Shipping" />
            <div className="hidden sm:block w-8 h-px bg-slate-800 shrink-0" />
            <StepIndicator current={step === 'payment'} done={step === 'review'} label="Payment" />
            <div className="hidden sm:block w-8 h-px bg-slate-800 shrink-0" />
            <StepIndicator current={step === 'review'} done={false} label="Review" />
          </div>
          
          <div className="hidden md:flex items-center gap-2 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Secure Checkout</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8 order-2 lg:order-1">
            {step === 'shipping' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 md:space-y-8">
                <section className="bg-slate-900/50 border border-slate-800 rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8">
                  <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-tight mb-6 md:mb-8 flex items-center gap-3">
                    <MapPin className="w-6 h-6 text-indigo-400" /> Shipping
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <CheckoutInput label="Full Name" value={address.fullName} onChange={(v: string) => setAddress({...address, fullName: v})} />
                    <CheckoutInput label="Email" value={address.email} onChange={(v: string) => setAddress({...address, email: v})} />
                    <div className="md:col-span-2">
                      <CheckoutInput label="Street Address" value={address.street} onChange={(v: string) => setAddress({...address, street: v})} />
                    </div>
                    <CheckoutInput label="City" value={address.city} onChange={(v: string) => setAddress({...address, city: v})} />
                    <CheckoutInput label="State" value={address.state} onChange={(v: string) => setAddress({...address, state: v})} />
                    <CheckoutInput label="Postal Code" value={address.postalCode} onChange={(v: string) => setAddress({...address, postalCode: v})} />
                    <CheckoutInput label="Country" value={address.country} onChange={(v: string) => setAddress({...address, country: v})} />
                  </div>
                </section>

                <section className="bg-slate-900/50 border border-slate-800 rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8">
                  <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-tight mb-6 md:mb-8 flex items-center gap-3">
                    <Truck className="w-6 h-6 text-amber-400" /> Delivery Method
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DeliveryOption 
                      title="Standard Delivery" 
                      desc="3-5 Business Days" 
                      price="10.00 Pi" 
                      active={true}
                    />
                    <DeliveryOption 
                      title="Store Pickup" 
                      desc="Ready in 2 hours" 
                      price="FREE" 
                      active={false}
                    />
                  </div>
                </section>

                <button 
                  onClick={() => setStep('payment')}
                  className="w-full py-4 sm:py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl md:rounded-[1.8rem] text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20"
                >
                  Continue to Payment
                </button>
              </motion.div>
            )}

            {step === 'payment' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 md:space-y-8">
                <section className="bg-slate-900/50 border border-slate-800 rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8">
                  <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-tight mb-6 md:mb-8 flex items-center gap-3">
                    <CreditCard className="w-6 h-6 text-violet-400" /> Payment
                  </h2>
                  <PaymentSelector selectedMethod={selectedPaymentMethod} onSelect={setSelectedPaymentMethod} />
                </section>

                <button 
                  onClick={() => setStep('review')}
                  className="w-full py-4 sm:py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl md:rounded-[1.8rem] text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20"
                >
                  Review Order
                </button>
              </motion.div>
            )}

            {step === 'review' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 md:space-y-8">
                <section className="bg-slate-900/50 border border-slate-800 rounded-3xl md:rounded-[2.5rem] p-6 md:p-8">
                  <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-tight mb-6 md:mb-8 flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" /> Final Review
                  </h2>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Shipping To</h4>
                        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                          <p className="text-sm font-bold text-white">{address.fullName}</p>
                          <p className="text-xs text-slate-400">{address.street}</p>
                          <p className="text-xs text-slate-400">{address.city}, {address.state} {address.postalCode}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Payment Method</h4>
                        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                          {selectedPaymentMethod === 'pi' ? <p className="text-sm font-bold text-white">Pi Network Wallet</p> : <p className="text-sm font-bold text-white text-transform-capitalize">{selectedPaymentMethod}</p>}
                          <p className="text-xs text-slate-400">Secure Consensus Authorization</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <button 
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                  className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white rounded-2xl md:rounded-[2rem] text-sm font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-3"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm and Pay Now"}
                </button>
              </motion.div>
            )}
          </div>

          {/* Sidebar Summary */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="lg:sticky lg:top-28 bg-slate-900/50 border border-slate-800 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8">
              <h3 className="text-lg font-black text-white uppercase tracking-tight mb-6 sm:mb-8">Order Summary</h3>
              <div className="space-y-6 mb-6 sm:mb-8 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item) => (
                  <div key={item.itemId} className="flex gap-4">
                    <div className="w-12 h-12 bg-slate-800 rounded-xl overflow-hidden border border-slate-700 flex-shrink-0">
                      {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[10px] font-bold text-white truncate uppercase">{item.name}</h4>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Qty: {item.quantity} × {item.unitPrice}
                      </p>
                    </div>
                    <p className="text-[10px] font-black text-white flex-shrink-0">{item.subtotal} Pi</p>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-6 border-t border-slate-800">
                <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <span>Subtotal</span>
                  <span className="text-white">{session.subtotal} Pi</span>
                </div>
                <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <span>Shipping</span>
                  <span className="text-white">{session.shipping} Pi</span>
                </div>
                <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <span>Tax (5%)</span>
                  <span className="text-white">{session.tax} Pi</span>
                </div>
                <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-[10px] sm:text-xs font-black text-white uppercase tracking-widest">Total</span>
                  <span className="text-xl sm:text-2xl font-black text-white">{session.grandTotal} Pi</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StepIndicator = ({ current, done, label }: { current: boolean; done: boolean; label: string }) => (
  <div className="flex items-center gap-3">
    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
      done ? 'bg-emerald-500 text-white' : 
      current ? 'bg-indigo-600 text-white ring-4 ring-indigo-600/20' : 
      'bg-slate-800 text-slate-600'
    }`}>
      {done ? <CheckCircle2 className="w-4 h-4" /> : null}
      {!done && label[0]}
    </div>
    <span className={`text-[10px] font-black uppercase tracking-widest ${current ? 'text-white' : 'text-slate-600'}`}>
      {label}
    </span>
  </div>
);

interface DeliveryOptionProps {
  title: string;
  desc: string;
  price: string;
  active: boolean;
}

const DeliveryOption: React.FC<DeliveryOptionProps> = ({ title, desc, price, active }) => (
  <div className={`p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border-2 cursor-pointer transition-all ${
    active ? 'bg-indigo-600/5 border-indigo-600 shadow-lg shadow-indigo-600/10' : 'bg-slate-950 border-slate-800 hover:border-slate-700'
  }`}>
    <div className="flex justify-between items-start mb-1 sm:mb-2 gap-2">
      <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-tight leading-tight">{title}</h4>
      <span className="text-[10px] sm:text-xs font-black text-white shrink-0">{price}</span>
    </div>
    <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">{desc}</p>
  </div>
);

const PaymentSuccessScreen = ({ order, paymentTxId, address, navigate }: any) => {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center z-50">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-24 h-24 bg-emerald-600/10 rounded-full flex items-center justify-center mb-8"
      >
        <CheckCircle2 className="w-12 h-12 text-emerald-500" />
      </motion.div>
      
      <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">
        Payment <span className="text-emerald-500">Successful</span>
      </h1>
      <p className="text-slate-500 max-w-sm mx-auto mb-12 font-medium flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
        Auto redirecting to order in {countdown}s...
      </p>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-12 w-full max-w-sm text-left">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-4">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount Paid</span>
          <span className="text-sm font-black text-emerald-400 uppercase">{order.amount || order.grandTotal || 0} π</span>
        </div>
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-4">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Date & Time</span>
          <span className="text-xs font-black text-white uppercase">{new Date(order.timestamp || Date.now()).toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Order ID</span>
          <span className="text-xs font-black text-white uppercase">{order.orderId || order.orderNumber || order.id || 'N/A'}</span>
        </div>
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-4">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Payment ID</span>
          <span className="text-xs font-black text-white uppercase">{order.paymentId || paymentTxId || 'Simulated'}</span>
        </div>
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Shipping Address</span>
          <span className="text-xs font-black text-white uppercase text-right max-w-[150px] truncate">{address?.street || ''}, {address?.city || ''}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Est. Delivery</span>
          <span className="text-xs font-black text-indigo-400 uppercase">3-5 Business Days</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
        <button 
          onClick={() => navigate(`/order-details/${order.orderId || order.id}`)}
          className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
        >
          <Package className="w-4 h-4" /> View Order
        </button>
        <button 
          onClick={() => navigate('/discovery')}
          className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" /> Continue Shopping
        </button>
      </div>
    </div>
  );
};
