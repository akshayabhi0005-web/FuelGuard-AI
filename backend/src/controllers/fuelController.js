import FuelInventory from '../models/FuelInventory.js';

export const getInventory = async (req, res, next) => {
  try {
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
