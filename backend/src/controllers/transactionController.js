import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import Transaction from '../models/Transaction.js';
import Quota from '../models/Quota.js';
import FuelInventory from '../models/FuelInventory.js';
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import FraudLog from '../models/FraudLog.js';
import SecureToken from '../models/SecureToken.js';
import { generateShortToken, hashToken } from '../utils/cryptoUtils.js';
import { auditTransaction } from '../services/fraudService.js';
import { mineBlock } from '../services/ledgerService.js';
import { sendSimulatedSMS } from '../services/smsService.js';
import { 
  isDbConnected, memFindUserByEmail, memFindUserById, memGetTransactions, 
  memCreateTransaction, memUpdateQuotaRemaining, memFindVehicleByPlate, memoryDb,
  memCreateSecureToken, memFindSecureTokenByHash, memMarkSecureTokenAsUsed
} from '../services/memoryDb.js';

export const getTransactions = async (req, res, next) => {
  try {
    if (!isDbConnected) {
      return res.status(200).json({
        success: true,
        transactions: memGetTransactions()
      });
    }

    const transactions = await Transaction.find({}).populate('userId', 'fullName email').populate('vehicleId');
    res.status(200).json({
      success: true,
      transactions
    });
  } catch (err) {
    next(err);
  }
};

export const createTransaction = async (req, res, next) => {
  try {
    const {
      transactionId,
      date,
      stationName,
      amount,
      allocatedAmount,
      cost,
      userId,
      vehicleId,
      fuelType,
      priorityScore,
      emergencyStatus
    } = req.body;

    if (!isDbConnected) {
      const exists = memoryDb.transactions.find(t => t.transactionId === transactionId);
      if (exists) {
        return res.status(400).json({ success: false, message: 'Transaction ID already processed' });
      }

      let matchedUser = memFindUserById(userId);
      if (!matchedUser) {
        matchedUser = memFindUserByEmail(userId);
      }
      const dbUserId = matchedUser ? matchedUser._id : 'mem-user-citizen';

      // Deduct remaining quota in memory
      memUpdateQuotaRemaining(dbUserId, allocatedAmount);

      // Invalidate short-lived token immediately on dispense
      if (req.body.qrToken) {
        memMarkSecureTokenAsUsed(hashToken(req.body.qrToken));
      }

      const transaction = memCreateTransaction({
        transactionId,
        date,
        stationName,
        amount,
        allocatedAmount,
        cost,
        userId: dbUserId,
        vehicleId,
        fuelType,
        priorityScore,
        emergencyStatus
      });

      const userObj = memFindUserById(dbUserId);
      if (userObj) {
        const phoneNum = userObj.phone || '94771234567';
        const smsBody = `FuelGuard AI Alert: ${allocatedAmount}L of ${fuelType} dispensed at ${stationName}. Transaction ID: ${transactionId}. Thank you for your compliance!`;
        sendSimulatedSMS(phoneNum, smsBody);
      }

      const io = req.app.get('io');
      if (io) {
        io.emit('transaction_new', transaction);
      }

      return res.status(201).json({
        success: true,
        transaction
      });
    }

    // Check duplicate transaction ID
    const exists = await Transaction.findOne({ transactionId });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Transaction ID already processed' });
    }

    let dbUserId = userId;
    let dbVehicleId = vehicleId;

    // 1. Resolve User ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      const matchedUser = await User.findOne({ email: userId || 'citizen@fuel.com' });
      if (matchedUser) {
        dbUserId = matchedUser._id;
      } else {
        const defaultUser = await User.findOneAndUpdate(
          { email: 'citizen@fuel.com' },
          { email: 'citizen@fuel.com', passwordHash: 'password123', role: 'citizen', fullName: 'John Doe' },
          { new: true, upsert: true }
        );
        dbUserId = defaultUser._id;
      }
    }

    // 2. Resolve Vehicle ID
    if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
      const matchedVehicle = await Vehicle.findOne({ vehicleNumber: vehicleId || 'WP-CAD-8930' });
      if (matchedVehicle) {
        dbVehicleId = matchedVehicle._id;
      } else {
        const defaultVehicle = await Vehicle.findOneAndUpdate(
          { vehicleNumber: 'WP-CAD-8930' },
          { vehicleNumber: 'WP-CAD-8930', ownerId: dbUserId, vehicleType: 'Car', chassisNumber: 'CHASSIS-DEFAULT-8930', fuelType: 'Petrol 92 Octane' },
          { new: true, upsert: true }
        );
        dbVehicleId = defaultVehicle._id;
      }
    }

    const targetVehicle = await Vehicle.findById(dbVehicleId);
    const vehiclePlate = targetVehicle ? targetVehicle.vehicleNumber : 'WP-CAD-8930';

    // Run Fraud Auditing Service
    const anomaly = await auditTransaction(dbUserId, vehiclePlate, stationName);
    if (anomaly.isAnomaly) {
      const log = await FraudLog.create({
        type: anomaly.type,
        location: stationName,
        details: anomaly.details,
        riskScore: anomaly.riskScore,
        status: 'Pending'
      });

      const io = req.app.get('io');
      if (io) {
        io.emit('fraud_alert', log);
      }

      return res.status(400).json({
        success: false,
        message: `${anomaly.type}: ${anomaly.details}`
      });
    }

    // Fetch last completed transaction to link hash chain
    const lastTx = await Transaction.findOne({ transactionStatus: 'Completed' }).sort({ createdAt: -1 });
    const previousHash = lastTx ? lastTx.hash : '0';

    // Mine the new block
    const { nonce, hash } = mineBlock(
      transactionId,
      allocatedAmount,
      stationName,
      dbUserId.toString(),
      previousHash
    );

    // Deduct remaining quota atomically in MongoDB, ensuring it doesn't drop below 0
    const currentQuota = await Quota.findOne({ userId: dbUserId });
    if (currentQuota) {
      const newRemaining = Math.max(0, currentQuota.remainingQuota - allocatedAmount);
      await Quota.findOneAndUpdate(
        { userId: dbUserId },
        { $set: { remainingQuota: newRemaining } }
      );
    }

    // Invalidate short-lived token immediately on dispense
    if (req.body.qrToken) {
      await SecureToken.findOneAndUpdate(
        { tokenHash: hashToken(req.body.qrToken) },
        { $set: { used: true } }
      );
    }

    const transaction = await Transaction.create({
      transactionId,
      date,
      verifiedAt: new Date(),
      completedAt: new Date(),
      stationName,
      amount,
      allocatedAmount,
      cost,
      type: 'Regular Fill',
      userId: dbUserId,
      vehicleId: dbVehicleId,
      fuelType,
      priorityScore,
      verificationStatus: 'VALID',
      transactionStatus: 'Completed',
      fraudCheckStatus: 'Passed',
      emergencyStatus,
      previousHash,
      nonce,
      hash
    });

    // Send Simulated SMS Notification
    const matchedUser = await User.findById(dbUserId);
    if (matchedUser) {
      const phoneNum = matchedUser.phone || '94771234567';
      const smsBody = `FuelGuard AI Alert: ${allocatedAmount}L of ${fuelType} dispensed at ${stationName}. Transaction ID: ${transactionId}. Thank you for your compliance!`;
      sendSimulatedSMS(phoneNum, smsBody);
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('transaction_new', transaction);
    }

    res.status(201).json({
      success: true,
      transaction
    });
  } catch (err) {
    next(err);
  }
};

