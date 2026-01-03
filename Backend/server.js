const express = require('express');
const cors = require('cors'); 
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const mongoose = require('mongoose'); // Needed for Fix

// ================= DATABASE =================
const connectDB = require('./config/db');

// ================= ROUTES IMPORTS =================
const authRoutes = require('./routes/authRoutes');
const inquiryRoutes = require('./routes/inquiryRoutes'); // Optional
const attendanceRoutes = require('./routes/attendanceRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const companyRoutes = require('./routes/companyRoutes');
const hrRoutes = require('./routes/hrRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');

const app = express();

/* ================= SECURITY ================= */
app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);

/* ================= CORS CONFIG ================= */
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5173'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

/* ================= BODY PARSER ================= */
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

/* ================= UPLOADS DIRECTORY ================= */
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log('📁 uploads/ directory created');
}
app.use('/uploads', express.static(uploadDir));

/* ================= DATABASE CONNECT & FIX ================= */
connectDB().then(async () => {
    // 🛠️ AUTO-FIX: Remove Duplicate Index if it exists
    // Ye code ensure karega ki tumhara 'duplicate key error' permanent fix ho jaye
    try {
        const collection = mongoose.connection.collection('leaves');
        const indexes = await collection.indexes();
        
        // Check if bad index exists (userId_1_date_1)
        const badIndex = indexes.find(idx => idx.name === 'userId_1_date_1');
        
        if (badIndex) {
            console.log("⚠️ Found conflicting index 'userId_1_date_1'. Dropping it...");
            await collection.dropIndex('userId_1_date_1');
            console.log("✅ Successfully removed duplicate index. Server is now safe.");
        }
    } catch (err) {
        console.log("ℹ️ Index check passed or collection not created yet.");
    }
});

/* ================= HEALTH CHECK ================= */
app.get('/', (req, res) => {
  res.send('🚀 Smart HRMS Backend Running');
});

/* ================= API ROUTES USE ================= */
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/superadmin', superAdminRoutes);

// Optional Inquiry Route (if file exists)
try {
    app.use('/api/public-inquiry', inquiryRoutes);
} catch (e) {
    console.log("Skipping Inquiry Routes (File missing or not needed)");
}

/* ================= GLOBAL ERROR HANDLER ================= */
app.use((err, req, res, next) => {
  console.error('🔥 Global Error:', err.stack || err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});