import re

with open('src/pages/OrderDetails.tsx', 'r') as f:
    content = f.read()

# 1. Fix Order Date Format
date_fix_code = """
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Date Not Available';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return 'Date Not Available';
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' • ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Date Not Available';
    }
  };
"""

content = content.replace("  const isMerchant = user?.uid === order?.businessId;", date_fix_code + "\n  const isMerchant = user?.uid === order?.businessId;")
content = content.replace("Placed on {new Date(order.createdAt).toLocaleString()}", "Placed on {formatDate(order.createdAt)}")

# 2. Fix Payment Info
payment_info_replacement = """              <section className="bg-slate-900/50 border border-slate-800 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8">
                <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-tight mb-4 sm:mb-6 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-400" /> Payment Info
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800/50 pb-3">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Payment Method</span>
                    <span className="text-xs font-bold text-white uppercase flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-400" /> BMP Rewards Wallet</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-800/50 pb-3">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Payment Status</span>
                    <span className="text-xs font-bold text-emerald-400 uppercase">Success</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-800/50 pb-3">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Transaction ID</span>
                    <span className="text-xs font-mono text-slate-300 bg-slate-900 px-2 py-1 rounded">{order.checkoutSessionId || 'TXN_PENDING'}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-800/50 pb-3">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Wallet Debit Amount</span>
                    <span className="text-xs font-bold text-amber-400 uppercase">{order.grandTotal.toFixed(2)} Pi</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Payment Time</span>
                    <span className="text-[10px] font-bold text-slate-400">{formatDate(order.createdAt)}</span>
                  </div>
                </div>
              </section>"""

content = re.sub(r'<section className="bg-slate-900/50 border border-slate-800 rounded-3xl sm:rounded-\[2\.5rem\] p-6 sm:p-8">\s*<h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-tight mb-4 sm:mb-6 flex items-center gap-2">\s*<CreditCard className="w-4 h-4 text-amber-400" /> Payment Info\s*</h3>.*?</div>\s*</section>', payment_info_replacement, content, flags=re.DOTALL)

# 3. Fix Shipping Module
shipping_module = """              <section className="bg-slate-900/50 border border-slate-800 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8">
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <Truck className="w-4 h-4 text-indigo-400" /> Shipping Details
                  </h3>
                  {order.shipmentId && (
                    <button onClick={() => navigate(`/shipment/${order.shipmentId}`)} className="px-3 py-1.5 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2">
                      <Navigation className="w-3 h-3" /> Track
                    </button>
                  )}
                </div>
                {order.shippingAddress ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 border-b border-slate-800/50 pb-4">
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Recipient Name</p>
                        <p className="text-xs font-bold text-slate-200">{order.shippingAddress.fullName}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Phone Number</p>
                        <p className="text-xs font-bold text-slate-200">{order.shippingAddress.phone || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="border-b border-slate-800/50 pb-4">
                      <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Full Address</p>
                      <p className="text-xs text-slate-300 font-medium leading-relaxed">
                        {order.shippingAddress.street}<br/>
                        {order.shippingAddress.city}, {order.shippingAddress.state}<br/>
                        PIN: {order.shippingAddress.postalCode}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Courier Partner</p>
                        <p className="text-xs font-bold text-white">{order.logistics?.courierName || 'Standard'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Tracking Number</p>
                        {order.logistics?.trackingNumber ? (
                          <p className="text-xs font-mono text-emerald-400 bg-emerald-500/10 inline-block px-1.5 py-0.5 rounded">{order.logistics.trackingNumber}</p>
                        ) : (
                          <p className="text-xs font-bold text-slate-500">Pending</p>
                        )}
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Shipping Date</p>
                        <p className="text-xs font-bold text-slate-300">{formatDate(order.shippedAt) || 'Pending'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Estimated Delivery</p>
                        <p className="text-xs font-bold text-slate-300">{formatDate(order.estimatedDelivery) || 'Pending'}</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-800/50">
                        <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Current Status</p>
                        <span className="px-2 py-1 bg-indigo-600/20 text-indigo-400 rounded text-[10px] font-black uppercase">{order.currentStatus || order.orderStatus}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] sm:text-xs text-slate-600 italic">No address (Digital/Service)</p>
                )}
              </section>"""

content = re.sub(r'<section className="bg-slate-900/50 border border-slate-800 rounded-3xl sm:rounded-\[2\.5rem\] p-6 sm:p-8">\s*<div className="flex justify-between items-center mb-4 sm:mb-6">\s*<h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">\s*<MapPin className="w-4 h-4 text-emerald-400" /> Delivery Details\s*</h3>.*?</section>', shipping_module, content, flags=re.DOTALL)


