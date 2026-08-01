import re

with open('src/pages/OrderDetails.tsx', 'r') as f:
    content = f.read()

# I need to add Mark Shipped, Mark Delivered buttons
seller_actions = """              {(order.orderStatus === OrderStatus.READY_FOR_PICKUP || order.orderStatus === OrderStatus.SHIPPED || order.orderStatus === OrderStatus.OUT_FOR_DELIVERY) && (
                <>
                  <button onClick={() => navigate(`/shipment/${order.shipmentId}`)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"><Navigation className="w-3 h-3" /> Track Shipment</button>
                  {order.orderStatus !== OrderStatus.SHIPPED && order.orderStatus !== OrderStatus.OUT_FOR_DELIVERY && (
                    <button onClick={() => handleUpdateStatus(OrderStatus.SHIPPED)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Mark Shipped</button>
                  )}
                  {order.orderStatus !== OrderStatus.COMPLETED && (
                    <button onClick={() => handleUpdateStatus(OrderStatus.COMPLETED)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Mark Delivered</button>
                  )}
                </>
              )}"""

content = re.sub(r'\{\(order\.orderStatus === OrderStatus\.READY_FOR_PICKUP \|\| order\.orderStatus === OrderStatus\.SHIPPED \|\| order\.orderStatus === OrderStatus\.OUT_FOR_DELIVERY\) && \(\s*<button onClick=\{\(\) => navigate\(`/shipment/\$\{order\.shipmentId\}`\)\} className=".*?">.*?<Navigation.*?/> Track Shipment</button>\s*\)\}', seller_actions, content, flags=re.DOTALL)

with open('src/pages/OrderDetails.tsx', 'w') as f:
    f.write(content)
