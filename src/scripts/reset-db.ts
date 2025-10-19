import { execSync } from 'child_process';
import { Client } from 'pg';

// Load .env for scripts run via ts-node so DB_* env vars are present
try {
  require('dotenv').config();
} catch (e) {
  // ignore
}

async function run() {
  // In development we require DB_* env vars and will not fall back to DATABASE_URL.
  // This prevents accidental use of a different DB connection encoded in DATABASE_URL.
  if (process.env.NODE_ENV !== 'production' && !process.env.DB_USER) {
    console.error('Reset failed: in development you must set DB_USER (and DB_PASS) in your .env. Per policy, DEVELOPMENT uses DB_* values, not DATABASE_URL.');
    process.exit(1);
  }

  // Build client config from DB_* env vars (development) or parse DATABASE_URL (production/fallback)
  const cfg: any = {};
  if (process.env.DB_USER) {
    cfg.host = process.env.DB_HOST ?? 'localhost';
    cfg.port = Number(process.env.DB_PORT ?? 5432);
    cfg.user = process.env.DB_USER;
    cfg.password = process.env.DB_PASS ?? undefined;
    cfg.database = process.env.DB_NAME ?? 'pos-orders';
  } else if (process.env.DATABASE_URL) {
    // production or explicit full URL fallback
    const dbUrl = process.env.DATABASE_URL.replace(/^'+|'+$/g, '').replace(/^"+|"+$/g, '');
    const u = new URL(dbUrl);
    cfg.host = u.hostname;
    cfg.port = Number(u.port || 5432);
    cfg.user = u.username;
    cfg.password = u.password && u.password.length > 0 ? u.password : undefined;
    cfg.database = u.pathname ? u.pathname.replace(/^\//, '') : 'pos-orders';
  } else {
    cfg.host = 'localhost';
    cfg.port = 5432;
    cfg.user = process.env.DB_USER ?? 'wilfred';
    cfg.password = process.env.DB_PASS ?? undefined;
    cfg.database = process.env.DB_NAME ?? 'pos-orders';
  }

  const client = new Client(cfg);

  try {
    await client.connect();
    console.log('Dropping and recreating public schema (CASCADE)...');
    await client.query('DROP SCHEMA public CASCADE');
    await client.query('CREATE SCHEMA public');
    await client.end();

    console.log('Running migrations...');
    execSync('npx sequelize-cli db:migrate', { stdio: 'inherit' });

    console.log('Reset complete');
  } catch (err) {
    console.error('Reset failed:', err);
    try {
      await client.end();
    } catch (_) {}
    process.exit(1);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
