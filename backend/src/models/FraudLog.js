import mongoose from 'mongoose';

const fraudLogSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Fraud log type is required'],
    trim: true
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  location: {
    type: String,
    required: [true, 'Location/Station is required'],
    trim: true
  },
  details: {
    type: String,
    required: [true, 'Fraud case details are required'],
    trim: true
  },
  riskScore: {
    type: Number,
    required: [true, 'Risk score percentage is required'],
    min: [0, 'Risk score cannot be less than 0'],
    max: [100, 'Risk score cannot exceed 100']
  },
  status: {
    type: String,
    enum: ['Pending', 'Resolved'],
    default: 'Pending',
    required: true
  }
}, {
  timestamps: true
});

const FraudLog = mongoose.model('FraudLog', fraudLogSchema);
export default FraudLog;
