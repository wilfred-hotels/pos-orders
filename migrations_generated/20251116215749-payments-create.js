"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("payments", {
      "id": { type: Sequelize.UUID, primaryKey: true },
      "provider": { type: Sequelize.STRING, allowNull: false },
      "providerTransactionId": { type: Sequelize.STRING },
      "amount": { type: Sequelize.STRING, allowNull: false },
      "status": { type: Sequelize.STRING, allowNull: false, defaultValue: "pending" },
      "raw": { type: Sequelize.JSONB },
      "initiatedCheckoutRequestId": { type: Sequelize.STRING },
      "initiatedMerchantRequestId": { type: Sequelize.STRING },
      "orderId": { type: Sequelize.UUID },
      "userId": { type: Sequelize.UUID, allowNull: false },
      "hotelId": { type: Sequelize.UUID },
      "createdAt": { type: Sequelize.DATE, allowNull: false },
      "updatedAt": { type: Sequelize.DATE, allowNull: false }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("payments");
  }
};
