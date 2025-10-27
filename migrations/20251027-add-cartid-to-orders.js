"use strict";

/**
 * Add cartId column to orders table
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('orders', 'cartId', {
      type: Sequelize.UUID,
      allowNull: true,
    });

    // add an index to speed up lookups by cartId
    await queryInterface.addIndex('orders', ['cartId'], {
      name: 'orders_cart_id_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('orders', 'orders_cart_id_idx');
    await queryInterface.removeColumn('orders', 'cartId');
  },
};
