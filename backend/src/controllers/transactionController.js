'use strict';

const TransactionService = require('../services/transactionService');

// Controller untuk membuat transaksi baru
const createTransaction = async (req, res) => {
    try {
        const {
            date,
            amount,
            accountId,
            categoryId,
            type,
            description,
            evidence_link,
            toAccountId,
        } = req.body;

        // Validasi input dasar
        if (!date || !amount || !accountId || !type) {
            return res.status(400).json({
                success: false,
                message: 'Data Tidak Lengkap, Pastikan Tanggal, Jumlah, Akun, dan Tipe Terisi'
            })
        }

        // Validasi transfer 
        if (type === 'transfer' && !toAccountId) {
            return res.status(400).json({
                success: false,
                message: 'Untuk transfer, Akun Tujuan Harus Diisi'
            });
        };

        // Memanggil service untuk membuat transaksi
        const transaction = await TransactionService.createTransaction({
            ...req.body,
            userId: req.user.id 
        })

        res.status(201).json({
            success: true,
            message: `Transaksi ${type} Berhasil Dibuat`,
            data: transaction
        })

    }catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

const getAllTransaction = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        const filters = req.query;

        const data = await TransactionService.getAllTransactions(userId, role, filters);

        res.status(200).json({
            success: true,
            message: 'Riwayat Transaksi Berhasil Diambil',
            data: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

const updateTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await TransactionService.updateTransaction(id, req.user.id, req.user.role, req.body);

        res.status(200).json({
            success: true,
            message: 'Transaksi Berhasil Diperbarui',
            data: result
        });

    }catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

const approveTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await TransactionService.approveTransaction(id, req.user.id, req.user.role);

        res.status(200).json({
            success: true,
            message: 'Transaksi Berhasil Disetujui',
            data: result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

const rejectTransaction = async (req, res) => {
    try {
        const {id} = req.params;
        const result = await TransactionService.rejectTransaction(id, req.user.id, req.user.role);
        res.status(200).json({
            success: true,
            message: 'Transaksi Berhasil Ditolak',
            data: result
        })
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

const voidTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await TransactionService.voidTransaction(id, req.user.id);
        res.status(200).json({
            success: true,
            message: 'Transaksi Berhasil Dibatalkan',
            data: result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

const deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await TransactionService.deleteTransaction(id, userId, req.user.role);

        res.status(200).json({
            success: true,
            message: result.message,
        })
    }catch (error){
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

module.exports = { createTransaction, getAllTransaction, deleteTransaction, updateTransaction, approveTransaction, rejectTransaction, voidTransaction };