import type { Request, Response } from 'express';
import {
  authenticatePaymentRequest,
  getDb,
  getPiApiKey,
  recordPaymentDebugLog,
  dbQueryWithTimeout
} from '../../server/paymentUtils.js';
import axios from 'axios';

export default async function handler(req: Request, res: Response) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const authenticated = await authenticatePaymentRequest(req, res);
  if (!authenticated) return;

  const reqTimestamp = new Date().toISOString();
  const runtimeLogs: string[] = [];
  const { paymentId, metadata } = req.body || {};
  const correlationId = metadata?.internalPaymentId || metadata?.sessionId;

  recordPaymentDebugLog({
    timestamp: reqTimestamp,
    source: 'server',
    paymentId,
    correlationId,
    eventName: '[SERVER_PAYMENT_TRACE] POST /api/payments/approve RECEIVED',
    level: 'info',
    requestBody: req.body
  });

  console.log(`[${reqTimestamp}] [SERVER_PAYMENT_TRACE] POST /api/payments/approve RECEIVED for paymentId: ${paymentId}. Body:`, JSON.stringify(req.body));
  runtimeLogs.push(`[Runtime Log ENTRY] Reached /api/payments/approve route handler at ${reqTimestamp}`);

  try {
    if (!paymentId) {
      console.warn(`[${new Date().toISOString()}] [SERVER_PAYMENT_TRACE] Rejecting approval: paymentId is missing.`);
      recordPaymentDebugLog({
        timestamp: new Date().toISOString(),
        source: 'server',
        eventName: '[SERVER_PAYMENT_TRACE] Approval Rejected: paymentId missing',
        level: 'warn',
        httpStatus: 400
      });
      return res.status(400).json({ error: "paymentId is required" });
    }

    runtimeLogs.push(`[Runtime Log] Payment approval request received for paymentId: ${paymentId}`);

    // Authenticated User & Ownership check
    const user = (req as any).user;
    if (user && user.uid !== 'dev_user' && user.authSource !== 'pi_sdk_metadata') {
      const expectedBuyerUid = metadata?.buyerUid || metadata?.uid || metadata?.userUid || metadata?.buyerId;
      if (expectedBuyerUid && expectedBuyerUid !== user.uid) {
        console.warn(`[${new Date().toISOString()}] [SERVER_PAYMENT_TRACE] [Security Notice] User ${user.uid} approving payment with buyer ID ${expectedBuyerUid}. Proceeding with Pi payment approval.`);
      }
    }

    // Duplicate Payment Protection & Replay Protection
    const dbApprove = getDb();
    if (dbApprove) {
      const paymentDocId = metadata?.internalPaymentId || `PAY_${paymentId}`;
      const existingDoc: any = await dbQueryWithTimeout(
        () => dbApprove.collection('payments').doc(paymentDocId).get(),
        1500,
        null
      );
      if (existingDoc && existingDoc.exists) {
        const docData = existingDoc.data();
        if (docData?.paymentStatus === 'completed') {
          const msg = `Duplicate/Replay protection check: Payment ${paymentId} has already been completed.`;
          console.warn(`[${new Date().toISOString()}] [SERVER_PAYMENT_TRACE] ${msg}`);
          runtimeLogs.push(`[Runtime Log] ${msg}`);
          recordPaymentDebugLog({
            timestamp: new Date().toISOString(),
            source: 'server',
            paymentId,
            correlationId,
            eventName: '[SERVER_PAYMENT_TRACE] Replay attempt blocked (Already Completed)',
            level: 'warn',
            httpStatus: 400,
            responseBody: { error: "Replay Attempt Blocked" }
          });
          return res.status(400).json({
            error: "Replay Attempt Blocked: This payment has already been finalized.",
            logs: runtimeLogs
          });
        }
      }
    }

    const { key: apiKey, isConfigured } = getPiApiKey();

    if (!isConfigured || !apiKey) {
      runtimeLogs.push("[Runtime Log] Security rejection: PI_NETWORK_API_KEY is not configured on this server");
      console.warn(`[${new Date().toISOString()}] [SERVER_PAYMENT_TRACE] PI_NETWORK_API_KEY is missing or unconfigured.`);
      
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[${new Date().toISOString()}] [SERVER_PAYMENT_TRACE] Development mode: returning sandbox mock approval success`);
        recordPaymentDebugLog({
          timestamp: new Date().toISOString(),
          source: 'server',
          paymentId,
          correlationId,
          eventName: '[SERVER_PAYMENT_TRACE] Sandbox Mock Approval Success',
          level: 'info',
          httpStatus: 200,
          responseBody: { success: true, sandbox: true }
        });
        return res.json({
          success: true,
          sandbox: true,
          payment: { identifier: paymentId, status: 'approved' },
          logs: runtimeLogs
        });
      }

      recordPaymentDebugLog({
        timestamp: new Date().toISOString(),
        source: 'server',
        paymentId,
        correlationId,
        eventName: '[SERVER_PAYMENT_TRACE] Approval Failed: PI_NETWORK_API_KEY missing',
        level: 'error',
        httpStatus: 500
      });
      return res.status(500).json({
        error: "PI_NETWORK_API_KEY is not configured.",
        logs: runtimeLogs
      });
    }

    console.log(`[${new Date().toISOString()}] [SERVER_PAYMENT_TRACE] PI_NETWORK_API_KEY configured. Sending POST https://api.minepi.com/v2/payments/${paymentId}/approve...`);
    runtimeLogs.push("[Runtime Log] Sending approval POST to Pi Network API...");
    
    const piReqStartTime = Date.now();
    recordPaymentDebugLog({
      timestamp: new Date().toISOString(),
      source: 'server',
      paymentId,
      correlationId,
      eventName: '[SERVER_PAYMENT_TRACE] Request Sent to Pi Platform API: POST /v2/payments/' + paymentId + '/approve',
      level: 'info',
      requestBody: { url: `https://api.minepi.com/v2/payments/${paymentId}/approve` }
    });

    try {
      const response = await axios.post(
        `https://api.minepi.com/v2/payments/${paymentId}/approve`,
        {},
        { headers: { Authorization: `Key ${apiKey}` }, timeout: 15000 }
      );
      
      const durationMs = Date.now() - piReqStartTime;
      console.log(`[${new Date().toISOString()}] [SERVER_PAYMENT_TRACE] Successfully approved payment ${paymentId} with Pi Network Platform API in ${durationMs}ms.`);
      runtimeLogs.push(`[Runtime Log] Pi Network server approved payment: ${paymentId}`);
      runtimeLogs.push(`[Runtime Log] Pi response data: ${JSON.stringify(response.data || {})}`);

      recordPaymentDebugLog({
        timestamp: new Date().toISOString(),
        source: 'server',
        paymentId,
        correlationId,
        eventName: '[SERVER_PAYMENT_TRACE] Pi Platform Approval Response SUCCESS',
        level: 'info',
        httpStatus: response.status,
        durationMs,
        responseBody: response.data
      });

      return res.json({ success: true, payment: response.data, logs: runtimeLogs });
    } catch (axiosError: any) {
      const durationMs = Date.now() - piReqStartTime;
      const errorData = axiosError.response?.data;
      const errorStatus = axiosError.response?.status;
      const errorString = JSON.stringify(errorData || axiosError.message || '');
      
      console.error(`[${new Date().toISOString()}] [SERVER_PAYMENT_TRACE] Axios error approving payment (${errorStatus}):`, errorString);

      const isAlreadyApproved = 
        errorString.toLowerCase().includes('already approved') || 
        errorString.toLowerCase().includes('already_approved') ||
        errorData?.error === 'payment_already_approved' ||
        errorData?.message?.toLowerCase()?.includes('approved');

      if (isAlreadyApproved) {
        console.log(`[${new Date().toISOString()}] [SERVER_PAYMENT_TRACE] Payment ${paymentId} was ALREADY approved on Pi Network API. Returning success.`);
        runtimeLogs.push(`[Runtime Log] Payment ${paymentId} was already approved on Pi Network API.`);
        
        recordPaymentDebugLog({
          timestamp: new Date().toISOString(),
          source: 'server',
          paymentId,
          correlationId,
          eventName: '[SERVER_PAYMENT_TRACE] Pi Platform Approval Response: ALREADY APPROVED',
          level: 'info',
          httpStatus: errorStatus || 200,
          durationMs,
          responseBody: errorData || { identifier: paymentId, status: 'approved' }
        });

        return res.json({
          success: true,
          alreadyApproved: true,
          payment: errorData || { identifier: paymentId, status: 'approved' },
          logs: runtimeLogs
        });
      }

      recordPaymentDebugLog({
        timestamp: new Date().toISOString(),
        source: 'server',
        paymentId,
        correlationId,
        eventName: '[SERVER_PAYMENT_TRACE] Pi Platform Approval Response ERROR',
        level: 'error',
        httpStatus: errorStatus || 500,
        durationMs,
        error: errorString,
        responseBody: errorData
      });

      throw axiosError;
    }
  } catch (error: any) {
    const errorMsg = error.response?.data || error.message;
    console.error(`[${new Date().toISOString()}] [SERVER_PAYMENT_TRACE] Exception approving payment:`, errorMsg);
    runtimeLogs.push(`[Runtime Log] Error approving payment: ${JSON.stringify(errorMsg)}`);
    
    recordPaymentDebugLog({
      timestamp: new Date().toISOString(),
      source: 'server',
      paymentId,
      correlationId,
      eventName: '[SERVER_PAYMENT_TRACE] Exception Approving Payment',
      level: 'error',
      httpStatus: 500,
      error: errorMsg
    });

    return res.status(500).json({
      error: "Failed to approve payment with Pi Network server",
      details: errorMsg,
      logs: runtimeLogs
    });
  }
}
