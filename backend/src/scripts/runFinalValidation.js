import { fork } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testSuites = [
  { name: 'Phase 2: Express REST endpoints', script: 'testEndpoints.js' },
  { name: 'Phase 5: JWT & RBAC Auth Gating', script: 'testGating.js' },
  { name: 'Phase 4: Socket.IO Real-Time Updates', script: 'testRealtime.js' },
  { name: 'Phase 6: Demand Forecasting & Reset Cron', script: 'testForecastCron.js' },
  { name: 'Phase 7: Automated Fraud Auditing Checks', script: 'testFraudAuditing.js' },
  { name: 'Phase 8: Blockchain Ledger & SMS Gateway', script: 'testLedgerIntegrity.js' },
  { name: 'Phase 9: Research Metrics & Benchmark', script: 'testEvaluation.js' }
];

const runSuite = (suite) => {
  return new Promise((resolve) => {
    console.log(`\n======================================================================`);
    console.log(`🚀 RUNNING TEST SUITE: ${suite.name} (${suite.script})`);
    console.log(`======================================================================`);

    const child = fork(path.join(__dirname, suite.script), [], { silent: false });

    child.on('close', (code) => {
      resolve({
        name: suite.name,
        script: suite.script,
        passed: code === 0,
        code
      });
    });
  });
};

const runAllTests = async () => {
  console.log('🏁 INITIALIZING FUELGUARD AI MASTER REGRESSION TEST EXECUTION RUNNER...\n');
  
  const startTime = process.hrtime();
  const results = [];

  for (const suite of testSuites) {
    const res = await runSuite(suite);
    results.push(res);
    if (!res.passed) {
      console.error(`\n❌ CRITICAL FAILURE: Suite '${res.name}' failed with exit code ${res.code}.`);
      console.log('\n--- FINAL VERIFICATION MATRIX ---');
      console.table(results);
      process.exit(1);
    }
  }

  const diff = process.hrtime(startTime);
  const totalDuration = (diff[0] + diff[1] / 1e9).toFixed(2);

  console.log('\n======================================================================');
  console.log('🏆 ALL INTEGRATION & REGRESSION TEST SUITES COMPLETED SUCCESSFULLY!');
  console.log(`Total Execution Duration: ${totalDuration} seconds`);
  console.log('======================================================================\n');

  console.log('--- FINAL SYSTEM INTEGRITY MATRIX ---');
  console.table(results.map(r => ({
    'Test Suite Name': r.name,
    'Target Script': r.script,
    'Status': r.passed ? '✅ PASS' : '❌ FAIL',
    'Exit Code': r.code
  })));

  process.exit(0);
};

runAllTests();
