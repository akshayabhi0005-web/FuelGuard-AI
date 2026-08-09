import cron from 'node-cron';
import Quota from '../models/Quota.js';

// Reset all user quotas to their normalLimits
export const resetAllQuotas = async () => {
  const result = await Quota.updateMany(
    {},
    [
      {
        $set: {
          remainingQuota: '$normalLimit',
          lastUpdated: new Date()
        }
      }
    ]
  );
  return result;
};

// Initialize cron scheduler task running weekly on Sundays
export const initQuotaScheduler = () => {
  cron.schedule('0 0 * * 0', async () => {
    console.log('⏰ Quota Scheduler: Running weekly quota resets...');
    try {
      const res = await resetAllQuotas();
      console.log(`✅ Quota Scheduler: Successfully reset ${res.modifiedCount} wallets.`);
    } catch (err) {
      console.error('❌ Quota Scheduler failed:', err.message);
    }
  });
  console.log('📅 Quota Scheduler cron job initialized (Weekly on Sunday at 00:00).');
};
