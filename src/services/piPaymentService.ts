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
    const enterTime = new Date().toISOString();
    console.log(`[${enterTime}] [PAYMENT_TRACE] [createPayment] ENTER`);
    console.log(`[${enterTime}] [PAYMENT_TRACE] [createPayment] paymentData:`, paymentData);
    console.log(`[${enterTime}] [PAYMENT_TRACE] [createPayment] typeof window.Pi:`, typeof (window as any).Pi);
    console.log(`[${enterTime}] [PAYMENT_TRACE] [createPayment] typeof window.Pi.createPayment:`, typeof (window as any).Pi?.createPayment);
    console.log(`[${enterTime}] [PAYMENT_TRACE] [createPayment] isPaymentInProgress state:`, isPaymentInProgress);

    if (isPaymentInProgress) {
      console.warn(`[${new Date().toISOString()}] [PAYMENT_TRACE] [createPayment] Payment already in progress. Ignoring duplicate request.`);
      if (callbacks.onError) {
        await callbacks.onError(new Error('A payment is already in progress. Please wait.'), 'duplicate');
      }
      return;
    }
    
    isPaymentInProgress = true;
    
    try {
      console.log(`[${new Date().toISOString()}] [PAYMENT_TRACE] [createPayment] Step 1: Pre-payment account check...`);
      
      let verifiedUser: any;
      let piAuth: any;
      try {
        const result = await authService.verifyAndSynchronizePiAccount(true);
        verifiedUser = result.verifiedUser;
        piAuth = result.piAuth;
      } catch (verifyErr: any) {
        console.error(`[${new Date().toISOString()}] [PAYMENT_TRACE] Pre-payment verification failed:`, verifyErr);
        isPaymentInProgress = false;
        if (callbacks.onError) {
          await callbacks.onError(
            verifyErr instanceof Error ? verifyErr : new Error(`[Verification Failed] ${verifyErr}`),
            'pre_payment_verification_failed'
          );
        }
        return;
      }

      const piInstance = (window as any).Pi;
      const isPiSdkAvailable = typeof piInstance?.createPayment === 'function';
      console.log(`[${new Date().toISOString()}] [PAYMENT_TRACE] [createPayment] Step 2: isPiSdkAvailable = ${isPiSdkAvailable}`);

      if (!isPiSdkAvailable) {
        const notAvailableErr = new Error(
          "[Step 9 Failed] Official Pi Wallet SDK (window.Pi.createPayment) is not available in this browser environment. Please open inside official Pi Browser."
        );
        console.error(`[${new Date().toISOString()}] [PAYMENT_TRACE] [createPayment] SDK unavailable error:`, notAvailableErr.message);
        isPaymentInProgress = false;
        if (callbacks.onError) {
          await callbacks.onError(notAvailableErr, 'pi_sdk_unavailable');
        }
        return;
      }

      const paymentPayload = {
        amount: paymentData.amount,
        memo: paymentData.memo,
        metadata: {
          ...paymentData.metadata,
          buyerId: verifiedUser.piUid,
          buyerUsername: verifiedUser.username
        }
      };

      console.log(`[${new Date().toISOString()}] [PAYMENT_TRACE] [createPayment] Step 3: Calling window.Pi.createPayment with payload:`, paymentPayload);

      piInstance.createPayment(
        paymentPayload,
        {
          onReadyForServerApproval: async (paymentId: string) => {
            const cbTime = new Date().toISOString();
            console.log(`[${cbTime}] [PAYMENT_TRACE] [CALLBACK] onReadyForServerApproval ENTERED for paymentId: ${paymentId}`);
            try {
              await callbacks.onReadyForServerApproval(paymentId);
              console.log(`[${new Date().toISOString()}] [PAYMENT_TRACE] [CALLBACK] onReadyForServerApproval COMPLETED SUCCESSFULLY for paymentId: ${paymentId}`);
            } catch (err: any) {
              console.error(`[${new Date().toISOString()}] [PAYMENT_TRACE] [CALLBACK] onReadyForServerApproval EXCEPTION for paymentId: ${paymentId}:`, err);
              throw err;
            }
          },
          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            const cbTime = new Date().toISOString();
            console.log(`[${cbTime}] [PAYMENT_TRACE] [CALLBACK] onReadyForServerCompletion ENTERED for paymentId: ${paymentId}, txid: ${txid}`);
            try {
              await callbacks.onReadyForServerCompletion(paymentId, txid);
              console.log(`[${new Date().toISOString()}] [PAYMENT_TRACE] [CALLBACK] onReadyForServerCompletion COMPLETED SUCCESSFULLY for paymentId: ${paymentId}`);
            } catch (err: any) {
              console.error(`[${new Date().toISOString()}] [PAYMENT_TRACE] [CALLBACK] onReadyForServerCompletion EXCEPTION for paymentId: ${paymentId}:`, err);
              throw err;
            } finally {
              isPaymentInProgress = false;
            }
          },
          onCancel: async (paymentId: string) => {
            isPaymentInProgress = false;
            console.log(`[${new Date().toISOString()}] [PAYMENT_TRACE] [CALLBACK] onCancel ENTERED for paymentId: ${paymentId}`);
            try {
              if (callbacks.onCancel) {
                await callbacks.onCancel(paymentId);
              }
            } catch (err) {
              console.error(`[${new Date().toISOString()}] [PAYMENT_TRACE] [CALLBACK] onCancel error in inner callback:`, err);
            }
          },
          onError: async (error: Error, paymentId: string) => {
            isPaymentInProgress = false;
            console.error(`[${new Date().toISOString()}] [PAYMENT_TRACE] [CALLBACK] onError ENTERED for paymentId: ${paymentId}, error:`, error);
            try {
              if (callbacks.onError) {
                await callbacks.onError(error, paymentId);
              }
            } catch (err) {
              console.error(`[${new Date().toISOString()}] [PAYMENT_TRACE] [CALLBACK] onError error in inner callback:`, err);
            }
          }
        }
      );
      console.log(`[${new Date().toISOString()}] [PAYMENT_TRACE] [createPayment] Step 4: window.Pi.createPayment successfully dispatched synchronously.`);
    } catch (err: any) {
      isPaymentInProgress = false;
      console.error(`[${new Date().toISOString()}] [PAYMENT_TRACE] [createPayment] Initialization catch error:`, err);
      if (callbacks.onError) {
        await callbacks.onError(err instanceof Error ? err : new Error("Unable to connect to Pi Network. Please try again."), 'init_failed');
      }
    }
  }
};


