/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckoutInput } from '../components/checkout/CheckoutInput';
import { 
  ArrowLeft, 
  MapPin, 
  CreditCard, 
  Truck, 
  CheckCircle2, 
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../auth/useAuth';
import { checkoutService } from '../services/checkoutService';
import { cartService } from '../services/cartService';
import { orderService } from '../services/orderService';
import { paymentService } from '../services/paymentService';
import { PiSdkSim } from '../services/piSdk';
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
        const cartItems = await cartService.getCartItems(data.cartId);
        setItems(cartItems);
      }
    } catch (err) {
      console.error('Failed to fetch session', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!session || !user) return;
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

      // 2. Create the real Order (Status: PENDING_PAYMENT)
      const orderId = await orderService.createFromSession({
        ...session,
        shippingAddress: address,
        billingAddress: address 
      }, orderItems);

      const order = await orderService.getOrder(orderId);
      if (!order) throw new Error('Order creation failed');

      // 3. Create Payment Intent
      const intent = await paymentService.createPaymentIntent(order);

      // 4. Launch Pi SDK Payment
      PiSdkSim.executePayment({
        amount: order.grandTotal,
        memo: `Order ${order.orderNumber} at Pi Business Market`,
        metadata: {
          storeId: order.businessId,
          itemsCount: orderItems.length
        }
      }, {
        onReadyForServerApproval: (paymentId) => {
        },
        onReadyForServerCompletion: async (paymentId, txid) => {
          try {
            // 5. Verify and Process Payment (creates Ledger, Receipt, Updates Order)
            await paymentService.verifyAndProcessPayment(intent.paymentIntentId, txid, user.uid);
            
            // 6. Update Session & Clear Cart
            await checkoutService.updateSession(session.sessionId, { status: 'completed' });
            await cartService.clearCart(session.cartId);
            
            // 7. Redirect to Success
            navigate(`/order-success/${orderId}`);
          } catch (err) {
            console.error('Payment verification failed', err);
            setIsProcessing(false);
          }
        },
        onCancel: (paymentId) => {
          setIsProcessing(false);
        },
        onError: (error, paymentId) => {
          console.error('[Checkout] Pi SDK Error', error);
          setIsProcessing(false);
        }
      });

    } catch (err) {
      console.error('Order placement failed', err);
      setIsProcessing(false);
    }
  };

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
                  <div className="p-6 md:p-8 bg-slate-950 border border-slate-800 rounded-2xl sm:rounded-3xl text-center">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-indigo-600/10 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                      <CreditCard className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-400" />
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-white uppercase mb-2">Pi Wallet</h3>
                    <p className="text-[10px] sm:text-xs text-slate-500 font-medium mb-6 sm:mb-8 max-w-xs mx-auto leading-relaxed">Securely authorize transaction via Pi Browser or Wallet app.</p>
                    <div className="px-4 md:px-6 py-4 bg-slate-900 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 border border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-[10px] font-black text-white">PI</div>
                        <span className="text-[11px] sm:text-sm font-bold text-slate-300">Balance available</span>
                      </div>
                      <span className="text-base sm:text-lg font-black text-white">1,240.50 Pi</span>
                    </div>
                  </div>
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
                          <p className="text-sm font-bold text-white">Pi Network Wallet</p>
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
                      {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
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
