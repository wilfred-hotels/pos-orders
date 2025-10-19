'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // create enum type if supported (Postgres will create type automatically)
    await queryInterface.addColumn('orders', 'status', {
      type: Sequelize.ENUM('paid', 'not paid', 'canceled'),
      allowNull: false,
      defaultValue: 'not paid',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('orders', 'status');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_orders_status";');
  },
};
