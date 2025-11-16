"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("order_fulfillments", {
      "id": { type: Sequelize.UUID, primaryKey: true },
      "orderId": { type: Sequelize.UUID, allowNull: false },
      "assignedHotelId": { type: Sequelize.UUID },
      "assignedProductId": { type: Sequelize.UUID },
      "assignedAt": { type: Sequelize.DATE },
      "status": { type: Sequelize.STRING, allowNull: false, defaultValue: "pending" },
      "priceBreakdown": { type: Sequelize.JSONB, allowNull: false },
      "payoutStatus": { type: Sequelize.STRING, allowNull: false, defaultValue: "unpaid" },
      "createdAt": { type: Sequelize.DATE, allowNull: false },
      "updatedAt": { type: Sequelize.DATE, allowNull: false }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("order_fulfillments");
  }
};
