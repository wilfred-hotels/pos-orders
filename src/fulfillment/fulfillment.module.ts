import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { FulfillmentService } from './fulfillment.service';
import { CatalogProductSource } from '../entities/catalog-product-source.entity';
import { OrderFulfillment } from '../entities/order-fulfillment.entity';
import { Product } from '../entities/product.entity';
import { Order } from '../entities/order.entity';

@Module({
  imports: [SequelizeModule.forFeature([CatalogProductSource, OrderFulfillment, Product, Order])],
  providers: [FulfillmentService],
  exports: [FulfillmentService],
})
export class FulfillmentModule {}
