"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("cart_items", {
      "id": { type: Sequelize.UUID, primaryKey: true },
      "cartId": { type: Sequelize.UUID, allowNull: false },
      "productId": { type: Sequelize.UUID, allowNull: false },
      "quantity": { type: Sequelize.INTEGER, allowNull: false },
      "status": { type: Sequelize.STRING, allowNull: false, defaultValue: "pending" }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("cart_items");
  }
};
