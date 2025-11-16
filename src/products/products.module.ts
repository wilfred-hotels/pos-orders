import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { AdminProductsController } from './admin-products.controller';
import { ProductsService } from './products.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Product } from '../entities/product.entity';

@Module({
  imports: [SequelizeModule.forFeature([Product])],
  controllers: [ProductsController, AdminProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
