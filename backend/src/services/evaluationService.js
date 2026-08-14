import Transaction from '../models/Transaction.js';
import Forecast from '../models/Forecast.js';
import FuelInventory from '../models/FuelInventory.js';
import { isDbConnected, memoryDb } from './memoryDb.js';

// Calculate Gini Coefficient
const calculateGini = (values) => {
  const m = values.length;
  if (m <= 1) return 0;
  
  let sumDiffs = 0;
  let sumValues = 0;
  
  for (let i = 0; i < m; i++) {
    sumValues += values[i];
    for (let j = 0; j < m; j++) {
      sumDiffs += Math.abs(values[i] - values[j]);
    }
  }
  
  if (sumValues === 0) return 0;
  return sumDiffs / (2 * m * sumValues);
};

// Compute research validation metrics
export const computeResearchMetrics = async (isTestMode = false, testData = null) => {
  let txList = [];
  let forecastList = [];
  let stationList = [];

  if (isTestMode && testData) {
    txList = testData.transactions || [];
    forecastList = testData.forecasts || [];
    stationList = testData.stations || [];
  } else if (!isDbConnected) {
    txList = memoryDb.transactions || [];
    forecastList = memoryDb.forecasts || [];
    stationList = memoryDb.fuelInventory || [];
  } else {
    // Read directly from MongoDB
    txList = await Transaction.find({});
    forecastList = await Forecast.find({});
    stationList = await FuelInventory.find({});
  }

  // 1. Compute station completed transaction totals
  const actualsMap = {};
  txList.forEach(tx => {
    if (tx.transactionStatus === 'Completed') {
      actualsMap[tx.stationName] = (actualsMap[tx.stationName] || 0) + (tx.allocatedAmount || 0);
    }
  });

  // Calculate MAPE & RMSE
  let absoluteErrorsSum = 0;
  let squaredErrorsSum = 0;
  let observationsCount = 0;
  
  const observationDetails = [];

  forecastList.forEach(f => {
    const actual = actualsMap[f.stationName] || 0;
    const predicted = f.expectedDemand || 0;

    // Evaluate accuracy only where actual consumption was greater than zero
    if (actual > 0) {
      const absDiff = Math.abs(actual - predicted);
      absoluteErrorsSum += absDiff / actual;
      squaredErrorsSum += Math.pow(actual - predicted, 2);
      observationsCount++;
      
      observationDetails.push({
        stationName: f.stationName,
        actual,
        predicted,
        error: absDiff
      });
    }
  });

  const mape = observationsCount > 0 ? (absoluteErrorsSum / observationsCount) * 100 : null;
  const rmse = observationsCount > 0 ? Math.sqrt(squaredErrorsSum / observationsCount) : null;

  // 2. Priority Queue Compliance Index (PQCI)
  const priorityTxs = txList.filter(t => t.priorityScore > 1);
  const totalPriorityScanned = priorityTxs.length;
  const totalPriorityServiced = priorityTxs.filter(t => t.transactionStatus === 'Completed').length;
  const pqci = totalPriorityScanned > 0 ? (totalPriorityServiced / totalPriorityScanned) * 100 : null;

  // 3. Gini Coefficient (Dispensed volume equity across nodes)
  const stationDispensed = stationList.map(s => actualsMap[s.stationName] || 0);
  const gini = calculateGini(stationDispensed);

  // 4. Stock Utilization
  let totalDispensedVolume = 0;
  let totalAvailableStock = 0;

  txList.forEach(t => {
    if (t.transactionStatus === 'Completed') {
      totalDispensedVolume += t.allocatedAmount || 0;
    }
  });

  stationList.forEach(s => {
    totalAvailableStock += s.stock || 0;
  });

  const totalPool = totalDispensedVolume + totalAvailableStock;
  const stockUtilization = totalPool > 0 ? (totalDispensedVolume / totalPool) * 100 : null;

  return {
    dataType: isTestMode ? 'SIMULATED/TEST DATASET' : 'REAL APPLICATION DATASET',
    observationsCount,
    observationDetails,
    metrics: {
      mape: mape !== null ? {
        value: parseFloat(mape.toFixed(2)),
        formula: 'MAPE = (100% / n) * sum(|Actual - Predicted| / Actual)',
        source: 'Forecasts vs Completed Transactions volume totals per station',
        interpretation: 'Mean Absolute Percentage Error. Measures percentage prediction gap. Lower is better. Benchmark Target: < 8%.'
      } : { status: 'Insufficient data', formula: 'MAPE = (100% / n) * sum(|Actual - Predicted| / Actual)' },
      rmse: rmse !== null ? {
        value: parseFloat(rmse.toFixed(2)),
        formula: 'RMSE = sqrt(sum((Actual - Predicted)^2) / n)',
        source: 'Forecasts vs Completed Transactions volume totals per station',
        interpretation: 'Root Mean Squared Error. Measures the standard deviation of residuals. Lower is better.'
      } : { status: 'Insufficient data', formula: 'RMSE = sqrt(sum((Actual - Predicted)^2) / n)' },
      pqci: pqci !== null ? {
        value: parseFloat(pqci.toFixed(2)),
        formula: 'PQCI = (Completed Essential / Total Scanned Essential) * 100%',
        source: 'Transactions ledger where priorityScore > 1',
        interpretation: 'Priority Queue Compliance Index. Efficacy score for emergency dispatches. Higher is better.'
      } : { status: 'Insufficient data', formula: 'PQCI = (Completed Essential / Total Scanned Essential) * 100%' },
      gini: {
        value: parseFloat(gini.toFixed(4)),
        formula: 'Gini = sum(sum(|xi - xj|)) / (2 * m^2 * mean(x))',
        source: 'Inventory stations list vs transaction logs volume splits',
        interpretation: 'Dispensation equity Gini coefficient. 0 represents complete equality, 1 complete inequality.'
      },
      stockUtilization: stockUtilization !== null ? {
        value: parseFloat(stockUtilization.toFixed(2)),
        formula: 'Utilization = (Total Dispensed / (Total Dispensed + Current Stock)) * 100%',
        source: 'Transactions allocation sums vs FuelInventory remaining reserves',
        interpretation: 'Stock pool utilization percentage. Measures distribution efficiency.'
      } : { status: 'Insufficient data', formula: 'Utilization = (Total Dispensed / (Total Dispensed + Current Stock)) * 100%' }
    }
  };
};
