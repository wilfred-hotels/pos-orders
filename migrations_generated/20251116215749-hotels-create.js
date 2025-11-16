"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("hotels", {
      "id": { type: Sequelize.UUID, primaryKey: true },
      "name": { type: Sequelize.STRING, allowNull: false },
      "address": { type: Sequelize.STRING },
      "city": { type: Sequelize.STRING },
      "country": { type: Sequelize.STRING },
      "phone": { type: Sequelize.STRING },
      "openingTime": { type: Sequelize.STRING },
      "closingTime": { type: Sequelize.STRING },
      "imageUrl": { type: Sequelize.STRING },
      "description": { type: Sequelize.TEXT },
      "workersCount": { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("hotels");
  }
};
