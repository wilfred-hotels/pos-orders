import { Body, Controller, Get, Post, Req, UseGuards, Put, Param, Logger, Query, BadRequestException } from '@nestjs/common';
import { Delete } from '@nestjs/common';
import { CartService } from './cart.service';
import { RolesGuard } from '../auth/roles.guard';

@Controller('cart')
@UseGuards(RolesGuard)
export class CartController {
    private readonly logger = new Logger(CartController.name);
    constructor(private cartService: CartService) { }

    @Get()
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
    async addItems(@Req() req: any, @Body() body: { items: { productId: string; quantity: number }[], userId?: string }) {
        const ip = req.ip || req.headers?.['x-forwarded-for'] || req.connection?.remoteAddress;
        const userId = req.user?.id || body?.userId;
        this.logger.debug(`POST /cart/items from ${ip} - user=${userId}`);
        try { this.logger.debug(`body: ${JSON.stringify(body)}`); } catch (e) { this.logger.debug('body: [unstringifiable]'); }
        if (!userId) {
            this.logger.warn('No userId found in request (missing JWT or userId in body)');
            throw new BadRequestException('No userId found (provide JWT or userId in body)');
        }
        const items = body?.items ?? [];
        try {
            return await this.cartService.addItems(userId, items);
        } catch (e: any) {
            // convert service errors to proper HTTP exceptions if not already
            if (e.status && e.response) throw e;
            throw new BadRequestException(e?.message ?? 'Unable to add items to cart');
        }
    }


    @Put('items/:itemId')
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
