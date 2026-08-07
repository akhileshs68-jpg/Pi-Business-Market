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

    // STATIC PI INSTANCE DEBUG LOGS PLACED BEFORE THE FIRST POSSIBLE RETURN/THROW
    console.log("[PI_DEBUG_EARLY] window.Pi:", (window as any).Pi);
    console.log("[PI_DEBUG_EARLY] window.Pi.consentedScopes:", (window as any).Pi?.consentedScopes);
    console.log("[PI_DEBUG_EARLY] window.Pi.user:", (window as any).Pi?.user);
    console.log("[PI_DEBUG_EARLY] window.Pi.createPayment:", (window as any).Pi?.createPayment);
    console.log("[PI_DEBUG_EARLY] exact same window.Pi object reference is used:", (window as any).Pi === (window as any).Pi);

    if (isPaymentInProgress) {
      console.warn(`[${new Date().toISOString()}] [PAYMENT_TRACE] [createPayment] Payment already in progress. Ignoring duplicate request.`);
      if (callbacks.onError) {
        await callbacks.onError(new Error('A payment is already in progress. Please wait.'), 'duplicate');
      }
      return;
    }
    
    isPaymentInProgress = true;
    
    try {
      const authPi = (window as any).Pi;
      console.log(`[${new Date().toISOString()}] [PAYMENT_TRACE] [createPayment] Step 1: Mandatory fresh Pi SDK authentication prior to payment (forceRefresh=true)...`);
      
      let piAuth: any = null;
      let verifiedUser: any = null;

      try {
        // ALWAYS force fresh authentication before every payment creation to establish active consented scope session with window.Pi SDK
        piAuth = await authService.authenticatePi(['username', 'payments'], true);
        console.log("[PI_DEBUG] auth result =", piAuth);
        console.log(`[${new Date().toISOString()}] [PAYMENT_TRACE] [createPayment] Fresh Pi authentication completed:`, {
          hasPaymentsScope: piAuth?.hasPaymentsScope,
          username: piAuth?.user?.username,
          uid: piAuth?.user?.uid,
          scopesReturned: piAuth?.scopes || piAuth?.user?.scopes
        });

        const syncResult = await authService.verifyAndSynchronizePiAccount(true);
        verifiedUser = syncResult.verifiedUser;
      } catch (authErr: any) {
        console.error(`[${new Date().toISOString()}] [PAYMENT_TRACE] Pre-payment fresh authentication failed:`, authErr);
        
        // LOGS ADDED INSIDE CATCH TO ENSURE EXECUTION REGARDLESS OF THROWN EXCEPTIONS
        console.log("[PI_DEBUG_CATCH] auth result = null (failed)");
        console.log("[PI_DEBUG_CATCH] authenticated = false");
        console.log("[PI_DEBUG_CATCH] scopes = undefined");
        console.log("[PI_DEBUG_CATCH] verifiedUser = null");

        isPaymentInProgress = false;
        if (callbacks.onError) {
          await callbacks.onError(
            authErr instanceof Error ? authErr : new Error(`[Authentication Failed] ${authErr}`),
            'pre_payment_auth_failed'
          );
        }
        return;
      }

      const piInstance = (window as any).Pi;
      const nativeConsentedScopes = piInstance?.consentedScopes;

      console.log(`[${new Date().toISOString()}] [PAYMENT_TRACE] [createPayment] Authentication Check Details:`, {
        isRealPiBrowser: isRealPiBrowser(),
        verifiedUserUid: verifiedUser?.uid || verifiedUser?.piUid,
        verifiedUsername: verifiedUser?.username,
        hasPaymentsScope: piAuth?.hasPaymentsScope,
        scopesRequested: ['username', 'payments'],
        nativeConsentedScopes: nativeConsentedScopes,
        rawPiAuthResponse: JSON.stringify(piAuth)
      });

      const isPiSdkAvailable = typeof piInstance?.createPayment === 'function';
      console.log(`[${new Date().toISOString()}] [PAYMENT_TRACE] [createPayment] Step 2: isPiSdkAvailable = ${isPiSdkAvailable}`);

      if (!isPiSdkAvailable) {
        const notAvailableErr = new Error(
          "Official Pi Wallet SDK (window.Pi.createPayment) is not available in this browser environment. Please open inside official Pi Browser or Sandbox."
        );
        console.error(`[${new Date().toISOString()}] [PAYMENT_TRACE] [createPayment] SDK unavailable error:`, notAvailableErr.message);
        
        // LOGS ADDED BEFORE return TO ENSURE EXECUTION
        console.log("[PI_DEBUG_UNAVAILABLE] auth result =", piAuth);
        console.log("[PI_DEBUG_UNAVAILABLE] authenticated =", !!piAuth);
        console.log("[PI_DEBUG_UNAVAILABLE] scopes =", piAuth?.scopes);
        console.log("[PI_DEBUG_UNAVAILABLE] verifiedUser =", verifiedUser);

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

      // Verification immediately before createPayment() that the authenticated session contains the payment permission
      const hasPaymentPermission = Boolean(
        piAuth?.hasPaymentsScope || 
        (Array.isArray(piAuth?.scopes) && piAuth.scopes.includes('payments')) ||
        (Array.isArray((window as any).Pi?.consentedScopes) && (window as any).Pi.consentedScopes.includes('payments')) ||
        hasNativePaymentsScope()
      );

      console.log(`[${new Date().toISOString()}] [PAYMENT_TRACE] [createPayment] Verification immediately before createPayment(): hasPaymentPermission = ${hasPaymentPermission}`, {
        piAuthHasPaymentsScope: piAuth?.hasPaymentsScope,
        piAuthScopes: piAuth?.scopes,
        nativeConsentedScopes: (window as any).Pi?.consentedScopes,
        hasNativePaymentsScope: hasNativePaymentsScope()
      });

      if (!hasPaymentPermission) {
        const missingScopeErr = new Error("Authenticated Pi session is missing the required 'payments' permission scope.");
        console.error(`[${new Date().toISOString()}] [PAYMENT_TRACE] [createPayment] Missing payment permission:`, missingScopeErr.message);
        
        // LOGS ADDED BEFORE return TO ENSURE EXECUTION
        console.log("[PI_DEBUG_PERMISSION] auth result =", piAuth);
        console.log("[PI_DEBUG_PERMISSION] authenticated =", !!piAuth);
        console.log("[PI_DEBUG_PERMISSION] scopes =", piAuth?.scopes);
        console.log("[PI_DEBUG_PERMISSION] verifiedUser =", verifiedUser);

        isPaymentInProgress = false;
        if (callbacks.onError) {
          await callbacks.onError(missingScopeErr, 'missing_payments_scope');
        }
        return;
      }

      console.log("[PI_DEBUG] authenticated =", !!piAuth);
      console.log("[PI_DEBUG] scopes =", piAuth?.scopes);
      console.log("[PI_DEBUG] verifiedUser =", verifiedUser);

      console.log(window.Pi);
      console.log((window as any).Pi?.consentedScopes);
      console.log((window as any).Pi?.user);
      console.log((window as any).Pi?.createPayment);
      console.log("[PI_DEBUG] exact same window.Pi object reference is used:", authPi === (window as any).Pi);

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


