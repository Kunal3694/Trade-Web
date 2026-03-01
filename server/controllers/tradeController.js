const Trade = require('../models/Trade');
const User = require('../models/User');
const AllocationTrade = require('../models/AllocationTrade');
const LedgerEntry = require('../models/LedgerEntry');
const yahooFinance = require('yahoo-finance2').default;

// @desc    Create a new Master Trade
// @route   POST /api/trades
const createTrade = async (req, res) => {
    try {
        const { symbol, total_qty, buy_price } = req.body;
        const total_cost = total_qty * buy_price;

        const master_trade_id = "MT-" + Date.now() + Math.floor(Math.random() * 1000);

        const trade = await Trade.create({
            master_trade_id,
            symbol,
            total_qty,
            buy_price,
            total_cost,
            allocation_tab: false,
            status: "OPEN"
        });

        res.status(201).json(trade);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Allocate master trade to users
// @route   POST /api/trades/:id/allocate
const allocateTrade = async (req, res) => {
    try {
        const { id } = req.params;
        const { allocations } = req.body; // Array of { mob_num, allocation_qty }

        const trade = await Trade.findById(id);
        if (!trade) return res.status(404).json({ message: "Trade not found" });
        if (trade.status === 'CLOSED') return res.status(400).json({ message: "Cannot allocate a closed trade" });

        const totalAllocated = allocations.reduce((sum, alloc) => sum + Number(alloc.allocation_qty), 0);
        if (totalAllocated > trade.total_qty) {
            return res.status(400).json({ message: "Total allocation exceeds master trade quantity" });
        }

        const allocationDocs = [];

        for (const alloc of allocations) {
            const user = await User.findOne({ mob_num: alloc.mob_num });
            if (!user) return res.status(404).json({ message: `User ${alloc.mob_num} not found` });

            const allocation_id = "AL-" + Date.now() + Math.floor(Math.random() * 1000);
            const total_value = alloc.allocation_qty * trade.buy_price;

            allocationDocs.push({
                allocation_id,
                master_trade_id: trade._id,
                mob_num: alloc.mob_num,
                allocation_qty: alloc.allocation_qty,
                allocation_price: trade.buy_price,
                total_value,
                status: "OPEN"
            });
        }

        if (allocationDocs.length > 0) {
            await AllocationTrade.insertMany(allocationDocs);
            trade.allocation_tab = true;
            await trade.save();
        }

        res.status(200).json({ message: "Allocations successful" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Close a Master Trade
// @route   POST /api/trades/:id/close
const closeTrade = async (req, res) => {
    try {
        const { id } = req.params;
        const { sell_price } = req.body;

        const trade = await Trade.findById(id);
        if (!trade) return res.status(404).json({ message: "Trade not found" });
        if (trade.status === 'CLOSED') return res.status(400).json({ message: "Trade already closed" });

        // Calculate Master P&L
        trade.sell_price = sell_price;
        trade.sell_timestamp = new Date();
        trade.total_exit_value = trade.total_qty * sell_price;
        trade.master_pnl = trade.total_exit_value - trade.total_cost;
        trade.status = 'CLOSED';

        // Find & Close all allocations for this trade
        const allocations = await AllocationTrade.find({ master_trade_id: trade._id, status: 'OPEN' });

        for (const alloc of allocations) {
            alloc.exit_price = sell_price;
            alloc.sell_timestamp = new Date();
            alloc.exit_value = alloc.allocation_qty * sell_price;
            alloc.client_pnl = alloc.exit_value - alloc.total_value;
            alloc.status = 'CLOSED';
            await alloc.save();

            // Create Ledger Entry and update User balance
            const user = await User.findOne({ mob_num: alloc.mob_num });
            if (user) {
                const amt_cr = alloc.client_pnl > 0 ? alloc.client_pnl : 0;
                const amt_dr = alloc.client_pnl < 0 ? Math.abs(alloc.client_pnl) : 0;
                const cls_balance = user.current_balance + amt_cr - amt_dr;

                await LedgerEntry.create({
                    mob_num: user.mob_num,
                    act_type: 'TRADE',
                    amt_cr,
                    amt_dr,
                    cls_balance,
                    description: `P&L for closed trade ${trade.symbol}`
                });

                user.current_balance = cls_balance;
                await user.save();
            }
        }

        await trade.save();
        res.status(200).json({ message: "Trade closed successfully", trade });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all Master Trades (Admin)
// @route   GET /api/trades
const getTrades = async (req, res) => {
    try {
        const trades = await Trade.find().sort({ createdAt: -1 });
        res.status(200).json(trades);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get trades allocated to a specific user (Client view)
// @route   GET /api/trades/my-allocations
const getClientAllocations = async (req, res) => {
    try {
        const allocations = await AllocationTrade.find({ mob_num: req.user.mob_num })
            .populate('master_trade_id', 'symbol')
            .sort({ createdAt: -1 });
        res.status(200).json(allocations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get allocations for a master trade (Admin view)
// @route   GET /api/trades/:id/allocations
const getTradeAllocations = async (req, res) => {
    try {
        const allocations = await AllocationTrade.find({ master_trade_id: req.params.id });
        res.status(200).json(allocations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Current Table with Unrealized PNL (Admin)
// @route   GET /api/trades/current
const getCurrentTable = async (req, res) => {
    try {
        const openTrades = await Trade.find({ status: 'OPEN' }).sort({ createdAt: -1 });
        const currentData = [];

        // Dictionary to prevent duplicate fetches in the loop
        const livePrices = {};

        for (const trade of openTrades) {
            let symbolMap = trade.symbol;
            // Map common indian indices
            if (symbolMap.toUpperCase() === 'NIFTY') symbolMap = '^NSEI';
            if (symbolMap.toUpperCase() === 'BANKNIFTY') symbolMap = '^NSEBANK';
            if (symbolMap.toUpperCase() === 'SENSEX') symbolMap = '^BSESN';

            let curPrice = trade.buy_price;
            try {
                if (!livePrices[symbolMap]) {
                    const quote = await yahooFinance.quote(symbolMap);
                    livePrices[symbolMap] = quote.regularMarketPrice;
                }
                curPrice = livePrices[symbolMap] || curPrice;
            } catch (err) {
                console.error(`Error fetching ${symbolMap}:`, err);
            }

            const current_price = curPrice;
            const unrealized_pnl = (current_price - trade.buy_price) * trade.total_qty;

            currentData.push({
                master_trade_id: trade.master_trade_id,
                symbol: trade.symbol,
                total_qty: trade.total_qty,
                buy_price: trade.buy_price,
                current_price,
                unrealized_pnl,
                date: trade.buy_timestamp
            });
        }

        res.status(200).json(currentData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all allocations (Admin view)
// @route   GET /api/trades/allocations
const getAllAllocations = async (req, res) => {
    try {
        const allocations = await AllocationTrade.find()
            .populate('master_trade_id', 'symbol')
            .sort({ createdAt: -1 });
        res.status(200).json(allocations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createTrade,
    allocateTrade,
    closeTrade,
    getTrades,
    getClientAllocations,
    getTradeAllocations,
    getCurrentTable,
    getAllAllocations
};