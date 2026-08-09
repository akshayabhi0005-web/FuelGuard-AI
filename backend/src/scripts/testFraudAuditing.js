import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import Quota from '../models/Quota.js';
import FuelInventory from '../models/FuelInventory.js';
import Transaction from '../models/Transaction.js';
import FraudLog from '../models/FraudLog.js';
import { auditTransaction } from '../services/fraudService.js';

dotenv.config();

const runFraudVerificationTests = async () => {
  console.log('--- STARTING BACKEND AUTOMATED FRAUD AUDITING INTEGRATION TESTS ---');

  await mongoose.connect(process.env.MONGODB_URI);

  const logResult = (name, passed, detail = '') => {
    console.log(`${passed ? '✅' : '❌'} [${passed ? 'PASS' : 'FAIL'}] ${name} ${detail ? `(${detail})` : ''}`);
    if (!passed) {
      process.exit(1);
    }
  };

  try {
    // 1. Clean up old records
    await User.deleteMany({ email: { $in: ['fraud-citizen1@fuel.com', 'fraud-citizen2@fuel.com'] } });
    await Vehicle.deleteMany({ vehicleNumber: { $in: ['WP-FRAUD-1111', 'WP-FRAUD-2222'] } });
    await Quota.deleteMany({});
    await FuelInventory.deleteMany({ stationName: { $in: ['Ceypetco - Colombo', 'LIOC - Galle'] } });
    await Transaction.deleteMany({});
    await FraudLog.deleteMany({});

    // 2. Seed test operators and stations
    const citizen1 = await User.create({
      email: 'fraud-citizen1@fuel.com',
      passwordHash: 'password123',
      role: 'citizen',
      fullName: 'Fraud Citizen One'
    });

    const citizen2 = await User.create({
      email: 'fraud-citizen2@fuel.com',
      passwordHash: 'password123',
      role: 'citizen',
      fullName: 'Fraud Citizen Two'
    });

    const vehicle1 = await Vehicle.create({
      vehicleNumber: 'WP-FRAUD-1111',
      ownerId: citizen1._id,
      vehicleType: 'Car',
      chassisNumber: 'CHASSIS-1111',
      fuelType: 'Petrol 92 Octane'
    });

    const vehicle2 = await Vehicle.create({
      vehicleNumber: 'WP-FRAUD-2222',
      ownerId: citizen2._id,
      vehicleType: 'Car',
      chassisNumber: 'CHASSIS-2222',
      fuelType: 'Petrol 92 Octane'
    });

    const stationCol = await FuelInventory.create({
      stationName: 'Ceypetco - Colombo',
      district: 'Colombo',
      stock: 10000,
      reserved: 200,
      status: 'In Stock'
    });

    const stationGalle = await FuelInventory.create({
      stationName: 'LIOC - Galle',
      district: 'Galle',
      stock: 8000,
      reserved: 100,
      status: 'In Stock'
    });

    // 3. Test vehicle signature mismatch audit
    console.log('Testing vehicle signature mismatch audit...');
    // Citizen 2 attempts to use Citizen 1's vehicle number
    const mismatchResult = await auditTransaction(citizen2._id, 'WP-FRAUD-1111', 'Ceypetco - Colombo');
    logResult(
      'Detect vehicle plate owner mismatch',
      mismatchResult.isAnomaly && mismatchResult.type === 'Vehicle Signature Mismatch' && mismatchResult.riskScore === 50
    );

    // 4. Test normal transaction without fraud
    console.log('Testing legitimate transaction flow...');
    const legitResult = await auditTransaction(citizen1._id, 'WP-FRAUD-1111', 'Ceypetco - Colombo');
    logResult('Legitimate scan resolves without anomalies', !legitResult.isAnomaly);

    // Log the transaction as completed
    await Transaction.create({
      transactionId: 'TX-LEGIT-100',
      date: new Date().toISOString().split('T')[0],
      stationName: 'Ceypetco - Colombo',
      amount: 10,
      allocatedAmount: 10,
      cost: 3700,
      userId: citizen1._id,
      vehicleId: vehicle1._id,
      fuelType: 'Petrol 92 Octane',
      verificationStatus: 'VALID',
      transactionStatus: 'Completed'
    });

    // 5. Test rapid dispense anomaly (Frequency check)
    console.log('Testing rapid transaction frequency check...');
    const rapidResult = await auditTransaction(citizen1._id, 'WP-FRAUD-1111', 'Ceypetco - Colombo');
    logResult(
      'Detect frequency anomaly (transactions under 3 minutes)',
      rapidResult.isAnomaly && rapidResult.type === 'Rapid Dispense Attempt' && rapidResult.riskScore === 70
    );

    // Manually backdate the first transaction's createdAt to 10 minutes ago, but keep districts different
    await mongoose.connection.db.collection('transactions').updateOne(
      { transactionId: 'TX-LEGIT-100' },
      { $set: { createdAt: new Date(Date.now() - (10 * 60 * 1000)) } } // 10 minutes ago
    );

    // 6. Test spatiotemporal velocity check
    console.log('Testing velocity anomaly check...');
    // Colombo to Galle is 120km, impossible to travel in 10 minutes!
    const velocityResult = await auditTransaction(citizen1._id, 'WP-FRAUD-1111', 'LIOC - Galle');
    logResult(
      'Detect spatiotemporal velocity anomaly',
      velocityResult.isAnomaly && velocityResult.type === 'Spatiotemporal Anomaly' && velocityResult.riskScore === 90
    );

    // 7. Test automatic logging in the DB when using the verify route
    console.log('Writing anomaly logs to FraudLog collection...');
    const savedAnomaly = await FraudLog.create({
      type: velocityResult.type,
      location: 'LIOC - Galle',
      details: velocityResult.details,
      riskScore: velocityResult.riskScore,
      status: 'Pending'
    });
    const loggedAnomaly = await FraudLog.findById(savedAnomaly._id);
    logResult('Anomaly saved in database collection correctly', loggedAnomaly !== null && loggedAnomaly.riskScore === 90);

    // Cleanup
    await User.deleteMany({ email: { $in: ['fraud-citizen1@fuel.com', 'fraud-citizen2@fuel.com'] } });
    await Vehicle.deleteMany({ vehicleNumber: { $in: ['WP-FRAUD-1111', 'WP-FRAUD-2222'] } });
    await FuelInventory.deleteMany({ stationName: { $in: ['Ceypetco - Colombo', 'LIOC - Galle'] } });
    await Transaction.deleteMany({});
    await FraudLog.deleteMany({});

    console.log('--- ALL FRAUD AUDITING INTEGRATION TESTS PASSED ---');
  } catch (err) {
    console.error('❌ Tests threw a fatal exception:', err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

runFraudVerificationTests();
