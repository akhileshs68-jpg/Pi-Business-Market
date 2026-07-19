/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  MapPin, 
  Search, 
  Filter, 
  Clock, 
  DollarSign, 
  Globe, 
  ChevronRight,
  Loader2,
  Building2,
  Bookmark,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from '../components/Navbar';
import { useAuth } from '../auth/useAuth';
import { jobService } from '../services/jobService';
import { Job } from '../types';

export const JobMarketplace: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await jobService.getAllActiveJobs();
      setJobs(data);
    } catch (err) {
      console.error('Failed to fetch jobs', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <Navbar 
        currentUser={user!}
        currentView="jobs"
        onNavigate={(view) => navigate(`/${view}`)}
        cartCount={0}
        walletBalance={100}
        onWalletUpdate={() => {}}
        onToggleCart={() => {}}
      />

      {/* Hero Search Section */}
      <div className="relative overflow-hidden bg-slate-900/50 border-b border-slate-800">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.1),transparent_50%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600/10 border border-violet-600/20 rounded-full text-violet-400 text-xs font-black uppercase tracking-widest mb-8"
          >
            <Sparkles className="w-3 h-3" />
            Empowering the Pi Workforce
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase mb-8"
          >
            Your Next <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-500">Career Move</span> <br /> Starts Here
          </motion.h1>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-3xl mx-auto"
          >
            <div className="flex flex-col md:flex-row items-stretch gap-4 p-2 bg-slate-950 border border-slate-800 rounded-[2rem] shadow-2xl">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 text-slate-500 absolute left-6 top-1/2 -translate-y-1/2" />
                <input 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Job Title, Keywords, or Department..." 
                  className="w-full bg-transparent pl-14 pr-4 py-5 text-white outline-none font-bold"
                />
              </div>
              <div className="md:w-px h-8 bg-slate-800 my-auto hidden md:block" />
              <div className="flex-1 relative">
                <MapPin className="w-5 h-5 text-slate-500 absolute left-6 top-1/2 -translate-y-1/2" />
                <input 
                  placeholder="Remote or City..." 
                  className="w-full bg-transparent pl-14 pr-4 py-5 text-white outline-none font-bold"
                />
              </div>
              <button className="px-10 py-5 bg-violet-600 hover:bg-violet-500 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-sm transition-all">
                Search Jobs
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1 space-y-8">
            <div>
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Filter className="w-4 h-4" /> Filters
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Employment Type</label>
                  {['Full Time', 'Part Time', 'Contract', 'Internship'].map((type) => (
                    <label key={type} className="flex items-center gap-3 mb-2 group cursor-pointer">
                      <div className="w-5 h-5 border border-slate-800 rounded bg-slate-900 group-hover:border-violet-500 transition-all" />
                      <span className="text-sm font-medium text-slate-500 group-hover:text-white transition-colors">{type}</span>
                    </label>
                  ))}
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Work Mode</label>
                  {['Remote', 'On-site', 'Hybrid'].map((mode) => (
                    <label key={mode} className="flex items-center gap-3 mb-2 group cursor-pointer">
                      <div className="w-5 h-5 border border-slate-800 rounded bg-slate-900 group-hover:border-violet-500 transition-all" />
                      <span className="text-sm font-medium text-slate-500 group-hover:text-white transition-colors">{mode}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-8 bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20 rounded-[2.5rem]">
              <h4 className="text-white font-black text-lg mb-2 uppercase tracking-tight">Hiring Managers</h4>
              <p className="text-slate-400 text-xs font-medium mb-6">Access enterprise-grade recruitment tools to scale your Pi Business.</p>
              <button 
                onClick={() => navigate('/employer/jobs')}
                className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Employer Portal
              </button>
            </div>
          </div>

          {/* Job List */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between mb-8">
              <p className="text-sm text-slate-500 font-bold">Showing <span className="text-white">{filteredJobs.length}</span> career opportunities</p>
              <select className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs font-black text-white outline-none">
                <option>Newest First</option>
                <option>Highest Salary</option>
              </select>
            </div>

            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
                <p className="text-sm font-black text-slate-600 uppercase tracking-widest animate-pulse">Scanning Global Job Board...</p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="py-32 text-center bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-[3rem]">
                <Briefcase className="w-16 h-16 text-slate-700 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-white mb-2">No Match Found</h3>
                <p className="text-slate-500 max-w-sm mx-auto">Try adjusting your filters or search keywords to find the right opportunity.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredJobs.map(job => (
                  <motion.div 
                    key={job.jobId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="group bg-slate-900/40 border border-slate-800 hover:border-violet-500/50 hover:bg-slate-900 transition-all rounded-3xl p-6 relative overflow-hidden"
                  >
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <Building2 className="w-8 h-8 text-slate-700 group-hover:text-violet-400 transition-colors" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-xl font-black text-white uppercase tracking-tight group-hover:text-violet-400 transition-colors">{job.title}</h3>
                          <button className="text-slate-500 hover:text-white">
                            <Bookmark className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 mb-4">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                            <Building2 className="w-3 h-3" />
                            <span>{job.department}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                            <MapPin className="w-3 h-3" />
                            <span>{job.location} • {job.workMode}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500">
                            <DollarSign className="w-3 h-3" />
                            <span>{job.salaryMin} - {job.salaryMax} {job.currency}</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {job.skills.slice(0, 3).map(skill => (
                            <span key={skill} className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">{skill}</span>
                          ))}
                          {job.skills.length > 3 && (
                            <span className="text-[10px] font-black text-slate-600 px-2 py-1 uppercase">+{job.skills.length - 3} More</span>
                          )}
                        </div>
                      </div>

                      <div className="md:border-l md:border-slate-800 md:pl-8 flex flex-col justify-center">
                         <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3 text-center">Posted {new Date(job.createdAt).toLocaleDateString()}</p>
                         <button 
                           onClick={() => navigate(`/jobs/${job.slug}`)}
                           className="px-6 py-3 bg-white text-slate-950 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-violet-500 hover:text-white transition-all shadow-xl shadow-black/20"
                         >
                           Apply Now <ArrowRight className="w-4 h-4" />
                         </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
