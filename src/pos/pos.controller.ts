import { Body, Controller, Post, UseGuards, Req } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { CreateOrderDto } from '../orders/dto/create-order.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

@ApiTags('POS')
@Controller('pos')
export class PosController {
  constructor(private ordersService: OrdersService) {}

  @Post('sale')
  @UseGuards(RolesGuard)
  @Roles('cashier', 'manager', 'admin')
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Create a POS sale (authenticated cashier/manager/admin)' })
  @ApiResponse({ status: 201, description: 'Created order', schema: { example: { id: 'order-uuid', total: 800, status: 'not paid' } } })
  async sale(@Req() req: any, @Body() body: CreateOrderDto) {
    const requesterId = req.user?.id;
    return await this.ordersService.create(body.items, 'pos', requesterId);
  }
}
