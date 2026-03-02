const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
    master_trade_id: { type: String },
    symbol: { type: String, required: true }, // e.g., NIFTY, BANKNIFTY
    total_qty: { type: Number, required: true },
    buy_price: { type: Number, required: true },
    total_cost: { type: Number, required: true },
    buy_timestamp: { type: Date, default: Date.now },
    sell_price: { type: Number },
    sell_timestamp: { type: Date },
    total_exit_value: { type: Number },
    master_pnl: { type: Number, default: 0 },
    allocation_tab: { type: Boolean, default: false },
    status: { type: String, default: 'OPEN', enum: ['OPEN', 'CLOSED'] }
}, { timestamps: true });

module.exports = mongoose.model('Trade', tradeSchema);  