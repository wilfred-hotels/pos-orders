import { Module, forwardRef } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { ReceiptsService } from './receipts.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Product } from '../entities/product.entity';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { CartModule } from '../cart/cart.module';
import { FulfillmentModule } from '../fulfillment/fulfillment.module';

@Module({
  imports: [SequelizeModule.forFeature([Product, Order, OrderItem]), forwardRef(() => CartModule), FulfillmentModule],
  controllers: [OrdersController],
  providers: [OrdersService, ReceiptsService],
  exports: [OrdersService],
})
export class OrdersModule {}
