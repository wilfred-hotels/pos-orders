import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { CatalogProduct } from './models/CatalogProduct.model';
import { CreateCatalogProductDto } from './dto/create-product.dto';
import { UpdateCatalogProductDto } from './dto/update-product.dto';
import { FilterProductsDto } from './dto/filter-products.dto';

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);

  constructor(
    @InjectModel(CatalogProduct)
    private readonly productModel: typeof CatalogProduct,
  ) {}

  async create(createProductDto: CreateCatalogProductDto): Promise<CatalogProduct> {
    // Check if SKU already exists
    if (createProductDto.nameCode) {
      const existing = await this.productModel.findOne({
        where: { nameCode: createProductDto.nameCode }
      });
      if (existing) {
        throw new ConflictException(`Product with name code  ${createProductDto.nameCode} already exists`);
      }
    }

    this.logger.log(`Creating new product: ${createProductDto.name}`);
    // initialPriceCents is required now — use it as the canonical price for catalog
    const initialPrice = createProductDto.initialPriceCents;
    // generate a URL-friendly slug from the name (DB requires non-null unique slug)
    const makeSlug = (s: string) =>
      s
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    let slug = createProductDto.name ? makeSlug(createProductDto.name) : `p-${Date.now()}`;
    // ensure uniqueness by appending timestamp if slug already exists
    const existingSlug = await this.productModel.findOne({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }
    try {
      // Create with only initial and final price fields
      return await this.productModel.create({
        name: createProductDto.name,
        slug,
        description: createProductDto.description,
        initialPriceCents: initialPrice,
        finalPriceCents: createProductDto.finalPriceCents ?? initialPrice ?? null,
        stock: createProductDto.stock,
        nameCode: createProductDto.nameCode,
        isVisible: createProductDto.isVisible ?? true,
        images: createProductDto.images,
        categories: createProductDto.categories ?? [],
        isFeatured: createProductDto.isFeatured ?? false,
        brand: createProductDto.brand,
        rating: createProductDto.rating ?? 0,
      } as any);
    } catch (err: any) {
      this.logger.error('Error creating catalog product', err?.stack || err);
      // Surface a clearer error to the API consumer
      throw new ConflictException(`Failed to create product: ${err?.message || 'unknown database error'}`);
    }
  }

  async findAll(filters?: FilterProductsDto): Promise<CatalogProduct[]> {
    // Build the Sequelize `where` clause from filters using the helper to
    // avoid duplicate filter logic and to support categoriesMode ('any'|'all').
    const where: any = this.buildWhereFromFilters(filters);

    this.logger.debug(`Finding products with filters: ${JSON.stringify(filters)}`);
    return this.productModel.findAll({ where, order: [['createdAt', 'DESC']] });
  }

  private buildWhereFromFilters(filters?: FilterProductsDto) {
    const where: any = { isVisible: true };
    if (!filters) return where;

    if (filters.search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${filters.search}%` } },
        { description: { [Op.iLike]: `%${filters.search}%` } },
      ];
    }

    // single category filter behaves like 'contains' (product includes the category)
    if (filters.category) {
      where.categories = { [Op.contains]: [filters.category] };
    }

    if (filters.categories && filters.categories.length > 0) {
      const mode = filters.categoriesMode ?? 'any';
      if (mode === 'all') {
        // product.categories contains all provided categories
        where.categories = { [Op.contains]: filters.categories };
      } else {
        // any: overlap (at least one)
        where.categories = { [Op.overlap]: filters.categories };
      }
    }

    if (filters.brand) where.brand = filters.brand;
    if (filters.isFeatured !== undefined) where.isFeatured = filters.isFeatured;
    return where;
  }

  async findOne(id: string): Promise<CatalogProduct> {
    const product = await this.productModel.findOne({
      where: { id, isVisible: true }
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateCatalogProductDto): Promise<CatalogProduct> {
    const product = await this.productModel.findByPk(id);
    
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Check nameCode uniqueness if it's being updated
    if (updateProductDto.nameCode && updateProductDto.nameCode !== (product as any).nameCode) {
      const existing = await this.productModel.findOne({
        where: { nameCode: updateProductDto.nameCode }
      });
      if (existing) {
        throw new ConflictException(`Product with code ${updateProductDto.nameCode} already exists`);
      }
    }

    this.logger.log(`Updating product ${id}: ${JSON.stringify(updateProductDto)}`);
    // normalize finalPriceCents: if provided leave it, otherwise keep existing
    await product.update(updateProductDto as any);
    return product;
  }

  async remove(id: string): Promise<void> {
    const product = await this.productModel.findByPk(id);
    
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    this.logger.log(`Deleting product ${id}`);
    await product.destroy();
  }

  async getFeaturedProducts(): Promise<CatalogProduct[]> {
    this.logger.debug('Getting featured products');
    return this.productModel.findAll({
      where: {
        isVisible: true,
        isFeatured: true 
      },
      order: [['createdAt', 'DESC']]
    });
  }

  async getProductsByCategory(category: string): Promise<CatalogProduct[]> {
    this.logger.debug(`Getting products for category: ${category}`);
    return this.productModel.findAll({
      where: {
        isVisible: true,
        categories: {
          [Op.contains]: [category]
        }
      },
      order: [['createdAt', 'DESC']]
    });
  }

  async updateStock(id: string, quantity: number): Promise<CatalogProduct> {
    const product = await this.productModel.findByPk(id);
    
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (product.stock + quantity < 0) {
      throw new ConflictException(`Insufficient stock for product ${product.name}`);
    }

    this.logger.log(`Updating stock for product ${id} by ${quantity}`);
    product.stock += quantity;
    await product.save();
    return product;
  }
}
