import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import * as jwt from 'jsonwebtoken';
import { RevokedToken } from '../entities/revoked-token.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) return true;

    const req = context.switchToHttp().getRequest();
    const authHeader =
      typeof req.headers?.authorization === 'string'
        ? req.headers.authorization
        : null;
    if (!authHeader) throw new ForbiddenException('No token');
    const token = authHeader.split(' ')[1];

    // Check blacklist
    const revoked = await RevokedToken.findOne({ where: { token } });
    if (revoked) throw new ForbiddenException('Token revoked');

    try {
      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET ?? 'change-me',
      ) as any;
      // normalize payload: ensure controllers can use req.user.id
      if (payload && !payload.id && payload.sub) payload.id = payload.sub;
      req.user = payload;
      if (payload && payload.role && requiredRoles.includes(payload.role))
        return true;
      throw new ForbiddenException('Insufficient role');
    } catch (_err) {
      throw new ForbiddenException('Invalid token');
    }
  }
}
