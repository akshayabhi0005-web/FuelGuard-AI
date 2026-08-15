import express from 'express';
import { getQuotaByUserId, createQuotaWallet, updateQuotaWallet } from '../controllers/quotaController.js';
import { verifyQuotaToken } from '../controllers/transactionController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/user/:userId', protect, getQuotaByUserId);
router.post('/', protect, authorize('admin'), createQuotaWallet);
router.put('/:id', protect, authorize('pump', 'admin'), updateQuotaWallet);
router.post('/verify-token', protect, authorize('pump', 'admin'), verifyQuotaToken);

export default router;
