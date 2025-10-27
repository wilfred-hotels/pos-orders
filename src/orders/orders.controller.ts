import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  Logger,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CartService } from '../cart/cart.service';

@Controller('orders')
@UseGuards(RolesGuard)
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);
  constructor(private ordersService: OrdersService, private cartService: CartService) { }

  @Post('checkout')
  @Roles('user', 'admin')
  async checkout(
    @Req() req: any,
    @Body() body: { cartId: string; userId: string },
  ) {
    const ip = req.ip || req.headers?.['x-forwarded-for'] || req.connection?.remoteAddress;
    this.logger.debug(`POST /orders/checkout from ${ip} - user=${req.user?.id}`);
    this.logger.debug(`the request is =${req}`);

    try { this.logger.debug(`body: ${JSON.stringify(body)}`); } catch (e) { this.logger.debug('body: [unstringifiable]'); }

    const cartId = body?.cartId;
    const userId = body?.userId;

    if (!cartId || !userId) throw new ForbiddenException('cartId and userId are required');

    // ensure authenticated user matches the provided userId unless admin
    const requesterId = req.user?.id;
    const requesterRole = req.user?.role;
    if (!requesterId) throw new ForbiddenException('Not authenticated');
    if (requesterRole !== 'admin' && requesterId !== userId) throw new ForbiddenException('Cannot checkout for another user');

    // fetch cart and items
    const cart = await this.cartService.getCartById(cartId);
    if (!cart) throw new ForbiddenException('Cart not found');
    if (cart.userId !== userId) throw new ForbiddenException('Cart does not belong to user');

    const items = (cart.items || []).map((it: any) => ({ productId: it.productId, quantity: it.quantity }));
    if (!items || items.length === 0) throw new ForbiddenException('Cart is empty');

  // persist the requester id on the order so we know who placed it
  const order = await this.ordersService.create(items, 'ecom', requesterId, cartId);

    // mark cart as confirmed
    try {
      cart.status = 'confirmed';
      await cart.save();
    } catch (e) {
      this.logger.warn('Failed to mark cart confirmed: ' + e?.message);
    }

    return order;
  }

  @Get()
  list() {
    return this.ordersService.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.ordersService.get(id);
  }
}
