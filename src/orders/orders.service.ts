import { Injectable, BadRequestException } from '@nestjs/common';
import { Product } from '../entities/product.entity';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Op } from 'sequelize';

@Injectable()
export class OrdersService {
  private generateCode(len = 4) {
    // default length changed to 5
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let out = '';
    for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }
  // items: { productId, quantity }[]
  async create(
    items: { productId: number; quantity: number }[],
    source: 'ecom' | 'pos' = 'ecom',
    userId?: string,
  ) {
    if (!items || items.length === 0) throw new BadRequestException('No items');

    // start transaction from a model's sequelize instance
    const sequelize = (Order as any).sequelize;
    const t = sequelize ? await sequelize.transaction() : null;
    try {
      // validate and compute total
      let total = 0;
      for (const it of items) {
        const prod = await Product.findByPk(it.productId, { transaction: t });
        if (!prod)
          throw new BadRequestException(`Product ${it.productId} not found`);
        if (prod.stock < it.quantity)
          throw new BadRequestException(`Insufficient stock for ${prod.name}`);
        total += prod.price * it.quantity;
      }

      const order = await Order.create({ total, source, status: 'not paid', userId: userId ?? null } as any, {
        transaction: t,
      });

      // if created, try to assign a short memorable code (unique)
      for (let attempt = 0; attempt < 5; attempt++) {
        const code = this.generateCode(5);
        try {
          order.code = code;
          await order.save({ transaction: t });
          break;
        } catch (e) {
          // collision or db error, try again
        }
      }

      for (const it of items) {
        await OrderItem.create(
          {
            orderId: order.id,
            productId: it.productId,
            quantity: it.quantity,
          } as any,
          { transaction: t },
        );
        const prod = await Product.findByPk(it.productId, { transaction: t });
        if (!prod)
          throw new BadRequestException(`Product ${it.productId} not found`);
        prod.stock = prod.stock - it.quantity;
        await prod.save({ transaction: t });
      }

      if (t) await t.commit();
      return Order.findByPk(order.id, { include: [{ model: OrderItem, include: [Product] }, { model: (require('../auth/user.entity').User) }] });
    } catch (err) {
      if (t) await t.rollback();
      throw err;
    }
  }

  async list() {
    return Order.findAll({ include: [{ model: OrderItem, include: [Product] }, { model: (require('../auth/user.entity').User) }] });
  }

  // manual assign/bulk endpoints removed — codes are auto-generated at order creation

  async get(id: string) {
    return Order.findByPk(id, { include: [{ model: OrderItem, include: [Product] }, { model: (require('../auth/user.entity').User) }] });
  }
}
