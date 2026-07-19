/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  User,
  Shield,
  FileText,
  Bell,
  Search,
  CheckCheck,
  Paperclip,
  Activity,
  Heart,
  Smile,
  Pin,
  Trash2,
  Edit2,
  Forward,
  CornerUpLeft,
  X,
  Plus,
  ArrowRight,
  Sparkles,
  HelpCircle,
  AlertTriangle,
  Lock,
  UserMinus,
  VolumeX,
  Archive,
  Flag,
  Share2,
  Star,
  RefreshCw,
  Mail,
  Phone,
  MessageCircle,
  Clock,
  Briefcase,
  ShoppingBag,
  Ticket
} from 'lucide-react';
import { User as UserType } from '../types';

interface EngagementPlatformProps {
  currentUser: UserType;
  onNavigate: (view: string, params?: any) => void;
}

// Conversation structure
interface Conversation {
  id: string;
  type: 'buyer_seller' | 'employer_candidate' | 'business_customer' | 'admin_user';
  participantName: string;
  participantRole: string;
  participantAvatar: string;
  online: boolean;
  typing?: boolean;
  unreadCount: number;
  lastMessageText: string;
  lastMessageTime: string;
  isPinned?: boolean;
  isMuted?: boolean;
  isArchived?: boolean;
}

// Message structure
interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'seen';
  reactions?: string[];
  isPinned?: boolean;
  edited?: boolean;
  quotedMessageId?: string;
  quotedMessageText?: string;
  filePath?: string;
  fileName?: string;
  fileType?: 'image' | 'pdf' | 'document';
}

// Document / File upload entry
interface SharedFile {
  id: string;
  name: string;
  size: string;
  type: 'image' | 'pdf' | 'document';
  uploadedAt: string;
  senderName: string;
  scanStatus: 'scanned_clean' | 'scanning' | 'unverified';
  sizeBytes: number;
}

// Support ticket entry
interface SupportTicket {
  id: string;
  category: 'payment' | 'escrow' | 'account_verification' | 'job_dispute' | 'listing_issue';
  subject: string;
  priority: 'low' | 'medium' | 'high' | 'sla_critical';
  status: 'open' | 'assigned' | 'resolved';
  slaHoursLeft: number;
  createdAt: string;
  description: string;
  internalNotes?: string;
}

// Search entity result
interface SearchResult {
  id: string;
  type: 'Message' | 'File' | 'Business' | 'Order' | 'Booking' | 'Support Ticket';
  title: string;
  subtitle: string;
  badge?: string;
  referenceId: string;
}

