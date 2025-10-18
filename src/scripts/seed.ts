import { Sequelize } from 'sequelize-typescript';
import { Product } from '../entities/product.entity';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Hotel } from '../entities/hotel.entity';
import { User } from '../auth/user.entity';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import * as bcrypt from 'bcryptjs';

async function run() {
  const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USER ?? 'wilfred',
    password: process.env.DB_PASS ?? 'williy8615.',
    database: process.env.DB_NAME ?? 'pos-orders',
  models: [Hotel, User, Product, Order, OrderItem, Cart, CartItem],
    logging: false,
  } as any);

  // ensure connection (do not sync or alter schema here)
  await sequelize.authenticate();

  // We'll create products per hotel later so skip global product seeding here
  const count = await Product.count();
  if (count > 0) console.log(`Products table already has ${count} rows - skipping global seeding.`);

  // Ensure at least 10 hotels
  const hotelCount = await Hotel.count();
  let hotels = await Hotel.findAll();
  if (hotelCount < 10) {
    const toCreate = 10 - hotelCount;
    const HOTELS = [] as any[];
    const HOTEL_IMAGES = [
      'https://images.unsplash.com/photo-1501117716987-c8e9f9f3efc4?q=80&w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1501117716988-abc1f9a1e2b3?q=80&w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1501117716990-00a1a2b3c4d5?q=80&w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1501117716992-11a2b3c4d5e6?q=80&w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1501117716994-22a3b4c5d6e7?q=80&w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1501117716996-33a4b5c6d7e8?q=80&w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1501117716998-44a5b6c7d8e9?q=80&w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1501117717000-55a6b7c8d9f0?q=80&w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1501117717002-66a7b8c9d0e1?q=80&w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1501117717004-77a8b9c0d1e2?q=80&w=1600&auto=format&fit=crop',
    ];

    for (let i = 1; i <= toCreate; i++) {
      const index = (hotelCount + i - 1) % HOTEL_IMAGES.length;
      HOTELS.push({
        name: `Hotel ${hotelCount + i}`,
        address: `${100 + i} Example St`,
        city: ['Nairobi', 'Kigali', 'Lagos', 'Accra', 'Kampala', 'Dar es Salaam', 'Kigali', 'Nairobi', 'Lusaka', 'Harare'][i % 10],
        country: ['Kenya', 'Rwanda', 'Nigeria', 'Ghana', 'Uganda', 'Tanzania', 'Rwanda', 'Kenya', 'Zambia', 'Zimbabwe'][i % 10],
        phone: `+25470000${100 + i}`,
        openingTime: '07:00',
        closingTime: '23:00',
        imageUrl: HOTEL_IMAGES[index],
        description: `Sample description for Hotel ${hotelCount + i}`,
        workersCount: 10 + i,
      });
    }
    await Hotel.bulkCreate(HOTELS);
    hotels = await Hotel.findAll();
    console.log(`Seeded ${toCreate} hotels`);
  } else {
    console.log(`Hotels table has ${hotelCount} rows - skipping seed.`);
  }

  // Create products per hotel (3 per hotel) if not already present per hotel
  const existingProducts = await Product.count();
  if (existingProducts === 0) {
    console.log('Seeding products per hotel...');
    const PRODUCT_TEMPLATES = [
      { name: 'Espresso', description: 'Rich single-shot espresso', price: 3.5, stock: 50, image: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=1600&auto=format&fit=crop' },
      { name: 'Orange Juice', description: 'Fresh orange juice', price: 4.0, stock: 30, image: 'https://images.unsplash.com/photo-1582719478413-654f7c7d8a8b?q=80&w=1600&auto=format&fit=crop' },
      { name: 'Club Sandwich', description: 'Grilled chicken sandwich', price: 10.5, stock: 12, image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=1600&auto=format&fit=crop' },
      { name: 'Cheeseburger', description: 'Beef patty with cheese', price: 12.0, stock: 8, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1600&auto=format&fit=crop' },
      { name: 'Chocolate Cake', description: 'Decadent chocolate cake slice', price: 6.5, stock: 6, image: 'https://images.unsplash.com/photo-1542826438-0c6bfb0b6c1f?q=80&w=1600&auto=format&fit=crop' },
      { name: 'Mineral Water', description: 'Sparkling water (500ml)', price: 2.5, stock: 100, image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=1600&auto=format&fit=crop' },
      { name: 'House Red Wine', description: 'Glass of house red', price: 8.0, stock: 20, image: 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?q=80&w=1600&auto=format&fit=crop' },
      { name: 'Beer', description: 'Local lager (330ml)', price: 5.0, stock: 24, image: 'https://images.unsplash.com/photo-1542444459-db8d0f2f6b0e?q=80&w=1600&auto=format&fit=crop' },
      { name: 'Fruit Platter', description: 'Assorted seasonal fruit', price: 9.0, stock: 5, image: 'https://images.unsplash.com/photo-1496317899792-9d7dbcd928a1?q=80&w=1600&auto=format&fit=crop' },
      { name: 'Crispy Chips', description: 'Salted potato chips pack', price: 2.0, stock: 40, image: 'https://images.unsplash.com/photo-1505577058444-a3dab4be4f2a?q=80&w=1600&auto=format&fit=crop' },
    ];

    const PRODUCTS_TO_CREATE: any[] = [];
    for (let i = 0; i < hotels.length; i++) {
      const hotel = hotels[i];
      // pick 3 templates per hotel with offset
      for (let j = 0; j < 3; j++) {
        const template = PRODUCT_TEMPLATES[(i * 3 + j) % PRODUCT_TEMPLATES.length];
        PRODUCTS_TO_CREATE.push({ ...template, hotelId: hotel.id });
      }
    }
    await Product.bulkCreate(PRODUCTS_TO_CREATE as any);
    console.log(`Seeded ${PRODUCTS_TO_CREATE.length} products across ${hotels.length} hotels`);
  } else {
    console.log(`Products table has ${existingProducts} rows - skipping per-hotel product seed.`);
  }

  // Ensure at least 10 users with varied roles
  const userCount = await User.count();
  if (userCount < 10) {
    const roles = ['customer', 'customer', 'customer', 'customer', 'customer', 'cashier', 'cashier', 'cashier', 'manager', 'admin'];
    const USERS = [] as any[];
    for (let i = 0; i < 10; i++) {
      const username = `user${userCount + i + 1}`;
      const password = await bcrypt.hash('password', 10);
      // assign hotel to staff only
      const role = roles[i] || 'customer';
      const hotelId = role === 'customer' ? null : hotels[Math.floor(Math.random() * hotels.length)].id;
      USERS.push({ username, password, role, hotelId } as any);
    }
    await User.bulkCreate(USERS as any);
    console.log('Seeded users (10)');
  } else {
    console.log(`Users table has ${userCount} rows - skipping seed.`);
  }

  // Refresh users and products lists
  const users = await User.findAll({ limit: 50 });
  const products = await Product.findAll({ limit: 50 });

  // Ensure at least 10 carts (one per user up to 10)
  const cartCount = await Cart.count();
  if (cartCount < 10) {
    const toCreate = 10 - cartCount;
    const CARTS = [] as any[];
    for (let i = 0; i < toCreate; i++) {
      const user = users[i % users.length];
      CARTS.push({ userId: user.id, status: 'active' });
    }
    await Cart.bulkCreate(CARTS as any);
    console.log(`Seeded ${toCreate} carts`);
  } else {
    console.log(`Carts table has ${cartCount} rows - skipping seed.`);
  }

  const carts = await Cart.findAll({ limit: 50 });

  // Ensure at least 10 cart items
  const cartItemCount = await CartItem.count();
  if (cartItemCount < 10) {
    const toCreate = 10 - cartItemCount;
    const ITEMS = [] as any[];
    for (let i = 0; i < toCreate; i++) {
      const cart = carts[i % carts.length];
      const product = products[i % products.length];
      ITEMS.push({ cartId: cart.id, productId: product.id, quantity: (i % 3) + 1 } as any);
    }
    await CartItem.bulkCreate(ITEMS as any);
    console.log(`Seeded ${toCreate} cart items`);
  } else {
    console.log(`Cart items table has ${cartItemCount} rows - skipping seed.`);
  }

  // Ensure at least 10 orders and order items
  const orderCount = await Order.count();
  if (orderCount < 10) {
    const toCreate = 10 - orderCount;
    const ORDERS = [] as any[];
    for (let i = 0; i < toCreate; i++) {
      const source = i % 2 === 0 ? 'pos' : 'ecom';
      const total = 0; // calculate after items
      ORDERS.push({ total, source } as any);
    }
    const createdOrders = await Order.bulkCreate(ORDERS as any, { returning: true } as any);
    const ORDER_ITEMS = [] as any[];
    for (let i = 0; i < createdOrders.length; i++) {
      const order = createdOrders[i];
      // add 1-3 items
      const numItems = 1 + (i % 3);
      let orderTotal = 0;
      for (let j = 0; j < numItems; j++) {
        const product = products[(i + j) % products.length];
        const qty = ((i + j) % 3) + 1;
        ORDER_ITEMS.push({ orderId: order.id, productId: product.id, quantity: qty } as any);
        orderTotal += product.price * qty;
      }
      // update order total
      order.total = orderTotal;
      await order.save();
    }
    if (ORDER_ITEMS.length > 0) await OrderItem.bulkCreate(ORDER_ITEMS as any);
    console.log(`Seeded ${toCreate} orders and ${ORDER_ITEMS.length} order items`);
  } else {
    console.log(`Orders table has ${orderCount} rows - skipping seed.`);
  }

  await sequelize.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
