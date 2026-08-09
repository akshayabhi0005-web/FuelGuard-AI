import mongoose from 'mongoose';

const fuelInventorySchema = new mongoose.Schema({
  stationName: {
    type: String,
    required: [true, 'Station name is required'],
    unique: true,
    trim: true
  },
  district: {
    type: String,
    required: [true, 'District is required'],
    trim: true
  },
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  reserved: {
    type: Number,
    default: 0,
    min: [0, 'Reserved stock cannot be negative']
  },
  status: {
    type: String,
    required: [true, 'Operational status is required'],
    enum: ['In Stock', 'Low Stock', 'Suspended'],
    default: 'In Stock'
  }
}, {
  timestamps: true
});

const FuelInventory = mongoose.model('FuelInventory', fuelInventorySchema);
export default FuelInventory;
