import Vehicle from '../models/Vehicle.js';
import { isDbConnected, memFindVehicleByPlate, memCreateVehicle } from '../services/memoryDb.js';

export const registerVehicle = async (req, res, next) => {
  try {
    const { vehicleNumber, ownerId, vehicleType, chassisNumber, fuelType } = req.body;

    if (!isDbConnected) {
      const vehicleExists = memFindVehicleByPlate(vehicleNumber);
      if (vehicleExists) {
        return res.status(400).json({ success: false, message: 'Vehicle number already registered' });
      }

      const vehicle = memCreateVehicle({
        vehicleNumber,
        ownerId,
        vehicleType,
        chassisNumber,
        fuelType
      });

      return res.status(201).json({
        success: true,
        vehicle
      });
    }

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

    if (!isDbConnected) {
      const vehicle = memFindVehicleByPlate(plate);
      if (!vehicle) {
        return res.status(404).json({ success: false, message: 'Vehicle profile not found' });
      }
      return res.status(200).json({
        success: true,
        vehicle
      });
    }

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
