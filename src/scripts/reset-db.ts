import { execSync } from 'child_process';
import { Client } from 'pg';

async function run() {
  const client = new Client({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER ?? 'wilfred',
    password: process.env.DB_PASS ?? 'williy8615.',
    database: process.env.DB_NAME ?? 'pos-orders',
  });

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
