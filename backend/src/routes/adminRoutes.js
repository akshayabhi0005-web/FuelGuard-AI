import express from 'express';
import {
  getSettings,
  updateSettings,
  getFraudLogs,
  createFraudLog,
  resolveFraudLog,
  getForecasts,
  createForecast,
  recalculateForecasts,
  triggerQuotaReset,
  getLedgerStatus,
  tamperLedger,
  getSMSLogs,
  getEvaluationMetrics
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/settings', protect, getSettings);
router.put('/settings', protect, authorize('admin'), updateSettings);
router.get('/fraud', protect, authorize('admin'), getFraudLogs);
router.post('/fraud', createFraudLog);
router.put('/fraud/:id', protect, authorize('admin'), resolveFraudLog);
router.get('/forecasts', protect, authorize('admin'), getForecasts);
router.post('/forecasts', protect, authorize('admin'), createForecast);
router.post('/forecasts/calculate', protect, authorize('admin'), recalculateForecasts);
router.post('/quotas/reset-all', protect, authorize('admin'), triggerQuotaReset);
router.get('/ledger/verify', protect, authorize('admin'), getLedgerStatus);
router.post('/ledger/tamper', protect, authorize('admin'), tamperLedger);
router.get('/sms/logs', protect, authorize('admin'), getSMSLogs);
router.get('/metrics/evaluation', protect, authorize('admin'), getEvaluationMetrics);

export default router;
