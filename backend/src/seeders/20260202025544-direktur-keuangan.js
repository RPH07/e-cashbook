'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const passwordHash = await bcrypt.hash('direktur123', 10);
    return  queryInterface.bulkInsert('Users', [{
      name: 'direktur keuangan',
      email: 'direktur@example.com',
      password: passwordHash,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
  },
  

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Users', null, {});
  }
};
