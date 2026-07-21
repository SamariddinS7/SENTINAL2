/**
 * Enterprise Structured Logger (Mocked for offline compatibility)
 */

import { AsyncLocalStorage } from 'async_hooks';

interface LogContext {
  requestId?: string;
  userId?: string;
  service?: string;
  traceId?: string;
  spanId?: string;
}

const contextStorage = new AsyncLocalStorage<LogContext>();

export function runWithContext<T>(ctx: LogContext, fn: () => T): T {
  return contextStorage.run(ctx, fn);
}

export function setContext(ctx: Partial<LogContext>): void {
  const current = contextStorage.getStore();
  if (current) Object.assign(current, ctx);
}

const formatLog = (level: string, module: string, message: string, meta: any) => {
  const ctx = contextStorage.getStore() || {};
  const timestamp = new Date().toISOString();
  const rid = ctx.requestId ? ` rid=${ctx.requestId}` : '';
  const mod = module ? `[${module}]` : '[sentinel-vms]';
  const metaStr = meta && Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
  return `${timestamp} ${level.toUpperCase()} ${mod}${rid}: ${message}${metaStr}`;
};

class SimpleLogger {
  private module: string;

  constructor(module = '') {
    this.module = module;
  }

  debug(msg: string, meta?: any) {
    if (process.env.LOG_LEVEL === 'debug' || !process.env.LOG_LEVEL) {
      console.debug(formatLog('debug', this.module, msg, meta));
    }
  }

  info(msg: string, meta?: any) {
    console.info(formatLog('info', this.module, msg, meta));
  }

  warn(msg: string, meta?: any) {
    console.warn(formatLog('warn', this.module, msg, meta));
  }

  error(msg: string, meta?: any) {
    console.error(formatLog('error', this.module, msg, meta));
  }

  child(meta: { module: string }) {
    return new SimpleLogger(meta.module);
  }
}

const logger = new SimpleLogger();

export function getLogger(module: string) {
  return new SimpleLogger(module);
}

export { logger };

import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export function requestLoggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = (req.headers['x-request-id'] as string) ?? randomUUID();
  const start = Date.now();

  res.setHeader('X-Request-ID', requestId);

  runWithContext({ requestId }, () => {
    const log = getLogger('http');

    log.debug('Incoming request', {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.on('finish', () => {
      const duration = Date.now() - start;
      const level = res.statusCode >= 500 ? 'error'
                  : res.statusCode >= 400 ? 'warn'
                  : 'info';

      log[level]('Request completed', {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs: duration,
        contentLength: res.get('content-length'),
      });
    });

    next();
  });
}

