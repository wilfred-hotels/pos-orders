import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Product } from '../entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(@InjectModel(Product) private productModel: typeof Product) {}

  findAll() {
    return this.productModel.findAll();
  }

  async findOne(id: number) {
    const p = await this.productModel.findByPk(id);
    if (!p) throw new NotFoundException('Product not found');
    return p;
  }

  async decreaseStock(id: number, qty: number) {
    const p = await this.findOne(id);
    if (p.stock < qty) throw new Error('Insufficient stock');
    p.stock -= qty;
    await p.save();
    return p;
  }
}
