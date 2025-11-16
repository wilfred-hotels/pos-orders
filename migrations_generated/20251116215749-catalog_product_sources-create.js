"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("catalog_product_sources", {
      "id": { type: Sequelize.UUID, primaryKey: true },
      "catalogProductId": { type: Sequelize.UUID, allowNull: false },
      "hotelId": { type: Sequelize.UUID },
      "productId": { type: Sequelize.UUID },
      "basePriceCents": { type: Sequelize.BIGINT },
      "enabled": { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      "priority": { type: Sequelize.INTEGER, allowNull: false, defaultValue: 10 },
      "lastSyncAt": { type: Sequelize.DATE },
      "constraints": { type: Sequelize.JSONB },
      "createdAt": { type: Sequelize.DATE, allowNull: false },
      "updatedAt": { type: Sequelize.DATE, allowNull: false }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("catalog_product_sources");
  }
};
