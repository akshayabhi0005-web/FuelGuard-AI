import mongoose from 'mongoose';

const emergencySettingsSchema = new mongoose.Schema({
  emergencyModeActive: {
    type: Boolean,
    default: false,
    required: true
  },
  normalQuotaLimit: {
    type: Number,
    required: [true, 'Normal quota limit config is required'],
    min: [0, 'Limit cannot be negative']
  },
  emergencyQuotaLimit: {
    type: Number,
    required: [true, 'Emergency quota limit config is required'],
    min: [0, 'Limit cannot be negative']
  },
  emergencyVehicleQuotaLimit: {
    type: Number,
    required: [true, 'Emergency vehicle quota limit config is required'],
    min: [0, 'Limit cannot be negative']
  },
  weightEmergency: {
    type: Number,
    default: 5,
    required: true
  },
  weightDemand: {
    type: Number,
    default: 3,
    required: true
  },
  weightStock: {
    type: Number,
    default: 2,
    required: true
  }
}, {
  timestamps: true
});

const EmergencySettings = mongoose.model('EmergencySettings', emergencySettingsSchema);
export default EmergencySettings;