export default function EngagementPlatform({ currentUser, onNavigate }: EngagementPlatformProps) {
  // Navigation active tab
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'notifications' | 'helpdesk' | 'engagement_privacy' | 'ai_config'>('chat');

  // Chats local store
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: 'conv_1',
      type: 'buyer_seller',
      participantName: 'Satoshi Gadgets (Merchant)',
      participantRole: 'Electronics Store Owner',
      participantAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      online: true,
      typing: false,
      unreadCount: 2,
      lastMessageText: 'Hello! I am confirming we have the PiNode hardware in stock and ready to ship.',
      lastMessageTime: '10:42 AM',
      isPinned: true
    },
    {
      id: 'conv_2',
      type: 'employer_candidate',
      participantName: 'Alex Rivera (Provider)',
      participantRole: 'Senior Smart Contract Auditor',
      participantAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      online: true,
      typing: true,
      unreadCount: 0,
      lastMessageText: 'Writing custom tests...',
      lastMessageTime: '09:15 AM'
    },
    {
      id: 'conv_3',
      type: 'admin_user',
      participantName: 'Pi Core Network Support',
      participantRole: 'Official System Administrator',
      participantAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
      online: false,
      unreadCount: 0,
      lastMessageText: 'Your Pioneer profile identity is fully verified on the ledger tier.',
      lastMessageTime: 'Yesterday'
    }
  ]);

  const [activeConvId, setActiveConvId] = useState<string>('conv_1');
  const [messages, setMessages] = useState<Record<string, Message[]>>({
    conv_1: [
      {
        id: 'msg_101',
        senderId: 'merchant_tech_owner',
        senderName: 'Satoshi Gadgets',
        text: 'Welcome to Satoshi Gadgets! Let us know if you need customized components.',
        timestamp: '10:30 AM',
        status: 'seen'
      },
      {
        id: 'msg_102',
        senderId: currentUser.uid,
        senderName: currentUser.displayName,
        text: 'Do you provide on-site configuration guides for the Validator package?',
        timestamp: '10:35 AM',
        status: 'seen'
      },
      {
        id: 'msg_103',
        senderId: 'merchant_tech_owner',
        senderName: 'Satoshi Gadgets',
        text: 'Hello! I am confirming we have the PiNode hardware in stock and ready to ship.',
        timestamp: '10:42 AM',
        status: 'delivered'
      }
    ],
    conv_2: [
      {
        id: 'msg_201',
        senderId: 'pioneer_freelancer',
        senderName: 'Alex Rivera',
        text: 'I started auditing the liquidity locking functions you requested.',
        timestamp: '09:00 AM',
        status: 'seen'
      }
    ],
    conv_3: [
      {
        id: 'msg_301',
        senderId: 'pi_admin_001',
        senderName: 'Pi Support',
        text: 'Your Pioneer profile identity is fully verified on the ledger tier.',
        timestamp: 'Yesterday',
        status: 'seen'
      }
    ]
  });

  // New message input & draft replies
  const [newMessageText, setNewMessageText] = useState<string>('');
  const [quotedMessage, setQuotedMessage] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);

  // File Upload state
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([
    {
      id: 'file_f101',
      name: 'pi_node_firmware_v1.pdf',
      size: '2.4 MB',
      type: 'pdf',
      uploadedAt: '2026-07-17 15:30',
      senderName: 'Satoshi Gadgets',
      scanStatus: 'scanned_clean',
      sizeBytes: 2516582
    },
    {
      id: 'file_f102',
      name: 'solidity_audit_certificate.png',
      size: '1.1 MB',
      type: 'image',
      uploadedAt: '2026-07-18 09:12',
      senderName: 'Alex Rivera',
      scanStatus: 'scanned_clean',
      sizeBytes: 1153433
    }
  ]);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadFileName, setUploadFileName] = useState<string>('');

  // Support Tickets state
  const [tickets, setTickets] = useState<SupportTicket[]>([
    {
      id: 'tkt_8401',
      category: 'escrow',
      subject: 'Delay in order verification release timer',
      priority: 'sla_critical',
      status: 'assigned',
      slaHoursLeft: 4,
      createdAt: '2026-07-18 02:00',
      description: 'The physical shipment was delivered, but the escrow release timer has not processed yet.',
      internalNotes: 'Admin assigned to tier-2 network escrow handler. Verifying delivery tracking.'
    },
    {
      id: 'tkt_8402',
      category: 'listing_issue',
      subject: 'Cannot update store banner artwork',
      priority: 'medium',
      status: 'open',
      slaHoursLeft: 20,
      createdAt: '2026-07-17 18:30',
      description: 'Receiving resolution mismatch error on 1200x400 image.'
    }
  ]);

  // Support input form state
  const [newTicketSubject, setNewTicketSubject] = useState<string>('');
  const [newTicketCategory, setNewTicketCategory] = useState<'payment' | 'escrow' | 'account_verification' | 'job_dispute' | 'listing_issue'>('payment');
  const [newTicketPriority, setNewTicketPriority] = useState<'low' | 'medium' | 'high' | 'sla_critical'>('medium');
  const [newTicketDesc, setNewTicketDesc] = useState<string>('');

  // Moderation & Privacy
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [reportedUsers, setReportedUsers] = useState<Array<{ username: string; reason: string; timestamp: string }>>([]);
  const [rateLimitInfo, setRateLimitInfo] = useState({ currentMsgs: 12, maxAllowed: 60, resetsInSeconds: 42 });

  // Notifications Store
  const [notificationLogs, setNotificationLogs] = useState<Array<{ id: string, title: string, body: string, time: string, type: string, read: boolean }>>([
    { id: 'not_m1', title: 'New Message from Alex Rivera 💬', body: '"I have completed milestone 1 checks. Please verify and release."', time: 'Just now', type: 'message', read: false },
    { id: 'not_m2', title: 'System Security Alert 🔐', body: 'New session authenticated from IP address: 198.162.2.14.', time: '10 mins ago', type: 'security', read: false },
    { id: 'not_m3', title: 'Follower Milestone 🔔', body: 'Enterprise Pioneers added you to their verified watch list.', time: '2 hours ago', type: 'follower', read: true }
  ]);

  // Settings Channel Toggles
  const [notifyChannels, setNotifyChannels] = useState({
    inApp: true,
    push: true,
    email: false,
    whatsapp: false
  });

  // Unified Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  // AI extension setup panel
  const [aiAutoReply, setAiAutoReply] = useState<boolean>(true);
  const [aiSuggestions, setAiSuggestions] = useState<boolean>(true);
  const [aiTranslation, setAiTranslation] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('Spanish');
  const [aiSentimentOutput, setAiSentimentOutput] = useState<{ sentiment: string; summary: string; score: number }>({
    sentiment: 'Positive & Direct',
    summary: 'The buyer is highly interested in product availability and wants to coordinate logistics.',
    score: 88
  });

  // Smart suggestions mock data for current active chat
  const [smartSuggestions, setSmartSuggestions] = useState<string[]>([
    'Yes, we can arrange safe shipping.',
    'I would love to read the configuration manual.',
    'Could you provide the tracking invoice?'
  ]);

  // SLA Countdowns Simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setTickets(prev => prev.map(t => {
        if (t.status !== 'resolved' && t.slaHoursLeft > 0) {
          return { ...t, slaHoursLeft: Math.max(0, parseFloat((t.slaHoursLeft - 0.05).toFixed(2))) };
        }
        return t;
      }));
    }, 12000);
    return () => clearInterval(timer);
  }, []);

  // Filter typing indicator simulation
  useEffect(() => {
    const typingTimer = setTimeout(() => {
      setConversations(prev => prev.map(c => {
        if (c.id === 'conv_2') {
          return { ...c, typing: false, lastMessageText: 'Writing custom tests completed!' };
        }
        return c;
      }));
    }, 8000);
    return () => clearTimeout(typingTimer);
  }, []);

  // Global Multi-Entity Unified Search Implementation
  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }

    const query = q.toLowerCase();
    const results: SearchResult[] = [];

    // 1. Search Messages
    Object.keys(messages).forEach(key => {
      messages[key].forEach(m => {
        if (m.text.toLowerCase().includes(query)) {
          results.push({
            id: m.id,
            type: 'Message',
            title: `Chat with ${m.senderName}`,
            subtitle: m.text,
            badge: m.timestamp,
            referenceId: key
          });
        }
      });
    });

    // 2. Search Files
    sharedFiles.forEach(f => {
      if (f.name.toLowerCase().includes(query)) {
        results.push({
          id: f.id,
          type: 'File',
          title: f.name,
          subtitle: `Uploaded by ${f.senderName} (${f.size})`,
          badge: 'Verified File',
          referenceId: f.id
        });
      }
    });

    // 3. Search Support Tickets
    tickets.forEach(t => {
      if (t.subject.toLowerCase().includes(query) || t.description.toLowerCase().includes(query)) {
        results.push({
          id: t.id,
          type: 'Support Ticket',
          title: `[${t.category.toUpperCase()}] ${t.subject}`,
          subtitle: t.description,
          badge: t.priority.replace('_', ' ').toUpperCase(),
          referenceId: t.id
        });
      }
    });

    // 4. Mock Search Businesses/Orders
    const mockBusinesses = [
      { id: 'biz_1', title: 'Satoshi Gadgets', desc: 'Hardware Nodes and Validator solutions' },
      { id: 'biz_2', title: 'Alex Rivera Auditing', desc: 'Gas optimization and safety checks' }
    ];
    mockBusinesses.forEach(b => {
      if (b.title.toLowerCase().includes(query) || b.desc.toLowerCase().includes(query)) {
        results.push({
          id: b.id,
          type: 'Business',
          title: b.title,
          subtitle: b.desc,
          badge: 'Business Profile',
          referenceId: b.id
        });
      }
    });

    setSearchResults(results);
  };

  // Send message
  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || newMessageText;
    if (!text.trim()) return;

    // Rate Limit Security check
    if (rateLimitInfo.currentMsgs >= rateLimitInfo.maxAllowed) {
      alert('Security Rate Limit Hit: Too many messages sent within limit frame. Resets shortly.');
      return;
    }

    const msgId = `msg_${Date.now()}`;
    const newMsg: Message = {
      id: msgId,
      senderId: currentUser.uid,
      senderName: currentUser.displayName,
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      quotedMessageId: quotedMessage?.id,
      quotedMessageText: quotedMessage?.text
    };

    // Update active conversations text
    setConversations(prev => prev.map(c => {
      if (c.id === activeConvId) {
        return {
          ...c,
          lastMessageText: text,
          lastMessageTime: 'Just now',
          unreadCount: 0
        };
      }
      return c;
    }));

    // Append to message dictionary
    setMessages(prev => ({
      ...prev,
      [activeConvId]: [...(prev[activeConvId] || []), newMsg]
    }));

    // Track rate limiter
    setRateLimitInfo(prev => ({ ...prev, currentMsgs: prev.currentMsgs + 1 }));

    // Auto-scenarios for interactive mockup feeling
    if (activeConvId === 'conv_1') {
      setTimeout(() => {
        setMessages(prev => {
          const updated = { ...prev };
          updated[activeConvId] = updated[activeConvId].map(m => m.id === msgId ? { ...m, status: 'seen' } : m);
          return updated;
        });
      }, 1500);

      // Simulated automated intelligent trigger reply based on intent detection
      if (text.toLowerCase().includes('ship') || text.toLowerCase().includes('delivery') || text.toLowerCase().includes('stock')) {
        setTimeout(() => {
          setConversations(prev => prev.map(c => c.id === 'conv_1' ? { ...c, typing: true } : c));
        }, 2200);

        setTimeout(() => {
          const autoMsgId = `msg_auto_${Date.now()}`;
          const autoMsg: Message = {
            id: autoMsgId,
            senderId: 'merchant_tech_owner',
            senderName: 'Satoshi Gadgets',
            text: 'We ship on-ledger registered parcels daily. Our typical transit timeline is 48-72 hours globally.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'delivered'
          };
          setConversations(prev => prev.map(c => c.id === 'conv_1' ? { ...c, typing: false, lastMessageText: autoMsg.text, lastMessageTime: 'Just now' } : c));
          setMessages(prev => ({ ...prev, conv_1: [...(prev.conv_1 || []), autoMsg] }));
        }, 4500);
      }
    }

    setNewMessageText('');
    setQuotedMessage(null);
  };

  // Quoted reply initializer
  const handleQuoteMessage = (msg: Message) => {
    setQuotedMessage(msg);
    setEditingMessage(null);
  };

  // Message Reactions
  const handleReactToMessage = (msgId: string, emoji: string) => {
    setMessages(prev => {
      const currentList = prev[activeConvId] || [];
      const updatedList = currentList.map(m => {
        if (m.id === msgId) {
          const reactions = m.reactions ? [...m.reactions] : [];
          if (reactions.includes(emoji)) {
            return { ...m, reactions: reactions.filter(r => r !== emoji) };
          } else {
            return { ...m, reactions: [...reactions, emoji] };
          }
        }
        return m;
      });
      return { ...prev, [activeConvId]: updatedList };
    });
  };

  // Message Pin Toggle
  const handlePinMessage = (msgId: string) => {
    setMessages(prev => {
      const currentList = prev[activeConvId] || [];
      const updatedList = currentList.map(m => {
        if (m.id === msgId) {
          return { ...m, isPinned: !m.isPinned };
        }
        return m;
      });
      return { ...prev, [activeConvId]: updatedList };
    });
  };

  // Message Deletion
  const handleDeleteMessage = (msgId: string) => {
    setMessages(prev => {
      const currentList = prev[activeConvId] || [];
      return { ...prev, [activeConvId]: currentList.filter(m => m.id !== msgId) };
    });
  };

  // Drag & drop mock upload pipeline
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processMockUpload(e.dataTransfer.files[0].name, e.dataTransfer.files[0].size);
    }
  };

  const handleManualUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processMockUpload(e.target.files[0].name, e.target.files[0].size);
    }
  };

  const processMockUpload = (fileName: string, bytes: number) => {
    setUploadFileName(fileName);
    setUploadProgress(10);
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            const ext = fileName.split('.').pop()?.toLowerCase();
            const fType: 'pdf' | 'image' | 'document' = (ext === 'pdf') ? 'pdf' : (ext === 'png' || ext === 'jpg' || ext === 'jpeg') ? 'image' : 'document';
            const sizeStr = bytes > 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
            
            const newFile: SharedFile = {
              id: `file_${Date.now()}`,
              name: fileName,
              size: sizeStr,
              type: fType,
              uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
              senderName: currentUser.displayName,
              scanStatus: 'scanned_clean',
              sizeBytes: bytes
            };

            setSharedFiles(f => [...f, newFile]);

            // Also attach file into active chat as message
            const fileMsg: Message = {
              id: `msg_file_${Date.now()}`,
              senderId: currentUser.uid,
              senderName: currentUser.displayName,
              text: `Shared document: ${fileName}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: 'sent',
              filePath: '#preview',
              fileName: fileName,
              fileType: fType
            };
            setMessages(prev => ({
              ...prev,
              [activeConvId]: [...(prev[activeConvId] || []), fileMsg]
            }));

            setUploadFileName('');
            setUploadProgress(0);
          }, 600);
          return 100;
        }
        return prev + 25;
      });
    }, 250);
  };

  // Support Ticket submission
  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject.trim() || !newTicketDesc.trim()) return;

    const tktId = `tkt_${Math.floor(8000 + Math.random() * 1999)}`;
    const newTkt: SupportTicket = {
      id: tktId,
      category: newTicketCategory,
      subject: newTicketSubject,
      priority: newTicketPriority,
      status: 'open',
      slaHoursLeft: newTicketPriority === 'sla_critical' ? 4.00 : newTicketPriority === 'high' ? 12.00 : newTicketPriority === 'medium' ? 24.00 : 48.00,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      description: newTicketDesc
    };

    setTickets(prev => [newTkt, ...prev]);

    // Push notification alerts
    setNotificationLogs(n => [
      {
        id: `not_tkt_${Date.now()}`,
        title: 'Support Ticket Registered 🎫',
        body: `Ticket #${tktId} regarding "${newTicketSubject}" is routed to high priority support queue.`,
        time: 'Just now',
        type: 'system',
        read: false
      },
      ...n
    ]);

    setNewTicketSubject('');
    setNewTicketDesc('');
  };

  // Resolve Ticket
  const resolveSupportTicket = (tktId: string) => {
    setTickets(prev => prev.map(t => {
      if (t.id === tktId) {
        return { ...t, status: 'resolved', slaHoursLeft: 0, internalNotes: 'Customer verified resolution of delivery delay. Escrow released.' };
      }
      return t;
    }));
  };

  // Mute, block and reports
  const toggleMuteConversation = (convId: string) => {
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, isMuted: !c.isMuted } : c));
  };

  const blockUser = (username: string) => {
    if (!blockedUsers.includes(username)) {
      setBlockedUsers(prev => [...prev, username]);
      alert(`Pioneer "@${username}" has been muted and locked from communication channels.`);
    }
  };

  const reportUser = (username: string, reason: string) => {
    const report = {
      username,
      reason,
      timestamp: new Date().toLocaleString()
    };
    setReportedUsers(prev => [report, ...prev]);
    alert(`Report filed for "@${username}". Incident log dispatched to moderation engine compliance board.`);
  };

  // Count unread
  const totalUnreadChats = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const activeConv = conversations.find(c => c.id === activeConvId) || conversations[0];

  return (
    <div className="bg-slate-950 text-slate-100 rounded-2xl border border-slate-800/80 shadow-2xl p-6 relative overflow-hidden select-none animate-fade-in" id="engagement_platform_root">
      
      {/* SHIMMER GLOW BACKGROUNDS */}
      <div className="absolute top-0 right-1/3 w-80 h-80 bg-violet-600/5 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none"></div>

      {/* DASHBOARD HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-5 border-b border-slate-800 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-violet-500/10 text-violet-400 text-[10px] uppercase font-mono tracking-wider px-2.5 py-0.5 rounded-full border border-violet-500/20 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse"></span>
              Real-time Node Layer Active
            </span>
            <span className="text-slate-500 text-[10px] font-mono">SLA Delivery Response Threshold: &lt;100ms</span>
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <MessageSquare className="w-5.5 h-5.5 text-violet-400" />
            Communication & Engagement Platform
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Secure P2P buyer-seller messaging, document manager, dynamic compliance support tickets, and AI Assistant extension interfaces.
          </p>
        </div>

        {/* GLOBAL SEARCH IN HEADER */}
        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search messages, files, tickets..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs focus:outline-none focus:border-violet-500 text-slate-200"
          />
          {searchQuery && (
            <button onClick={() => handleSearch('')} className="absolute right-3 top-3 text-slate-500 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* SEARCH RESULTS DROP-OVER */}
      {searchQuery && (
        <div className="bg-slate-900 border border-violet-500/30 rounded-xl p-4 mb-6 relative z-30 shadow-2xl text-left">
          <span className="text-[10px] uppercase font-mono tracking-wider text-violet-400 font-bold block mb-3">
            Unified Search Query Logs: "{searchQuery}" ({searchResults.length} results)
          </span>

          {searchResults.length === 0 ? (
            <p className="text-xs text-slate-500">No records found matching search vectors. Try "pdf", "stock", "audit" or "release".</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
              {searchResults.map(res => (
                <div
                  key={res.id}
                  onClick={() => {
                    if (res.type === 'Message') {
                      setActiveConvId(res.referenceId);
                      setActiveSubTab('chat');
                    } else if (res.type === 'Support Ticket') {
                      setActiveSubTab('helpdesk');
                    }
                    setSearchQuery('');
                  }}
                  className="bg-slate-950 p-3 rounded-lg border border-slate-850 hover:border-violet-500/30 transition-all cursor-pointer flex justify-between items-center"
                >
                  <div>
                    <span className="text-[9px] bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-indigo-400 font-mono font-bold uppercase">{res.type}</span>
                    <h5 className="text-xs font-bold text-slate-200 mt-1.5">{res.title}</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{res.subtitle}</p>
                  </div>
                  <ChevronRightIcon className="w-4 h-4 text-slate-600" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW TABS SUB NAV */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-900 pb-3" id="engagement_tabs_list">
        <button
          onClick={() => setActiveSubTab('chat')}
          className={`flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
            activeSubTab === 'chat'
              ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/10'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Messaging Center</span>
          {totalUnreadChats > 0 && (
            <span className="bg-rose-500 text-white font-mono text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ml-1">
              {totalUnreadChats}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('notifications')}
          className={`flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer relative ${
            activeSubTab === 'notifications'
              ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/10'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Notifications</span>
          {notificationLogs.some(n => !n.read) && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('helpdesk')}
          className={`flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
            activeSubTab === 'helpdesk'
              ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/10'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Ticket className="w-3.5 h-3.5" />
          <span>Help Desk SLA Tracker</span>
        </button>

        <button
          onClick={() => setActiveSubTab('engagement_privacy')}
          className={`flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
            activeSubTab === 'engagement_privacy'
              ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/10'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Moderation & Privacy</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ai_config')}
          className={`flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
            activeSubTab === 'ai_config'
              ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/10'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>AI Extension Cockpit</span>
        </button>
      </div>

      {/* ==================================================== */}
      {/* PANEL 1: MESSAGING CENTER */}
      {/* ==================================================== */}
      {activeSubTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="panel_sub_chat">
          
          {/* CONVERSATION LIST SIDEBAR */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col h-[520px]">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold block mb-3 text-left">Conversations</span>
            
            <div className="space-y-2 overflow-y-auto flex-1 pr-1">
              {conversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => {
                    setActiveConvId(conv.id);
                    setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c));
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer text-left relative ${
                    activeConvId === conv.id
                      ? 'bg-slate-950 border-violet-500/40 shadow-md'
                      : 'bg-slate-900/40 border-slate-850 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                      <img src={conv.participantAvatar} alt={conv.participantName} className="w-10 h-10 rounded-full object-cover border border-slate-800" />
                      {conv.online && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-950"></span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-extrabold text-slate-200 truncate pr-2">{conv.participantName}</h4>
                        <span className="text-[9px] text-slate-500 font-mono flex-shrink-0">{conv.lastMessageTime}</span>
                      </div>
                      <span className="text-[9px] text-violet-400 font-mono font-medium block">{conv.participantRole}</span>
                      <p className="text-[11px] text-slate-400 truncate mt-1">
                        {conv.typing ? <span className="text-emerald-400 animate-pulse italic font-medium">Typing...</span> : conv.lastMessageText}
                      </p>
                    </div>
                  </div>

                  {/* UNREAD COUNT / PINNED / MUTED ICONS */}
                  <div className="absolute right-3 bottom-3 flex items-center gap-1.5">
                    {conv.isMuted && <VolumeX className="w-3 h-3 text-slate-600" />}
                    {conv.isPinned && <Pin className="w-3 h-3 text-slate-500 rotate-45" />}
                    {conv.unreadCount > 0 && (
                      <span className="bg-violet-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* QUICK CONTACTS */}
            <div className="pt-3 border-t border-slate-800 mt-3 flex items-center justify-between text-xs text-slate-400">
              <span className="text-[10px] text-slate-500 font-mono">Simulate Quick Message:</span>
              <button
                onClick={() => {
                  const demoId = `conv_${Date.now()}`;
                  const demoConv: Conversation = {
                    id: demoId,
                    type: 'employer_candidate',
                    participantName: 'Pi Global Recruiter',
                    participantRole: 'Pioneer Employment Board',
                    participantAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
                    online: true,
                    unreadCount: 1,
                    lastMessageText: 'Your interview parameters have been validated on-ledger.',
                    lastMessageTime: 'Just now'
                  };
                  setConversations(prev => [demoConv, ...prev]);
                  setMessages(prev => ({ ...prev, [demoId]: [{
                    id: `msg_demo_${Date.now()}`,
                    senderId: 'pi_recruiter',
                    senderName: 'Pi Recruiter',
                    text: 'Your interview parameters have been validated on-ledger.',
                    timestamp: 'Just now',
                    status: 'delivered'
                  }] }));
                  setActiveConvId(demoId);
                }}
                className="text-[10px] text-violet-400 hover:text-violet-300 font-bold cursor-pointer"
              >
                + Recruiter
              </button>
            </div>
          </div>

          {/* ACTIVE CHAT WORKSPACE */}
          <div className="lg:col-span-2 flex flex-col h-[520px] bg-slate-900/80 border border-slate-800 rounded-xl relative overflow-hidden">
            
            {/* CHAT HEADER */}
            <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-3 flex justify-between items-center">
              <div className="flex items-center gap-3 text-left">
                <img src={activeConv.participantAvatar} alt={activeConv.participantName} className="w-8 h-8 rounded-full object-cover border border-slate-800" />
                <div>
                  <h3 className="text-xs font-bold text-slate-200">{activeConv.participantName}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${activeConv.online ? 'bg-emerald-500' : 'bg-slate-600'}`}></span>
                    <span className="text-[9px] text-slate-400 font-mono">{activeConv.online ? 'Presence: Online' : 'Presence: Offline'}</span>
                  </div>
                </div>
              </div>

              {/* ACTION TOOLBAR */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleMuteConversation(activeConv.id)}
                  title={activeConv.isMuted ? 'Unmute Chat' : 'Mute Chat'}
                  className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                >
                  <VolumeX className={`w-3.5 h-3.5 ${activeConv.isMuted ? 'text-violet-400' : ''}`} />
                </button>
                <button
                  onClick={() => blockUser(activeConv.participantName.split(' ')[0])}
                  title="Block Pioneer"
                  className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-rose-400"
                >
                  <UserMinus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => reportUser(activeConv.participantName.split(' ')[0], 'Policy violation / spamming')}
                  title="Report User"
                  className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-amber-400"
                >
                  <Flag className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* PINNED MESSAGES SUBHEADER */}
            {(messages[activeConv.id] || []).some(m => m.isPinned) && (
              <div className="bg-slate-950/60 border-b border-slate-900/60 px-4 py-1.5 flex justify-between items-center text-[10px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Pin className="w-3 h-3 text-violet-400 rotate-45" />
                  <span className="font-medium truncate max-w-[320px]">
                    Pinned message: {(messages[activeConv.id] || []).find(m => m.isPinned)?.text}
                  </span>
                </div>
                <button
                  onClick={() => {
                    const pinned = (messages[activeConv.id] || []).find(m => m.isPinned);
                    if (pinned) handlePinMessage(pinned.id);
                  }}
                  className="text-violet-400 hover:text-violet-300 font-bold"
                >
                  Unpin
                </button>
              </div>
            )}

            {/* MESSAGES VIEW CONTAINER */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {(messages[activeConv.id] || []).map(msg => {
                const isMe = msg.senderId === currentUser.uid;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] mx-auto ${isMe ? 'ml-auto' : 'mr-auto'}`}>
                    
                    {/* Quoted Message display */}
                    {msg.quotedMessageText && (
                      <div className="bg-slate-950/50 border-l-2 border-violet-500 p-2 rounded-t-lg text-[10px] text-slate-400 text-left w-full mb-px">
                        <span className="block font-bold text-violet-400 text-[9px]">Reply Reference:</span>
                        <p className="italic truncate">{msg.quotedMessageText}</p>
                      </div>
                    )}

                    <div className={`p-3 rounded-xl relative group text-left ${
                      isMe 
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-br-none' 
                        : 'bg-slate-950 border border-slate-850 rounded-bl-none'
                    }`}>
                      
                      {/* File preview inside message */}
                      {msg.filePath && (
                        <div className="mb-2 p-2 bg-slate-900 border border-slate-800 rounded-lg flex items-center gap-2">
                          <FileText className="w-4 h-4 text-violet-400" />
                          <div className="text-[10px]">
                            <span className="font-bold text-slate-200 block truncate max-w-[150px]">{msg.fileName}</span>
                            <span className="text-slate-500 uppercase font-mono">{msg.fileType} Document</span>
                          </div>
                        </div>
                      )}

                      <p className="text-xs leading-relaxed break-words">{msg.text}</p>

                      <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-slate-400">
                        <span>{msg.timestamp}</span>
                        {isMe && (
                          <span>
                            {msg.status === 'seen' ? (
                              <CheckCheck className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <CheckCheck className="w-3 h-3 text-slate-500" />
                            )}
                          </span>
                        )}
                      </div>

                      {/* MICRO HOVER TOOLBAR FOR REACTIONS, PIN, REPLY */}
                      <div className={`absolute top-1/2 -translate-y-1/2 ${isMe ? '-left-24' : '-right-24'} hidden group-hover:flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-lg z-20 shadow-xl`}>
                        <button onClick={() => handleQuoteMessage(msg)} title="Reply" className="p-1 hover:bg-slate-850 rounded text-slate-400 hover:text-white">
                          <CornerUpLeft className="w-3 h-3" />
                        </button>
                        <button onClick={() => handlePinMessage(msg.id)} title="Pin message" className="p-1 hover:bg-slate-850 rounded text-slate-400 hover:text-violet-400">
                          <Pin className="w-3 h-3 rotate-45" />
                        </button>
                        <button onClick={() => handleReactToMessage(msg.id, '❤️')} className="p-0.5 hover:bg-slate-850 rounded text-xs">❤️</button>
                        <button onClick={() => handleReactToMessage(msg.id, '👍')} className="p-0.5 hover:bg-slate-850 rounded text-xs">👍</button>
                        {isMe && (
                          <button onClick={() => handleDeleteMessage(msg.id)} title="Delete" className="p-1 hover:bg-slate-850 rounded text-rose-400">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Reactions Pill Display */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {msg.reactions.map((r, idx) => (
                          <span key={idx} className="bg-slate-900 border border-slate-850 px-1 py-0.5 rounded text-[9px]">{r}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* QUOTE DRAFT BAR */}
            {quotedMessage && (
              <div className="bg-slate-950 border-t border-slate-900 px-4 py-2 flex justify-between items-center text-[10px] text-slate-400 text-left">
                <div className="flex items-center gap-1.5">
                  <CornerUpLeft className="w-3 h-3 text-violet-400" />
                  <span className="truncate">Replying to: <em>{quotedMessage.text}</em></span>
                </div>
                <button onClick={() => setQuotedMessage(null)} className="text-slate-500 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* SMART SUGGESTIONS CHIPS */}
            {smartSuggestions.length > 0 && (
              <div className="bg-slate-900 border-t border-slate-850 px-4 py-1.5 flex gap-1.5 overflow-x-auto">
                <span className="text-[8px] uppercase font-mono tracking-wider text-slate-500 self-center font-bold">Suggestions:</span>
                {smartSuggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(s)}
                    className="bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1 text-[10px] transition-all text-left whitespace-nowrap cursor-pointer font-medium"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* CHAT INPUT AREA */}
            <div className="bg-slate-900 border-t border-slate-800 px-4 py-3 flex items-center gap-3">
              
              {/* Drag File button */}
              <label className="p-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer flex-shrink-0">
                <Paperclip className="w-4 h-4" />
                <input type="file" onChange={handleManualUpload} className="hidden" />
              </label>

              <input
                type="text"
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
                placeholder="Type your secure verified message..."
                className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-violet-500 text-slate-200"
              />

              <button
                onClick={() => handleSendMessage()}
                className="p-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-white transition-all cursor-pointer flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* PANEL 2: NOTIFICATIONS ENGINE */}
      {/* ==================================================== */}
      {activeSubTab === 'notifications' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in text-left" id="panel_sub_notifications">
          
          {/* NOTIFICATION PREFERENCES */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Bell className="w-4 h-4 text-violet-400" />
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide font-mono">Notification Delivery Channels</h2>
            </div>
            
            <p className="text-xs text-slate-400">
              Select verified network-level delivery endpoints. System notifications broadcast cryptographically signed triggers.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between p-2 bg-slate-950 border border-slate-850 rounded-lg">
                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-bold text-slate-200">In-App Live Alerts</span>
                  <span className="text-[9px] text-slate-500">Real-time inside superapp framework</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyChannels.inApp}
                  onChange={(e) => setNotifyChannels(prev => ({ ...prev, inApp: e.target.checked }))}
                  className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 bg-slate-900 border-slate-800"
                />
              </div>

              <div className="flex items-center justify-between p-2 bg-slate-950 border border-slate-850 rounded-lg">
                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-bold text-slate-200">Web Push Notifications</span>
                  <span className="text-[9px] text-slate-500">Browser system desktop reminders</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyChannels.push}
                  onChange={(e) => setNotifyChannels(prev => ({ ...prev, push: e.target.checked }))}
                  className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 bg-slate-900 border-slate-800"
                />
              </div>

              <div className="flex items-center justify-between p-2 bg-slate-950 border border-slate-850 rounded-lg">
                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-bold text-slate-200">Email Updates</span>
                  <span className="text-[9px] text-slate-500">Weekly digests to registered user email</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyChannels.email}
                  onChange={(e) => setNotifyChannels(prev => ({ ...prev, email: e.target.checked }))}
                  className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 bg-slate-900 border-slate-800"
                />
              </div>

              <div className="flex items-center justify-between p-2 bg-slate-950 border border-slate-850 rounded-lg">
                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-bold text-slate-200">SMS / WhatsApp API Gateway</span>
                  <span className="text-[9px] text-slate-500">Direct mobile phone ledger notifications</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyChannels.whatsapp}
                  onChange={(e) => setNotifyChannels(prev => ({ ...prev, whatsapp: e.target.checked }))}
                  className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 bg-slate-900 border-slate-800"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg space-y-1">
              <span className="font-bold text-[10px] uppercase text-violet-400 font-mono tracking-wider">Scale-Ready Architecture</span>
              <p className="text-[11px] text-slate-400">
                A single notification event triggers fan-out queues to AWS SNS and SendGrid templates, filtering redundant alerts automatically.
              </p>
            </div>
          </div>

          {/* NOTIFICATION IN-APP ALERTS LOG */}
          <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                  Notification Queue / Logs
                </span>
                <button
                  onClick={() => setNotificationLogs(prev => prev.map(n => ({ ...n, read: true })))}
                  className="text-[10px] text-violet-400 hover:text-violet-300 font-bold"
                >
                  Mark All Read
                </button>
              </div>

              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {notificationLogs.map(log => (
                  <div
                    key={log.id}
                    className={`p-3 rounded-lg border text-left relative flex gap-3 ${
                      log.read 
                        ? 'bg-slate-950/40 border-slate-900 text-slate-400' 
                        : 'bg-slate-950 border-violet-500/20 text-slate-200'
                    }`}
                  >
                    {!log.read && (
                      <span className="w-1.5 h-1.5 bg-violet-400 rounded-full mt-1.5 flex-shrink-0 animate-ping"></span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs text-slate-200 block">{log.title}</span>
                        <span className="text-[9px] text-slate-500 font-mono">{log.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-normal">{log.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SEND SAMPLE TEST NOTIFICATION */}
            <div className="pt-4 border-t border-slate-800/80 flex gap-2">
              <button
                onClick={() => {
                  const sampleNot = {
                    id: `not_${Date.now()}`,
                    title: 'Pi Payment Verification 💸',
                    body: 'Your test transaction of 15.0 Pi has cleared validation buffers successfully.',
                    time: 'Just now',
                    type: 'payment',
                    read: false
                  };
                  setNotificationLogs(prev => [sampleNot, ...prev]);
                }}
                className="bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold text-xs py-2 px-4 rounded-xl transition-all cursor-pointer"
              >
                Trigger Sample Payment Alert
              </button>

              <button
                onClick={() => {
                  const sampleNot = {
                    id: `not_${Date.now()}`,
                    title: 'New Listing Posted! 🛒',
                    body: 'Satoshi Gadgets posted a new "Secure Pi Gateway Terminal V2" matching your followed categories.',
                    time: 'Just now',
                    type: 'follower',
                    read: false
                  };
                  setNotificationLogs(prev => [sampleNot, ...prev]);
                }}
                className="bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold text-xs py-2 px-4 rounded-xl transition-all cursor-pointer"
              >
                Trigger Followed Merchant Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* PANEL 3: HELP DESK SLA TRACKER */}
      {/* ==================================================== */}
      {activeSubTab === 'helpdesk' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in text-left" id="panel_sub_helpdesk">
          
          {/* TICKET SUBMISSION FORM */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800 mb-4">
              <HelpCircle className="w-4 h-4 text-violet-400" />
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Register Network Support Ticket</h2>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block font-bold">Category</label>
                <select
                  value={newTicketCategory}
                  onChange={(e: any) => setNewTicketCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
                >
                  <option value="payment">Pi Wallet / Payment Processing</option>
                  <option value="escrow">P2P Escrow disputes & release</option>
                  <option value="account_verification">Merchant / Pioneer KYC Verify</option>
                  <option value="job_dispute">Freelancer job contract milestone</option>
                  <option value="listing_issue">Marketplace spam listings report</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block font-bold">Priority Tier</label>
                <select
                  value={newTicketPriority}
                  onChange={(e: any) => setNewTicketPriority(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
                >
                  <option value="low">Low Priority (48 Hour SLA)</option>
                  <option value="medium">Medium Priority (24 Hour SLA)</option>
                  <option value="high">High Priority (12 Hour SLA)</option>
                  <option value="sla_critical">SLA Critical (4 Hour Response Time)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block font-bold">Subject Headline</label>
                <input
                  type="text"
                  value={newTicketSubject}
                  onChange={(e) => setNewTicketSubject(e.target.value)}
                  placeholder="E.g., Escrow release time window mismatch"
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block font-bold">Comprehensive Description</label>
                <textarea
                  rows={4}
                  value={newTicketDesc}
                  onChange={(e) => setNewTicketDesc(e.target.value)}
                  placeholder="Describe your issue with order ID and txn signature references."
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-md shadow-violet-500/10 cursor-pointer"
              >
                File Support Ticket & Start SLA Timer
              </button>
            </form>
          </div>

          {/* ACTIVE TICKETS & SLA MONITOR */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* SLA COUNTDOWN BOARD */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block pb-2 border-b border-slate-800 mb-4 font-mono">
                Active SLA Ticket Countdown Board
              </span>

              <div className="space-y-3">
                {tickets.map(tkt => {
                  const isCritical = tkt.priority === 'sla_critical';
                  const isResolved = tkt.status === 'resolved';
                  return (
                    <div key={tkt.id} className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-violet-400 font-mono font-bold uppercase">Ticket ID: {tkt.id}</span>
                          <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                            isCritical ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {tkt.priority.replace('_', ' ')}
                          </span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                            isResolved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-900 text-slate-400'
                          }`}>
                            Status: {tkt.status.toUpperCase()}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-200 mt-2">{tkt.subject}</h4>
                        <p className="text-[11px] text-slate-400 leading-normal">{tkt.description}</p>
                        
                        {tkt.internalNotes && (
                          <div className="mt-2.5 p-2 bg-slate-900 rounded border border-slate-850 text-[10px] text-slate-400 font-mono">
                            <strong className="text-violet-400">Internal Admin Note:</strong> {tkt.internalNotes}
                          </div>
                        )}
                      </div>

                      {/* SLA Timer */}
                      <div className="flex flex-col items-end justify-center min-w-[120px] text-right font-mono">
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider block">SLA Commitment</span>
                        {isResolved ? (
                          <span className="text-xs font-bold text-emerald-400 mt-1 flex items-center gap-1">
                            <CheckCheck className="w-3.5 h-3.5" /> Checked Out
                          </span>
                        ) : (
                          <div className="mt-1">
                            <span className={`text-sm font-extrabold block ${tkt.slaHoursLeft < 5 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`}>
                              {tkt.slaHoursLeft} Hours
                            </span>
                            <span className="text-[9px] text-slate-500 block">Remaining for resolution</span>
                          </div>
                        )}

                        {!isResolved && (
                          <button
                            onClick={() => resolveSupportTicket(tkt.id)}
                            className="mt-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] py-1 px-3 rounded-lg transition-all cursor-pointer"
                          >
                            Mark Resolved
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DOCUMENT / COMPLIANCE ATTACHMENTS */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block pb-2 border-b border-slate-800 mb-4">
                Compliance Attachment Files & Verification (Drag & Drop Mock)
              </span>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`p-6 border border-dashed rounded-xl text-center space-y-2 transition-all ${
                  dragOver ? 'border-violet-500 bg-violet-500/10' : 'border-slate-800 bg-slate-950'
                }`}
              >
                <Paperclip className="w-6 h-6 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-300">Drag & drop verification files, KYC receipts, resumes, or invoices here</p>
                <p className="text-[10px] text-slate-500">Supported formats: PDF, PNG, JPG (Max 15MB size per file)</p>
                
                <label className="inline-block bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold text-[10px] py-1.5 px-3 rounded-lg transition-all cursor-pointer">
                  Select File Manually
                  <input type="file" onChange={handleManualUpload} className="hidden" />
                </label>
              </div>

              {/* Progress Bar simulation */}
              {uploadProgress > 0 && (
                <div className="mt-4 bg-slate-950 border border-slate-850 p-3 rounded-lg text-left">
                  <div className="flex justify-between items-center text-[10px] mb-1 font-mono">
                    <span className="text-slate-300">Scanned Cryptographic Upload: {uploadFileName}</span>
                    <span className="text-violet-400">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-violet-500 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              )}

              {/* SHARED FILES DIRECTORY */}
              {sharedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block font-bold text-left">Uploaded Files Log:</span>
                  {sharedFiles.map(file => (
                    <div key={file.id} className="bg-slate-950 border border-slate-850 rounded-xl p-3 flex justify-between items-center">
                      <div className="flex items-center gap-3 text-left">
                        <FileText className="w-4 h-4 text-violet-400" />
                        <div>
                          <h5 className="text-xs font-bold text-slate-200">{file.name}</h5>
                          <span className="text-[10px] text-slate-500 block font-mono">Uploaded by {file.senderName} • {file.size}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-right">
                        <span className="text-[9px] bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono uppercase font-bold flex items-center gap-1">
                          <span className="w-1 h-1 bg-emerald-400 rounded-full"></span>
                          {file.scanStatus.replace('_', ' ')}
                        </span>
                        
                        <button
                          onClick={() => {
                            setSharedFiles(prev => prev.filter(f => f.id !== file.id));
                          }}
                          className="p-1 hover:bg-slate-900 rounded text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* PANEL 4: MODERATION & PRIVACY */}
      {/* ==================================================== */}
      {activeSubTab === 'engagement_privacy' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in text-left" id="panel_sub_moderation">
          
          {/* CORE BLOCKS & REPORTS */}
          <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800 mb-2">
              <Shield className="w-4 h-4 text-rose-400" />
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Pioneer Anti-Abuse & Moderation Dashboard</h2>
            </div>

            <p className="text-xs text-slate-400 leading-normal">
              Pi Business Market implements automated filters block-listing scam content, harassment links, or suspicious multi-wallet phishing attacks.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-3">
                <span className="font-bold text-xs text-rose-400 block uppercase font-mono">Blocked Pioneers ({blockedUsers.length})</span>
                {blockedUsers.length === 0 ? (
                  <p className="text-[11px] text-slate-500">No users blocked currently.</p>
                ) : (
                  <div className="space-y-1">
                    {blockedUsers.map(usr => (
                      <div key={usr} className="flex justify-between items-center text-xs text-slate-300">
                        <span>@{usr}</span>
                        <button
                          onClick={() => setBlockedUsers(prev => prev.filter(u => u !== usr))}
                          className="text-[10px] text-violet-400 font-bold hover:underline"
                        >
                          Unblock
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-3">
                <span className="font-bold text-xs text-amber-400 block uppercase font-mono">Incident Compliance Reports</span>
                {reportedUsers.length === 0 ? (
                  <p className="text-[11px] text-slate-500">No active reports filed.</p>
                ) : (
                  <div className="space-y-2 max-h-[140px] overflow-y-auto">
                    {reportedUsers.map((rep, idx) => (
                      <div key={idx} className="text-[11px] border-b border-slate-900 pb-2 text-slate-300">
                        <span className="font-bold block text-slate-200">User: @{rep.username}</span>
                        <p className="text-slate-400 mt-0.5">Reason: {rep.reason}</p>
                        <span className="text-[9px] text-slate-500 block font-mono">{rep.timestamp}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* QUICK ACTIONS FOR DEMONSTRATION */}
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-3">
              <span className="font-bold text-xs text-slate-200 block uppercase font-mono">Simulate Moderation Actions:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => blockUser('spambot_pioneer')}
                  className="bg-rose-950/30 border border-rose-900 hover:bg-rose-900/30 text-rose-400 text-[10px] font-bold py-1 px-3 rounded-lg transition-all"
                >
                  Block @spambot_pioneer
                </button>
                <button
                  onClick={() => reportUser('suspicious_trader', 'Phishing URL links sent in chat')}
                  className="bg-amber-950/30 border border-amber-900 hover:bg-amber-900/30 text-amber-300 text-[10px] font-bold py-1 px-3 rounded-lg transition-all"
                >
                  Report @suspicious_trader
                </button>
              </div>
            </div>
          </div>

          {/* RATE LIMIT CONTROLS */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <Activity className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Chat Security Rate Limiter</h3>
              </div>

              <p className="text-xs text-slate-400">
                Automatic protection mechanisms locking accounts displaying malicious bulk automated message script sequences.
              </p>

              <div className="space-y-3 pt-2">
                <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-slate-300 font-bold">Hourly Message Count</span>
                    <span className="font-mono text-violet-400">{rateLimitInfo.currentMsgs} / {rateLimitInfo.maxAllowed}</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-violet-500 h-full transition-all duration-300" style={{ width: `${(rateLimitInfo.currentMsgs / rateLimitInfo.maxAllowed) * 100}%` }}></div>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg flex justify-between items-center font-mono text-[10px]">
                  <span className="text-slate-400 uppercase">Resets remaining time:</span>
                  <span className="text-emerald-400 font-bold">{rateLimitInfo.resetsInSeconds} Seconds</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg space-y-1 mt-4">
              <span className="font-bold text-[10px] uppercase text-violet-400 font-mono tracking-wider">Rate Limiting Rulebook</span>
              <p className="text-[11px] text-slate-400">
                Pioneers are limited to a maximum of 60 standard direct messages per hour to mitigate sybil threat vectors on the Pi network application.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* PANEL 5: AI CONFIGURATION COCKPIT */}
      {/* ==================================================== */}
      {activeSubTab === 'ai_config' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in text-left" id="panel_sub_ai_config">
          
          {/* AI CAPABILITIES & INSTRUCTIONS */}
          <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide font-mono">Enterprise AI Extension Platform</h2>
            </div>
            
            <p className="text-xs text-slate-400 leading-normal">
              Configure parameters to connect the local chat logs with server-side LLM processing structures. Enable automatic merchant response triggers and smart user suggestions.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg space-y-1">
                <span className="font-bold text-amber-400 text-[11px] block">1. Auto-Reply Gateway</span>
                <p className="text-[11px] text-slate-400">Auto replies to basic inquiries regarding shipping, hours, stock levels, or business scope.</p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg space-y-1">
                <span className="font-bold text-violet-400 text-[11px] block">2. Smart Suggestion Engine</span>
                <p className="text-[11px] text-slate-400">Computes contextual message chips matching buyer intent categories to facilitate touch navigation.</p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg space-y-1">
                <span className="font-bold text-emerald-400 text-[11px] block">3. In-App Direct Translation</span>
                <p className="text-[11px] text-slate-400">Automatically translates chat dialogue into the matching local language preference of the recipient user.</p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg space-y-1">
                <span className="font-bold text-indigo-400 text-[11px] block">4. Sentiment & Intent Tracker</span>
                <p className="text-[11px] text-slate-400">Processes buyer conversation history to output sentiment scores and concise intent logs to merchants.</p>
              </div>
            </div>

            {/* AI EXTENSION DESIGN PATTERNS CODEBOX */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 space-y-1">
              <span className="font-bold text-[10px] uppercase text-violet-400 font-mono tracking-wider">AI Developer Integration Interfaces</span>
              <p className="text-[11px] text-slate-400 mb-2">
                This applet uses clean interfaces to separate UI state from server-side Gemini API calls safely.
              </p>
              <pre className="text-[9px] text-slate-400 font-mono bg-slate-900 p-2.5 rounded overflow-x-auto text-left leading-normal">
{`interface IAiCustomerAssistant {
  detectIntent(message: string): Promise<UserIntent>;
  analyzeSentiment(chatHistory: Message[]): Promise<SentimentResult>;
  generateSmartSuggestions(context: ChatContext): Promise<string[]>;
  translateText(text: string, targetLanguage: string): Promise<string>;
}`}
              </pre>
            </div>
          </div>

          {/* AI INTERACTIVE CONFIG CONTROLS */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <Shield className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Interactive AI Switches</h3>
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-850 rounded-lg">
                  <div className="flex flex-col text-left">
                    <span className="text-[11px] font-bold text-slate-200">Merchant FAQ Auto-Reply</span>
                    <span className="text-[9px] text-slate-500">Replies using custom FAQ profiles</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={aiAutoReply}
                    onChange={(e) => setAiAutoReply(e.target.checked)}
                    className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 bg-slate-900 border-slate-800"
                  />
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-850 rounded-lg">
                  <div className="flex flex-col text-left">
                    <span className="text-[11px] font-bold text-slate-200">Display Smart Suggestions</span>
                    <span className="text-[9px] text-slate-500">Provides fast touch reply chips</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={aiSuggestions}
                    onChange={(e) => setAiSuggestions(e.target.checked)}
                    className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 bg-slate-900 border-slate-800"
                  />
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-850 rounded-lg">
                  <div className="flex flex-col text-left">
                    <span className="text-[11px] font-bold text-slate-200">Automated Direct Translation</span>
                    <span className="text-[9px] text-slate-500">Converts chat into matching language</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={aiTranslation}
                    onChange={(e) => setAiTranslation(e.target.checked)}
                    className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 bg-slate-900 border-slate-800"
                  />
                </div>

                {aiTranslation && (
                  <div className="p-2 bg-slate-950 border border-slate-850 rounded-lg space-y-1">
                    <span className="text-[9px] uppercase font-mono text-slate-400 block font-bold">Target Language Preference:</span>
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="Spanish">Spanish (Español)</option>
                      <option value="Vietnamese">Vietnamese (Tiếng Việt)</option>
                      <option value="Chinese">Chinese (中文)</option>
                      <option value="Korean">Korean (한국어)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* SIMULATED SENTIMENT REPORT */}
              <div className="bg-slate-950 border border-slate-850 p-3.5 rounded-xl text-left space-y-1.5">
                <span className="font-bold text-[10px] uppercase text-amber-400 font-mono tracking-wider block">Live Chat Sentiment Analysis:</span>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium">Detected Intent Mood:</span>
                  <span className="font-bold text-emerald-400">{aiSentimentOutput.sentiment}</span>
                </div>
                <p className="text-[11px] text-slate-400 italic leading-normal">
                  "{aiSentimentOutput.summary}"
                </p>
                <div className="flex justify-between items-center text-[10px] pt-1">
                  <span className="text-slate-500 uppercase">Clarity Score Metric:</span>
                  <span className="font-mono text-violet-400 font-bold">{aiSentimentOutput.score} / 100</span>
                </div>
              </div>
            </div>

            {/* BUTTON TRIGGERS */}
            <div className="pt-4 mt-4 border-t border-slate-850">
              <button
                onClick={() => {
                  setAiSentimentOutput({
                    sentiment: 'Critical / Urgent',
                    summary: 'Pioneer is inquiring about a pending escrow status lock and requires support ticketing routing.',
                    score: 94
                  });
                  setSmartSuggestions([
                    'Let me look into the ticket status immediately.',
                    'Can you provide your transaction receipt hash?',
                    'Routing to technical administrator...'
                  ]);
                }}
                className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold text-xs py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-violet-500/10 cursor-pointer"
              >
                <span>Re-Analyze Active Chat Intent</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Icon helper components
function ChevronRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
