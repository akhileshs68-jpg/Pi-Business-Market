/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronLeft,
  Loader2,
  Briefcase,
  Layers,
  Settings2,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Database,
  Building2,
  DollarSign,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Job, EmploymentType, WorkMode } from '../../types';
import { jobService } from '../../services/jobService';

interface JobWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  businessId: string;
}

type Step = 1 | 2 | 3;

export const JobWizard: React.FC<JobWizardProps> = ({
  isOpen,
  onClose,
  onSuccess,
  businessId
}) => {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [job, setJob] = useState<Partial<Job>>({
    businessId,
    title: '',
    department: '',
    employmentType: 'full-time',
    workMode: 'on-site',
    experienceLevel: 'Mid',
    salaryType: 'range',
    salaryMin: 0,
    salaryMax: 0,
    currency: 'Pi',
    vacancies: 1,
    skills: [],
    description: '',
    requirements: [],
    benefits: [],
    location: '',
    status: 'draft',
    visibility: 'public',
    applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const [newSkill, setNewSkill] = useState('');

  const nextStep = () => setStep(s => Math.min(s + 1, 3) as Step);
  const prevStep = () => setStep(s => Math.max(s - 1, 1) as Step);

  const addSkill = () => {
    if (newSkill && !job.skills?.includes(newSkill)) {
      setJob({ ...job, skills: [...(job.skills || []), newSkill] });
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setJob({ ...job, skills: job.skills?.filter(s => s !== skill) });
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      await jobService.createJob(job as any);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to publish job opening');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20 text-white">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white leading-none mb-1 text-transform: uppercase">Job Publisher</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                <Database className="w-3 h-3 text-indigo-400" />
                Enterprise Recruitment Engine
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-slate-800 w-full">
          <motion.div 
            className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
            animate={{ width: `${(step / 3) * 100}%` }} 
          />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold flex items-center gap-3">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Basic Job Details</h3>
                  <p className="text-sm text-slate-500">Define the position and department for this role.</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Job Title</label>
                    <input 
                      value={job.title}
                      onChange={(e) => setJob({ ...job, title: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-indigo-500 outline-none transition-all font-bold"
                      placeholder="e.g., Senior Full-Stack Engineer (Web3)"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Department</label>
                    <input 
                      value={job.department}
                      onChange={(e) => setJob({ ...job, department: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-indigo-500 outline-none transition-all font-bold"
                      placeholder="e.g., Engineering, HR, Sales"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Experience Level</label>
                    <select 
                      value={job.experienceLevel}
                      onChange={(e) => setJob({ ...job, experienceLevel: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-indigo-500 outline-none transition-all font-bold"
                    >
                      <option value="Entry">Entry Level</option>
                      <option value="Mid">Mid Level</option>
                      <option value="Senior">Senior Level</option>
                      <option value="Executive">Executive / Lead</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Employment Type</label>
                    <select 
                      value={job.employmentType}
                      onChange={(e) => setJob({ ...job, employmentType: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-indigo-500 outline-none transition-all font-bold"
                    >
                      <option value="full-time">Full Time</option>
                      <option value="part-time">Part Time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                      <option value="freelance">Freelance</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Vacancies</label>
                    <input 
                      type="number"
                      value={job.vacancies}
                      onChange={(e) => setJob({ ...job, vacancies: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-indigo-500 outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                <button 
                  onClick={nextStep}
                  disabled={!job.title || !job.department}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2"
                >
                  Next: Compensation & Scope <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Logistics & Compensation</h3>
                  <p className="text-sm text-slate-500">Define how and what you will pay the candidate.</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Work Mode</label>
                    <select 
                      value={job.workMode}
                      onChange={(e) => setJob({ ...job, workMode: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-indigo-500 outline-none transition-all font-bold"
                    >
                      <option value="on-site">On-site</option>
                      <option value="remote">Remote</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Location</label>
                    <input 
                      value={job.location}
                      onChange={(e) => setJob({ ...job, location: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-indigo-500 outline-none transition-all font-bold"
                      placeholder="e.g., San Francisco, CA"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Min Salary ({job.currency})</label>
                    <input 
                      type="number"
                      value={job.salaryMin}
                      onChange={(e) => setJob({ ...job, salaryMin: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-indigo-500 outline-none transition-all font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Max Salary ({job.currency})</label>
                    <input 
                      type="number"
                      value={job.salaryMax}
                      onChange={(e) => setJob({ ...job, salaryMax: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-indigo-500 outline-none transition-all font-bold"
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Application Deadline</label>
                    <div className="relative">
                       <Calendar className="w-5 h-5 text-slate-500 absolute left-6 top-1/2 -translate-y-1/2" />
                       <input 
                        type="date"
                        value={job.applicationDeadline?.split('T')[0]}
                        onChange={(e) => setJob({ ...job, applicationDeadline: new Date(e.target.value).toISOString() })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-16 pr-6 py-4 text-white focus:border-indigo-500 outline-none transition-all font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button onClick={prevStep} className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button onClick={nextStep} className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2">
                    Next: Role Specification <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Skills & Requirements</h3>
                  <p className="text-sm text-slate-500">Provide the detailed description and required skills.</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Required Skills</label>
                    <div className="flex gap-2 mb-4">
                      <input 
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-6 py-3 text-white focus:border-indigo-500 outline-none transition-all"
                        placeholder="e.g., TypeScript, React, Rust"
                      />
                      <button 
                        onClick={addSkill}
                        className="p-3 bg-indigo-600 text-white rounded-xl"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {job.skills?.map(skill => (
                        <span key={skill} className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600/10 border border-indigo-600/20 text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                          {skill}
                          <button onClick={() => removeSkill(skill)}><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Detailed Description</label>
                    <textarea 
                      value={job.description}
                      onChange={(e) => setJob({ ...job, description: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-indigo-500 outline-none transition-all font-bold h-48 resize-none"
                      placeholder="Outline the day-to-day, the mission, and the impact..."
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button onClick={prevStep} className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShieldCheck className="w-5 h-5" /> Publish Job Opening</>}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
