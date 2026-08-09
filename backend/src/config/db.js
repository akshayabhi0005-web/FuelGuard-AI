import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  
  // Attach connection lifecycle log listeners
  mongoose.connection.on('connected', () => {
    console.log(`💚 MongoDB connected successfully`);
  });
  
  mongoose.connection.on('error', (err) => {
    console.error(`🔴 MongoDB error event: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected! Attempting automatic recovery...');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('💚 MongoDB successfully reconnected.');
  });

  let retries = 5;
  while (retries > 0) {
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 3000
      });
      return conn;
    } catch (error) {
      retries--;
      console.error(`🔴 Database connection failed (${retries} retries remaining): ${error.message}`);
      if (retries === 0) {
        console.error('🔴 Fatal: MongoDB connection limit reached. Exiting...');
        process.exit(1);
      }
      // Controlled backoff delay of 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
};
