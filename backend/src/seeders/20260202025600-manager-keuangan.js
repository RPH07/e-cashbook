'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const passwordHash = await bcrypt.hash('manager123', 10);

    return queryInterface.bulkInsert('Users', [{
      name: 'manager keuangan',
      email: 'manager@example.com',
      password: passwordHash,
      role: 'finance',
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Users', null, {});
  }
};
