/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, ExternalLink, Info, AlertTriangle, CreditCard, Package, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { notificationService } from '../services/notificationService';
import { Notification, EnterpriseNotificationType } from '../types';
import { useAuth } from '../auth/useAuth';
import { useNavigate } from 'react-router-dom';

export const NotificationCenter: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

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
      case 'order_update': return <Package className="w-4 h-4 text-blue-500" />;
      case 'payment_update': return <CreditCard className="w-4 h-4 text-green-500" />;
      case 'message_new': return <MessageSquare className="w-4 h-4 text-indigo-500" />;
      case 'system_alert': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      default: return <Info className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="relative" ref={containerRef} id="notification-center">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-slate-900 transition-colors rounded-full hover:bg-slate-100"
        aria-label="Notifications"
        id="notif-bell-btn"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white">
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
            className="absolute right-0 mt-2 w-80 sm:w-96 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl z-50"
            id="notif-dropdown"
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    <Check className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-100">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div
                    key={notif.notificationId}
                    onClick={() => handleAction(notif)}
                    className={`group flex items-start gap-3 p-4 transition-colors cursor-pointer hover:bg-slate-50 ${
                      notif.status === 'unread' ? 'bg-indigo-50/30' : ''
                    }`}
                  >
                    <div className="mt-1 flex-shrink-0 p-2 rounded-lg bg-white border border-slate-100 shadow-sm">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className={`text-sm font-medium truncate ${
                          notif.status === 'unread' ? 'text-slate-900' : 'text-slate-600'
                        }`}>
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {notif.body}
                      </p>
                      {notif.linkTo && (
                        <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-indigo-600">
                          View details <ExternalLink className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>
                    {notif.status === 'unread' && (
                      <div className="mt-1.5 h-2 w-2 rounded-full bg-indigo-500" />
                    )}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="p-3 rounded-full bg-slate-50 mb-3">
                    <Bell className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-sm font-medium text-slate-900">All caught up!</p>
                  <p className="text-xs text-slate-500 mt-1">No new notifications at the moment.</p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 bg-slate-50/50 p-3 text-center">
              <button
                onClick={() => { navigate('/account/notifications'); setIsOpen(false); }}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                View notification preferences
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
