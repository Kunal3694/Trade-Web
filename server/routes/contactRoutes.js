const express = require('express');
const router = express.Router();
const { getContactDetails, updateContactDetails } = require('../controllers/contactController');
const { authMiddleware, isAdmin } = require('../middleware/authMiddleware');

router.get('/', getContactDetails);
router.put('/', authMiddleware, isAdmin, updateContactDetails);

module.exports = router;
