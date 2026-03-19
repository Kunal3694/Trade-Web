const express = require('express');
const router = express.Router();
const {
    getMyLedgerEntries,
    getMyLedgerSummary,
    getMyDashboardStats
} = require('../controllers/userLedgerController');
const { authMiddleware } = require('../middleware/authMiddleware');

// All routes are protected and strictly for the current logged-in user
router.get('/entries', authMiddleware, getMyLedgerEntries);
router.get('/summary', authMiddleware, getMyLedgerSummary);
router.get('/stats', authMiddleware, getMyDashboardStats);

module.exports = router;
