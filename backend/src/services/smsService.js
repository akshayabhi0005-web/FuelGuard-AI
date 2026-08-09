import fs from 'fs';
import path from 'path';

const SMS_LOG_DIR = './scratch';
const SMS_LOG_FILE = path.join(SMS_LOG_DIR, 'sms_gateway.log');

// Log simulated SMS message to scratch logs
export const sendSimulatedSMS = (to, message) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] TO: ${to} | MESSAGE: ${message}\n`;
  
  console.log(`📱 [SMS Gateway Simulation]: Sending to ${to} -> "${message}"`);
  
  try {
    if (!fs.existsSync(SMS_LOG_DIR)) {
      fs.mkdirSync(SMS_LOG_DIR, { recursive: true });
    }
    fs.appendFileSync(SMS_LOG_FILE, logEntry);
  } catch (err) {
    console.error('Failed to write to SMS log file', err.message);
  }
};

// Retrieve SMS history
export const getSimulatedSMSLogs = () => {
  try {
    if (fs.existsSync(SMS_LOG_FILE)) {
      return fs.readFileSync(SMS_LOG_FILE, 'utf8').split('\n').filter(Boolean);
    }
  } catch (err) {
    console.error('Failed to read SMS log file', err.message);
  }
  return [];
};
