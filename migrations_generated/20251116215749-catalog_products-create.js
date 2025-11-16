"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("catalog_products", {
      "id": { type: Sequelize.UUID, primaryKey: true },
      "name": { type: Sequelize.STRING, allowNull: false },
      "slug": { type: Sequelize.STRING, allowNull: false, unique: true },
      "description": { type: Sequelize.TEXT },
      "initialPriceCents": { type: Sequelize.INTEGER },
      "finalPriceCents": { type: Sequelize.INTEGER },
      "stock": { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      "nameCode": { type: Sequelize.STRING, unique: true },
      "isVisible": { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      "images": { type: Sequelize.ARRAY(Sequelize.STRING) },
      "categories": { type: Sequelize.ARRAY(Sequelize.STRING) },
      "isFeatured": { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      "rating": { type: Sequelize.FLOAT, defaultValue: 0 },
      "brand": { type: Sequelize.STRING },
      "createdAt": { type: Sequelize.DATE },
      "updatedAt": { type: Sequelize.DATE }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("catalog_products");
  }
};
