import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  vehicleNumber: {
    type: String,
    required: [true, 'Vehicle number is required'],
    unique: true,
    uppercase: true,
    trim: true,
    index: true,
    validate: {
      validator: function(v) {
        // Basic uppercase checker
        return v === v.toUpperCase();
      },
      message: 'Vehicle number must be strictly uppercase'
    }
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner ID reference is required']
  },
  vehicleType: {
    type: String,
    required: [true, 'Vehicle type is required'],
    enum: ['Car', 'Motorbike', 'Three-Wheeler', 'Bus', 'Ambulance', 'Police', 'Fire']
  },
  chassisNumber: {
    type: String,
    required: [true, 'Chassis number is required'],
    unique: true,
    trim: true
  },
  fuelType: {
    type: String,
    required: [true, 'Fuel type is required'],
    enum: ['Petrol 92 Octane', 'Petrol 95 Octane', 'Auto Diesel', 'Super Diesel']
  }
}, {
  timestamps: true
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);
export default Vehicle;
