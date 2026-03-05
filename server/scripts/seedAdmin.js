require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

const seedAdmin = async () => {
  await connectDB();

  const existing = await User.findOne({ email: process.env.ADMIN_EMAIL });

  if (existing) {
    console.log('Admin already exists:', existing.email);
    process.exit(0);
  }

  const admin = await User.create({
    name: 'Administrator',
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    role: 'admin',
    isActive: true,
  });

  console.log(`Admin created: ${admin.email}`);
  process.exit(0);
};

seedAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
