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

    static async approveTransaction(transactionId, approverId, userRole) {
        const t = await sequelize.transaction();
        try {
            // Mencari Transaksi yang akan disetujui
            const transaction = await Transaction.findByPk(transactionId, {transaction: t});
            if (!transaction) throw new Error('Transaksi Tidak Ditemukan');

            // Validasi Transaksi yang sudah ditolak atau dibatalkan
            if (transaction.status === 'rejected') {
                throw new Error(`Transaksi dengan status ${transaction.status} tidak dapat disetujui`);
            }

            let nextStatus = transaction.status;

            // Logika hierarki approve
            if (userRole === 'finance'){
                if (transaction.status !== 'pending') throw new Error('Hanya transaksi dengan status pending yang dapat disetujui');

                if (transaction.type === 'income') {
                    nextStatus = 'approved';
                } else {
                    nextStatus = 'waiting_approval_a';
                }
            }
            else if (userRole === 'admin'){
                if (transaction.status !== 'waiting_approval_a') throw new Error ('Hanya transaksi yang sudah disetujui finance yang dapat disetujui');
                nextStatus = 'approved';
            } else {
                throw new Error ('Role anda tidak memiliki izin untuk menyetujui transaksi');
            }

            // Menghitung saldo hanya jika status menjadi approved final
            let balanceBefore = parseFloat(transaction.balance_before);
            let balanceAfter = parseFloat(transaction.balance_after);

            if (nextStatus === 'approved') {
                const account = await Account.findByPk(transaction.accountId, {
                    transaction: t, 
                    lock: t.LOCK.UPDATE
                });

                if (!account) throw new Error ('Akun utama tidak ditemukan');

                const amount = parseFloat(transaction.amount);
                balanceBefore = parseFloat(account.balance);

                if (transaction.type === 'income') {
                    balanceAfter = balanceBefore + amount;
                } else {
                    if (balanceBefore < amount) throw new Error ('Saldo Tidak Mencukupi');
                    balanceAfter = balanceBefore - amount;

                    if (transaction.type === 'transfer'){
                        const toAccount = await Account.findByPk(transaction.toAccountId, {
                            transaction: t,
                            lock: t.LOCK.UPDATE
                        });

                        if (!toAccount) throw new Error ('Akun Tujuan Tidak ditemukan');
                        await toAccount.update({
                            balance: parseFloat(toAccount.balance) + amount
                        }, {transaction: t})
                    }
                }
                
                // Memperbarui saldo akun utama
                await account.update({balance: balanceAfter}, {transaction: t});
            }


            // Memperbarui saldo akun
            await transaction.update({
                status: nextStatus,
                balance_before: balanceBefore,
                balance_after: balanceAfter,
                approvedBy: approverId
            }, {transaction: t});

            // Mencatat log audit
            await AuditLogService.record(approverId, 'APPROVE_TRANSACTION', `Menyetujui transaksi ID ${transaction.reference_id}. Status sekarang: ${nextStatus}`);

            // Commit transaksi
            await t.commit();
            return {message: `Berhasil! Status Sekarang ${nextStatus}`, nextStatus};

        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    static async rejectTransaction(transactionId, approverId, userRole) {
        const t = await sequelize.transaction();
        try {
            const transaction = await Transaction.findByPk(transactionId, {transaction: t});
            if(!transaction) throw new Error('Transaksi Tidak Ditemukan');

            if(transaction.status === 'approved') throw new Error ('Transaksi Sudah Final, hanya bisa dibatalkan');

            if (userRole === 'finance'){
                if(transaction.status !== 'pending') throw new Error ('Manager hanya bisa menolak transaksi berstatus pending')
            }else if (userRole === 'admin'){
                if(transaction.status !== 'waiting_approval_a') throw new Error ('Direktur hanya bisa menolak transaksi yang sudah disetujui oleh manager')
            }else {
                throw new Error ('Anda tidak memiliki izin untuk menolak transaksi');
            }

            await transaction.update({
                status: 'rejected',
                approvedBy: approverId
            }, {transaction: t})

            // Mencatat log audit
            await AuditLogService.record(approverId, 'REJECT_TRANSACTION', `Transaksi ${transaction.reference_id} ditolak oleh ${userRole}, status: 'rejected'`);

            await t.commit();
            return {message: 'Transaksi telah ditolak'};
        } catch (error) {
            await t.rollback();
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

            // Jika sudah approved maka tidak bisa diedit
            if (transaction.status === 'approved') throw new Error ('Transaksi yang sudah disetujui tidak dapat diubah, Silahkan dibatalkan jika ingin');

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
                order: [['date', 'DESC'], ['created_at', 'DESC']]

            })

        }catch (error) {
            throw error;
        }
    }

    // Membuat fungsi untuk menghapus transaksi
    static async deleteTransaction(id, userId, userRole) {
        const t = await sequelize.transaction();
        try {
            const whereCondition = (userRole === 'admin') ? { id } : { id, userId };
            const transaction = await Transaction.findOne({ where: whereCondition , transaction: t});

            if (!transaction) throw new Error('Transaksi Tidak Ditemukan');

            if (transaction.status === 'approved') throw new Error ('Transaksi sudah approved tidak boleh dihapus.');

            // Mencatat log audit
            await AuditLogService.record(userId, 'DELETE_TRANSACTION', `Menghapus transaksi ID ${transaction.reference_id} (Status: ${transaction.status}) `);

            // Menghapus transaksi
            await transaction.destroy({transaction: t});

            await t.commit();
            return {message: "Transaksi berhasil dihapus"};

        }catch (error) {
            await t.rollback();
            throw error;
        }
    }
}

module.exports = TransactionService;