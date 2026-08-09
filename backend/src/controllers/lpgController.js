import mongoose from 'mongoose';
import LPGInventory from '../models/LPGInventory.js';
import LPGBooking from '../models/LPGBooking.js';
import User from '../models/User.js';

export const getLpgInventory = async (req, res, next) => {
  try {
    const inventory = await LPGInventory.find({});
    res.status(200).json({
      success: true,
      inventory
    });
  } catch (err) {
    next(err);
  }
};

export const createLpgInventoryNode = async (req, res, next) => {
  try {
    const { distributorName, district, stock, reserved, status } = req.body;
    const node = await LPGInventory.create({
      distributorName,
      district,
      stock,
      reserved,
      status
    });
    res.status(201).json({
      success: true,
      node
    });
  } catch (err) {
    next(err);
  }
};

export const updateLpgInventory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stock, reserved, status } = req.body;
    const node = await LPGInventory.findByIdAndUpdate(
      id,
      { stock, reserved, status },
      { new: true, runValidators: true }
    );
    if (!node) {
      return res.status(404).json({ success: false, message: 'Distributor node not found' });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('lpg_inventory_update', node);
    }

    res.status(200).json({
      success: true,
      node
    });
  } catch (err) {
    next(err);
  }
};

export const createLpgBooking = async (req, res, next) => {
  try {
    const { userId, distributorName, weight, cost } = req.body;

    let dbUserId = userId;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      const matchedUser = await User.findOne({ email: userId || 'citizen@lpg.com' });
      if (matchedUser) {
        dbUserId = matchedUser._id;
      } else {
        const defaultUser = await User.findOneAndUpdate(
          { email: 'citizen@lpg.com' },
          { email: 'citizen@lpg.com', passwordHash: 'password123', role: 'citizen', fullName: 'Jane Doe' },
          { new: true, upsert: true }
        );
        dbUserId = defaultUser._id;
      }
    }

    // Check safety interval: last delivery must be > 21 days ago
    const lastDeliveredBooking = await LPGBooking.findOne({
      userId: dbUserId,
      status: 'Delivered'
    }).sort({ updatedAt: -1 });

    if (lastDeliveredBooking) {
      const daysSinceLast = (Date.now() - new Date(lastDeliveredBooking.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLast < 21) {
        const remainingDays = Math.ceil(21 - daysSinceLast);
        return res.status(400).json({
          success: false,
          message: `Booking locked. Safety interval requires ${remainingDays} more days before booking again.`
        });
      }
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    const booking = await LPGBooking.create({
      userId: dbUserId,
      distributorName,
      weight,
      cost,
      status: 'Ordered',
      otpCode
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('booking_new', booking);
    }

    res.status(201).json({
      success: true,
      booking
    });
  } catch (err) {
    next(err);
  }
};

export const getBookings = async (req, res, next) => {
  try {
    const bookings = await LPGBooking.find({}).populate('userId', 'fullName email');
    res.status(200).json({
      success: true,
      bookings
    });
  } catch (err) {
    next(err);
  }
};

export const updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, code } = req.body;

    const booking = await LPGBooking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // If advancing to Delivered, check OTP code
    if (status === 'Delivered') {
      if (booking.otpCode !== code) {
        return res.status(400).json({ success: false, message: 'Invalid handoff verification OTP' });
      }
      booking.deliveredAt = new Date();
    }

    booking.status = status;
    await booking.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('booking_update', booking);
    }

    res.status(200).json({
      success: true,
      booking
    });
  } catch (err) {
    next(err);
  }
};
