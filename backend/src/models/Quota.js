import mongoose from 'mongoose';

const quotaSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID reference is required'],
    index: true
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    index: true
  },
  normalLimit: {
    type: Number,
    required: [true, 'Normal quota limit is required'],
    min: [0, 'Quota limit cannot be negative']
  },
  emergencyLimit: {
    type: Number,
    required: [true, 'Emergency quota limit is required'],
    min: [0, 'Quota limit cannot be negative']
  },
  remainingQuota: {
    type: Number,
    required: [true, 'Remaining quota wallet amount is required'],
    min: [0, 'Remaining quota cannot be negative']
  }
}, {
  timestamps: true
});

const Quota = mongoose.model('Quota', quotaSchema);
export default Quota;
