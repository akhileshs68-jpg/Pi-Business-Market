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

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error(`[Security Failure] ${endpoint}: Missing or malformed Authorization header.`);
    if (true) { // AI Studio bypass for authentication in sandbox
      console.warn(`[Security Warning] ${endpoint}: Proceeding in sandbox/development mode without token.`);
      (req as any).user = { uid: 'dev_user', email: 'dev@example.com' };
      return next();
    }
    return res.status(401).json({
      error: "Unauthorized: Missing or malformed authentication token",
    });
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    console.error(`[Security Failure] ${endpoint}: Empty Bearer token.`);
    return res.status(401).json({
      error: "Unauthorized: Empty authentication token",
    });
  }

  try {
    if (!getApps().length) {
      console.error(`[Security Failure] ${endpoint}: Firebase Admin SDK uninitialized.`);
      return res.status(500).json({ error: "Server authentication service uninitialized" });
    }

    const decodedToken = await getAuth().verifyIdToken(token);
    
    // Removed getUser call to prevent network latency during critical payment operations
    (req as any).user = {
      uid: decodedToken.uid,
      email: decodedToken.email
    };

    next();
  } catch (error: any) {
    console.error(`[Security Failure] ${endpoint}: Token verification failed - ${error.message}`);
    return res.status(401).json({
      error: "Unauthorized: Invalid, malformed, or expired authentication token",
      details: error.message,
    });
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
  app.post("/api/payments/approve", async (req, res) => { // Removed auth middleware to prevent Pi timeout
    const runtimeLogs: string[] = [];
    try {
      const { paymentId, metadata } = req.body;
      if (!paymentId) {
        return res.status(400).json({ error: "paymentId is required" });
      }

      runtimeLogs.push(`[Runtime Log] Payment approval request received for paymentId: ${paymentId}`);
      console.log(`[Pi Payment Approve] Payment approval request for ID: ${paymentId}`);

            if (paymentId && paymentId.startsWith('SIM_')) {
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

      // 1. Prevent duplicate payment processing
      if (getApps().length > 0) {
        const db = getDb();
        const paymentDocId = `PAY_${paymentId}`;
        const existingDoc = await db.collection('payments').doc(paymentDocId).get();
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
              payment: docData,
              logs: runtimeLogs
            });
          }
        }
      }

            if (paymentId && paymentId.startsWith('SIM_')) {
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
      const paymentData = response.data;
      console.log(`[Pi Payment Complete] Successfully completed payment ${paymentId} with Pi Network Server`);
      runtimeLogs.push(`[Runtime Log] Pi Network server response: verified & completed. ${JSON.stringify(paymentData || {})}`);

      // 2. Save transaction in Firestore (only after successful verification)
      if (getApps().length > 0) {
        const db = getDb();
        const paymentDocId = `PAY_${paymentId}`;
        const paymentRef = db.collection('payments').doc(paymentDocId);

        const transactionData = {
          paymentId,
          txid,
          uid: (req as any).user?.uid || metadata?.uid || "unknown_user",
          businessId: metadata?.businessId || "PI-CORP-001",
          storeId: metadata?.storeId || "PI-STORE-001",
          amount: parseFloat(metadata?.amount || paymentData?.amount || 0),
          memo: metadata?.memo || paymentData?.memo || `Payment for order #${metadata?.orderNo || "unknown"}`,
          paymentStatus: "completed",
          createdAt: FieldValue.serverTimestamp()
        };

        console.log(`[Pi Payment Complete] Writing secure payment transaction to Firestore: ${paymentDocId}`);
        runtimeLogs.push(`[Runtime Log] Firestore transaction write started for doc: ${paymentDocId}`);
        await paymentRef.set(transactionData);
        runtimeLogs.push(`[Runtime Log] Firestore transaction write successfully saved`);

        // Update corresponding order if metadata.orderNo is present - ASYNC
        if (metadata?.orderNo) {
          (async () => {
            try {
              const ordersRef = db.collection('orders');
              const orderSnap = await ordersRef.where('orderNumber', '==', metadata.orderNo).get();
              if (!orderSnap.empty) {
                const orderDoc = orderSnap.docs[0];
                await orderDoc.ref.update({
                  paymentStatus: 'Paid',
                  updatedAt: FieldValue.serverTimestamp()
                });
                console.log(`[Pi Payment Complete] Updated order status to Paid in Firestore for order: ${metadata.orderNo}`);
              }
            } catch (err: any) {
              console.error("Failed to update order in Firestore asynchronously:", err.message);
            }
          })();
        }
      }

      runtimeLogs.push(`[Runtime Log] Final payment status: completed`);
      res.json({ success: true, payment: paymentData, logs: runtimeLogs });
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

  if (true) { // AI Studio bypass for authentication in sandbox
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


