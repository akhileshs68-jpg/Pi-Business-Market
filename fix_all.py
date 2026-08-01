import re

with open('src/services/orderService.ts', 'r') as f:
    content = f.read()

# Fix status casing
content = content.replace("if (status === 'Accepted'", "if (status === 'accepted'")
content = content.replace("status === 'Processing'", "status === 'processing'")
content = content.replace("status === 'Packed'", "status === 'packed'")
content = content.replace("status === 'Ready for Pickup'", "status === 'ready_for_pickup'")
content = content.replace("if (status === 'Shipped')", "if (status === 'shipped')")
content = content.replace("if (status === 'Delivered'", "if (status === 'delivered'")
content = content.replace("status === 'Completed'", "status === 'completed'")
content = content.replace("if (status === 'Cancelled'", "if (status === 'cancelled'")

with open('src/services/orderService.ts', 'w') as f:
    f.write(content)

with open('src/pages/OrderDetails.tsx', 'r') as f:
    content = f.read()

# Fix TS error
ts_error_fix = """              {(order.orderStatus === OrderStatus.READY_FOR_PICKUP || order.orderStatus === OrderStatus.SHIPPED || order.orderStatus === OrderStatus.OUT_FOR_DELIVERY || order.orderStatus === OrderStatus.DELIVERED) && (
                <>
                  <button onClick={() => navigate(`/shipment/${order.shipmentId}`)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"><Navigation className="w-3 h-3" /> Track Shipment</button>
                  {order.orderStatus !== OrderStatus.SHIPPED && order.orderStatus !== OrderStatus.OUT_FOR_DELIVERY && order.orderStatus !== OrderStatus.DELIVERED && (
                    <button onClick={() => handleUpdateStatus(OrderStatus.SHIPPED)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Mark Shipped</button>
                  )}
                  {order.orderStatus !== OrderStatus.COMPLETED && order.orderStatus !== OrderStatus.DELIVERED && (
                    <button onClick={() => handleUpdateStatus(OrderStatus.COMPLETED)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Mark Delivered</button>
                  )}
                </>
              )}"""

content = re.sub(r'\{\(order\.orderStatus === OrderStatus\.READY_FOR_PICKUP \|\| order\.orderStatus === OrderStatus\.SHIPPED \|\| order\.orderStatus === OrderStatus\.OUT_FOR_DELIVERY\) && \(\s*<>\s*<button onClick=\{\(\) => navigate\(`/shipment/\$\{order\.shipmentId\}`\)\}.*?<Navigation.*?Track Shipment</button>.*?<button onClick=\{\(\) => handleUpdateStatus\(OrderStatus\.COMPLETED\)\}.*?Mark Delivered</button>\s*\)\s*</>\s*\)\}', ts_error_fix, content, flags=re.DOTALL)

with open('src/pages/OrderDetails.tsx', 'w') as f:
    f.write(content)
