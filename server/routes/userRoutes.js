const express = require("express");
const router = express.Router();
const { registerUser, loginUser, getUsers, updateUser, addFunds, withdrawFunds } = require("../controllers/userController");
const { authMiddleware, isAdmin } = require("../middleware/authMiddleware");

// Define routes and connect them to controller functions
router.post("/create", authMiddleware, isAdmin, registerUser);
router.post("/login", loginUser);
router.get("/", authMiddleware, isAdmin, getUsers);
router.put("/:id", authMiddleware, isAdmin, updateUser);
router.post("/:id/add-funds", authMiddleware, isAdmin, addFunds);
router.post("/:id/withdraw-funds", authMiddleware, isAdmin, withdrawFunds);

module.exports = router;