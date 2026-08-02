/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AccessRole = 
  | 'SuperAdmin' 
  | 'PlatformAdmin' 
  | 'Moderator' 
  | 'BusinessOwner' 
  | 'StoreManager' 
  | 'Seller' 
  | 'Buyer' 
  | 'Professional' 
  | 'SupportAgent' 
  | 'Finance' 
  | 'Marketing';

export interface SecuritySession {
  sessionId: string;
  userUid: string;
  deviceInfo: string;
  ipAddress: string;
  createdAt: string;
  lastActiveAt: string;
  expiresAt: string;
  status: 'active' | 'revoked' | 'expired';
  isMfaVerified: boolean;
}

export interface SecurityEvent {
  eventId: string;
  userUid?: string;
  eventType: 'FAILED_LOGIN' | 'BLOCKED_ACCOUNT' | 'SUSPICIOUS_ACTIVITY' | 'FRAUD_ALERT' | 'RATE_LIMIT_EXCEEDED' | 'UNAUTHORIZED_ACCESS' | 'WALLET_ANOMALY';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: any;
  timestamp: string;
  ipAddress?: string;
  resolved: boolean;
}

export interface FraudSignal {
  signalId: string;
  targetId: string;
  targetType: 'user' | 'order' | 'review' | 'wallet' | 'reward';
  reason: string;
  confidenceScore: number;
  timestamp: string;
  status: 'pending' | 'investigating' | 'confirmed' | 'false_positive';
}

export interface DataExportRequest {
  requestId: string;
  userUid: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: string;
  completedAt?: string;
  downloadUrl?: string;
}
