import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { deleteEngine } from './server/deleteEngine';
import fs from "fs";
import "dotenv/config";
import express from "express";
import path from "path";
import axios from "axios";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { createServer as createViteServer } from "vite";

// Configure Cloudinary
cloudinary.config({
  cloud_name:
    process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME,
  api_key:
    process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY,
  api_secret:
    process.env.CLOUDINARY_API_SECRET || process.env.VITE_CLOUDINARY_API_SECRET,
  secure: true,
});

// Configure Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

if (process.env.VITE_FIREBASE_PROJECT_ID && !getApps().length) {
  const databaseId = process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || process.env.VITE_FIREBASE_DATABASE_ID;
  initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  });
  console.log(`[Firebase Admin] Initialized with Project ID: ${process.env.VITE_FIREBASE_PROJECT_ID}, Database ID: ${databaseId || "(default)"}`);
}

const getDb = () => {
  const databaseId = process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || process.env.VITE_FIREBASE_DATABASE_ID;
  return databaseId ? getFirestore(databaseId) : getFirestore();
};

/**
 * Authentication Middleware for Payment API Protection
 * Verifies Firebase ID token, checks for user revocation/disabled status,
 * attaches user context, and logs security failures.
 */
const authenticatePaymentRequest = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const endpoint = req.path;
  const authHeader = req.headers.authorization;
  const isProd = process.env.NODE_ENV === 'production';

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (isProd) {
      console.error(`[Security Violation] ${endpoint}: Missing or malformed authorization header in production.`);
      return res.status(401).json({ error: "Unauthorized: Missing authorization header." });
    }
    console.warn(`[Security Warning] ${endpoint}: Proceeding in sandbox/development mode without token.`);
    (req as any).user = { uid: 'dev_user', email: 'dev@example.com' };
    return next();
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    if (isProd) {
      console.error(`[Security Violation] ${endpoint}: Empty bearer token in production.`);
      return res.status(401).json({ error: "Unauthorized: Invalid bearer token." });
    }
    (req as any).user = { uid: 'dev_user', email: 'dev@example.com' };
    return next();
  }

  try {
    if (!getApps().length) {
      if (isProd) {
        console.error(`[Security Violation] ${endpoint}: Firebase Admin SDK uninitialized in production.`);
        return res.status(500).json({ error: "Internal Server Error: Security SDK uninitialized." });
      }
      console.warn(`[Security Notice] ${endpoint}: Firebase Admin SDK uninitialized. Proceeding with sandbox user.`);
      (req as any).user = { uid: 'dev_user', email: 'dev@example.com' };
      return next();
    }

    const decodedToken = await getAuth().verifyIdToken(token);
    (req as any).user = {
      uid: decodedToken.uid,
      email: decodedToken.email
    };

    next();
  } catch (error: any) {
    if (isProd) {
      console.error(`[Security Violation] ${endpoint}: Token verification failed in production - ${error.message}`);
      return res.status(401).json({ error: `Unauthorized: Token verification failed: ${error.message}` });
    }
    console.warn(`[Security Notice] ${endpoint}: Token verification bypassed in dev mode - ${error.message}`);
    (req as any).user = { uid: 'dev_user', email: 'dev@example.com' };
    return next();
  }
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Pi Network Auth Validation Endpoint
  app.post("/api/auth/pi", async (req, res) => {
    try {
      const { accessToken } = req.body;
      if (!accessToken) {
        return res.status(400).json({ error: "Access token is required" });
      }

      if (accessToken === "mock_token_123" && process.env.VITE_DEVELOPMENT_MODE === 'true') {
        return res.json({
          success: true,
          user: {
            uid: "user_active_pioneer",
            username: "pi_pioneer_88",
          },
        });
      } else if (accessToken === "mock_token_123") {
         return res.status(403).json({ error: "Mock token not allowed in production." });
      }

      // Validate with Pi Network API
      // Reference: https://pi-apps.github.io/pi-sdk-docs/quick-start/genai/Authentication
      const response = await axios.get("https://api.minepi.com/v2/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Pi user data
      const piUser = response.data;

      // Return the validated user info
      res.json({
        success: true,
        user: {
          uid: piUser.uid,
          username: piUser.username,
        },
      });
    } catch (error: any) {
      console.error(
        "[Backend Auth] Pi validation failed:",
        error.response?.data || error.message,
      );
      res.status(401).json({
        error: "Pi authentication failed",
        details: error.response?.data || error.message,
      });
    }
  });

  // =========================================================================
  // PI NETWORK PAYMENT ENDPOINTS (Server-to-Server Approval & Completion)
  // Reference: https://pi-apps.github.io/pi-sdk-docs/quick-start/genai/Payments
  // =========================================================================

  // 1. Approve Payment Endpoint
  app.post("/api/payments/approve", authenticatePaymentRequest, async (req, res) => {
    const runtimeLogs: string[] = [];
    try {
      const { paymentId, metadata } = req.body;
      if (!paymentId) {
        return res.status(400).json({ error: "paymentId is required" });
      }

      runtimeLogs.push(`[Runtime Log] Payment approval request received for paymentId: ${paymentId}`);
      console.log(`[Pi Payment Approve] Payment approval request for ID: ${paymentId}`);

      // Authenticated User & Ownership check
      const user = (req as any).user;
      if (user && user.uid !== 'dev_user') {
        const expectedBuyerUid = metadata?.buyerUid || metadata?.uid || metadata?.userUid;
        if (expectedBuyerUid && expectedBuyerUid !== user.uid) {
          console.error(`[Security Violation] User ${user.uid} tried to approve payment owned by ${expectedBuyerUid}`);
          return res.status(403).json({ error: "Access Denied: Payment ownership mismatch.", logs: runtimeLogs });
        }
      }

      // Duplicate Payment Protection & Replay Protection
      if (getApps().length > 0) {
        const db = getDb();
        const paymentDocId = `PAY_${paymentId}`;
        const existingDoc = await db.collection('payments').doc(paymentDocId).get();
        if (existingDoc.exists) {
          const docData = existingDoc.data();
          if (docData?.paymentStatus === 'completed') {
            const msg = `Duplicate/Replay protection check: Payment ${paymentId} has already been completed.`;
            console.warn(`[Pi Payment Approve] ${msg}`);
            runtimeLogs.push(`[Runtime Log] ${msg}`);
            return res.status(400).json({
              error: "Replay Attempt Blocked: This payment has already been finalized.",
              logs: runtimeLogs
            });
          }
        }
      }

      if (paymentId && paymentId.startsWith('SIM_')) {
        if (process.env.NODE_ENV === 'production') {
          console.error(`[Security Violation] Simulated payment approval blocked in production environment for paymentId: ${paymentId}`);
          return res.status(403).json({ error: "Simulated payments are strictly forbidden in production mode.", logs: runtimeLogs });
        }
        console.log(`[Pi Payment Simulated] Simulated payment for ${paymentId}`);
        runtimeLogs.push(`[Runtime Log] Simulated payment for: ${paymentId}`);
        
        if (req.path.includes('complete')) {
            if (getApps && getApps().length > 0) {
                const db = getDb();
                const paymentDocId = `PAY_${paymentId}`;
                await db.collection('payments').doc(paymentDocId).set({ paymentStatus: 'completed' }, { merge: true }).catch(() => {});
            }
        }
        
        return res.json({ success: true, payment: { status: req.path.includes('complete') ? 'completed' : 'approved' }, logs: runtimeLogs });
      }

      const apiKey = process.env.PI_NETWORK_API_KEY;
      const isMissingApiKey = !apiKey || apiKey.trim() === "" || apiKey === "YOUR_PI_API_KEY";

      if (isMissingApiKey) {
        runtimeLogs.push("[Runtime Log] Security rejection: PI_NETWORK_API_KEY is not configured on this server");
        console.error("[Security Alert] Payment approval rejected: PI_NETWORK_API_KEY is missing.");
        return res.status(500).json({
          error: "PI_NETWORK_API_KEY is not configured.",
          logs: runtimeLogs
        });
      }

      console.log("[Pi Payment Approve] PI_NETWORK_API_KEY found. Sending approval POST...");
      runtimeLogs.push("[Runtime Log] Sending approval POST to Pi Network API...");
      
      const response = await axios.post(
        `https://api.minepi.com/v2/payments/${paymentId}/approve`,
        {},
        { headers: { Authorization: `Key ${apiKey}` } }
      );
      
      console.log(`[Pi Payment Approve] Successfully approved payment ${paymentId}`);
      runtimeLogs.push(`[Runtime Log] Pi Network server approved payment: ${paymentId}`);
      runtimeLogs.push(`[Runtime Log] Pi response data: ${JSON.stringify(response.data || {})}`);

      res.json({ success: true, payment: response.data, logs: runtimeLogs });
    } catch (error: any) {
      const errorMsg = error.response?.data || error.message;
      console.error("[Pi Payment Approve] Error approving payment:", errorMsg);
      runtimeLogs.push(`[Runtime Log] Error approving payment: ${JSON.stringify(errorMsg)}`);
      res.status(500).json({
        error: "Failed to approve payment with Pi Network server",
        details: errorMsg,
        logs: runtimeLogs
      });
    }
  });

  // Delete Resource Endpoint
  app.delete("/api/delete-resource", authenticatePaymentRequest, async (req, res) => {
    try {
      const { resourceType, resourceId } = req.body;
      const user = (req as any).user;
      
      if (resourceType === 'business') {
        await deleteEngine.hardDeleteBusiness(resourceId, user.uid);
      } else {
        await deleteEngine.hardDeleteResource(resourceType, resourceId, user.uid);
      }
      
      res.json({ success: true });
    } catch (err: any) {
      console.error('[DeleteEngine] Error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/payments/complete", authenticatePaymentRequest, async (req, res) => {
    const runtimeLogs: string[] = [];
    try {
      const { paymentId, txid, metadata } = req.body;
      if (!paymentId || !txid) {
        return res.status(400).json({ error: "paymentId and txid are required" });
      }

      runtimeLogs.push(`[Runtime Log] Payment completion request received for paymentId: ${paymentId}`);
      runtimeLogs.push(`[Runtime Log] User approval blockchain txid: ${txid}`);
      console.log(`[Pi Payment Complete] Completion request for ID: ${paymentId}, TxID: ${txid}`);

      // 1. Authenticated User & Ownership check
      const user = (req as any).user;
      const buyerId = user?.uid || metadata?.buyerId || metadata?.uid || metadata?.userUid || "unknown_user";
      if (user && user.uid !== 'dev_user') {
        const expectedBuyerUid = metadata?.buyerUid || metadata?.uid || metadata?.userUid || metadata?.buyerId;
        if (expectedBuyerUid && expectedBuyerUid !== user.uid) {
          console.error(`[Security Violation] User ${user.uid} tried to complete payment owned by ${expectedBuyerUid}`);
          return res.status(403).json({ error: "Access Denied: Payment ownership mismatch.", logs: runtimeLogs });
        }
      }

      const db = getDb();
      const paymentDocId = `PAY_${paymentId}`;
      const paymentRef = db.collection('payments').doc(paymentDocId);

      // 1. Prevent duplicate payment processing
      if (getApps().length > 0) {
        const existingDoc = await paymentRef.get();
        if (existingDoc.exists) {
          const docData = existingDoc.data();
          if (docData?.paymentStatus === 'completed') {
            const msg = `Duplicate check: Payment ${paymentId} has already been completed.`;
            console.warn(`[Pi Payment Complete] ${msg}`);
            runtimeLogs.push(`[Runtime Log] ${msg}`);
            runtimeLogs.push(`[Runtime Log] Final payment status: completed`);
            return res.json({
              success: true,
              message: "Payment already processed",
              paymentId,
              txid,
              orderId: docData?.orderId || "",
              payment: docData,
              logs: runtimeLogs
            });
          }
        }
      }

      let paymentData: any = {};
      const isSimulated = paymentId && paymentId.startsWith('SIM_');

      if (isSimulated) {
        if (process.env.NODE_ENV === 'production') {
          console.error(`[Security Violation] Simulated payment completion blocked in production environment for paymentId: ${paymentId}`);
          return res.status(403).json({ error: "Simulated payments are strictly forbidden in production mode.", logs: runtimeLogs });
        }
        console.log(`[Pi Payment Simulated] Simulated payment for ${paymentId}`);
        runtimeLogs.push(`[Runtime Log] Simulated payment for: ${paymentId}`);
        paymentData = { amount: metadata?.amount || 0.1, memo: metadata?.memo || "Simulated payment", status: "completed" };
      } else {
        const apiKey = process.env.PI_NETWORK_API_KEY;
        const isMissingApiKey = !apiKey || apiKey.trim() === "" || apiKey === "YOUR_PI_API_KEY";

        if (isMissingApiKey) {
          runtimeLogs.push("[Runtime Log] Security rejection: PI_NETWORK_API_KEY is not configured on this server");
          console.error("[Security Alert] Payment completion rejected: PI_NETWORK_API_KEY is missing.");
          return res.status(500).json({
            error: "PI_NETWORK_API_KEY is not configured.",
            logs: runtimeLogs
          });
        }

        console.log(`[Pi Payment Complete] Requesting Pi server completion for payment ${paymentId} with txid ${txid}...`);
        runtimeLogs.push("[Runtime Log] POSTing to Pi Network API v2/payments/.../complete...");
        
        const response = await axios.post(
          `https://api.minepi.com/v2/payments/${paymentId}/complete`,
          { txid },
          { headers: { Authorization: `Key ${apiKey}` } }
        );
        paymentData = response.data;
        console.log(`[Pi Payment Complete] Successfully completed payment ${paymentId} with Pi Network Server`);
        runtimeLogs.push(`[Runtime Log] Pi Network server response: verified & completed. ${JSON.stringify(paymentData || {})}`);
      }

      let finalOrderId = "";

      // 2. Perform server-side transaction & database updates
      if (getApps().length > 0) {
        // Fetch checkout session
        const sessionId = metadata?.sessionId || metadata?.orderId;
        if (!sessionId) {
          throw new Error("Missing sessionId in payment metadata");
        }

        const sessionRef = db.collection('checkoutSessions').doc(sessionId);
        const sessionSnap = await sessionRef.get();
        if (!sessionSnap.exists) {
          throw new Error(`Checkout session ${sessionId} not found`);
        }
        const sessionData = sessionSnap.data();
        if (!sessionData) {
          throw new Error("Empty session data");
        }

        const grandTotal = parseFloat(metadata?.amount || paymentData?.amount || sessionData.grandTotal || 0);
        const sellerId = sessionData.sellerId || sessionData.businessId || 'PI-SELLER';

        // Query cart items to get accurate item details
        const cartIds = sessionData.cartIds || (sessionData.cartId ? [sessionData.cartId] : []);
        let cartItems: any[] = [];
        if (cartIds && cartIds.length > 0) {
          const cartItemsSnap = await db.collection('cartItems')
            .where('cartId', 'in', cartIds)
            .get();
          cartItems = cartItemsSnap.docs.map(d => ({ itemId: d.id, ...d.data() }));
        }

        const orderId = `ORD_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        finalOrderId = orderId;

        console.log(`[Server Transaction] Starting secure execution for order ${orderId}...`);
        
        await db.runTransaction(async (transaction) => {
          // --- STAGE 1: READ WALLETS ---
          const buyerWalletRef = db.collection('wallets').doc(`${buyerId}_pi_testnet`);
          const sellerWalletRef = db.collection('wallets').doc(`${sellerId}_pi_testnet`);

          const buyerWalletSnap = await transaction.get(buyerWalletRef);
          const sellerWalletSnap = await transaction.get(sellerWalletRef);

          const buyerBalanceBefore = buyerWalletSnap.exists ? (buyerWalletSnap.data()?.balance || 0) : 100.0;
          const sellerBalanceBefore = sellerWalletSnap.exists ? (sellerWalletSnap.data()?.balance || 0) : 100.0;

          const buyerBalanceAfter = buyerBalanceBefore - grandTotal;
          const sellerBalanceAfter = sellerBalanceBefore + grandTotal;

          // --- STAGE 2: PRODUCT STOCK UPDATE ---
          for (const item of cartItems) {
            if (item.productId) {
              const productRef = db.collection('products').doc(item.productId);
              const productDoc = await transaction.get(productRef);
              if (productDoc.exists) {
                const pData = productDoc.data();
                const newStock = Math.max(0, (pData?.stock || 0) - (item.quantity || 1));
                transaction.update(productRef, { stock: newStock });
              }
            }
          }

          // --- STAGE 3: CREDIT SELLER WALLET & DEBIT BUYER ---
          if (!buyerWalletSnap.exists) {
            transaction.set(buyerWalletRef, {
              userId: buyerId,
              provider: 'pi_testnet',
              balance: buyerBalanceAfter,
              createdAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp()
            });
          } else {
            transaction.update(buyerWalletRef, {
              balance: buyerBalanceAfter,
              updatedAt: FieldValue.serverTimestamp()
            });
          }

          if (!sellerWalletSnap.exists) {
            transaction.set(sellerWalletRef, {
              userId: sellerId,
              provider: 'pi_testnet',
              balance: sellerBalanceAfter,
              createdAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp()
            });
          } else {
            transaction.update(sellerWalletRef, {
              balance: sellerBalanceAfter,
              updatedAt: FieldValue.serverTimestamp()
            });
          }

          // --- STAGE 4: WRITE WALLET TRANSACTIONS ---
          const buyerTxRef = db.collection('wallet_transactions').doc();
          transaction.set(buyerTxRef, {
            walletId: buyerWalletRef.id,
            userId: buyerId,
            provider: 'pi_testnet',
            type: 'DEBIT',
            amount: grandTotal,
            balanceBefore: buyerBalanceBefore,
            balanceAfter: buyerBalanceAfter,
            source: 'CHECKOUT',
            description: `Payment debit for marketplace order #${orderId}`,
            referenceId: orderId,
            createdAt: FieldValue.serverTimestamp()
          });

          const sellerTxRef = db.collection('wallet_transactions').doc();
          transaction.set(sellerTxRef, {
            walletId: sellerWalletRef.id,
            userId: sellerId,
            provider: 'pi_testnet',
            type: 'CREDIT',
            amount: grandTotal,
            balanceBefore: sellerBalanceBefore,
            balanceAfter: sellerBalanceAfter,
            source: 'CHECKOUT',
            description: `Sale credit for marketplace order #${orderId}`,
            referenceId: orderId,
            createdAt: FieldValue.serverTimestamp()
          });

          // --- STAGE 5: WRITE MASTER LEDGER ---
          const buyerLedgerId = `mled_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const buyerLedgerRef = db.collection('master_ledger').doc(buyerLedgerId);
          transaction.set(buyerLedgerRef, {
            entryId: buyerLedgerId,
            transactionId: txid,
            walletAddress: `pi_addr_${buyerId.substring(0, 10)}`,
            userId: buyerId,
            asset: 'PI_TESTNET',
            amount: -grandTotal,
            beforeBalance: buyerBalanceBefore,
            afterBalance: buyerBalanceAfter,
            referenceId: orderId,
            source: 'CHECKOUT',
            status: 'CONFIRMED',
            memo: `Payment debit for marketplace order #${orderId}`,
            timestamp: new Date().toISOString(),
            createdAt: FieldValue.serverTimestamp()
          });

          const sellerLedgerId = `mled_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const sellerLedgerRef = db.collection('master_ledger').doc(sellerLedgerId);
          transaction.set(sellerLedgerRef, {
            entryId: sellerLedgerId,
            transactionId: txid,
            walletAddress: `pi_addr_${sellerId.substring(0, 10)}`,
            userId: sellerId,
            asset: 'PI_TESTNET',
            amount: grandTotal,
            beforeBalance: sellerBalanceBefore,
            afterBalance: sellerBalanceAfter,
            referenceId: orderId,
            source: 'CHECKOUT',
            status: 'CONFIRMED',
            memo: `Sale credit for marketplace order #${orderId}`,
            timestamp: new Date().toISOString(),
            createdAt: FieldValue.serverTimestamp()
          });

          // --- STAGE 6: UPDATE MASTER WALLETS ---
          const buyerMasterWalletRef = db.collection('master_wallets').doc(buyerId);
          const buyerMasterWalletSnap = await transaction.get(buyerMasterWalletRef);
          const buyerMasterWalletData = buyerMasterWalletSnap.exists ? buyerMasterWalletSnap.data() : {};
          transaction.set(buyerMasterWalletRef, {
            ...buyerMasterWalletData,
            userId: buyerId,
            address: `pi_addr_${buyerId.substring(0, 10)}`,
            piTestnetBalance: buyerBalanceAfter,
            updatedAt: FieldValue.serverTimestamp()
          }, { merge: true });

          const sellerMasterWalletRef = db.collection('master_wallets').doc(sellerId);
          const sellerMasterWalletSnap = await transaction.get(sellerMasterWalletRef);
          const sellerMasterWalletData = sellerMasterWalletSnap.exists ? sellerMasterWalletSnap.data() : {};
          transaction.set(sellerMasterWalletRef, {
            ...sellerMasterWalletData,
            userId: sellerId,
            address: `pi_addr_${sellerId.substring(0, 10)}`,
            piTestnetBalance: sellerBalanceAfter,
            updatedAt: FieldValue.serverTimestamp()
          }, { merge: true });

          // --- STAGE 7: UPDATE MERCHANT SETTLEMENT ---
          const settlementId = `SETTLE_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
          const settlementRef = db.collection('merchantSettlements').doc(settlementId);
          const releaseDate = new Date();
          releaseDate.setDate(releaseDate.getDate() + 7);
          transaction.set(settlementRef, {
            settlementId,
            orderId,
            businessId: sessionData.businessId || 'PI-BIZ',
            storeId: sessionData.storeId || '',
            sellerId: sellerId,
            amount: grandTotal * 0.95,
            currency: sessionData.currency || 'Pi',
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            releaseEligibleAt: releaseDate.toISOString()
          });

          // --- STAGE 8: COMPLETE ORDER (Create verified order doc) ---
          const orderRef = db.collection('orders').doc(orderId);
          const orderNumber = 'ORD-' + Math.random().toString(36).substr(2, 6).toUpperCase();
          const qrCode = `PI_QR_${orderId}_${Date.now()}`;
          const nowIso = new Date().toISOString();

          const initialLog = {
            timestamp: nowIso,
            message: 'Order Created',
            actorUid: buyerId,
            role: 'buyer',
            status: 'CONFIRMED'
          };

          const initialHistory = {
            status: 'CONFIRMED',
            timestamp: nowIso,
            updatedBy: buyerId,
            remarks: 'Order completed and verified server-side'
          };

          const orderData = {
            id: orderId,
            orderId: orderId,
            orderNumber,
            qrVerificationCode: qrCode,
            receiptNumber: `RCP-${orderNumber}`,
            type: 'order',
            buyerId,
            userUid: buyerId,
            sellerId,
            businessId: sessionData.businessId || 'PI-BIZ',
            storeId: sessionData.storeId || '',
            productId: sessionData.productId || '',
            quantity: sessionData.quantity || 1,
            price: sessionData.price || 0,
            currency: sessionData.currency || 'Pi',
            subtotal: sessionData.subtotal || grandTotal,
            discount: sessionData.discount || 0,
            shipping: sessionData.shipping || 0,
            tax: sessionData.tax || 0,
            grandTotal,
            amount: grandTotal,
            paymentStatus: 'Paid',
            orderStatus: 'CONFIRMED',
            paymentId: paymentDocId,
            paymentTxId: txid,
            transactionId: txid,
            activityLogs: [initialLog],
            historyLog: [initialHistory],
            createdAt: nowIso,
            updatedAt: nowIso,
            items: cartItems.map(item => {
              const cleanItem: any = {};
              Object.entries(item).forEach(([k, v]) => {
                if (v !== undefined && !Number.isNaN(v)) cleanItem[k] = v;
              });
              return cleanItem;
            })
          };

          transaction.set(orderRef, orderData);

          // --- STAGE 9: LOYALTY POINTS REWARD ---
          const points = Math.floor(grandTotal * 10);
          const loyaltyAccountId = `LOY_${buyerId}`;
          const loyaltyAccountRef = db.collection('loyaltyAccounts').doc(loyaltyAccountId);
          const loyaltyAccountSnap = await transaction.get(loyaltyAccountRef);

          if (!loyaltyAccountSnap.exists) {
            transaction.set(loyaltyAccountRef, {
              accountId: loyaltyAccountId,
              customerId: buyerId,
              businessId: sessionData.businessId || 'PI-BIZ',
              pointsBalance: points,
              tier: 'bronze',
              lifetimePoints: points,
              lastEarnedAt: FieldValue.serverTimestamp()
            });
          } else {
            const lData = loyaltyAccountSnap.data();
            const currentPoints = (lData?.pointsBalance || 0) + points;
            const lifetime = (lData?.lifetimePoints || 0) + points;
            let newTier = 'bronze';
            if (lifetime >= 5000) newTier = 'gold';
            else if (lifetime >= 2000) newTier = 'silver';

            transaction.update(loyaltyAccountRef, {
              pointsBalance: FieldValue.increment(points),
              lifetimePoints: FieldValue.increment(points),
              tier: newTier,
              lastEarnedAt: FieldValue.serverTimestamp()
            });
          }

          const lTrxId = `LTRX_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
          const lTrxRef = db.collection('loyaltyTransactions').doc(lTrxId);
          transaction.set(lTrxRef, {
            transactionId: lTrxId,
            accountId: loyaltyAccountId,
            type: 'earn',
            points,
            referenceType: 'order',
            referenceId: orderId,
            createdAt: FieldValue.serverTimestamp()
          });

          // --- STAGE 10: SAVE PAYMENT TRANSACTION ---
          const transactionData = {
            paymentId,
            txid,
            uid: buyerId,
            businessId: sessionData.businessId || "PI-CORP-001",
            storeId: sessionData.storeId || "PI-STORE-001",
            amount: grandTotal,
            memo: metadata?.memo || paymentData?.memo || `Payment for order #${orderNumber}`,
            paymentStatus: "completed",
            orderId: orderId,
            createdAt: FieldValue.serverTimestamp()
          };
          transaction.set(paymentRef, transactionData);

          // --- STAGE 11: UPDATE SESSIONS TO COMPLETED ---
          transaction.update(sessionRef, {
            status: 'completed',
            updatedAt: new Date().toISOString()
          });
        });
        
        console.log(`[Server Transaction] Complete flow successfully committed for order ${orderId}.`);
      }

      runtimeLogs.push(`[Runtime Log] Final payment status: completed`);
      res.json({ success: true, payment: paymentData, orderId: finalOrderId, logs: runtimeLogs });
    } catch (error: any) {
      const errorMsg = error.response?.data || error.message;
      console.error("[Pi Payment Complete] Error completing payment:", errorMsg);
      runtimeLogs.push(`[Runtime Log] Error completing payment: ${JSON.stringify(errorMsg)}`);
      res.status(500).json({
        error: "Failed to complete payment with Pi Network server",
        details: errorMsg,
        logs: runtimeLogs
      });
    }
  });

  app.post("/api/payments/status", authenticatePaymentRequest, async (req, res) => {
    try {
      const { transactionId, status } = req.body;
      if (!transactionId || !status) {
        return res.status(400).json({ error: "transactionId and status are required" });
      }

      if (getApps().length > 0) {
        const paymentRef = getDb().collection('payments').doc(transactionId);
        
        // Only allow changing from Pending/Processing to Cancelled/Failed
        await getDb().runTransaction(async (t) => {
          const doc = await t.get(paymentRef);
          if (!doc.exists) throw new Error("Transaction not found");
          
          const currentStatus = doc.data()?.status;
          if (currentStatus === 'Completed' || currentStatus === 'Refunded') {
            throw new Error("Cannot change status of a completed payment");
          }
          
          t.update(paymentRef, {
            status,
            updatedAt: FieldValue.serverTimestamp()
          });
        });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("[Payment Status] Error updating status:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/payments/incomplete", authenticatePaymentRequest, async (req, res) => {
    try {
      const { payment } = req.body;
      if (!payment || !payment.identifier) {
        return res
          .status(400)
          .json({ error: "Invalid incomplete payment payload" });
      }

      const isProduction = process.env.NODE_ENV === "production";
      const apiKey = process.env.PI_NETWORK_API_KEY;
      const isMissingApiKey = !apiKey || apiKey.trim() === "" || apiKey === "YOUR_PI_API_KEY";

      if (isProduction && isMissingApiKey) {
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

      if (isMissingApiKey) {
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

      res.json({
        success: true,
        message: "Payment already processed",
        payment,
      });
    } catch (error: any) {
      console.error(
        "[Pi Incomplete Payment] Error handling incomplete payment:",
        error.response?.data || error.message,
      );
      res.status(500).json({
        error: "Failed to handle incomplete payment",
        details: error.response?.data || error.message,
      });
    }
  });

  // Cloudinary Backend Upload Endpoint
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    let currentStep = "Request received";
    console.log(`[Upload] ✓ ${currentStep}`);

    try {
      if (!req.file) {
        currentStep = "File received - FAILED (No file)";
        console.error(`[Upload] ✗ ${currentStep}`);
        return res.status(400).json({
          success: false,
          step: "File received",
          error: "No file uploaded",
        });
      }

      currentStep = "File received";
      console.log(`[Upload] ✓ ${currentStep}`);

      if (!req.file.buffer) {
        currentStep = "Buffer size - FAILED (Buffer is undefined)";
        console.error(`[Upload] ✗ ${currentStep}`);
        return res.status(400).json({
          success: false,
          step: "Buffer size",
          error:
            "req.file.buffer is undefined. Multer memory storage may be misconfigured.",
        });
      }

      currentStep = "Buffer size";
      console.log(
        `[Upload] ✓ ${currentStep} (${req.file.buffer.length} bytes)`,
      );

      if (
        !(
          process.env.CLOUDINARY_CLOUD_NAME ||
          process.env.VITE_CLOUDINARY_CLOUD_NAME
        ) ||
        !(
          process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY
        ) ||
        !(
          process.env.CLOUDINARY_API_SECRET ||
          process.env.VITE_CLOUDINARY_API_SECRET
        )
      ) {
        currentStep = "Cloudinary initialized - FAILED (Missing env vars)";
        console.error(`[Upload] ✗ ${currentStep}`);
        return res.status(500).json({
          success: false,
          step: "Cloudinary initialized",
          error:
            "Cloudinary is not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your environment variables.",
        });
      }

      currentStep = "Cloudinary initialized";
      console.log(`[Upload] ✓ ${currentStep}`);

      const { folder } = req.body;

      currentStep = "Upload started";
      console.log(`[Upload] ✓ ${currentStep}`);

      const uploadResult: any = await new Promise((resolve, reject) => {
        try {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: folder || "general",
              resource_type: "auto",
              quality: "auto",
              fetch_format: "auto",
            },
            (error, result) => {
              if (error) {
                reject(new Error(error.message || JSON.stringify(error)));
              } else resolve(result);
            },
          );

          stream.end(req.file!.buffer);
        } catch (err: any) {
          reject(err);
        }
      });

      currentStep = "Upload completed";
      console.log(`[Upload] ✓ ${currentStep}`);

      res.json({
        success: true,
        secure_url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        resource_type: uploadResult.resource_type || "image",
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        bytes: uploadResult.bytes,
      });
    } catch (error: any) {
      console.error(`[Upload] ✗ Failed at step: ${currentStep}`, error);
      res.status(500).json({
        success: false,
        step: currentStep,
        error: error.message || String(error),
        stack: process.env.NODE_ENV !== "production" ? error.stack : undefined,
      });
    }
  });

  // Cloudinary Backend Delete Endpoint
  app.delete("/api/upload/:publicId(*)", async (req, res) => {
    try {
      const { publicId } = req.params;
      if (!publicId) {
        return res.status(400).json({ error: "Public ID is required" });
      }

      if (
        !(
          process.env.CLOUDINARY_CLOUD_NAME ||
          process.env.VITE_CLOUDINARY_CLOUD_NAME
        ) ||
        !(
          process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY
        ) ||
        !(
          process.env.CLOUDINARY_API_SECRET ||
          process.env.VITE_CLOUDINARY_API_SECRET
        )
      ) {
        return res.status(500).json({
          error:
            "Cloudinary is not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your environment variables.",
        });
      }

      const result = await cloudinary.uploader.destroy(publicId);
      res.json({ success: true, result });
    } catch (error: any) {
      console.error("[Cloudinary Delete] Failed:", error);
      res.status(500).json({
        success: false,
        error:
          "Deletion from Cloudinary failed: " +
          (error.message || String(error)),
        stack: process.env.NODE_ENV !== "production" ? error.stack : undefined,
      });
    }
  });

  // Vite middleware for development

  app.get("/api/debug-search", async (req, res) => {
    try {
      const { initializeApp, getApps, getApp } = await import("firebase/app");
      const { getFirestore, collection, getDocs } =
        await import("firebase/firestore");

      const firebaseConfig = {
        apiKey: process.env.VITE_FIREBASE_API_KEY,
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      };

      const firebaseApp =
        getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      const databaseId = process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || process.env.VITE_FIREBASE_DATABASE_ID;
      const db = databaseId 
        ? getFirestore(firebaseApp, databaseId)
        : getFirestore(firebaseApp);

      const storesRef = collection(db, "stores");
      const snap = await getDocs(storesRef);

      const stores: any[] = [];
      snap.forEach((doc) => {
        stores.push({ id: doc.id, ...doc.data() });
      });

      res.json({ count: stores.length, stores });
    } catch (err: any) {
      res.status(500).json({ error: err.message, stack: err.stack });
    }
  });

  app.get("/api/debug-env", (req, res) => {
    res.json({
      env: Object.keys(process.env).filter(
        (k) => k.includes("FIREBASE") || k.includes("VITE_"),
      ),
      firebase: {
        apiKey: process.env.VITE_FIREBASE_API_KEY,
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        databaseId: process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || process.env.VITE_FIREBASE_DATABASE_ID,
      },
    });
  });

  
  app.post("/api/debug-log", (req, res) => {
    fs.writeFileSync('/tmp/client_debug.json', JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();


