const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/login', authController.login);

router.get('/me', authMiddleware, (req, res) => {
    res.json({
        status: 'succes',
        message: 'Middleware Berhasil! Kamu Adalah User Sah',
        user: req.user
    })
});

module.exports = router;