"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("users", {
      "id": { type: Sequelize.UUID, primaryKey: true },
      "username": { type: Sequelize.STRING, allowNull: false },
      "password": { type: Sequelize.STRING, allowNull: false },
      "role": { type: Sequelize.STRING, allowNull: false, defaultValue: "customer" },
      "hotelId": { type: Sequelize.UUID }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("users");
  }
};
