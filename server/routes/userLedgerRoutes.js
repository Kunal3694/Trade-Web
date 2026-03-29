const express = require('express');
const router = express.Router();
const {
    getMyLedgerEntries,
    getMyLedgerSummary,
    getMyDashboardStats
} = require('../controllers/userLedgerController');
const { authMiddleware, isAdmin } = require('../middleware/authMiddleware');
const AllocationTrade = require('../models/AllocationTrade');
const LedgerEntry = require('../models/LedgerEntry');
const DailyPriceFlag = require('../models/DailyPriceFlag');

// All routes are protected and strictly for the current logged-in user
router.get('/entries', authMiddleware, getMyLedgerEntries);
router.get('/summary', authMiddleware, getMyLedgerSummary);
router.get('/stats', authMiddleware, getMyDashboardStats);

// ===== ADMIN: View any user's dashboard data =====
// Helper: query mob_num as both string AND number to handle type mismatches
const buildMobQuery = (param) => {
    const str = String(param);
    const num = Number(param);
    return !isNaN(num) ? { $in: [str, num] } : str;
};

// GET /api/user-ledger/admin-view/:mob_num/allocations
router.get('/admin-view/:mob_num/allocations', authMiddleware, isAdmin, async (req, res) => {
    try {
        const mobQ = String(req.params.mob_num);
        const allocations = await AllocationTrade.find({ mob_num: mobQ })
            .populate('master_trade_id', 'symbol')
            .sort({ createdAt: -1 })
            .lean();

        for (let alloc of allocations) {
            if (alloc.status === 'OPEN' && alloc.master_trade_id) {
                const latestFlag = await DailyPriceFlag.findOne({ tradeId: alloc.master_trade_id._id }).sort({ timestamp: -1 });
                if (latestFlag) {
                    alloc.current_value = alloc.allocation_qty * latestFlag.activePrice;
                    alloc.active_price = latestFlag.activePrice;
                    alloc.client_pnl = (alloc.current_value - alloc.total_value) - (alloc.buy_brokerage || 0);
                } else {
                    alloc.current_value = alloc.total_value;
                    alloc.active_price = alloc.allocation_price;
                }
            } else {
                alloc.current_value = alloc.exit_value;
            }
        }
        res.status(200).json(allocations);
    } catch (err) {
        console.error('[AdminView] allocations error:', err);
        res.status(500).json({ message: err.message });
    }
});

// GET /api/user-ledger/admin-view/:mob_num/ledger-summary
router.get('/admin-view/:mob_num/ledger-summary', authMiddleware, isAdmin, async (req, res) => {
    try {
        const mobQ = String(req.params.mob_num);
        const entries = await LedgerEntry.find({ mob_num: mobQ }).lean();

        let baseDeposit = 0, previousProfit = 0;
        entries.forEach(e => {
            if (e.act_type === 'CREDIT') baseDeposit += (e.amt_cr || 0);
            if (e.act_type === 'DEBIT') baseDeposit -= (e.amt_dr || 0);
            if (e.act_type === 'TRADE') previousProfit += ((e.amt_cr || 0) - (e.amt_dr || 0));
        });

        let currentPL = 0;
        const openAllocs = await AllocationTrade.find({ mob_num: mobQ, status: 'OPEN' }).lean();
        for (let alloc of openAllocs) {
            const flag = await DailyPriceFlag.findOne({ tradeId: alloc.master_trade_id }).sort({ timestamp: -1 }).lean();
            if (flag) currentPL += (alloc.allocation_qty * flag.activePrice) - (alloc.total_value || 0);
        }

        res.status(200).json({ baseDeposit, previousProfit, currentPL, totalBalance: baseDeposit + previousProfit + currentPL });
    } catch (err) {
        console.error('[AdminView] ledger-summary error:', err);
        res.status(500).json({ message: err.message });
    }
});

// GET /api/user-ledger/admin-view/:mob_num/ledger-entries
router.get('/admin-view/:mob_num/ledger-entries', authMiddleware, isAdmin, async (req, res) => {
    try {
        const mobQ = String(req.params.mob_num);
        const entries = await LedgerEntry.find({ mob_num: mobQ }).sort({ entry_date: -1 }).lean();
        res.status(200).json(entries);
    } catch (err) {
        console.error('[AdminView] ledger-entries error:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
