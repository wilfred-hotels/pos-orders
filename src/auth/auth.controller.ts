import { Body, Controller, Post, Req, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { RevokedToken } from './revoked-token.entity';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

interface RegisterBody {
  username: string;
  password: string;
  role?: string;
  hotelId?: string;
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(private authService: AuthService) { }

  @Post('login')
  async login(@Req() req: any, @Body() body: LoginDto) {
    // debug log: route, ip, username (mask password)
    const ip = req.ip || req.headers?.['x-forwarded-for'] || req.connection?.remoteAddress;
    this.logger.debug(`POST /auth/login from ${ip} - username=${body.username}`);
    try {
      this.logger.debug(`body: ${JSON.stringify(body)}`);
    } catch (e) {
      this.logger.debug('body: [unstringifiable]');
    }
    const user = await this.authService.validateUser(body.username, body.password, (body as any).hotelId);
    if (!user) return { status: 'error', message: 'Invalid credentials' };
    // return both access and refresh tokens plus basic user info
    const tokens = await this.authService.login(user);
    const userInfo = { id: user.id, username: user.username, role: user.role, hotelId: user.hotelId };
    return { status: 'ok', user: userInfo, ...tokens };
  }

  @Post('refresh')
  async refresh(@Body() body: { refresh_token?: string }) {
    const token = body?.refresh_token ?? null;
    if (!token) throw new BadRequestException('No refresh token provided');
    // let AuthService.refresh throw UnauthorizedException if token is invalid/expired
    const result = await this.authService.refresh(token);
    return { status: 'ok', ...result };
  }

  @Post('check')
  async check(@Req() req: any, @Body() body?: { access_token?: string }) {
    const header = typeof req.headers?.authorization === 'string' ? req.headers.authorization : null;
    const token = body?.access_token ?? (header ? header.split(' ')[1] : null);
    if (!token) throw new BadRequestException('No access token provided');
    const expired = this.authService.isAccessTokenExpired(token);
    if (!expired) {
      return { status: 201 }
    } else {
      throw new UnauthorizedException('token is expired');
    }
    // return { status: 'ok', expired };
  }

  @Post('logout')
  async logout(@Req() req: any, @Body() body?: { token?: string }) {
    // Accept token in body or Authorization header
    const header = typeof req.headers?.authorization === 'string' ? req.headers.authorization : null;
    const token = body?.token ?? (header ? header.split(' ')[1] : null);
    if (!token) throw new BadRequestException('No token provided');

    // decode token to get exp and sub
  const decoded: any = jwt.decode(token) as any;
    const exp = decoded?.exp ? new Date(decoded.exp * 1000) : undefined;
    const sub = decoded?.sub;

    await RevokedToken.create({ token, expiresAt: exp ?? null, userId: sub ?? null } as any);
    return { status: 'ok' };
  }

  @Post('register')
  async register(@Req() req: any, @Body() body: RegisterBody) {
    const { username, password, role, hotelId } = body;
    this.logger.debug(`body: ${JSON.stringify(body)}`);
    const ip = req.ip || req.headers?.['x-forwarded-for'] || req.connection?.remoteAddress;
    // Mask the password for logs
    const masked = password ? '****' : undefined;
    this.logger.debug(`POST /auth/register from ${ip} - username=${username} role=${role} hotelId=${hotelId} password=${masked}`);
    try {
      this.logger.debug(`body: ${JSON.stringify(body)}`);
    } catch (e) {
      this.logger.debug('body: [unstringifiable]');
    }
    // pass the authorization header (if present) so service can validate creator role
    const authHeader = typeof req.headers?.authorization === 'string' ? req.headers.authorization : null;
    const token = authHeader ? authHeader.split(' ')[1] : null;
    const created = await this.authService.register(username, password, role as any, hotelId, token);
    if (!created) return { status: 'error', message: 'User not created' };
    // return minimal created user info
    return { status: 'ok', user: { id: created.id, username: created.username, role: created.role, hotelId: created.hotelId } };
  }
}
