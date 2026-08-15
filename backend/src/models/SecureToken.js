import mongoose from 'mongoose';

const secureTokenSchema = new mongoose.Schema({
  tokenHash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vehicleNumber: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  used: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Auto-delete document after expiration
secureTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const SecureToken = mongoose.model('SecureToken', secureTokenSchema);
export default SecureToken;
