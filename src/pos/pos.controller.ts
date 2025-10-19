import { Body, Controller, Post, UseGuards, Req } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { CreateOrderDto } from '../orders/dto/create-order.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('pos')
export class PosController {
  constructor(private ordersService: OrdersService) {}

  @Post('sale')
  @UseGuards(RolesGuard)
  @Roles('cashier', 'manager', 'admin')
  async sale(@Req() req: any, @Body() body: CreateOrderDto) {
    const requesterId = req.user?.id;
    return await this.ordersService.create(body.items, 'pos', requesterId);
  }
}
