'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Perintah untuk nambah kolom 'status' ke tabel 'Transactions'
    await queryInterface.addColumn('Transactions', 'status', {
      type: Sequelize.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
      allowNull: false,
      after: 'evidence_link' 
    });
  },

  async down (queryInterface, Sequelize) {
    // Perintah buat hapus lagi (kalau undo)
    await queryInterface.removeColumn('Transactions', 'status');
  }
};