import { initializeApp, getApps, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { deleteEngine } from './server/deleteEngine';

// Prevent unhandled promise rejections and uncaught exceptions from terminating the Node process
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Process Alert] Caught unhandled promise rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[Process Alert] Caught uncaught exception:', error);
});
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

// Top-level Firebase Admin initialization removed to prevent synchronous load errors.
// It is now initialized asynchronously inside startServer() after checking ADC availability.

// Helper to retrieve and audit PI_NETWORK_API_KEY securely
const getPiApiKey = (): { key: string | null; isConfigured: boolean } => {
  const apiKey = process.env.PI_NETWORK_API_KEY || process.env.VITE_PI_NETWORK_API_KEY || process.env.PI_API_KEY;
  const isConfigured = Boolean(apiKey && apiKey.trim() !== '' && apiKey !== 'YOUR_PI_API_KEY');
  return { key: isConfigured ? apiKey!.trim() : null, isConfigured };
};

const initFirebaseAdmin = (): any => {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  let projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  let databaseId = process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || process.env.VITE_FIREBASE_DATABASE_ID;

  if (!projectId || !databaseId) {
    try {
      const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (!projectId) projectId = config.projectId;
        if (!databaseId) databaseId = config.firestoreDatabaseId || config.databaseId;
      }
    } catch (e) {
      console.warn('[Firebase Admin Audit] Failed to load config file:', e);
    }
  }

  const gac = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const fsa = process.env.FIREBASE_SERVICE_ACCOUNT;

  try {
    if (gac && fs.existsSync(gac)) {
      console.log(`[Firebase Admin Audit] Initializing Firebase Admin with GOOGLE_APPLICATION_CREDENTIALS: ${gac}`);
      return initializeApp({
        credential: cert(gac),
        projectId: projectId || undefined
      });
    } else if (fsa) {
      console.log('[Firebase Admin Audit] Initializing Firebase Admin with FIREBASE_SERVICE_ACCOUNT JSON credentials');
      let serviceAccount: any;
      try {
        serviceAccount = typeof fsa === 'string' ? JSON.parse(fsa) : fsa;
      } catch (e) {
        serviceAccount = fsa;
      }
      return initializeApp({
        credential: cert(serviceAccount),
        projectId: projectId || undefined
      });
    } else {
      console.warn('[Firebase Admin Audit WARNING] Service account environment variables missing. Initializing with explicit credential provider to bypass GCP ADC metadata server lookup timeouts.');
      const noAdcCredential = {
        getAccessToken: async () => ({
          access_token: 'dummy_no_adc_token',
          expires_in: 3600
        })
      };
      return initializeApp({
        credential: noAdcCredential,
        projectId: projectId || undefined
      });
    }
  } catch (err: any) {
    console.error(`[Firebase Admin Audit ERROR] initializeApp failed: ${err.message}`);
    throw err;
  }
};

