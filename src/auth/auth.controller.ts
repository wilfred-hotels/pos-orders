import { Body, Controller, Post, Req, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import * as jwt from 'jsonwebtoken';
import { RevokedToken } from './revoked-token.entity';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SuperAdminLoginDto } from './dto/super-admin-login.dto';

interface RegisterBody {
  username: string;
  password: string;
  role?: string;
  hotelId?: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(private authService: AuthService) { }

  @Post('super-admin/login')
  @ApiOperation({ summary: 'Super Admin Login' })
  @ApiBody({ type: SuperAdminLoginDto })
  @ApiResponse({
    status: 200,
    description: 'Super Admin login successful',
    schema: {
      example: {
        status: 'ok',
        user: {
          id: 'user-uuid',
          username: 'superadmin',
          role: 'super_admin'
        },
        access_token: 'jwt.token',
        refresh_token: 'jwt.refresh'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials or not a super admin' })
  async superAdminLogin(@Req() req: any, @Body() body: SuperAdminLoginDto) {
    const ip = req.ip || req.headers?.['x-forwarded-for'] || req.connection?.remoteAddress;
    this.logger.debug(`POST /auth/super-admin/login from ${ip} - username=${body.username}`);
    
    const user = await this.authService.validateSuperAdmin(body.username, body.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials or not a super admin');
    }

    const tokens = await this.authService.loginSuperAdmin(user);
    const userInfo = { id: user.id, username: user.username, role: user.role };
    return { status: 'ok', user: userInfo, ...tokens };
  }

  @Post('login')
  @ApiOperation({ summary: 'Login for regular users and staff' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Login result', 
    schema: { 
      example: { 
        status: 'ok', 
        user: { 
          id: 'user-uuid', 
          username: 'alice', 
          role: 'manager', 
          hotelId: 'hotel-uuid' 
        }, 
        access_token: 'jwt.token', 
        refresh_token: 'jwt.refresh' 
      } 
    } 
  })
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
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiBody({ schema: { example: { refresh_token: 'jwt.refresh' } } })
  @ApiResponse({ status: 200, description: 'New tokens', schema: { example: { status: 'ok', access_token: 'jwt.token', refresh_token: 'jwt.refresh' } } })
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
  @ApiOperation({ summary: 'Logout (revoke token)' })
  @ApiBody({ schema: { example: { token: 'jwt.token' } } })
  @ApiResponse({ status: 200, description: 'Logout result', schema: { example: { status: 'ok' } } })
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
  @ApiOperation({ summary: 'Register a new user (admin can create users for their hotel)' })
  @ApiBody({ schema: { example: { username: 'newuser', password: 'secret', role: 'manager', hotelId: 'hotel-uuid' } } })
  @ApiResponse({ status: 201, description: 'Created user', schema: { example: { status: 'ok', user: { id: 'user-uuid', username: 'newuser', role: 'manager', hotelId: 'hotel-uuid' } } } })
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
