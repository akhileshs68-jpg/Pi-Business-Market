/**
 * Centralized API URL resolver for Web2 browsers and Mobile Pi Browser.
 * Prevents requests from hitting Pi Network CDN (app-cdn.minepi.com) which causes 404 errors.
 */

export function getApiBaseUrl(): string {
  // 1. Check explicit environment variables
  const envUrl = (import.meta as any).env?.VITE_APP_URL || 
                 (import.meta as any).env?.VITE_BACKEND_URL || 
                 (import.meta as any).env?.VITE_SERVER_URL ||
                 (import.meta as any).env?.APP_URL;

  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '' && !envUrl.includes('MY_APP_URL')) {
    const trimmed = envUrl.trim().replace(/\/+$/, '');
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
  }

  // 2. Check Vercel automatic deployment URL
  const vercelUrl = (import.meta as any).env?.VITE_VERCEL_URL;
  if (vercelUrl && typeof vercelUrl === 'string' && vercelUrl.trim() !== '') {
    const formatted = vercelUrl.startsWith('http') ? vercelUrl : `https://${vercelUrl}`;
    return formatted.replace(/\/+$/, '');
  }

  // 3. Check window.__APP_URL__ injected dynamically by server.ts
  if (typeof window !== 'undefined' && (window as any).__APP_URL__) {
    const injected = (window as any).__APP_URL__;
    if (typeof injected === 'string' && injected.startsWith('http') && !injected.includes('minepi.com')) {
      return injected.replace(/\/+$/, '');
    }
  }

  // 4. Inspect window.location
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    if (origin && origin !== 'null' && !origin.startsWith('file:')) {
      const isPiCdnDomain = origin.includes('app-cdn.minepi.com') || 
                            origin.includes('sandbox.minepi.com') ||
                            origin.endsWith('.pi');
      // If we are on standard host (Cloud Run, Vercel, localhost), use origin
      if (!isPiCdnDomain) {
        return origin.replace(/\/+$/, '');
      }
    }

    // 5. If running inside Pi Browser CDN iframe, check ancestor origins or referrer
    if (window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0) {
      for (let i = 0; i < window.location.ancestorOrigins.length; i++) {
        const anc = window.location.ancestorOrigins[i];
        if (anc && anc.startsWith('http') && !anc.includes('minepi.com') && !anc.endsWith('.pi')) {
          return anc.replace(/\/+$/, '');
        }
      }
    }

    if (document.referrer) {
      try {
        const refUrl = new URL(document.referrer);
        if (refUrl.origin && !refUrl.hostname.includes('minepi.com') && !refUrl.hostname.endsWith('.pi')) {
          return refUrl.origin.replace(/\/+$/, '');
        }
      } catch (e) {}
    }
  }

  // 6. Last resort fallback to window.location.origin if it is NOT a Pi CDN domain
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    const origin = window.location.origin;
    if (!origin.includes('minepi.com') && !origin.endsWith('.pi')) {
      return origin.replace(/\/+$/, '');
    }
  }

  return '';
}

export function getAbsoluteUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const baseUrl = getApiBaseUrl();
  
  if (baseUrl) {
    return `${baseUrl}${cleanPath}`;
  }
  return cleanPath;
}
