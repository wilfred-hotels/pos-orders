import { Body, Controller, Post } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { CreateOrderDto } from '../orders/dto/create-order.dto';

@Controller('pos')
export class PosController {
  constructor(private ordersService: OrdersService) {}

  // record a sale from cashier
  @Post('sale')
  async sale(@Body() body: CreateOrderDto) {
    return await this.ordersService.create(body.items, 'pos');
  }
}
