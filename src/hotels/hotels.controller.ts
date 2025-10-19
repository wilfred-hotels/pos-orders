import { Body, Controller, Get, Post, Param, BadRequestException } from '@nestjs/common';
import { UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { HotelsService } from './hotels.service';
import { UsersService } from '../auth/users.service';
import { Hotel } from '../entities/hotel.entity';

@Controller('hotels')
export class HotelsController {
  constructor(private hotelsService: HotelsService, private usersService: UsersService) {}

  @Post()
  async create(
    @Body()
    body: {
      hotel: {
        name: string;
        address?: string;
        city?: string;
        country?: string;
        phone?: string;
        openingTime?: string;
        closingTime?: string;
        imageUrl?: string;
        description?: string;
        workersCount?: number;
      };
      admin: { username: string; password: string };
    },
  ) {
    // Create hotel and admin user in a transaction
    const sequelize = Hotel.sequelize as any;
    if (!sequelize) throw new BadRequestException('DB not initialized');
    return await sequelize.transaction(async (tx: any) => {
      const hotel = await this.hotelsService.create(body.hotel as any);
      await this.usersService.create(body.admin.username, body.admin.password, 'admin', hotel.id, { transaction: tx });
      return hotel;
    });
  }

  @Get()
  list() {
    return this.hotelsService.findAll();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.hotelsService.findOne(id);
  }

  @Get(':id/products')
  products(@Param('id') id: string) {
    return this.hotelsService.products(id);
  }

  // analytics endpoints for frontend graphs
  @Get(':id/stats/overview')
  overview(@Param('id') id: string, @Body() body?: { from?: string; to?: string }) {
    return this.hotelsService.overview(id, body?.from, body?.to);
  }

  @Get(':id/stats/revenue')
  revenue(@Param('id') id: string, @Body() body?: { from?: string; to?: string; groupBy?: 'day'|'month' }) {
    return this.hotelsService.revenueSeries(id, body?.from, body?.to, body?.groupBy ?? 'day');
  }

  @Get(':id/stats/orders')
  orders(@Param('id') id: string, @Body() body?: { from?: string; to?: string; groupBy?: 'day'|'month' }) {
    return this.hotelsService.ordersSeries(id, body?.from, body?.to, body?.groupBy ?? 'day');
  }

  @Get(':id/stats/top-products')
  topProducts(@Param('id') id: string, @Body() body?: { from?: string; to?: string; limit?: number }) {
    return this.hotelsService.topProducts(id, body?.limit ?? 10, body?.from, body?.to);
  }

  @Get(':id/stats/members')
  members(@Param('id') id: string) {
    return this.hotelsService.countUsers(id);
  }

  @Get(':id/orders')
  @UseGuards(RolesGuard)
  @Roles('manager', 'admin')
  async ordersByHotel(@Param('id') id: string, @Req() req: any, @Body() body?: { from?: string; to?: string }) {
    const user = req.user as { role?: string; hotelId?: string } | undefined;
    if (user && user.role === 'manager' && user.hotelId !== id) {
      throw new ForbiddenException('Managers can only view orders for their hotel');
    }
    return this.hotelsService.ordersByHotel(id, body?.from, body?.to);
  }
}
