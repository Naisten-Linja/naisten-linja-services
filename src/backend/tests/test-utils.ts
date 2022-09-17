import { GenericContainer, Wait } from 'testcontainers';
import express from 'express';
import util from 'util';
import { exec } from 'child_process';

const execPromise = util.promisify(exec);

import { createApp } from '../app';

const testDbName = 'test_db_name';
const testDbUser = 'test_db_user';
const testDbPassword = 'test_db_pass';

export type StopContainersFn = () => Promise<void>;

export async function setupTestContainers(): Promise<StopContainersFn> {
  // Setup containers for postgres and redis
  const pgContainer = await new GenericContainer('postgres:12-alpine')
    .withExposedPorts(5432)
    .withEnv('POSTGRES_USER', testDbUser)
    .withEnv('POSTGRES_PASSWORD', testDbPassword)
    .withEnv('POSTGRES_DB', testDbName)
    .withWaitStrategy(Wait.forLogMessage('database system is ready to accept connections'))
    .start();

  const redisContainer = await new GenericContainer('redis:7.0.4-alpine')
    .withExposedPorts(6379)
    .withWaitStrategy(Wait.forLogMessage('Ready to accept connections'))
    .start();

  const testDbPort = `${pgContainer.getMappedPort(5432)}`;
  process.env.DB_NAME = testDbName;
  process.env.DB_USERNAME = testDbUser;
  process.env.DB_PASSOWRD = testDbPassword;
  process.env.DB_PORT = testDbPort;
  process.env.REDIS_URL = `redis://localhost:${redisContainer.getMappedPort(6379)}`;

  // Migrate database
  const { stderr } = await execPromise(
    `DB_USERNAME=${testDbUser} DB_PASSWORD=${testDbPassword} DB_NAME=${testDbName} DB_PORT=${testDbPort} db-migrate up`,
  );
  console.log(stderr);

  return async () => {
    await pgContainer.stop();
    await redisContainer.stop();
  };
}

export class IntegrationHelpers {
  public static appInstance: express.Application;
  private static stopContainers: StopContainersFn;

  public static async getApp(): Promise<express.Application> {
    if (this.appInstance) {
      return this.appInstance;
    }

    // Start test containers for postgres, redis and set custom env variables
    if (!this.stopContainers) {
      this.stopContainers = await setupTestContainers();
    }

    return createApp();
  }

  public static async cleanup() {
    if (this.stopContainers) {
      await this.stopContainers();
    }
  }
}
