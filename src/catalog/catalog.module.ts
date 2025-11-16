import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';
import { CatalogProduct } from './models/CatalogProduct.model';

@Module({
  imports: [
    SequelizeModule.forFeature([CatalogProduct])
  ],
  providers: [CatalogService],
  controllers: [CatalogController],
  exports: [CatalogService]
})
export class CatalogModule {}
