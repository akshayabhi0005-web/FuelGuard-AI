import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { computeResearchMetrics } from '../services/evaluationService.js';

dotenv.config();

const runResearchEvaluationTests = async () => {
  console.log('--- STARTING RESEARCH METRICS EVALUATION INTEGRATION TESTS ---');

  await mongoose.connect(process.env.MONGODB_URI);

  const logResult = (name, passed, detail = '') => {
    console.log(`${passed ? '✅' : '❌'} [${passed ? 'PASS' : 'FAIL'}] ${name} ${detail ? `(${detail})` : ''}`);
    if (!passed) {
      process.exit(1);
    }
  };

  try {
    // 1. Define deterministic small test dataset
    const stations = [
      { stationName: 'Station A', stock: 1000 },
      { stationName: 'Station B', stock: 2000 }
    ];

    const forecasts = [
      { stationName: 'Station A', expectedDemand: 100 },
      { stationName: 'Station B', expectedDemand: 200 }
    ];

    const transactions = [
      {
        transactionId: 'TX-LEGIT-1',
        stationName: 'Station A',
        allocatedAmount: 80,
        priorityScore: 5, // essential
        transactionStatus: 'Completed'
      },
      {
        transactionId: 'TX-LEGIT-2',
        stationName: 'Station A',
        allocatedAmount: 5,
        priorityScore: 5, // essential
        transactionStatus: 'Pending' // failed/pending
      },
      {
        transactionId: 'TX-LEGIT-3',
        stationName: 'Station B',
        allocatedAmount: 250,
        priorityScore: 1, // civilian
        transactionStatus: 'Completed'
      }
    ];

    const testData = { stations, forecasts, transactions };

    // 2. Compute metrics
    console.log('Calculating evaluation metrics over small deterministic dataset...');
    const result = await computeResearchMetrics(true, testData);

    // Assert MAPE (Expected: 22.50%)
    logResult('MAPE calculation verification', result.metrics.mape.value === 22.50, `Expected 22.50%, got ${result.metrics.mape.value}%`);

    // Assert RMSE (Expected: 38.08)
    logResult('RMSE calculation verification', result.metrics.rmse.value === 38.08, `Expected 38.08, got ${result.metrics.rmse.value}`);

    // Assert PQCI (Expected: 50.00%)
    logResult('PQCI calculation verification', result.metrics.pqci.value === 50.00, `Expected 50.00%, got ${result.metrics.pqci.value}%`);

    // Assert Gini (Expected: 0.2576)
    logResult('Gini coefficient verification', result.metrics.gini.value === 0.2576, `Expected 0.2576, got ${result.metrics.gini.value}`);

    // Assert Stock Utilization (Expected: 9.91%)
    logResult('Stock utilization verification', result.metrics.stockUtilization.value === 9.91, `Expected 9.91%, got ${result.metrics.stockUtilization.value}%`);

    // 3. Benchmarking 5,000 records
    console.log('Benchmarking statistical execution time over 5,000 transaction records...');
    const benchStations = [
      { stationName: 'Station Colombo', stock: 50000 },
      { stationName: 'Station Galle', stock: 40000 },
      { stationName: 'Station Gampaha', stock: 30000 },
      { stationName: 'Station Kandy', stock: 60000 }
    ];

    const benchForecasts = [
      { stationName: 'Station Colombo', expectedDemand: 250000 },
      { stationName: 'Station Galle', expectedDemand: 200000 },
      { stationName: 'Station Gampaha', expectedDemand: 150000 },
      { stationName: 'Station Kandy', expectedDemand: 300000 }
    ];

    const benchTransactions = [];
    const stationNames = ['Station Colombo', 'Station Galle', 'Station Gampaha', 'Station Kandy'];
    for (let i = 0; i < 5000; i++) {
      benchTransactions.push({
        transactionId: `TX-BENCH-${i}`,
        stationName: stationNames[i % 4],
        allocatedAmount: (i % 20) + 5,
        priorityScore: (i % 10 === 0) ? 5 : 1,
        transactionStatus: (i % 12 !== 0) ? 'Completed' : 'Pending'
      });
    }

    const benchData = { stations: benchStations, forecasts: benchForecasts, transactions: benchTransactions };

    const startTime = process.hrtime();
    const benchReport = await computeResearchMetrics(true, benchData);
    const diff = process.hrtime(startTime);
    const executionTimeMs = (diff[0] * 1000 + diff[1] / 1000000).toFixed(2);

    logResult(
      'Successfully benchmarked 5,000 transactions',
      benchReport.observationsCount === 4,
      `Observations count: ${benchReport.observationsCount}, Execution time: ${executionTimeMs} ms`
    );

    console.log('--- ALL RESEARCH EVALUATION TESTS PASSED ---');
  } catch (err) {
    console.error('❌ Tests threw a fatal exception:', err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

runResearchEvaluationTests();
