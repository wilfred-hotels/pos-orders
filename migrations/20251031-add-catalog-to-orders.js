'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('orders', 'catalog_product_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'catalog_products', key: 'id' },
      onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('orders', 'contact', {
      type: Sequelize.JSONB,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('orders', 'catalog_product_id');
    await queryInterface.removeColumn('orders', 'contact');
  }
};
