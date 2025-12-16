import { Pool, QueryResultRow } from 'pg';

import { getConfig } from './config';

let pool: Pool | null = null;

function getPool(): Pool {
  const { dbName, dbHost, dbPort, dbUser, dbPassword, environment } = getConfig();
  if (!pool) {
    pool = new Pool({
      user: dbUser,
      database: dbName,
      password: dbPassword,
      port: dbPort,
      host: dbHost,
      max: 100, // allow maximum 100 connections
      ...(environment !== 'development' && environment !== 'test'
        ? { ssl: { rejectUnauthorized: false } }
        : {}), // enable ssl in production
    });
    pool.on('error', () => {});
  }
  return pool;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function query<R extends QueryResultRow = any, I extends unknown[] = any[]>(
  queryText: string,
  values: I,
) {
  const pgPool = getPool();
  return pgPool.query<R, I>(queryText, values);
}

function getClient() {
  const pgPool = getPool();
  return pgPool.connect();
}

export function closePool() {
  if (pool) {
    pool.end();
    pool = null;
  }
}

export default {
  query,
  getClient,
  closePool,
};
