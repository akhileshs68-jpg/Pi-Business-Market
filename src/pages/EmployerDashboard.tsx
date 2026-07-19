/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Briefcase, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  ChevronRight,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Archive,
  Trash2,
  ExternalLink,
  Eye,
  Settings2,
  Building2,
  Calendar,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from '../components/Navbar';
import { useAuth } from '../auth/useAuth';
import { jobService } from '../services/jobService';
import { Job, JobApplication, HiringStatus } from '../types';
import { JobWizard } from '../components/recruitment/JobWizard';

export const EmployerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'listings' | 'applications'>('listings');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [businessId] = useState('PI-CORP-001');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await jobService.getBusinessJobs(businessId);
      setJobs(data);
    } catch (err) {
      console.error('Failed to fetch business jobs', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'draft': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      case 'closed': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <Navbar 
        currentUser={user!}
        currentView="employer"
        onNavigate={(view) => navigate(`/${view}`)}
        cartCount={0}
        walletBalance={100}
        onWalletUpdate={() => {}}
        onToggleCart={() => {}}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-600/20 rounded-xl text-indigo-400">
                <Building2 className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight uppercase">Talent Acquisition</h1>
            </div>
            <p className="text-slate-500 font-medium">Manage your enterprise job listings and hiring pipelines.</p>
          </div>
          <div className="flex items-center gap-4">
             <button className="p-4 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-2xl transition-all">
                <Settings2 className="w-5 h-5" />
             </button>
             <button 
               onClick={() => setIsWizardOpen(true)}
               className="flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
             >
               <Plus className="w-5 h-5" />
               New Job Post
             </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Active Openings', value: jobs.filter(j => j.status === 'published').length, icon: Briefcase, color: 'text-indigo-400' },
            { label: 'Total Applicants', value: '124', icon: Users, color: 'text-violet-400' },
            { label: 'Interviews Slated', value: '12', icon: Calendar, color: 'text-emerald-400' },
            { label: 'Pipeline Velocity', value: '88%', icon: Layers, color: 'text-amber-400' },
          ].map((stat, i) => (
            <div key={i} className="p-6 bg-slate-900/50 border border-slate-800 rounded-3xl">
              <div className="flex items-center gap-3 mb-4">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
              </div>
              <p className="text-3xl font-black text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-8 border-b border-slate-800 mb-8">
          {[
            { id: 'listings', label: 'Job Listings', icon: Briefcase },
            { id: 'applications', label: 'Candidates & Pipeline', icon: Users },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${
                activeTab === tab.id ? 'text-indigo-400' : 'text-slate-500 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                placeholder="Search Recruitment Data..." 
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-sm text-white focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <button className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 hover:text-white transition-colors">
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
              <p className="text-sm font-black text-slate-600 uppercase tracking-widest animate-pulse">Synchronizing Recruitment Cloud...</p>
            </div>
          ) : activeTab === 'listings' ? (
            <div className="space-y-4">
              {jobs.length === 0 ? (
                <div className="py-32 text-center bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-[3rem]">
                  <Briefcase className="w-16 h-16 text-slate-700 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-white mb-2">No active jobs</h3>
                  <p className="text-slate-500 mb-8">Start your hiring process by creating your first job posting.</p>
                  <button className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs">
                    Post Enterprise Job
                  </button>
                </div>
              ) : (
                jobs.map(job => (
                  <motion.div 
                    key={job.jobId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group bg-slate-900/50 border border-slate-800 hover:border-indigo-500/50 rounded-[2rem] p-6 transition-all"
                  >
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-black text-white uppercase tracking-tight">{job.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${getStatusColor(job.status)}`}>
                            {job.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                          <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> {job.department}</span>
                          <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {job.vacancies} Vacancies</span>
                          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Ends {new Date(job.applicationDeadline).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-8">
                         <div className="text-center px-6 border-r border-slate-800">
                           <p className="text-2xl font-black text-white">42</p>
                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Applicants</p>
                         </div>
                         <div className="flex items-center gap-2">
                           <button className="p-3 bg-slate-800 hover:bg-indigo-600 text-white rounded-xl transition-all">
                              <Eye className="w-4 h-4" />
                           </button>
                           <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                              Manage Hiring Pipeline <ChevronRight className="w-4 h-4" />
                           </button>
                         </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          ) : (
            <div className="p-12 text-center bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-[3rem]">
              <Users className="w-16 h-16 text-slate-700 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-white mb-2">Global Applicant View</h3>
              <p className="text-slate-500 mb-8 max-w-md mx-auto">Select a specific job listing to view candidates or manage the multi-stage hiring pipeline.</p>
              <button className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs">
                View All Candidates
              </button>
            </div>
          )}
        </div>
      </main>

      <JobWizard 
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={() => {
          setIsWizardOpen(false);
          fetchJobs();
        }}
        businessId={businessId}
      />
    </div>
  );
};
