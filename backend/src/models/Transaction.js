import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: [true, 'Transaction ID is required'],
    unique: true,
    index: true,
    trim: true
  },
  date: {
    type: String,
    required: [true, 'Date string is required'],
    index: true,
    trim: true
  },
  verifiedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  stationName: {
    type: String,
    required: [true, 'Station/Location name is required'],
    index: true,
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Requested quantity is required'],
    min: [0, 'Amount cannot be negative']
  },
  allocatedAmount: {
    type: Number,
    required: [true, 'Allocated quantity is required'],
    min: [0, 'Allocated amount cannot be negative']
  },
  cost: {
    type: Number,
    required: [true, 'Cost amount is required'],
    min: [0, 'Cost cannot be negative']
  },
  type: {
    type: String,
    default: 'Regular Fill',
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID reference is required'],
    index: true
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },
  fuelType: {
    type: String,
    required: [true, 'Fuel/LPG type is required'],
    trim: true
  },
  priorityScore: {
    type: Number,
    default: 0
  },
  verificationStatus: {
    type: String,
    enum: ['VALID', 'INVALID', 'EXPIRED'],
    default: 'VALID'
  },
  transactionStatus: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed'],
    default: 'Completed'
  },
  fraudCheckStatus: {
    type: String,
    enum: ['Passed', 'Flagged'],
    default: 'Passed'
  },
  emergencyStatus: {
    type: String,
    enum: ['NORMAL', 'ACTIVE'],
    required: [true, 'Emergency status state is required'],
    default: 'NORMAL'
  },
  previousHash: {
    type: String,
    default: '0'
  },
  nonce: {
    type: Number,
    default: 0
  },
  hash: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
