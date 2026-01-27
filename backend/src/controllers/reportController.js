'use strict';

const ReportService = require('../services/reportService');
const {AuditLogs, Users} = require('../models');

const getDashboardData = async (req, res) => {
    try {
        const summary = await ReportService.getDashboardSummary(req.user.id, req.user.role);

        res.status(200).json({
            success: true,
            message: 'Data Dashboard Berhasil Diambil',
            data: summary
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

const getAuditLogs = async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'auditor') {
            return res.status(403).json({
                success: false,
                message: 'Akses ditolak. Hanya admin dan auditor yang dapat mengakses log audit.'
            });
        }

        const logs = await AuditLogs.findAll({
            include: [{
                model: Users,
                as: 'user',
                attributes: ['name', 'role']
            }],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            success: true,
            message: 'Log Audit Berhasil Diambil',
            data: logs
        });

    }catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

module.exports = { getDashboardData, getAuditLogs };