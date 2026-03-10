/*
Simple migration script to assign a company to users that lack one.
Usage: node scripts/fixUserCompany.js
*/
const mongoose = require('mongoose');
const User = require('../models/User');
const MenuItem = require('../models/MenuItem');

// load environment variables from backend/.env by default
require('dotenv').config({ path: './.env' });

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // find a user missing company
    const users = await User.find({ company: { $exists: false } });
    if (users.length === 0) {
      console.log('No users without company found');
      process.exit(0);
    }

    // find a sample company from existing menu items
    const item = await MenuItem.findOne();
    if (!item) {
      console.log('No menu items found; cannot infer company');
      process.exit(1);
    }

    const companyId = item.company;
    console.log('Assigning company', companyId, 'to', users.length, 'users');

    for (const user of users) {
      user.company = companyId;
      await user.save();
      console.log('Updated user', user._id);
    }

    console.log('Migration complete');
    process.exit(0);
  } catch (err) {
    console.error('Migration error', err);
    process.exit(1);
  }
}

run();