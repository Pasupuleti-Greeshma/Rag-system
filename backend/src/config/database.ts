import pg from 'pg';
import { config } from './index.js';
import pgvector from 'pgvector/pg';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Attach pgvector type parsers to the pool client
pool.on('connect', async (client) => {
  try {
    await pgvector.registerType(client);
  } catch (err) {
    // Vector type might not be registered yet if migrations haven't run
  }
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
