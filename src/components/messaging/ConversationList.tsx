/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Search, MoreVertical, MessageSquare } from 'lucide-react';
import { Conversation } from '../../types';
import { motion } from 'motion/react';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (conv: Conversation) => void;
  currentUserUid: string;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedId,
  onSelect,
  currentUserUid
}) => {
  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200" id="conversation-list">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Messages</h2>
          <button className="p-2 text-slate-500 hover:bg-white rounded-lg transition-colors shadow-sm">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length > 0 ? (
          conversations.map((conv) => {
            const isUnread = (conv.unreadCounts[currentUserUid] || 0) > 0;
            const isSelected = selectedId === conv.conversationId;

            return (
              <motion.div
                key={conv.conversationId}
                whileHover={{ backgroundColor: 'rgb(248 250 252)' }}
                onClick={() => onSelect(conv)}
                className={`flex items-center gap-3 p-4 cursor-pointer border-b border-slate-50 transition-all ${
                  isSelected ? 'bg-indigo-50/50 border-l-4 border-l-indigo-500' : 'border-l-4 border-l-transparent'
                }`}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold border-2 border-white shadow-sm">
                    {conv.businessId ? conv.businessId.charAt(0) : <MessageSquare className="w-6 h-6" />}
                  </div>
                  {isUnread && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-white" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`text-sm truncate ${isUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                      {conv.businessId || 'Direct Chat'}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(conv.lastActivity).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  
                  {conv.lastMessage && (
                    <p className={`text-xs truncate ${isUnread ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
                      {conv.lastMessage.senderUid === currentUserUid ? 'You: ' : ''}
                      {conv.lastMessage.content}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-900">No messages yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
              Start a conversation with a business or customer.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
