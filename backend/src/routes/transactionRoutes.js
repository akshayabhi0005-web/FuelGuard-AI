import express from 'express';
import { getTransactions, createTransaction, verifyTransactionToken, generateQrToken } from '../controllers/transactionController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getTransactions);
router.post('/', protect, authorize('pump', 'admin'), createTransaction);
router.post('/verify', protect, authorize('pump', 'admin'), verifyTransactionToken);
router.post('/token', protect, generateQrToken);

export default router;
