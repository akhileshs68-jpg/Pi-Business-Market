/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffFactor?: number;
}

/**
 * Executes an async function with exponential backoff retry logic.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { 
    maxAttempts = 3, 
    delayMs = 1000, 
    backoffFactor = 2 
  } = options;

  let lastError: any;
  let currentDelay = delayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (err: any) {
      lastError = err;
      
      // Don't retry if it's a known non-transient error (e.g., auth, permissions)
      if (err.code === 'permission-denied' || err.code === 'unauthenticated') {
        throw err;
      }

      if (attempt === maxAttempts) break;

      console.warn(`Attempt ${attempt} failed. Retrying in ${currentDelay}ms...`, err);
      await new Promise(resolve => setTimeout(resolve, currentDelay));
      currentDelay *= backoffFactor;
    }
  }

  throw lastError;
}
