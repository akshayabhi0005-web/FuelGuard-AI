import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { calculateBlockHash, mineBlock, verifyLedgerIntegrity } from '../services/ledgerService.js';
import { sendSimulatedSMS, getSimulatedSMSLogs } from '../services/smsService.js';

dotenv.config();

const runLedgerVerificationTests = async () => {
  console.log('--- STARTING LEDGER INTEGRITY & SIMULATED SMS INTEGRATION TESTS ---');

  await mongoose.connect(process.env.MONGODB_URI);

  const logResult = (name, passed, detail = '') => {
    console.log(`${passed ? '✅' : '❌'} [${passed ? 'PASS' : 'FAIL'}] ${name} ${detail ? `(${detail})` : ''}`);
    if (!passed) {
      process.exit(1);
    }
  };

  try {
    // 1. Clean up old elements
    await User.deleteMany({ email: 'ledger-tester@fuel.com' });
    await Transaction.deleteMany({});

    // 2. Create test participant
    const user = await User.create({
      email: 'ledger-tester@fuel.com',
      passwordHash: 'password123',
      role: 'citizen',
      fullName: 'Ledger Audit Tester',
      phone: '94777999888'
    });

    // 3. Verify SHA-256 Block hashing
    console.log('Verifying block hash computations...');
    const hash = calculateBlockHash('TX-POW-1', 10, 'Colombo Station', user._id.toString(), '0', 12345);
    logResult('Calculate SHA-256 string hash', typeof hash === 'string' && hash.length === 64);

    // 4. Verify Proof-of-Work mining
    console.log('Verifying Proof-of-Work nonce mining...');
    const block = mineBlock('TX-POW-1', 10, 'Colombo Station', user._id.toString(), '0');
    logResult('Mine valid nonce target', block.nonce >= 0 && block.hash.startsWith('0'));

    // 5. Build transaction chain in DB
    console.log('Seeding cryptographically linked transaction ledger...');
    const tx1Block = mineBlock('TX-BLOCK-1', 15, 'Colombo Station', user._id.toString(), '0');
    const tx1 = await Transaction.create({
      transactionId: 'TX-BLOCK-1',
      date: '2026-08-09',
      stationName: 'Colombo Station',
      amount: 15,
      allocatedAmount: 15,
      cost: 5500,
      userId: user._id,
      fuelType: 'Petrol 92 Octane',
      previousHash: '0',
      nonce: tx1Block.nonce,
      hash: tx1Block.hash,
      emergencyStatus: 'NORMAL'
    });

    const tx2Block = mineBlock('TX-BLOCK-2', 20, 'Galle Station', user._id.toString(), tx1.hash);
    const tx2 = await Transaction.create({
      transactionId: 'TX-BLOCK-2',
      date: '2026-08-09',
      stationName: 'Galle Station',
      amount: 20,
      allocatedAmount: 20,
      cost: 7400,
      userId: user._id,
      fuelType: 'Petrol 92 Octane',
      previousHash: tx1.hash,
      nonce: tx2Block.nonce,
      hash: tx2Block.hash,
      emergencyStatus: 'NORMAL'
    });

    // 6. Audit legitimate ledger
    console.log('Auditing database chain integrity...');
    const initialVerify = await verifyLedgerIntegrity();
    logResult('Chain ledger integrity pass', initialVerify.isValid);

    // 7. Test tampering detection
    console.log('Simulating retrospective database modification tampering...');
    // Maliciously change transaction 1 allocated amount
    tx1.allocatedAmount = 999; // tampered amount
    await tx1.save();

    const tamperedVerify = await verifyLedgerIntegrity();
    logResult(
      'Audit engine flags tampered transaction record',
      !tamperedVerify.isValid && tamperedVerify.tamperedTransactionId === 'TX-BLOCK-1'
    );

    // 8. Test SMS Gateway Dispatch simulation
    console.log('Testing simulated SMS gateway dispatches...');
    sendSimulatedSMS('94777999888', 'Legit test broadcast alert.');
    const logs = getSimulatedSMSLogs();
    const hasLog = logs.some(l => l.includes('94777999888') && l.includes('Legit test broadcast alert'));
    logResult('Simulated SMS successfully written to log registry', hasLog);

    // Clean up
    await User.deleteMany({ email: 'ledger-tester@fuel.com' });
    await Transaction.deleteMany({});

    console.log('--- ALL LEDGER INTEGRITY & SMS TESTS PASSED ---');
  } catch (err) {
    console.error('❌ Tests threw a fatal exception:', err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

runLedgerVerificationTests();
