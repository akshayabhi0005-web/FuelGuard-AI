import FuelInventory from '../models/FuelInventory.js';
import { isDbConnected, memoryDb } from '../services/memoryDb.js';

export const getInventory = async (req, res, next) => {
  try {
    if (!isDbConnected) {
      return res.status(200).json({
        success: true,
        inventory: memoryDb.fuelInventory
      });
    }

    const inventory = await FuelInventory.find({});
    res.status(200).json({
      success: true,
      inventory
    });
  } catch (err) {
    next(err);
  }
};

export const createInventoryNode = async (req, res, next) => {
  try {
    const { stationName, district, stock, reserved, status } = req.body;

    if (!isDbConnected) {
      const node = {
        _id: `mem-fuel-${Date.now()}`,
        stationName,
        district,
        stock,
        reserved,
        status
      };
      memoryDb.fuelInventory.push(node);
      return res.status(201).json({
        success: true,
        node
      });
    }

    const node = await FuelInventory.create({
      stationName,
      district,
      stock,
      reserved,
      status
    });
    res.status(201).json({
      success: true,
      node
    });
  } catch (err) {
    next(err);
  }
};

export const updateInventory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stock, reserved, status } = req.body;

    if (!isDbConnected) {
      const node = memoryDb.fuelInventory.find(n => n._id === id);
      if (!node) {
        return res.status(404).json({ success: false, message: 'Station node not found' });
      }
      node.stock = stock;
      node.reserved = reserved;
      node.status = status;

      const io = req.app.get('io');
      if (io) {
        io.emit('fuel_inventory_update', node);
      }

      return res.status(200).json({
        success: true,
        node
      });
    }

    const node = await FuelInventory.findByIdAndUpdate(
      id,
      { stock, reserved, status },
      { new: true, runValidators: true }
    );
    if (!node) {
      return res.status(404).json({ success: false, message: 'Station node not found' });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('fuel_inventory_update', node);
    }

    res.status(200).json({
      success: true,
      node
    });
  } catch (err) {
    next(err);
  }
};
