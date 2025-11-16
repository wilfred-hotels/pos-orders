import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  UseGuards,
  Req,
  ForbiddenException,
  Delete,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './product.model';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('Products - Catalog Operations')
@Controller('products')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('jwt')
@ApiResponse({ status: 401, description: 'Unauthorized - JWT token is missing or invalid' })
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);
  constructor(private readonly productsService: ProductsService) {}


  @Get()
  @ApiOperation({ summary: 'List all products in catalog' })
  @ApiResponse({ 
    status: 200, 
    description: 'Array of catalog products',
    type: [Product]
  })
  async list() {
    return this.productsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product details by ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Product details',
    type: Product
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  @ApiOperation({ summary: 'Create a new product (Super Admin only)' })
  @ApiBody({ type: CreateProductDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Product created successfully',
    type: Product
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires Super Admin role' })
  async create(@Body() dto: CreateProductDto, @Req() req: any) {
    const user = req.user as { role?: string } | undefined;
    
    if (!user || user.role !== 'super_admin') {
      throw new ForbiddenException('Only Super Admin can create catalog products');
    }

    this.logger.log(`Super Admin creating new product: ${dto.name}`);
    return this.productsService.create(dto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  @ApiOperation({ summary: 'Update a product (Super Admin only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Product updated successfully',
    type: Product
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires Super Admin role' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @Req() req: any,
  ) {
    const user = req.user as { role?: string } | undefined;
    
    if (!user || user.role !== 'super_admin') {
      throw new ForbiddenException('Only Super Admin can update catalog products');
    }

    this.logger.log(`Super Admin updating product ${id}`);
    const result = await this.productsService.update(id, dto);
    return result;
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  @ApiOperation({ summary: 'Delete a product (Super Admin only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Product deleted successfully' 
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires Super Admin role' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const user = req.user as { role?: string } | undefined;
    
    if (!user || user.role !== 'super_admin') {
      throw new ForbiddenException('Only Super Admin can delete catalog products');
    }

    this.logger.log(`Super Admin deleting product ${id}`);
    return this.productsService.remove(id);
  }
}
