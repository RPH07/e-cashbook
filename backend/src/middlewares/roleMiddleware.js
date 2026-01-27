'use strict';

/**
 * 
 * @param {...string} allowedRoles 
 */

const roleMiddleware = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                status: 'fail',
                message: 'Akses Ditolak! Silahkan Login Kembali'
            });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                status: 'fail',
                message: `Akses Ditolak! ${req.user.role} tidak memiliki izin mengakses sumber daya ini`
            });
        }

        next();
    }
}

module.exports = roleMiddleware;