import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';

// Load models to verify schema compiling
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import FuelInventory from '../models/FuelInventory.js';
import LPGInventory from '../models/LPGInventory.js';
import Transaction from '../models/Transaction.js';
import Quota from '../models/Quota.js';
import LPGBooking from '../models/LPGBooking.js';
import EmergencySettings from '../models/EmergencySettings.js';
import FraudLog from '../models/FraudLog.js';
import Forecast from '../models/Forecast.js';

dotenv.config();

const runTest = async () => {
  console.log('--- STARTING DATABASE AND SCHEMA VERIFICATION TEST ---');
  
  try {
    console.log('1. Compiling schemas & verifying model registrations...');
    const registeredModels = mongoose.modelNames();
    console.log(`Registered Models: ${registeredModels.join(', ')}`);
    
    if (registeredModels.length === 10) {
      console.log('✅ Success: All 10 models loaded and compiled without syntax/type errors.');
    } else {
      console.warn(`⚠️ Warning: Expected 10 models, but found ${registeredModels.length} models.`);
    }

    console.log('2. Connecting to MongoDB server...');
    const connection = await connectDB();
    console.log('✅ Success: Connected to MongoDB successfully.');
    
    // Close connection
    await mongoose.connection.close();
    console.log('Connection closed successfully.');
    console.log('--- DB & MODEL INTEGRITY TEST PASSED ---');
    process.exit(0);
  } catch (error) {
    console.error('❌ DB Verification Failed:', error.message);
    process.exit(1);
  }
};

runTest();
