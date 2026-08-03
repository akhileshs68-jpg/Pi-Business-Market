import { authService } from '../auth/authService';

export interface PiPaymentCallbacks {
  onReadyForServerApproval: (paymentId: string) => Promise<void> | void;
  onReadyForServerCompletion: (paymentId: string, txid: string) => Promise<void> | void;
  onCancel: (paymentId: string) => Promise<void> | void;
  onError: (error: Error, paymentId: string) => Promise<void> | void;
}

export interface PiPaymentData {
  amount: number;
  memo: string;
  metadata: any;
}

let isPaymentInProgress = false;

export const piPaymentService = {
  async createPayment(
    paymentData: PiPaymentData,
    callbacks: PiPaymentCallbacks
  ): Promise<void> {
    if (isPaymentInProgress) {
      console.warn('[PiPaymentService] Payment already in progress. Ignoring duplicate request.');
      if (callbacks.onError) {
        await callbacks.onError(new Error('A payment is already in progress. Please wait.'), 'duplicate');
      }
      return;
    }
    
    isPaymentInProgress = true;
    
    try {
      console.log('[PiPaymentService] Starting payment flow for amount:', paymentData.amount);
      const isPreviewDomain = typeof window !== 'undefined' && (
        window.location.hostname.includes('run.app') || 
        window.location.hostname.includes('vercel.app') || 
        window.location.hostname.includes('localhost') ||
        window.location.hostname.includes('127.0.0.1')
      );
      const isPiBrowserApp = typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.includes('PiBrowser');
      const isRealPiBrowser = typeof window !== 'undefined' && typeof window.Pi !== 'undefined' && (isPiBrowserApp || !isPreviewDomain);
      
      if (isRealPiBrowser) {
        console.log('[PiPaymentService] Ensuring authenticated for payments scope in Pi Browser...');
        await authService.initPi();
        await authService.authenticatePi(['payments']);

        console.log('[PiPaymentService] Payment Created - calling window.Pi.createPayment()');
        
        window.Pi.createPayment(
          {
            amount: paymentData.amount,
            memo: paymentData.memo,
            metadata: paymentData.metadata
          },
          {
            onReadyForServerApproval: async (paymentId: string) => {
              console.log('[PiPaymentService] Approval Callback Entered. Payment Created on Pi servers with ID:', paymentId);
              try {
                console.log('[PiPaymentService] Awaiting consumer onReadyForServerApproval callback...');
                await callbacks.onReadyForServerApproval(paymentId);
                console.log('[PiPaymentService] Approval Callback Finished for Payment ID:', paymentId);
              } catch (err: any) {
                console.error('[PiPaymentService] Approval Callback Failed:', err);
                throw err;
              }
            },
            onReadyForServerCompletion: async (paymentId: string, txid: string) => {
              console.log('[PiPaymentService] Completion Callback Entered for Payment ID:', paymentId, 'TxID:', txid);
              try {
                console.log('[PiPaymentService] Awaiting consumer onReadyForServerCompletion callback...');
                await callbacks.onReadyForServerCompletion(paymentId, txid);
                console.log('[PiPaymentService] Completion Finished for Payment ID:', paymentId);
              } catch (err: any) {
                console.error('[PiPaymentService] Completion Callback Failed:', err);
                throw err;
              } finally {
                isPaymentInProgress = false;
              }
            },
            onCancel: async (paymentId: string) => {
              isPaymentInProgress = false;
              console.log('[PiPaymentService] Payment Cancelled by user for Payment ID:', paymentId);
              try {
                if (callbacks.onCancel) {
                  await callbacks.onCancel(paymentId);
                }
              } catch (err) {
                console.error('[PiPaymentService] Error in onCancel callback:', err);
              }
            },
            onError: async (error: Error, paymentId: string) => {
              isPaymentInProgress = false;
              console.error('[PiPaymentService] Pi SDK Payment Error for Payment ID:', paymentId, error);
              try {
                if (callbacks.onError) {
                  await callbacks.onError(error, paymentId);
                }
              } catch (err) {
                console.error('[PiPaymentService] Error in onError callback:', err);
              }
            }
          }
        );
      } else {
        console.log('[PiPaymentService] Web preview environment detected. Simulating Pi payment flow...');
        
        setTimeout(async () => {
          const mockPaymentId = 'SIM_' + Math.random().toString(36).substring(2, 9).toUpperCase();
          console.log('[PiPaymentService] [Simulated] Approval Callback Entered for Payment ID:', mockPaymentId);
          try {
            await callbacks.onReadyForServerApproval(mockPaymentId);
            console.log('[PiPaymentService] [Simulated] Approval Callback Finished.');
            
            setTimeout(async () => {
              const mockTxid = 'TX_' + Math.random().toString(36).substring(2, 9).toUpperCase();
              console.log('[PiPaymentService] [Simulated] Completion Callback Entered for Payment ID:', mockPaymentId, 'TxID:', mockTxid);
              try {
                await callbacks.onReadyForServerCompletion(mockPaymentId, mockTxid);
                console.log('[PiPaymentService] [Simulated] Completion Finished.');
              } catch (e: any) {
                console.error('[PiPaymentService] [Simulated] Completion error:', e);
                if (callbacks.onError) callbacks.onError(e, mockPaymentId);
              } finally {
                isPaymentInProgress = false;
              }
            }, 1000);
          } catch (e: any) {
            console.error('[PiPaymentService] [Simulated] Approval error:', e);
            isPaymentInProgress = false;
            if (callbacks.onError) callbacks.onError(e, mockPaymentId);
          }
        }, 800);
      }
    } catch (err: any) {
      isPaymentInProgress = false;
      console.error('[PiPaymentService] Initialization error in createPayment:', err);
      if (callbacks.onError) {
        await callbacks.onError(err instanceof Error ? err : new Error("Unable to connect to Pi Network. Please try again."), 'init_failed');
      }
    }
  }
};

