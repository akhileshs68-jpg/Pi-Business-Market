/**
 * Pi Business Market - Enterprise Structured Logging Framework
 * Manages development, production, security audit, and blockchain transaction logs.
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'AUDIT';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  metadata?: Record<string, any>;
  userId?: string;
}

class StructuredLogger {
  private isDevelopment = process.env.NODE_ENV !== 'production';

  private log(level: LogLevel, category: string, message: string, metadata?: Record<string, any>, userId?: string) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      metadata,
      userId
    };

    if (this.isDevelopment || level === 'ERROR' || level === 'AUDIT') {
      const prefix = `[${entry.timestamp}] [${level}] [${category}]`;
      if (level === 'ERROR') {
        console.error(prefix, message, metadata || '');
      } else if (level === 'WARN') {
        console.warn(prefix, message, metadata || '');
      } else if (level === 'AUDIT') {
        console.info(`🔒 AUDIT ${prefix}`, message, metadata || '');
      } else {
        console.log(prefix, message, metadata || '');
      }
    }
  }

  public debug(category: string, message: string, metadata?: Record<string, any>) {
    this.log('DEBUG', category, message, metadata);
  }

  public info(category: string, message: string, metadata?: Record<string, any>) {
    this.log('INFO', category, message, metadata);
  }

  public warn(category: string, message: string, metadata?: Record<string, any>) {
    this.log('WARN', category, message, metadata);
  }

  public error(category: string, message: string, metadata?: Record<string, any>) {
    this.log('ERROR', category, message, metadata);
  }

  public audit(category: string, message: string, userId: string, metadata?: Record<string, any>) {
    this.log('AUDIT', category, message, metadata, userId);
  }
}

export const logger = new StructuredLogger();
