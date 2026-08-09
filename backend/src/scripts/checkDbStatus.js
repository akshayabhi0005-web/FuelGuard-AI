import mongoose from 'mongoose';
import dotenv from 'dotenv';
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

const checkStatus = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('--- MongoDB Collections Audit ---');
    console.log(`Users: ${await User.countDocuments()}`);
    console.log(`Vehicles: ${await Vehicle.countDocuments()}`);
    console.log(`FuelInventory: ${await FuelInventory.countDocuments()}`);
    console.log(`LPGInventory: ${await LPGInventory.countDocuments()}`);
    console.log(`Transactions: ${await Transaction.countDocuments()}`);
    console.log(`Quotas: ${await Quota.countDocuments()}`);
    console.log(`LPGBookings: ${await LPGBooking.countDocuments()}`);
    console.log(`EmergencySettings: ${await EmergencySettings.countDocuments()}`);
    console.log(`FraudLogs: ${await FraudLog.countDocuments()}`);
    console.log(`Forecasts: ${await Forecast.countDocuments()}`);
    console.log('---------------------------------');
  } catch (err) {
    console.error('Error checking DB:', err.message);
  } finally {
    await mongoose.connection.close();
  }
};

checkStatus();
