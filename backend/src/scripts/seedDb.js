import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
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

const defaultStations = [
  { name: 'Ceypetco - Town Hall', district: 'Colombo', stock: 12400, reserved: 500, status: 'In Stock' },
  { name: 'LIOC - Gampaha', district: 'Gampaha', stock: 18200, reserved: 800, status: 'In Stock' },
  { name: 'Sinopec - Kandy', district: 'Kandy', stock: 4100, reserved: 200, status: 'Low Stock' }
];

const defaultDistributors = [
  { name: 'Gas Point Corp - Galle', district: 'Galle', stock: 205, reserved: 15, status: 'In Stock' },
  { name: 'Super Gas Distributors - Colombo', district: 'Colombo', stock: 140, reserved: 10, status: 'In Stock' },
  { name: 'Lanka Gas Dealers - Kandy', district: 'Kandy', stock: 0, reserved: 0, status: 'Suspended' }
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Seeding database...');

    // Clear existing collections
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await FuelInventory.deleteMany({});
    await LPGInventory.deleteMany({});
    await Transaction.deleteMany({});
    await Quota.deleteMany({});
    await LPGBooking.deleteMany({});
    await EmergencySettings.deleteMany({});
    await FraudLog.deleteMany({});
    await Forecast.deleteMany({});

    // 1. Create Users
    const salt = await bcrypt.genSalt(10);
    const passHash = await bcrypt.hash('password123', salt);
    const adminPassHash = await bcrypt.hash('admin123', salt);
    const pumpPassHash = await bcrypt.hash('pump123', salt);
    const distPassHash = await bcrypt.hash('distributor123', salt);

    const adminUser = await User.create({ email: 'admin@fuelguard.gov', passwordHash: adminPassHash, role: 'admin', fullName: 'Gov Administrator' });
    const pumpUser = await User.create({ email: 'pump@ceypetco.com', passwordHash: pumpPassHash, role: 'pump', fullName: 'Ceypetco Pump Operator' });
    const distUser = await User.create({ email: 'distributor@supergas.com', passwordHash: distPassHash, role: 'distributor', fullName: 'Super Gas Operator' });
    const citizenUser = await User.create({ email: 'citizen@fuel.com', passwordHash: passHash, role: 'citizen', fullName: 'Fuel Citizen' });
    const lpgCitizenUser = await User.create({ email: 'citizen@lpg.com', passwordHash: passHash, role: 'citizen', fullName: 'LPG Citizen' });

    console.log('Seeded Users.');

    // 2. Create Vehicles
    const veh1 = await Vehicle.create({
      vehicleNumber: 'WP-CAD-8930',
      ownerId: citizenUser._id,
      vehicleType: 'Car',
      chassisNumber: 'CHASSIS-WP-CAD-8930-1002',
      fuelType: 'Petrol 92 Octane'
    });
    console.log('Seeded Vehicles.');

    // 3. Create Fuel Inventory Nodes
    for (const s of defaultStations) {
      await FuelInventory.create({
        stationName: s.name,
        district: s.district,
        stock: s.stock,
        reserved: s.reserved,
        status: s.status
      });
    }

    // 4. Create LPG Inventory Nodes
    for (const d of defaultDistributors) {
      await LPGInventory.create({
        distributorName: d.name,
        district: d.district,
        stock: d.stock,
        reserved: d.reserved,
        status: d.status
      });
    }
    console.log('Seeded Inventories.');

    // 5. Create default Quotas
    await Quota.create({ userId: citizenUser._id, vehicleId: veh1._id, normalLimit: 50, emergencyLimit: 20, remainingQuota: 45.0 });
    await Quota.create({ userId: lpgCitizenUser._id, normalLimit: 50, emergencyLimit: 20, remainingQuota: 50.0 });
    console.log('Seeded Quota Wallets.');

    // 6. Create default Emergency Settings
    await EmergencySettings.create({
      emergencyModeActive: false,
      normalQuotaLimit: 50,
      emergencyQuotaLimit: 20,
      emergencyVehicleQuotaLimit: 100,
      weightEmergency: 0.5,
      weightDemand: 0.3,
      weightStock: 0.2
    });
    console.log('Seeded Emergency Settings.');

    // 7. Seed baseline Fraud Logs
    await FraudLog.create({ type: 'Duplicate QR Attempt', location: 'Ceypetco - Town Hall', details: 'Plate WP-CAD-8930 attempted scan twice within 10 seconds.', riskScore: 92 });
    await FraudLog.create({ type: 'Multiple Station usage', location: 'LIOC - Gampaha', details: 'User registered in Colombo logged fueling in Galle 15 mins later.', riskScore: 88 });
    await FraudLog.create({ type: 'Fake Vehicle Signature', location: 'Sinopec - Kandy', details: 'Chassis signature mismatch detected on vehicle number WP-CAD-8930.', riskScore: 78 });
    console.log('Seeded Fraud Logs.');

    console.log('Database Seeding Complete!');
  } catch (err) {
    console.error('Error seeding DB:', err.message);
  } finally {
    await mongoose.connection.close();
  }
};

seed();
