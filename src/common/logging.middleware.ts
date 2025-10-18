import { Injectable, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request & { user?: any }, _res: Response, next: NextFunction) {
    const ip = (req.ip as string) || (req.headers['x-forwarded-for'] as string) || (req.socket && req.socket.remoteAddress) || 'unknown';
    const method = req.method;
    const url = req.originalUrl || req.url;
    const userId = (req as any).user?.id || (req as any).user?.sub || undefined;

    // Log basic request info
    this.logger.debug(`${method} ${url} from ${ip}${userId ? ` - user=${userId}` : ''}`);

    // Optionally log body when enabled via env
    const logBody = (process.env.LOG_BODY ?? 'false').toLowerCase() === 'true';
    if (logBody) {
      try {
        this.logger.debug(`body: ${JSON.stringify(req.body)}`);
      } catch (e) {
        this.logger.debug('body: [unstringifiable]');
      }
    }

    next();
  }
}
