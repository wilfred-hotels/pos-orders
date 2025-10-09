import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post('checkout')
  checkout(@Body() body: CreateOrderDto) {
    return this.ordersService.create(body.items, 'ecom');
  }

  @Get()
  list() {
    return this.ordersService.list();
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.get(id);
  }
}
