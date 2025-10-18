'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Ensure the uuid-ossp extension is available for uuid_generate_v4()
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query('DROP EXTENSION IF EXISTS "uuid-ossp";');
  },
};
