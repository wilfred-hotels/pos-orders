import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Product } from '../entities/product.entity';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  constructor(@InjectModel(Product) private productModel: typeof Product) {}

  findAll() {
    return this.productModel.findAll();
  }

  async findOne(id: string) {
    const p = await this.productModel.findByPk(id);
    if (!p) throw new NotFoundException('Product not found');
    return p;
  }

  async decreaseStock(id: number, qty: number) {
    const p = await this.findOne(id as any);
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
    hotelId?: string;
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
    id: string,
    dto: {
      name?: string;
      description?: string;
      price?: number;
      stock?: number;
    },
  ) {
    const p = await this.findOne(id as any);
    // Log before change
    try { this.logger.debug(`Before update product=${JSON.stringify(p?.toJSON ? p.toJSON() : p)}`); } catch (e) {}

    const assigned: any = {};
    if (dto.name !== undefined) { p.name = dto.name; assigned.name = dto.name; }
    if (dto.description !== undefined) { p.description = dto.description; assigned.description = dto.description; }
    if (dto.price !== undefined) { p.price = Number(dto.price); assigned.price = Number(dto.price); }
    if (dto.stock !== undefined) { p.stock = Number(dto.stock); assigned.stock = Number(dto.stock); }

    try { this.logger.debug(`Assigning fields: ${JSON.stringify(assigned)}`); } catch (e) {}

    await p.save();

    try { this.logger.debug(`After update product=${JSON.stringify(p?.toJSON ? p.toJSON() : p)}`); } catch (e) {}
    return p;
  }

  async remove(id: string) {
    const p = await this.findOne(id as any);
    await p.destroy();
    return { success: true };
  }
}
