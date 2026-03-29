// server/routes/adminUserViewRoutes.js
const express = require('express');
const router = express.Router();
const { authMiddleware, isAdmin } = require('../middleware/authMiddleware');
const AllocationTrade = require('../models/AllocationTrade');
const LedgerEntry = require('../models/LedgerEntry');
const DailyPriceFlag = require('../models/DailyPriceFlag');
const User = require('../models/User');

// Helper: build a mob_num query that matches BOTH string AND number stored values
const mobQuery = (mob_num_param) => {
    const str = String(mob_num_param);
    const num = Number(mob_num_param);
    if (!isNaN(num)) {
        return { $in: [str, num] };
    }
    return str;
};

// @desc    Admin - Get a specific user's allocations (for dashboard preview)
// @route   GET /api/admin/user-view/:mob_num/allocations
router.get('/:mob_num/allocations', authMiddleware, isAdmin, async (req, res) => {
    try {
        const mob_num_q = mobQuery(req.params.mob_num);
        const allocations = await AllocationTrade.find({ mob_num: mob_num_q })
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
    } catch (error) {
        console.error('[AdminUserView] allocations error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Admin - Get a specific user's ledger summary
// @route   GET /api/admin/user-view/:mob_num/ledger-summary
router.get('/:mob_num/ledger-summary', authMiddleware, isAdmin, async (req, res) => {
    try {
        const mob_num_q = mobQuery(req.params.mob_num);
        const entries = await LedgerEntry.find({ mob_num: mob_num_q }).lean();

        let baseDeposit = 0;
        let previousProfit = 0;

        entries.forEach(e => {
            if (e.act_type === 'CREDIT') baseDeposit += (e.amt_cr || 0);
            if (e.act_type === 'DEBIT') baseDeposit -= (e.amt_dr || 0);
            if (e.act_type === 'TRADE') previousProfit += ((e.amt_cr || 0) - (e.amt_dr || 0));
        });

        let currentPL = 0;
        const openAllocations = await AllocationTrade.find({ mob_num: mob_num_q, status: 'OPEN' }).lean();

        for (let alloc of openAllocations) {
            const latestFlag = await DailyPriceFlag.findOne({ tradeId: alloc.master_trade_id }).sort({ timestamp: -1 }).lean();
            if (latestFlag) {
                const current_value = alloc.allocation_qty * latestFlag.activePrice;
                currentPL += (current_value - (alloc.total_value || 0));
            }
        }

        const totalBalance = baseDeposit + previousProfit + currentPL;

        res.status(200).json({ baseDeposit, previousProfit, currentPL, totalBalance });
    } catch (error) {
        console.error('[AdminUserView] ledger-summary error:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Admin - Get a specific user's ledger entries
// @route   GET /api/admin/user-view/:mob_num/ledger-entries
router.get('/:mob_num/ledger-entries', authMiddleware, isAdmin, async (req, res) => {
    try {
        const mob_num_q = mobQuery(req.params.mob_num);
        const entries = await LedgerEntry.find({ mob_num: mob_num_q }).sort({ entry_date: -1 }).lean();
        res.status(200).json(entries);
    } catch (error) {
        console.error('[AdminUserView] ledger-entries error:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
