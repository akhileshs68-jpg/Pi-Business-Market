/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { businessService } from '../services/businessService';
import { businessMemberService } from '../services/businessMemberService';
import { businessVerificationService } from '../services/businessVerificationService';
import { mediaService } from '../services/mediaService';
import { getFirebaseDb } from '../firebase/config';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Business, BusinessMember, BusinessDocument, BusinessRole, BusinessType } from '../types';
import { 
  Building2, Users, FileText, ShieldCheck, Settings, BarChart3, 
  ChevronLeft, MoreVertical, Plus, Mail, Phone, Globe, MapPin, 
  Calendar, History, Lock, ExternalLink, ArrowUpRight, UserPlus, 
  Info, Edit2, Image as ImageIcon, Upload, X, CheckCircle2, Store, 
  Share2, Link, Download, Trash2, CreditCard, ShoppingCart, Box,
  TrendingUp, Activity, Search, Filter, ChevronRight, AlertCircle, Bell, Key,
  FileCheck, ShieldAlert, FileClock, User, HelpCircle, Check, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from '../components/Navbar';
import { StoreWizard } from '../components/store/StoreWizard';

type TabType = 'overview' | 'members' | 'documents' | 'verification' | 'activity' | 'settings';

export const BusinessProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [business, setBusiness] = useState<Business | null>(null);
  const [members, setMembers] = useState<BusinessMember[]>([]);
  const [docs, setDocs] = useState<BusinessDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [activeChartIndex, setActiveChartIndex] = useState<number | null>(null);

  const [copiedLink, setCopiedLink] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showStoreWizard, setShowStoreWizard] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  
  // Settings form states
  const [settingsForm, setSettingsForm] = useState({
    description: '',
    email: '',
    phone: '',
    website: '',
    gstNumber: '',
    panNumber: '',
    businessType: 'Private Limited' as BusinessType,
  });
  
  // Search and filter states
  const [memberSearch, setMemberSearch] = useState('');
  const [memberRoleFilter, setMemberRoleFilter] = useState<string>('all');
  const [docCategoryFilter, setDocCategoryFilter] = useState<string>('all');
  
  // Invite form states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<BusinessRole>('Employee');
  const [inviteTitle, setInviteTitle] = useState('');
  const [inviteDepartment, setInviteDepartment] = useState('');

  // Edit form states
  const [editForm, setEditForm] = useState<Partial<Business>>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  // Document upload states
  const [uploadDocType, setUploadDocType] = useState<'GST' | 'PAN' | 'TradeLicense' | 'Registration' | 'IdentityProof' | 'AddressProof' | 'Tax' | 'Other'>('Registration');
  const [uploadDocName, setUploadDocName] = useState('');
  const [uploadDocFile, setUploadDocFile] = useState<File | null>(null);
  const [uploadDocExpiry, setUploadDocExpiry] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Settings Tab subtabs and options states
  const [activeSettingsTab, setActiveSettingsTab] = useState<'general' | 'branding' | 'security' | 'notifications' | 'payment' | 'backup'>('general');
  const [apiKey, setApiKey] = useState('pi_live_4f10d9ae38bc2891' + (id ? id.substring(0, 6).toUpperCase() : ''));
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySms, setNotifySms] = useState(false);
  const [notifyWeeklyAudit, setNotifyWeeklyAudit] = useState(true);

  // Editing workforce member states
  const [editingMember, setEditingMember] = useState<BusinessMember | null>(null);
  const [editMemberRole, setEditMemberRole] = useState<BusinessRole>('Employee');
  const [editMemberTitle, setEditMemberTitle] = useState('');
  const [editMemberDepartment, setEditMemberDepartment] = useState('');
  const [editMemberStatus, setEditMemberStatus] = useState<'active' | 'suspended' | 'invited'>('active');
  const [editMemberPermissions, setEditMemberPermissions] = useState<string[]>([]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      try {
        const [bizData, memberData, docData] = await Promise.all([
          businessService.getBusiness(id),
          businessMemberService.getBusinessMembers(id),
          businessVerificationService.getBusinessDocuments(id)
        ]);
        setBusiness(bizData);
        setMembers(memberData);
        setDocs(docData);
        if (bizData) {
          setEditForm(bizData);
          setSettingsForm({
            description: bizData.description || '',
            email: bizData.email || '',
            phone: bizData.phone || '',
            website: bizData.website || '',
            gstNumber: bizData.gstNumber || '',
            panNumber: bizData.panNumber || '',
            businessType: bizData.businessType || 'Private Limited',
          });
        }
      } catch (err) {
        console.error('Failed to load business profile:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'e') {
        e.preventDefault();
        setEditForm(business || {});
        setIsEditModalOpen(true);
      }
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        setShowStoreWizard(true);
      }
      if (e.altKey && e.key === 'u') {
        e.preventDefault();
        setIsDocumentModalOpen(true);
      }
      if (e.altKey && e.key === 'i') {
        e.preventDefault();
        setIsInviteModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [business]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] text-slate-100 font-sans">
        <div className="w-full h-16 bg-[#090d16] border-b border-slate-800 animate-pulse" />
        <div className="relative h-64 sm:h-80 w-full bg-[#080c14] animate-pulse" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 -mt-32 pb-24">
          <div className="bg-[#0b0f19]/80 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl mb-8 animate-pulse">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full">
                <div className="w-28 h-28 bg-[#030712] rounded-xl shrink-0" />
                <div className="space-y-3 w-full max-w-md">
                  <div className="h-8 bg-slate-800 rounded-lg w-3/4" />
                  <div className="h-4 bg-slate-800 rounded-lg w-1/2" />
                  <div className="h-4 bg-slate-800 rounded-lg w-2/3" />
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mb-8 border-b border-slate-800 pb-px">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 w-24 bg-slate-900 rounded-t-lg animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-[#0b0f19] border border-slate-800/80 h-32 rounded-xl p-5 animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 h-96 bg-[#0b0f19] border border-slate-800 rounded-2xl animate-pulse" />
            <div className="h-96 bg-[#0b0f19] border border-slate-800 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center p-8">
        <Building2 className="w-16 h-16 text-slate-800 mb-6" />
        <h2 className="text-2xl font-bold text-white mb-2">Identity Not Found</h2>
        <p className="text-slate-500 mb-8">The business identity you are looking for does not exist or has been archived.</p>
        <button onClick={() => navigate('/business-dashboard')} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-500 transition-all">Return to Dashboard</button>
      </div>
    );
  }

  // Calculate compliance and details
  const complianceScore = business.verificationStatus === 'Verified' ? 100 : (docs.length > 0 ? 75 : 35);
  const verificationProgress = business.verificationStatus === 'Verified' ? 100 : (docs.length > 0 ? 60 : 20);
  const healthScore = business.businessStatus === 'active' ? 95 : 45;

  const kpis = [
    { label: 'Revenue', val: '$142,500.00', trend: '+14.2%', progress: 82, icon: CreditCard, color: 'text-emerald-400', bg: 'bg-emerald-500/10', trendColor: 'text-emerald-400' },
    { label: 'Orders', val: '1,248', trend: '+8.4%', progress: 65, icon: ShoppingCart, color: 'text-blue-400', bg: 'bg-blue-500/10', trendColor: 'text-blue-400' },
    { label: 'Products', val: '142', trend: '+4.2%', progress: 48, icon: Box, color: 'text-purple-400', bg: 'bg-purple-500/10', trendColor: 'text-purple-400' },
    { label: 'Customers', val: '842', trend: '+22.1%', progress: 78, icon: Users, color: 'text-pink-400', bg: 'bg-pink-500/10', trendColor: 'text-pink-400' },
    { label: 'Stores', val: business.storeCount || 0, trend: 'Active', progress: business.storeCount > 0 ? 100 : 0, icon: Store, color: 'text-amber-400', bg: 'bg-amber-500/10', trendColor: 'text-amber-400' },
    { label: 'Employees', val: business.employeeCount || 1, trend: 'Stable', progress: 90, icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10', trendColor: 'text-indigo-400' },
    { label: 'Followers', val: business.followers || 0, trend: '+18.5%', progress: 55, icon: Activity, color: 'text-sky-400', bg: 'bg-sky-500/10', trendColor: 'text-sky-400' },
    { label: 'Rating', val: business.rating?.toFixed(1) || '4.8', trend: 'Top Tier', progress: 96, icon: Award, color: 'text-yellow-400', bg: 'bg-yellow-500/10', trendColor: 'text-yellow-400' },
    { label: 'Growth', val: '24.5%', trend: 'Accelerated', progress: 85, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10', trendColor: 'text-emerald-400' },
    { label: 'Pending Tasks', val: business.storeCount === 0 || docs.length === 0 ? '2' : '0', trend: 'Urgent', progress: 20, icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-500/10', trendColor: 'text-rose-400' },
    { label: 'Verification', val: `${verificationProgress}%`, trend: business.verificationStatus === 'Verified' ? 'Complete' : 'Under Review', progress: verificationProgress, icon: ShieldCheck, color: 'text-indigo-400', bg: 'bg-indigo-500/10', trendColor: 'text-indigo-400' },
    { label: 'Documents', val: docs.length.toString(), trend: 'Approved', progress: docs.length > 0 ? 100 : 0, icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-500/10', trendColor: 'text-emerald-400' },
  ];

  const handleDocumentUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !business || !uploadDocFile) return;
    setUploadingDoc(true);
    setUploadError(null);
    try {
      const mediaAsset = await mediaService.uploadMedia(uploadDocFile, user.uid, {
        module: 'businesses',
        businessId: business.id
      });
      
      await businessVerificationService.uploadDocument(
        business.id,
        user.uid,
        user.displayName || user.email || 'Owner',
        {
          businessId: business.id,
          type: uploadDocType,
          name: uploadDocName || uploadDocFile.name,
          url: mediaAsset.downloadUrl,
          uploadedBy: user.displayName || user.email || 'Owner',
          expiryDate: uploadDocExpiry || undefined
        }
      );

      const docData = await businessVerificationService.getBusinessDocuments(business.id);
      setDocs(docData);
      setIsDocumentModalOpen(false);
      setUploadDocName('');
      setUploadDocFile(null);
      setUploadDocExpiry('');
    } catch (err) {
      console.error(err);
      setUploadError(err instanceof Error ? err.message : 'Failed to upload document');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleInviteStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !business || !inviteEmail) return;
    try {
      // Create member record in Firestore to simulate perfect enterprise workforce integration
      const db = getFirebaseDb();
      const memberId = `${business.id}_${Math.random().toString(36).substring(2, 10)}`;
      const memberRef = doc(db, 'businessMembers', memberId);
      
      const newMember: BusinessMember = {
        memberId,
        businessId: business.id,
        userUid: inviteEmail.split('@')[0], // Simulated Uid derived from email
        role: inviteRole,
        permissions: inviteRole === 'Super Admin' || inviteRole === 'Owner' ? ['*'] : ['read', 'write_products'],
        title: inviteTitle || 'Associate',
        department: inviteDepartment || 'Sales',
        status: 'active',
        joinedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(memberRef, newMember);
      
      const newCount = (business.employeeCount || 0) + 1;
      await businessService.updateBusiness(business.id, user.uid, user.displayName || user.email || 'Owner', {
        employeeCount: newCount
      });
      const [updatedMembers, updatedBiz] = await Promise.all([
        businessMemberService.getBusinessMembers(business.id),
        businessService.getBusiness(business.id)
      ]);
      setMembers(updatedMembers);
      if (updatedBiz) setBusiness(updatedBiz);

      setIsInviteModalOpen(false);
      setInviteEmail('');
      setInviteTitle('');
      setInviteDepartment('');
      setToastMessage(`Invitation sent to ${inviteEmail} successfully!`);
    } catch (err) {
      console.error('Failed to invite member:', err);
      setToastMessage('Failed to send invitation');
    }
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !business || !editingMember) return;
    try {
      await businessMemberService.updateMember(business.id, editingMember.memberId, user.uid, user.displayName || user.email || 'Owner', {
        role: editMemberRole,
        title: editMemberTitle,
        department: editMemberDepartment,
        status: editMemberStatus === 'invited' ? 'active' : editMemberStatus,
        permissions: editMemberPermissions
      });
      const updatedMembers = await businessMemberService.getBusinessMembers(business.id);
      setMembers(updatedMembers);
      setEditingMember(null);
      setToastMessage('Workforce credentials updated successfully!');
    } catch (err) {
      console.error(err);
      setToastMessage('Failed to save workforce member updates');
    }
  };

  const handleShareBusiness = async () => {
    const shareData = {
      title: business?.businessName || 'Business Profile',
      text: business?.description || 'Check out our business profile on Pi Business Market!',
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setToastMessage('Shared successfully!');
      } catch (err) {
        console.error(err);
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      setToastMessage('Business Link copied to clipboard!');
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setToastMessage('Business Link copied to clipboard!');
  };

  const handleExportBusiness = () => {
    if (!business) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ ...business, members, documents: docs }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${business.businessName.toLowerCase().replace(/\s+/g, '_')}_profile.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setToastMessage('Business Profile exported successfully!');
  };

  const handleDeleteBusiness = async () => {
    if (!user || !business) return;
    if (window.confirm(`Are you absolutely sure you want to decommission/delete ${business.businessName}? This action is permanent and irreversible.`)) {
      setSaving(true);
      try {
        await deleteDoc(doc(getFirebaseDb(), 'businesses', business.id));
        setToastMessage('Business successfully decommissioned.');
        setTimeout(() => {
          navigate('/business-dashboard');
        }, 1500);
      } catch (err) {
        console.error(err);
        setToastMessage('Failed to delete business: ' + (err instanceof Error ? err.message : String(err)));
      } finally {
        setSaving(false);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadDocFile(e.dataTransfer.files[0]);
      if (!uploadDocName) {
        setUploadDocName(e.dataTransfer.files[0].name.split('.')[0]);
      }
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.userUid.toLowerCase().includes(memberSearch.toLowerCase()) || 
                          (member.title && member.title.toLowerCase().includes(memberSearch.toLowerCase())) ||
                          (member.department && member.department.toLowerCase().includes(memberSearch.toLowerCase()));
    const matchesRole = memberRoleFilter === 'all' || member.role === memberRoleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredDocs = docs.filter(doc => {
    return docCategoryFilter === 'all' || doc.type === docCategoryFilter;
  });

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans selection:bg-indigo-500/30">
      <Navbar 
        currentUser={user as any} 
        currentView="business_profile" 
        onNavigate={(view) => navigate(`/${view}`)} 
        cartCount={0}
        walletBalance={0}
        onWalletUpdate={() => {}}
        onToggleCart={() => {}} 
      />

      {/* Hero Header Area */}
      <div className="relative h-64 sm:h-80 w-full bg-[#0b0f19] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-transparent z-10" />
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />
        {business.coverImageUrl ? (
          <img src={business.coverImageUrl} className="w-full h-full object-cover opacity-40 filter saturate-125" alt="Enterprise Banner" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/40 via-[#0d1527] to-slate-900/40" />
        )}
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 -mt-32 pb-24">
        {/* Executive Business Identity Card */}
        <div className="bg-[#090e1a]/95 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl mb-8 relative overflow-visible group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-50 pointer-events-none" />
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="w-24 h-24 bg-[#030712] rounded-xl p-1 border border-slate-800/90 shadow-2xl shrink-0 transition-transform duration-300 hover:scale-[1.02]">
                <div className="w-full h-full rounded-lg overflow-hidden bg-[#0d1527] flex items-center justify-center relative group">
                  {business.logoUrl ? (
                    <img src={business.logoUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Business Logo" referrerPolicy="no-referrer" />
                  ) : (
                    <Building2 className="w-10 h-10 text-indigo-400" />
                  )}
                  <div className="absolute inset-0 bg-indigo-950/80 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center cursor-pointer" onClick={() => { setEditForm(business); setIsEditModalOpen(true); }}>
                    <Edit2 className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
 
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">{business.businessName}</h1>
                  <div className="flex items-center gap-1 px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                    <ShieldCheck className="w-3 h-3 text-indigo-400" />
                    <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">{business.verificationStatus}</span>
                  </div>
                  <div className="flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">{business.businessStatus}</span>
                  </div>
                </div>
 
                <p className="text-sm text-slate-400 font-medium max-w-xl line-clamp-2 mb-4 leading-relaxed">
                  {business.description || 'Enterprise identity ready for configurations. Customize branding, set up multi-outlets, manage staff and document compliance.'}
                </p>
 
                <div className="flex flex-wrap gap-y-2 gap-x-4 text-xs font-semibold text-slate-400">
                  <div className="flex items-center gap-1.5 hover:text-white transition-colors cursor-default">
                    <Building2 className="w-4 h-4 text-slate-500" />
                    <span>{business.businessType || 'Private Limited'}</span>
                  </div>
                  <div className="h-4 w-px bg-slate-800 hidden sm:block"></div>
                  <div className="flex items-center gap-1.5 hover:text-white transition-colors cursor-default">
                    <MapPin className="w-4 h-4 text-slate-500" />
                    <span>{business.city}, {business.country}</span>
                  </div>
                  <div className="h-4 w-px bg-slate-800 hidden sm:block"></div>
                  <div className="flex items-center gap-1.5 hover:text-white transition-colors cursor-default">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span>Since {new Date(business.createdAt || Date.now()).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}</span>
                  </div>
                  <div className="h-4 w-px bg-slate-800 hidden sm:block"></div>
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                    <span>Active Now</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { setShowActionMenu(!showActionMenu); setShowMoreMenu(false); }}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-extrabold rounded-xl transition-all shadow-lg shadow-indigo-600/20 border border-indigo-500/50"
                >
                  <Plus className="w-4 h-4" />
                  Quick Action
                </button>
                <button 
                  onClick={() => { setShowMoreMenu(!showMoreMenu); setShowActionMenu(false); }}
                  className="p-3 bg-[#030712] border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl transition-all"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-[#030712] border border-slate-800/85 rounded-2xl p-3 flex items-center gap-4 text-xs font-bold text-slate-400">
                <div className="flex flex-col">
                  <span className="text-slate-500 text-[10px] uppercase tracking-wider">Plan Tier</span>
                  <span className="text-indigo-400 font-extrabold mt-0.5">Enterprise Elite</span>
                </div>
                <div className="w-px h-8 bg-slate-800"></div>
                <div className="flex flex-col">
                  <span className="text-slate-500 text-[10px] uppercase tracking-wider">Stores</span>
                  <span className="text-white font-extrabold mt-0.5">{business.storeCount || 0} Outlets</span>
                </div>
                <div className="w-px h-8 bg-slate-800"></div>
                <div className="flex flex-col">
                  <span className="text-slate-500 text-[10px] uppercase tracking-wider">Completion</span>
                  <span className="text-emerald-400 font-extrabold mt-0.5">{complianceScore}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Panel Dropdown */}
          <AnimatePresence>
            {showActionMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowActionMenu(false)} />
                <motion.div 
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-8 top-full mt-2 w-72 bg-[#0b0f19] border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="p-3 space-y-1">
                    <p className="px-3 py-1.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Primary Actions</p>
                    <button onClick={() => { setShowActionMenu(false); setEditForm(business); setIsEditModalOpen(true); }} className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all group">
                      <div className="flex items-center gap-3"><Edit2 className="w-4 h-4 text-indigo-400" /> Edit Profile</div>
                      <span className="text-[10px] font-bold text-slate-500 bg-[#030712] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">Alt + E</span>
                    </button>
                    <button onClick={() => { setShowActionMenu(false); setShowStoreWizard(true); }} className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all group">
                      <div className="flex items-center gap-3"><Store className="w-4 h-4 text-amber-400" /> Create Store</div>
                      <span className="text-[10px] font-bold text-slate-500 bg-[#030712] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">Alt + S</span>
                    </button>
                    <button onClick={() => { setShowActionMenu(false); setIsInviteModalOpen(true); }} className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all group">
                      <div className="flex items-center gap-3"><UserPlus className="w-4 h-4 text-pink-400" /> Invite Staff</div>
                      <span className="text-[10px] font-bold text-slate-500 bg-[#030712] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">Alt + I</span>
                    </button>
                    <button onClick={() => { setShowActionMenu(false); setIsDocumentModalOpen(true); }} className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all group">
                      <div className="flex items-center gap-3"><Upload className="w-4 h-4 text-emerald-400" /> Upload Document</div>
                      <span className="text-[10px] font-bold text-slate-500 bg-[#030712] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">Alt + U</span>
                    </button>

                    <div className="h-px bg-slate-800/80 my-2" />
                    <p className="px-3 py-1.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Secondary Actions</p>
                    <button onClick={() => { setShowActionMenu(false); setIsSettingsModalOpen(true); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all">
                      <Settings className="w-4 h-4 text-slate-400" /> Console Settings
                    </button>
                    <button onClick={() => { setShowActionMenu(false); handleExportBusiness(); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all">
                      <Share2 className="w-4 h-4 text-slate-400" /> Export Diagnostics
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* More Actions Menu */}
          <AnimatePresence>
            {showMoreMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)} />
                <motion.div 
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-8 top-full mt-2 w-64 bg-[#0b0f19] border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="p-2.5 space-y-1">
                    <p className="px-3 py-1.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Management Options</p>
                    <button 
                      onClick={() => { setShowMoreMenu(false); setIsSettingsModalOpen(true); }} 
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all"
                    >
                      <Settings className="w-4 h-4 text-slate-400" /> Business Settings
                    </button>
                    <button 
                      onClick={() => { 
                        setShowMoreMenu(false); 
                        handleShareBusiness();
                      }} 
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all"
                    >
                      <Share2 className="w-4 h-4 text-slate-400" /> Share Business
                    </button>
                    <button 
                      onClick={() => { 
                        setShowMoreMenu(false); 
                        handleCopyLink();
                      }} 
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all"
                    >
                      <Link className="w-4 h-4 text-slate-400" /> Copy Business Link
                    </button>
                    <button 
                      onClick={() => { 
                        setShowMoreMenu(false); 
                        handleExportBusiness();
                      }} 
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all"
                    >
                      <Download className="w-4 h-4 text-slate-400" /> Export Business
                    </button>
                    <button 
                      onClick={() => { setShowMoreMenu(false); setActiveTab('verification'); }} 
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all"
                    >
                      <ShieldCheck className="w-4 h-4 text-slate-400" /> Verification Status
                    </button>
                    <button 
                      onClick={() => { setShowMoreMenu(false); setActiveTab('activity'); }} 
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all"
                    >
                      <History className="w-4 h-4 text-slate-400" /> Activity Log
                    </button>
                    <div className="h-px bg-slate-800/80 my-1" />
                    <button 
                      onClick={() => { setShowMoreMenu(false); setShowDeleteConfirm(true); }} 
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-rose-400 hover:text-white hover:bg-rose-500/10 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4 text-rose-400" /> Delete Business
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Enterprise Tab Selector */}
        <div className="flex items-center gap-2 mb-8 border-b border-slate-800/85 pb-px overflow-x-auto scrollbar-hide">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'members', label: 'Workforce', icon: Users },
            { id: 'documents', label: 'Document Vault', icon: FileText },
            { id: 'verification', label: 'Compliance & Legal', icon: ShieldCheck },
            { id: 'activity', label: 'Audit Trail', icon: History },
            { id: 'settings', label: 'Settings Hub', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-bold relative transition-colors whitespace-nowrap outline-none ${
                activeTab === tab.id 
                  ? 'text-indigo-400' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Dynamic Content Panel */}
        <div className="min-h-[600px]">
          <AnimatePresence mode="wait">
            
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-8"
              >
                {/* Mathematical Spacing Executive KPI cards */}
                <motion.div 
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: { staggerChildren: 0.05 }
                    }
                  }}
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5"
                >
                  {kpis.map((kpi, i) => (
                    <motion.div 
                      key={i} 
                      variants={{
                        hidden: { opacity: 0, y: 10 },
                        visible: { opacity: 1, y: 0 }
                      }}
                      whileHover={{ y: -4, transition: { duration: 0.2, ease: 'easeOut' } }}
                      className="bg-[#090e1a]/95 border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between hover:border-slate-700/80 transition-all shadow-xl group hover:shadow-indigo-950/10 cursor-default"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-2 rounded-xl ${kpi.bg}`}>
                          <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                        </div>
                        <span className={`text-[10px] font-bold ${kpi.trendColor} uppercase tracking-wider`}>{kpi.trend}</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">{kpi.label}</p>
                        <p className="text-2xl font-bold text-white tracking-tight mt-1">{kpi.val}</p>
                      </div>
                      <div className="w-full bg-[#030712] rounded-full h-1 mt-4 overflow-hidden border border-slate-900">
                        <div className={`h-1 rounded-full ${kpi.color.replace('text-', 'bg-')}`} style={{ width: `${kpi.progress}%` }}></div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Analytical Dashboard Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    {/* Premium Area Chart Visualization */}
                    <div className="bg-[#090e1a]/95 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-xl">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                          <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            Revenue Settlements
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">Live</span>
                          </h3>
                          <p className="text-xs text-slate-500 mt-1">Real-time settlement processing index</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#030712] border border-slate-800/80 rounded-xl text-xs font-bold text-slate-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span> Reconciled
                          </span>
                        </div>
                      </div>
                      
                      {/* Interactive SVG Chart */}
                      <div className="h-64 w-full relative group/chart select-none">
                        {/* Interactive Tooltip Card */}
                        <AnimatePresence>
                          {activeChartIndex !== null && (
                            <motion.div
                              initial={{ opacity: 0, y: -10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -10, scale: 0.95 }}
                              className="absolute top-2 left-6 bg-[#030712]/95 border border-slate-800 p-3 rounded-xl shadow-2xl z-20 space-y-1 backdrop-blur-md pointer-events-none"
                            >
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                {['Jul 01', 'Jul 05', 'Jul 10', 'Jul 15', 'Jul 20', 'Jul 25', 'Jul 29'][activeChartIndex]}
                              </p>
                              <p className="text-sm font-extrabold text-white">
                                {['12,450 Pi', '15,800 Pi', '11,200 Pi', '24,500 Pi', '18,900 Pi', '35,400 Pi', '42,100 Pi'][activeChartIndex]}
                              </p>
                              <div className="flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-emerald-400" />
                                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Settled</span>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>
                          
                          {/* Grid Lines */}
                          <line x1="0" y1="50" x2="600" y2="50" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="4 4" />
                          <line x1="0" y1="100" x2="600" y2="100" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="4 4" />
                          <line x1="0" y1="150" x2="600" y2="150" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="4 4" />
                          
                          {/* Smooth Line Path */}
                          <path d="M 0 160 Q 50 120, 100 150 T 200 90 T 300 130 T 400 60 T 500 80 T 600 30 L 600 200 L 0 200 Z" fill="url(#gradient)" />
                          <path d="M 0 160 Q 50 120, 100 150 T 200 90 T 300 130 T 400 60 T 500 80 T 600 30" fill="none" stroke="rgb(99, 102, 241)" strokeWidth="3" />

                          {/* Hover Crosshair Vertical Line */}
                          {activeChartIndex !== null && (
                            <line
                              x1={activeChartIndex * 100}
                              y1={0}
                              x2={activeChartIndex * 100}
                              y2={200}
                              stroke="rgba(99, 102, 241, 0.4)"
                              strokeWidth="1.5"
                              strokeDasharray="3 3"
                            />
                          )}

                          {/* Data points */}
                          {[160, 140, 155, 100, 125, 70, 30].map((yVal, index) => (
                            <g key={index}>
                              {activeChartIndex === index && (
                                <circle
                                  cx={index * 100}
                                  cy={yVal}
                                  r="8"
                                  fill="rgba(99, 102, 241, 0.25)"
                                />
                              )}
                              <circle
                                cx={index * 100}
                                cy={yVal}
                                r="4"
                                fill={activeChartIndex === index ? 'rgb(99, 102, 241)' : '#030712'}
                                stroke="rgb(99, 102, 241)"
                                strokeWidth="2.5"
                                className="transition-all duration-150 cursor-pointer"
                                onMouseEnter={() => setActiveChartIndex(index)}
                                onMouseLeave={() => setActiveChartIndex(null)}
                              />
                            </g>
                          ))}
                        </svg>

                        <div className="absolute inset-0 flex justify-between px-2 text-[10px] font-semibold text-slate-500 pointer-events-none items-end pb-1">
                          <span>Jul 01</span>
                          <span>Jul 05</span>
                          <span>Jul 10</span>
                          <span>Jul 15</span>
                          <span>Jul 20</span>
                          <span>Jul 25</span>
                          <span>Jul 29</span>
                        </div>
                      </div>
                    </div>

                    {/* Customer Growth Metric Card */}
                    <div className="bg-[#090e1a]/95 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-xl">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-bold text-white">Customer Engagement</h3>
                          <p className="text-xs text-slate-500 mt-1">Growth of unique business followers & reach</p>
                        </div>
                        <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg">+18% Monthly</span>
                      </div>
                      <div className="h-24 w-full relative">
                        <svg className="w-full h-full" viewBox="0 0 500 100" preserveAspectRatio="none">
                          <path d="M0 80 Q 125 40, 250 60 T 500 20 L 500 100 L 0 100 Z" fill="rgba(236, 72, 153, 0.05)" />
                          <path d="M0 80 Q 125 40, 250 60 T 500 20" fill="none" stroke="rgb(236, 72, 153)" strokeWidth="2.5" />
                        </svg>
                      </div>
                    </div>

                    {/* Pending Approvals / Recent Orders Table */}
                    <div className="bg-[#090e1a]/95 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-xl">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-bold text-white">Latest Activity & Settlements</h3>
                          <p className="text-xs text-slate-500 mt-1">Pending approvals for new outlet stores</p>
                        </div>
                        <span className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer">Export Ledger</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-slate-800/80 text-slate-500 text-xs uppercase tracking-widest">
                              <th className="pb-3 font-bold">Origin Store</th>
                              <th className="pb-3 font-bold">Transaction/Identity</th>
                              <th className="pb-3 font-bold">Type</th>
                              <th className="pb-3 font-bold">Compliance Status</th>
                              <th className="pb-3 font-bold text-right">Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {business.storeCount === 0 ? (
                              <tr>
                                <td colSpan={5} className="py-8 text-center text-slate-500 font-medium">
                                  No stores detected. Create a store using the Quick Actions menu to launch sales.
                                </td>
                              </tr>
                            ) : (
                              <tr className="text-slate-300 hover:bg-slate-800/10 transition-colors">
                                <td className="py-4 font-bold text-white">Central HQ Store</td>
                                <td className="py-4 font-mono text-xs">TX_9A12E8B901</td>
                                <td className="py-4">Settlement</td>
                                <td className="py-4">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400">Success</span>
                                </td>
                                <td className="py-4 text-right font-extrabold text-white">1,420 Pi</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Sidebar stats column */}
                  <div className="space-y-8">
                    {/* Health & Compliance Score Rings */}
                    <div className="bg-[#090e1a]/95 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-xl text-center">
                      <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider mb-6">Enterprise Scoring</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-[#030712] border border-slate-800/60 rounded-xl flex flex-col items-center hover:border-slate-700/60 transition-colors">
                          <div className="relative w-16 h-16 mb-2">
                            <svg className="w-full h-full transform -rotate-90">
                              <circle cx="32" cy="32" r="28" stroke="#1e293b" strokeWidth="4" fill="transparent" />
                              <circle cx="32" cy="32" r="28" stroke="#10b981" strokeWidth="4" fill="transparent" strokeDasharray={`${2 * Math.PI * 28}`} strokeDashoffset={`${2 * Math.PI * 28 * (1 - healthScore/100)}`} strokeLinecap="round" />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-extrabold text-white">{healthScore}</span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Health Score</span>
                        </div>

                        <div className="p-4 bg-[#030712] border border-slate-800/60 rounded-xl flex flex-col items-center hover:border-slate-700/60 transition-colors">
                          <div className="relative w-16 h-16 mb-2">
                            <svg className="w-full h-full transform -rotate-90">
                              <circle cx="32" cy="32" r="28" stroke="#1e293b" strokeWidth="4" fill="transparent" />
                              <circle cx="32" cy="32" r="28" stroke="#6366f1" strokeWidth="4" fill="transparent" strokeDasharray={`${2 * Math.PI * 28}`} strokeDashoffset={`${2 * Math.PI * 28 * (1 - complianceScore/100)}`} strokeLinecap="round" />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-extrabold text-white">{complianceScore}</span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Compliance Score</span>
                        </div>
                      </div>
                    </div>

                    {/* Verification Timeline */}
                    <div className="bg-[#090e1a]/95 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-xl">
                      <h3 className="text-base font-bold text-white mb-6">Compliance Journey</h3>
                      <div className="space-y-6">
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-6 h-6 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 shrink-0">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                            <div className="w-0.5 h-12 bg-slate-800"></div>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">Registry Incorporation</p>
                            <p className="text-xs text-slate-500 font-semibold mt-1">Verified primary corporate files and registration records</p>
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-6 h-6 ${docs.length > 0 ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'} rounded-full flex items-center justify-center shrink-0`}>
                              {docs.length > 0 ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                            </div>
                            <div className="w-0.5 h-12 bg-slate-800"></div>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">Document Compliance</p>
                            <p className="text-xs text-slate-500 font-semibold mt-1">{docs.length > 0 ? `${docs.length} documents uploaded and indexed` : 'Identity & tax documents pending upload'}</p>
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-6 h-6 ${business.verificationStatus === 'Verified' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-slate-900 border border-slate-800 text-slate-600'} rounded-full flex items-center justify-center shrink-0`}>
                              {business.verificationStatus === 'Verified' ? <Check className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">Authority Audit</p>
                            <p className="text-xs text-slate-500 font-semibold mt-1">{business.verificationStatus === 'Verified' ? 'Verified merchant authority status activated' : 'Under analysis by system authorities'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Upcoming Expiry Alerts / Notifications */}
                    <div className="bg-[#090e1a]/95 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-xl">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-bold text-white">System Security Advisories</h3>
                        <Bell className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="space-y-4">
                        <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex items-start gap-3">
                          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-white">Branding Setup Available</p>
                            <p className="text-[10px] text-slate-500 mt-1 font-semibold">You can fully customize your business color themes and logos under Setup.</p>
                          </div>
                        </div>
                        {docs.some(doc => doc.expiryDate) && (
                          <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-start gap-3">
                            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-bold text-white">License Review Approaching</p>
                              <p className="text-[10px] text-slate-500 mt-1 font-semibold">A document in your vault is scheduled for automatic recurring review.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STAFF / WORKFORCE TAB */}
            {activeTab === 'members' && (
              <motion.div 
                key="members"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                  <div>
                    <h2 className="text-xl font-bold text-white">Workforce Directory</h2>
                    <p className="text-sm text-slate-500 mt-1">Manage corporate staff access and operational permissions.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text" 
                        placeholder="Search workspace..." 
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                        className="w-full bg-[#0b0f19] border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" 
                      />
                    </div>
                    <select 
                      value={memberRoleFilter}
                      onChange={(e) => setMemberRoleFilter(e.target.value)}
                      className="bg-[#0b0f19] border border-slate-800 text-slate-300 text-xs font-bold rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
                    >
                      <option value="all">All Roles</option>
                      <option value="Owner">Owner</option>
                      <option value="Super Admin">Super Admin</option>
                      <option value="Business Admin">Business Admin</option>
                      <option value="Employee">Employee</option>
                    </select>
                    <button onClick={() => setIsInviteModalOpen(true)} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20">
                      <UserPlus className="w-4 h-4" />
                      Invite Staff
                    </button>
                  </div>
                </div>

                <div className="bg-[#090e1a]/95 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#030712]/50">
                        <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase tracking-widest">
                          <th className="px-8 py-5 font-bold">Employee Identity</th>
                          <th className="px-8 py-5 font-bold">Functional Department</th>
                          <th className="px-8 py-5 font-bold">Permissions Set</th>
                          <th className="px-8 py-5 font-bold">Operational Status</th>
                          <th className="px-8 py-5 font-bold">Onboard Date</th>
                          <th className="px-8 py-5 font-bold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {filteredMembers.map(member => (
                          <tr key={member.memberId} className="hover:bg-slate-800/10 transition-colors">
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-[#030712] border border-slate-800 rounded-full flex items-center justify-center font-bold text-indigo-400 shrink-0">
                                  {member.userUid.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-bold text-white">{member.userUid}</p>
                                  <p className="text-xs text-slate-500 mt-0.5">{member.role}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <div>
                                <p className="font-bold text-slate-200">{member.department || 'HQ Operations'}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{member.title || 'Staff member'}</p>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex flex-wrap gap-1.5">
                                {member.permissions.map((p, idx) => (
                                  <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-[#030712] border border-slate-800 text-indigo-300">
                                    {p}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div> {member.status === 'active' ? 'Authorized' : 'Suspended'}
                              </div>
                            </td>
                            <td className="px-8 py-5 text-slate-400 text-xs font-semibold">
                              {new Date(member.joinedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            </td>
                            <td className="px-8 py-5 text-right flex items-center justify-end gap-2">
                              {member.role !== 'Owner' && (
                                <button 
                                  onClick={() => {
                                    setEditingMember(member);
                                    setEditMemberRole(member.role);
                                    setEditMemberTitle(member.title || 'Staff member');
                                    setEditMemberDepartment(member.department || 'HQ Operations');
                                    setEditMemberStatus(member.status || 'active');
                                    setEditMemberPermissions(member.permissions || []);
                                  }}
                                  className="p-2 text-slate-500 hover:text-indigo-400 rounded-lg hover:bg-indigo-500/10 transition-colors"
                                  title="Edit Credentials"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              )}
                              {member.role !== 'Owner' && (
                                <button 
                                  onClick={async () => {
                                    if (!user || !business) return;
                                    try {
                                      await businessMemberService.removeMember(business.id, member.memberId, user.uid, user.displayName || user.email || 'Owner');
                                      const newCount = Math.max(1, (business.employeeCount || 1) - 1);
                                      await businessService.updateBusiness(business.id, user.uid, user.displayName || user.email || 'Owner', {
                                        employeeCount: newCount
                                      });
                                      const [updatedMembers, updatedBiz] = await Promise.all([
                                        businessMemberService.getBusinessMembers(business.id),
                                        businessService.getBusiness(business.id)
                                      ]);
                                      setMembers(updatedMembers);
                                      if (updatedBiz) setBusiness(updatedBiz);
                                      setToastMessage('Workforce directory updated successfully.');
                                    } catch (err) {
                                      console.error(err);
                                      setToastMessage('Failed to remove workforce member');
                                    }
                                  }}
                                  className="p-2 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                                  title="Remove Member"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {filteredMembers.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-16 text-center text-slate-500 font-bold uppercase tracking-wider text-xs">No personnel matching query criteria found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* DOCUMENT VAULT TAB */}
            {activeTab === 'documents' && (
              <motion.div 
                key="documents"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                  <div>
                    <h2 className="text-xl font-bold text-white">Document Vault</h2>
                    <p className="text-sm text-slate-500 mt-1">Secure repository for merchant identity verification, registration, and licenses.</p>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <select 
                      value={docCategoryFilter}
                      onChange={(e) => setDocCategoryFilter(e.target.value)}
                      className="bg-[#090e1a]/95 border border-slate-800/80 text-slate-300 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-indigo-500"
                    >
                      <option value="all">All Documents</option>
                      <option value="Registration">Registration Certificates</option>
                      <option value="GST">GST Filings</option>
                      <option value="PAN">PAN Cards</option>
                      <option value="TradeLicense">Trade Licenses</option>
                      <option value="IdentityProof">Identity Proofs</option>
                      <option value="AddressProof">Address Proofs</option>
                      <option value="Tax">Tax Compliance</option>
                      <option value="Other">Other Files</option>
                    </select>
                    <button onClick={() => setIsDocumentModalOpen(true)} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 shrink-0">
                      <Upload className="w-4 h-4" /> Secure Upload
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredDocs.map(doc => (
                    <div key={doc.documentId} className="bg-[#090e1a]/95 border border-slate-800/80 rounded-2xl p-6 sm:p-8 group hover:border-indigo-500/40 transition-all relative overflow-hidden shadow-xl flex flex-col">
                      <div className="absolute top-0 right-0 p-6">
                         <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${doc.status === 'valid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                           {doc.status.replace('_', ' ')}
                         </span>
                      </div>
                      <div className="w-12 h-12 bg-[#030712] border border-slate-800 rounded-2xl flex items-center justify-center mb-6 text-indigo-400 group-hover:scale-105 transition-transform">
                        <FileText className="w-5 h-5" />
                      </div>
                      <h3 className="text-base font-bold text-white mb-1 truncate pr-16">{doc.name}</h3>
                      <p className="text-xs text-slate-500 mb-6 font-semibold">{doc.type}</p>
                      
                      {doc.expiryDate && (
                        <div className="mb-6 flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                          <FileClock className="w-4 h-4 text-slate-500" />
                          <span>Expires: {new Date(doc.expiryDate).toLocaleDateString()}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between border-t border-slate-800/60 pt-5 mt-auto">
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Version {doc.version}</span>
                        <div className="flex items-center gap-2">
                          <a href={doc.url} target="_blank" rel="noreferrer" className="p-2 bg-[#030712] hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-400 transition-colors" title="View Document">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button 
                            onClick={async () => {
                              if (!user || !business) return;
                              if (confirm(`Are you sure you want to permanently delete "${doc.name}" from the compliance vault?`)) {
                                try {
                                  await businessVerificationService.deleteDocument(business.id, doc.documentId, user.uid, user.displayName || user.email || 'Owner');
                                  const docData = await businessVerificationService.getBusinessDocuments(business.id);
                                  setDocs(docData);
                                  setToastMessage('Document removed from compliance vault.');
                                } catch (err) {
                                  console.error(err);
                                  setToastMessage('Failed to delete document.');
                                }
                              }
                            }}
                            className="p-2 bg-[#030712] hover:bg-rose-500/15 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                            title="Delete Document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {filteredDocs.length === 0 && (
                    <div className="col-span-full border border-dashed border-slate-800 rounded-2xl p-16 flex flex-col items-center justify-center text-center bg-[#090e1a]/30">
                      <FileCheck className="w-16 h-16 text-slate-700 mb-6 animate-pulse" />
                      <h3 className="text-lg font-bold text-white mb-2">Compliance Vault Empty</h3>
                      <p className="text-sm text-slate-500 max-w-sm mb-8 font-semibold">Upload tax registries, GST registrations, business incorporation, and identity files to meet compliance requirements.</p>
                      <button onClick={() => setIsDocumentModalOpen(true)} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/20">Add Corporate Document</button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* COMPLIANCE & LEGAL TAB */}
            {activeTab === 'verification' && (
              <motion.div 
                key="verification"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-[#090e1a]/95 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-xl">
                    <h2 className="text-xl font-bold text-white mb-8">Executive Verification Console</h2>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-5 bg-[#030712] border border-slate-800 rounded-2xl">
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Business Incorporation Name</p>
                          <p className="text-sm font-bold text-white">{business.legalName || business.businessName}</p>
                        </div>
                        <ShieldCheck className="w-6 h-6 text-indigo-400" />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="p-5 bg-[#030712] border border-slate-800 rounded-2xl">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Corporate PAN / Tax Identification</p>
                          <p className="text-sm font-mono text-white">{business.panNumber || 'TAX_IN_98B12A0'}</p>
                        </div>
                        <div className="p-5 bg-[#030712] border border-slate-800 rounded-2xl">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">GST Identification Code</p>
                          <p className="text-sm font-mono text-white">{business.gstNumber || 'GST_IND_29AADF120A'}</p>
                        </div>
                      </div>

                      <div className="p-5 bg-[#030712] border border-slate-800 rounded-2xl">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Marketplace Wallet Authority Address</p>
                        <p className="text-sm font-mono text-indigo-400 break-all">{business.walletAddress || 'GCP_PI_WALLET_RESERVE_6A901F'}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-8">
                  <div className="bg-[#090e1a]/95 border border-slate-800/80 rounded-2xl p-6 sm:p-8 text-center shadow-xl">
                    <div className="w-24 h-24 mx-auto bg-[#030712] border-4 border-slate-800 rounded-full flex items-center justify-center mb-6 relative shadow-inner">
                      <ShieldAlert className={`w-10 h-10 ${business.verificationStatus === 'Verified' ? 'text-emerald-500' : 'text-indigo-400'}`} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {business.verificationStatus} Merchant
                    </h3>
                    <p className="text-sm text-slate-500 mb-8 font-semibold">
                      {business.verificationStatus === 'Verified' ? 'Your corporate identity has passed all system regulatory requirements and is fully authorized.' : 'Your business verification audit is being evaluated by network compliance systems.'}
                    </p>
                    <button className="w-full py-3.5 bg-[#030712] border border-slate-800 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors">
                      Regulatory Compliance Standards
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* AUDIT TIMELINE TAB */}
            {activeTab === 'activity' && (
              <motion.div 
                key="activity"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="max-w-4xl"
              >
                <div className="mb-10">
                  <h2 className="text-xl font-bold text-white">Enterprise Audit Logs</h2>
                  <p className="text-sm text-slate-500 mt-1">Immutable, system-authoritative audit trace for verification and compliance compliance auditing.</p>
                </div>
                
                <div className="relative pl-10 border-l-2 border-slate-800/80 space-y-10">
                  {[
                    { action: 'Corporate Security Key Verified', user: 'Secure Token Authority', time: 'Just now', icon: Key, desc: 'API gateway authorized requests with root authority client credentials' },
                    { action: 'Settlement Ledger Reconciled', user: 'Automatic Clearing House', time: '1 hour ago', icon: CreditCard, desc: 'Reconciled 1,420 Pi network transactions against central accounting records' },
                    { action: 'Workforce Credentials Updated', user: user?.displayName || 'Owner', time: 'Yesterday', icon: Users, desc: 'Granted system permissions and functional roles to invited staff directories' },
                    { action: 'Identity Documents Indexed', user: 'System OCR Engine', time: '3 days ago', icon: FileText, desc: 'Extracted structural registration and PAN info from corporate document vault' },
                    { action: 'Enterprise Entity Initialized', user: 'Platform Ledger', time: 'Over a week ago', icon: Building2, desc: 'Created verified merchant unit ID and provisioned private databases' },
                  ].map((log, i) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-[54px] bg-[#030712] p-2 rounded-full border border-slate-800 text-slate-400 shadow-xl">
                        <log.icon className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="bg-[#090e1a]/95 border border-slate-800/80 p-6 rounded-2xl shadow-xl">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                          <p className="text-base font-bold text-white">{log.action}</p>
                          <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest bg-[#030712] px-2.5 py-1 rounded-lg border border-slate-800/80">{log.time}</span>
                        </div>
                        <p className="text-sm text-slate-400 font-medium mb-4">{log.desc}</p>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          <span>Operator: {log.user}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                          <span>Audit Type: System System</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* SETUP HUB / SETTINGS TAB */}
            {activeTab === 'settings' && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12"
              >
                <div className="md:col-span-1 space-y-1">
                  {[
                    { id: 'general', label: 'Company Profile', icon: Settings },
                    { id: 'branding', label: 'Identity & Logos', icon: ImageIcon },
                    { id: 'security', label: 'API & Credentials', icon: Key },
                    { id: 'notifications', label: 'Advisories & Alerts', icon: Bell },
                    { id: 'payment', label: 'Payment & Plans', icon: CreditCard },
                    { id: 'backup', label: 'Backup & Recovery', icon: Download },
                  ].map(item => (
                    <button 
                      key={item.id} 
                      onClick={() => setActiveSettingsTab(item.id as any)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold rounded-xl transition-all ${activeSettingsTab === item.id ? 'bg-indigo-600/10 text-indigo-400 border-l-2 border-indigo-500 rounded-l-none' : 'text-slate-500 hover:bg-slate-900/40 hover:text-slate-300'}`}
                    >
                      <item.icon className="w-4 h-4" /> {item.label}
                    </button>
                  ))}
                </div>
                <div className="md:col-span-3 space-y-8">
                  {activeSettingsTab === 'general' && (
                    <>
                      <div className="bg-[#090e1a]/95 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-xl">
                        <div className="flex justify-between items-center mb-8">
                          <h3 className="text-lg font-bold text-white">Corporate Metadata Settings</h3>
                          <button 
                            onClick={() => setIsSettingsModalOpen(true)}
                            className="px-4 py-2 bg-[#030712] border border-slate-800 hover:border-slate-700 text-indigo-400 hover:text-indigo-300 rounded-xl text-xs font-bold transition-all"
                          >
                            Edit Business Details
                          </button>
                        </div>
                        <div className="space-y-8 max-w-2xl">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Enterprise Mission Statement</label>
                            <p className="text-sm font-medium text-slate-300 p-5 bg-[#030712] border border-slate-800 rounded-2xl leading-relaxed">{business.description || 'Enterprise identity ready for configurations. Customize branding, set up multi-outlets, manage staff and document compliance.'}</p>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                             <div>
                               <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Primary Sector</label>
                               <p className="text-sm font-bold text-white p-4 bg-[#030712] border border-slate-800 rounded-2xl">{business.category}</p>
                             </div>
                             <div>
                               <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Sub-Industry Designation</label>
                               <p className="text-sm font-bold text-white p-4 bg-[#030712] border border-slate-800 rounded-2xl">{business.industry || 'Marketplace merchant'}</p>
                             </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                             <div>
                               <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Contact Email Address</label>
                               <p className="text-sm font-mono text-white p-4 bg-[#030712] border border-slate-800 rounded-2xl">{business.email || 'corporate@partner.pi'}</p>
                             </div>
                             <div>
                               <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Enterprise Phone Line</label>
                               <p className="text-sm font-mono text-white p-4 bg-[#030712] border border-slate-800 rounded-2xl">{business.phone || '+1 (555) 902-1200'}</p>
                             </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-6 sm:p-8 shadow-xl">
                        <h3 className="text-lg font-bold text-rose-400 mb-2">Decommission Console</h3>
                        <p className="text-sm font-semibold text-slate-400 mb-8">Permanently archive files, stores, settlements, and compliance credentials. This is irreversible.</p>
                        <button 
                          onClick={() => setShowDeleteConfirm(true)}
                          className="px-6 py-3.5 bg-rose-600 hover:bg-rose-500 text-white text-sm font-extrabold rounded-xl transition-all shadow-lg shadow-rose-600/20"
                        >
                          Request Decommissioning
                        </button>
                      </div>
                    </>
                  )}

                  {activeSettingsTab === 'branding' && (
                    <div className="bg-[#090e1a]/95 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-xl">
                      <h3 className="text-lg font-bold text-white mb-6">Identity & Logos</h3>
                      <p className="text-sm text-slate-400 mb-8">Configure public-facing assets, cover banners, and interface presets.</p>
                      
                      <div className="space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                          <div className="p-6 bg-[#030712] border border-slate-800/80 rounded-2xl">
                            <h4 className="text-sm font-bold text-slate-200 mb-4">Enterprise Logo</h4>
                            <div className="flex items-center gap-6">
                              <div className="w-20 h-20 bg-[#0d1527] border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center">
                                {business.logoUrl ? (
                                  <img src={business.logoUrl} className="w-full h-full object-cover" alt="Logo" />
                                ) : (
                                  <Building2 className="w-8 h-8 text-indigo-400" />
                                )}
                              </div>
                              <button 
                                onClick={() => { setEditForm(business); setIsEditModalOpen(true); }}
                                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all"
                              >
                                Change Logo
                              </button>
                            </div>
                          </div>

                          <div className="p-6 bg-[#030712] border border-slate-800/80 rounded-2xl">
                            <h4 className="text-sm font-bold text-slate-200 mb-4">Banner Cover</h4>
                            <div className="flex items-center gap-6">
                              <div className="w-28 h-14 bg-[#0d1527] border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center">
                                {business.coverImageUrl ? (
                                  <img src={business.coverImageUrl} className="w-full h-full object-cover" alt="Cover" />
                                ) : (
                                  <ImageIcon className="w-6 h-6 text-slate-600" />
                                )}
                              </div>
                              <button 
                                onClick={() => { setEditForm(business); setIsEditModalOpen(true); }}
                                className="px-4 py-2.5 bg-[#0b0f19] border border-slate-800 hover:border-slate-700 text-white text-xs font-bold rounded-xl transition-all"
                              >
                                Change Banner
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="p-6 bg-[#030712] border border-slate-800/80 rounded-2xl">
                          <h4 className="text-sm font-bold text-slate-200 mb-3">Interface Accent Color</h4>
                          <p className="text-xs text-slate-500 mb-6">Choose an enterprise color brand theme for client portals.</p>
                          <div className="flex items-center gap-4">
                            {[
                              { name: 'Indigo Blue', color: 'bg-indigo-600' },
                              { name: 'Emerald Mint', color: 'bg-emerald-500' },
                              { name: 'Golden Amber', color: 'bg-amber-500' },
                              { name: 'Rose Red', color: 'bg-rose-500' },
                              { name: 'Royal Violet', color: 'bg-violet-600' },
                            ].map((preset, idx) => (
                              <button 
                                key={idx}
                                onClick={() => setToastMessage(`Accent theme set to ${preset.name}!`)}
                                className={`w-10 h-10 rounded-full ${preset.color} hover:scale-105 active:scale-95 transition-all border-4 border-transparent hover:border-white shadow-lg`}
                                title={preset.name}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSettingsTab === 'security' && (
                    <div className="bg-[#090e1a]/95 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-xl">
                      <h3 className="text-lg font-bold text-white mb-6">API & Credentials</h3>
                      <p className="text-sm text-slate-400 mb-8">Deploy enterprise credentials for point-of-sale systems, supply chain APIs, or merchant integration gateways.</p>
                      
                      <div className="space-y-6">
                        <div className="p-6 bg-[#030712] border border-slate-800/80 rounded-2xl">
                          <div className="flex justify-between items-center mb-3">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Merchant Live API Key</label>
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Live Secret</span>
                          </div>
                          <div className="flex gap-3">
                            <input 
                              type="password" 
                              readOnly 
                              value={apiKey} 
                              className="w-full bg-[#0b0f19] border border-slate-800 text-slate-400 font-mono text-xs px-4 py-3 rounded-xl focus:outline-none" 
                            />
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(apiKey);
                                setToastMessage('API Key copied to clipboard!');
                              }}
                              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shrink-0"
                            >
                              Copy Key
                            </button>
                            <button 
                              onClick={() => {
                                const newKey = 'pi_live_' + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
                                setApiKey(newKey);
                                setToastMessage('New API key generated successfully!');
                              }}
                              className="px-4 py-3 bg-[#0b0f19] border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all"
                            >
                              Regenerate
                            </button>
                          </div>
                        </div>

                        <div className="p-6 bg-[#030712] border border-slate-800/80 rounded-2xl space-y-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-bold text-slate-200">Multi-Factor Authentication (MFA)</h4>
                              <p className="text-xs text-slate-500 mt-1">Enforce two-step login keys for high-clearance admin operators.</p>
                            </div>
                            <button 
                              onClick={() => {
                                setMfaEnabled(!mfaEnabled);
                                setToastMessage(`MFA protection ${!mfaEnabled ? 'activated' : 'deactivated'}.`);
                              }}
                              className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${mfaEnabled ? 'bg-indigo-600' : 'bg-slate-800'}`}
                            >
                              <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${mfaEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                          </div>

                          <div className="h-px bg-slate-800/60" />

                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-bold text-slate-200">Strict IP Whitelisting</h4>
                              <p className="text-xs text-slate-500 mt-1">Allow API calls and dashboard login requests only from authorized office IPs.</p>
                            </div>
                            <button 
                              onClick={() => setToastMessage('IP Restriction list set to Global Access by default.')}
                              className="px-4 py-2 bg-[#0b0f19] border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white text-xs font-bold rounded-xl transition-all"
                            >
                              Manage IPs
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSettingsTab === 'notifications' && (
                    <div className="bg-[#090e1a]/95 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-xl">
                      <h3 className="text-lg font-bold text-white mb-6">Advisories & Alerts</h3>
                      <p className="text-sm text-slate-400 mb-8">Manage how systems send security advisories, ledger status reports, and network alerts.</p>
                      
                      <div className="space-y-6 bg-[#030712] border border-slate-800/80 p-6 rounded-2xl">
                        {[
                          { title: 'Email Alerts', desc: 'Recieve legal documents filings, outlet listings approvals, and ledger settlements notifications.', val: notifyEmail, set: setNotifyEmail },
                          { title: 'SMS Transaction Codes', desc: 'Secure phone codes dispatched on corporate wallet payouts or decommission requests.', val: notifySms, set: setNotifySms },
                          { title: 'Weekly Audit Logs Reports', desc: 'Compiled diagnostic spreadsheet trace of compliance activity logs and database operations.', val: notifyWeeklyAudit, set: setNotifyWeeklyAudit },
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0 border-b last:border-0 border-slate-800/60">
                            <div>
                              <h4 className="text-sm font-bold text-slate-200">{item.title}</h4>
                              <p className="text-xs text-slate-500 mt-1 max-w-md leading-relaxed">{item.desc}</p>
                            </div>
                            <button 
                              onClick={() => {
                                item.set(!item.val);
                                setToastMessage(`${item.title} settings updated.`);
                              }}
                              className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none shrink-0 ${item.val ? 'bg-indigo-600' : 'bg-slate-800'}`}
                            >
                              <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${item.val ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeSettingsTab === 'payment' && (
                    <div className="bg-[#090e1a]/95 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-xl space-y-8">
                      <div>
                        <h3 className="text-lg font-bold text-white mb-2">Payment & Plans</h3>
                        <p className="text-sm text-slate-400">Configure your network subscription, payment nodes, and billing history.</p>
                      </div>

                      <div className="p-6 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                        <div>
                          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Active Billing tier</span>
                          <h4 className="text-xl font-extrabold text-white mt-1">Enterprise Elite Plan</h4>
                          <p className="text-xs text-slate-400 mt-1">Billed monthly at 1,000 Pi Network tokens. Next renew date: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                        </div>
                        <button 
                          onClick={() => setToastMessage('Elite plan renewed for 30 days! Transaction logged in Pi ledger.')}
                          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20"
                        >
                          Manual Renewal
                        </button>
                      </div>

                      <div className="bg-[#030712] border border-slate-800/80 rounded-2xl p-6">
                        <h4 className="text-sm font-bold text-slate-200 mb-4">Saved Billing Authority</h4>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-7 bg-[#0b0f19] border border-slate-800 rounded flex items-center justify-center font-mono text-[10px] font-extrabold text-indigo-400">PI</div>
                            <div>
                              <p className="text-xs font-bold text-slate-300">Pi Wallet Reserve Node</p>
                              <p className="text-[10px] font-mono text-slate-500 mt-0.5">wallet_auth_node_10a72...</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => setToastMessage('Please connect your Pi Browser or Pi Wallet to update authority.')}
                            className="px-4 py-2 bg-[#0b0f19] border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white text-xs font-bold rounded-xl transition-all"
                          >
                            Edit Node
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSettingsTab === 'backup' && (
                    <div className="bg-[#090e1a]/95 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-xl space-y-8">
                      <div>
                        <h3 className="text-lg font-bold text-white mb-2">Backup & Recovery</h3>
                        <p className="text-sm text-slate-400">Export structural data archives, restore offline configurations, or migrate assets.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="p-6 bg-[#030712] border border-slate-800/80 rounded-2xl flex flex-col justify-between">
                          <div>
                            <Download className="w-8 h-8 text-indigo-400 mb-4" />
                            <h4 className="text-base font-bold text-white mb-1">Corporate Data Export</h4>
                            <p className="text-xs text-slate-500 leading-relaxed mb-6">Download a complete cryptographically authenticated JSON profile holding business configuration, staff rosters, and document indices.</p>
                          </div>
                          <button 
                            onClick={handleExportBusiness}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg"
                          >
                            Download Profile JSON
                          </button>
                        </div>

                        <div className="p-6 bg-[#030712] border border-slate-800/80 rounded-2xl flex flex-col justify-between">
                          <div>
                            <Upload className="w-8 h-8 text-amber-400 mb-4" />
                            <h4 className="text-base font-bold text-white mb-1">Restore Profile Configuration</h4>
                            <p className="text-xs text-slate-500 leading-relaxed mb-6">Re-import a previously exported JSON backup file to instantly override and restore all business metadata, details, and properties.</p>
                          </div>
                          <div className="relative">
                            <input 
                              type="file" 
                              id="backupFile" 
                              accept=".json" 
                              className="hidden" 
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file || !user || !business) return;
                                try {
                                  const text = await file.text();
                                  const parsed = JSON.parse(text);
                                  if (!parsed.businessName) {
                                    throw new Error('Invalid backup format: missing businessName');
                                  }
                                  
                                  const updatePayload = {
                                    businessName: parsed.businessName,
                                    description: parsed.description || '',
                                    city: parsed.city || '',
                                    country: parsed.country || '',
                                    email: parsed.email || '',
                                    phone: parsed.phone || '',
                                    businessType: parsed.businessType || 'Private Limited',
                                    category: parsed.category || '',
                                    gstNumber: parsed.gstNumber || '',
                                    panNumber: parsed.panNumber || ''
                                  };

                                  await businessService.updateBusiness(business.id, user.uid, user.displayName || user.email || 'Owner', updatePayload);
                                  const updatedBiz = await businessService.getBusiness(business.id);
                                  if (updatedBiz) setBusiness(updatedBiz);
                                  setToastMessage('Profile restored successfully from JSON backup!');
                                } catch (err) {
                                  console.error(err);
                                  alert('Failed to restore backup: ' + (err instanceof Error ? err.message : String(err)));
                                }
                              }}
                            />
                            <label 
                              htmlFor="backupFile" 
                              className="w-full inline-flex items-center justify-center py-3 bg-[#0b0f19] border border-slate-800 hover:border-slate-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer text-center font-bold"
                            >
                              Upload Backup File
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* Edit Corporate Information Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[#090e1a]/95 backdrop-blur-md border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-bold text-white">Edit Corporate Profile</h2>
                  <p className="text-sm text-slate-500 mt-1">Configure business identifiers, branding, and registration locales.</p>
                </div>
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2.5 bg-[#030712] hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all border border-slate-800/80"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {updateError && (
                <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-bold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {updateError}
                </div>
              )}

              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Corporate Brand Mark (Logo)</label>
                    <div className="relative group">
                      <div className="w-24 h-24 bg-[#030712] border-2 border-dashed border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center group-hover:border-indigo-500 transition-colors">
                        {logoFile ? (
                          <img src={URL.createObjectURL(logoFile)} alt="Preview" className="w-full h-full object-cover" />
                        ) : editForm.logoUrl ? (
                          <img src={editForm.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-slate-600" />
                        )}
                      </div>
                      <label className="absolute inset-0 flex flex-col items-center justify-center bg-indigo-950/80 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl">
                        <Upload className="w-5 h-5 mb-1" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Change</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Enterprise Banner Hero</label>
                    <div className="relative group">
                      <div className="w-full h-24 bg-[#030712] border-2 border-dashed border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center group-hover:border-indigo-500 transition-colors">
                        {coverFile ? (
                          <img src={URL.createObjectURL(coverFile)} alt="Preview" className="w-full h-full object-cover" />
                        ) : editForm.coverImageUrl ? (
                          <img src={editForm.coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-slate-600" />
                        )}
                      </div>
                      <label className="absolute inset-0 flex flex-col items-center justify-center bg-indigo-950/80 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl">
                        <Upload className="w-5 h-5 mb-1" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Change</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Registered Trading Name</label>
                  <input 
                    type="text"
                    value={editForm.businessName || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, businessName: e.target.value }))}
                    className="w-full bg-[#030712] border border-slate-800 rounded-xl px-4 py-3.5 text-sm font-bold text-white focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Metropolitan HQ City</label>
                    <input 
                      type="text"
                      value={editForm.city || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full bg-[#030712] border border-slate-800 rounded-xl px-4 py-3.5 text-sm font-bold text-white focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Sovereign State Locale</label>
                    <input 
                      type="text"
                      value={editForm.country || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full bg-[#030712] border border-slate-800 rounded-xl px-4 py-3.5 text-sm font-bold text-white focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Mission Statement / Description</label>
                  <textarea 
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full bg-[#030712] border border-slate-800 rounded-xl px-4 py-3 text-sm font-semibold text-white focus:outline-none focus:border-indigo-500 transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Business Type</label>
                    <input 
                      type="text"
                      value={editForm.businessType || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, businessType: e.target.value as any }))}
                      className="w-full bg-[#030712] border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Industry Category</label>
                    <input 
                      type="text"
                      value={editForm.category || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full bg-[#030712] border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Contact Email</label>
                    <input 
                      type="email"
                      value={editForm.email || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-[#030712] border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono font-bold text-white focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Contact Phone</label>
                    <input 
                      type="text"
                      value={editForm.phone || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full bg-[#030712] border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono font-bold text-white focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-800 flex justify-end gap-3">
                  <button onClick={() => setIsEditModalOpen(false)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                    Cancel Config
                  </button>
                  <button 
                    onClick={async () => {
                      if (!user || !business) return;
                      setSaving(true);
                      setUpdateError(null);
                      try {
                        let finalLogo = editForm.logoUrl;
                        let finalLogoId = business.logoPublicId || undefined;
                        let finalCover = editForm.coverImageUrl;
                        let finalCoverId = business.coverPublicId || undefined;
                        
                        if (logoFile) {
                          const logoAsset = await mediaService.uploadMedia(logoFile, user.uid, { module: 'businesses', businessId: business.id });
                          finalLogo = logoAsset.downloadUrl;
                          finalLogoId = logoAsset.storagePath;
                        }
                        if (coverFile) {
                          const coverAsset = await mediaService.uploadMedia(coverFile, user.uid, { module: 'businesses', businessId: business.id });
                          finalCover = coverAsset.downloadUrl;
                          finalCoverId = coverAsset.storagePath;
                        }
                        
                        const updatePayload = {
                            businessName: editForm.businessName,
                            city: editForm.city,
                            country: editForm.country,
                            description: editForm.description,
                            businessType: editForm.businessType,
                            category: editForm.category,
                            email: editForm.email,
                            phone: editForm.phone,
                            logoUrl: finalLogo,
                            logoPublicId: finalLogoId,
                            coverImageUrl: finalCover,
                            coverPublicId: finalCoverId
                          };

                        await businessService.updateBusiness(business.id, user.uid, user.displayName || user.email || 'Owner', updatePayload);
                        const updatedBiz = await businessService.getBusiness(business.id);
                        setBusiness(updatedBiz);
                        setIsEditModalOpen(false);
                      } catch (err) {
                        console.error('Save failed:', err);
                        setUpdateError('Update failed: ' + (err instanceof Error ? err.message : String(err)));
                      } finally {
                        setSaving(false);
                      }
                    }}
                    disabled={saving}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {saving ? 'Processing...' : 'Deploy Changes'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upload Document Modal */}
      <AnimatePresence>
        {isDocumentModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDocumentModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[#090e1a]/95 backdrop-blur-md border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-bold text-white">Deposit Compliance File</h2>
                  <p className="text-sm text-slate-500 mt-1">Upload verified PDF, PNG, or JPEG documents into the vault.</p>
                </div>
                <button 
                  onClick={() => setIsDocumentModalOpen(false)}
                  className="p-2.5 bg-[#030712] hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all border border-slate-800/80"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {uploadError && (
                <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-bold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {uploadError}
                </div>
              )}

              <form onSubmit={handleDocumentUpload} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Regulatory Code / Category</label>
                    <select 
                      value={uploadDocType} 
                      onChange={(e) => setUploadDocType(e.target.value as any)}
                      className="w-full bg-[#030712] border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Registration">Certificate of Incorporation</option>
                      <option value="GST">GST Registration File</option>
                      <option value="PAN">PAN Corporate Card</option>
                      <option value="TradeLicense">Trade License</option>
                      <option value="IdentityProof">Executive ID Proof</option>
                      <option value="AddressProof">Corporate Address Proof</option>
                      <option value="Tax">Tax Exemption / Filing</option>
                      <option value="Other">Other Regulatory Form</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Custom Document Identifier</label>
                    <input 
                      type="text" 
                      placeholder="e.g. GST_FILING_2026" 
                      value={uploadDocName} 
                      onChange={(e) => setUploadDocName(e.target.value)}
                      className="w-full bg-[#030712] border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Regulatory Expiry (Optional)</label>
                  <input 
                    type="date" 
                    value={uploadDocExpiry} 
                    onChange={(e) => setUploadDocExpiry(e.target.value)}
                    className="w-full bg-[#030712] border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Drag and Drop Area */}
                <div 
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-2xl p-10 text-center bg-[#030712]/35 transition-colors cursor-pointer"
                >
                  <input 
                    type="file" 
                    id="docFile" 
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setUploadDocFile(e.target.files[0]);
                        if (!uploadDocName) {
                          setUploadDocName(e.target.files[0].name.split('.')[0]);
                        }
                      }
                    }} 
                  />
                  <label htmlFor="docFile" className="cursor-pointer flex flex-col items-center justify-center">
                    <Upload className="w-10 h-10 text-indigo-400 mb-3" />
                    <p className="text-sm font-bold text-white">Drag compliance file here, or click to browse</p>
                    <p className="text-xs text-slate-500 mt-2">Supports PDF, PNG, or JPG formats up to 10MB</p>
                    {uploadDocFile && (
                      <span className="mt-4 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold rounded-lg truncate max-w-xs">{uploadDocFile.name}</span>
                    )}
                  </label>
                </div>

                <div className="pt-6 border-t border-slate-800 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsDocumentModalOpen(false)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-800">
                    Cancel Upload
                  </button>
                  <button 
                    type="submit" 
                    disabled={uploadingDoc || !uploadDocFile}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {uploadingDoc ? 'Depositing...' : 'Submit Document'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Invite Staff Modal */}
      <AnimatePresence>
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsInviteModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#090e1a]/95 backdrop-blur-md border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-bold text-white">Invite Workforce Member</h2>
                  <p className="text-sm text-slate-500 mt-1">Add operational personnel and delegate system roles.</p>
                </div>
                <button 
                  onClick={() => setIsInviteModalOpen(false)}
                  className="p-2.5 bg-[#030712] hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all border border-slate-800/80"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleInviteStaff} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Employee Username or Email</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. operational_staff@partner.pi" 
                    value={inviteEmail} 
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full bg-[#030712] border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Enterprise Role</label>
                    <select 
                      value={inviteRole} 
                      onChange={(e) => setInviteRole(e.target.value as any)}
                      className="w-full bg-[#030712] border border-slate-800 rounded-xl px-3 py-3 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Employee">Employee</option>
                      <option value="Manager">Manager</option>
                      <option value="Business Admin">Business Admin</option>
                      <option value="Super Admin">Super Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Department</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Sales" 
                      value={inviteDepartment} 
                      onChange={(e) => setInviteDepartment(e.target.value)}
                      className="w-full bg-[#030712] border border-slate-800 rounded-xl px-3 py-3 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Job Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Store Manager" 
                    value={inviteTitle} 
                    onChange={(e) => setInviteTitle(e.target.value)}
                    className="w-full bg-[#030712] border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="pt-6 border-t border-slate-800 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsInviteModalOpen(false)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-800">
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/20"
                  >
                    Send Invitation
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Store Wizard */}
      {showStoreWizard && (
        <StoreWizard 
          onComplete={() => { setShowStoreWizard(false); navigate('/store-dashboard'); }}
          onCancel={() => setShowStoreWizard(false)}
        />
      )}

      {/* Delete / Decommission Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#090e1a]/95 backdrop-blur-md border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-center animate-in fade-in duration-200"
            >
              <div className="w-16 h-16 mx-auto bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mb-6">
                <Trash2 className="w-8 h-8 text-rose-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2 font-display">Decommission Enterprise</h2>
              <p className="text-sm text-slate-400 mb-8 font-medium">
                Are you sure you want to permanently decommission and archive <strong>{business.businessName}</strong>? This will restrict all active outlet transactions, credentials, and compliance history.
              </p>
              <div className="flex gap-3 justify-stretch">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 bg-[#030712] border border-slate-800 text-slate-400 hover:text-white rounded-xl text-sm font-bold transition-all"
                >
                  Keep Unit
                </button>
                <button 
                  onClick={async () => {
                    if (!user) return;
                    try {
                      await businessService.updateBusiness(business.id, user.uid, user.displayName || user.email || 'Owner', {
                        businessStatus: 'archived'
                      });
                      setShowDeleteConfirm(false);
                      navigate('/business-dashboard');
                    } catch (err) {
                      console.error('Archive failed:', err);
                    }
                  }}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-rose-600/20"
                >
                  Confirm Archive
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Business Settings Modal */}
      <AnimatePresence>
        {isSettingsModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[#090e1a]/95 backdrop-blur-md border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-bold text-white">Business Settings</h2>
                  <p className="text-sm text-slate-500 mt-1">Configure company metadata, contact information, and registration details.</p>
                </div>
                <button 
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="p-2.5 bg-[#030712] hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all border border-slate-800/80"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {updateError && (
                <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-bold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {updateError}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Enterprise Mission Statement / Description</label>
                  <textarea 
                    rows={3}
                    value={settingsForm.description}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-[#030712] border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500 transition-all resize-none"
                    placeholder="Describe your business operations and core values..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Contact Email Address</label>
                    <input 
                      type="email"
                      value={settingsForm.email}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-[#030712] border border-slate-800 rounded-xl px-4 py-3.5 text-sm font-bold text-white focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Enterprise Phone Line</label>
                    <input 
                      type="text"
                      value={settingsForm.phone}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full bg-[#030712] border border-slate-800 rounded-xl px-4 py-3.5 text-sm font-bold text-white focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Official Website</label>
                    <input 
                      type="url"
                      value={settingsForm.website}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, website: e.target.value }))}
                      className="w-full bg-[#030712] border border-slate-800 rounded-xl px-4 py-3.5 text-sm font-bold text-white focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Business Entity Type</label>
                    <select 
                      value={settingsForm.businessType}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, businessType: e.target.value as any }))}
                      className="w-full bg-[#030712] border border-slate-800 rounded-xl px-4 py-3.5 text-sm font-bold text-white focus:outline-none focus:border-indigo-500 transition-all"
                    >
                      <option value="Private Limited">Private Limited</option>
                      <option value="Partnership">Partnership</option>
                      <option value="Sole Proprietorship">Sole Proprietorship</option>
                      <option value="LLP">Limited Liability Partnership</option>
                      <option value="Startup">Startup</option>
                      <option value="Individual">Individual / Freelancer</option>
                      <option value="Other">Other Category</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Corporate PAN Number</label>
                    <input 
                      type="text"
                      value={settingsForm.panNumber}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, panNumber: e.target.value }))}
                      className="w-full bg-[#030712] border border-slate-800 rounded-xl px-4 py-3.5 text-sm font-mono text-white focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">GST Registration Code</label>
                    <input 
                      type="text"
                      value={settingsForm.gstNumber}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, gstNumber: e.target.value }))}
                      className="w-full bg-[#030712] border border-slate-800 rounded-xl px-4 py-3.5 text-sm font-mono text-white focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-800 flex justify-end gap-3">
                  <button onClick={() => setIsSettingsModalOpen(false)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                    Cancel
                  </button>
                  <button 
                    onClick={async () => {
                      if (!user || !business) return;
                      setSaving(true);
                      setUpdateError(null);
                      try {
                        const updatePayload = {
                          description: settingsForm.description,
                          email: settingsForm.email,
                          phone: settingsForm.phone,
                          website: settingsForm.website,
                          businessType: settingsForm.businessType,
                          panNumber: settingsForm.panNumber,
                          gstNumber: settingsForm.gstNumber,
                        };

                        await businessService.updateBusiness(business.id, user.uid, user.displayName || user.email || 'Owner', updatePayload);
                        const updatedBiz = await businessService.getBusiness(business.id);
                        if (updatedBiz) {
                          setBusiness(updatedBiz);
                          setEditForm(updatedBiz);
                        }
                        setIsSettingsModalOpen(false);
                        setToastMessage('Business settings saved successfully!');
                      } catch (err) {
                        console.error('Settings save failed:', err);
                        setUpdateError('Save failed: ' + (err instanceof Error ? err.message : String(err)));
                      } finally {
                        setSaving(false);
                      }
                    }}
                    disabled={saving}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Workforce Member Modal */}
      <AnimatePresence>
        {editingMember && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingMember(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-[#090e1a]/95 backdrop-blur-md border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-bold text-white">Edit Staff Credentials</h2>
                  <p className="text-sm text-slate-500 mt-1">Update operational authority, department, title, and permissions.</p>
                </div>
                <button 
                  onClick={() => setEditingMember(null)}
                  className="p-2.5 bg-[#030712] hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all border border-slate-800/80"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveMember} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Enterprise Role</label>
                    <select 
                      value={editMemberRole}
                      onChange={(e) => setEditMemberRole(e.target.value as BusinessRole)}
                      className="w-full bg-[#030712] border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500 transition-all"
                    >
                      <option value="Super Admin">Super Admin</option>
                      <option value="Business Admin">Business Admin</option>
                      <option value="Employee">Employee</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Operational Status</label>
                    <select 
                      value={editMemberStatus}
                      onChange={(e) => setEditMemberStatus(e.target.value as 'active' | 'suspended')}
                      className="w-full bg-[#030712] border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-indigo-500 transition-all"
                    >
                      <option value="active">Authorized (Active)</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Functional Department</label>
                    <input 
                      type="text"
                      required
                      value={editMemberDepartment}
                      onChange={(e) => setEditMemberDepartment(e.target.value)}
                      className="w-full bg-[#030712] border border-slate-800 rounded-xl px-4 py-3.5 text-sm font-bold text-white focus:outline-none focus:border-indigo-500 transition-all"
                      placeholder="e.g. HQ Operations, Logistics"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Professional Title</label>
                    <input 
                      type="text"
                      required
                      value={editMemberTitle}
                      onChange={(e) => setEditMemberTitle(e.target.value)}
                      className="w-full bg-[#030712] border border-slate-800 rounded-xl px-4 py-3.5 text-sm font-bold text-white focus:outline-none focus:border-indigo-500 transition-all"
                      placeholder="e.g. Senior Manager, Lead Clerk"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Permissions Scope</label>
                  <p className="text-xs text-slate-500 mb-3">Grant specific high-clearance execution scopes to this staff node.</p>
                  <div className="grid grid-cols-2 gap-3 p-4 bg-[#030712] border border-slate-800 rounded-xl">
                    {[
                      { id: 'manage_stores', label: 'Manage Stores' },
                      { id: 'invite_staff', label: 'Invite & Manage Staff' },
                      { id: 'upload_compliance', label: 'Compliance & Docs' },
                      { id: 'view_financials', label: 'View Ledger Settlements' }
                    ].map(perm => (
                      <label key={perm.id} className="flex items-center gap-2.5 text-xs text-slate-300 font-bold cursor-pointer hover:text-white transition-colors">
                        <input 
                          type="checkbox"
                          checked={editMemberPermissions.includes(perm.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditMemberPermissions(prev => [...prev, perm.id]);
                            } else {
                              setEditMemberPermissions(prev => prev.filter(x => x !== perm.id));
                            }
                          }}
                          className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 bg-[#0b0f19] w-4 h-4"
                        />
                        <span>{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-800 flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setEditingMember(null)} 
                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all"
                  >
                    Save Member
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Toast Feedback Overlay */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[200] bg-[#0b0f19] border border-indigo-500/30 text-white font-bold text-sm px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Feedback notification */}
      <AnimatePresence>
        {(copiedLink || toastMessage) && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-24 left-1/2 z-[110] bg-indigo-600 border border-indigo-500 px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 text-white font-bold text-xs whitespace-nowrap"
          >
            <Check className="w-4 h-4 text-white" />
            <span>{copiedLink ? 'Link Copied to Clipboard!' : toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BusinessProfile;
