"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create tables if they do not exist. This migration is idempotent and
    // captures the current schema surface used by the application. It is a
    // consolidation of previous migrations.

    // Helper to check existence
    const tableExists = async (name) => {
      try {
        await queryInterface.describeTable(name);
        return true;
      } catch (err) {
        return false;
      }
    };

    // catalog_products
    if (!(await tableExists('catalog_products'))) {
      await queryInterface.createTable('catalog_products', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
        name: { type: Sequelize.STRING, allowNull: false },
        slug: { type: Sequelize.STRING, allowNull: false, unique: true },
        description: { type: Sequelize.TEXT, allowNull: true },
        initialPriceCents: { type: Sequelize.BIGINT, allowNull: true },
        finalPriceCents: { type: Sequelize.BIGINT, allowNull: true },
        stock: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        nameCode: { type: Sequelize.STRING, allowNull: true, unique: true },
        isVisible: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        images: { type: Sequelize.ARRAY(Sequelize.STRING), allowNull: true },
        categories: { type: Sequelize.ARRAY(Sequelize.STRING), allowNull: true, defaultValue: [] },
        isFeatured: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        rating: { type: Sequelize.FLOAT, allowNull: true, defaultValue: 0 },
        brand: { type: Sequelize.STRING, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('now()') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('now()') },
      });
    }

    // orders
    if (!(await tableExists('orders'))) {
      await queryInterface.createTable('orders', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
        total: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 0 },
        source: { type: Sequelize.STRING, allowNull: true },
        status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'not paid' },
        userId: { type: Sequelize.UUID, allowNull: true },
        guestId: { type: Sequelize.STRING, allowNull: true },
        cartId: { type: Sequelize.UUID, allowNull: true },
        catalogProductId: { type: Sequelize.UUID, allowNull: true },
        contact: { type: Sequelize.JSONB, allowNull: true },
        code: { type: Sequelize.STRING, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('now()') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('now()') },
      });
    }

    // order_fulfillments
    if (!(await tableExists('order_fulfillments'))) {
      await queryInterface.createTable('order_fulfillments', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
        order_id: { type: Sequelize.UUID, allowNull: false, unique: true },
        assigned_hotel_id: { type: Sequelize.UUID, allowNull: true },
        assigned_product_id: { type: Sequelize.UUID, allowNull: true },
        assigned_at: { type: Sequelize.DATE, allowNull: true },
        status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'pending' },
        price_breakdown: { type: Sequelize.JSONB, allowNull: false, defaultValue: '{}' },
        payout_status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'unpaid' },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('now()') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('now()') },
      });
      try { await queryInterface.addIndex('order_fulfillments', ['order_id']); } catch (e) {}
      try { await queryInterface.addIndex('order_fulfillments', ['assigned_hotel_id']); } catch (e) {}
    }

    // products (hotel-scoped products)
    if (!(await tableExists('products'))) {
      await queryInterface.createTable('products', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
        name: { type: Sequelize.STRING, allowNull: false },
        price: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 0 },
        stock: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('now()') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('now()') },
      });
    }

    // other lightweight tables used in app: users, carts, cart_items, payments, revoked_tokens
    if (!(await tableExists('users'))) {
      await queryInterface.createTable('users', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
        email: { type: Sequelize.STRING, allowNull: false, unique: true },
        password: { type: Sequelize.STRING, allowNull: true },
        role: { type: Sequelize.STRING, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('now()') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('now()') },
      });
    }

    if (!(await tableExists('carts'))) {
      await queryInterface.createTable('carts', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
        userId: { type: Sequelize.UUID, allowNull: true },
        guestId: { type: Sequelize.STRING, allowNull: true },
        completed: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('now()') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('now()') },
      });
    }

    if (!(await tableExists('cart_items'))) {
      await queryInterface.createTable('cart_items', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
        cartId: { type: Sequelize.UUID, allowNull: false },
        productId: { type: Sequelize.UUID, allowNull: true },
        quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('now()') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('now()') },
      });
    }

    if (!(await tableExists('payments'))) {
      await queryInterface.createTable('payments', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
        orderId: { type: Sequelize.UUID, allowNull: true },
        amount: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 0 },
        provider: { type: Sequelize.STRING, allowNull: true },
        status: { type: Sequelize.STRING, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('now()') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('now()') },
      });
    }

    if (!(await tableExists('revoked_tokens'))) {
      await queryInterface.createTable('revoked_tokens', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
        token: { type: Sequelize.STRING, allowNull: false },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('now()') },
      });
    }

    // Add any indexes/constraints that are safe to add
    try { if (await tableExists('catalog_products')) await queryInterface.addConstraint('catalog_products', { fields: ['nameCode'], type: 'unique', name: 'catalog_products_namecode_unique' }); } catch (e) {}

  },

  async down(queryInterface, Sequelize) {
    // Drop the consolidated tables if they exist (best-effort). Use caution in production.
    const tableExists = async (name) => {
      try { await queryInterface.describeTable(name); return true; } catch (e) { return false; }
    };
    const tables = ['order_fulfillments','cart_items','carts','payments','revoked_tokens','catalog_products','orders','products','users'];
    for (const t of tables) {
      if (await tableExists(t)) {
        try { await queryInterface.dropTable(t); } catch (e) { /* ignore */ }
      }
    }
  }
};
