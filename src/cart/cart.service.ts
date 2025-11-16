import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { Product } from '../entities/product.entity';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart) private cartModel: typeof Cart,
    @InjectModel(CartItem) private cartItemModel: typeof CartItem,
    @InjectModel(Product) private productModel: typeof Product,
    @Inject(forwardRef(() => OrdersService)) private ordersService?: OrdersService,
  ) {}

  async getOrCreateCart(userId: string) {
    let cart = await this.cartModel.findOne({ where: { userId, status: 'active' }, include: [{ model: CartItem, include: [Product] }] });
    if (!cart) {
      cart = await this.cartModel.create({ userId, status: 'active' } as any);
    }
    return cart;
  }

  async getCartById(cartId: string) {
    return this.cartModel.findOne({ where: { id: cartId }, include: [{ model: CartItem, include: [Product] }] });
  }

  async addItems(userId: string, items: { productId: string; quantity: number }[]) {
    if (!Array.isArray(items)) throw new BadRequestException('items must be an array');
    const cart = await this.getOrCreateCart(userId);
    for (const item of items) {
      await this.cartItemModel.create({ cartId: cart.id, productId: item.productId, quantity: item.quantity } as any);
    }
    return this.cartModel.findOne({ where: { id: cart.id }, include: [{ model: CartItem, include: [Product] }] });
  }


  async updateItemQuantity(userId: string, itemId: string, quantity: number) {
    const cart = await this.cartModel.findOne({ where: { userId, status: 'active' } });
    if (!cart) throw new NotFoundException('No active cart');
    const item = await this.cartItemModel.findOne({ where: { id: itemId, cartId: cart.id } });
    if (!item) throw new NotFoundException('Cart item not found');
    item.quantity = quantity;
    await item.save();
    return item;
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await this.cartModel.findOne({ where: { userId, status: 'active' } });
    if (!cart) throw new NotFoundException('No active cart');
    const item = await this.cartItemModel.findOne({ where: { id: itemId, cartId: cart.id } });
    if (!item) throw new NotFoundException('Cart item not found');
    await item.destroy();
    return { success: true };
  }

  async getCart(userId: string) {
    return this.cartModel.findOne({ where: { userId, status: 'active' }, include: [{ model: CartItem, include: [Product] }] });
  }

  async checkout(userId: string, opts?: { source?: 'ecom' | 'pos' }) {
    // get active cart
    const cart = await this.getOrCreateCart(userId);
    if (!cart) throw new NotFoundException('No active cart');

    const items = (cart as any).cartItems?.map((it: any) => ({ productId: it.productId, quantity: it.quantity })) || [];
    if (!items || items.length === 0) throw new BadRequestException('Cart is empty');

    if (!this.ordersService) throw new BadRequestException('Orders service not available');

    // create the order (OrdersService will handle stock reductions)
    const order = await this.ordersService.create(items, opts?.source ?? 'ecom', userId, cart.id);

    // mark cart as completed
    cart.status = 'completed';
    await (cart as any).save();

    return order;
  }
}
