import mongoose from 'mongoose';
import Quota from '../models/Quota.js';
import User from '../models/User.js';
import { isDbConnected, memFindUserByEmail, memFindUserById, memGetQuotaByUserId, memoryDb } from '../services/memoryDb.js';

export const getQuotaByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!isDbConnected) {
      let matchedUser = memFindUserById(userId);
      if (!matchedUser) {
        matchedUser = memFindUserByEmail(userId);
      }
      const dbUserId = matchedUser ? matchedUser._id : 'mem-user-citizen';
      const quota = memGetQuotaByUserId(dbUserId);

      // Populate mock vehicle
      quota.vehicleId = memoryDb.vehicles[0] || null;

      return res.status(200).json({
        success: true,
        quota
      });
    }

    let dbUserId = userId;
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

    const quota = await Quota.findOne({ userId: dbUserId }).populate('vehicleId');
    if (!quota) {
      return res.status(404).json({ success: false, message: 'Quota wallet not initialized' });
    }
    res.status(200).json({
      success: true,
      quota
    });
  } catch (err) {
    next(err);
  }
};

export const createQuotaWallet = async (req, res, next) => {
  try {
    const { userId, vehicleId, normalLimit, emergencyLimit, remainingQuota } = req.body;

    if (!isDbConnected) {
      let matchedUser = memFindUserById(userId);
      if (!matchedUser) {
        matchedUser = memFindUserByEmail(userId);
      }
      const dbUserId = matchedUser ? matchedUser._id : 'mem-user-citizen';
      memoryDb.quotas[dbUserId] = {
        userId: dbUserId,
        vehicleId,
        normalLimit,
        emergencyLimit,
        remainingQuota
      };
      return res.status(201).json({
        success: true,
        quota: memoryDb.quotas[dbUserId]
      });
    }

    let dbUserId = userId;
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

    const quota = await Quota.create({
      userId: dbUserId,
      vehicleId,
      normalLimit,
      emergencyLimit,
      remainingQuota
    });
    res.status(201).json({
      success: true,
      quota
    });
  } catch (err) {
    next(err);
  }
};

export const updateQuotaWallet = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { remainingQuota } = req.body;

    if (!isDbConnected) {
      const quota = memoryDb.quotas[id] || Object.values(memoryDb.quotas).find(q => q.userId === id);
      if (!quota) {
        return res.status(404).json({ success: false, message: 'Quota wallet not found' });
      }
      quota.remainingQuota = remainingQuota;
      return res.status(200).json({
        success: true,
        quota
      });
    }

    const quota = await Quota.findByIdAndUpdate(
      id,
      { remainingQuota },
      { new: true, runValidators: true }
    );
    if (!quota) {
      return res.status(404).json({ success: false, message: 'Quota wallet not found' });
    }
    res.status(200).json({
      success: true,
      quota
    });
  } catch (err) {
    next(err);
  }
};
