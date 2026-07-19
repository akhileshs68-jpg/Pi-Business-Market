/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, MoreHorizontal, User, Store, ShieldCheck, CheckCheck } from 'lucide-react';
import { Conversation, Message } from '../../types';
import { messagingService } from '../../services/messagingService';
import { motion, AnimatePresence } from 'motion/react';

interface ChatWindowProps {
  conversation: Conversation;
  currentUserUid: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ conversation, currentUserUid }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = messagingService.subscribeToMessages(conversation.conversationId, setMessages);
    messagingService.markAsRead(conversation.conversationId, currentUserUid);
    return () => unsubscribe();
  }, [conversation.conversationId, currentUserUid]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isSending) return;

    setIsSending(true);
    try {
      await messagingService.sendMessage(conversation.conversationId, currentUserUid, inputValue.trim());
      setInputValue('');
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50" id="chat-window">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
            {conversation.type === 'business_customer' ? <Store className="w-5 h-5" /> : <User className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 leading-tight">
              {conversation.businessId || 'Customer Support'}
            </h3>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Online Now</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 uppercase">
            <ShieldCheck className="w-3 h-3" /> End-to-end encrypted
          </div>
          <button className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Stage */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-8 space-y-6"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => {
            const isMe = msg.senderUid === currentUserUid;
            const showDate = idx === 0 || new Date(messages[idx-1].createdAt).toDateString() !== new Date(msg.createdAt).toDateString();

            return (
              <React.Fragment key={msg.messageId}>
                {showDate && (
                  <div className="flex justify-center my-8">
                    <span className="px-4 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest shadow-sm">
                      {new Date(msg.createdAt).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] sm:max-w-[70%] group relative`}>
                    <div className={`
                      px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed
                      ${isMe 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'}
                    `}>
                      {msg.content}
                    </div>
                    <div className={`flex items-center gap-1.5 mt-1.5 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-[10px] font-medium text-slate-400">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isMe && <CheckCheck className="w-3 h-3 text-indigo-400" />}
                    </div>
                  </div>
                </motion.div>
              </React.Fragment>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Input Stage */}
      <div className="p-6 bg-white border-t border-slate-200">
        <form 
          onSubmit={handleSend}
          className="relative flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-500 transition-all shadow-inner"
        >
          <button 
            type="button"
            className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl transition-colors"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message here..."
            className="flex-1 bg-transparent py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isSending}
            className={`
              p-2.5 rounded-xl transition-all shadow-md
              ${inputValue.trim() && !isSending 
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 active:scale-95' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}
            `}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <p className="mt-3 text-center text-[10px] font-medium text-slate-400 uppercase tracking-widest">
          Press Enter to send message
        </p>
      </div>
    </div>
  );
};
