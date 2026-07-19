/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  updateDoc,
  Timestamp,
  deleteDoc,
  limit
} from 'firebase/firestore';
import { getFirebaseDb } from '../firebase/config';
import { Job, JobApplication, CandidateProfile, SavedJob, HiringStatus } from '../types';

export const jobService = {
  /**
   * JOB MANAGEMENT (Employer)
   */
  async createJob(job: Omit<Job, 'jobId' | 'createdAt' | 'updatedAt' | 'slug'>): Promise<string> {
    const db = getFirebaseDb();
    const jobId = Math.random().toString(36).substring(2, 15);
    const slug = job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 5);

    await setDoc(doc(db, 'jobs', jobId), {
      ...job,
      jobId,
      slug,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return jobId;
  },

  async getBusinessJobs(businessId: string): Promise<Job[]> {
    const db = getFirebaseDb();
    const q = query(
      collection(db, 'jobs'), 
      where('businessId', '==', businessId),
      where('status', '!=', 'deleted')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => this.mapDocToJob(doc));
  },

  async updateJob(jobId: string, updates: Partial<Job>): Promise<void> {
    const db = getFirebaseDb();
    await updateDoc(doc(db, 'jobs', jobId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  /**
   * MARKETPLACE (Candidate)
   */
  async getAllActiveJobs(filters?: any): Promise<Job[]> {
    const db = getFirebaseDb();
    // In a real app, we would build dynamic queries based on filters
    const q = query(
      collection(db, 'jobs'), 
      where('status', '==', 'published'),
      where('visibility', '==', 'public'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => this.mapDocToJob(doc));
  },

  /**
   * APPLICATION MANAGEMENT
   */
  async applyForJob(application: Omit<JobApplication, 'applicationId' | 'appliedAt' | 'updatedAt' | 'status'>): Promise<string> {
    const db = getFirebaseDb();
    const applicationId = Math.random().toString(36).substring(2, 15);
    
    // Check for duplicate
    const q = query(
      collection(db, 'jobApplications'),
      where('jobId', '==', application.jobId),
      where('candidateId', '==', application.candidateId)
    );
    const existing = await getDocs(q);
    if (!existing.empty) {
      throw new Error('You have already applied for this position.');
    }

    await setDoc(doc(db, 'jobApplications', applicationId), {
      ...application,
      applicationId,
      status: 'applied',
      appliedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return applicationId;
  },

  async getJobApplications(jobId: string): Promise<JobApplication[]> {
    const db = getFirebaseDb();
    const q = query(collection(db, 'jobApplications'), where('jobId', '==', jobId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => this.mapDocToApplication(doc));
  },

  async updateApplicationStatus(applicationId: string, status: HiringStatus): Promise<void> {
    const db = getFirebaseDb();
    await updateDoc(doc(db, 'jobApplications', applicationId), {
      status,
      updatedAt: serverTimestamp()
    });
  },

  /**
   * CANDIDATE PROFILES
   */
  async getCandidateProfile(userUid: string): Promise<CandidateProfile | null> {
    const db = getFirebaseDb();
    const q = query(collection(db, 'candidateProfiles'), where('userUid', '==', userUid));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const data = snapshot.docs[0].data();
    return {
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
    } as CandidateProfile;
  },

  async saveCandidateProfile(profile: CandidateProfile): Promise<void> {
    const db = getFirebaseDb();
    await setDoc(doc(db, 'candidateProfiles', profile.candidateId), {
      ...profile,
      updatedAt: serverTimestamp()
    }, { merge: true });
  },

  /**
   * HELPERS
   */
  mapDocToJob(doc: any): Job {
    const data = doc.data();
    return {
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
    } as Job;
  },

  mapDocToApplication(doc: any): JobApplication {
    const data = doc.data();
    return {
      ...data,
      appliedAt: data.appliedAt instanceof Timestamp ? data.appliedAt.toDate().toISOString() : data.appliedAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
    } as JobApplication;
  }
};
