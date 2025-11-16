import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Product } from '../entities/product.entity';
import { Hotel } from '../entities/hotel.entity';
import { FilterProductsDto, SortOrder } from './dto/filter-products.dto';
import { Op } from 'sequelize';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  constructor(@InjectModel(Product) private productModel: typeof Product) {}

  async findAllWithFilters(filterDto: FilterProductsDto) {
    const {
      name,
      hotelId,
      category,
      minPrice,
      maxPrice,
      isAvailable,
      tags,
      sortBy,
      sortOrder,
      page = 1,
      limit = 10,
    } = filterDto;

    // Build the where clause based on filters
    const where: any = {};
    
    if (name) {
      where.name = {
        [Op.iLike]: `%${name}%`
      };
    }

    if (hotelId) {
      where.hotelId = hotelId;
    }

    // Only apply filters that exist on the hotel-scoped Product entity
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price[Op.gte] = minPrice;
      }
      if (maxPrice !== undefined) {
        where.price[Op.lte] = maxPrice;
      }
    }

    // Build the order clause
    const order: any[] = [];
    // Only allow sorting by safe, existing fields on the Product entity
    const allowedSortFields = ['price', 'name', 'stock'];
    if (sortBy && allowedSortFields.includes(sortBy)) {
      order.push([sortBy, sortOrder || SortOrder.ASC]);
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    this.logger.log(`Finding products with filters: ${JSON.stringify(filterDto)}`);

    // Execute the query
    const { rows, count } = await this.productModel.findAndCountAll({
      where,
      include: [{ model: Hotel, attributes: ['id', 'name'] }],
      order,
      limit,
      offset,
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      data: rows,
      metadata: {
        totalItems: count,
        itemsPerPage: limit,
        currentPage: page,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      }
    };
  }

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
  }) {
    this.logger.log(`Creating new product: ${dto.name}`);
    const p = await this.productModel.create({
      name: dto.name,
      description: dto.description,
      price: dto.price,
      stock: dto.stock,
      // Note: hotel-scoped Product entity currently does not include sku/images/categories fields
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
      sku?: string;
      images?: string[];
      categories?: string[];
      isActive?: boolean;
    },
  ) {
    const p = await this.findOne(id);
    this.logger.log(`Updating product ${id}`);

    if (dto.name !== undefined) p.name = dto.name;
    if (dto.description !== undefined) p.description = dto.description;
    if (dto.price !== undefined) p.price = Number(dto.price);
    if (dto.stock !== undefined) p.stock = Number(dto.stock);
  // The hotel-scoped Product entity does not support sku/images/categories/isActive fields;
  // only update fields that exist on the entity

    await p.save();
    return p;
  }

  async remove(id: string) {
    const p = await this.findOne(id as any);
    await p.destroy();
    return { success: true };
  }
}
