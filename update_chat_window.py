import re

with open('src/components/messaging/ChatWindow.tsx', 'r') as f:
    content = f.read()

context_panel_html = """
      {/* Context Panel (Product / Order) */}
      {(conversation.productId || conversation.orderId) && (
        <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between z-10 shadow-sm cursor-pointer hover:bg-slate-800/80 transition-colors" onClick={() => conversation.productId ? navigate(`/product/${conversation.productId}`) : navigate(`/order/${conversation.orderId}`)}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
              {conversation.productId ? <ShoppingBag className="w-5 h-5 text-indigo-400" /> : <FileText className="w-5 h-5 text-emerald-400" />}
            </div>
            <div className="min-w-0">
              <span className="font-black text-white text-[10px] uppercase tracking-widest block mb-0.5">
                {conversation.productId ? 'Product Inquiry' : 'Order Support'}
              </span>
              <p className="text-xs font-medium text-slate-400 truncate">
                {conversation.productId ? `ID: ${conversation.productId}` : `Order #: ${conversation.orderId}`}
              </p>
            </div>
          </div>
          <div className="shrink-0 pl-4">
            <span className="text-[10px] font-bold text-indigo-400 flex items-center gap-1">
              View <ExternalLink className="w-3 h-3" />
            </span>
          </div>
        </div>
      )}
"""

content = content.replace("{/* Pinned Messages Panel */}", context_panel_html + "\n      {/* Pinned Messages Panel */}")

with open('src/components/messaging/ChatWindow.tsx', 'w') as f:
    f.write(content)
