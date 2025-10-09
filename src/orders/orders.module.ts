import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Product } from '../entities/product.entity';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';

@Module({
  imports: [SequelizeModule.forFeature([Product, Order, OrderItem])],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
