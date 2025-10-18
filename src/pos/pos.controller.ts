import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { CreateOrderDto } from '../orders/dto/create-order.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('pos')
export class PosController {
  constructor(private ordersService: OrdersService) {}

  // record a sale from cashier
  @Post('sale')
  @UseGuards(RolesGuard)
  @Roles('cashier', 'manager', 'admin')
  async sale(@Body() body: CreateOrderDto) {
    return await this.ordersService.create(body.items, 'pos');
  }
}
