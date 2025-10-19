import { Injectable, BadRequestException } from '@nestjs/common';
import { Hotel } from '../entities/hotel.entity';
import { Product } from '../entities/product.entity';
import { UsersService } from '../auth/users.service';
import { User } from '../auth/user.entity';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';

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

  // analytics helpers
  async countUsers(hotelId: string) {
    return User.count({ where: { hotelId } });
  }

  async countProducts(hotelId: string) {
    return Product.count({ where: { hotelId } });
  }

  // fetch order items for this hotel (optionally between dates)
  async _fetchOrderItems(hotelId: string, from?: string, to?: string) {
    const whereOrder: any = {};
    if (from || to) {
      whereOrder.createdAt = {} as any;
      if (from) whereOrder.createdAt['$gte'] = new Date(from);
      if (to) whereOrder.createdAt['$lte'] = new Date(to);
    }

    return OrderItem.findAll({
      include: [
        { model: Product, where: { hotelId }, attributes: ['id', 'name', 'price', 'hotelId'] },
        { model: Order, where: whereOrder, attributes: ['id', 'createdAt'] },
      ],
    });
  }

  async totalRevenue(hotelId: string, from?: string, to?: string) {
    const items = await this._fetchOrderItems(hotelId, from, to);
    let total = 0;
    for (const it of items) {
      const prod = (it as any).product as any;
      total += (prod.price || 0) * ((it as any).quantity || 0);
    }
    return total;
  }

  async totalOrders(hotelId: string, from?: string, to?: string) {
    const items = await this._fetchOrderItems(hotelId, from, to);
    const orderIds = new Set<string>();
    for (const it of items) orderIds.add((it as any).orderId);
    return orderIds.size;
  }

  async revenueSeries(hotelId: string, from?: string, to?: string, groupBy: 'day' | 'month' = 'day') {
    const items = await this._fetchOrderItems(hotelId, from, to);
    const buckets: Record<string, number> = {};
    for (const it of items) {
      const order = (it as any).order as any;
      const prod = (it as any).product as any;
      const date = new Date(order.createdAt);
      const key = groupBy === 'month' ? `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}` : `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
      buckets[key] = (buckets[key] || 0) + (prod.price || 0) * ((it as any).quantity || 0);
    }
    // convert to sorted array
    return Object.keys(buckets).sort().map(k => ({ period: k, revenue: buckets[k] }));
  }

  async ordersSeries(hotelId: string, from?: string, to?: string, groupBy: 'day'|'month'='day') {
    const items = await this._fetchOrderItems(hotelId, from, to);
    const map: Record<string, Set<string>> = {};
    for (const it of items) {
      const order = (it as any).order as any;
      const date = new Date(order.createdAt);
      const key = groupBy === 'month' ? `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}` : `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
      map[key] = map[key] || new Set<string>();
      map[key].add(order.id);
    }
    return Object.keys(map).sort().map(k => ({ period: k, orders: map[k].size }));
  }

  async topProducts(hotelId: string, limit = 10, from?: string, to?: string) {
    const items = await this._fetchOrderItems(hotelId, from, to);
    const agg: Record<string, { productId: string; name: string; qty: number; revenue: number }> = {};
    for (const it of items) {
      const prod = (it as any).product as any;
      const pid = prod.id;
      if (!agg[pid]) agg[pid] = { productId: pid, name: prod.name, qty: 0, revenue: 0 };
      const qty = (it as any).quantity || 0;
      agg[pid].qty += qty;
      agg[pid].revenue += (prod.price || 0) * qty;
    }
    return Object.values(agg).sort((a,b) => b.qty - a.qty).slice(0, limit);
  }

  async overview(hotelId: string, from?: string, to?: string) {
    const [members, products, revenue, orders, top] = await Promise.all([
      this.countUsers(hotelId),
      this.countProducts(hotelId),
      this.totalRevenue(hotelId, from, to),
      this.totalOrders(hotelId, from, to),
      this.topProducts(hotelId, 5, from, to),
    ]);
    return {
      members,
      products,
      revenue,
      orders,
      topProducts: top,
    };
  }

  // fetch full orders for a hotel (orders will include only items for that hotel)
  async ordersByHotel(hotelId: string, from?: string, to?: string) {
    const whereOrder: any = {};
    if (from || to) {
      whereOrder.createdAt = {};
      if (from) whereOrder.createdAt['$gte'] = new Date(from);
      if (to) whereOrder.createdAt['$lte'] = new Date(to);
    }

    // include OrderItems that reference Products for this hotel
    return Order.findAll({
      where: whereOrder,
      include: [
        {
          model: OrderItem,
          include: [{ model: Product, where: { hotelId }, required: true }],
          required: true,
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  }
}
