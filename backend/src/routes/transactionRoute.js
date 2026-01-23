'use strict';

const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/', authMiddleware, transactionController.createTransaction);
router.get('/', authMiddleware, transactionController.getAllTransaction);
router.delete('/:id', authMiddleware, transactionController.deleteTransaction);

module.exports = router;