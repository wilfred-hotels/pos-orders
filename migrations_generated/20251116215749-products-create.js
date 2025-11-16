"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("products", {
      "id": { type: Sequelize.UUID, primaryKey: true },
      "name": { type: Sequelize.STRING, allowNull: false },
      "description": { type: Sequelize.TEXT },
      "price": { type: Sequelize.FLOAT, allowNull: false },
      "stock": { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      "hotelId": { type: Sequelize.UUID }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("products");
  }
};
