import { Pool, PoolClient, QueryResultRow } from 'pg';

import { getConfig } from './config';

const { dbName, dbHost, dbPort, dbUser, dbPassword } = getConfig();

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      user: dbUser,
      database: dbName,
      password: dbPassword,
      port: dbPort,
      host: dbHost,
      max: 100, // allow maximum 100 connections
    });
  }
  return pool;
}

function query<R extends QueryResultRow = any, I extends any[] = any[]>(queryText: string, values: I) {
  const pgPool = getPool();
  return pgPool.query<R, I>(queryText, values);
}

function getClient() {
  const pgPool = getPool();
  return pgPool.connect();
}

export default {
  query,
  getClient,
};
