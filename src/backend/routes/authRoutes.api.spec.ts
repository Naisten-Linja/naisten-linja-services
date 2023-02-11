/// <reference types="jest-extended" />
import 'jest';
import request from 'supertest';
import express from 'express';

import { TestApiHelpers, mockDiscourseLogout } from '../test-utils';
import { User } from '../models/users';

describe('authRoutes', () => {
  let app: express.Application;
  let unassignedUser: User;
  let volunteer: User;
  let staff: User;

  beforeAll(async () => {
    app = await TestApiHelpers.getApp();
  });

  afterAll(async () => {
    await TestApiHelpers.cleanup();
  });

  beforeEach(async () => {
    [staff, volunteer, unassignedUser] = await TestApiHelpers.populateTestUsers();
  });

  afterEach(async () => {
    await TestApiHelpers.resetDb();
  });

  describe('POST /api/auth/logout', () => {
    it('should not allow unauthenticated requests', async () => {
      const res = await request(app).post('/api/auth/logout').set({ Accept: 'application/json' });

      expect(res.statusCode).toEqual(401);
    });

    it('should allow unasssigned users, volunteer, staff users to log out', async () => {
      const users = [volunteer, staff, unassignedUser];
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const { token } = await TestApiHelpers.getToken(user);

        const discourseLogout = mockDiscourseLogout();
        discourseLogout.mockImplementation(async () => true);

        let res = await request(app)
          .post('/api/auth/logout')
          .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

        // User should be logged out of Discourse
        expect(discourseLogout).toHaveBeenCalledWith(user.uuid);
        expect(res.statusCode).toEqual(201);

        // After logging out, the token should be invalidated,
        // and the user can't access authenticated routes using the same token
        res = await request(app)
          .get('/api/bookings')
          .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });
        expect(res.statusCode).toEqual(401);
      }
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should not allow unauthenticated requests', async () => {
      const res = await request(app).post('/api/auth/refresh').set({ Accept: 'application/json' });

      expect(res.statusCode).toEqual(401);
    });

    it('should allow volunteers and staff to refresh their tokens', async () => {
      const testUsers = [volunteer, staff];

      for (let i = 0; i < testUsers.length; i++) {
        const user = testUsers[i];
        const { token } = await TestApiHelpers.getToken(user);
        let res = await request(app)
          .post('/api/auth/refresh')
          .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

        expect(res.statusCode).toEqual(201);
        const newToken = res.body?.data?.token;
        expect(newToken).not.toBeNull();

        // The old token should be revoked, and cannot be used for authenticated routes
        res = await request(app)
          .get('/api/bookings')
          .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });
        expect(res.statusCode).toEqual(401);

        // And the new token should be valid
        res = await request(app)
          .get('/api/bookings')
          .set({ Accept: 'application/json', Authorization: `Bearer ${newToken}` });
        expect(res.statusCode).toEqual(200);
      }
    });
  });
});
