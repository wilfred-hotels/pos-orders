import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { PosModule } from './pos/pos.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { Product } from './entities/product.entity';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Hotel } from './entities/hotel.entity';
import { User } from './auth/user.entity';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { CartModule } from './cart/cart.module';
import { RevokedToken } from './auth/revoked-token.entity';
import { LoggingMiddleware } from './common/logging.middleware';
import { HotelsModule } from './hotels/hotels.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    (() => {
      // prefer a full DATABASE_URL when available
      const databaseUrl = process.env.DATABASE_URL;
      const useDbUrl = Boolean(databaseUrl && databaseUrl.length > 0);
      // default ssl behavior: enabled unless explicitly disabled
      const sslEnabled = process.env.DB_SSL !== 'false';

      if (useDbUrl) {
        try {
          const url = new URL(databaseUrl as string);
          const username = decodeURIComponent(url.username || '') || process.env.DB_USER;
          const password = decodeURIComponent(url.password || '') || process.env.DB_PASS;
          const host = url.hostname;
          const port = url.port ? Number(url.port) : 5432;
          const database = url.pathname && url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;

          return SequelizeModule.forRoot({
            dialect: 'postgres',
            host,
            port,
            username,
            password,
            database,
            models: [Product, Order, OrderItem, Hotel, User, Cart, CartItem, RevokedToken],
            autoLoadModels: true,
            synchronize: true,
            logging: false,
            dialectOptions: sslEnabled ? { ssl: { require: true, rejectUnauthorized: false } } : {},
          });
        } catch (e) {
          // fallback to per-field config if parsing fails
          console.warn('Failed to parse DATABASE_URL, falling back to per-field DB config', e?.message || e);
        }
      }

      return SequelizeModule.forRoot({
        dialect: 'postgres',
        host: process.env.DB_HOST ?? 'localhost',
        port: Number(process.env.DB_PORT ?? 5432),
        username: process.env.DB_USER ?? 'wilfred',
        password: process.env.DB_PASS ?? 'williy8615.',
        database: process.env.DB_NAME ?? 'pos-orders',
        models: [Product, Order, OrderItem, Hotel, User, Cart, CartItem, RevokedToken],
        autoLoadModels: true,
        synchronize: true,
        logging: false,
        dialectOptions: process.env.DB_SSL === 'false' ? {} : { ssl: { require: true, rejectUnauthorized: false } },
      });
    })(),
  ProductsModule,
  OrdersModule,
  PosModule,
  AuthModule,
  HotelsModule,
  CartModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
