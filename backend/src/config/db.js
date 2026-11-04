import 'dotenv/config';
import mongoose from 'mongoose';

/**
 * Initializes MongoDB connection using Mongoose.
 * Reads MONGODB_URI from environment variables.
 */
export async function initDb(options = {}) {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecocycle';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
      ...options,
    });
    console.log(`MongoDB connected: ${conn.connection.host || 'cluster'}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    throw err;
  }
}

/**
 * Closes the MongoDB connection gracefully.
 */
export async function closeDb() {
  try {
    await mongoose.disconnect();
    console.log('MongoDB connection closed');
  } catch (err) {
    console.error(`Error closing MongoDB connection: ${err.message}`);
  }
}

export { mongoose };
