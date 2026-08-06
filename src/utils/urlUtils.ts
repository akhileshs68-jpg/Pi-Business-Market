/**
 * Centralized API URL resolver for Web2 browsers and Mobile Pi Browser.
 * Prevents requests from hitting Pi Network CDN (app-cdn.minepi.com) which causes 404 errors.
 */

export function getApiBaseUrl(): string {
  let rawUrl = '';

  // 1. Check explicit environment variables
  const envUrl = (import.meta as any).env?.VITE_APP_URL || 
                 (import.meta as any).env?.VITE_BACKEND_URL || 
                 (import.meta as any).env?.VITE_SERVER_URL ||
                 (import.meta as any).env?.APP_URL;

  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '' && !envUrl.includes('MY_APP_URL')) {
    const trimmed = envUrl.trim().replace(/\/+$/, '');
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      rawUrl = trimmed;
    }
  }

  // 2. Check Vercel automatic deployment URL
  if (!rawUrl) {
    const vercelUrl = (import.meta as any).env?.VITE_VERCEL_URL;
    if (vercelUrl && typeof vercelUrl === 'string' && vercelUrl.trim() !== '') {
      rawUrl = vercelUrl.startsWith('http') ? vercelUrl : `https://${vercelUrl}`;
    }
  }

  // 3. Check window.__APP_URL__ injected dynamically by server.ts
  if (!rawUrl && typeof window !== 'undefined' && (window as any).__APP_URL__) {
    const injected = (window as any).__APP_URL__;
    if (typeof injected === 'string' && injected.startsWith('http') && !injected.includes('minepi.com')) {
      rawUrl = injected;
      try {
        localStorage.setItem('app_backend_url', rawUrl);
      } catch (e) {}
    }
  }

  // 3b. Fallback to cached app_backend_url in localStorage
  if (!rawUrl && typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('app_backend_url');
      if (cached && cached.startsWith('http') && !cached.includes('minepi.com')) {
        rawUrl = cached;
      }
    } catch (e) {}
  }

  // 3c. Check URL search parameters (e.g. ?backendUrl= or ?appUrl=)
  if (!rawUrl && typeof window !== 'undefined' && window.location && window.location.search) {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlParam = params.get('backendUrl') || params.get('appUrl') || params.get('origin');
      if (urlParam && urlParam.startsWith('http') && !urlParam.includes('minepi.com')) {
        rawUrl = urlParam;
        try { localStorage.setItem('app_backend_url', rawUrl); } catch (e) {}
      }
    } catch (e) {}
  }

  // 4. Inspect window.location
  if (!rawUrl && typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    if (origin && origin !== 'null' && !origin.startsWith('file:')) {
      const isPiCdnDomain = origin.includes('app-cdn.minepi.com') || 
                            origin.includes('sandbox.minepi.com') ||
                            origin.endsWith('.pi');
      // If we are on standard host (Cloud Run, Vercel, localhost), use origin and save to cache
      if (!isPiCdnDomain) {
        rawUrl = origin;
        try { localStorage.setItem('app_backend_url', rawUrl); } catch (e) {}
      }
    }

    // 5. If running inside Pi Browser CDN iframe, check ancestor origins or referrer
    if (!rawUrl && window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0) {
      for (let i = 0; i < window.location.ancestorOrigins.length; i++) {
        const anc = window.location.ancestorOrigins[i];
        if (anc && anc.startsWith('http') && !anc.includes('minepi.com') && !anc.endsWith('.pi')) {
          rawUrl = anc;
          try { localStorage.setItem('app_backend_url', rawUrl); } catch (e) {}
          break;
        }
      }
    }

    if (!rawUrl && document.referrer) {
      try {
        const refUrl = new URL(document.referrer);
        if (refUrl.origin && !refUrl.hostname.includes('minepi.com') && !refUrl.hostname.endsWith('.pi')) {
          rawUrl = refUrl.origin;
          try { localStorage.setItem('app_backend_url', rawUrl); } catch (e) {}
        }
      } catch (e) {}
    }
  }

  // 6. Last resort fallback to window.location.origin if it is NOT a Pi CDN domain
  if (!rawUrl && typeof window !== 'undefined' && window.location && window.location.origin) {
    const origin = window.location.origin;
    if (!origin.includes('minepi.com') && !origin.endsWith('.pi')) {
      rawUrl = origin;
    }
  }

  if (!rawUrl) return '';

  let formatted = rawUrl.trim().replace(/\/+$/, '');
  if (formatted.startsWith('http://') && !formatted.includes('localhost') && !formatted.includes('127.0.0.1')) {
    formatted = formatted.replace(/^http:\/\//, 'https://');
  }

  return formatted;
}

export function getAbsoluteUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
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

  return cleanPath;
}
