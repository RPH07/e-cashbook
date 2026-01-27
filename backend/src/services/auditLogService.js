'use strict';

const { AuditLogs } = require('../models');

class AuditLogService {
    static async record(userId, action, details) {
        try{
            await AuditLogs.create({
                userId,
                action,
                details
            });
        } catch (error) {
            throw new Error('Gagal merekam log audit: ' + error.message);
        }
    }
}

module.exports = AuditLogService;