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
import DocumentManager from '../components/business/DocumentManager';
import { Business, BusinessMember, BusinessDocument, BusinessAuditLog } from '../types';
import { 
  Building2, 
  Users, 
  FileText, 
  ShieldCheck, 
  Settings, 
  BarChart3, 
  ChevronLeft,
  MoreVertical,
  Plus,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  History,
  Lock,
  ExternalLink,
  ArrowUpRight,
  UserPlus,
  Info,
  Edit2,
  Image as ImageIcon,
  Upload,
  X,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from '../components/Navbar';

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

  const [showActionMenu, setShowActionMenu] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Business>>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

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
      } catch (err) {
        console.error('Failed to load business profile:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Synchronizing Enterprise Data...</p>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8">
        <Building2 className="w-16 h-16 text-slate-800 mb-6" />
        <h2 className="text-2xl font-bold text-white mb-2">Identity Not Found</h2>
        <p className="text-slate-500 mb-8">The business identity you are looking for does not exist or has been archived.</p>
        <button onClick={() => navigate('/business-dashboard')} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold">Return to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <Navbar 
        currentUser={user as any} 
        currentView="business_profile" 
        onNavigate={(view) => navigate(`/${view}`)} 
        cartCount={0}
        walletBalance={0}
        onWalletUpdate={() => {}}
        onToggleCart={() => {}} 
      />

      {/* Header Banner */}
      <div className="h-48 md:h-64 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-transparent to-slate-900/80" />
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:24px_24px]" />
        {business.coverImage && (
          <img src={business.coverImage} className="w-full h-full object-cover opacity-50" alt="" />
        )}
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10 pb-20">
        
        {/* Profile Info Header */}
        <div className="bg-slate-900/80 border border-slate-800/50 rounded-3xl md:rounded-[2.5rem] p-6 md:p-10 backdrop-blur-2xl shadow-2xl mb-8">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
            <div className="w-20 h-20 md:w-32 md:h-32 bg-slate-950 border-4 md:border-8 border-slate-950 rounded-2xl md:rounded-[2rem] overflow-hidden shadow-2xl shrink-0">
              {business.logo ? (
                <img src={business.logo} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-indigo-600/10">
                  <Building2 className="w-8 h-8 md:w-12 md:h-12 text-indigo-400" />
                </div>
              )}
            </div>
            
            <div className="flex-1 w-full">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">{business.businessName}</h1>
                    {business.verificationStatus === 'Verified' && (
                      <div className="p-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 md:gap-4 text-slate-500 font-medium">
                    <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">
                      <span className="text-[9px] font-bold uppercase tracking-widest">{business.businessType}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-600" />
                      <span className="text-xs md:text-sm">{business.city}, {business.country}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 relative">
                  <button 
                    onClick={() => setShowActionMenu(!showActionMenu)} 
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl md:rounded-2xl transition-all shadow-xl shadow-indigo-600/10 text-xs sm:text-base"
                  >
                    <Plus className="w-4 h-4 md:w-5 md:h-5" />
                    Action
                  </button>
                  <button onClick={() => setShowActionMenu(!showActionMenu)} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl md:rounded-2xl text-slate-400 hover:text-white transition-all">
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  <AnimatePresence>
                    {showActionMenu && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowActionMenu(false)} />
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
                        >
                          <div className="p-2 space-y-1">
                            <button 
                              onClick={() => {
                                setShowActionMenu(false);
                                setEditForm(business);
                                setIsEditModalOpen(true);
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                            >
                              <Edit2 className="w-4 h-4 text-indigo-400" />
                              Edit Profile
                            </button>
                            <button 
                              onClick={() => {
                                setShowActionMenu(false);
                                setIsDocumentModalOpen(true);
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                            >
                              <Upload className="w-4 h-4 text-emerald-400" />
                              Upload Documents
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {[
                  { label: 'Rating', val: business.rating, icon: BarChart3, color: 'text-amber-400' },
                  { label: 'Staff', val: business.employeeCount, icon: Users, color: 'text-indigo-400' },
                  { label: 'Fans', val: business.followers, icon: ShieldCheck, color: 'text-emerald-400' },
                  { label: 'Units', val: business.storeCount, icon: Building2, color: 'text-sky-400' },
                ].map((stat, i) => (
                  <div key={i} className="bg-slate-950/40 p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-800/50">
                    <div className="flex items-center gap-2 mb-1">
                      <stat.icon className={`w-3 h-3 md:w-3.5 md:h-3.5 ${stat.color}`} />
                      <span className="text-[8px] md:text-[9px] font-bold text-slate-600 uppercase tracking-widest">{stat.label}</span>
                    </div>
                    <p className="text-base md:text-lg font-bold text-white">{stat.val}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl mb-8 overflow-x-auto scrollbar-hide sticky top-16 md:top-24 z-20 shadow-xl mx-auto w-full">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'members', label: 'Staff', icon: Users },
            { id: 'documents', label: 'Docs', icon: FileText },
            { id: 'verification', label: 'Legal', icon: ShieldCheck },
            { id: 'activity', label: 'History', icon: History },
            { id: 'settings', label: 'Setup', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[500px]">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* Left Column: Info Card */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8">
                    <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest">Business Dossier</h3>
                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                          <Info className="w-4 h-4 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-600 uppercase mb-1">Description</p>
                          <p className="text-sm text-slate-300 leading-relaxed font-medium">{business.description}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                          <Lock className="w-4 h-4 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-600 uppercase mb-1">Legal Identity</p>
                          <p className="text-sm text-slate-300 font-bold">{business.legalName}</p>
                          <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-wider">PAN: {business.panNumber || 'Pending'}</p>
                        </div>
                      </div>
                      <div className="pt-6 border-t border-slate-800 space-y-4">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Contact Channels</h4>
                        <div className="flex items-center gap-3 text-slate-300">
                          <Mail className="w-4 h-4 text-indigo-400" />
                          <span className="text-sm font-medium">{business.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-300">
                          <Phone className="w-4 h-4 text-indigo-400" />
                          <span className="text-sm font-medium">{business.phone}</span>
                        </div>
                        {business.website && (
                          <div className="flex items-center gap-3 text-slate-300">
                            <Globe className="w-4 h-4 text-indigo-400" />
                            <span className="text-sm font-medium">{business.website}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Key Metrics & Timeline */}
                <div className="lg:col-span-2 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-indigo-600/10 to-transparent border border-indigo-500/20 rounded-[2rem] p-8">
                       <BarChart3 className="w-8 h-8 text-indigo-400 mb-6" />
                       <h3 className="text-2xl font-bold text-white mb-2">Commerce Health</h3>
                       <p className="text-slate-400 text-sm mb-6 font-medium">Monitoring real-time transactions and market growth across the Pi network.</p>
                       <button className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-widest group">
                         Deep Analytics <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                       </button>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8">
                       <ShieldCheck className="w-8 h-8 text-emerald-400 mb-6" />
                       <h3 className="text-2xl font-bold text-white mb-2">Trust Metrics</h3>
                       <p className="text-slate-400 text-sm mb-6 font-medium">Audit logs, verification status, and security hygiene scores.</p>
                       <button className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-widest group">
                         Security Report <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                       </button>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10">
                    <div className="flex items-center justify-between mb-10">
                      <h3 className="text-xl font-bold text-white tracking-tight">Recent Activity Timeline</h3>
                      <button className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-white transition-all">View All History</button>
                    </div>
                    <div className="space-y-10 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                      {[
                        { action: 'Identity Verified', user: 'System Authority', time: '2 hours ago', icon: ShieldCheck, color: 'bg-emerald-500/20 text-emerald-400' },
                        { action: 'Member Joined', user: 'Sarah Jenkins', time: 'Yesterday', icon: Users, color: 'bg-indigo-500/20 text-indigo-400' },
                        { action: 'Document Uploaded', user: 'Alex Rivier', time: '3 days ago', icon: FileText, color: 'bg-amber-500/20 text-amber-400' },
                      ].map((log, i) => (
                        <div key={i} className="flex gap-6 relative z-10">
                          <div className={`w-6 h-6 rounded-full ${log.color} flex items-center justify-center border border-slate-950 shrink-0`}>
                            <log.icon className="w-3 h-3" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-bold text-white">{log.action}</h4>
                            <p className="text-xs text-slate-500 mt-1 font-medium">Performed by {log.user}</p>
                          </div>
                          <span className="text-[10px] font-bold text-slate-600 uppercase">{log.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'members' && (
              <motion.div 
                key="members"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl"
              >
                <div className="px-10 py-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                  <div>
                    <h3 className="text-xl font-bold text-white">Workforce Registry</h3>
                    <p className="text-slate-500 text-sm mt-1 font-medium">Manage permissions and roles for your business personnel.</p>
                  </div>
                  <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20">
                    <UserPlus className="w-4 h-4" />
                    Invite Member
                  </button>
                </div>
                <div className="divide-y divide-slate-800">
                  {members.map(member => (
                    <div key={member.memberId} className="px-10 py-6 flex items-center justify-between hover:bg-slate-950/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center">
                          <Users className="w-6 h-6 text-slate-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">User {member.userUid.substring(0, 8)}...</h4>
                          <p className="text-xs text-slate-500 font-medium">{member.title || 'Team Member'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-10">
                        <div className="hidden md:block">
                          <p className="text-[10px] font-bold text-slate-600 uppercase mb-1 tracking-widest">Enterprise Role</p>
                          <div className="flex items-center gap-2">
                             <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-bold text-indigo-400 uppercase">{member.role}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-600 uppercase mb-1 tracking-widest">Joined On</p>
                          <p className="text-xs text-slate-300 font-medium">{new Date(member.joinedAt).toLocaleDateString()}</p>
                        </div>
                        <button className="p-2 hover:bg-slate-800 rounded-xl transition-all">
                          <MoreVertical className="w-4 h-4 text-slate-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'documents' && (
              <motion.div 
                key="documents"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {docs.length > 0 ? docs.map(doc => (
                  <div key={doc.documentId} className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-[2rem] hover:border-indigo-500/50 transition-all group">
                    <div className="flex items-center justify-between mb-6">
                      <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                        <FileText className="w-6 h-6 text-indigo-400" />
                      </div>
                      <div className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        doc.status === 'valid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {doc.status}
                      </div>
                    </div>
                    <h4 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors truncate">{doc.name}</h4>
                    <p className="text-xs text-slate-500 mt-1 font-medium">{doc.type} Identity Document</p>
                    <div className="mt-8 flex items-center justify-between border-t border-slate-800/50 pt-6">
                      <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                        v{doc.version} Registry
                      </div>
                      <a 
                        href={doc.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-2 text-indigo-400 font-bold text-[10px] uppercase tracking-widest hover:text-indigo-300"
                      >
                        Download <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-full py-20 sm:py-32 flex flex-col items-center justify-center bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-[3rem] px-6 text-center">
                    <FileText className="w-16 h-16 text-slate-800 mb-6" />
                    <h3 className="text-xl font-bold text-white mb-2">No Documents Registered</h3>
                    <p className="text-slate-500 mb-8 max-w-xs font-medium">Compliance documents are required for full verification status.</p>
                    <button className="w-full sm:w-auto px-8 py-3.5 bg-white text-slate-950 font-extrabold rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-all">
                      <Plus className="w-5 h-5" />
                      Upload Credentials
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Edit Business Modal */}
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
              className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-white">Edit Profile</h2>
                  <p className="text-slate-500 font-medium">Update your business details and brand identity</p>
                </div>
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-3 bg-slate-950 hover:bg-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* Logo Picker */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Business Logo</label>
                    <div className="relative group">
                      <div className="w-24 h-24 bg-slate-950 border-2 border-dashed border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center group-hover:border-indigo-500 transition-colors">
                        {logoFile ? (
                          <img src={URL.createObjectURL(logoFile)} alt="Preview" className="w-full h-full object-cover" />
                        ) : editForm.logo ? (
                          <img src={editForm.logo} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-slate-700" />
                        )}
                      </div>
                      <label className="absolute inset-0 flex flex-col items-center justify-center bg-indigo-950/80 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl">
                        <Upload className="w-5 h-5 mb-1" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Change</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Cover Picker */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Cover Image</label>
                    <div className="relative group">
                      <div className="w-full h-24 bg-slate-950 border-2 border-dashed border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center group-hover:border-indigo-500 transition-colors">
                        {coverFile ? (
                          <img src={URL.createObjectURL(coverFile)} alt="Preview" className="w-full h-full object-cover" />
                        ) : editForm.coverImage ? (
                          <img src={editForm.coverImage} alt="Cover" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-slate-700" />
                        )}
                      </div>
                      <label className="absolute inset-0 flex flex-col items-center justify-center bg-indigo-950/80 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl">
                        <Upload className="w-5 h-5 mb-1" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Change</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Business Name</label>
                  <input 
                    type="text"
                    value={editForm.businessName || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, businessName: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">City</label>
                    <input 
                      type="text"
                      value={editForm.city || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Country</label>
                    <input 
                      type="text"
                      value={editForm.country || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-800 flex justify-end gap-3">
                  <button 
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={async () => {
                      if (!user || !business) {
                        console.error('User or business not found', { user, business });
                        return;
                      }
                      
                      setSaving(true);
                      setUpdateError(null);
                      
                      try {
                        let finalLogo = editForm.logo;
                        let finalCover = editForm.coverImage;
                        
                        
                        if (logoFile) {
                          const logoAsset = await mediaService.uploadMedia(logoFile, user.uid, {
                            module: 'businesses',
                            businessId: business.id,
                          });
                          finalLogo = logoAsset.downloadUrl;
                        }

                        if (coverFile) {
                          const coverAsset = await mediaService.uploadMedia(coverFile, user.uid, {
                            module: 'businesses',
                            businessId: business.id,
                          });
                          finalCover = coverAsset.downloadUrl;
                        }
                        
                        
                        await businessService.updateBusiness(
                          business.id,
                          user.uid,
                          user.displayName || user.email || 'Unknown User',
                          {
                            businessName: editForm.businessName,
                            city: editForm.city,
                            country: editForm.country,
                            logo: finalLogo,
                            coverImage: finalCover
                          }
                        );
                        
                        
                        setBusiness(prev => prev ? { ...prev, ...editForm, logo: finalLogo, coverImage: finalCover } as Business : null);
                        
                        setIsEditModalOpen(false);
                        
                      } catch (err) {
                        console.error('Save workflow failed:', err);
                        if (err instanceof Error) {
                          console.error('Stack trace:', err.stack);
                        }
                        setUpdateError('Update failed: ' + (err instanceof Error ? err.message : String(err)));
                      } finally {
                        setSaving(false);
                      }
                    }}
                    disabled={saving}
                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default BusinessProfile;
