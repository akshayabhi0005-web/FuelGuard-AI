import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });
import mongoose from 'mongoose';
import { generateQrToken, verifyQuotaToken, createTransaction } from '../controllers/transactionController.js';
import SecureToken from '../models/SecureToken.js';
import User from '../models/User.js';
import Quota from '../models/Quota.js';
import Vehicle from '../models/Vehicle.js';
import Transaction from '../models/Transaction.js';

const testSecureTokens = async () => {
  console.log('--- STARTING SECURE TOKEN LIFECYCLE TESTS ---');
  
  // 1. Database Connection
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Database connected.');

  // Clean prior tests
  const testEmail = 'citizen-token-test@fuel.com';
  const testPlate = 'WP-TOKEN-9999';

  const existingUser = await User.findOne({ email: testEmail });
  if (existingUser) {
    await Transaction.deleteMany({ userId: existingUser._id });
    await Quota.deleteMany({ userId: existingUser._id });
  }
  await User.deleteMany({ email: testEmail });
  await Vehicle.deleteMany({ vehicleNumber: testPlate });
  await SecureToken.deleteMany({});

  // 2. Setup mock data
  const testUser = await User.create({
    email: testEmail,
    passwordHash: 'password123',
    role: 'citizen',
    fullName: 'Token Tester'
  });

  const testVehicle = await Vehicle.create({
    vehicleNumber: testPlate,
    ownerId: testUser._id,
    vehicleType: 'Car',
    chassisNumber: 'CHASSIS-TOKEN-9999',
    fuelType: 'Petrol 92 Octane'
  });

  const testQuota = await Quota.create({
    userId: testUser._id,
    vehicleId: testVehicle._id,
    normalLimit: 50,
    emergencyLimit: 25,
    remainingQuota: 40
  });

  console.log(`Created test citizen, vehicle, and quota (starting balance: ${testQuota.remainingQuota}L).`);

  // Helper to mock Express req and res
  const mockRes = () => {
    const res = {};
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (data) => {
      res.body = data;
      return res;
    };
    return res;
  };

  // 3. Test Token Generation
  console.log('\n--- 1. Testing Token Generation ---');
  const genReq = {
    body: { vehicleNumber: testPlate },
    user: testUser
  };
  const genRes = mockRes();

  await generateQrToken(genReq, genRes, (err) => { if (err) console.error(err); });
  
  if (genRes.statusCode !== 200 || !genRes.body.success || !genRes.body.token) {
    console.error('❌ FAIL: generateQrToken failed', genRes.body);
    process.exit(1);
  }
  
  const rawToken = genRes.body.token;
  console.log(`✅ PASS: Token generated successfully: "${rawToken}"`);

  // 4. Test Token Verification
  console.log('\n--- 2. Testing Token Verification ---');
  const verifyReq = {
    body: { token: rawToken },
    user: { role: 'pump', station: 'Ceypetco - Town Hall' }
  };
  const verifyRes = mockRes();

  await verifyQuotaToken(verifyReq, verifyRes, (err) => { if (err) console.error(err); });

  if (verifyRes.statusCode !== 200 || !verifyRes.body.success || !verifyRes.body.valid) {
    console.error('❌ FAIL: verifyQuotaToken failed', verifyRes.body);
    process.exit(1);
  }

  console.log('✅ PASS: Token verified successfully.', verifyRes.body);

  // 5. Test Invalid Token Verification
  console.log('\n--- 3. Testing Invalid Token Verification ---');
  const invalidReq = {
    body: { token: 'INVALID-CODE-XYZ' },
    user: { role: 'pump', station: 'Ceypetco - Town Hall' }
  };
  const invalidRes = mockRes();

  await verifyQuotaToken(invalidReq, invalidRes, (err) => { if (err) console.error(err); });

  if (invalidRes.statusCode === 200 && invalidRes.body.valid) {
    console.error('❌ FAIL: verifyQuotaToken accepted invalid token!');
    process.exit(1);
  }

  console.log('✅ PASS: Rejected invalid token successfully.', invalidRes.body);

  // 6. Test Successful Dispensing & Quota Deduction
  console.log('\n--- 4. Testing Dispensing & Atomic Quota Deduction ---');
  const dispenseReq = {
    body: {
      transactionId: `TX-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      stationName: 'Ceypetco - Town Hall',
      amount: 15,
      allocatedAmount: 15,
      cost: 15 * 370,
      userId: testUser._id.toString(),
      vehicleId: testVehicle._id.toString(),
      fuelType: 'Petrol 92 Octane',
      priorityScore: 2.5,
      emergencyStatus: 'NORMAL',
      qrToken: rawToken
    },
    app: {
      get: (key) => null // mock io
    }
  };
  const dispenseRes = mockRes();

  await createTransaction(dispenseReq, dispenseRes, (err) => { if (err) console.error(err); });

  if (dispenseRes.statusCode !== 201 || !dispenseRes.body.success) {
    console.error('❌ FAIL: createTransaction failed', dispenseRes.body);
    process.exit(1);
  }

  console.log('✅ PASS: Dispense transaction recorded successfully.');

  // Validate Quota Deduction
  const updatedQuota = await Quota.findOne({ userId: testUser._id });
  console.log(`Remaining quota in DB: ${updatedQuota.remainingQuota}L (Expected: 25L)`);
  if (updatedQuota.remainingQuota !== 25) {
    console.error('❌ FAIL: Quota deduction math is incorrect!');
    process.exit(1);
  }
  console.log('✅ PASS: Quota deducted correctly.');

  // 7. Test Token Re-use / Replay Rejection
  console.log('\n--- 5. Testing Duplicate Token Re-use Rejection ---');
  const reuseRes = mockRes();
  await verifyQuotaToken(verifyReq, reuseRes, (err) => { if (err) console.error(err); });

  if (reuseRes.statusCode === 200 && reuseRes.body.valid) {
    console.error('❌ FAIL: Token was accepted twice!');
    process.exit(1);
  }

  console.log('✅ PASS: Reused token rejected successfully.', reuseRes.body);

  // 8. Test Expired Token
  console.log('\n--- 6. Testing Expired Token Rejection ---');
  // Mock generation but in the past
  const expiredToken = 'F1K2-X3QP-9M';
  const expiredHash = cryptoUtilsHash(expiredToken);
  
  await SecureToken.create({
    tokenHash: expiredHash,
    userId: testUser._id,
    vehicleNumber: testPlate,
    expiresAt: new Date(Date.now() - 1000), // expired 1s ago
    used: false
  });

  const expiredReq = {
    body: { token: expiredToken },
    user: { role: 'pump', station: 'Ceypetco - Town Hall' }
  };
  const expiredRes = mockRes();

  await verifyQuotaToken(expiredReq, expiredRes, (err) => { if (err) console.error(err); });

  if (expiredRes.statusCode === 200 && expiredRes.body.valid) {
    console.error('❌ FAIL: Accepted expired token!');
    process.exit(1);
  }

  console.log('✅ PASS: Rejected expired token successfully.', expiredRes.body);

  // Clean up
  await User.deleteMany({ email: testEmail });
  await Vehicle.deleteMany({ vehicleNumber: testPlate });
  await Transaction.deleteMany({ userId: testUser._id });
  await SecureToken.deleteMany({});
  await Quota.deleteMany({ userId: testUser._id });

  await mongoose.disconnect();
  console.log('\n--- ALL SECURE TOKEN LIFECYCLE TESTS PASSED SUCCESSFULLY ---');
};

// Simple SHA-256 helper for test mocking
import crypto from 'crypto';
const cryptoUtilsHash = (token) => {
  const clean = token.replace(/-/g, '').toUpperCase().trim();
  return crypto.createHash('sha256').update(clean).digest('hex');
};

testSecureTokens().catch((err) => {
  console.error(err);
  process.exit(1);
});
