'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Hapus data lama biar gak dobel (Opsional)
    await queryInterface.bulkDelete('Accounts', null, {});

    // Masukin Akun-akun Real
    await queryInterface.bulkInsert('Accounts', [
      {
        account_name: 'Kas Tunai',
        account_type: 'tabungan', 
        balance: 5000000,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        account_name: 'Bank BCA',
        account_type: 'tabungan',
        balance: 15000000,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        account_name: 'Giro Operasional',
        account_type: 'giro',
        balance: 25000000,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Accounts', null, {});
  }
};