import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { User } from '../entities/user.entity';
import { DEFAULT_ROLE, AVAILABLE_ROLES } from './roles.const';
import { Hotel } from '../entities/hotel.entity';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async validateSuperAdmin(username: string, pass: string) {
    const user = await this.usersService.findByUsername(username);
    if (!user || user.role !== 'super_admin') return null;
    
    const ok = await bcrypt.compare(pass, user.password);
    if (!ok) return null;
    
    return user;
  }

  async loginSuperAdmin(user: User) {
    if (user.role !== 'super_admin') {
      throw new UnauthorizedException('Only super admin can use this endpoint');
    }

    const payload = {
      username: user.username,
      sub: user.id,
      role: user.role
      // Intentionally not including hotelId to prevent hotel access
    };

      const accessToken = (jwt as any).sign(payload, process.env.JWT_SECRET ?? 'change-me', {
        expiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
      });

      const refreshToken = (jwt as any).sign(
      { sub: payload.sub },
      process.env.JWT_REFRESH_SECRET ?? (process.env.JWT_SECRET ?? 'change-me') + '-refresh',
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '1d' },
    );

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  async validateUser(username: string, pass: string, hotelId?: string) {
    const user = await this.usersService.findByUsername(username, hotelId);
    if (!user) return null;
    const ok = await bcrypt.compare(pass, user.password);
    if (!ok) return null;
    return user;
  }

  async login(user: any) {
    // create jwt payload and tokens
    const payload: any = {
      username: user.username as string,
      sub: user.id as string,
      role: user.role as string,
    };
  if (user.hotelId) payload.hotelId = user.hotelId as string;
    const accessToken = (jwt as any).sign(payload, process.env.JWT_SECRET ?? 'change-me', {
      expiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
    });

    const refreshToken = (jwt as any).sign(
      { sub: payload.sub },
      process.env.JWT_REFRESH_SECRET ?? (process.env.JWT_SECRET ?? 'change-me') + '-refresh',
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '1d' },
    );

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  async refresh(refreshToken: string) {
    // Only issue a new access token (do not rotate refresh token)
    if (!refreshToken) throw new UnauthorizedException('No refresh token provided');
    try {
      const secret = process.env.JWT_REFRESH_SECRET ?? (process.env.JWT_SECRET ?? 'change-me') + '-refresh';
      const payload = (jwt as any).verify(refreshToken, secret) as any;
      const userId = payload?.sub as string | undefined;
      if (!userId) throw new UnauthorizedException('Invalid refresh token');

      const found = await User.findByPk(userId as any);
      if (!found) throw new UnauthorizedException('User not found');

      const newPayload: any = { username: found.username, sub: found.id, role: found.role };
      if (found.hotelId) newPayload.hotelId = found.hotelId;
      const accessToken = (jwt as any).sign(newPayload, process.env.JWT_SECRET ?? 'change-me', {
        expiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
      });
      return { access_token: accessToken };
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  isAccessTokenExpired(token: string) {
    try {
      const decoded = (jwt as any).decode(token) as any;
      if (!decoded || !decoded.exp) return true;
      const now = Math.floor(Date.now() / 1000);
      return decoded.exp <= now;
    } catch (e) {
      return true;
    }
  }

  async register(
    username: string,
    password: string,
    role = DEFAULT_ROLE,
    hotelId?: string,
    creatorToken?: string | null,
  ): Promise<any> {
    const existing = await this.usersService.findByUsername(username);
    if (existing) throw new UnauthorizedException('User exists');

    // If a hotelId is provided, ensure it exists
    if (hotelId) {
      const hotel = await Hotel.findByPk(hotelId);
      if (!hotel) throw new BadRequestException('Invalid hotelId');
    }

    // If role is a staff role, ensure the creator is admin or manager
    const requestedRole = role || DEFAULT_ROLE;
    const isStaffRole = requestedRole !== DEFAULT_ROLE;
    if (isStaffRole) {
      if (!creatorToken) {
        throw new UnauthorizedException('Only admin/manager can create staff accounts');
      }
      try {
        const payload = jwt.verify(creatorToken, process.env.JWT_SECRET ?? 'change-me') as any;
        const creatorRole = payload?.role as string | undefined;
        if (!creatorRole || !['admin', 'manager'].includes(creatorRole)) {
          throw new UnauthorizedException('Only admin/manager can create staff accounts');
        }
      } catch (_e) {
        throw new UnauthorizedException('Invalid creator token');
      }
    }

    // sanitize role
    const assignedRole = AVAILABLE_ROLES.includes(requestedRole) ? requestedRole : DEFAULT_ROLE;
    return this.usersService.create(username, password, assignedRole, hotelId);
  }
}
