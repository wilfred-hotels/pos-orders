'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payments', {
      id: {
        type: Sequelize.DataTypes.UUID,
        defaultValue: Sequelize.DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      provider: { type: Sequelize.DataTypes.STRING, allowNull: false },
      providerTransactionId: { type: Sequelize.DataTypes.STRING },
      amount: { type: Sequelize.DataTypes.DECIMAL(12, 2), allowNull: false },
      status: { type: Sequelize.DataTypes.STRING, allowNull: false, defaultValue: 'pending' },
      raw: { type: Sequelize.DataTypes.JSONB },
      orderId: {
        type: Sequelize.DataTypes.UUID,
        references: { model: 'orders', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      userId: {
        type: Sequelize.DataTypes.UUID,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      hotelId: {
        type: Sequelize.DataTypes.UUID,
        references: { model: 'hotels', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      cartId: {
        type: Sequelize.DataTypes.UUID,
        references: { model: 'carts', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      createdAt: { allowNull: false, type: Sequelize.DataTypes.DATE, defaultValue: Sequelize.literal('NOW()') },
      updatedAt: { allowNull: false, type: Sequelize.DataTypes.DATE, defaultValue: Sequelize.literal('NOW()') },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('payments');
  },
};
