import { Injectable, BadRequestException } from '@nestjs/common';
import { Product } from '../entities/product.entity';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { CatalogProduct } from '../entities/catalog-product.entity';
import { FulfillmentService } from '../fulfillment/fulfillment.service';
import { Op } from 'sequelize';

@Injectable()
export class OrdersService {
  constructor(private readonly fulfillmentService?: FulfillmentService) {}
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
    cartId?: string,
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

      // create the order with default 'not paid' status; it will be marked 'pending' when payment is initiated
      const order = await Order.create({ total, source, status: 'not paid', userId: userId ?? null, cartId: cartId ?? null } as any, {
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

  async findByCode(code: string) {
    if (!code) return null;
    return Order.findOne({ where: { code }, include: [{ model: OrderItem, include: [Product] }, { model: (require('../auth/user.entity').User) }] });
  }

  // manual assign/bulk endpoints removed — codes are auto-generated at order creation

  async get(id: string) {
    return Order.findByPk(id, { include: [{ model: OrderItem, include: [Product] }, { model: (require('../auth/user.entity').User) }] });
  }

  // Create an order for a catalog product (guest or authenticated). Does not touch product stock.
  async createCatalogOrder(
    catalogProductId: string,
    quantity = 1,
    contact?: any,
    userId?: string,
    guestId?:string,
  ) {
    const catalog = await CatalogProduct.findByPk(catalogProductId);
    if (!catalog) throw new BadRequestException('Catalog product not found');

  const catalogPrice = Number((catalog as any).finalPriceCents ?? (catalog as any).initialPriceCents) || 0;
  const total = (catalogPrice) / 100 * (quantity || 1);

    const order = await Order.create({
      total,
      source: 'catalog',
      status: 'not paid',
      guestId:guestId ?? null,
      userId: userId ?? null,
      cartId: null,
      catalogProductId,
      contact: contact ?? null,
    } as any);

    // assign a short code
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = this.generateCode(5);
      try {
        order.code = code;
        await order.save();
        break;
      } catch (e) {
        // try again
      }
    }

    const created = await Order.findByPk(order.id);

    // Try to assign fulfillment immediately (best-effort) using injected FulfillmentService
    try {
      if (this.fulfillmentService && created && (created as any).id) {
        await this.fulfillmentService.assignFulfillment((created as any).id);
      }
    } catch (e) {
      // best-effort: assignment failures should not block order creation
    }

    return created;
  }
}
