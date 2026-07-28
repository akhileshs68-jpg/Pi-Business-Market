/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { authService } from '../auth/authService';
import { PiSdkSim } from './piSdk';

export interface PiPaymentCallbacks {
  onReadyForServerApproval: (paymentId: string) => void;
  onReadyForServerCompletion: (paymentId: string, txid: string) => void;
  onCancel: (paymentId: string) => void;
  onError: (error: Error, paymentId: string) => void;
}

export interface PiPaymentData {
  amount: number;
  memo: string;
  metadata: {
    productId?: string;
    productName?: string;
    productType?: string;
    orderId?: string;
    storeId?: string;
    itemsCount?: number;
    [key: string]: any;
  };
}

export const piPaymentService = {
  /**
   * Executes a User-to-App (U2A) Pi payment following official Pi SDK specifications
   * 1. Awaits Pi.init() before any createPayment call
   * 2. Calls window.Pi.createPayment(...) in Pi Browser
   * 3. Calls backend endpoints /api/payments/approve and /api/payments/complete
   */
  async createPayment(
    paymentData: PiPaymentData,
    callbacks: PiPaymentCallbacks
  ): Promise<void> {
    try {
      // Step 1: MUST await Pi.init() before calling Pi.createPayment()
      await authService.initPi();

      const isPiBrowser = typeof navigator !== 'undefined' && /PiBrowser/i.test(navigator.userAgent);
      const isPreviewDomain = typeof window !== 'undefined' && (
        window.location.hostname.includes('run.app') || 
        window.location.hostname.includes('vercel.app') || 
        window.location.hostname.includes('localhost') ||
        window.location.hostname.includes('127.0.0.1')
      );

      // Use real window.Pi if available in Pi Browser
      if (typeof window !== 'undefined' && window.Pi && isPiBrowser && !isPreviewDomain) {
        console.log('[PiPaymentService] Launching real Pi.createPayment...', paymentData);

        window.Pi.createPayment(
          {
            amount: paymentData.amount,
            memo: paymentData.memo,
            metadata: paymentData.metadata
          },
          {
            onReadyForServerApproval: async (paymentId: string) => {
              console.log('[PiPaymentService] Payment created on Pi servers, paymentId:', paymentId);
              try {
                const res = await fetch('/api/payments/approve', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ paymentId, metadata: paymentData.metadata })
                });

                if (!res.ok) {
                  const errData = await res.json().catch(() => ({}));
                  throw new Error(errData.error || 'Server approval failed');
                }

                callbacks.onReadyForServerApproval(paymentId);
              } catch (err: any) {
                console.error('[PiPaymentService] Server approval error:', err);
                callbacks.onError(err instanceof Error ? err : new Error(String(err)), paymentId);
              }
            },
            onReadyForServerCompletion: async (paymentId: string, txid: string) => {
              console.log('[PiPaymentService] Payment signed on blockchain, txid:', txid);
              try {
                const res = await fetch('/api/payments/complete', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ paymentId, txid, metadata: paymentData.metadata })
                });

                if (!res.ok) {
                  const errData = await res.json().catch(() => ({}));
                  throw new Error(errData.error || 'Server completion failed');
                }

                callbacks.onReadyForServerCompletion(paymentId, txid);
              } catch (err: any) {
                console.error('[PiPaymentService] Server completion error:', err);
                callbacks.onError(err instanceof Error ? err : new Error(String(err)), paymentId);
              }
            },
            onCancel: (paymentId: string) => {
              console.log('[PiPaymentService] Payment cancelled by user:', paymentId);
              callbacks.onCancel(paymentId);
            },
            onError: (error: Error, paymentId: string) => {
              console.error('[PiPaymentService] Pi SDK Payment Error:', error, paymentId);
              callbacks.onError(error, paymentId);
            }
          }
        );
      } else {
        // Developer sandbox / web preview simulation
        console.log('[PiPaymentService] Running in sandbox mode, simulating Pi payment workflow...');
        
        PiSdkSim.executePayment(paymentData, {
          onReadyForServerApproval: async (paymentId: string) => {
            console.log('[PiPaymentService Sandbox] Approving on backend...');
            try {
              await fetch('/api/payments/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentId, metadata: paymentData.metadata })
              });
            } catch (err) {
              console.warn('[PiPaymentService Sandbox] Backend approve call warning:', err);
            }
            callbacks.onReadyForServerApproval(paymentId);
          },
          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            console.log('[PiPaymentService Sandbox] Completing on backend...');
            try {
              await fetch('/api/payments/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentId, txid, metadata: paymentData.metadata })
              });
            } catch (err) {
              console.warn('[PiPaymentService Sandbox] Backend complete call warning:', err);
            }
            callbacks.onReadyForServerCompletion(paymentId, txid);
          },
          onCancel: (paymentId: string) => {
            callbacks.onCancel(paymentId);
          },
          onError: (error: Error, paymentId: string) => {
            callbacks.onError(error, paymentId);
          }
        });
      }
    } catch (err: any) {
      console.error('[PiPaymentService] Initialization error:', err);
      callbacks.onError(err instanceof Error ? err : new Error(String(err)), 'init_failed');
    }
  }
};
