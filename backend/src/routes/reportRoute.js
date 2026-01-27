'use strict';

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Endpoint dashboard bisa diakses semua user yang sudah login
router.get('/dashboard', authMiddleware, reportController.getDashboardData);

// Endpoint audit logs hanya untuk admin dan auditor
router.get('/audit-logs', authMiddleware, roleMiddleware('admin', 'auditor'), reportController.getAuditLogs);


module.exports = router;