/// <reference types="jest-extended" />
import 'jest';
import request from 'supertest';
import express from 'express';

import { TestApiHelpers } from '../test-utils';
import { User, getUserByUuid } from '../models/users';
import { modelUserToApiUserData } from '../controllers/userControllers';

describe('profileRoutes', () => {
  let app: express.Application;
  let volunteer: User;
  let staff: User;

  beforeAll(async () => {
    app = await TestApiHelpers.getApp();
  });

  afterAll(async () => {
    await TestApiHelpers.cleanup();
  });

  beforeEach(async () => {
    await TestApiHelpers.resetDb();
    [staff, volunteer] = await TestApiHelpers.populateTestUsers();
  });

  afterEach(async () => {
    await TestApiHelpers.resetDb();
  });

  describe('PUT /api/profile', () => {
    it('should not allow unauthenticated reuqests', async () => {
      const res = await request(app)
        .put('/api/profile')
        .set('Accept', 'application/json')
        .send({ newBookingNotificationDaysThreshold: 10 });

      expect(res.statusCode).toEqual(401);
    });

    it('should not allow volunteers to modify their settings', async () => {
      const { token } = await TestApiHelpers.getToken(volunteer);
      const res = await request(app)
        .put('/api/profile')
        .set({ Accept: 'application/json', Authorization: `Bearer ${token}` })
        .send({ newBookingNotificationDaysThreshold: 10 });

      expect(res.statusCode).toEqual(403);
    });

    it('should allow staff to modify their own settings', async () => {
      const { token } = await TestApiHelpers.getToken(staff);
      const res = await request(app)
        .put('/api/profile')
        .set({ Accept: 'application/json', Authorization: `Bearer ${token}` })
        .send({ newBookingNotificationDaysThreshold: 77 });

      expect(res.statusCode).toEqual(201);
      const updatedUser = await getUserByUuid(staff.uuid);
      if (updatedUser) {
        // Update the shared staff user so it matches its current state in the database
        staff = updatedUser;
      }
      expect(staff.newBookingNotificationDaysThreshold).toEqual(77);
    });
  });

  describe('GET /api/profile', () => {
    it('should not allow unauthenticated requests', async () => {
      const res = await request(app).get('/api/profile').set({ Accept: 'application/json' });

      expect(res.statusCode).toEqual(401);
    });

    it('should not allow volunteer to see their own settings', async () => {
      const { token } = await TestApiHelpers.getToken(volunteer);
      const res = await request(app)
        .get('/api/profile')
        .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

      expect(res.statusCode).toEqual(403);
    });

    it('should allow volunteer to see their own settings', async () => {
      const { token } = await TestApiHelpers.getToken(staff);
      const res = await request(app)
        .get('/api/profile')
        .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

      expect(res.statusCode).toEqual(200);
      expect(res.body?.data).toEqual(modelUserToApiUserData(staff));
    });
  });

  describe('GET /api/profile/:userUuid', () => {
    it('should not allow unauthenticated requests', async () => {
      const res = await request(app)
        .get(`/api/profile/${volunteer.uuid}`)
        .set({ Accept: 'application/json' });

      expect(res.statusCode).toEqual(401);
    });

    it("should not allow volunteers to see other's profile", async () => {
      const { token } = await TestApiHelpers.getToken(volunteer);
      const res = await request(app)
        .get(`/api/profile/${volunteer.uuid}`)
        .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

      expect(res.statusCode).toEqual(403);
    });

    it("should allow staff to see other's profile", async () => {
      const { token } = await TestApiHelpers.getToken(staff);
      const res = await request(app)
        .get(`/api/profile/${volunteer.uuid}`)
        .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

      expect(res.statusCode).toEqual(200);
      expect(res.body?.data).toEqual(modelUserToApiUserData(volunteer));
    });

    it('should not show anything if the user is not found', async () => {
      const { token } = await TestApiHelpers.getToken(staff);
      const res = await request(app)
        .get(`/api/profile/random-uuid`)
        .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

      expect(res.statusCode).toEqual(404);
    });
  });
});
