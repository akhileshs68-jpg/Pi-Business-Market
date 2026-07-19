/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  Briefcase,
  MapPin,
  Clock,
  Coins,
  CheckCircle,
  FileText,
  PlusCircle,
  UserCheck,
  AlertCircle,
  ShieldAlert,
  ChevronRight,
  ListFilter
} from 'lucide-react';
import { Job, JobApplication, User } from '../types';
import { PiBusinessMarketDB } from '../services/storage';

interface JobBoardFeedProps {
  currentUser: User;
  onNavigate: (view: string, params?: any) => void;
}

const JOB_CATEGORIES = [
  'All Sectors',
  'Technology & Development',
  'Design & Creative',
  'Marketing & Writing',
  'Business & Consulting',
  'Craft & Trades',
  'Customer Support',
  'Local Delivery & Help'
];

export default function JobBoardFeed({
  currentUser,
  onNavigate
}: JobBoardFeedProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  
  // Tabs: 'listings' | 'post' | 'my_applications'
  const [activeTab, setActiveTab] = useState<'listings' | 'post' | 'my_applications'>('listings');
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Sectors');
  const [selectedType, setSelectedType] = useState<'all' | 'remote' | 'on_site' | 'hybrid'>('all');

  // Application / Detailed Modal
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applyStep, setApplyStep] = useState<'input' | 'success'>('input');

  // Post a Job form state
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobDesc, setNewJobDesc] = useState('');
  const [newJobCategory, setNewJobCategory] = useState('Technology & Development');
  const [newJobSalary, setNewJobSalary] = useState<number>(50);
  const [newJobSalaryType, setNewJobSalaryType] = useState<'hourly' | 'fixed' | 'monthly'>('hourly');
  const [newJobLocType, setNewJobLocType] = useState<'remote' | 'on_site' | 'hybrid'>('remote');
  const [newJobLocation, setNewJobLocation] = useState('Global Remote');
  const [newJobRequirements, setNewJobRequirements] = useState('');
  const [postSuccess, setPostSuccess] = useState(false);

  useEffect(() => {
    setJobs(PiBusinessMarketDB.getJobs());
    setApplications(PiBusinessMarketDB.getApplicationsByApplicant(currentUser.uid));
  }, [currentUser.uid]);

  const handleRefresh = () => {
    setJobs(PiBusinessMarketDB.getJobs());
    setApplications(PiBusinessMarketDB.getApplicationsByApplicant(currentUser.uid));
  };

  // Filter Logic
  const filteredJobs = jobs.filter(j => {
    if (j.status !== 'open') return false;

    const matchesSearch = 
      j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.providerName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'All Sectors' || j.category === selectedCategory;
    const matchesType = selectedType === 'all' || j.locationType === selectedType;

    return matchesSearch && matchesCategory && matchesType;
  });

  // Handle Application submission
  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;
    if (!coverLetter.trim() || coverLetter.trim().length < 20) {
      alert('Please write a cover letter with at least 20 characters.');
      return;
    }

    // Submit via LocalStorage service
    const app = PiBusinessMarketDB.applyToJob({
      jobId: selectedJob.id,
      jobTitle: selectedJob.title,
      providerUid: selectedJob.providerUid,
      applicantUid: currentUser.uid,
      applicantUsername: currentUser.username,
      applicantName: currentUser.displayName,
      coverLetter,
      piWalletAddress: currentUser.walletAddress
    });

    // Update applications and refresh count
    setApplications(prev => [app, ...prev]);
    setApplyStep('success');
    
    // Refresh parent listings
    setJobs(PiBusinessMarketDB.getJobs());
  };

  // Handle Publishing a New Job
  const handlePublishJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobTitle.trim() || !newJobDesc.trim() || !newJobRequirements.trim()) {
      alert('Please fill out all required fields.');
      return;
    }

    const providerProfile = PiBusinessMarketDB.getPioneerProfileByOwner(currentUser.uid);
    const providerProfileId = providerProfile?.id || 'profile_jobprovider_1';
    const providerName = providerProfile?.businessName || currentUser.displayName;

    const requirementsArray = newJobRequirements
      .split('\n')
      .map(r => r.trim())
      .filter(r => r.length > 0);

    PiBusinessMarketDB.createJob({
      providerUid: currentUser.uid,
      providerProfileId,
      providerName,
      title: newJobTitle,
      description: newJobDesc,
      requirements: requirementsArray,
      salaryPi: newJobSalary,
      salaryType: newJobSalaryType,
      locationType: newJobLocType,
      location: newJobLocation,
      category: newJobCategory
    });

    // Clean form
    setNewJobTitle('');
    setNewJobDesc('');
    setNewJobRequirements('');
    setNewJobSalary(50);
    setNewJobLocation('Global Remote');
    setPostSuccess(true);
    
    // Refresh jobs feed
    setJobs(PiBusinessMarketDB.getJobs());

    // Reset success banner after 4 seconds
    setTimeout(() => {
      setPostSuccess(false);
      setActiveTab('listings');
    }, 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* JOB BOARD NAVIGATION SUB-TABS */}
      <div className="flex justify-between items-center bg-slate-900 border border-slate-800 rounded-2xl p-2 select-none">
        <div className="flex gap-1">
          <button
            onClick={() => { setActiveTab('listings'); handleRefresh(); }}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'listings'
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Find Work
          </button>
          <button
            onClick={() => { setActiveTab('my_applications'); handleRefresh(); }}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'my_applications'
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            My Applications
            {applications.length > 0 && (
              <span className="px-1.5 py-0.5 bg-slate-950 text-violet-400 border border-slate-800 rounded-md text-[10px] font-bold">
                {applications.length}
              </span>
            )}
          </button>
        </div>

        <button
          onClick={() => setActiveTab('post')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
            activeTab === 'post'
              ? 'bg-amber-500 text-slate-950'
              : 'bg-slate-950 border border-slate-800 text-amber-400 hover:border-amber-500/30'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post a Job</span>
        </button>
      </div>

      {/* VIEW: FIND WORK / JOB LISTINGS */}
      {activeTab === 'listings' && (
        <div className="space-y-6">
          
          {/* SEARCH & FILTER CONTROLS */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-md flex flex-col gap-4 text-left select-none">
            <div className="flex flex-col md:flex-row items-center gap-3">
              
              {/* Search keywords */}
              <div className="relative flex-1 w-full flex items-center border border-slate-800 focus-within:ring-2 focus-within:ring-violet-500/20 focus-within:border-violet-500 rounded-xl px-3.5 transition-all bg-slate-950/40">
                <Search className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 text-sm pl-2 py-2.5 focus:outline-none text-slate-200 font-semibold bg-transparent placeholder-slate-600"
                  placeholder="Search jobs, companies, developers, couriers, copywriters..."
                />
              </div>

              {/* Filters dropdown */}
              <div className="flex gap-2 w-full md:w-auto">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="flex-1 text-xs border border-slate-800 rounded-xl px-3 py-2.5 bg-slate-950 focus:outline-none font-bold text-slate-300 cursor-pointer"
                >
                  {JOB_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <select
                  value={selectedType}
                  onChange={(e: any) => setSelectedType(e.target.value)}
                  className="text-xs border border-slate-800 rounded-xl px-3 py-2.5 bg-slate-950 focus:outline-none font-bold text-slate-300 cursor-pointer"
                >
                  <option value="all">Any Setup</option>
                  <option value="remote">🌐 Remote</option>
                  <option value="on_site">📍 On-Site</option>
                  <option value="hybrid">🌓 Hybrid</option>
                </select>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-violet-400" />
              <span>Job compensation payouts are negotiated and executed peer-to-peer using certified Pi wallets.</span>
            </div>
          </div>

          {/* JOB LISTINGS GRID */}
          {filteredJobs.length === 0 ? (
            <div className="bg-slate-900 border border-dashed border-slate-800 rounded-3xl py-16 text-center text-slate-500">
              <Briefcase className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h4 className="font-sans font-bold text-slate-300">No Open Listings Found</h4>
              <p className="text-xs max-w-xs mx-auto mt-1 leading-normal text-slate-550">
                Adjust your search parameters or check back later for active Pi startup positions.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => {
                    setSelectedJob(job);
                    setIsApplying(false);
                    setApplyStep('input');
                    setCoverLetter('');
                  }}
                  className="bg-slate-900 border border-slate-800 hover:border-violet-500/35 rounded-3xl p-5 flex flex-col justify-between shadow-md hover:-translate-y-0.5 transition-all cursor-pointer text-left group"
                >
                  <div className="space-y-3.5">
                    {/* Header */}
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-sans font-extrabold text-slate-100 text-sm group-hover:text-violet-400 transition-colors leading-tight">
                          {job.title}
                        </h4>
                        <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                          Posted by: {job.providerName}
                        </span>
                      </div>
                      
                      {/* Salary Display */}
                      <div className="bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2.5 py-1 rounded-xl text-right flex-shrink-0 flex items-center gap-1 font-mono text-xs font-bold shadow-sm">
                        <Coins className="w-3.5 h-3.5 text-amber-400" />
                        <span>{job.salaryPi} π <span className="text-[9px] font-normal font-sans text-slate-400 block -mt-0.5 capitalize">{job.salaryType}</span></span>
                      </div>
                    </div>

                    {/* Short excerpt description */}
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {job.description}
                    </p>

                    {/* Specific details tags */}
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 font-semibold font-mono">
                      <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded-md text-slate-400">
                        {job.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-600" />
                        {job.location} ({job.locationType.toUpperCase()})
                      </span>
                    </div>
                  </div>

                  {/* Actions / Metadata */}
                  <div className="border-t border-slate-800/60 pt-3.5 mt-4 flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                    <span className="flex items-center gap-1 text-slate-450 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-600" />
                      {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                    
                    <div className="flex items-center gap-3">
                      {job.applicantCount > 0 && (
                        <span className="text-violet-400 font-bold">{job.applicantCount} applied</span>
                      )}
                      <span className="text-violet-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        Details <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* VIEW: POST A JOB */}
      {activeTab === 'post' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-md max-w-xl mx-auto text-left animate-scale-in">
          
          {postSuccess ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h4 className="font-sans font-bold text-slate-200">Listing Published Successfully!</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-normal">
                Your job opportunity has been posted onto the Super App marketplace. Verified Pioneers can now view and apply for the listing.
              </p>
            </div>
          ) : (
            <form onSubmit={handlePublishJob} className="space-y-5">
              <div>
                <h3 className="font-sans font-bold text-slate-100 text-base">Create a Job Listing</h3>
                <p className="text-xs text-slate-500 mt-1">Acquire talented Pioneer professionals. Settlement is handled peer-to-peer using Pi Network wallets.</p>
              </div>

              <div className="space-y-4 text-xs">
                
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400">Job Title <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={newJobTitle}
                    onChange={(e) => setNewJobTitle(e.target.value)}
                    className="w-full text-xs border border-slate-800 rounded-xl px-3.5 py-3 bg-slate-950 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-250 font-medium"
                    placeholder="e.g., Senior Frontend Engineer (Pi SDK)"
                  />
                </div>

                {/* Categories & Type selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-400">Sector Category</label>
                    <select
                      value={newJobCategory}
                      onChange={(e) => setNewJobCategory(e.target.value)}
                      className="w-full text-xs border border-slate-800 rounded-xl px-3.5 py-3 bg-slate-950 focus:outline-none font-semibold text-slate-300 cursor-pointer"
                    >
                      {JOB_CATEGORIES.slice(1).map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-400">Work Setup</label>
                    <select
                      value={newJobLocType}
                      onChange={(e: any) => setNewJobLocType(e.target.value)}
                      className="w-full text-xs border border-slate-800 rounded-xl px-3.5 py-3 bg-slate-950 focus:outline-none font-semibold text-slate-300 cursor-pointer"
                    >
                      <option value="remote">🌐 Remote Setup</option>
                      <option value="on_site">📍 On-Site Location</option>
                      <option value="hybrid">🌓 Hybrid Schedule</option>
                    </select>
                  </div>
                </div>

                {/* Location text & Salary block */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-400">Location Text</label>
                    <input
                      type="text"
                      required
                      value={newJobLocation}
                      onChange={(e) => setNewJobLocation(e.target.value)}
                      className="w-full text-xs border border-slate-800 rounded-xl px-3.5 py-3 bg-slate-950 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-250 font-medium"
                      placeholder="e.g., Remote (Anywhere) or San Francisco, CA"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-400">Salary (Denominated in Pi) <span className="text-rose-500">*</span></label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        required
                        min={1}
                        value={newJobSalary}
                        onChange={(e) => setNewJobSalary(parseInt(e.target.value) || 0)}
                        className="flex-1 text-xs border border-slate-800 rounded-xl px-3.5 py-3 bg-slate-950 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-250 font-mono font-semibold"
                        placeholder="e.g., 50"
                      />
                      <select
                        value={newJobSalaryType}
                        onChange={(e: any) => setNewJobSalaryType(e.target.value)}
                        className="text-xs border border-slate-800 rounded-xl px-3 bg-slate-950 focus:outline-none font-semibold text-slate-300 cursor-pointer"
                      >
                        <option value="hourly">/ hour</option>
                        <option value="fixed">Fixed</option>
                        <option value="monthly">/ month</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400">Job Description <span className="text-rose-500">*</span></label>
                  <textarea
                    required
                    value={newJobDesc}
                    onChange={(e) => setNewJobDesc(e.target.value)}
                    rows={4}
                    className="w-full text-xs border border-slate-800 rounded-xl px-3.5 py-3 bg-slate-950 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-250 font-medium resize-none leading-relaxed"
                    placeholder="Provide a detailed description of the role, team environment, and expected outputs..."
                  />
                </div>

                {/* Requirements */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400">Key Requirements <span className="text-slate-500">(One bullet per line)</span> <span className="text-rose-500">*</span></label>
                  <textarea
                    required
                    value={newJobRequirements}
                    onChange={(e) => setNewJobRequirements(e.target.value)}
                    rows={3}
                    className="w-full text-xs border border-slate-800 rounded-xl px-3.5 py-3 bg-slate-950 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-250 font-medium resize-none leading-relaxed"
                    placeholder="e.g.&#13;3+ years of React experience&#13;Deep understanding of cryptography"
                  />
                </div>

              </div>

              <button
                type="submit"
                className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer text-center"
              >
                Publish Job Listing
              </button>
            </form>
          )}

        </div>
      )}

      {/* VIEW: MY SUBMITTED APPLICATIONS */}
      {activeTab === 'my_applications' && (
        <div className="space-y-6">
          <div className="text-left">
            <h3 className="font-sans font-bold text-slate-100 text-base">Track Applications</h3>
            <p className="text-xs text-slate-500 mt-1">Review the status of your submissions to verified Pioneer startups.</p>
          </div>

          {applications.length === 0 ? (
            <div className="bg-slate-900 border border-dashed border-slate-800 rounded-3xl py-16 text-center text-slate-500">
              <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h4 className="font-sans font-bold text-slate-300">No Submissions Recorded</h4>
              <p className="text-xs max-w-xs mx-auto mt-1 leading-normal text-slate-550">
                You haven't submitted any applications. Switch to the 'Find Work' tab to apply.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => {
                const isPending = app.status === 'pending';
                const isAccepted = app.status === 'accepted';
                const isDeclined = app.status === 'declined';
                return (
                  <div
                    key={app.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-left flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-100 leading-tight">{app.jobTitle}</h4>
                        <span className="text-[10px] text-slate-500 font-bold font-mono">App ID: #{app.id}</span>
                      </div>
                      <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                        Cover Letter excerpt: "{app.coverLetter.substring(0, 100)}..."
                      </p>
                      <div className="text-[10px] text-slate-550 font-mono flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Submitted on {new Date(app.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Status pill */}
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold font-mono ${
                        isAccepted ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : isDeclined ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-slate-950 text-slate-400 border border-slate-800'
                      }`}>
                        {app.status.toUpperCase()}
                      </span>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* JOB DETAIL & APPLICATION MODAL */}
      {selectedJob && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl max-h-[85vh] overflow-y-auto p-6 text-left relative scrollbar-none animate-scale-in">
            
            {/* Modal header */}
            <div className="flex justify-between items-start gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 border border-slate-800/80 text-violet-300 font-mono text-[9px] font-bold uppercase tracking-wider">
                  Verified Job Opening
                </span>
                <h3 className="font-sans font-extrabold text-slate-100 text-lg mt-3">
                  {selectedJob.title}
                </h3>
                <span className="text-xs text-slate-500 font-semibold block">Posted by: {selectedJob.providerName}</span>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-1.5 rounded-lg hover:bg-slate-850 text-slate-550 hover:text-slate-200 transition-colors cursor-pointer text-xs font-bold font-mono border border-slate-800"
              >
                ✕ Close
              </button>
            </div>

            {applyStep === 'input' ? (
              <div className="space-y-6 mt-6">
                
                {/* Job Info row */}
                <div className="grid grid-cols-2 gap-4 bg-slate-950/40 p-4 border border-slate-850 rounded-2xl text-xs font-mono">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-violet-400" />
                      <span>{selectedJob.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-violet-400" />
                      <span className="capitalize">{selectedJob.locationType} Setup</span>
                    </div>
                  </div>
                  <div className="space-y-2 border-l border-slate-850 pl-4">
                    <div className="flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-amber-400" />
                      <span className="text-amber-300 font-bold">{selectedJob.salaryPi} π / {selectedJob.salaryType}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-550">
                      <span>Posted {new Date(selectedJob.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Job Description */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-450">Role Description</h4>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/20 p-4 border border-slate-850 rounded-xl whitespace-pre-line">
                    {selectedJob.description}
                  </p>
                </div>

                {/* Requirements bullet list */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-450">Key Requirements</h4>
                  <ul className="space-y-1.5 text-xs text-slate-400 list-disc list-inside">
                    {selectedJob.requirements.map((req, index) => (
                      <li key={index} className="leading-relaxed pl-1">
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Application panel toggle */}
                {isApplying ? (
                  <form onSubmit={handleSubmitApplication} className="border-t border-slate-800/80 pt-5 space-y-4 animate-scale-in">
                    <div>
                      <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">Application Parameters</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Submit your credentials directly to the provider. Payout address is attached.</p>
                    </div>

                    <div className="space-y-3.5 text-xs">
                      
                      {/* Cover letter */}
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-400">Cover Letter / Pitch <span className="text-slate-500">(min. 20 chars)</span> <span className="text-rose-500">*</span></label>
                        <textarea
                          required
                          value={coverLetter}
                          onChange={(e) => setCoverLetter(e.target.value)}
                          rows={4}
                          className="w-full text-xs border border-slate-800 rounded-xl px-3.5 py-3 bg-slate-950 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-250 font-medium resize-none leading-relaxed"
                          placeholder="Introduce yourself, list your relevant projects, and outline why you are a great fit for this position..."
                        />
                      </div>

                      {/* Payment Address display */}
                      <div className="bg-slate-950 p-3.5 border border-slate-850 rounded-2xl flex items-center justify-between text-[11px] font-mono text-slate-500">
                        <div>
                          <span className="text-[9px] text-slate-650 block">Your Pi Wallet Public Key</span>
                          <span className="text-slate-400 mt-0.5 block line-clamp-1">{currentUser.walletAddress}</span>
                        </div>
                        <div className="text-[9px] font-bold text-emerald-400 flex items-center gap-0.5">
                          <CheckCircle className="w-3.5 h-3.5" /> Bound
                        </div>
                      </div>

                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setIsApplying(false)}
                        className="flex-1 py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-350 font-bold rounded-xl text-xs transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md shadow-violet-500/10"
                      >
                        Submit Application
                      </button>
                    </div>

                  </form>
                ) : (
                  <button
                    onClick={() => setIsApplying(true)}
                    className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-2xl text-xs transition-all cursor-pointer text-center block shadow-lg shadow-violet-500/10"
                  >
                    Apply for this Role
                  </button>
                )}

              </div>
            ) : (
              <div className="text-center py-10 space-y-5 animate-scale-in">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-sans font-extrabold text-slate-100 text-base">Application Submitted!</h4>
                  <p className="text-xs text-slate-400 mt-2 px-6 leading-relaxed">
                    You have successfully submitted your Pioneer profile to <span className="font-semibold text-slate-250">{selectedJob.providerName}</span>. They will review your cover letter and contact you.
                  </p>
                </div>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="w-full max-w-xs py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-all cursor-pointer mx-auto block"
                >
                  Return to Board
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
