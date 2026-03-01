const express = require('express');
const router = express.Router();
const { getLedgerEntries } = require('../controllers/ledgerController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Get ledger entries (Logic inside handles whether it's admin or user)
router.get('/', authMiddleware, getLedgerEntries);

module.exports = router;