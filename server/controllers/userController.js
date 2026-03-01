const User = require("../models/User");
const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
// @desc    Register a new user (Admin only)
// @route   POST /api/users/create
const registerUser = async (req, res) => {
  try {
    const { user_name, mob_num, password, percentage } = req.body;

    const existing = await User.findOne({ mob_num });
    if (existing) return res.status(400).json({ msg: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const client_id = "CID" + Math.floor(100000 + Math.random() * 900000);

    const user = await User.create({
      client_id,
      user_name,
      mob_num,
      password: hashedPassword,
      percentage,
      current_balance: 0,
      role: "user",
      status: "active"
    });

    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/users/login
const loginUser = async (req, res) => {
  try {
    const { mob_num, password } = req.body;

    // Check Admin first
    let user = await Admin.findOne({ mob_num });
    let role = "admin";

    if (!user) {
      // Check User
      user = await User.findOne({ mob_num });
      role = user ? user.role : null;
    }

    if (!user) return res.status(400).json({ msg: "Invalid mobile number" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid password" });

    const token = jwt.sign(
      { id: user._id, mob_num: user.mob_num, role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        user_name: user.user_name,
        mob_num: user.mob_num,
        role,
        ...(role === 'user' && { client_id: user.client_id, status: user.status })
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// @desc    Get all users
// @route   GET /api/users
const getUsers = async (req, res) => {
  try {
    // Fetch all users sorted by newest first, exclude password
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Make sure getUsers is exported here!
module.exports = { registerUser, loginUser, getUsers };