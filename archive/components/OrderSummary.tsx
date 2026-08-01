/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  ShoppingBag, 
  Tag, 
  Calendar, 
  Clock, 
  Store, 
  Truck, 
  Sparkles,
  Info
} from 'lucide-react';
import { ExtendedCartItem } from '../cart/ShoppingCart';
import { DeliveryType } from './CheckoutForm';

interface OrderSummaryProps {
  items: ExtendedCartItem[];
  deliveryType: DeliveryType;
  discountCode?: string;
  onApplyDiscount?: (code: string) => void;
  selectedItemIds?: string[];
  onToggleItem?: (itemId: string) => void;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  items,
  deliveryType,
  discountCode = '',
  onApplyDiscount,
  selectedItemIds,
  onToggleItem
}) => {
  const activeSelectedIds = selectedItemIds ?? items.map(item => item.itemId);
  const handleToggle = onToggleItem ?? (() => {});

  const isServiceItem = (item: ExtendedCartItem) => {
    return item.type === 'service' || 
           item.serviceDate !== undefined || 
           (item.name && (
             item.name.toLowerCase().includes('consultation') || 
             item.name.toLowerCase().includes('service') || 
             item.name.toLowerCase().includes('repair') || 
             item.name.toLowerCase().includes('class') || 
             item.name.toLowerCase().includes('lesson') ||
             item.name.toLowerCase().includes('electrician') ||
             item.name.toLowerCase().includes('doctor') ||
             item.name.toLowerCase().includes('teacher') ||
             item.name.toLowerCase().includes('cleaning') ||
             item.name.toLowerCase().includes('booking')
           ));
  };

  // 1. Calculations based on selection
  const selectedItems = items.filter(item => activeSelectedIds.includes(item.itemId));
  const subtotal = selectedItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  
  // Delivery Charge
  let deliveryCharge = 0;
  if (deliveryType === 'express') {
    deliveryCharge = 2.50;
  }

  // Discount
  const discount = subtotal > 100 ? 5.00 : 0.00; // Auto-apply 5 Pi discount for orders over 100 Pi!

  const total = subtotal + deliveryCharge - discount;

  return (
    <div className="bg-slate-900/40 border border-slate-800/80 p-6 sm:p-8 rounded-3xl relative overflow-hidden" id="order_summary_container">
      <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />
      
      <h2 className="text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2.5 mb-6 pb-3 border-b border-slate-800/60">
        <ShoppingBag className="w-5 h-5 text-violet-400" />
        <span>4. Order Summary</span>
      </h2>

      {/* Items List */}
      <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent mb-6" id="summary_items_list">
        {items.map((item) => {
          const isService = isServiceItem(item);
          const isSelected = activeSelectedIds.includes(item.itemId);
          return (
            <div key={item.itemId} className={`flex gap-4 p-3.5 bg-slate-950/45 border rounded-2xl transition-all ${isSelected ? 'border-violet-500/50' : 'border-slate-850'}`}>
              
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleToggle(item.itemId)}
                className="mt-1 accent-violet-500 h-4 w-4 rounded border-slate-700 cursor-pointer"
              />

              {/* Product/Service Image */}
              <div className="w-14 h-14 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shrink-0 flex items-center justify-center relative">
                {item.imageUrl ? (
                  <img 
                    src={item.imageUrl} 
                    alt={item.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <ShoppingBag className="w-5 h-5 text-slate-600" />
                )}
                <span className="absolute bottom-0.5 right-0.5 text-[7px] font-black uppercase tracking-widest px-1 bg-slate-950/90 text-slate-400 rounded border border-slate-850">
                  {isService ? 'Serv' : 'Prod'}
                </span>
              </div>

              {/* Item Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div>
                  <div className="flex justify-between items-start gap-3">
                    <h3 className="text-xs font-bold text-white uppercase tracking-tight truncate">
                      {item.name}
                    </h3>
                    <p className="text-xs font-black text-violet-400 font-mono">
                      {(item.unitPrice * item.quantity).toFixed(2)} Pi
                    </p>
                  </div>

                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                    <Store className="w-3 h-3 text-violet-400" />
                    <span>{item.sellerName || 'Pioneer Merchant'}</span>
                  </p>
                </div>

                {/* Specific features for services vs products */}
                {isService ? (
                  <div className="mt-2 flex items-center gap-3.5 text-[9px] text-slate-400 bg-slate-900/40 px-2 py-1 rounded-md border border-slate-850/50 w-fit">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-violet-400" />
                      <span className="font-bold uppercase tracking-wider">Date:</span>
                      <span className="font-semibold text-white">{item.serviceDate || '2026-08-15'}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-violet-400" />
                      <span className="font-bold uppercase tracking-wider">Time:</span>
                      <span className="font-semibold text-white">{item.serviceTime || '14:00 PM'}</span>
                    </span>
                  </div>
                ) : (
                  <div className="mt-2 text-[9px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <span>Qty:</span>
                    <span className="text-white font-mono font-black">{item.quantity}</span>
                    <span className="text-slate-700">|</span>
                    <span>Price:</span>
                    <span className="text-slate-300 font-mono">{item.unitPrice.toFixed(2)} Pi</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Auto Applied Discount Note */}
      {discount > 0 && (
        <div className="mb-6 p-3 bg-violet-600/10 border border-violet-500/20 rounded-2xl flex items-center gap-2.5">
          <Sparkles className="w-4.5 h-4.5 text-amber-400 shrink-0" />
          <p className="text-[10px] text-violet-300 font-semibold leading-snug">
            Congratulations! You qualified for a <span className="text-white font-black">5.00 Pi</span> Loyalty discount (Order &gt; 100 Pi).
          </p>
        </div>
      )}

      {/* Subtotals & Pricing breakdown */}
      <div className="space-y-3.5 pt-4 border-t border-slate-800/80 mb-6 text-xs">
        {/* Subtotal */}
        <div className="flex justify-between items-center text-slate-400 font-semibold">
          <span>Subtotal</span>
          <span className="text-white font-mono font-bold">{subtotal.toFixed(2)} Pi</span>
        </div>

        {/* Delivery Charge */}
        <div className="flex justify-between items-center text-slate-400 font-semibold">
          <span>Delivery Charge ({deliveryType === 'pickup' ? 'Pickup' : deliveryType === 'express' ? 'Express' : 'Standard'})</span>
          {deliveryCharge > 0 ? (
            <span className="text-amber-400 font-mono font-bold">+{deliveryCharge.toFixed(2)} Pi</span>
          ) : (
            <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px]">FREE</span>
          )}
        </div>

        {/* Discount */}
        {discount > 0 && (
          <div className="flex justify-between items-center text-slate-400 font-semibold">
            <span>Loyalty Discount</span>
            <span className="text-emerald-400 font-mono font-bold">-{discount.toFixed(2)} Pi</span>
          </div>
        )}

        {/* Total */}
        <div className="pt-4 border-t border-slate-850 flex justify-between items-center">
          <span className="text-sm font-bold text-white uppercase tracking-tight">Total</span>
          <span className="text-xl font-black text-violet-400 font-mono">{total.toFixed(2)} Pi</span>
        </div>
      </div>

      {/* Security Note */}
      <div className="p-3.5 bg-slate-950/60 border border-slate-850 rounded-2xl flex items-start gap-2.5">
        <Info className="w-4.5 h-4.5 text-indigo-400 shrink-0 mt-0.5" />
        <p className="text-[10px] text-slate-500 leading-normal font-medium">
          Note: This checkout process prepares the order for decentralized peer-to-peer verification. No transactions will be processed at this phase.
        </p>
      </div>
    </div>
  );
};