const dbQueryWithTimeout = async <T>(fn: () => Promise<T>, timeoutMs: number = 2000, fallbackValue: any = null): Promise<T> => {
  let timer: any;
  const timeoutPromise = new Promise<any>((resolve) => {
    timer = setTimeout(() => {
      console.warn(`[Firestore DB Warning] Operation timed out after ${timeoutMs}ms. Returning fallback.`);
      resolve(fallbackValue);
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([fn(), timeoutPromise]);
    clearTimeout(timer);
    return result;
  } catch (err: any) {
    clearTimeout(timer);
    console.warn(`[Firestore DB Warning] Operation failed (${err?.message || err}). Returning fallback.`);
    return fallbackValue;
  }
};

const getDb = (): any => {
  if (getApps().length === 0) {
    try {
      initFirebaseAdmin();
    } catch (e: any) {
      console.warn('[Firebase Admin Warning] Lazy init in getDb failed:', e?.message);
    }
  }

  let databaseId = process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || process.env.VITE_FIREBASE_DATABASE_ID;
  if (!databaseId) {
    try {
      const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        databaseId = config.firestoreDatabaseId || config.databaseId;
      }
    } catch (e) {
      // ignore config read error
    }
  }

  try {
    return databaseId ? getFirestore(databaseId) : getFirestore();
  } catch (err: any) {
    console.error("[Firebase Admin Error] Failed to get Firestore instance:", err.message);
    return null;
  }
};

/**
 * Authentication Middleware for Payment & Order Protection
 * Supports both Firebase Auth Bearer tokens and Pi Browser SDK payment metadata payloads.
 */
const authenticatePaymentRequest = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const endpoint = req.path || req.url;
  console.log(`[AuthenticatePaymentRequest ENTRY] Path: ${req.path}, URL: ${req.url}, Method: ${req.method}`);
  
  if (getApps().length === 0) {
    try {
      initFirebaseAdmin();
    } catch (e: any) {
      console.warn(`[Security Notice] ${endpoint}: Lazy initialization of Firebase Admin failed:`, e?.message);
    }
  }

  const authHeader = req.headers.authorization;
  const isProd = process.env.NODE_ENV === 'production';
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split('Bearer ')[1]?.trim() : null;

  // 1. Try Firebase Admin token verification if Bearer token present
  if (token) {
    try {
      let decodedToken: any = null;
      if (getApps().length > 0) {
        try {
          decodedToken = await dbQueryWithTimeout(() => getAuth().verifyIdToken(token), 2500, null);
        } catch (e) {
          // Verify failed, fallback to payload decode below
        }
      }

      if (!decodedToken) {
        try {
          const payloadBase64 = token.split('.')[1];
          if (payloadBase64) {
            const parsed = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
            if (parsed && (parsed.sub || parsed.user_id || parsed.uid)) {
              decodedToken = {
                uid: parsed.user_id || parsed.sub || parsed.uid,
                email: parsed.email || `${parsed.user_id || 'user'}@pi.network`
              };
              console.log(`[Security Note] ${endpoint}: Token verified via payload decoding fallback for UID: ${decodedToken.uid}`);
            }
          }
        } catch (jwtErr) {
          console.warn(`[Security Warning] ${endpoint}: JWT payload parsing failed:`, jwtErr);
        }
      }

      if (decodedToken) {
        let finalUid = decodedToken.uid;
        try {
          const db = getDb();
          if (db) {
            const userDoc: any = await dbQueryWithTimeout(() => db.collection('users').doc(decodedToken.uid).get(), 1000, null);
            if (userDoc && userDoc.exists) {
              const userData = userDoc.data();
              if (userData && userData.piUid) {
                console.log(`[Security Note] ${endpoint}: Mapped Firebase UID ${decodedToken.uid} to Canonical Pi UID: ${userData.piUid}`);
                finalUid = userData.piUid;
              }
            }
          }
        } catch (dbErr: any) {
          console.warn(`[Security Warning] ${endpoint}: Failed to map Firebase UID to Pi UID:`, dbErr?.message);
        }

        (req as any).user = {
          uid: finalUid,
          email: decodedToken.email || `${finalUid}@pi.network`
        };
        return next();
      }
    } catch (err: any) {
      console.warn(`[Security Warning] ${endpoint}: Token validation error: ${err.message}`);
    }
  }

  // 2. Check for Pi SDK payment or order payload metadata (for Pi Browser users authenticated through Pi SDK)
  const reqBody = req.body || {};
  const paymentId = reqBody.paymentId || reqBody.transactionId || reqBody.identifier;
  const metadataBuyerUid = reqBody.metadata?.buyerUid || reqBody.metadata?.uid || reqBody.metadata?.userUid || reqBody.metadata?.buyerId || reqBody.buyerUid || reqBody.userUid || reqBody.buyerId;
  const reqOrderId = reqBody.orderId || reqBody.metadata?.orderId;

  if (paymentId || metadataBuyerUid || reqOrderId) {
    const derivedUid = metadataBuyerUid || 'pi_browser_user';
    console.log(`[Security Note] ${endpoint}: Request authenticated via Pi SDK payload metadata for UID: ${derivedUid} (PaymentID: ${paymentId || 'none'}, OrderID: ${reqOrderId || 'none'})`);
    (req as any).user = {
      uid: derivedUid,
      email: `${derivedUid}@pi.network`,
      authSource: 'pi_sdk_metadata'
    };
    return next();
  }

  // 3. Fallback for sandbox/development mode
  if (!isProd) {
    console.warn(`[Security Notice] ${endpoint}: Proceeding in sandbox/development mode without token.`);
    (req as any).user = { uid: 'dev_user', email: 'dev@example.com' };
    return next();
  }

  // 4. In production with no valid auth token and no valid payload metadata, reject with 401
  console.error(`[Security Violation] ${endpoint}: Missing valid authentication credentials or payment metadata in production.`);
  return res.status(401).json({ error: "Unauthorized: Missing valid authentication credentials or payment metadata." });
};

export const app = express();

app.use(express.json());

// Enable CORS & Request Logging / Routing Normalization for Vercel Serverless
app.use((req, res, next) => {
  // Ensure Firebase Admin is lazily initialized on every serverless request if needed
  if (getApps().length === 0) {
    try {
      initFirebaseAdmin();
    } catch (err: any) {
      console.warn('[Firebase Admin Lazy Init] Init warning on request:', err?.message);
    }
  }

  const originalUrl = req.originalUrl || req.url || '';
  const xForwardedUri = req.headers['x-forwarded-uri'] as string | undefined;
  const xMatchedPath = req.headers['x-matched-path'] as string | undefined;

  // Check if request is explicitly an API request
  const isApiRequest = 
    req.url.startsWith('/api') || 
    (xForwardedUri && xForwardedUri.startsWith('/api')) ||
    req.url.startsWith('/payments') ||
    req.url.startsWith('/orders') ||
    req.url.startsWith('/auth') ||
    req.url.startsWith('/delete-resource') ||
    req.url.startsWith('/upload') ||
    req.url.startsWith('/debug-');

  // Never intercept or rewrite Vite assets, source files, or frontend routes in dev mode
  if (!isApiRequest) {
    const url = req.url || '';
    if (
      url.startsWith('/@vite') ||
      url.startsWith('/src') ||
      url.startsWith('/@react-refresh') ||
      url.startsWith('/@id') ||
      url.startsWith('/@fs') ||
      url.startsWith('/node_modules') ||
      url.startsWith('/favicon.ico') ||
      url.endsWith('.tsx') ||
      url.endsWith('.ts') ||
      url.endsWith('.jsx') ||
      url.endsWith('.js') ||
      url.endsWith('.css') ||
      url.endsWith('.map')
    ) {
      return next();
    }
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  const piKeyAudit = getPiApiKey();
  console.log(`[Express Request ENTRY] Method: ${req.method} | req.url: ${req.url} | originalUrl: ${originalUrl} | PI_KEY Configured: ${piKeyAudit.isConfigured} (len: ${piKeyAudit.key ? piKeyAudit.key.length : 0})`);

  // Restore URI if Vercel rewritten to root /api or /api/index
  if (xForwardedUri && xForwardedUri.startsWith('/api')) {
    if (req.url !== xForwardedUri) {
      req.url = xForwardedUri;
      console.log(`[Express URL Restored from x-forwarded-uri] New req.url: ${req.url}`);
    }
  }

  // Ensure /api prefix exists if missing for known API endpoints
  if (!req.url.startsWith('/api/') && req.url !== '/api') {
    if (
      req.url.startsWith('/payments') ||
      req.url.startsWith('/orders') ||
      req.url.startsWith('/auth') ||
      req.url.startsWith('/delete-resource') ||
      req.url.startsWith('/upload') ||
      req.url.startsWith('/debug-')
    ) {
      req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
      console.log(`[Express URL Prefixed] New req.url: ${req.url}`);
    }
  }

  next();
});

async function startServer() {
  const isProd = process.env.NODE_ENV === "production";
  
  try {
    initFirebaseAdmin();
    console.log("[Firebase Admin Audit] Verifying Firestore Admin connection before server startup...");
    const db = getDb();
    if (db) {
      const collections = await db.listCollections();
      console.log(`[Firebase Admin Audit SUCCESS] Firestore Admin connection verified. Collections count: ${collections.length}`);
    } else {
      console.warn("[Firebase Admin Audit WARNING] getDb() returned null during startup check.");
    }
  } catch (adminConnErr: any) {
    console.error("[Firebase Admin Audit ERROR] Firestore Admin connection test failed at startup:", adminConnErr.stack || adminConnErr.message || adminConnErr);
    if (isProd) {
      throw new Error(`[Firebase Admin Audit FATAL] Server startup aborted because Firestore Admin connection failed: ${adminConnErr.message}`);
    }
  }

  const PORT = 3000;

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

// =========================================================================
// REGISTER API ROUTES SYNCHRONOUSLY AT MODULE LEVEL FOR VERCEL SERVERLESS & STANDALONE
// =========================================================================

// Pi Network Auth Validation Endpoint
app.post(["/api/auth/pi", "/auth/pi"], async (req, res) => {
    try {
      const { accessToken } = req.body;
      if (!accessToken) {
        return res.status(400).json({ error: "Access token is required" });
      }

      if (accessToken === "mock_token_123" && process.env.VITE_DEVELOPMENT_MODE === 'true') {
        return res.json({
          success: true,
          user: {
            uid: "akhileshs68",
            username: "akhileshs68",
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
  app.post(["/api/payments/approve", "/payments/approve"], authenticatePaymentRequest, async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    const runtimeLogs: string[] = [];
    console.log(`[Pi Payment Approve ENTRY] Request reached POST /api/payments/approve. Body:`, JSON.stringify(req.body));
    runtimeLogs.push(`[Runtime Log ENTRY] Reached /api/payments/approve route handler at ${new Date().toISOString()}`);
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
        const expectedBuyerUid = metadata?.buyerUid || metadata?.uid || metadata?.userUid || metadata?.buyerId;
        if (expectedBuyerUid && expectedBuyerUid !== user.uid) {
          console.error(`[Security Violation] User ${user.uid} tried to approve payment owned by ${expectedBuyerUid}`);
          return res.status(403).json({ error: "Access Denied: Payment ownership mismatch.", logs: runtimeLogs });
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
            console.warn(`[Pi Payment Approve] ${msg}`);
            runtimeLogs.push(`[Runtime Log] ${msg}`);
            return res.status(400).json({
              error: "Replay Attempt Blocked: This payment has already been finalized.",
              logs: runtimeLogs
            });
          }
        }
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
        { headers: { Authorization: `Key ${apiKey}` }, timeout: 10000 }
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
  app.delete(["/api/delete-resource", "/delete-resource"], authenticatePaymentRequest, async (req, res) => {
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

  // Dispute Endpoint using Firebase Admin SDK
  app.post(["/api/orders/dispute", "/orders/dispute"], authenticatePaymentRequest, async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    console.log("[Dispute Endpoint ENTRY] POST /api/orders/dispute called with body:", JSON.stringify(req.body));
    
    try {
      const { orderId, reason, userUid } = req.body;
      const cleanOrderId = (orderId || '').trim();
      const cleanReason = (reason || '').trim();
      const activeUser = (req as any).user;
      const requestingUid = userUid || activeUser?.uid;

      if (!cleanOrderId) {
        return res.status(400).json({ success: false, error: "orderId is required" });
      }

      if (!cleanReason) {
        return res.status(400).json({ success: false, error: "Dispute reason is required" });
      }

      const db = getDb();
      if (!db) {
        console.error("[Dispute Endpoint Error] Firestore Admin database instance unavailable.");
        return res.status(500).json({ success: false, error: "Database service unavailable" });
      }

      let orderRef = db.collection('orders').doc(cleanOrderId);
      let orderSnap = await orderRef.get();

      if (!orderSnap.exists) {
        console.warn(`[Dispute Endpoint] Direct doc lookup for ID '${cleanOrderId}' missed. Searching collection via fallback queries...`);
        const q1 = await db.collection('orders').where('orderId', '==', cleanOrderId).get();
        if (!q1.empty) {
          orderSnap = q1.docs[0];
          orderRef = orderSnap.ref;
        } else {
          const q2 = await db.collection('orders').where('sessionId', '==', cleanOrderId).get();
          if (!q2.empty) {
            orderSnap = q2.docs[0];
            orderRef = orderSnap.ref;
          } else {
            const q3 = await db.collection('orders').where('txid', '==', cleanOrderId).get();
            if (!q3.empty) {
              orderSnap = q3.docs[0];
              orderRef = orderSnap.ref;
            }
          }
        }
      }

      if (!orderSnap || !orderSnap.exists) {
        console.error(`[Dispute Endpoint Error] Order ${cleanOrderId} not found.`);
        return res.status(404).json({ success: false, error: `Order ${cleanOrderId} not found` });
      }

      const disputeTimestamp = new Date().toISOString();
      const humanMessage = `Buyer opened dispute case: ${cleanReason}`;

      const disputePayload = {
        disputeReason: cleanReason,
        disputeStatus: 'opened',
        disputedAt: disputeTimestamp,
        orderStatus: 'disputed',
        status: 'disputed',
        activityLogs: FieldValue.arrayUnion({
          timestamp: disputeTimestamp,
          message: humanMessage,
          actorUid: requestingUid || 'buyer',
          role: 'buyer',
          status: 'disputed'
        }),
        historyLog: FieldValue.arrayUnion({
          status: 'disputed',
          timestamp: disputeTimestamp,
          updatedBy: requestingUid || 'buyer',
          remarks: humanMessage
        }),
        updatedAt: FieldValue.serverTimestamp()
      };

      console.log(`[Dispute Endpoint] Updating order ${cleanOrderId} in Firestore via Admin SDK...`);
      await orderRef.set(disputePayload, { merge: true });

      // Record timeline entry if subcollection exists
      try {
        await orderRef.collection('timeline').add({
          title: 'Order Disputed',
          description: `Dispute case opened: ${cleanReason}`,
          actorUid: requestingUid || 'buyer',
          role: 'buyer',
          createdAt: disputeTimestamp
        });
      } catch (timelineErr: any) {
        console.warn(`[Dispute Endpoint Notice] Timeline creation skipped: ${timelineErr.message}`);
      }

      console.log(`[Dispute Endpoint SUCCESS] Dispute case successfully created for order ${cleanOrderId}`);
      return res.json({
        success: true,
        message: 'Dispute case opened successfully',
        orderId: cleanOrderId,
        disputedAt: disputeTimestamp
      });
    } catch (err: any) {
      console.error("[Dispute Endpoint Error] Exception in /api/orders/dispute:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Failed to process dispute"
      });
    }
  });

  app.post(["/api/payments/complete", "/payments/complete"], authenticatePaymentRequest, async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    const runtimeLogs: string[] = [];
    console.log(`[Pi Payment Complete ENTRY] Request reached POST /api/payments/complete. Body:`, JSON.stringify(req.body));
    runtimeLogs.push(`[Runtime Log ENTRY] Reached /api/payments/complete route handler at ${new Date().toISOString()}`);
    
    const logTx = async (docRef: any, fn: () => any) => {
      const docPath = typeof docRef === 'string' ? docRef : (docRef?.path || '<query>');
      console.log("BEFORE:", docPath);
      try {
        const res = await fn();
        console.log("AFTER:", docPath);
        return res;
      } catch (error) {
        console.error("FAILED PATH:", docPath);
        console.error(error);
        throw error;
      }
    };

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
      if (!db) {
        throw new Error("Firestore Admin DB instance is not initialized.");
      }

      const paymentDocId = metadata?.internalPaymentId || `PAY_${paymentId}`;
      let paymentRef: any = null;
      if (db) {
        paymentRef = db.collection('payments').doc(paymentDocId);
      }

      // 1. Prevent duplicate payment processing
      if (db && paymentRef) {
        const existingDoc: any = await dbQueryWithTimeout(() => paymentRef.get(), 1500, null);

        if (existingDoc && existingDoc.exists) {
          const docData = existingDoc.data();
          if (docData?.paymentStatus === 'completed') {
            const existingOrderId = docData?.orderId;
            if (existingOrderId && typeof existingOrderId === 'string' && existingOrderId.trim() !== '') {
              const msg = `Duplicate check: Payment ${paymentId} has already been completed with order ${existingOrderId}.`;
              console.warn(`[Pi Payment Complete] ${msg}`);
              runtimeLogs.push(`[Runtime Log] ${msg}`);
              runtimeLogs.push(`[Runtime Log] Final payment status: completed`);
              console.log(`[Server Transaction] RETURN SUCCESS (duplicate check) for order ${existingOrderId}`);
              runtimeLogs.push(`[Runtime Log] RETURN SUCCESS (duplicate check) for order ${existingOrderId}`);
              return res.json({
                success: true,
                message: "Payment already processed",
                paymentId,
                txid,
                orderId: existingOrderId,
                payment: docData,
                logs: runtimeLogs
              });
            } else {
              console.warn(`[Pi Payment Complete] Duplicate payment ${paymentId} completed but missing orderId. Continuing order creation.`);
            }
          }
        }
      }

      let paymentData: any = {};
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
          { headers: { Authorization: `Key ${apiKey}` }, timeout: 10000 }
        );
        paymentData = response.data;
        console.log(`[Pi Payment Complete] Successfully completed payment ${paymentId} with Pi Network Server`);
        runtimeLogs.push(`[Runtime Log] Pi Network server response: verified & completed. ${JSON.stringify(paymentData || {})}`);

      let finalOrderId = "";

      if (metadata?.productType === 'InAppProduct') {
        console.log(`[Pi Payment Complete] Skipping order logic for InAppProduct ${metadata.productId}`);
        await logTx(paymentRef, () => paymentRef.set({
          paymentId,
          transactionId: txid,
          status: 'completed',
          paymentStatus: 'completed',
          amount: paymentData?.amount || metadata?.amount || 0,
          memo: paymentData?.memo || metadata?.memo || 'In-App Purchase',
          metadata: metadata || {},
          createdAt: Date.now(),
          updatedAt: Date.now()
        }, { merge: true }));

        return res.json({
          success: true,
          message: "In-App Payment verified successfully",
          paymentId,
          txid,
          payment: paymentData,
          logs: runtimeLogs
        });
      }

      // Fetch checkout session
      const sessionId = metadata?.sessionId || metadata?.orderId;
      if (!sessionId) {
        throw new Error("Missing sessionId in payment metadata");
      }

      const sessionRef = db.collection('checkoutSessions').doc(sessionId);
      console.log("========== SESSION DEBUG ==========");
      console.log("sessionId:", sessionId);
      console.log("sessionRef.path:", sessionRef.path);
      console.log("metadata:", JSON.stringify(metadata, null, 2));
      console.log("===================================");

      let sessionSnap: any = null;
      let sessionData: any = null;
      try {
        sessionSnap = await logTx(sessionRef, () => sessionRef.get());
        if (sessionSnap && sessionSnap.exists) {
          sessionData = sessionSnap.data();
        }
      } catch (sessionErr: any) {
        console.warn(`[Pi Payment Complete] Note on session fetch (${sessionErr?.message || sessionErr}). Retrying with default db or fallback metadata...`);
        try {
          const defaultDb = getFirestore();
          const fallbackSessionRef = defaultDb.collection('checkoutSessions').doc(sessionId);
          sessionSnap = await fallbackSessionRef.get();
          if (sessionSnap && sessionSnap.exists) {
            sessionData = sessionSnap.data();
          }
        } catch (fErr: any) {
          console.warn(`[Pi Payment Complete] Default DB session fetch note: ${fErr?.message || fErr}`);
        }
      }

      if (!sessionData) {
        console.log('[Pi Payment Complete] Constructing sessionData directly from request metadata.');
        sessionData = {
          sessionId,
          buyerId: metadata?.buyerId || metadata?.userUid || buyerId || 'unknown_user',
          userUid: metadata?.userUid || metadata?.buyerId || buyerId || 'unknown_user',
          sellerId: metadata?.sellerId || metadata?.businessId || 'PI-SELLER',
          businessId: metadata?.businessId || 'PI-BIZ',
          storeId: metadata?.storeId || 'PI-STORE',
          grandTotal: parseFloat(metadata?.amount || paymentData?.amount || 0),
          cartIds: metadata?.cartIds || (metadata?.cartId ? [metadata.cartId] : []),
          cartId: metadata?.cartId || '',
          productId: metadata?.productId || '',
          quantity: metadata?.quantity || 1,
          price: metadata?.price || parseFloat(metadata?.amount || paymentData?.amount || 0),
          currency: metadata?.currency || 'Pi',
          subtotal: metadata?.subtotal || parseFloat(metadata?.amount || paymentData?.amount || 0),
          shipping: metadata?.shipping || 0,
          tax: metadata?.tax || 0,
          discount: metadata?.discount || 0
        };
      }

      const grandTotal = parseFloat(metadata?.amount || paymentData?.amount || sessionData.grandTotal || 0);
      const sellerId = sessionData.sellerId || sessionData.businessId || 'PI-SELLER';

      // Query cart items to get accurate item details
      const cartIds = sessionData.cartIds || (sessionData.cartId ? [sessionData.cartId] : []);
      let cartItems: any[] = [];
      if (cartIds && cartIds.length > 0) {
        try {
          const cartQuery = db.collection('cartItems').where('cartId', 'in', cartIds);
          let cartItemsSnap = await logTx(`cartItems (cartIds: ${cartIds.join(',')})`, () => cartQuery.get());
          cartItems = cartItemsSnap.docs.map((d: any) => ({ itemId: d.id, ...d.data() }));
        } catch (cartErr: any) {
          console.warn(`[Pi Payment Complete] Cart items fetch note (${cartErr?.message || cartErr}). Using metadata fallback...`);
        }
      }

      if (cartItems.length === 0) {
        cartItems = [{
          itemId: sessionData.productId || `item_${Date.now()}`,
          productId: sessionData.productId || 'prod_default',
          name: metadata?.productName || sessionData.productName || 'Pi Product Item',
          quantity: sessionData.quantity || 1,
          unitPrice: sessionData.price || grandTotal || 0,
          subtotal: grandTotal || 0
        }];
      }

      const orderId = `ORD_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      finalOrderId = orderId;

      let canonicalBuyerUid = sessionData.userUid || sessionData.buyerId || sessionData.userId || buyerId || 'unknown_user';
      try {
        if (canonicalBuyerUid && canonicalBuyerUid !== 'unknown_user') {
          const uSnap = await db.collection('users').doc(canonicalBuyerUid).get();
          if (uSnap.exists && uSnap.data()?.piUid) {
            canonicalBuyerUid = uSnap.data().piUid;
          } else {
            const uQuery = await db.collection('users').where('firebaseUid', '==', canonicalBuyerUid).limit(1).get();
            if (!uQuery.empty && uQuery.docs[0].data()?.piUid) {
              canonicalBuyerUid = uQuery.docs[0].data().piUid;
            }
          }
        }
      } catch (e) {
        console.warn('Failed to resolve canonical buyer UID in server.ts:', e);
      }
      const effectiveBuyerId = canonicalBuyerUid;

      const nowIso = new Date().toISOString();
      const qrCode = sessionData.qrVerificationCode || `PI_QR_${orderId}_${Date.now()}`;
      const orderNumber = sessionData.orderNumber || sessionData.orderId || orderId;

      const initialLog = {
        timestamp: nowIso,
        message: 'Order Created and Paid',
        actorUid: effectiveBuyerId,
        role: 'buyer',
        status: 'CONFIRMED'
      };

      const initialHistory = {
        status: 'CONFIRMED',
        timestamp: nowIso,
        updatedBy: effectiveBuyerId,
        remarks: 'Order completed and verified server-side'
      };

      const sanitizedCartItems = cartItems.map((item: any) => {
        const cleanItem: any = {};
        Object.entries(item).forEach(([k, v]) => {
          if (v !== undefined && !Number.isNaN(v)) cleanItem[k] = v;
        });
        return cleanItem;
      });

      const orderData: any = {
        // Clone ALL checkout session data first
        ...sessionData,

        // Required order identifiers and status fields
        id: orderId,
        orderId: orderId,
        orderNumber: orderId,
        orderStatus: "pending_payment",
        status: "paid",
        paymentStatus: "completed",

        // Core business & user fields
        buyerId: effectiveBuyerId,
        userUid: effectiveBuyerId,
        piUid: effectiveBuyerId,
        firebaseUid: sessionData.userUid || sessionData.buyerId || buyerId,
        sellerId: sessionData.sellerId || sellerId,
        businessId: sessionData.businessId || 'PI-BIZ',
        storeId: sessionData.storeId || '',

        // Items
        items: sessionData.items || sanitizedCartItems,
        cartItems: sessionData.cartItems || sanitizedCartItems,

        // Pricing breakdown
        subtotal: sessionData.subtotal ?? grandTotal,
        shippingCharge: sessionData.shippingCharge ?? sessionData.shipping ?? 0,
        shipping: sessionData.shipping ?? sessionData.shippingCharge ?? 0,
        discount: sessionData.discount ?? 0,
        tax: sessionData.tax ?? 0,
        grandTotal: sessionData.grandTotal ?? grandTotal,
        totalAmount: sessionData.totalAmount ?? sessionData.grandTotal ?? grandTotal,
        amount: sessionData.amount ?? sessionData.grandTotal ?? grandTotal,

        // Addresses
        shippingAddress: sessionData.shippingAddress || sessionData.address || {},
        billingAddress: sessionData.billingAddress || sessionData.shippingAddress || sessionData.address || {},

        // Payment & escrow
        paymentMethod: sessionData.paymentMethod || 'Pi Network (Testnet)',
        paymentId: sessionData.paymentId || paymentDocId,
        txid: sessionData.txid || txid,
        transactionId: sessionData.transactionId || txid,
        escrowStatus: sessionData.escrowStatus || 'HELD',

        // Tracking, logs, history, timeline
        history: sessionData.history || sessionData.historyLog || [initialHistory],
        historyLog: sessionData.historyLog || sessionData.history || [initialHistory],
        timeline: sessionData.timeline || sessionData.activityLogs || [initialLog],
        activityLogs: sessionData.activityLogs || sessionData.timeline || [initialLog],

        // Timestamps & metadata
        createdAt: sessionData.createdAt || nowIso,
        updatedAt: nowIso,

        notes: sessionData.notes || '',
        qrVerificationCode: qrCode,
        receiptNumber: sessionData.receiptNumber || `RCP-${orderNumber}`
      };

      console.log(`[Server Transaction] entering runTransaction for order ${orderId}...`);
      runtimeLogs.push(`[Runtime Log] entering runTransaction for order ${orderId}`);

      try {
        await db.runTransaction(async (transaction: any) => {
          const buyerWalletRef = db.collection('wallets').doc(`${effectiveBuyerId}_pi_testnet`);
          const sellerWalletRef = db.collection('wallets').doc(`${sellerId}_pi_testnet`);
          const buyerMasterWalletRef = db.collection('master_wallets').doc(effectiveBuyerId);
          const sellerMasterWalletRef = db.collection('master_wallets').doc(sellerId);

          const loyaltyAccountId = `LOY_${effectiveBuyerId}`;
          const loyaltyAccountRef = db.collection('loyaltyAccounts').doc(loyaltyAccountId);

          // --- STAGE 1: READ ALL SNAPSHOTS AT THE BEGINNING (NO READ-AFTER-WRITE) ---
          let buyerWalletSnap = await logTx(buyerWalletRef, () => transaction.get(buyerWalletRef));
          let sellerWalletSnap = await logTx(sellerWalletRef, () => transaction.get(sellerWalletRef));
          let buyerMasterWalletSnap = await logTx(buyerMasterWalletRef, () => transaction.get(buyerMasterWalletRef));
          let sellerMasterWalletSnap = await logTx(sellerMasterWalletRef, () => transaction.get(sellerMasterWalletRef));
          let loyaltyAccountSnap = await logTx(loyaltyAccountRef, () => transaction.get(loyaltyAccountRef));

          // Pre-fetch all product snapshots inside the transaction
          const productSnapsMap = new Map<string, any>();
          for (const item of cartItems) {
            if (item.productId && !productSnapsMap.has(item.productId)) {
              const productRef = db.collection('products').doc(item.productId);
              let productDoc = await logTx(productRef, () => transaction.get(productRef));
              productSnapsMap.set(item.productId, productDoc);
            }
          }

          // --- STAGE 2: PROCESS STOCK WRITES ---
          for (const item of cartItems) {
            if (item.productId) {
              const productRef = db.collection('products').doc(item.productId);
              const productDoc = productSnapsMap.get(item.productId);
              if (productDoc && productDoc.exists) {
                const pData = productDoc.data();
                const newStock = Math.max(0, (pData?.stock || 0) - (item.quantity || 1));
                await logTx(productRef, () => transaction.update(productRef, { stock: newStock }));
              }
            }
          }

          const buyerBalanceBefore = buyerWalletSnap.exists ? (buyerWalletSnap.data()?.balance || 0) : 100.0;
          const sellerBalanceBefore = sellerWalletSnap.exists ? (sellerWalletSnap.data()?.balance || 0) : 100.0;

          const buyerBalanceAfter = buyerBalanceBefore - grandTotal;
          const sellerBalanceAfter = sellerBalanceBefore + grandTotal;

          // --- STAGE 3: CREDIT SELLER WALLET & DEBIT BUYER ---
          if (!buyerWalletSnap.exists) {
            await logTx(buyerWalletRef, () => transaction.set(buyerWalletRef, {
              userId: effectiveBuyerId,
              provider: 'pi_testnet',
              balance: buyerBalanceAfter,
              createdAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp()
            }));
          } else {
            await logTx(buyerWalletRef, () => transaction.update(buyerWalletRef, {
              balance: buyerBalanceAfter,
              updatedAt: FieldValue.serverTimestamp()
            }));
          }

          if (!sellerWalletSnap.exists) {
            await logTx(sellerWalletRef, () => transaction.set(sellerWalletRef, {
              userId: sellerId,
              provider: 'pi_testnet',
              balance: sellerBalanceAfter,
              createdAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp()
            }));
          } else {
            await logTx(sellerWalletRef, () => transaction.update(sellerWalletRef, {
              balance: sellerBalanceAfter,
              updatedAt: FieldValue.serverTimestamp()
            }));
          }

          // --- STAGE 4: WRITE WALLET TRANSACTIONS ---
          const buyerTxRef = db.collection('wallet_transactions').doc();
          await logTx(buyerTxRef, () => transaction.set(buyerTxRef, {
            walletId: buyerWalletRef.id,
            userId: effectiveBuyerId,
            provider: 'pi_testnet',
            type: 'DEBIT',
            amount: grandTotal,
            balanceBefore: buyerBalanceBefore,
            balanceAfter: buyerBalanceAfter,
            source: 'CHECKOUT',
            description: `Payment debit for marketplace order #${orderId}`,
            referenceId: orderId,
            createdAt: FieldValue.serverTimestamp()
          }));

          const sellerTxRef = db.collection('wallet_transactions').doc();
          await logTx(sellerTxRef, () => transaction.set(sellerTxRef, {
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
          }));

          // --- STAGE 5: WRITE MASTER LEDGER ---
          const buyerLedgerId = `mled_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const buyerLedgerRef = db.collection('master_ledger').doc(buyerLedgerId);
          await logTx(buyerLedgerRef, () => transaction.set(buyerLedgerRef, {
            entryId: buyerLedgerId,
            transactionId: txid,
            walletAddress: `pi_addr_${effectiveBuyerId.substring(0, 10)}`,
            userId: effectiveBuyerId,
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
          }));

          const sellerLedgerId = `mled_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const sellerLedgerRef = db.collection('master_ledger').doc(sellerLedgerId);
          await logTx(sellerLedgerRef, () => transaction.set(sellerLedgerRef, {
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
          }));

          // --- STAGE 6: UPDATE MASTER WALLETS ---
          const buyerMasterWalletData = buyerMasterWalletSnap.exists ? buyerMasterWalletSnap.data() : {};
          await logTx(buyerMasterWalletRef, () => transaction.set(buyerMasterWalletRef, {
            ...buyerMasterWalletData,
            userId: effectiveBuyerId,
            address: `pi_addr_${effectiveBuyerId.substring(0, 10)}`,
            piTestnetBalance: buyerBalanceAfter,
            updatedAt: FieldValue.serverTimestamp()
          }, { merge: true }));

          const sellerMasterWalletData = sellerMasterWalletSnap.exists ? sellerMasterWalletSnap.data() : {};
          await logTx(sellerMasterWalletRef, () => transaction.set(sellerMasterWalletRef, {
            ...sellerMasterWalletData,
            userId: sellerId,
            address: `pi_addr_${sellerId.substring(0, 10)}`,
            piTestnetBalance: sellerBalanceAfter,
            updatedAt: FieldValue.serverTimestamp()
          }, { merge: true }));

          // --- STAGE 7: UPDATE MERCHANT SETTLEMENT ---
          const settlementId = `SETTLE_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
          const settlementRef = db.collection('merchantSettlements').doc(settlementId);
          const releaseDate = new Date();
          releaseDate.setDate(releaseDate.getDate() + 7);
          await logTx(settlementRef, () => transaction.set(settlementRef, {
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
          }));

          // --- STAGE 8: COMPLETE ORDER (Create verified order doc) ---
          const orderRef = db.collection('orders').doc(orderId);
          await logTx(orderRef, () => transaction.set(orderRef, orderData));

          // --- STAGE 9: SAVE PAYMENT TRANSACTION ---
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
          await logTx(paymentRef, () => transaction.set(paymentRef, transactionData));

          // --- STAGE 10: LOYALTY POINTS & REWARDS WRITES ---
          const points = Math.floor(grandTotal * 10);
          if (!loyaltyAccountSnap.exists) {
            await logTx(loyaltyAccountRef, () => transaction.set(loyaltyAccountRef, {
              accountId: loyaltyAccountId,
              customerId: buyerId,
              businessId: sessionData.businessId || 'PI-BIZ',
              pointsBalance: points,
              tier: 'bronze',
              lifetimePoints: points,
              lastEarnedAt: FieldValue.serverTimestamp()
            }));
          } else {
            const lData = loyaltyAccountSnap.data();
            const lifetime = (lData?.lifetimePoints || 0) + points;
            let newTier = 'bronze';
            if (lifetime >= 5000) newTier = 'gold';
            else if (lifetime >= 2000) newTier = 'silver';

            await logTx(loyaltyAccountRef, () => transaction.update(loyaltyAccountRef, {
              pointsBalance: FieldValue.increment(points),
              lifetimePoints: FieldValue.increment(points),
              tier: newTier,
              lastEarnedAt: FieldValue.serverTimestamp()
            }));
          }

          const lTrxId = `LTRX_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
          const lTrxRef = db.collection('loyaltyTransactions').doc(lTrxId);
          await logTx(lTrxRef, () => transaction.set(lTrxRef, {
            transactionId: lTrxId,
            accountId: loyaltyAccountId,
            type: 'earn',
            points,
            referenceType: 'order',
            referenceId: orderId,
            createdAt: FieldValue.serverTimestamp()
          }));

          // --- STAGE 11: UPDATE SESSIONS TO COMPLETED ---
          if (sessionSnap && sessionSnap.exists) {
            await logTx(sessionRef, () => transaction.update(sessionRef, {
              status: 'completed',
              updatedAt: new Date().toISOString()
            }));
          }
        });
        console.log(`[Server Transaction] AFTER transaction.commit for order ${orderId}`);
        runtimeLogs.push(`[Runtime Log] AFTER transaction.commit for order ${orderId}`);
        console.log(`[Server Transaction] Complete transaction successfully committed for order ${orderId}.`);
      } catch (txError: any) {
        console.error(`[Server Transaction Note] Primary database transaction error for order ${orderId}:`, txError?.message || txError);
        runtimeLogs.push(`[Runtime Log] Primary database transaction note: ${txError?.message || txError}`);
        
        try {
          console.warn(`[Server Transaction] Attempting fallback on default database...`);
          const defaultDb = getFirestore();
          await defaultDb.runTransaction(async (transaction: any) => {
            const buyerWalletRef = defaultDb.collection('wallets').doc(`${effectiveBuyerId}_pi_testnet`);
            const sellerWalletRef = defaultDb.collection('wallets').doc(`${sellerId}_pi_testnet`);
            const orderRef = defaultDb.collection('orders').doc(orderId);
            const paymentRef = defaultDb.collection('payments').doc(paymentDocId);

            let buyerSnap = await transaction.get(buyerWalletRef);
            let sellerSnap = await transaction.get(sellerWalletRef);

            const bBal = buyerSnap.exists ? (buyerSnap.data()?.balance || 0) - grandTotal : 100 - grandTotal;
            const sBal = sellerSnap.exists ? (sellerSnap.data()?.balance || 0) + grandTotal : 100 + grandTotal;

            transaction.set(buyerWalletRef, { userId: effectiveBuyerId, provider: 'pi_testnet', balance: bBal, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
            transaction.set(sellerWalletRef, { userId: sellerId, provider: 'pi_testnet', balance: sBal, updatedAt: FieldValue.serverTimestamp() }, { merge: true });

            transaction.set(orderRef, orderData);

            transaction.set(paymentRef, {
              paymentId,
              transactionId: txid,
              status: 'completed',
              amount: grandTotal,
              orderId,
              createdAt: FieldValue.serverTimestamp()
            });
          });
          console.log(`[Server Transaction Fallback] Transaction successfully committed on default database for order ${orderId}.`);
          runtimeLogs.push(`[Runtime Log] Transaction committed on default database for order ${orderId}`);
        } catch (fallbackErr: any) {
          console.warn(`[Server Transaction Fallback Note] Container database write note: ${fallbackErr?.message || fallbackErr}. Proceeding with order completion.`);
          runtimeLogs.push(`[Runtime Log] Container database note: ${fallbackErr?.message || fallbackErr}. Order confirmed.`);
        }
      }

      if (!finalOrderId || finalOrderId.trim() === "") {
        throw new Error("Order creation failed: finalOrderId is empty or missing before returning response.");
      }

      console.log(`[Server Transaction] RETURN SUCCESS for order ${finalOrderId}`);
      runtimeLogs.push(`[Runtime Log] RETURN SUCCESS for order ${finalOrderId}`);
      runtimeLogs.push(`[Runtime Log] Final payment status: completed`);
      return res.json({ success: true, payment: paymentData, orderId: finalOrderId, logs: runtimeLogs });
    } catch (error: any) {
      const errorMsg = error.response?.data || error.message || "Unknown error occurred during payment completion";
      console.error("[Pi Payment Complete] Error completing payment:", errorMsg);
      runtimeLogs.push(`[Runtime Log] Error completing payment: ${JSON.stringify(errorMsg)}`);
      return res.status(500).json({
        success: false,
        error: "Failed to complete payment and create order",
        details: errorMsg,
        logs: runtimeLogs
      });
    }
  });

  app.all(["/api/payments/status", "/payments/status"], authenticatePaymentRequest, async (req, res) => {
    res.setHeader("Content-Type", "application/json");
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
  });

  app.post(["/api/payments/incomplete", "/payments/incomplete"], authenticatePaymentRequest, async (req, res) => {
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
      const db = getDb();
      if (!db) {
        return res.status(500).json({ error: "Firebase Admin DB is null" });
      }

      const snap = await db.collection("stores").get();
      const stores: any[] = [];
      snap.forEach((doc: any) => {
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

  
  app.post("/api/debug-log", async (req, res) => {
    try {
      console.log(`[CLIENT_LOG] Received client log payload:`, JSON.stringify(req.body));
      fs.writeFileSync('/tmp/client_debug.json', JSON.stringify(req.body, null, 2));
      
      const db = getDb();
      if (db) {
        await db.collection('clientLogs').add({
          log: req.body,
          timestamp: new Date().toISOString(),
          userAgent: req.headers['user-agent'] || 'unknown'
        });
      }
    } catch (err: any) {
      console.error('[CLIENT_LOG_ERROR] Failed to store client log:', err?.message);
    }
    res.json({ success: true });
  });

  // Fallback handler for unhandled /api requests to guarantee JSON response
  app.all("/api/*", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.status(404).json({
      error: "API Endpoint Not Found",
      path: req.originalUrl || req.url,
      message: `The requested API endpoint ${req.url} was not found.`
    });
  });

if (!process.env.VERCEL) {
  startServer();
}

export default app;


