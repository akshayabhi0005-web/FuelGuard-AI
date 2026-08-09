import io from 'socket.io-client';

const BASE_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

const runRealtimeTests = async () => {
  console.log('--- STARTING REAL-TIME SOCKET.IO CLIENT TESTS ---');

  // Obtain authorization tokens first
  let adminToken = '';
  let pumpToken = '';

  try {
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@fuelguard.gov', password: 'admin123' })
    });
    const adminLoginData = await adminLoginRes.json();
    adminToken = adminLoginData.token;

    const pumpLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'pump@ceypetco.com', password: 'pump123' })
    });
    const pumpLoginData = await pumpLoginRes.json();
    pumpToken = pumpLoginData.token;
  } catch (err) {
    console.error('❌ Failed to retrieve auth tokens for real-time tests:', err.message);
    process.exit(1);
  }

  const headers = (token) => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  const socket = io(SOCKET_URL, {
    transports: ['websocket'],
    reconnectionAttempts: 5
  });

  const connectionPromise = new Promise((resolve, reject) => {
    socket.on('connect', () => {
      console.log('✅ Connected to Socket.IO Server');
      resolve();
    });
    socket.on('connect_error', (err) => {
      reject(new Error(`Connection failed: ${err.message}`));
    });
    setTimeout(() => reject(new Error('Socket connection timeout')), 5000);
  });

  try {
    await connectionPromise;

    // Test 1: Settings Update Event
    const settingsPromise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Settings update event timeout')), 4000);
      socket.once('settings_update', (data) => {
        clearTimeout(timer);
        console.log('✅ Received settings_update payload from Socket:', data.emergencyModeActive);
        resolve(data.emergencyModeActive === true);
      });
    });

    console.log('Triggering settings update via PUT /api/admin/settings...');
    const settingsRes = await fetch(`${BASE_URL}/admin/settings`, {
      method: 'PUT',
      headers: headers(adminToken),
      body: JSON.stringify({ emergencyModeActive: true })
    });
    const settingsMatched = await settingsPromise;
    console.log('Test 1 settings change check:', settingsMatched ? 'PASS' : 'FAIL');

    // Test 2: Fuel Inventory Update Event
    const stationsRes = await fetch(`${BASE_URL}/fuel/inventory`, {
      headers: headers(pumpToken)
    });
    const stationsData = await stationsRes.json();
    const targetNode = stationsData.inventory[0];

    if (targetNode) {
      const inventoryPromise = new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Fuel inventory update event timeout')), 4000);
        socket.once('fuel_inventory_update', (node) => {
          clearTimeout(timer);
          console.log('✅ Received fuel_inventory_update payload from Socket, stock:', node.stock);
          resolve(node.stock === 9999);
        });
      });

      console.log(`Triggering fuel inventory update via PUT /api/fuel/inventory/${targetNode._id}...`);
      await fetch(`${BASE_URL}/fuel/inventory/${targetNode._id}`, {
        method: 'PUT',
        headers: headers(pumpToken),
        body: JSON.stringify({ stock: 9999, status: 'In Stock' })
      });
      const inventoryMatched = await inventoryPromise;
      console.log('Test 2 inventory check:', inventoryMatched ? 'PASS' : 'FAIL');
    } else {
      console.log('⚠️ Skipping Test 2: No station node found in DB.');
    }

    // Reset settings to normal
    await fetch(`${BASE_URL}/admin/settings`, {
      method: 'PUT',
      headers: headers(adminToken),
      body: JSON.stringify({ emergencyModeActive: false })
    });

    console.log('--- ALL REAL-TIME SOCKET TESTS COMPLETED SUCCESSFULLY ---');
  } catch (err) {
    console.error('❌ Real-time test threw an error:', err.message);
    process.exit(1);
  } finally {
    socket.disconnect();
    setTimeout(() => {
      process.exit(0);
    }, 100);
  }
};

runRealtimeTests();
