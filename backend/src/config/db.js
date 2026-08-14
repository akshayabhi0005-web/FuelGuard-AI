import mongoose from 'mongoose';
import { setDbConnected } from '../services/memoryDb.js';

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  
  // Disable Mongoose command buffering so queries fail fast when offline
  mongoose.set('bufferCommands', false);

  // Attach connection lifecycle log listeners
  mongoose.connection.on('connected', () => {
    console.log(`💚 MongoDB connected successfully`);
    setDbConnected(true);
  });
  
  mongoose.connection.on('error', (err) => {
    console.error(`🔴 MongoDB error event: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected! Attempting automatic recovery...');
    setDbConnected(false);
  });

  mongoose.connection.on('reconnected', () => {
    console.log('💚 MongoDB successfully reconnected.');
    setDbConnected(true);
  });

  let retries = 5;
  while (retries > 0) {
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 3000
      });
      setDbConnected(true);
      return conn;
    } catch (error) {
      retries--;
      console.error(`🔴 Database connection failed (${retries} retries remaining): ${error.message}`);
      if (retries === 0) {
        console.warn('⚠️ Warning: MongoDB connection limit reached. Server starting in OFFLINE/IN-MEMORY Mode.');
        setDbConnected(false);
        return null;
      }
      // Controlled backoff delay of 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
};
