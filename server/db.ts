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

    // Users Table
    await client.query(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Workspaces Table
    await client.query(`CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      "ownerId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT DEFAULT 'personal', -- 'personal' or 'team'
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Workspace Members Table (for team workspaces)
    await client.query(`CREATE TABLE IF NOT EXISTS workspace_members (
      "workspaceId" TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT DEFAULT 'member', -- 'admin' or 'member'
      PRIMARY KEY ("workspaceId", "userId")
    )`);

    // Collections Table
    await client.query(`CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Migration: Add userId and workspaceId to collections if they don't exist
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collections' AND column_name='userId') THEN
          ALTER TABLE collections ADD COLUMN "userId" TEXT REFERENCES users(id) ON DELETE SET NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collections' AND column_name='workspaceId') THEN
          ALTER TABLE collections ADD COLUMN "workspaceId" TEXT REFERENCES workspaces(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `);

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
      "workspaceId" TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Migration: Add workspaceId to environments if it doesn't exist
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='environments' AND column_name='workspaceId') THEN
          ALTER TABLE environments ADD COLUMN "workspaceId" TEXT REFERENCES workspaces(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    // Workspace Invitations Table
    await client.query(`CREATE TABLE IF NOT EXISTS workspace_invitations (
      id TEXT PRIMARY KEY,
      "workspaceId" TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      "inviterId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "inviteeId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT DEFAULT 'member', -- 'admin' or 'member'
      status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE("workspaceId", "inviteeId", "status") -- Prevent duplicate pending invites
    )`);

    // Activity Logs Table
    await client.query(`CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      "workspaceId" TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
      "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'INVITE', 'ACCEPT', 'REJECT'
      "entityType" TEXT NOT NULL, -- 'COLLECTION', 'FOLDER', 'REQUEST', 'ENVIRONMENT', 'INVITATION'
      "entityId" TEXT,
      "entityName" TEXT,
      details TEXT,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Create indexes for activity logs to ensure performance as the table grows
    await client.query('CREATE INDEX IF NOT EXISTS idx_activity_logs_workspace_id ON activity_logs ("workspaceId")');
    await client.query('CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs ("createdAt")');

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

export const withTransaction = async <T>(callback: (client: any) => Promise<T>): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export { pool as db };
