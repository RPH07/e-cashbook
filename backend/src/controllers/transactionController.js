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
                status: 'fail',
                message: 'Data Tidak Lenkap, Pastikan Tanggal, Jumlah, Akun, dan Tipe Terisi'
            })
        }

        // Validasi transfer 
        if (type === 'transfer' && !toAccountId) {
            return res.status(400).json({
                status: 'fail',
                message: 'Untuk transfer, Akun Tujuan Harus Diisi'
            });
        };

        // Memanggil service untuk membuat transaksi
        const Transaction = await TransactionService.createTransaction({
            date,
            amount,
            accountId,
            categoryId,
            type,
            description,
            evidence_link,
            toAccountId,
            userId: req.user.id 
        })

        res.status(201).json({
            status: 'success',
            message: `Transaksi ${type} Berhasil Dibuat`,
            data: Transaction
        })

    }catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        })
    }
}

const getAllTransaction = async (req, res) => {
    try {
        const userId = req.user.id;

        const data = await TransactionService.getAllTransactions(userId);

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

const deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await TransactionService.deleteTransaction(id, userId);

        res.status(200).json({
            success: true,
            message: result.message,
        })
    }catch (error){
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

module.exports = { createTransaction, getAllTransaction, deleteTransaction};