import express from 'express';
import { getInventory, createInventoryNode, updateInventory } from '../controllers/fuelController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/inventory', protect, getInventory);
router.post('/inventory', protect, authorize('admin'), createInventoryNode);
router.put('/inventory/:id', protect, authorize('pump', 'admin'), updateInventory);

export default router;
