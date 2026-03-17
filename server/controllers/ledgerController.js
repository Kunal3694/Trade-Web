const LedgerEntry = require('../models/LedgerEntry');
const AllocationTrade = require('../models/AllocationTrade');
const DailyPriceFlag = require('../models/DailyPriceFlag');

// @desc    Get ledger entries - ADMIN sees all, USER sees only their own non-admin entries
// @route   GET /api/ledger
const getLedgerEntries = async (req, res) => {
    try {
        const mongoose = require('mongoose');
        let match = {};

        if (req.user.role !== 'admin') {
            // USER SIDE — filter strictly by their mob_num AND exclude admin-only entries
            match.mob_num = req.user.mob_num;
            match.is_admin_only = { $ne: true };
            match.description = { $not: /^(Master Trade Executed:|Master Trade Closed:)/ };
        }

        const entries = await LedgerEntry.aggregate([
            { $match: match },
            {
                $lookup: {
                    from: 'users',
                    localField: 'mob_num',
                    foreignField: 'mob_num',
                    as: 'user_info'
                }
            },
            {
                $lookup: {
                    from: 'admins',
                    localField: 'mob_num',
                    foreignField: 'mob_num',
                    as: 'admin_info'
                }
            },
            {
                $project: {
                    _id: 1,
                    mob_num: 1,
                    is_admin_only: 1,
                    user_name: {
                        $cond: {
                            if: { $gt: [{ $size: '$admin_info' }, 0] },
                            then: 'Admin',
                            else: {
                                $let: {
                                    vars: { u: { $arrayElemAt: ['$user_info', 0] } },
                                    in: { $ifNull: ['$$u.user_name', '$mob_num'] }
                                }
                            }
                        }
                    },
                    act_type: 1,
                    amt_cr: 1,
                    amt_dr: 1,
                    cls_balance: 1,
                    description: 1,
                    entry_date: 1
                }
            }
        ]).sort({ entry_date: -1 });

        res.status(200).json(entries);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getLedgerEntries,
    getLedgerSummary
};