# 4 & 5. Timeline and Activity Log
# Also 7. Buyer actions inside Timeline Column

timeline_module = """          <div className="lg:col-span-1 space-y-8">
            <section className="bg-slate-900/50 border border-slate-800 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8">
              <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                <Navigation className="w-5 h-5 text-indigo-400" /> Order Timeline
              </h2>
              
              <div className="relative space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-slate-800">
                {[
                  { label: 'Order Placed', status: 'completed', time: order.createdAt },
                  { label: 'Payment Successful', status: 'completed', time: order.createdAt },
                  { label: 'Seller Accepted', status: order.acceptedAt ? 'completed' : (order.orderStatus === OrderStatus.NEW_ORDER ? 'current' : 'pending'), time: order.acceptedAt },
                  { label: 'Packed', status: order.packedAt ? 'completed' : (order.acceptedAt && !order.packedAt ? 'current' : 'pending'), time: order.packedAt },
                  { label: 'Shipped', status: order.shippedAt ? 'completed' : (order.packedAt && !order.shippedAt ? 'current' : 'pending'), time: order.shippedAt },
                  { label: 'Out for Delivery', status: order.currentStatus === 'out_for_delivery' || order.deliveredAt ? 'completed' : (order.shippedAt && !order.deliveredAt ? 'current' : 'pending'), time: null },
                  { label: 'Delivered', status: order.deliveredAt ? 'completed' : 'pending', time: order.deliveredAt }
                ].map((step, i) => (
                  <div key={i} className="relative pl-10">
                    <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-slate-950 flex items-center justify-center z-10 ${
                      step.status === 'completed' ? 'bg-emerald-500' :
                      step.status === 'current' ? 'bg-amber-400 scale-110 shadow-[0_0_10px_rgba(251,191,36,0.5)]' :
                      'bg-slate-800'
                    }`}>
                      {step.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-slate-950" />}
                    </div>
                    <div>
                      <p className={`text-[11px] sm:text-xs font-bold uppercase tracking-tight ${
                        step.status === 'completed' ? 'text-white' :
                        step.status === 'current' ? 'text-amber-400' :
                        'text-slate-500'
                      }`}>
                        {step.label}
                      </p>
                      {step.time && <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">{formatDate(step.time)}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-slate-900/50 border border-slate-800 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8">
              <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                <Clock className="w-5 h-5 text-violet-400" /> Activity Log
              </h2>
              
              <div className="space-y-4">
                {(order.activityLogs || []).map((log, i) => (
                  <div key={i} className="border-b border-slate-800/50 pb-3 last:border-0 last:pb-0">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">{formatDate(log.timestamp)}</p>
                    <p className="text-xs font-medium text-slate-300">{log.message}</p>
                  </div>
                ))}
                {(!order.activityLogs || order.activityLogs.length === 0) && timeline.map((event, i) => (
                  <div key={i} className="border-b border-slate-800/50 pb-3 last:border-0 last:pb-0">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">{formatDate(event.createdAt)}</p>
                    <p className="text-xs font-medium text-slate-300">{event.message}</p>
                  </div>
                ))}
              </div>
            </section>
            
            {!isMerchant && (
              <section className="bg-slate-900/50 border border-slate-800 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8">
                <h3 className="text-sm font-black text-white uppercase tracking-tight mb-4">Quick Actions</h3>
                <div className="flex flex-col gap-2">
                  <button onClick={() => navigate(`/shipment/${order.shipmentId}`)} disabled={!order.shipmentId} className="w-full px-4 py-3 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left">Track Shipment</button>
                  <button onClick={handleChatAboutOrder} className="w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-left">Chat with Merchant</button>
                  <button onClick={() => window.print()} className="w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-left">Download Invoice</button>
                  <button onClick={() => alert("Issue raised")} className="w-full px-4 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-left mt-2">Raise Issue</button>
                </div>
              </section>
            )}
          </div>"""

content = re.sub(r'<div className="lg:col-span-1">\s*<section className="sticky top-12 bg-slate-900/50 border border-slate-800 rounded-3xl sm:rounded-\[2\.5rem\] p-6 sm:p-8">.*?</section>\s*</div>', timeline_module, content, flags=re.DOTALL)


# 6. Seller Actions updates
# We need handleUpdateStatus to log to activityLogs and update packedAt, shippedAt, etc.
# We will intercept the updateOrderStatus logic inside the component to add these fields, or we can just send metadata.
# In OrderDetails.tsx, handleUpdateStatus uses orderService.updateOrderStatus. 
# We'll modify it directly inside OrderDetails.tsx to also update the order document with the new fields directly if needed, or better, modify orderService!

with open('src/pages/OrderDetails.tsx', 'w') as f:
    f.write(content)
