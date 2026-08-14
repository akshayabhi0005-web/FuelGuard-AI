import React, { createContext, useState, useEffect } from 'react';
import io from 'socket.io-client';
import supabase from '../utils/supabaseClient';

const getSafeBackendUrl = () => {
  const url = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');
  if (!url || url === 'undefined' || url === 'null') {
    return '';
  }
  return url.replace(/\/$/, '');
};
const BACKEND_URL = getSafeBackendUrl();

const originalFetch = window.fetch;
const fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input.url;
  
  const isRelativeApi = url.startsWith('/api') || url.startsWith('api/');
  const isUndefinedApi = url.includes('undefined/api') || url.startsWith('undefined/api');
  const isNullApi = url.includes('null/api') || url.startsWith('null/api');

  if (!BACKEND_URL && (isRelativeApi || isUndefinedApi || isNullApi)) {
    throw new Error('Backend URL is not configured. Running in offline fallback mode.');
  }

  // Prepend BACKEND_URL for relative /api paths to make sure we don't hit frontend Render origin
  if (BACKEND_URL && isRelativeApi) {
    const cleanPath = url.startsWith('/') ? url : '/' + url;
    if (typeof input === 'string') {
      input = BACKEND_URL + cleanPath;
    } else {
      input = new Request(BACKEND_URL + cleanPath, input);
    }
  }

  const response = await originalFetch(input, init);
  
  if (response.json) {
    const originalJson = response.json;
    response.json = async function() {
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.warn('Expected JSON response but received non-JSON payload:', text.substring(0, 100));
        throw new Error('Received non-JSON response from server (possible HTML redirect or offline fallback).');
      }
      return originalJson.apply(this, arguments);
    };
  }
  
  return response;
};


