const express = require('express');
const router = express.Router();
const { getLedgerEntries, getLedgerSummary } = require('../controllers/ledgerController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/summary', authMiddleware, getLedgerSummary);
// Get global ledger entries for admin
router.get('/', authMiddleware, getLedgerEntries);

module.exports = router;