"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("order_items", {
      "id": { type: Sequelize.UUID, primaryKey: true },
      "orderId": { type: Sequelize.UUID, allowNull: false },
      "productId": { type: Sequelize.UUID, allowNull: false },
      "quantity": { type: Sequelize.INTEGER, allowNull: false }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("order_items");
  }
};
