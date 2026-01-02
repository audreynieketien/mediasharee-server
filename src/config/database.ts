import mongoose from 'mongoose';
import { config } from './index';

export async function connectDatabase(): Promise<void> {
  const maxRetries = 5;
  let retries = 0;

  const connect = async (): Promise<void> => {
    try {
      await mongoose.connect(config.cosmosDb.connectionString, {
        retryWrites: false,
        maxPoolSize: 10,
      });
      
      console.log('Connected to Azure Cosmos DB (MongoDB API)');
    } catch (error) {
      retries++;
      console.error(`Database connection failed (attempt ${retries}/${maxRetries}):`, error);
      
      if (retries < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retries), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
        return connect();
      } else {
        throw new Error('Failed to connect to database after maximum retries');
      }
    }
  };

  mongoose.connection.on('disconnected', () => {
    console.warn('Database disconnected');
  });

  mongoose.connection.on('error', (err) => {
    console.error('Database error:', err);
  });

  mongoose.connection.on('reconnected', () => {
    console.log('Database reconnected');
  });

  await connect();
}
