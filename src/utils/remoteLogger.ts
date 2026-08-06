// Client-side Remote Logger for debugging Mobile Pi Browser payment lifecycle
// Intercepts all console calls, uncaught errors, network requests, lifecycle events, and postMessage calls

import { getAbsoluteUrl } from './urlUtils';

let isSending = false;

export function initRemoteLogger() {
  if (typeof window === 'undefined') return;

  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;
  const originalInfo = console.info;

  const sendRemoteLog = async (level: string, args: any[]) => {
    if (isSending) return;
    isSending = true;

    try {
      const formattedArgs = args.map(arg => {
        if (arg instanceof Error) {
          return {
            name: arg.name,
            message: arg.message,
            stack: arg.stack
          };
        }
        if (typeof arg === 'object' && arg !== null) {
          try {
            return JSON.parse(JSON.stringify(arg));
          } catch (e) {
            return String(arg);
          }
        }
        return String(arg);
      });

      const payload = {
        level,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        origin: window.location.origin,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
        message: formattedArgs.join(' '),
        details: formattedArgs
      };

      // Use standard relative fetch - it will resolve relative to iframe base URL
      await fetch(getAbsoluteUrl('/api/debug-log'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {});
    } catch (err) {
      // Avoid printing to intercepted console to prevent loops
    } finally {
      isSending = false;
    }
  };

  console.log = (...args: any[]) => {
    originalLog.apply(console, args);
    sendRemoteLog('info', args);
  };

  console.warn = (...args: any[]) => {
    originalWarn.apply(console, args);
    sendRemoteLog('warn', args);
  };

  console.error = (...args: any[]) => {
    originalError.apply(console, args);
    sendRemoteLog('error', args);
  };

  console.info = (...args: any[]) => {
    originalInfo.apply(console, args);
    sendRemoteLog('info', args);
  };

  // 1. INSTRUMENT GLOBAL FETCH
  const originalFetch = window.fetch;
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const targetUrl = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : input.url);
    const fetchStartTime = Date.now();

    // Skip remote logging endpoint itself to avoid infinite loops
    const isLogEndpoint = targetUrl.includes('/api/debug-log');

    if (!isLogEndpoint) {
      console.log('[DEBUG_TRACE] [fetch] IMMEDIATELY BEFORE fetch() call to:', targetUrl, {
        method: init?.method || 'GET',
        hasHeaders: !!init?.headers,
        hasBody: !!init?.body,
        referrer: document.referrer,
        origin: window.location.origin,
        href: window.location.href
      });
    }

    try {
      const response = await originalFetch.apply(window, [input, init]);
      const fetchEndTime = Date.now();

      if (!isLogEndpoint) {
        console.log('[DEBUG_TRACE] [fetch] IMMEDIATELY AFTER fetch() response received from:', targetUrl, {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          resUrl: response.url,
          durationMs: fetchEndTime - fetchStartTime,
          referrer: document.referrer,
          origin: window.location.origin,
          href: window.location.href
        });
      }
      return response;
    } catch (fetchErr) {
      const fetchErrTime = Date.now();
      if (!isLogEndpoint) {
        console.error('[DEBUG_TRACE] [fetch] IMMEDIATELY AFTER fetch() REJECTED with error for:', targetUrl, {
          error: fetchErr instanceof Error ? fetchErr.message : String(fetchErr),
          durationMs: fetchErrTime - fetchStartTime,
          referrer: document.referrer,
          origin: window.location.origin,
          href: window.location.href
        });
      }
      throw fetchErr;
    }
  };

  // 2. INSTRUMENT WINDOW.POSTMESSAGE
  const originalPostMessage = window.postMessage;
  window.postMessage = function (message: any, targetOriginOrOptions?: any, transfer?: any): void {
    console.log('[DEBUG_TRACE] [window.postMessage] IMMEDIATELY BEFORE window.postMessage() call', {
      message: typeof message === 'object' ? JSON.stringify(message) : String(message),
      targetOrigin: typeof targetOriginOrOptions === 'string' ? targetOriginOrOptions : 'options_object',
      referrer: document.referrer,
      origin: window.location.origin,
      href: window.location.href
    });

    try {
      (originalPostMessage as Function).apply(window, arguments);
      console.log('[DEBUG_TRACE] [window.postMessage] IMMEDIATELY AFTER window.postMessage() execution completed');
    } catch (postErr) {
      console.error('[DEBUG_TRACE] [window.postMessage] IMMEDIATELY AFTER window.postMessage() threw error:', postErr);
      throw postErr;
    }
  };

  // 3. INSTRUMENT WINDOW LIFECYCLE LISTENERS
  window.addEventListener('message', (event) => {
    console.log('[DEBUG_TRACE] [window.addEventListener("message")] EVENT RECEIVED:', {
      origin: event.origin,
      source: event.source ? (event.source === window ? 'self_window' : 'external_window/iframe') : 'null',
      data: typeof event.data === 'object' ? JSON.stringify(event.data) : String(event.data),
      referrer: document.referrer,
      locationOrigin: window.location.origin,
      locationHref: window.location.href
    });
  });

  window.addEventListener('visibilitychange', () => {
    console.log('[DEBUG_TRACE] [window.addEventListener("visibilitychange")] EVENT TRIGGERED:', {
      visibilityState: document.visibilityState,
      hidden: document.hidden,
      referrer: document.referrer,
      locationOrigin: window.location.origin,
      locationHref: window.location.href
    });
  });

  window.addEventListener('pagehide', (event) => {
    console.log('[DEBUG_TRACE] [window.addEventListener("pagehide")] EVENT TRIGGERED:', {
      persisted: event.persisted,
      referrer: document.referrer,
      locationOrigin: window.location.origin,
      locationHref: window.location.href
    });
  });

  window.addEventListener('beforeunload', (event) => {
    console.log('[DEBUG_TRACE] [window.addEventListener("beforeunload")] EVENT TRIGGERED:', {
      type: event.type,
      referrer: document.referrer,
      locationOrigin: window.location.origin,
      locationHref: window.location.href
    });
  });

  window.addEventListener('error', (event) => {
    sendRemoteLog('fatal_uncaught_error', [
      {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        referrer: document.referrer,
        origin: window.location.origin,
        href: window.location.href
      }
    ]);
  });

  window.addEventListener('unhandledrejection', (event) => {
    sendRemoteLog('fatal_unhandled_promise', [
      {
        reason: event.reason,
        referrer: document.referrer,
        origin: window.location.origin,
        href: window.location.href
      }
    ]);
  });

  console.log('[RemoteLogger] Client-side remote logger & lifecycle instrumentation initialized.', {
    documentReferrer: document.referrer,
    windowLocationOrigin: window.location.origin,
    windowLocationHref: window.location.href,
    typeofWindowPi: typeof (window as any).Pi,
    typeofPiCreatePayment: typeof (window as any).Pi?.createPayment,
    typeofPiCompletePayment: typeof (window as any).Pi?.completePayment
  });
}

