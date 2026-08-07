/**
 * Centralized API URL resolver for Web2 browsers and Mobile Pi Browser.
 * Prevents requests from hitting Pi Network CDN (app-cdn.minepi.com) which causes 404 errors.
 */

const PRODUCTION_VERCEL_URL = 'https://pi-business-market.vercel.app';

export function getApiBaseUrl(): string {
  let rawUrl = '';

  // 1. Check explicit environment variables for Vercel or Custom URLs
  const envUrl = (import.meta as any).env?.VITE_VERCEL_URL || 
                 (import.meta as any).env?.VITE_APP_URL || 
                 (import.meta as any).env?.VITE_BACKEND_URL || 
                 (import.meta as any).env?.VITE_SERVER_URL ||
                 (import.meta as any).env?.APP_URL;

  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '' && !envUrl.includes('MY_APP_URL')) {
    const trimmed = envUrl.trim().replace(/\/+$/, '');
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      rawUrl = trimmed;
    } else {
      rawUrl = `https://${trimmed}`;
    }
  }

  // 2. Check window.__APP_URL__ injected dynamically by server.ts
  if (!rawUrl && typeof window !== 'undefined' && (window as any).__APP_URL__) {
    const injected = (window as any).__APP_URL__;
    if (typeof injected === 'string' && injected.startsWith('http') && !injected.includes('minepi.com')) {
      rawUrl = injected;
    }
  }

  // 3. Check window.location if running in a real non-Pi CDN environment
  if (!rawUrl && typeof window !== 'undefined' && window.location && window.location.origin) {
    const origin = window.location.origin;
    const isPiCdnDomain = origin.includes('app-cdn.minepi.com') || 
                          origin.includes('sandbox.minepi.com') ||
                          origin.endsWith('.pi');
    
    if (!isPiCdnDomain && !origin.startsWith('file:')) {
      rawUrl = origin;
    }
  }

  // 4. Default fallback: Force production Vercel backend URL
  if (!rawUrl) {
    rawUrl = PRODUCTION_VERCEL_URL;
  }

  let formatted = rawUrl.trim().replace(/\/+$/, '');
  if (formatted.startsWith('http://') && !formatted.includes('localhost') && !formatted.includes('127.0.0.1')) {
    formatted = formatted.replace(/^http:\/\//, 'https://');
  }

  return formatted;
}

export function getAbsoluteUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // If this is a payment webhook/callback, ALWAYS force the production Vercel backend URL
  const isPaymentCallback = cleanPath.includes('/api/payments/approve') || 
                            cleanPath.includes('/api/payments/complete') || 
                            cleanPath.includes('/api/payments/incomplete');
                            
  if (isPaymentCallback) {
    return `${PRODUCTION_VERCEL_URL}${cleanPath}`;
  }

  let baseUrl = getApiBaseUrl();

  // If baseUrl is empty or missing, try window.location.origin as fallback
  if (!baseUrl && typeof window !== 'undefined' && window.location && window.location.origin) {
    baseUrl = window.location.origin;
  }

  if (baseUrl) {
    let formattedBase = baseUrl.trim().replace(/\/+$/, '');
    if (formattedBase.startsWith('http://') && !formattedBase.includes('localhost') && !formattedBase.includes('127.0.0.1')) {
      formattedBase = formattedBase.replace(/^http:\/\//, 'https://');
    }
    return `${formattedBase}${cleanPath}`;
  }
  
  // Ultimate fallback if window.location exists
  if (typeof window !== 'undefined' && window.location) {
    const fallbackOrigin = `${window.location.protocol}//${window.location.host}`;
    return `${fallbackOrigin}${cleanPath}`;
  }

  return `${PRODUCTION_VERCEL_URL}${cleanPath}`;
}

