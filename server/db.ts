import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const poolConfig = {
  host: (process.env.PG_HOST_DEV || process.env.DB_HOST || 'localhost').replace(/"/g, ''),
  port: parseInt((process.env.PG_PORT_DEV || process.env.DB_PORT || '5432').replace(/"/g, ''), 10),
  user: (process.env.PG_USER_DEV || process.env.DB_USER || 'postgres').replace(/"/g, ''),
  password: (process.env.PG_PASSWORD_DEV || process.env.DB_PASSWORD || '').replace(/"/g, ''),
  database: (process.env.DB_NAME || 'requestlab').replace(/"/g, ''),
};

console.log(`Connecting to PostgreSQL with config: host=${poolConfig.host}, port=${poolConfig.port}, user=${poolConfig.user}, database=${poolConfig.database}`);

const pool = new Pool(poolConfig);

const initializeDb = async () => {
  // 1. Connect to default 'postgres' database to check/create the target database
  const adminConfig = { ...poolConfig, database: 'postgres' };
  const adminPool = new Pool(adminConfig);
  const adminClient = await adminPool.connect();
  
  try {
    const dbName = poolConfig.database;
    const checkDbRes = await adminClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    
    if (checkDbRes.rowCount === 0) {
      console.log(`Database "${dbName}" not found. Creating...`);
      // Note: CREATE DATABASE cannot be run in a transation block
      await adminClient.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Database "${dbName}" created successfully.`);
    }
  } catch (err: any) {
    console.error('Error checking/creating database:', err.message);
  } finally {
    adminClient.release();
    await adminPool.end();
  }

  // 2. Connect to the (now existing) target database to initialize tables
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Collections Table
    await client.query(`CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      "userId" TEXT,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Folders Table
    await client.query(`CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      "collectionId" TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Requests Table
    await client.query(`CREATE TABLE IF NOT EXISTS requests (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      method TEXT NOT NULL,
      url TEXT NOT NULL,
      headers TEXT,
      body TEXT,
      params TEXT,
      auth TEXT,
      "preRequestScript" TEXT,
      "testScript" TEXT,
      "folderId" TEXT REFERENCES folders(id) ON DELETE CASCADE,
      "collectionId" TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Environments Table
    await client.query(`CREATE TABLE IF NOT EXISTS environments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      variables TEXT,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await client.query('COMMIT');
    console.log('PostgreSQL database and tables initialized.');
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Error initializing PostgreSQL tables:', err.message);
  } finally {
    client.release();
  }
};

initializeDb();

export const runQuery = async (sql: string, params: any[] = []): Promise<any> => {
  const result = await pool.query(sql, params);
  return result;
};

export const getQuery = async <T>(sql: string, params: any[] = []): Promise<T[]> => {
  const result = await pool.query(sql, params);
  return result.rows;
};

export const getSingleQuery = async <T>(sql: string, params: any[] = []): Promise<T | undefined> => {
  const result = await pool.query(sql, params);
  return result.rows[0];
};

export { pool as db };
