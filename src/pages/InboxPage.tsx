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
import { useLocation, useNavigate } from 'react-router-dom';
import { MessageSquare, ShoppingBag } from 'lucide-react';
import { Skeleton } from '../components/ui/Skeleton';

const InboxPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  useEffect(() => {
    if (!user) return;

    const handleInitialSelection = async () => {
      const state = location.state as any;
      
      const targetUid = state?.targetUid || (state?.contextType === 'order' ? 'merchant' : undefined);
      if (targetUid || state?.contextId) {
        try {
          const partnerUid = targetUid || 'merchant';
          const participants = partnerUid === user.uid ? [user.uid, 'merchant_partner'] : [user.uid, partnerUid];
          const type = state?.contextType === 'order' ? 'order' : 
                       state?.contextType === 'booking' ? 'booking' :
                       state?.contextType === 'product' ? 'business_customer' : 'direct';

          const conv = await messagingService.getOrCreateConversation(participants, type as any, {
            businessId: state?.businessId || (state?.contextType === 'product' || state?.contextType === 'business_customer' ? state.targetName : undefined),
            storeId: state?.storeId,
            productId: state?.contextType === 'product' ? state.contextId : undefined,
            orderId: state?.contextType === 'order' ? state.contextId : undefined,
            bookingId: state?.contextType === 'booking' ? state.contextId : undefined,
            relatedEntityType: state?.contextType,
            relatedEntityId: state?.contextId
          });
          
          setSelectedConversation(conv);
          setMobileView('chat');
        } catch (error) {
          console.error('Failed to initialize conversation from state:', error);
        }
      }
    };

    handleInitialSelection();

    const unsubscribe = messagingService.subscribeToConversations(user.uid, (data) => {
      setConversations(data);
      setIsLoading(false);
      
      if (selectedConversation) {
        const updated = data.find(c => c.conversationId === selectedConversation.conversationId);
        if (updated) setSelectedConversation(updated);
      }
    });

    return () => unsubscribe();
  }, [user, location.state]);

  if (authLoading || (isLoading && conversations.length === 0)) {
    return (
      <div className="flex h-[calc(100vh-4rem)] bg-slate-950">
        <div className="w-full md:w-80 lg:w-96 border-r border-slate-900 p-4 sm:p-6 space-y-4">
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <div className="space-y-3 pt-2">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        </div>
        <div className="hidden md:flex flex-1 p-8 items-center justify-center">
          <Skeleton className="w-full max-w-xl h-96 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-[500px] bg-slate-950 text-slate-100 overflow-hidden" id="inbox-page">
      {/* Sidebar - Conversation List */}
      <div className={`${mobileView === 'chat' ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-slate-900/80 bg-slate-950 flex-col`}>
        {conversations.length === 0 ? (
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-xl">
              <MessageSquare className="w-8 h-8 text-violet-400" />
            </div>
            <div className="space-y-1.5 max-w-xs">
              <h2 className="text-base font-bold text-white">No Messages Yet</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect with verified merchants, make service inquiries, or track order communications in real time.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/discovery')}
              className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-violet-600/20 cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Explore Marketplace</span>
            </button>
          </div>
        ) : (
          <ConversationList
            conversations={conversations}
            selectedId={selectedConversation?.conversationId}
            onSelect={(conv) => {
              setSelectedConversation(conv);
              setMobileView('chat');
            }}
            currentUserUid={user.uid}
          />
        )}
      </div>

      {/* Main Chat Area */}
      <div className={`${mobileView === 'list' ? 'hidden md:flex' : 'flex'} flex-1 min-w-0 bg-slate-950 relative flex-col`}>
        {selectedConversation ? (
          <div className="flex-1 flex flex-col min-w-0 h-full">
            <ChatWindow
              conversation={selectedConversation}
              currentUserUid={user.uid}
              onBack={() => setMobileView('list')}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950">
            <div className="w-20 h-20 rounded-3xl bg-slate-900/90 border border-slate-800/80 shadow-2xl flex items-center justify-center mb-6">
              <MessageSquare className="w-9 h-9 text-violet-400" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight mb-2">Select a Conversation</h2>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Choose an existing chat from the left panel to review messages, confirm receipts, or message merchant support.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InboxPage;
