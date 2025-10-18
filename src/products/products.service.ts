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

  async create(dto: {
    name: string;
    description?: string;
    price: number;
    stock: number;
    hotelId?: number;
  }) {
    const p = await this.productModel.create({
      name: dto.name,
      description: dto.description ?? null,
      price: dto.price,
      stock: dto.stock,
      hotelId: dto.hotelId ?? null,
    } as any);
    return p;
  }

  async update(
    id: number,
    dto: {
      name?: string;
      description?: string;
      price?: number;
      stock?: number;
    },
  ) {
    const p = await this.findOne(id);
    if (dto.name !== undefined) p.name = dto.name;
    if (dto.description !== undefined) p.description = dto.description;
    if (dto.price !== undefined) p.price = dto.price;
    if (dto.stock !== undefined) p.stock = dto.stock;
    await p.save();
    return p;
  }
}
