const useDatabaseUrl = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.length > 0);

const ssl = process.env.DB_SSL === 'false' ? undefined : { require: true, rejectUnauthorized: false };

if (!useDatabaseUrl) {
  console.warn('WARNING: DATABASE_URL is not set. Sequelize will not be able to connect.');
}

module.exports = {
  development: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    dialectOptions: ssl ? { ssl } : {},
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    dialectOptions: ssl ? { ssl } : {},
  },
};
