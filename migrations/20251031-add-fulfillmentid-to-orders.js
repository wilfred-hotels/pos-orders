'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('orders', 'fulfillment_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'order_fulfillments', key: 'id' },
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('orders', 'fulfillment_id');
  }
};
