import re

with open('src/pages/OrderDetails.tsx', 'r') as f:
    content = f.read()

# 1. Product Line Items Replacement
new_line_items = """            <section className="bg-slate-900/50 border border-slate-800 rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8">
              <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight mb-6 sm:mb-8 flex items-center gap-3">
                <Package className="w-6 h-6 text-indigo-400" /> Products
              </h2>
              <div className="space-y-6">
                {items.map((item) => (
                  <div key={item.itemId} className="space-y-4 bg-slate-950/50 border border-slate-800/50 rounded-2xl p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden">
                        {(item as any).imageUrl ? (
                          <img src={(item as any).imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                        ) : (
                          <ShoppingBag className="w-8 h-8 text-slate-700" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm sm:text-base font-bold text-white uppercase truncate mb-1">{item.productName}</h4>
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-900 px-2 py-1 rounded">SKU: {item.sku || 'N/A'}</span>
                          {item.variantId && <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-800 px-2 py-1 rounded">Variant: {item.variantId}</span>}
                        </div>
                        
                        <div className="flex items-end justify-between mt-4">
                           <div>
                             <p className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Price per unit</p>
                             <p className="text-sm font-bold text-white">{item.unitPrice.toFixed(2)} Pi</p>
                           </div>
                           <div className="text-center px-4">
                             <p className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Qty</p>
                             <p className="text-sm font-bold text-white">x{item.quantity}</p>
                           </div>
                           <div className="text-right">
                             <p className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Total</p>
                             <p className="text-base sm:text-lg font-black text-indigo-400">{item.subtotal.toFixed(2)} Pi</p>
                           </div>
                        </div>
                      </div>
                    </div>

                    {!isMerchant && (
                      <div className="pt-4 mt-4 border-t border-slate-800/50 flex flex-wrap gap-2">
                         <button onClick={() => navigate(`/product/${item.productId}`)} className="flex-1 min-w-[120px] px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                           <ExternalLink className="w-3 h-3" /> View Product
                         </button>
                         <button onClick={() => navigate(`/product/${item.productId}`)} className="flex-1 min-w-[120px] px-3 py-2 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                           <RotateCcw className="w-3 h-3" /> Buy Again
                         </button>
                         <button className="px-3 py-2 bg-slate-900 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2" onClick={() => alert("Added to wishlist")}>
                           <Heart className="w-3 h-3" />
                         </button>
                         <button className="px-3 py-2 bg-slate-900 hover:bg-amber-500/10 text-slate-400 hover:text-amber-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2" onClick={() => alert("Reported")}>
                           <AlertTriangle className="w-3 h-3" />
                         </button>
                         
                        {order.orderStatus === OrderStatus.COMPLETED && reviewingItemId !== item.itemId && (
                          <button 
                            onClick={() => setReviewingItemId(item.itemId)}
                            className="w-full sm:w-auto px-4 py-2 bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all mt-2 sm:mt-0"
                          >
                            Review Item
                          </button>
                        )}
                      </div>
                    )}
                    {reviewingItemId === item.itemId && (
                      <div className="mt-4 animate-in slide-in-from-top-4 duration-300">
                        <ReviewForm 
                          entityId={item.productId}
                          entityType="product"
                          businessId={order.businessId}
                          orderId={order.orderId}
                          onCancel={() => setReviewingItemId(null)}
                          onSuccess={() => {
                            setReviewingItemId(null);
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Price Breakdown */}
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
                <div className="flex justify-between text-xs sm:text-sm font-bold text-slate-400 border-b border-slate-800 pb-4">
                  <span>Tax (GST/VAT)</span>
                  <span className="text-white">+{order.tax.toFixed(2)} Pi</span>
                </div>
                
                <div className="pt-2 flex justify-between items-end">
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
              </div>
            </section>"""

# Replace the whole left column items and summary part
content = re.sub(
    r'<section className="bg-slate-900/50 border border-slate-800 rounded-3xl sm:rounded-\[2\.5rem\] p-5 sm:p-8">\s*<h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight mb-6 sm:mb-8 flex items-center gap-3">\s*<ClipboardList className="w-6 h-6 text-indigo-400" /> Line Items\s*</h2>.*?</section>',
    new_line_items,
    content,
    flags=re.DOTALL
)

# 2. Add Seller info box
seller_info = """            {store && !isMerchant && (
              <section className="bg-slate-900/50 border border-slate-800 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8">
                <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                  <StoreIcon className="w-5 h-5 text-amber-400" /> Seller Information
                </h2>
                
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                   <div className="w-20 h-20 bg-slate-950 border-2 border-slate-800 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                     {store.logoUrl ? (
                       <img src={store.logoUrl} alt={store.storeName} className="w-full h-full object-cover" />
                     ) : (
                       <StoreIcon className="w-8 h-8 text-slate-700" />
                     )}
                   </div>
                   
                   <div className="flex-1 text-center sm:text-left space-y-2">
                     <div className="flex items-center justify-center sm:justify-start gap-2">
                       <h3 className="text-xl font-black text-white uppercase">{store.storeName}</h3>
                       {store.verified && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                     </div>
                     <p className="text-xs font-bold text-slate-400 flex items-center justify-center sm:justify-start gap-1">
                       <User className="w-3 h-3" /> Merchant: {store.ownerName || 'Verified Partner'}
                     </p>
                     
                     <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2">
                        <span className="flex items-center gap-1 text-[10px] font-black text-amber-400 uppercase bg-amber-400/10 px-2 py-1 rounded">
                          <Star className="w-3 h-3 fill-amber-400" /> {store.rating || 'New'} ({store.reviewCount || 0} reviews)
                        </span>
                        {(store.city || store.country) && (
                          <span className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase bg-slate-800 px-2 py-1 rounded">
                            <MapPinIcon className="w-3 h-3" /> {store.city} {store.country}
                          </span>
                        )}
                     </div>
                   </div>
                   
                   <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
                     <button onClick={() => navigate(`/store/${store.storeId}`)} className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                       Visit Store
                     </button>
                     <button onClick={handleChatAboutOrder} className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap">
                       Chat with Seller
                     </button>
                   </div>
                </div>
              </section>
            )}"""

content = content.replace("            {/* Logistics & Delivery */}", seller_info + "\n            {/* Logistics & Delivery */}")

with open('src/pages/OrderDetails.tsx', 'w') as f:
    f.write(content)
