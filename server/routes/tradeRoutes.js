const express = require('express');
const router = express.Router();
const {
    createTrade,
    allocateTrade,
    closeTrade,
    getTrades,
    getClientAllocations,
    getTradeAllocations,
    getCurrentTable,
    getAllAllocations
} = require('../controllers/tradeController');
const { authMiddleware, isAdmin } = require('../middleware/authMiddleware');

router.post('/', authMiddleware, isAdmin, createTrade);
router.get('/', authMiddleware, isAdmin, getTrades);
router.get('/current', authMiddleware, isAdmin, getCurrentTable);
router.get('/allocations', authMiddleware, isAdmin, getAllAllocations);

router.post('/:id/allocate', authMiddleware, isAdmin, allocateTrade);
router.post('/:id/close', authMiddleware, isAdmin, closeTrade);
router.get('/:id/allocations', authMiddleware, isAdmin, getTradeAllocations);

router.get('/my-allocations/list', authMiddleware, getClientAllocations);

module.exports = router;