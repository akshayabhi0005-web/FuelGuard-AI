import mongoose from 'mongoose';
import Quota from '../models/Quota.js';
import User from '../models/User.js';

export const getQuotaByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;
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
