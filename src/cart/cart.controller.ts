import { Body, Controller, Get, Post, Req, UseGuards, Put, Param, Logger, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Delete } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddItemsDto } from './dto/add-items.dto';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('Cart')
@Controller('cart')
@UseGuards(RolesGuard)
export class CartController {
    private readonly logger = new Logger(CartController.name);
    constructor(private cartService: CartService) { }

    @Get()
    @ApiOperation({ summary: 'Get active cart for a user or guest' })
    @ApiResponse({ status: 200, description: 'Cart payload', schema: { example: { id: 'cart-uuid', userId: 'guest-uuid', status: 'active', items: [{ id: 'item-uuid', productId: 1, quantity: 2, product: { name: 'Pilau', price: 300 } }] } } })
    async getCart(@Req() req: any, @Query('userId') queryUserId?: string) {
        const ip = req.ip || req.headers?.['x-forwarded-for'] || req.connection?.remoteAddress;
        const userId = req.user?.id || queryUserId;
        this.logger.debug(`GET /cart from ${ip} - user=${userId}`);
        if (!userId) {
            this.logger.warn('No userId found in request (missing JWT or ?userId query)');
            throw new BadRequestException('No userId found (provide JWT or ?userId=...)');
        }
        return this.cartService.getCart(userId);
    }

    @Post('items')
    @ApiOperation({ summary: 'Add items to cart (guest or user)' })
    @ApiBody({ type: AddItemsDto })
    @ApiResponse({ status: 200, description: 'Updated cart', schema: { example: { id: 'cart-uuid', userId: 'guest-uuid', items: [{ id: 'item-uuid', productId: 1, quantity: 2 }] } } })
    async addItems(@Req() req: any, @Body() body: AddItemsDto) {
        const ip = req.ip || req.headers?.['x-forwarded-for'] || req.connection?.remoteAddress;
      const userId = body.userId 
        this.logger.debug(`POST /cart/items from ${ip} - user=${userId}`);
        try { this.logger.debug(`body: ${JSON.stringify(body)}`); } catch (e) { this.logger.debug('body: [unstringifiable]'); }
        if (!userId) {
            this.logger.warn('No userId found in request (missing JWT or userId in body)');
            throw new BadRequestException('No userId found (provide JWT or userId in body)');
        }
    const items = (body as any)?.items ?? [];
        try {
            return await this.cartService.addItems(userId, items);
        } catch (e: any) {
            // convert service errors to proper HTTP exceptions if not already
            if (e.status && e.response) throw e;
            throw new BadRequestException(e?.message ?? 'Unable to add items to cart');
        }
    }

    @Post('checkout')
    @ApiOperation({ summary: 'Checkout the active cart and create an order (guest or user)' })
    @ApiResponse({ status: 201, description: 'Order created from cart' })
    async checkout(@Req() req: any, @Body() body?: { userId?: string, source?: 'ecom' | 'pos' }) {
        const ip = req.ip || req.headers?.['x-forwarded-for'] || req.connection?.remoteAddress;
        const userId = req.user?.id || body?.userId || undefined;
        this.logger.debug(`POST /cart/checkout from ${ip} - user=${userId}`);
        if (!userId) {
            this.logger.warn('No userId found in request (missing JWT or userId in body)');
            throw new BadRequestException('No userId found (provide JWT or userId in body)');
        }
        const source = body?.source ?? 'ecom';
        try {
            const order = await this.cartService.checkout(userId, { source });
            return order;
        } catch (e: any) {
            this.logger.error('Checkout failed', e?.message ?? e);
            throw e;
        }
    }


    @Put('items/:itemId')
    @ApiOperation({ summary: 'Update quantity for a cart item' })
    @ApiResponse({ status: 200, description: 'Updated item', schema: { example: { id: 'item-uuid', productId: 1, quantity: 3 } } })
    async updateItem(
        @Req() req: any,
        @Body() body: { quantity: number },
        @Param('itemId') itemId: string,
        @Query('userId') queryUserId?: string
    ) {
        const ip = req.ip || req.headers?.['x-forwarded-for'] || req.connection?.remoteAddress;
        const userId = req.user?.id || queryUserId;
        this.logger.debug(`PUT /cart/items/${itemId} from ${ip} - user=${userId}`);
        try { this.logger.debug(`body: ${JSON.stringify(body)}`); } catch (e) { this.logger.debug('body: [unstringifiable]'); }
        if (!userId) {
            this.logger.warn('No userId found in request (missing JWT or ?userId query)');
            throw new BadRequestException('No userId found (provide JWT or ?userId=...)');
        }
        return this.cartService.updateItemQuantity(userId, itemId, body.quantity);
    }

    @Delete('items/:itemId')
    @ApiOperation({ summary: 'Delete an item from the cart' })
    @ApiResponse({ status: 200, description: 'Deletion result', schema: { example: { success: true } } })
    async deleteItem(@Req() req: any, @Param('itemId') itemId: string, @Body() body?: { userId?: string }) {
        const ip = req.ip || req.headers?.['x-forwarded-for'] || req.connection?.remoteAddress;
        const userId = req.user?.id || body?.userId || undefined;
        this.logger.debug(`DELETE /cart/items/${itemId} from ${ip} - user=${userId}`);
        if (!userId) {
            this.logger.warn('No userId found in request (missing JWT or userId in body)');
            throw new Error('No userId found (provide JWT or userId in body)');
        }
        try { const result = await this.cartService.removeItem(userId, itemId); return result; } catch (e: any) { throw e; }
    }
}
