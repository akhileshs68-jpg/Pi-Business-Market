import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
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
  initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  });
}

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
  app.post("/api/payments/approve", async (req, res) => {
    try {
      const { paymentId, metadata } = req.body;
      if (!paymentId) {
        return res.status(400).json({ error: "paymentId is required" });
      }

      const apiKey = process.env.PI_NETWORK_API_KEY;
      if (!apiKey) {
        console.warn("[Pi Payment Approve] PI_NETWORK_API_KEY is not configured in env. Simulating sandbox approval.");
        
        // Update firestore transaction to Processing in Sandbox Mode
        if (metadata?.transactionId && getApps().length > 0) {
          try {
            await getFirestore().collection('payments').doc(metadata.transactionId).update({
              status: 'Processing',
              updatedAt: FieldValue.serverTimestamp()
            });
          } catch(err) {
            console.error("Failed to update firestore", err);
          }
        }

        return res.json({
          success: true,
          message: "Payment approved in sandbox mode",
          paymentId,
        });
      }

      console.log(`[Pi Payment Approve] Requesting Pi server approval for payment ${paymentId}...`);
      const response = await axios.post(
        `https://api.minepi.com/v2/payments/${paymentId}/approve`,
        {},
        { headers: { Authorization: `Key ${apiKey}` } }
      );
      
      // Update firestore transaction to Processing
      if (metadata?.transactionId && getApps().length > 0) {
        try {
          await getFirestore().collection('payments').doc(metadata.transactionId).update({
            status: 'Processing',
            piPaymentId: paymentId,
            updatedAt: FieldValue.serverTimestamp()
          });
        } catch(err) {
          console.error("Failed to update firestore", err);
        }
      }

      console.log(`[Pi Payment Approve] Successfully approved payment ${paymentId}`);
      res.json({ success: true, payment: response.data });
    } catch (error: any) {
      console.error("[Pi Payment Approve] Error approving payment:", error.response?.data || error.message);
      res.status(500).json({
        error: "Failed to approve payment with Pi Network server",
        details: error.response?.data || error.message,
      });
    }
  });

  app.post("/api/payments/complete", async (req, res) => {
    try {
      const { paymentId, txid, metadata } = req.body;
      if (!paymentId || !txid) {
        return res.status(400).json({ error: "paymentId and txid are required" });
      }

      // 1. Verify idempotency using Firestore
      if (metadata?.transactionId && getApps().length > 0) {
        const paymentRef = getFirestore().collection('payments').doc(metadata.transactionId);
        
        try {
          const result = await getFirestore().runTransaction(async (t) => {
            const doc = await t.get(paymentRef);
            if (!doc.exists) {
              throw new Error("Transaction not found");
            }
            if (doc.data()?.status === 'Completed') {
              throw new Error("Payment already completed");
            }
            
            // Mark as completed
            t.update(paymentRef, {
              status: 'Completed',
              transactionId: txid,
              piPaymentId: paymentId,
              updatedAt: FieldValue.serverTimestamp()
            });

            // Update order status if provided
            if (metadata.orderId) {
              const orderRef = getFirestore().collection('orders').doc(metadata.orderId);
              t.update(orderRef, {
                paymentStatus: 'Paid',
                updatedAt: FieldValue.serverTimestamp()
              });
            }
            
            return true;
          });
        } catch(err: any) {
          if (err.message === "Payment already completed") {
            return res.json({ success: true, message: "Payment already processed", paymentId, txid });
          }
          console.error("Transaction update failed", err);
        }
      }

      const apiKey = process.env.PI_NETWORK_API_KEY;
      if (!apiKey) {
        console.warn("[Pi Payment Complete] PI_NETWORK_API_KEY is not configured in env. Simulating sandbox completion.");
        return res.json({
          success: true,
          message: "Payment completed in sandbox mode",
          paymentId,
          txid,
        });
      }

      console.log(`[Pi Payment Complete] Requesting Pi server completion for payment ${paymentId} with txid ${txid}...`);
      const response = await axios.post(
        `https://api.minepi.com/v2/payments/${paymentId}/complete`,
        { txid },
        { headers: { Authorization: `Key ${apiKey}` } }
      );
      
      console.log(`[Pi Payment Complete] Successfully completed payment ${paymentId}`);
      res.json({ success: true, payment: response.data });
    } catch (error: any) {
      console.error("[Pi Payment Complete] Error completing payment:", error.response?.data || error.message);
      
      // Rollback to failed
      if (req.body.metadata?.transactionId && getApps().length > 0) {
        await getFirestore().collection('payments').doc(req.body.metadata.transactionId).update({
          status: 'Failed',
          updatedAt: FieldValue.serverTimestamp()
        }).catch(console.error);
      }

      res.status(500).json({
        error: "Failed to complete payment with Pi Network server",
        details: error.response?.data || error.message,
      });
    }
  });

  app.post("/api/payments/status", async (req, res) => {
    try {
      const { transactionId, status } = req.body;
      if (!transactionId || !status) {
        return res.status(400).json({ error: "transactionId and status are required" });
      }

      if (getApps().length > 0) {
        const paymentRef = getFirestore().collection('payments').doc(transactionId);
        
        // Only allow changing from Pending/Processing to Cancelled/Failed
        await getFirestore().runTransaction(async (t) => {
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

  app.post("/api/payments/incomplete", async (req, res) => {
    try {
      const { payment } = req.body;
      if (!payment || !payment.identifier) {
        return res
          .status(400)
          .json({ error: "Invalid incomplete payment payload" });
      }

      const paymentId = payment.identifier;
      const txid = payment.transaction?.txid;
      const apiKey = process.env.PI_NETWORK_API_KEY;

      console.log(
        `[Pi Incomplete Payment] Handling incomplete payment ${paymentId}...`,
      );

      if (!apiKey) {
        console.warn(
          "[Pi Incomplete Payment] PI_NETWORK_API_KEY not configured. Acknowledging for sandbox.",
        );
        return res.json({
          success: true,
          message: "Incomplete payment acknowledged in sandbox mode",
        });
      }

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
      const db = process.env.VITE_FIREBASE_DATABASE_ID 
        ? getFirestore(firebaseApp, process.env.VITE_FIREBASE_DATABASE_ID)
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
        databaseId: process.env.VITE_FIREBASE_DATABASE_ID,
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


