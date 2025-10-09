'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('products', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT },
      price: { type: Sequelize.FLOAT, allowNull: false },
      stock: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('products');
  }
};
