/**
 * Pi Business Market - Enterprise Error Handling Architecture
 * Classifies, formats, and sanitizes errors for client display and security logging.
 */

export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INSUFFICIENT_FUNDS'
  | 'DUPLICATE_ACTION'
  | 'PAYMENT_FAILED'
  | 'BLOCKCHAIN_RPC_ERROR'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  public code: ErrorCode;
  public userMessage: string;
  public metadata?: Record<string, any>;

  constructor(code: ErrorCode, internalMessage: string, userMessage?: string, metadata?: Record<string, any>) {
    super(internalMessage);
    this.name = 'AppError';
    this.code = code;
    this.userMessage = userMessage || this.getDefaultUserMessage(code);
    this.metadata = metadata;
  }

  private getDefaultUserMessage(code: ErrorCode): string {
    switch (code) {
      case 'UNAUTHORIZED':
        return 'Please log in to continue.';
      case 'FORBIDDEN':
        return 'You do not have permission to perform this action.';
      case 'NOT_FOUND':
        return 'The requested resource was not found.';
      case 'INSUFFICIENT_FUNDS':
        return 'Insufficient balance to complete this transaction.';
      case 'DUPLICATE_ACTION':
        return 'This action has already been completed.';
      case 'PAYMENT_FAILED':
        return 'Payment processing failed. Please try again.';
      case 'BLOCKCHAIN_RPC_ERROR':
        return 'Network connection issue. Retrying via redundant gateway...';
      case 'VALIDATION_ERROR':
        return 'Invalid input provided. Please verify your information.';
      default:
        return 'An unexpected error occurred. Please try again later.';
    }
  }
}

export function handleSystemError(err: any, category: string = 'SYSTEM'): AppError {
  if (err instanceof AppError) {
    return err;
  }

  const message = err?.message || 'Unknown system error';
  return new AppError('INTERNAL_ERROR', `${category}: ${message}`, 'An unexpected system error occurred.');
}
