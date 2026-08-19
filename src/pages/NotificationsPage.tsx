/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Search, 
  Filter, 
  Check, 
  Trash2, 
  Archive, 
  Pin, 
  Settings, 
  ShieldAlert, 
  Megaphone, 
  Send, 
  ExternalLink, 
  ChevronDown, 
  X, 
  CheckCircle2, 
  AlertOctagon, 
  Sparkles,
  Info,
  Clock,
  Store,
  DollarSign,
  Package,
  CreditCard,
  MessageSquare,
  AlertTriangle,
  ArrowRight,
  CheckCheck,
  RotateCw,
  Zap,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { notificationService } from '../services/notificationService';
import { Notification, EnterpriseNotificationType, NotificationPriority, NotificationPreference } from '../types';
import { useAuth } from '../auth/useAuth';
import { useNavigate } from 'react-router-dom';
import { RoleResolver } from '../services/identity/RoleResolver';

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // States
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter States
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'archived'>('all');
  const [priorityFilter, setPriorityFilter] = useState<NotificationPriority | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Preferences States
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  
  // Broadcast Form States
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastType, setBroadcastType] = useState<EnterpriseNotificationType>('system_alert');
  const [broadcastPriority, setBroadcastPriority] = useState<NotificationPriority>('medium');
  const [broadcastTargetRole, setBroadcastTargetRole] = useState<string>('All');
  const [broadcastLink, setBroadcastLink] = useState('');
  const [broadcastPinned, setBroadcastPinned] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<{ success: boolean; count: number } | null>(null);
  const [dispatching, setDispatching] = useState(false);

  // Load Real-time Notifications
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsubscribe = notificationService.subscribeToNotifications(user.uid, (data) => {
      setNotifications(data || []);
      setLoading(false);
    });
    
    // Load preferences
    notificationService.getPreferences(user.uid).then(setPreferences).catch(() => {});
    
    return () => unsubscribe();
  }, [user]);

  const roleResolver = new RoleResolver(user);
  const isAdminOrMerchant = roleResolver.isSuperAdmin() || roleResolver.isPlatformAdmin() || roleResolver.isBusinessOwner() || roleResolver.isSeller();

  // Action handlers
  const handleMarkRead = async (id: string) => {
    await notificationService.markAsRead(id);
  };

  const handleArchive = async (id: string) => {
    await notificationService.archiveNotification(id);
  };

  const handleDismiss = async (id: string) => {
    await notificationService.dismissNotification(id);
  };

  const handleTogglePin = async (id: string, currentPinned: boolean) => {
    await notificationService.togglePinNotification(id, !currentPinned);
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await notificationService.markAllAsRead(user.uid);
  };

  const handlePreferenceToggle = async (channelKey: 'inApp' | 'email' | 'push') => {
    if (!user || !preferences) return;
    setSavingPrefs(true);
    const updatedChannels = {
      ...preferences.channels,
      [channelKey]: !preferences.channels[channelKey]
    };
    await notificationService.updatePreferences(user.uid, { channels: updatedChannels });
    setPreferences({ ...preferences, channels: updatedChannels });
    setSavingPrefs(false);
  };

  const handleMutedTypeToggle = async (type: EnterpriseNotificationType) => {
    if (!user || !preferences) return;
    setSavingPrefs(true);
    let updatedMuted = [...(preferences.mutedTypes || [])];
    if (updatedMuted.includes(type)) {
      updatedMuted = updatedMuted.filter(t => t !== type);
    } else {
      updatedMuted.push(type);
    }
    await notificationService.updatePreferences(user.uid, { mutedTypes: updatedMuted });
    setPreferences({ ...preferences, mutedTypes: updatedMuted });
    setSavingPrefs(false);
  };

  const handleBroadcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !broadcastTitle || !broadcastBody) return;
    setDispatching(true);
    setDispatchResult(null);

    try {
      const count = await notificationService.broadcastNotification(
        user.uid,
        broadcastType,
        broadcastTitle,
        broadcastBody,
        {
          targetRole: broadcastTargetRole,
          priority: broadcastPriority,
          linkTo: broadcastLink || undefined,
          pinned: broadcastPinned
        }
      );
      setDispatchResult({ success: true, count });
      setBroadcastTitle('');
      setBroadcastBody('');
      setBroadcastLink('');
      setBroadcastPinned(false);
    } catch (err) {
      console.error(err);
      setDispatchResult({ success: false, count: 0 });
    } finally {
      setDispatching(false);
    }
  };

  // Icon Matcher
  const getIcon = (type: EnterpriseNotificationType, priority?: NotificationPriority) => {
    switch (type) {
      case 'order_update':
        return <Package className="w-5 h-5 text-sky-400" />;
      case 'payment_update':
        return <CreditCard className="w-5 h-5 text-emerald-400" />;
      case 'wallet_alert':
        return <DollarSign className="w-5 h-5 text-emerald-400" />;
      case 'loyalty_reward':
        return <Sparkles className="w-5 h-5 text-amber-400" />;
      case 'message_new':
        return <MessageSquare className="w-5 h-5 text-violet-400" />;
      case 'system_alert':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'security_alert':
        return <ShieldAlert className="w-5 h-5 text-rose-400" />;
      case 'business_announcement':
        return <Megaphone className="w-5 h-5 text-indigo-400" />;
      case 'marketplace_update':
        return <Store className="w-5 h-5 text-violet-400" />;
      default:
        return <Info className="w-5 h-5 text-slate-400" />;
    }
  };

  // Mapping types to UI categories
  const categoryGroups = [
    { value: 'all', label: 'All Categories', icon: SlidersHorizontal },
    { value: 'orders_payments', label: 'Orders & Payments', icon: Package },
    { value: 'wallet_rewards', label: 'Wallet & Rewards', icon: DollarSign },
    { value: 'messaging', label: 'Customer Messages', icon: MessageSquare },
    { value: 'business', label: 'Business Hub', icon: Store },
    { value: 'system_security', label: 'System & Security', icon: ShieldAlert }
  ];

  const typeBelongsToGroup = (type: EnterpriseNotificationType, group: string): boolean => {
    if (group === 'all') return true;
    if (group === 'orders_payments') return ['order_update', 'payment_update', 'shipment_update'].includes(type);
    if (group === 'wallet_rewards') return ['wallet_alert', 'loyalty_reward'].includes(type);
    if (group === 'messaging') return ['message_new', 'review_reply'].includes(type);
    if (group === 'business') return ['business_announcement', 'job_update', 'marketplace_update'].includes(type);
    if (group === 'system_security') return ['system_alert', 'security_alert', 'admin_notice'].includes(type);
    return false;
  };

  // Filter & Search Logic
  const filteredNotifications = notifications.filter(n => {
    const matchesSearch = 
      !searchQuery || 
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      n.body.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'unread' && n.status === 'unread') || 
      (statusFilter === 'archived' && n.status === 'archived');
    
    const matchesPriority = priorityFilter === 'all' || n.priority === priorityFilter;
    const matchesCategory = typeBelongsToGroup(n.type, categoryFilter);

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  const unreadCount = notifications.filter(n => n.status === 'unread').length;
  const urgentCount = notifications.filter(n => n.priority === 'urgent' && n.status === 'unread').length;
  const highCount = notifications.filter(n => n.priority === 'high' && n.status === 'unread').length;
  const actionRequiredNotifications = notifications.filter(
    n => n.status === 'unread' && (n.priority === 'urgent' || n.priority === 'high')
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16" id="notifications-platform">
      {/* Top Header Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-violet-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-violet-600/20 shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">Notification Center</h1>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[10px] font-black">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium">Operational alerts, customer events, and system notifications</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="min-h-[44px] px-3.5 py-2 border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none flex items-center gap-1.5"
            >
              <span>Seller Hub</span>
            </button>

            <button
              onClick={() => setShowPreferences(!showPreferences)}
              className={`min-h-[44px] px-3.5 py-2 flex items-center gap-2 rounded-xl text-xs font-bold transition-all border cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none ${
                showPreferences 
                  ? 'bg-violet-600 text-white border-violet-500 shadow-md shadow-violet-600/20' 
                  : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              aria-expanded={showPreferences}
            >
              <Settings className="w-4 h-4" />
              <span>Preferences</span>
            </button>

            {isAdminOrMerchant && (
              <button
                onClick={() => setShowBroadcast(!showBroadcast)}
                className={`min-h-[44px] px-3.5 py-2 flex items-center gap-2 rounded-xl text-xs font-bold transition-all border cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none ${
                  showBroadcast 
                    ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/20' 
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                aria-expanded={showBroadcast}
              >
                <Megaphone className="w-4 h-4 text-amber-400" />
                <span>Broadcast Alert</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Operational Metrics Cards */}
        <section aria-label="Alert metrics" className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Alerts</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-white font-mono">{notifications.length}</span>
              <Bell className="w-4 h-4 text-slate-500" />
            </div>
            <span className="text-[10px] text-slate-500 mt-1">Real-time event stream</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Action Required</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-violet-400 font-mono">{unreadCount}</span>
              <CheckCircle2 className="w-4 h-4 text-violet-400" />
            </div>
            <span className="text-[10px] text-slate-500 mt-1">Unread operational items</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Urgent Priority</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-rose-400 font-mono">{urgentCount}</span>
              <AlertOctagon className="w-4 h-4 text-rose-400" />
            </div>
            <span className="text-[10px] text-slate-500 mt-1">Critical security &amp; system alerts</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Gateway Status</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-sm font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Socket
              </span>
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-[10px] text-slate-500 mt-1">Direct Firestore streaming</span>
          </div>
        </section>

        {/* Urgent Action Required Banner */}
        {actionRequiredNotifications.length > 0 && (
          <section aria-label="Action required tasks" className="bg-gradient-to-r from-rose-950/40 via-slate-900 to-amber-950/30 border border-rose-800/50 rounded-2xl p-4 sm:p-5 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <h2 className="text-xs font-black text-rose-300 uppercase tracking-wider">
                  Action Required ({actionRequiredNotifications.length} Priority Items)
                </h2>
              </div>
              <span className="text-[10px] text-slate-400">Immediate seller attention needed</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {actionRequiredNotifications.slice(0, 2).map((item) => (
                <div 
                  key={item.notificationId} 
                  className="p-3 bg-slate-950/80 border border-rose-900/40 rounded-xl flex items-start justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                        item.priority === 'urgent' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {item.priority}
                      </span>
                      <h3 className="text-xs font-bold text-white truncate">{item.title}</h3>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-1">{item.body}</p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleMarkRead(item.notificationId)}
                      title="Mark as Read"
                      className="min-h-[44px] min-w-[44px] p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-white flex items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    {item.linkTo && (
                      <button
                        onClick={() => navigate(item.linkTo!)}
                        className="min-h-[44px] px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-lg flex items-center gap-1 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                      >
                        <span>Resolve</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Preference Center Panel */}
        <AnimatePresence>
          {showPreferences && (
            <motion.section
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6 overflow-hidden"
              id="preferences-panel"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-violet-400" />
                  <h2 className="text-sm font-black text-white uppercase tracking-tight">Notification Delivery Preferences</h2>
                </div>
                <button 
                  onClick={() => setShowPreferences(false)} 
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white cursor-pointer rounded-lg focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                  aria-label="Close preferences"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {preferences ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Delivery Channels */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider">Active Delivery Channels</h3>
                    
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-white">In-App Live Alerts</p>
                        <p className="text-[11px] text-slate-400">Direct notifications in top bar and operational dashboard</p>
                      </div>
                      <button
                        onClick={() => handlePreferenceToggle('inApp')}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
                          preferences.channels?.inApp ? 'bg-violet-600' : 'bg-slate-800'
                        }`}
                        role="switch"
                        aria-checked={!!preferences.channels?.inApp}
                        aria-label="Toggle In-App Alerts"
                      >
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          preferences.channels?.inApp ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-white">Email Summaries</p>
                        <p className="text-[11px] text-slate-400">Sends high-priority transaction logs to your verified account email</p>
                      </div>
                      <button
                        onClick={() => handlePreferenceToggle('email')}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
                          preferences.channels?.email ? 'bg-violet-600' : 'bg-slate-800'
                        }`}
                        role="switch"
                        aria-checked={!!preferences.channels?.email}
                        aria-label="Toggle Email Summaries"
                      >
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          preferences.channels?.email ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-white">Browser Push Alerts</p>
                        <p className="text-[11px] text-slate-400">Instant browser notifications for customer messages and orders</p>
                      </div>
                      <button
                        onClick={() => handlePreferenceToggle('push')}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
                          preferences.channels?.push ? 'bg-violet-600' : 'bg-slate-800'
                        }`}
                        role="switch"
                        aria-checked={!!preferences.channels?.push}
                        aria-label="Toggle Browser Push Alerts"
                      >
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          preferences.channels?.push ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  </div>

                  {/* Muted Categories */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider">Alert Category Subscriptions</h3>
                    <p className="text-[11px] text-slate-400">Uncheck categories to mute non-critical events in your activity stream.</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        { key: 'order_update', label: 'Order Dispatches' },
                        { key: 'payment_update', label: 'Payment Clearances' },
                        { key: 'wallet_alert', label: 'Wallet Activities' },
                        { key: 'loyalty_reward', label: 'BMP Incentives' },
                        { key: 'message_new', label: 'Direct Messages' },
                        { key: 'business_announcement', label: 'Business Updates' },
                        { key: 'system_alert', label: 'System Alerts' },
                        { key: 'security_alert', label: 'Security Notices' }
                      ].map((item) => {
                        const isMuted = preferences.mutedTypes?.includes(item.key as EnterpriseNotificationType);
                        return (
                          <label key={item.key} className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:bg-slate-800/40 cursor-pointer min-h-[44px]">
                            <input
                              type="checkbox"
                              checked={!isMuted}
                              onChange={() => handleMutedTypeToggle(item.key as EnterpriseNotificationType)}
                              className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-violet-600 focus:ring-violet-500"
                            />
                            <span className="text-xs font-bold text-slate-200">{item.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Loading delivery preferences...</p>
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>

        {/* Admin/Merchant Broadcast Panel */}
        <AnimatePresence>
          {showBroadcast && isAdminOrMerchant && (
            <motion.section
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-slate-900/95 border border-amber-500/40 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5 overflow-hidden"
              id="broadcast-panel"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-amber-400" />
                  <h2 className="text-sm font-black text-white uppercase tracking-tight">Enterprise Broadcast &amp; Alert Dispatcher</h2>
                </div>
                <button 
                  onClick={() => setShowBroadcast(false)} 
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white cursor-pointer rounded-lg focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                  aria-label="Close broadcast console"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {dispatchResult && (
                <div className={`p-4 rounded-xl flex items-center gap-3 border ${
                  dispatchResult.success 
                    ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300' 
                    : 'bg-rose-950/40 border-rose-800/80 text-rose-300'
                }`}>
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <div className="text-xs">
                    {dispatchResult.success 
                      ? `Alert Dispatch Complete: Event broadcasted to ${dispatchResult.count} registered accounts.` 
                      : 'Alert Dispatch Failed: Permission error or network timeout.'}
                  </div>
                  <button onClick={() => setDispatchResult(null)} className="ml-auto text-slate-400 hover:text-white min-h-[44px] px-2">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <form onSubmit={handleBroadcastSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Target Audience</label>
                    <select
                      value={broadcastTargetRole}
                      onChange={(e) => setBroadcastTargetRole(e.target.value)}
                      className="w-full min-h-[44px] text-xs font-semibold bg-slate-950 border border-slate-800 rounded-xl px-3 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    >
                      <option value="All">All Registered Pioneers</option>
                      <option value="Buyer">Buyers Only</option>
                      <option value="Seller">Sellers Only</option>
                      <option value="Business Owner">Business Owners Only</option>
                      <option value="Admin">Platform Admins Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Incident Priority</label>
                    <select
                      value={broadcastPriority}
                      onChange={(e) => setBroadcastPriority(e.target.value as NotificationPriority)}
                      className="w-full min-h-[44px] text-xs font-semibold bg-slate-950 border border-slate-800 rounded-xl px-3 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    >
                      <option value="low">Low (Informational)</option>
                      <option value="medium">Medium (Standard)</option>
                      <option value="high">High (Action Required)</option>
                      <option value="urgent">Urgent (Emergency/Platform)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Event Category</label>
                    <select
                      value={broadcastType}
                      onChange={(e) => setBroadcastType(e.target.value as EnterpriseNotificationType)}
                      className="w-full min-h-[44px] text-xs font-semibold bg-slate-950 border border-slate-800 rounded-xl px-3 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    >
                      <option value="system_alert">System Alert</option>
                      <option value="business_announcement">Business Announcement</option>
                      <option value="admin_notice">Official Admin Notice</option>
                      <option value="security_alert">Security Alert</option>
                      <option value="marketplace_update">Marketplace Update</option>
                      <option value="loyalty_reward">BMP Reward Event</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Event Title</label>
                    <input
                      type="text"
                      required
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      placeholder="e.g. Scheduled Network Sync Maintenance"
                      className="w-full min-h-[44px] text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 text-white focus:ring-2 focus:ring-amber-500 placeholder-slate-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Destination Link (Optional)</label>
                    <input
                      type="text"
                      value={broadcastLink}
                      onChange={(e) => setBroadcastLink(e.target.value)}
                      placeholder="e.g. /dashboard or /wallet"
                      className="w-full min-h-[44px] text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 text-white focus:ring-2 focus:ring-amber-500 placeholder-slate-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Alert Description / Body</label>
                  <textarea
                    required
                    rows={3}
                    value={broadcastBody}
                    onChange={(e) => setBroadcastBody(e.target.value)}
                    placeholder="Provide complete description of the operational event or instructions for target accounts."
                    className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-amber-500 placeholder-slate-600 focus:outline-none resize-none"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={broadcastPinned}
                      onChange={(e) => setBroadcastPinned(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-xs text-slate-300 font-bold">Pin to top of target user feeds</span>
                  </label>

                  <button
                    type="submit"
                    disabled={dispatching}
                    className="min-h-[44px] px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                  >
                    {dispatching ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Dispatching...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Dispatch Broadcast Alert</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Main Content Layout: Filters + List */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Column */}
          <aside className="space-y-5">
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Filter className="w-4 h-4 text-violet-400" /> Filter Alerts
                </span>
                {(statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all' || searchQuery !== '') && (
                  <button
                    onClick={() => {
                      setStatusFilter('all');
                      setPriorityFilter('all');
                      setCategoryFilter('all');
                      setSearchQuery('');
                    }}
                    className="text-[11px] font-bold text-violet-400 hover:text-violet-300 min-h-[44px] flex items-center cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Search */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Search Text</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by keywords, ID..."
                    className="w-full min-h-[44px] text-xs border border-slate-800 rounded-xl pl-9 pr-8 py-2 bg-slate-950 text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-3 text-slate-500 hover:text-slate-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Status Tabs */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Display State</label>
                <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800/80">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'unread', label: 'Unread' },
                    { value: 'archived', label: 'Archived' }
                  ].map((tab) => (
                    <button
                      key={tab.value}
                      onClick={() => setStatusFilter(tab.value as any)}
                      className={`min-h-[44px] text-[11px] font-bold py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none ${
                        statusFilter === tab.value 
                          ? 'bg-violet-600 text-white shadow-md' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                      aria-pressed={statusFilter === tab.value}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Event Priority</label>
                <div className="space-y-1">
                  {[
                    { value: 'all', label: 'Any Priority' },
                    { value: 'urgent', label: '🔴 Urgent Platforms' },
                    { value: 'high', label: '🔶 High Action' },
                    { value: 'medium', label: '🔷 Medium Standard' },
                    { value: 'low', label: '🟢 Low Informational' }
                  ].map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setPriorityFilter(p.value as any)}
                      className={`w-full min-h-[44px] text-left text-xs px-3 py-2 rounded-xl transition-all flex items-center justify-between cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none ${
                        priorityFilter === p.value
                          ? 'bg-violet-600/20 text-violet-300 font-bold border border-violet-500/30'
                          : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                      }`}
                    >
                      <span>{p.label}</span>
                      {priorityFilter === p.value && <div className="h-1.5 w-1.5 rounded-full bg-violet-400" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Source Categories */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Category Source</label>
                <div className="space-y-1">
                  {categoryGroups.map((g) => {
                    const IconComp = g.icon;
                    return (
                      <button
                        key={g.value}
                        onClick={() => setCategoryFilter(g.value)}
                        className={`w-full min-h-[44px] text-left text-xs px-3 py-2 rounded-xl transition-all flex items-center justify-between cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none ${
                          categoryFilter === g.value
                            ? 'bg-violet-600/20 text-violet-300 font-bold border border-violet-500/30'
                            : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <IconComp className="w-3.5 h-3.5" />
                          <span>{g.label}</span>
                        </div>
                        {categoryFilter === g.value && <div className="h-1.5 w-1.5 rounded-full bg-violet-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          {/* List Section */}
          <section aria-label="Notification list" className="lg:col-span-3 space-y-4">
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/70 border border-slate-800/80 px-4 sm:px-5 py-3 rounded-2xl shadow-sm">
              <div className="text-xs font-bold text-slate-300">
                {loading ? (
                  <span className="flex items-center gap-2 text-violet-400">
                    <RotateCw className="w-3.5 h-3.5 animate-spin" /> Syncing events feed...
                  </span>
                ) : (
                  <span>Showing {filteredNotifications.length} alerts matching criteria</span>
                )}
              </div>

              {filteredNotifications.some(n => n.status === 'unread') && (
                <button
                  onClick={handleMarkAllRead}
                  className="min-h-[44px] px-3 flex items-center gap-1.5 text-xs font-bold text-violet-400 hover:text-violet-300 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none rounded-lg"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Mark all as read</span>
                </button>
              )}
            </div>

            {/* Notification Cards */}
            <div className="space-y-3" id="notification-cards-container">
              {loading ? (
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl py-16 text-center space-y-3">
                  <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Establishing live event stream...</p>
                </div>
              ) : filteredNotifications.length > 0 ? (
                <AnimatePresence initial={false}>
                  {filteredNotifications.map((notif) => {
                    const isUnread = notif.status === 'unread';
                    const isArchived = notif.status === 'archived';
                    const isPinned = notif.pinned;

                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        key={notif.notificationId}
                        className={`group relative bg-slate-900/60 border rounded-2xl p-4 sm:p-5 transition-all flex flex-col sm:flex-row items-start gap-4 ${
                          isUnread 
                            ? 'border-violet-500/40 bg-violet-950/10 shadow-md shadow-violet-950/30' 
                            : 'border-slate-800/80 hover:border-slate-700'
                        } ${isPinned ? 'border-amber-500/40 bg-amber-950/10' : ''}`}
                      >
                        {/* Icon Block */}
                        <div className="shrink-0 p-2.5 rounded-xl bg-slate-950 border border-slate-800 shadow-sm">
                          {getIcon(notif.type, notif.priority)}
                        </div>

                        {/* Text Content Block */}
                        <div className="flex-1 min-w-0 pr-0 sm:pr-24">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className={`text-sm font-bold truncate leading-snug ${
                              isUnread ? 'text-white' : 'text-slate-300'
                            }`}>
                              {notif.title}
                            </h3>
                            
                            {/* Badges */}
                            {isPinned && (
                              <span className="flex items-center gap-1 text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded uppercase">
                                <Pin className="w-2.5 h-2.5 fill-amber-300" /> Pinned
                              </span>
                            )}
                            {isUnread && (
                              <span className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
                            )}
                            {notif.priority === 'urgent' && (
                              <span className="text-[9px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.5 rounded uppercase">
                                Urgent
                              </span>
                            )}
                            {notif.priority === 'high' && (
                              <span className="text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded uppercase">
                                High Action
                              </span>
                            )}
                            {notif.priority === 'medium' && (
                              <span className="text-[9px] font-black bg-violet-500/20 text-violet-300 border border-violet-500/30 px-1.5 py-0.5 rounded uppercase">
                                Medium
                              </span>
                            )}
                            {notif.priority === 'low' && (
                              <span className="text-[9px] font-black bg-slate-500/20 text-slate-300 border border-slate-500/30 px-1.5 py-0.5 rounded uppercase">
                                Informational
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-400 leading-relaxed mb-3">
                            {notif.body}
                          </p>

                          <div className="flex flex-wrap items-center gap-4 text-[10px] font-semibold text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="capitalize">
                              Source: {notif.type.replace('_', ' ')}
                            </span>
                            {notif.linkTo && (
                              <button
                                onClick={() => navigate(notif.linkTo!)}
                                className="min-h-[44px] flex items-center gap-1 text-violet-400 hover:text-violet-300 font-bold transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none rounded-lg"
                              >
                                <span>View Details</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Interactive Toolbar Controls */}
                        <div className="flex items-center gap-1 self-end sm:self-start sm:absolute sm:right-4 sm:top-4">
                          {/* Pin Toggle */}
                          <button
                            onClick={() => handleTogglePin(notif.notificationId, !!isPinned)}
                            title={isPinned ? 'Unpin Alert' : 'Pin Alert'}
                            aria-label={isPinned ? 'Unpin Alert' : 'Pin Alert'}
                            className={`min-h-[44px] min-w-[44px] p-2 rounded-xl border border-slate-800 bg-slate-950/80 hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none ${
                              isPinned ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <Pin className="w-4 h-4" />
                          </button>

                          {/* Read Toggle */}
                          {isUnread && (
                            <button
                              onClick={() => handleMarkRead(notif.notificationId)}
                              title="Mark Read"
                              aria-label="Mark as Read"
                              className="min-h-[44px] min-w-[44px] p-2 rounded-xl border border-slate-800 bg-slate-950/80 hover:bg-slate-800 text-violet-400 flex items-center justify-center transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}

                          {/* Archive Toggle */}
                          {!isArchived && (
                            <button
                              onClick={() => handleArchive(notif.notificationId)}
                              title="Archive Alert"
                              aria-label="Archive Alert"
                              className="min-h-[44px] min-w-[44px] p-2 rounded-xl border border-slate-800 bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          )}

                          {/* Clear from View */}
                          <button
                            onClick={() => handleDismiss(notif.notificationId)}
                            title="Dismiss Alert"
                            aria-label="Dismiss Alert"
                            className="min-h-[44px] min-w-[44px] p-2 rounded-xl border border-slate-800 bg-slate-950/80 hover:bg-slate-800 text-rose-400 hover:text-rose-300 flex items-center justify-center transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              ) : (
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl py-16 text-center shadow-sm space-y-3">
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl inline-block">
                    <Bell className="w-8 h-8 text-slate-600" />
                  </div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">No matching alerts</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    There are no notifications matching your current filter selections.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};
