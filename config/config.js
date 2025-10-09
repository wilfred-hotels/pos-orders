module.exports = {
  development: {
    username: process.env.DB_USER || 'wilfred',
    password: process.env.DB_PASS || 'williy8615.',
    database: process.env.DB_NAME || 'pos-orders',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
  },
  test: {
    username: process.env.DB_USER || 'wilfred',
    password: process.env.DB_PASS || 'williy8615.',
    database: process.env.DB_NAME || 'pos-orders-test',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
  },
  production: {
    username: process.env.DB_USER || 'wilfred',
    password: process.env.DB_PASS || 'williy8615.',
    database: process.env.DB_NAME || 'pos-orders',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
  },
};
