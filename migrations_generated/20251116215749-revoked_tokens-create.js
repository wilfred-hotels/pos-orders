"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("revoked_tokens", {
      "id": { type: Sequelize.UUID, primaryKey: true },
      "token": { type: Sequelize.TEXT, allowNull: false, unique: true },
      "expiresAt": { type: Sequelize.DATE },
      "userId": { type: Sequelize.UUID },
      "createdAt": { type: Sequelize.DATE, allowNull: false },
      "updatedAt": { type: Sequelize.DATE, allowNull: false }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("revoked_tokens");
  }
};
