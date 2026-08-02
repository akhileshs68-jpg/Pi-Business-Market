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
  VolumeX, 
  Volume2, 
  Sliders, 
  CheckCircle2, 
  AlertOctagon, 
  HelpCircle, 
  Layers, 
  Sparkles,
  Info,
  Clock,
  Briefcase,
  Store,
  DollarSign,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { notificationService } from '../services/notificationService';
import { Notification, EnterpriseNotificationType, NotificationPriority, NotificationPreference, UserRole } from '../types';
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
      setNotifications(data);
      setLoading(false);
    });
    
    // Load preferences
    notificationService.getPreferences(user.uid).then(setPreferences);
    
    return () => unsubscribe();
  }, [user]);

  const roleResolver = new RoleResolver(user);
  const isAdminOrMerchant = roleResolver.isSuperAdmin() || roleResolver.isPlatformAdmin() || roleResolver.isBusinessOwner() || roleResolver.isSeller();

  // Actions
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
    let updatedMuted = [...preferences.mutedTypes];
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
      // Reset form
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
  const getIcon = (type: EnterpriseNotificationType, priority: NotificationPriority) => {
    let colorClass = 'text-slate-500 bg-slate-100';
    if (priority === 'urgent') colorClass = 'text-rose-600 bg-rose-50 border border-rose-200 animate-pulse';
    else if (priority === 'high') colorClass = 'text-amber-600 bg-amber-50 border border-amber-100';

    switch (type) {
      case 'order_update':
        return <CheckCircle2 className={`w-5 h-5 ${colorClass}`} />;
      case 'payment_update':
        return <DollarSign className={`w-5 h-5 text-emerald-600 bg-emerald-50`} />;
      case 'wallet_alert':
        return <DollarSign className={`w-5 h-5 text-cyan-600 bg-cyan-50`} />;
      case 'loyalty_reward':
        return <Sparkles className={`w-5 h-5 text-indigo-600 bg-indigo-50`} />;
      case 'message_new':
        return <Bell className={`w-5 h-5 text-violet-600 bg-violet-50`} />;
      case 'system_alert':
        return <AlertOctagon className={`w-5 h-5 ${colorClass}`} />;
      case 'security_alert':
        return <ShieldAlert className={`w-5 h-5 text-rose-600 bg-rose-50`} />;
      case 'business_announcement':
        return <Megaphone className={`w-5 h-5 text-blue-600 bg-blue-50`} />;
      case 'marketplace_update':
        return <Store className={`w-5 h-5 text-indigo-600 bg-indigo-50`} />;
      default:
        return <Info className={`w-5 h-5 text-slate-500 bg-slate-100`} />;
    }
  };

  // Mapping types to UI categories
  const categoryGroups = [
    { value: 'all', label: 'All Categories' },
    { value: 'orders_payments', label: 'Orders & Payments' },
    { value: 'wallet_rewards', label: 'Wallet & Rewards' },
    { value: 'messaging', label: 'Conversations' },
    { value: 'business', label: 'Business Hub' },
    { value: 'system_security', label: 'System & Security' }
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
    // 1. Search Query
    const matchesSearch = 
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      n.body.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 2. Status Filter
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'unread' && n.status === 'unread') || 
      (statusFilter === 'archived' && n.status === 'archived');
    
    // 3. Priority Filter
    const matchesPriority = priorityFilter === 'all' || n.priority === priorityFilter;

    // 4. Category Group Filter
    const matchesCategory = typeBelongsToGroup(n.type, categoryFilter);

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans" id="notifications-platform">
      {/* Upper Navigation Back-Bar */}
      <div className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Enterprise Notification Platform</h1>
              <p className="text-xs font-medium text-slate-500">Unified Intelligent Event &amp; Communication Center</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-600 transition-all cursor-pointer"
            >
              Back to Workspace
            </button>
            <button
              onClick={() => setShowPreferences(!showPreferences)}
              className={`px-4 py-2 flex items-center gap-2 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                showPreferences 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Settings className="w-4 h-4" /> Preference Center
            </button>
            {isAdminOrMerchant && (
              <button
                onClick={() => setShowBroadcast(!showBroadcast)}
                className={`px-4 py-2 flex items-center gap-2 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                  showBroadcast 
                    ? 'bg-amber-50 border-amber-200 text-amber-700' 
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Megaphone className="w-4 h-4" /> Broadcast Console
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Preference Center Panel */}
        <AnimatePresence>
          {showPreferences && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 bg-white border border-slate-200 rounded-xl p-6 shadow-sm overflow-hidden"
              id="preferences-panel"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-sm font-bold text-slate-900">Personal Delivery Settings</h2>
                </div>
                <button onClick={() => setShowPreferences(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {preferences ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Delivery Channels */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Active &amp; Ready Channels</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50">
                        <div>
                          <p className="text-xs font-bold text-slate-800">In-App Alerts (Direct Delivery)</p>
                          <p className="text-[11px] text-slate-400">Receive immediate notifications in system navigation bar</p>
                        </div>
                        <button
                          onClick={() => handlePreferenceToggle('inApp')}
                          className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            preferences.channels.inApp ? 'bg-indigo-600' : 'bg-slate-200'
                          }`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            preferences.channels.inApp ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50">
                        <div>
                          <p className="text-xs font-bold text-slate-800">Email Gateway Integration</p>
                          <p className="text-[11px] text-slate-400">Sends critical summaries to user profile email address</p>
                        </div>
                        <button
                          onClick={() => handlePreferenceToggle('email')}
                          className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            preferences.channels.email ? 'bg-indigo-600' : 'bg-slate-200'
                          }`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            preferences.channels.email ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50">
                        <div>
                          <p className="text-xs font-bold text-slate-800">Browser Push Notifications</p>
                          <p className="text-[11px] text-slate-400">Deliver notifications instantly even when app is backgrounded</p>
                        </div>
                        <button
                          onClick={() => handlePreferenceToggle('push')}
                          className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            preferences.channels.push ? 'bg-indigo-600' : 'bg-slate-200'
                          }`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            preferences.channels.push ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>

                      {/* Disabled future channels as requested */}
                      <div className="border border-slate-100 rounded-lg p-3 bg-slate-50/50 opacity-60">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-bold text-slate-600">SMS, WhatsApp &amp; Telegram Gateways</p>
                          <span className="text-[9px] font-bold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded uppercase">Future Ready</span>
                        </div>
                        <p className="text-[11px] text-slate-400">Enterprise SMS / Chatbot integration is prepared and waiting deployment.</p>
                      </div>
                    </div>
                  </div>

                  {/* Muted Categories */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Muted Notification Categories</h3>
                    <p className="text-xs text-slate-500 mb-4">Choose which modules are allowed to dispatch events directly to your in-app center.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { key: 'order_update', label: 'Order Dispatches' },
                        { key: 'payment_update', label: 'Payment Clearances' },
                        { key: 'wallet_alert', label: 'Wallet Activities' },
                        { key: 'loyalty_reward', label: 'BMP Incentives' },
                        { key: 'message_new', label: 'New Direct Messages' },
                        { key: 'business_announcement', label: 'Business Updates' },
                        { key: 'system_alert', label: 'System Alerts' },
                        { key: 'security_alert', label: 'Security & Kyc' }
                      ].map((item) => {
                        const isMuted = preferences.mutedTypes?.includes(item.key as EnterpriseNotificationType);
                        return (
                          <label key={item.key} className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!isMuted}
                              onChange={() => handleMutedTypeToggle(item.key as EnterpriseNotificationType)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-xs font-medium text-slate-700">{item.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs text-slate-400 animate-pulse">Retrieving delivery metrics &amp; profiles...</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Admin Broadcast Panel */}
        <AnimatePresence>
          {showBroadcast && isAdminOrMerchant && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 bg-slate-900 text-white rounded-xl p-6 shadow-xl overflow-hidden border border-slate-800"
              id="broadcast-panel"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-amber-500 animate-bounce" />
                  <h2 className="text-sm font-bold tracking-wide">Enterprise Broadcast &amp; Alert Dispatcher</h2>
                </div>
                <button onClick={() => setShowBroadcast(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {dispatchResult && (
                <div className={`p-4 rounded-lg mb-6 flex items-center gap-3 border ${
                  dispatchResult.success 
                    ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300' 
                    : 'bg-rose-950/40 border-rose-800/80 text-rose-300'
                }`}>
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <div className="text-xs">
                    {dispatchResult.success 
                      ? `Alert Dispatch Complete: Dispatched event to ${dispatchResult.count} registered RPC clients successfully.` 
                      : 'Alert Dispatch Failed: Database cluster error or missing authorization. Audit logged.'}
                  </div>
                  <button onClick={() => setDispatchResult(null)} className="ml-auto text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <form onSubmit={handleBroadcastSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Audience (Role Validation)</label>
                    <select
                      value={broadcastTargetRole}
                      onChange={(e) => setBroadcastTargetRole(e.target.value)}
                      className="w-full text-xs font-semibold bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="All">All Registered Pioneer Accounts</option>
                      <option value="Buyer">Buyers Only</option>
                      <option value="Seller">Sellers Only</option>
                      <option value="Business Owner">Business Owners Only</option>
                      <option value="Admin">System Admins Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Incident Priority</label>
                    <select
                      value={broadcastPriority}
                      onChange={(e) => setBroadcastPriority(e.target.value as NotificationPriority)}
                      className="w-full text-xs font-semibold bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="low">Low (Standard Events)</option>
                      <option value="medium">Medium (Account/Wallet Info)</option>
                      <option value="high">High (Clearing/Merchant actions)</option>
                      <option value="urgent">Urgent (Platform emergency alerts)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Event Category</label>
                    <select
                      value={broadcastType}
                      onChange={(e) => setBroadcastType(e.target.value as EnterpriseNotificationType)}
                      className="w-full text-xs font-semibold bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-amber-500"
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
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Event Title</label>
                    <input
                      type="text"
                      required
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      placeholder="e.g., Scheduled RPC Node Maintenance"
                      className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-amber-500 placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Destination Route Link (Optional)</label>
                    <input
                      type="text"
                      value={broadcastLink}
                      onChange={(e) => setBroadcastLink(e.target.value)}
                      placeholder="e.g., /wallet or /bookings"
                      className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-amber-500 placeholder-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Incident details / Alert body</label>
                  <textarea
                    required
                    rows={3}
                    value={broadcastBody}
                    onChange={(e) => setBroadcastBody(e.target.value)}
                    placeholder="Provide full description of the notification. Will route dynamically to active sockets."
                    className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-amber-500 placeholder-slate-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={broadcastPinned}
                      onChange={(e) => setBroadcastPinned(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-xs text-slate-300">Pin to top of target user feeds by default</span>
                  </label>

                  <button
                    type="submit"
                    disabled={dispatching}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-700 rounded-lg text-xs font-bold text-slate-950 flex items-center gap-2 cursor-pointer transition-all"
                  >
                    {dispatching ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        Dispatching...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" /> Dispatch System Alert
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Split: Filters + List */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-indigo-600" /> Filters
                </span>
                {(statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all' || searchQuery !== '') && (
                  <button
                    onClick={() => {
                      setStatusFilter('all');
                      setPriorityFilter('all');
                      setCategoryFilter('all');
                      setSearchQuery('');
                    }}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Search */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Search Alerts</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search titles, orders, tokens..."
                    className="w-full text-xs border border-slate-200 rounded-lg pl-9 pr-4 py-2 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Display State</label>
                <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'unread', label: 'Unread' },
                    { value: 'archived', label: 'Archived' }
                  ].map((tab) => (
                    <button
                      key={tab.value}
                      onClick={() => setStatusFilter(tab.value as any)}
                      className={`text-[11px] font-bold py-1.5 rounded-md transition-all cursor-pointer ${
                        statusFilter === tab.value 
                          ? 'bg-white text-slate-900 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Event Priority</label>
                <div className="space-y-1">
                  {[
                    { value: 'all', label: 'Any Priority' },
                    { value: 'urgent', label: '🔴 Urgent Platforms' },
                    { value: 'high', label: '🔶 High Action' },
                    { value: 'medium', label: '🔷 Medium Standard' },
                    { value: 'low', label: '🟢 Low Info' }
                  ].map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setPriorityFilter(p.value as any)}
                      className={`w-full text-left text-xs px-3 py-2 rounded-lg transition-all flex items-center justify-between cursor-pointer ${
                        priorityFilter === p.value
                          ? 'bg-indigo-50 text-indigo-700 font-bold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{p.label}</span>
                      {priorityFilter === p.value && <div className="h-1.5 w-1.5 rounded-full bg-indigo-600" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Modules / Source</label>
                <div className="space-y-1">
                  {categoryGroups.map((g) => (
                    <button
                      key={g.value}
                      onClick={() => setCategoryFilter(g.value)}
                      className={`w-full text-left text-xs px-3 py-2 rounded-lg transition-all flex items-center justify-between cursor-pointer ${
                        categoryFilter === g.value
                          ? 'bg-indigo-50 text-indigo-700 font-bold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{g.label}</span>
                      {categoryFilter === g.value && <div className="h-1.5 w-1.5 rounded-full bg-indigo-600" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Performance Node Stats */}
            <div className="bg-slate-900 text-slate-400 border border-slate-800 rounded-xl p-4 text-[10px] space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                <span className="font-bold text-slate-200">System Gateway</span>
                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping" />
              </div>
              <div className="flex justify-between">
                <span>Active Channels</span>
                <span className="text-slate-200">In-App, WebSocket, Email Gateway</span>
              </div>
              <div className="flex justify-between">
                <span>Latency</span>
                <span className="text-slate-200">&lt;14ms (RPC Server synced)</span>
              </div>
              <div className="flex justify-between">
                <span>Total Active Sockets</span>
                <span className="text-slate-200">1 Online client session</span>
              </div>
            </div>
          </div>

          {/* List Section */}
          <div className="lg:col-span-3 space-y-4">
            {/* Header controls */}
            <div className="flex items-center justify-between bg-white border border-slate-200 px-5 py-3 rounded-xl shadow-sm">
              <div className="text-xs font-bold text-slate-600">
                {loading ? 'Subscribing to feed...' : `${filteredNotifications.length} Events matched filter criteria`}
              </div>
              {filteredNotifications.some(n => n.status === 'unread') && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Mark all read
                </button>
              )}
            </div>

            {/* Notification Cards */}
            <div className="space-y-3" id="notification-cards-container">
              {loading ? (
                <div className="bg-white border border-slate-200 rounded-xl py-12 text-center shadow-sm">
                  <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider animate-pulse">Establishing secure event stream...</p>
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
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        key={notif.notificationId}
                        className={`group relative bg-white border rounded-xl shadow-sm p-4 sm:p-5 transition-all flex items-start gap-4 hover:border-slate-300 ${
                          isUnread ? 'ring-1 ring-indigo-600/15 border-indigo-200' : 'border-slate-200'
                        } ${isPinned ? 'bg-amber-50/10' : ''}`}
                      >
                        {/* Icon Block */}
                        <div className="shrink-0">
                          {getIcon(notif.type, notif.priority)}
                        </div>

                        {/* Text Block */}
                        <div className="flex-1 min-w-0 pr-12">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className={`text-sm font-bold truncate leading-snug ${
                              isUnread ? 'text-slate-900' : 'text-slate-600'
                            }`}>
                              {notif.title}
                            </h3>
                            
                            {/* Badges */}
                            {isPinned && (
                              <span className="flex items-center gap-0.5 text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded uppercase">
                                <Pin className="w-2.5 h-2.5 fill-amber-800" /> Pinned
                              </span>
                            )}
                            {isUnread && (
                              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-ping" />
                            )}
                            {notif.priority === 'urgent' && (
                              <span className="text-[9px] font-bold bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded uppercase">Urgent</span>
                            )}
                            {notif.priority === 'high' && (
                              <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded uppercase">High</span>
                            )}
                          </div>

                          <p className="text-xs text-slate-500 leading-relaxed mb-3">
                            {notif.body}
                          </p>

                          <div className="flex items-center gap-4 text-[10px] font-semibold text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="capitalize">
                              Source: {notif.type.replace('_', ' ')}
                            </span>
                            {notif.linkTo && (
                              <button
                                onClick={() => navigate(notif.linkTo!)}
                                className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 cursor-pointer"
                              >
                                View Details <ExternalLink className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Interactive Toolbar Controls */}
                        <div className="absolute right-3 top-3 sm:right-4 sm:top-4 flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                          {/* Pin Toggle */}
                          <button
                            onClick={() => handleTogglePin(notif.notificationId, !!isPinned)}
                            title={isPinned ? 'Unpin Alert' : 'Pin Alert'}
                            className={`p-1.5 rounded-md border border-slate-100 hover:bg-slate-50 cursor-pointer ${
                              isPinned ? 'text-amber-500' : 'text-slate-400'
                            }`}
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>

                          {/* Read Toggle */}
                          {isUnread && (
                            <button
                              onClick={() => handleMarkRead(notif.notificationId)}
                              title="Mark Read"
                              className="p-1.5 rounded-md border border-slate-100 hover:bg-slate-50 text-indigo-600 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Archive Toggle */}
                          {!isArchived && (
                            <button
                              onClick={() => handleArchive(notif.notificationId)}
                              title="Archive Alert"
                              className="p-1.5 rounded-md border border-slate-100 hover:bg-slate-50 text-slate-500 cursor-pointer"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Clear from View */}
                          <button
                            onClick={() => handleDismiss(notif.notificationId)}
                            title="Delete Personal View"
                            className="p-1.5 rounded-md border border-slate-100 hover:bg-slate-50 text-rose-500 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl py-16 text-center shadow-sm">
                  <div className="p-4 bg-slate-50 rounded-full inline-block mb-3">
                    <Bell className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">No matching events</h3>
                  <p className="text-xs text-slate-400 mt-1">There are no notifications matching your current filter selections.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
