import mongoose from 'mongoose';
import { env } from './env.js';

// Database connection options
const options = {
  autoIndex: true,
};

/**
 * Connect to MongoDB database
 * @returns Promise resolving to mongoose connection
 */
export const connectDB = async (): Promise<mongoose.Connection> => {
  try {
    const conn = await mongoose.connect(env.DB_CONNECTION_STRING, options);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn.connection;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    } else {
      console.error('❌ Unknown error connecting to MongoDB');
    }
    process.exit(1);
  }
};

/**
 * Disconnect from MongoDB database
 */
export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('👋 MongoDB disconnected');
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Error disconnecting from MongoDB: ${error.message}`);
    } else {
      console.error('❌ Unknown error disconnecting from MongoDB');
    }
  }
}; 