/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  Check, 
  Trash2, 
  ExternalLink, 
  Info, 
  AlertTriangle, 
  CreditCard, 
  Package, 
  MessageSquare,
  ShieldAlert,
  Sparkles,
  ChevronRight,
  CheckCheck,
  AlertOctagon,
  Megaphone,
  Store
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { notificationService } from '../services/notificationService';
import { Notification, EnterpriseNotificationType, NotificationPriority } from '../types';
import { useAuth } from '../auth/useAuth';
import { useNavigate } from 'react-router-dom';

export const NotificationCenter: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = notificationService.subscribeToNotifications(user.uid, setNotifications);
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const unreadCount = notifications.filter(n => n.status === 'unread').length;
  const filteredNotifications = activeFilter === 'unread' 
    ? notifications.filter(n => n.status === 'unread') 
    : notifications;

  const handleAction = async (notif: Notification) => {
    if (notif.status === 'unread') {
      await notificationService.markAsRead(notif.notificationId);
    }
    if (notif.linkTo) {
      navigate(notif.linkTo);
      setIsOpen(false);
    }
  };

  const markAllRead = async () => {
    if (!user) return;
    await notificationService.markAllAsRead(user.uid);
  };

  const getIcon = (type: EnterpriseNotificationType) => {
    switch (type) {
      case 'order_update': return <Package className="w-4 h-4 text-sky-400" />;
      case 'payment_update': return <CreditCard className="w-4 h-4 text-emerald-400" />;
      case 'message_new': return <MessageSquare className="w-4 h-4 text-violet-400" />;
      case 'system_alert': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'security_alert': return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      case 'loyalty_reward': return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'business_announcement': return <Megaphone className="w-4 h-4 text-indigo-400" />;
      case 'marketplace_update': return <Store className="w-4 h-4 text-violet-400" />;
      default: return <Info className="w-4 h-4 text-slate-400" />;
    }
  };

  const getPriorityBadge = (priority?: NotificationPriority) => {
    if (!priority) return null;
    switch (priority) {
      case 'urgent':
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
            Urgent
          </span>
        );
      case 'high':
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
            High
          </span>
        );
      case 'medium':
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-violet-500/20 text-violet-300 border border-violet-500/30">
            Med
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative" ref={containerRef} id="notification-center">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-slate-400 hover:text-white transition-colors rounded-xl hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none cursor-pointer"
        aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications (No unread)'}
        aria-expanded={isOpen}
        aria-haspopup="true"
        id="notif-bell-btn"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white ring-2 ring-slate-900 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl z-50 text-slate-200"
            id="notif-dropdown"
            role="region"
            aria-label="Notification Center Dropdown"
          >
            {/* Header */}
            <div className="border-b border-slate-800 bg-slate-950/90 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-black text-white uppercase tracking-tight">Notifications</h2>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[10px] font-black">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="min-h-[44px] px-2.5 flex items-center gap-1.5 text-xs font-bold text-violet-400 hover:text-violet-300 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none rounded-lg"
                    aria-label="Mark all notifications as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark read</span>
                  </button>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800/60">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`min-h-[36px] px-3 text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                    activeFilter === 'all'
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  aria-pressed={activeFilter === 'all'}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setActiveFilter('unread')}
                  className={`min-h-[36px] px-3 text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                    activeFilter === 'unread'
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  aria-pressed={activeFilter === 'unread'}
                >
                  Unread ({unreadCount})
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-800/60" id="notif-dropdown-list">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notif) => (
                  <div
                    key={notif.notificationId}
                    onClick={() => handleAction(notif)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleAction(notif);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`${notif.title} - ${notif.body}`}
                    className={`group flex items-start gap-3 p-3.5 transition-colors cursor-pointer hover:bg-slate-800/60 focus-visible:bg-slate-800/70 focus-visible:outline-none ${
                      notif.status === 'unread' ? 'bg-violet-950/25 border-l-2 border-l-violet-500' : ''
                    }`}
                  >
                    <div className="mt-0.5 shrink-0 p-2 rounded-xl bg-slate-950 border border-slate-800">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className={`text-xs font-bold truncate ${
                            notif.status === 'unread' ? 'text-white' : 'text-slate-300'
                          }`}>
                            {notif.title}
                          </p>
                          {getPriorityBadge(notif.priority)}
                        </div>
                        <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {notif.body}
                      </p>
                      {notif.linkTo && (
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-violet-400 group-hover:text-violet-300">
                          <span>View details</span>
                          <ChevronRight className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    {notif.status === 'unread' && (
                      <div className="mt-1.5 h-2 w-2 rounded-full bg-violet-400 shrink-0 animate-pulse" />
                    )}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 mb-2">
                    <Bell className="w-5 h-5 text-slate-600" />
                  </div>
                  <p className="text-xs font-bold text-slate-300">
                    {activeFilter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                    {activeFilter === 'unread' ? 'All caught up on recent operational alerts.' : 'New orders, messages, and platform alerts will show here.'}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-800 bg-slate-950/90 p-2.5 text-center">
              <button
                onClick={() => { navigate('/account/notifications'); setIsOpen(false); }}
                className="w-full min-h-[44px] flex items-center justify-center text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                id="notif-view-all-btn"
              >
                <span>Open Full Notification Center</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1 text-violet-400" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

