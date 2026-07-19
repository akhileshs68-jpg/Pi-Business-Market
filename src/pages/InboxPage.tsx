/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ConversationList } from '../components/messaging/ConversationList';
import { ChatWindow } from '../components/messaging/ChatWindow';
import { messagingService } from '../services/messagingService';
import { Conversation } from '../types';
import { useAuth } from '../auth/useAuth';
import { useLocation } from 'react-router-dom';
import { Layout, MessageSquare } from 'lucide-react';

const InboxPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const handleInitialSelection = async () => {
      const state = location.state as any;
      if (state?.targetUid) {
        try {
          const participants = [user.uid, state.targetUid];
          // Determine conversation type
          const type = state.contextType === 'product' ? 'business' : 'direct';
          const conv = await messagingService.getOrCreateConversation(participants, type as any, {
            relatedEntityType: state.contextType,
            relatedEntityId: state.contextId
          });
          setSelectedConversation(conv);
        } catch (error) {
          console.error('Failed to initialize conversation from state:', error);
        }
      }
    };

    handleInitialSelection();

    const unsubscribe = messagingService.subscribeToConversations(user.uid, (data) => {
      setConversations(data);
      setIsLoading(false);
      
      // If we have a selected conversation, update it from the fresh data
      if (selectedConversation) {
        const updated = data.find(c => c.conversationId === selectedConversation.conversationId);
        if (updated) setSelectedConversation(updated);
      }
    });

    return () => unsubscribe();
  }, [user]);

  if (!user) return null;

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white overflow-hidden" id="inbox-page">
      {/* Sidebar */}
      <div className="w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-slate-200">
        <ConversationList
          conversations={conversations}
          selectedId={selectedConversation?.conversationId}
          onSelect={setSelectedConversation}
          currentUserUid={user.uid}
        />
      </div>

      {/* Main Chat Area */}
      <div className="hidden md:flex flex-1 min-w-0 bg-slate-50">
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            currentUserUid={user.uid}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-24 h-24 rounded-3xl bg-white shadow-xl flex items-center justify-center mb-8 border border-slate-100">
              <Layout className="w-10 h-10 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Select a conversation</h2>
            <p className="text-slate-500 max-w-sm leading-relaxed">
              Choose from your existing messages or start a new conversation with a business or client to get started.
            </p>
            <div className="mt-8 flex gap-3">
              <div className="px-4 py-2 bg-indigo-50 rounded-xl text-xs font-bold text-indigo-600 uppercase tracking-widest">
                Real-time Sync
              </div>
              <div className="px-4 py-2 bg-emerald-50 rounded-xl text-xs font-bold text-emerald-600 uppercase tracking-widest">
                Secure Chat
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InboxPage;
