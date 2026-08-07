import type { Request, Response } from 'express';
import {
  authenticatePaymentRequest,
  getPiApiKey
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

  try {
    const { payment } = req.body || {};
    if (!payment || !payment.identifier) {
      return res
        .status(400)
        .json({ error: "Invalid incomplete payment payload" });
    }

    const isProduction = process.env.NODE_ENV === "production";
    const { key: apiKey, isConfigured } = getPiApiKey();

    if (isProduction && (!isConfigured || !apiKey)) {
      console.error("[Security Alert] Incomplete payment processing rejected: PI_NETWORK_API_KEY is missing in production.");
      return res.status(500).json({
        error: "PI_NETWORK_API_KEY is not configured in production environment.",
      });
    }

    const paymentId = payment.identifier;
    const txid = payment.transaction?.txid;

    console.log(
      `[Pi Incomplete Payment] Handling incomplete payment ${paymentId}...`,
    );

    if (!isConfigured || !apiKey) {
      console.warn(
        "[Pi Incomplete Payment] PI_NETWORK_API_KEY not configured. Acknowledging for sandbox in development.",
      );
      return res.json({
        success: true,
        message: "Incomplete payment acknowledged in sandbox mode",
      });
    }
    
    console.log("[Pi Incomplete Payment] PI_NETWORK_API_KEY found (length:", apiKey.length, ")");

    const isApproved = payment.status?.developer_approved;
    const isCompleted = payment.status?.developer_completed;

    if (isApproved && txid && !isCompleted) {
      console.log(
        `[Pi Incomplete Payment] Completing uncompleted payment ${paymentId}...`,
      );
      const response = await axios.post(
        `https://api.minepi.com/v2/payments/${paymentId}/complete`,
        { txid },
        { headers: { Authorization: `Key ${apiKey}` } },
      );
      return res.json({
        success: true,
        action: "completed",
        payment: response.data,
      });
    } else if (!isApproved) {
      console.log(
        `[Pi Incomplete Payment] Approving unapproved payment ${paymentId}...`,
      );
      const response = await axios.post(
        `https://api.minepi.com/v2/payments/${paymentId}/approve`,
        {},
        { headers: { Authorization: `Key ${apiKey}` } },
      );
      return res.json({
        success: true,
        action: "approved",
        payment: response.data,
      });
    }

    return res.json({
      success: true,
      message: "Payment already processed",
      payment,
    });
  } catch (error: any) {
    console.error(
      "[Pi Incomplete Payment] Error handling incomplete payment:",
      error.response?.data || error.message,
    );
    return res.status(500).json({
      error: "Failed to handle incomplete payment",
      details: error.response?.data || error.message,
    });
  }
}
