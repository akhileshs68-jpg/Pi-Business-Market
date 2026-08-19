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

  const [quoteNotice, setQuoteNotice] = useState<string>('');

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
      let data = await checkoutService.getSession(sessionId!);
      if (data) {
        // Phase 7: Validate Quote Freshness (15 min TTL)
        const nowMs = Date.now();
        const expiresMs = data.quoteExpiresAt ? new Date(data.quoteExpiresAt).getTime() : 0;
        if (!data.pricingSnapshot || !data.pricingQuoteId || isNaN(expiresMs) || nowMs >= expiresMs) {
          console.log('[Checkout] Pricing quote missing or expired. Refreshing quote with live rates...');
          try {
            data = await checkoutService.refreshSessionQuote(sessionId!);
            setQuoteNotice('Checkout pricing quote refreshed with live rate.');
          } catch (rErr) {
            console.warn('[Checkout] Refresh quote error:', rErr);
          }
        } else if (data.quotePriceChanged && data.priceChangeNotice) {
          setQuoteNotice(data.priceChangeNotice);
        }

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
    console.log('[DEBUG_TRACE] [handlePlaceOrder] ENTER');
    if (!session || !user || isProcessing) {
      console.log('[DEBUG_TRACE] [handlePlaceOrder] Early return guard:', { hasSession: !!session, hasUser: !!user, isProcessing });
      console.log('[DEBUG_TRACE] [handlePlaceOrder] EXIT (guard)');
      return;
    }
    setIsProcessing(true);
    setRecoveryError('');

    try {
      const buyerId = user.uid || (session as any).userId || session.userUid;
      const grandTotal = summaryBreakdown?.grandTotal || session.grandTotal || 0;
      let txid = '';

      if (selectedPaymentMethod === 'pi_testnet' || selectedPaymentMethod === ('pi' as any)) {
        console.log('[DEBUG_TRACE] [handlePlaceOrder] BEFORE await EnterpriseCheckoutEngine.executePiTestnetPayment');
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
            orderId: session.sessionId,
            pricingQuoteId: session.pricingQuoteId,
            pricingSnapshot: session.pricingSnapshot
          }
        );
        console.log('[DEBUG_TRACE] [handlePlaceOrder] AFTER await EnterpriseCheckoutEngine.executePiTestnetPayment, result:', verification);

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
        let createdOrder = await orderService.getOrder(orderId);

        if (!createdOrder) {
          console.warn('[Checkout] Order document not found in Firestore for orderId:', orderId, '. Creating fallback order document client-side...');
          const nowIso = new Date().toISOString();
          const fallbackOrderData = {
            id: orderId,
            orderId: orderId,
            orderNumber: orderId,
            sessionId: session.sessionId,
            buyerId,
            userUid: buyerId,
            sellerId: session.sellerId || session.businessId || 'PI-SELLER',
            businessId: session.businessId || 'PI-BIZ',
            storeId: session.storeId || '',
            items: (session as any).items || [],
            grandTotal,
            totalAmount: grandTotal,
            amount: grandTotal,
            subtotal: session.subtotal || grandTotal,
            shippingAddress: finalAddress,
            paymentMethod: 'Pi Network (Testnet)',
            paymentStatus: 'completed',
            orderStatus: 'paid',
            status: 'paid',
            txid,
            transactionId: txid,
            createdAt: nowIso,
            updatedAt: nowIso
          };
          try {
            await orderService.createOrderWithId(orderId, fallbackOrderData);
            createdOrder = await orderService.getOrder(orderId) || fallbackOrderData;
          } catch (createErr) {
            console.error('[Checkout] Failed to create fallback order document:', createErr);
            createdOrder = fallbackOrderData;
          }
        }

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

        console.log('[Checkout Navigation Trace] Order completed successfully. Target Order ID:', orderId);
        console.log('[Checkout Navigation Trace] Scheduling auto-navigate to:', `/order-details/${orderId}`, 'in 5 seconds.');
        setTimeout(() => {
          console.log('[Checkout Navigation Trace] setTimeout triggered! Executing navigate to:', `/order-details/${orderId}`);
          navigate(`/order-details/${orderId}`);
          console.log('[Checkout Navigation Trace] navigate() call executed.');
        }, 5000);
      } else {
        throw new Error('Pi Testnet Pi is the ONLY active payment currency.');
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
          className="w-20 h-20 bg-rose-600/10 border border-rose-500/20 rounded-3xl flex items-center justify-center mb-6 shadow-xl"
        >
          <AlertCircle className="w-10 h-10 text-rose-500" />
        </motion.div>
        
        <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight mb-3">
          Payment <span className="text-rose-500">Unsuccessful</span>
        </h1>
        <p className="text-slate-400 max-w-md mx-auto mb-8 text-xs sm:text-sm font-medium leading-relaxed">
          {recoveryError || 'Transaction was not completed. Please review your payment method and retry.'}
        </p>

        <div className="flex flex-col sm:flex-row gap-3.5 w-full max-w-sm">
          <button 
            onClick={() => { setPaymentState('idle'); setRecoveryError(''); }}
            aria-label="Try payment again"
            className="flex-1 min-h-[48px] px-6 py-3.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 shadow-lg shadow-rose-600/20"
          >
            <RefreshCcw className="w-4 h-4" /> Try Again
          </button>
          <button 
            onClick={() => navigate('/cart')}
            aria-label="Return to cart"
            className="flex-1 min-h-[48px] px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
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
        <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Initializing Enterprise Checkout...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mb-6 shadow-xl text-slate-400">
          <ShoppingBag className="w-8 h-8 text-violet-400" />
        </div>
        <h2 className="text-xl font-bold text-white uppercase mb-2 tracking-tight">Session Expired</h2>
        <p className="text-slate-400 mb-8 max-w-md text-xs sm:text-sm leading-relaxed">This checkout session is no longer active or could not be found. Please return to your shopping cart.</p>
        <button 
          onClick={() => navigate('/cart')} 
          aria-label="Return to shopping cart"
          className="min-h-[48px] px-8 py-3.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold uppercase tracking-wider text-xs cursor-pointer shadow-lg shadow-violet-600/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
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
          <button 
            onClick={() => navigate('/cart')} 
            aria-label="Back to Cart"
            className="min-h-[44px] flex items-center gap-2 text-slate-400 hover:text-white transition-colors group w-fit cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 rounded-xl px-2.5 py-1 -ml-2.5"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform text-slate-400 group-hover:text-violet-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Back to Cart</span>
          </button>
          
          <nav aria-label="Checkout Progress" className="flex items-center justify-between md:justify-start gap-4 sm:gap-8 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <StepIndicator current={step === 'shipping'} done={step !== 'shipping'} label="Address" stepNumber={1} />
            <div className="hidden sm:block w-8 h-px bg-slate-800 shrink-0" aria-hidden="true" />
            <StepIndicator current={step === 'payment'} done={step === 'review'} label="Payment" stepNumber={2} />
            <div className="hidden sm:block w-8 h-px bg-slate-800 shrink-0" aria-hidden="true" />
            <StepIndicator current={step === 'review'} done={false} label="Review" stepNumber={3} />
          </nav>
          
          <div className="hidden md:flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider bg-emerald-950/40 border border-emerald-800/40 px-3 py-1.5 rounded-full">
            <ShieldCheck className="w-4 h-4" />
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
                  <section className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 sm:p-7">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Bookmark className="w-4 h-4 text-violet-400" />
                        <span>Saved Shipping Addresses</span>
                      </span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3" role="radiogroup" aria-label="Saved Shipping Addresses">
                      {savedAddresses.map((addr) => {
                        const isSelected = selectedAddrId === addr.addressId;
                        return (
                          <button 
                            key={addr.addressId}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() => handleSelectSavedAddress(addr)}
                            className={`p-4 min-h-[56px] rounded-2xl border cursor-pointer text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
                              isSelected
                                ? 'bg-violet-600/15 border-violet-500 shadow-md shadow-violet-500/10'
                                : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-bold text-white">{addr.fullName}</span>
                              {addr.isDefault && (
                                <span className="text-[9px] font-bold uppercase tracking-wider text-violet-400 bg-violet-950/60 border border-violet-800/80 px-2 py-0.5 rounded-full">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 truncate">{addr.street}</p>
                            <p className="text-xs text-slate-400">{addr.city}, {addr.state} {addr.postalCode}</p>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Address Form */}
                <section className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 sm:p-8">
                  <h2 className="text-lg font-bold text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-violet-400" /> Shipping Address Details
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CheckoutInput label="Full Name" value={shippingAddress.fullName} onChange={(v: string) => setShippingAddress({...shippingAddress, fullName: v})} required />
                    <CheckoutInput label="Email" value={shippingAddress.email} onChange={(v: string) => setShippingAddress({...shippingAddress, email: v})} type="email" required />
                    <div className="md:col-span-2">
                      <CheckoutInput label="Street Address" value={shippingAddress.street} onChange={(v: string) => setShippingAddress({...shippingAddress, street: v})} required />
                    </div>
                    <CheckoutInput label="City" value={shippingAddress.city} onChange={(v: string) => setShippingAddress({...shippingAddress, city: v})} required />
                    <CheckoutInput label="State" value={shippingAddress.state} onChange={(v: string) => setShippingAddress({...shippingAddress, state: v})} required />
                    <CheckoutInput label="Postal Code" value={shippingAddress.postalCode} onChange={(v: string) => setShippingAddress({...shippingAddress, postalCode: v})} required />
                    <CheckoutInput label="Country" value={shippingAddress.country} onChange={(v: string) => setShippingAddress({...shippingAddress, country: v})} required />
                  </div>

                  {/* Billing Same Checkbox */}
                  <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-3 min-h-[44px]">
                    <input 
                      type="checkbox" 
                      id="sameBilling"
                      checked={sameAsBilling}
                      onChange={(e) => setSameAsBilling(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 text-violet-600 focus:ring-violet-400 bg-slate-950 cursor-pointer"
                    />
                    <label htmlFor="sameBilling" className="text-xs text-slate-300 font-medium cursor-pointer select-none">
                      Billing address is same as shipping address
                    </label>
                  </div>

                  {/* Billing Address if different */}
                  {!sameAsBilling && (
                    <div className="mt-6 pt-6 border-t border-slate-800 space-y-4">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Billing Address</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <CheckoutInput label="Billing Name" value={billingAddress.fullName} onChange={(v: string) => setBillingAddress({...billingAddress, fullName: v})} required />
                        <CheckoutInput label="Billing Email" value={billingAddress.email} onChange={(v: string) => setBillingAddress({...billingAddress, email: v})} type="email" required />
                        <div className="md:col-span-2">
                          <CheckoutInput label="Billing Street" value={billingAddress.street} onChange={(v: string) => setBillingAddress({...billingAddress, street: v})} required />
                        </div>
                        <CheckoutInput label="Billing City" value={billingAddress.city} onChange={(v: string) => setBillingAddress({...billingAddress, city: v})} required />
                        <CheckoutInput label="Billing Postal Code" value={billingAddress.postalCode} onChange={(v: string) => setBillingAddress({...billingAddress, postalCode: v})} required />
                      </div>
                    </div>
                  )}
                </section>

                {/* Delivery Option */}
                <section className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 sm:p-8">
                  <h2 className="text-lg font-bold text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                    <Truck className="w-5 h-5 text-amber-400" /> Delivery Method
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4" role="radiogroup" aria-label="Delivery Method">
                    <DeliveryOption 
                      title="Standard Shipping" 
                      desc="Tracked Courier Delivery (3-5 Days)" 
                      price={`${(summaryBreakdown?.shipping ?? 0.50).toFixed(2)} Pi`} 
                      active={deliveryMethod === 'shipping'}
                      onClick={() => setDeliveryMethod('shipping')}
                    />
                    <DeliveryOption 
                      title="Store Pickup" 
                      desc="Pick up directly at merchant location" 
                      price="FREE" 
                      active={deliveryMethod === 'pickup'}
                      onClick={() => setDeliveryMethod('pickup')}
                    />
                  </div>
                </section>

                {/* Order Notes / Special Instructions */}
                <section className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 sm:p-8">
                  <h2 className="text-lg font-bold text-white uppercase tracking-tight mb-4 flex items-center gap-3">
                    <Bookmark className="w-5 h-5 text-violet-400" /> 
                    <label htmlFor="customerNotes" className="cursor-pointer">Order Notes / Special Instructions</label>
                  </h2>
                  <textarea
                    id="customerNotes"
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="Enter delivery instructions, gate codes, or special service requests..."
                    rows={3}
                    className="w-full bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500 focus-visible:ring-2 focus-visible:ring-violet-400 transition-colors resize-none"
                  />
                </section>

                <button 
                  onClick={() => setStep('payment')}
                  aria-label="Continue to payment method"
                  className="w-full min-h-[50px] py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-violet-600/20 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                >
                  Continue to Payment Method
                </button>
              </motion.div>
            )}

            {step === 'payment' && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 md:space-y-8">
                <section className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 sm:p-8">
                  <h2 className="text-lg font-bold text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-violet-400" /> Select Payment Method
                  </h2>
                  <PaymentSelector 
                    selectedMethod={selectedPaymentMethod} 
                    onSelect={(method) => setSelectedPaymentMethod(method)} 
                  />
                </section>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep('shipping')}
                    aria-label="Back to shipping address"
                    className="min-h-[50px] px-6 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                  >
                    Back
                  </button>
                  <button 
                    onClick={() => setStep('review')}
                    aria-label="Proceed to final review"
                    className="flex-1 min-h-[50px] py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-violet-600/20 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                  >
                    Proceed to Final Review
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'review' && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 md:space-y-8">
                <section className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 sm:p-8">
                  <h2 className="text-lg font-bold text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Order Final Review
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800/80">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-violet-400" /> Shipping Destination
                      </h4>
                      <p className="text-xs font-bold text-white">{shippingAddress.fullName}</p>
                      <p className="text-xs text-slate-400">{shippingAddress.street}</p>
                      <p className="text-xs text-slate-400">{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}, {shippingAddress.country}</p>
                    </div>

                    <div className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800/80">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-emerald-400" /> Selected Payment
                      </h4>
                      <p className="text-xs font-bold text-white uppercase">
                        Pi Testnet Wallet (SDK)
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
                      <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/60 text-xs">
                        <div className="flex items-center gap-3 min-w-0">
                          {item.imageUrl ? (
                            <img 
                              src={item.imageUrl} 
                              alt={item.productName} 
                              className="w-10 h-10 object-cover rounded-lg border border-slate-800 shrink-0" 
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500';
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
                              <ShoppingBag className="w-4 h-4 text-slate-500" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate">{item.productName}</p>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Store className="w-3 h-3 text-violet-400 shrink-0" />
                              <span className="truncate">{(item as any).sellerName || 'Merchant'}</span>
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono font-medium text-slate-300">
                            {item.quantity} x {item.unitPrice} Pi
                          </span>
                          <p className="font-mono font-bold text-violet-400">
                            {item.subtotal.toFixed(2)} Pi
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep('payment')}
                    disabled={isProcessing}
                    aria-label="Back to payment method"
                    className="min-h-[50px] px-6 py-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 hover:text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                  >
                    Back
                  </button>
                  <button 
                    onClick={handlePlaceOrder}
                    disabled={isProcessing}
                    aria-label={`Confirm Order and Pay ${(summaryBreakdown?.grandTotal || session.grandTotal || 0).toFixed(2)} Pi`}
                    className="flex-1 min-h-[50px] py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying & Executing Pi Payment...</span>
                      </>
                    ) : (
                      <span>Confirm Order and Pay {(summaryBreakdown?.grandTotal || session.grandTotal || 0).toFixed(2)} Pi</span>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar Order Summary */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="lg:sticky lg:top-28 bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 sm:p-7 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <h3 className="text-base font-bold text-white uppercase tracking-tight">
                  Order Summary
                </h3>
                <span className="text-xs font-bold text-slate-400">
                  {orderItems.length} {orderItems.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                {orderItems.map((item, idx) => (
                  <div key={idx} className="flex gap-3 text-xs">
                    <div className="w-12 h-12 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex-shrink-0 flex items-center justify-center">
                      {item.imageUrl ? (
                        <img 
                          src={item.imageUrl} 
                          alt={item.productName} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500';
                          }}
                        />
                      ) : (
                        <ShoppingBag className="w-5 h-5 text-slate-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white truncate">{item.productName}</h4>
                      <p className="text-xs text-slate-400">
                        Qty: {item.quantity} × {item.unitPrice} Pi
                      </p>
                      <p className="text-xs text-violet-400 flex items-center gap-1 mt-0.5">
                        <Store className="w-3 h-3 shrink-0" />
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
                  <div className="flex justify-between text-slate-400 font-medium">
                    <span>Products Subtotal</span>
                    <span className="text-white font-mono font-bold">{summaryBreakdown?.productSubtotal.toFixed(2)} Pi</span>
                  </div>
                )}

                {summaryBreakdown?.serviceSubtotal! > 0 && (
                  <div className="flex justify-between text-slate-400 font-medium">
                    <span>Services Subtotal</span>
                    <span className="text-white font-mono font-bold">{summaryBreakdown?.serviceSubtotal.toFixed(2)} Pi</span>
                  </div>
                )}

                {summaryBreakdown?.discount! > 0 && (
                  <div className="flex justify-between text-emerald-400 font-medium">
                    <span>Discount / Coupon</span>
                    <span className="font-mono font-bold">-{summaryBreakdown?.discount.toFixed(2)} Pi</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-400 font-medium">
                  <span>Shipping Charges</span>
                  <span className="text-slate-300 font-mono font-bold">+{summaryBreakdown?.shipping.toFixed(2) || session.shipping.toFixed(2)} Pi</span>
                </div>

                <div className="flex justify-between text-slate-400 font-medium">
                  <span>Tax (5%)</span>
                  <span className="text-slate-300 font-mono font-bold">+{summaryBreakdown?.tax.toFixed(2) || session.tax.toFixed(2)} Pi</span>
                </div>

                {/* Rewards Preview */}
                <div className="p-3 bg-gradient-to-r from-amber-500/10 to-violet-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300">
                    <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Estimated Reward</span>
                  </div>
                  <span className="font-mono font-black text-amber-400">
                    +{summaryBreakdown?.bmpRewardsEstimate || 0} BMP
                  </span>
                </div>

                {/* Authoritative Pricing Quote Info */}
                {session.pricingSnapshot && (
                  <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl space-y-1.5 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-300">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Quote #{session.pricingQuoteId?.slice(0, 12)}...
                      </span>
                      <span className="text-[10px] text-emerald-400 uppercase font-mono font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60">
                        {session.pricingSnapshot.pricingMode} Mode
                      </span>
                    </div>
                    {session.pricingSnapshot.rateUsed && (
                      <div className="flex justify-between text-slate-400">
                        <span>Rate Used:</span>
                        <span className="font-mono text-slate-200">1 Pi = {(1 / session.pricingSnapshot.rateUsed).toFixed(2)} {session.pricingSnapshot.localCurrency}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-slate-400 pt-1 border-t border-slate-900">
                      <span>Rate Source:</span>
                      <span className="truncate max-w-[130px] font-mono text-slate-300">{session.pricingSnapshot.rateSource}</span>
                    </div>
                  </div>
                )}

                {quoteNotice && (
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{quoteNotice}</span>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                  <span className="font-bold text-white uppercase">Grand Total</span>
                  <span className="text-xl font-black text-violet-400 font-mono">
                    {(summaryBreakdown?.grandTotal || session.grandTotal || 0).toFixed(2)} Pi
                  </span>
                </div>
              </div>

              {/* Trust Badge */}
              <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl flex items-center gap-2.5 text-slate-400">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-[11px] font-medium leading-tight">Non-custodial escrow release after delivery confirmation.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StepIndicator = ({ current, done, label, stepNumber }: { current: boolean; done: boolean; label: string; stepNumber: number }) => (
  <div 
    className="flex items-center gap-2.5 min-h-[44px]"
    aria-current={current ? 'step' : undefined}
  >
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
      done ? 'bg-emerald-500 text-white' : 
      current ? 'bg-violet-600 text-white ring-4 ring-violet-600/20' : 
      'bg-slate-800 text-slate-400'
    }`}>
      {done ? <CheckCircle2 className="w-4 h-4" /> : stepNumber}
    </div>
    <span className={`text-xs font-bold uppercase tracking-wider ${current ? 'text-white' : 'text-slate-400'}`}>
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
  <button 
    type="button"
    role="radio"
    aria-checked={active}
    onClick={onClick}
    className={`p-4 min-h-[56px] rounded-2xl border text-left cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
      active ? 'bg-violet-600/15 border-violet-500 shadow-md shadow-violet-500/10' : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
    }`}
  >
    <div className="flex justify-between items-start mb-1 gap-2">
      <h4 className="text-xs font-bold text-white uppercase">{title}</h4>
      <span className="text-xs font-bold text-violet-400 font-mono">{price}</span>
    </div>
    <p className="text-xs text-slate-400 font-medium">{desc}</p>
  </button>
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
        className="w-20 h-20 bg-emerald-600/10 border border-emerald-500/20 rounded-3xl flex items-center justify-center mb-6 shadow-xl"
      >
        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
      </motion.div>
      
      <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight mb-2">
        Payment <span className="text-emerald-400">Verified & Order Placed</span>
      </h1>
      <p className="text-slate-400 max-w-sm mx-auto mb-8 text-xs font-medium flex items-center justify-center gap-2">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
        Redirecting to order details in {countdown}s...
      </p>

      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 mb-8 w-full max-w-sm text-left space-y-3 text-xs shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
          <span className="text-slate-400 uppercase tracking-wider text-[11px] font-semibold">Amount Paid</span>
          <span className="font-mono font-bold text-emerald-400 text-sm">
            {(order.amount || order.grandTotal || 0).toFixed(2)} Pi
          </span>
        </div>
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
          <span className="text-slate-400 uppercase tracking-wider text-[11px] font-semibold">Order ID</span>
          <span className="font-mono font-bold text-white">{order.orderId || order.orderNumber || 'CONFIRMED'}</span>
        </div>
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
          <span className="text-slate-400 uppercase tracking-wider text-[11px] font-semibold">Transaction Hash</span>
          <span className="font-mono text-slate-300 text-xs truncate max-w-[140px]">{paymentTxId || 'Verified On-Chain'}</span>
        </div>
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
          <span className="text-slate-400 uppercase tracking-wider text-[11px] font-semibold">Delivery Address</span>
          <span className="font-bold text-white text-right max-w-[140px] truncate">
            {address?.street || ''}, {address?.city || ''}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400 uppercase tracking-wider text-[11px] font-semibold">Status</span>
          <span className="font-bold text-emerald-400 uppercase">Confirmed & Paid</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3.5 w-full max-w-sm">
        <button 
          onClick={() => {
            const targetUri = `/order-details/${order.orderId}`;
            navigate(targetUri);
          }}
          aria-label="View Order details"
          className="flex-1 min-h-[48px] py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 shadow-lg shadow-emerald-600/20"
        >
          <Package className="w-4 h-4" /> View Order
        </button>
        <button 
          onClick={() => {
            navigate('/cart');
          }}
          aria-label="Back to Shopping Cart"
          className="flex-1 min-h-[48px] py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          <ShoppingBag className="w-4 h-4" /> Back to Cart
        </button>
      </div>
    </div>
  );
};
