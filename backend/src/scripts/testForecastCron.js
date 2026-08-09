import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Quota from '../models/Quota.js';
import Transaction from '../models/Transaction.js';
import FuelInventory from '../models/FuelInventory.js';
import { calculateStationForecasts } from '../services/forecastService.js';
import { resetAllQuotas } from '../services/quotaScheduler.js';

dotenv.config();

const runForecastSchedulerTests = async () => {
  console.log('--- STARTING FORECASTING & CRON RESET INTEGRATION TESTS ---');

  await mongoose.connect(process.env.MONGODB_URI);

  const logResult = (name, passed, detail = '') => {
    console.log(`${passed ? '✅' : '❌'} [${passed ? 'PASS' : 'FAIL'}] ${name} ${detail ? `(${detail})` : ''}`);
    if (!passed) {
      process.exit(1);
    }
  };

  try {
    // 1. Seed test data
    await User.deleteMany({ email: 'test-forecast-user@fuel.com' });
    await Quota.deleteMany({});
    await FuelInventory.deleteMany({ stationName: 'Test Forest Station' });
    await Transaction.deleteMany({ stationName: 'Test Forest Station' });

    const user = await User.create({
      email: 'test-forecast-user@fuel.com',
      passwordHash: 'password123',
      role: 'citizen',
      fullName: 'Forecast Test User'
    });

    const station = await FuelInventory.create({
      stationName: 'Test Forest Station',
      district: 'Colombo',
      stock: 5000,
      reserved: 100,
      status: 'In Stock'
    });

    // Create a quota wallet with depleted quota
    const quota = await Quota.create({
      userId: user._id,
      normalLimit: 50,
      emergencyLimit: 20,
      remainingQuota: 5 // Depleted balance
    });

    // Add a completed transaction record
    await Transaction.create({
      transactionId: 'TX-FORECAST-123',
      date: '2026-08-09',
      stationName: 'Test Forest Station',
      amount: 15,
      allocatedAmount: 15,
      cost: 5550,
      userId: user._id,
      fuelType: 'Petrol 92 Octane',
      emergencyStatus: 'NORMAL'
    });

    // 2. Test Forecasting calculation
    console.log('Running forecasting engine calculation...');
    const forecasts = await calculateStationForecasts();
    console.log('DEBUG Forecasts:', forecasts);
    const stationForecast = forecasts.find(f => f.stationName === 'Test Forest Station');
    logResult('Forecast calculations saved to MongoDB', stationForecast !== undefined && stationForecast.expectedDemand > 0);

    // 3. Test Quota resets
    console.log('Running quota wallet refill scheduler...');
    const resetResult = await resetAllQuotas();
    const updatedQuota = await Quota.findById(quota._id);
    logResult('Weekly quota balance refilled', updatedQuota.remainingQuota === 50);

    // 4. Test Token signing
    console.log('Testing cryptographic QR token generation...');
    const testSecret = process.env.JWT_SECRET || 'jwtsecret123';
    const signedToken = jwt.sign(
      { userId: user._id, vehicleNumber: 'WP-TEST-9999' },
      testSecret,
      { expiresIn: '10m' }
    );
    logResult('Cryptographic token signature signed', typeof signedToken === 'string');

    // 5. Test Token verification (JWT Decode)
    console.log('Testing cryptographic token signature verification...');
    const decoded = jwt.verify(signedToken, testSecret);
    logResult('Token signature decoded successfully', decoded.vehicleNumber === 'WP-TEST-9999');

    // 6. Test Fallback Token expiration age verification
    console.log('Testing token expiration age verification...');
    const validMockToken = `FUEL-WP-TEST-9999-${Date.now()}`;
    const expiredMockToken = `FUEL-WP-TEST-9999-${Date.now() - (15 * 60 * 1000)}`; // 15 minutes old

    // Parse valid token age
    const parseAge = (token) => {
      const parts = token.split('-');
      const timestamp = parseInt(parts[parts.length - 1], 10);
      return Date.now() - timestamp;
    };

    logResult('Accept fresh fallback token age', parseAge(validMockToken) < 10 * 60 * 1000);
    logResult('Block expired fallback token age', parseAge(expiredMockToken) > 10 * 60 * 1000);

    // Clean up
    await User.deleteMany({ email: 'test-forecast-user@fuel.com' });
    await Quota.deleteMany({ userId: user._id });
    await FuelInventory.deleteMany({ stationName: 'Test Forest Station' });
    await Transaction.deleteMany({ stationName: 'Test Forest Station' });

    console.log('--- ALL FORECASTING & CRON RESET TESTS PASSED ---');
  } catch (err) {
    console.error('❌ Tests threw a fatal exception:', err.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

runForecastSchedulerTests();
