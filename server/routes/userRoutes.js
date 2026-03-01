const express = require("express");
const router = express.Router();
const { registerUser, loginUser, getUsers } = require("../controllers/userController");
const { authMiddleware, isAdmin } = require("../middleware/authMiddleware");

// Define routes and connect them to controller functions
router.post("/create", authMiddleware, isAdmin, registerUser);
router.post("/login", loginUser);
router.get("/", authMiddleware, isAdmin, getUsers);

module.exports = router;