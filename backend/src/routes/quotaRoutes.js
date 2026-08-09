import express from 'express';
import { getQuotaByUserId, createQuotaWallet, updateQuotaWallet } from '../controllers/quotaController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/user/:userId', protect, getQuotaByUserId);
router.post('/', protect, authorize('admin'), createQuotaWallet);
router.put('/:id', protect, authorize('pump', 'admin'), updateQuotaWallet);

export default router;
