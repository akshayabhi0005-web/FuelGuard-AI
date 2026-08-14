import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

export let isDbConnected = mongoose.connection.readyState === 1;

export const setDbConnected = (val) => {
  isDbConnected = val;
};

// Mongoose connection state listeners to update live binding
mongoose.connection.on('connected', () => {
  isDbConnected = true;
});
mongoose.connection.on('disconnected', () => {
  isDbConnected = false;
});
mongoose.connection.on('error', () => {
  isDbConnected = false;
});

// In-Memory Collections
export const memoryDb = {
  users: [],
  vehicles: [], // mock registered vehicle database
  quotas: {}, // userId -> quota record
  transactions: [],
  settings: {
    emergencyModeActive: false,
    normalQuotaLimit: 50,
    emergencyQuotaLimit: 25,
    emergencyVehicleQuotaLimit: 250,
    weightEmergency: 0.5,
    weightDemand: 0.3,
    weightStock: 0.2
  },
  fraudLogs: [],
  forecasts: [],
  lpgBookings: [],
  fuelInventory: [],
  lpgInventory: []
};

// Seed initial demo data
const seedMemoryDb = async () => {
  const salt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('admin123', salt);
  const citizenHash = await bcrypt.hash('password123', salt);
  const pumpHash = await bcrypt.hash('password123', salt);
  const distributorHash = await bcrypt.hash('password123', salt);

  memoryDb.users.push(
    {
      _id: 'mem-user-admin',
      email: 'admin@fuelguard.gov',
      passwordHash: adminHash,
      role: 'admin',
      fullName: 'Gov Administrator'
    },
    {
      _id: 'mem-user-citizen',
      email: 'citizen@fuel.com',
      passwordHash: citizenHash,
      role: 'citizen',
      fullName: 'Default Citizen'
    },
    {
      _id: 'mem-user-pump',
      email: 'pump@fuel.com',
      passwordHash: pumpHash,
      role: 'pump',
      fullName: 'Pump Operator'
    },
    {
      _id: 'mem-user-distributor',
      email: 'distributor@lpg.com',
      passwordHash: distributorHash,
      role: 'distributor',
      fullName: 'LPG Distributor'
    }
  );

  memoryDb.quotas['mem-user-citizen'] = {
    userId: 'mem-user-citizen',
    normalLimit: 50,
    emergencyLimit: 25,
    remainingQuota: 45
  };

  memoryDb.vehicles.push({
    _id: 'mem-veh-1',
    vehicleNumber: 'CAD-8930',
    ownerId: 'mem-user-citizen',
    vehicleType: 'Car',
    chassisNumber: 'CHAS-11112222',
    fuelType: 'Petrol 92 Octane'
  });

  // Seed Fuel Stations
  memoryDb.fuelInventory.push(
    {
      _id: '6a77da866fd9b0c10b88249c', // match test cases
      stationName: 'Ceypetco - Town Hall',
      district: 'Colombo',
      stock: 12500,
      reserved: 2400,
      status: 'Active'
    },
    {
      _id: 'mem-fuel-2',
      stationName: 'LIOC - Gampaha',
      district: 'Gampaha',
      stock: 8000,
      reserved: 1200,
      status: 'Active'
    },
    {
      _id: 'mem-fuel-3',
      stationName: 'Sinopec - Kandy',
      district: 'Kandy',
      stock: 9500,
      reserved: 1800,
      status: 'Active'
    }
  );

  // Seed LPG Distributors
  memoryDb.lpgInventory.push(
    {
      _id: 'mem-lpg-1',
      distributorName: 'Litro Gas - Colombo 07',
      district: 'Colombo',
      stock: 350,
      reserved: 85,
      status: 'Active'
    },
    {
      _id: 'mem-lpg-2',
      distributorName: 'Laugfs Gas - Negombo',
      district: 'Gampaha',
      stock: 220,
      reserved: 40,
      status: 'Active'
    }
  );
};

seedMemoryDb().catch(err => console.error('Error seeding memory DB:', err.message));

// Vehicle helpers
export const memFindVehicleByPlate = (plate) => {
  const v = memoryDb.vehicles.find(veh => veh.vehicleNumber.toUpperCase() === plate.toUpperCase());
  if (v) {
    const owner = memFindUserById(v.ownerId);
    return {
      ...v,
      ownerId: owner ? { _id: owner._id, fullName: owner.fullName, email: owner.email } : null
    };
  }
  return null;
};

export const memCreateVehicle = (veh) => {
  const newVeh = {
    _id: `mem-veh-${Date.now()}`,
    vehicleNumber: veh.vehicleNumber.toUpperCase(),
    ownerId: veh.ownerId,
    vehicleType: veh.vehicleType,
    chassisNumber: veh.chassisNumber,
    fuelType: veh.fuelType
  };
  memoryDb.vehicles.push(newVeh);
  return newVeh;
};

// Helper Functions simulating Mongoose queries
export const memFindUserByEmail = (email) => {
  return memoryDb.users.find(u => u.email.toLowerCase() === email.toLowerCase());
};

