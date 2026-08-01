import re

with open('src/pages/OrderDetails.tsx', 'r') as f:
    content = f.read()

# I want to add Order Information before Price Breakdown
order_info_module = """            <section className="bg-slate-900/50 border border-slate-800 rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8">
              <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-amber-400" /> Order Information
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-4">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Order ID</p>
                   <p className="text-sm font-bold text-white">{order.orderNumber}</p>
                 </div>
                 <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-4">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Order Date</p>
                   <p className="text-sm font-bold text-white">{formatDate(order.createdAt)}</p>
                 </div>
                 <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-4">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Payment Method</p>
                   <p className="text-sm font-bold text-white flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-400"/> BMP Rewards Wallet</p>
                 </div>
                 <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-4">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Payment Date</p>
                   <p className="text-sm font-bold text-white">{formatDate(order.createdAt)}</p>
                 </div>
                 <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-4">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Transaction ID</p>
                   <p className="text-sm font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded w-max">{order.checkoutSessionId || 'TXN_' + order.orderId.substring(0, 8)}</p>
                 </div>
                 <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-4">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Invoice Number</p>
                   <p className="text-sm font-mono text-slate-300">INV-{order.orderNumber}</p>
                 </div>
              </div>
            </section>

            {/* Price Breakdown */}"""

content = content.replace("{/* Price Breakdown */}", order_info_module)

with open('src/pages/OrderDetails.tsx', 'w') as f:
    f.write(content)
