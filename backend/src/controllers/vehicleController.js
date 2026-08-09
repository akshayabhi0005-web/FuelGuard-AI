import Vehicle from '../models/Vehicle.js';

export const registerVehicle = async (req, res, next) => {
  try {
    const { vehicleNumber, ownerId, vehicleType, chassisNumber, fuelType } = req.body;

    const vehicleExists = await Vehicle.findOne({ vehicleNumber: vehicleNumber.toUpperCase() });
    if (vehicleExists) {
      return res.status(400).json({ success: false, message: 'Vehicle number already registered' });
    }

    const vehicle = await Vehicle.create({
      vehicleNumber,
      ownerId,
      vehicleType,
      chassisNumber,
      fuelType
    });

    res.status(201).json({
      success: true,
      vehicle
    });
  } catch (err) {
    next(err);
  }
};

export const getVehicleByPlate = async (req, res, next) => {
  try {
    const { plate } = req.params;
    const vehicle = await Vehicle.findOne({ vehicleNumber: plate.toUpperCase() }).populate('ownerId', 'fullName email');
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle profile not found' });
    }

    res.status(200).json({
      success: true,
      vehicle
    });
  } catch (err) {
    next(err);
  }
};
