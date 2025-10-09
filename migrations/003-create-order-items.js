'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('order_items', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      orderId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'orders', key: 'id' }, onDelete: 'CASCADE' },
      productId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'products', key: 'id' } },
      quantity: { type: Sequelize.INTEGER, allowNull: false }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('order_items');
  }
};
