import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import express from 'express';
import util from 'util';
import { exec } from 'child_process';
const execPromise = util.promisify(exec);

import { createApp } from './app';
import { upsertUser, UpsertUserParams, updateUserRole, User } from './models/users';
import { createBookingType } from './models/bookingTypes';
import * as auth from './auth';
import * as emailController from './controllers/emailControllers';
import { UserRole } from '../common/constants-common';
import db from './db';
import { sendLetter } from './controllers/letterControllers';
import { Letter, createLetterCredentials } from './models/letters';

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
  process.env.LETTER_ACCESS_KEY_SALT =
    'd35d86248800d53ac5086eb9010f4b830de271acd06235a4a4e52de0ee6afdd6';
  process.env.LETTER_AES_KEY = '3e8e98013458a51879e6db9956001a47e2533c065b85fed1d5a80e79b83171de';

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

  public static async resetDb() {
    await db.query(
      `TRUNCATE TABLE replies, letters, bookings, booking_types, pages, users RESTART IDENTITY;`,
      [],
    );
  }

  public static async cleanup() {
    if (this.pgContainer) {
      await this.pgContainer.stop();
    }
    if (this.redisContainer) {
      await this.redisContainer.stop();
    }
  }

  public static async getToken(user: User) {
    const token = await auth.createToken({
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
        // Sunday
        { enabled: true, slots: [] },
        // Monday
        { enabled: true, slots: [] },
        // Tuesday
        {
          enabled: true,
          slots: [
            { start: '07:00', end: '09:00', seats: 4 },
            { start: '10:00', end: '12:00', seats: 2 },
          ],
        },
        // Wednesday
        { enabled: true, slots: [] },
        // Thursday
        { enabled: true, slots: [{ start: '10:00', end: '11:30', seats: 5 }] },
        // Friday
        { enabled: true, slots: [] },
        // Saturday
        { enabled: true, slots: [] },
      ],
      exceptions: [new Date().toUTCString()],
      dateRanges: [],
      additionalInformation: 'this is a test booking',
      flexibleLocation: true,
    });

    if (!phoneBookingType) {
      throw 'unable to create phone booking';
    }

    const letterBookingType = await createBookingType({
      name: 'Letter',
      rules: [
        // Sunday
        { enabled: true, slots: [] },
        // Monday
        {
          enabled: true,
          slots: [
            { start: '14:00', end: '19:00', seats: 1 },
            { start: '19:45', end: '20:30', seats: 3 },
          ],
        },
        // Tuesday
        { enabled: true, slots: [] },
        // Wednesday
        { enabled: true, slots: [{ start: '10:00', end: '11:30', seats: 10 }] },
        // Thursday
        { enabled: true, slots: [] },
        // Friday
        { enabled: true, slots: [] },
        // Saturday
        { enabled: true, slots: [] },
      ],
      exceptions: [new Date().toUTCString()],
      dateRanges: [],
      additionalInformation: 'this is a test booking',
      flexibleLocation: true,
    });
    if (!letterBookingType) {
      throw 'unable to create phone booking';
    }

    return [phoneBookingType, letterBookingType];
  }

  public static async createOnlineLetter(params: {
    email: string | null;
    title: string;
    content: string;
  }): Promise<Letter> {
    const credentials = await createLetterCredentials();
    if (!credentials) {
      throw 'unable to create letter credentials';
    }
    const letter = await sendLetter({ ...params, ...credentials });
    if (!letter) {
      throw 'unable to create new online letter';
    }

    return letter;
  }

  public static async populateOnlineLetters() {
    const letter1 = await this.createOnlineLetter({
      title: 'test title 1',
      content: 'test letter content 1',
      email: null,
    });
    const letter2 = await this.createOnlineLetter({
      title: 'test title 1',
      content: 'test letter content 1',
      email: null,
    });
    const letter3 = await this.createOnlineLetter({
      title: 'test title 1',
      content: 'test letter content 1',
      email: null,
    });

    return [letter1, letter2, letter3];
  }
}

export function mockDiscourseLogout() {
  return jest.spyOn(auth, 'logUserOutOfDiscourse').mockImplementation(async () => true);
}

export function mockEmailSending() {
  return {
    sendBookingConfirmationEmail: jest
      .spyOn(emailController, 'sendBookingConfirmationEmail')
      .mockImplementation(async () => true),
    sendBookingRemindersToVolunteers: jest
      .spyOn(emailController, 'sendBookingRemindersToVolunteers')
      .mockImplementation(async () => [true]),
    sendNewBookingNotificationToStaffs: jest
      .spyOn(emailController, 'sendNewBookingNotificationToStaffs')
      .mockImplementation(async () => true),
    sendReplyNotificationToCustomer: jest
      .spyOn(emailController, 'sendReplyNotificationToCustomer')
      .mockImplementation(async () => ({
        sent: true,
      })),
    sendEmailWithDynamicTemplate: jest
      .spyOn(emailController, 'sendEmailWithDynamicTemplate')
      .mockImplementation(async () => true),
  };
}
