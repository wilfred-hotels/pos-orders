import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { PosModule } from './pos/pos.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { Product } from './entities/product.entity';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USER ?? 'wilfred',
      password: process.env.DB_PASS ?? 'williy8615.',
      database: process.env.DB_NAME ?? 'pos-orders',
      models: [Product, Order, OrderItem],
      autoLoadModels: true,
      synchronize: true,
      logging: false,
    }),
    ProductsModule,
    OrdersModule,
    PosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
