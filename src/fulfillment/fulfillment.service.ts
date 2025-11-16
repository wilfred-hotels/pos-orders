import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CatalogProductSource } from '../entities/catalog-product-source.entity';
import { OrderFulfillment } from '../entities/order-fulfillment.entity';
import { Order } from '../entities/order.entity';
import { Product } from '../entities/product.entity';

@Injectable()
export class FulfillmentService {
  private readonly logger = new Logger(FulfillmentService.name);
  constructor(
    @InjectModel(CatalogProductSource) private sourceModel: typeof CatalogProductSource,
    @InjectModel(OrderFulfillment) private fulfillmentModel: typeof OrderFulfillment,
    @InjectModel(Product) private productModel: typeof Product,
    @InjectModel(Order) private orderModel: typeof Order,
  ) {}

  // Return candidate sources for a catalog product, ordered by priority then base price
  async getCandidateSources(catalogProductId: string) {
    const candidates = await this.sourceModel.findAll({ where: { catalogProductId, enabled: true }, order: [['priority', 'ASC']] } as any);
    // enrich with product base price when available
    const enriched = await Promise.all(candidates.map(async (c: any) => {
      const prod = c.productId ? await this.productModel.findByPk(c.productId) : null;
      return { ...c.get ? c.get() : c, product: prod ? prod.get ? prod.get() : prod : null };
    }));
    // sort by priority then price if present
    enriched.sort((a: any, b: any) => {
      if ((a.priority || 0) !== (b.priority || 0)) return (a.priority || 0) - (b.priority || 0);
      const pa = (a.basePriceCents || (a.product?.price ? Math.round(a.product.price * 100) : Infinity));
      const pb = (b.basePriceCents || (b.product?.price ? Math.round(b.product.price * 100) : Infinity));
      return (pa - pb);
    });
    return enriched;
  }

  // Assign a fulfillment for an order using a cheapest-first strategy
  async assignFulfillment(orderId: string) {
    const order = await this.orderModel.findByPk(orderId);
    if (!order) throw new Error('Order not found');
    const catalogProductId = (order as any).catalogProductId;
    if (!catalogProductId) return null;

    const candidates = await this.getCandidateSources(catalogProductId);
    if (!candidates || candidates.length === 0) {
      this.logger.warn(`No fulfillment candidates for order ${orderId}`);
      return null;
    }

    const chosen = candidates[0];
    const hotelId = chosen.hotelId ?? chosen.hotel_id ?? null;
    const productId = chosen.productId ?? chosen.product_id ?? null;

    // compute price breakdown
  const catalogEntity = (await (require('../entities/catalog-product.entity').CatalogProduct.findByPk(catalogProductId)) as any) || {};
  const catalogPriceCents = Number(catalogEntity.finalPriceCents ?? catalogEntity.initialPriceCents) || 0;
    const hotelBase = Number(chosen.basePriceCents ?? (chosen.product?.price ? Math.round(chosen.product.price * 100) : 0)) || 0;
    const transport = 0; // placeholder for transport calculation
    const platformCut = Math.round(catalogPriceCents * 0.05); // 5% fee
    const profit = catalogPriceCents - (hotelBase + transport + platformCut);
    const priceBreakdown = { catalogPriceCents, hotelBase, transport, platformCut, profit };

    const fulfillment = await this.fulfillmentModel.create({
      orderId,
      assignedHotelId: hotelId,
      assignedProductId: productId,
      assignedAt: new Date(),
      status: 'assigned',
      priceBreakdown,
      payoutStatus: 'unpaid',
    } as any);

    // attach fulfillment id to order
    try {
      (order as any).fulfillmentId = fulfillment.id;
      await order.save();
    } catch (e) {
      this.logger.warn('Failed to attach fulfillment to order: ' + (e as any)?.message);
    }

    return fulfillment;
  }
}
