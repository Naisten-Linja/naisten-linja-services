import { Pool, PoolClient, QueryResultRow } from 'pg';

import { getConfig } from './config';

const { dbName, dbHost, dbPort, dbUser, dbPassword } = getConfig();

const pool = new Pool({
  user: dbUser,
  database: dbName,
  password: dbPassword,
  port: dbPort,
  host: dbHost,
  max: 100, // allow maximum 100 connections
});

function query<R extends QueryResultRow = any, I extends any[] = any[]>(queryText: string, values: I) {
  return pool.query<R, I>(queryText, values);
}

function getClient() {
  return pool.connect();
}

export default {
  query,
  getClient,
};
