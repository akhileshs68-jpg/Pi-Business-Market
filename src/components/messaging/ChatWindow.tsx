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
  AlertTriangle,
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
  Play,
  PlayCircle,
  Info
} from 'lucide-react';
import { Conversation, Message, MessageType } from '../../types';
import { messagingService } from '../../services/messagingService';
import { orderService } from '../../services/orderService';

interface ChatWindowProps {
  conversation: Conversation;
  currentUserUid: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  currentUserUid
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
    // Reset typing status on conversation change
    setIsTyping(false);

    // Auto mark as read on window display
    messagingService.markAsRead(conversation.conversationId, currentUserUid);

    const unsubscribe = messagingService.subscribeToMessages(conversation.conversationId, (data) => {
      setMessages(data);
      // Trigger a light typing response simulation if incoming messages are fresh
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

  // Scroll to bottom when messages list changes
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
        undefined, // Attachments list
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
      alert(err.message || 'Failed to dispatch message.');
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
        alert('User has been unblocked.');
      } else {
        if (confirm('Are you sure you want to block communications with this user?')) {
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
      alert('This conversation was securely reported. Our security team will review it immediately.');
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
      
      // Auto-refresh order info
      fetchOrderDetails();
      
      // Send a system reference message to log this update in the chat
      await handleSend(
        undefined,
        'system',
        `Order status was updated to: ${newStatus.replace(/_/g, ' ').toUpperCase()}`,
        { statusUpdate: newStatus }
      );
    } catch (err) {
      console.error('Order status update failed:', err);
      alert('Unable to process status change.');
    }
  };

  // Participant naming helper
  const getPartnerDisplayName = () => {
    const isMerchant = currentUserUid === orderData?.sellerId || currentUserUid === orderData?.businessId;
    if (conversation.orderId) {
      return isMerchant ? 'Customer Support' : (conversation.businessId || 'Pi Vendor');
    }
    return conversation.businessId || 'Secure Partner';
  };

  const isMeSender = (senderId: string) => {
    return senderId === currentUserUid;
  };

  return (
    <div className="flex flex-col h-full bg-[#030712] relative flex-1" id="chat-window">
      {/* 1. Header Area with Options Dropdown */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-900 bg-[#070b19]/90 backdrop-blur z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/10 to-indigo-500/20 border border-indigo-500/20 flex items-center justify-center font-bold text-indigo-400">
            {conversation.orderId ? <ShoppingBag className="w-5 h-5 text-indigo-400" /> : <User className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-xs font-black text-white uppercase tracking-tight">
              {getPartnerDisplayName()}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                Active Secure Pi Connection
              </span>
            </div>
          </div>
        </div>

        {/* Action Triggers */}
        <div className="flex items-center gap-2 relative" ref={optionsRef}>
          <button 
            onClick={() => setShowCallScreen('voice')}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-850 text-slate-400 hover:text-white hover:border-slate-700 transition-all shadow-md"
            title="Secure Voice Call"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setShowCallScreen('video')}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-850 text-slate-400 hover:text-white hover:border-slate-700 transition-all shadow-md"
            title="Secure Video Call"
          >
            <Video className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => setShowOptionsMenu(!showOptionsMenu)}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-850 text-slate-400 hover:text-white hover:border-slate-700 transition-all shadow-md"
            title="More Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Expanded Dropdown Options */}
          {showOptionsMenu && (
            <div className="absolute right-0 top-12 bg-slate-950 border border-slate-800 rounded-xl py-1.5 w-52 shadow-2xl z-30">
              <button 
                onClick={handleToggleBlock}
                className="w-full text-left px-4 py-2.5 text-xs text-rose-400 hover:bg-rose-500/10 font-bold flex items-center gap-2.5 transition-colors"
              >
                <Ban className="w-4 h-4" /> {isBlocked ? 'Unblock Communications' : 'Block User Connection'}
              </button>
              <button 
                onClick={() => { setShowReportDialog(true); setShowOptionsMenu(false); }}
                className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-900 font-bold flex items-center gap-2.5 transition-colors"
              >
                <Flag className="w-4 h-4 text-indigo-400" /> Report Abuse/Spam
              </button>
              <div className="border-t border-slate-900 my-1" />
              <div className="px-4 py-2 text-[8px] text-slate-500 font-black uppercase tracking-widest">
                ID: {conversation.conversationId.substring(0, 16)}...
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Enterprise Order Status Integration Bar */}
      {orderData && (
        <div className="bg-indigo-950/20 border-b border-indigo-500/10 px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Order:</span>
                <span className="text-[11px] font-black text-white uppercase tracking-wider bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded-md">
                  {orderData.orderNumber || conversation.orderId?.substring(0, 8).toUpperCase()}
                </span>
                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  orderData.orderStatus === 'completed' || orderData.orderStatus === 'paid'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 animate-pulse'
                }`}>
                  {orderData.orderStatus?.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-1">
                Grand Total: <span className="text-amber-400 font-extrabold">{orderData.grandTotal || orderData.totalAmount || 0} Pi Testnet</span> • Status: <span className="text-white font-bold">{orderData.paymentStatus || 'unpaid'}</span>
              </p>
            </div>
          </div>

          {/* Quick Action Buttons per role */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            {currentUserUid === orderData.sellerId || currentUserUid === orderData.businessId ? (
              <>
                {orderData.orderStatus === 'pending_payment' && (
                  <button 
                    onClick={() => handleUpdateOrderStatus('payment_verified')}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-md"
                  >
                    Verify Pi Payment
                  </button>
                )}
                {orderData.orderStatus === 'payment_verified' && (
                  <button 
                    onClick={() => handleUpdateOrderStatus('dispatched')}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-1"
                  >
                    <Truck className="w-3.5 h-3.5" /> Ship Cargo
                  </button>
                )}
              </>
            ) : (
              <>
                {['shipped', 'dispatched', 'out_for_delivery', 'delivered'].includes((orderData.orderStatus || '').toLowerCase()) && (
                  <button 
                    onClick={() => handleUpdateOrderStatus('completed')}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Confirm Receipt
                  </button>
                )}
                {['pending_payment', 'payment_verified'].includes(orderData.orderStatus) && (
                  <button 
                    onClick={() => handleUpdateOrderStatus('cancelled')}
                    className="px-3.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-900/40 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                  >
                    Cancel Order
                  </button>
                )}
              </>
            )}
            <button 
              onClick={() => window.open(`/order-details/${conversation.orderId}`, '_blank')}
              className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Full Hub
            </button>
          </div>
        </div>
      )}

      {/* 3. Message List Sandbox */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-900 scrollbar-track-transparent">
        {messages.map((msg, index) => {
          const isMe = isMeSender(msg.senderUid);
          const reactions = msg.metadata?.reactions || {};

          return (
            <React.Fragment key={msg.messageId}>
              {/* SYSTEM MESSAGE FORMAT */}
              {msg.messageType === 'system' ? (
                <div className="flex justify-center my-4 animate-fade-in">
                  <div className="bg-indigo-950/20 border border-indigo-500/10 px-4 py-2 rounded-2xl flex items-center gap-2 max-w-lg shadow-inner">
                    <Info className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest leading-relaxed text-center">
                      {msg.content}
                    </span>
                  </div>
                </div>
              ) : (
                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-3 animate-fade-in`}>
                  {/* Left avatar if not me */}
                  {!isMe && (
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-[10px] text-indigo-400 uppercase shrink-0">
                      {msg.senderRole?.substring(0, 1) || 'U'}
                    </div>
                  )}

                  <div className="flex flex-col max-w-[85%] sm:max-w-md relative group">
                    <div className={`
                      p-4 rounded-2xl relative transition-all shadow-md
                      ${isMe 
                        ? 'bg-indigo-600 text-white rounded-tr-none border border-indigo-500' 
                        : 'bg-slate-950 text-slate-100 rounded-tl-none border border-slate-900'}
                    `}>
                      {/* Replying indicator */}
                      {msg.replyTo && (
                        <div className="mb-2.5 p-2 bg-slate-900/60 rounded-lg border-l-4 border-indigo-400 text-[10px] text-slate-300 italic truncate max-w-full">
                          Reply Reference
                        </div>
                      )}

                      {/* TEXT MESSAGE */}
                      {msg.messageType === 'text' && (
                        <p className="text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap select-text">
                          {msg.content}
                        </p>
                      )}

                      {/* OVERSIZED EMOJI MESSAGE */}
                      {msg.messageType === 'emoji' && (
                        <span className="text-4xl block py-1 select-none leading-none">
                          {msg.content}
                        </span>
                      )}

                      {/* IMAGE ATTACHMENT */}
                      {msg.messageType === 'image' && (
                        <div className="rounded-xl overflow-hidden border border-slate-900 bg-slate-950 max-w-xs shadow-lg">
                          <img 
                            src={msg.content} 
                            alt="Attachment View" 
                            className="w-full object-cover max-h-56 select-none"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      {/* PDF DOCUMENT */}
                      {msg.messageType === 'pdf' && (
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-4 max-w-xs shadow-md">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shrink-0">
                              <FileText className="w-5 h-5 text-rose-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-black text-slate-200 uppercase tracking-tight truncate">Enterprise_Invoice.pdf</p>
                              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest block">Adobe PDF Document</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => window.open(msg.content, '_blank')}
                            className="p-1.5 rounded bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-850 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {/* PRODUCT CARD IN CATALOG */}
                      {msg.messageType === 'product_card' && (
                        <div className="bg-slate-900/95 border border-slate-800 rounded-xl overflow-hidden max-w-xs shadow-xl">
                          <img src={msg.metadata?.mainImage || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'} alt="Product" className="h-32 w-full object-cover border-b border-slate-850" referrerPolicy="no-referrer" />
                          <div className="p-3.5">
                            <span className="text-[8px] font-black bg-violet-500/15 text-violet-400 border border-violet-500/20 uppercase tracking-widest px-1.5 py-0.5 rounded block w-max mb-1.5">Product</span>
                            <h4 className="text-[11px] font-black text-white uppercase tracking-tight truncate">{msg.content}</h4>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{msg.metadata?.brand || 'Premium Brand'}</p>
                            <div className="flex items-center justify-between mt-3.5 border-t border-slate-850 pt-3">
                              <span className="text-xs font-black text-amber-400">{msg.metadata?.price || 0} Pi Coin</span>
                              <button 
                                onClick={() => window.open(`/product/${msg.metadata?.productId || 'PROD_1'}`, '_blank')}
                                className="px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white text-[9px] font-black uppercase tracking-widest rounded-md flex items-center gap-1 transition-all"
                              >
                                Buy now <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SERVICE CARD IN REGISTRY */}
                      {msg.messageType === 'service_card' && (
                        <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-4 max-w-xs shadow-xl">
                          <span className="text-[8px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest px-1.5 py-0.5 rounded block w-max mb-2">Service Listing</span>
                          <h4 className="text-[11px] font-black text-white uppercase tracking-tight truncate">{msg.content}</h4>
                          <p className="text-[9px] text-slate-400 font-medium leading-relaxed mt-1.5 line-clamp-2">{msg.metadata?.description || 'Professional on-demand custom enterprise design service.'}</p>
                          <div className="mt-3.5 border-t border-slate-850 pt-3.5 flex items-center justify-between">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Starting Rate:</span>
                            <span className="text-[11px] font-extrabold text-amber-400">{msg.metadata?.price || 15} Pi/hr</span>
                          </div>
                        </div>
                      )}

                      {/* BUSINESS / STORE REGISTRY CARD */}
                      {msg.messageType === 'business_card' && (
                        <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-4 max-w-xs shadow-xl">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-violet-600/15 border border-violet-500/20 flex items-center justify-center shrink-0">
                              <Store className="w-4 h-4 text-violet-400" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-[11px] font-black text-white uppercase tracking-tight truncate">{msg.content}</h4>
                              <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest block mt-0.5">{msg.metadata?.category || 'Registry Entity'}</span>
                            </div>
                          </div>
                          <p className="text-[9px] text-slate-400 font-medium mt-3 leading-relaxed line-clamp-2">{msg.metadata?.description}</p>
                          <button 
                            onClick={() => window.open(`/store/${msg.metadata?.businessId || 'BUS_1'}`, '_blank')}
                            className="w-full mt-3.5 py-1.5 bg-slate-950 hover:bg-slate-850 text-[9px] text-white font-black uppercase tracking-widest rounded-lg border border-slate-850 flex items-center justify-center gap-1 transition-all"
                          >
                            Visit Store <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {/* ORDER REFERENCE CARD */}
                      {msg.messageType === 'order_ref' && (
                        <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-4 max-w-xs shadow-xl">
                          <div className="flex items-center justify-between mb-3 border-b border-indigo-500/10 pb-2">
                            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Order Reference</span>
                            <span className="text-[10px] font-black text-white tracking-widest uppercase bg-slate-950 px-2 py-0.5 rounded-md border border-slate-850">
                              #{msg.content.substring(0, 8).toUpperCase()}
                            </span>
                          </div>
                          <div className="space-y-1 text-[10px] text-slate-300">
                            <p className="font-bold uppercase tracking-wider">Grand Total: <span className="text-amber-400 font-black">{msg.metadata?.grandTotal || '0'} Pi</span></p>
                            <p className="text-[9px] font-medium mt-1">Payment Status: <span className="text-emerald-400 font-bold uppercase">{msg.metadata?.paymentStatus || 'verified'}</span></p>
                          </div>
                        </div>
                      )}

                      {/* INVOICE CARD */}
                      {msg.messageType === 'invoice' && (
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 max-w-xs shadow-xl">
                          <div className="flex items-center gap-2 mb-3.5 border-b border-slate-850 pb-2.5">
                            <div className="p-1 rounded-md bg-indigo-500/10 text-indigo-400">
                              <Receipt className="w-4 h-4" />
                            </div>
                            <span className="text-[9px] font-black text-white uppercase tracking-widest">Enterprise Invoice</span>
                          </div>
                          <div className="space-y-1.5 text-[10px] text-slate-300">
                            <p className="flex justify-between">
                              <span className="font-bold uppercase text-[8px] text-slate-500 tracking-wider">Invoice No:</span>
                              <span className="font-black text-white text-[9px] tracking-wider">INV-{msg.content.substring(0, 6).toUpperCase()}</span>
                            </p>
                            <p className="flex justify-between">
                              <span className="font-bold uppercase text-[8px] text-slate-500 tracking-wider">Total Due:</span>
                              <span className="text-amber-400 font-extrabold">{msg.metadata?.grandTotal || '0.00'} Pi</span>
                            </p>
                          </div>
                          <button 
                            onClick={() => alert(`Pi Sandbox: Initiating secure payment of ${msg.metadata?.grandTotal || 0} Pi...`)}
                            className="w-full mt-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[10px] font-black text-slate-950 uppercase tracking-widest rounded-lg shadow-md flex items-center justify-center gap-1.5 transition-all"
                          >
                            <Coins className="w-3.5 h-3.5" /> Pay Invoice with Pi
                          </button>
                        </div>
                      )}

                      {/* PI RECEIPT COMPLIANT DOCUMENT */}
                      {msg.messageType === 'receipt' && (
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 max-w-xs shadow-xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-bl-full border-b border-l border-emerald-500/20 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                          </div>
                          <div className="flex items-center gap-2 mb-3 border-b border-slate-850 pb-2">
                            <div className="p-1 rounded bg-emerald-500/10 text-emerald-400">
                              <CheckCircle className="w-4 h-4" />
                            </div>
                            <span className="text-[9px] font-black text-white uppercase tracking-widest">Payment Receipt</span>
                          </div>
                          <div className="space-y-1 text-[10px] text-slate-300 mb-3">
                            <p className="flex justify-between"><span className="text-slate-500 text-[8px] uppercase font-bold tracking-wider">Receipt ID:</span><span className="text-white font-black text-[9px] tracking-wider">RCP-{msg.content.substring(0, 6).toUpperCase()}</span></p>
                            <p className="flex justify-between"><span className="text-slate-500 text-[8px] uppercase font-bold tracking-wider">Paid Amount:</span><span className="text-emerald-400 font-extrabold">{msg.metadata?.grandTotal || '0.00'} Pi</span></p>
                          </div>
                          <div className="bg-slate-950 border border-slate-850 p-2 rounded-lg flex items-center gap-2.5">
                            <QrCode className="w-7 h-7 text-white shrink-0" />
                            <div>
                              <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest block leading-tight">Blockchain Signed</span>
                              <span className="text-[8px] font-bold text-slate-300 leading-none truncate w-32 block">{msg.metadata?.qrVerificationCode || 'PI_SIG_HASH_8291'}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SECURE QR CODE REFERENCE */}
                      {msg.messageType === 'qrcode' && (
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 max-w-xs shadow-xl flex flex-col items-center justify-center text-center">
                          <div className="p-4 bg-white border-4 border-slate-950 rounded-xl mb-3 shadow-inner">
                            <QrCode className="w-24 h-24 text-slate-950" />
                          </div>
                          <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest block leading-none mb-1">Verify on Pi Chain</span>
                          <span className="text-[9px] font-bold text-slate-400 truncate w-48 block">{msg.content}</span>
                        </div>
                      )}

                      {/* LOCATION PIN CARD */}
                      {msg.messageType === 'location' && (
                        <div className="bg-slate-950 border border-slate-850 rounded-xl overflow-hidden max-w-xs shadow-xl">
                          <div className="h-28 bg-indigo-950/20 flex flex-col items-center justify-center relative p-4 text-center border-b border-slate-850">
                            <MapPin className="w-8 h-8 text-rose-500 animate-bounce mb-1" />
                            <span className="text-[10px] font-bold text-slate-300 truncate w-full">{msg.content}</span>
                          </div>
                          <button 
                            onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(msg.content)}`, '_blank')}
                            className="w-full py-2 bg-slate-900 hover:bg-slate-850 text-[9px] font-black text-white uppercase tracking-widest flex items-center justify-center gap-1 transition-all"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Open Maps
                          </button>
                        </div>
                      )}

                      {/* VOICE MEMO PLAYBACK */}
                      {msg.messageType === 'voice' && (
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-3.5 max-w-xs shadow-md">
                          <button 
                            onClick={() => alert('Simulated audio message playback started...')}
                            className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-colors shrink-0"
                          >
                            <PlayCircle className="w-5 h-5 fill-white" />
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              {[3, 7, 5, 8, 4, 6, 3, 5, 7, 4, 6, 8, 3, 5, 4].map((h, i) => (
                                <span key={i} className="w-0.5 bg-indigo-500/80 rounded" style={{ height: `${h * 2}px` }} />
                              ))}
                            </div>
                            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider mt-1 block">Voice Record • 0:14</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Meta Timestamp & Read status indicators */}
                    <div className={`flex items-center gap-1.5 mt-1.5 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider select-none">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isMe && (
                        <span title={msg.status}>
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
            <div className="bg-slate-950 border border-slate-900 rounded-2xl rounded-tl-none px-4 py-3.5 flex items-center gap-2 max-w-xs shadow-lg">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">Merchant typing</span>
              <div className="flex gap-1 items-center h-2">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. Reply quotation reference floating panel */}
      {replyingTo && (
        <div className="bg-[#070b19]/90 border-t border-indigo-500/20 px-6 py-2.5 flex items-center justify-between text-xs text-indigo-300 backdrop-blur z-10">
          <div className="flex items-center gap-2 min-w-0">
            <CornerUpLeft className="w-4 h-4 text-indigo-400 shrink-0" />
            <div className="min-w-0">
              <span className="font-bold uppercase tracking-wider text-[8px] text-indigo-400 block">Replying to message:</span>
              <p className="truncate text-[11px] text-slate-300 leading-tight">{replyingTo.content}</p>
            </div>
          </div>
          <button onClick={() => setReplyingTo(null)} className="p-1 rounded bg-slate-900 border border-slate-800 hover:text-white transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 5. Message Composer Bar */}
      <div className="p-4 sm:p-6 bg-[#070b19]/90 border-t border-slate-900 relative z-10">
        <form 
          onSubmit={handleSend}
          className="relative flex items-center gap-3 bg-slate-950 border border-slate-850 rounded-2xl px-4 py-2 focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-500 transition-all shadow-inner"
        >
          {/* Dynamic selector trigger */}
          <button 
            type="button"
            onClick={() => setShowAttachments(!showAttachments)}
            className="p-2.5 text-slate-400 hover:text-indigo-400 rounded-xl transition-colors shrink-0"
            title="Attach Enterprise Card"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type message secure on Pi Chain..."
            className="flex-1 bg-transparent py-2.5 text-xs sm:text-sm text-white outline-none placeholder:text-slate-500"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isSending}
            className={`
              p-2.5 rounded-xl transition-all shadow-md shrink-0
              ${inputValue.trim() && !isSending 
                ? 'bg-indigo-600 text-white hover:bg-indigo-500 hover:scale-105 active:scale-95' 
                : 'bg-slate-900 text-slate-500 cursor-not-allowed shadow-none'}
            `}
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </form>

        {/* Advanced attachments panels */}
        {showAttachments && (
          <div className="absolute bottom-20 left-6 right-6 bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-2xl grid grid-cols-2 sm:grid-cols-4 gap-2 z-20 animate-fade-in">
            <button 
              type="button"
              onClick={() => handleSend(undefined, 'image', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=60')}
              className="flex items-center gap-2.5 p-2.5 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white rounded-xl transition-all text-left text-xs font-bold uppercase tracking-wider border border-slate-850"
            >
              <ImageIcon className="w-4 h-4 text-indigo-400" /> Share Image
            </button>
            <button 
              type="button"
              onClick={() => handleSend(undefined, 'pdf', 'https://businessmarketpi.com/assets/invoices/INV_848292.pdf')}
              className="flex items-center gap-2.5 p-2.5 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white rounded-xl transition-all text-left text-xs font-bold uppercase tracking-wider border border-slate-850"
            >
              <FileText className="w-4 h-4 text-rose-400" /> Share invoice
            </button>
            <button 
              type="button"
              onClick={() => handleSend(undefined, 'product_card', 'Supreme Comfort Sneakers (Limited Pi Edition)', { productId: 'PROD_1', brand: 'Nike Air Max', price: 15, mainImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=60' })}
              className="flex items-center gap-2.5 p-2.5 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white rounded-xl transition-all text-left text-xs font-bold uppercase tracking-wider border border-slate-850"
            >
              <ShoppingBag className="w-4 h-4 text-violet-400" /> Catalog Product
            </button>
            <button 
              type="button"
              onClick={() => handleSend(undefined, 'service_card', 'Full-Stack Blockchain Smart Contract Audit', { category: 'Smart Contracts', description: 'Complete security and compliance audit for high-volume enterprise Solidity or Rust contracts on the Pi network.', price: 25 })}
              className="flex items-center gap-2.5 p-2.5 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white rounded-xl transition-all text-left text-xs font-bold uppercase tracking-wider border border-slate-850"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Registry Service
            </button>
            <button 
              type="button"
              onClick={() => handleSend(undefined, 'business_card', 'Pi Electronics Megastore', { businessId: 'BUS_1', category: 'Premium Electronics', description: 'Certified global distributor of consumer smart devices and verified electronics gadgets.' })}
              className="flex items-center gap-2.5 p-2.5 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white rounded-xl transition-all text-left text-xs font-bold uppercase tracking-wider border border-slate-850"
            >
              <Store className="w-4 h-4 text-sky-400" /> Store/Business
            </button>
            <button 
              type="button"
              onClick={() => handleSend(undefined, 'invoice', 'INV_77812', { grandTotal: '15.00' })}
              className="flex items-center gap-2.5 p-2.5 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white rounded-xl transition-all text-left text-xs font-bold uppercase tracking-wider border border-slate-850"
            >
              <Receipt className="w-4 h-4 text-amber-500" /> Send Invoice
            </button>
            <button 
              type="button"
              onClick={() => handleSend(undefined, 'receipt', 'RCP_90412', { grandTotal: '15.00', qrVerificationCode: 'PI_RECEIPT_VERIFIED_77812904' })}
              className="flex items-center gap-2.5 p-2.5 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white rounded-xl transition-all text-left text-xs font-bold uppercase tracking-wider border border-slate-850"
            >
              <CheckCircle className="w-4 h-4 text-emerald-400" /> Send Receipt
            </button>
            <button 
              type="button"
              onClick={() => handleSend(undefined, 'qrcode', 'PI_SECURE_QR_VALIDATOR_99812402')}
              className="flex items-center gap-2.5 p-2.5 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white rounded-xl transition-all text-left text-xs font-bold uppercase tracking-wider border border-slate-850"
            >
              <QrCode className="w-4 h-4 text-white" /> QR Signature
            </button>
            <button 
              type="button"
              onClick={() => handleSend(undefined, 'location', '302 Pi Avenue, Block 7, San Francisco, CA')}
              className="flex items-center gap-2.5 p-2.5 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white rounded-xl transition-all text-left text-xs font-bold uppercase tracking-wider border border-slate-850"
            >
              <MapPin className="w-4 h-4 text-rose-400" /> Location Pin
            </button>
            <button 
              type="button"
              onClick={() => handleSend(undefined, 'voice', 'Voice Record Memo')}
              className="flex items-center gap-2.5 p-2.5 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white rounded-xl transition-all text-left text-xs font-bold uppercase tracking-wider border border-slate-850"
            >
              <Volume2 className="w-4 h-4 text-sky-400" /> Voice Message
            </button>
            <button 
              type="button"
              onClick={() => handleSend(undefined, 'emoji', '🚀🔥💪🏼')}
              className="flex items-center gap-2.5 p-2.5 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white rounded-xl transition-all text-left text-xs font-bold uppercase tracking-wider border border-slate-850"
            >
              <HelpCircle className="w-4 h-4 text-amber-400" /> Quick Emojis
            </button>
          </div>
        )}
      </div>

      {/* 6. Secure Calling Platform Overlay Modal */}
      {showCallScreen && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-8 text-center animate-fade-in text-white">
          <div className="w-24 h-24 rounded-[2rem] bg-indigo-600 border border-indigo-500 animate-pulse flex items-center justify-center shadow-3xl mb-8">
            {showCallScreen === 'voice' ? <Phone className="w-10 h-10 text-white" /> : <Video className="w-10 h-10 text-white" />}
          </div>
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Encrypted Chain Call</span>
          <h2 className="text-2xl font-black uppercase tracking-tight mb-2">{getPartnerDisplayName()}</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-12">Ringing Securely...</p>
          
          <div className="flex gap-6">
            <button 
              onClick={() => setShowCallScreen(null)} 
              className="px-6 py-3 bg-rose-600 hover:bg-rose-500 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg transition-all"
            >
              Hang Up
            </button>
            <button 
              onClick={() => alert("Simulated secure connection established!")} 
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg transition-all"
            >
              Accept
            </button>
          </div>
        </div>
      )}

      {/* 7. Abuse/Report Dialog Overlay */}
      {showReportDialog && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-up">
            <div className="flex items-center gap-2.5 mb-4 text-rose-400">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-base font-black uppercase tracking-tight text-white">Report Conversation</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Please outline your reason for reporting this conversation. Our professional marketplace compliance team will review all audit logs and message history within 24 hours.
            </p>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Detail the issue (e.g., spam, payment fraud, suspicious behavior)..."
              className="w-full h-28 bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none mb-5"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowReportDialog(false); setReportReason(''); }}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-850 text-slate-300 text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-850 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReport}
                disabled={!reportReason.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-black uppercase tracking-wider rounded-lg transition-all"
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
