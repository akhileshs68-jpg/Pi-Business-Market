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
  X
} from 'lucide-react';
import { Conversation } from '../../types';

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
        return true;
      case 'all':
      default:
        return true;
    }
  });

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadCounts[currentUserUid] || 0), 0);

  const getConversationTitle = (conv: Conversation) => {
    if (conv.orderId) return `Order #${conv.orderId.substring(0, 8).toUpperCase()}`;
    if (conv.bookingId) return `Booking #${conv.bookingId.substring(0, 8).toUpperCase()}`;
    if (conv.productId) return `Inquiry: ${conv.businessId || 'Product'}`;
    return conv.businessId || 'Direct Merchant Chat';
  };

  const getConversationIcon = (conv: Conversation) => {
    if (conv.orderId) return <ShoppingBag className="w-5 h-5 text-violet-400" />;
    if (conv.bookingId) return <Clock className="w-5 h-5 text-emerald-400" />;
    if (conv.type === 'support' || conv.type === 'system') return <HelpCircle className="w-5 h-5 text-amber-400" />;
    if (conv.businessId) return <Store className="w-5 h-5 text-violet-400" />;
    return <MessageSquare className="w-5 h-5 text-slate-400" />;
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border-r border-slate-900/80" id="conversation-list">
      {/* Header */}
      <div className="p-4 border-b border-slate-900/80 bg-slate-950 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-violet-600/10 text-violet-400 border border-violet-500/20">
              <Inbox className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Messages & Support</h2>
              <p className="text-[10px] text-slate-400">Buyer communications & inquiries</p>
            </div>
          </div>
          {totalUnread > 0 && (
            <span className="text-[10px] bg-rose-500/20 border border-rose-500/30 text-rose-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-rose-400" />
              {totalUnread} Unread
            </span>
          )}
        </div>
        
        {/* Search */}
        <div className="relative">
          <label htmlFor="inbox-search-input" className="sr-only">
            Search conversations
          </label>
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            id="inbox-search-input"
            type="text"
            placeholder="Search chats, orders, stores..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 min-h-[44px] bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search query"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sections Selection Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none" role="tablist" aria-label="Conversation categories">
          {[
            { id: 'all', label: 'All', icon: MessageSquare },
            { id: 'unread', label: 'Unread', icon: Sparkles },
            { id: 'orders', label: 'Orders', icon: ShoppingBag },
            { id: 'businesses', label: 'Stores', icon: Store },
            { id: 'support', label: 'Support', icon: HelpCircle },
            { id: 'recent', label: 'Recent', icon: Clock }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveSection(tab.id as InboxSection)}
                className={`flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer border focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none ${
                  isActive 
                    ? 'bg-violet-600 border-violet-500 text-white shadow-md shadow-violet-600/20' 
                    : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div 
        className="flex-1 overflow-y-auto divide-y divide-slate-900/80 scrollbar-thin scrollbar-thumb-slate-900 scrollbar-track-transparent"
        role="region"
        aria-label="Conversations list"
      >
        {filteredConversations.length > 0 ? (
          filteredConversations.map((conv) => {
            const unreadCount = conv.unreadCounts[currentUserUid] || 0;
            const isUnread = unreadCount > 0;
            const isSelected = selectedId === conv.conversationId;
            const title = getConversationTitle(conv);

            return (
              <div
                key={conv.conversationId}
                role="button"
                tabIndex={0}
                aria-selected={isSelected}
                aria-label={`${title}${isUnread ? `, ${unreadCount} unread` : ''}`}
                onClick={() => onSelect(conv)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(conv);
                  }
                }}
                className={`flex items-start gap-3.5 p-4 cursor-pointer transition-all border-l-4 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none ${
                  isSelected 
                    ? 'bg-slate-900 border-l-violet-500' 
                    : 'border-l-transparent hover:bg-slate-900/50'
                }`}
              >
                {/* Avatar / Icon Wrapper */}
                <div className="relative flex-shrink-0 mt-0.5">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold shadow-lg border transition-all ${
                    isSelected 
                      ? 'bg-violet-600/20 border-violet-500/40 text-white' 
                      : 'bg-slate-900 border-slate-800 text-slate-300'
                  }`}>
                    {getConversationIcon(conv)}
                  </div>
                  {isUnread && (
                    <div 
                      className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-black w-5 h-5 rounded-full border-2 border-slate-950 flex items-center justify-center shadow-lg"
                      aria-label={`${unreadCount} unread`}
                    >
                      {unreadCount}
                    </div>
                  )}
                </div>

                {/* Conversation Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`text-xs truncate tracking-tight ${isUnread ? 'font-black text-white' : 'font-bold text-slate-200'}`}>
                      {title}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-semibold whitespace-nowrap ml-2">
                      {new Date(conv.lastActivity).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  
                  {/* Last message preview */}
                  {conv.lastMessage ? (
                    <p className={`text-xs truncate leading-relaxed ${isUnread ? 'text-white font-semibold' : 'text-slate-400'}`}>
                      {conv.lastMessage.senderUid === currentUserUid ? (
                        <span className="text-violet-400 font-bold uppercase tracking-wider text-[10px] mr-1">You:</span>
                      ) : null}
                      {conv.lastMessage.content}
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">No messages yet</p>
                  )}

                  {/* Badges for fast metadata overview */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {conv.orderId && (
                      <span className="text-[9px] bg-violet-500/10 border border-violet-500/20 text-violet-300 font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                        Order Chat
                      </span>
                    )}
                    {conv.bookingId && (
                      <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                        Booking Inquiry
                      </span>
                    )}
                    {conv.productId && (
                      <span className="text-[9px] bg-sky-500/10 border border-sky-500/20 text-sky-300 font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                        Product Inquiry
                      </span>
                    )}
                    {conv.type === 'support' && (
                      <span className="text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                        Support Ticket
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-lg">
              <MessageSquare className="w-6 h-6 text-slate-400" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-white">No Conversations Found</p>
              <p className="text-[11px] text-slate-400 max-w-[220px] leading-relaxed">
                {searchQuery ? 'No results matched your search term.' : 'No conversations in this section.'}
              </p>
            </div>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-3.5 py-1.5 min-h-[36px] bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
              >
                Clear Search Filter
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
