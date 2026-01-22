'use strict';

const TransactionService = require('../services/transactionService');

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

module.exports = { createTransaction };