import { Injectable, BadRequestException } from '@nestjs/common';
import { Product } from '../entities/product.entity';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';

@Injectable()
export class OrdersService {
  // items: { productId, quantity }[]
  async create(
    items: { productId: number; quantity: number }[],
    source: 'ecom' | 'pos' = 'ecom',
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

      const order = await Order.create({ total, source } as any, {
        transaction: t,
      });

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
      return Order.findByPk(order.id, { include: [{ model: OrderItem, include: [Product] }] });
    } catch (err) {
      if (t) await t.rollback();
      throw err;
    }
  }

  async list() {
    return Order.findAll({ include: [{ model: OrderItem, include: [Product] }] });
  }

  async get(id: string) {
    return Order.findByPk(id, { include: [{ model: OrderItem, include: [Product] }] });
  }
}
