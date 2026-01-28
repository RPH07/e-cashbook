'use strict';

const {Transaction, Account, User, Category, sequelize} = require('../models');
const {Op} = require('sequelize');
const AuditLogService = require('./auditLogService');

class TransactionService {
    static async createTransaction(data) {
        try {
        const prefix = data.type === 'transfer' ? 'TRF' : 'TRX';
        const timestamp = new Date().getTime();
        const random = Math.floor(1000 + Math.random() * 1000);
        const generatedRefId = `${prefix}-${timestamp}-${random}`;

        const transactionStatus = data.status || 'pending';

        // Menyimpan transaksi dan referensi id
        const newTransaction = await Transaction.create({
            ...data,
            reference_id: data.referenceId || generatedRefId,
            status: transactionStatus,
            balance_before: 0,
            balance_after: 0
        });

        await AuditLogService.record(data.userId, 'CREATE_TRANSACTION', `Membuat transaksi ${generatedRefId} sebesar ${data.amount}`)

        const fullTransaction = await Transaction.findByPk(newTransaction.id, {
            include: [
                {model: Account, as: 'account', attributes: ['account_name', 'account_type']},
                {model: Category, as: 'category', attributes: ['name', 'type']},
                {model: User, as: 'user', attributes: ['name', 'role']}
            ]
        });

        return fullTransaction;

        }catch (error) {
            throw error;
        }
    }

