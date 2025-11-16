'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('order_fulfillments', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
      order_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'orders', key: 'id' }, onDelete: 'CASCADE', unique: true },
      assigned_hotel_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'hotels', key: 'id' } },
      assigned_product_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'products', key: 'id' } },
      assigned_at: { type: Sequelize.DATE, allowNull: true },
      status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'pending' },
      price_breakdown: { type: Sequelize.JSONB, allowNull: false, defaultValue: '{}' },
      payout_status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'unpaid' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('now()') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('now()') },
    });
    try {
      await queryInterface.addIndex('order_fulfillments', ['order_id']);
    } catch (err) {
      // ignore index errors
    }
    try {
      await queryInterface.addIndex('order_fulfillments', ['assigned_hotel_id']);
    } catch (err) {
      // ignore
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('order_fulfillments');
  }
};
