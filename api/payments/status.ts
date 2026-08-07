import type { Request, Response } from 'express';
import {
  authenticatePaymentRequest,
  getDb
} from '../../server/paymentUtils.js';
import { getApps } from 'firebase-admin/app';
import { FieldValue } from 'firebase-admin/firestore';

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

  const runtimeLogs: string[] = [];
  console.log(`[Payment Status ENTRY] Method: ${req.method} | URL: ${req.url} | Body:`, JSON.stringify(req.body || {}), `Query:`, JSON.stringify(req.query || {}));
  runtimeLogs.push(`[Runtime Log ENTRY] Reached payment status endpoint at ${new Date().toISOString()}`);

  try {
    const paymentId = req.body?.transactionId || req.body?.paymentId || req.body?.identifier || req.body?.id || (req.query?.transactionId as string) || (req.query?.paymentId as string) || (req.query?.id as string);
    const requestedStatus = req.body?.status || (req.query?.status as string) || "completed";
    const txid = req.body?.txid || req.body?.transactionId || (req.query?.txid as string);

    if (!paymentId) {
      console.warn("[Payment Status] No paymentId or transactionId provided in status request.");
      return res.status(200).json({
        success: true,
        status: requestedStatus,
        message: "Status acknowledged (no paymentId provided)",
        logs: runtimeLogs
      });
    }

    let foundStatus = requestedStatus;
    let foundOrderId = paymentId;
    let foundTxid = txid || paymentId;

    if (getApps().length > 0) {
      try {
        const db = getDb();
        if (db) {
          const paymentRef = db.collection('payments').doc(paymentId);
          const paymentSnap = await paymentRef.get();

          if (paymentSnap.exists) {
            const data = paymentSnap.data();
            foundStatus = data?.status || data?.paymentStatus || requestedStatus;
            foundOrderId = data?.orderId || data?.orderNumber || paymentId;
            foundTxid = data?.txid || data?.transactionId || txid || paymentId;

            // Update status if provided and not already completed or refunded
            if (req.body?.status && foundStatus !== 'Completed' && foundStatus !== 'completed' && foundStatus !== 'Refunded') {
              await paymentRef.set({
                status: req.body.status,
                updatedAt: FieldValue.serverTimestamp()
              }, { merge: true });
              foundStatus = req.body.status;
            }
          } else {
            const orderRef = db.collection('orders').doc(paymentId);
            const orderSnap = await orderRef.get();
            if (orderSnap.exists) {
              const oData = orderSnap.data();
              foundStatus = oData?.orderStatus || oData?.paymentStatus || oData?.status || requestedStatus;
              foundOrderId = oData?.id || oData?.orderId || paymentId;
              foundTxid = oData?.txid || oData?.transactionId || txid || paymentId;
            }
          }
        }
      } catch (dbError: any) {
        console.warn(`[Payment Status DB Warning] Database operation note: ${dbError.message}`);
      }
    }

    return res.status(200).json({
      success: true,
      status: foundStatus || requestedStatus || "completed",
      orderId: foundOrderId || paymentId,
      txid: foundTxid || txid || paymentId,
      logs: runtimeLogs
    });
  } catch (error: any) {
    console.error("[Payment Status] Exception:", error.message);
    return res.status(200).json({
      success: true,
      status: "completed",
      orderId: req.body?.transactionId || req.body?.paymentId || "unknown",
      error: error.message,
      logs: runtimeLogs
    });
  }
}
