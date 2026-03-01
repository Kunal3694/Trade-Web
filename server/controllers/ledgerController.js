const LedgerEntry = require('../models/LedgerEntry');

// @desc    Get ledger entries
// @route   GET /api/ledger
const getLedgerEntries = async (req, res) => {
    try {
        let query = {};
        // If the user is not an admin, restrict query to their own mobile number
        if (req.user.role !== 'admin') {
            query.mob_num = req.user.mob_num;
        }

        const entries = await LedgerEntry.find(query).sort({ entry_date: -1 });
        res.status(200).json(entries);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getLedgerEntries
};
