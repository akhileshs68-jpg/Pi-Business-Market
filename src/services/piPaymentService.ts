import { authService, isRealPiBrowser, hasNativePaymentsScope } from '../auth/authService';

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
    console.log('[DEBUG_TRACE] [createPayment] ENTER');
    console.log('[DEBUG_TRACE] [createPayment] paymentData:', paymentData);
    console.log('[DEBUG_TRACE] [createPayment] document.referrer:', document.referrer);
    console.log('[DEBUG_TRACE] [createPayment] window.location.origin:', window.location.origin);
    console.log('[DEBUG_TRACE] [createPayment] window.location.href:', window.location.href);
    console.log('[DEBUG_TRACE] [createPayment] typeof window.Pi:', typeof (window as any).Pi);
    console.log('[DEBUG_TRACE] [createPayment] typeof window.Pi.createPayment:', typeof (window as any).Pi?.createPayment);
    console.log('[DEBUG_TRACE] [createPayment] typeof window.Pi.completePayment:', typeof (window as any).Pi?.completePayment);
    console.log('[DEBUG_TRACE] [createPayment] isPaymentInProgress state:', isPaymentInProgress);

    if (isPaymentInProgress) {
      console.warn('[DEBUG_TRACE] [createPayment] Payment already in progress. Ignoring duplicate request.');
      if (callbacks.onError) {
        console.log('[DEBUG_TRACE] [createPayment] BEFORE await callbacks.onError (duplicate)');
        await callbacks.onError(new Error('A payment is already in progress. Please wait.'), 'duplicate');
        console.log('[DEBUG_TRACE] [createPayment] AFTER await callbacks.onError (duplicate)');
      }
      console.log('[DEBUG_TRACE] [createPayment] EXIT (duplicate block)');
      return;
    }
    
    isPaymentInProgress = true;
    
    try {
      const isRealPi = isRealPiBrowser();
      console.log('[DEBUG_TRACE] [createPayment] isRealPiBrowser:', isRealPi);
      
      if (isRealPi) {
        console.log('[DEBUG_TRACE] [createPayment] Real Pi Browser detected. BEFORE await authService.initPi()');
        await authService.initPi();
        console.log('[DEBUG_TRACE] [createPayment] AFTER await authService.initPi()');

        // Check if the native SDK has active payments scope right now
        const hasScope = hasNativePaymentsScope();
        console.log('[DEBUG_TRACE] [createPayment] hasNativePaymentsScope check:', hasScope);

        console.log('[DEBUG_TRACE] [createPayment] BEFORE await authService.authenticatePi() with forceRefresh:', !hasScope);
        // Force refresh / real native handshake if scope is missing in window.Pi
        await authService.authenticatePi(['username', 'payments'], !hasScope);
        console.log('[DEBUG_TRACE] [createPayment] AFTER await authService.authenticatePi()');

        console.log('[DEBUG_TRACE] [createPayment] BEFORE callback registration & window.Pi.createPayment() call', {
          amount: paymentData.amount,
          memo: paymentData.memo,
          metadata: paymentData.metadata,
          referrer: document.referrer,
          origin: window.location.origin,
          href: window.location.href
        });
        console.log('[DEBUG_TRACE] [createPayment] callbacks registered:', Object.keys(callbacks));
        
        console.log('[DEBUG_TRACE] [createPayment] IMMEDIATELY BEFORE window.Pi.createPayment() call');
        window.Pi.createPayment(
          {
            amount: paymentData.amount,
            memo: paymentData.memo,
            metadata: paymentData.metadata
          },
          {
            onReadyForServerApproval: async (paymentId: string) => {
              console.log('[DEBUG_TRACE] [piPaymentService.onReadyForServerApproval] ENTER for paymentId:', paymentId, {
                referrer: document.referrer,
                origin: window.location.origin,
                href: window.location.href
              });
              try {
                console.log('[DEBUG_TRACE] [piPaymentService.onReadyForServerApproval] BEFORE await callbacks.onReadyForServerApproval');
                await callbacks.onReadyForServerApproval(paymentId);
                console.log('[DEBUG_TRACE] [piPaymentService.onReadyForServerApproval] AFTER await callbacks.onReadyForServerApproval');
              } catch (err: any) {
                console.error('[DEBUG_TRACE] [piPaymentService.onReadyForServerApproval] Failed:', err);
                throw err;
              }
              console.log('[DEBUG_TRACE] [piPaymentService.onReadyForServerApproval] EXIT');
            },
            onReadyForServerCompletion: async (paymentId: string, txid: string) => {
              console.log('[DEBUG_TRACE] [piPaymentService.onReadyForServerCompletion] ENTER for paymentId:', paymentId, 'txid:', txid, {
                referrer: document.referrer,
                origin: window.location.origin,
                href: window.location.href
              });
              try {
                console.log('[DEBUG_TRACE] [piPaymentService.onReadyForServerCompletion] BEFORE await callbacks.onReadyForServerCompletion');
                await callbacks.onReadyForServerCompletion(paymentId, txid);
                console.log('[DEBUG_TRACE] [piPaymentService.onReadyForServerCompletion] AFTER await callbacks.onReadyForServerCompletion');
              } catch (err: any) {
                console.error('[DEBUG_TRACE] [piPaymentService.onReadyForServerCompletion] Failed:', err);
                throw err;
              } finally {
                isPaymentInProgress = false;
              }
              console.log('[DEBUG_TRACE] [piPaymentService.onReadyForServerCompletion] EXIT');
            },
            onCancel: async (paymentId: string) => {
              isPaymentInProgress = false;
              console.log('[DEBUG_TRACE] [piPaymentService.onCancel] ENTER for paymentId:', paymentId);
              try {
                if (callbacks.onCancel) {
                  console.log('[DEBUG_TRACE] [piPaymentService.onCancel] BEFORE await callbacks.onCancel');
                  await callbacks.onCancel(paymentId);
                  console.log('[DEBUG_TRACE] [piPaymentService.onCancel] AFTER await callbacks.onCancel');
                }
              } catch (err) {
                console.error('[DEBUG_TRACE] [piPaymentService.onCancel] Error in callback:', err);
              }
              console.log('[DEBUG_TRACE] [piPaymentService.onCancel] EXIT');
            },
            onError: async (error: Error, paymentId: string) => {
              isPaymentInProgress = false;
              console.error('[DEBUG_TRACE] [piPaymentService.onError] ENTER for paymentId:', paymentId, 'error:', error);
              try {
                if (callbacks.onError) {
                  console.log('[DEBUG_TRACE] [piPaymentService.onError] BEFORE await callbacks.onError');
                  await callbacks.onError(error, paymentId);
                  console.log('[DEBUG_TRACE] [piPaymentService.onError] AFTER await callbacks.onError');
                }
              } catch (err) {
                console.error('[DEBUG_TRACE] [piPaymentService.onError] Error in callback:', err);
              }
              console.log('[DEBUG_TRACE] [piPaymentService.onError] EXIT');
            }
          }
        );
        console.log('[DEBUG_TRACE] [createPayment] IMMEDIATELY AFTER window.Pi.createPayment() call completed synchronous execution');
      } else {
        console.log('[DEBUG_TRACE] [createPayment] Web preview environment detected. Simulating Pi payment flow...');
        
        setTimeout(async () => {
          const mockPaymentId = 'SIM_' + Math.random().toString(36).substring(2, 9).toUpperCase();
          console.log('[DEBUG_TRACE] [createPayment mock] Approval Callback ENTERED for paymentId:', mockPaymentId);
          try {
            console.log('[DEBUG_TRACE] [createPayment mock] BEFORE await callbacks.onReadyForServerApproval');
            await callbacks.onReadyForServerApproval(mockPaymentId);
            console.log('[DEBUG_TRACE] [createPayment mock] AFTER await callbacks.onReadyForServerApproval');
            
            setTimeout(async () => {
              const mockTxid = 'TX_' + Math.random().toString(36).substring(2, 9).toUpperCase();
              console.log('[DEBUG_TRACE] [createPayment mock] Completion Callback ENTERED for paymentId:', mockPaymentId, 'txid:', mockTxid);
              try {
                console.log('[DEBUG_TRACE] [createPayment mock] BEFORE await callbacks.onReadyForServerCompletion');
                await callbacks.onReadyForServerCompletion(mockPaymentId, mockTxid);
                console.log('[DEBUG_TRACE] [createPayment mock] AFTER await callbacks.onReadyForServerCompletion');
              } catch (e: any) {
                console.error('[DEBUG_TRACE] [createPayment mock] Completion error:', e);
                if (callbacks.onError) callbacks.onError(e, mockPaymentId);
              } finally {
                isPaymentInProgress = false;
              }
            }, 800);
          } catch (e: any) {
            console.error('[DEBUG_TRACE] [createPayment mock] Approval error:', e);
            isPaymentInProgress = false;
            if (callbacks.onError) callbacks.onError(e, mockPaymentId);
          }
        }, 800);
      }
      console.log('[DEBUG_TRACE] [createPayment] EXIT');
    } catch (err: any) {
      isPaymentInProgress = false;
      console.error('[DEBUG_TRACE] [createPayment] Initialization catch error:', err);
      if (callbacks.onError) {
        console.log('[DEBUG_TRACE] [createPayment] BEFORE await callbacks.onError (catch)');
        await callbacks.onError(err instanceof Error ? err : new Error("Unable to connect to Pi Network. Please try again."), 'init_failed');
        console.log('[DEBUG_TRACE] [createPayment] AFTER await callbacks.onError (catch)');
      }
      console.log('[DEBUG_TRACE] [createPayment] EXIT (catch block)');
    }
  }
};


