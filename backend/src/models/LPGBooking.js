import mongoose from 'mongoose';

const lpgBookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID reference is required'],
    index: true
  },
  distributorName: {
    type: String,
    required: [true, 'Distributor name is required'],
    trim: true
  },
  weight: {
    type: String,
    required: [true, 'Cylinder weight type is required'],
    enum: ['5.0kg', '12.5kg']
  },
  cost: {
    type: Number,
    required: [true, 'Booking cost is required'],
    min: [0, 'Cost cannot be negative']
  },
  status: {
    type: String,
    enum: ['Ordered', 'Dispatched', 'In Transit', 'Delivered'],
    default: 'Ordered'
  },
  otpCode: {
    type: String,
    required: [true, 'OTP verification code is required'],
    trim: true
  },
  deliveredAt: {
    type: Date
  }
}, {
  timestamps: true
});

const LPGBooking = mongoose.model('LPGBooking', lpgBookingSchema);
export default LPGBooking;
