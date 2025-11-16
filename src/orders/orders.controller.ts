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
  Res,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { OrdersService } from './orders.service';
import { ReceiptsService } from './receipts.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CartService } from '../cart/cart.service';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

/**
 * Orders endpoints (protected). Handles normal checkout, retrieval and receipts.
 */
@ApiTags('Orders')
@ApiBearerAuth('jwt')
@Controller('orders')
@UseGuards(RolesGuard)
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);
  constructor(private ordersService: OrdersService, private cartService: CartService, private receiptsService?: ReceiptsService) { }

  @Post('checkout')
  @Roles('user', 'admin')
  @ApiOperation({ summary: 'Checkout a cart and create an order (authenticated)' })
  @ApiResponse({ status: 201, description: 'Order created', schema: { example: { id: 'order-uuid', code: 'ABCD1', total: 1200, status: 'not paid' } } })
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

  @Post('guest-checkout')
  @ApiOperation({ summary: 'Guest checkout using cartId and guestId (minimal public flow)' })
  @ApiResponse({ status: 201, description: 'Order created (guest)', schema: { example: { id: 'order-uuid', total: 1200, status: 'not paid', contact: { name: 'Guest', phone: '+2547...' } } } })
  async guestCheckout(@Body() body: import('./dto/guest-checkout.dto').GuestCheckoutDto) {
    const { cartId, guestId, contact } = body || {};
    if (!cartId || !guestId) throw new BadRequestException('cartId and guestId are required');

    // fetch cart
    const cart = await this.cartService.getCartById(cartId);
    if (!cart) throw new NotFoundException('Cart not found');
    if (cart.userId !== guestId) throw new ForbiddenException('Cart does not belong to guest');

    const items = (cart.items || []).map((it: any) => ({ productId: it.productId, quantity: it.quantity }));
    if (!items || items.length === 0) throw new BadRequestException('Cart is empty');

    // Create order without an authenticated user (userId = null). Order will keep cartId for traceability.
  const order = await this.ordersService.create(items, 'ecom', undefined, cartId);

    // attach guest contact info for later use (phone/email) and save
    try {
      (order as any).contact = { guestId, ...(contact ?? {}) };
      await (order as any).save();
    } catch (e) {
      // non-fatal
    }

    // mark cart confirmed so it isn't reused
    try {
      cart.status = 'confirmed';
      await cart.save();
    } catch (e) {
      // swallow
    }

    return order;
  }

  @Get()
  @ApiOperation({ summary: 'List all orders (admin)' })
  @ApiResponse({ status: 200, description: 'Array of orders', schema: { example: [{ id: 'order-uuid', code: 'ABCD1', total: 1200, status: 'not paid' }] } })
  list() {
    return this.ordersService.list();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by id' })
  @ApiResponse({ status: 200, description: 'Order object', schema: { example: { id: 'order-uuid', code: 'ABCD1', total: 1200, status: 'not paid', items: [{ productId: 1, quantity: 2 }] } } })
  get(@Param('id') id: string) {
    return this.ordersService.get(id);
  }

  @Get('code/:code')
  async getByCode(@Param('code') code: string) {
    const order = await this.ordersService.findByCode(code);
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  @Get(':id/receipt')
  @ApiOperation({ summary: 'Download order receipt (PDF or HTML)' })
  @ApiResponse({ status: 200, description: 'Receipt file' })
  async receipt(@Param('id') id: string, @Res() res: Response) {
    const order = await this.ordersService.get(id);
    if (!order) throw new NotFoundException('Order not found');

    // receiptsService may be undefined in some test contexts, guard it
    if (!this.receiptsService || !this.receiptsService.renderReceiptPdf) {
      return res.status(501).json({ message: 'Receipt generation not available' });
    }

    const out = await this.receiptsService.renderReceiptPdf(order);
    if (!out) return res.status(500).json({ message: 'Failed to generate receipt' });

    if (out.type === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="receipt-${order.code || order.id}.pdf"`);
      res.send(out.data);
    } else if (out.type === 'html') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="receipt-${order.code || order.id}.html"`);
      res.send(out.data);
    } else {
      res.status(500).json({ message: 'Unsupported receipt format' });
    }
  }
}
