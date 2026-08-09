import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import FuelInventory from '../models/FuelInventory.js';
import LPGInventory from '../models/LPGInventory.js';
import FraudLog from '../models/FraudLog.js';
import Forecast from '../models/Forecast.js';
import Transaction from '../models/Transaction.js';

const TEST_PORT = 5099;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

const runIntegrationTests = async () => {
  console.log('--- STARTING EXPRESS API ROUTE INTEGRATION TESTS ---');
  
  // Connect to database
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Database connected.');


  // Clean historical test items if any existed
  await User.deleteMany({ email: { $in: ['citizen-test@fuel.com', 'admin@fuelguard.gov', 'pump@ceypetco.com', 'distributor@supergas.com'] } });
  await Vehicle.deleteMany({ vehicleNumber: 'WP-TEST-1234' });
  await FuelInventory.deleteMany({ stationName: 'Test Ceypetco' });
  await LPGInventory.deleteMany({ distributorName: 'Test Supergas' });
  await FraudLog.deleteMany({ location: 'Test Location' });
  await Forecast.deleteMany({ stationName: 'Test Station' });
  await Transaction.deleteMany({ transactionId: 'TX-TEST-VERIFY-8889' });

  // Ensure test operators exist in the database with plain passwords (hashed once by pre-save hook)
  await User.create({
    email: 'admin@fuelguard.gov',
    passwordHash: 'admin123',
    role: 'admin',
    fullName: 'Gov Administrator'
  });

  await User.create({
    email: 'pump@ceypetco.com',
    passwordHash: 'pump123',
    role: 'pump',
    fullName: 'Ceypetco Pump Operator'
  });

  await User.create({
    email: 'distributor@supergas.com',
    passwordHash: 'distributor123',
    role: 'distributor',
    fullName: 'Supergas Distributor Operator'
  });

  // Start server
  const server = app.listen(TEST_PORT, () => {
    console.log(`Test server running on port ${TEST_PORT}`);
  });

  const results = [];

  const logResult = (name, passed, detail = '') => {
    results.push({ name, status: passed ? 'PASS' : 'FAIL', detail });
    console.log(`${passed ? '✅' : '❌'} [${passed ? 'PASS' : 'FAIL'}] ${name} ${detail ? `(${detail})` : ''}`);
  };

  try {
    // Acquire Operator tokens for role authorization testing
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@fuelguard.gov', password: 'admin123' })
    });
    const adminLoginData = await adminLoginRes.json();
    const adminToken = adminLoginData.token;

    const pumpLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'pump@ceypetco.com', password: 'pump123' })
    });
    const pumpLoginData = await pumpLoginRes.json();
    const pumpToken = pumpLoginData.token;

    const distLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'distributor@supergas.com', password: 'distributor123' })
    });
    const distLoginData = await distLoginRes.json();
    const distToken = distLoginData.token;

    // Helpers to create auth headers
    const headers = (token) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    // 1. Health check
    let res = await fetch(`${BASE_URL.replace('/api', '')}/api/health`);
    let data = await res.json();
    logResult('Health Check Endpoint', res.ok && data.status === 'success');

    // 2. Auth: Register Citizen
    res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'citizen-test@fuel.com',
        password: 'password123',
        role: 'citizen',
        fullName: 'Test Citizen User'
      })
    });
    data = await res.json();
    const testUser = data.user;
    const citizenToken = data.token;
    logResult('Auth: Register Citizen', res.status === 201 && testUser.email === 'citizen-test@fuel.com' && citizenToken);

    // 3. Auth: Login Citizen
    res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'citizen-test@fuel.com',
        password: 'password123'
      })
    });
    data = await res.json();
    logResult('Auth: Login Citizen', res.status === 200 && data.success && data.token);

    // 4. Vehicles: Register Vehicle
    res = await fetch(`${BASE_URL}/vehicles`, {
      method: 'POST',
      headers: headers(citizenToken),
      body: JSON.stringify({
        vehicleNumber: 'WP-TEST-1234',
        ownerId: testUser.id,
        vehicleType: 'Car',
        chassisNumber: 'CHASSIS-12345-TEST',
        fuelType: 'Petrol 92 Octane'
      })
    });
    data = await res.json();
    const testVehicle = data.vehicle;
    logResult('Vehicles: Register Vehicle', res.status === 201 && testVehicle.vehicleNumber === 'WP-TEST-1234');

    // 5. Vehicles: Lookup by plate
    res = await fetch(`${BASE_URL}/vehicles/WP-TEST-1234`, {
      headers: headers(citizenToken)
    });
    data = await res.json();
    logResult('Vehicles: Lookup Plate', res.status === 200 && data.vehicle.chassisNumber === 'CHASSIS-12345-TEST');

    // 6. Fuel: Create Station Node
    res = await fetch(`${BASE_URL}/fuel/inventory`, {
      method: 'POST',
      headers: headers(adminToken),
      body: JSON.stringify({
        stationName: 'Test Ceypetco',
        district: 'Colombo',
        stock: 5000,
        reserved: 500,
        status: 'In Stock'
      })
    });
    data = await res.json();
    const testStation = data.node;
    logResult('Fuel: Create Station', res.status === 201 && testStation.stationName === 'Test Ceypetco');

    // 7. Fuel: Get Inventory
    res = await fetch(`${BASE_URL}/fuel/inventory`, {
      headers: headers(citizenToken)
    });
    data = await res.json();
    logResult('Fuel: Get Inventory List', res.status === 200 && data.inventory.length > 0);

    // 8. LPG: Create Distributor Node
    res = await fetch(`${BASE_URL}/lpg/inventory`, {
      method: 'POST',
      headers: headers(adminToken),
      body: JSON.stringify({
        distributorName: 'Test Supergas',
        district: 'Galle',
        stock: 150,
        reserved: 10,
        status: 'In Stock'
      })
    });
    data = await res.json();
    const testDistributor = data.node;
    logResult('LPG: Create Distributor', res.status === 201 && testDistributor.distributorName === 'Test Supergas');

    // 9. Quotas: Create Wallet
    res = await fetch(`${BASE_URL}/quotas`, {
      method: 'POST',
      headers: headers(adminToken),
      body: JSON.stringify({
        userId: testUser.id,
        vehicleId: testVehicle._id,
        normalLimit: 50,
        emergencyLimit: 20,
        remainingQuota: 45
      })
    });
    data = await res.json();
    const testQuota = data.quota;
    logResult('Quotas: Create Wallet', res.status === 201 && testQuota.remainingQuota === 45);

    // 10. Quotas: Fetch by UserID
    res = await fetch(`${BASE_URL}/quotas/user/${testUser.id}`, {
      headers: headers(citizenToken)
    });
    data = await res.json();
    logResult('Quotas: Fetch Quota by User ID', res.status === 200 && data.quota.remainingQuota === 45);

    // 11. Transactions: Token Verification
    res = await fetch(`${BASE_URL}/transactions/verify`, {
      method: 'POST',
      headers: headers(pumpToken),
      body: JSON.stringify({
        token: `FUEL-WP-TEST-1234-${Date.now()}`,
        stationName: 'Test Ceypetco'
      })
    });
    data = await res.json();
    logResult('Transactions: Validate QR Token', res.status === 200 && data.valid);

    // 12. Transactions: Create Allocation record
    res = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers: headers(pumpToken),
      body: JSON.stringify({
        transactionId: 'TX-TEST-VERIFY-8889',
        date: '2026-08-09',
        stationName: 'Test Ceypetco',
        amount: 15,
        allocatedAmount: 15,
        cost: 5550,
        userId: testUser.id,
        vehicleId: testVehicle._id,
        fuelType: 'Petrol 92 Octane',
        priorityScore: 5.5,
        emergencyStatus: 'NORMAL'
      })
    });
    data = await res.json();
    if (res.status !== 201) {
      console.log('FAIL DETAIL:', data);
    }
    logResult('Transactions: Create Ledger Record', res.status === 201 && data.transaction && data.transaction.allocatedAmount === 15);

    // 13. LPG Bookings: Submit Booking
    res = await fetch(`${BASE_URL}/lpg/booking`, {
      method: 'POST',
      headers: headers(citizenToken),
      body: JSON.stringify({
        userId: testUser.id,
        distributorName: 'Test Supergas',
        weight: '12.5kg',
        cost: 4850
      })
    });
    data = await res.json();
    const testBooking = data.booking;
    logResult('LPG Bookings: Create Request', res.status === 201 && testBooking.weight === '12.5kg');

    // 14. LPG Bookings: Retrieve Requests
    res = await fetch(`${BASE_URL}/lpg/booking`, {
      headers: headers(distToken)
    });
    data = await res.json();
    logResult('LPG Bookings: Fetch Booking List', res.status === 200 && data.bookings.length > 0);

    // 15. LPG Bookings: Update booking status with OTP verification
    res = await fetch(`${BASE_URL}/lpg/booking/${testBooking._id}`, {
      method: 'PUT',
      headers: headers(distToken),
      body: JSON.stringify({
        status: 'Delivered',
        code: testBooking.otpCode
      })
    });
    data = await res.json();
    logResult('LPG Bookings: OTP Delivery Verification', res.status === 200 && data.booking.status === 'Delivered');

    // 16. Admin: Get Settings
    res = await fetch(`${BASE_URL}/admin/settings`, {
      headers: headers(citizenToken)
    });
    data = await res.json();
    logResult('Admin: Get Settings config', res.status === 200 && data.settings !== null);

    // 17. Admin: Update settings Mode
    res = await fetch(`${BASE_URL}/admin/settings`, {
      method: 'PUT',
      headers: headers(adminToken),
      body: JSON.stringify({
        emergencyModeActive: true
      })
    });
    data = await res.json();
    logResult('Admin: Set Emergency Mode ACTIVE', res.status === 200 && data.settings.emergencyModeActive === true);

    // 18. Admin: Log Alert
    res = await fetch(`${BASE_URL}/admin/fraud`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }, // public write endpoint
      body: JSON.stringify({
        type: 'Duplicate QR Attempt',
        location: 'Test Location',
        details: 'Scanned used QR Token WP-TEST-1234 again',
        riskScore: 90
      })
    });
    data = await res.json();
    const testLog = data.log;
    logResult('Admin: Create Fraud Alert', res.status === 201 && testLog.riskScore === 90);

    // 19. Admin: Resolve Log Alert
    res = await fetch(`${BASE_URL}/admin/fraud/${testLog._id}`, {
      method: 'PUT',
      headers: headers(adminToken)
    });
    data = await res.json();
    logResult('Admin: Resolve Fraud Alert', res.status === 200 && data.log.status === 'Resolved');

    // 20. Admin: Create Forecast
    res = await fetch(`${BASE_URL}/admin/forecasts`, {
      method: 'POST',
      headers: headers(adminToken),
      body: JSON.stringify({
        stationName: 'Test Station',
        date: new Date(),
        expectedDemand: 12000,
        predictedShortage: 3000
      })
    });
    data = await res.json();
    logResult('Admin: Save Demand Forecast', res.status === 201 && data.forecast.expectedDemand === 12000);

  } catch (error) {
    console.error('❌ Integration test threw a fatal error:', error.message);
  } finally {
    // Tear down cleans
    console.log('Tearing down database test elements...');
    await User.deleteMany({ email: 'citizen-test@fuel.com' });
    await Vehicle.deleteMany({ vehicleNumber: 'WP-TEST-1234' });
    await FuelInventory.deleteMany({ stationName: 'Test Ceypetco' });
    await LPGInventory.deleteMany({ distributorName: 'Test Supergas' });
    await FraudLog.deleteMany({ location: 'Test Location' });
    await Forecast.deleteMany({ stationName: 'Test Station' });
    await Transaction.deleteMany({ transactionId: 'TX-TEST-VERIFY-8889' });
    
    // Close connections
    await mongoose.connection.close();
    server.close(() => {
      console.log('Test server closed.');
    });
    console.log('--- INTEGRATION TEST DISPATCH COMPLETE ---');
  }
};

runIntegrationTests();
