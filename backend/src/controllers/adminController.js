import EmergencySettings from '../models/EmergencySettings.js';
import FraudLog from '../models/FraudLog.js';
import Forecast from '../models/Forecast.js';

export const getSettings = async (req, res, next) => {
  try {
    let settings = await EmergencySettings.findOne({});
    if (!settings) {
      // Create default settings if none exists
      settings = await EmergencySettings.create({
        emergencyModeActive: false,
        normalQuotaLimit: 50,
        emergencyQuotaLimit: 20,
        emergencyVehicleQuotaLimit: 150
      });
    }
    res.status(200).json({
      success: true,
      settings
    });
  } catch (err) {
    next(err);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const { emergencyModeActive, normalQuotaLimit, emergencyQuotaLimit, emergencyVehicleQuotaLimit, weightEmergency, weightDemand, weightStock } = req.body;
    let settings = await EmergencySettings.findOne({});
    if (!settings) {
      settings = new EmergencySettings({});
    }

    settings.emergencyModeActive = emergencyModeActive !== undefined ? emergencyModeActive : settings.emergencyModeActive;
    settings.normalQuotaLimit = normalQuotaLimit !== undefined ? normalQuotaLimit : settings.normalQuotaLimit;
    settings.emergencyQuotaLimit = emergencyQuotaLimit !== undefined ? emergencyQuotaLimit : settings.emergencyQuotaLimit;
    settings.emergencyVehicleQuotaLimit = emergencyVehicleQuotaLimit !== undefined ? emergencyVehicleQuotaLimit : settings.emergencyVehicleQuotaLimit;
    settings.weightEmergency = weightEmergency !== undefined ? weightEmergency : settings.weightEmergency;
    settings.weightDemand = weightDemand !== undefined ? weightDemand : settings.weightDemand;
    settings.weightStock = weightStock !== undefined ? weightStock : settings.weightStock;

    await settings.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('settings_update', settings);
    }

    res.status(200).json({
      success: true,
      settings
    });
  } catch (err) {
    next(err);
  }
};

export const getFraudLogs = async (req, res, next) => {
  try {
    const logs = await FraudLog.find({}).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      logs
    });
  } catch (err) {
    next(err);
  }
};

export const createFraudLog = async (req, res, next) => {
  try {
    const { type, location, details, riskScore } = req.body;
    const log = await FraudLog.create({
      type,
      location,
      details,
      riskScore,
      status: 'Pending'
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('fraud_alert', log);
    }

    res.status(201).json({
      success: true,
      log
    });
  } catch (err) {
    next(err);
  }
};

export const resolveFraudLog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const log = await FraudLog.findByIdAndUpdate(
      id,
      { status: 'Resolved' },
      { new: true, runValidators: true }
    );
    if (!log) {
      return res.status(404).json({ success: false, message: 'Fraud log entry not found' });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('fraud_update', log);
    }

    res.status(200).json({
      success: true,
      log
    });
  } catch (err) {
    next(err);
  }
};

export const getForecasts = async (req, res, next) => {
  try {
    const forecasts = await Forecast.find({}).sort({ date: -1 });
    res.status(200).json({
      success: true,
      forecasts
    });
  } catch (err) {
    next(err);
  }
};

export const createForecast = async (req, res, next) => {
  try {
    const { stationName, date, expectedDemand, predictedShortage } = req.body;
    const forecast = await Forecast.create({
      stationName,
      date,
      expectedDemand,
      predictedShortage
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('forecast_update', forecast);
    }

    res.status(201).json({
      success: true,
      forecast
    });
  } catch (err) {
    next(err);
  }
};

import { calculateStationForecasts } from '../services/forecastService.js';
import { resetAllQuotas } from '../services/quotaScheduler.js';

export const recalculateForecasts = async (req, res, next) => {
  try {
    const forecasts = await calculateStationForecasts();
    const io = req.app.get('io');
    if (io) {
      io.emit('forecasts_recalculated', forecasts);
    }
    res.status(200).json({
      success: true,
      forecasts
    });
  } catch (err) {
    next(err);
  }
};

export const triggerQuotaReset = async (req, res, next) => {
  try {
    const result = await resetAllQuotas();
    const io = req.app.get('io');
    if (io) {
      io.emit('quota_reset', { resetAt: new Date() });
    }
    res.status(200).json({
      success: true,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    next(err);
  }
};

import { verifyLedgerIntegrity } from '../services/ledgerService.js';
import { getSimulatedSMSLogs } from '../services/smsService.js';
import Transaction from '../models/Transaction.js';

export const getLedgerStatus = async (req, res, next) => {
  try {
    const result = await verifyLedgerIntegrity();
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    next(err);
  }
};

export const tamperLedger = async (req, res, next) => {
  try {
    const lastTx = await Transaction.findOne({ transactionStatus: 'Completed' }).sort({ createdAt: -1 });
    if (!lastTx) {
      return res.status(404).json({ success: false, message: 'No completed transactions available to tamper.' });
    }

    // Bypass normal schema calculations and updates
    lastTx.allocatedAmount = (lastTx.allocatedAmount || 10) + 15;
    await lastTx.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('ledger_tampered', { transactionId: lastTx.transactionId });
    }

    res.status(200).json({
      success: true,
      tamperedTransactionId: lastTx.transactionId
    });
  } catch (err) {
    next(err);
  }
};

export const getSMSLogs = async (req, res, next) => {
  try {
    const logs = getSimulatedSMSLogs();
    res.status(200).json({
      success: true,
      logs
    });
  } catch (err) {
    next(err);
  }
};

import { computeResearchMetrics } from '../services/evaluationService.js';

const generateBenchmarkData = () => {
  const stations = [
    { stationName: 'Station Colombo', stock: 50000 },
    { stationName: 'Station Galle', stock: 40000 },
    { stationName: 'Station Gampaha', stock: 30000 },
    { stationName: 'Station Kandy', stock: 60000 }
  ];

  const forecasts = [
    { stationName: 'Station Colombo', expectedDemand: 250000 },
    { stationName: 'Station Galle', expectedDemand: 200000 },
    { stationName: 'Station Gampaha', expectedDemand: 150000 },
    { stationName: 'Station Kandy', expectedDemand: 300000 }
  ];

  const transactions = [];
  const stationNames = ['Station Colombo', 'Station Galle', 'Station Gampaha', 'Station Kandy'];
  
  // Seed exactly 5000 transactions deterministically
  for (let i = 0; i < 5000; i++) {
    const stationName = stationNames[i % 4];
    const amount = (i % 20) + 5; // amounts 5 to 24 L
    const priorityScore = (i % 10 === 0) ? 5 : 1; // 10% essential
    const isCompleted = (i % 12 !== 0); // 91.6% completed
    
    transactions.push({
      transactionId: `TX-BENCH-${i}`,
      stationName,
      allocatedAmount: amount,
      priorityScore,
      transactionStatus: isCompleted ? 'Completed' : 'Pending',
      userId: `user-${i % 100}@fuel.com`
    });
  }

  return { stations, forecasts, transactions };
};

export const getEvaluationMetrics = async (req, res, next) => {
  try {
    const { type } = req.query;
    const isTestMode = type === 'test';

    let testData = null;
    const startTime = process.hrtime();

    if (isTestMode) {
      testData = generateBenchmarkData();
    }

    const report = await computeResearchMetrics(isTestMode, testData);

    const diff = process.hrtime(startTime);
    const executionTimeMs = (diff[0] * 1000 + diff[1] / 1000000).toFixed(2);

    res.status(200).json({
      success: true,
      executionTimeMs,
      ...report
    });
  } catch (err) {
    next(err);
  }
};
