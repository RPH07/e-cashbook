'use strict';

const {Transaction, Account, Category, sequelize} = require('../models');

class TransactionService {
    // Membuat transaksi baru dengan logika perhitungan saldo dan referensi id
    static async createTransaction(data) {
        const t = await sequelize.transaction();

        try {
            const account = await Account.findByPk(data.accountId, { transaction: t });
            if (!account) throw new Error('Akun Tidak Ditemukan');

            const balanceBefore = parseFloat(account.balance);
            let balanceAfter;

            // Logika mnghitung saldo setelah transaksi
            if (data.type === 'income') {
                balanceAfter = balanceBefore + parseFloat(data.amount);
            } else if (data.type === 'expense') {
                if (balanceBefore < data.amount) throw new Error('Saldo Tidak Cukup');
                balanceAfter = balanceBefore - parseFloat(data.amount);
            } else if (data.type === 'transfer') {
                if (balanceBefore < data.amount) throw new Error('Saldo Tidak Cukup');
                balanceAfter = balanceBefore - parseFloat(data.amount);
            }
        
        // Membuat id referensi unik
        const prefix = data.type === 'transfer' ? 'TRF' : 'TRX';
        const timestamp = new Date().getTime();
        const random = Math.floor(1000 + Math.random() * 1000);
        const generatedRefId = `${prefix}-${timestamp}-${random}`;

        // Menyimpan transaksi dan referensi id
        const newTransaction = await Transaction.create({
            ...data,
            reference_id: data.referenceId || generatedRefId,
            balance_before: balanceBefore,
            balance_after: balanceAfter
        }, { transaction: t });

        await account.update({ balance: balanceAfter },  {transaction: t });

        await t.commit();
        return newTransaction;

        }catch (error) {
            await t.rollback();
            throw error;
        }
    }

    // Membuat fungsi untuk mendapatkan semua transaksi
    static async getAllTransactions(userId) {
        try {
            const transactions = await Transaction.findAll({
                where: {userId},

                include: [
                    {
                    model: Account,
                    as: 'account',
                    attributes: ['account_name', 'balance']
                    },
                    {
                    model: Category,
                    as: 'category',
                    attributes: ['name', 'type']
                    }
                ],
                order: [['date', 'DESC'], ['createdAt', 'DESC']]
            });
            return transactions;
        }catch (error) {
            throw error;
        }
    }

    // Membuat fungsi untuk menghapus transaksi
    static async deleteTransaction(id, userId) {
        const t = await sequelize.transaction();
        try {
            const transaction = await Transaction.findOne({ where: { id, userId } , transaction: t});
            if (!transaction) throw new Error('Transaksi Tidak Ditemukan');

            const account = await Account.findByPk(transaction.accountId, {transaction: t});

            let newBalance = parseFloat(account.balance);
            const amount = parseFloat(transaction.amount);

            if (transaction.type === "income"){
                newBalance -= amount;
            } else {
                newBalance += amount;
            }

            await account.update({balance: newBalance}, {transaction: t});

            await transaction.destroy({transaction: t});

            await t.commit();
            return {message: "Transaksi berhasil dihapus dan saldo berhasil diperbarui"};

        }catch (error) {
            await t.rollback();
            throw error;
        }
    }
}

module.exports = TransactionService;