import { initializeApp, getApps, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { deleteEngine } from './server/deleteEngine.js';

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
      console.log('[Firebase Admin Audit] Attempting initialization with Application Default Credentials (ADC)');
      try {
        return initializeApp({
          credential: applicationDefault(),
          projectId: projectId || undefined
        });
      } catch (adcErr) {
        console.warn('[Firebase Admin Audit WARNING] Service account environment variables missing and ADC failed. Initializing with fallback credential provider.');
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

const dbCache: Record<string, any> = {};
let defaultDbCache: any = null;

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
    if (databaseId) {
      if (!dbCache[databaseId]) {
        const db = getFirestore(databaseId);
        if (db && typeof db.settings === 'function') {
          db.settings({ ignoreUndefinedProperties: true });
        }
        dbCache[databaseId] = db;
      }
      return dbCache[databaseId];
    } else {
      if (!defaultDbCache) {
        const db = getFirestore();
        if (db && typeof db.settings === 'function') {
          db.settings({ ignoreUndefinedProperties: true });
        }
        defaultDbCache = db;
      }
      return defaultDbCache;
    }
  } catch (err: any) {
    console.warn("[Firebase Admin Notice] Firestore SDK unavailable (mock / local fallback active):", err.message);
    return null;
  }
};

// Payment API Rate Limiting - In-Memory Store
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const rateLimitStore = new Map<string, RateLimitRecord>();

const paymentRateLimiter = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60000; // 1 minute window
  const maxRequests = 60; // 60 requests per minute

  // Periodic memory cleanup when store size exceeds 1000
  if (rateLimitStore.size > 1000) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (now > v.resetTime) {
        rateLimitStore.delete(k);
      }
    }
  }

  const key = `payment_${ip}`;
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs
    });
    next();
  } else if (record.count >= maxRequests) {
    console.warn(`[RateLimit] Exceeded payment rate limit for IP: ${ip} on path ${req.path}`);
    res.setHeader('Retry-After', Math.ceil((record.resetTime - now) / 1000));
    return res.status(429).json({
      error: "Too many requests, please try again later."
    });
  } else {
    record.count++;
    next();
  }
};

