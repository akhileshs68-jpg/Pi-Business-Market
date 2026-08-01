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
      console.log('[PiPayment] Starting payment');
      const isPiBrowser = typeof window !== 'undefined' && typeof window.Pi !== 'undefined';
      
      if (isPiBrowser) {
        const isPreviewDomain = window.location.hostname.includes('run.app') || 
                                window.location.hostname.includes('vercel.app') || 
                                window.location.hostname.includes('localhost') ||
                                window.location.hostname.includes('googleusercontent.com') ||
                                window.location.hostname.includes('aistudio');

        const cachedStr = sessionStorage.getItem('pi_auth_session');
        if (cachedStr) {
          console.log('[PiPayment] Using existing Pi session');
        } else {
          console.log('[PiPaymentService] Initializing Pi SDK and authenticating for payments scope...');
          await authService.initPi();
          try {
            await authService.authenticatePi(['payments']);
          } catch (err: any) {
            throw err;
          }
          console.log('[PiPaymentService] Authenticated with payments scope.');
        }

        console.log('[PiPayment] Calling createPayment()');
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
              console.log('[PiPaymentService] Payment completed on blockchain, txid:', txid);
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
        console.warn('[PiPaymentService] window.Pi not found. Simulating payment flow for testing...');
        
        // Simulate Pi Payment flow
        setTimeout(() => {
            const mockPaymentId = 'SIM_' + Math.random().toString(36).substring(7);
            callbacks.onReadyForServerApproval(mockPaymentId);
            
            setTimeout(() => {
                const mockTxid = 'TX_' + Math.random().toString(36).substring(7);
                callbacks.onReadyForServerCompletion(mockPaymentId, mockTxid);
                isPaymentInProgress = false;
            }, 2000);
        }, 1500);
      }
    } catch (err: any) {
      isPaymentInProgress = false;
      console.error('[PiPaymentService] Initialization error:', err);
      callbacks.onError(err instanceof Error ? err : new Error("Unable to connect to Pi Network. Please try again."), 'init_failed');
    }
  }
};
