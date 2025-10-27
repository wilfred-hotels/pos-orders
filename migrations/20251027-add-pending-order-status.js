"use strict";

/**
 * Add 'pending' to the orders.status enum so new orders can be created with status 'pending'.
 */
module.exports = {
  async up(queryInterface) {
    // Postgres: add enum value if not exists
    await queryInterface.sequelize.query(`DO $$\nBEGIN\n    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'enum_orders_status' AND e.enumlabel = 'pending') THEN\n        ALTER TYPE "enum_orders_status" ADD VALUE 'pending';\n    END IF;\nEND$$;`);
  },

  async down(queryInterface) {
    // Removing enum values is non-trivial in Postgres. We'll leave this as a no-op for safety.
    return Promise.resolve();
  },
};
