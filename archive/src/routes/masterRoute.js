// backend/src/routes/masterRoute.js
const express = require('express');
const router = express.Router();

// Import Controller yang tadi
const masterController = require('../controllers/masterController');
// Import Middleware Auth (biar aman)
const authMiddleware = require('../middlewares/authMiddleware');

// Definisi Jalur
// Pastikan masterController.getAllAccounts itu ADA (function), bukan undefined
router.get('/accounts', authMiddleware, masterController.getAllAccounts);
router.get('/categories', authMiddleware, masterController.getAllCategories);

module.exports = router;