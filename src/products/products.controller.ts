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
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('products')
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);
  constructor(private readonly productsService: ProductsService) {}


  @Get()
  list() {
    return this.productsService.findAll();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('manager', 'admin')
  async create(@Body() dto: CreateProductDto, @Req() req: any) {
    const user = req.user as { role?: string; hotelId?: number } | undefined;
    // debug: log the raw body received
    try { console.debug('ProductsController.create received body:', (req as any).body); } catch (e) {}
    if (user && user.role === 'manager') {
      if (!user.hotelId)
        throw new ForbiddenException('Manager must belong to a hotel');
  dto.hotelId = String(user.hotelId);
    }
    return this.productsService.create(dto as any);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('manager', 'admin')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @Req() req: any,
  ) {
  try { this.logger.debug(`ProductsController.update received body: ${JSON.stringify((req as any).body)}`); } catch (e) {}
    const user = req.user as { role?: string; hotelId?: number } | undefined;
    if (user && user.role === 'manager') {
  const existing = await this.productsService.findOne(id);
      if (existing.hotelId !== String(user.hotelId))
        throw new ForbiddenException(
          'Cannot modify products from another hotel',
        );
    }
    const result = await this.productsService.update(id, dto as any);
    try { this.logger.debug(`ProductsController.update result: ${JSON.stringify(result?.toJSON ? result.toJSON() : result)}`); } catch (e) {}
    return result;
  }

  @UseGuards(RolesGuard)
  @Roles('manager', 'admin')
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    const user = req.user as { role?: string; hotelId?: number } | undefined;
    if (user && user.role === 'manager') {
  const existing = await this.productsService.findOne(id);
      if (existing.hotelId !== String(user.hotelId))
        throw new ForbiddenException('Cannot delete products from another hotel');
    }
  return this.productsService.remove(id);
  }
}
