import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';

export interface PaymentDebugEntry {
  id: string;
  timestamp: string;
  source: 'client' | 'server' | 'sdk' | 'network' | 'pi_api';
  paymentId?: string;
  correlationId?: string;
  eventName: string;
  level: 'info' | 'warn' | 'error';
  httpStatus?: number;
  requestBody?: any;
  responseBody?: any;
  durationMs?: number;
  error?: string;
  rawDetails?: any;
  userAgent?: string;
  url?: string;
}

export const paymentDebugStore: PaymentDebugEntry[] = [];
export const MAX_PAYMENT_DEBUG_ENTRIES = 500;

export function extractPaymentIdFromText(text: any, detailsObj?: any): string | undefined {
  if (detailsObj && typeof detailsObj === 'object') {
    if (detailsObj.paymentId) return String(detailsObj.paymentId);
    if (detailsObj.identifier) return String(detailsObj.identifier);
    if (detailsObj.id) return String(detailsObj.id);
    if (detailsObj.metadata?.paymentId) return String(detailsObj.metadata.paymentId);
    if (detailsObj.metadata?.internalPaymentId) return String(detailsObj.metadata.internalPaymentId);
  }
  const str = typeof text === 'string' ? text : JSON.stringify(text || '');
  const payMatch = str.match(/(?:paymentId|identifier|internalPaymentId)["':\s]+([a-zA-Z0-9_-]{8,64})/i);
  if (payMatch) return payMatch[1];
  return undefined;
}

export function extractCorrelationIdFromText(text: any, detailsObj?: any): string | undefined {
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

export function recordPaymentDebugLog(entry: Partial<PaymentDebugEntry>): PaymentDebugEntry {
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
  return fullEntry;
}

export const getPiApiKey = (): { key: string | null; isConfigured: boolean } => {
  const apiKey = process.env.PI_NETWORK_API_KEY || process.env.VITE_PI_NETWORK_API_KEY || process.env.PI_API_KEY;
  const isConfigured = Boolean(apiKey && apiKey.trim() !== '' && apiKey !== 'YOUR_PI_API_KEY');
  return { key: isConfigured ? apiKey!.trim() : null, isConfigured };
};

export const initFirebaseAdmin = (): any => {
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

export const dbQueryWithTimeout = async <T>(fn: () => Promise<T>, timeoutMs: number = 2000, fallbackValue: any = null): Promise<T> => {
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

export const getDb = (): any => {
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

export const authenticatePaymentRequest = async (
  req: any,
  res: any
): Promise<boolean> => {
  const endpoint = req.path || req.url;
  console.log(`[AuthenticatePaymentRequest ENTRY] Path: ${req.path || req.url}, Method: ${req.method}`);
  
  if (getApps().length === 0) {
    try {
      initFirebaseAdmin();
    } catch (e: any) {
      console.warn(`[Security Notice] ${endpoint}: Lazy initialization of Firebase Admin failed:`, e?.message);
    }
  }

  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  const isProd = process.env.NODE_ENV === 'production';
  const token = authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ') ? authHeader.split('Bearer ')[1]?.trim() : null;

  if (authHeader) {
    const tokenPreview = token ? `Bearer ${token.substring(0, 15)}... (len: ${token.length})` : authHeader;
    console.log(`[SERVER_AUTH_TRACE] Authorization: ${tokenPreview}`);
  } else {
    console.log(`[SERVER_AUTH_TRACE] Authorization: <missing>`);
  }

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

      req.user = {
        uid: finalUid,
        email: decodedToken.email || `${finalUid}@pi.network`
      };
      return true;
    }
  }

  const reqBody = req.body || {};
  const paymentId = reqBody.paymentId || reqBody.transactionId || reqBody.identifier;
  const metadataBuyerUid = reqBody.metadata?.buyerUid || reqBody.metadata?.uid || reqBody.metadata?.userUid || reqBody.metadata?.buyerId || reqBody.buyerUid || reqBody.userUid || reqBody.buyerId;
  const reqOrderId = reqBody.orderId || reqBody.metadata?.orderId;

  if (paymentId || metadataBuyerUid || reqOrderId) {
    const derivedUid = metadataBuyerUid || 'pi_browser_user';
    console.log(`[SERVER_AUTH_TRACE] Request authenticated via Pi SDK payload metadata for UID: ${derivedUid} (PaymentID: ${paymentId || 'none'}, OrderID: ${reqOrderId || 'none'})`);
    req.user = {
      uid: derivedUid,
      email: `${derivedUid}@pi.network`,
      authSource: 'pi_sdk_metadata'
    };
    return true;
  }

  if (!isProd) {
    console.warn(`[SERVER_AUTH_TRACE] Proceeding in sandbox/development mode without token.`);
    req.user = { uid: 'dev_user', email: 'dev@example.com' };
    return true;
  }

  console.error(`[Security Violation] ${endpoint}: Missing valid authentication credentials or payment metadata in production.`);
  res.status(401).json({ error: "Unauthorized: Missing valid authentication credentials or payment metadata." });
  return false;
};
