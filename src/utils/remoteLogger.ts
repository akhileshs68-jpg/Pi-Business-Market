// Client-side Remote Logger for debugging Mobile Pi Browser payment lifecycle
// Intercepts all console calls and uncaught errors, forwarding them to the server-side log sink

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
        userAgent: navigator.userAgent,
        message: formattedArgs.join(' '),
        details: formattedArgs
      };

      // Use standard relative fetch - it will resolve relative to iframe base URL
      await fetch('/api/debug-log', {
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

  window.addEventListener('error', (event) => {
    sendRemoteLog('fatal_uncaught_error', [
      {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      }
    ]);
  });

  window.addEventListener('unhandledrejection', (event) => {
    sendRemoteLog('fatal_unhandled_promise', [
      {
        reason: event.reason
      }
    ]);
  });

  console.log('[RemoteLogger] Client-side logging initialized.');
}
