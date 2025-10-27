'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // add initiatedCheckoutRequestId and initiatedMerchantRequestId columns
    await queryInterface.addColumn('payments', 'initiatedCheckoutRequestId', {
      type: Sequelize.DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('payments', 'initiatedMerchantRequestId', {
      type: Sequelize.DataTypes.STRING,
      allowNull: true,
    });

    // add an index for faster lookup by checkout id
    await queryInterface.addIndex('payments', ['initiatedCheckoutRequestId'], {
      name: 'payments_initiated_checkout_request_id_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('payments', 'payments_initiated_checkout_request_id_idx');
    await queryInterface.removeColumn('payments', 'initiatedMerchantRequestId');
    await queryInterface.removeColumn('payments', 'initiatedCheckoutRequestId');
  },
};