export const memFindUserById = (id) => {
  return memoryDb.users.find(u => u._id === id);
};

export const memCreateUser = async (user) => {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(user.passwordHash, salt);
  const newUser = {
    _id: `mem-user-${Date.now()}`,
    email: user.email.toLowerCase(),
    passwordHash,
    role: user.role || 'citizen',
    fullName: user.fullName
  };
  memoryDb.users.push(newUser);
  return newUser;
};

export const memGetQuotaByUserId = (userId) => {
  if (!memoryDb.quotas[userId]) {
    memoryDb.quotas[userId] = {
      userId,
      normalLimit: 50,
      emergencyLimit: 25,
      remainingQuota: 50
    };
  }
  return memoryDb.quotas[userId];
};

export const memUpdateQuotaRemaining = (userId, amount) => {
  const quota = memGetQuotaByUserId(userId);
  quota.remainingQuota = Math.max(0, quota.remainingQuota - amount);
  return quota;
};

export const memResetAllQuotas = () => {
  Object.keys(memoryDb.quotas).forEach(userId => {
    memoryDb.quotas[userId].remainingQuota = memoryDb.quotas[userId].normalLimit;
  });
};

export const memCreateTransaction = (tx) => {
  const newTx = {
    _id: `mem-tx-${Date.now()}`,
    transactionId: tx.transactionId || `TX-${Date.now()}`,
    date: tx.date || new Date().toISOString().split('T')[0],
    stationName: tx.stationName,
    amount: tx.amount,
    allocatedAmount: tx.allocatedAmount,
    cost: tx.cost,
    type: tx.type || 'Regular Fill',
    userId: tx.userId,
    fuelType: tx.fuelType,
    priorityScore: tx.priorityScore || 0,
    verificationStatus: tx.verificationStatus || 'VALID',
    transactionStatus: tx.transactionStatus || 'Completed',
    fraudCheckStatus: tx.fraudCheckStatus || 'Passed',
    emergencyStatus: tx.emergencyStatus || 'NORMAL',
    previousHash: tx.previousHash || '0',
    nonce: tx.nonce || 0,
    hash: tx.hash || '',
    createdAt: new Date().toISOString()
  };
  memoryDb.transactions.push(newTx);
  return newTx;
};

export const memGetTransactions = (userId = null) => {
  if (userId) {
    return memoryDb.transactions.filter(t => t.userId === userId);
  }
  return memoryDb.transactions;
};

export const memGetSettings = () => {
  return memoryDb.settings;
};

export const memUpdateSettings = (settings) => {
  memoryDb.settings = { ...memoryDb.settings, ...settings };
  return memoryDb.settings;
};

export const memCreateFraudLog = (log) => {
  const newLog = {
    _id: `mem-fraud-${Date.now()}`,
    type: log.type,
    location: log.location,
    details: log.details,
    riskScore: log.riskScore,
    status: 'Pending',
    date: new Date().toISOString()
  };
  memoryDb.fraudLogs.push(newLog);
  return newLog;
};

export const memGetFraudLogs = () => {
  return memoryDb.fraudLogs;
};

export const memResolveFraudLog = (id) => {
  const log = memoryDb.fraudLogs.find(l => l._id === id);
  if (log) {
    log.status = 'Resolved';
  }
  return log;
};

export const memCreateForecast = (forecast) => {
  const newForecast = {
    _id: `mem-forecast-${Date.now()}`,
    stationName: forecast.stationName,
    date: new Date(),
    expectedDemand: forecast.expectedDemand,
    predictedShortage: forecast.predictedShortage
  };
  memoryDb.forecasts.push(newForecast);
  return newForecast;
};

export const memGetForecasts = () => {
  return memoryDb.forecasts;
};

export const memCreateLpgBooking = (booking) => {
  const newBooking = {
    _id: `mem-lpg-${Date.now()}`,
    userId: booking.userId,
    distributorName: booking.distributorName,
    weight: booking.weight,
    cost: booking.cost,
    status: 'Ordered',
    otpCode: booking.otpCode,
    createdAt: new Date().toISOString()
  };
  memoryDb.lpgBookings.push(newBooking);
  return newBooking;
};

export const memGetLpgBookings = (userId = null) => {
  if (userId) {
    return memoryDb.lpgBookings.filter(b => b.userId === userId);
  }
  return memoryDb.lpgBookings;
};

export const memUpdateLpgBookingStatus = (id, status) => {
  const booking = memoryDb.lpgBookings.find(b => b._id === id);
  if (booking) {
    booking.status = status;
  }
  return booking;
};

export const memVerifyLpgBookingOtp = (id, otpCode) => {
  const booking = memoryDb.lpgBookings.find(b => b._id === id);
  if (booking && booking.otpCode === otpCode) {
    booking.status = 'Delivered';
    booking.deliveredAt = new Date().toISOString();
    return { success: true, booking };
  }
  return { success: false };
};