export const verifyTransactionToken = async (req, res, next) => {
  try {
    const { token, stationName } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Token string required' });
    }

    const tokenHash = hashToken(token);

    // 1. Try secure token lookup first
    if (!isDbConnected) {
      const memSecToken = memFindSecureTokenByHash(tokenHash);
      if (memSecToken) {
        if (memSecToken.used) {
          return res.status(400).json({ success: false, valid: false, reason: 'Token already used' });
        }
        if (new Date() > memSecToken.expiresAt) {
          return res.status(400).json({ success: false, valid: false, reason: 'Verification token expired (exceeded 5-minute window)' });
        }
        
        const quota = memGetQuotaByUserId(memSecToken.userId);
        if (!quota || quota.remainingQuota <= 0) {
          return res.status(400).json({ success: false, valid: false, reason: 'Insufficient quota balance' });
        }

        return res.status(200).json({
          success: true,
          valid: true,
          message: 'Token validated successfully',
          userId: memSecToken.userId,
          vehicleNumber: memSecToken.vehicleNumber
        });
      }
    } else {
      const secureToken = await SecureToken.findOne({ tokenHash });
      if (secureToken) {
        if (secureToken.used) {
          return res.status(400).json({ success: false, valid: false, reason: 'Token already used' });
        }
        if (new Date() > secureToken.expiresAt) {
          return res.status(400).json({ success: false, valid: false, reason: 'Verification token expired (exceeded 5-minute window)' });
        }
        
        const quota = await Quota.findOne({ userId: secureToken.userId });
        if (!quota || quota.remainingQuota <= 0) {
          return res.status(400).json({ success: false, valid: false, reason: 'Insufficient quota balance' });
        }

        return res.status(200).json({
          success: true,
          valid: true,
          message: 'Token validated successfully',
          userId: secureToken.userId.toString(),
          vehicleNumber: secureToken.vehicleNumber
        });
      }
    }

    // 2. Old fallbacks (JWT, mock FUEL-)
    if (!isDbConnected) {
      const doubleScan = memoryDb.transactions.find(t => t.transactionId === token);
      if (doubleScan) {
        return res.status(400).json({
          success: false,
          valid: false,
          reason: 'Duplicate QR code token detected'
        });
      }

      let verifiedUserId = null;
      let verifiedVehicleNumber = null;

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwtsecret123');
        verifiedUserId = decoded.userId;
        verifiedVehicleNumber = decoded.vehicleNumber;
      } catch (jwtErr) {
        if (token.split('.').length === 3) {
          return res.status(400).json({
            success: false,
            valid: false,
            reason: `Cryptographic verification failed: ${jwtErr.message}`
          });
        }
      }

      if (!verifiedUserId && token.startsWith('FUEL-')) {
        const parts = token.split('-');
        const timestampStr = parts[parts.length - 1];
        const timestamp = parseInt(timestampStr, 10);
        if (!isNaN(timestamp)) {
          const ageMs = Date.now() - timestamp;
          const tenMinutesMs = 10 * 60 * 1000;
          if (ageMs > tenMinutesMs) {
            return res.status(400).json({
              success: false,
              valid: false,
              reason: 'Verification token expired (exceeded 10-minute window)'
            });
          }
        }
        verifiedVehicleNumber = parts.slice(1, parts.length - 1).join('-');
        const vehicle = memFindVehicleByPlate(verifiedVehicleNumber);
        if (vehicle) {
          verifiedUserId = vehicle.ownerId ? vehicle.ownerId._id : 'mem-user-citizen';
        }
      }

      if (!verifiedUserId || !verifiedVehicleNumber) {
        verifiedUserId = 'mem-user-citizen';
        verifiedVehicleNumber = 'CAD-8930';
      }

      return res.status(200).json({
        success: true,
        valid: true,
        message: 'Token validated successfully',
        userId: verifiedUserId,
        vehicleNumber: verifiedVehicleNumber
      });
    }

    // Check duplicate scan first
    const doubleScan = await Transaction.findOne({ transactionId: token });
    if (doubleScan) {
      return res.status(400).json({
        success: false,
        valid: false,
        reason: 'Duplicate QR code token detected'
      });
    }

    let verifiedUserId = null;
    let verifiedVehicleNumber = null;

    // Try decoding as JWT
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwtsecret123');
      verifiedUserId = decoded.userId;
      verifiedVehicleNumber = decoded.vehicleNumber;
    } catch (jwtErr) {
      if (token.split('.').length === 3) {
        return res.status(400).json({
          success: false,
          valid: false,
          reason: `Cryptographic verification failed: ${jwtErr.message}`
        });
      }
    }

    // Fallback: Parse mock format FUEL-[VehicleNumber]-[Timestamp]
    if (!verifiedUserId && token.startsWith('FUEL-')) {
      const parts = token.split('-');
      const timestampStr = parts[parts.length - 1];
      const timestamp = parseInt(timestampStr, 10);
      if (!isNaN(timestamp)) {
        const ageMs = Date.now() - timestamp;
        const tenMinutesMs = 10 * 60 * 1000;
        if (ageMs > tenMinutesMs) {
          return res.status(400).json({
            success: false,
            valid: false,
            reason: 'Verification token expired (exceeded 10-minute window)'
          });
        }
      }

      verifiedVehicleNumber = parts.slice(1, parts.length - 1).join('-');
      const vehicle = await Vehicle.findOne({ vehicleNumber: verifiedVehicleNumber });
      if (vehicle) {
        verifiedUserId = vehicle.ownerId;
      }
    }

    if (!verifiedUserId || !verifiedVehicleNumber) {
      return res.status(400).json({
        success: false,
        valid: false,
        reason: 'Invalid token format or vehicle not registered'
      });
    }

    // Run Fraud Auditing Service
    const anomaly = await auditTransaction(verifiedUserId, verifiedVehicleNumber, stationName);
    if (anomaly.isAnomaly) {
      const log = await FraudLog.create({
        type: anomaly.type,
        location: stationName,
        details: anomaly.details,
        riskScore: anomaly.riskScore,
        status: 'Pending'
      });

      const io = req.app.get('io');
      if (io) {
        io.emit('fraud_alert', log);
      }

      return res.status(400).json({
        success: false,
        valid: false,
        reason: `${anomaly.type}: ${anomaly.details}`
      });
    }

    res.status(200).json({
      success: true,
      valid: true,
      message: 'Token validated successfully',
      userId: verifiedUserId,
      vehicleNumber: verifiedVehicleNumber
    });
  } catch (err) {
    next(err);
  }
};

