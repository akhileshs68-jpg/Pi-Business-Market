import { authService } from '../auth/authService';

export interface PiPaymentCallbacks {
  onReadyForServerApproval: (paymentId: string) => void;
  onReadyForServerCompletion: (paymentId: string, txid: string) => void;
  onCancel: (paymentId: string) => void;
  onError: (error: Error, paymentId: string) => void;
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
      callbacks.onError(new Error('A payment is already in progress. Please wait.'), 'duplicate');
      return;
    }
    
    isPaymentInProgress = true;
    
    try {
      console.log('[PiPaymentService] Payment start. Authenticating for payments scope...');
      await authService.authenticatePi(['payments']);
      console.log('[PiPaymentService] Authenticated successfully with payments scope');

      if (typeof window !== 'undefined' && window.Pi) {
        console.log('[PiPaymentService] Launching Pi.createPayment...', paymentData);
        window.Pi.createPayment(
          {
            amount: paymentData.amount,
            memo: paymentData.memo,
            metadata: paymentData.metadata
          },
          {
            onReadyForServerApproval: async (paymentId: string) => {
              console.log('[PiPaymentService] Payment created on Pi servers:', paymentId);
              callbacks.onReadyForServerApproval(paymentId);
            },
            onReadyForServerCompletion: async (paymentId: string, txid: string) => {
              isPaymentInProgress = false;
              console.log('[PiPaymentService] Payment signed on blockchain, txid:', txid);
              callbacks.onReadyForServerCompletion(paymentId, txid);
            },
            onCancel: (paymentId: string) => {
              isPaymentInProgress = false;
              console.log('[PiPaymentService] Payment cancelled by user:', paymentId);
              callbacks.onCancel(paymentId);
            },
            onError: (error: Error, paymentId: string) => {
              isPaymentInProgress = false;
              console.error('[PiPaymentService] Pi SDK Payment Error:', error, paymentId);
              callbacks.onError(error, paymentId);
            }
          }
        );
      } else {
        throw new Error("Pi SDK is not available. Please run inside the Pi Browser.");
      }
    } catch (err: any) {
      isPaymentInProgress = false;
      console.error('[PiPaymentService] Initialization error:', err);
      callbacks.onError(new Error("Unable to connect to Pi Network. Please try again."), 'init_failed');
    }
  }
};
