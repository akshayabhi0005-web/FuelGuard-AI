import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/User.js';

const TEST_PORT = 5098;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

const runGatingTests = async () => {
  console.log('--- STARTING AUTH & ROLE GATING INTEGRATION TESTS ---');

  await mongoose.connect(process.env.MONGODB_URI);

  const server = app.listen(TEST_PORT, () => {
    console.log(`Gating test server running on port ${TEST_PORT}`);
  });

  const logResult = (name, passed, detail = '') => {
    console.log(`${passed ? '✅' : '❌'} [${passed ? 'PASS' : 'FAIL'}] ${name} ${detail ? `(${detail})` : ''}`);
    if (!passed) {
      server.close();
      process.exit(1);
    }
  };

  try {
    // 1. Test Unauthenticated access (No Token)
    let res = await fetch(`${BASE_URL}/admin/settings`);
    let data = await res.json();
    logResult('Block Unauthenticated Settings Query', res.status === 401 && !data.success);

    // 2. Test Invalid Token format
    res = await fetch(`${BASE_URL}/admin/settings`, {
      headers: { 'Authorization': 'Bearer invalidtoken123' }
    });
    data = await res.json();
    logResult('Block Invalid Token Signature', res.status === 401 && !data.success);

    // 3. Test Role authorization: Citizen accessing Admin PUT route
    // Register test citizen
    await User.deleteMany({ email: 'citizen-gate-test@fuel.com' });
    const registerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'citizen-gate-test@fuel.com',
        password: 'password123',
        role: 'citizen',
        fullName: 'Citizen Gate User'
      })
    });
    const registerData = await registerRes.json();
    const citizenToken = registerData.token;

    // Citizen attempts PUT settings (admin only)
    res = await fetch(`${BASE_URL}/admin/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${citizenToken}`
      },
      body: JSON.stringify({ emergencyModeActive: true })
    });
    data = await res.json();
    logResult('Block Citizen accessing Admin Settings PUT', res.status === 403 && !data.success);

    // Citizen attempts POST fuel station (admin only)
    res = await fetch(`${BASE_URL}/fuel/inventory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${citizenToken}`
      },
      body: JSON.stringify({
        stationName: 'Gate Station',
        district: 'Colombo',
        stock: 5000,
        reserved: 500,
        status: 'In Stock'
      })
    });
    data = await res.json();
    logResult('Block Citizen accessing Fuel Station creation POST', res.status === 403 && !data.success);

    // Clean up
    await User.deleteMany({ email: 'citizen-gate-test@fuel.com' });

    console.log('--- ALL AUTH & ROLE GATING TESTS COMPLETED SUCCESSFULLY ---');
  } catch (err) {
    console.error('❌ Gating test threw an error:', err.message);
  } finally {
    await mongoose.connection.close();
    server.close(() => {
      console.log('Gating test server closed.');
    });
  }
};

runGatingTests();
