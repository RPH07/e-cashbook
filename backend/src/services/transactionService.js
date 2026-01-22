'use strict';

const {Transaction, Account, sequelize} = require('../models');

class TransactionService {
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
}

module.exports = TransactionService;