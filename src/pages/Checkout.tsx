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
  RefreshCcw,
  Zap,
  Store,
  Building,
  Bookmark,
  Plus
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../auth/useAuth';
import { checkoutService } from '../services/checkoutService';
import { cartService } from '../services/cartService';
import { orderService } from '../services/orderService';
import { paymentService } from '../services/paymentService';
import { paymentEngine } from '../services/wallet/paymentEngine';
import { EnterpriseCheckoutEngine } from '../core/checkout/enterpriseCheckoutEngine';
import { SavedCheckoutAddress } from '../core/checkout/enterpriseCheckoutTypes';
import { CheckoutSession, CartItem, Address, OrderItem } from '../types';

export const Checkout: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'shipping' | 'payment' | 'review'>('shipping');
  const [isProcessing, setIsProcessing] = useState(false);

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodId>('pi_testnet');
  
  const [paymentState, setPaymentState] = useState<'idle' | 'success' | 'recovery'>('idle');
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  const [paymentTxId, setPaymentTxId] = useState<string>('');
  const [recoveryError, setRecoveryError] = useState<string>('');

  // Address state
  const [savedAddresses, setSavedAddresses] = useState<SavedCheckoutAddress[]>([]);
  const [selectedAddrId, setSelectedAddrId] = useState<string>('def_addr_1');
  const [sameAsBilling, setSameAsBilling] = useState<boolean>(true);
  const [deliveryMethod, setDeliveryMethod] = useState<'shipping' | 'pickup'>('shipping');
  const [customerNotes, setCustomerNotes] = useState<string>('');

  const [shippingAddress, setShippingAddress] = useState<Address>({
    fullName: user?.displayName || 'Pi Pioneer',
    email: user?.email || '',
    phone: '',
    street: '100 Pi Network Plaza',
    city: 'Palo Alto',
    state: 'CA',
    country: 'USA',
    postalCode: '94301'
  });

  const [billingAddress, setBillingAddress] = useState<Address>({
    fullName: user?.displayName || 'Pi Pioneer',
    email: user?.email || '',
    phone: '',
    street: '100 Pi Network Plaza',
    city: 'Palo Alto',
    state: 'CA',
    country: 'USA',
    postalCode: '94301'
  });

  useEffect(() => {
    if (sessionId) {
      fetchSession();
    }
    if (user?.uid) {
      loadUserAddresses(user.uid);
    }
  }, [sessionId, user?.uid]);

  const loadUserAddresses = async (uid: string) => {
    const list = await EnterpriseCheckoutEngine.getSavedAddresses(uid);
    setSavedAddresses(list);
    if (list.length > 0) {
      const def = list.find(a => a.isDefault) || list[0];
      setSelectedAddrId(def.addressId || '');
      setShippingAddress({
        fullName: def.fullName || user?.displayName || 'Pi Pioneer',
        email: def.email || user?.email || '',
        phone: def.phone || '',
        street: def.street || '',
        city: def.city || '',
        state: def.state || '',
        country: def.country || 'USA',
        postalCode: def.postalCode || ''
      });
    }
  };

  const fetchSession = async () => {
    setLoading(true);
    try {
      const data = await checkoutService.getSession(sessionId!);
      if (data) {
        setSession(data);
        const sessionCartIds = data.cartIds || [data.cartId];
        const allItems: CartItem[] = [];
        for (const cid of sessionCartIds) {
          if (cid) {
            const itemsFromCart = await cartService.getCartItems(cid);
            allItems.push(...itemsFromCart);
          }
        }
        setItems(allItems);
      }
    } catch (err) {
      console.error('Failed to fetch checkout session:', err);
    } finally {
      setLoading(false);
    }
  };

  // Map CartItems to OrderItems
  const orderItems: OrderItem[] = items.map(item => {
    const isService = (item as any).type === 'service' || item.name.toLowerCase().includes('service');
    const orderItem: any = {
      itemId: item.itemId, 
      orderId: sessionId || '', 
      productId: item.productId,
      productName: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal || (item.unitPrice * item.quantity),
      tax: (item.subtotal || (item.unitPrice * item.quantity)) * 0.05,
      discount: 0,
      status: 'active',
      imageUrl: item.imageUrl,
      isService,
      sellerName: (item as any).sellerName || session?.sellerId || 'Pi Enterprise Pioneer',
      storeName: session?.storeId || 'Pi Pioneer Store',
      businessName: session?.businessId || 'Pi Business Market Corp'
    };
    if (item.variantId) orderItem.variantId = item.variantId;
    if (item.sku) orderItem.sku = item.sku;
    return orderItem as OrderItem;
  });

  // Calculate Order Summary breakdown
  const summaryBreakdown = session ? EnterpriseCheckoutEngine.calculateOrderSummary(session, orderItems) : null;

  const handleSelectSavedAddress = (addr: SavedCheckoutAddress) => {
    setSelectedAddrId(addr.addressId || '');
    const mapped: Address = {
      fullName: addr.fullName || '',
      email: addr.email || user?.email || '',
      phone: addr.phone || '',
      street: addr.street || '',
      city: addr.city || '',
      state: addr.state || '',
      country: addr.country || 'USA',
      postalCode: addr.postalCode || ''
    };
    setShippingAddress(mapped);
    if (sameAsBilling) {
      setBillingAddress(mapped);
    }
  };

  const handlePlaceOrder = async () => {
    if (!session || !user || isProcessing) return;
    setIsProcessing(true);
    setRecoveryError('');

    try {
      const buyerId = user.uid || (session as any).userId || session.userUid;
      const grandTotal = summaryBreakdown?.grandTotal || session.grandTotal || 0;
      let txid = '';

      if (selectedPaymentMethod === 'pi_testnet' || selectedPaymentMethod === ('pi' as any)) {
        // Execute Pi Testnet Payment
        const verification = await EnterpriseCheckoutEngine.executePiTestnetPayment(
          summaryBreakdown?.piTestnetAmount || grandTotal,
          `Pi Market Order #${session.sessionId}`,
          session.sessionId,
          {
            sessionId: session.sessionId,
            buyerId,
            sellerId: session.sellerId,
            businessId: session.businessId,
            storeId: session.storeId,
            walletAddress: user.walletAddress || '',
            notes: customerNotes,
            orderId: session.sessionId
          }
        );

        if (!verification.verified) {
          throw new Error(verification.errorMessage || 'Pi Testnet transaction verification failed.');
        }
        txid = verification.transactionId;
        const serverOrderId = verification.orderId;
        if (!serverOrderId) {
          throw new Error('Order creation was not confirmed by server during payment completion.');
        }

        const finalAddress = sameAsBilling ? shippingAddress : shippingAddress;
        const orderId = serverOrderId;

        // Fetch created order to present in confirmation screen
        const createdOrder = await orderService.getOrder(orderId);

        // Clear Cart
        if (session.cartIds && session.cartIds.length > 0) {
          await Promise.all(
            session.cartIds.map(async cid => {
              if (cid) await cartService.clearCart(cid);
            })
          );
        }

        setCompletedOrder(createdOrder || {
          orderId,
          grandTotal,
          amount: grandTotal,
          timestamp: Date.now(),
          shippingAddress: finalAddress
        });
        setPaymentTxId(txid);
        setPaymentState('success');
        setIsProcessing(false);

        const event = new CustomEvent('toast', { 
          detail: { message: 'Order Placed & Pi Payment Verified Successfully!', type: 'success' } 
        });
        window.dispatchEvent(event);

        setTimeout(() => {
          navigate(`/order-details/${orderId}`);
        }, 5000);
      } else {
        throw new Error('Pi Testnet Pi is the ONLY active payment currency. BMP is for loyalty rewards only.');
      }

    } catch (err: any) {
      console.error('Order placement failed:', err);
      setRecoveryError(err.message || 'Something went wrong during payment processing. Please try again.');
      setPaymentState('recovery');
      setIsProcessing(false);
    }
  };

  if (paymentState === 'success' && completedOrder) {
    return <PaymentSuccessScreen 
      order={completedOrder} 
      paymentTxId={paymentTxId} 
      address={shippingAddress} 
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
        
        <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-4">
          Payment <span className="text-rose-500">Unsuccessful</span>
        </h1>
        <p className="text-slate-400 max-w-md mx-auto mb-8 text-sm font-medium">
          {recoveryError || 'Transaction was not completed. Please review your payment method and retry.'}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
          <button 
            onClick={() => { setPaymentState('idle'); setRecoveryError(''); }}
            className="flex-1 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCcw className="w-4 h-4" /> Try Again
          </button>
          <button 
            onClick={() => navigate('/cart')}
            className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
             Return to Cart
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
        <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
        <p className="text-xs font-black text-slate-500 uppercase tracking-widest animate-pulse">Initializing Enterprise Checkout Engine...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-black text-white uppercase mb-4">Session Expired</h2>
        <p className="text-slate-400 mb-8 max-w-md text-sm">This checkout session is no longer active or could not be found. Please return to your shopping cart.</p>
        <button onClick={() => navigate('/cart')} className="px-8 py-4 bg-violet-600 text-white rounded-2xl font-bold uppercase tracking-widest text-xs cursor-pointer">
          Return to Cart
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 sm:mb-12">
          <button onClick={() => navigate('/cart')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group w-fit cursor-pointer">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-black uppercase tracking-widest">Back to Cart</span>
          </button>
          
          <div className="flex items-center justify-between md:justify-start gap-4 sm:gap-8 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <StepIndicator current={step === 'shipping'} done={step !== 'shipping'} label="Address" />
            <div className="hidden sm:block w-8 h-px bg-slate-800 shrink-0" />
            <StepIndicator current={step === 'payment'} done={step === 'review'} label="Payment" />
            <div className="hidden sm:block w-8 h-px bg-slate-800 shrink-0" />
            <StepIndicator current={step === 'review'} done={false} label="Review" />
          </div>
          
          <div className="hidden md:flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest">
            <ShieldCheck className="w-5 h-5" />
            <span>Pi Testnet Verified</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8 order-2 lg:order-1">
            {step === 'shipping' && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 md:space-y-8">
                
                {/* Saved Address Selector */}
                {savedAddresses.length > 0 && (
                  <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Bookmark className="w-4 h-4 text-violet-400" />
                        <span>Saved Shipping Addresses</span>
                      </span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {savedAddresses.map((addr) => (
                        <div 
                          key={addr.addressId}
                          onClick={() => handleSelectSavedAddress(addr)}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                            selectedAddrId === addr.addressId
                              ? 'bg-violet-600/15 border-violet-500 shadow-md shadow-violet-500/10'
                              : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-white">{addr.fullName}</span>
                            {addr.isDefault && (
                              <span className="text-[9px] font-black uppercase tracking-wider text-violet-400 bg-violet-950/60 border border-violet-800/80 px-2 py-0.5 rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 truncate">{addr.street}</p>
                          <p className="text-xs text-slate-400">{addr.city}, {addr.state} {addr.postalCode}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Address Form */}
                <section className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 sm:p-8">
                  <h2 className="text-lg font-black text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-violet-400" /> Shipping Address Details
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CheckoutInput label="Full Name" value={shippingAddress.fullName} onChange={(v: string) => setShippingAddress({...shippingAddress, fullName: v})} />
                    <CheckoutInput label="Email" value={shippingAddress.email} onChange={(v: string) => setShippingAddress({...shippingAddress, email: v})} />
                    <div className="md:col-span-2">
                      <CheckoutInput label="Street Address" value={shippingAddress.street} onChange={(v: string) => setShippingAddress({...shippingAddress, street: v})} />
                    </div>
                    <CheckoutInput label="City" value={shippingAddress.city} onChange={(v: string) => setShippingAddress({...shippingAddress, city: v})} />
                    <CheckoutInput label="State" value={shippingAddress.state} onChange={(v: string) => setShippingAddress({...shippingAddress, state: v})} />
                    <CheckoutInput label="Postal Code" value={shippingAddress.postalCode} onChange={(v: string) => setShippingAddress({...shippingAddress, postalCode: v})} />
                    <CheckoutInput label="Country" value={shippingAddress.country} onChange={(v: string) => setShippingAddress({...shippingAddress, country: v})} />
                  </div>

                  {/* Billing Same Checkbox */}
                  <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      id="sameBilling"
                      checked={sameAsBilling}
                      onChange={(e) => setSameAsBilling(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 text-violet-600 focus:ring-violet-500 bg-slate-950 cursor-pointer"
                    />
                    <label htmlFor="sameBilling" className="text-xs text-slate-300 font-medium cursor-pointer">
                      Billing address is same as shipping address
                    </label>
                  </div>

                  {/* Billing Address if different */}
                  {!sameAsBilling && (
                    <div className="mt-6 pt-6 border-t border-slate-800 space-y-4">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Billing Address</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <CheckoutInput label="Billing Name" value={billingAddress.fullName} onChange={(v: string) => setBillingAddress({...billingAddress, fullName: v})} />
                        <CheckoutInput label="Billing Email" value={billingAddress.email} onChange={(v: string) => setBillingAddress({...billingAddress, email: v})} />
                        <div className="md:col-span-2">
                          <CheckoutInput label="Billing Street" value={billingAddress.street} onChange={(v: string) => setBillingAddress({...billingAddress, street: v})} />
                        </div>
                        <CheckoutInput label="Billing City" value={billingAddress.city} onChange={(v: string) => setBillingAddress({...billingAddress, city: v})} />
                        <CheckoutInput label="Billing Postal Code" value={billingAddress.postalCode} onChange={(v: string) => setBillingAddress({...billingAddress, postalCode: v})} />
                      </div>
                    </div>
                  )}
                </section>

                {/* Delivery Option */}
                <section className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 sm:p-8">
                  <h2 className="text-lg font-black text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                    <Truck className="w-5 h-5 text-amber-400" /> Delivery Method
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DeliveryOption 
                      title="Standard Shipping" 
                      desc="Tracked Delivery (3-5 Days)" 
                      price={`${summaryBreakdown?.shipping.toFixed(2) || '10.00'} Pi`} 
                      active={deliveryMethod === 'shipping'}
                      onClick={() => setDeliveryMethod('shipping')}
                    />
                    <DeliveryOption 
                      title="Store Pickup" 
                      desc="Pick up at merchant store" 
                      price="FREE" 
                      active={deliveryMethod === 'pickup'}
                      onClick={() => setDeliveryMethod('pickup')}
                    />
                  </div>
                </section>

                {/* Order Notes / Special Instructions */}
                <section className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 sm:p-8">
                  <h2 className="text-lg font-black text-white uppercase tracking-tight mb-4 flex items-center gap-3">
                    <Bookmark className="w-5 h-5 text-indigo-400" /> Order Notes / Special Instructions
                  </h2>
                  <textarea
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="Enter delivery instructions, gate codes, or special service requests..."
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-violet-500 transition-colors resize-none"
                  />
                </section>

                <button 
                  onClick={() => setStep('payment')}
                  className="w-full py-5 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-violet-600/20 cursor-pointer"
                >
                  Continue to Payment Method
                </button>
              </motion.div>
            )}

            {step === 'payment' && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 md:space-y-8">
                <section className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 sm:p-8">
                  <h2 className="text-lg font-black text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-violet-400" /> Select Payment Method
                  </h2>
                  <PaymentSelector 
                    selectedMethod={selectedPaymentMethod} 
                    onSelect={(method) => setSelectedPaymentMethod(method)} 
                  />
                </section>

                <button 
                  onClick={() => setStep('review')}
                  className="w-full py-5 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-violet-600/20 cursor-pointer"
                >
                  Proceed to Final Review
                </button>
              </motion.div>
            )}

            {step === 'review' && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 md:space-y-8">
                <section className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 sm:p-8">
                  <h2 className="text-lg font-black text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Order Final Review
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-violet-400" /> Shipping Destination
                      </h4>
                      <p className="text-xs font-bold text-white">{shippingAddress.fullName}</p>
                      <p className="text-xs text-slate-400">{shippingAddress.street}</p>
                      <p className="text-xs text-slate-400">{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}, {shippingAddress.country}</p>
                    </div>

                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-emerald-400" /> Selected Payment
                      </h4>
                      <p className="text-xs font-bold text-white uppercase">
                        {selectedPaymentMethod === 'pi_testnet' ? 'Pi Testnet Wallet (SDK)' : 'BMP Rewards Wallet'}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Server-Side Verified Consensus Transaction
                      </p>
                    </div>
                  </div>

                  {/* Items Overview */}
                  <div className="space-y-3 pt-4 border-t border-slate-800">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Purchasing Items ({orderItems.length})
                    </h4>
                    {orderItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 text-xs">
                        <div className="flex items-center gap-3 min-w-0">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.productName} className="w-10 h-10 object-cover rounded-lg border border-slate-800 shrink-0" />
                          ) : (
                            <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
                              <ShoppingBag className="w-4 h-4 text-slate-500" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate">{item.productName}</p>
                            <p className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Store className="w-3 h-3 text-violet-400" />
                              <span>{(item as any).sellerName || 'Merchant'}</span>
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono font-bold text-slate-200">
                            {item.quantity} x {item.unitPrice} Pi
                          </span>
                          <p className="font-mono font-black text-violet-400">
                            {item.subtotal.toFixed(2)} Pi
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <button 
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                  className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-3 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Verifying & Executing Pi Payment...</span>
                    </>
                  ) : (
                    <span>Confirm Order and Pay {summaryBreakdown?.grandTotal.toFixed(2) || session.grandTotal.toFixed(2)} Pi</span>
                  )}
                </button>
              </motion.div>
            )}
          </div>

          {/* Sidebar Order Summary */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="lg:sticky lg:top-28 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
              <h3 className="text-base font-black text-white uppercase tracking-tight border-b border-slate-800/80 pb-4">
                Order Summary
              </h3>

              {/* Items List */}
              <div className="space-y-4 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                {orderItems.map((item, idx) => (
                  <div key={idx} className="flex gap-3 text-xs">
                    <div className="w-12 h-12 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex-shrink-0 flex items-center justify-center">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                      ) : (
                        <ShoppingBag className="w-5 h-5 text-slate-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white truncate">{item.productName}</h4>
                      <p className="text-[10px] text-slate-400">
                        Qty: {item.quantity} × {item.unitPrice} Pi
                      </p>
                      <p className="text-[10px] text-violet-400 flex items-center gap-1 mt-0.5">
                        <Store className="w-3 h-3" />
                        <span className="truncate">{(item as any).sellerName || 'Merchant'}</span>
                      </p>
                    </div>
                    <span className="font-mono font-bold text-white shrink-0">{item.subtotal.toFixed(2)} Pi</span>
                  </div>
                ))}
              </div>

              {/* Summary Calculations */}
              <div className="space-y-3 pt-4 border-t border-slate-800 text-xs">
                {summaryBreakdown?.productSubtotal! > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Products Subtotal</span>
                    <span className="text-white font-mono font-bold">{summaryBreakdown?.productSubtotal.toFixed(2)} Pi</span>
                  </div>
                )}

                {summaryBreakdown?.serviceSubtotal! > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Services Subtotal</span>
                    <span className="text-white font-mono font-bold">{summaryBreakdown?.serviceSubtotal.toFixed(2)} Pi</span>
                  </div>
                )}

                {summaryBreakdown?.discount! > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount / Coupon</span>
                    <span className="font-mono font-bold">-{summaryBreakdown?.discount.toFixed(2)} Pi</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-400">
                  <span>Shipping Charges</span>
                  <span className="text-white font-mono font-bold">+{summaryBreakdown?.shipping.toFixed(2) || session.shipping.toFixed(2)} Pi</span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>Tax (5%)</span>
                  <span className="text-white font-mono font-bold">+{summaryBreakdown?.tax.toFixed(2) || session.tax.toFixed(2)} Pi</span>
                </div>

                {/* Rewards Preview */}
                <div className="p-3 bg-gradient-to-r from-amber-500/10 to-violet-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Estimated Reward</span>
                  </div>
                  <span className="font-mono font-black text-amber-400">
                    +{summaryBreakdown?.bmpRewardsEstimate || 0} BMP
                  </span>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                  <span className="font-bold text-white uppercase">Grand Total</span>
                  <span className="text-xl font-black text-violet-400 font-mono">
                    {summaryBreakdown?.grandTotal.toFixed(2) || session.grandTotal.toFixed(2)} Pi
                  </span>
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
  <div className="flex items-center gap-2">
    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
      done ? 'bg-emerald-500 text-white' : 
      current ? 'bg-violet-600 text-white ring-4 ring-violet-600/20' : 
      'bg-slate-800 text-slate-500'
    }`}>
      {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
      {!done && label[0]}
    </div>
    <span className={`text-xs font-bold uppercase tracking-wider ${current ? 'text-white' : 'text-slate-500'}`}>
      {label}
    </span>
  </div>
);

interface DeliveryOptionProps {
  title: string;
  desc: string;
  price: string;
  active: boolean;
  onClick?: () => void;
}

const DeliveryOption: React.FC<DeliveryOptionProps> = ({ title, desc, price, active, onClick }) => (
  <div 
    onClick={onClick}
    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
      active ? 'bg-violet-600/10 border-violet-500 shadow-md shadow-violet-500/10' : 'bg-slate-950 border-slate-800 hover:border-slate-700'
    }`}
  >
    <div className="flex justify-between items-start mb-1 gap-2">
      <h4 className="text-xs font-bold text-white uppercase">{title}</h4>
      <span className="text-xs font-bold text-violet-400 font-mono">{price}</span>
    </div>
    <p className="text-[10px] text-slate-400">{desc}</p>
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
        className="w-20 h-20 bg-emerald-600/10 rounded-full flex items-center justify-center mb-6"
      >
        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
      </motion.div>
      
      <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-2">
        Payment <span className="text-emerald-500">Verified & Order Placed</span>
      </h1>
      <p className="text-slate-400 max-w-sm mx-auto mb-8 text-xs font-medium flex items-center justify-center gap-2">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
        Redirecting to order details in {countdown}s...
      </p>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-8 w-full max-w-sm text-left space-y-3 text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <span className="text-slate-400 uppercase">Amount Paid</span>
          <span className="font-mono font-bold text-emerald-400 text-sm">
            {(order.amount || order.grandTotal || 0).toFixed(2)} Pi
          </span>
        </div>
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <span className="text-slate-400 uppercase">Order ID</span>
          <span className="font-mono font-bold text-white">{order.orderId || order.orderNumber || 'CONFIRMED'}</span>
        </div>
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <span className="text-slate-400 uppercase">Transaction Hash</span>
          <span className="font-mono text-slate-300 text-[11px] truncate max-w-[140px]">{paymentTxId || 'Verified On-Chain'}</span>
        </div>
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <span className="text-slate-400 uppercase">Delivery Address</span>
          <span className="font-bold text-white text-right max-w-[140px] truncate">
            {address?.street || ''}, {address?.city || ''}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400 uppercase">Status</span>
          <span className="font-bold text-emerald-400 uppercase">Confirmed & Paid</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
        <button 
          onClick={() => navigate(`/order-details/${order.orderId || order.id}`)}
          className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Package className="w-4 h-4" /> View Order
        </button>
        <button 
          onClick={() => navigate('/cart')}
          className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4" /> Back to Market
        </button>
      </div>
    </div>
  );
};
