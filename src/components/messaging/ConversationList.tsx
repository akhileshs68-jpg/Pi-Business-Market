/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Search, 
  MessageSquare, 
  ShoppingBag, 
  Store, 
  HelpCircle, 
  Sparkles,
  Inbox,
  Clock,
  CheckCircle,
  FileText
} from 'lucide-react';
import { Conversation } from '../../types';
import { motion } from 'motion/react';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (conv: Conversation) => void;
  currentUserUid: string;
}

export type InboxSection = 'all' | 'orders' | 'businesses' | 'support' | 'unread' | 'recent';

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedId,
  onSelect,
  currentUserUid
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<InboxSection>('all');

  // Filter conversations based on search query and active section
  const filteredConversations = conversations.filter((conv) => {
    // Search query matches conversationId, businessId, orderId, bookingId, or lastMessage content
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      conv.conversationId.toLowerCase().includes(searchLower) ||
      (conv.businessId || '').toLowerCase().includes(searchLower) ||
      (conv.orderId || '').toLowerCase().includes(searchLower) ||
      (conv.bookingId || '').toLowerCase().includes(searchLower) ||
      (conv.lastMessage?.content || '').toLowerCase().includes(searchLower);

    if (!matchesSearch) return false;

    // Filter by Section
    switch (activeSection) {
      case 'unread':
        return (conv.unreadCounts[currentUserUid] || 0) > 0;
      case 'orders':
        return !!conv.orderId || conv.type === 'order' || conv.relatedEntityType === 'order';
      case 'businesses':
        return !!conv.businessId && !conv.orderId && !conv.bookingId;
      case 'support':
        return conv.type === 'support' || conv.type === 'system';
      case 'recent':
        // Sort/filter logic handles "recent" (which is typically top 5 or sorted by time, we keep all and display in order)
        return true;
      case 'all':
      default:
        return true;
    }
  });

  const getConversationTitle = (conv: Conversation) => {
    if (conv.orderId) return `Order #${conv.orderId.substring(0, 8).toUpperCase()}`;
    if (conv.bookingId) return `Booking #${conv.bookingId.substring(0, 8).toUpperCase()}`;
    if (conv.productId) return `Inquiry: ${conv.businessId || 'Product'}`;
    return conv.businessId || 'Direct Chat';
  };

  const getConversationIcon = (conv: Conversation) => {
    if (conv.orderId) return <ShoppingBag className="w-5 h-5 text-indigo-400" />;
    if (conv.bookingId) return <Clock className="w-5 h-5 text-emerald-400" />;
    if (conv.type === 'support' || conv.type === 'system') return <HelpCircle className="w-5 h-5 text-amber-400" />;
    if (conv.businessId) return <Store className="w-5 h-5 text-violet-400" />;
    return <MessageSquare className="w-5 h-5 text-slate-400" />;
  };

  return (
    <div className="flex flex-col h-full bg-[#030712] border-r border-slate-900" id="conversation-list">
      {/* Header */}
      <div className="p-4 border-b border-slate-900 bg-[#070b19]/60">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Inbox className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-black text-white uppercase tracking-tight">Inbox Hub</h2>
          </div>
          <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-1 rounded-lg font-bold uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-400" /> Universal
          </span>
        </div>
        
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search chats, messages, orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-inner"
          />
        </div>

        {/* Sections Selection Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'All', icon: MessageSquare },
            { id: 'unread', label: 'Unread', icon: Sparkles },
            { id: 'orders', label: 'Orders', icon: ShoppingBag },
            { id: 'businesses', label: 'Businesses', icon: Store },
            { id: 'support', label: 'Support', icon: HelpCircle },
            { id: 'recent', label: 'Recent', icon: Clock }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as InboxSection)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap shrink-0 border ${
                  isActive 
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/10' 
                    : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <Icon className="w-3 h-3" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-900/60 scrollbar-thin scrollbar-thumb-slate-900 scrollbar-track-transparent">
        {filteredConversations.length > 0 ? (
          filteredConversations.map((conv) => {
            const unreadCount = conv.unreadCounts[currentUserUid] || 0;
            const isUnread = unreadCount > 0;
            const isSelected = selectedId === conv.conversationId;

            return (
              <motion.div
                key={conv.conversationId}
                whileHover={{ backgroundColor: 'rgba(30, 41, 59, 0.3)' }}
                onClick={() => onSelect(conv)}
                className={`flex items-start gap-3.5 p-4 cursor-pointer transition-all border-l-4 ${
                  isSelected 
                    ? 'bg-slate-900/50 border-l-indigo-500' 
                    : 'border-l-transparent'
                }`}
              >
                {/* Avatar / Icon Wrapper */}
                <div className="relative flex-shrink-0 mt-0.5">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold shadow-lg border transition-all ${
                    isSelected 
                      ? 'bg-indigo-600/10 border-indigo-500 text-white' 
                      : 'bg-slate-900 border-slate-800 text-slate-300'
                  }`}>
                    {getConversationIcon(conv)}
                  </div>
                  {isUnread && (
                    <div className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] font-black w-5 h-5 rounded-full border-2 border-slate-950 flex items-center justify-center animate-bounce shadow-lg">
                      {unreadCount}
                    </div>
                  )}
                </div>

                {/* Conversation Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className={`text-xs truncate uppercase tracking-tight ${isUnread ? 'font-black text-white' : 'font-bold text-slate-300'}`}>
                      {getConversationTitle(conv)}
                    </h3>
                    <span className="text-[9px] text-slate-500 font-bold whitespace-nowrap ml-2">
                      {new Date(conv.lastActivity).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  
                  {/* Last message preview */}
                  {conv.lastMessage ? (
                    <p className={`text-[11px] truncate leading-relaxed ${isUnread ? 'text-white font-semibold' : 'text-slate-400'}`}>
                      {conv.lastMessage.senderUid === currentUserUid ? (
                        <span className="text-indigo-400/80 font-bold uppercase tracking-wider text-[9px] mr-1">You:</span>
                      ) : null}
                      {conv.lastMessage.content}
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">No messages yet</p>
                  )}

                  {/* Badges for fast metadata overview */}
                  <div className="flex items-center gap-1.5 mt-2">
                    {conv.orderId && (
                      <span className="text-[8px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-black uppercase tracking-wider px-1.5 py-0.5 rounded">
                        Order Chat
                      </span>
                    )}
                    {conv.bookingId && (
                      <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black uppercase tracking-wider px-1.5 py-0.5 rounded">
                        Booking Chat
                      </span>
                    )}
                    {conv.productId && (
                      <span className="text-[8px] bg-violet-500/10 border border-violet-500/20 text-violet-400 font-black uppercase tracking-wider px-1.5 py-0.5 rounded">
                        Product Inquiry
                      </span>
                    )}
                    {conv.type === 'support' && (
                      <span className="text-[8px] bg-amber-500/10 border border-amber-500/20 text-amber-400 font-black uppercase tracking-wider px-1.5 py-0.5 rounded">
                        Support
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-16 h-16 rounded-[1.5rem] bg-slate-900 border border-slate-850 flex items-center justify-center mb-4">
              <MessageSquare className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-xs font-black text-white uppercase tracking-tight">No conversations found</p>
            <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] font-bold">
              Try search or change your inbox section filter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
