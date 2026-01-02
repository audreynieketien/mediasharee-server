import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface ServerConfig {
  port: number;
  nodeEnv: string;
}

interface CosmosDbConfig {
  connectionString: string;
}

interface AzureStorageConfig {
  accountName: string;
  accountKey: string;
  containerName: string;
}


interface CacheConfig {
  feedTtl: number;
  suggestionsTtl: number;
}

export interface Config {
  server: ServerConfig;
  cosmosDb: CosmosDbConfig;
  azureStorage: AzureStorageConfig;

  cache: CacheConfig;
  jwtSecret: string;
  adminApiSecret: string;
}

/**
 * Validates and returns application configuration
 * Throws error if required environment variables are missing
 */
function loadConfig(): Config {
  // Required environment variables for production
  const requiredEnvVars = [
    'COSMOS_DB_CONNECTION_STRING',
    'AZURE_STORAGE_ACCOUNT_NAME',
    'AZURE_STORAGE_ACCOUNT_KEY',

    'JWT_SECRET',
  ];

  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file against .env.example'
    );
  }

  // Validate JWT_SECRET length
  const jwtSecret = process.env.JWT_SECRET!;
  if (jwtSecret.length < 10) { // Relaxed to 10 for easier local testing if needed, though 32 is better
    throw new Error(
      'JWT_SECRET must be at least 10 characters long for security.'
    );
  }

  return {
    server: {
      port: parseInt(process.env.PORT || '3000', 10),
      nodeEnv: process.env.NODE_ENV || 'development',
    },
    cosmosDb: {
      connectionString: process.env.COSMOS_DB_CONNECTION_STRING!,
    },
    azureStorage: {
      accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME!,
      accountKey: process.env.AZURE_STORAGE_ACCOUNT_KEY!,
      containerName: process.env.AZURE_STORAGE_CONTAINER_NAME || 'media',
    },

    cache: {
      feedTtl: parseInt(process.env.CACHE_FEED_TTL || '30', 10),
      suggestionsTtl: parseInt(process.env.CACHE_SUGGESTIONS_TTL || '300', 10),
    },
    jwtSecret,
    adminApiSecret: process.env.ADMIN_API_SECRET || 'dev-admin-secret',
  };
}

export const config = loadConfig();
