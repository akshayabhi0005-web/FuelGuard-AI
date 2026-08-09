import mongoose from 'mongoose';

const forecastSchema = new mongoose.Schema({
  stationName: {
    type: String,
    required: [true, 'Station/Location name is required'],
    index: true,
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Forecast reference date is required']
  },
  expectedDemand: {
    type: Number,
    required: [true, 'Expected demand value is required'],
    min: [0, 'Demand cannot be negative']
  },
  predictedShortage: {
    type: Number,
    required: [true, 'Predicted shortage deficit is required'],
    min: [0, 'Shortage cannot be negative']
  }
}, {
  timestamps: true
});

const Forecast = mongoose.model('Forecast', forecastSchema);
export default Forecast;
