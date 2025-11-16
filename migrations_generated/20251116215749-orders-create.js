"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("orders", {
      "id": { type: Sequelize.UUID, primaryKey: true },
      "code": { type: Sequelize.STRING, unique: true },
      "status": { type: Sequelize.STRING, allowNull: false, defaultValue: "not paid" },
      "cartId": { type: Sequelize.UUID },
      "catalogProductId": { type: Sequelize.UUID },
      "contact": { type: Sequelize.JSONB },
      "userId": { type: Sequelize.UUID },
      "total": { type: Sequelize.FLOAT, allowNull: false },
      "source": { type: Sequelize.STRING, allowNull: false },
      "createdAt": { type: Sequelize.DATE, allowNull: false },
      "updatedAt": { type: Sequelize.DATE, allowNull: false }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("orders");
  }
};
