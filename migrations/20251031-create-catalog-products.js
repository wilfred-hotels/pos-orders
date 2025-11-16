'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Skip creating table if it already exists (idempotent guard)
    try {
      await queryInterface.describeTable('catalog_products');
      return;
    } catch (err) {
      // table does not exist -> proceed to create
    }

    await queryInterface.createTable('catalog_products', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      name: { type: Sequelize.TEXT, allowNull: false },
      slug: { type: Sequelize.STRING, allowNull: false, unique: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      image_url: { type: Sequelize.STRING, allowNull: true },
      category: { type: Sequelize.STRING, allowNull: true },
      price_cents: { type: Sequelize.BIGINT, allowNull: false },
      active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('now()') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('now()') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('catalog_products');
  }
};
