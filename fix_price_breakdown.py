import re

with open('src/pages/OrderDetails.tsx', 'r') as f:
    content = f.read()

price_breakdown_replacement = """            {/* Price Breakdown */}
            <section className="bg-slate-900/50 border border-slate-800 rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8">
              <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                <Tag className="w-6 h-6 text-emerald-400" /> Price Breakdown
              </h2>
              
              <div className="space-y-4">
                <div className="flex justify-between text-xs sm:text-sm font-bold text-slate-400">
                  <span>Product Subtotal</span>
                  <span className="text-white">{order.subtotal.toFixed(2)} Pi</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm font-bold text-slate-400">
                  <span>Shipping Charge</span>
                  <span className="text-white">+{order.shipping.toFixed(2)} Pi</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm font-bold text-emerald-400">
                  <span>Discount</span>
                  <span>-{order.discount?.toFixed(2) || '0.00'} Pi</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm font-bold text-emerald-400">
                  <span>Coupon Discount</span>
                  <span>-0.00 Pi</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm font-bold text-slate-400 border-b border-slate-800 pb-4">
                  <span>Tax (GST/VAT)</span>
                  <span className="text-white">+{order.tax.toFixed(2)} Pi</span>
                </div>
                
                <div className="pt-2 flex justify-between items-end border-b border-slate-800 pb-4">
                  <div>
                    <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Grand Total</span>
                    <span className="text-2xl sm:text-3xl font-black text-indigo-400">{order.grandTotal.toFixed(2)} Pi</span>
                  </div>
                  {order.paymentStatus === 'paid' && (
                    <div className="text-right">
                       <span className="inline-block px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded text-[9px] font-black uppercase tracking-widest">Paid via Wallet</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 space-y-3">
                  <div className="flex justify-between text-xs sm:text-sm font-bold text-slate-400">
                    <span>BMP Rewards Used</span>
                    <span className="text-emerald-400">{(order as any).rewardsUsed?.toFixed(2) || '0.00'} Pi</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm font-bold text-slate-400">
                    <span>Wallet Balance Before Payment</span>
                    <span className="text-white">{(order as any).walletBalanceBefore?.toFixed(2) || 'N/A'} Pi</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm font-bold text-slate-400">
                    <span>Wallet Balance After Payment</span>
                    <span className="text-white">{(order as any).walletBalanceAfter?.toFixed(2) || 'N/A'} Pi</span>
                  </div>
                </div>
              </div>
            </section>"""

content = re.sub(r'\{\/\* Price Breakdown \*\/\}.*?</section>', price_breakdown_replacement, content, flags=re.DOTALL)

with open('src/pages/OrderDetails.tsx', 'w') as f:
    f.write(content)
