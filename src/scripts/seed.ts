import { Sequelize } from 'sequelize-typescript';
import { Product } from '../entities/product.entity';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';

async function run() {
  const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USER ?? 'wilfred',
    password: process.env.DB_PASS ?? 'williy8615.',
    database: process.env.DB_NAME ?? 'pos-orders',
  models: [Product, Order, OrderItem],
    logging: false,
  } as any);

  // ensure connection (do not sync or alter schema here)
  await sequelize.authenticate();

  const count = await Product.count();
  if (count === 0) {
    console.log('Seeding products...');
    await Product.bulkCreate([
      { name: 'T-Shirt', description: 'Comfortable cotton', price: 15, stock: 50 },
      { name: 'Coffee Mug', description: 'Ceramic mug', price: 8, stock: 30 },
      { name: 'Sticker Pack', description: 'Fun stickers', price: 4, stock: 100 },
    ] as any);
    console.log('Seeding complete');
  } else {
    console.log(`Products table already has ${count} rows - skipping seed.`);
  }

  await sequelize.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
