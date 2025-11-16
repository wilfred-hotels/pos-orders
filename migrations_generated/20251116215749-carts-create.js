"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("carts", {
      "id": { type: Sequelize.UUID, primaryKey: true },
      "userId": { type: Sequelize.UUID, allowNull: false },
      "status": { type: Sequelize.STRING, allowNull: false, defaultValue: "active" },
      "createdAt": { type: Sequelize.DATE, allowNull: false },
      "updatedAt": { type: Sequelize.DATE, allowNull: false }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("carts");
  }
};
