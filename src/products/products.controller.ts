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
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}


  @Get()
  list() {
    return this.productsService.findAll();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
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
    const user = req.user as { role?: string; hotelId?: number } | undefined;
    if (user && user.role === 'manager') {
      const existing = await this.productsService.findOne(+id);
      if (existing.hotelId !== user.hotelId)
        throw new ForbiddenException(
          'Cannot modify products from another hotel',
        );
    }
    return this.productsService.update(+id, dto as any);
  }
}
