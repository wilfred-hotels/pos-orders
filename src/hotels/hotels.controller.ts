import { Body, Controller, Get, Post, Param, BadRequestException } from '@nestjs/common';
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
}
