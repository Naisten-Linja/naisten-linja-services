import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import express from 'express';
import util from 'util';
import { exec } from 'child_process';
const execPromise = util.promisify(exec);

import { createApp } from './app';
import { upsertUser, UpsertUserParams, updateUserRole, User } from './models/users';
import { createBookingType } from './models/bookingTypes';
import { createToken } from './auth';
import { UserRole } from '../common/constants-common';
import { getLegacyRedisClient, getRedisClient } from './redis';
import db from './db';

const testDbName = 'test_db_name';
const testDbUser = 'test_db_user';
const testDbPassword = 'test_db_pass';

export async function setupTestContainers() {
  // Setup containers for postgres and redis
  const pgContainer = await new GenericContainer('postgres:11.9-alpine')
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
  process.env.DB_PASSWORD = testDbPassword;
  process.env.DB_PORT = testDbPort;
  process.env.REDIS_URL = `redis://localhost:${redisContainer.getMappedPort(6379)}`;

  // Migrate database
  await execPromise(
    `DB_USERNAME=${testDbUser} DB_PASSWORD=${testDbPassword} DB_NAME=${testDbName} DB_PORT=${testDbPort} db-migrate up -e test`,
  );

  return {
    pgContainer,
    redisContainer,
  };
}

export class TestApiHelpers {
  public static appInstance: express.Application;
  private static pgContainer: StartedTestContainer;
  private static redisContainer: StartedTestContainer;

  public static async getApp(): Promise<express.Application> {
    if (this.appInstance) {
      return this.appInstance;
    }

    // Start test containers for postgres, redis and set custom env variables
    if (!this.pgContainer || !this.redisContainer) {
      const { pgContainer, redisContainer } = await setupTestContainers();
      this.pgContainer = pgContainer;
      this.redisContainer = redisContainer;
    }

    const app = await createApp();
    return app;
  }

  public static async cleanup() {
    const redisClient = await getRedisClient();
    await redisClient.quit();
    const legacyRedisClient = await getLegacyRedisClient();
    await legacyRedisClient.quit();

    const pgClient = await db.getClient();
    pgClient.release();

    if (this.pgContainer) {
      await this.pgContainer.stop();
    }
    if (this.redisContainer) {
      await this.redisContainer.stop();
    }
  }

  public static async getToken(user: User) {
    const token = await createToken({
      uuid: user.uuid,
      fullName: user.fullName,
      role: user.role,
      email: user.email,
    });
    if (!token) {
      throw 'failed to get token';
    }
    return token;
  }

  public static async createTestUser(params: UpsertUserParams, role: UserRole) {
    const user = await upsertUser(params);
    if (!user) {
      throw 'failed to create test user';
    }

    const updatedUser = await updateUserRole({ role: role, uuid: user.uuid });
    if (!updatedUser) {
      throw 'failed to set user role';
    }
    return updatedUser;
  }

  public static async populateTestUsers() {
    const staff = await this.createTestUser(
      {
        discourseUserId: 1,
        fullName: 'Staff',
        email: 'staffUser@naistenlinja.fi',
      },
      UserRole.staff,
    );

    const volunteer = await this.createTestUser(
      {
        discourseUserId: 2,
        fullName: 'Volunteer User',
        email: 'volunteerUser@naistenlinja.fi',
      },
      UserRole.volunteer,
    );

    const unassigned = await this.createTestUser(
      {
        discourseUserId: 3,
        fullName: 'Unassigned User',
        email: 'unassignedUser@naistenlinja.fi',
      },
      UserRole.unassigned,
    );

    return [staff, volunteer, unassigned];
  }

  public static async populateBookingTypes() {
    const phoneBookingType = await createBookingType({
      name: 'Phone',
      rules: [
        {
          enabled: true,
          slots: [
            { start: '07:00', end: '09:00', seats: 4 },
            { start: '10:00', end: '12:00', seats: 2 },
          ],
        },
        { enabled: true, slots: [] },
        { enabled: true, slots: [] },
        { enabled: true, slots: [] },
        { enabled: true, slots: [{ start: '10:00', end: '11:30', seats: 5 }] },
        { enabled: true, slots: [] },
        { enabled: true, slots: [] },
      ],
      exceptions: [new Date().toUTCString()],
      dateRanges: [],
      additionalInformation: 'this is a test booking',
    });

    if (!phoneBookingType) {
      throw 'unable to create phone booking';
    }

    const letterBookingType = await createBookingType({
      name: 'Letter',
      rules: [
        { enabled: true, slots: [] },
        {
          enabled: true,
          slots: [
            { start: '14:00', end: '19:00', seats: 1 },
            { start: '19:45', end: '20:30', seats: 3 },
          ],
        },
        { enabled: true, slots: [] },
        { enabled: true, slots: [{ start: '10:00', end: '11:30', seats: 10 }] },
        { enabled: true, slots: [] },
        { enabled: true, slots: [] },
        { enabled: true, slots: [] },
      ],
      exceptions: [new Date().toUTCString()],
      dateRanges: [],
      additionalInformation: 'this is a test booking',
    });
    if (!letterBookingType) {
      throw 'unable to create phone booking';
    }

    return [phoneBookingType, letterBookingType];
  }
}
