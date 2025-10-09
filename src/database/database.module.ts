import { Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { Product } from '../entities/product.entity';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';

@Module({})
export class DatabaseModule implements OnModuleInit, OnModuleDestroy {
  private sequelize: Sequelize;

  async onModuleInit() {
    this.sequelize = new Sequelize({
      dialect: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USER ?? 'wilfred',
      password: process.env.DB_PASS ?? 'williy8615.',
      database: process.env.DB_NAME ?? 'pos-orders',
      models: [Product, Order, OrderItem],
      logging: false,
    } as any);

    await this.sequelize.sync({ alter: true });
  }

  async onModuleDestroy() {
    await this.sequelize.close();
  }
}
