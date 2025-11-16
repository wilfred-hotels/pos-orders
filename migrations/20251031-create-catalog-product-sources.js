'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('catalog_product_sources', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      catalog_product_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'catalog_products', key: 'id' }, onDelete: 'CASCADE' },
      hotel_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'hotels', key: 'id' } },
      product_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'products', key: 'id' } },
      base_price_cents: { type: Sequelize.BIGINT, allowNull: true },
      enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      priority: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 10 },
      last_sync_at: { type: Sequelize.DATE, allowNull: true },
      constraints: { type: Sequelize.JSONB, allowNull: true, defaultValue: {} },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('now()') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('now()') },
    });
    try {
      await queryInterface.addIndex('catalog_product_sources', ['catalog_product_id']);
    } catch (err) {
      // best-effort: index may fail if column missing or DB state unexpected
    }
    try {
      await queryInterface.addIndex('catalog_product_sources', ['product_id']);
    } catch (err) {
      // ignore
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('catalog_product_sources');
  }
};
