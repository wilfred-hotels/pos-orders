import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
  ApiQuery 
} from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { CreateCatalogProductDto } from './dto/create-product.dto';
import { UpdateCatalogProductDto } from './dto/update-product.dto';
import { FilterProductsDto } from './dto/filter-products.dto';
import { CatalogProduct as Product  } from './models/CatalogProduct.model';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('Catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Create a new product in the catalog (Super Admin only)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Product has been created successfully',
    type: Product,
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden - Requires Super Admin role' })
  async create(@Body() createProductDto: CreateCatalogProductDto): Promise<Product> {
    return this.catalogService.create(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all products in the catalog with optional filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the list of products',
    type: [Product],
  })
  @ApiQuery({ type: FilterProductsDto, required: false })
  async findAll(@Query() filters?: FilterProductsDto): Promise<Product[]> {
    return this.catalogService.findAll(filters);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured products' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the list of featured products',
    type: [Product],
  })
  async getFeatured(): Promise<Product[]> {
    return this.catalogService.getFeaturedProducts();
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get products by category' })
  @ApiParam({
    name: 'category',
    description: 'Category name to filter by',
    example: 'coffee',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns products in the specified category',
    type: [Product],
  })
  async getByCategory(@Param('category') category: string): Promise<Product[]> {
    return this.catalogService.getProductsByCategory(category);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific product by ID' })
  @ApiParam({
    name: 'id',
    description: 'Product ID (UUID)',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the product details',
    type: Product,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Product not found' })
  async findOne(@Param('id') id: string): Promise<Product> {
    return this.catalogService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Update a product (Super Admin only)' })
  @ApiParam({
    name: 'id',
    description: 'Product ID (UUID)',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product has been updated successfully',
    type: Product,
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden - Requires Super Admin role' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Product not found' })
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateCatalogProductDto
,
  ): Promise<Product> {
    return this.catalogService.update(id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Delete a product (Super Admin only)' })
  @ApiParam({
    name: 'id',
    description: 'Product ID (UUID)',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product has been deleted successfully',
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden - Requires Super Admin role' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Product not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.catalogService.remove(id);
  }

  @Patch(':id/stock')
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Update product stock (Super Admin only)' })
  @ApiParam({
    name: 'id',
    description: 'Product ID (UUID)',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Stock has been updated successfully',
    type: Product,
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden - Requires Super Admin role' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Product not found' })
  async updateStock(
    @Param('id') id: string,
    @Body('quantity', ParseIntPipe) quantity: number,
  ): Promise<Product> {
    return this.catalogService.updateStock(id, quantity);
  }
}
