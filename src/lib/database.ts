import { Pool, PoolConfig } from 'pg';

const getSSLConfig = () => {
  if (process.env.NODE_ENV === 'development') {
    return false;
  }
  return {
    rejectUnauthorized: false,
    require: true
  };
};

const dbConfig: PoolConfig = process.env.POSTGRES_URL ? {
  connectionString: process.env.POSTGRES_URL,
  ssl: getSSLConfig(),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
} : {
  user: process.env.POSTGRES_USER || process.env.DB_USER || 'postgres',
  host: process.env.POSTGRES_HOST || process.env.DB_HOST || 'localhost',
  database: process.env.POSTGRES_DATABASE || process.env.DB_NAME || 'studio_vit',
  password: process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432'),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: getSSLConfig()
};

let pool: Pool;

export const getPool = (): Pool => {
  if (!pool) {
    pool = new Pool(dbConfig);
    
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }
  
  return pool;
};

export const query = async (text: string, params?: unknown[]) => {
  const pool = getPool();
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

export const getClient = async () => {
  const pool = getPool();
  return pool.connect();
};