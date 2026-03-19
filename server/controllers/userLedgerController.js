const LedgerEntry = require('../models/LedgerEntry');
const AllocationTrade = require('../models/AllocationTrade');
const DailyPriceFlag = require('../models/DailyPriceFlag');
const User = require('../models/User');

// @desc    Get strictly personal ledger entries for the user
// @route   GET /api/user-ledger/entries
const getMyLedgerEntries = async (req, res) => {
    try {
        const mob_num = (req.user.mob_num);
        console.log(`[DEBUG] getMyLedgerEntries called for: ${mob_num}, Role: ${req.user.role}`);

        const entries = await LedgerEntry.find({
            mob_num: req.user.mob_num.toString()
        }).sort({ entry_date: -1 }).lean();

        console.log({ mob_num });
        console.log(`[USER LEDGER] Found ${entries.length} entries for ${mob_num}`);
        res.status(200).json(entries);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @route   GET /api/user-ledger/summary
const getMyLedgerSummary = async (req, res) => {
    try {
        const mob_num = String(req.user.mob_num);
        const entries = await LedgerEntry.find({ mob_num: mob_num }).lean();

        let baseDeposit = 0;
        let previousProfit = 0;

        entries.forEach(e => {
            if (e.act_type === 'CREDIT') baseDeposit += (e.amt_cr || 0);
            if (e.act_type === 'DEBIT') baseDeposit -= (e.amt_dr || 0);
            if (e.act_type === 'TRADE') previousProfit += ((e.amt_cr || 0) - (e.amt_dr || 0));
        });

        let currentPL = 0;
        const openAllocations = await AllocationTrade.find({ mob_num, status: 'OPEN' }).lean();

        for (let alloc of openAllocations) {
            const latestFlag = await DailyPriceFlag.findOne({ tradeId: alloc.master_trade_id }).sort({ timestamp: -1 }).lean();
            if (latestFlag) {
                const current_value = alloc.allocation_qty * latestFlag.activePrice;
                currentPL += (current_value - (alloc.total_value || 0));
            }
        }

        const totalBalance = baseDeposit + previousProfit + currentPL;

        res.status(200).json({
            baseDeposit,
            previousProfit,
            currentPL,
            totalBalance
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @route   GET /api/user-ledger/stats
const getMyDashboardStats = async (req, res) => {
    try {
        const mob_num = String(req.user.mob_num);
        const user = await User.findOne({ mob_num: mob_num }).select('current_balance user_name client_id').lean();

        const openTrades = await AllocationTrade.countDocuments({ mob_num: mob_num, status: 'OPEN' });

        // Also get the summary info for P&L tracking
        const entries = await LedgerEntry.find({ mob_num: mob_num }).lean();
        let totalPnL = 0;
        entries.forEach(e => {
            if (e.act_type === 'TRADE') totalPnL += ((e.amt_cr || 0) - (e.amt_dr || 0));
        });

        res.status(200).json({
            user: {
                name: user?.user_name || 'User',
                clientId: user?.client_id || 'N/A',
                balance: user?.current_balance || 0
            },
            stats: {
                totalPnL,
                openTradesCount: openTrades
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getMyLedgerEntries,
    getMyLedgerSummary,
    getMyDashboardStats
};
