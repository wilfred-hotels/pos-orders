import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { FilterProductsDto } from './dto/filter-products.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('Admin - Products Management')
@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('jwt')
@ApiResponse({ status: 401, description: 'Unauthorized - JWT token is missing or invalid' })
@ApiResponse({ status: 403, description: 'Forbidden - Requires super_admin role' })
export class AdminProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @Roles('super_admin')
  @ApiOperation({ 
    summary: 'Get all products across hotels',
    description: 'Retrieve all products from all hotels with comprehensive filtering options. Only accessible by super admin.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns a paginated list of products with filters applied',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              price: { type: 'number' },
              stock: { type: 'number' },
              hotel: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' }
                }
              }
            }
          }
        },
        metadata: {
          type: 'object',
          properties: {
            totalItems: { type: 'number' },
            itemsPerPage: { type: 'number' },
            currentPage: { type: 'number' },
            totalPages: { type: 'number' },
            hasNextPage: { type: 'boolean' },
            hasPreviousPage: { type: 'boolean' }
          }
        }
      }
    }
  })
  async getAllProducts(@Query() filterDto: FilterProductsDto) {
    return this.productsService.findAllWithFilters(filterDto);
  }
}