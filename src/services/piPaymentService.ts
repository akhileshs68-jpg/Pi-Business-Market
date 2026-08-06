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
      console.log('[DEBUG_TRACE] [createPayment] Initializing Pi SDK...');
      await authService.initPi();

      const piInstance = (window as any).Pi;
      const isPiSdkAvailable = typeof piInstance?.createPayment === 'function';
      console.log('[DEBUG_TRACE] [createPayment] isPiSdkAvailable:', isPiSdkAvailable);

      if (!isPiSdkAvailable) {
        const notAvailableErr = new Error(
          "Official Pi Wallet SDK is not available in this browser environment. Please open Pi Business Market inside the official Pi Browser to process payments with your Pi Testnet Wallet."
        );
        console.error('[DEBUG_TRACE] [createPayment]', notAvailableErr.message);
        isPaymentInProgress = false;
        if (callbacks.onError) {
          await callbacks.onError(notAvailableErr, 'pi_sdk_unavailable');
        }
        return;
      }

      // Check if native SDK has active payments scope
      const hasScope = hasNativePaymentsScope();
      console.log('[DEBUG_TRACE] [createPayment] hasNativePaymentsScope check:', hasScope);

      console.log('[DEBUG_TRACE] [createPayment] BEFORE await authService.authenticatePi() with forceRefresh:', !hasScope);
      const piAuth = await authService.authenticatePi(['username', 'payments'], !hasScope);
      console.log('[DEBUG_TRACE] [createPayment] AFTER await authService.authenticatePi(), resolved auth:', piAuth);

      const authenticatedUsername = piAuth?.user?.username;
      const authenticatedPiUid = piAuth?.user?.uid || authenticatedUsername;

      if (!authenticatedUsername) {
        const noUsernameErr = new Error(
          "Unable to verify Pi account username from Pi Network authentication response. Payment cancelled."
        );
        console.error('[DEBUG_TRACE] [createPayment]', noUsernameErr.message);
        isPaymentInProgress = false;
        if (callbacks.onError) {
          await callbacks.onError(noUsernameErr, 'identity_verification_failed');
        }
        return;
      }

      // Verify that stored application account matches the currently authenticated Pi account
      const { PiBusinessMarketDB } = await import('./storage');
      const storedUser = PiBusinessMarketDB.getCurrentUser();

      if (storedUser && storedUser.username && storedUser.username !== authenticatedUsername) {
        const mismatchErr = new Error(
          `Pi Account Mismatch: Currently authenticated Pi account (@${authenticatedUsername}) does not match registered user (@${storedUser.username}). Payment stopped.`
        );
        console.error('[DEBUG_TRACE] [createPayment]', mismatchErr.message);
        isPaymentInProgress = false;
        if (callbacks.onError) {
          await callbacks.onError(mismatchErr, 'account_mismatch');
        }
        return;
      }

      console.log('[DEBUG_TRACE] [createPayment] Verified Pi Identity match for @' + authenticatedUsername + '. Calling window.Pi.createPayment with:', {
        amount: paymentData.amount,
        memo: paymentData.memo,
        metadata: paymentData.metadata
      });

      piInstance.createPayment(
        {
          amount: paymentData.amount,
          memo: paymentData.memo,
          metadata: paymentData.metadata
        },
        {
          onReadyForServerApproval: async (paymentId: string) => {
            console.log('[DEBUG_TRACE] [piPaymentService.onReadyForServerApproval] ENTER for paymentId:', paymentId);
            try {
              await callbacks.onReadyForServerApproval(paymentId);
            } catch (err: any) {
              console.error('[DEBUG_TRACE] [piPaymentService.onReadyForServerApproval] Failed:', err);
              throw err;
            }
            console.log('[DEBUG_TRACE] [piPaymentService.onReadyForServerApproval] EXIT');
          },
          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            console.log('[DEBUG_TRACE] [piPaymentService.onReadyForServerCompletion] ENTER for paymentId:', paymentId, 'txid:', txid);
            try {
              await callbacks.onReadyForServerCompletion(paymentId, txid);
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
                await callbacks.onCancel(paymentId);
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
                await callbacks.onError(error, paymentId);
              }
            } catch (err) {
              console.error('[DEBUG_TRACE] [piPaymentService.onError] Error in callback:', err);
            }
            console.log('[DEBUG_TRACE] [piPaymentService.onError] EXIT');
          }
        }
      );
      console.log('[DEBUG_TRACE] [createPayment] window.Pi.createPayment successfully dispatched');
    } catch (err: any) {
      isPaymentInProgress = false;
      console.error('[DEBUG_TRACE] [createPayment] Initialization catch error:', err);
      if (callbacks.onError) {
        await callbacks.onError(err instanceof Error ? err : new Error("Unable to connect to Pi Network. Please try again."), 'init_failed');
      }
    }
  }
};


