'use strict';

const {Transaction, Account, sequelize} = require('../models');

class ReportService {
    static async getDashboardSummary(userId, role) {
        try {
            // Tentukan kondisi filter berdasarkan role
            const whereCondition = (role === 'admin' || role === 'auditor') ? {} : { userId };

            const account = await Account.findAll({
                where: whereCondition,
                attributes: [
                    'account_type', 
                    [sequelize.fn('SUM', sequelize.col('balance')), 'total_balance']
                ],
                group: ['account_type']
            });

            let tabungan = 0;
            let giro = 0;

            account.forEach(acc => {
                const total = parseFloat(acc.getDataValue('total_balance')) || 0;
                if (acc.account_type === 'tabungan') tabungan = total;
                if (acc.account_type === 'giro') giro = total;
            })

            const summary = await Transaction.findAll({
                where: {
                    ...whereCondition,
                    status: 'approved'
                },
                attributes: [
                    'type',
                    [sequelize.fn('SUM', sequelize.col('amount')), 'total_amount']
                ],
                group: ['type']
            })

            return {
                saldo_tabungan: tabungan,
                saldo_giro: giro,
                saldo_total: tabungan + giro, 
                summary
            }


        } catch (error) {
            throw error;
        }
    }
}

module.exports = ReportService;