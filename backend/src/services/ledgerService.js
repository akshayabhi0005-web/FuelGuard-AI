import crypto from 'crypto';
import Transaction from '../models/Transaction.js';
import { isDbConnected, memoryDb } from './memoryDb.js';

// Calculate SHA-256 block hash for a transaction node
export const calculateBlockHash = (txId, amount, stationName, userId, previousHash, nonce) => {
  const input = `${txId}-${amount}-${stationName}-${userId}-${previousHash}-${nonce}`;
  return crypto.createHash('sha256').update(input).digest('hex');
};

// Mine a block using dynamic nonce calculations (Difficulty Target: Hash begins with "0")
export const mineBlock = (txId, amount, stationName, userId, previousHash) => {
  let nonce = 0;
  let hash = '';
  while (true) {
    hash = calculateBlockHash(txId, amount, stationName, userId, previousHash, nonce);
    if (hash.startsWith('0')) {
      break;
    }
    nonce++;
  }
  return { nonce, hash };
};

// Validate the entire transaction history chain
export const verifyLedgerIntegrity = async () => {
  let txs;
  if (!isDbConnected) {
    txs = [...memoryDb.transactions]
      .filter(t => t.transactionStatus === 'Completed')
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  } else {
    txs = await Transaction.find({ transactionStatus: 'Completed' }).sort({ createdAt: 1 });
  }
  let previousHash = '0';

  for (let i = 0; i < txs.length; i++) {
    const tx = txs[i];
    const currentHash = calculateBlockHash(
      tx.transactionId,
      tx.allocatedAmount,
      tx.stationName,
      tx.userId.toString(),
      tx.previousHash,
      tx.nonce
    );

    if (tx.hash !== currentHash) {
      return {
        isValid: false,
        reason: `Hash mismatch at transaction '${tx.transactionId}'. Stored: '${tx.hash}', calculated: '${currentHash}'`,
        tamperedTransactionId: tx.transactionId
      };
    }

    if (tx.previousHash !== previousHash) {
      return {
        isValid: false,
        reason: `Linkage broken at transaction '${tx.transactionId}'. Stored previous link: '${tx.previousHash}', expected: '${previousHash}'`,
        tamperedTransactionId: tx.transactionId
      };
    }

    previousHash = tx.hash;
  }

  return { isValid: true };
};
