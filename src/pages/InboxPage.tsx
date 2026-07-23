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
import { Layout, MessageSquare, ArrowLeft } from 'lucide-react';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';

const InboxPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  useEffect(() => {
    if (!user) return;

    const handleInitialSelection = async () => {
      const state = location.state as any;
      if (state?.targetUid) {
        try {
          const participants = [user.uid, state.targetUid];
          const type = state.contextType === 'product' ? 'business' : 'direct';
          const conv = await messagingService.getOrCreateConversation(participants, type as any, {
            relatedEntityType: state.contextType,
            relatedEntityId: state.contextId
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
  }, [user]);

  if (authLoading || (isLoading && conversations.length === 0)) {
    return (
      <div className="flex h-[calc(100vh-64px)] bg-slate-950">
        <div className="w-full md:w-80 lg:w-96 border-r border-slate-900 p-6 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="hidden md:flex flex-1 p-12">
          <Skeleton className="w-full h-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-[calc(100vh-64px)] bg-slate-950 overflow-hidden" id="inbox-page">
      {/* Sidebar - Conversation List */}
      <div className={`${mobileView === 'chat' ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-slate-900 bg-slate-950`}>
        {conversations.length === 0 ? (
          <div className="flex-1 p-6">
            <EmptyState 
              icon={MessageSquare}
              title="No Messages"
              description="You haven't started any conversations yet. Browse the marketplace and message a vendor to get started."
            />
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
      <div className={`${mobileView === 'list' ? 'hidden md:flex' : 'flex'} flex-1 min-w-0 bg-slate-900/50 relative`}>
        {selectedConversation ? (
          <div className="flex-1 flex flex-col min-w-0">
            <div className="md:hidden absolute left-4 top-4 z-10">
              <button 
                onClick={() => setMobileView('list')}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
            <ChatWindow
              conversation={selectedConversation}
              currentUserUid={user.uid}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-24 h-24 rounded-[2rem] bg-slate-900 border border-slate-800 shadow-2xl flex items-center justify-center mb-8">
              <MessageSquare className="w-10 h-10 text-indigo-500" />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-3">Select a conversation</h2>
            <p className="text-slate-500 max-w-sm leading-relaxed font-medium">
              Choose from your existing messages or start a new conversation with a business or client to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InboxPage;
