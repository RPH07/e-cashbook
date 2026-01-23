'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Categories', [
      { name: 'Pendapatan Operasional', type: 'income', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Pendapatan Lain-Lain', type: 'income', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Beban Operasional', type: 'expense', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Beban Administrasi', type: 'expense', createdAt: new Date(), updatedAt: new Date() },
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Categories', null, {});
  }
};