export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const getLocalStorage = (key, initial) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : initial;
  };

  const setLocalStorage = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const getAuthHeaders = () => {
    const token = authToken || localStorage.getItem('auth_token') || '';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // Active Sessions
  const [fuelUser, setFuelUser] = useState(() => getLocalStorage('fuel_user_session', null));
  const [lpgUser, setLpgUser] = useState(() => getLocalStorage('lpg_user_session', null));
  const [adminUser, setAdminUser] = useState(() => getLocalStorage('admin_user_session', null));
  const [pumpUser, setPumpUser] = useState(() => getLocalStorage('pump_user_session', null));
  const [distributorUser, setDistributorUser] = useState(() => getLocalStorage('distributor_user_session', null));
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('auth_token') || '');

  // Operator user databases derived from local storage mock supabase users
  const [fuelUsers, setFuelUsers] = useState([]);
  const [lpgUsers, setLpgUsers] = useState([]);

  // Emergency Mode State
  const [emergencyMode, setEmergencyMode] = useState(() => getLocalStorage('emergency_mode', false));

  // Configurable Quota Limits
  const [normalQuotaLimit, setNormalQuotaLimit] = useState(() => getLocalStorage('normal_quota_limit', 50));
  const [emergencyQuotaLimit, setEmergencyQuotaLimit] = useState(() => getLocalStorage('emergency_quota_limit', 25));
  const [emergencyVehicleQuotaLimit, setEmergencyVehicleQuotaLimit] = useState(() => getLocalStorage('emergency_vehicle_quota_limit', 250));

  // Configurable Average Service Time (in minutes per vehicle in queue)
  const [averageServiceTime, setAverageServiceTime] = useState(() => getLocalStorage('average_service_time', 3));
  useEffect(() => { setLocalStorage('average_service_time', averageServiceTime); }, [averageServiceTime]);

  // Geolocation Coordinates for distance calculations
  const [userCoords, setUserCoords] = useState(null);

  // Active OTPs store for pump clerk verification: email -> { code, timestamp, retries }
  const [activeOtps, setActiveOtps] = useState({});

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          console.warn('Geolocation access denied or unavailable.');
        }
      );
    }
  }, []);

  // Configurable Priority Category Scores
  const [priorityEmergency, setPriorityEmergency] = useState(() => getLocalStorage('priority_emergency', 9));
  const [priorityHealthcare, setPriorityHealthcare] = useState(() => getLocalStorage('priority_healthcare', 7));
  const [priorityFire, setPriorityFire] = useState(() => getLocalStorage('priority_fire', 9));
  const [priorityPolice, setPriorityPolice] = useState(() => getLocalStorage('priority_police', 9));
  const [priorityPublicTransport, setPriorityPublicTransport] = useState(() => getLocalStorage('priority_public_transport', 6));
  const [priorityEssential, setPriorityEssential] = useState(() => getLocalStorage('priority_essential', 5));
  const [priorityGeneral, setPriorityGeneral] = useState(() => getLocalStorage('priority_general', 2));

  // Priority Weights
  const [weightEmergency, setWeightEmergency] = useState(() => getLocalStorage('weight_emergency', 0.5));
  const [weightDemand, setWeightDemand] = useState(() => getLocalStorage('weight_demand', 0.3));
  const [weightStock, setWeightStock] = useState(() => getLocalStorage('weight_stock', 0.2));

  // Fuel Stations & LPG Distributors State (distributed by region: Colombo, Gampaha, Kandy, Galle)
  const [stations, setStations] = useState(() => getLocalStorage('map_stations', [
    { id: 1, type: 'fuel', name: 'Ceypetco - Town Hall', area: 'Town Hall', city: 'Colombo', district: 'Colombo', lat: 6.9150, lng: 79.8650, status: 'In Stock', waitingTime: '15 mins', distance: '1.2 km', available: '92/95 Octane, Auto Diesel', queueLength: 8, address: 'F.R. Senanayake Mawatha, Colombo 07', openNow: true, isEmergency: true, stock: 12400, reserved: 500 },
    { id: 2, type: 'fuel', name: 'LIOC - Gampaha', area: 'Kollupitiya', city: 'Gampaha', district: 'Gampaha', lat: 7.0873, lng: 79.9924, status: 'In Stock', waitingTime: '5 mins', distance: '2.5 km', available: '95 Octane, Super Diesel', queueLength: 2, address: 'Gampaha Road, Gampaha', openNow: true, isEmergency: false, stock: 18200, reserved: 800 },
    { id: 3, type: 'fuel', name: 'Sinopec - Kandy', area: 'Borella', city: 'Kandy', district: 'Kandy', lat: 7.2906, lng: 80.6337, status: 'Low Stock', waitingTime: '45 mins', distance: '3.8 km', available: '92 Octane Only', queueLength: 22, address: 'Kandy-Borella Road, Kandy', openNow: true, isEmergency: false, stock: 4100, reserved: 200 },
    { id: 4, type: 'lpg', name: 'Gas Point Corp - Galle', area: 'Fort', city: 'Galle', district: 'Galle', lat: 6.0535, lng: 80.2210, status: 'In Stock', waitingTime: '10 mins', distance: '0.8 km', available: '12.5kg / 5kg Cylinders', queueLength: 3, address: 'Galle Main Street, Galle', openNow: true, isEmergency: false, stock: 205, reserved: 15 },
    { id: 5, type: 'lpg', name: 'Super Gas Distributors - Colombo', area: 'Havelock Town', city: 'Colombo', district: 'Colombo', lat: 6.9050, lng: 79.8820, status: 'In Stock', waitingTime: '20 mins', distance: '2.3 km', available: '12.5kg Cylinders Only', queueLength: 7, address: 'Havelock Road, Colombo 05', openNow: true, isEmergency: true, stock: 140, reserved: 10 },
    { id: 6, type: 'lpg', name: 'Lanka Gas Dealers - Kandy', area: 'Borella', city: 'Kandy', district: 'Kandy', lat: 7.2930, lng: 80.6350, status: 'Out of Stock', waitingTime: 'N/A', distance: '4.1 km', available: 'Closed', queueLength: 0, address: 'Peradeniya Road, Kandy', openNow: false, isEmergency: false, stock: 0, reserved: 0 }
  ]));

  // Multiple User Quotas state
  const [userQuotas, setUserQuotas] = useState(() => getLocalStorage('user_quotas', {
    'citizen@fuel.com': 45.0,
    'responder@emergency.gov': 250.0
  }));

  // Dynamic user remaining quota bound to logged-in user
  const currentEmail = fuelUser?.email || 'citizen@fuel.com';
  const remainingQuota = userQuotas[currentEmail] !== undefined ? userQuotas[currentEmail] : 50.0;
  const setRemainingQuota = (value) => {
    setUserQuotas(prev => {
      const currentVal = prev[currentEmail] !== undefined ? prev[currentEmail] : 50.0;
      const nextVal = typeof value === 'function' ? value(currentVal) : value;
      const next = { ...prev, [currentEmail]: nextVal };
      setLocalStorage('user_quotas', next);
      return next;
    });
  };

  const [fuelTransactions, setFuelTransactions] = useState(() => getLocalStorage('fuel_transactions', [
    { 
      id: 1, 
      date: '2026-08-01', 
      createdAt: '2026-08-01T10:00:00.000Z',
      verifiedAt: '2026-08-01T10:01:00.000Z',
      allocatedAt: '2026-08-01T10:02:00.000Z',
      completedAt: '2026-08-01T10:05:00.000Z',
      station: 'Ceypetco - Town Hall', 
      amount: 15.0, 
      allocatedAmount: 15.0,
      cost: 5550, 
      type: 'Regular Fill',
      userId: 'citizen@fuel.com',
      userType: 'General Consumer',
      vehicleId: 'WP-CAD-8930',
      fuelType: 'Petrol 92 Octane',
      priorityScore: 5.6,
      verificationStatus: 'VALID',
      transactionStatus: 'Completed',
      fraudCheckStatus: 'Passed',
      emergencyStatus: 'NORMAL'
    },
    { 
      id: 2, 
      date: '2026-07-25', 
      createdAt: '2026-07-25T15:20:00.000Z',
      verifiedAt: '2026-07-25T15:21:00.000Z',
      allocatedAt: '2026-07-25T15:22:00.000Z',
      completedAt: '2026-07-25T15:25:00.000Z',
      station: 'LIOC - Gampaha', 
      amount: 20.0, 
      allocatedAmount: 20.0,
      cost: 7400, 
      type: 'Regular Fill',
      userId: 'citizen@fuel.com',
      userType: 'General Consumer',
      vehicleId: 'WP-CAD-8930',
      fuelType: 'Petrol 95 Octane',
      priorityScore: 6.2,
      verificationStatus: 'VALID',
      transactionStatus: 'Completed',
      fraudCheckStatus: 'Passed',
      emergencyStatus: 'NORMAL'
    }
  ]));
  
  // LPG Dashboard State
  const [lpgBookings, setLpgBookings] = useState(() => getLocalStorage('lpg_bookings', [
    { 
      id: 'BK-90231', 
      date: '2026-07-10', 
      createdAt: '2026-07-10T09:00:00.000Z',
      verifiedAt: '2026-07-10T09:02:00.000Z',
      allocatedAt: '2026-07-10T09:03:00.000Z',
      completedAt: '2026-07-10T09:20:00.000Z',
      status: 'Delivered', 
      weight: '12.5kg', 
      cost: 3850, 
      trackingStep: 4,
      userId: 'citizen@lpg.com',
      location: 'Gas Point Corp - Galle',
      priorityScore: 4.8,
      verificationStatus: 'VALID',
      transactionStatus: 'Completed',
      fraudCheckStatus: 'Passed',
      emergencyStatus: 'NORMAL'
    },
    { 
      id: 'BK-95821', 
      date: '2026-08-02', 
      createdAt: '2026-08-02T14:10:00.000Z',
      verifiedAt: '2026-08-02T14:11:00.000Z',
      allocatedAt: '2026-08-02T14:12:00.000Z',
      completedAt: '',
      status: 'In Transit', 
      weight: '12.5kg', 
      cost: 3900, 
      trackingStep: 3,
      userId: 'citizen@lpg.com',
      location: 'Super Gas Distributors - Colombo',
      priorityScore: 7.2,
      verificationStatus: 'VALID',
      transactionStatus: 'Approved',
      fraudCheckStatus: 'Passed',
      emergencyStatus: 'NORMAL'
    }
  ]));
  const [lpgStatus, setLpgStatus] = useState(() => getLocalStorage('lpg_status', 'In Transit'));
  const [nextLpgBookingDate, setNextLpgBookingDate] = useState(() => getLocalStorage('lpg_next_booking', '2026-09-02'));

  // Energy Inventory reserves state (National reserves)
  const [inventoryReserves, setInventoryReserves] = useState(() => getLocalStorage('inventory_reserves', {
    petrol92: 4200000,
    petrol95: 1800000,
    dieselAuto: 5600000,
    lpg12: 45000,
    lpg5: 18000
  }));

  // Reserved Quantity (Available Stock = Current Stock - Reserved Quantity)
  const [reservedReserves, setReservedReserves] = useState(() => getLocalStorage('reserved_reserves', {
    petrol92: 120000,
    petrol95: 45000,
    dieselAuto: 250000,
    lpg12: 1500,
    lpg5: 600
  }));

  // Fraud Detection Log audits
  const [fraudLogs, setFraudLogs] = useState(() => getLocalStorage('fraud_logs', [
    { id: 1, type: 'Duplicate QR Attempt', details: 'Plate WP-CAD-8930 attempted scan twice within 10 seconds at Ceypetco.', riskScore: 92, status: 'Flagged', time: '10:42 PM' },
    { id: 2, type: 'Multiple Station usage', details: 'User registered in Colombo logged fueling in Galle 15 mins later.', riskScore: 88, status: 'Under Review', time: '09:15 PM' },
    { id: 3, type: 'Fake Vehicle Signature', details: 'Chassis signature mismatch detected on vehicle number WP-CAD-8930.', riskScore: 78, status: 'Flagged', time: '04:30 PM' }
  ]));

  // Centralized used QR codes state
  const [usedQrCodes, setUsedQrCodes] = useState(() => getLocalStorage('used_qr_codes', []));
  useEffect(() => { setLocalStorage('used_qr_codes', usedQrCodes); }, [usedQrCodes]);

  // Global system-wide notification center list
  const [systemNotifications, setSystemNotifications] = useState(() => getLocalStorage('system_notifications', [
    { id: 1, type: 'alert', title: 'System Setup Verified', desc: 'Welcome to FuelGuard AI smart allocation system.', date: '2026-08-04 10:00 AM', read: false },
    { id: 2, type: 'quota', title: 'Weekly Quota Renewed', desc: 'Your fuel wallet has been credited with 50.0 L.', date: '2026-08-03 12:00 AM', read: true }
  ]));

  // Government Admin Action Audit Log
  const [auditLogs, setAuditLogs] = useState(() => getLocalStorage('admin_audit_logs', [
    { id: 1, adminId: 'admin@fuelguard.gov', action: 'Initialize System', previousValue: '-', newValue: 'Active', timestamp: new Date().toISOString() }
  ]));

  const addAuditLog = (action, previousValue, newValue) => {
    const newLog = {
      id: Date.now(),
      adminId: adminUser?.email || 'admin@fuelguard.gov',
      action,
      previousValue: String(previousValue),
      newValue: String(newValue),
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Sync state to localStorage on changes
  useEffect(() => { setLocalStorage('fuel_user_session', fuelUser); }, [fuelUser]);
  useEffect(() => { setLocalStorage('lpg_user_session', lpgUser); }, [lpgUser]);
  useEffect(() => { setLocalStorage('admin_user_session', adminUser); }, [adminUser]);
  useEffect(() => { setLocalStorage('pump_user_session', pumpUser); }, [pumpUser]);
  useEffect(() => { setLocalStorage('distributor_user_session', distributorUser); }, [distributorUser]);
  useEffect(() => { setLocalStorage('emergency_mode', emergencyMode); }, [emergencyMode]);
  useEffect(() => { setLocalStorage('normal_quota_limit', normalQuotaLimit); }, [normalQuotaLimit]);
  useEffect(() => { setLocalStorage('emergency_quota_limit', emergencyQuotaLimit); }, [emergencyQuotaLimit]);
  useEffect(() => { setLocalStorage('emergency_vehicle_quota_limit', emergencyVehicleQuotaLimit); }, [emergencyVehicleQuotaLimit]);
  
  useEffect(() => { setLocalStorage('priority_emergency', priorityEmergency); }, [priorityEmergency]);
  useEffect(() => { setLocalStorage('priority_healthcare', priorityHealthcare); }, [priorityHealthcare]);
  useEffect(() => { setLocalStorage('priority_fire', priorityFire); }, [priorityFire]);
  useEffect(() => { setLocalStorage('priority_police', priorityPolice); }, [priorityPolice]);
  useEffect(() => { setLocalStorage('priority_public_transport', priorityPublicTransport); }, [priorityPublicTransport]);
  useEffect(() => { setLocalStorage('priority_essential', priorityEssential); }, [priorityEssential]);
  useEffect(() => { setLocalStorage('priority_general', priorityGeneral); }, [priorityGeneral]);

  useEffect(() => { setLocalStorage('weight_emergency', weightEmergency); }, [weightEmergency]);
  useEffect(() => { setLocalStorage('weight_demand', weightDemand); }, [weightDemand]);
  useEffect(() => { setLocalStorage('weight_stock', weightStock); }, [weightStock]);
  useEffect(() => { setLocalStorage('map_stations', stations); }, [stations]);
  useEffect(() => { setLocalStorage('user_quotas', userQuotas); }, [userQuotas]);
  useEffect(() => { setLocalStorage('fuel_transactions', fuelTransactions); }, [fuelTransactions]);
  useEffect(() => { setLocalStorage('lpg_bookings', lpgBookings); }, [lpgBookings]);
  useEffect(() => { setLocalStorage('lpg_status', lpgStatus); }, [lpgStatus]);
  useEffect(() => { setLocalStorage('lpg_next_booking', nextLpgBookingDate); }, [nextLpgBookingDate]);
  useEffect(() => { setLocalStorage('inventory_reserves', inventoryReserves); }, [inventoryReserves]);
  useEffect(() => { setLocalStorage('reserved_reserves', reservedReserves); }, [reservedReserves]);
  useEffect(() => { setLocalStorage('fraud_logs', fraudLogs); }, [fraudLogs]);
  useEffect(() => { setLocalStorage('system_notifications', systemNotifications); }, [systemNotifications]);
  useEffect(() => { setLocalStorage('admin_audit_logs', auditLogs); }, [auditLogs]);

  // Synchronize state with Express backend
  useEffect(() => {
    const syncBackendData = async () => {
      const token = authToken || localStorage.getItem('auth_token');
      if (!BACKEND_URL || !token || token === 'undefined' || token === 'null') {
        console.log('Skipping backend sync: No valid authorization token or backend URL is unconfigured.');
        return;
      }
      try {
        console.log(`Synchronizing data with backend at ${BACKEND_URL}...`);

        // 1. Sync Emergency Settings config
        const settingsRes = await fetch(BACKEND_URL + '/api/admin/settings', { headers: getAuthHeaders() });
        if (settingsRes.ok) {
          const sData = await settingsRes.json();
          const activeSettings = sData.settings;
          setEmergencyMode(activeSettings.emergencyModeActive);
          setNormalQuotaLimit(activeSettings.normalQuotaLimit);
          setEmergencyQuotaLimit(activeSettings.emergencyQuotaLimit);
          setEmergencyVehicleQuotaLimit(activeSettings.emergencyVehicleQuotaLimit);
          setWeightEmergency(activeSettings.weightEmergency);
          setWeightDemand(activeSettings.weightDemand);
          setWeightStock(activeSettings.weightStock);
        }

        // 2. Sync stations & distributors
        const stationsRes = await fetch(BACKEND_URL + '/api/fuel/inventory', { headers: getAuthHeaders() });
        if (stationsRes.ok) {
          const stData = await stationsRes.json();
          if (stData.inventory.length === 0) {
            // Seed fuel nodes
            for (const s of stations) {
              await fetch(BACKEND_URL + '/api/fuel/inventory', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                  stationName: s.name,
                  district: s.district,
                  stock: s.stock,
                  reserved: s.reserved,
                  status: s.status
                })
              });
            }
          } else {
            // Update local stations stock
            setStations(prev => prev.map(s => {
              const match = stData.inventory.find(i => i.stationName === s.name);
              if (match) {
                return { ...s, stock: match.stock, reserved: match.reserved, status: match.status };
              }
              return s;
            }));
          }
        }

        // 3. Sync LPG inventory
        const lpgInventoryRes = await fetch(BACKEND_URL + '/api/lpg/inventory', { headers: getAuthHeaders() });
        if (lpgInventoryRes.ok) {
          const lData = await lpgInventoryRes.json();
          if (lData.inventory.length === 0) {
            // Seed LPG nodes
            for (const d of stations.filter(s => s.type === 'lpg')) {
              await fetch(BACKEND_URL + '/api/lpg/inventory', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                  distributorName: d.name,
                  district: d.district,
                  stock: d.stock,
                  reserved: d.reserved,
                  status: d.status
                })
              });
            }
          }
        }

        // 4. Sync Transactions
        const txRes = await fetch(BACKEND_URL + '/api/transactions', { headers: getAuthHeaders() });
        if (txRes.ok) {
          const txData = await txRes.json();
          if (txData.transactions.length > 0) {
            const mappedTxs = txData.transactions.map(tx => ({
              id: tx.transactionId,
              date: tx.date,
              createdAt: tx.createdAt,
              verifiedAt: tx.verifiedAt,
              completedAt: tx.completedAt,
              station: tx.stationName,
              amount: tx.amount,
              allocatedAmount: tx.allocatedAmount,
              cost: tx.cost,
              type: tx.type,
              userId: tx.userId?.email || 'citizen@fuel.com',
              userType: tx.userId?.role === 'citizen' ? 'General Consumer' : 'Emergency Services',
              vehicleId: tx.vehicleId?.vehicleNumber || 'WP-CAD-8930',
              fuelType: tx.fuelType,
              priorityScore: tx.priorityScore,
              verificationStatus: tx.verificationStatus,
              transactionStatus: tx.transactionStatus,
              fraudCheckStatus: tx.fraudCheckStatus,
              emergencyStatus: tx.emergencyStatus
            }));
            setFuelTransactions(mappedTxs);
          }
        }

        // 5. Sync LPG Bookings
        const activeUser = adminUser || pumpUser || distributorUser || fuelUser || lpgUser;
        if (activeUser && (activeUser.role === 'admin' || activeUser.role === 'distributor')) {
          const bookingsRes = await fetch(BACKEND_URL + '/api/lpg/booking', { headers: getAuthHeaders() });
          if (bookingsRes.ok) {
            const bkData = await bookingsRes.json();
            if (bkData.bookings.length > 0) {
              const mappedBookings = bkData.bookings.map(bk => ({
                id: bk.otpCode ? `BK-${bk.otpCode.substring(0, 5)}` : `BK-${bk._id.substring(0, 5)}`,
                date: new Date(bk.createdAt).toISOString().split('T')[0],
                createdAt: bk.createdAt,
                verifiedAt: bk.createdAt,
                allocatedAt: bk.createdAt,
                completedAt: bk.deliveredAt || '',
                status: bk.status,
                weight: bk.weight,
                cost: bk.cost,
                trackingStep: bk.status === 'Delivered' ? 4 : (bk.status === 'In Transit' ? 3 : (bk.status === 'Confirmed' ? 2 : 1)),
                userId: bk.userId?.email || 'citizen@lpg.com',
                location: bk.distributorName,
                otpCode: bk.otpCode,
                priorityScore: 5.0,
                verificationStatus: 'VALID',
                transactionStatus: bk.status === 'Delivered' ? 'Completed' : 'Approved',
                fraudCheckStatus: 'Passed',
                emergencyStatus: 'NORMAL',
                _id: bk._id
              }));
              setLpgBookings(mappedBookings);
              if (mappedBookings.length > 0) {
                setLpgStatus(mappedBookings[0].status);
              }
            }
          }
        }

        // 6. Sync Fraud Logs
        if (activeUser && activeUser.role === 'admin') {
          const fraudRes = await fetch(BACKEND_URL + '/api/admin/fraud', { headers: getAuthHeaders() });
          if (fraudRes.ok) {
            const fData = await fraudRes.json();
            if (fData.logs.length === 0) {
              for (const f of fraudLogs) {
                await fetch(BACKEND_URL + '/api/admin/fraud', {
                  method: 'POST',
                  headers: getAuthHeaders(),
                  body: JSON.stringify({
                    type: f.type,
                    location: f.location,
                    details: f.details,
                    riskScore: f.riskScore
                  })
                });
              }
            } else {
              const mappedLogs = fData.logs.map((l, idx) => ({
                id: l._id,
                type: l.type,
                date: l.date,
                location: l.location,
                details: l.details,
                riskScore: l.riskScore,
                status: l.status,
                time: new Date(l.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }));
              setFraudLogs(mappedLogs);
            }
          }
        }

      } catch (err) {
        console.warn('REST backend offline, keeping local session states in local storage', err.message);
      }
    };
    syncBackendData();
  }, [fuelUser, lpgUser, adminUser, pumpUser, distributorUser, authToken]);

  // Update backend settings if weights/modes change
  useEffect(() => {
    const updateBackendSettings = async () => {
      const token = authToken || localStorage.getItem('auth_token');
      if (!BACKEND_URL || !token || token === 'undefined' || token === 'null') {
        return;
      }
      if (!adminUser) {
        return;
      }
      try {
        await fetch(BACKEND_URL + '/api/admin/settings', {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            emergencyModeActive: emergencyMode,
            normalQuotaLimit,
            emergencyQuotaLimit,
            emergencyVehicleQuotaLimit,
            weightEmergency,
            weightDemand,
            weightStock
          })
        });
      } catch (err) {
        // Silent catch for offline dev environments
      }
    };
    updateBackendSettings();
  }, [emergencyMode, normalQuotaLimit, emergencyQuotaLimit, emergencyVehicleQuotaLimit, weightEmergency, weightDemand, weightStock, authToken, adminUser]);

  // Synchronize state changes across multiple browser tabs automatically
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (!e.key) return;
      if (e.key === 'emergency_mode') {
        setEmergencyMode(e.newValue === 'true');
      } else if (e.key === 'user_quotas') {
        try { setUserQuotas(JSON.parse(e.newValue)); } catch (err) {}
      } else if (e.key === 'fuel_transactions') {
        try { setFuelTransactions(JSON.parse(e.newValue)); } catch (err) {}
      } else if (e.key === 'lpg_bookings') {
        try { setLpgBookings(JSON.parse(e.newValue)); } catch (err) {}
      } else if (e.key === 'map_stations') {
        try { setStations(JSON.parse(e.newValue)); } catch (err) {}
      } else if (e.key === 'fraud_logs') {
        try { setFraudLogs(JSON.parse(e.newValue)); } catch (err) {}
      } else if (e.key === 'inventory_reserves') {
        try { setInventoryReserves(JSON.parse(e.newValue)); } catch (err) {}
      } else if (e.key === 'reserved_reserves') {
        try { setReservedReserves(JSON.parse(e.newValue)); } catch (err) {}
      } else if (e.key === 'used_qr_codes') {
        try { setUsedQrCodes(JSON.parse(e.newValue)); } catch (err) {}
      } else if (e.key === 'normal_quota_limit') {
        setNormalQuotaLimit(parseFloat(e.newValue) || 50);
      } else if (e.key === 'emergency_quota_limit') {
        setEmergencyQuotaLimit(parseFloat(e.newValue) || 25);
      } else if (e.key === 'emergency_vehicle_quota_limit') {
        setEmergencyVehicleQuotaLimit(parseFloat(e.newValue) || 250);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Socket.IO real-time synchronization
  useEffect(() => {
    if (!BACKEND_URL) {
      console.warn('Socket.IO connection skipped: BACKEND_URL is not defined.');
      return;
    }
    console.log(`Connecting to Socket.IO backend at ${BACKEND_URL}...`);
    const socket = io(BACKEND_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('Connected to Socket.IO backend!');
    });

    socket.on('connect_error', (err) => {
      console.warn('Socket connection error. Real-time updates offline.', err.message);
    });

    // 1. Settings Update
    socket.on('settings_update', (settings) => {
      console.log('Received settings_update from socket:', settings);
      setEmergencyMode(settings.emergencyModeActive);
      setNormalQuotaLimit(settings.normalQuotaLimit);
      setEmergencyQuotaLimit(settings.emergencyQuotaLimit);
      setEmergencyVehicleQuotaLimit(settings.emergencyVehicleQuotaLimit);
      setWeightEmergency(settings.weightEmergency);
      setWeightDemand(settings.weightDemand);
      setWeightStock(settings.weightStock);
    });

    // 2. Fuel Inventory Update
    socket.on('fuel_inventory_update', (node) => {
      console.log('Received fuel_inventory_update from socket:', node);
      setStations(prev => prev.map(s => {
        if (s.name === node.stationName) {
          return { ...s, stock: node.stock, reserved: node.reserved, status: node.status };
        }
        return s;
      }));
    });

    // 3. LPG Inventory Update
    socket.on('lpg_inventory_update', (node) => {
      console.log('Received lpg_inventory_update from socket:', node);
      setStations(prev => prev.map(s => {
        if (s.name === node.distributorName) {
          return { ...s, stock: node.stock, reserved: node.reserved, status: node.status };
        }
        return s;
      }));
    });

    // 4. New Transaction
    socket.on('transaction_new', (tx) => {
      console.log('Received transaction_new from socket:', tx);
      const mappedTx = {
        id: tx.transactionId,
        date: tx.date,
        createdAt: tx.createdAt,
        verifiedAt: tx.verifiedAt,
        completedAt: tx.completedAt,
        station: tx.stationName,
        amount: tx.amount,
        allocatedAmount: tx.allocatedAmount,
        cost: tx.cost,
        type: tx.type,
        userId: tx.userId?.email || tx.userId || 'citizen@fuel.com',
        userType: 'General Consumer',
        vehicleId: tx.vehicleId?.vehicleNumber || tx.vehicleId || 'WP-CAD-8930',
        fuelType: tx.fuelType,
        priorityScore: tx.priorityScore,
        verificationStatus: tx.verificationStatus,
        transactionStatus: tx.transactionStatus,
        fraudCheckStatus: tx.fraudCheckStatus,
        emergencyStatus: tx.emergencyStatus
      };

      setFuelTransactions(prev => {
        if (prev.some(t => t.id === mappedTx.id)) return prev;
        return [mappedTx, ...prev];
      });

      // Deduct quota if current citizen is this transaction's user
      const loggedEmail = fuelUser?.email;
      if (loggedEmail && (mappedTx.userId === loggedEmail || mappedTx.userId?.email === loggedEmail)) {
        setUserQuotas(prev => {
          const prevQuota = prev[loggedEmail] !== undefined ? prev[loggedEmail] : 50;
          return { ...prev, [loggedEmail]: Math.max(0, prevQuota - mappedTx.allocatedAmount) };
        });
      }
    });

    // 5. New LPG Booking
    socket.on('booking_new', (bk) => {
      console.log('Received booking_new from socket:', bk);
      const mappedBooking = {
        id: bk.otpCode ? `BK-${bk.otpCode.substring(0, 5)}` : `BK-${bk._id.substring(0, 5)}`,
        date: new Date(bk.createdAt).toISOString().split('T')[0],
        createdAt: bk.createdAt,
        verifiedAt: bk.createdAt,
        allocatedAt: bk.createdAt,
        completedAt: bk.deliveredAt || '',
        status: bk.status,
        weight: bk.weight,
        cost: bk.cost,
        trackingStep: bk.status === 'Delivered' ? 4 : (bk.status === 'In Transit' ? 3 : (bk.status === 'Confirmed' ? 2 : 1)),
        userId: bk.userId?.email || bk.userId || 'citizen@lpg.com',
        location: bk.distributorName,
        otpCode: bk.otpCode,
        priorityScore: 5.0,
        verificationStatus: 'VALID',
        transactionStatus: bk.status === 'Delivered' ? 'Completed' : 'Approved',
        fraudCheckStatus: 'Passed',
        emergencyStatus: 'NORMAL',
        _id: bk._id
      };

      setLpgBookings(prev => {
        if (prev.some(b => b._id === mappedBooking._id)) return prev;
        return [mappedBooking, ...prev];
      });
    });

    // 6. LPG Booking Update
    socket.on('booking_update', (bk) => {
      console.log('Received booking_update from socket:', bk);
      setLpgBookings(prev => prev.map(b => {
        if (b._id === bk._id || b.otpCode === bk.otpCode) {
          const nextStep = bk.status === 'Delivered' ? 4 : (bk.status === 'In Transit' ? 3 : (bk.status === 'Confirmed' ? 2 : 1));
          return {
            ...b,
            status: bk.status,
            trackingStep: nextStep,
            completedAt: bk.status === 'Delivered' ? bk.deliveredAt || new Date().toISOString() : b.completedAt,
            transactionStatus: bk.status === 'Delivered' ? 'Completed' : (bk.status === 'In Transit' ? 'Allocated' : 'Approved')
          };
        }
        return b;
      }));

      const loggedEmail = lpgUser?.email;
      if (loggedEmail && (bk.userId === loggedEmail || bk.userId?.email === loggedEmail)) {
        setLpgStatus(bk.status);
      }
    });

    // 7. Fraud Log Alert
    socket.on('fraud_alert', (log) => {
      console.log('Received fraud_alert from socket:', log);
      const mappedLog = {
        id: log._id,
        type: log.type,
        date: log.date,
        location: log.location,
        details: log.details,
        riskScore: log.riskScore,
        status: log.status,
        time: new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setFraudLogs(prev => {
        if (prev.some(l => l.id === mappedLog.id)) return prev;
        return [mappedLog, ...prev];
      });
      addSystemNotification('alert', `🚨 Fraud Alert: ${mappedLog.type}`, `${mappedLog.details} (Risk Score: ${mappedLog.riskScore}%)`);
    });

    // 8. Fraud Log Update
    socket.on('fraud_update', (log) => {
      console.log('Received fraud_update from socket:', log);
      setFraudLogs(prev => prev.map(l => {
        if (l.id === log._id) {
          return { ...l, status: log.status };
        }
        return l;
      }));
    });

    // 9. Forecast Update
    socket.on('forecast_update', (forecast) => {
      console.log('Received forecast_update from socket:', forecast);
    });

    return () => {
      socket.disconnect();
    };
  }, [fuelUser, lpgUser]);

  // Load and sync fuelUsers / lpgUsers databases
  useEffect(() => {
    const users = JSON.parse(localStorage.getItem('supabase_mock_users') || '[]');
    
    // Default fuel profile
    const defaultFuelMetadata = {
      fullName: 'John Doe',
      phone: '9876543210',
      vehicleNumber: 'WP-CAD-8930',
      vehicleType: 'Car',
      district: 'Colombo',
      state: 'Western',
      citizenId: '19983423423V'
    };
    
    const defaultEmergencyMetadata = {
      fullName: 'Colombo General Ambulance #4',
      phone: '999',
      vehicleNumber: 'WP-AMB-9111',
      vehicleType: 'Ambulance',
      district: 'Colombo',
      state: 'Western',
      citizenId: '19901111111V'
    };

    let updated = false;
    if (!users.some(u => u.email === 'citizen@fuel.com')) {
      users.push({ email: 'citizen@fuel.com', password: 'password123', user_metadata: defaultFuelMetadata });
      updated = true;
    }
    if (!users.some(u => u.email === 'responder@emergency.gov')) {
      users.push({ email: 'responder@emergency.gov', password: 'password123', user_metadata: defaultEmergencyMetadata });
      updated = true;
    }
    if (updated) {
      localStorage.setItem('supabase_mock_users', JSON.stringify(users));
    }

    const fuelList = users.map(u => ({
      email: u.email,
      fullName: u.user_metadata?.fullName || u.fullName || 'John Doe',
      phone: u.user_metadata?.phone || u.phone || '9876543210',
      vehicleNumber: u.user_metadata?.vehicleNumber || u.vehicleNumber || 'WP-CAD-8930',
      vehicleType: u.user_metadata?.vehicleType || u.vehicleType || 'Car',
      district: u.user_metadata?.district || u.district || 'Colombo',
      state: u.user_metadata?.state || u.state || 'Western',
      citizenId: u.user_metadata?.citizenId || u.citizenId || ''
    }));
    setFuelUsers(fuelList);
  }, [fuelUser]);

  useEffect(() => {
    const users = JSON.parse(localStorage.getItem('supabase_mock_users') || '[]');
    
    // Default lpg profile
    const defaultLpgMetadata = {
      fullName: 'Jane Smith',
      phone: '9876543211',
      address: '123 Main St, Garden City',
      pincode: '110001',
      district: 'New Delhi',
      state: 'Delhi',
      consumerNumber: 'LPG-892301-A',
      preferredDistributor: 'Super Gas Distributors'
    };
    if (!users.some(u => u.email === 'citizen@lpg.com')) {
      users.push({ email: 'citizen@lpg.com', password: 'password123', user_metadata: defaultLpgMetadata });
      localStorage.setItem('supabase_mock_users', JSON.stringify(users));
    }

    const lpgList = users.map(u => ({
      email: u.email,
      fullName: u.user_metadata?.fullName || u.fullName || 'Jane Smith',
      phone: u.user_metadata?.phone || u.phone || '9876543211',
      address: u.user_metadata?.address || u.address || '123 Main St, Garden City',
      pincode: u.user_metadata?.pincode || u.pincode || '110001',
      district: u.user_metadata?.district || u.district || 'New Delhi',
      state: u.user_metadata?.state || u.state || 'Delhi',
      consumerNumber: u.user_metadata?.consumerNumber || u.consumerNumber || 'LPG-892301-A',
      preferredDistributor: u.user_metadata?.preferredDistributor || u.preferredDistributor || 'Super Gas Distributors'
    }));
    setLpgUsers(lpgList);
  }, [lpgUser]);

  // Update Profile Actions
  const updateUserProfile = (module, profileData) => {
    const users = JSON.parse(localStorage.getItem('supabase_mock_users') || '[]');
    const targetEmail = module === 'fuel' ? (fuelUser?.email || 'citizen@fuel.com') : (lpgUser?.email || 'citizen@lpg.com');
    
    const updatedUsers = users.map(u => {
      if (u.email === targetEmail) {
        return {
          ...u,
          user_metadata: {
            ...u.user_metadata,
            ...profileData
          }
        };
      }
      return u;
    });

    localStorage.setItem('supabase_mock_users', JSON.stringify(updatedUsers));

    if (module === 'fuel') {
      setFuelUser(prev => {
        const next = { ...prev, ...profileData };
        setLocalStorage('fuel_user_session', next);
        return next;
      });
      addSystemNotification('info', '👤 Profile Updated', 'Your Fuel citizen profile details have been successfully modified.');
    } else if (module === 'lpg') {
      setLpgUser(prev => {
        const next = { ...prev, ...profileData };
        setLocalStorage('lpg_user_session', next);
        return next;
      });
      addSystemNotification('info', '👤 Profile Updated', 'Your LPG consumer account details have been successfully modified.');
    }
  };

  const [emergencyQuota, setEmergencyQuota] = useState(() => getLocalStorage('emergency_quota', 100.0));
  useEffect(() => { setLocalStorage('emergency_quota', emergencyQuota); }, [emergencyQuota]);

  // Emergency Mode Toggle
  const toggleEmergencyMode = () => {
    setEmergencyMode(prev => {
      const nextMode = !prev;
      if (nextMode) {
        // Automatically halve remaining quota for all standard citizens
        setRemainingQuota(current => parseFloat((current / 2).toFixed(1)));
        setEmergencyQuota(250.0);
        
        // Add urgent notification
        addSystemNotification('alert', '⚠️ EMERGENCY MODE ACTIVATED', 'National energy reserves are locked. Weekly quotas reduced by 50% for priority responder allocation. Emergency responder quotas increased to 250 L.');
      } else {
        // Restore standard quota
        setRemainingQuota(50.0);
        setEmergencyQuota(100.0);
        addSystemNotification('info', 'ℹ️ Emergency Mode Deactivated', 'Standard fuel allocation quotas have been fully restored.');
      }
      return nextMode;
    });
  };

  // Add Notification to Center
  const addSystemNotification = (type, title, desc) => {
    const newNotif = {
      id: Date.now(),
      type,
      title,
      desc,
      date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    };
    setSystemNotifications(prev => [newNotif, ...prev]);
  };

  // Add Fraud Incident log entry
  const addFraudLogEntry = (type, details, riskScore) => {
    const newLog = {
      id: Date.now(),
      type,
      details,
      riskScore,
      status: 'Flagged',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setFraudLogs(prev => [newLog, ...prev]);
    addSystemNotification('alert', `🚨 Fraud Alert: ${type}`, `${details} (Risk Score: ${riskScore}%)`);
  };

  // Fuel Auth Actions using Supabase Client (With fallback mock operator credentials checks)
  const registerFuelUser = async (userData) => {
    const users = JSON.parse(localStorage.getItem('supabase_mock_users') || '[]');
    if (users.some(u => u.email === userData.email)) {
      return { success: false, message: 'User already exists.' };
    }
    const newUser = {
      email: userData.email,
      password: userData.password,
      user_metadata: {
        fullName: userData.fullName,
        phone: userData.phone,
        vehicleNumber: userData.vehicleNumber,
        vehicleType: userData.vehicleType,
        district: userData.district,
        state: userData.state,
        citizenId: userData.citizenId
      }
    };
    users.push(newUser);
    localStorage.setItem('supabase_mock_users', JSON.stringify(users));

    // Register user details in Express/MongoDB backend
    try {
      const authRes = await fetch(BACKEND_URL + '/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          role: 'citizen',
          fullName: userData.fullName
        })
      });
      if (authRes.ok) {
        const uData = await authRes.json();
        const userId = uData.user.id;
        const token = uData.token;
        localStorage.setItem('auth_token', token);
        setAuthToken(token);

        // Register vehicle matching user ID
        const vehRes = await fetch(BACKEND_URL + '/api/vehicles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            vehicleNumber: userData.vehicleNumber,
            ownerId: userId,
            vehicleType: userData.vehicleType,
            chassisNumber: `CHASSIS-${userData.vehicleNumber}-${Date.now()}`,
            fuelType: userData.vehicleType === 'Ambulance' || userData.vehicleType === 'Police' || userData.vehicleType === 'Fire' ? 'Auto Diesel' : 'Petrol 92 Octane'
          })
        });
        const vData = await vehRes.json();

        // Create Quota wallet for the registered user
        await fetch(BACKEND_URL + '/api/quotas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            userId,
            vehicleId: vData.vehicle?._id,
            normalLimit: 50,
            emergencyLimit: 20,
            remainingQuota: 50
          })
        });
      }
    } catch (err) {
      console.warn('Backend connection failed, registered citizen locally', err.message);
    }

    try {
      await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            fullName: userData.fullName,
            phone: userData.phone,
            vehicleNumber: userData.vehicleNumber,
            vehicleType: userData.vehicleType,
            district: userData.district,
            state: userData.state,
            citizenId: userData.citizenId,
            module: 'fuel'
          }
        }
      });
      return { success: true };
    } catch (err) {
      return { success: true }; // Fallback to local sign success
    }
  };

  const loginFuelUser = async (email, password) => {
    // 1. Check for Government Admin
    if (email === 'admin@fuelguard.gov' && password === 'admin123') {
      const admin = { email, fullName: 'Gov Administrator', role: 'admin' };
      try {
        const res = await fetch(BACKEND_URL + '/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.token) {
            localStorage.setItem('auth_token', data.token);
            setAuthToken(data.token);
          }
        }
      } catch (err) {
        console.warn('Backend login failed, using local session state only', err.message);
      }
      setAdminUser(admin);
      return { success: true, role: 'admin' };
    }
    
    // 2. Check for Petrol Pump Operator
    if (email === 'pump@ceypetco.com' && password === 'pump123') {
      const operator = { email, fullName: 'Ceypetco Pump #4 Manager', station: 'Ceypetco - Town Hall', role: 'pump' };
      try {
        const res = await fetch(BACKEND_URL + '/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.token) {
            localStorage.setItem('auth_token', data.token);
            setAuthToken(data.token);
          }
        }
      } catch (err) {
        console.warn('Backend login failed, using local session state only', err.message);
      }
      setPumpUser(operator);
      return { success: true, role: 'pump' };
    }

    // Try backend authentication check
    try {
      const loginRes = await fetch(BACKEND_URL + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (loginRes.ok) {
        const uData = await loginRes.json();
        localStorage.setItem('auth_token', uData.token);
        setAuthToken(uData.token);
        // Fetch vehicle profile from DB if registered
        let vehicleNumber = 'WP-CAD-8930';
        let vehicleType = 'Car';
        let district = 'Colombo';
        try {
          const qRes = await fetch(`${BACKEND_URL}/api/quotas/user/${uData.user.id}`, {
            headers: { 'Authorization': `Bearer ${uData.token}` }
          });
          if (qRes.ok) {
            const qData = await qRes.json();
            if (qData.quota && qData.quota.vehicleId) {
              vehicleNumber = qData.quota.vehicleId.vehicleNumber;
              vehicleType = qData.quota.vehicleId.vehicleType;
            }
          }
        } catch (e) {
          console.warn('Quota load failed, using baseline vehicle fallbacks');
        }

        const loggedUser = {
          email: uData.user.email,
          fullName: uData.user.fullName,
          phone: '9876543210',
          vehicleNumber,
          vehicleType,
          district,
          state: 'Western',
          citizenId: ''
        };
        setFuelUser(loggedUser);
        return { success: true, role: 'citizen' };
      }
    } catch (err) {
      console.warn('Backend login query failed, falling back to Supabase client', err.message);
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, message: error.message };
      
      if (data.session) {
        localStorage.setItem('auth_token', data.session.access_token);
        setAuthToken(data.session.access_token);
      }
      
      const userMetadata = data.user.user_metadata || {};
      const loggedUser = {
        email: data.user.email,
        fullName: userMetadata.fullName || 'John Doe',
        phone: userMetadata.phone || '9876543210',
        vehicleNumber: userMetadata.vehicleNumber || 'WP-CAD-8930',
        vehicleType: userMetadata.vehicleType || 'Car',
        district: userMetadata.district || 'Colombo',
        state: userMetadata.state || 'Western',
        citizenId: userMetadata.citizenId || ''
      };
      
      setFuelUser(loggedUser);
      return { success: true, role: 'citizen' };
    } catch (err) {
      return { success: false, message: err.message || 'Sign in failed.' };
    }
  };

  const logoutFuelUser = async () => {
    await supabase.auth.signOut();
    setFuelUser(null);
    setAdminUser(null);
    setPumpUser(null);
    setAuthToken('');
    localStorage.removeItem('auth_token');
  };

  const resetFuelPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) return { success: false, message: error.message };
    return { success: true };
  };

  // Dynamic Priority score calculations
  const calculatePriorityScore = (vehicleType, queueLength, stockLevel) => {
    let E_i = priorityGeneral; // Default General Consumer
    if (vehicleType === 'Ambulance' || vehicleType === 'Police' || vehicleType === 'Fire') {
      E_i = priorityEmergency;
    } else if (vehicleType === 'Healthcare') {
      E_i = priorityHealthcare;
    } else if (vehicleType === 'Public Transport' || vehicleType === 'Bus') {
      E_i = priorityPublicTransport;
    } else if (vehicleType === 'Essential') {
      E_i = priorityEssential;
    }

    if (emergencyMode && (vehicleType === 'Ambulance' || vehicleType === 'Police' || vehicleType === 'Fire')) {
      E_i += 3.0; // Boost emergency services when Emergency Mode is active!
    }

    const D_i = Math.min(10, queueLength / 2);
    const S_i = Math.max(0, 10 - (stockLevel / 2000));

    return (weightEmergency * E_i) + (weightDemand * D_i) + (weightStock * S_i);
  };

  const calculateShortageRatio = (predicted, available) => {
    if (predicted <= 0) return 0;
    return Math.max(0, parseFloat(((predicted - available) / predicted).toFixed(3)));
  };

  const calculateDemandGap = (predicted, available) => {
    return parseFloat((predicted - available).toFixed(2));
  };

  const calculateSurplus = (available, expected) => {
    return parseFloat((available - expected).toFixed(2));
  };

  const verifyTransaction = (tx) => {
    // 1. Quota Check
    if (tx.requestedQuantity > tx.currentQuota) {
      return { valid: false, reason: 'Exceeded weekly quota allowance.' };
    }
    // 2. Supply Check is bypassed here to allow priority allocation rather than flat out rejection
    // 3. Fraud Flag Check
    const fraudMatch = fraudLogs.some(f => f.details.includes(tx.vehicleId) && f.status === 'Flagged');
    if (fraudMatch) {
      return { valid: false, reason: 'Active security fraud flag on vehicle registration.' };
    }
    // 4. Duplicate QR code check
    if (tx.qrToken && usedQrCodes.includes(tx.qrToken)) {
      return { valid: false, reason: 'Duplicate QR code attempt detected! QR already used.' };
    }
    return { valid: true };
  };

  const getUserQuota = (email) => {
    if (userQuotas && userQuotas[email] !== undefined) {
      return userQuotas[email];
    }
    // Default fallback
    const matchedUser = fuelUsers.find(u => u.email === email);
    const isEmergency = matchedUser?.vehicleType === 'Ambulance' || matchedUser?.vehicleType === 'Police' || matchedUser?.vehicleType === 'Fire';
    return emergencyMode 
      ? (isEmergency ? emergencyVehicleQuotaLimit : emergencyQuotaLimit) 
      : normalQuotaLimit;
  };

  const getAllocatedQuantity = (requestedQty, stationName, vehicleType) => {
    const targetStation = stations.find(s => s.name === stationName) || stations[0];
    const available = Math.max(0, targetStation.stock - (targetStation.reserved || 0));
    
    if (available >= requestedQty) {
      return requestedQty;
    }
    
    // Insufficient supply stock: apply proportional priority allocation formula
    const p_i = calculatePriorityScore(vehicleType, targetStation.queueLength, targetStation.stock);
    
    // Construct a mock queue of pending requests at this station
    const mockQueue = [
      { type: 'Ambulance' },
      { type: 'Bus' },
      { type: 'Car' }
    ];
    const queueSum = mockQueue.reduce((sum, v) => sum + calculatePriorityScore(v.type, targetStation.queueLength, targetStation.stock), 0);
    const totalPrioritySum = p_i + queueSum;
    
    const allocated = parseFloat(((p_i / totalPrioritySum) * available).toFixed(2));
    return Math.min(requestedQty, allocated);
  };

  const addFuelTransaction = (amount, stationName, vehicleNumber = null, qrToken = null) => {
    const adjustedAmount = parseFloat(amount);
    
    // Find the station
    const targetStation = stations.find(s => s.name === stationName) || stations[0];
    const userVehicleNum = vehicleNumber || fuelUser?.vehicleNumber || 'WP-CAD-8930';
    const matchedUser = fuelUsers.find(u => u.vehicleNumber.toLowerCase() === userVehicleNum.toLowerCase()) || { email: 'citizen@fuel.com', vehicleType: 'Car' };
    const userEmail = matchedUser.email;
    const userVehicleType = matchedUser.vehicleType;
    const currentQuotaVal = getUserQuota(userEmail);

    // Build transaction object for verification
    const verificationPayload = {
      requestedQuantity: adjustedAmount,
      currentQuota: currentQuotaVal,
      availableStock: targetStation.stock,
      vehicleId: userVehicleNum,
      qrToken: qrToken
    };

    const verResult = verifyTransaction(verificationPayload);
    if (!verResult.valid) {
      return { success: false, message: verResult.reason };
    }

    const allocatedAmount = getAllocatedQuantity(adjustedAmount, stationName, userVehicleType);

    // Timestamps
    const now = new Date().toISOString();
    const pScore = calculatePriorityScore(userVehicleType, targetStation.queueLength, targetStation.stock);

    const newTx = {
      id: Date.now(),
      date: now.split('T')[0],
      createdAt: now,
      verifiedAt: now,
      allocatedAt: now,
      completedAt: now,
      station: stationName,
      amount: adjustedAmount,
      allocatedAmount: allocatedAmount,
      cost: allocatedAmount * 370,
      type: 'Regular Fill',
      userId: userEmail,
      userType: userVehicleType === 'Ambulance' || userVehicleType === 'Police' || userVehicleType === 'Fire' ? 'Emergency Services' : 'General Consumer',
      vehicleId: userVehicleNum,
      fuelType: 'Petrol 92 Octane',
      priorityScore: parseFloat(pScore.toFixed(2)),
      verificationStatus: 'VALID',
      transactionStatus: 'Completed',
      fraudCheckStatus: 'Passed',
      emergencyStatus: emergencyMode ? 'ACTIVE' : 'NORMAL'
    };

    // If QR was used, invalidate it immediately in centralized state
    if (qrToken) {
      setUsedQrCodes(prev => {
        const next = [...prev, qrToken];
        setLocalStorage('used_qr_codes', next);
        return next;
      });
    }

    // Deduct remaining quota for this specific user
    setUserQuotas(prev => {
      const next = { ...prev, [userEmail]: Math.max(0, parseFloat((currentQuotaVal - allocatedAmount).toFixed(2))) };
      setLocalStorage('user_quotas', next);
      return next;
    });
    
    // Deduct station stock and increase queueLength for demo mapping dynamic updates
    setStations(prev => prev.map(s => {
      if (s.name === stationName) {
        const newStock = Math.max(0, s.stock - allocatedAmount);
        const newStatus = newStock === 0 ? 'Out of Stock' : newStock < 5000 ? 'Low Stock' : 'In Stock';
        return { ...s, stock: newStock, status: newStatus, queueLength: Math.max(0, s.queueLength - 1) };
      }
      return s;
    }));

    // Deduct national reserves
    setInventoryReserves(prev => ({
      ...prev,
      petrol92: Math.max(0, prev.petrol92 - allocatedAmount)
    }));

    // Append to transactions list
    setFuelTransactions(prev => [newTx, ...prev]);

    // Save to Express/MongoDB backend
    fetch(BACKEND_URL + '/api/transactions', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        transactionId: newTx.id.toString(),
        date: newTx.date,
        stationName: newTx.station,
        amount: newTx.amount,
        allocatedAmount: newTx.allocatedAmount,
        cost: newTx.cost,
        userId: userEmail,
        vehicleId: userVehicleNum,
        fuelType: newTx.fuelType,
        priorityScore: newTx.priorityScore,
        emergencyStatus: newTx.emergencyStatus
      })
    }).then(async (res) => {
      if (res.ok) {
        const matchStation = stations.find(s => s.name === stationName);
        if (matchStation) {
          const dbStationStock = Math.max(0, matchStation.stock - allocatedAmount);
          const invRes = await fetch(BACKEND_URL + '/api/fuel/inventory', { headers: getAuthHeaders() });
          if (invRes.ok) {
            const invData = await invRes.json();
            const dbNode = invData.inventory.find(i => i.stationName === stationName);
            if (dbNode) {
              await fetch(`${BACKEND_URL}/api/fuel/inventory/${dbNode._id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ stock: dbStationStock, status: dbStationStock === 0 ? 'Suspended' : (dbStationStock < 2000 ? 'Low Stock' : 'In Stock') })
              });
            }
          }
        }
      }
    }).catch(err => console.warn('Backend transaction save offline', err.message));

    // Add notification
    addSystemNotification('quota', '⛽ Fuel Filled Successfully', `${allocatedAmount} L filled at ${stationName}. Remaining quota: ${(currentQuotaVal - allocatedAmount).toFixed(1)} L.`);

    return { success: true };
  };

  // LPG Auth Actions using Supabase Client (With fallback mock operator credentials checks)
  const registerLpgUser = async (userData) => {
    const users = JSON.parse(localStorage.getItem('supabase_mock_users') || '[]');
    if (users.some(u => u.email === userData.email)) {
      return { success: false, message: 'User already exists.' };
    }
    const newUser = {
      email: userData.email,
      password: userData.password,
      user_metadata: {
        fullName: userData.fullName,
        phone: userData.phone,
        address: userData.address,
        pincode: userData.pincode,
        district: userData.district,
        state: userData.state,
        consumerNumber: userData.consumerNumber,
        preferredDistributor: userData.preferredDistributor
      }
    };
    users.push(newUser);
    localStorage.setItem('supabase_mock_users', JSON.stringify(users));

    // Register user details in Express/MongoDB backend
    try {
      const authRes = await fetch(BACKEND_URL + '/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          role: 'citizen',
          fullName: userData.fullName
        })
      });
      if (authRes.ok) {
        const uData = await authRes.json();
        const userId = uData.user.id;
        const token = uData.token;
        localStorage.setItem('auth_token', token);
        setAuthToken(token);

        // Create Quota wallet for the registered user
        await fetch(BACKEND_URL + '/api/quotas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            userId,
            normalLimit: 50,
            emergencyLimit: 20,
            remainingQuota: 50
          })
        });
      }
    } catch (err) {
      console.warn('Backend connection failed, registered citizen locally', err.message);
    }

    try {
      await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            fullName: userData.fullName,
            phone: userData.phone,
            address: userData.address,
            pincode: userData.pincode,
            district: userData.district,
            state: userData.state,
            consumerNumber: userData.consumerNumber,
            preferredDistributor: userData.preferredDistributor,
            module: 'lpg'
          }
        }
      });
      return { success: true };
    } catch (err) {
      return { success: true };
    }
  };

  const loginLpgUser = async (email, password) => {
    // 1. Check for Government Admin
    if (email === 'admin@fuelguard.gov' && password === 'admin123') {
      const admin = { email, fullName: 'Gov Administrator', role: 'admin' };
      try {
        const res = await fetch(BACKEND_URL + '/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.token) {
            localStorage.setItem('auth_token', data.token);
            setAuthToken(data.token);
          }
        }
      } catch (err) {
        console.warn('Backend login failed, using local session state only', err.message);
      }
      setAdminUser(admin);
      return { success: true, role: 'admin' };
    }
    
    // 2. Check for LPG Distributor Operator
    if (email === 'distributor@supergas.com' && password === 'distributor123') {
      const dist = { email, fullName: 'Super Gas Operator #12', company: 'Super Gas Distributors - Colombo', role: 'distributor' };
      try {
        const res = await fetch(BACKEND_URL + '/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.token) {
            localStorage.setItem('auth_token', data.token);
            setAuthToken(data.token);
          }
        }
      } catch (err) {
        console.warn('Backend login failed, using local session state only', err.message);
      }
      setDistributorUser(dist);
      return { success: true, role: 'distributor' };
    }

    // Try backend authentication check
    try {
      const loginRes = await fetch(BACKEND_URL + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (loginRes.ok) {
        const uData = await loginRes.json();
        localStorage.setItem('auth_token', uData.token);
        setAuthToken(uData.token);
        const loggedUser = {
          email: uData.user.email,
          fullName: uData.user.fullName,
          phone: '9876543211',
          address: '123 Main St, Garden City',
          pincode: '110001',
          district: 'Colombo',
          state: 'Western',
          consumerNumber: 'LPG-892301-A',
          preferredDistributor: 'Super Gas Distributors - Colombo'
        };
        setLpgUser(loggedUser);
        return { success: true, role: 'citizen' };
      }
    } catch (err) {
      console.warn('Backend login query failed, falling back to Supabase client', err.message);
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, message: error.message };
      
      if (data.session) {
        localStorage.setItem('auth_token', data.session.access_token);
        setAuthToken(data.session.access_token);
      }
      
      const userMetadata = data.user.user_metadata || {};
      const loggedUser = {
        email: data.user.email,
        fullName: userMetadata.fullName || 'Jane Smith',
        phone: userMetadata.phone || '9876543211',
        address: userMetadata.address || '123 Main St, Garden City',
        pincode: userMetadata.pincode || '110001',
        district: userMetadata.district || 'New Delhi',
        state: userMetadata.state || 'Delhi',
        consumerNumber: userMetadata.consumerNumber || 'LPG-892301-A',
        preferredDistributor: userMetadata.preferredDistributor || 'Super Gas Distributors - Colombo'
      };
      
      setLpgUser(loggedUser);
      return { success: true, role: 'citizen' };
    } catch (err) {
      return { success: false, message: err.message || 'Sign in failed.' };
    }
  };

  const logoutLpgUser = async () => {
    await supabase.auth.signOut();
    setLpgUser(null);
    setAdminUser(null);
    setDistributorUser(null);
    setAuthToken('');
    localStorage.removeItem('auth_token');
  };

  const resetLpgPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) return { success: false, message: error.message };
    return { success: true };
  };

  const bookLpgCylinder = (weight = '12.5kg', distributorName = 'Super Gas Distributors - Colombo') => {
    if (lpgStatus === 'Booked' || lpgStatus === 'In Transit') {
      return { success: false, message: 'You already have an active booking.' };
    }

    // Check 21-day rule
    const today = new Date();
    const nextEligible = new Date(nextLpgBookingDate);
    if (nextLpgBookingDate && today < nextEligible) {
      return { success: false, message: `Failed: 21-day quota restriction active. Next eligible booking date: ${nextLpgBookingDate}.` };
    }

    const targetDist = stations.find(s => s.name === distributorName) || stations.find(s => s.type === 'lpg') || stations[4];
    
    // Check stock
    const requiredCylinders = 1;
    const availableDistStock = targetDist.stock - (targetDist.reserved || 0);
    if (availableDistStock < requiredCylinders) {
      return { success: false, message: 'Distributor currently has no cylinders in stock.' };
    }

    const bookingId = 'BK-' + Math.floor(10000 + Math.random() * 90000);
    const now = new Date().toISOString();
    const pScore = calculatePriorityScore('General', targetDist.queueLength, targetDist.stock);

    const newBooking = {
      id: bookingId,
      date: now.split('T')[0],
      createdAt: now,
      verifiedAt: now,
      allocatedAt: now,
      completedAt: '',
      status: 'Booked',
      weight: weight,
      cost: weight === '12.5kg' ? 3900 : 1600,
      trackingStep: 1,
      userId: lpgUser?.email || 'citizen@lpg.com',
      location: distributorName,
      priorityScore: parseFloat(pScore.toFixed(2)),
      verificationStatus: 'VALID',
      transactionStatus: 'Approved',
      fraudCheckStatus: 'Passed',
      emergencyStatus: emergencyMode ? 'ACTIVE' : 'NORMAL'
    };

    setLpgBookings(prev => [newBooking, ...prev]);
    setLpgStatus('Booked');
    
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 21);
    setNextLpgBookingDate(nextDate.toISOString().split('T')[0]);

    // Persist LPG booking to backend database
    fetch(BACKEND_URL + '/api/lpg/booking', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        userId: lpgUser?.email || 'citizen@lpg.com',
        distributorName,
        weight,
        cost: weight === '12.5kg' ? 3900 : 1600
      })
    }).then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        // Update local object with the actual backend ObjectID
        setLpgBookings(prev => prev.map(b => b.id === bookingId ? { ...b, _id: data.booking._id, otpCode: data.booking.otpCode } : b));
        
        // Also update distributor reserved stock on DB
        const dbReserved = (targetDist.reserved || 0) + requiredCylinders;
        const invRes = await fetch(BACKEND_URL + '/api/lpg/inventory', { headers: getAuthHeaders() });
        if (invRes.ok) {
          const invData = await invRes.json();
          const dbNode = invData.inventory.find(i => i.distributorName === distributorName);
          if (dbNode) {
            await fetch(`${BACKEND_URL}/api/lpg/inventory/${dbNode._id}`, {
              method: 'PUT',
              headers: getAuthHeaders(),
              body: JSON.stringify({ reserved: dbReserved })
            });
          }
        }
      }
    }).catch(err => console.warn('Backend LPG booking save offline', err.message));

    // Increase distributor reserved stock
    setStations(prev => prev.map(s => {
      if (s.name === distributorName) {
        return { ...s, reserved: (s.reserved || 0) + requiredCylinders };
      }
      return s;
    }));

    // Increase reservedReserves
    setReservedReserves(prev => ({
      ...prev,
      lpg12: weight === '12.5kg' ? (prev.lpg12 + 1) : prev.lpg12,
      lpg5: weight === '5kg' ? (prev.lpg5 + 1) : prev.lpg5
    }));

    addSystemNotification('bookings', '🔥 LPG Cylinder Booked', `Booking ${bookingId} submitted successfully at ${distributorName}.`);

    return { success: true, bookingId };
  };

  const advanceLpgDeliveryStatus = (bookingId) => {
    const now = new Date().toISOString();
    setLpgBookings(prevBookings => {
      const targetBooking = prevBookings.find(b => b.id === bookingId);
      if (!targetBooking) return prevBookings;

      // Synchronize booking advancement to Express backend
      if (targetBooking._id) {
        const nextStep = targetBooking.trackingStep < 4 ? targetBooking.trackingStep + 1 : 4;
        let nextStatus = 'Ordered';
        if (nextStep === 2) nextStatus = 'Confirmed';
        if (nextStep === 3) nextStatus = 'In Transit';
        if (nextStep === 4) nextStatus = 'Delivered';

        fetch(`${BACKEND_URL}/api/lpg/booking/${targetBooking._id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            status: nextStatus,
            code: targetBooking.otpCode || '123456'
          })
        }).then(async (res) => {
          if (res.ok) {
            if (nextStatus === 'Delivered') {
              const distributorName = targetBooking.location;
              const matchDist = stations.find(s => s.name === distributorName);
              if (matchDist) {
                const dbStock = Math.max(0, matchDist.stock - 1);
                const dbReserved = Math.max(0, (matchDist.reserved || 0) - 1);
                const invRes = await fetch(BACKEND_URL + '/api/lpg/inventory', { headers: getAuthHeaders() });
                if (invRes.ok) {
                  const invData = await invRes.json();
                  const dbNode = invData.inventory.find(i => i.distributorName === distributorName);
                  if (dbNode) {
                    await fetch(`${BACKEND_URL}/api/lpg/inventory/${dbNode._id}`, {
                      method: 'PUT',
                      headers: getAuthHeaders(),
                      body: JSON.stringify({ stock: dbStock, reserved: dbReserved, status: dbStock === 0 ? 'Out of Stock' : 'In Stock' })
                    });
                  }
                }
              }
            }
          }
        }).catch(err => console.warn('Backend LPG booking advance offline', err.message));
      }

      // If transition is to Delivered (step 4), deduct stock and reserve
      const isDelivered = targetBooking.trackingStep === 3; // next step is 4

      if (isDelivered && targetBooking.status !== 'Delivered') {
        const weight = targetBooking.weight;
        const distributorName = targetBooking.location;

        // Decrease stock & reserved count
        setStations(prev => prev.map(s => {
          if (s.name === distributorName) {
            const newStock = Math.max(0, s.stock - 1);
            const newStatus = newStock === 0 ? 'Out of Stock' : 'In Stock';
            return { 
              ...s, 
              stock: newStock, 
              reserved: Math.max(0, (s.reserved || 0) - 1), 
              status: newStatus 
            };
          }
          return s;
        }));

        // Decrease national reserves and reservedReserves
        setInventoryReserves(prev => ({
          ...prev,
          lpg12: weight === '12.5kg' ? Math.max(0, prev.lpg12 - 1) : prev.lpg12,
          lpg5: weight === '5kg' ? Math.max(0, prev.lpg5 - 1) : prev.lpg5
        }));
        setReservedReserves(prev => ({
          ...prev,
          lpg12: weight === '12.5kg' ? Math.max(0, prev.lpg12 - 1) : prev.lpg12,
          lpg5: weight === '5kg' ? Math.max(0, prev.lpg5 - 1) : prev.lpg5
        }));
      }

      return prevBookings.map(b => {
        if (b.id === bookingId) {
          const nextStep = b.trackingStep < 4 ? b.trackingStep + 1 : 4;
          let newStatus = b.status;
          if (nextStep === 1) newStatus = 'Booked';
          if (nextStep === 2) newStatus = 'Confirmed';
          if (nextStep === 3) newStatus = 'In Transit';
          if (nextStep === 4) newStatus = 'Delivered';
          
          if (b.id === prevBookings[0]?.id) {
            setLpgStatus(newStatus);
          }
          
          if (newStatus === 'Delivered') {
            addSystemNotification('deliveries', '✅ Cylinder Delivered', `Your LPG Cylinder under booking ${bookingId} has been successfully verified and delivered.`);
          } else {
            addSystemNotification('deliveries', '🚚 Delivery Status Updated', `Booking ${bookingId} status changed to ${newStatus}.`);
          }
          
          return { 
            ...b, 
            trackingStep: nextStep, 
            status: newStatus,
            transactionStatus: nextStep === 4 ? 'Completed' : (nextStep === 3 ? 'Allocated' : 'Approved'),
            completedAt: newStatus === 'Delivered' ? now : b.completedAt
          };
        }
        return b;
      });
    });
  };

  const getPredictedDemand = () => {
    const completedTxs = fuelTransactions.filter(tx => tx.transactionStatus === 'Completed');
    const baselineFallback = (fuelUsers.length || 10) * normalQuotaLimit;

    if (completedTxs.length < 3) {
      return baselineFallback;
    }

    const totalVolume = completedTxs.reduce((sum, tx) => sum + (tx.allocatedAmount || tx.amount), 0);
    const avgVol = totalVolume / completedTxs.length;
    const prediction = avgVol * (fuelUsers.length || 10) * 1.15;
    return parseFloat(prediction.toFixed(2));
  };

  const getStationDistance = (station) => {
    if (!userCoords) return 'Location unavailable';
    const R = 6371;
    const dLat = (station.lat - userCoords.lat) * Math.PI / 180;
    const dLng = (station.lng - userCoords.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(userCoords.lat * Math.PI / 180) * Math.cos(station.lat * Math.PI / 180) * 
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;
    return `${dist.toFixed(1)} km`;
  };

  const getStationWaitTime = (station) => {
    if (station.queueLength === undefined) return 'Wait time unavailable';
    if (station.queueLength === 0) return '0–5 mins';
    const waitMins = station.queueLength * averageServiceTime;
    return `${waitMins} mins`;
  };

  const sendVerificationOtp = (email) => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const timestamp = Date.now();
    setActiveOtps(prev => ({
      ...prev,
      [email]: { code, timestamp, retries: 0 }
    }));
    return code;
  };

  const verifyOtpCode = (email, code) => {
    const record = activeOtps[email];
    if (!record) {
      return { success: false, message: 'No OTP generated for this user. Please click transmit code.' };
    }
    if (Date.now() - record.timestamp > 60 * 1000) {
      setActiveOtps(prev => {
        const next = { ...prev };
        delete next[email];
        return next;
      });
      return { success: false, message: 'OTP has expired. Please transmit a new code.' };
    }
    if (record.retries >= 3) {
      setActiveOtps(prev => {
        const next = { ...prev };
        delete next[email];
        return next;
      });
      return { success: false, message: 'Too many retry attempts. Code locked. Send a new OTP.' };
    }
    if (record.code !== code) {
      setActiveOtps(prev => ({
        ...prev,
        [email]: { ...record, retries: record.retries + 1 }
      }));
      return { success: false, message: `Incorrect OTP. ${3 - record.retries - 1} retries left.` };
    }
    setActiveOtps(prev => {
      const next = { ...prev };
      delete next[email];
      return next;
    });
    return { success: true };
  };

  const markNotifAsRead = (id) => {
    setSystemNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAllNotifications = () => {
    setSystemNotifications([]);
  };

  const generateBackendQrToken = async (vehicleNumber) => {
    try {
      const res = await fetch(BACKEND_URL + '/api/transactions/token', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ vehicleNumber })
      });
      if (res.ok) {
        const data = await res.json();
        return data.token;
      }
    } catch (err) {
      console.warn('Failed to fetch secure backend QR token, using fallback', err.message);
    }
    return `FUEL-${vehicleNumber}-${Date.now()}`;
  };

  const runBackendForecasting = async () => {
    try {
      const res = await fetch(BACKEND_URL + '/api/admin/forecasts/calculate', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        addSystemNotification('info', '📊 Demand Forecasts Computed', 'Backend AI forecasting engine recalculated demand gaps for all stations.');
        return data.forecasts;
      }
    } catch (err) {
      console.error('Failed to trigger backend forecasting', err.message);
    }
    return null;
  };

  const triggerBackendQuotaReset = async () => {
    try {
      const res = await fetch(BACKEND_URL + '/api/admin/quotas/reset-all', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        addSystemNotification('info', '⏰ Quotas Refilled', `Successfully reset ${data.modifiedCount} citizen quota wallets to standard values.`);
        return true;
      }
    } catch (err) {
      console.error('Failed to trigger backend quota reset', err.message);
    }
    return false;
  };

  const verifyBackendLedger = async () => {
    try {
      const res = await fetch(BACKEND_URL + '/api/admin/ledger/verify', {
        method: 'GET',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error('Failed to verify backend ledger', err.message);
    }
    return { isValid: true };
  };

  const tamperBackendLedger = async () => {
    try {
      const res = await fetch(BACKEND_URL + '/api/admin/ledger/tamper', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error('Failed to trigger database tampering simulation', err.message);
    }
    return null;
  };

  const getSimulatedSMSLogs = async () => {
    try {
      const res = await fetch(BACKEND_URL + '/api/admin/sms/logs', {
        method: 'GET',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        return data.logs;
      }
    } catch (err) {
      console.error('Failed to get simulated SMS logs', err.message);
    }
    return [];
  };

  const getResearchEvaluationMetrics = async (isTestDataset = false) => {
    try {
      const url = `${BACKEND_URL}/api/admin/metrics/evaluation${isTestDataset ? '?type=test' : ''}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error('Failed to retrieve research evaluation metrics', err.message);
    }
    return null;
  };

  return (
    <AppContext.Provider value={{
      fuelUser,
      lpgUser,
      adminUser,
      pumpUser,
      distributorUser,
      fuelUsers,
      lpgUsers,
      emergencyMode,
      remainingQuota,
      fuelTransactions,
      lpgBookings,
      lpgStatus,
      nextLpgBookingDate,
      inventoryReserves,
      reservedReserves,
      setReservedReserves,
      fraudLogs,
      setFraudLogs,
      systemNotifications,
      updateUserProfile,
      toggleEmergencyMode,
      addSystemNotification,
      addFraudLogEntry,
      registerFuelUser,
      loginFuelUser,
      logoutFuelUser,
      resetFuelPassword,
      addFuelTransaction,
      registerLpgUser,
      loginLpgUser,
      logoutLpgUser,
      resetLpgPassword,
      bookLpgCylinder,
      advanceLpgDeliveryStatus,
      markNotifAsRead,
      clearAllNotifications,
      setRemainingQuota,
      setLpgStatus,
      setInventoryReserves,
      emergencyQuota,
      setEmergencyQuota,
      stations,
      setStations,
      normalQuotaLimit,
      setNormalQuotaLimit,
      emergencyQuotaLimit,
      setEmergencyQuotaLimit,
      emergencyVehicleQuotaLimit,
      setEmergencyVehicleQuotaLimit,
      weightEmergency,
      setWeightEmergency,
      weightDemand,
      setWeightDemand,
      weightStock,
      setWeightStock,
      calculatePriorityScore,
      calculateShortageRatio,
      calculateDemandGap,
      calculateSurplus,
      verifyTransaction,
      getUserQuota,
      userQuotas,
      setUserQuotas,
      auditLogs,
      addAuditLog,
      priorityEmergency,
      setPriorityEmergency,
      priorityHealthcare,
      setPriorityHealthcare,
      priorityFire,
      setPriorityFire,
      priorityPolice,
      setPriorityPolice,
      priorityPublicTransport,
      setPriorityPublicTransport,
      priorityEssential,
      setPriorityEssential,
      priorityGeneral,
      setPriorityGeneral,
      averageServiceTime,
      setAverageServiceTime,
      getPredictedDemand,
      getStationDistance,
      getStationWaitTime,
      sendVerificationOtp,
      verifyOtpCode,
      usedQrCodes,
      setUsedQrCodes,
      generateBackendQrToken,
      runBackendForecasting,
      triggerBackendQuotaReset,
      verifyBackendLedger,
      tamperBackendLedger,
      getSimulatedSMSLogs,
      getResearchEvaluationMetrics,
      BACKEND_URL
    }}>
      {children}
    </AppContext.Provider>
  );
};
