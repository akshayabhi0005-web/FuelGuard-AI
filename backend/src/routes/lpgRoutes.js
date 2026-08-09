import express from 'express';
import {
  getLpgInventory,
  createLpgInventoryNode,
  updateLpgInventory,
  createLpgBooking,
  getBookings,
  updateBookingStatus
} from '../controllers/lpgController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/inventory', protect, getLpgInventory);
router.post('/inventory', protect, authorize('admin'), createLpgInventoryNode);
router.put('/inventory/:id', protect, authorize('distributor', 'admin'), updateLpgInventory);
router.post('/booking', protect, createLpgBooking);
router.get('/booking', protect, authorize('distributor', 'admin'), getBookings);
router.put('/booking/:id', protect, authorize('distributor', 'admin'), updateBookingStatus);

export default router;
