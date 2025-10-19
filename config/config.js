// load .env for local development so sequelize-cli picks it up
try {
  require('dotenv').config();
} catch (e) {
  // ignore if dotenv isn't installed or no .env file
}

const useDatabaseUrl = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.length > 0);

// If DB_SSL is explicitly 'false' we won't pass ssl options; otherwise allow ssl object
const ssl = process.env.DB_SSL === 'false' ? undefined : { require: true, rejectUnauthorized: false };

// Helper: if DB_USER/DB_PASS/DB_HOST/DB_PORT/DB_NAME are not set but DATABASE_URL is, parse it
function stripQuotes(s) {
  if (!s) return s;
  return s.replace(/^'+|'+$/g, '')
          .replace(/^"+|"+$/g, '');
}

const parsed = {};
if (!process.env.DB_USER || !process.env.DB_PASS || !process.env.DB_HOST || !process.env.DB_NAME) {
  const dbUrlRaw = stripQuotes(process.env.DATABASE_URL || '');
  if (dbUrlRaw) {
    try {
      const u = new URL(dbUrlRaw);
      parsed.DB_USER = u.username || undefined;
      parsed.DB_PASS = u.password || undefined;
      parsed.DB_HOST = u.hostname || undefined;
      parsed.DB_PORT = u.port || undefined;
      parsed.DB_NAME = u.pathname ? u.pathname.replace(/^\//, '') : undefined;
    } catch (e) {
      // ignore parse errors
    }
  }
}

if (!useDatabaseUrl) {
  // only warn when production might rely on DATABASE_URL; development will use individual env vars
  if (process.env.NODE_ENV === 'production') {
    console.warn('WARNING: DATABASE_URL is not set. Sequelize will not be able to connect in production.');
  }
}

module.exports = {
  // Development should use the explicit env vars (DB_HOST / DB_USER / DB_PASS / DB_NAME / DB_PORT)
  development: {
    username: process.env.DB_USER || parsed.DB_USER || 'postgres',
    password: process.env.DB_PASS ?? parsed.DB_PASS ?? undefined,
    database: process.env.DB_NAME || parsed.DB_NAME || 'pos-orders',
    host: process.env.DB_HOST || parsed.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : parsed.DB_PORT ? Number(parsed.DB_PORT) : 5432,
    dialect: 'postgres',
    dialectOptions: process.env.DB_SSL === 'true' ? { ssl } : {},
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    dialectOptions: ssl ? { ssl } : {},
  },
};
