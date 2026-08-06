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
      
      let verifiedUser: any = authService.getLatestVerifiedUser();
      let piAuth: any = authService.getLatestPiAuth();

      if (!verifiedUser || !piAuth) {
        try {
          console.log(`[${new Date().toISOString()}] [PAYMENT_TRACE] [createPayment] No cached user session found, running account synchronization...`);
          const result = await authService.verifyAndSynchronizePiAccount(false);
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
      } else {
        console.log(`[${new Date().toISOString()}] [PAYMENT_TRACE] [createPayment] Reusing existing verified user session (@${verifiedUser.username}). Skipping re-authentication.`);
      }

      console.log(`[${new Date().toISOString()}] [PAYMENT_TRACE] [createPayment] Authentication Check Details:`, {
        isRealPiBrowser: isRealPiBrowser(),
        verifiedUserUid: verifiedUser?.uid || verifiedUser?.piUid,
        verifiedUsername: verifiedUser?.username,
        hasPaymentsScope: piAuth?.hasPaymentsScope,
        scopesRequested: ['username', 'payments'],
        rawPiAuthResponse: JSON.stringify(piAuth)
      });

      const piInstance = (window as any).Pi;
      const isPiSdkAvailable = typeof piInstance?.createPayment === 'function';
      console.log(`[${new Date().toISOString()}] [PAYMENT_TRACE] [createPayment] Step 2: isPiSdkAvailable = ${isPiSdkAvailable}`);

      if (!isPiSdkAvailable) {
        const notAvailableErr = new Error(
          "Official Pi Wallet SDK (window.Pi.createPayment) is not available in this browser environment. Please open inside official Pi Browser or Sandbox."
        );
        console.error(`[${new Date().toISOString()}] [PAYMENT_TRACE] [createPayment] SDK unavailable error:`, notAvailableErr.message);
        isPaymentInProgress = false;
        if (callbacks.onError) {
          await callbacks.onError(notAvailableErr, 'pi_sdk_unavailable');
        }
        return;
      }

      // Sanitize and format payment data strictly according to official Pi Platform SDK specification
      const rawAmount = paymentData.amount;
      const parsedAmount = typeof rawAmount === 'number' ? rawAmount : parseFloat(String(rawAmount));
      const safeAmount = isNaN(parsedAmount) || parsedAmount <= 0 ? 0.01 : parsedAmount;
      const safeMemo = (paymentData.memo && typeof paymentData.memo === 'string') ? paymentData.memo.trim() : 'Pi Market Purchase';
      
      let safeMetadata: Record<string, any> = {};
      try {
        safeMetadata = JSON.parse(JSON.stringify({
          ...paymentData.metadata,
          buyerId: verifiedUser?.piUid || verifiedUser?.uid || 'unknown_buyer',
          buyerUsername: verifiedUser?.username || 'unknown_user'
        }));
      } catch (metaErr) {
        console.warn(`[${new Date().toISOString()}] [PAYMENT_TRACE] Metadata stringify warning:`, metaErr);
        safeMetadata = { buyerId: verifiedUser?.piUid || 'unknown' };
      }

      const paymentPayload = {
        amount: safeAmount,
        memo: safeMemo,
        metadata: safeMetadata
      };

      const paymentCallbacks = {
        onReadyForServerApproval: async (paymentId: string) => {
          const cbTime = new Date().toISOString();
          console.log(`[${cbTime}] [PAYMENT_TRACE] [CALLBACK] onReadyForServerApproval FIRED by Pi SDK! PaymentID: "${paymentId}"`);
          try {
            await callbacks.onReadyForServerApproval(paymentId);
            console.log(`[${new Date().toISOString()}] [PAYMENT_TRACE] [CALLBACK] onReadyForServerApproval COMPLETED SUCCESSFULLY for paymentId: "${paymentId}"`);
          } catch (err: any) {
            console.error(`[${new Date().toISOString()}] [PAYMENT_TRACE] [CALLBACK] onReadyForServerApproval EXCEPTION for paymentId: "${paymentId}":`, err);
            throw err;
          }
        },
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          const cbTime = new Date().toISOString();
          console.log(`[${cbTime}] [PAYMENT_TRACE] [CALLBACK] onReadyForServerCompletion FIRED by Pi SDK! PaymentID: "${paymentId}", TxID: "${txid}"`);
          try {
            await callbacks.onReadyForServerCompletion(paymentId, txid);
            console.log(`[${new Date().toISOString()}] [PAYMENT_TRACE] [CALLBACK] onReadyForServerCompletion COMPLETED SUCCESSFULLY for paymentId: "${paymentId}"`);
          } catch (err: any) {
            console.error(`[${new Date().toISOString()}] [PAYMENT_TRACE] [CALLBACK] onReadyForServerCompletion EXCEPTION for paymentId: "${paymentId}":`, err);
            throw err;
          } finally {
            isPaymentInProgress = false;
          }
        },
        onCancel: async (paymentId: string) => {
          isPaymentInProgress = false;
          console.log(`[${new Date().toISOString()}] [PAYMENT_TRACE] [CALLBACK] onCancel FIRED by Pi SDK! PaymentID: "${paymentId}"`);
          try {
            if (callbacks.onCancel) {
              await callbacks.onCancel(paymentId);
            }
          } catch (err) {
            console.error(`[${new Date().toISOString()}] [PAYMENT_TRACE] [CALLBACK] onCancel error in inner callback:`, err);
          }
        },
        onError: async (error: Error, paymentOrId?: any) => {
          isPaymentInProgress = false;
          console.error(`[${new Date().toISOString()}] [PAYMENT_TRACE] [CALLBACK] onError FIRED by Pi SDK!`, {
            errorMessage: error?.message || String(error),
            errorName: error?.name,
            errorStack: error?.stack,
            paymentOrId: JSON.stringify(paymentOrId || null)
          });
          try {
            if (callbacks.onError) {
              await callbacks.onError(error, typeof paymentOrId === 'string' ? paymentOrId : paymentOrId?.identifier || paymentOrId?.id || 'unknown_payment_id');
            }
          } catch (err) {
            console.error(`[${new Date().toISOString()}] [PAYMENT_TRACE] [CALLBACK] onError error in inner callback:`, err);
          }
        }
      };

      console.log(`[${new Date().toISOString()}] [PAYMENT_TRACE] [createPayment] Step 3: EXACT_PAYMENT_PAYLOAD_PASSED_TO_PI_SDK:`, JSON.stringify(paymentPayload, null, 2));
      console.log(`[${new Date().toISOString()}] [PAYMENT_TRACE] [createPayment] Step 3: FIELD_TYPES:`, {
        amountType: typeof paymentPayload.amount,
        amountValue: paymentPayload.amount,
        memoType: typeof paymentPayload.memo,
        memoValue: paymentPayload.memo,
        metadataType: typeof paymentPayload.metadata,
        metadataKeys: Object.keys(paymentPayload.metadata),
        callbacksDefined: Object.keys(paymentCallbacks)
      });

      console.log(`[${new Date().toISOString()}] [PAYMENT_TRACE] [createPayment] Invoking window.Pi.createPayment()...`);
      let syncResult: any = undefined;
      try {
        syncResult = piInstance.createPayment(paymentPayload, paymentCallbacks);
        console.log(`[${new Date().toISOString()}] [PAYMENT_TRACE] [createPayment] Step 4: window.Pi.createPayment returned synchronously:`, syncResult);
      } catch (syncErr: any) {
        console.error(`[${new Date().toISOString()}] [PAYMENT_TRACE] [createPayment] Synchronous exception during window.Pi.createPayment invocation:`, syncErr);
        throw syncErr;
      }
    } catch (err: any) {
      isPaymentInProgress = false;
      console.error(`[${new Date().toISOString()}] [PAYMENT_TRACE] [createPayment] Initialization catch error:`, err);
      if (callbacks.onError) {
        await callbacks.onError(err instanceof Error ? err : new Error("Unable to connect to Pi Network. Please try again."), 'init_failed');
      }
    }
  }
};


