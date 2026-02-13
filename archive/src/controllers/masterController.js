// backend/src/controllers/masterController.js
const { Account, Category } = require('../models');

exports.getAllAccounts = async (req, res) => {
    try {
        const accounts = await Account.findAll();
        res.status(200).json({
            status: 'success',
            data: accounts
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.findAll();
        res.status(200).json({
            status: 'success',
            data: categories
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};