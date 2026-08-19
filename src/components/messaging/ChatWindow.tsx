/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Paperclip, 
  Phone, 
  Video, 
  MoreVertical, 
  CheckCheck, 
  Image as ImageIcon, 
  FileText, 
  MapPin, 
  Volume2, 
  CornerUpLeft, 
  X,
  Download,
  ExternalLink,
  ShoppingBag,
  Store,
  User,
  Ban,
  Flag,
  QrCode,
  Receipt,
  FileSpreadsheet,
  Coins,
  ShieldAlert,
  HelpCircle,
  Truck,
  CheckCircle,
  PlayCircle,
  Info,
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';
import { Conversation, Message, MessageType } from '../../types';
import { messagingService } from '../../services/messagingService';
import { orderService } from '../../services/orderService';

interface ChatWindowProps {
  conversation: Conversation;
  currentUserUid: string;
  onBack?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  currentUserUid,
  onBack
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  
  // Call simulation state
  const [showCallScreen, setShowCallScreen] = useState<'voice' | 'video' | null>(null);
  
  // Custom interactive panel states
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Dynamic order integration state
  const [orderData, setOrderData] = useState<any | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Close options menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setShowOptionsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Fetch active block status
  useEffect(() => {
    const checkBlock = async () => {
      const otherUid = conversation.participants.find(p => p !== currentUserUid);
      if (otherUid) {
        const blocked = await messagingService.isBlocked(currentUserUid, otherUid);
        setIsBlocked(blocked);
      }
    };
    checkBlock();
  }, [conversation, currentUserUid]);

