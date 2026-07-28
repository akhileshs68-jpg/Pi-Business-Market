/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Paperclip, 
  MoreHorizontal, 
  User, 
  Store, 
  ShieldCheck, 
  CheckCheck,
  Phone,
  Video,
  ScreenShare,
  Pin,
  Smile,
  CornerUpLeft,
  MapPin,
  Sparkles,
  Download,
  Play,
  Pause,
  Volume2,
  X,
  FileText,
  ShoppingBag,
  ExternalLink,
  Info,
  Check
} from 'lucide-react';
import { Conversation, Message, MessageType } from '../../types';
import { messagingService } from '../../services/messagingService';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

interface ChatWindowProps {
  conversation: Conversation;
  currentUserUid: string;
}

const EMOJIS = ['👍', '❤️', '😂', '🔥', '👏', '🙏'];

export const ChatWindow: React.FC<ChatWindowProps> = ({ conversation, currentUserUid }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [pinnedMessage, setPinnedMessage] = useState<Message | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showCallScreen, setShowCallScreen] = useState<'voice' | 'video' | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = messagingService.subscribeToMessages(conversation.conversationId, (loaded) => {
      setMessages(loaded);
      
      // Auto-pin system or first helpful message for demonstration
      const systemMessage = loaded.find(m => m.messageType === 'system');
      if (systemMessage) setPinnedMessage(systemMessage);
    });

    messagingService.markAsRead(conversation.conversationId, currentUserUid);
    
    // Simulate other participant starting to type when user joins to make it immersive
    const typingTimer = setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 3000);
    }, 1500);

    return () => {
      unsubscribe();
      clearTimeout(typingTimer);
    };
  }, [conversation.conversationId, currentUserUid]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e?: React.FormEvent, customType: MessageType = 'text', customContent?: string, customMeta?: any) => {
    e?.preventDefault();
    const content = customContent || inputValue.trim();
    if (!content && customType === 'text') return;
    if (isSending) return;

    setIsSending(true);
    setInputValue('');
    const replyId = replyingTo?.messageId || undefined;
    setReplyingTo(null);
    setShowAttachments(false);

    try {
      // Determine senderRole based on conversation participants and current role
      const senderRole = conversation.participants[0] === currentUserUid ? 'Buyer' : 'Seller';
      
      await messagingService.sendMessage(
        conversation.conversationId, 
        currentUserUid, 
        content, 
        customType, 
        undefined, // attachments
        customMeta,
        replyId,
        senderRole
      );

      // Simulate receipt feedback after short delay
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          // Automated mock helpful marketplace response based on sent message
          const replies = [
            "Thank you for contacting Business Market Pi. Your request is registered under our premium network.",
            "That sounds great! I'll check on the details right away.",
            "Of course! The Pi transaction fee is only 0.01 Pi. Let's make this secure.",
            "Got it! Let me verify the inventory details and get back to you.",
          ];
          const randomReply = replies[Math.floor(Math.random() * replies.length)];
          messagingService.sendMessage(
            conversation.conversationId,
            conversation.participants.find(uid => uid !== currentUserUid) || 'BusinessOwner',
            randomReply,
            'text'
          );
        }, 2000);
      }, 1500);

    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleReact = async (messageId: string, emoji: string) => {
    // Optimistic UI updates / update in subcollection message doc metadata if exists
    setMessages(prev => prev.map(m => {
      if (m.messageId === messageId) {
        const reactions = m.metadata?.reactions || {};
        reactions[currentUserUid] = emoji;
        return { ...m, metadata: { ...m.metadata, reactions } };
      }
      return m;
    }));
  };

  const triggerCallSimulation = (type: 'voice' | 'video') => {
    setShowCallScreen(type);
  };

  const getPartnerDisplayName = () => {
    if (conversation.orderId) return `Order #${conversation.orderId.substring(0, 8).toUpperCase()} Support`;
    if (conversation.bookingId) return `Booking #${conversation.bookingId.substring(0, 8).toUpperCase()} Support`;
    return conversation.businessId || 'Client Connection';
  };

  return (
    <div className="flex flex-col h-full bg-[#020617]" id="chat-window">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-[#070b19] border-b border-slate-900 shadow-xl z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-md shrink-0">
            {conversation.businessId ? <Store className="w-5 h-5" /> : <User className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <h3 className="font-black text-white text-xs sm:text-sm uppercase tracking-wide leading-tight truncate">
              {getPartnerDisplayName()}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active on Pi Chain</span>
            </div>
          </div>
        </div>

        {/* Future Ready Call Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button 
            onClick={() => triggerCallSimulation('voice')}
            title="Voice Call" 
            className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-900/60 rounded-xl transition-all"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button 
            onClick={() => triggerCallSimulation('video')}
            title="Video Call" 
            className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-900/60 rounded-xl transition-all"
          >
            <Video className="w-4 h-4" />
          </button>
          <button 
            onClick={() => alert("Screen sharing is future-ready and active on Mainnet launch.")}
            title="Screen Share" 
            className="hidden sm:block p-2 text-slate-400 hover:text-violet-400 hover:bg-slate-900/60 rounded-xl transition-all"
          >
            <ScreenShare className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pinned Messages Panel */}
      {pinnedMessage && (
        <div className="bg-indigo-950/40 border-b border-indigo-500/10 px-6 py-2 flex items-center justify-between text-xs text-indigo-300 backdrop-blur z-10">
          <div className="flex items-center gap-2 min-w-0">
            <Pin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="font-bold uppercase tracking-wider text-[9px] text-indigo-400">Pinned:</span>
            <p className="truncate text-[11px] font-medium text-indigo-200">{pinnedMessage.content}</p>
          </div>
          <button onClick={() => setPinnedMessage(null)} className="text-indigo-400/60 hover:text-indigo-300">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Messages Stage */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-900 scrollbar-track-transparent"
      >
        <div className="flex justify-center mb-6">
          <span className="px-4 py-1.5 bg-indigo-950/20 border border-indigo-500/10 rounded-full text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> End-to-end encrypted • Pi Secured
          </span>
        </div>

        {messages.map((msg, idx) => {
          const isMe = msg.senderUid === currentUserUid;
          const showDate = idx === 0 || new Date(messages[idx-1].createdAt).toDateString() !== new Date(msg.createdAt).toDateString();
          const reactions = msg.metadata?.reactions || {};
          const isHovered = hoveredMessageId === msg.messageId;

          // Resolve Reply Context
          const originalMsg = msg.replyTo ? messages.find(m => m.messageId === msg.replyTo) : null;

          return (
            <React.Fragment key={msg.messageId}>
              {showDate && (
                <div className="flex justify-center my-6">
                  <span className="px-3.5 py-1 bg-slate-900/60 border border-slate-850 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    {new Date(msg.createdAt).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              )}

              <div 
                className={`flex ${isMe ? 'justify-end' : 'justify-start'} group relative`}
                onMouseEnter={() => setHoveredMessageId(msg.messageId)}
                onMouseLeave={() => setHoveredMessageId(null)}
              >
                {/* Action Floating Buttons for Messages */}
                {isHovered && (
                  <div className={`absolute -top-7 z-10 flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 shadow-2xl ${
                    isMe ? 'right-2' : 'left-2'
                  }`}>
                    {/* Reactions Selector */}
                    <div className="flex items-center gap-0.5 border-r border-slate-800 pr-1">
                      {EMOJIS.map(emoji => (
                        <button 
                          key={emoji} 
                          onClick={() => handleReact(msg.messageId, emoji)}
                          className="hover:scale-125 transition-transform p-0.5 text-xs"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                    <button 
                      onClick={() => setReplyingTo(msg)}
                      title="Reply"
                      className="p-1 text-slate-400 hover:text-white rounded transition-colors"
                    >
                      <CornerUpLeft className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => setPinnedMessage(msg)}
                      title="Pin Message"
                      className="p-1 text-slate-400 hover:text-white rounded transition-colors"
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className={`max-w-[85%] sm:max-w-[70%] flex flex-col`}>
                  {/* Quoted Reply Panel inside Chat Bubble */}
                  {originalMsg && (
                    <div className={`
                      text-[10px] p-2 bg-slate-900/80 border-l-2 border-indigo-500 text-slate-400 rounded-t-xl mb-[-4px] backdrop-blur-sm
                      ${isMe ? 'rounded-tr-none' : 'rounded-tl-none'}
                    `}>
                      <span className="font-bold text-indigo-400 uppercase tracking-wider text-[8px] block mb-0.5">
                        {originalMsg.senderUid === currentUserUid ? 'You' : 'Merchant'}
                      </span>
                      <p className="truncate max-w-[200px]">{originalMsg.content}</p>
                    </div>
                  )}

                  {/* Message Bubble Base styling depending on types */}
                  <div className={`
                    px-4.5 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-lg relative
                    ${isMe 
                      ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-none' 
                      : 'bg-slate-900/80 border border-slate-800 text-slate-200 rounded-tl-none'}
                  `}>
                    
                    {/* SENDER ROLE INFO */}
                    {msg.senderRole && (
                      <span className={`block text-[8px] font-black uppercase tracking-widest mb-1 ${
                        isMe ? 'text-indigo-200' : 'text-slate-400'
                      }`}>
                        {msg.senderRole}
                      </span>
                    )}

                    {/* CONTENT RENDER BY MESSAGE TYPE */}
                    {msg.messageType === 'text' && (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}

                    {msg.messageType === 'image' && (
                      <div className="space-y-2">
                        <img 
                          src={msg.content} 
                          alt="Attachment" 
                          className="rounded-lg max-h-48 object-cover w-full cursor-pointer hover:opacity-90 transition-opacity" 
                          referrerPolicy="no-referrer"
                          onClick={() => window.open(msg.content, '_blank')}
                        />
                        <p className="text-[11px] text-slate-300 font-medium">{msg.text || 'Shared Image'}</p>
                      </div>
                    )}

                    {msg.messageType === 'pdf' && (
                      <div className="flex items-center gap-3 p-2 bg-slate-950/80 rounded-xl border border-slate-850">
                        <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[11px] text-slate-200 truncate">{msg.content.split('/').pop() || 'Invoice_Statement.pdf'}</p>
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">1.2 MB • PDF Document</span>
                        </div>
                        <button className="p-2 bg-slate-900 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {msg.messageType === 'product_share' && (
                      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl max-w-xs cursor-pointer group hover:border-indigo-500/50 transition-all" onClick={() => navigate(`/product/${msg.metadata?.productId}`)}>
                        <div className="aspect-video bg-slate-900 overflow-hidden relative">
                          <img src={msg.metadata?.mainImage} alt={msg.content} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                          <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-indigo-600 text-white font-black text-[8px] uppercase tracking-wider rounded">
                            Marketplace Share
                          </span>
                        </div>
                        <div className="p-3.5 space-y-1">
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{msg.metadata?.brand}</span>
                          <h4 className="text-xs font-black text-white group-hover:text-indigo-400 truncate uppercase tracking-tight">{msg.content}</h4>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-900">
                            <span className="text-xs font-black text-indigo-400">{msg.metadata?.price} π</span>
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">View Product <ExternalLink className="w-3 h-3" /></span>
                          </div>
                        </div>
                      </div>
                    )}

                    {msg.messageType === 'business_share' && (
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-2xl max-w-xs cursor-pointer group hover:border-violet-500/50 transition-all" onClick={() => navigate(`/business/${msg.metadata?.businessId}`)}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-violet-600/10 border border-violet-500/30 rounded-lg flex items-center justify-center text-violet-400 shrink-0 font-bold text-sm">
                            {msg.content.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-black text-white truncate uppercase tracking-wide group-hover:text-violet-400">{msg.content}</h4>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest truncate">{msg.metadata?.category || 'Premium Merchant'}</p>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2.5 line-clamp-2 leading-relaxed font-medium">{msg.metadata?.description}</p>
                        <div className="mt-3 pt-2.5 border-t border-slate-900 flex items-center justify-between text-[10px] font-black text-violet-400 uppercase tracking-wider">
                          <span>Visit Profile</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    )}

                    {msg.messageType === 'voice' && (
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <button 
                          onClick={() => setIsPlayingAudio(isPlayingAudio === msg.messageId ? null : msg.messageId)}
                          className="w-8 h-8 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                        >
                          {isPlayingAudio === msg.messageId ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                        </button>
                        <div className="flex-1 flex items-center gap-0.5 h-6">
                          {/* Animated / Mock wave equalizer */}
                          {[1, 2, 3, 2, 4, 1, 3, 5, 2, 4, 1, 3, 2, 5, 1, 3, 4, 2].map((height, i) => (
                            <span 
                              key={i} 
                              className={`w-0.5 rounded-full bg-indigo-400/80 transition-all duration-300 ${
                                isPlayingAudio === msg.messageId ? 'animate-pulse' : 'opacity-60'
                              }`} 
                              style={{ height: `${height * (isPlayingAudio === msg.messageId ? 4 : 2)}px` }}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">0:14</span>
                      </div>
                    )}

                    {msg.messageType === 'location' && (
                      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden max-w-xs shadow-2xl">
                        <div className="h-28 bg-indigo-950/20 flex flex-col items-center justify-center relative p-4 text-center">
                          <MapPin className="w-8 h-8 text-rose-500 animate-bounce mb-1" />
                          <span className="text-[10px] font-bold text-slate-300 truncate w-full">{msg.content}</span>
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider mt-0.5">Latitude: 37.7749 | Longitude: -122.4194</span>
                        </div>
                        <button 
                          onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(msg.content)}`, '_blank')}
                          className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 border-t border-slate-850 text-[10px] font-black text-white uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Open Google Maps
                        </button>
                      </div>
                    )}

                    {/* Reactions Display */}
                    {Object.keys(reactions).length > 0 && (
                      <div className="absolute -bottom-2.5 right-3 bg-slate-900 border border-slate-800 rounded-full px-1.5 py-0.5 flex items-center gap-0.5 shadow-xl z-10">
                        {Object.values(reactions).map((emo, idx) => (
                          <span key={idx} className="text-[9px]">{emo as string}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Read indicator & Timestamp details */}
                  <div className={`flex items-center gap-1.5 mt-1.5 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
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
            </React.Fragment>
          );
        })}

        {/* Real-time typing indicators */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2 max-w-xs shadow-lg">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">Merchant is typing</span>
              <div className="flex gap-1 items-center h-2">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reply quotation preview floating above input stage */}
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

      {/* Input Stage */}
      <div className="p-4 sm:p-6 bg-[#070b19] border-t border-slate-900 relative">
        <form 
          onSubmit={handleSend}
          className="relative flex items-center gap-3 bg-slate-950 border border-slate-850 rounded-2xl px-4 py-2 focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-500 transition-all shadow-inner"
        >
          {/* Rich Action Attachments Trigger button */}
          <button 
            type="button"
            onClick={() => setShowAttachments(!showAttachments)}
            className="p-2 text-slate-400 hover:text-indigo-400 rounded-xl transition-colors shrink-0"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message secure on Pi chain..."
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

        {/* Floating Attachments Selector Box */}
        {showAttachments && (
          <div className="absolute bottom-20 left-6 right-6 bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-2xl grid grid-cols-2 sm:grid-cols-4 gap-2 z-20">
            <button 
              type="button"
              onClick={() => handleSend(undefined, 'image', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=60', {})}
              className="flex items-center gap-2 p-2.5 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white rounded-xl transition-all text-left text-xs font-bold uppercase tracking-wider"
            >
              <Paperclip className="w-4 h-4 text-indigo-400" /> Share Image
            </button>
            <button 
              type="button"
              onClick={() => handleSend(undefined, 'pdf', 'https://businessmarketpi.com/assets/invoices/INV_848292.pdf', {})}
              className="flex items-center gap-2 p-2.5 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white rounded-xl transition-all text-left text-xs font-bold uppercase tracking-wider"
            >
              <FileText className="w-4 h-4 text-rose-400" /> Share invoice
            </button>
            <button 
              type="button"
              onClick={() => handleSend(undefined, 'product_share', 'Supreme Comfort Sneakers (Limited Pi Edition)', { productId: 'PROD_1', brand: 'Nike Air Max', price: 15, mainImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=60' })}
              className="flex items-center gap-2 p-2.5 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white rounded-xl transition-all text-left text-xs font-bold uppercase tracking-wider"
            >
              <ShoppingBag className="w-4 h-4 text-violet-400" /> Share Product
            </button>
            <button 
              type="button"
              onClick={() => handleSend(undefined, 'business_share', 'Pi Alpha Electronics', { businessId: 'BUS_7', category: 'Premium Electronics', description: 'The leading provider of certified gadgets and accessories accepting Pi payments across the globe.' })}
              className="flex items-center gap-2 p-2.5 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white rounded-xl transition-all text-left text-xs font-bold uppercase tracking-wider"
            >
              <Store className="w-4 h-4 text-emerald-400" /> Share Store
            </button>
            <button 
              type="button"
              onClick={() => handleSend(undefined, 'location', '302 Pi Avenue, Block 7, San Francisco, CA', {})}
              className="flex items-center gap-2 p-2.5 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white rounded-xl transition-all text-left text-xs font-bold uppercase tracking-wider"
            >
              <MapPin className="w-4 h-4 text-rose-400" /> Location Pin
            </button>
            <button 
              type="button"
              onClick={() => handleSend(undefined, 'voice', 'Voice Record Placeholder', {})}
              className="flex items-center gap-2 p-2.5 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white rounded-xl transition-all text-left text-xs font-bold uppercase tracking-wider"
            >
              <Volume2 className="w-4 h-4 text-sky-400" /> Voice Message
            </button>
          </div>
        )}
      </div>

      {/* Simulated Premium Call Interface Overlay */}
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
              Hang Up Call
            </button>
            <button 
              onClick={() => alert("Simulated connection established successfully!")} 
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg transition-all"
            >
              Accept Call
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
