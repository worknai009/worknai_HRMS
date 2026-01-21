'use strict';
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const connectDB = require('./config/db');

// Routes
const authRoutes = require('./routes/authRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const companyRoutes = require('./routes/companyRoutes');
const hrRoutes = require('./routes/hrRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const taskRoutes = require('./routes/taskRoutes');
const recruitmentRoutes = require('./routes/recruitmentRoutes');
const onboardingRoutes = require('./routes/onboardingRoutes'); // ✅ Now this file exists

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false, contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true })); // Simplified for Dev
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api/onboarding', onboardingRoutes); // ✅ 404 Solved

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

const PORT = process.env.PORT || 5000;
const start = async () => {
  await connectDB();
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
};
start();