  // Load associated order data if present
  const fetchOrderDetails = async () => {
    if (conversation.orderId) {
      setOrderLoading(true);
      try {
        const order = await orderService.getOrder(conversation.orderId);
        if (order) {
          setOrderData(order);
        }
      } catch (err) {
        console.warn('Failed to retrieve order data:', err);
      } finally {
        setOrderLoading(false);
      }
    } else {
      setOrderData(null);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [conversation.orderId]);

  // Subscribe to real-time message stream
  useEffect(() => {
    setIsTyping(false);
    messagingService.markAsRead(conversation.conversationId, currentUserUid);

    const unsubscribe = messagingService.subscribeToMessages(conversation.conversationId, (data) => {
      setMessages(data);
      if (data.length > 0 && data[data.length - 1].senderUid !== currentUserUid) {
        setIsTyping(true);
        const timer = setTimeout(() => setIsTyping(false), 2500);
        return () => clearTimeout(timer);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [conversation.conversationId, currentUserUid]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Handle messages send
  const handleSend = async (
    e?: React.FormEvent,
    overrideType?: MessageType,
    overrideContent?: string,
    overrideMetadata?: any
  ) => {
    if (e) e.preventDefault();
    
    const contentToSend = overrideContent || inputValue;
    const typeToSend = overrideType || 'text';
    
    if (!contentToSend.trim() && !overrideContent) return;

    setIsSending(true);
    setShowAttachments(false);

    try {
      const senderRole = currentUserUid === orderData?.sellerId || currentUserUid === orderData?.businessId ? 'Merchant' : 'Buyer';
      
      await messagingService.sendMessage(
        conversation.conversationId,
        currentUserUid,
        contentToSend,
        typeToSend,
        undefined,
        overrideMetadata,
        replyingTo?.messageId || undefined,
        senderRole
      );
      
      if (!overrideContent) {
        setInputValue('');
      }
      setReplyingTo(null);
    } catch (err: any) {
      console.error('Send message failed:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Toggle user block
  const handleToggleBlock = async () => {
    const otherUid = conversation.participants.find(p => p !== currentUserUid);
    if (!otherUid) return;
    try {
      if (isBlocked) {
        await messagingService.unblockUser(currentUserUid, otherUid);
        setIsBlocked(false);
      } else {
        if (window.confirm('Are you sure you want to block communications with this user?')) {
          await messagingService.blockUser(currentUserUid, otherUid);
          setIsBlocked(true);
        }
      }
    } catch (err) {
      console.error('Block toggle failed:', err);
    }
    setShowOptionsMenu(false);
  };

  // Submit reported conversation
  const handleSubmitReport = async () => {
    if (!reportReason.trim()) return;
    try {
      await messagingService.reportConversation(conversation.conversationId, currentUserUid, reportReason);
      setReportReason('');
      setShowReportDialog(false);
    } catch (err) {
      console.error('Failed to file abuse report:', err);
    }
  };

  // Perform quick update to the order status
  const handleUpdateOrderStatus = async (newStatus: string) => {
    if (!conversation.orderId) return;
    try {
      const isMerchant = currentUserUid === orderData?.sellerId || currentUserUid === orderData?.businessId;
      const role = isMerchant ? 'seller' : 'buyer';
      
      await orderService.updateOrderStatus(
        conversation.orderId,
        newStatus,
        currentUserUid,
        role,
        `Status updated from within Inbox Order Hub.`
      );
      
      fetchOrderDetails();
      
      await handleSend(
        undefined,
        'system',
        `Order status was updated to: ${newStatus.replace(/_/g, ' ').toUpperCase()}`,
        { statusUpdate: newStatus }
      );
    } catch (err) {
      console.error('Order status update failed:', err);
    }
  };

  const getPartnerDisplayName = () => {
    const isMerchant = currentUserUid === orderData?.sellerId || currentUserUid === orderData?.businessId;
    if (conversation.orderId) {
      return isMerchant ? 'Customer Support' : (conversation.businessId || 'Pi Merchant');
    }
    return conversation.businessId || 'Direct Merchant Chat';
  };

  const isMeSender = (senderId: string) => {
    return senderId === currentUserUid;
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 relative flex-1" id="chat-window">
      {/* 1. Header Area with Options Dropdown */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-900/80 bg-slate-950 z-20">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Back Button */}
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to conversations list"
              className="md:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center font-bold text-violet-400 shrink-0">
            {conversation.orderId ? <ShoppingBag className="w-5 h-5" /> : <User className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
                {getPartnerDisplayName()}
              </h2>
              <span title="Verified Merchant">
                <ShieldCheck className="w-3.5 h-3.5 text-violet-400 shrink-0" />
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 bg-emerald-400 rounded-full shrink-0" />
              <span className="text-[10px] text-slate-400 font-semibold truncate">
                Verified Pi Network Partner
              </span>
            </div>
          </div>
        </div>

        {/* Action Triggers */}
        <div className="flex items-center gap-1.5 sm:gap-2 relative shrink-0" ref={optionsRef}>
          <button 
            type="button"
            onClick={() => setShowCallScreen('voice')}
            aria-label="Start Voice Call"
            className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none cursor-pointer"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button 
            type="button"
            onClick={() => setShowCallScreen('video')}
            aria-label="Start Video Call"
            className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none cursor-pointer"
          >
            <Video className="w-4 h-4" />
          </button>
          
          <button 
            type="button"
            onClick={() => setShowOptionsMenu(!showOptionsMenu)}
            aria-label="More conversation options"
            aria-expanded={showOptionsMenu}
            className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none cursor-pointer"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Expanded Dropdown Options */}
          {showOptionsMenu && (
            <div 
              role="menu"
              className="absolute right-0 top-12 bg-slate-900 border border-slate-800 rounded-xl py-1.5 w-56 shadow-2xl z-30 divide-y divide-slate-800/80"
            >
              <div className="py-1">
                <button 
                  type="button"
                  role="menuitem"
                  onClick={handleToggleBlock}
                  className="w-full text-left px-4 py-2.5 min-h-[44px] text-xs text-rose-400 hover:bg-rose-500/10 font-bold flex items-center gap-2.5 transition-colors focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none cursor-pointer"
                >
                  <Ban className="w-4 h-4" />
                  <span>{isBlocked ? 'Unblock Partner' : 'Block Partner'}</span>
                </button>
                <button 
                  type="button"
                  role="menuitem"
                  onClick={() => { setShowReportDialog(true); setShowOptionsMenu(false); }}
                  className="w-full text-left px-4 py-2.5 min-h-[44px] text-xs text-slate-300 hover:bg-slate-800 font-bold flex items-center gap-2.5 transition-colors focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none cursor-pointer"
                >
                  <Flag className="w-4 h-4 text-violet-400" />
                  <span>Report Conversation</span>
                </button>
              </div>
              <div className="px-4 py-2 text-[9px] text-slate-400 font-mono">
                Chat ID: {conversation.conversationId.substring(0, 14)}...
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Enterprise Order Status Integration Bar */}
      {orderData && (
        <div className="bg-slate-900/90 border-b border-slate-800 px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-violet-600/15 border border-violet-500/20 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Order</span>
                <span className="text-xs font-bold text-white bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-md">
                  #{orderData.orderNumber || conversation.orderId?.substring(0, 8).toUpperCase()}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  orderData.orderStatus === 'completed' || orderData.orderStatus === 'paid' || orderData.orderStatus === 'delivered'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-violet-500/10 border-violet-500/20 text-violet-300'
                }`}>
                  {orderData.orderStatus?.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                Total: <span className="text-violet-400 font-bold">{orderData.grandTotal || orderData.totalAmount || 0} π</span> • Payment: <span className="text-white font-bold capitalize">{orderData.paymentStatus || 'unpaid'}</span>
              </p>
            </div>
          </div>

          {/* Quick Action Buttons per role */}
          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            {currentUserUid === orderData.sellerId || currentUserUid === orderData.businessId ? (
              <>
                {orderData.orderStatus === 'pending_payment' && (
                  <button 
                    type="button"
                    onClick={() => handleUpdateOrderStatus('payment_verified')}
                    className="px-3 py-2 min-h-[40px] bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                  >
                    Verify Payment
                  </button>
                )}
                {orderData.orderStatus === 'payment_verified' && (
                  <button 
                    type="button"
                    onClick={() => handleUpdateOrderStatus('dispatched')}
                    className="px-3 py-2 min-h-[40px] bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Ship Cargo</span>
                  </button>
                )}
              </>
            ) : (
              <>
                {['shipped', 'dispatched', 'out_for_delivery', 'delivered'].includes((orderData.orderStatus || '').toLowerCase()) && (
                  <button 
                    type="button"
                    onClick={() => handleUpdateOrderStatus('completed')}
                    className="px-3 py-2 min-h-[40px] bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Confirm Receipt</span>
                  </button>
                )}
                {['pending_payment', 'payment_verified'].includes(orderData.orderStatus) && (
                  <button 
                    type="button"
                    onClick={() => handleUpdateOrderStatus('cancelled')}
                    className="px-3 py-2 min-h-[40px] bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                  >
                    Cancel Order
                  </button>
                )}
              </>
            )}
            <button 
              type="button"
              onClick={() => window.open(`/order-details/${conversation.orderId}`, '_blank')}
              className="px-3 py-2 min-h-[40px] bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Order Details</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Message List Sandbox */}
      <div 
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 scrollbar-thin scrollbar-thumb-slate-900 scrollbar-track-transparent"
        role="region"
        aria-label="Conversation messages"
      >
        {messages.map((msg) => {
          const isMe = isMeSender(msg.senderUid);

          return (
            <React.Fragment key={msg.messageId}>
              {/* SYSTEM MESSAGE FORMAT */}
              {msg.messageType === 'system' ? (
                <div className="flex justify-center my-3">
                  <div className="bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-xl flex items-center gap-2 max-w-lg shadow-sm">
                    <Info className="w-4 h-4 text-violet-400 shrink-0" />
                    <span className="text-xs font-medium text-slate-300 leading-relaxed text-center">
                      {msg.content}
                    </span>
                  </div>
                </div>
              ) : (
                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2.5`}>
                  {/* Left avatar if not me */}
                  {!isMe && (
                    <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-xs text-violet-400 uppercase shrink-0">
                      {msg.senderRole?.substring(0, 1) || 'M'}
                    </div>
                  )}

                  <div className="flex flex-col max-w-[85%] sm:max-w-md relative group">
                    <div className={`
                      p-3.5 sm:p-4 rounded-2xl relative transition-all shadow-md
                      ${isMe 
                        ? 'bg-violet-600 text-white rounded-tr-none border border-violet-500' 
                        : 'bg-slate-900 text-slate-100 rounded-tl-none border border-slate-800'}
                    `}>
                      {/* Replying indicator */}
                      {msg.replyTo && (
                        <div className="mb-2 p-2 bg-slate-950/40 rounded-lg border-l-4 border-violet-400 text-xs text-slate-300 italic truncate max-w-full">
                          Replying to message
                        </div>
                      )}

                      {/* TEXT MESSAGE */}
                      {msg.messageType === 'text' && (
                        <p className="text-xs sm:text-sm font-normal leading-relaxed whitespace-pre-wrap select-text break-words">
                          {msg.content}
                        </p>
                      )}

                      {/* OVERSIZED EMOJI MESSAGE */}
                      {msg.messageType === 'emoji' && (
                        <span className="text-3xl sm:text-4xl block py-1 select-none leading-none">
                          {msg.content}
                        </span>
                      )}

                      {/* IMAGE ATTACHMENT */}
                      {msg.messageType === 'image' && (
                        <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 max-w-xs shadow-lg">
                          <img 
                            src={msg.content} 
                            alt="Attachment" 
                            className="w-full object-cover max-h-56 select-none"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      {/* PDF DOCUMENT */}
                      {msg.messageType === 'pdf' && (
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 max-w-xs shadow-md">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shrink-0">
                              <FileText className="w-5 h-5 text-rose-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-200 truncate">Document.pdf</p>
                              <span className="text-[10px] text-slate-400">PDF Attachment</span>
                            </div>
                          </div>
                          <button 
                            type="button"
                            onClick={() => window.open(msg.content, '_blank')}
                            aria-label="Download PDF document"
                            className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none cursor-pointer"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {/* PRODUCT CARD IN CATALOG */}
                      {msg.messageType === 'product_card' && (
                        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden max-w-xs shadow-xl">
                          <img src={msg.metadata?.mainImage || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'} alt="Product" className="h-32 w-full object-cover border-b border-slate-800" referrerPolicy="no-referrer" />
                          <div className="p-3.5 space-y-2">
                            <span className="text-[9px] font-bold bg-violet-500/15 text-violet-300 border border-violet-500/20 uppercase tracking-wider px-1.5 py-0.5 rounded inline-block">Product</span>
                            <h4 className="text-xs font-bold text-white truncate">{msg.content}</h4>
                            <p className="text-[11px] text-slate-400">{msg.metadata?.brand || 'Catalog item'}</p>
                            <div className="flex items-center justify-between border-t border-slate-850 pt-2.5">
                              <span className="text-xs font-extrabold text-violet-400">{msg.metadata?.price || 0} π</span>
                              <button 
                                type="button"
                                onClick={() => window.open(`/product/${msg.metadata?.productId || 'PROD_1'}`, '_blank')}
                                className="px-3 py-1.5 min-h-[36px] bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                              >
                                <span>View Product</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SERVICE CARD IN REGISTRY */}
                      {msg.messageType === 'service_card' && (
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 max-w-xs shadow-xl space-y-2">
                          <span className="text-[9px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 uppercase tracking-wider px-1.5 py-0.5 rounded inline-block">Service Listing</span>
                          <h4 className="text-xs font-bold text-white truncate">{msg.content}</h4>
                          <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">{msg.metadata?.description || 'Custom service listing on Pi Market.'}</p>
                          <div className="border-t border-slate-850 pt-2.5 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-semibold">Rate:</span>
                            <span className="text-xs font-bold text-emerald-400">{msg.metadata?.price || 15} π/hr</span>
                          </div>
                        </div>
                      )}

                      {/* BUSINESS / STORE REGISTRY CARD */}
                      {msg.messageType === 'business_card' && (
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 max-w-xs shadow-xl space-y-2.5">
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-violet-600/15 border border-violet-500/20 flex items-center justify-center shrink-0">
                              <Store className="w-4 h-4 text-violet-400" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-white truncate">{msg.content}</h4>
                              <span className="text-[10px] text-slate-400 block">{msg.metadata?.category || 'Merchant Store'}</span>
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">{msg.metadata?.description}</p>
                          <button 
                            type="button"
                            onClick={() => window.open(`/store/${msg.metadata?.businessId || 'BUS_1'}`, '_blank')}
                            className="w-full py-2 min-h-[38px] bg-slate-900 hover:bg-slate-800 text-xs text-white font-bold rounded-xl border border-slate-800 flex items-center justify-center gap-1.5 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                          >
                            <span>Visit Store</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* ORDER REFERENCE CARD */}
                      {msg.messageType === 'order_ref' && (
                        <div className="bg-slate-950 border border-violet-500/20 rounded-xl p-3.5 max-w-xs shadow-xl space-y-2">
                          <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                            <span className="text-[9px] font-bold text-violet-400 uppercase tracking-wider">Order Reference</span>
                            <span className="text-xs font-bold text-white bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                              #{msg.content.substring(0, 8).toUpperCase()}
                            </span>
                          </div>
                          <div className="space-y-1 text-xs text-slate-300">
                            <p className="font-semibold">Total: <span className="text-violet-400 font-bold">{msg.metadata?.grandTotal || '0'} π</span></p>
                            <p className="text-[11px] text-slate-400">Payment: <span className="text-emerald-400 font-bold uppercase">{msg.metadata?.paymentStatus || 'verified'}</span></p>
                          </div>
                        </div>
                      )}

                      {/* INVOICE CARD */}
                      {msg.messageType === 'invoice' && (
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 max-w-xs shadow-xl space-y-2.5">
                          <div className="flex items-center gap-2 border-b border-slate-850 pb-2">
                            <div className="p-1 rounded-md bg-violet-500/10 text-violet-400">
                              <Receipt className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-white">Merchant Invoice</span>
                          </div>
                          <div className="space-y-1 text-xs text-slate-300">
                            <p className="flex justify-between">
                              <span className="text-slate-400 text-[11px]">Invoice No:</span>
                              <span className="font-bold text-white">INV-{msg.content.substring(0, 6).toUpperCase()}</span>
                            </p>
                            <p className="flex justify-between">
                              <span className="text-slate-400 text-[11px]">Total Due:</span>
                              <span className="text-violet-400 font-bold">{msg.metadata?.grandTotal || '0.00'} π</span>
                            </p>
                          </div>
                          <button 
                            type="button"
                            onClick={() => window.open(`/order-details/${msg.content}`, '_blank')}
                            className="w-full py-2 min-h-[40px] bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                          >
                            <Coins className="w-3.5 h-3.5" />
                            <span>Pay Invoice with Pi</span>
                          </button>
                        </div>
                      )}

                      {/* PI RECEIPT COMPLIANT DOCUMENT */}
                      {msg.messageType === 'receipt' && (
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 max-w-xs shadow-xl space-y-2.5">
                          <div className="flex items-center gap-2 border-b border-slate-850 pb-2">
                            <div className="p-1 rounded bg-emerald-500/10 text-emerald-400">
                              <CheckCircle className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-white">Payment Receipt</span>
                          </div>
                          <div className="space-y-1 text-xs text-slate-300">
                            <p className="flex justify-between"><span className="text-slate-400 text-[11px]">Receipt ID:</span><span className="text-white font-bold">RCP-{msg.content.substring(0, 6).toUpperCase()}</span></p>
                            <p className="flex justify-between"><span className="text-slate-400 text-[11px]">Paid:</span><span className="text-emerald-400 font-bold">{msg.metadata?.grandTotal || '0.00'} π</span></p>
                          </div>
                          <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg flex items-center gap-2">
                            <QrCode className="w-6 h-6 text-white shrink-0" />
                            <div className="min-w-0">
                              <span className="text-[9px] font-bold text-slate-400 block">Blockchain Signed</span>
                              <span className="text-[10px] font-mono text-slate-200 truncate block">{msg.metadata?.qrVerificationCode || 'PI_SIG_HASH_8291'}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SECURE QR CODE REFERENCE */}
                      {msg.messageType === 'qrcode' && (
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 max-w-xs shadow-xl flex flex-col items-center justify-center text-center">
                          <div className="p-3 bg-white border-2 border-slate-800 rounded-xl mb-2.5">
                            <QrCode className="w-20 h-20 text-slate-950" />
                          </div>
                          <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider block mb-0.5">Verify on Pi Chain</span>
                          <span className="text-xs font-mono text-slate-400 truncate max-w-[200px] block">{msg.content}</span>
                        </div>
                      )}

                      {/* LOCATION PIN CARD */}
                      {msg.messageType === 'location' && (
                        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden max-w-xs shadow-xl">
                          <div className="h-24 bg-slate-900 flex flex-col items-center justify-center p-3 text-center border-b border-slate-800">
                            <MapPin className="w-6 h-6 text-rose-500 mb-1" />
                            <span className="text-xs font-medium text-slate-200 truncate w-full">{msg.content}</span>
                          </div>
                          <button 
                            type="button"
                            onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(msg.content)}`, '_blank')}
                            className="w-full py-2.5 min-h-[40px] bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Open in Maps</span>
                          </button>
                        </div>
                      )}

                      {/* VOICE MEMO PLAYBACK */}
                      {msg.messageType === 'voice' && (
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center gap-3 max-w-xs shadow-md">
                          <button 
                            type="button"
                            aria-label="Play voice recording"
                            onClick={() => {}}
                            className="w-9 h-9 rounded-full bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none cursor-pointer"
                          >
                            <PlayCircle className="w-5 h-5 fill-white" />
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              {[3, 7, 5, 8, 4, 6, 3, 5, 7, 4, 6, 8, 3, 5, 4].map((h, i) => (
                                <span key={i} className="w-0.5 bg-violet-400/80 rounded" style={{ height: `${h * 2}px` }} />
                              ))}
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium mt-1 block">Voice memo • 0:14</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Meta Timestamp & Read status indicators */}
                    <div className={`flex items-center gap-1.5 mt-1 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-[10px] font-medium text-slate-400 select-none">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isMe && (
                        <span title={msg.status} aria-label={`Message status: ${msg.status}`}>
                          <CheckCheck className={`w-3.5 h-3.5 ${msg.status === 'read' ? 'text-emerald-400' : 'text-slate-500'}`} />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}

        {/* Dynamic typing status message */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2 max-w-xs shadow-md">
              <span className="text-xs font-bold text-violet-400">Merchant is typing</span>
              <div className="flex gap-1 items-center h-2">
                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. Reply quotation reference floating panel */}
      {replyingTo && (
        <div className="bg-slate-900/95 border-t border-slate-800 px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs text-slate-300 z-10">
          <div className="flex items-center gap-2 min-w-0">
            <CornerUpLeft className="w-4 h-4 text-violet-400 shrink-0" />
            <div className="min-w-0">
              <span className="font-bold text-[10px] text-violet-400 block">Replying to:</span>
              <p className="truncate text-xs text-slate-200">{replyingTo.content}</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setReplyingTo(null)} 
            aria-label="Cancel reply"
            className="p-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg bg-slate-950 border border-slate-800 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 5. Message Composer Bar */}
      <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-900/80 relative z-10 pb-safe">
        <form 
          id="chat-message-form"
          onSubmit={handleSend}
          className="relative flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-2xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-violet-400 focus-within:border-violet-500 transition-all shadow-inner"
        >
          {/* Dynamic attachment trigger */}
          <button 
            type="button"
            onClick={() => setShowAttachments(!showAttachments)}
            aria-label="Attach card or document"
            aria-expanded={showAttachments}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-violet-400 rounded-xl transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none cursor-pointer"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          
          <label htmlFor="chat-message-input" className="sr-only">
            Type message
          </label>
          <input
            id="chat-message-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message to merchant..."
            className="flex-1 bg-transparent py-2 min-h-[40px] text-xs sm:text-sm text-white outline-none placeholder:text-slate-500"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isSending}
            aria-label="Send message"
            className={`
              p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-all shadow-md shrink-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none
              ${inputValue.trim() && !isSending 
                ? 'bg-violet-600 text-white hover:bg-violet-500 hover:scale-105 active:scale-95' 
                : 'bg-slate-950 text-slate-600 cursor-not-allowed shadow-none'}
            `}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Advanced attachments panels */}
        {showAttachments && (
          <div className="absolute bottom-20 left-4 right-4 sm:left-6 sm:right-6 bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-2xl grid grid-cols-2 sm:grid-cols-4 gap-2 z-20">
            <button 
              type="button"
              onClick={() => handleSend(undefined, 'image', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=60')}
              className="flex items-center gap-2 p-2.5 min-h-[44px] bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-all text-left text-xs font-semibold border border-slate-800 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none cursor-pointer"
            >
              <ImageIcon className="w-4 h-4 text-violet-400 shrink-0" />
              <span>Share Image</span>
            </button>
            <button 
              type="button"
              onClick={() => handleSend(undefined, 'pdf', 'https://businessmarketpi.com/assets/invoices/INV_848292.pdf')}
              className="flex items-center gap-2 p-2.5 min-h-[44px] bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-all text-left text-xs font-semibold border border-slate-800 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none cursor-pointer"
            >
              <FileText className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Share Invoice</span>
            </button>
            <button 
              type="button"
              onClick={() => handleSend(undefined, 'product_card', 'Supreme Comfort Sneakers', { productId: 'PROD_1', brand: 'Nike Air Max', price: 15, mainImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=60' })}
              className="flex items-center gap-2 p-2.5 min-h-[44px] bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-all text-left text-xs font-semibold border border-slate-800 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-violet-400 shrink-0" />
              <span>Catalog Product</span>
            </button>
            <button 
              type="button"
              onClick={() => handleSend(undefined, 'service_card', 'Smart Contract Audit', { category: 'Security', description: 'Complete security audit for Pi network integration.', price: 25 })}
              className="flex items-center gap-2 p-2.5 min-h-[44px] bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-all text-left text-xs font-semibold border border-slate-800 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Service Listing</span>
            </button>
            <button 
              type="button"
              onClick={() => handleSend(undefined, 'business_card', 'Pi Electronics Megastore', { businessId: 'BUS_1', category: 'Electronics', description: 'Certified distributor of consumer smart devices.' })}
              className="flex items-center gap-2 p-2.5 min-h-[44px] bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-all text-left text-xs font-semibold border border-slate-800 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none cursor-pointer"
            >
              <Store className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Store Profile</span>
            </button>
            <button 
              type="button"
              onClick={() => handleSend(undefined, 'invoice', 'INV_77812', { grandTotal: '15.00' })}
              className="flex items-center gap-2 p-2.5 min-h-[44px] bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-all text-left text-xs font-semibold border border-slate-800 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none cursor-pointer"
            >
              <Receipt className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Send Invoice</span>
            </button>
            <button 
              type="button"
              onClick={() => handleSend(undefined, 'receipt', 'RCP_90412', { grandTotal: '15.00', qrVerificationCode: 'PI_RECEIPT_VERIFIED_77812904' })}
              className="flex items-center gap-2 p-2.5 min-h-[44px] bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-all text-left text-xs font-semibold border border-slate-800 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none cursor-pointer"
            >
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Send Receipt</span>
            </button>
            <button 
              type="button"
              onClick={() => handleSend(undefined, 'qrcode', 'PI_SECURE_QR_VALIDATOR_99812402')}
              className="flex items-center gap-2 p-2.5 min-h-[44px] bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-all text-left text-xs font-semibold border border-slate-800 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-violet-400 shrink-0" />
              <span>QR Signature</span>
            </button>
            <button 
              type="button"
              onClick={() => handleSend(undefined, 'location', '302 Pi Avenue, San Francisco, CA')}
              className="flex items-center gap-2 p-2.5 min-h-[44px] bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-all text-left text-xs font-semibold border border-slate-800 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Location Pin</span>
            </button>
            <button 
              type="button"
              onClick={() => handleSend(undefined, 'voice', 'Voice Record Memo')}
              className="flex items-center gap-2 p-2.5 min-h-[44px] bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-all text-left text-xs font-semibold border border-slate-800 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none cursor-pointer"
            >
              <Volume2 className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Voice Memo</span>
            </button>
            <button 
              type="button"
              onClick={() => handleSend(undefined, 'emoji', '🚀🔥💪🏼')}
              className="flex items-center gap-2 p-2.5 min-h-[44px] bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-all text-left text-xs font-semibold border border-slate-800 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Quick Emojis</span>
            </button>
          </div>
        )}
      </div>

      {/* 6. Secure Calling Platform Overlay Modal */}
      {showCallScreen && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-label="Secure Call Dialog"
          className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center text-white"
        >
          <div className="w-20 h-20 rounded-3xl bg-violet-600 border border-violet-500 flex items-center justify-center shadow-2xl mb-6">
            {showCallScreen === 'voice' ? <Phone className="w-8 h-8 text-white" /> : <Video className="w-8 h-8 text-white" />}
          </div>
          <span className="text-xs font-bold text-violet-400 uppercase tracking-wider block mb-1">Encrypted Call</span>
          <h2 className="text-xl font-bold mb-1">{getPartnerDisplayName()}</h2>
          <p className="text-slate-400 text-xs font-medium mb-8">Connecting securely over Pi network...</p>
          
          <div className="flex gap-4">
            <button 
              type="button"
              onClick={() => setShowCallScreen(null)} 
              className="px-6 py-3 min-h-[44px] bg-rose-600 hover:bg-rose-500 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
            >
              Hang Up
            </button>
            <button 
              type="button"
              onClick={() => setShowCallScreen(null)} 
              className="px-6 py-3 min-h-[44px] bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
            >
              Connect Call
            </button>
          </div>
        </div>
      )}

      {/* 7. Abuse/Report Dialog Overlay */}
      {showReportDialog && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-label="Report Conversation"
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Report Conversation</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Please describe the issue with this merchant or conversation (e.g. suspicious activity, payment issues). Our compliance team reviews reports promptly.
            </p>
            <label htmlFor="report-reason-input" className="sr-only">
              Report Reason
            </label>
            <textarea
              id="report-reason-input"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Detail the issue..."
              className="w-full h-28 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none transition-all resize-none"
            />
            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => { setShowReportDialog(false); setReportReason(''); }}
                className="px-4 py-2 min-h-[44px] bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border border-slate-800 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitReport}
                disabled={!reportReason.trim()}
                className="px-4 py-2 min-h-[44px] bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