    static async approveTransaction(transactionId, approverId) {
        const t = await sequelize.transaction();
        try {
            // Mencari Transaksi yang akan disetujui
            const transaction = await Transaction.findByPk(transactionId, {transaction: t});
            if (!transaction) throw new Error('Transaksi Tidak Ditemukan');
            if (transaction.status !== 'pending') throw new Error('Hanya transaksi dengan status pending yang dapat disetujui');


            // Mencari account terkait
            const account = await Account.findByPk(transaction.accountId, {transaction: t});
            if (!account) throw new Error('Akun Tidak Ditemukan');

            // Menghitung saldo baru berdasarkan tipe transaksi
            const amount = parseFloat(transaction.amount);
            let balanceBefore = parseFloat(account.balance);
            let balanceAfter;

            if (transaction.type === 'income') {
                balanceAfter = balanceBefore + amount;
            } else if (transaction.type === 'expense') {
                balanceAfter = balanceBefore - amount;
            } else if (transaction.type === 'transfer') {

                // Validasi saldo cukup untuk transfer 
                if(balanceBefore < amount) throw new Error('Saldo tidak mencukupi untuk transfer');
                balanceAfter = balanceBefore - amount; 

                // Validasi dan update saldo akun tujuan
                const toAccount = await Account.findByPk(transaction.toAccountId, {transaction: t});
                if (!toAccount) throw new Error('Akun Tujuan Tidak Ditemukan');

                // Memperbarui saldo akun tujuan
                await toAccount.update({
                    balance: parseFloat(toAccount.balance) + amount
                }, {transaction: t});
            }

            // Memperbarui saldo akun utama
            await account.update({balance: balanceAfter}, {transaction: t});

            // Memperbarui saldo akun
            await transaction.update({
                status: 'approved',
                balance_before: balanceBefore,
                balance_after: balanceAfter,
                approvedBy: approverId
            }, {transaction: t});

            // Mencatat log audit
            await AuditLogService.record(approverId, 'APPROVE_TRANSACTION', `Menyetujui transaksi ID ${transaction.reference_id} sebesar ${transaction.amount}`);

            // Commit transaksi
            await t.commit();
            return {message: 'Transaksi berhasil disetujui', balanceAfter};

        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    static async rejectTransaction(transactionId, approverId) {
        try {
            const transaction = await Transaction.findByPk(transactionId);
            if(!transaction) throw new Error('Transaksi Tidak Ditemukan');
            if(transaction.status !== 'pending') throw new Error('Hanya transaksi dengan status pending yang dapat ditolak');

            await transaction.update({
                status: 'rejected',
                approvedBy: approverId
            })

            // Mencatat log audit
            await AuditLogService.record(approverId, 'REJECT_TRANSACTION', `Menolak transaksi ID ${transaction.reference_id} sebesar ${transaction.amount}`);

            return {message: 'Transaksi telah ditolak'};
        } catch (error) {
            throw error;
        }
    }

    static async voidTransaction (transactionId, approverId) {
        const t = await sequelize.transaction();
        try {
            const transaction = await Transaction.findByPk(transactionId, {transaction: t});
            if(!transaction) throw new Error('Transaksi Tidak Ditemukan');
            if (transaction.status !== 'approved') throw new Error('Hanya transaksi dengan status approved yang dapat dibatalkan');

            const account = await Account.findByPk(transaction.accountId, {transaction: t});
            const amount = parseFloat(transaction.amount);
            let restoreBalance = parseFloat(account.balance);


            // Mengembalikan saldo berdasarkan tipe transaksi
            if (transaction.type === 'income') {
                restoreBalance -= amount;
            } else if (transaction.type === 'expense'|| transaction.type === 'transfer') {
                restoreBalance += amount;

                if (transaction.type === 'transfer') {
                    // Mengembalikan saldo akun tujuan
                    const targetAccount = await Account.findByPk(transaction.toAccountId, {transaction: t });
                    if(targetAccount) {
                        const targetRestoreBalance = parseFloat(targetAccount.balance) - amount;
                        await targetAccount.update({balance: targetRestoreBalance}, {transaction: t});
                    }
                }
            }

            // Memperbarui saldo akun utama
            await account.update({balance: restoreBalance}, {transaction: t});

            // Memperbarui status transaksi menjadi void
            await transaction.update({
                status: 'void',
                approvedBy: approverId
            }, {transaction: t});

            // Mencatat log audit
            await AuditLogService.record(approverId, 'VOID_TRANSACTION', `Membatalkan transaksi ID ${transaction.reference_id} sebesar ${transaction.amount}`);

            await t.commit();
            return {message: 'Transaksi berhasil dibatalkan', restoreBalance};
        }catch (error) {
            await t.rollback();
            throw error;
        }
    }

    static async updateTransaction (id, userId, userRole, data) {
        try {
            // Admin/Finance bisa edit transaksi siapa saja, Staff hanya transaksi sendiri
            const whereCondition = (userRole === 'admin' || userRole === 'finance') 
                ? {id} 
                : {id, userId};
            
            const transaction = await Transaction.findOne({where: whereCondition});
            if(!transaction) throw new Error('Transaksi Tidak Ditemukan');

            // Staff hanya bisa edit transaksi pending
            // Admin/Finance bisa edit semua transaksi
            if (userRole === 'staff' && transaction.status !== 'pending') {
                throw new Error(`Transaksi dengan status ${transaction.status} tidak dapat diubah`);
            }

            const allowedUpdates = {
                amount: data.amount || transaction.amount,
                date: data.date || transaction.date,
                categoryId: data.categoryId || transaction.categoryId,
                accountId: data.accountId || transaction.accountId,
                type: data.type || transaction.type,
                toAccountId: data.toAccountId || transaction.toAccountId,
                description: data.description || transaction.description,
                evidence_link: data.evidence_link || transaction.evidence_link,
            }

            // Tentukan status: admin/finance bisa set status dari request, staff reset ke pending
            const newStatus = (userRole === 'admin' || userRole === 'finance') 
                ? (data.status || transaction.status) 
                : 'pending';

            await transaction.update({
                ...allowedUpdates,
                status: newStatus,
                balance_before: 0,
                balance_after: 0
            });

            // Mencatat log audit
            await AuditLogService.record(userId, 'UPDATE_TRANSACTION', `Memperbarui transaksi ID ${transaction.reference_id}`);

            // Ambil data lengkap dengan relasi untuk dikembalikan ke client
            const fullTransaction = await Transaction.findByPk(transaction.id, {
                include: [
                    {model: Account, as: 'account', attributes: ['account_name', 'account_type']},
                    {model: Category, as: 'category', attributes: ['name', 'type']},
                    {model: User, as: 'user', attributes: ['name', 'role']}
                ]
            });

            return fullTransaction;

        }catch (error) {
            throw error;
        }
    }

    // Membuat fungsi untuk mendapatkan semua transaksi dan Filter
    static async getAllTransactions(userId, role, filters = {}) {
        try {

            const {startDate, endDate, type, categoryId, accountId, status} = filters;

            const whereCondition = (role === 'admin' || role === 'finance' || role === 'auditor') ? {} : {userId};

            // Filter tanggal
            if (startDate && endDate) {
                whereCondition.date = {[Op.between]: [startDate, endDate]};
            }

            if (accountId) whereCondition.accountId = accountId;
            if (categoryId) whereCondition.categoryId = categoryId;
            if (type) whereCondition.type = type;
            if (status) whereCondition.status = status;

            return await Transaction.findAll({
                where: whereCondition,
                include: [
                    {model: Account, as: 'account', attributes: ['account_name', 'account_type']},
                    {model: Category, as: 'category', attributes: ['name', 'type']},
                    {model: User, as: 'user', attributes: ['name', 'role']}
                ],
                order: [['date', 'DESC']]

            })

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
            const amount = parseFloat(transaction.amount);

            if (transaction.status === 'approved'){
                const account = await Account.findByPk(transaction.accountId, {transaction: t});
                if (account){
                    let newBalance = parseFloat(account.balance);

                    // Mengembalikan saldo berdasarkan tipe transaksi
                    if (transaction.type === 'income') {
                        newBalance -= amount;
                    }else {
                        newBalance += amount;
                    }
                    await account.update({balance: newBalance}, {transaction: t});
                }

                if (transaction.type === 'transfer' && transaction.toAccountId) {
                    const targetAccount = await Account.findByPk(transaction.toAccountId, {transaction: t});
                    if (targetAccount) {
                        let newTargetBalance = parseFloat(targetAccount.balance) - amount;
                        await targetAccount.update({balance: newTargetBalance}, {transaction: t});
                    }
                }
            }


            // Mencatat log audit
            await AuditLogService.record(userId, 'DELETE_TRANSACTION', `Menghapus transaksi ID ${transaction.reference_id} (Status: ${transaction.status}) `);

            // Menghapus transaksi
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