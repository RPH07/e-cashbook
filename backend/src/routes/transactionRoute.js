'use strict';

const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Create & read bisa diakses semua user yang sudah login
router.post('/', authMiddleware, transactionController.createTransaction);
router.get('/', authMiddleware, transactionController.getAllTransaction);

router.put('/:id', authMiddleware, transactionController.updateTransaction);

// Approve dan reject hanya untuk admin dan auditor
router.patch('/:id/approve', authMiddleware, roleMiddleware('admin', 'auditor'), transactionController.approveTransaction);
router.patch('/:id/reject', authMiddleware, roleMiddleware('admin', 'auditor'), transactionController.rejectTransaction);

// Void dan Delete hanya untuk admin dan finance
router.patch('/:id/void', authMiddleware, roleMiddleware('admin', 'finance'), transactionController.voidTransaction);
router.delete('/:id', authMiddleware, transactionController.deleteTransaction);

module.exports = router;