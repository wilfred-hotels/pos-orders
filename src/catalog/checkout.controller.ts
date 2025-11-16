import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';

/**
 * Public checkout endpoint for catalog products (guest checkout)
 */
@ApiTags('Catalog')
@Controller('catalog')
export class CatalogCheckoutController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  @ApiOperation({ summary: 'Guest checkout for a catalog product' })
  @ApiBody({ schema: { example: { catalogProductId: 'uuid', quantity: 1, contact: { name: 'Alice', phone: '+2547...' } } } })
  @ApiResponse({ status: 200, description: 'Order created', schema: { example: { success: true, orderId: 'order-uuid', order: { id: 'order-uuid', total: 1200, status: 'not paid' } } } })
  async guestCheckout(@Body() body: { catalogProductId: string; quantity?: number; contact?: any; userId?: string }) {
    const { catalogProductId, quantity = 1, contact, userId } = body || {};
    if (!catalogProductId) throw new BadRequestException('catalogProductId is required');

    const order = await this.ordersService.createCatalogOrder(catalogProductId, quantity, contact, userId);
    return { success: true, orderId: order?.id, order };
  }
}
