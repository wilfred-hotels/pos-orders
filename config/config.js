const useDatabaseUrl = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.length > 0);

const sslOptions = process.env.DB_SSL === 'false' ? false : { require: true, rejectUnauthorized: false };

module.exports = {
  development: useDatabaseUrl
    ? {
        use_env_variable: 'DATABASE_URL',
        dialect: 'postgres',
        dialectOptions: {
          ssl: sslOptions,
        },
      }
    : {
        username: process.env.DB_USER || 'wilfred',
        password: process.env.DB_PASS || 'williy8615.',
        database: process.env.DB_NAME || 'pos-orders',
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        dialect: 'postgres',
      },
  test: useDatabaseUrl
    ? {
        use_env_variable: 'DATABASE_URL',
        dialect: 'postgres',
        dialectOptions: {
          ssl: sslOptions,
        },
      }
    : {
        username: process.env.DB_USER || 'wilfred',
        password: process.env.DB_PASS || 'williy8615.',
        database: process.env.DB_NAME || 'pos-orders-test',
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        dialect: 'postgres',
      },
  production: useDatabaseUrl
    ? {
        use_env_variable: 'DATABASE_URL',
        dialect: 'postgres',
        dialectOptions: {
          ssl: sslOptions,
        },
      }
    : {
        username: process.env.DB_USER || 'wilfred',
        password: process.env.DB_PASS || 'williy8615.',
        database: process.env.DB_NAME || 'pos-orders',
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        dialect: 'postgres',
      },
};