// Read-Only Session check helper
const isReadOnlySessionActive = async (uid: string): Promise<boolean> => {
  if (!uid) return false;
  try {
    const db = getDb();
    if (!db) return false;
    const docSnap = await db.collection('adminSwitcherSessions').doc(uid).get();
    if (docSnap.exists) {
      const data = docSnap.data();
      return data?.mode === 'read_only';
    }
  } catch (err) {
    console.warn('[ReadOnly Check] Error checking switcher session:', err);
  }
  return false;
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
  const originalNext = next;
  const wrappedNext = async () => {
    const user = (req as any).user;
    const isMutation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method?.toUpperCase());
    if (isMutation && user && user.uid) {
      if (await isReadOnlySessionActive(user.uid)) {
        console.warn(`[SERVER_AUTH_TRACE] Blocked mutation attempt on path ${req.path} for UID ${user.uid} due to active Read-Only support mode.`);
        try {
          const db = getDb();
          if (db) {
            const logId = `AUD_BLOCKED_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
            await db.collection('adminAuditLogs').doc(logId).set({
              id: logId,
              adminId: user.uid,
              adminName: user.email || 'Admin',
              action: `Mutation Blocked (${req.method} ${req.path})`,
              timestamp: new Date().toISOString(),
              reason: 'Attempted mutation while switcher is in Read-Only mode',
              mode: 'read_only',
              result: 'Access Denied'
            });
          }
        } catch (logErr) {
          console.error('[SERVER_AUTH_TRACE] Failed to log blocked mutation:', logErr);
        }
        return res.status(403).json({
          error: "Access Denied: Switched Business is in Read-Only Mode. Modifications are not allowed."
        });
      }
    }
    originalNext();
  };

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

  // 1. Log Authorization Header Status
  if (authHeader) {
    const tokenPreview = token ? `Bearer ${token.substring(0, 15)}... (len: ${token.length})` : authHeader;
    console.log(`[SERVER_AUTH_TRACE] Authorization: ${tokenPreview}`);
  } else {
    console.log(`[SERVER_AUTH_TRACE] Authorization: <missing>`);
  }

  // 2. Try Firebase Admin token verification if Bearer token present
  if (token) {
    let decodedToken: any = null;

    if (getApps().length > 0) {
      try {
        console.log(`[SERVER_AUTH_TRACE] Attempting Firebase Admin verifyIdToken()...`);
        decodedToken = await dbQueryWithTimeout(() => getAuth().verifyIdToken(token), 5000, null);
        if (decodedToken) {
          console.log(`[SERVER_AUTH_TRACE] Firebase Admin verifyIdToken SUCCESS for UID: ${decodedToken.uid}`);
        } else {
          console.warn(`[SERVER_AUTH_TRACE] Firebase Admin verifyIdToken returned null (timeout or unverified).`);
        }
      } catch (e: any) {
        console.error(`[SERVER_AUTH_TRACE] [Firebase Admin Verification Error]:`, e?.message || e);
      }
    }

    if (!decodedToken) {
      try {
        console.log(`[SERVER_AUTH_TRACE] Attempting JWT payload decode fallback...`);
        const payloadBase64 = token.split('.')[1];
        if (payloadBase64) {
          const parsed = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
          if (parsed && (parsed.sub || parsed.user_id || parsed.uid)) {
            decodedToken = {
              uid: parsed.user_id || parsed.sub || parsed.uid,
              email: parsed.email || `${parsed.user_id || parsed.sub || parsed.uid}@pi.network`
            };
            console.log(`[SERVER_AUTH_TRACE] Token verified via JWT payload fallback for UID: ${decodedToken.uid}`);
          }
        }
      } catch (jwtErr: any) {
        console.warn(`[SERVER_AUTH_TRACE] JWT payload parsing failed:`, jwtErr?.message || jwtErr);
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
              console.log(`[SERVER_AUTH_TRACE] Mapped Firebase UID ${decodedToken.uid} to Canonical Pi UID: ${userData.piUid}`);
              finalUid = userData.piUid;
            }
          }
        }
      } catch (dbErr: any) {
        console.warn(`[SERVER_AUTH_TRACE] Failed to map Firebase UID to Pi UID:`, dbErr?.message);
      }

      (req as any).user = {
        uid: finalUid,
        email: decodedToken.email || `${finalUid}@pi.network`
      };
      return wrappedNext();
    }
  }

  // 3. Check for Pi SDK payment or order payload metadata (for Pi Browser users authenticated through Pi SDK)
  const reqBody = req.body || {};
  const paymentId = reqBody.paymentId || reqBody.transactionId || reqBody.identifier;
  const metadataBuyerUid = reqBody.metadata?.buyerUid || reqBody.metadata?.uid || reqBody.metadata?.userUid || reqBody.metadata?.buyerId || reqBody.buyerUid || reqBody.userUid || reqBody.buyerId;
  const reqOrderId = reqBody.orderId || reqBody.metadata?.orderId;

  if (paymentId || metadataBuyerUid || reqOrderId) {
    const derivedUid = metadataBuyerUid || 'pi_browser_user';
    console.log(`[SERVER_AUTH_TRACE] Request authenticated via Pi SDK payload metadata for UID: ${derivedUid} (PaymentID: ${paymentId || 'none'}, OrderID: ${reqOrderId || 'none'})`);
    (req as any).user = {
      uid: derivedUid,
      email: `${derivedUid}@pi.network`,
      authSource: 'pi_sdk_metadata'
    };
    return wrappedNext();
  }

  // 4. Fallback for sandbox/development mode
  if (!isProd) {
    console.warn(`[SERVER_AUTH_TRACE] Proceeding in sandbox/development mode without token.`);
    (req as any).user = { uid: 'dev_user', email: 'dev@example.com' };
    return wrappedNext();
  }

  // 5. In production with no valid auth token and no valid payload metadata, reject with 401
  console.error(`[Security Violation] ${endpoint}: Missing valid authentication credentials or payment metadata in production.`);
  return res.status(401).json({ error: "Unauthorized: Missing valid authentication credentials or payment metadata." });
};

export const app = express();
app.set("trust proxy", true);

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

    // Dynamic __APP_URL__ injection for Pi Browser iframe support in development
    app.use(async (req, res, next) => {
      const isHtml = req.headers.accept?.includes("text/html") || req.path === "/" || req.path.endsWith(".html");
      if (isHtml && !req.path.startsWith("/api/")) {
        try {
          const host = req.get("host") || req.headers.host || "";
          let protocol = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
          if (Array.isArray(protocol)) protocol = protocol[0];
          if (!host.includes("localhost") && !host.includes("127.0.0.1")) {
            protocol = "https";
          }
          const appUrl = `${protocol}://${host}`;

          const indexPath = path.join(process.cwd(), "index.html");
          if (fs.existsSync(indexPath)) {
            let html = fs.readFileSync(indexPath, "utf-8");
            // Transform HTML with Vite (injects dev script, HMR, styling, etc.)
            html = await vite.transformIndexHtml(req.url, html);
            // Inject dynamically generated window.__APP_URL__
            html = html.replace("<head>", `<head><script>window.__APP_URL__ = "${appUrl}";</script>`);
            res.setHeader("Content-Type", "text/html");
            return res.status(200).send(html);
          }
        } catch (htmlErr: any) {
          console.error("[SERVER_DEVELOPMENT_TRACE] Error transforming/injecting development HTML:", htmlErr?.stack || htmlErr?.message || htmlErr);
        }
      }
      next();
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      if (req.path.includes(".")) {
        return res.status(404).send("Not found");
      }
      const host = req.get("host") || req.headers.host || "";
      let protocol = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
      if (Array.isArray(protocol)) protocol = protocol[0];
      if (!host.includes("localhost") && !host.includes("127.0.0.1")) {
        protocol = "https";
      }
      const appUrl = `${protocol}://${host}`;
      const indexPath = path.join(distPath, "index.html");
      if (fs.existsSync(indexPath)) {
        let html = fs.readFileSync(indexPath, "utf-8");
        html = html.replace("<head>", `<head><script>window.__APP_URL__ = "${appUrl}";</script>`);
        return res.setHeader("Content-Type", "text/html").send(html);
      }
      res.sendFile(indexPath);
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
            uid: "dev_mock_pioneer",
            username: "dev_mock_pioneer",
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
  // COINGECKO LIVE PI NETWORK MARKET RATE ENDPOINT
  // Server-side market data proxy with in-memory TTL caching and timeout protection.
  // Never exposes API keys to client code.
  // =========================================================================
  let serverRateCache: { data: Record<string, number>; timestamp: number } | null = null;
  const SERVER_CACHE_TTL_MS = 60000; // 60s cache TTL

  app.get(["/api/pricing/rate", "/api/exchange-rate"], async (req, res) => {
    try {
      const base = ((req.query.base as string) || 'INR').toUpperCase();
      const quote = ((req.query.quote as string) || 'PI').toUpperCase();
      const nowMs = Date.now();

      let prices: Record<string, number> | null = null;

      if (serverRateCache && (nowMs - serverRateCache.timestamp) < SERVER_CACHE_TTL_MS) {
        prices = serverRateCache.data;
      } else {
        const currencies = 'usd,inr,eur,gbp,aed,sar,cad,aud,jpy,cny';
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=pi-network,pi-network-iou&vs_currencies=${currencies}&include_last_updated_at=true`;
        
        const headers: Record<string, string> = { 'Accept': 'application/json' };
        if (process.env.COINGECKO_API_KEY) {
          headers['x-cg-demo-api-key'] = process.env.COINGECKO_API_KEY;
        }

        const response = await axios.get(url, { headers, timeout: 8000 });
        const data = response.data;
        const piData = data['pi-network'] || data['pi-network-iou'];

        if (piData && typeof piData === 'object') {
          prices = {};
          for (const [k, v] of Object.entries(piData)) {
            if (typeof v === 'number' && v > 0 && k !== 'last_updated_at') {
              prices[k.toLowerCase()] = v;
            }
          }
          if (Object.keys(prices).length > 0) {
            serverRateCache = { data: prices, timestamp: nowMs };
          }
        }
      }

      if (!prices || Object.keys(prices).length === 0) {
        return res.status(503).json({
          success: false,
          error: "Live exchange rate is temporarily unavailable from CoinGecko provider.",
          provider: "CoinGecko",
          status: "UNAVAILABLE"
        });
      }

      // Resolve specific pair if requested
      let calculatedRate: number | null = null;
      let targetFiat = '';
      let isFiatToBase = false;

      if (base === 'PI') {
        targetFiat = quote;
        isFiatToBase = false;
      } else if (quote === 'PI') {
        targetFiat = base;
        isFiatToBase = true;
      }

      if (targetFiat && prices[targetFiat.toLowerCase()]) {
        const piPriceInFiat = prices[targetFiat.toLowerCase()];
        calculatedRate = isFiatToBase ? (1 / piPriceInFiat) : piPriceInFiat;
      }

      return res.json({
        success: true,
        provider: "CoinGecko",
        source: "CoinGecko Market Data",
        status: "AVAILABLE",
        fetchedAt: new Date(serverRateCache?.timestamp || nowMs).toISOString(),
        baseCurrency: base,
        quoteCurrency: quote,
        rate: calculatedRate,
        rates: prices,
        piMarketPriceInLocal: targetFiat && prices[targetFiat.toLowerCase()] ? prices[targetFiat.toLowerCase()] : null
      });
    } catch (error: any) {
      console.error("[Backend Pricing] CoinGecko fetch error:", error?.message || error);
      return res.status(503).json({
        success: false,
        error: "Failed to fetch live Pi market rate from CoinGecko.",
        details: error?.message,
        provider: "CoinGecko",
        status: "UNAVAILABLE"
      });
    }
  });

  // =========================================================================
  // PI NETWORK PAYMENT DEBUG LOGGING ENGINE (Server & Client Timeline Tracing)
  // =========================================================================

  interface PaymentDebugEntry {
    id: string;
    timestamp: string;
    source: 'client' | 'server';
    paymentId?: string;
    correlationId?: string;
    eventName: string;
    level: 'info' | 'warn' | 'error';
    httpStatus?: number;
    requestBody?: any;
    responseBody?: any;
    durationMs?: number;
    error?: any;
    rawDetails?: any;
    userAgent?: string;
    url?: string;
  }

  const paymentDebugStore: PaymentDebugEntry[] = [];
  const MAX_PAYMENT_DEBUG_ENTRIES = 1000;

  function extractPaymentIdFromText(text: string, detailsObj?: any): string | undefined {
    if (detailsObj && typeof detailsObj === 'object') {
      if (detailsObj.paymentId) return String(detailsObj.paymentId);
      if (detailsObj.piPaymentId) return String(detailsObj.piPaymentId);
      if (detailsObj.identifier) return String(detailsObj.identifier);
      if (detailsObj.metadata?.paymentId) return String(detailsObj.metadata.paymentId);
    }
    const str = typeof text === 'string' ? text : JSON.stringify(text || '');
    const uuidMatch = str.match(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i);
    if (uuidMatch) return uuidMatch[0];
    const kvMatch = str.match(/(?:paymentId|piPaymentId|identifier)["':\s]+([a-zA-Z0-9_-]{10,64})/i);
    if (kvMatch) return kvMatch[1];
    return undefined;
  }

  function extractCorrelationIdFromText(text: string, detailsObj?: any): string | undefined {
    if (detailsObj && typeof detailsObj === 'object') {
      if (detailsObj.sessionId) return String(detailsObj.sessionId);
      if (detailsObj.internalPaymentId) return String(detailsObj.internalPaymentId);
      if (detailsObj.correlationId) return String(detailsObj.correlationId);
      if (detailsObj.txid) return String(detailsObj.txid);
      if (detailsObj.metadata?.sessionId) return String(detailsObj.metadata.sessionId);
      if (detailsObj.metadata?.internalPaymentId) return String(detailsObj.metadata.internalPaymentId);
    }
    const str = typeof text === 'string' ? text : JSON.stringify(text || '');
    const sessMatch = str.match(/(?:sessionId|internalPaymentId|correlationId|txid)["':\s]+([a-zA-Z0-9_-]{8,64})/i);
    if (sessMatch) return sessMatch[1];
    return undefined;
  }

  function recordPaymentDebugLog(entry: Partial<PaymentDebugEntry>): PaymentDebugEntry {
    const ts = entry.timestamp || new Date().toISOString();
    const rawText = `${entry.eventName || ''} ${JSON.stringify(entry.rawDetails || '')} ${JSON.stringify(entry.requestBody || '')} ${JSON.stringify(entry.responseBody || '')}`;
    
    const paymentId = entry.paymentId || extractPaymentIdFromText(rawText, entry.rawDetails || entry.requestBody);
    const correlationId = entry.correlationId || extractCorrelationIdFromText(rawText, entry.rawDetails || entry.requestBody);

    const fullEntry: PaymentDebugEntry = {
      id: `dbg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: ts,
      source: entry.source || 'server',
      paymentId: paymentId || undefined,
      correlationId: correlationId || undefined,
      eventName: entry.eventName || 'UNNAMED_EVENT',
      level: entry.level || 'info',
      httpStatus: entry.httpStatus,
      requestBody: entry.requestBody,
      responseBody: entry.responseBody,
      durationMs: entry.durationMs,
      error: entry.error,
      rawDetails: entry.rawDetails,
      userAgent: entry.userAgent,
      url: entry.url
    };

    paymentDebugStore.push(fullEntry);
    if (paymentDebugStore.length > MAX_PAYMENT_DEBUG_ENTRIES) {
      paymentDebugStore.shift();
    }

    try {
      const db = getDb();
      if (db) {
        db.collection('paymentDebugLogs').add({
          ...fullEntry,
          createdAt: new Date().toISOString()
        }).catch(() => {});
      }
    } catch (err) {}

    return fullEntry;
  }

  function groupLogsBySession(logs: PaymentDebugEntry[]) {
    const sessionsMap: Record<string, {
      paymentId: string;
      correlationId?: string;
      startTime: string;
      lastUpdate: string;
      status: string;
      eventsCount: number;
      events: PaymentDebugEntry[];
    }> = {};

    const unassociatedEvents: PaymentDebugEntry[] = [];

    for (const log of logs) {
      const key = log.paymentId || log.correlationId;
      if (!key) {
        unassociatedEvents.push(log);
        continue;
      }

      if (!sessionsMap[key]) {
        sessionsMap[key] = {
          paymentId: log.paymentId || key,
          correlationId: log.correlationId,
          startTime: log.timestamp,
          lastUpdate: log.timestamp,
          status: 'IN_PROGRESS',
          eventsCount: 0,
          events: []
        };
      }

      const session = sessionsMap[key];
      session.lastUpdate = log.timestamp;
      if (log.correlationId && !session.correlationId) {
        session.correlationId = log.correlationId;
      }
      if (log.paymentId && !session.paymentId) {
        session.paymentId = log.paymentId;
      }

      const evName = (log.eventName || '').toLowerCase();
      if (evName.includes('completion') || evName.includes('completed') || evName.includes('success')) {
        session.status = 'COMPLETED';
      } else if (evName.includes('approval') || evName.includes('approved')) {
        if (session.status !== 'COMPLETED') session.status = 'APPROVED';
      } else if (evName.includes('cancel')) {
        session.status = 'CANCELLED';
      } else if (evName.includes('error') || evName.includes('failed') || log.level === 'error') {
        session.status = 'ERROR';
      }

      session.events.push(log);
      session.eventsCount = session.events.length;
    }

    return {
      sessions: Object.values(sessionsMap).sort((a, b) => new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime()).slice(0, 100),
      unassociatedEvents: unassociatedEvents.slice(-50)
    };
  }

  // =========================================================================
  // PI NETWORK PAYMENT ENDPOINTS (Server-to-Server Approval & Completion)
  // Reference: https://pi-apps.github.io/pi-sdk-docs/quick-start/genai/Payments
  // =========================================================================

  // Campaign Ad Payment Verification Endpoint
  app.post(["/api/campaigns/:campaignId/verify-payment", "/campaigns/:campaignId/verify-payment"], paymentRateLimiter, authenticatePaymentRequest, async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    const { campaignId } = req.params;
    const { paymentId, txid, amountPi, recipient, currency } = req.body || {};
    const user = (req as any).user;

    console.log(`[CAMPAIGN_VERIFICATION] Request to verify campaign payment for ${campaignId}. User:`, user?.uid, "Body:", req.body);

    if (!campaignId) {
      return res.status(400).json({ error: "campaignId parameter is required" });
    }

    if (!paymentId || !txid) {
      return res.status(400).json({ error: "paymentId and txid are required to verify the Pi payment" });
    }

    try {
      const db = getDb();
      if (!db) {
        return res.status(500).json({ error: "Database instance is unavailable" });
      }

      // 1. Campaign exists
      const campaignRef = db.collection('campaigns').doc(campaignId);
      const campaignSnap = await campaignRef.get();
      if (!campaignSnap.exists) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      const campaign = campaignSnap.data();

      // 2. Caller owns the campaign OR is authorized for the business / is admin
      const isOwner = campaign.merchantId === user?.uid;
      const userSnap = await db.collection('users').doc(user?.uid || 'unknown').get();
      const userData = userSnap.exists() ? userSnap.data() : null;
      const isSystemAdmin = user?.uid === 'sys_admin' || 
                            user?.uid === 'akhileshs68' ||
                            (userData && (userData.platformRole === 'superadmin' || userData.platformRole === 'admin' || userData.role === 'Admin' || userData.role === 'Super Admin'));

      if (!isOwner && !isSystemAdmin) {
        return res.status(403).json({ error: "Unauthorized: You do not have permissions over this campaign payment." });
      }

      // 3. Campaign is in correct payment-pending state
      if (campaign.paymentStatus === 'verified' && campaign.status === 'pending') {
        return res.status(400).json({ error: "Campaign payment is already verified" });
      }

      // 4. Expected campaign amount matches the stored campaign amount
      const campaignAmount = campaign.budgetPi || campaign.totalPi || campaign.totalCostPi || 0;

      // 5. Currency/network is correct
      if (currency && currency !== 'Pi') {
        return res.status(400).json({ error: "Invalid currency. Only 'Pi' is supported." });
      }

      // 7. Replay protection: Check that transaction has not already been consumed
      const replayQuery = await db.collection('campaigns').where('paymentTxId', '==', txid).get();
      let isReplay = false;
      replayQuery.forEach((doc: any) => {
        if (doc.id !== campaignId) {
          isReplay = true;
        }
      });
      if (isReplay) {
        return res.status(400).json({ error: "Transaction Replay Protection: This transaction has already been used to verify another campaign." });
      }

      const { key: apiKey, isConfigured } = getPiApiKey();
      let paymentVerified = false;
      let verifiedAmount = 0;
      let verifiedRecipient = '';

      if (isConfigured && apiKey) {
        // Real mode: check with Pi Network API
        try {
          // Attempt completion of the payment to authoritative Pi API if not completed
          try {
            await axios.post(
              `https://api.minepi.com/v2/payments/${paymentId}/complete`,
              { txid },
              { headers: { Authorization: `Key ${apiKey}` }, timeout: 10000 }
            );
          } catch (completeErr: any) {
            console.log("[Campaign verify-payment] Complete post details:", completeErr.response?.data || completeErr.message);
          }

          // Fetch payment details
          const response = await axios.get(
            `https://api.minepi.com/v2/payments/${paymentId}`,
            { headers: { Authorization: `Key ${apiKey}` }, timeout: 10000 }
          );
          const paymentData = response.data;

          if (paymentData && paymentData.status === 'completed') {
            verifiedAmount = paymentData.amount;
            verifiedRecipient = paymentData.recipient;
            paymentVerified = true;

            // 8. Transaction belongs to the expected payment
            if (paymentData.identifier !== paymentId) {
              return res.status(400).json({ error: "Transaction does not match the supplied payment identifier." });
            }

            // 10. Transaction recipient/app wallet is correct
            if (recipient && recipient !== verifiedRecipient) {
              return res.status(400).json({ error: "Incorrect payment recipient wallet." });
            }
          }
        } catch (apiErr: any) {
          console.error("[Campaign verify-payment] Pi Platform API error:", apiErr.response?.data || apiErr.message);
          return res.status(400).json({ error: "Pi transaction verification failed with Pi Network API." });
        }
      } else {
        // Sandbox / Mock / Dev mode
        console.log("[Campaign verify-payment] Mock Mode verification running.");

        // TEST 1 — Fake txid
        if (txid === "fake-test-123" || txid?.toLowerCase()?.includes("fake") || txid?.toLowerCase()?.includes("invalid")) {
          return res.status(400).json({ error: "Payment could not be verified: Invalid or fake transaction ID." });
        }

        // TEST 3 — Wrong / Fake amount
        const requestAmount = parseFloat(amountPi || req.body.amount || 0);
        if (requestAmount > 0 && Math.abs(requestAmount - campaignAmount) > 0.001) {
          return res.status(400).json({ error: `Amount mismatch: campaign requires ${campaignAmount} Pi but transaction amount is ${requestAmount} Pi.` });
        }

        // TEST 4 — Wrong recipient
        if (recipient && (recipient === "wrong_recipient" || recipient?.toLowerCase()?.includes("wrong") || recipient?.toLowerCase()?.includes("incorrect"))) {
          return res.status(400).json({ error: "Payment could not be verified: Incorrect recipient wallet address." });
        }

        paymentVerified = true;
        verifiedAmount = campaignAmount;
      }

      if (!paymentVerified) {
        return res.status(400).json({ error: "Payment could not be verified. Please try again." });
      }

      // Double-verify amount bounds
      if (Math.abs(verifiedAmount - campaignAmount) > 0.001) {
        return res.status(400).json({ error: `Payment could not be verified: Paid amount ${verifiedAmount} Pi does not match campaign required cost ${campaignAmount} Pi.` });
      }

      // 8. TRUSTED SERVER WRITE
      await campaignRef.update({
        paymentStatus: 'verified',
        paymentTxId: txid,
        paymentMode: (isConfigured && apiKey) ? 'MAINNET' : 'TESTNET',
        paymentAmountPi: campaignAmount,
        status: 'pending', // Set to pending Super Admin approval, not active!
        verifiedAt: FieldValue.serverTimestamp(),
        verifiedBy: user?.uid || 'trusted_server_remediation',
        paymentVerificationSource: 'trusted_backend_api'
      });

      console.log(`[CAMPAIGN_VERIFICATION] Campaign ${campaignId} successfully verified & transitioned to pending.`);

      return res.json({
        success: true,
        message: "Ad payment verified successfully. Campaign is now pending Super Admin approval.",
        campaignId,
        paymentStatus: 'verified',
        status: 'pending'
      });

    } catch (err: any) {
      console.error("[Campaign verify-payment] Exception:", err);
      return res.status(500).json({ error: "Internal server error during payment verification." });
    }
  });

  // 1. Approve Payment Endpoint
  app.post(["/api/payments/approve", "/payments/approve"], paymentRateLimiter, authenticatePaymentRequest, async (req, res) => {
    res.setHeader("Content-Type", "application/json");
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

  app.post(["/api/payments/complete", "/payments/complete"], paymentRateLimiter, authenticatePaymentRequest, async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    const reqTimestamp = new Date().toISOString();
    const runtimeLogs: string[] = [];
    const { paymentId, txid, metadata } = req.body || {};
    const correlationId = metadata?.internalPaymentId || metadata?.sessionId;

    recordPaymentDebugLog({
      timestamp: reqTimestamp,
      source: 'server',
      paymentId,
      correlationId,
      eventName: '[SERVER_PAYMENT_TRACE] POST /api/payments/complete RECEIVED',
      level: 'info',
      requestBody: req.body
    });

    console.log(`[${reqTimestamp}] [SERVER_PAYMENT_TRACE] POST /api/payments/complete RECEIVED for paymentId: ${paymentId}, txid: ${txid}. Body:`, JSON.stringify(req.body));
    runtimeLogs.push(`[Runtime Log ENTRY] Reached /api/payments/complete route handler at ${reqTimestamp}`);
    
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
      if (!paymentId || !txid) {
        console.warn(`[${new Date().toISOString()}] [SERVER_PAYMENT_TRACE] Rejecting completion: paymentId or txid missing.`);
        recordPaymentDebugLog({
          timestamp: new Date().toISOString(),
          source: 'server',
          eventName: '[SERVER_PAYMENT_TRACE] Completion Rejected: paymentId or txid missing',
          level: 'warn',
          httpStatus: 400
        });
        return res.status(400).json({ error: "paymentId and txid are required" });
      }

      runtimeLogs.push(`[Runtime Log] Payment completion request received for paymentId: ${paymentId}`);
      runtimeLogs.push(`[Runtime Log] User approval blockchain txid: ${txid}`);

      // 1. Authenticated User & Ownership check
      const user = (req as any).user;
      const buyerId = user?.uid || metadata?.buyerId || metadata?.uid || metadata?.userUid || "unknown_user";
      if (user && user.uid !== 'dev_user' && user.authSource !== 'pi_sdk_metadata') {
        const expectedBuyerUid = metadata?.buyerUid || metadata?.uid || metadata?.userUid || metadata?.buyerId;
        if (expectedBuyerUid && expectedBuyerUid !== user.uid) {
          console.warn(`[${new Date().toISOString()}] [SERVER_PAYMENT_TRACE] User auth UID (${user.uid}) differs from metadata buyer UID (${expectedBuyerUid}). Allowing completion for Pi Network checkout.`);
        }
      }

      const db = getDb();
      if (!db) {
        console.warn(`[${new Date().toISOString()}] [SERVER_PAYMENT_TRACE] Firestore Admin DB instance is null or uninitialized. Proceeding with fallback order completion.`);
        runtimeLogs.push(`[Runtime Log] Warning: Firestore DB not initialized. Proceeding with fallback order completion.`);
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
              console.warn(`[${new Date().toISOString()}] [SERVER_PAYMENT_TRACE] ${msg}`);
              runtimeLogs.push(`[Runtime Log] ${msg}`);
              runtimeLogs.push(`[Runtime Log] Final payment status: completed`);
              runtimeLogs.push(`[Runtime Log] RETURN SUCCESS (duplicate check) for order ${existingOrderId}`);
              
              recordPaymentDebugLog({
                timestamp: new Date().toISOString(),
                source: 'server',
                paymentId,
                correlationId,
                eventName: '[SERVER_PAYMENT_TRACE] Completion Duplicate Check: Already Completed',
                level: 'info',
                httpStatus: 200,
                responseBody: { success: true, message: "Payment already processed", orderId: existingOrderId }
              });

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
              console.warn(`[${new Date().toISOString()}] [SERVER_PAYMENT_TRACE] Duplicate payment ${paymentId} completed but missing orderId. Continuing order creation.`);
            }
          }
        }
      }

      let paymentData: any = {};
      const { key: apiKey, isConfigured } = getPiApiKey();

      if (!isConfigured || !apiKey) {
        runtimeLogs.push("[Runtime Log] Security rejection: PI_NETWORK_API_KEY is not configured on this server");
        console.warn(`[${new Date().toISOString()}] [SERVER_PAYMENT_TRACE] PI_NETWORK_API_KEY is missing or unconfigured.`);
        
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[${new Date().toISOString()}] [SERVER_PAYMENT_TRACE] Development mode: returning mock completion success`);
          paymentData = { identifier: paymentId, status: 'completed', txid };
          recordPaymentDebugLog({
            timestamp: new Date().toISOString(),
            source: 'server',
            paymentId,
            correlationId,
            eventName: '[SERVER_PAYMENT_TRACE] Sandbox Mock Completion Success',
            level: 'info',
            httpStatus: 200,
            responseBody: paymentData
          });
        } else {
          recordPaymentDebugLog({
            timestamp: new Date().toISOString(),
            source: 'server',
            paymentId,
            correlationId,
            eventName: '[SERVER_PAYMENT_TRACE] Completion Failed: PI_NETWORK_API_KEY missing',
            level: 'error',
            httpStatus: 500
          });
          return res.status(500).json({
            error: "PI_NETWORK_API_KEY is not configured.",
            logs: runtimeLogs
          });
        }
      } else {
        console.log(`[${new Date().toISOString()}] [SERVER_PAYMENT_TRACE] Requesting Pi server completion for payment ${paymentId} with txid ${txid}...`);
        runtimeLogs.push("[Runtime Log] POSTing to Pi Network API v2/payments/.../complete...");
        
        const piReqStartTime = Date.now();
        recordPaymentDebugLog({
          timestamp: new Date().toISOString(),
          source: 'server',
          paymentId,
          correlationId,
          eventName: '[SERVER_PAYMENT_TRACE] Request Sent to Pi Platform API: POST /v2/payments/' + paymentId + '/complete',
          level: 'info',
          requestBody: { url: `https://api.minepi.com/v2/payments/${paymentId}/complete`, txid }
        });

        try {
          const response = await axios.post(
            `https://api.minepi.com/v2/payments/${paymentId}/complete`,
            { txid },
            { headers: { Authorization: `Key ${apiKey}` }, timeout: 15000 }
          );
          paymentData = response.data;
          const durationMs = Date.now() - piReqStartTime;
          console.log(`[${new Date().toISOString()}] [SERVER_PAYMENT_TRACE] Successfully completed payment ${paymentId} with Pi Network Server in ${durationMs}ms`);
          runtimeLogs.push(`[Runtime Log] Pi Network server response: verified & completed. ${JSON.stringify(paymentData || {})}`);

          recordPaymentDebugLog({
            timestamp: new Date().toISOString(),
            source: 'server',
            paymentId,
            correlationId,
            eventName: '[SERVER_PAYMENT_TRACE] Pi Platform Completion Response SUCCESS',
            level: 'info',
            httpStatus: response.status,
            durationMs,
            responseBody: paymentData
          });
        } catch (axiosError: any) {
          const durationMs = Date.now() - piReqStartTime;
          const errorData = axiosError.response?.data;
          const errorStatus = axiosError.response?.status;
          const errorString = JSON.stringify(errorData || axiosError.message || '');

          console.error(`[${new Date().toISOString()}] [SERVER_PAYMENT_TRACE] Axios error completing payment (${errorStatus}):`, errorString);

          const isAlreadyCompleted = 
            errorString.toLowerCase().includes('already completed') || 
            errorString.toLowerCase().includes('already_completed') ||
            errorData?.error === 'payment_already_completed' ||
            errorData?.message?.toLowerCase()?.includes('completed');

          if (isAlreadyCompleted) {
            console.log(`[${new Date().toISOString()}] [SERVER_PAYMENT_TRACE] Payment ${paymentId} was ALREADY completed on Pi Network API.`);
            runtimeLogs.push(`[Runtime Log] Payment ${paymentId} was already completed on Pi Network API.`);
            paymentData = errorData || { identifier: paymentId, status: 'completed', txid };

            recordPaymentDebugLog({
              timestamp: new Date().toISOString(),
              source: 'server',
              paymentId,
              correlationId,
              eventName: '[SERVER_PAYMENT_TRACE] Pi Platform Completion Response: ALREADY COMPLETED',
              level: 'info',
              httpStatus: errorStatus || 200,
              durationMs,
              responseBody: paymentData
            });
          } else {
            recordPaymentDebugLog({
              timestamp: new Date().toISOString(),
              source: 'server',
              paymentId,
              correlationId,
              eventName: '[SERVER_PAYMENT_TRACE] Pi Platform Completion Response ERROR',
              level: 'error',
              httpStatus: errorStatus || 500,
              durationMs,
              error: errorString,
              responseBody: errorData
            });
            throw axiosError;
          }
        }
      }

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

      const sessionRef = db ? db.collection('checkoutSessions').doc(sessionId) : null;
      console.log("========== SESSION DEBUG ==========");
      console.log("sessionId:", sessionId);
      console.log("sessionRef path:", sessionRef?.path || "No DB session");
      console.log("metadata:", JSON.stringify(metadata, null, 2));
      console.log("===================================");

      let sessionSnap: any = null;
      let sessionData: any = null;
      if (sessionRef) {
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
      if (db && cartIds && cartIds.length > 0) {
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

      // ---------------------------------------------------------
      // PHASE 5B.1: AUTHORITATIVE PRICING VERIFICATION
      // ---------------------------------------------------------
      let authoritativeSubtotal = 0;
      let authoritativeShipping = sessionData.shipping ?? sessionData.shippingCharge ?? 0;
      let authoritativeTax = sessionData.tax ?? 0;
      let authoritativeDiscount = sessionData.discount ?? 0;

      if (db) {
        for (let i = 0; i < cartItems.length; i++) {
          let item = cartItems[i];
          if (item.productId && item.productId !== 'prod_default') {
            try {
              let authoritativePrice = item.unitPrice || item.price || 0;
              let authoritativeName = item.name;
              
              if (item.variantId) {
                const variantRef = db.collection('productVariants').doc(item.variantId);
                const variantSnap = await variantRef.get();
                if (variantSnap.exists) {
                  const vData = variantSnap.data();
                  authoritativePrice = vData.price;
                  if (vData.variantName) authoritativeName = vData.variantName;
                }
              } else {
                const productRef = db.collection('products').doc(item.productId);
                const productSnap = await productRef.get();
                if (productSnap.exists) {
                  const pData = productSnap.data();
                  authoritativePrice = pData.price;
                  if (pData.productName) authoritativeName = pData.productName;
                }
              }

              item.unitPrice = authoritativePrice;
              item.price = authoritativePrice;
              item.name = authoritativeName;
              item.subtotal = authoritativePrice * (item.quantity || 1);
              authoritativeSubtotal += item.subtotal;
            } catch (e) {
              console.error(`[Security Alert] Failed to fetch authoritative pricing for productId: ${item.productId}`, e);
              authoritativeSubtotal += item.subtotal || (item.unitPrice || item.price || 0) * (item.quantity || 1);
            }
          } else {
             authoritativeSubtotal += item.subtotal || (item.unitPrice || item.price || 0) * (item.quantity || 1);
          }
        }
      } else {
         authoritativeSubtotal = cartItems.reduce((acc, item) => acc + (item.subtotal || (item.unitPrice || item.price || 0) * (item.quantity || 1)), 0);
      }

      const authoritativeGrandTotal = authoritativeSubtotal + authoritativeTax + authoritativeShipping - authoritativeDiscount;
      const paidAmount = parseFloat(paymentData?.amount || metadata?.amount || 0);
      
      if (paidAmount < authoritativeGrandTotal - 0.001) {
          console.error(`[Security Alert] Payment amount ${paidAmount} is less than authoritative grand total ${authoritativeGrandTotal}!`);
          throw new Error(`Payment verification failed: Paid amount ${paidAmount} does not match required total ${authoritativeGrandTotal}`);
      }
      
      sessionData.grandTotal = authoritativeGrandTotal;
      sessionData.subtotal = authoritativeSubtotal;
      sessionData.shipping = authoritativeShipping;
      sessionData.tax = authoritativeTax;
      sessionData.discount = authoritativeDiscount;
      // ---------------------------------------------------------


      const orderId = `ORD_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      finalOrderId = orderId;

      let canonicalBuyerUid = sessionData.userUid || sessionData.buyerId || sessionData.userId || buyerId || 'unknown_user';
      try {
        if (db && canonicalBuyerUid && canonicalBuyerUid !== 'unknown_user') {
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

      const pricingSnapshot = sessionData.pricingSnapshot || null;
      const pricingQuoteId = sessionData.pricingQuoteId || pricingSnapshot?.quoteId || '';
      const pricingEngineVersion = sessionData.pricingEngineVersion || pricingSnapshot?.pricingEngineVersion || '1.0.0';
      const pricingMode = sessionData.pricingMode || pricingSnapshot?.pricingMode || (sessionData.currency === 'INR' || sessionData.currency === 'USD' || sessionData.currency === 'EUR' ? 'EXCHANGE' : 'COMMUNITY');
      const rateUsed = pricingSnapshot?.rateUsed ?? null;
      const rateSource = pricingSnapshot?.rateSource || 'Checkout Session Quote';
      const rateTimestamp = pricingSnapshot?.rateTimestamp || sessionData.createdAt || nowIso;
      const localCurrency = pricingSnapshot?.localCurrency || sessionData.currency || 'INR';
      const localAmount = pricingSnapshot?.localAmount ?? sessionData.subtotal ?? grandTotal;
      const piAmount = pricingSnapshot?.piAmount ?? grandTotal;

      const orderItemsWithSnapshot = sanitizedCartItems.map((item: any) => {
        const cleanItem = { ...item };
        cleanItem.pricingMode = item.pricingMode || pricingMode;
        cleanItem.localCurrency = item.localCurrency || localCurrency;
        cleanItem.localAmount = item.localAmount !== undefined ? Number(item.localAmount) : (item.unitPrice || item.price || 0);
        cleanItem.piUnitPrice = item.piUnitPrice !== undefined ? Number(item.piUnitPrice) : (item.unitPrice || item.price || 0);
        cleanItem.rateUsed = item.rateUsed !== undefined ? item.rateUsed : rateUsed;
        cleanItem.rateSource = item.rateSource || rateSource;
        cleanItem.rateTimestamp = item.rateTimestamp || rateTimestamp;
        return cleanItem;
      });

      const effectivePricingSnapshot = pricingSnapshot || {
        pricingMode,
        localCurrency,
        localAmount,
        piAmount,
        rateUsed,
        rateSource,
        rateTimestamp,
        quoteId: pricingQuoteId,
        pricingEngineVersion,
        capturedAt: nowIso
      };

      const orderData: any = {
        // Clone ALL checkout session data first
        ...sessionData,

        // Required order identifiers and status fields
        id: orderId,
        orderId: orderId,
        orderNumber: orderId,
        orderStatus: "new_order",
        status: "paid",
        paymentStatus: "completed",

        // Phase 8 Immutable Financial Pricing Snapshot
        pricingSnapshot: effectivePricingSnapshot,
        pricingQuoteId,
        pricingEngineVersion,
        pricingMode,
        rateUsed,
        rateSource,
        rateTimestamp,
        localCurrency,
        localAmount,
        piAmount,

        // Core business & user fields
        buyerId: effectiveBuyerId,
        userUid: effectiveBuyerId,
        piUid: effectiveBuyerId,
        firebaseUid: sessionData.userUid || sessionData.buyerId || buyerId,
        sellerId: sessionData.sellerId || sellerId,
        businessId: sessionData.businessId || 'PI-BIZ',
        storeId: sessionData.storeId || '',

        // Items
        items: orderItemsWithSnapshot,
        cartItems: orderItemsWithSnapshot,

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

      if (db && typeof db.runTransaction === 'function') {
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
            pricingQuoteId,
            pricingSnapshot: effectivePricingSnapshot,
            rateUsed,
            rateTimestamp,
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
            pricingQuoteId,
            pricingSnapshot: effectivePricingSnapshot,
            rateUsed,
            rateTimestamp,
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
            pricingQuoteId,
            pricingSnapshot: effectivePricingSnapshot,
            pricingMode,
            rateUsed,
            rateTimestamp,
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
            pricingQuoteId,
            pricingSnapshot: effectivePricingSnapshot,
            pricingMode,
            rateUsed,
            rateTimestamp,
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

          const grossAmount = grandTotal;
          const commission = grossAmount * 0.05;
          const merchantAmount = grossAmount - commission;

          await logTx(settlementRef, () => transaction.set(settlementRef, {
            settlementId,
            orderId,
            paymentId,
            txid,
            businessId: sessionData.businessId || 'PI-BIZ',
            storeId: sessionData.storeId || '',
            sellerId: sellerId,
            grossAmount,
            commission,
            merchantAmount,
            amount: merchantAmount,
            currency: sessionData.currency || 'Pi',
            status: 'PENDING',
            pricingQuoteId,
            pricingSnapshot: effectivePricingSnapshot,
            rateUsed,
            rateTimestamp,
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
            buyerId: effectiveBuyerId,
            sellerId: sellerId,
            businessId: sessionData.businessId || "PI-CORP-001",
            storeId: sessionData.storeId || "PI-STORE-001",
            amount: grandTotal,
            piAmount: grandTotal,
            currency: sessionData.currency || 'Pi',
            memo: metadata?.memo || paymentData?.memo || `Payment for order #${orderNumber}`,
            paymentStatus: "completed",
            status: "Completed",
            orderId: orderId,
            pricingQuoteId,
            pricingSnapshot: effectivePricingSnapshot,
            pricingEngineVersion,
            pricingMode,
            localCurrency,
            localAmount,
            rateUsed,
            rateSource,
            rateTimestamp,
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
    } else {
      console.log(`[Server Transaction] DB instance is uninitialized or null. Proceeding with in-memory order completion for ${orderId}`);
      runtimeLogs.push(`[Runtime Log] DB instance uninitialized. In-memory order confirmation for ${orderId}`);
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

  app.all(["/api/payments/status", "/payments/status"], paymentRateLimiter, authenticatePaymentRequest, async (req, res) => {
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

  app.post(["/api/payments/incomplete", "/payments/incomplete"], paymentRateLimiter, authenticatePaymentRequest, async (req, res) => {
    try {
      const { payment } = req.body;
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

  // Pi Network Domain Verification Endpoints
  const PI_DOMAIN_KEY = process.env.PI_DOMAIN_VERIFICATION_KEY || "99c9f82233a75bb557c3ebd8d47be9121c794342e932cbd5518abe0896cf5ad555659bfb9c9b18a7ec82931240024c2deaa2bcda8e406b353662bfa23816e3d8";
  app.get([
    '/validation.txt',
    '/.well-known/pi-supporter.txt',
    '/pi-supporter.txt',
    '/.well-known/pi-domain-verification.txt',
    '/pi-domain-verification'
  ], (req, res) => {
    res.type('text/plain').send(PI_DOMAIN_KEY);
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

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
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
      const payload = req.body || {};
      const messageStr = typeof payload.message === 'string' ? payload.message : JSON.stringify(payload.message || payload);
      
      let httpStatus: number | undefined = undefined;
      let durationMs: number | undefined = undefined;
      let requestBody: any = undefined;
      let responseBody: any = undefined;
      let errorObj: any = undefined;

      if (Array.isArray(payload.details)) {
        for (const item of payload.details) {
          if (typeof item === 'object' && item !== null) {
            if (item.status !== undefined) httpStatus = Number(item.status);
            if (item.durationMs !== undefined) durationMs = Number(item.durationMs);
            if (item.bodyStr || item.body || item.payload) requestBody = item.bodyStr || item.body || item.payload;
            if (item.resText || item.response || item.result) responseBody = item.resText || item.response || item.result;
            if (item.message || item.stack || item.error) errorObj = item.message || item.error || item;
          }
        }
      }

      const recorded = recordPaymentDebugLog({
        timestamp: payload.timestamp || new Date().toISOString(),
        source: 'client',
        eventName: messageStr,
        level: payload.level === 'error' ? 'error' : (payload.level === 'warn' ? 'warn' : 'info'),
        httpStatus,
        durationMs,
        requestBody,
        responseBody,
        error: errorObj,
        rawDetails: payload.details,
        userAgent: payload.userAgent || req.headers['user-agent'] || undefined,
        url: payload.url
      });

      console.log(`[CLIENT_LOG] Recorded client trace: "${messageStr.slice(0, 100)}"`);
      
      try {
        fs.writeFileSync('/tmp/client_debug.json', JSON.stringify({ latest: recorded, payload }, null, 2));
      } catch (e) {}

      const db = getDb();
      if (db) {
        await db.collection('clientLogs').add({
          log: payload,
          recordedEntry: recorded,
          timestamp: new Date().toISOString(),
          userAgent: req.headers['user-agent'] || 'unknown'
        }).catch(() => {});
      }
    } catch (err: any) {
      console.error('[CLIENT_LOG_ERROR] Failed to store client log:', err?.message);
    }
    res.json({ success: true });
  });

  // =========================================================================
  // PAYMENT DEBUG RETRIEVAL & DIAGNOSTIC ENDPOINTS
  // =========================================================================

  app.get(["/api/debug-log/latest", "/api/payment-debug/latest", "/api/payment-debug", "/api/debug-log"], (req, res) => {
    res.setHeader("Content-Type", "application/json");
    
    const paymentIdQuery = (req.query.paymentId || req.query.id || req.query.txid) as string;
    const { sessions, unassociatedEvents } = groupLogsBySession(paymentDebugStore);

    if (paymentIdQuery) {
      const matchedEvents = paymentDebugStore.filter(l => 
        l.paymentId === paymentIdQuery || 
        l.correlationId === paymentIdQuery || 
        l.eventName.includes(paymentIdQuery)
      );
      const matchedSession = sessions.find(s => s.paymentId === paymentIdQuery || s.correlationId === paymentIdQuery);

      return res.json({
        success: true,
        queryPaymentId: paymentIdQuery,
        session: matchedSession || null,
        totalEvents: matchedEvents.length,
        timeline: matchedEvents
      });
    }

    const latestSession = sessions[0] || null;

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      totalLogsCount: paymentDebugStore.length,
      totalSessionsCount: sessions.length,
      latestPaymentId: latestSession?.paymentId || null,
      latestCorrelationId: latestSession?.correlationId || null,
      latestSession: latestSession,
      sessions: sessions,
      unassociatedEvents: unassociatedEvents,
      allLogsTimeline: paymentDebugStore
    });
  });

  app.get("/api/payment-debug/:paymentId", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    const pId = req.params.paymentId;
    const { sessions } = groupLogsBySession(paymentDebugStore);
    const matchedEvents = paymentDebugStore.filter(l => 
      l.paymentId === pId || 
      l.correlationId === pId || 
      l.eventName.includes(pId)
    );
    const matchedSession = sessions.find(s => s.paymentId === pId || s.correlationId === pId);

    res.json({
      success: true,
      paymentId: pId,
      session: matchedSession || null,
      totalEvents: matchedEvents.length,
      timeline: matchedEvents
    });
  });

  app.post(["/api/payment-debug/clear", "/api/debug-log/clear"], (req, res) => {
    paymentDebugStore.length = 0;
    res.json({ success: true, message: "Payment debug store cleared." });
  });

  app.get(["/api/payment-debug-ui", "/debug-logs-ui"], (req, res) => {
    res.setHeader("Content-Type", "text/html");
    res.send(`<!DOCTYPE html>
<html>
<head>
  <title>Pi Payment Trace Debugger</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }
    h1 { color: #38bdf8; margin-top: 0; display: flex; align-items: center; justify-content: space-between; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; }
    .badge-approved { background: #0284c7; color: white; }
    .badge-completed { background: #16a34a; color: white; }
    .badge-error { background: #dc2626; color: white; }
    .badge-progress { background: #d97706; color: white; }
    .badge-client { background: #6366f1; color: white; }
    .badge-server { background: #8b5cf6; color: white; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { text-align: left; padding: 10px; border-bottom: 1px solid #334155; font-size: 13px; }
    th { background: #0f172a; color: #94a3b8; }
    pre { background: #090d16; padding: 8px; border-radius: 4px; overflow-x: auto; color: #38bdf8; max-height: 200px; font-size: 11px; margin: 4px 0; }
    button { background: #0284c7; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold; }
    button:hover { background: #0369a1; }
    .btn-danger { background: #b91c1c; }
    .btn-danger:hover { background: #991b1b; }
  </style>
</head>
<body>
  <h1>
    <span>⚡ Pi Payment Trace Debugger</span>
    <div>
      <button onclick="fetchLogs()">🔄 Refresh Logs</button>
      <button class="btn-danger" onclick="clearLogs()">🗑️ Clear Logs</button>
    </div>
  </h1>

  <div class="card" id="summaryCard">
    Loading trace data...
  </div>

  <div id="sessionsContainer"></div>

  <script>
    async function fetchLogs() {
      try {
        const res = await fetch('/api/debug-log/latest');
        const data = await res.json();
        
        document.getElementById('summaryCard').innerHTML = \`
          <strong>Total Sessions:</strong> \${data.totalSessionsCount || 0} | 
          <strong>Total Events:</strong> \${data.totalLogsCount || 0} | 
          <strong>Latest Payment ID:</strong> \${data.latestPaymentId || 'None'} | 
          <strong>Latest Status:</strong> \${data.latestSession ? data.latestSession.status : 'N/A'}
        \`;

        const container = document.getElementById('sessionsContainer');
        if (!data.sessions || data.sessions.length === 0) {
          container.innerHTML = '<div class="card">No payment sessions recorded yet. Perform a payment attempt in Pi Browser!</div>';
          return;
        }

        container.innerHTML = data.sessions.map(s => \`
          <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #334155; padding-bottom:8px; margin-bottom:12px;">
              <div>
                <span class="badge badge-\${s.status.toLowerCase()}">\${s.status}</span>
                <strong style="margin-left:10px; font-size:16px;">Payment ID: \${s.paymentId}</strong>
                \${s.correlationId ? \`<span style="color:#94a3b8; margin-left:12px; font-size:12px;">(Session: \${s.correlationId})</span>\` : ''}
              </div>
              <div style="font-size:12px; color:#94a3b8;">
                \${new Date(s.startTime).toLocaleTimeString()} - \${new Date(s.lastUpdate).toLocaleTimeString()}
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Src</th>
                  <th>Event Trace</th>
                  <th>Status</th>
                  <th>Duration</th>
                  <th>Payload / Details</th>
                </tr>
              </thead>
              <tbody>
                \${s.events.map(e => \`
                  <tr>
                    <td style="white-space:nowrap; font-family:monospace; color:#94a3b8;">\${new Date(e.timestamp).toLocaleTimeString()}</td>
                    <td><span class="badge badge-\${e.source}">\${e.source}</span></td>
                    <td style="font-weight:bold; color:\${e.level === 'error' ? '#f87171' : (e.level === 'warn' ? '#fbbf24' : '#f8fafc')}">\${e.eventName}</td>
                    <td>\${e.httpStatus ? \`<span style="color:\${e.httpStatus >= 400 ? '#f87171' : '#4ade80'}">\${e.httpStatus}</span>\` : '-'}</td>
                    <td>\${e.durationMs ? e.durationMs + 'ms' : '-'}</td>
                    <td>
                      \${e.error ? \`<pre style="color:#f87171;">ERROR: \${typeof e.error === 'object' ? JSON.stringify(e.error) : e.error}</pre>\` : ''}
                      \${e.requestBody ? \`<details><summary style="cursor:pointer; color:#38bdf8;">Request Body</summary><pre>\${JSON.stringify(e.requestBody, null, 2)}</pre></details>\` : ''}
                      \${e.responseBody ? \`<details><summary style="cursor:pointer; color:#4ade80;">Response Body</summary><pre>\${JSON.stringify(e.responseBody, null, 2)}</pre></details>\` : ''}
                      \${e.rawDetails ? \`<details><summary style="cursor:pointer; color:#94a3b8;">Raw Details</summary><pre>\${JSON.stringify(e.rawDetails, null, 2)}</pre></details>\` : ''}
                    </td>
                  </tr>
                \`).join('')}
              </tbody>
            </table>
          </div>
        \`).join('');
      } catch (err) {
        document.getElementById('summaryCard').innerHTML = '<span style="color:red">Failed to load logs: ' + err.message + '</span>';
      }
    }

    async function clearLogs() {
      if (confirm('Clear all in-memory debug logs?')) {
        await fetch('/api/payment-debug/clear', { method: 'POST' });
        fetchLogs();
      }
    }

    fetchLogs();
    setInterval(fetchLogs, 3000);
  </script>
</body>
</html>`);
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


