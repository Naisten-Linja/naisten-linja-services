/// <reference types="jest-extended" />
import 'jest';
import request from 'supertest';
import express from 'express';

import { TestApiHelpers } from '../test-utils';
import { User } from '../models/users';

describe('authRoutes', () => {
  let app: express.Application;
  let volunteer: User;
  let staff: User;

  beforeAll(async () => {
    app = await TestApiHelpers.getApp();
    [staff, volunteer] = await TestApiHelpers.populateTestUsers();
  });

  afterAll(async () => {
    await TestApiHelpers.cleanup();
  });

  describe('POST /api/auth/logout', () => {
    it('should not allow unauthenticated requests', async () => {
      const res = await request(app).post('/api/auth/logout').set({ Accept: 'application/json' });

      expect(res.statusCode).toEqual(401);
    });

    it('should allow volunteer and staff users to log out', async () => {
      const users = [volunteer, staff];
      for (let i = 0; i < users.length; i++) {
        const { token } = await TestApiHelpers.getToken(users[i]);
        // TODO: there will be a console log error in github ci that looks like
        // "unable to log user out of Discourse:  TypeError: Only absolute URLs are supported"
        // This is because we're setting dummy variables for Discourse in githubci.
        // And will be a bit tricky (or tedious to maintain) to setup the users on both Discourse and sync that with our mock users.
        let res = await request(app)
          .post('/api/auth/logout')
          .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

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
