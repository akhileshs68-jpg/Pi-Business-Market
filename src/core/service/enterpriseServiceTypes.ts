/**
 * Enterprise Service Management System - Types & Standards
 * Pi Business Market
 */

import { Service, ServicePricingType, ServiceLocationType, ServiceStatus } from '../../types';

export type UniversalServiceCategory =
  | 'Doctor & Healthcare'
  | 'Hospital & Clinic'
  | 'Teacher, Tutor & Education'
  | 'Coaching & Institutes'
  | 'Lawyer & Legal Services'
  | 'CA, CS & Financial Services'
  | 'Architect & Engineering'
  | 'Software & IT Services'
  | 'Digital Marketing & Content'
  | 'Photography & Videography'
  | 'Design & Creative'
  | 'Consulting & Business Advisory'
  | 'Travel & Tourism'
  | 'Transport & Logistics'
  | 'Restaurant & Food Service'
  | 'Salon, Spa & Beauty'
  | 'Fitness & Gym'
  | 'Repair & Maintenance'
  | 'Electrician, Plumber & Mechanical'
  | 'Construction & Real Estate'
  | 'Agriculture & Farming Services'
  | 'NGO, Trust & Social Services'
  | string;

export interface ServicePricingModel {
  pricingType: ServicePricingType | 'daily' | 'weekly' | 'monthly' | 'quote' | 'free_consultation';
  basePrice: number;
  currency: string;
  hourlyRate?: number;
  dailyRate?: number;
  weeklyRate?: number;
  monthlyRate?: number;
  customQuoteEnabled?: boolean;
  freeConsultation?: boolean;
  discountPercentage?: number;
  festivalOfferText?: string;
}

export interface ServiceScheduleAvailability {
  availabilityStatus: 'available' | 'busy' | 'closed' | 'appointment_required';
  workingDays: string[]; // ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  workingHours: string;  // e.g. "09:00 AM - 06:00 PM"
  holidayCalendar?: { date: string; title: string }[];
  emergencyServiceAvailable?: boolean;
  appointmentLeadTimeHours?: number;
  slotDurationMinutes?: number;
}

export interface ServiceLocationScope {
  locationType: ServiceLocationType;
  serviceArea?: string;
  country?: string;
  state?: string;
  district?: string;
  city?: string;
  pinCode?: string;
  serviceRadiusKm?: number;
}

export interface EnterpriseServiceProfile extends Service {
  storeId: string;
  businessId: string;
  ownerUid: string;
  professionalUid?: string;
  
  serviceCategory: UniversalServiceCategory;
  serviceSubCategory?: string;
  
  galleryImages?: string[];
  videoUrl?: string;
  brochurePdfUrl?: string;
  certificates?: string[];
  specificationsDocUrl?: string;
  
  pricingModel?: ServicePricingModel;
  scheduleAvailability?: ServiceScheduleAvailability;
  locationScope?: ServiceLocationScope;
  
  verificationStatus?: 'Pending' | 'Approved' | 'Rejected' | 'Suspended';
  verificationNotes?: string;
  
  emergencyService?: boolean;
  reviewCount?: number;
  bookingCount?: number;
  
  escrowSupported?: boolean;
  piPaymentAccepted?: boolean;
  bmpRewardsAccepted?: boolean;
}
