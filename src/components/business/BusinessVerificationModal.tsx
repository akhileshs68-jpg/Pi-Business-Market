/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, X, Building2, CheckCircle2, FileText, Upload, AlertCircle, Sparkles, UserCheck, ArrowRight, ArrowLeft 
} from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '../../firebase/config';

export type EntityType = 
  | 'Individual'
  | 'Retail Shop'
  | 'Private Limited'
  | 'LLP'
  | 'NGO'
  | 'Trust'
  | 'Society'
  | 'Startup'
  | 'Educational Institution'
  | 'Hospital'
  | 'Clinic'
  | 'Professional'
  | 'Freelancer'
  | 'Consultant'
  | 'Government Vendor';

const ENTITY_TYPES: EntityType[] = [
  'Individual',
  'Retail Shop',
  'Private Limited',
  'LLP',
  'NGO',
  'Trust',
  'Society',
  'Startup',
  'Educational Institution',
  'Hospital',
  'Clinic',
  'Professional',
  'Freelancer',
  'Consultant',
  'Government Vendor'
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  businessName: string;
  userId: string;
  onVerifiedSubmitted?: () => void;
}

export const BusinessVerificationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  businessId,
  businessName,
  userId,
  onVerifiedSubmitted
}) => {
  const [step, setStep] = useState<number>(1);
  const [entityType, setEntityType] = useState<EntityType>('Private Limited');
  const [formData, setFormData] = useState({
    legalName: businessName || '',
    registrationNumber: '',
    taxId: '',
    country: 'Global / Multi-Region',
    officialAddress: '',
    websiteUrl: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    docType: 'Passport / National ID'
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmitVerification = async () => {
    setLoading(true);
    try {
      const db = getFirebaseDb();
      const verificationRef = doc(db, 'business_verifications', businessId);

      await setDoc(verificationRef, {
        businessId,
        userId,
        entityType,
        ...formData,
        status: 'Pending Audit',
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Update business status in businesses collection
      const businessRef = doc(db, 'businesses', businessId);
      await setDoc(businessRef, {
        verificationStatus: 'Pending Verification',
        entityType,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setSubmitted(true);
      if (onVerifiedSubmitted) onVerifiedSubmitted();
    } catch (err) {
      console.error('Failed to submit business verification', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl relative overflow-hidden space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-2xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-tight">Enterprise Business Verification</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Multi-Step Compliance & Blue Tick Verification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-xl transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Tracker */}
        {!submitted && (
          <div className="flex items-center justify-between px-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl font-mono text-xs font-black flex items-center justify-center transition-all ${
                  step === s ? 'bg-violet-600 text-white shadow-lg' : step > s ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-950 text-slate-600 border border-slate-800'
                }`}>
                  {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                </div>
                {s < 4 && <div className={`w-12 h-0.5 ${step > s ? 'bg-emerald-500/50' : 'bg-slate-800'}`} />}
              </div>
            ))}
          </div>
        )}

        {/* Step Content */}
        {submitted ? (
          <div className="p-8 bg-slate-950 border border-emerald-500/30 rounded-2xl text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-black text-white">Verification Audit Submitted!</h4>
              <p className="text-xs text-slate-400">Your entity audit for <span className="text-violet-400 font-bold">{formData.legalName}</span> ({entityType}) is currently under review by compliance consensus nodes.</p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
            >
              Done & Return to Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {step === 1 && (
              <div className="space-y-4">
                <label className="text-xs font-black text-slate-300 uppercase tracking-wider block">
                  Step 1: Select Operational Entity Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                  {ENTITY_TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setEntityType(t)}
                      className={`p-3 border rounded-2xl text-left transition-all ${
                        entityType === t
                          ? 'bg-violet-600/20 border-violet-500 text-white font-black shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <p className="text-xs font-bold truncate">{t}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <label className="text-xs font-black text-slate-300 uppercase tracking-wider block">
                  Step 2: Legal Registration Details ({entityType})
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold block mb-1">Official Legal Name</span>
                    <input
                      type="text"
                      value={formData.legalName}
                      onChange={e => setFormData({ ...formData, legalName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block mb-1">Company / Tax / GST ID</span>
                    <input
                      type="text"
                      placeholder="e.g. REG-88492041"
                      value={formData.registrationNumber}
                      onChange={e => setFormData({ ...formData, registrationNumber: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 font-bold block mb-1">Official Business Address</span>
                    <input
                      type="text"
                      placeholder="Street, City, State, Country"
                      value={formData.officialAddress}
                      onChange={e => setFormData({ ...formData, officialAddress: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <label className="text-xs font-black text-slate-300 uppercase tracking-wider block">
                  Step 3: Business Representative / Director Identity
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold block mb-1">Representative Legal Name</span>
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={formData.ownerName}
                      onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block mb-1">Official Email</span>
                    <input
                      type="email"
                      placeholder="merchant@domain.com"
                      value={formData.ownerEmail}
                      onChange={e => setFormData({ ...formData, ownerEmail: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <label className="text-xs font-black text-slate-300 uppercase tracking-wider block">
                  Step 4: Audit & Submit Compliance Documentation
                </label>
                <div className="p-4 bg-slate-950 border border-dashed border-slate-800 rounded-2xl text-center space-y-2">
                  <Upload className="w-8 h-8 text-violet-400 mx-auto" />
                  <p className="text-xs font-bold text-white">Upload Registration Certificate or Tax ID Proof</p>
                  <p className="text-[10px] text-slate-500">Supported formats: PDF, PNG, JPG (Max 10MB)</p>
                  <button className="px-4 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:text-white transition-all">
                    Choose File
                  </button>
                </div>
              </div>
            )}

            {/* Navigation Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              {step > 1 ? (
                <button
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold flex items-center gap-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
              ) : <div />}

              {step < 4 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md"
                >
                  Next Step <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleSubmitVerification}
                  disabled={loading}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg"
                >
                  {loading ? 'Submitting...' : 'Submit Entity Audit'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
