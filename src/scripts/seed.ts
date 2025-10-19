import { Sequelize } from 'sequelize-typescript';
import { Product } from '../entities/product.entity';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Hotel } from '../entities/hotel.entity';
import { User } from '../auth/user.entity';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { RevokedToken } from '../auth/revoked-token.entity';
import * as bcrypt from 'bcryptjs';

// Load .env so DB_* env vars are available when running via ts-node
try {
  require('dotenv').config();
} catch (e) {}

/**
 * Comprehensive seeder: ensures at least N records exist for each model.
 * Use: npm run db:seed
 */
const MIN = 10;

async function run() {
  // For development prefer DB_* env vars; fall back to DATABASE_URL otherwise
  const isDev = process.env.NODE_ENV === 'development' || Boolean(process.env.DB_USER);
  const databaseUrl = process.env.DATABASE_URL;
  const sequelize = isDev
    ? new Sequelize({
        dialect: 'postgres',
        host: process.env.DB_HOST ?? 'localhost',
        port: Number(process.env.DB_PORT ?? 5432),
        username: process.env.DB_USER ?? 'wilfred',
        password: process.env.DB_PASS ?? undefined,
        database: process.env.DB_NAME ?? 'pos-orders',
        models: [Hotel, User, Product, Order, OrderItem, Cart, CartItem, RevokedToken],
        logging: false,
      } as any)
    : databaseUrl
    ? new Sequelize(databaseUrl, {
        dialect: 'postgres',
        models: [Hotel, User, Product, Order, OrderItem, Cart, CartItem, RevokedToken],
        logging: false,
      } as any)
    : new Sequelize({
        dialect: 'postgres',
        host: process.env.DB_HOST ?? 'localhost',
        port: Number(process.env.DB_PORT ?? 5432),
        username: process.env.DB_USER ?? 'wilfred',
        password: process.env.DB_PASS ?? undefined,
        database: process.env.DB_NAME ?? 'pos-orders',
        models: [Hotel, User, Product, Order, OrderItem, Cart, CartItem, RevokedToken],
        logging: false,
      } as any);

  await sequelize.authenticate();

  // HOTELS
  const hotelCount = await Hotel.count();
  if (hotelCount < MIN) {
    const toCreate = MIN - hotelCount;
    const HOTEL_IMAGES = new Array(toCreate).fill(0).map((_, i) => `https://picsum.photos/seed/hotel${i}/800/400`);
    const HOTELS: any[] = [];
    for (let i = 0; i < toCreate; i++) {
      HOTELS.push({
        name: `Hotel ${hotelCount + i + 1}`,
        address: `${100 + i} Example St`,
        city: ['Nairobi', 'Kigali', 'Lagos', 'Accra', 'Kampala', 'Dar es Salaam', 'Kigali', 'Nairobi', 'Lusaka', 'Harare'][i % 10],
        country: ['Kenya', 'Rwanda', 'Nigeria', 'Ghana', 'Uganda', 'Tanzania', 'Rwanda', 'Kenya', 'Zambia', 'Zimbabwe'][i % 10],
        phone: `+25470000${100 + i}`,
        openingTime: '07:00',
        closingTime: '23:00',
        imageUrl: HOTEL_IMAGES[i],
        description: `Sample description for Hotel ${hotelCount + i + 1}`,
        workersCount: 5 + i,
      });
    }
    await Hotel.bulkCreate(HOTELS as any);
    console.log(`Seeded ${toCreate} hotels`);
  } else console.log(`Hotels: ${hotelCount} rows present`);

  // USERS
  const userCount = await User.count();
  if (userCount < MIN) {
    const toCreate = MIN - userCount;
    const roles = ['customer', 'customer', 'customer', 'customer', 'customer', 'cashier', 'cashier', 'manager', 'admin', 'admin'];
    const hotels = await Hotel.findAll();
    const USERS: any[] = [];
    for (let i = 0; i < toCreate; i++) {
      const username = `user${userCount + i + 1}`;
      const password = await bcrypt.hash('password', 8);
      const role = roles[i % roles.length];
      const hotelId = role === 'customer' ? null : hotels[(i) % hotels.length]?.id ?? null;
      USERS.push({ username, password, role, hotelId } as any);
    }
    await User.bulkCreate(USERS as any);
    console.log(`Seeded ${toCreate} users`);
  } else console.log(`Users: ${userCount} rows present`);

  // PRODUCTS
  const productCount = await Product.count();
  if (productCount < MIN) {
    const toCreate = MIN - productCount;
    const hotels = await Hotel.findAll();
    const PRODUCT_TEMPLATES = [
      { name: 'Espresso', description: 'Rich espresso', price: 3.5, stock: 50 },
      { name: 'Orange Juice', description: 'Fresh juice', price: 4.0, stock: 30 },
      { name: 'Club Sandwich', description: 'Grilled sandwich', price: 10.5, stock: 12 },
      { name: 'Cheeseburger', description: 'Beef burger', price: 12.0, stock: 8 },
      { name: 'Chocolate Cake', description: 'Cake slice', price: 6.5, stock: 6 },
    ];
    const PRODUCTS: any[] = [];
    for (let i = 0; i < toCreate; i++) {
      const template = PRODUCT_TEMPLATES[i % PRODUCT_TEMPLATES.length];
      PRODUCTS.push({ ...template, hotelId: hotels[i % hotels.length]?.id ?? null, image: `https://picsum.photos/seed/product${i}/400/300` });
    }
    await Product.bulkCreate(PRODUCTS as any);
    console.log(`Seeded ${toCreate} products`);
  } else console.log(`Products: ${productCount} rows present`);

  // CARTS
  const cartCount = await Cart.count();
  const users = await User.findAll({ limit: 50 });
  if (cartCount < MIN) {
    const toCreate = MIN - cartCount;
    const CARTS: any[] = [];
    for (let i = 0; i < toCreate; i++) {
      const user = users[i % users.length];
      CARTS.push({ userId: user.id, status: 'active' } as any);
    }
    await Cart.bulkCreate(CARTS as any);
    console.log(`Seeded ${toCreate} carts`);
  } else console.log(`Carts: ${cartCount} rows present`);

  // CART ITEMS
  const cartItemCount = await CartItem.count();
  const products = await Product.findAll({ limit: 50 });
  const carts = await Cart.findAll({ limit: 50 });
  if (cartItemCount < MIN && carts.length > 0 && products.length > 0) {
    const toCreate = MIN - cartItemCount;
    const ITEMS: any[] = [];
    for (let i = 0; i < toCreate; i++) {
      const cart = carts[i % carts.length];
      const product = products[i % products.length];
      ITEMS.push({ cartId: cart.id, productId: product.id, quantity: (i % 3) + 1 } as any);
    }
    await CartItem.bulkCreate(ITEMS as any);
    console.log(`Seeded ${toCreate} cart items`);
  } else console.log(`CartItems: ${cartItemCount} rows present`);

  // ORDERS + ORDER ITEMS
  const orderCount = await Order.count();
  if (orderCount < MIN && products.length > 0) {
    const toCreate = MIN - orderCount;
    const ORDERS: any[] = [];
    const usersAll = await User.findAll({ limit: 50 });
    for (let i = 0; i < toCreate; i++) {
      const source = i % 2 === 0 ? 'pos' : 'ecom';
      const user = source === 'ecom' ? usersAll[i % usersAll.length] : usersAll.find((u) => u.role && u.role !== 'customer') ?? usersAll[i % usersAll.length];
      ORDERS.push({ total: 0, source, userId: user?.id ?? null } as any);
    }
    const created = await Order.bulkCreate(ORDERS as any, { returning: true } as any);
    const ORDER_ITEMS: any[] = [];
    for (let i = 0; i < created.length; i++) {
      const order = created[i];
      const num = 1 + (i % 3);
      let total = 0;
      for (let j = 0; j < num; j++) {
        const prod = products[(i + j) % products.length];
        const qty = ((i + j) % 3) + 1;
        ORDER_ITEMS.push({ orderId: order.id, productId: prod.id, quantity: qty } as any);
        total += prod.price * qty;
      }
      order.total = total;
      await order.save();
    }
    if (ORDER_ITEMS.length) await OrderItem.bulkCreate(ORDER_ITEMS as any);
    console.log(`Seeded ${toCreate} orders and ${ORDER_ITEMS.length} order items`);
  } else console.log(`Orders: ${orderCount} rows present`);

  // REVOKED TOKENS
  const revokedCount = await RevokedToken.count();
  if (revokedCount < 3) {
    const toCreate = 3 - revokedCount;
    const RT: any[] = [];
    for (let i = 0; i < toCreate; i++) {
      RT.push({ token: `revoked-sample-${Date.now()}-${i}`, expiresAt: new Date(Date.now() + 1000 * 60 * 60) } as any);
    }
    await RevokedToken.bulkCreate(RT as any);
    console.log(`Seeded ${toCreate} revoked tokens`);
  } else console.log(`RevokedTokens: ${revokedCount} rows present`);

  await sequelize.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
