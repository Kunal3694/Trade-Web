// server/index.js
require("dotenv").config();
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const tradeRoutes = require('./routes/tradeRoutes');
const ledgerRoutes = require('./routes/ledgerRoutes');
const userRoutes = require("./routes/userRoutes");
const excelRoutes = require('./routes/excelRoutes');
const ruleRoutes = require("./routes/ruleRoutes");
const userLedgerRoutes = require("./routes/userLedgerRoutes");
const contactRoutes = require("./routes/contactRoutes");
const adminUserViewRoutes = require("./routes/adminUserViewRoutes");
const { authMiddleware } = require("./middleware/authMiddleware");

// Load env vars
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000',
    'http://localhost:5173',
    'https://fin-trade.netlify.app',
    "https://smartsip.co.in",
    "https://www.smartsip.co.in"],

  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed request types
  credentials: true,
}));

app.use(express.json()); // Allows us to accept JSON data in the body

// Request Logger Middleware
app.use((req, res, next) => {
  console.log(`[DEBUG LOG] ${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

console.log("[DEBUG] Registering /api/rules");
app.use("/api/rules", ruleRoutes);
console.log("[DEBUG] Registered /api/rules");
app.use('/api/trades', tradeRoutes);
app.use('/api/ledger', ledgerRoutes);
app.use('/api/users', userRoutes);
console.log("[DEBUG] Registering /api/contact");
app.use('/api/contact', contactRoutes);
console.log("[DEBUG] Registered /api/contact");
app.use('/api/user-ledger', userLedgerRoutes);
app.use('/api/reports', excelRoutes);
app.use('/api/admin/user-view', adminUserViewRoutes);

// Basic Route for testing
app.get('/', (req, res) => {
  res.send('API is running...');
});

app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({ msg: "Protected route working ✅", user: req.user });
})

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${new Date().toISOString()} - ${err.stack}`);
  res.status(500).json({
    msg: "Something went wrong on the server",
    error: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