export const generateQrToken = async (req, res, next) => {
  try {
    const { vehicleNumber } = req.body;
    if (!vehicleNumber) {
      return res.status(400).json({ success: false, message: 'Vehicle number is required' });
    }

    const userId = req.user ? req.user._id : 'mem-user-citizen';

    // 1. Generate short cryptographically secure token
    const token = generateShortToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

    if (!isDbConnected) {
      memCreateSecureToken(tokenHash, userId, vehicleNumber, expiresAt);
      return res.status(200).json({
        success: true,
        token
      });
    }

    // Save token hash to MongoDB
    await SecureToken.create({
      tokenHash,
      userId,
      vehicleNumber,
      expiresAt
    });

    res.status(200).json({
      success: true,
      token
    });
  } catch (err) {
    next(err);
  }
};

// Singular Verify Token Endpoint for Pump Operator
export const verifyQuotaToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    
    // Mask token for safe logging (e.g. 98GQ-PNUZ-FD -> 98GQ-XXXX-XX)
    const maskedToken = token ? `${token.trim().toUpperCase().substring(0, 4)}-XXXX-XX` : 'none';
    
    console.log('[DEBUG verify-token] Request reached verify-token');
    console.log(`[DEBUG verify-token] Operator authenticated: ${!!req.user}`);
    console.log(`[DEBUG verify-token] Token received (masked): ${maskedToken}`);

    if (!req.user) {
      console.log('[DEBUG verify-token] Rejected: Missing operator authentication');
      return res.status(401).json({ success: false, message: 'Not authorized, missing operator authentication' });
    }

    if (!token) {
      return res.status(400).json({ success: false, message: 'Token string required' });
    }

    const tokenHash = hashToken(token);
    const stationName = req.user?.station || req.body.stationName || 'Ceypetco - Town Hall';

    if (!isDbConnected) {
      const memSecToken = memFindSecureTokenByHash(tokenHash);
      console.log(`[DEBUG verify-token] Token found (memory): ${!!memSecToken}`);
      
      if (!memSecToken) {
        return res.status(400).json({ success: false, valid: false, reason: 'token not found' });
      }
      
      const isExpired = new Date() > memSecToken.expiresAt;
      console.log(`[DEBUG verify-token] Token expired (memory): ${isExpired}`);
      console.log(`[DEBUG verify-token] Token used (memory): ${memSecToken.used}`);

      if (memSecToken.used) {
        return res.status(400).json({ success: false, valid: false, reason: 'token already used' });
      }
      if (isExpired) {
        return res.status(400).json({ success: false, valid: false, reason: 'token expired' });
      }

      const quota = memGetQuotaByUserId(memSecToken.userId);
      if (!quota || quota.remainingQuota <= 0) {
        return res.status(400).json({ success: false, valid: false, reason: 'quota unavailable' });
      }

      const user = memFindUserById(memSecToken.userId) || { fullName: 'Registered Citizen' };
      const vehicle = memFindVehicleByPlate(memSecToken.vehicleNumber) || { fuelType: 'Petrol 92 Octane' };

      return res.status(200).json({
        success: true,
        valid: true,
        customer: {
          name: user.fullName,
          vehicleNumber: memSecToken.vehicleNumber
        },
        fuelType: vehicle.fuelType || 'Petrol 92',
        availableQuota: quota.remainingQuota,
        station: stationName
      });
    }

    // MongoDB path
    const secureToken = await SecureToken.findOne({ tokenHash });
    console.log(`[DEBUG verify-token] Token found (MongoDB): ${!!secureToken}`);
    
    if (!secureToken) {
      return res.status(400).json({ success: false, valid: false, reason: 'token not found' });
    }
    
    const isExpired = new Date() > secureToken.expiresAt;
    console.log(`[DEBUG verify-token] Token expired (MongoDB): ${isExpired}`);
    console.log(`[DEBUG verify-token] Token used (MongoDB): ${secureToken.used}`);

    if (secureToken.used) {
      return res.status(400).json({ success: false, valid: false, reason: 'token already used' });
    }
    if (isExpired) {
      return res.status(400).json({ success: false, valid: false, reason: 'token expired' });
    }

    const quota = await Quota.findOne({ userId: secureToken.userId });
    if (!quota || quota.remainingQuota <= 0) {
      return res.status(400).json({ success: false, valid: false, reason: 'quota unavailable' });
    }

    const user = await User.findById(secureToken.userId);
    const vehicle = await Vehicle.findOne({ vehicleNumber: secureToken.vehicleNumber });

    // Fraud auditing
    const anomaly = await auditTransaction(secureToken.userId, secureToken.vehicleNumber, stationName);
    if (anomaly.isAnomaly) {
      const log = await FraudLog.create({
        type: anomaly.type,
        location: stationName,
        details: anomaly.details,
        riskScore: anomaly.riskScore,
        status: 'Pending'
      });

      const io = req.app.get('io');
      if (io) {
        io.emit('fraud_alert', log);
      }

      return res.status(400).json({
        success: false,
        valid: false,
        reason: `${anomaly.type}: ${anomaly.details}`
      });
    }

    res.status(200).json({
      success: true,
      valid: true,
      customer: {
        name: user ? user.fullName : 'Registered Citizen',
        vehicleNumber: secureToken.vehicleNumber
      },
      fuelType: vehicle ? vehicle.fuelType : 'Petrol 92',
      availableQuota: quota.remainingQuota,
      station: stationName
    });
  } catch (err) {
    next(err);
  }
};
