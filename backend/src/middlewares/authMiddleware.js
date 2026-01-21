'use strict';

const jwt = require ('jsonwebtoken');

const authMiddleware = (req, res, next) => {

    const authHeader = req.headers['authorization'];

    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            status: 'fail',
            message: 'Akses Ditolak! Token tidak ditemukan'
        });
    }

    try {
       const verified = jwt.verify(token, process.env.JWT_SECRET);

       req.user = verified;
         next();
    }catch (error) {
        console.error('Token verification error:', error);
        return res.status(403).json({
            status: 'fail',
            message: 'Token tidak valid atau Kadaluwarsa!'
        });
    }
}

module.exports = authMiddleware;