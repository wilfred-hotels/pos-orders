import { Injectable, BadRequestException } from '@nestjs/common';
import { Hotel } from '../entities/hotel.entity';
import { Product } from '../entities/product.entity';
import { UsersService } from '../auth/users.service';

interface CreateHotelWithAdminDto {
  hotel: any;
  admin: { username: string; password: string };
}

@Injectable()
export class HotelsService {
  constructor(private usersService?: UsersService) {}

  create(data: any) {
    return Hotel.create(data as any);
  }

  async createWithAdmin(data: CreateHotelWithAdminDto) {
    const sequelize = Hotel.sequelize as any;
    if (!sequelize) throw new BadRequestException('DB not initialized');
    return await sequelize.transaction(async (tx: any) => {
      const hotel = await Hotel.create(data.hotel as any, { transaction: tx });
      // create admin user attached to this hotel
      await (this.usersService as any).create(data.admin.username, data.admin.password, 'admin', hotel.id, { transaction: tx });
      return hotel;
    });
  }

  findAll() {
    return Hotel.findAll();
  }

  findOne(id: string) {
    return Hotel.findByPk(id);
  }

  async products(hotelId: string) {
    return Product.findAll({ where: { hotelId } });
  }
}
